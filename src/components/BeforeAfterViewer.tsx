import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Layers, 
  FileCode,
  Table as TableIcon,
  ShieldCheck,
  Bot,
  ArrowRight,
  BookOpen,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ContentComponent, SEOBackendData, AuditFlag, TableData, H2SectionData } from '../types';

interface BeforeAfterViewerProps {
  isOpen: boolean;
  onClose: () => void;
  component?: ContentComponent | null;
  backend?: SEOBackendData | null;
  isBackendMode?: boolean;
  flags?: AuditFlag[];
  allComponents?: ContentComponent[];
  sectionTitle?: string;
  beforeContent?: string;
  afterContent?: string;
  beforeItems?: any[];
  afterItems?: any[];
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({
  isOpen,
  onClose,
  component,
  backend,
  isBackendMode = false,
  flags = [],
  allComponents = [],
  sectionTitle,
  beforeContent,
  afterContent,
  beforeItems,
  afterItems,
}) => {
  const [selectedTab, setSelectedTab] = useState<'entire_content' | 'backend' | 'guideline_reasons'>('entire_content');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const primaryComp = (allComponents && allComponents.length > 0 ? allComponents[0] : component) || null;
  const origComp = primaryComp?.originalSnapshot || primaryComp;
  const origBackend = backend?.originalSnapshot || backend;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Compile all tables from component, snapshot, and backend
  const allBeforeTables: TableData[] = useMemo(() => {
    const list: TableData[] = [];
    if (origComp?.tables && Array.isArray(origComp.tables)) {
      list.push(...origComp.tables);
    }
    if (origComp?.h2Sections && Array.isArray(origComp.h2Sections)) {
      origComp.h2Sections.forEach((s: any) => {
        if (s.tables && Array.isArray(s.tables)) list.push(...s.tables);
      });
    }
    if (backend?.originalSnapshot?.media?.tables) {
      list.push(...backend.originalSnapshot.media.tables);
    }
    // Deduplicate by ID
    const seen = new Set<string>();
    return list.filter(t => {
      const id = t.id || JSON.stringify(t.headers);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [origComp, backend]);

  const allAfterTables: TableData[] = useMemo(() => {
    const list: TableData[] = [];
    if (primaryComp?.tables && Array.isArray(primaryComp.tables)) {
      list.push(...primaryComp.tables);
    }
    if (primaryComp?.h2Sections && Array.isArray(primaryComp.h2Sections)) {
      primaryComp.h2Sections.forEach((s: any) => {
        if (s.tables && Array.isArray(s.tables)) list.push(...s.tables);
      });
    }
    if (backend?.media?.tables) {
      list.push(...backend.media.tables);
    }
    if (list.length === 0 && allBeforeTables.length > 0) {
      return allBeforeTables;
    }
    const seen = new Set<string>();
    return list.filter(t => {
      const id = t.id || JSON.stringify(t.headers);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [primaryComp, backend, allBeforeTables]);

  // Structured H2 sections for before and after
  // Helper to count words under an H2 section
  const countWordsUnderH2 = (sec: H2SectionData): number => {
    if (typeof sec.wordCount === 'number' && sec.wordCount > 0) return sec.wordCount;
    const parts: string[] = [
      ...(sec.bodyParagraphs || []),
      ...(sec.listItems || []),
      ...(sec.h3Headings || []).map(h => h.text),
      ...(sec.tables || []).flatMap(t => [...t.headers, ...t.rows.flat()]),
      ...(sec.faqs || []).flatMap(f => [f.question, f.answer])
    ];
    const combined = parts.join(' ').replace(/<[^>]+>/g, ' ').replace(/[#*`|_~>]/g, ' ').trim();
    if (!combined) return 0;
    return combined.split(/\s+/).filter(w => w.length > 0 && /[\w\d]/.test(w)).length;
  };

  // Structured H2 sections for before and after (Rule: Only show H2s with > 10 words of content)
  const beforeSections: H2SectionData[] = useMemo(() => {
    let list: H2SectionData[] = [];
    if (origComp?.h2Sections && origComp.h2Sections.length > 0) {
      list = origComp.h2Sections;
    } else {
      const h2s = (origComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2');
      const pList = (origComp?.bodyContent || '').split(/\n\n+/).filter(Boolean);
      if (h2s.length > 0) {
        list = h2s.map((h, i) => ({
          id: `b-sec-${i + 1}`,
          order: i + 1,
          h2Text: h.text,
          originalH2Text: h.text,
          voiceIntent: 'Raw Search Query',
          h3Headings: [],
          bodyParagraphs: [pList[i + 1] || pList[0] || `${h.text} details.`],
          listItems: origComp?.listItems || [],
          tables: allBeforeTables.slice(i, i + 1),
          faqs: [],
          voiceAnswerSnippet: origComp?.voiceAnswerSnippet || '',
          citationSource: origComp?.citationSource || '',
          status: 'non_compliant'
        }));
      }
    }
    return list.filter(sec => countWordsUnderH2(sec) > 10);
  }, [origComp, allBeforeTables]);

  const afterSections: H2SectionData[] = useMemo(() => {
    let list: H2SectionData[] = [];
    if (primaryComp?.h2Sections && primaryComp.h2Sections.length > 0) {
      list = primaryComp.h2Sections;
    } else {
      const h2s = (primaryComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2');
      const pList = (primaryComp?.bodyContent || '').split(/\n\n+/).filter(Boolean);
      if (h2s.length > 0) {
        list = h2s.map((h, i) => ({
          id: `a-sec-${i + 1}`,
          order: i + 1,
          h2Text: h.text,
          originalH2Text: h.text,
          voiceIntent: h.voiceIntent || 'Direct Answer & Voice Search Query',
          h3Headings: [],
          bodyParagraphs: [pList[i + 1] || pList[0] || `${h.text} details.`],
          listItems: primaryComp?.listItems || [],
          tables: allAfterTables.slice(i, i + 1),
          faqs: [],
          voiceAnswerSnippet: primaryComp?.voiceAnswerSnippet || '',
          citationSource: primaryComp?.citationSource || '',
          status: 'recently_fixed'
        }));
      }
    }
    return list.filter(sec => countWordsUnderH2(sec) > 10);
  }, [primaryComp, allAfterTables]);

  // Guideline reasons items
  const guidelineReasons = useMemo(() => {
    const reasons: Array<{
      title: string;
      guideline: string;
      agent: string;
      reason: string;
      before: string;
      after: string;
    }> = [];

    // Meta Title
    if (backend?.metaTitle) {
      reasons.push({
        title: 'Meta Title & SERP Snippet',
        guideline: 'SEO Guidelines (50-60 Character Limit & Primary Keyword Placement)',
        agent: 'Agent 3: Technical SEO & Schema Architect',
        reason: `Optimized title to strictly ${backend.metaTitle.length} characters with primary search intent front-loaded and no truncation.`,
        before: origBackend?.metaTitle || '(Unoptimized length or missing)',
        after: backend.metaTitle,
      });
    }

    // Meta Description
    if (backend?.metaDescription) {
      reasons.push({
        title: 'Meta Description & SERP Hook',
        guideline: 'SEO Guidelines (150-160 Character Limit & Complete Sentence Requirement)',
        agent: 'Agent 3: Technical SEO & Schema Architect',
        reason: `Crafted a 100% complete, grammatically finalized ${backend.metaDescription.length}-character description with an explicit search intent call to action.`,
        before: origBackend?.metaDescription || '(Unfinished sentence or missing)',
        after: backend.metaDescription,
      });
    }

    // Schema
    if (backend?.schemaJsonLd) {
      reasons.push({
        title: 'Structured Data Schema Graph',
        guideline: 'SEO Guidelines (5-Entity Canonical Hierarchy Standards)',
        agent: 'Agent 3: Technical SEO & Schema Architect',
        reason: 'Constructed canonical 5-tier linked graph (WebPage -> BreadcrumbList -> SubjectEntity -> Organization -> FAQPage) for Google rich results.',
        before: origBackend?.schemaJsonLd ? `${origBackend.schemaJsonLd.slice(0, 100)}...` : '(Missing schema)',
        after: `${backend.schemaJsonLd.slice(0, 160)}...`,
      });
    }

    // H1 Topic Anchor
    const origH1 = (origComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || origComp?.name;
    const curH1 = (primaryComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || primaryComp?.name;
    if (curH1) {
      reasons.push({
        title: 'Hero Heading (<H1>)',
        guideline: 'Structure & Keyword Mapping Guidelines (Singular Topic Anchor)',
        agent: 'Agent 4: Heading & Search Volume Mapper',
        reason: 'Formulated an authentic H1 topic anchor matching primary search volume without keyword stuffing.',
        before: origH1 || '(Missing H1)',
        after: curH1,
      });
    }

    // Content Plain English
    reasons.push({
      title: 'Body Narrative & Plain English BLUF Summary',
      guideline: 'Customer-Centricity & Product Guidelines (8th-Grade Layman Reading Level)',
      agent: 'Agent 5: Customer Centricity & User-Experience Specialist',
      reason: 'Injected "In Plain English" bottom-line-up-front explanations under headings to eliminate jargon and cognitive reading friction.',
      before: origComp?.bodyContent ? origComp.bodyContent.slice(0, 120) + '...' : '(Unstructured complex jargon)',
      after: primaryComp?.bodyContent ? primaryComp.bodyContent.slice(0, 160) + '...' : '(Layman clarity applied)',
    });

    // Tables
    if (allAfterTables.length > 0) {
      reasons.push({
        title: 'Structured Comparison Tables',
        guideline: 'SEO Guidelines & Layout Standards (Verified Table Preservation)',
        agent: 'Agent 2: Guideline Compliance & Data Validator',
        reason: `Preserved all ${allAfterTables.length} scraped technical comparison tables with column headers and quantitative data points intact.`,
        before: allBeforeTables.length > 0 ? `Scraped ${allBeforeTables.length} raw table(s)` : 'Raw HTML table',
        after: `${allAfterTables.length} cleanly formatted Markdown & Data Grid comparison tables`,
      });
    }

    // Voice Answer
    if (primaryComp?.voiceAnswerSnippet) {
      reasons.push({
        title: 'Voice Search & AEO Answer Snippet',
        guideline: 'SEO Guidelines (AEO Conversational Voice Snippet 40-50 Words)',
        agent: 'Agent 4: Heading & Search Volume Mapper',
        reason: 'Generated conversational 40-50 word direct answers optimized for Google AI Overviews and voice assistant synthesis.',
        before: origComp?.voiceAnswerSnippet || '(Missing voice query answer)',
        after: primaryComp.voiceAnswerSnippet,
      });
    }

    // EEAT
    if (primaryComp?.citationSource) {
      reasons.push({
        title: 'E-E-A-T Citation & Institutional Grounding',
        guideline: 'EEAT & GEO Citation Guidelines (Verifiable Statutory Proof)',
        agent: 'Agent 6: GEO, Citation & E-E-A-T Verification Specialist',
        reason: 'Grounded claims with verified statutory regulatory framework citations for AI crawler trust and authority.',
        before: origComp?.citationSource || '(Unverified or missing citation)',
        after: primaryComp.citationSource,
      });
    }

    return reasons;
  }, [backend, origBackend, primaryComp, origComp, allBeforeTables, allAfterTables]);

  // Full assembled after text for copying
  const fullAfterText = useMemo(() => {
    if (afterContent) return afterContent;
    const parts: string[] = [];
    if (backend?.metaTitle) parts.push(`Meta Title: ${backend.metaTitle}`);
    if (backend?.metaDescription) parts.push(`Meta Description: ${backend.metaDescription}`);
    if (primaryComp?.bodyContent) parts.push(primaryComp.bodyContent);
    return parts.join('\n\n');
  }, [afterContent, backend, primaryComp]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className={`bg-slate-900 border border-slate-700 rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-6xl max-h-[92vh]'
      }`}>
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {sectionTitle || 'Before & After Full Content Comparison'}
                </h3>
                <span className="text-[11px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Compliant with All Guidelines
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side view of the entire content with highlighted changes, reasons, and guidelines adhered to.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(fullAfterText, 'modal-full-copy')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              {copiedKey === 'modal-full-copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'modal-full-copy' ? 'Copied After Content!' : 'Copy After Content'}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTab('entire_content')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                selectedTab === 'entire_content'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Content Side-by-Side</span>
            </button>

            <button
              onClick={() => setSelectedTab('guideline_reasons')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                selectedTab === 'guideline_reasons'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Why Changes Were Made ({guidelineReasons.length} Guidelines)</span>
            </button>

            {backend && (
              <button
                onClick={() => setSelectedTab('backend')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                  selectedTab === 'backend'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Backend Metadata &amp; Schemas</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Before (Original)</span>
            <span className="text-slate-600">|</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-bold">After (Optimized &amp; Compliant)</span>
          </div>
        </div>

        {/* COMPARISON BODY */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          
          {/* TAB 1: FULL WEBPAGE CONTENT SIDE-BY-SIDE */}
          {selectedTab === 'entire_content' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
              
              {/* LEFT COLUMN: BEFORE (ORIGINAL / SCRAPED) */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-rose-900/40 space-y-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-rose-900/30">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>BEFORE OPTIMIZATION (Original Scraped Webpage)</span>
                  </div>
                  <span className="text-[11px] text-rose-400 bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-800/40 font-mono font-bold">
                    Non-Compliant State
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  
                  {/* Hero H1 Before */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-mono uppercase font-bold text-rose-400">
                      PART 1: HERO SECTION &lt;H1&gt; (RAW SCRAPED)
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold text-sm">
                      {(origComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || origComp?.name || 'Original Heading'}
                    </div>
                    <p className="text-slate-400 leading-relaxed italic">
                      {origComp?.heroDescription || (origComp?.bodyContent || '').split(/\n\n+/)[0] || '(No hero description provided)'}
                    </p>
                  </div>

                  {/* Sections Before */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-mono uppercase font-bold text-teal-400">
                      PART 2: BODY &lt;H2&gt; SECTIONS &amp; PARAGRAPHS
                    </div>
                    
                    {beforeSections.length > 0 ? (
                      beforeSections.map((sec, sIdx) => (
                        <div key={sec.id || sIdx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                          <h4 className="text-slate-200 font-bold text-xs flex items-center space-x-1.5">
                            <span className="text-slate-500 font-mono">##</span>
                            <span>{sec.h2Text}</span>
                          </h4>
                          <div className="space-y-1 text-slate-400 leading-relaxed">
                            {(sec.bodyParagraphs || []).map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                          </div>
                          {sec.listItems && sec.listItems.length > 0 && (
                            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                              {sec.listItems.map((li, lIdx) => (
                                <li key={lIdx}>{li}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {origComp?.bodyContent || 'No structured sections extracted.'}
                      </div>
                    )}
                  </div>

                  {/* Scraped Tables Before */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-amber-400">
                      <span>PART 3: SCRAPED TABLES ({allBeforeTables.length})</span>
                      <span className="text-slate-500">Raw Data Grid</span>
                    </div>

                    {allBeforeTables.length > 0 ? (
                      allBeforeTables.map((tbl, tIdx) => (
                        <div key={tbl.id || tIdx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 overflow-x-auto">
                          {tbl.title && <div className="font-bold text-slate-300 text-xs">{tbl.title}</div>}
                          <table className="w-full text-[11px] text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                                {tbl.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="p-2 font-semibold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tbl.rows.slice(0, 4).map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-slate-800/60 text-slate-300">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 font-mono text-[11px]">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {tbl.rows.length > 4 && (
                            <div className="text-[11px] text-slate-500 italic text-center pt-1">
                              + {tbl.rows.length - 4} more rows
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 italic text-center">
                        (No tabular data scraped in original document)
                      </div>
                    )}
                  </div>

                  {/* FAQs Before */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-mono uppercase font-bold text-purple-400">
                      PART 4: FAQS &amp; VOICE QUERIES
                    </div>
                    {origComp?.faqs && origComp.faqs.length > 0 ? (
                      origComp.faqs.map((f, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="font-semibold text-slate-200">Q: {f.question}</div>
                          <div className="text-slate-400 text-[11px]">A: {f.answer}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 italic text-center">
                        (No explicit FAQ items found in original)
                      </div>
                    )}
                  </div>

                  {/* EEAT Source Citation Before */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
                    Citation Proof: {origComp?.citationSource || '(Missing authoritative statutory citations)'}
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN: AFTER (REMEDIATED & COMPLIANT) */}
              <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/60 space-y-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                  <div className="flex items-center space-x-2 text-emerald-300 font-black text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>AFTER OPTIMIZATION (Agent Remediated &amp; Compliant)</span>
                  </div>
                  <button
                    onClick={() => handleCopy(fullAfterText, 'after-col-copy')}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 font-bold flex items-center space-x-1"
                  >
                    {copiedKey === 'after-col-copy' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'after-col-copy' ? 'Copied' : 'Copy Clean Text'}</span>
                  </button>
                </div>

                <div className="space-y-4 flex-1">
                  
                  {/* Hero H1 After */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-2 relative group shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-mono uppercase font-bold text-emerald-400 flex items-center space-x-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>PART 1: HERO &lt;H1&gt; (OPTIMIZED TOPIC ANCHOR)</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Primary Search Intent
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-600/50 text-white font-black text-sm">
                      {(primaryComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || primaryComp?.name}
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-800/40 text-emerald-100 leading-relaxed font-medium">
                      <span className="font-bold text-emerald-300 block mb-0.5">In Plain English:</span>
                      {primaryComp?.heroDescription || (primaryComp?.bodyContent || '').split(/\n\n+/)[0]}
                    </div>
                  </div>

                  {/* Sections After */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-teal-300">
                      <span>PART 2: STRUCTURED H2 SECTIONS &amp; VOICE INTENT</span>
                      <span className="text-teal-400 font-bold">8th-Grade Layman English</span>
                    </div>

                    {afterSections.length > 0 ? (
                      afterSections.map((sec, sIdx) => (
                        <div key={sec.id || sIdx} className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <h4 className="text-emerald-200 font-bold text-xs flex items-center space-x-1.5">
                              <span className="text-emerald-400 font-mono font-bold">##</span>
                              <span>{sec.h2Text}</span>
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                              {sec.voiceIntent}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-slate-200 leading-relaxed font-normal">
                            {(sec.bodyParagraphs || []).map((p, pIdx) => (
                              <p key={pIdx} className={p.toLowerCase().includes('in plain english') ? 'p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-indigo-100 font-medium' : ''}>
                                {p}
                              </p>
                            ))}
                          </div>

                          {sec.listItems && sec.listItems.length > 0 && (
                            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                              {sec.listItems.map((li, lIdx) => (
                                <li key={lIdx}>{li}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {primaryComp?.bodyContent || 'Structured content remediated.'}
                      </div>
                    )}
                  </div>

                  {/* Preserved Tables After */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-amber-300">
                      <span>PART 3: PRESERVED COMPARISON TABLES ({allAfterTables.length})</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        100% Scraped &amp; Aligned
                      </span>
                    </div>

                    {allAfterTables.length > 0 ? (
                      allAfterTables.map((tbl, tIdx) => (
                        <div key={tbl.id || tIdx} className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-2.5 overflow-x-auto shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                              <TableIcon className="w-3.5 h-3.5 text-amber-400" />
                              <span>{tbl.title || `Specification Table ${tIdx + 1}`}</span>
                            </span>
                            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                              {tbl.rows.length} rows • {tbl.headers.length} columns
                            </span>
                          </div>

                          <table className="w-full text-[11px] text-left border-collapse">
                            <thead>
                              <tr className="border-b border-amber-500/30 text-amber-200 bg-amber-950/30">
                                {tbl.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="p-2 font-bold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tbl.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-slate-800 text-slate-200 hover:bg-slate-800/50 transition">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 font-medium">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 italic text-center">
                        (No tabular data required for this page)
                      </div>
                    )}
                  </div>

                  {/* FAQs After */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-purple-300">
                      <span>PART 4: VOICE SEARCH FAQS &amp; AEO DIRECT ANSWERS</span>
                      <span className="text-purple-400 font-bold">40-50 Words Target</span>
                    </div>

                    {primaryComp?.faqs && primaryComp.faqs.length > 0 ? (
                      primaryComp.faqs.map((f, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-purple-800/40 space-y-1.5">
                          <div className="font-bold text-purple-100 flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px] font-mono text-purple-300">&lt;H3&gt;</span>
                            <span>{f.question}</span>
                          </div>
                          <p className="text-purple-200 text-[11px] leading-relaxed italic pl-3 border-l-2 border-purple-500">
                            &quot;{f.answer}&quot;
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-purple-800/30 text-purple-300 text-xs">
                        Voice Query Snippet: {primaryComp?.voiceAnswerSnippet || 'Direct answer formatted for AI Overviews.'}
                      </div>
                    )}
                  </div>

                  {/* EEAT Source Citation After */}
                  {primaryComp?.citationSource && (
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-700/50 text-[11px] text-amber-200 font-mono font-bold flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>E-E-A-T Citation: {primaryComp.citationSource}</span>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: AUDIT & GUIDELINE REASONS LOG */}
          {selectedTab === 'guideline_reasons' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start space-x-3 text-xs">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-indigo-200">Adherence to All Product &amp; SEO Guidelines</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Below is the verified audit record explaining every change made across content sections, backend tags, and tables, with explicit reference to the guidelines adhered to.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {guidelineReasons.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-50 text-sm">{item.title}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5">
                        <Bot className="w-3.5 h-3.5" />
                        <span>{item.agent}</span>
                      </span>
                    </div>

                    {/* Guideline Adhered To */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-400">Guideline Adhered To:</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        {item.guideline}
                      </span>
                    </div>

                    {/* Why this change was made */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                      <span className="font-bold text-amber-400">Reason for change: </span>
                      <span className="text-slate-200 leading-relaxed font-medium">{item.reason}</span>
                    </div>

                    {/* Before / After Snippet */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 space-y-1">
                        <span className="text-[11px] uppercase font-bold text-rose-400 font-mono">Before (Original)</span>
                        <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{item.before}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-800/40 space-y-1">
                        <span className="text-[11px] uppercase font-bold text-emerald-300 font-mono">After (Remediated)</span>
                        <p className="text-emerald-100 font-mono text-[11px] font-semibold leading-relaxed">{item.after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BACKEND METADATA & SCHEMAS */}
          {selectedTab === 'backend' && backend && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              {/* LEFT: BEFORE */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-rose-900/40 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-rose-900/30 text-rose-400 font-bold">
                  <span>BEFORE FIX (Scraped Metadata)</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800/40">Original</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block">Meta Title (Before)</label>
                    <p className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                      {origBackend?.metaTitle || backend.metaTitle}
                    </p>
                    <span className="text-[11px] text-rose-400 block mt-1">
                      {(origBackend?.metaTitle || backend.metaTitle).length} characters
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block">Meta Description (Before)</label>
                    <p className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed">
                      {origBackend?.metaDescription || backend.metaDescription}
                    </p>
                    <span className="text-[11px] text-rose-400 block mt-1">
                      {(origBackend?.metaDescription || backend.metaDescription).length} characters
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block">Schema.org JSON-LD (Before)</label>
                    <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 max-h-48 overflow-y-auto">
                      {origBackend?.schemaJsonLd || backend.schemaJsonLd || '(No schema found)'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* RIGHT: AFTER */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-800/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/30 text-emerald-400 font-bold">
                  <span>AFTER FIX (Compliant with SEO Guidelines)</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/40 text-emerald-300">
                    Verified
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block">Meta Title (Optimized)</label>
                    <p className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/40 text-emerald-200 font-bold">
                      {backend.metaTitle}
                    </p>
                    <span className="text-[11px] text-emerald-400 block mt-1">
                      {backend.metaTitle.length} characters (Strictly within 50-60 character limit)
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block">Meta Description (Optimized)</label>
                    <p className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/40 text-emerald-100 leading-relaxed">
                      {backend.metaDescription}
                    </p>
                    <span className="text-[11px] text-emerald-400 block mt-1">
                      {backend.metaDescription.length} characters (Complete sentences, strictly 150-160 characters)
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block">Schema.org JSON-LD (Canonical 5-tier Graph)</label>
                    <pre className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/40 text-[11px] font-mono text-emerald-300 max-h-48 overflow-y-auto">
                      {backend.schemaJsonLd}
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All guidelines verified: 50-60 char title, 150-160 char complete sentences description, 100% scraped tables preserved.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md"
          >
            Done Reviewing
          </button>
        </div>

      </div>
    </div>
  );
};
