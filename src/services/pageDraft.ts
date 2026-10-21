import {
  AuditFlag,
  ContentComponent,
  ExtractedPageData,
  FaqItem,
  H2SectionData,
  HeadingItem,
  PageDraft,
  PageDraftSection,
} from '../types';

// -------------------------------------------------------------
// Coercion: turn whatever the maker model returned into a valid PageDraft.
// -------------------------------------------------------------

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : typeof v === 'string' && v.trim() ? [v.trim()] : [];

export function coercePageDraft(raw: any): PageDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const sections: PageDraftSection[] = (Array.isArray(raw.sections) ? raw.sections : [])
    .map((s: any) => {
      const table =
        s?.table && Array.isArray(s.table.headers) && Array.isArray(s.table.rows) && s.table.headers.length > 0
          ? {
              title: str(s.table.title) || undefined,
              headers: strList(s.table.headers),
              rows: (s.table.rows as any[])
                .map((r) =>
                  Array.isArray(r)
                    ? strList(r)
                    : str(r).replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).filter(Boolean)
                )
                .filter((r) => r.length > 0),
            }
          : undefined;
      return {
        h2: str(s?.h2),
        paragraphs: strList(s?.paragraphs),
        bullets: strList(s?.bullets),
        h3s: (Array.isArray(s?.h3s) ? s.h3s : [])
          .map((h: any) => ({ h3: str(h?.h3), paragraphs: strList(h?.paragraphs), bullets: strList(h?.bullets) }))
          .filter((h: any) => h.h3),
        table: table && table.rows.length > 0 ? table : undefined,
      };
    })
    .filter((s: PageDraftSection) => s.h2);

  const faqs: PageDraft['faqs'] = (Array.isArray(raw.faqs) ? raw.faqs : [])
    .map((f: any) => ({ question: str(f?.question), answer: str(f?.answer) }))
    .filter((f: any) => f.question && f.answer);

  // The maker sometimes writes FAQs as an "FAQ" H2 section: one H3 per question, or "Question? Answer." lines.
  // FAQs belong in `faqs` (rendered last, counted for coverage, used for the FAQPage schema), so move them there
  // unchanged. Framing lines without a question ("Below are common questions…") are dropped with the section.
  const addFaq = (question: string, answer: string) => {
    if (question && answer && !faqs.some((f) => f.question.toLowerCase() === question.toLowerCase())) faqs.push({ question, answer });
  };
  const keptSections = sections.filter((s) => {
    if (!/^(frequently asked questions|faqs?)\b/i.test(s.h2)) return true;
    const inline = [...s.paragraphs, ...s.bullets]
      .map((line) => line.match(/^([^?]{8,200}\?)\s+(.+)$/))
      .filter((m): m is RegExpMatchArray => !!m);
    if (s.h3s.length === 0 && inline.length === 0) return true;
    s.h3s.forEach((h) => addFaq(h.h3, [...h.paragraphs, ...h.bullets].join(' ').trim()));
    inline.forEach((m) => addFaq(m[1].trim(), m[2].trim()));
    return false;
  });

  const draft: PageDraft = {
    metaTitle: str(raw.metaTitle),
    metaDescription: str(raw.metaDescription),
    h1: str(raw.h1),
    intro: strList(raw.intro),
    sections: keptSections,
    faqs,
  };

  if (!draft.h1 || draft.sections.length === 0) return null;
  return draft;
}

// -------------------------------------------------------------
// Rendering
// -------------------------------------------------------------

const FAQ_HEADING = 'Frequently asked questions';

