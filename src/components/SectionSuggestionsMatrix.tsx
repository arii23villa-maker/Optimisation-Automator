import React, { useState, useMemo } from 'react';
import { 
  AuditFlag, 
  ContentComponent, 
  SEOBackendData, 
  FlagSeverity, 
  FlagCategory 
} from '../types';
import { sanitizeGrammarAndPunctuation } from '../utils/grammarSanitizer';
import { 
  MessageSquareQuote, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Sparkles, 
  Wrench, 
  Layers, 
  Lightbulb, 
  ExternalLink,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowRight,
  Bot,
  ShieldCheck,
  Target,
  Users
} from 'lucide-react';

interface SectionSuggestionsMatrixProps {
  flags: AuditFlag[];
  backendData: SEOBackendData;
  components: ContentComponent[];
  onFixSection: (componentId: string) => void;
  onFixBackend: () => void;
  isFixing: boolean;
  fixingComponentId: string | null;
  onNotifyToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
  onOpenBeforeAfterModal?: (componentId?: string) => void;
}

export const SectionSuggestionsMatrix: React.FC<SectionSuggestionsMatrixProps> = ({
  flags,
  backendData,
  components,
  onFixSection,
  onFixBackend,
  isFixing,
  fixingComponentId,
  onNotifyToast,
  onOpenBeforeAfterModal,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Filter flags
  const filteredFlags = useMemo(() => {
    return flags.filter(flag => {
      if (selectedSeverity !== 'all' && flag.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'all' && flag.category !== selectedCategory) return false;
      if (selectedAgent !== 'all' && flag.agentOrigin !== selectedAgent) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = flag.issueTitle.toLowerCase().includes(q);
        const matchesDesc = flag.issueDescription.toLowerCase().includes(q);
        const matchesWhy = (flag.whyThisSuggestionIsGiven || '').toLowerCase().includes(q);
        const matchesComp = (flag.componentId || '').toLowerCase().includes(q);
        const matchesAgent = (flag.agentOrigin || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesWhy && !matchesComp && !matchesAgent) return false;
      }
      return true;
    });
  }, [flags, selectedSeverity, selectedCategory, selectedAgent, searchQuery]);

  // Group flags into unified master sections: 'Backend SEO' and 'Webpage Content'
  const groupedSections = useMemo(() => {
    const sections: { id: string; title: string; type: string; flags: AuditFlag[]; component?: ContentComponent; isBackend: boolean }[] = [];

    // 1. Backend Section
    const backendFlags = filteredFlags.filter(f => f.target === 'backend_seo');
    if (backendFlags.length > 0 || (selectedSeverity === 'all' && selectedCategory === 'all' && selectedAgent === 'all' && !searchQuery && flags.some(f => f.target === 'backend_seo'))) {
      sections.push({
        id: 'backend',
        title: 'Backend SEO Meta & Structured Schemas',
        type: 'backend_seo',
        flags: backendFlags,
        isBackend: true,
      });
    }

    // 2. Components
    components.forEach((comp) => {
      const compFlags = filteredFlags.filter(f => f.target === 'component' && (f.componentId === comp.id || (!f.componentId && comp.type === 'hero')));
      sections.push({
        id: comp.id,
        title: comp.name || 'Main Content Section',
        type: comp.type || 'component',
        flags: compFlags,
        component: comp,
        isBackend: false,
      });
    });

    return sections;
  }, [filteredFlags, components, flags, selectedSeverity, selectedCategory, selectedAgent, searchQuery]);

  const getSeverityBadge = (severity: FlagSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Critical Violation',
          color: 'bg-rose-950/70 text-rose-300 border-rose-600/50',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
        };
      case 'warning':
        return {
          label: 'Warning / Non-Compliant',
          color: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        };
      case 'info':
        return {
          label: 'Improvement Opportunity',
          color: 'bg-blue-950/70 text-blue-300 border-blue-600/50',
          icon: <Info className="w-3.5 h-3.5 text-blue-400" />
        };
      case 'passed':
        return {
          label: 'Compliant & Passed',
          color: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        };
      default:
        return {
          label: 'Notice',
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <Info className="w-3.5 h-3.5 text-slate-400" />
        };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'GUIDELINE_COMPLIANCE': return 'Guideline Compliance (Agent 2)';
      case 'SEO_BACKEND': return 'Technical SEO & JSON-LD (Agent 3)';
      case 'KEYWORD_MAPPING': return 'Keyword Intent & Volume (Agent 4)';
      case 'CUSTOMER_CENTRICITY': return 'Customer Centricity (Agent 5)';
      case 'EEAT_GEO': return 'EEAT & GEO Citations (Agent 6)';
      case 'SEO_META': return 'SEO Meta Tags';
      case 'SCHEMA_BACKEND': return 'Schema.org JSON-LD';
      case 'VOICE_SEARCH_AEO': return 'Voice Search (AEO)';
      case 'GEO_LLM_CITATION': return 'GEO LLM Citations';
      default: return category;
    }
  };

  const handleCopyMarkdown = () => {
    let md = `# 9-Agent Pipeline Audit Suggestions Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
    flags.forEach((f, idx) => {
      md += `### ${idx + 1}. [${f.severity.toUpperCase()}] ${f.issueTitle}\n`;
      md += `- **Originating Agent**: ${f.agentOrigin || 'Autonomous Multi-Agent Pipeline'}\n`;
      md += `- **Category**: ${getCategoryLabel(f.category)}\n`;
      md += `- **Issue Description**: ${f.issueDescription}\n`;
      md += `- **Why This Suggestion Is Given**: ${f.whyThisSuggestionIsGiven || 'Search engine & AI indexing optimization.'}\n`;
      md += `- **Proposed Fix**: ${f.proposedFixPreview}\n\n`;
    });
    navigator.clipboard.writeText(md);
    setCopiedFormat('md');
    setTimeout(() => setCopiedFormat(null), 3000);
    if (onNotifyToast) onNotifyToast('Copied audit report to clipboard!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <MessageSquareQuote className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>9-Agent Diagnostic Suggestions & Grounding Matrix</span>
                <span className="px-2 py-0.5 text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full">
                  {filteredFlags.length} Flags
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-agent findings from Agents 2, 3, 4, 5 & 6 with deterministic grounding, keyword volume hierarchy, and Agent 8 verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
          >
            {copiedFormat === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFormat === 'md' ? 'Copied!' : 'Copy Report'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Originating Agent:</span>
          </span>
          {[
            { id: 'all', label: 'All Agents' },
            { id: 'Agent 2: Guideline Compliance', label: 'Agent 2 (Brand)' },
            { id: 'Agent 3: SEO Backend Data', label: 'Agent 3 (SEO/Schema)' },
            { id: 'Agent 4: Keyword & Intent Mapping', label: 'Agent 4 (Keywords)' },
            { id: 'Agent 5: Customer Centricity', label: 'Agent 5 (Customer)' },
            { id: 'Agent 6: EEAT & GEO', label: 'Agent 6 (EEAT/GEO)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedAgent(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                selectedAgent === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flags or rationale..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-5">
        {groupedSections.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-50">All Sections are Compliant!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No outstanding issues flagged across Agents 2–6. Content adheres to all SEO, brand, customer, and EEAT guidelines.
            </p>
          </div>
        ) : (
          groupedSections.map(section => {
            const isCollapsed = !!collapsedSections[section.id];
            const sectionFlagCount = section.flags.length;
            const isSectionFixing = isFixing && (fixingComponentId === section.id || (!fixingComponentId && section.isBackend));

            return (
              <div
                key={section.id}
                className="rounded-2xl border bg-slate-950/80 border-slate-800 overflow-hidden"
              >
                {/* Header */}
                <div 
                  onClick={() => toggleCollapse(section.id)}
                  className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-850 transition"
                >
                  <div className="flex items-center space-x-3">
                    <button className="p-1 text-slate-400 hover:text-slate-50 rounded">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <div>
                      <h4 className="text-sm font-bold text-slate-50 flex items-center space-x-2">
                        <span>{section.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                          sectionFlagCount > 0
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}>
                          {sectionFlagCount} Flags
                        </span>
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                    {sectionFlagCount > 0 && (
                      <button
                        onClick={() => {
                          if (section.isBackend) onFixBackend();
                          else onFixSection(section.id);
                        }}
                        disabled={isFixing}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
                      >
                        <Wrench className={`w-3.5 h-3.5 ${isSectionFixing ? 'animate-spin' : ''}`} />
                        <span>{isSectionFixing ? 'Agent 7 & 8 Remediating...' : 'Remediate Section'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                {!isCollapsed && (
                  <div className="p-4 space-y-4">
                    {sectionFlagCount === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-center space-x-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>No issues detected in this section.</span>
                      </div>
                    ) : (
                      section.flags.map((flag, flagIdx) => {
                        const sev = getSeverityBadge(flag.severity);
                        return (
                          <div
                            key={flag.id || flagIdx}
                            className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border flex items-center space-x-1 ${sev.color}`}>
                                  {sev.icon}
                                  <span>{sev.label}</span>
                                </span>
                                
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  {flag.agentOrigin || 'Diagnostic Agent'}
                                </span>

                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {getCategoryLabel(flag.category)}
                                </span>
                              </div>

                              {flag.verificationVerdict && (
                                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                  flag.verificationVerdict === 'ACCEPT'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                    : 'bg-amber-950 text-amber-300 border-amber-800'
                                }`}>
                                  Agent 8 Verdict: {flag.verificationVerdict}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-slate-50">{sanitizeGrammarAndPunctuation(flag.issueTitle)}</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">{sanitizeGrammarAndPunctuation(flag.issueDescription)}</p>
                            </div>

                            {/* Rationale box */}
                            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Why this suggestion is given (Rationale & Grounding):</span>
                              </div>
                              <p className="text-xs text-amber-100/90 leading-relaxed pl-5">
                                {sanitizeGrammarAndPunctuation(flag.whyThisSuggestionIsGiven || "Essential for SERP ranking, voice playback, or Generative Engine LLM verification.")}
                              </p>
                            </div>

                            {/* Guidelines & Fix Preview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                <span className="text-[11px] uppercase font-bold text-slate-400">Rule Reference:</span>
                                <p className="text-slate-300 mt-0.5">{sanitizeGrammarAndPunctuation(flag.guidelineReference)}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                                <span className="text-[11px] uppercase font-bold text-emerald-400">Agent 7 & 8 Fix Target:</span>
                                <p className="text-slate-300 mt-0.5">{sanitizeGrammarAndPunctuation(flag.proposedFixPreview)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
