import React, { useState } from 'react';
import { 
  UrlFetcherBar 
} from './UrlFetcherBar';
import { 
  AuditScorecard 
} from './AuditScorecard';
import { 
  BackendSEOSection 
} from './BackendSEOSection';
import { 
  BeforeAfterViewer 
} from './BeforeAfterViewer';
import { 
  H2OptimizerModal 
} from './H2OptimizerModal';
import { 
  FullBodyContentSection 
} from './FullBodyContentSection';
import { 
  SectionSuggestionsMatrix 
} from './SectionSuggestionsMatrix';
import { 
  Agent2RemediationReview 
} from './Agent2RemediationReview';
import { 
  FinalContentReaderModal 
} from './FinalContentReaderModal';
import { 
  RemediationChangesModal 
} from './RemediationChangesModal';
import { MediaChecklistWidget } from './MediaChecklistWidget';
import { 
  SEOBackendData, 
  ContentComponent, 
  AuditSummary, 
  AuditFlag, 
  SEOGuidelines, 
  KeywordItem, 
  ProductGuidelines,
  GuidelineProfile,
  AgentGuidelineConfig,
  OrchestratorReport,
  PipelineProgressEvent,
  FixResult,
  ContentGuidelines,
  GEOGuidelines,
  CustomerCentricityGuidelines,
  StructureMappingGuidelines,
  SavedContentGuideline,
  SavedProductGuideline,
  SavedSeoGuideline,
  SavedGeoGuideline,
  SavedCustomerCentricityGuideline,
  SavedStructureMappingGuideline
} from '../types';
import { PipelineRunPanel } from './PipelineRunPanel';
import { 
  Layers, 
  Plus, 
  ArrowRightLeft, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Eye,
  Mic,
  TrendingUp,
  FileText,
  Sliders,
  ShieldCheck,
  Wrench,
  Bookmark,
  RefreshCw,
  BookOpen,
  Globe,
  Cpu
} from 'lucide-react';

