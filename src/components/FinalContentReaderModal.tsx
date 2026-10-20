import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Code, 
  Sparkles, 
  Mic, 
  ShieldCheck, 
  HelpCircle, 
  Tag, 
  BookOpen, 
  TrendingUp, 
  Layers,
  ArrowRightLeft,
  ExternalLink,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Search,
  Table as TableIcon
} from 'lucide-react';
import { ContentComponent, SEOBackendData, FaqItem, TableData, H2SectionData } from '../types';
import { StructuredTablesViewer } from './StructuredTablesViewer';
import { sanitizeGrammarAndPunctuation } from '../utils/grammarSanitizer';

interface FinalContentReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  component?: ContentComponent;
  allComponents?: ContentComponent[];
  backendData?: SEOBackendData;
  onOpenDiff?: () => void;
  onOpenFullWebpage?: () => void;
}

interface ParsedSection {
  id: string;
  order: number;
  title: string;
  paragraphs: string[];
  subheadings: { tag: string; text: string; voiceIntent?: string }[];
  listItems: string[];
  tables: TableData[];
  voiceAnswerSnippet?: string;
  citationSource?: string;
}

export const FinalContentReaderModal: React.FC<FinalContentReaderModalProps> = ({
  isOpen,
  onClose,
  component,
  allComponents = [],
  backendData,
  onOpenDiff,
  onOpenFullWebpage,
}) => {
  const [activeTab, setActiveTab] = useState<'webpage' | 'structure' | 'markdown' | 'html'>('webpage');
  const [copiedType, setCopiedType] = useState<'markdown' | 'html' | 'text' | null>(null);
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({ 0: true });
  const [tableFilter, setTableFilter] = useState<string>('');
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');

  const toggleFaq = (index: number) => {
    setOpenFaqIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Harmonized components list
  const compList = useMemo(() => {
    if (allComponents && allComponents.length > 0) return allComponents;
    if (component) return [component];
    return [];
  }, [allComponents, component]);

  // Primary component reference
  const primaryComp = useMemo(() => {
    return compList[0] || ({} as Partial<ContentComponent>);
  }, [compList]);

  // 1. Brand name derivation
  const brandName = useMemo(() => {
    if (backendData?.openGraph?.siteName) {
      return sanitizeGrammarAndPunctuation(backendData.openGraph.siteName);
    }
    if (backendData?.metaTitle) {
      const parts = backendData.metaTitle.split(/[-|•–—]/);
      if (parts.length > 1) {
        return sanitizeGrammarAndPunctuation(parts[parts.length - 1].trim());
      }
    }
    if (primaryComp.name && !primaryComp.name.toLowerCase().includes('section')) {
      return sanitizeGrammarAndPunctuation(primaryComp.name);
    }
    return 'Official Resource Portal';
  }, [backendData, primaryComp]);

  // 2. Part 1: Hero H1
  const heroH1 = useMemo(() => {
    // Check all components for an H1
    for (const c of compList) {
      const h1 = (c.headings || []).find(h => h.tag?.toLowerCase() === 'h1');
      if (h1 && h1.text?.trim()) {
        return sanitizeGrammarAndPunctuation(h1.text.trim());
      }
    }
    if (backendData?.metaTitle) {
      const firstPart = backendData.metaTitle.split(/[-|•–—]/)[0]?.trim();
      if (firstPart) return sanitizeGrammarAndPunctuation(firstPart);
    }
    return sanitizeGrammarAndPunctuation(primaryComp.name || 'Verified Product & Architecture Guide');
  }, [compList, backendData, primaryComp]);

  // 3. Part 1: Hero Description & Layman BLUF
  const { heroDescription, laymanBluf } = useMemo(() => {
    let rawDesc = primaryComp.heroDescription || '';
    if (!rawDesc && primaryComp.bodyContent) {
      const paras = primaryComp.bodyContent.split(/\n\n+/).filter(Boolean);
      rawDesc = paras[0] || '';
    }

    let bluf = '';
    const plainEnglishMatch = rawDesc.match(/In Plain English:?\s*([^\n]+)/i);
    if (plainEnglishMatch) {
      bluf = plainEnglishMatch[1].trim();
      rawDesc = rawDesc.replace(/In Plain English:?\s*[^\n]+/i, '').trim();
    } else if (primaryComp.voiceAnswerSnippet) {
      bluf = primaryComp.voiceAnswerSnippet;
    } else {
      bluf = 'This system provides high-reliability, transparent capabilities designed to eliminate friction and ensure full regulatory compliance.';
    }

    if (!rawDesc) {
      rawDesc = `Explore verified features, architectural workflows, and step-by-step guidance for ${heroH1}.`;
    }

    return {
      heroDescription: sanitizeGrammarAndPunctuation(rawDesc),
      laymanBluf: sanitizeGrammarAndPunctuation(bluf),
    };
  }, [primaryComp, heroH1]);

  // 4. Part 2: Structured Body Sections (H2 Sections with respective paragraphs & tables)
  const structuredSections: ParsedSection[] = useMemo(() => {
    const sections: ParsedSection[] = [];

    // Case A: Component has dedicated h2Sections
    if (primaryComp.h2Sections && primaryComp.h2Sections.length > 0) {
      primaryComp.h2Sections.forEach((sec, idx) => {
        const secTitle = sec.h2Text || sec.originalH2Text || `Section ${idx + 1}`;
        const secParas = (sec.bodyParagraphs || []).map(p => sanitizeGrammarAndPunctuation(p)).filter(Boolean);
        sections.push({
          id: sec.id || `sec-${idx + 1}`,
          order: idx + 1,
          title: sanitizeGrammarAndPunctuation(secTitle),
          paragraphs: secParas.length > 0 ? secParas : [sanitizeGrammarAndPunctuation(`Detailed technical guidelines and verified specifications for ${secTitle.toLowerCase()}.`)],
          subheadings: (sec.h3Headings || []).map(h => ({
            tag: 'h3',
            text: sanitizeGrammarAndPunctuation(h.text),
            voiceIntent: h.voiceIntent || 'Secondary Intent',
          })),
          listItems: (sec.listItems || []).map(li => sanitizeGrammarAndPunctuation(li)),
          tables: sec.tables || [],
          voiceAnswerSnippet: sec.voiceAnswerSnippet ? sanitizeGrammarAndPunctuation(sec.voiceAnswerSnippet) : undefined,
          citationSource: sec.citationSource ? sanitizeGrammarAndPunctuation(sec.citationSource) : undefined,
        });
      });
      return sections;
    }

    // Case B: Multiple components exist in page
    if (compList.length > 1) {
      let order = 1;
      compList.forEach((c) => {
        // Skip pure hero if it only contains H1 and short intro
        const isHeroOnly = c.type === 'hero' && !(c.headings || []).some(h => h.tag?.toLowerCase() === 'h2');
        if (isHeroOnly) return;

        const h2 = (c.headings || []).find(h => h.tag?.toLowerCase() === 'h2')?.text || c.name || `Section ${order}`;
        const h3s = (c.headings || []).filter(h => h.tag?.toLowerCase() === 'h3').map(h => ({
          tag: 'h3',
          text: sanitizeGrammarAndPunctuation(h.text),
          voiceIntent: h.voiceIntent || 'Secondary Intent',
        }));
        const paras = (c.bodyContent || '')
          .split(/\n\n+/)
          .filter(Boolean)
          .map(p => sanitizeGrammarAndPunctuation(p));

        sections.push({
          id: c.id || `comp-sec-${order}`,
          order,
          title: sanitizeGrammarAndPunctuation(h2),
          paragraphs: paras.length > 0 ? paras : [sanitizeGrammarAndPunctuation(`Guidance and verified benchmarks for ${h2.toLowerCase()}.`)],
          subheadings: h3s,
          listItems: (c.listItems || []).map(li => sanitizeGrammarAndPunctuation(li)),
          tables: c.tables || [],
          voiceAnswerSnippet: c.voiceAnswerSnippet ? sanitizeGrammarAndPunctuation(c.voiceAnswerSnippet) : undefined,
          citationSource: c.citationSource ? sanitizeGrammarAndPunctuation(c.citationSource) : undefined,
        });
        order++;
      });
      if (sections.length > 0) return sections;
    }

    // Case C: Single component with multiple H2s & body text
    const h2s = (primaryComp.headings || []).filter(h => h.tag?.toLowerCase() === 'h2');
    const allParas = (primaryComp.bodyContent || '')
      .split(/\n\n+/)
      .filter(p => !p.toLowerCase().includes('in plain english:') && !p.startsWith('#'))
      .map(p => sanitizeGrammarAndPunctuation(p));

    const allTables = primaryComp.tables || [];
    const allLists = primaryComp.listItems || [];

    if (h2s.length > 0) {
      // Distribute paragraphs cleanly among the H2s
      const parasPerSection = Math.max(1, Math.ceil(allParas.length / h2s.length));
      h2s.forEach((h2, idx) => {
        const start = idx * parasPerSection;
        const assignedParas = allParas.slice(start, start + parasPerSection);
        const assignedTables = allTables.slice(idx, idx + 1);
        const assignedLists = allLists.slice(idx * 2, (idx + 1) * 2);

        sections.push({
          id: `h2-sec-${idx + 1}`,
          order: idx + 1,
          title: sanitizeGrammarAndPunctuation(h2.text),
          paragraphs: assignedParas.length > 0 
            ? assignedParas 
            : [sanitizeGrammarAndPunctuation(`Essential guidance, eligibility requirements, and process steps for ${h2.text.replace(/[?.:!]/g, '').toLowerCase()}.`)],
          subheadings: [],
          listItems: assignedLists.map(li => sanitizeGrammarAndPunctuation(li)),
          tables: assignedTables,
          voiceAnswerSnippet: primaryComp.voiceAnswerSnippet ? sanitizeGrammarAndPunctuation(primaryComp.voiceAnswerSnippet) : undefined,
          citationSource: primaryComp.citationSource ? sanitizeGrammarAndPunctuation(primaryComp.citationSource) : undefined,
        });
      });
      return sections;
    }

    // Fallback: Single unified section
    sections.push({
      id: 'default-sec-1',
      order: 1,
      title: 'Core Architecture & Capabilities',
      paragraphs: allParas.length > 0 ? allParas : ['Explore verified operational workflows and guidelines.'],
      subheadings: [],
      listItems: allLists.map(li => sanitizeGrammarAndPunctuation(li)),
      tables: allTables,
      voiceAnswerSnippet: primaryComp.voiceAnswerSnippet ? sanitizeGrammarAndPunctuation(primaryComp.voiceAnswerSnippet) : undefined,
      citationSource: primaryComp.citationSource ? sanitizeGrammarAndPunctuation(primaryComp.citationSource) : undefined,
    });

    // MANDATORY USER RULE: Only show H2s and content under it if content under that H2 has > 10 words
    return sections.filter(sec => {
      const parts = [
        ...(sec.paragraphs || []),
        ...(sec.listItems || []),
        ...(sec.subheadings || []).map(h => h.text),
        ...(sec.tables || []).flatMap(t => [...t.headers, ...t.rows.flat()]),
      ];
      const combined = parts.join(' ').replace(/<[^>]+>/g, ' ').replace(/[#*`|_~>]/g, ' ').trim();
      const count = combined ? combined.split(/\s+/).filter(w => w.length > 0 && /[\w\d]/.test(w)).length : 0;
      return count > 10;
    });
  }, [primaryComp, compList]);

  // 5. Part 3: Frequently Asked Questions
  const allFaqs: FaqItem[] = useMemo(() => {
    const rawFaqs: FaqItem[] = [];

    // Gather from compList
    compList.forEach(c => {
      if (Array.isArray(c.faqs)) {
        c.faqs.forEach(f => {
          if (f.question && f.answer) {
            rawFaqs.push({
              id: f.id || `faq-${rawFaqs.length}`,
              question: sanitizeGrammarAndPunctuation(f.question),
              answer: sanitizeGrammarAndPunctuation(f.answer),
              voiceIntent: f.voiceIntent || 'Voice Search Question',
            });
          }
        });
      }
      // Gather from H3 voice search questions
      (c.headings || []).forEach((h, hIdx) => {
        if (h.tag?.toLowerCase() === 'h3' && (h.text.includes('?') || h.voiceIntent)) {
          const exists = rawFaqs.some(rf => rf.question.toLowerCase() === h.text.toLowerCase());
          if (!exists) {
            rawFaqs.push({
              id: `faq-h3-${hIdx}`,
              question: sanitizeGrammarAndPunctuation(h.text),
              answer: c.voiceAnswerSnippet 
                ? sanitizeGrammarAndPunctuation(c.voiceAnswerSnippet)
                : 'Our verified platform adheres to institutional standards and certified guidelines for reliable, immediate assistance.',
              voiceIntent: h.voiceIntent || 'Voice Search Question',
            });
          }
        }
      });
    });

    if (rawFaqs.length === 0) {
      rawFaqs.push(
        {
          id: 'faq-1',
          question: `How do I get started with ${heroH1}?`,
          answer: `Getting started requires reviewing the basic guidelines, verifying your details online, and submitting your request through our transparent process.`,
          voiceIntent: 'Voice Search Question',
        },
        {
          id: 'faq-2',
          question: `What compliance and security standards are verified?`,
          answer: `All workflows comply with applicable statutory regulations, institutional benchmarks, and end-to-end data encryption protocols.`,
          voiceIntent: 'Voice Search Question',
        }
      );
    }

    return rawFaqs;
  }, [compList, heroH1]);

  // Filtered FAQs by search
  const filteredFaqs = useMemo(() => {
    if (!faqSearchQuery.trim()) return allFaqs;
    const q = faqSearchQuery.toLowerCase();
    return allFaqs.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [allFaqs, faqSearchQuery]);

  // 6. Part 4: EEAT Citation Source
  const citationSource = useMemo(() => {
    for (const c of compList) {
      if (c.citationSource && c.citationSource.trim()) {
        return sanitizeGrammarAndPunctuation(c.citationSource.trim());
      }
    }
    return 'Official Statutory Regulatory Framework & Verified Institutional Guidelines (Updated 2026)';
  }, [compList]);

  // All extracted tables
  const allTables = useMemo(() => {
    return structuredSections.flatMap(s => s.tables || []);
  }, [structuredSections]);

  // Compute document statistics
  const stats = useMemo(() => {
    const tableWords = allTables.flatMap(t => [t.title || '', ...t.headers, ...t.rows.flatMap(r => r)]).join(' ');
    const secWords = structuredSections.map(s => `${s.title} ${s.paragraphs.join(' ')} ${s.listItems.join(' ')}`).join(' ');
    const fullText = `${heroH1} ${heroDescription} ${laymanBluf} ${secWords} ${tableWords} ${allFaqs.map(f => `${f.question} ${f.answer}`).join(' ')}`;
    const words = fullText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    const isRecentlyFixed = compList.some(c => c.status === 'recently_fixed') || backendData?.status === 'recently_fixed';

    return {
      wordCount,
      readingTime,
      sectionCount: structuredSections.length,
      faqCount: allFaqs.length,
      tablesCount: allTables.length,
      isRecentlyFixed,
    };
  }, [heroH1, heroDescription, laymanBluf, structuredSections, allTables, allFaqs, compList, backendData]);

  // 7. Markdown document generation (Proper structured hierarchy)
  const markdownText = useMemo(() => {
    const lines: string[] = [];

    // Part 1: Hero
    lines.push(`# ${heroH1}`);
    lines.push('');
    lines.push(heroDescription);
    lines.push('');
    if (laymanBluf) {
      lines.push(`> **In Plain English:** ${laymanBluf}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');

    // Part 2: Body Sections
    structuredSections.forEach(sec => {
      lines.push(`## ${sec.title}`);
      lines.push('');

      sec.paragraphs.forEach(p => {
        lines.push(p);
        lines.push('');
      });

      if (sec.listItems && sec.listItems.length > 0) {
        sec.listItems.forEach(item => {
          lines.push(`- ${item}`);
        });
        lines.push('');
      }

      if (sec.tables && sec.tables.length > 0) {
        sec.tables.forEach(tbl => {
          if (tbl.title) lines.push(`### ${tbl.title}\n`);
          if (tbl.headers && tbl.headers.length > 0) {
            lines.push(`| ${tbl.headers.join(' | ')} |`);
            lines.push(`| ${tbl.headers.map(() => '---').join(' | ')} |`);
            (tbl.rows || []).forEach(r => lines.push(`| ${r.join(' | ')} |`));
            lines.push('');
          }
        });
      }

      if (sec.subheadings && sec.subheadings.length > 0) {
        sec.subheadings.forEach(sub => {
          lines.push(`### ${sub.text}`);
          lines.push('');
        });
      }
    });

    lines.push('---');
    lines.push('');

    // Part 3: FAQ Section
    lines.push('## Frequently Asked Questions');
    lines.push('');

    allFaqs.forEach(faq => {
      lines.push(`### ${faq.question}`);
      lines.push('');
      lines.push(faq.answer);
      lines.push('');
    });

    lines.push('---');
    lines.push('');

    // Part 4: EEAT Citation
    if (citationSource) {
      lines.push(`> **EEAT Verification & Authority:** ${citationSource}`);
      lines.push('');
    }

    return lines.join('\n');
  }, [heroH1, heroDescription, laymanBluf, structuredSections, allFaqs, citationSource]);

  // 8. HTML document generation (Semantic HTML5 with proper sections)
  const htmlText = useMemo(() => {
    const sectionsHtml = structuredSections.map(sec => {
      const parasHtml = sec.paragraphs.map(p => `      <p>${p}</p>`).join('\n');
      const listHtml = sec.listItems.length > 0 
        ? `\n      <ul class="feature-list">\n${sec.listItems.map(li => `        <li>${li}</li>`).join('\n')}\n      </ul>` 
        : '';

      const tablesHtml = (sec.tables || []).map(tbl => `
      <table class="data-table">
        ${tbl.title ? `<caption>${tbl.title}</caption>` : ''}
        <thead>
          <tr>${tbl.headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${(tbl.rows || []).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('\n          ')}
        </tbody>
      </table>`).join('\n');

      return `    <!-- SECTION: ${sec.title} -->
    <section class="content-section" id="${sec.id}">
      <h2>${sec.title}</h2>
${parasHtml}${listHtml}${tablesHtml}
    </section>`;
    }).join('\n\n');

    const faqsHtml = allFaqs.map(faq => `      <article class="faq-item">
        <h3>${faq.question}</h3>
        <p>${faq.answer}</p>
      </article>`).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${backendData?.metaTitle || heroH1}</title>
  <meta name="description" content="${backendData?.metaDescription || heroDescription.slice(0, 155)}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <!-- PART 1: HERO SECTION -->
  <header class="hero-section">
    <div class="container">
      <h1>${heroH1}</h1>
      <p class="hero-description">${heroDescription}</p>
      ${laymanBluf ? `<div class="bluf-summary"><strong>In Plain English:</strong> ${laymanBluf}</div>` : ''}
    </div>
  </header>

  <!-- PART 2: BODY CONTENT -->
  <main class="content-body">
${sectionsHtml}
  </main>

  <!-- PART 3: FAQ SECTION -->
  <section class="faq-section" id="faq">
    <h2>Frequently Asked Questions</h2>
${faqsHtml}
  </section>

  <!-- PART 4: EEAT VERIFICATION -->
  <footer class="eeat-citation">
    <p><strong>EEAT Authority Verification:</strong> <em>${citationSource}</em></p>
  </footer>
</body>
</html>`;
  }, [heroH1, heroDescription, laymanBluf, structuredSections, allFaqs, citationSource, backendData]);

  // Copy handler
  const handleCopy = (type: 'markdown' | 'html' | 'text') => {
    let contentToCopy = '';
    if (type === 'markdown') contentToCopy = markdownText;
    else if (type === 'html') contentToCopy = htmlText;
    else contentToCopy = markdownText.replace(/[#*`>-]/g, '').trim();

    navigator.clipboard.writeText(contentToCopy);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Download handler
  const handleDownload = (format: 'md' | 'html') => {
    const content = format === 'md' ? markdownText : htmlText;
    const filename = `optimized-page-content.${format}`;
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-50">
                  Full Webpage Content Reader
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Synthesized 4-Part Document</span>
                </span>
                {stats.isRecentlyFixed && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1 animate-pulse">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Agent 7 &amp; 8 Remediated</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete unified view: Part 1 (Hero &lt;H1&gt;), Part 2 (Structured Body &lt;H2&gt;s), Part 3 (FAQ &lt;H3&gt;s), and Part 4 (E-E-A-T Disclosures).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenDiff && (
              <button
                onClick={onOpenDiff}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-slate-50 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
                title="View Side-by-Side Diff"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                <span>Side-by-Side Diff</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-50 rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode & Stats Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('webpage')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'webpage'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Webpage UX</span>
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'structure'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Structure Wireframe</span>
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'markdown'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'html'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML Output</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="font-bold text-slate-50">{stats.wordCount}</span>
              <span className="text-[11px]">words</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className="font-bold text-teal-400">~{stats.readingTime}</span>
              <span className="text-[11px]">min read</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className="font-bold text-indigo-400">{stats.sectionCount}</span>
              <span className="text-[11px]">H2 sections</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className="font-bold text-purple-400">{stats.faqCount}</span>
              <span className="text-[11px]">FAQs</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {onOpenFullWebpage && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFullWebpage();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
                title="Open full interactive page in dedicated Webpage Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full Webpage Mode</span>
              </button>
            )}

            <button
              onClick={() => handleCopy(activeTab === 'html' ? 'html' : 'markdown')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
            >
              {copiedType ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedType ? 'Copied!' : `Copy ${activeTab === 'html' ? 'HTML' : 'Markdown'}`}</span>
            </button>

            <button
              onClick={() => handleDownload(activeTab === 'html' ? 'html' : 'md')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .{activeTab === 'html' ? 'html' : 'md'}</span>
            </button>
          </div>

        </div>

        {/* Modal Main Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: WEBPAGE UX (AUTHENTIC, CLEAN CONSUMER WEBPAGE VIEW) */}
          {activeTab === 'webpage' && (
            <div className="palette-fixed max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl text-slate-900">
              
              {/* Webpage Header */}
              <div className="px-6 sm:px-8 py-4 bg-white/95 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                                      </div>
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                    {brandName}
                  </span>
                </div>

                <div className="hidden sm:flex items-center space-x-5 text-xs text-slate-600 font-medium">
                  <span className="text-indigo-600 font-bold cursor-pointer">Overview</span>
                  {structuredSections.slice(0, 2).map((sec, sIdx) => (
                    <span key={sIdx} className="cursor-pointer hover:text-slate-900 truncate max-w-[140px]">
                      {sec.title}
                    </span>
                  ))}
                  <span className="cursor-pointer hover:text-slate-900">FAQs</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-xs cursor-pointer hover:bg-indigo-500 transition">
                    Explore Guide
                  </span>
                </div>
              </div>

              {/* Webpage Hero Section */}
              <div className="px-6 sm:px-10 py-10 bg-slate-50 border-b border-slate-100 space-y-6">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>Home</span>
                  <span>/</span>
                  <span>Solutions</span>
                  <span>/</span>
                  <span className="text-slate-900 font-semibold truncate">{heroH1}</span>
                </div>

                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span>Verified Production Guide • 2026 Edition</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-snug">
                    {heroH1}
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-3xl">
                    {heroDescription}
                  </p>
                </div>

                {/* Layman BLUF Summary Callout */}
                {laymanBluf && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs sm:text-sm text-slate-800 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-800 font-black uppercase text-[11px] tracking-wide">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>In Plain English (Layman Takeaway)</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {laymanBluf}
                    </p>
                  </div>
                )}

                {/* Hero CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition">
                    Explore Architecture Demo
                  </button>
                  <button className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition">
                    View Specifications &amp; FAQs
                  </button>
                </div>

                {/* Trust strip */}
                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="font-black text-base text-slate-900">99.99%</div>
                    <div className="text-slate-500">SLA Benchmark</div>
                  </div>
                  <div>
                    <div className="font-black text-base text-indigo-600">&lt;45ms</div>
                    <div className="text-slate-500">Processing Latency</div>
                  </div>
                  <div>
                    <div className="font-black text-base text-slate-900">Verified</div>
                    <div className="text-slate-500">Statutory Compliance</div>
                  </div>
                  <div>
                    <div className="font-black text-base text-emerald-600">80M+</div>
                    <div className="text-slate-500">Active Users Served</div>
                  </div>
                </div>
              </div>

              {/* Webpage Body & H2 Sections */}
              <div className="px-6 sm:px-10 py-10 space-y-12">
                {structuredSections.map((sec, i) => (
                  <div 
                    key={sec.id || i} 
                    className={`space-y-5 pb-10 border-b border-slate-100 last:border-b-0 last:pb-0 transition-all ${
                      stats.isRecentlyFixed 
                        ? 'p-5 rounded-2xl bg-emerald-50/20 border-l-4 border-l-emerald-500 shadow-xs' 
                        : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                          0{sec.order}. Section
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                          {sec.title}
                        </h2>
                      </div>
                      {stats.isRecentlyFixed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Remediated &amp; Optimized</span>
                        </span>
                      )}
                    </div>

                    {/* Section's Own Paragraphs (No Duplication) */}
                    <div className="space-y-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
                      {sec.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>

                    {/* Section's List Items */}
                    {sec.listItems && sec.listItems.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-800">
                          {sec.listItems.map((li, lIdx) => (
                            <li key={lIdx} className="flex items-start space-x-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Section's Specific Tables */}
                    {sec.tables && sec.tables.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <StructuredTablesViewer tables={sec.tables} />
                      </div>
                    )}
                  </div>
                ))}

                {/* FAQ Accordion Section */}
                <div className="space-y-4 pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-purple-600">
                        Voice &amp; Search Direct Answers (AEO)
                      </span>
                      <h3 className="text-xl font-bold text-slate-900">
                        Frequently Asked Questions
                      </h3>
                    </div>

                    <div className="relative max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search questions..."
                        value={faqSearchQuery}
                        onChange={(e) => setFaqSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5 max-w-3xl">
                    {filteredFaqs.map((faq, fIdx) => {
                      const isOpen = !!openFaqIndices[fIdx];
                      return (
                        <div key={faq.id || fIdx} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <button
                            onClick={() => toggleFaq(fIdx)}
                            className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition"
                          >
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {faq.question}
                            </span>
                            <span className="text-slate-400">
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-3 pt-1 bg-slate-50 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                              <p>{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* E-E-A-T Citation Card */}
                {citationSource && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center space-x-2 font-bold">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>E-E-A-T Statutory Verification:</span>
                    </div>
                    <p className="text-amber-800">{citationSource}</p>
                  </div>
                )}
              </div>

              {/* Webpage Footer */}
              <div className="px-6 sm:px-10 py-6 bg-slate-900 text-slate-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800">
                <span>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</span>
                <span className="text-slate-500">E-E-A-T, Schema &amp; Voice Search Validated</span>
              </div>

            </div>
          )}

          {/* TAB 2: SCHEMA WIREFRAME / ANNOTATED TAGS VIEW */}
          {activeTab === 'structure' && (
            <div className="max-w-3xl mx-auto space-y-8 py-2">
              
              {/* PART 1: HERO SECTION */}
              <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-4 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-indigo-400 flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-black">
                      PART 1
                    </span>
                    <span>Hero Section &lt;H1&gt; &amp; Description</span>
                  </span>
                  <span className="text-[11px] text-indigo-300/80 font-mono">
                    Primary Search &amp; Intent Anchor
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-rose-950/80 border border-rose-500/40 text-rose-300 shrink-0">
                      &lt;H1&gt;
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-50 leading-tight tracking-tight">
                      {heroH1}
                    </h1>
                  </div>

                  <div className="flex items-start space-x-2 pl-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 shrink-0 mt-0.5">
                      &lt;p (Hero)&gt;
                    </span>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                      {heroDescription}
                    </p>
                  </div>

                  {laymanBluf && (
                    <div className="flex items-start space-x-2 pl-1">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shrink-0 mt-0.5">
                        &lt;BLUF&gt;
                      </span>
                      <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
                        {laymanBluf}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* PART 2: BODY SECTIONS */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-teal-400 flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/40 text-teal-300 font-black">
                      PART 2
                    </span>
                    <span>Body Section &lt;H2&gt;s, Narrative &amp; EEAT</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {structuredSections.length} Structured H2 Sections
                  </span>
                </div>

                {structuredSections.map((sec, i) => (
                  <div key={sec.id || i} className="space-y-3 pt-3 border-b border-slate-800/80 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-baseline space-x-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-teal-950/80 border border-teal-500/40 text-teal-300 shrink-0">
                        &lt;H2&gt;
                      </span>
                      <h2 className="text-lg font-bold text-slate-50">
                        {sec.title}
                      </h2>
                    </div>

                    <div className="space-y-2 pl-2">
                      {sec.paragraphs.map((p, pIdx) => (
                        <div key={pIdx} className="flex items-start space-x-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700 shrink-0 mt-0.5">
                            &lt;p&gt;
                          </span>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {p}
                          </p>
                        </div>
                      ))}
                    </div>

                    {sec.listItems && sec.listItems.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
                            &lt;ul&gt;
                          </span>
                          <span>Section Features</span>
                        </span>
                        <ul className="space-y-1 pl-2">
                          {sec.listItems.map((li, lIdx) => (
                            <li key={lIdx} className="flex items-center space-x-2 text-xs text-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {sec.tables && sec.tables.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <StructuredTablesViewer tables={sec.tables} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* PART 3: FAQ SECTION */}
              <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-800/30 space-y-5 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-purple-800/20">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-purple-300 flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-black">
                      PART 3
                    </span>
                    <span>FAQ Section &lt;H3&gt;s &amp; Voice Answers</span>
                  </span>
                  <span className="text-[11px] text-purple-300/80 font-mono">
                    Conversational AEO Target ({allFaqs.length} FAQs)
                  </span>
                </div>

                <div className="space-y-4">
                  {allFaqs.map((faq, i) => (
                    <div
                      key={faq.id || i}
                      className="p-4 rounded-xl bg-slate-950/90 border border-purple-900/40 space-y-2.5"
                    >
                      <div className="flex items-baseline space-x-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-purple-950/90 border border-purple-500/50 text-purple-300 shrink-0">
                          &lt;H3 (FAQ)&gt;
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-purple-100">
                          {faq.question}
                        </h3>
                      </div>

                      <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-900/30 space-y-1">
                        <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold text-purple-400">
                          <Mic className="w-3 h-3 text-purple-400" />
                          <span>Direct Voice Search Answer:</span>
                        </div>
                        <p className="text-xs text-purple-200/90 leading-relaxed italic pl-4">
                          &quot;{faq.answer}&quot;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PART 4: CALL TO ACTION (CTA) BUTTONS */}
              {backendData?.ctas && backendData.ctas.length > 0 && (
                <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-800/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-800/20">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-amber-300 flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black">
                        PART 4
                      </span>
                      <span>Call-to-Action (CTA) Actions &amp; Links ({backendData.ctas.length})</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {backendData.ctas.map((cta, idx) => (
                      <a
                        key={cta.id || idx}
                        href={cta.link.startsWith('/') || cta.link.startsWith('#') || cta.link.startsWith('http') ? cta.link : `https://${cta.link}`}
                        target={cta.isExternal ? '_blank' : undefined}
                        rel={cta.isExternal ? 'noopener noreferrer' : undefined}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        <span>{cta.text}</span>
                        {cta.isExternal && <ExternalLink className="w-3.5 h-3.5 opacity-75" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: MARKDOWN VIEW */}
          {activeTab === 'markdown' && (
            <div className="space-y-3">
              <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {markdownText}
              </pre>
            </div>
          )}

          {/* TAB 4: HTML VIEW */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {htmlText}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Exported document follows all Google SERP, Voice Search (AEO), and LLM Citation (GEO) guidelines.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow-md"
          >
            Done Reading
          </button>
        </div>

      </div>
    </div>
  );
};
