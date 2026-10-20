/**
 * Deterministic target-keyword picker.
 *
 * Every keyword it returns is a phrase that actually occurs on the page (title, H1,
 * headings, description, URL slug or body). Questions come only from real question
 * headings / FAQs on the page — nothing is templated, and no search volume is invented
 * (volumes are 0 until Google Ads verifies them).
 */

export interface PickedKeyword {
  id: string;
  keyword: string;
  searchVolume: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  priority: 'primary' | 'secondary' | 'voice_question' | 'lsi';
  source: 'algorithmic';
  notes: string;
}

export interface KeywordPickerInput {
  title?: string;
  description?: string;
  headings?: string[];
  h1?: string;
  bodyText?: string;
  url?: string;
  faqQuestions?: string[];
  /** Brand names that are not keywords on their own (e.g. "Bajaj Finserv"). */
  brandNames?: string[];
  max?: number;
}

const STOP = new Set(
  (
    'a an the and or but if then else of to in on at by for with from into onto over under about as is are was were be been being ' +
    'it its this that these those there here which who whom whose what when where why how can could should would will shall may might must ' +
    'do does did done not no nor so than too very just also only more most less least much many any some each every all both either neither ' +
    'you your yours we our ours they their them he she his her i me my us up down out off again once own same other such per via vs ' +
    'get got make made use used using one two three first new now well even still'
  ).split(/\s+/)
);

// Navigation / boilerplate words that never make a good keyword on their own.
const NOISE = new Set(
  (
    'home page official site website welcome login log sign signup register click read learn more terms privacy policy cookie cookies ' +
    'menu share follow copyright rights reserved contact us skip content navigation edit references external links see also ' +
    'wikipedia retrieved archived citation needed overview introduction'
  ).split(/\s+/)
);

const QUESTION_START = /^(what|how|why|when|where|which|who|can|is|are|does|do|should|will)\b/i;

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9₹%&' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const words = (s: string) => norm(s).split(' ').filter(Boolean);

function phrasesOf(text: string, minN = 1, maxN = 4): string[] {
  const out: string[] = [];
  // Split on sentence-ish boundaries so phrases do not cross them.
  for (const chunk of (text || '').split(/[.!?;:,()\[\]|\n\r–—•"]+/)) {
    const w = words(chunk);
    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i + n <= w.length; i++) {
        const gram = w.slice(i, i + n);
        if (STOP.has(gram[0]) || STOP.has(gram[gram.length - 1])) continue;
        if (gram.some((t) => t.length < 2 && !/\d/.test(t))) continue;
        if (gram.every((t) => NOISE.has(t) || /^\d+$/.test(t))) continue;
        out.push(gram.join(' '));
      }
    }
  }
  return out;
}

function countOccurrences(haystack: string, phrase: string): number {
  if (!phrase) return 0;
  const re = new RegExp(`(^|[^a-z0-9])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^a-z0-9])`, 'g');
  return (haystack.match(re) || []).length;
}

function slugText(url?: string): string {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.pathname.split('/').filter(Boolean).map((p) => decodeURIComponent(p).replace(/[-_]+/g, ' ')).join(' ');
  } catch {
    return '';
  }
}

function cleanQuestion(q: string): string {
  return q
    .replace(/^\s*(q[:.]|\d+[.)])\s*/i, '')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function intentOf(phrase: string): PickedKeyword['intent'] {
  if (/\b(apply|buy|book|open|download|calculator|login|pay|emi|instant|online|now)\b/.test(phrase)) return 'transactional';
  if (/\b(best|compare|vs|rates?|price|cost|fees?|charges|interest|eligibility|offers?|review)\b/.test(phrase)) return 'commercial';
  return 'informational';
}

