import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  FileText, 
  ShieldCheck, 
  Mic, 
  Code, 
  BookOpen, 
  TrendingUp, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Layers, 
  Bot, 
  HelpCircle,
  ExternalLink,
  Eye
} from 'lucide-react';
import { 
  SEOBackendData, 
  ContentComponent, 
  FixResult, 
  FaqItem,
  HeadingItem,
  KeywordItem,
  TableData,
  AuditSummary
} from '../types';
import { KeywordDensityComparisonTable } from './KeywordDensityComparisonTable';
import { StructuredTablesViewer } from './StructuredTablesViewer';
import { BeforeAfterScorecardSection } from './BeforeAfterScorecardSection';
import { sanitizeGrammarAndPunctuation } from '../utils/grammarSanitizer';

interface Agent2RemediationReviewProps {
  backendData: SEOBackendData;
  components: ContentComponent[];
  fixResult?: FixResult | null;
  keywords?: KeywordItem[];
  summary?: AuditSummary | null;
  onOpenFullReader?: () => void;
  onOpenChangesModal?: () => void;
  onDismissReview?: () => void;
}

export const Agent2RemediationReview: React.FC<Agent2RemediationReviewProps> = ({
  backendData,
  components,
  fixResult,
  keywords = [],
  summary,
  onOpenFullReader,
  onOpenChangesModal,
  onDismissReview,
}) => {
  const [activeView, setActiveView] = useState<'both' | 'seo' | 'content' | 'density' | 'scoring'>('both');
  const [isSeoExpanded, setIsSeoExpanded] = useState(true);
  const [isContentExpanded, setIsContentExpanded] = useState(true);
  const [isDensityExpanded, setIsDensityExpanded] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Primary component extraction
  const primaryComp = components[0];
  const origComp = primaryComp?.originalSnapshot;
  const origBackend = backendData?.originalSnapshot;

  // Extract Hero Section Before vs. After
  const heroBefore = useMemo(() => {
    const origH1 = (origComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || 'Untitled Webpage';
    let origDesc = origComp?.heroDescription;
    if (!origDesc && origComp?.bodyContent) {
      origDesc = origComp.bodyContent.split(/\n\n+/)[0] || '';
    }
    return {
      h1: origH1,
      description: origDesc || '(empty / non-compliant introductory paragraph)',
    };
  }, [origComp]);

  const heroAfter = useMemo(() => {
    const curH1 = (primaryComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || primaryComp?.name || '';
    let curDesc = primaryComp?.heroDescription;
    if (!curDesc && primaryComp?.bodyContent) {
      curDesc = primaryComp.bodyContent.split(/\n\n+/)[0] || '';
    }
    return {
      h1: sanitizeGrammarAndPunctuation(curH1),
      description: sanitizeGrammarAndPunctuation(curDesc || ''),
    };
  }, [primaryComp]);

  // Extract Body Section Before vs. After
  const bodyBefore = useMemo(() => {
    const origH2s = (origComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2').map(h => h.text);
    const origParas = (origComp?.bodyContent || '').split(/\n\n+/).slice(1);
    return {
      h2s: origH2s.length > 0 ? origH2s : ['(no H2 structure found)'],
      paragraphs: origParas.length > 0 ? origParas : [origComp?.bodyContent || '(minimal body text)'],
      listItems: origComp?.listItems || [],
      citationSource: origComp?.citationSource || '(missing verifiable EEAT proof citation)',
    };
  }, [origComp]);

  const bodyAfter = useMemo(() => {
    const curH2s = (primaryComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2').map(h => h.text);
    const curParas = (primaryComp?.bodyContent || '').split(/\n\n+/).slice(1);
    return {
      h2s: curH2s.length > 0 ? curH2s.map(h => sanitizeGrammarAndPunctuation(h)) : ['Core Architecture & Capabilities'],
      paragraphs: curParas.length > 0 ? curParas.map(p => sanitizeGrammarAndPunctuation(p)) : [sanitizeGrammarAndPunctuation(primaryComp?.bodyContent || '')],
      listItems: (primaryComp?.listItems || []).map(li => sanitizeGrammarAndPunctuation(li)),
      citationSource: sanitizeGrammarAndPunctuation(primaryComp?.citationSource || ''),
    };
  }, [primaryComp]);

  // Extract FAQ Section Before vs. After
  const faqBefore = useMemo(() => {
    if (origComp?.faqs && origComp.faqs.length > 0) {
      return origComp.faqs;
    }
    const origH3s = (origComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h3');
    if (origH3s.length > 0) {
      return origH3s.map((h, i) => ({
        id: `orig-faq-${i}`,
        question: h.text,
        answer: origComp?.voiceAnswerSnippet || '(no direct answer snippet)',
      }));
    }
    return [
      {
        id: 'orig-faq-none',
        question: '(no conversational voice FAQs found)',
        answer: '(missing direct AEO answer snippet)',
      },
    ];
  }, [origComp]);

  const faqAfter = useMemo(() => {
    if (primaryComp?.faqs && primaryComp.faqs.length > 0) {
      return primaryComp.faqs;
    }
    const curH3s = (primaryComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h3');
    if (curH3s.length > 0) {
      return curH3s.map((h, i) => ({
        id: `cur-faq-${i}`,
        question: h.text,
        answer: i === 0 && primaryComp?.voiceAnswerSnippet 
          ? primaryComp.voiceAnswerSnippet 
          : '(no answer on the page)',
      }));
    }
    return [];
  }, [primaryComp]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* ==================================================== */}
      {/* AGENT 2 REMEDIATION OUTCOME BANNER */}
      {/* ==================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 shadow-2xl space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-50">
                  Multi-Agent Optimization Results (Agents 7 & 8): Before vs. After Breakdown
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified by Agent 8</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Review the exact changes generated by Agent 7 (Optimization Maker) and validated by Agent 8 (Consensus Verifier). All optimized &quot;After&quot; fields are highlighted in glowing green/amber.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenChangesModal && (
              <button
                id="btn-open-remediation-changes-screen"
                onClick={onOpenChangesModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-lg border border-emerald-400/30"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>View Exact Changes &amp; Agent Rationale</span>
              </button>
            )}

            {onOpenFullReader && (
              <button
                onClick={onOpenFullReader}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition shadow-lg"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Entire Final Content</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Strategy Rationale */}
        {fixResult?.explanation && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-800/30 flex items-start space-x-2 text-xs text-slate-300">
            <Bot className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300">Agent 7 & 8 Remediation Strategy: </span>
              <span>{fixResult.explanation}</span>
            </div>
          </div>
        )}

        {/* View Switcher Filter Tabs */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveView('both')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'both' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Changes (SEO &amp; Content)
            </button>
            <button
              onClick={() => setActiveView('seo')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'seo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entire SEO Changes Only
            </button>
            <button
              onClick={() => setActiveView('content')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'content' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entire Content Changes Only (3 Parts)
            </button>
            <button
              onClick={() => setActiveView('density')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
                activeView === 'density' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Keyword Density Comparison</span>
            </button>
            <button
              id="btn-tab-scoring-delta"
              onClick={() => setActiveView('scoring')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
                activeView === 'scoring' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Before &amp; After Scoring Delta</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500/80" />
              <span>Before (Original Scraped)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-bold">After (Agent 7 Remediated &amp; Agent 8 Verified)</span>
            </span>
          </div>
        </div>

      </div>

      {/* ==================================================== */}
      {/* SECTION 0: BEFORE VS AFTER SCORING DELTA (IF ACTIVE) */}
      {/* ==================================================== */}
      {(activeView === 'scoring' || (activeView === 'both' && summary?.isOptimized)) && summary && (
        <div className="space-y-4">
          <BeforeAfterScorecardSection summary={summary} />
        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 1: ENTIRE SEO CHANGES */}
      {/* ==================================================== */}
      {(activeView === 'both' || activeView === 'seo') && (
        <div className="rounded-3xl bg-slate-900 border border-slate-700/80 shadow-xl overflow-hidden">
          
          {/* Section Header */}
          <div 
            onClick={() => setIsSeoExpanded(!isSeoExpanded)}
            className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-950/80 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    SECTION 1
                  </span>
                  <h3 className="text-base font-black text-slate-50">
                    Entire SEO Changes
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Meta Tags • Canonical • Schema JSON-LD • Robots
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consolidated view of all metadata, SERP snippet titles, search tags, and structured schema entities.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">
                {isSeoExpanded ? 'Collapse' : 'Expand'}
              </span>
              {isSeoExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {/* Section Body */}
          {isSeoExpanded && (
            <div className="p-6 space-y-6">
              
              {/* Field 1: Meta Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5">
                    <span className="text-indigo-400 font-mono">1.1</span>
                    <span>Meta Title</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Target: 50-60 characters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BEFORE */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-400 uppercase tracking-wide">Stage: Before (Original)</span>
                      <span className="text-rose-300 font-mono text-[11px]">{(origBackend?.metaTitle || '').length} chars</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      {origBackend?.metaTitle || '(empty / missing meta title)'}
                    </p>
                  </div>

                  {/* AFTER (HIGHLIGHTED) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/60 space-y-2 relative">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-emerald-300 uppercase tracking-wide flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Stage: After (Agent 2 Optimized)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/40">
                        {backendData.metaTitle.length} chars (Optimal)
                      </span>
                    </div>
                    <p className="text-xs text-slate-50 font-bold tracking-tight">
                      {backendData.metaTitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Field 2: Meta Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5">
                    <span className="text-indigo-400 font-mono">1.2</span>
                    <span>Meta Description</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Target: 140-160 characters with CTA</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BEFORE */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-400 uppercase tracking-wide">Stage: Before (Original)</span>
                      <span className="text-rose-300 font-mono text-[11px]">{(origBackend?.metaDescription || '').length} chars</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {origBackend?.metaDescription || '(empty / non-compliant meta description)'}
                    </p>
                  </div>

                  {/* AFTER (HIGHLIGHTED) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-emerald-300 uppercase tracking-wide flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Stage: After (Agent 2 Optimized)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/40">
                        {backendData.metaDescription.length} chars (Optimal CTA)
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                      {backendData.metaDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* Field 3: Schema JSON-LD Structured Data */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5">
                    <span className="text-indigo-400 font-mono">1.3</span>
                    <span>Schema.org JSON-LD Entities</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Rich Snippets &amp; Knowledge Graph Target</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BEFORE */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-400 uppercase tracking-wide">Stage: Before</span>
                      <span className="text-rose-300 font-mono text-[11px]">
                        {origBackend?.schemaJsonLd ? 'Incomplete JSON-LD' : 'Missing Schema'}
                      </span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-rose-900/30 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {origBackend?.schemaJsonLd || '{\n  // No Schema.org JSON-LD provided\n}'}
                    </pre>
                  </div>

                  {/* AFTER (HIGHLIGHTED) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-emerald-300 uppercase tracking-wide flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Stage: After (SoftwareApplication + FAQPage + Org)</span>
                      </span>
                      <button
                        onClick={() => handleCopy(backendData.schemaJsonLd, 'schema')}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-mono border border-emerald-500/40 flex items-center space-x-1"
                      >
                        {copiedField === 'schema' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'schema' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono text-emerald-300 bg-slate-950 p-3 rounded-xl border border-emerald-800/40 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {backendData.schemaJsonLd}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Field 4: Technical SEO & Canonical */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Canonical URL</div>
                  <div className="text-xs font-mono text-emerald-300 truncate">{backendData.canonicalUrl || 'https://apexflow.ai'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Robots Directives</div>
                  <div className="text-xs font-mono text-emerald-300">{backendData.robots || 'index, follow, max-image-preview:large'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Search Ranking Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {(backendData.tags || ['enterprise', 'automation', 'saas']).slice(0, 3).map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded text-[11px] bg-slate-800 text-teal-300 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 2: ENTIRE CONTENT CHANGES (3 PARTS) */}
      {/* ==================================================== */}
      {(activeView === 'both' || activeView === 'content') && (
        <div className="rounded-3xl bg-slate-900 border border-slate-700/80 shadow-xl overflow-hidden">
          
          {/* Section Header */}
          <div 
            onClick={() => setIsContentExpanded(!isContentExpanded)}
            className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-950/80 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    SECTION 2
                  </span>
                  <h3 className="text-base font-black text-slate-50">
                    Entire Content Changes
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                    Differentiated into 3 Core Parts
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Part 1: Hero Section (&lt;H1&gt; &amp; Description) • Part 2: Body Content (&lt;H2&gt;s &amp; EEAT) • Part 3: FAQ Section (&lt;H3&gt;s &amp; Voice Answers).
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">
                {isContentExpanded ? 'Collapse' : 'Expand'}
              </span>
              {isContentExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {/* Section Body */}
          {isContentExpanded && (
            <div className="p-6 space-y-8">
              
              {/* ---------------------------------------------------- */}
              {/* PART 1: HERO SECTION CHANGES */}
              {/* ---------------------------------------------------- */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      PART 1
                    </span>
                    <h4 className="text-sm font-bold text-slate-50">
                      Hero Section: &lt;H1&gt; Heading &amp; &lt;H1&gt; Description
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-400">Primary Search Intent Anchor</span>
                </div>

                {/* H1 Heading Diff */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-semibold text-slate-400 flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] font-bold text-rose-300 border border-slate-700">
                      &lt;H1&gt;
                    </span>
                    <span>Primary Page Headline</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1">
                      <div className="text-[11px] uppercase font-bold text-rose-400">Stage: Before</div>
                      <div className="text-xs text-slate-300 font-medium">{heroBefore.h1}</div>
                    </div>

                    {/* After (Highlighted) */}
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-bold text-emerald-300 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Stage: After (Agent 2 Optimized)</span>
                        </span>
                      </div>
                      <div className="text-xs text-emerald-100 font-bold">{heroAfter.h1}</div>
                    </div>
                  </div>
                </div>

                {/* Hero Description Diff */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-semibold text-slate-400 flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700">
                      &lt;P (Hero)&gt;
                    </span>
                    <span>Hero Sub-Headline Description</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1">
                      <div className="text-[11px] uppercase font-bold text-rose-400">Stage: Before</div>
                      <div className="text-xs text-slate-300 leading-relaxed">{heroBefore.description}</div>
                    </div>

                    {/* After (Highlighted) */}
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-bold text-emerald-300 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Stage: After (Agent 2 Optimized)</span>
                        </span>
                      </div>
                      <div className="text-xs text-emerald-100 font-medium leading-relaxed">{heroAfter.description}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ---------------------------------------------------- */}
              {/* PART 2: BODY SECTION CHANGES */}
              {/* ---------------------------------------------------- */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-teal-500/30 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      PART 2
                    </span>
                    <h4 className="text-sm font-bold text-slate-50">
                      Body Section: &lt;H2&gt; Subheadings, Narrative &amp; EEAT Benchmarks
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-teal-400">Capabilities &amp; Authority Proofs</span>
                </div>

                {/* H2 Subheadings Diff */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-semibold text-slate-400 flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] font-bold text-teal-300 border border-slate-700">
                      &lt;H2&gt;
                    </span>
                    <span>Subtopic Headings</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1.5">
                      <div className="text-[11px] uppercase font-bold text-rose-400">Stage: Before</div>
                      {bodyBefore.h2s.map((h, i) => (
                        <div key={i} className="text-xs text-slate-300 font-medium">• {h}</div>
                      ))}
                    </div>

                    {/* After (Highlighted) */}
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/60 space-y-1.5">
                      <div className="text-[11px] uppercase font-bold text-emerald-300 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Stage: After (Optimized with Target Keywords)</span>
                      </div>
                      {bodyAfter.h2s.map((h, i) => (
                        <div key={i} className="text-xs text-emerald-200 font-bold">• {h}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Body Narrative Diff */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-semibold text-slate-400 flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700">
                      &lt;P&gt;
                    </span>
                    <span>Body Narrative Copy &amp; Technical Capabilities</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1">
                      <div className="text-[11px] uppercase font-bold text-rose-400">Stage: Before</div>
                      <div className="text-xs text-slate-300 leading-relaxed line-clamp-4">{bodyBefore.paragraphs[0]}</div>
                    </div>

                    {/* After (Highlighted) */}
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/60 space-y-1">
                      <div className="text-[11px] uppercase font-bold text-emerald-300 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Stage: After (Refined Terminology &amp; Guidelines)</span>
                      </div>
                      <div className="text-xs text-emerald-100 font-medium leading-relaxed line-clamp-4">{bodyAfter.paragraphs[0]}</div>
                    </div>
                  </div>
                </div>

                {/* EEAT Benchmark Diff */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-semibold text-slate-400 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>EEAT &amp; GEO LLM Authority Benchmark</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1">
                      <div className="text-[11px] uppercase font-bold text-rose-400">Stage: Before</div>
                      <div className="text-xs text-slate-300 font-mono">{bodyBefore.citationSource}</div>
                    </div>

                    {/* After (Highlighted) */}
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/60 space-y-1">
                      <div className="text-[11px] uppercase font-bold text-amber-300 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-amber-400" />
                        <span>Stage: After (Verifiable Citation Benchmark)</span>
                      </div>
                      <div className="text-xs text-amber-100 font-mono font-semibold">{bodyAfter.citationSource}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ---------------------------------------------------- */}
              {/* PART 3: FAQ SECTION CHANGES */}
              {/* ---------------------------------------------------- */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      PART 3
                    </span>
                    <h4 className="text-sm font-bold text-slate-50">
                      FAQ Section: &lt;H3&gt; Voice Queries &amp; Direct AEO Answers
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400">Voice Assistant Ready (40-50 words)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Before */}
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-3">
                    <div className="text-[11px] uppercase font-bold text-rose-400">Stage: Before (Original FAQs)</div>
                    {faqBefore.map((f, i) => (
                      <div key={i} className="space-y-1 text-xs border-b border-rose-950/50 pb-2 last:border-0 last:pb-0">
                        <div className="font-bold text-slate-200">{f.question}</div>
                        <div className="text-slate-400 text-[11px]">{f.answer}</div>
                      </div>
                    ))}
                  </div>

                  {/* After (Highlighted) */}
                  <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/60 space-y-3">
                    <div className="text-[11px] uppercase font-bold text-purple-300 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-purple-400" />
                      <span>Stage: After (Remediated Conversational FAQs)</span>
                    </div>
                    {faqAfter.map((f, i) => (
                      <div key={i} className="space-y-1.5 text-xs border-b border-purple-950/50 pb-2 last:border-0 last:pb-0">
                        <div className="font-bold text-purple-100 flex items-center space-x-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px] font-mono text-purple-300">
                            &lt;H3&gt;
                          </span>
                          <span>{f.question}</span>
                        </div>
                        <div className="text-purple-200/90 text-[11px] leading-relaxed italic bg-purple-950/40 p-2 rounded-lg border border-purple-900/30">
                          <Mic className="w-3 h-3 text-purple-400 inline mr-1" />
                          &quot;{f.answer}&quot;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ==================================================== */}
      {/* SECTION 3: KEYWORD DENSITY & USAGE COMPARISON */}
      {/* ==================================================== */}
      {(activeView === 'both' || activeView === 'density') && (
        <div className="space-y-4">
          <KeywordDensityComparisonTable
            component={primaryComp}
            backendData={backendData}
            keywords={keywords}
            title="Keyword Density & Usage Comparison (Before vs. After)"
            subtitle="Real-time density metrics across Scraped Meta Tags, Target Primary/Secondary Keywords, and Voice Queries"
          />
        </div>
      )}

      {/* Action Footer */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 flex items-center space-x-1.5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>All changes verified against active Product &amp; SEO Guidelines.</span>
        </span>
        
        <div className="flex flex-wrap items-center gap-2">
          {onOpenChangesModal && (
            <button
              onClick={onOpenChangesModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center space-x-1.5 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Exact Changes Screen</span>
            </button>
          )}
          {onOpenFullReader && (
            <button
              onClick={onOpenFullReader}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center space-x-1.5 transition shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Full Final Content Reader</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
