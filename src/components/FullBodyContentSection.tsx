import React, { useState, useMemo, useEffect } from 'react';
import { safeApiPost } from '../lib/api';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  TrendingUp, 
  Mic, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  BookOpen, 
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  List as ListIcon,
  Search,
  Table as TableIcon,
  Hash,
  Edit3,
  Eye,
  Volume2
} from 'lucide-react';
import { 
  ContentComponent, 
  KeywordItem, 
  ProductGuidelines, 
  SEOGuidelines, 
  AuditFlag, 
  HeadingItem,
  FaqItem,
  SEOBackendData,
  H2SectionData
} from '../types';
import { FinalContentReaderModal } from './FinalContentReaderModal';
import { StructuredTablesViewer } from './StructuredTablesViewer';
import { sanitizeGrammarAndPunctuation } from '../utils/grammarSanitizer';

interface FullBodyContentSectionProps {
  components: ContentComponent[];
  onUpdateComponents: (updated: ContentComponent[]) => void;
  onUpdateSingleComponent?: (updated: ContentComponent) => void;
  keywords: KeywordItem[];
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  auditFlags: AuditFlag[];
  onFixSection: (componentId: string) => void;
  isFixing: boolean;
  fixingComponentId: string | null;
  onAddNewComponent?: () => void;
  onOpenCompare?: (component: ContentComponent) => void;
  onOpenH2Optimizer?: () => void;
  onNotifyToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
  backendData?: SEOBackendData;
}

