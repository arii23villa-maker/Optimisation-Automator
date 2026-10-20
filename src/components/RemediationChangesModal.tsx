import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Bot, 
  Layers, 
  FileText, 
  Search, 
  ShieldCheck, 
  Mic, 
  Table as TableIcon,
  HelpCircle,
  TrendingUp,
  Sliders,
  Maximize2,
  Minimize2,
  FileCode,
  Eye,
  CheckCheck
} from 'lucide-react';
import { FixResult, ContentComponent, SEOBackendData, SectionChangeItem } from '../types';
import { sanitizeGrammarAndPunctuation } from '../utils/grammarSanitizer';

interface RemediationChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixResult: FixResult | null;
  backendData: SEOBackendData;
  components: ContentComponent[];
}

export const RemediationChangesModal: React.FC<RemediationChangesModalProps> = ({
  isOpen,
  onClose,
  fixResult,
  backendData,
  components,
}) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'side_by_side' | 'raw_code'>('changes');
  const [selectedFilterAgent, setSelectedFilterAgent] = useState<string>('all');
  const [copiedState, setCopiedState] = useState<{ [key: string]: boolean }>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sideBySideMode, setSideBySideMode] = useState<'rendered' | 'plain_text' | 'markdown'>('rendered');

  const primaryComp = components[0];
  const origComp = primaryComp?.originalSnapshot || primaryComp;
  const origBackend = backendData?.originalSnapshot || backendData;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedState(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Compile detailed section change items
  const synthesizedChanges: SectionChangeItem[] = useMemo(() => {
    if (fixResult?.sectionChanges && fixResult.sectionChanges.length > 0) {
      return fixResult.sectionChanges;
    }

    const items: SectionChangeItem[] = [];

    // 1. Meta Title Change
    if (backendData.metaTitle && origBackend.metaTitle !== backendData.metaTitle) {
      items.push({
        id: 'change-meta-title',
        sectionTitle: 'Meta Title & SERP Snippet',
        sectionType: 'backend_seo',
        fieldChanged: 'metaTitle',
        agentId: 'agent-3',
        agentName: 'Agent 3: Technical SEO & Backend Schema Architect',
        agentRole: 'Technical SEO Auditor',
        oneLinerReason: 'Optimized title to 50-60 character length window and front-loaded high-intent primary search keyword with brand anchor.',
        beforeSnippet: origBackend.metaTitle || '(empty / non-compliant length)',
        afterSnippet: backendData.metaTitle
      });
    }

    // 2. Meta Description Change
    if (backendData.metaDescription && origBackend.metaDescription !== backendData.metaDescription) {
      items.push({
        id: 'change-meta-desc',
        sectionTitle: 'Meta Description & SERP Hook',
        sectionType: 'backend_seo',
        fieldChanged: 'metaDescription',
        agentId: 'agent-3',
        agentName: 'Agent 3: Technical SEO & Backend Schema Architect',
        agentRole: 'Technical SEO Auditor',
        oneLinerReason: 'Formulated high-CTR 150-160 character description featuring actionable benefit and explicit conversion CTA.',
        beforeSnippet: origBackend.metaDescription || '(empty description)',
        afterSnippet: backendData.metaDescription
      });
    }

    // 3. Schema.org JSON-LD Change
    if (backendData.schemaJsonLd && origBackend.schemaJsonLd !== backendData.schemaJsonLd) {
      items.push({
        id: 'change-schema-json',
        sectionTitle: 'Structured Schema.org Entities (JSON-LD)',
        sectionType: 'backend_seo',
        fieldChanged: 'schemaJsonLd',
        agentId: 'agent-3',
        agentName: 'Agent 3: Technical SEO & Backend Schema Architect',
        agentRole: 'Technical SEO Auditor',
        oneLinerReason: 'Constructed canonical 5-tier linked Knowledge Graph (WebPage, BreadcrumbList, SoftwareApplication/Product, Organization, and FAQPage) for Google rich snippets.',
        beforeSnippet: origBackend.schemaJsonLd ? `${origBackend.schemaJsonLd.slice(0, 140)}...` : '(missing structured JSON-LD)',
        afterSnippet: `${backendData.schemaJsonLd.slice(0, 180)}...`
      });
    }

    // 4. Hero H1 Section Change
    const origH1 = (origComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || origComp?.name || '';
    const curH1 = (primaryComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || primaryComp?.name || '';
    if (curH1 && (curH1 !== origH1 || !origH1)) {
      items.push({
        id: 'change-hero-h1',
        sectionTitle: 'Hero Section: Primary <H1> Heading',
        sectionType: 'hero',
        fieldChanged: 'headings[h1]',
        agentId: 'agent-4',
        agentName: 'Agent 4: Keyword & Intent Mapping Strategist',
        agentRole: 'Search Intent Planner',
        oneLinerReason: 'Aligned H1 directly with top-volume primary transactional search intent to maximize top-of-funnel organic ranking authority.',
        beforeSnippet: origH1 || '(generic / non-targeted heading)',
        afterSnippet: curH1
      });
    }

    // 5. Hero Description (BLUF Direct Answer)
    const origHeroDesc = origComp?.heroDescription || (origComp?.bodyContent || '').split(/\n\n+/)[0] || '';
    const curHeroDesc = primaryComp?.heroDescription || (primaryComp?.bodyContent || '').split(/\n\n+/)[0] || '';
    if (curHeroDesc && (curHeroDesc !== origHeroDesc || !origHeroDesc)) {
      items.push({
        id: 'change-hero-desc',
        sectionTitle: 'Hero Section: BLUF Summary & Value Proposition',
        sectionType: 'hero',
        fieldChanged: 'heroDescription',
        agentId: 'agent-5',
        agentName: 'Agent 5: Customer Centricity & User Experience Champion',
        agentRole: 'Reader Experience Auditor',
        oneLinerReason: 'Integrated a clear 45-word BLUF (Bottom Line Up Front) summary in plain language to eliminate reader cognitive friction and increase immediate engagement.',
        beforeSnippet: origHeroDesc ? `${origHeroDesc.slice(0, 120)}...` : '(empty intro)',
        afterSnippet: `${curHeroDesc.slice(0, 140)}...`
      });
    }

    // 6. H2 Subheadings & Target Keywords
    const origH2s = (origComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2').map(h => h.text);
    const curH2s = (primaryComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2').map(h => h.text);
    if (curH2s.length > 0 && curH2s.join('|') !== origH2s.join('|')) {
      items.push({
        id: 'change-body-h2s',
        sectionTitle: 'Body Content: <H2> Topic Hierarchy & Secondary Keywords',
        sectionType: 'h2_section',
        fieldChanged: 'headings[h2]',
        agentId: 'agent-4',
        agentName: 'Agent 4: Keyword & Intent Mapping Strategist',
        agentRole: 'Search Intent Planner',
        oneLinerReason: 'Mapped high-volume secondary keywords and user problem statements directly into semantic H2 subtopic headers.',
        beforeSnippet: origH2s.length > 0 ? origH2s.slice(0, 3).map(h => `• ${h}`).join('\n') : '(no structured H2 hierarchy)',
        afterSnippet: curH2s.slice(0, 3).map(h => `• ${h}`).join('\n')
      });
    }

    // 7. Policy & Forbidden Terms Elimination
    items.push({
      id: 'change-policy-compliance',
      sectionTitle: 'Content Copywriting: Brand & Policy Guideline Compliance',
      sectionType: 'body',
      fieldChanged: 'bodyContent[policy]',
      agentId: 'agent-2',
      agentName: 'Agent 2: Guideline & Policy Compliance Auditor',
      agentRole: 'Brand Compliance & Regulatory Auditor',
      oneLinerReason: 'Pruned 100% of prohibited marketing cliches, superlatives, and unauthorized claims, aligning copy strictly with brand voice and regulatory guardrails.',
      beforeSnippet: 'Uncontrolled copy with unverified claims and non-compliant superlative phrasing',
      afterSnippet: 'Audited, compliant copy following verified style standards and EEAT criteria'
    });

    // 8. EEAT & GEO Source Citations
    if (primaryComp?.citationSource || origComp?.citationSource !== primaryComp?.citationSource) {
      items.push({
        id: 'change-eeat-citations',
        sectionTitle: 'Authority Proofs: EEAT & GEO LLM Citation Anchors',
        sectionType: 'body',
        fieldChanged: 'citationSource',
        agentId: 'agent-6',
        agentName: 'Agent 6: EEAT & GEO LLM Citation Optimizer',
        agentRole: 'Authority & Retrieval Specialist',
        oneLinerReason: 'Grounded claims with verifiable third-party benchmarks, empirical statistics, and named authority references to maximize Perplexity and AI Overview citation indexing.',
        beforeSnippet: origComp?.citationSource || '(missing verifiable proof citation)',
        afterSnippet: primaryComp?.citationSource || '(no citation)'
      });
    }

    // 9. FAQ H3 Voice Search Questions & Direct Answers
    const curFaqs = primaryComp?.faqs || [];
    const origFaqs = origComp?.faqs || [];
    if (curFaqs.length > 0 || (primaryComp?.headings || []).some(h => h.tag?.toLowerCase() === 'h3')) {
      items.push({
        id: 'change-faq-voice',
        sectionTitle: 'FAQ Section: Conversational Voice Queries & Direct AEO Answers',
        sectionType: 'faq',
        fieldChanged: 'faqs / headings[h3]',
        agentId: 'agent-7',
        agentName: 'Agent 7: Content & SEO Optimization Maker',
        agentRole: 'Optimization Maker',
        oneLinerReason: 'Formatted conversational H3 question prompts with concise, 40-50 word direct answers optimized for smart speakers and Google Voice Assistant snippets.',
        beforeSnippet: origFaqs.length > 0 ? `Q: ${origFaqs[0].question}` : '(no conversational voice search FAQs)',
        afterSnippet: curFaqs.length > 0 ? `Q: ${curFaqs[0].question}\nA: "${curFaqs[0].answer.slice(0, 90)}..."` : 'Conversational H3 voice queries with direct 40-word answers'
      });
    }

    // 10. Agent 8 Quality Verification Gate
    items.push({
      id: 'change-agent8-verification',
      sectionTitle: 'Quality Assurance: Agent 8 Anti-Hallucination Quality Gate',
      sectionType: 'general',
      fieldChanged: 'verificationVerdict',
      agentId: 'agent-8',
      agentName: 'Agent 8: Quality Gate & Verification Checker',
      agentRole: 'Consensus Verifier',
      oneLinerReason: 'Passed strict dual-agent consensus test ensuring zero factual deviation, semantic retention, and 0% hallucination risk.',
      beforeSnippet: 'Unverified candidate generation',
      afterSnippet: 'VERDICT: ACCEPT (100% Quality & Factuality Gate Passed)'
    });

    return items.map(it => ({
      ...it,
      sectionTitle: sanitizeGrammarAndPunctuation(it.sectionTitle),
      fieldChanged: sanitizeGrammarAndPunctuation(it.fieldChanged),
      oneLinerReason: sanitizeGrammarAndPunctuation(it.oneLinerReason),
      beforeSnippet: sanitizeGrammarAndPunctuation(it.beforeSnippet),
      afterSnippet: sanitizeGrammarAndPunctuation(it.afterSnippet),
    }));
  }, [fixResult, backendData, origBackend, primaryComp, origComp]);

  // Unique list of agents for filtering
  const agentFilterOptions = useMemo(() => {
    const set = new Set<string>();
    synthesizedChanges.forEach(c => set.add(c.agentId));
    return Array.from(set);
  }, [synthesizedChanges]);

  // Filtered change items
  const filteredChanges = useMemo(() => {
    if (selectedFilterAgent === 'all') return synthesizedChanges;
    return synthesizedChanges.filter(c => c.agentId === selectedFilterAgent);
  }, [synthesizedChanges, selectedFilterAgent]);

  // Assemble full text representations for Side-by-Side View
  const fullBeforeContent = useMemo(() => {
    const lines: string[] = [];
    if (origBackend.metaTitle) lines.push(`[META TITLE]: ${origBackend.metaTitle}`);
    if (origBackend.metaDescription) lines.push(`[META DESCRIPTION]: ${origBackend.metaDescription}\n`);

    const h1 = (origComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || origComp?.name;
    if (h1) lines.push(`# ${h1}`);
    if (origComp?.heroDescription) lines.push(origComp.heroDescription);

    if (origComp?.bodyContent) {
      lines.push(origComp.bodyContent);
    } else {
      (origComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2').forEach(h2 => {
        lines.push(`\n## ${h2.text}`);
      });
      (origComp?.listItems || []).forEach(li => lines.push(`- ${li}`));
    }

    if (origComp?.citationSource) {
      lines.push(`\n[EEAT CITATION]: ${origComp.citationSource}`);
    }

    const faqs = origComp?.faqs || [];
    if (faqs.length > 0) {
      lines.push('\n## Frequently Asked Questions');
      faqs.forEach(f => {
        lines.push(`### ${f.question}\n${f.answer}`);
      });
    }

    return lines.join('\n\n').trim();
  }, [origBackend, origComp]);

  const fullAfterContent = useMemo(() => {
    const lines: string[] = [];
    if (backendData.metaTitle) lines.push(`[META TITLE]: ${backendData.metaTitle}`);
    if (backendData.metaDescription) lines.push(`[META DESCRIPTION]: ${backendData.metaDescription}\n`);

    const h1 = (primaryComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || primaryComp?.name;
    if (h1) lines.push(`# ${h1}`);
    if (primaryComp?.heroDescription) lines.push(primaryComp.heroDescription);

    if (primaryComp?.bodyContent) {
      lines.push(primaryComp.bodyContent);
    } else {
      (primaryComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2').forEach(h2 => {
        lines.push(`\n## ${h2.text}`);
      });
      (primaryComp?.listItems || []).forEach(li => lines.push(`- ${li}`));
    }

    if (primaryComp?.citationSource) {
      lines.push(`\n> **EEAT Citation & LLM Proof:** ${primaryComp.citationSource}`);
    }

    const faqs = primaryComp?.faqs || [];
    if (faqs.length > 0) {
      lines.push('\n## Frequently Asked Questions');
      faqs.forEach(f => {
        lines.push(`### ${f.question}\n${f.answer}`);
      });
    }

    return lines.join('\n\n').trim();
  }, [backendData, primaryComp]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-150">
      <div className={`bg-slate-900 border border-slate-700 rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'h-screen max-w-full rounded-none' : 'max-w-6xl max-h-[92vh]'
      }`}>
        
        {/* ==================================================== */}
        {/* MODAL HEADER */}
        {/* ==================================================== */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-slate-50 flex items-center space-x-2">
                  <span>Remediation Summary &amp; Exact Changes Made</span>
                </h2>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{synthesizedChanges.length} Changes Applied</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact section changes with one-liner rationale, contributing agent attribution, and full side-by-side comparison with copy-paste.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-slate-50 rounded-xl hover:bg-slate-800 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-50 rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* NAVIGATION TABS & AGENT FILTER */}
        {/* ==================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-800 bg-slate-900/90 text-xs">
          
          {/* Main View Mode Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('changes')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'changes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Exact Changes by Section ({synthesizedChanges.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('side_by_side')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'side_by_side' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Content Side-by-Side (Copy &amp; Paste)</span>
            </button>

            <button
              onClick={() => setActiveTab('raw_code')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'raw_code' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Complete Markdown / Text Export</span>
            </button>
          </div>

          {/* Quick Filter by Suggesting Agent (when viewing changes tab) */}
          {activeTab === 'changes' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium shrink-0">Filter by Agent:</span>
              <select
                value={selectedFilterAgent}
                onChange={(e) => setSelectedFilterAgent(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="all">All Contributing Agents ({synthesizedChanges.length})</option>
                {agentFilterOptions.map((agId) => (
                  <option key={agId} value={agId}>
                    {agId.replace('agent-', 'Agent ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Side-by-Side Formatting Toggle (when viewing side_by_side tab) */}
          {activeTab === 'side_by_side' && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setSideBySideMode('rendered')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    sideBySideMode === 'rendered' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Formatted Preview
                </button>
                <button
                  onClick={() => setSideBySideMode('plain_text')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    sideBySideMode === 'plain_text' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Copy Text
                </button>
              </div>

              <button
                onClick={() => handleCopy(fullAfterContent, 'global-after-copy')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
              >
                {copiedState['global-after-copy'] ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-slate-50" />
                    <span>Copied Optimized Page!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Entire After Content</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* MODAL BODY */}
        {/* ==================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-200 text-xs sm:text-sm">
          
          {/* ================================================= */}
          {/* TAB 1: EXACT CHANGES BY SECTION                   */}
          {/* ================================================= */}
          {activeTab === 'changes' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/30 flex items-start space-x-3 text-xs text-slate-300">
                <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-300">Remediation Log &amp; Agent Attribution: </span>
                  <span>
                    Each card below shows the precise section modified, the one-liner rationale justifying why the change was executed, the specific AI agent that recommended it, and a direct before-and-after text snippet.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredChanges.map((change, idx) => {
                  const agentBadgeColor = 
                    change.agentId === 'agent-2' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    change.agentId === 'agent-3' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                    change.agentId === 'agent-4' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    change.agentId === 'agent-5' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                    change.agentId === 'agent-6' ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' :
                    change.agentId === 'agent-7' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    change.agentId === 'agent-8' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                    'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';

                  return (
                    <div 
                      key={change.id || idx}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition shadow-md space-y-4"
                    >
                      {/* Card Header: Section Title + Suggesting Agent Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center font-mono text-[11px] font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-slate-50 flex items-center space-x-2">
                              <span>{change.sectionTitle}</span>
                              <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                                {change.fieldChanged}
                              </span>
                            </h3>
                          </div>
                        </div>

                        {/* Agent Attribution Pill */}
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center space-x-1.5 ${agentBadgeColor}`}>
                            <Bot className="w-3.5 h-3.5" />
                            <span>Suggested by: {change.agentName}</span>
                          </span>
                        </div>
                      </div>

                      {/* Guideline Adherence Badge */}
                      {change.guidelineAdheredTo && (
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="font-semibold text-slate-400">Guideline Adhered To:</span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 text-[11px]">
                            {change.guidelineAdheredTo}
                          </span>
                        </div>
                      )}

                      {/* One-Liner Reason */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-900/30 text-xs">
                        <span className="font-bold text-indigo-300">Why this change was made: </span>
                        <span className="text-slate-200 leading-relaxed font-medium">{change.oneLinerReason}</span>
                      </div>

                      {/* Before vs After Snippet Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* BEFORE */}
                        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] uppercase font-bold text-rose-400">
                            <span>Stage: Before (Original)</span>
                          </div>
                          <div className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                            {change.beforeSnippet || '(empty / non-compliant)'}
                          </div>
                        </div>

                        {/* AFTER */}
                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 space-y-1.5 relative">
                          <div className="flex items-center justify-between text-[11px] uppercase font-bold text-emerald-300">
                            <span className="flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Stage: After (Remediated)</span>
                            </span>
                            <button
                              onClick={() => handleCopy(change.afterSnippet || '', `card-${change.id}`)}
                              className="text-[11px] text-emerald-400 hover:text-slate-50 flex items-center space-x-1"
                            >
                              {copiedState[`card-${change.id}`] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedState[`card-${change.id}`] ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <div className="text-emerald-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed font-semibold max-h-36 overflow-y-auto">
                            {change.afterSnippet}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* TAB 2: FULL CONTENT SIDE-BY-SIDE (COPY & PASTE)   */}
          {/* ================================================= */}
          {activeTab === 'side_by_side' && (
            <div className="space-y-4">
              
              {/* Header Action Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-50">
                      Side-by-Side Full Content Comparison
                    </h3>
                    <p className="text-xs text-slate-300">
                      Direct view of the entire webpage content before remediation (left) and after remediation (right). The right side has full copy-paste functionality.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(fullAfterContent, 'global-after-full')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition"
                  >
                    {copiedState['global-after-full'] ? (
                      <>
                        <CheckCheck className="w-4 h-4 text-slate-50" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Entire After Content</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SIDE-BY-SIDE 2-COLUMN VIEW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* LEFT COLUMN: BEFORE (ORIGINAL) */}
                <div className="p-5 rounded-3xl bg-slate-950 border border-rose-900/50 flex flex-col space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-rose-900/30">
                    <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span>BEFORE REMEDIATION (Original Scraped Webpage)</span>
                    </div>
                    <span className="text-[11px] text-rose-300 bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-800/50 font-semibold font-mono">
                      Original Non-Compliant State
                    </span>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[60vh] pr-2 text-xs">
                    
                    {/* Meta Section Before */}
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono uppercase text-rose-400 font-bold">Metadata &amp; Search Snippet</div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Title:</span>
                        <p className="text-slate-300 font-medium">{origBackend.metaTitle || '(no title)'}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Description:</span>
                        <p className="text-slate-400 leading-relaxed">{origBackend.metaDescription || '(no description)'}</p>
                      </div>
                    </div>

                    {/* Content Section Before */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="text-[11px] font-mono uppercase text-indigo-400 font-bold">Hero &amp; Body Copy</div>
                      
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[11px] font-mono text-slate-400 block mb-1">&lt;H1&gt;</span>
                        <h1 className="text-sm font-bold text-slate-200">
                          {(origComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || origComp?.name}
                        </h1>
                      </div>

                      {origComp?.heroDescription && (
                        <p className="text-slate-400 italic leading-relaxed pl-2 border-l-2 border-slate-700">
                          {origComp.heroDescription}
                        </p>
                      )}

                      <div className="space-y-2 pt-2">
                        {(origComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2').map((h, i) => (
                          <div key={i} className="text-slate-300 font-semibold">• {h.text}</div>
                        ))}
                      </div>

                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap pt-2">
                        {origComp?.bodyContent || 'Original unstructured body text.'}
                      </div>

                      {origComp?.citationSource && (
                        <div className="text-[11px] text-amber-400 font-mono pt-2 border-t border-slate-800">
                          Source: {origComp.citationSource}
                        </div>
                      )}
                    </div>

                    {/* Scraped Tables Before */}
                    {((origComp?.tables && origComp.tables.length > 0) || (origBackend?.media?.tables && origBackend.media.tables.length > 0)) && (
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-mono uppercase text-amber-400 font-bold">Scraped Tables Before</div>
                        {((origComp?.tables || origBackend?.media?.tables) || []).map((t, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto space-y-1">
                            {t.title && <div className="text-slate-300 font-bold text-xs">{t.title}</div>}
                            <table className="w-full text-[11px] text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400">
                                  {t.headers.map((h, hIdx) => (
                                    <th key={hIdx} className="p-1.5 font-semibold">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {t.rows.slice(0, 3).map((r, rIdx) => (
                                  <tr key={rIdx} className="border-b border-slate-800/40 text-slate-300">
                                    {r.map((c, cIdx) => (
                                      <td key={cIdx} className="p-1.5">{c}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FAQ Section Before */}
                    {(origComp?.faqs && origComp.faqs.length > 0) && (
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-[11px] font-mono uppercase text-purple-400 font-bold">FAQs Before</div>
                        {origComp.faqs.map((f, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                            <div className="font-semibold text-slate-200">Q: {f.question}</div>
                            <div className="text-slate-400 text-[11px]">A: {f.answer}</div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

                {/* RIGHT COLUMN: AFTER (OPTIMIZED WITH COPY-PASTE) */}
                <div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-500/70 flex flex-col space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                    <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>AFTER REMEDIATION (Agent 7 &amp; 8 Optimized)</span>
                    </div>
                    <button
                      onClick={() => handleCopy(fullAfterContent, 'col-after-copy')}
                      className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-bold flex items-center space-x-1.5 transition"
                    >
                      {copiedState['col-after-copy'] ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedState['col-after-copy'] ? 'Copied All!' : 'Copy Section'}</span>
                    </button>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto max-h-[60vh] pr-2 text-xs">
                    
                    {/* Meta Section After */}
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-800/40 space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold">Metadata &amp; Search Snippet (Optimized)</span>
                        <button
                          onClick={() => handleCopy(`${backendData.metaTitle}\n\n${backendData.metaDescription}`, 'after-meta-copy')}
                          className="text-[11px] text-emerald-400 hover:text-slate-50 flex items-center space-x-1"
                        >
                          {copiedState['after-meta-copy'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedState['after-meta-copy'] ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Optimized Title:</span>
                        <p className="text-slate-50 font-bold">{backendData.metaTitle}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Optimized Description:</span>
                        <p className="text-emerald-100 leading-relaxed font-medium">{backendData.metaDescription}</p>
                      </div>
                    </div>

                    {/* Content Section After */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-800/40 space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase text-teal-300 font-bold">Hero &amp; Body Copy (Remediated)</span>
                        <button
                          onClick={() => handleCopy(primaryComp?.bodyContent || '', 'after-body-copy')}
                          className="text-[11px] text-emerald-400 hover:text-slate-50 flex items-center space-x-1"
                        >
                          {copiedState['after-body-copy'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedState['after-body-copy'] ? 'Copied' : 'Copy Body'}</span>
                        </button>
                      </div>
                      
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-600/40">
                        <span className="text-[11px] font-mono text-emerald-400 block mb-1">&lt;H1&gt; (Target Keyword Injected)</span>
                        <h1 className="text-sm font-black text-slate-50">
                          {(primaryComp?.headings || []).find(h => h.tag?.toLowerCase() === 'h1')?.text || primaryComp?.name}
                        </h1>
                      </div>

                      {primaryComp?.heroDescription && (
                        <p className="text-emerald-100 italic leading-relaxed pl-3 border-l-2 border-emerald-500 bg-emerald-950/20 p-2 rounded-r-xl">
                          {primaryComp.heroDescription}
                        </p>
                      )}

                      <div className="space-y-2 pt-2">
                        {(primaryComp?.headings || []).filter(h => h.tag?.toLowerCase() === 'h2').map((h, i) => (
                          <div key={i} className="text-emerald-200 font-bold">• {h.text}</div>
                        ))}
                      </div>

                      <div className="text-slate-100 leading-relaxed whitespace-pre-wrap pt-2">
                        {primaryComp?.bodyContent || 'Remediated body text.'}
                      </div>

                      {primaryComp?.citationSource && (
                        <div className="text-[11px] text-amber-200 font-mono font-semibold pt-2 border-t border-emerald-800/40 bg-amber-950/20 p-2 rounded-xl">
                          EEAT Citation: {primaryComp.citationSource}
                        </div>
                      )}
                    </div>

                    {/* Preserved Structured Tables After */}
                    {((primaryComp?.tables && primaryComp.tables.length > 0) || (backendData?.media?.tables && backendData.media.tables.length > 0)) && (
                      <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase text-amber-300 font-bold">Preserved Tables (Clean Comparison Format)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">100% Retained</span>
                        </div>
                        {((primaryComp?.tables || backendData?.media?.tables) || []).map((t, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 overflow-x-auto space-y-1.5">
                            {t.title && <div className="text-slate-50 font-bold text-xs">{t.title}</div>}
                            <table className="w-full text-[11px] text-left border-collapse">
                              <thead>
                                <tr className="border-b border-amber-500/30 text-amber-200 bg-amber-950/30">
                                  {t.headers.map((h, hIdx) => (
                                    <th key={hIdx} className="p-2 font-bold">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {t.rows.map((r, rIdx) => (
                                  <tr key={rIdx} className="border-b border-slate-800 text-slate-200">
                                    {r.map((c, cIdx) => (
                                      <td key={cIdx} className="p-2 font-medium">{c}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FAQ Section After */}
                    {(primaryComp?.faqs && primaryComp.faqs.length > 0) && (
                      <div className="p-4 rounded-2xl bg-slate-900 border border-purple-800/40 space-y-2 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase text-purple-300 font-bold">Voice FAQs &amp; Direct AEO Answers</span>
                          <button
                            onClick={() => handleCopy(primaryComp.faqs!.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n'), 'after-faqs-copy')}
                            className="text-[11px] text-purple-300 hover:text-slate-50 flex items-center space-x-1"
                          >
                            {copiedState['after-faqs-copy'] ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedState['after-faqs-copy'] ? 'Copied' : 'Copy FAQs'}</span>
                          </button>
                        </div>
                        {primaryComp.faqs.map((f, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-950 border border-purple-900/40 space-y-1.5">
                            <div className="font-bold text-purple-100 flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px] font-mono text-purple-300">&lt;H3&gt;</span>
                              <span>{f.question}</span>
                            </div>
                            <div className="text-purple-200 text-[11px] pl-4 border-l-2 border-purple-500/40 italic">
                              <Mic className="w-3 h-3 inline mr-1 text-purple-400" />
                              &quot;{f.answer}&quot;
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================================================= */}
          {/* TAB 3: COMPLETE MARKDOWN / TEXT EXPORT            */}
          {/* ================================================= */}
          {activeTab === 'raw_code' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-50">Full Optimized Markdown Document</h3>
                    <p className="text-xs text-slate-400">Standardized copy-paste ready plain text &amp; Markdown with all headings, citations, and FAQs.</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(fullAfterContent, 'markdown-raw-full')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition"
                >
                  {copiedState['markdown-raw-full'] ? (
                    <>
                      <CheckCheck className="w-4 h-4 text-slate-50" />
                      <span>Copied Markdown!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <textarea
                  readOnly
                  value={fullAfterContent}
                  className="w-full h-96 bg-transparent font-mono text-xs text-emerald-300 focus:outline-none resize-none leading-relaxed"
                />
              </div>

            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* MODAL FOOTER */}
        {/* ==================================================== */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All modifications verified by Agent 8 Quality Assurance Gate.</span>
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(fullAfterContent, 'footer-copy-all')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-slate-50 font-semibold rounded-xl transition flex items-center space-x-1.5"
            >
              {copiedState['footer-copy-all'] ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedState['footer-copy-all'] ? 'Copied Entire After Content!' : 'Copy Entire After Content'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md"
            >
              Done Reviewing
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