export function draftToMarkdown(d: PageDraft): string {
  const out: string[] = [`# ${d.h1}`];
  d.intro.forEach((p) => out.push(p));

  for (const s of d.sections) {
    out.push(`## ${s.h2}`);
    s.paragraphs.forEach((p) => out.push(p));
    if (s.bullets.length) out.push(s.bullets.map((b) => `- ${b}`).join('\n'));
    if (s.table) {
      const t = s.table;
      const lines = [`| ${t.headers.join(' | ')} |`, `| ${t.headers.map(() => '---').join(' | ')} |`];
      t.rows.forEach((r) => lines.push(`| ${r.join(' | ')} |`));
      if (t.title) out.push(`**${t.title}**`);
      out.push(lines.join('\n'));
    }
    for (const h of s.h3s) {
      out.push(`### ${h.h3}`);
      h.paragraphs.forEach((p) => out.push(p));
      if (h.bullets.length) out.push(h.bullets.map((b) => `- ${b}`).join('\n'));
    }
  }

  if (d.faqs.length) {
    out.push(`## ${FAQ_HEADING}`);
    for (const f of d.faqs) {
      out.push(`### ${f.question}`);
      out.push(f.answer);
    }
  }
  return out.join('\n\n');
}

export function draftPlainText(d: PageDraft): string {
  return draftToMarkdown(d)
    .replace(/^#+\s*/gm, '')
    .replace(/^\|.*\|$/gm, (row) => row.replace(/\|/g, ' '))
    .replace(/^- /gm, '');
}

const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/**
 * Words in the page body, without the FAQ section. Coverage is measured this way because FAQs often make up
 * most of a page (60% on Insta EMI Card) and are counted separately, by number of questions.
 */
export function bodyWordCount(markdown: string): number {
  const faqStart = markdown.search(/^#{1,6}\s*(frequently asked|faqs?\b)/im);
  return countWords(faqStart >= 0 ? markdown.slice(0, faqStart) : markdown);
}

export const draftBodyWordCount = (d: PageDraft) => bodyWordCount(draftToMarkdown({ ...d, faqs: [] }));

/**
 * Converts a draft into the unified "page_body_content" component the UI renders,
 * keeping the original snapshot so before/after diffs still work.
 */
export function draftToComponent(d: PageDraft, base?: ContentComponent): ContentComponent {
  const h2Sections: H2SectionData[] = d.sections.map((s, i) => {
    const h3Paragraphs = s.h3s.flatMap((h) => h.paragraphs);
    const h3Bullets = s.h3s.flatMap((h) => h.bullets);
    const baseSec = base?.h2Sections?.[i];
    const sec: H2SectionData = {
      id: baseSec?.id || `h2-sec-${i + 1}`,
      order: i + 1,
      h2Text: s.h2,
      originalH2Text: baseSec?.originalH2Text || baseSec?.h2Text,
      h3Headings: s.h3s.map((h) => ({ tag: 'h3' as const, text: h.h3 })),
      bodyParagraphs: [...s.paragraphs, ...h3Paragraphs],
      listItems: [...s.bullets, ...h3Bullets],
      tables: s.table ? [{ id: `tbl-${i + 1}`, title: s.table.title, headers: s.table.headers, rows: s.table.rows }] : [],
      faqs: [],
      voiceAnswerSnippet: s.paragraphs[0] || '',
      wordCount: countWords([...s.paragraphs, ...s.bullets, ...h3Paragraphs, ...h3Bullets].join(' ')),
      status: 'recently_fixed',
      originalSnapshot: baseSec?.originalSnapshot || (baseSec
        ? {
            h2Text: baseSec.h2Text,
            wordCount: baseSec.wordCount,
            h3Headings: baseSec.h3Headings,
            bodyParagraphs: baseSec.bodyParagraphs,
            listItems: baseSec.listItems,
            tables: baseSec.tables,
            faqs: baseSec.faqs,
            voiceAnswerSnippet: baseSec.voiceAnswerSnippet,
            citationSource: baseSec.citationSource,
          }
        : undefined),
    };
    return sec;
  });

  // Keep the heading list in document order: h1, then each h2 followed by its h3s.
  const orderedHeadings: HeadingItem[] = [{ tag: 'h1', text: d.h1 }];
  d.sections.forEach((s) => {
    orderedHeadings.push({ tag: 'h2', text: s.h2 });
    s.h3s.forEach((h) => orderedHeadings.push({ tag: 'h3', text: h.h3 }));
  });
  if (d.faqs.length) {
    orderedHeadings.push({ tag: 'h2', text: FAQ_HEADING });
    d.faqs.forEach((f) => orderedHeadings.push({ tag: 'h3', text: f.question }));
  }

  const faqs: FaqItem[] = d.faqs.map((f, i) => ({ id: `faq-${i + 1}`, question: f.question, answer: f.answer }));

  return {
    id: base?.id || 'page_body_content',
    name: d.h1,
    type: base?.type || 'full_body_content',
    headings: orderedHeadings,
    heroDescription: d.intro.join('\n\n'),
    bodyContent: draftToMarkdown(d),
    h2Sections,
    faqs,
    listItems: d.sections.flatMap((s) => s.bullets),
    tables: h2Sections.flatMap((s) => s.tables),
    voiceAnswerSnippet: d.intro[0] || '',
    citationSource: base?.citationSource,
    status: 'recently_fixed',
    originalSnapshot:
      base?.originalSnapshot ||
      (base
        ? {
            headings: base.headings,
            bodyContent: base.bodyContent,
            heroDescription: base.heroDescription,
            faqs: base.faqs,
            listItems: base.listItems,
            tables: base.tables,
            h2Sections: base.h2Sections,
            voiceAnswerSnippet: base.voiceAnswerSnippet,
            citationSource: base.citationSource,
          }
        : undefined),
  };
}

/** Flattens UI components back into markdown, used as the maker's source material. */
export function componentsToMarkdown(components: ContentComponent[]): string {
  return components
    .map((c) => {
      if (c.bodyContent && /^#{1,3}\s/m.test(c.bodyContent)) return c.bodyContent;
      const parts: string[] = [];
      const h1 = c.headings?.find((h) => h.tag === 'h1')?.text;
      if (h1) parts.push(`# ${h1}`);
      if (c.heroDescription) parts.push(c.heroDescription);
      (c.h2Sections || []).forEach((s) => {
        parts.push(`## ${s.h2Text}`);
        s.bodyParagraphs.forEach((p) => parts.push(p));
        if (s.listItems.length) parts.push(s.listItems.map((l) => `- ${l}`).join('\n'));
      });
      if (!c.h2Sections?.length && c.bodyContent) parts.push(c.bodyContent);
      if (c.faqs?.length) {
        parts.push(`## ${FAQ_HEADING}`);
        c.faqs.forEach((f) => parts.push(`### ${f.question}\n\n${f.answer}`));
      }
      return parts.join('\n\n');
    })
    .filter(Boolean)
    .join('\n\n');
}

export function draftToExtracted(d: PageDraft, base: ExtractedPageData, schema: string): ExtractedPageData {
  return {
    ...base,
    metaTitle: d.metaTitle,
    metaDescription: d.metaDescription,
    schema,
    content: draftToMarkdown(d),
  };
}

// -------------------------------------------------------------
// Heading structure: one H1 first, no skipped levels, FAQ last.
// -------------------------------------------------------------

export function checkHeadingStructure(markdown: string): AuditFlag[] {
  const headings = (markdown || '')
    .split('\n')
    .map((line) => line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ level: m[1].length, text: m[2].trim() }));

  const flags: AuditFlag[] = [];
  const base = {
    agentOrigin: 'Agent 4: Keyword & Intent Mapping' as const,
    guidelineSection: 'Structure and Keyword Mapping Guidelines' as const,
    target: 'component' as const,
    componentId: 'page_body_content',
    fieldName: 'heading',
    category: 'STRUCTURE_MAPPING' as const,
    subCategory: 'Structure' as const,
    fixed: false,
  };
  if (headings.length === 0) return flags;

  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0) {
    flags.push({
      ...base,
      id: 'agent4-structure-no-h1',
      severity: 'critical',
      issueTitle: 'Page has no H1 heading',
      issueDescription: 'Every page needs exactly one H1 that states the main topic.',
      guidelineReference: 'Structure: single H1 at the top of the page',
      proposedFixPreview: 'Add one H1 at the top that names the page topic and primary keyword.',
    });
  } else if (h1s.length > 1) {
    flags.push({
      ...base,
      id: 'agent4-structure-multi-h1',
      severity: 'warning',
      issueTitle: `Page has ${h1s.length} H1 headings`,
      issueDescription: `Only one H1 is allowed. Found: ${h1s.map((h) => `"${h.text}"`).join(', ')}.`,
      guidelineReference: 'Structure: single H1 at the top of the page',
      proposedFixPreview: 'Keep one H1 and demote the others to H2.',
    });
  }
  if (h1s.length > 0 && headings[0].level !== 1) {
    flags.push({
      ...base,
      id: 'agent4-structure-h1-not-first',
      severity: 'warning',
      issueTitle: 'H1 is not the first heading',
      issueDescription: `The page opens with "${headings[0].text}" (H${headings[0].level}) before the H1.`,
      guidelineReference: 'Structure: H1 → H2 → H3 order',
      proposedFixPreview: 'Move the H1 to the top of the content.',
    });
  }

  const skips: string[] = [];
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level > headings[i - 1].level + 1) {
      skips.push(`"${headings[i].text}" (H${headings[i].level} after H${headings[i - 1].level})`);
    }
  }
  if (skips.length) {
    flags.push({
      ...base,
      id: 'agent4-structure-level-skip',
      severity: 'warning',
      issueTitle: `Heading levels skipped (${skips.length})`,
      issueDescription: `Headings must nest one level at a time (H1 → H2 → H3). Skipped: ${skips.slice(0, 4).join('; ')}.`,
      guidelineReference: 'Structure: H1 → H2 → H3 order',
      proposedFixPreview: 'Place every H3 under an H2, and every H2 under the H1.',
    });
  }

  const faqIdx = headings.findIndex((h) => h.level <= 2 && /\bfaqs?\b|frequently asked/i.test(h.text));
  if (faqIdx >= 0) {
    const faqLevel = headings[faqIdx].level;
    const after = headings.slice(faqIdx + 1).filter((h) => h.level <= faqLevel);
    if (after.length > 0) {
      flags.push({
        ...base,
        id: 'agent4-structure-faq-not-last',
        severity: 'warning',
        issueTitle: 'FAQ section is not at the end of the page',
        issueDescription: `Sections appear after the FAQ: ${after.slice(0, 3).map((h) => `"${h.text}"`).join(', ')}.`,
        guidelineReference: 'Structure: FAQs close the page',
        proposedFixPreview: 'Move the FAQ section below all other H2 sections.',
      });
    }
  }
  return flags;
}

