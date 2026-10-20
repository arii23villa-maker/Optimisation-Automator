import React, { useState } from 'react';
import { 
  FileText, 
  ShoppingBag, 
  Globe, 
  Cpu, 
  CheckCircle2, 
  ChevronRight, 
  ArrowUpRight, 
  Layers, 
  SlidersHorizontal,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  Check,
  HeartHandshake,
  Network,
  BookOpen
} from 'lucide-react';
import { 
  ContentGuidelines, 
  ProductGuidelines, 
  SEOGuidelines, 
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

interface ActiveGuidelinesInspectorProps {
  contentGuidelines: ContentGuidelines;
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  geoGuidelines?: GEOGuidelines;
  customerCentricityGuidelines?: CustomerCentricityGuidelines;
  structureMappingGuidelines?: StructureMappingGuidelines;
  savedContentPresets?: SavedContentGuideline[];
  savedProductPresets?: SavedProductGuideline[];
  savedSeoPresets?: SavedSeoGuideline[];
  savedGeoPresets?: SavedGeoGuideline[];
  savedCustomerCentricityPresets?: SavedCustomerCentricityGuideline[];
  savedStructureMappingPresets?: SavedStructureMappingGuideline[];
  activeContentPresetId?: string;
  activeProductPresetId?: string;
  activeSeoPresetId?: string;
  activeGeoPresetId?: string;
  activeCustomerCentricityPresetId?: string;
  activeStructureMappingPresetId?: string;
  onSelectContentPreset?: (presetId: string) => void;
  onSelectProductPreset?: (presetId: string) => void;
  onSelectSeoPreset?: (presetId: string) => void;
  onSelectGeoPreset?: (presetId: string) => void;
  onSelectCustomerCentricityPreset?: (presetId: string) => void;
  onSelectStructureMappingPreset?: (presetId: string) => void;
  onJumpToSection?: (sectionId: string) => void;
  compact?: boolean;
}

export const ActiveGuidelinesInspector: React.FC<ActiveGuidelinesInspectorProps> = ({
  contentGuidelines,
  productGuidelines,
  seoGuidelines,
  geoGuidelines,
  customerCentricityGuidelines,
  structureMappingGuidelines,
  savedContentPresets = [],
  savedProductPresets = [],
  savedSeoPresets = [],
  savedGeoPresets = [],
  savedCustomerCentricityPresets = [],
  savedStructureMappingPresets = [],
  activeContentPresetId,
  activeProductPresetId,
  activeSeoPresetId,
  activeGeoPresetId,
  activeCustomerCentricityPresetId,
  activeStructureMappingPresetId,
  onSelectContentPreset,
  onSelectProductPreset,
  onSelectSeoPreset,
  onSelectGeoPreset,
  onSelectCustomerCentricityPreset,
  onSelectStructureMappingPreset,
  onJumpToSection,
  compact = false,
}) => {
  const [showFullDetailsModal, setShowFullDetailsModal] = useState<boolean>(false);

  // Active preset labels
  const activeContentPreset = savedContentPresets.find(p => p.id === activeContentPresetId);
  const activeProductPreset = savedProductPresets.find(p => p.id === activeProductPresetId);
  const activeSeoPreset = savedSeoPresets.find(p => p.id === activeSeoPresetId);
  const activeGeoPreset = savedGeoPresets.find(p => p.id === activeGeoPresetId);
  const activeCustomerCentricityPreset = savedCustomerCentricityPresets.find(p => p.id === activeCustomerCentricityPresetId);
  const activeStructureMappingPreset = savedStructureMappingPresets.find(p => p.id === activeStructureMappingPresetId);

  const handleScrollTo = (sectionId: string) => {
    if (onJumpToSection) {
      onJumpToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <SlidersHorizontal className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-50 tracking-tight">
                Currently Active Guidelines & Rulebook
              </h2>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              These guidelines govern the 9-Agent Pipeline and compliance audit. Select any saved guideline preset below to switch instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowFullDetailsModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
            title="Inspect comprehensive active rules matrix"
          >
            <Eye className="w-3.5 h-3.5 text-slate-300" />
            <span>View Full Details</span>
          </button>
        </div>
      </div>

      {/* 6 Active Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        
        {/* ========================================================================= */}
        {/* SECTION 1: CONTENT GUIDELINES CARD */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/70 border border-purple-900/40 hover:border-purple-700/60 rounded-xl p-3.5 flex flex-col justify-between transition group shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  Section 1: Content
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleScrollTo('section-1-content')}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center space-x-0.5 hover:underline cursor-pointer"
              >
                <span>Edit</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Select Previously Saved Guideline Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Active Saved Preset
              </label>
              <select
                id="active-inspector-content-preset-select"
                value={activeContentPresetId}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectContentPreset?.(e.target.value);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none cursor-pointer"
              >
                {savedContentPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Specs / Indicators */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Tone:</span>
                <span className="font-medium text-purple-200 truncate max-w-[140px]" title={contentGuidelines.toneOfVoice}>
                  {contentGuidelines.toneOfVoice ? contentGuidelines.toneOfVoice.split(',')[0] : 'Authoritative'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Readability:</span>
                <span className="font-medium text-slate-200 truncate max-w-[140px]" title={contentGuidelines.readabilityLevel}>
                  {contentGuidelines.readabilityLevel ? contentGuidelines.readabilityLevel.split('(')[0] : '8th-9th Grade'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Forbidden Clichés:</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">
                  {(contentGuidelines.forbiddenCliches || []).length} blocked
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Formatting Rules:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  {(contentGuidelines.formattingRules || []).length} active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate" title={activeContentPreset?.name || 'Custom Guideline'}>
              {activeContentPreset?.name || 'Active Preset'}
            </span>
            <span className="text-[11px] text-purple-400 font-mono">Sec 1</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: PRODUCT & COMMERCIAL GUIDELINES (AGENT 2) */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/70 border border-indigo-900/40 hover:border-indigo-700/60 rounded-xl p-3.5 flex flex-col justify-between transition group shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                    Section 2: Product
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase">
                    Agent 2
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleScrollTo('section-2-product')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5 hover:underline cursor-pointer"
              >
                <span>Edit</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Select Previously Saved Guideline Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Active Saved Preset
              </label>
              <select
                id="active-inspector-product-preset-select"
                value={activeProductPresetId}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectProductPreset?.(e.target.value);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {savedProductPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Specs / Indicators */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Product:</span>
                <span className="font-medium text-indigo-200 truncate max-w-[140px]" title={productGuidelines.productName}>
                  {productGuidelines.productName || 'Configured in Sec 2'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Target Audience:</span>
                <span className="font-medium text-slate-200 truncate max-w-[140px]" title={productGuidelines.targetAudience}>
                  {productGuidelines.targetAudience || 'General Audience'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Forbidden Claims:</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px]">
                  {(productGuidelines.forbiddenPhrases || []).length} forbidden
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">USPs & Value Props:</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">
                  {(productGuidelines.uniqueSellingPoints || []).length} USPs
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate" title={activeProductPreset?.name || 'Custom Product Rules'}>
              {activeProductPreset?.name || 'Active Preset'}
            </span>
            <span className="text-[11px] text-indigo-400 font-mono">Sec 2</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: TECHNICAL SEO & SCHEMA GUIDELINES */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/70 border border-blue-900/40 hover:border-blue-700/60 rounded-xl p-3.5 flex flex-col justify-between transition group shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                  Section 3: SEO & Schema
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleScrollTo('section-3-seo')}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-0.5 hover:underline cursor-pointer"
              >
                <span>Edit</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Select Previously Saved Guideline Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Active Saved Preset
              </label>
              <select
                id="active-inspector-seo-preset-select"
                value={activeSeoPresetId}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectSeoPreset?.(e.target.value);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                {savedSeoPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Specs / Indicators */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Voice & AEO Target:</span>
                <span className={`px-1.5 py-0.5 rounded font-medium text-[11px] ${
                  seoGuidelines.voiceSearchOptimized || seoGuidelines.aeoDirectAnswerTarget
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {seoGuidelines.voiceSearchOptimized ? 'Active (Voice + AEO)' : 'Standard Search'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Title / Meta Range:</span>
                <span className="font-mono text-slate-200 text-[11px]">
                  {seoGuidelines.titleCharRange?.min || 50}-{seoGuidelines.titleCharRange?.max || 60} / {seoGuidelines.metaDescCharRange?.min || 140}-{seoGuidelines.metaDescCharRange?.max || 160}c
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Required Schemas:</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[11px]">
                  {(seoGuidelines.schemaRequirements || []).length} required
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">E-E-A-T Tier:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] uppercase">
                  {seoGuidelines.eeatStandard || 'standard'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate" title={activeSeoPreset?.name || 'Custom SEO Rules'}>
              {activeSeoPreset?.name || 'Active Preset'}
            </span>
            <span className="text-[11px] text-blue-400 font-mono">Sec 3</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: GEO & AI OVERVIEW GUIDELINES */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/70 border border-emerald-900/40 hover:border-emerald-700/60 rounded-xl p-3.5 flex flex-col justify-between transition group shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  Section 4: GEO & AI
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleScrollTo('section-4-geo')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-0.5 hover:underline cursor-pointer"
              >
                <span>Edit</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Select Previously Saved Guideline Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Active Saved Preset
              </label>
              <select
                id="active-inspector-geo-preset-select"
                value={activeGeoPresetId}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectGeoPreset?.(e.target.value);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {savedGeoPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Specs / Indicators */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">GEO Optimization:</span>
                <span className={`px-1.5 py-0.5 rounded font-medium text-[11px] ${
                  geoGuidelines?.enableGeoOptimization
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {geoGuidelines?.enableGeoOptimization ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">AI Snippet Format:</span>
                <span className="font-mono text-emerald-200 text-[11px]">
                  {geoGuidelines?.aiOverviewSnippetFormat || 'definitive_para'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">BLUF Direct Answer:</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                  {geoGuidelines?.blufDirectAnswerTarget ? 'Targeted' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Target AI Engines:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  {(geoGuidelines?.targetEngines || []).length} engines
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate" title={activeGeoPreset?.name || 'Custom GEO Rules'}>
              {activeGeoPreset?.name || 'Active Preset'}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Sec 4</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: STRUCTURE & KEYWORD MAPPING GUIDELINES CARD (AGENT 4) */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/70 border border-amber-900/40 hover:border-amber-700/60 rounded-xl p-3.5 flex flex-col justify-between transition group shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Network className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                  Section 5: Structure &amp; Mapping
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleScrollTo('section-5-structure')}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1 cursor-pointer transition"
                title="Jump to Section 5 Editor"
              >
                <span>Edit</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Structure Preset Switcher */}
            {savedStructureMappingPresets && savedStructureMappingPresets.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  <span>Active Structure Preset:</span>
                </label>
                <select
                  value={activeStructureMappingPresetId}
                  onChange={(e) => onSelectStructureMappingPreset?.(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer truncate"
                >
                  {savedStructureMappingPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Specs */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Followed By:</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                  Agent 4
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">H1 Primary KW:</span>
                <span className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
                  structureMappingGuidelines?.requirePrimaryKeywordInH1 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {structureMappingGuidelines?.requirePrimaryKeywordInH1 ? 'Required' : 'Optional'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Min KW Mentions:</span>
                <span className="font-mono text-amber-200 text-[11px]">
                  {structureMappingGuidelines?.minKeywordFrequency ?? 2} / section
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Voice Target:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  {structureMappingGuidelines?.voiceQuestionHeadingsTarget ?? 30}% H3s
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate" title={activeStructureMappingPreset?.name || 'Custom Structure Rules'}>
              {activeStructureMappingPreset?.name || 'Active Preset'}
            </span>
            <span className="text-[11px] text-amber-400 font-mono">Sec 5</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: CUSTOMER CENTRICITY GUIDELINES CARD (AGENT 5) */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/70 border border-rose-900/40 hover:border-rose-700/60 rounded-xl p-3.5 flex flex-col justify-between transition group shadow-sm">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                  Section 6: Customer Centricity
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleScrollTo('section-6-customer-centricity')}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center space-x-1 cursor-pointer transition"
                title="Jump to Section 6 Editor"
              >
                <span>Edit</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Customer Centricity Preset Switcher */}
            {savedCustomerCentricityPresets && savedCustomerCentricityPresets.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                  <BookOpen className="w-3 h-3 text-rose-400" />
                  <span>Active Customer Preset:</span>
                </label>
                <select
                  value={activeCustomerCentricityPresetId}
                  onChange={(e) => onSelectCustomerCentricityPreset?.(e.target.value)}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer truncate"
                >
                  {savedCustomerCentricityPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Specs */}
            <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Followed By:</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px]">
                  Agent 5 &amp; Scoring
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Max Sentence:</span>
                <span className="font-mono text-rose-200 text-[11px]">
                  {customerCentricityGuidelines?.maxSentenceWords ?? 20} words
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Max Paragraph:</span>
                <span className="font-mono text-rose-200 text-[11px]">
                  {customerCentricityGuidelines?.maxParagraphSentences ?? 3} sentences
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Friction Flags:</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  {(customerCentricityGuidelines?.frictionPatternsToFlag || []).length} blocked
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate" title={activeCustomerCentricityPreset?.name || 'Custom Customer Rules'}>
              {activeCustomerCentricityPreset?.name || 'Active Preset'}
            </span>
            <span className="text-[11px] text-rose-400 font-mono">Sec 6</span>
          </div>
        </div>

      </div>

      {/* Full Details Modal */}
      {showFullDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-50">
                    Full Active Guidelines Matrix
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive view of all rules currently active across the 6 guideline sections.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullDetailsModal(false)}
                className="text-slate-400 hover:text-slate-50 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Content Details */}
              <div className="bg-slate-950/80 border border-purple-900/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-900/20 pb-2">
                  <h4 className="font-bold text-purple-300 flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Section 1: Content Guidelines</span>
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {activeContentPreset?.name || 'Active'}
                  </span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div>
                    <span className="font-semibold text-slate-400">Tone of Voice:</span>
                    <p className="text-slate-200 mt-0.5">{contentGuidelines.toneOfVoice || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Readability Level:</span>
                    <p className="text-slate-200 mt-0.5">{contentGuidelines.readabilityLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Paragraph Constraints:</span>
                    <p className="text-slate-200 mt-0.5">{contentGuidelines.paragraphConstraints || 'Standard'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Forbidden Clichés ({(contentGuidelines.forbiddenCliches || []).length}):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(contentGuidelines.forbiddenCliches || []).map((c, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[11px]">
                          {c}
                        </span>
                      ))}
                      {(!contentGuidelines.forbiddenCliches || contentGuidelines.forbiddenCliches.length === 0) && (
                        <span className="text-slate-500 italic">None configured</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Formatting Rules ({(contentGuidelines.formattingRules || []).length}):</span>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-slate-300">
                      {(contentGuidelines.formattingRules || []).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-slate-950/80 border border-indigo-900/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-900/20 pb-2">
                  <h4 className="font-bold text-indigo-300 flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Section 2: Product Guidelines (Agent 2)</span>
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {activeProductPreset?.name || 'Active'}
                  </span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div>
                    <span className="font-semibold text-slate-400">Product Name:</span>
                    <p className="text-indigo-200 font-semibold mt-0.5">{productGuidelines.productName || 'Not configured'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Category:</span>
                    <p className="text-slate-200 mt-0.5">{productGuidelines.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Target Audience:</span>
                    <p className="text-slate-200 mt-0.5">{productGuidelines.targetAudience || 'General'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Forbidden Phrases / Claims ({(productGuidelines.forbiddenPhrases || []).length}):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(productGuidelines.forbiddenPhrases || []).map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[11px]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Unique Selling Points (USPs):</span>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-slate-300">
                      {(productGuidelines.uniqueSellingPoints || []).map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                  {productGuidelines.complianceNotes && (
                    <div>
                      <span className="font-semibold text-slate-400">Compliance Notes:</span>
                      <p className="text-amber-200/90 mt-0.5">{productGuidelines.complianceNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Details */}
              <div className="bg-slate-950/80 border border-blue-900/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-900/20 pb-2">
                  <h4 className="font-bold text-blue-300 flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Section 3: SEO Guidelines</span>
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    {activeSeoPreset?.name || 'Active'}
                  </span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-slate-400">Title Range:</span>
                      <p className="text-slate-200 mt-0.5">{seoGuidelines.titleCharRange?.min || 50} - {seoGuidelines.titleCharRange?.max || 60} chars</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Meta Range:</span>
                      <p className="text-slate-200 mt-0.5">{seoGuidelines.metaDescCharRange?.min || 140} - {seoGuidelines.metaDescCharRange?.max || 160} chars</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Schema Requirements ({(seoGuidelines.schemaRequirements || []).length}):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(seoGuidelines.schemaRequirements || []).map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Heading Hierarchy:</span>
                    <p className="text-slate-200 mt-0.5">{seoGuidelines.headingHierarchyRules || 'Strict H1 -> H2 -> H3 hierarchy'}</p>
                  </div>
                </div>
              </div>

              {/* GEO Details */}
              <div className="bg-slate-950/80 border border-emerald-900/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-900/20 pb-2">
                  <h4 className="font-bold text-emerald-300 flex items-center space-x-2">
                    <Cpu className="w-4 h-4" />
                    <span>Section 4: GEO Guidelines</span>
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {activeGeoPreset?.name || 'Active'}
                  </span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-slate-400">GEO Optimization:</span>
                      <p className="text-emerald-300 mt-0.5">{geoGuidelines?.enableGeoOptimization ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Snippet Format:</span>
                      <p className="text-slate-200 mt-0.5 font-mono">{geoGuidelines?.aiOverviewSnippetFormat || 'definitive_paragraph'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Target AI Engines:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(geoGuidelines?.targetEngines || []).map((e, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded text-[11px]">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  {geoGuidelines?.llmCitationStrategy && (
                    <div>
                      <span className="font-semibold text-slate-400">LLM Citation Strategy:</span>
                      <p className="text-slate-200 mt-0.5">{geoGuidelines.llmCitationStrategy}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Structure & Keyword Mapping Details (Agent 4) */}
              <div className="bg-slate-950/80 border border-amber-900/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-900/20 pb-2">
                  <h4 className="font-bold text-amber-300 flex items-center space-x-2">
                    <Network className="w-4 h-4" />
                    <span>Section 5: Structure &amp; Mapping Guidelines (Agent 4)</span>
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {activeStructureMappingPreset?.name || 'Active'}
                  </span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-slate-400">H1 Primary Keyword:</span>
                      <p className="text-emerald-300 mt-0.5">
                        {structureMappingGuidelines?.requirePrimaryKeywordInH1 ? 'Strictly Required' : 'Optional'}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Voice Question H3s:</span>
                      <p className="text-slate-200 mt-0.5 font-mono">
                        {structureMappingGuidelines?.voiceQuestionHeadingsTarget ?? 30}% target
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Heading Hierarchy &amp; Strategy:</span>
                    <p className="text-slate-200 mt-0.5">
                      {structureMappingGuidelines?.headingHierarchyRule || 'Strict single H1, sequential H2 subheadings, H3 conversational questions'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-slate-400">Min Keyword Frequency:</span>
                      <p className="text-slate-200 mt-0.5">{structureMappingGuidelines?.minKeywordFrequency ?? 2} per section</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Max Density:</span>
                      <p className="text-slate-200 mt-0.5">{structureMappingGuidelines?.maxKeywordDensityPercent ?? 3.0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Centricity Details (Agent 5) */}
              <div className="bg-slate-950/80 border border-rose-900/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-900/20 pb-2">
                  <h4 className="font-bold text-rose-300 flex items-center space-x-2">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Section 6: Customer Centricity Guidelines (Agent 5)</span>
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    {activeCustomerCentricityPreset?.name || 'Active'}
                  </span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-slate-400">Target Persona:</span>
                      <p className="text-rose-200 mt-0.5 truncate">
                        {customerCentricityGuidelines?.targetCustomerPersona || 'Enterprise & Direct Buyers'}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Friction Constraints:</span>
                      <p className="text-slate-200 mt-0.5 font-mono">
                        Max {customerCentricityGuidelines?.maxSentenceWords ?? 20}w/sent, {customerCentricityGuidelines?.maxParagraphSentences ?? 3}s/para
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">
                      Blocked Friction Patterns ({(customerCentricityGuidelines?.frictionPatternsToFlag || []).length}):
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(customerCentricityGuidelines?.frictionPatternsToFlag || []).slice(0, 6).map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[11px]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">Scoring Engine:</span>
                    <p className="text-slate-200 mt-0.5 text-[11px]">
                      Governs Agent 5 scoring breakdown (Layman Accessibility: {customerCentricityGuidelines?.scoringWeights?.laymanAccessibilityWeight ?? 30}%, Objection Handling: {customerCentricityGuidelines?.scoringWeights?.objectionHandlingWeight ?? 25}%, Friction: {customerCentricityGuidelines?.scoringWeights?.frictionEliminationWeight ?? 25}%)
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowFullDetailsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