export function pickKeywords(input: KeywordPickerInput): PickedKeyword[] {
  const max = input.max ?? 8;
  const brandTokens = new Set((input.brandNames || []).flatMap((b) => words(b)));
  const isBrandOnly = (p: string) => p.split(' ').every((t) => brandTokens.has(t));

  const titleParts = (input.title || '').split(/\s[|\-–—:]\s|\s[|–—]|[|–—]\s/).map((s) => s.trim()).filter(Boolean);
  const title = norm(titleParts.join(' '));
  const h1 = norm(input.h1 || '');
  const headings = (input.headings || []).map(norm).filter(Boolean);
  const desc = norm(input.description || '');
  const slug = norm(slugText(input.url));
  const body = norm(input.bodyText || '');
  const all = ` ${[title, h1, headings.join(' . '), desc, body].join(' . ')} `;

  // Candidate phrases from the strongest signals, plus frequent body n-grams.
  const candidates = new Set<string>();
  [input.title || '', input.h1 || '', ...(input.headings || []), input.description || '', slugText(input.url)].forEach((t) =>
    phrasesOf(t, 1, 4).forEach((p) => candidates.add(p))
  );
  const bodyFreq = new Map<string, number>();
  phrasesOf(input.bodyText || '', 2, 4).forEach((p) => bodyFreq.set(p, (bodyFreq.get(p) || 0) + 1));
  [...bodyFreq.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300)
    .forEach(([p]) => candidates.add(p));

  type Scored = { phrase: string; score: number; inTitle: boolean; inH1: boolean; inSlug: boolean; freq: number };
  const scored: Scored[] = [];
  for (const phrase of candidates) {
    if (phrase.length < 3 || isBrandOnly(phrase)) continue;
    const n = phrase.split(' ').length;
    const freq = countOccurrences(all, phrase);
    if (freq === 0) continue;
    const inTitle = countOccurrences(` ${title} `, phrase) > 0;
    const inH1 = countOccurrences(` ${h1} `, phrase) > 0;
    const inSlug = countOccurrences(` ${slug} `, phrase) > 0;
    const inDesc = countOccurrences(` ${desc} `, phrase) > 0;
    const headingHits = headings.filter((h) => countOccurrences(` ${h} `, phrase) > 0).length;

    let score = Math.log2(1 + freq) * 2;
    if (inTitle) score += 6;
    if (inH1) score += 6;
    if (phrase === h1) score += 4; // the exact H1 is the clearest statement of topic
    if (inSlug) score += 4;
    if (inDesc) score += 2;
    score += Math.min(headingHits, 4) * 1.5;
    // Two-to-three word phrases are what people search; single words are too broad.
    score *= n === 1 ? 0.35 : n === 2 ? 1.15 : n === 3 ? 1.1 : 0.9;
    if (phrase.split(' ').some((t) => NOISE.has(t))) score *= 0.6;
    scored.push({ phrase, score, inTitle, inH1, inSlug, freq });
  }
  scored.sort((a, b) => b.score - a.score);

  // Clean the candidate list:
  //  - numbers ("55 lakh", "48 hours") are facts, not search topics;
  //  - phrases containing the brand are fragments ("bajaj finance personal");
  //  - a phrase that only appears inside a longer phrase is a fragment ("instant personal" in "instant personal loan").
  const clean = scored.filter(
    (c) => !/\d/.test(c.phrase) && !c.phrase.split(' ').some((t) => brandTokens.has(t))
  );
  const candidatesClean = clean.filter((c) => {
    // Phrases anchored in the title, H1 or URL are the topic itself, never a fragment.
    if (c.inTitle || c.inH1 || c.inSlug) return true;
    // Sum every longer phrase that contains this one ("... interest rate" + "... interest rates").
    const extensions = clean.filter((o) => o !== c && o.phrase.length > c.phrase.length && ` ${o.phrase} `.includes(` ${c.phrase} `));
    const extensionFreq = extensions.reduce((n, o) => n + o.freq, 0);
    return !(extensions.length && extensionFreq >= c.freq * 0.7);
  });

  // Singular and plural count as the same keyword ("interest rate" / "interest rates").
  const tokenKey = (p: string) =>
    words(p)
      .filter((t) => !STOP.has(t))
      .map((t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t))
      .sort()
      .join(' ');
  const picked: PickedKeyword[] = [];
  const usedKeys = new Set<string>();
  const ts = Date.now();
  const add = (keyword: string, priority: PickedKeyword['priority'], notes: string, intent?: PickedKeyword['intent']) => {
    const key = tokenKey(keyword);
    if (!key || usedKeys.has(key)) return false;
    // Skip near-duplicates: one topic phrase nested inside another ("personal loan interest" / "... interest rate").
    if (priority === 'secondary' || priority === 'lsi') {
      const k = ` ${norm(keyword)} `;
      const overlaps = picked.some((p) => {
        if (p.priority === 'primary' || p.priority === 'voice_question') return false;
        const q = ` ${norm(p.keyword)} `;
        return q.includes(k) || k.includes(q);
      });
      if (overlaps) return false;
    }
    usedKeys.add(key);
    picked.push({
      id: `kw-${ts}-${picked.length + 1}`,
      keyword,
      searchVolume: 0,
      intent: intent || intentOf(keyword),
      priority,
      source: 'algorithmic',
      notes,
    });
    return true;
  };

  // Primary: best multi-word phrase anchored in the title, H1 or URL.
  const primary =
    candidatesClean.find((s) => s.phrase.includes(' ') && (s.inTitle || s.inH1 || s.inSlug)) ||
    candidatesClean.find((s) => s.inTitle || s.inH1) ||
    candidatesClean[0];
  // Secondary topics built on the primary topic ("personal loan interest rate") rank higher.
  const primaryTokens = new Set(primary ? primary.phrase.split(' ') : []);
  const ranked = candidatesClean
    .map((c) => ({ ...c, rank: c.score + (c.phrase.split(' ').filter((t) => primaryTokens.has(t)).length >= Math.min(2, primaryTokens.size) && c.phrase !== primary?.phrase ? 4 : 0) }))
    .sort((a, b) => b.rank - a.rank);
  if (primary) add(primary.phrase, 'primary', `Found in ${[primary.inTitle && 'title', primary.inH1 && 'H1', primary.inSlug && 'URL'].filter(Boolean).join(', ') || 'page'}; ${primary.freq}× on page.`);

  // Questions: only real questions from the page.
  const questions = [...(input.faqQuestions || []), ...(input.headings || [])]
    .map(cleanQuestion)
    .filter((q) => q.length >= 12 && q.length <= 110 && (q.endsWith('?') || QUESTION_START.test(q)));
  const seenQ = new Set<string>();
  const uniqueQuestions = questions.filter((q) => {
    const k = norm(q);
    if (seenQ.has(k)) return false;
    seenQ.add(k);
    return true;
  });

  // Secondary: strong multi-word phrases that are not near-duplicates of what we have.
  const secondaryTarget = Math.max(2, Math.min(4, max - 1 - Math.min(2, uniqueQuestions.length) - 1));
  for (const s of ranked) {
    if (picked.filter((p) => p.priority === 'secondary').length >= secondaryTarget) break;
    if (!s.phrase.includes(' ')) continue;
    if (primary && (s.phrase === primary.phrase)) continue;
    add(s.phrase, 'secondary', `${s.freq}× on page${s.inTitle ? ', in title' : ''}${s.inH1 ? ', in H1' : ''}.`);
  }

  uniqueQuestions.slice(0, 2).forEach((q) => add(q, 'voice_question', 'Question asked on the page (heading or FAQ).', 'informational'));

  // Branded variant of the primary topic, when the page uses it (navigational searches).
  if (primary) {
    for (const brand of input.brandNames || []) {
      const branded = `${norm(brand)} ${primary.phrase}`;
      if (branded.split(' ').length <= 5 && countOccurrences(all, branded) > 0) {
        add(branded, 'lsi', 'Branded search for the main topic, used on the page.', 'navigational');
        break;
      }
    }
  }

  // LSI: supporting phrases to fill the remaining slots.
  for (const s of ranked) {
    if (picked.length >= max) break;
    if (!s.phrase.includes(' ') || s.freq < 2) continue;
    add(s.phrase, 'lsi', `Supporting phrase, ${s.freq}× on page.`);
  }

  return picked.slice(0, max);
}