// -------------------------------------------------------------
// Fabrication guard: every figure in the draft must exist in the source
// or in the approved guideline facts.
// -------------------------------------------------------------

const FIGURE_RE =
  /(?:₹|rs\.?\s?|inr\s?|\$|€|£)?\s?\d[\d,]*(?:\.\d+)?\s?(?:%|percent|lakhs?|crores?|k\b|mn\b|bn\b|million|billion|x\b|years?|months?|days?|hours?|minutes?|mins?)?/gi;

function normalizeFigure(raw: string): { digits: string; hasUnit: boolean } {
  const num = raw.match(/\d[\d,]*(?:\.\d+)?/)?.[0] || '';
  const digits = num.replace(/,/g, '').replace(/\.0+$/, '').replace(/^0+(?=\d)/, '');
  const hasUnit = /[₹$€£%]|rs|inr|percent|lakh|crore|k\b|mn\b|bn\b|million|billion|x\b|year|month|day|hour|min/i.test(raw);
  return { digits, hasUnit };
}

export function extractFigures(text: string): string[] {
  const found = new Set<string>();
  for (const m of (text || '').matchAll(FIGURE_RE)) {
    const raw = m[0].trim();
    const { digits, hasUnit } = normalizeFigure(raw);
    if (!digits) continue;
    const n = Number(digits);
    // Small bare counts ("3 steps", "Step 2") and list ordinals are not factual claims.
    if (!hasUnit && Number.isFinite(n) && n <= 12) continue;
    found.add(raw.replace(/\s+/g, ' '));
  }
  return [...found];
}