export const FullBodyContentSection: React.FC<FullBodyContentSectionProps> = ({
  components,
  onUpdateComponents,
  onUpdateSingleComponent,
  keywords,
  productGuidelines,
  seoGuidelines,
  auditFlags,
  onFixSection,
  isFixing,
  fixingComponentId,
  onOpenCompare,
  onOpenH2Optimizer,
  onNotifyToast,
  backendData,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'sections' | 'reading' | 'editor'>('sections');
  const [copied, setCopied] = useState(false);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
  const [rawTextDraft, setRawTextDraft] = useState('');
  const [isOptimizingHeadings, setIsOptimizingHeadings] = useState(false);

  // Primary unified component
  const primaryComp: ContentComponent = useMemo(() => {
    if (components && components.length > 0) {
      if (components.length === 1) return components[0];

      const mergedHeadings = components.flatMap(c => c.headings || []);
      const mergedBody = components.map(c => c.bodyContent).filter(Boolean).join('\n\n');
      const mergedList = Array.from(new Set(components.flatMap(c => c.listItems || [])));
      const mergedTables = components.flatMap(c => c.tables || []);
      const mergedH2Secs = components.flatMap(c => c.h2Sections || []);
      const mergedFaqs = components.flatMap(c => c.faqs || []);
      const firstVoice = components.find(c => c.voiceAnswerSnippet)?.voiceAnswerSnippet || '';
      const firstCitation = components.find(c => c.citationSource)?.citationSource || '';
      const anyRecentlyFixed = components.some(c => c.status === 'recently_fixed');
      const anyNonCompliant = components.some(c => c.status === 'non_compliant');

      return {
        id: components[0]?.id || 'page_body_content',
        name: components[0]?.name || 'Webpage Body & Voice Copy',
        type: 'full_body_content',
        headings: mergedHeadings,
        bodyContent: mergedBody,
        h2Sections: mergedH2Secs.length > 0 ? mergedH2Secs : undefined,
        faqs: mergedFaqs.length > 0 ? mergedFaqs : undefined,
        listItems: mergedList,
        tables: mergedTables.length > 0 ? mergedTables : components[0]?.tables,
        voiceAnswerSnippet: firstVoice,
        citationSource: firstCitation,
        status: anyRecentlyFixed ? 'recently_fixed' : anyNonCompliant ? 'non_compliant' : 'compliant',
        originalSnapshot: components[0]?.originalSnapshot,
      };
    }

    return {
      id: 'page_body_content',
      name: 'Webpage Body Content',
      type: 'full_body_content',
      headings: [
        { tag: 'h1', text: 'Page Overview & Core Guidance', voiceIntent: 'Primary Search & Intent Anchor' },
      ],
      bodyContent: 'Webpage content loaded.',
      listItems: [],
      voiceAnswerSnippet: '',
      citationSource: '',
      status: 'non_compliant',
    };
  }, [components]);

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

  // Derive continuous structured sections (Strict Rule: Show H2s and content ONLY if content under that H2 has > 10 words)
  const orderedSections: H2SectionData[] = useMemo(() => {
    let rawList: H2SectionData[] = [];
    if (primaryComp.h2Sections && primaryComp.h2Sections.length > 0) {
      rawList = primaryComp.h2Sections;
    } else {
      const h2s = (primaryComp.headings || []).filter(h => h.tag?.toLowerCase() === 'h2');
      const h3s = (primaryComp.headings || []).filter(h => h.tag?.toLowerCase() === 'h3');
      const bodyParagraphs = (primaryComp.bodyContent || '').split(/\n\n+/).filter(Boolean);
      const tables = primaryComp.tables || [];
      const listItems = primaryComp.listItems || [];
      const faqs = primaryComp.faqs || [];

      if (h2s.length > 0) {
        rawList = h2s.map((h2, idx) => {
          const secH3s = h3s.slice(idx * 2, (idx + 1) * 2);
          const secParagraphs = bodyParagraphs.slice(idx + 1, idx + 2);
          const fallbackP = secParagraphs.length > 0 ? secParagraphs : [bodyParagraphs[0] || `${h2.text} details.`];
          return {
            id: `h2-sec-${idx + 1}`,
            order: idx + 1,
            h2Text: h2.text,
            originalH2Text: h2.text,
            voiceIntent: h2.voiceIntent || 'Secondary Subtopic & Semantic Scope',
            h3Headings: secH3s,
            bodyParagraphs: fallbackP,
            listItems: listItems.slice(idx * 2, (idx + 1) * 2),
            tables: tables.slice(idx, idx + 1),
            faqs: idx === h2s.length - 1 ? faqs : [],
            voiceAnswerSnippet: primaryComp.voiceAnswerSnippet || '',
            citationSource: primaryComp.citationSource || '',
            status: primaryComp.status,
          };
        });
      } else {
        rawList = [
          {
            id: 'h2-sec-1',
            order: 1,
            h2Text: 'Core Overview & Key Insights',
            originalH2Text: 'Core Overview & Key Insights',
            voiceIntent: 'Secondary Intent & Subtopic',
            h3Headings: [],
            bodyParagraphs: (primaryComp.bodyContent || '').split(/\n\n+/).filter(Boolean),
            listItems: primaryComp.listItems || [],
            tables: primaryComp.tables || [],
            faqs: primaryComp.faqs || [],
            voiceAnswerSnippet: primaryComp.voiceAnswerSnippet || '',
            citationSource: primaryComp.citationSource || '',
            status: primaryComp.status,
          }
        ];
      }
    }

    // MANDATORY USER RULE: Only show H2s and content under it if content under that H2 has > 10 words
    return rawList.filter(sec => countWordsUnderH2(sec) > 10);
  }, [primaryComp]);

  // All content audit flags
  const contentFlags = useMemo(() => {
    return (auditFlags || []).filter(f => f.target === 'component' || f.componentId || f.target !== 'backend_seo');
  }, [auditFlags]);

  const isRecentlyFixed = primaryComp.status === 'recently_fixed';
  const isCompliant = (primaryComp.status === 'compliant' || contentFlags.length === 0) && !isRecentlyFixed;
  const isNonCompliant = (contentFlags.length > 0 || primaryComp.status === 'non_compliant') && !isRecentlyFixed && !isCompliant;
  const isFixingThis = isFixing && (fixingComponentId === primaryComp.id || fixingComponentId === null);

  // Hero H1
  const heroH1 = useMemo(() => {
    const h1Obj = (primaryComp.headings || []).find(h => h.tag?.toLowerCase() === 'h1');
    return h1Obj?.text || primaryComp.name || 'Webpage Content';
  }, [primaryComp]);

  const heroDescription = useMemo(() => {
    if (primaryComp.heroDescription) return primaryComp.heroDescription;
    const body = primaryComp.bodyContent || '';
    const paragraphs = body.split(/\n\n+/).filter(Boolean);
    return paragraphs[0] || '';
  }, [primaryComp]);

  // Generate full continuous text representation for editing or copying
  const fullDocumentText = useMemo(() => {
    if (primaryComp.bodyContent && primaryComp.bodyContent.trim().length > 0) {
      return primaryComp.bodyContent;
    }

    const parts: string[] = [];
    if (heroH1) parts.push(`# ${heroH1}`);
    if (heroDescription) parts.push(heroDescription);

    orderedSections.forEach(sec => {
      parts.push(`## ${sec.h2Text}`);
      if (sec.bodyParagraphs && sec.bodyParagraphs.length > 0) {
        parts.push(sec.bodyParagraphs.join('\n\n'));
      }
      if (sec.listItems && sec.listItems.length > 0) {
        parts.push(sec.listItems.map(li => `- ${li}`).join('\n'));
      }
      (sec.h3Headings || []).forEach(h3 => {
        parts.push(`### ${h3.text}`);
      });
      (sec.tables || []).forEach(tbl => {
        const tLines: string[] = [];
        if (tbl.title) tLines.push(`### ${tbl.title}`);
        tLines.push(`| ${tbl.headers.join(' | ')} |`);
        tLines.push(`| ${tbl.headers.map(() => '---').join(' | ')} |`);
        tbl.rows.forEach((r: string[]) => {
          tLines.push(`| ${r.join(' | ')} |`);
        });
        parts.push(tLines.join('\n'));
      });
    });

    if (primaryComp.faqs && primaryComp.faqs.length > 0) {
      primaryComp.faqs.forEach(f => {
        parts.push(`### ${f.question}\n${f.answer}`);
      });
    }

    return parts.join('\n\n');
  }, [heroH1, heroDescription, primaryComp, orderedSections]);

  // Sync rawTextDraft with fullDocumentText when switching to editor mode
  useEffect(() => {
    setRawTextDraft(fullDocumentText);
  }, [fullDocumentText, viewMode]);

  // Stats
  const wordCount = useMemo(() => {
    return fullDocumentText.split(/\s+/).filter(Boolean).length;
  }, [fullDocumentText]);

  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Copy full document
  const handleCopyAll = () => {
    navigator.clipboard.writeText(fullDocumentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onNotifyToast?.('Copied full webpage text to clipboard!', 'success');
  };

  // Save manual edits in editor mode
  const handleSaveEditorChanges = () => {
    const lines = rawTextDraft.split('\n');
    let newH1 = heroH1;
    const bodyLines: string[] = [];

    lines.forEach(l => {
      const trimmed = l.trim();
      if (trimmed.startsWith('# ') && !trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
        newH1 = trimmed.slice(2).trim();
      } else {
        bodyLines.push(l);
      }
    });

    const updatedHeadings = (primaryComp.headings || []).map(h => {
      if (h.tag?.toLowerCase() === 'h1') {
        return { ...h, text: newH1 };
      }
      return h;
    });

    const updated: ContentComponent = {
      ...primaryComp,
      name: newH1,
      headings: updatedHeadings,
      bodyContent: bodyLines.join('\n').trim(),
    };

    onUpdateComponents([updated]);
    if (onUpdateSingleComponent) onUpdateSingleComponent(updated);
    setViewMode('reading');
    onNotifyToast?.('Full webpage content updated successfully!', 'success');
  };

  return (
    <div 
      id="content-section-container"
      className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-2xl ${
        isRecentlyFixed
          ? 'bg-slate-900/95 border-emerald-500/60'
          : isNonCompliant
          ? 'bg-slate-900 border-rose-500/50'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      {/* HEADER BAR */}
      <div className="p-5 sm:p-6 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        
        {/* Title & Stats */}
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl border ${
            isRecentlyFixed 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-inner'
              : isNonCompliant
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
          }`}>
            <FileText className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-50 tracking-tight">
                Full Webpage Content (Continuous Flow)
              </h2>

              {isRecentlyFixed && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center space-x-1 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Agent 7 &amp; 8 Remediated</span>
                </span>
              )}
              {isNonCompliant && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{contentFlags.length} Audit Flag(s)</span>
                </span>
              )}
              {isCompliant && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Validated</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>~{readingTimeMinutes} min read</span>
              <span>•</span>
              <span>Exact Webpage Flow</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          
          {/* View Mode Toggle: Highlighted Sections vs Continuous Flow vs Full Editor */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('sections')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === 'sections'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Highlighted Sections</span>
            </button>
            <button
              onClick={() => setViewMode('reading')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === 'reading'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Continuous Flow</span>
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                viewMode === 'editor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Full Text Editor</span>
            </button>
          </div>

          {/* Quick Copy */}
          <button
            onClick={handleCopyAll}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
            title="Copy Full Document"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Full Text'}</span>
          </button>

          {/* Quick Fix */}
          {contentFlags.length > 0 && (
            <button
              onClick={() => onFixSection(primaryComp.id)}
              disabled={isFixingThis}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-md disabled:opacity-50"
            >
              {isFixingThis ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              )}
              <span>{isFixingThis ? 'Remediating...' : 'Auto-Fix Content'}</span>
            </button>
          )}

          {/* Side-by-side Diff */}
          {primaryComp.originalSnapshot && onOpenCompare && (
            <button
              onClick={() => onOpenCompare(primaryComp)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
              title="Compare Before & After Snapshot"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Diff</span>
            </button>
          )}

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* DOCUMENT BODY */}
      {isExpanded && (
        <div className="p-6 sm:p-8 bg-slate-950/40">
          
          {viewMode === 'sections' ? (
            /* HIGHLIGHTED SECTION CARDS VIEW (WITH DISTINCT COLOR STATUSES) */
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Visual Status Legend */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Visual Status Highlights:</span>
                  <span className="text-slate-400">Post-Audit &amp; Auto-Remediation Color Codes</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/70 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-semibold">Green: Auto-Remediated &amp; Optimized (Agent 7 &amp; 8)</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/70 text-rose-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-semibold">Red: Flagged Non-Compliant</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="font-semibold">Blue/Slate: Verified Compliant</span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: HERO SECTION CARD */}
              {(() => {
                const heroFlags = contentFlags.filter(f => 
                  f.fieldName?.toLowerCase() === 'h1' || 
                  f.issueTitle.toLowerCase().includes('h1') || 
                  f.issueTitle.toLowerCase().includes('hero') || 
                  f.issueTitle.toLowerCase().includes('bluf') ||
                  f.category === 'CUSTOMER_CENTRICITY'
                );
                const isHeroOptimized = isRecentlyFixed;
                const isHeroFlagged = heroFlags.length > 0 && !isHeroOptimized;

                return (
                  <div className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl ${
                    isHeroOptimized
                      ? 'bg-emerald-950/20 border border-emerald-500/80'
                      : isHeroFlagged
                      ? 'bg-rose-950/20 border border-rose-500/80'
                      : 'bg-slate-900 border border-slate-800'
                  }`}>
                    {/* Header */}
                    <div className="p-4 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-800/60 text-indigo-400 font-mono text-xs font-bold">
                          01. HERO SECTION
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white">Hero Header &amp; BLUF Direct Value Proposition</h3>
                          {isHeroOptimized ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Optimized by Agent 7 &amp; 8 (Green Highlight)</span>
                            </span>
                          ) : isHeroFlagged ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Flagged: {heroFlags.length} Guideline Violation(s) (Red Highlight)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              ✓ Verified Compliant
                            </span>
                          )}
                        </div>
                      </div>

                      {isHeroFlagged && (
                        <button
                          onClick={() => onFixSection('hero')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 transition shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Remediate Hero</span>
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 space-y-4">
                      {isHeroOptimized && (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            <strong>Optimization Verified:</strong> Formatted primary &lt;H1&gt; with targeted search intent, eliminated forbidden superlatives, and structured plain-English BLUF summary with flawless grammar.
                          </span>
                        </div>
                      )}

                      {/* Flagged reasons if any */}
                      {isHeroFlagged && (
                        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-xs">
                          <div className="font-bold text-rose-300 flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Why this Hero Section was flagged:</span>
                          </div>
                          {heroFlags.map((hf, hfIdx) => (
                            <div key={hf.id || hfIdx} className="pl-4 border-l-2 border-rose-600/60 space-y-1">
                              <div className="font-semibold text-rose-200">
                                [{hf.guidelineSection || 'Guidelines'}] {sanitizeGrammarAndPunctuation(hf.issueTitle)}
                              </div>
                              <p className="text-slate-300 text-[11px]">
                                {sanitizeGrammarAndPunctuation(hf.whyThisSuggestionIsGiven || hf.issueDescription)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">&lt;H1&gt; Page Heading:</span>
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {sanitizeGrammarAndPunctuation(heroH1)}
                        </h1>
                      </div>

                      {heroDescription && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Hero Description &amp; Layman BLUF:</span>
                          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                            {sanitizeGrammarAndPunctuation(heroDescription)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 2+: STRUCTURED BODY H2 SECTIONS */}
              {orderedSections.map((sec, secIdx) => {
                const secFlags = contentFlags.filter(f => 
                  f.fieldName === sec.id || 
                  f.issueTitle.toLowerCase().includes(sec.h2Text.toLowerCase().slice(0, 15)) ||
                  (sec.voiceIntent && f.issueTitle.toLowerCase().includes(sec.voiceIntent.toLowerCase().slice(0, 15)))
                );
                const isSecOptimized = sec.status === 'recently_fixed' || isRecentlyFixed;
                const isSecFlagged = secFlags.length > 0 && !isSecOptimized;

                return (
                  <div
                    key={sec.id || secIdx}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl ${
                      isSecOptimized
                        ? 'bg-emerald-950/20 border border-emerald-500/80'
                        : isSecFlagged
                        ? 'bg-rose-950/20 border border-rose-500/80'
                        : 'bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {/* Section Header */}
                    <div className="p-4 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-950 border border-teal-800/60 text-teal-400 font-mono text-xs font-bold">
                          0{sec.order || secIdx + 2}. SECTION &lt;H2&gt;
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-50">
                            {sanitizeGrammarAndPunctuation(sec.h2Text)}
                          </h4>

                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                            {countWordsUnderH2(sec)} words • &gt;10 words verified
                          </span>

                          {isSecOptimized ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Optimized &amp; Remediated (Green Highlight)</span>
                            </span>
                          ) : isSecFlagged ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                              <span>Flagged: {secFlags.length} Guideline Violation(s) (Red Highlight)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              ✓ Verified Compliant
                            </span>
                          )}
                        </div>
                      </div>

                      {isSecFlagged && (
                        <button
                          onClick={() => onFixSection(sec.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 transition shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Remediate Section</span>
                        </button>
                      )}
                    </div>

                    {/* Section Body */}
                    <div className="p-5 sm:p-6 space-y-4">
                      {isSecOptimized && (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            <strong>Grammar &amp; Compliance Verified:</strong> Flawless grammatical sentence flow, zero typos, organic voice intent keywords integrated, and full regulatory disclosure preserved.
                          </span>
                        </div>
                      )}

                      {/* Flagged reasons if any */}
                      {isSecFlagged && (
                        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-xs">
                          <div className="font-bold text-rose-300 flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Why this Section was flagged across guidelines:</span>
                          </div>
                          {secFlags.map((sf, sfIdx) => (
                            <div key={sf.id || sfIdx} className="pl-4 border-l-2 border-rose-600/60 space-y-1">
                              <div className="font-semibold text-rose-200">
                                [{sf.guidelineSection || 'Guidelines'}] {sanitizeGrammarAndPunctuation(sf.issueTitle)}
                              </div>
                              <p className="text-slate-300 text-[11px]">
                                {sanitizeGrammarAndPunctuation(sf.whyThisSuggestionIsGiven || sf.issueDescription)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Paragraph copy */}
                      <div className="space-y-3 text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                        {(sec.bodyParagraphs || []).map((p, pIdx) => (
                          <p key={pIdx}>{sanitizeGrammarAndPunctuation(p)}</p>
                        ))}
                      </div>

                      {/* Lists */}
                      {sec.listItems && sec.listItems.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-300">
                            {sec.listItems.map((li, liIdx) => (
                              <li key={liIdx} className="flex items-start space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{sanitizeGrammarAndPunctuation(li)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tables */}
                      {sec.tables && sec.tables.length > 0 && (
                        <div className="pt-2">
                          <StructuredTablesViewer tables={sec.tables} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* FAQ Section Card */}
              {primaryComp.faqs && primaryComp.faqs.length > 0 && (
                <div className="rounded-2xl border bg-slate-900 border-slate-800 overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-800/60 text-purple-400 font-mono text-xs font-bold">
                        FAQ &amp; VOICE AEO
                      </span>
                      <h4 className="text-sm font-bold text-slate-50">Frequently Asked Questions &amp; Direct Answers</h4>
                    </div>
                    <span className="text-xs text-purple-300 font-medium font-mono">
                      {primaryComp.faqs.length} Questions
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    {primaryComp.faqs.map((faq, fIdx) => (
                      <div key={faq.id || fIdx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-50 flex items-center space-x-2">
                          <span className="text-purple-400 font-mono">Q{fIdx + 1}:</span>
                          <span>{sanitizeGrammarAndPunctuation(faq.question)}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed pl-6">
                          {sanitizeGrammarAndPunctuation(faq.answer)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EEAT Verification Card */}
              {primaryComp.citationSource && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between shadow-md">
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span>
                      <strong>EEAT Authority Verification Source:</strong> <em>{sanitizeGrammarAndPunctuation(primaryComp.citationSource)}</em>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-900/40 border border-indigo-700/60 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              )}

            </div>
          ) : viewMode === 'reading' ? (
            /* CLEAN CONTINUOUS DOCUMENT VIEW */
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Remediation Verified Banner */}
              {isRecentlyFixed && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4 text-amber-300 shadow-lg animate-in fade-in duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-200">
                        Content Remediation Applied &amp; Verified
                      </p>
                      <p className="text-xs text-amber-300/80 mt-0.5">
                        Structured with BLUF direct answers, full grammatical sentences, target keywords, and compliant terminology.
                      </p>
                    </div>
                  </div>
                  {onOpenCompare && (
                    <button
                      onClick={() => onOpenCompare(primaryComp)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                      <span>Compare Before vs After</span>
                    </button>
                  )}
                </div>
              )}
              
              {/* Main H1 Title */}
              <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold mb-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60 font-mono text-[11px]">H1</span>
                  <span>Primary Page Topic Anchor</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 tracking-tight leading-tight">
                  {heroH1}
                </h1>
              </div>

              {/* Introduction / BLUF Summary */}
              {heroDescription && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-base text-slate-200 leading-relaxed font-normal">
                  <p>{heroDescription}</p>
                </div>
              )}

              {/* Continuous Content Stream */}
              <div className="prose prose-invert max-w-none space-y-6 text-slate-300 text-base leading-relaxed">
                
                {primaryComp.bodyContent && (
                  <div className="space-y-4">
                    {primaryComp.bodyContent.split(/\n\n+/).map((para, pIdx) => {
                      const trimmed = para.trim();
                      if (!trimmed) return null;

                      // Headings
                      if (trimmed.startsWith('# ')) {
                        const [headingLine, ...restLines] = trimmed.split('\n');
                        const h1Text = headingLine.replace(/^#\s+/, '').replace(/\*\*/g, '').trim();
                        const restText = restLines.join('\n').trim();
                        return (
                          <div key={pIdx} className="pt-2 space-y-2">
                            {(!heroH1 || h1Text.toLowerCase() !== heroH1.toLowerCase()) && (
                              <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight mb-2">
                                {h1Text}
                              </h1>
                            )}
                            {restText && (
                              <p className="text-slate-300 leading-relaxed font-normal">
                                {restText}
                              </p>
                            )}
                          </div>
                        );
                      }
                      if (trimmed.startsWith('## ')) {
                        const [headingLine, ...restLines] = trimmed.split('\n');
                        const h2Text = headingLine.replace(/^##\s+/, '').replace(/\*\*/g, '').trim();
                        const restText = restLines.join('\n').trim();
                        return (
                          <div key={pIdx} className="pt-4 border-t border-slate-800/60 space-y-2">
                            <div className="flex items-center space-x-2 text-xs text-teal-400 font-semibold mb-1">
                              <span className="px-2 py-0.5 rounded bg-teal-950/80 border border-teal-800/60 font-mono text-[11px]">H2</span>
                              <span>Sequential Subtopic</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-50 tracking-tight mb-2">
                              {h2Text}
                            </h2>
                            {restText && (
                              <p className="text-slate-300 leading-relaxed font-normal">
                                {restText}
                              </p>
                            )}
                          </div>
                        );
                      }
                      if (trimmed.startsWith('### ')) {
                        const [headingLine, ...restLines] = trimmed.split('\n');
                        const h3Text = headingLine.replace(/^###\s+/, '').replace(/\*\*/g, '').trim();
                        const restText = restLines.join('\n').trim();
                        const isVoiceQ = h3Text.includes('?') || /^(how|what|why|can|is|are|will|where|when|which|who|does|do|should|could)\b/i.test(h3Text);
                        return (
                          <div key={pIdx} className="pt-2 space-y-2">
                            <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold mb-1">
                              <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60 font-mono text-[11px]">
                                {isVoiceQ ? 'FAQ / H3' : 'H3'}
                              </span>
                              <span>{isVoiceQ ? 'Voice Query / FAQ Question' : 'Secondary Subtopic / Query'}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-100 mb-2">
                              {h3Text}
                            </h3>
                            {restText && (
                              <p className="text-slate-300 leading-relaxed font-normal">
                                {restText}
                              </p>
                            )}
                          </div>
                        );
                      }
                      if (trimmed.startsWith('#### ')) {
                        const [headingLine, ...restLines] = trimmed.split('\n');
                        const h4Text = headingLine.replace(/^####\s+/, '').replace(/\*\*/g, '').trim();
                        const restText = restLines.join('\n').trim();
                        return (
                          <div key={pIdx} className="pt-1 space-y-2">
                            <h4 className="text-base font-semibold text-slate-200 mb-1.5">
                              {h4Text}
                            </h4>
                            {restText && (
                              <p className="text-slate-300 leading-relaxed font-normal">
                                {restText}
                              </p>
                            )}
                          </div>
                        );
                      }

                      // Inline Markdown Table
                      if (trimmed.startsWith('|') && trimmed.includes('---')) {
                        const lines = trimmed.split('\n').filter(l => l.trim().startsWith('|'));
                        if (lines.length >= 2) {
                          const headers = lines[0].split('|').slice(1, -1).map(h => h.trim());
                          const sepIdx = lines.findIndex(l => l.includes('---'));
                          const bodyLines = sepIdx >= 0 ? lines.slice(sepIdx + 1) : lines.slice(1);
                          const rows = bodyLines.map(line => line.split('|').slice(1, -1).map(c => c.trim()));

                          return (
                            <div key={pIdx} className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4 my-4 shadow-sm">
                              <div className="flex items-center space-x-2 mb-3 text-xs font-semibold text-cyan-400">
                                <TableIcon className="w-4 h-4" />
                                <span>Comparison &amp; Data Table (In-Page Position)</span>
                              </div>
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-700 bg-slate-800/80">
                                    {headers.map((h, hIdx) => (
                                      <th key={hIdx} className="p-2.5 font-bold text-slate-200">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((r, rIdx) => (
                                    <tr key={rIdx} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                                      {r.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-2.5 text-slate-300">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                      }

                      // Bullet points
                      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        const items = trimmed.split('\n').map(item => item.replace(/^[-*]\s+/, '').trim()).filter(Boolean);
                        return (
                          <ul key={pIdx} className="list-disc pl-6 space-y-2 text-slate-300">
                            {items.map((it, itIdx) => (
                              <li key={itIdx}>{it}</li>
                            ))}
                          </ul>
                        );
                      }

                      // Numbered lists
                      if (/^\d+\.\s+/.test(trimmed)) {
                        const items = trimmed.split('\n').map(item => item.replace(/^\d+\.\s+/, '').trim()).filter(Boolean);
                        return (
                          <ol key={pIdx} className="list-decimal pl-6 space-y-2 text-slate-300">
                            {items.map((it, itIdx) => (
                              <li key={itIdx}>{it}</li>
                            ))}
                          </ol>
                        );
                      }

                      // Blockquote
                      if (trimmed.startsWith('> ')) {
                        const quoteText = trimmed.replace(/^>\s+/, '');
                        return (
                          <blockquote key={pIdx} className="pl-4 py-2 border-l-4 border-indigo-500 bg-slate-900/60 rounded-r-xl text-slate-200 italic">
                            {quoteText}
                          </blockquote>
                        );
                      }

                      // Standard Paragraph
                      return (
                        <p key={pIdx} className="text-slate-300 leading-relaxed font-normal">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>
          ) : (
            /* FULL RAW/MARKDOWN TEXT EDITOR VIEW */
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Edit entire webpage content stream in continuous markdown/plain text:</span>
                <span className="font-mono">{rawTextDraft.length} characters</span>
              </div>

              <textarea
                value={rawTextDraft}
                onChange={(e) => setRawTextDraft(e.target.value)}
                rows={22}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-sm leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-y"
                placeholder="Full page content stream..."
              />

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setViewMode('reading')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditorChanges}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply All Changes</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Reader Modal */}
      {isReaderModalOpen && (
        <FinalContentReaderModal
          isOpen={isReaderModalOpen}
          onClose={() => setIsReaderModalOpen(false)}
          component={primaryComp}
          allComponents={components}
          backendData={backendData}
        />
      )}
    </div>
  );
};