interface ScrapeFixTabProps {
  currentUrl: string;
  onFetchUrl: (url: string, rawHtml?: string) => Promise<void>;
  isLoadingUrl: boolean;
  backendData: SEOBackendData;
  setBackendData: React.Dispatch<React.SetStateAction<SEOBackendData>>;
  components: ContentComponent[];
  setComponents: React.Dispatch<React.SetStateAction<ContentComponent[]>>;
  keywords: KeywordItem[];
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  contentGuidelines?: ContentGuidelines;
  geoGuidelines?: GEOGuidelines;
  structureMappingGuidelines?: StructureMappingGuidelines;
  customerCentricityGuidelines?: CustomerCentricityGuidelines;
  savedContentPresets?: SavedContentGuideline[];
  savedProductPresets?: SavedProductGuideline[];
  savedSeoPresets?: SavedSeoGuideline[];
  savedGeoPresets?: SavedGeoGuideline[];
  savedStructureMappingPresets?: SavedStructureMappingGuideline[];
  savedCustomerCentricityPresets?: SavedCustomerCentricityGuideline[];
  activeContentPresetId?: string;
  activeProductPresetId?: string;
  activeSeoPresetId?: string;
  activeGeoPresetId?: string;
  activeStructureMappingPresetId?: string;
  activeCustomerCentricityPresetId?: string;
  onSelectContentPreset?: (presetId: string) => void;
  onSelectProductPreset?: (presetId: string) => void;
  onSelectSeoPreset?: (presetId: string) => void;
  onSelectGeoPreset?: (presetId: string) => void;
  onSelectStructureMappingPreset?: (presetId: string) => void;
  onSelectCustomerCentricityPreset?: (presetId: string) => void;
  profiles: GuidelineProfile[];
  agentConfig: AgentGuidelineConfig;
  onSelectProfile?: (profileId: string) => void;
  onNavigateToGuidelinesTab?: () => void;
  autoExtractKeywords?: boolean;
  onToggleAutoExtractKeywords?: (val: boolean) => void;
  onAutofillKeywords?: () => Promise<void>;
  isAutofillingKeywords?: boolean;
  hasAudited: boolean;
  isAuditing: boolean;
  isFixing: boolean;
  fixingComponentId: string | null;
  auditSummary: AuditSummary | null;
  auditFlags: AuditFlag[];
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  orchestratorReport?: OrchestratorReport | null;
  pipelineProgress?: PipelineProgressEvent[];
  fixResult?: FixResult | null;
  onRunAudit: () => void;
  onFixSection: (componentId: string) => void;
  onFixBackend: () => void;
  onFixAll: () => void;
  onAddNewComponent: () => void;
  onNotifyToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ScrapeFixTab: React.FC<ScrapeFixTabProps> = ({
  currentUrl,
  onFetchUrl,
  isLoadingUrl,
  backendData,
  setBackendData,
  components,
  setComponents,
  keywords,
  productGuidelines,
  seoGuidelines,
  contentGuidelines,
  geoGuidelines,
  structureMappingGuidelines,
  customerCentricityGuidelines,
  savedContentPresets = [],
  savedProductPresets = [],
  savedSeoPresets = [],
  savedGeoPresets = [],
  savedStructureMappingPresets = [],
  savedCustomerCentricityPresets = [],
  activeContentPresetId,
  activeProductPresetId,
  activeSeoPresetId,
  activeGeoPresetId,
  activeStructureMappingPresetId,
  activeCustomerCentricityPresetId,
  onSelectContentPreset,
  onSelectProductPreset,
  onSelectSeoPreset,
  onSelectGeoPreset,
  onSelectStructureMappingPreset,
  onSelectCustomerCentricityPreset,
  profiles,
  agentConfig,
  onSelectProfile,
  onNavigateToGuidelinesTab,
  autoExtractKeywords = true,
  onToggleAutoExtractKeywords,
  onAutofillKeywords,
  isAutofillingKeywords = false,
  hasAudited,
  isAuditing,
  isFixing,
  fixingComponentId,
  auditSummary,
  auditFlags,
  selectedFilter,
  setSelectedFilter,
  orchestratorReport,
  pipelineProgress,
  fixResult,
  onRunAudit,
  onFixSection,
  onFixBackend,
  onFixAll,
  onAddNewComponent,
  onNotifyToast,
}) => {
  // Modal for Before & After comparison
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [h2ModalOpen, setH2ModalOpen] = useState(false);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(true);
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);

  // Check if any section was recently fixed by Agent 2
  const hasAgent2FixedAny = backendData.status === 'recently_fixed' || components.some(c => c.status === 'recently_fixed');

  // Filtered flags
  const filteredFlags = auditFlags.filter((f) => {
    if (selectedFilter === 'all') return true;
    return f.severity === selectedFilter;
  });

  const backendFlags = filteredFlags.filter((f) => f.target === 'backend_seo');

  // Open Compare Modal for Backend SEO
  const handleOpenBackendCompare = () => {
    setCompareModalOpen(true);
  };

  // Open Compare Modal for a Component
  const handleOpenComponentCompare = (comp: ContentComponent) => {
    setCompareModalOpen(true);
  };

  // Total H2 count
  const totalH2Count = components.reduce((acc, comp) => {
    return acc + (comp.headings?.filter((h) => h.tag?.toLowerCase() === 'h2').length || 0);
  }, 0);

  const activeProfile = (profiles || []).find(p => p.id === agentConfig.activeProfileId) || (profiles || [])[0];
  const agent1Profile = (profiles || []).find(p => p.id === agentConfig.agent1ProfileId) || activeProfile;
  const agent2Profile = (profiles || []).find(p => p.id === agentConfig.agent2ProfileId) || activeProfile;