/**
 * Web addresses and email addresses in the draft that don't occur in the source or approved facts. An invented
 * link or email misleads readers as much as an invented number (the figure guard already covers phone numbers).
 */
export function findUnsupportedLinks(draftText: string, allowedText: string): string[] {
  const norm = (v: string) => v.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[.,;:!?)\]}'"]+$/, '').replace(/\/$/, '');
  const allowed = allowedText.toLowerCase().replace(/https?:\/\//g, '').replace(/\bwww\./g, '');
  const found = draftText.match(/\bhttps?:\/\/[^\s)\]}"'<>]+|\bwww\.[^\s)\]}"'<>]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi) || [];
  return Array.from(new Set(found.map((f) => f.replace(/[.,;:!?)\]}'"]+$/, '')))).filter((f) => !allowed.includes(norm(f)));
}

export function findUnsupportedFigures(draftText: string, allowedText: string): string[] {
  const allowedDigits = new Set(
    [...(allowedText || '').matchAll(FIGURE_RE)].map((m) => normalizeFigure(m[0]).digits).filter(Boolean)
  );
  return extractFigures(draftText).filter((f) => !allowedDigits.has(normalizeFigure(f).digits));
}

// -------------------------------------------------------------
// Schema: rebuild JSON-LD for the draft from facts we actually have.
// -------------------------------------------------------------

export function parseSchemaBlocks(schema: string): any[] {
  if (!schema || !schema.trim()) return [];
  const blocks: any[] = [];
  const tryParse = (s: string) => {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else if (parsed && Array.isArray(parsed['@graph'])) blocks.push(...parsed['@graph']);
      else if (parsed) blocks.push(parsed);
      return true;
    } catch {
      return false;
    }
  };
  if (!tryParse(schema)) {
    // Multiple JSON-LD blocks are concatenated with blank lines by Agent 1.
    schema.split(/\n\s*\n(?=\s*[\[{])/).forEach((part) => tryParse(part.trim()));
  }
  return blocks.filter((b) => b && typeof b === 'object');
}

const typeOf = (node: any): string =>
  (Array.isArray(node?.['@type']) ? node['@type'][0] : node?.['@type'] || '').toString().toLowerCase();

const SCHEMA_RANK = (t: string) =>
  ['webpage', 'itempage', 'aboutpage', 'collectionpage'].includes(t) ? 1
  : ['breadcrumblist'].includes(t) ? 2
  : ['financialproduct', 'softwareapplication', 'product', 'service', 'article', 'webapplication'].includes(t) ? 3
  : ['organization', 'corporation', 'localbusiness'].includes(t) ? 4
  : t === 'faqpage' ? 5
  : 6;

export function buildDraftSchema(params: {
  draft: PageDraft;
  originalSchema: string;
  url?: string;
  brandName?: string;
}): string {
  const { draft, originalSchema, url, brandName } = params;
  const nodes = parseSchemaBlocks(originalSchema).map((n) => {
    const { ['@context']: _ctx, ...rest } = n;
    return rest;
  });
  const has = (types: string[]) => nodes.some((n) => types.includes(typeOf(n)));
  let origin = '';
  let pathParts: string[] = [];
  try {
    if (url) {
      const u = new URL(url);
      origin = u.origin;
      pathParts = u.pathname.split('/').filter(Boolean);
    }
  } catch {
    /* url is optional */
  }

  // WebPage always reflects the new title and description.
  const webPage = nodes.find((n) => SCHEMA_RANK(typeOf(n)) === 1);
  if (webPage) {
    webPage.name = draft.metaTitle || webPage.name;
    webPage.description = draft.metaDescription || webPage.description;
  } else {
    nodes.push({
      '@type': 'WebPage',
      name: draft.metaTitle || draft.h1,
      description: draft.metaDescription,
      ...(url ? { url } : {}),
    });
  }

  if (!has(['breadcrumblist']) && origin) {
    const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin }];
    pathParts.forEach((p, i) =>
      items.push({
        '@type': 'ListItem',
        position: i + 2,
        name: i === pathParts.length - 1 ? draft.h1 : decodeURIComponent(p).replace(/[-_]/g, ' '),
        item: `${origin}/${pathParts.slice(0, i + 1).join('/')}`,
      })
    );
    nodes.push({ '@type': 'BreadcrumbList', itemListElement: items });
  }

  if (!nodes.some((n) => SCHEMA_RANK(typeOf(n)) === 3)) {
    nodes.push({
      '@type': 'Article',
      headline: draft.h1,
      description: draft.metaDescription,
      ...(url ? { mainEntityOfPage: url } : {}),
      ...(brandName ? { publisher: { '@type': 'Organization', name: brandName } } : {}),
    });
  }

  if (!has(['organization', 'corporation', 'localbusiness']) && brandName) {
    nodes.push({ '@type': 'Organization', name: brandName, ...(origin ? { url: origin } : {}) });
  }

  // FAQPage always mirrors the draft's FAQs.
  const withoutFaq = nodes.filter((n) => typeOf(n) !== 'faqpage');
  if (draft.faqs.length) {
    withoutFaq.push({
      '@type': 'FAQPage',
      mainEntity: draft.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  withoutFaq.sort((a, b) => SCHEMA_RANK(typeOf(a)) - SCHEMA_RANK(typeOf(b)));
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': withoutFaq }, null, 2);
}

// -------------------------------------------------------------
// Parsing existing content back into a draft (used by revisions).
// -------------------------------------------------------------

const stripInline = (s: string) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const isFaqHeading = (t: string) => /\bfaqs?\b|frequently asked/i.test(t);
const isTableSeparator = (l: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(l);

/** Parses page markdown (# / ## / ### headings, paragraphs, bullets, tables) into a PageDraft. */
export function markdownToDraft(
  md: string,
  meta: { metaTitle?: string; metaDescription?: string; fallbackH1?: string }
): PageDraft | null {
  const draft: PageDraft = {
    metaTitle: meta.metaTitle || '',
    metaDescription: meta.metaDescription || '',
    h1: '',
    intro: [],
    sections: [],
    faqs: [],
  };
  let section: PageDraftSection | null = null;
  let sub: { h3: string; paragraphs: string[]; bullets: string[] } | null = null;
  let inFaq = false;
  let faqQ: { question: string; answer: string[] } | null = null;
  const flushFaq = () => {
    if (faqQ && faqQ.answer.length) draft.faqs.push({ question: faqQ.question, answer: faqQ.answer.join(' ') });
    faqQ = null;
  };
  const paragraphsTarget = () => sub?.paragraphs || section?.paragraphs || draft.intro;
  const bulletsTarget = () => sub?.bullets || section?.bullets || draft.intro;

  // Headings may share a block with text; put every heading on its own block first.
  const normalized = (md || '').replace(/\r/g, '').replace(/^(#{1,6}\s.+)$/gm, '\n$1\n');
  const blocks = normalized.split(/\n\s*\n/);

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    const heading = block.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = stripInline(heading[2].replace(/#+\s*$/, ''));
      if (!text) continue;
      if (level === 1 && !draft.h1) {
        draft.h1 = text;
      } else if (level <= 2) {
        flushFaq();
        sub = null;
        if (isFaqHeading(text)) {
          inFaq = true;
          section = null;
        } else {
          inFaq = false;
          section = { h2: text, paragraphs: [], bullets: [], h3s: [] };
          draft.sections.push(section);
        }
      } else if (inFaq) {
        flushFaq();
        faqQ = { question: text, answer: [] };
      } else if (level === 3 && section) {
        sub = { h3: text, paragraphs: [], bullets: [] };
        section.h3s.push(sub);
      } else {
        paragraphsTarget().push(text);
      }
      continue;
    }

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.every((l) => l.startsWith('|'))) {
      const rows = lines
        .filter((l) => !isTableSeparator(l))
        .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => stripInline(c)));
      if (rows.length >= 2 && section && !section.table) {
        section.table = { headers: rows[0], rows: rows.slice(1) };
      } else if (rows.length) {
        paragraphsTarget().push(rows.map((r) => r.join(' — ')).join('; '));
      }
      continue;
    }
    if (lines.every((l) => /^([-*•]|\d+[.)])\s+/.test(l))) {
      const items = lines.map((l) => stripInline(l.replace(/^([-*•]|\d+[.)])\s+/, ''))).filter(Boolean);
      if (inFaq) {
        if (faqQ) faqQ.answer.push(items.join('; '));
      } else {
        bulletsTarget().push(...items);
      }
      continue;
    }
    const text = stripInline(lines.join(' '));
    if (!text) continue;
    if (inFaq) {
      if (faqQ) faqQ.answer.push(text);
      continue;
    }
    paragraphsTarget().push(text);
  }
  flushFaq();

  if (!draft.h1) draft.h1 = meta.fallbackH1 || draft.sections[0]?.h2 || '';
  if (draft.sections.length === 0 && draft.intro.length > 1) {
    draft.sections.push({ h2: 'Overview', paragraphs: draft.intro.splice(1), bullets: [], h3s: [] });
  }
  return draft.h1 && draft.sections.length ? draft : null;
}

/** Builds a draft from the UI component currently on screen. */
export function componentToDraft(
  c: ContentComponent | undefined,
  backend: { metaTitle?: string; metaDescription?: string }
): PageDraft | null {
  if (!c) return null;
  const h1 = c.headings?.find((h) => h.tag === 'h1')?.text || c.name;
  const meta = { metaTitle: backend.metaTitle, metaDescription: backend.metaDescription, fallbackH1: h1 };
  const fromMd = c.bodyContent && /^#{1,3}\s/m.test(c.bodyContent) ? markdownToDraft(c.bodyContent, meta) : null;
  if (fromMd) {
    if (!fromMd.faqs.length && c.faqs?.length) fromMd.faqs = c.faqs.map((f) => ({ question: f.question, answer: f.answer }));
    return fromMd;
  }
  const sections: PageDraftSection[] = (c.h2Sections || []).map((s) => ({
    h2: s.h2Text,
    paragraphs: s.bodyParagraphs || [],
    bullets: s.listItems || [],
    h3s: (s.h3Headings || []).map((h) => ({ h3: h.text, paragraphs: [], bullets: [] })),
    table: s.tables?.[0] ? { title: s.tables[0].title, headers: s.tables[0].headers, rows: s.tables[0].rows } : undefined,
  }));
  if (!sections.length && c.bodyContent) {
    sections.push({ h2: 'Overview', paragraphs: c.bodyContent.split(/\n\s*\n/).map(stripInline).filter(Boolean), bullets: [], h3s: [] });
  }
  if (!h1 || !sections.length) return null;
  return {
    metaTitle: backend.metaTitle || '',
    metaDescription: backend.metaDescription || '',
    h1,
    intro: c.heroDescription ? c.heroDescription.split(/\n\s*\n/).map(stripInline).filter(Boolean) : [],
    sections,
    faqs: (c.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
  };
}

// -------------------------------------------------------------
// Revision scopes: what a "fix" is allowed to change.
// -------------------------------------------------------------

export type RevisionScope =
  | { kind: 'all' }
  | { kind: 'meta' }
  | { kind: 'body' }
  | { kind: 'intro' }
  | { kind: 'section'; h2: string };

const normHeading = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function findSectionIndex(d: PageDraft, h2: string): number {
  const target = normHeading(h2);
  if (!target) return -1;
  const exact = d.sections.findIndex((s) => normHeading(s.h2) === target);
  if (exact >= 0) return exact;
  return d.sections.findIndex((s) => {
    const n = normHeading(s.h2);
    return n.length > 3 && (n.includes(target) || target.includes(n));
  });
}

/** Takes only the in-scope parts of `next`; everything else stays exactly as in `prev`. */
export function mergeDraftByScope(prev: PageDraft, next: PageDraft, scope: RevisionScope): PageDraft {
  switch (scope.kind) {
    case 'all':
      return next;
    case 'meta':
      return { ...prev, metaTitle: next.metaTitle, metaDescription: next.metaDescription };
    case 'body':
      return { ...next, metaTitle: prev.metaTitle, metaDescription: prev.metaDescription };
    case 'intro':
      return { ...prev, h1: next.h1, intro: next.intro };
    case 'section': {
      const i = findSectionIndex(prev, scope.h2);
      if (i < 0) return prev;
      const j = findSectionIndex(next, prev.sections[i].h2);
      const replacement = next.sections[j >= 0 ? j : i];
      if (!replacement) return prev;
      const sections = prev.sections.slice();
      sections[i] = replacement;
      return { ...prev, sections };
    }
  }
}

export function scopeInstruction(scope: RevisionScope): string {
  switch (scope.kind) {
    case 'all':
      return '';
    case 'meta':
      return 'SCOPE: change ONLY metaTitle and metaDescription. Return every other field exactly as in your previous draft.';
    case 'body':
      return 'SCOPE: change the page body (h1, intro, sections, faqs). Return metaTitle and metaDescription unchanged.';
    case 'intro':
      return 'SCOPE: change ONLY h1 and intro. Return every other field exactly as in your previous draft.';
    case 'section':
      return `SCOPE: change ONLY the H2 section titled "${scope.h2}" (its heading, paragraphs, bullets, h3s and table). Return every other field and section exactly as in your previous draft.`;
  }
}

/** Keeps only the notes the maker can act on within the scope. */
export function notesInScope<T extends { field?: string; target?: string; issue: string }>(notes: T[], scope: RevisionScope): T[] {
  const isMeta = (n: T) => n.target === 'backend_seo' && /meta(title|description)/i.test(n.field || '');
  switch (scope.kind) {
    case 'all':
      return notes;
    case 'meta':
      return notes.filter(isMeta);
    default:
      return notes.filter((n) => n.target !== 'backend_seo');
  }
}

// -------------------------------------------------------------
// Change log for the "Changes & rationale" views.
// -------------------------------------------------------------

export interface DraftChange {
  id: string;
  sectionTitle: string;
  sectionType: 'hero' | 'h2_section' | 'faq' | 'backend_seo';
  fieldChanged: string;
  before: string;
  after: string;
}

export function diffDrafts(before: PageDraft | null, after: PageDraft): DraftChange[] {
  const changes: DraftChange[] = [];
  const push = (c: Omit<DraftChange, 'id'>) => {
    if (c.before.trim() !== c.after.trim()) changes.push({ ...c, id: `chg-${changes.length + 1}` });
  };
  const b: PageDraft = before || { metaTitle: '', metaDescription: '', h1: '', intro: [], sections: [], faqs: [] };
  push({ sectionTitle: 'Meta title', sectionType: 'backend_seo', fieldChanged: 'metaTitle', before: b.metaTitle, after: after.metaTitle });
  push({ sectionTitle: 'Meta description', sectionType: 'backend_seo', fieldChanged: 'metaDescription', before: b.metaDescription, after: after.metaDescription });
  push({
    sectionTitle: 'H1 and introduction',
    sectionType: 'hero',
    fieldChanged: 'h1 + intro',
    before: [b.h1, ...b.intro].join('\n\n'),
    after: [after.h1, ...after.intro].join('\n\n'),
  });
  const sectionText = (s?: PageDraftSection) =>
    s ? [s.h2, ...s.paragraphs, ...s.bullets.map((x) => `- ${x}`), ...s.h3s.flatMap((h) => [h.h3, ...h.paragraphs])].join('\n') : '';
  const matched = new Set<number>();
  after.sections.forEach((s) => {
    const i = findSectionIndex(b, s.h2);
    if (i >= 0) matched.add(i);
    push({ sectionTitle: s.h2, sectionType: 'h2_section', fieldChanged: i >= 0 ? 'section' : 'new section', before: sectionText(b.sections[i]), after: sectionText(s) });
  });
  b.sections.forEach((s, i) => {
    if (!matched.has(i)) push({ sectionTitle: s.h2, sectionType: 'h2_section', fieldChanged: 'removed or merged', before: sectionText(s), after: '' });
  });
  const faqText = (d: PageDraft) => d.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  push({ sectionTitle: 'FAQs', sectionType: 'faq', fieldChanged: 'faqs', before: faqText(b), after: faqText(after) });
  return changes;
}