  return (
    <div className="space-y-6">
      
      {/* 1. URL Fetcher & Raw HTML Extractor Bar */}
      <UrlFetcherBar
        currentUrl={currentUrl}
        onFetchUrl={onFetchUrl}
        isLoading={isLoadingUrl}
        componentCount={components.length}
        keywordCount={keywords.length}
        autoExtractKeywords={autoExtractKeywords}
        onToggleAutoExtractKeywords={onToggleAutoExtractKeywords}
      />

      {/* 1.5 Active Guidelines Routing & Quick Preset Switcher Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3 text-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Active guidelines</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {[savedContentPresets, savedProductPresets, savedSeoPresets, savedGeoPresets, savedStructureMappingPresets, savedCustomerCentricityPresets].every((list) => !list?.length)
                  ? 'No guidelines saved yet, so the gates check only the tool\'s own rules (no invented facts, no cut content, heading order, SEO basics). Add your guidelines in the Guidelines tab.'
                  : 'The review gates audit the maker draft against these presets. Edit them in the Guidelines tab.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onAutofillKeywords && (
              <button
                id="btn-quick-autofill-keywords"
                onClick={onAutofillKeywords}
                disabled={isAutofillingKeywords}
                className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Autofill ranking keywords from scraped page"
              >
                {isAutofillingKeywords ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting…</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Detect keywords</span>
                  </>
                )}
              </button>
            )}

            {onNavigateToGuidelinesTab && (
              <button
                onClick={onNavigateToGuidelinesTab}
                className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Edit guidelines</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Guideline Sections Preset Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-0.5">
          {/* Content Guideline Selector */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-md p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Content
              </span>
              <span className="text-[11px] text-slate-400 truncate max-w-[80px]" title={contentGuidelines?.toneOfVoice}>
                {contentGuidelines?.toneOfVoice ? contentGuidelines.toneOfVoice.split(',')[0] : 'Not set'}
              </span>
            </div>
            <select
              value={activeContentPresetId}
              onChange={(e) => onSelectContentPreset?.(e.target.value)}
              className="w-full px-2 py-1 bg-slate-900 border border-slate-700/80 rounded text-[12px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="">{savedContentPresets.length ? 'None selected' : 'None saved yet'}</option>
              {savedContentPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>

          {/* Product Guideline Selector (Agent 2) */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-md p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-300 flex items-center gap-1.5">
                <Bookmark className="w-3 h-3" /> Product
              </span>
              <span className="text-[11px] text-slate-500 tabular">
                {(productGuidelines?.forbiddenPhrases || []).length} blocked
              </span>
            </div>
            <select
              value={activeProductPresetId}
              onChange={(e) => onSelectProductPreset?.(e.target.value)}
              className="w-full px-2 py-1 bg-slate-900 border border-slate-700/80 rounded text-[12px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="">{savedProductPresets.length ? 'None selected' : 'None saved yet'}</option>
              {savedProductPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>

          {/* SEO Guideline Selector */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-md p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> SEO
              </span>
              <span className="text-[11px] text-slate-500 tabular">
                {(seoGuidelines?.schemaRequirements || []).length} schemas
              </span>
            </div>
            <select
              value={activeSeoPresetId}
              onChange={(e) => onSelectSeoPreset?.(e.target.value)}
              className="w-full px-2 py-1 bg-slate-900 border border-slate-700/80 rounded text-[12px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="">{savedSeoPresets.length ? 'None selected' : 'None saved yet'}</option>
              {savedSeoPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>

          {/* GEO Guideline Selector */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-md p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> GEO &amp; AI citation
              </span>
              <span className="text-[11px] text-slate-500 tabular">
                {geoGuidelines?.enableGeoOptimization ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <select
              value={activeGeoPresetId}
              onChange={(e) => onSelectGeoPreset?.(e.target.value)}
              className="w-full px-2 py-1 bg-slate-900 border border-slate-700/80 rounded text-[12px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="">{savedGeoPresets.length ? 'None selected' : 'None saved yet'}</option>
              {savedGeoPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>

          {/* Structure & Keyword Mapping Selector (Agent 4) */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-md p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Structure
              </span>
              <span className="text-[11px] text-slate-500 tabular">
                {structureMappingGuidelines?.minKeywordFrequency || 2}x density
              </span>
            </div>
            <select
              value={activeStructureMappingPresetId}
              onChange={(e) => onSelectStructureMappingPreset?.(e.target.value)}
              className="w-full px-2 py-1 bg-slate-900 border border-slate-700/80 rounded text-[12px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="">{savedStructureMappingPresets.length ? 'None selected' : 'None saved yet'}</option>
              {savedStructureMappingPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Centricity & UX Selector (Agent 5) */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-md p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Customer centricity
              </span>
              <span className="text-[11px] text-slate-500 tabular">
                ≤{customerCentricityGuidelines?.maxSentenceWords || 20} w/sent
              </span>
            </div>
            <select
              value={activeCustomerCentricityPresetId}
              onChange={(e) => onSelectCustomerCentricityPreset?.(e.target.value)}
              className="w-full px-2 py-1 bg-slate-900 border border-slate-700/80 rounded text-[12px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="">{savedCustomerCentricityPresets.length ? 'None selected' : 'None saved yet'}</option>
              {savedCustomerCentricityPresets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target Keywords quick strip */}
        {keywords && keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60 text-[11px]">
            <span className="text-[12px] text-slate-500 mr-1">Target keywords</span>
            {keywords.slice(0, 5).map((kw, i) => (
              <span key={i} className="px-2 py-0.5 rounded border border-slate-700 bg-slate-950/50 text-[12px] text-slate-200 flex items-center gap-1.5">
                <span>{kw.keyword}</span>
                {kw.source === "google_keyword_planner" && kw.searchVolume > 0 ? (
                  <span className="text-slate-500 tabular text-[11px]">{kw.searchVolume.toLocaleString()}/mo</span>
                ) : (
                  <span className="text-slate-600 text-[11px]" title="No verified search volume">vol. n/a</span>
                )}
              </span>
            ))}
            {keywords.length > 5 && (
              <span className="text-[11px] text-slate-400 font-medium">+{keywords.length - 5} more</span>
            )}
          </div>
        )}
      </div>

      {/* 2. Color Status Legend & Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          id="btn-view-entire-content-global"
          onClick={() => setIsReaderModalOpen(true)}
          className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors"
          title="Read the full optimized page"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Read full content</span>
        </button>

        <button
          id="btn-view-exact-changes-global"
          onClick={() => setIsChangesModalOpen(true)}
          className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors"
          title="Section-by-section changes with the reason for each"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Changes &amp; rationale</span>
        </button>

        <button
          onClick={() => setH2ModalOpen(true)}
          className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors"
          title="Rewrite H2 headings for search, voice and AI answer engines"
        >
          <Wrench className="w-3.5 h-3.5 text-slate-400" />
          <span>Optimize H2s</span>
          <span className="tabular text-slate-500">{totalH2Count}</span>
        </button>

        <button
          onClick={handleOpenBackendCompare}
          className="h-8 px-3 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Side-by-side diff</span>
        </button>
      </div>

      {/* 2.5 Nine-Agent Autonomous Orchestration Console */}
      <PipelineRunPanel
        report={orchestratorReport}
        isRunning={isAuditing || isFixing}
        progress={pipelineProgress || []}
        onRun={onRunAudit}
      />

      {/* 3. Audit Scorecard & Agent 1 Actions */}
      {hasAudited && (
        <AuditScorecard
          summary={auditSummary}
          hasAudited={hasAudited}
          isAuditing={isAuditing}
          isFixing={isFixing}
          onRunAudit={onRunAudit}
          onFixAll={onFixAll}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
        />
      )}

      {/* 3.5 DEDICATED AGENT 2 REMEDIATION REVIEW: ENTIRE SEO CHANGES & ENTIRE CONTENT CHANGES */}
      {hasAgent2FixedAny && isReviewOpen && (
        <Agent2RemediationReview
          backendData={backendData}
          components={components}
          fixResult={fixResult}
          keywords={keywords}
          summary={auditSummary}
          onOpenFullReader={() => setIsReaderModalOpen(true)}
          onOpenChangesModal={() => setIsChangesModalOpen(true)}
          onDismissReview={() => setIsReviewOpen(false)}
        />
      )}

      {/* 4. Section Cards & Media Presence Checklist Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left / Main Column: Section Cards */}
        <div className="xl:col-span-9 space-y-6">
          {/* 4a. SEO Backend Data & Structured Schemas Section */}
          <BackendSEOSection
            data={backendData}
            flags={backendFlags}
            onUpdate={(updated) => setBackendData(updated)}
            onFixBackend={onFixBackend}
            isFixing={isFixing}
            seoGuidelines={seoGuidelines}
            onOpenCompare={handleOpenBackendCompare}
          />

          {/* 4b. Unified 3-Part Full Page Content Body (Hero H1, Body H2s/EEAT, FAQ H3s/Answers) */}
          <FullBodyContentSection
            components={components}
            onUpdateComponents={(updated) => {
              setComponents(updated);
              if (onNotifyToast) {
                onNotifyToast('Full page body content and component copy updated!', 'success');
              }
            }}
            keywords={keywords}
            productGuidelines={productGuidelines}
            seoGuidelines={seoGuidelines}
            auditFlags={filteredFlags}
            onFixSection={onFixSection}
            isFixing={isFixing}
            fixingComponentId={fixingComponentId}
            onAddNewComponent={onAddNewComponent}
            onOpenCompare={handleOpenComponentCompare}
            onOpenH2Optimizer={() => setH2ModalOpen(true)}
            onNotifyToast={onNotifyToast}
            backendData={backendData}
          />
        </div>

        {/* Right Column: Media Checklist (Next to Section Cards) */}
        <div className="xl:col-span-3 space-y-6 xl:sticky xl:top-20">
          <MediaChecklistWidget media={backendData.media} />
        </div>

      </div>

      {/* 6. Dedicated Agent 1 Section Suggestions Matrix & Export / Download Bar */}
      <SectionSuggestionsMatrix
        flags={auditFlags}
        backendData={backendData}
        components={components}
        onFixSection={onFixSection}
        onFixBackend={onFixBackend}
        isFixing={isFixing}
        fixingComponentId={fixingComponentId}
        onNotifyToast={onNotifyToast}
        onOpenBeforeAfterModal={(sectionId) => {
          if (sectionId === 'backend') {
            handleOpenBackendCompare();
          } else if (sectionId) {
            const comp = (components || []).find(c => c.id === sectionId);
            if (comp) handleOpenComponentCompare(comp);
          } else {
            setCompareModalOpen(true);
          }
        }}
      />

      {/* H2 Optimizer Modal */}
      {h2ModalOpen && (
        <H2OptimizerModal
          isOpen={h2ModalOpen}
          onClose={() => setH2ModalOpen(false)}
          components={components}
          keywords={keywords}
          productGuidelines={productGuidelines}
          seoGuidelines={seoGuidelines}
          onApplyH2s={(updatedComponents, summaryMsg) => {
            setComponents(updatedComponents);
            if (onNotifyToast) {
              onNotifyToast(summaryMsg || 'H2 subheadings updated successfully!', 'success');
            }
          }}
        />
      )}

      {/* Side-by-Side Comparison Modal */}
      {compareModalOpen && (
        <BeforeAfterViewer
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          backend={backendData}
          allComponents={components}
          flags={auditFlags}
        />
      )}

      {/* Function to View Entire Content After Agent 2 */}
      {isReaderModalOpen && (
        <FinalContentReaderModal
          isOpen={isReaderModalOpen}
          onClose={() => setIsReaderModalOpen(false)}
          component={components[0]}
          allComponents={components}
          backendData={backendData}
          onOpenDiff={() => {
            setIsReaderModalOpen(false);
            setCompareModalOpen(true);
          }}
        />
      )}

      {/* Screen Displaying Exact Changes Made, Section Details, Agent Attribution, and Side-by-Side Copy */}
      {isChangesModalOpen && (
        <RemediationChangesModal
          isOpen={isChangesModalOpen}
          onClose={() => setIsChangesModalOpen(false)}
          fixResult={fixResult || null}
          backendData={backendData}
          components={components}
        />
      )}

    </div>
  );
};
