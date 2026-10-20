import React, { useState } from 'react';
import { 
  Database, 
  Code, 
  Globe, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  FileCode, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Check, 
  Copy,
  Layers,
  ArrowRightLeft,
  Search,
  MousePointerClick,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  ArrowUpRight,
  Filter,
  Link2,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { SEOBackendData, AuditFlag, SEOGuidelines, CtaItem } from '../types';
import { isValidCtaUrl, validateCtaUrl } from '../utils/ctaValidator';

interface BackendSEOSectionProps {
  data: SEOBackendData;
  flags: AuditFlag[];
  onUpdate: (updated: SEOBackendData) => void;
  onFixBackend: () => void;
  isFixing: boolean;
  seoGuidelines: SEOGuidelines;
  onOpenCompare?: () => void;
}

export const BackendSEOSection: React.FC<BackendSEOSectionProps> = ({
  data,
  flags,
  onUpdate,
  onFixBackend,
  isFixing,
  seoGuidelines,
  onOpenCompare,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'meta' | 'schema' | 'preview' | 'social' | 'ctas'>('meta');
  const [copied, setCopied] = useState(false);
  const [copiedCtaId, setCopiedCtaId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [showInlineDiff, setShowInlineDiff] = useState(false);

  // New CTA form state
  const [newCtaText, setNewCtaText] = useState('');
  const [newCtaLink, setNewCtaLink] = useState('');
  const [newCtaType, setNewCtaType] = useState('Primary CTA');
  const [newCtaLocation, setNewCtaLocation] = useState('Main Content');
  const [showAddCtaForm, setShowAddCtaForm] = useState(false);
  const [ctaSearchQuery, setCtaSearchQuery] = useState('');
  const [ctaTypeFilter, setCtaTypeFilter] = useState('all');
  const [ctaUrlError, setCtaUrlError] = useState<string | null>(null);

  const titleLength = data.metaTitle?.length || 0;
  const descLength = data.metaDescription?.length || 0;

  const isTitleOk = titleLength >= seoGuidelines.titleCharRange.min && titleLength <= seoGuidelines.titleCharRange.max;
  const isDescOk = descLength >= seoGuidelines.metaDescCharRange.min && descLength <= seoGuidelines.metaDescCharRange.max;

  const isRecentlyFixed = data.status === 'recently_fixed';
  const isCompliant = (data.status === 'compliant' || flags.length === 0) && !isRecentlyFixed;
  const isNonCompliant = (flags.length > 0 || data.status === 'non_compliant') && !isRecentlyFixed && !isCompliant;

  const ctasList: CtaItem[] = (data.ctas || []).filter(c => c && c.text);

  // Box highlight class
  const getContainerBoxClasses = () => {
    if (isRecentlyFixed) {
      return 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-950/10';
    }
    if (isNonCompliant) {
      return 'border-rose-500 ring-2 ring-rose-500/25 bg-rose-950/10';
    }
    return 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-950/10';
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(data.schemaJsonLd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCtaLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedCtaId(id);
    setTimeout(() => setCopiedCtaId(null), 2000);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const updated = [...(data.tags || []), newTag.trim()];
    onUpdate({ ...data, tags: updated });
    setNewTag('');
  };

  const handleRemoveTag = (index: number) => {
    const updated = (data.tags || []).filter((_, i) => i !== index);
    onUpdate({ ...data, tags: updated });
  };

  // CTA Handlers
  const handleAddCta = () => {
    const trimmedText = newCtaText.trim();
    const trimmedLink = newCtaLink.trim();

    if (!trimmedText) return;

    // Strict URL validation: ensure CTA has a valid destination URL
    if (!isValidCtaUrl(trimmedLink)) {
      setCtaUrlError('Please provide a valid destination URL (e.g. https://apexflow.ai/signup, /demo, /pricing, or #contact).');
      return;
    }

    setCtaUrlError(null);
    const newCta: CtaItem = {
      id: `cta-${Date.now()}`,
      text: trimmedText,
      link: trimmedLink,
      type: newCtaType,
      location: newCtaLocation,
      isExternal: trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://'),
      targetKeyword: trimmedText,
    };
    const updatedCtas = [...ctasList, newCta];
    onUpdate({ ...data, ctas: updatedCtas });
    setNewCtaText('');
    setNewCtaLink('');
    setShowAddCtaForm(false);
  };

  const handleUpdateCta = (id: string, field: keyof CtaItem, value: any) => {
    const updatedCtas = ctasList.map((cta) => {
      if (cta.id === id) {
        const updated = { ...cta, [field]: value };
        if (field === 'link' && typeof value === 'string') {
          updated.isExternal = value.startsWith('http://') || value.startsWith('https://');
        }
        return updated;
      }
      return cta;
    });
    onUpdate({ ...data, ctas: updatedCtas });
  };

  const handleDeleteCta = (id: string) => {
    const updatedCtas = ctasList.filter((cta) => cta.id !== id);
    onUpdate({ ...data, ctas: updatedCtas });
  };

  const handleUpgradeGenericAnchor = (id: string, originalText: string) => {
    const topic = data.metaTitle.split(/[-|:]/)[0].trim() || 'Solution';
    let suggested = `Explore ${topic} Free`;
    if (originalText.toLowerCase().includes('demo')) suggested = `Schedule Live ${topic} Demo`;
    else if (originalText.toLowerCase().includes('start') || originalText.toLowerCase().includes('trial')) suggested = `Start 14-Day Free ${topic} Trial`;
    else if (originalText.toLowerCase().includes('contact') || originalText.toLowerCase().includes('sales')) suggested = `Contact ${topic} Enterprise Sales`;
    
    handleUpdateCta(id, 'text', suggested);
  };

  // Filtered CTAs
  const filteredCtas = ctasList.filter((cta) => {
    const matchesSearch = 
      cta.text.toLowerCase().includes(ctaSearchQuery.toLowerCase()) || 
      cta.link.toLowerCase().includes(ctaSearchQuery.toLowerCase()) ||
      (cta.location || '').toLowerCase().includes(ctaSearchQuery.toLowerCase());
    const matchesType = ctaTypeFilter === 'all' || (cta.type || '').toLowerCase() === ctaTypeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const validCtasCount = ctasList.filter((c) => isValidCtaUrl(c.link)).length;
  const primaryCtasCount = ctasList.filter((c) => c.type === 'Primary CTA').length;
  const externalCtasCount = ctasList.filter((c) => c.isExternal).length;

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-200 border ${getContainerBoxClasses()}`}>
      
      {/* Section Header */}
      <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={`p-2 rounded-xl border ${
            isRecentlyFixed 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : isNonCompliant
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-50">
                SEO Backend Data & Structured Schemas
              </h2>
              {isRecentlyFixed ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Remediated by Agent 7 (Verified by Agent 8)</span>
                </span>
              ) : isCompliant ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Compliant & Verified</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span>{flags.length} Non-Compliant Flags</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Meta Title • Meta Description • Schema.org JSON-LD • CTA Texts & Links ({ctasList.length}) • OpenGraph
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          
          {/* Compare Before vs After Button */}
          {onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-slate-50 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
              title="Compare Before and After side-by-side"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Compare Before/After</span>
            </button>
          )}

          {flags.length > 0 && (
            <button
              id="btn-fix-backend-seo"
              onClick={onFixBackend}
              disabled={isFixing}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
              title="Auto-optimize backend metadata and JSON-LD schema using Agent 7 Maker & Agent 8 Verifier"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>{isFixing ? 'Optimizing (Agents 7 & 8)...' : 'Optimize Backend SEO'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-50 rounded-lg hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 bg-slate-900/90">
          
          {/* Flag Alerts specific to Backend SEO */}
          {flags.length > 0 && (
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-rose-900/40">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Audit Diagnostics ({flags.length} issues)</span>
                </span>
                <span className="text-[11px] text-slate-400">Click &quot;Optimize Backend SEO&quot; to auto-remediate</span>
              </div>

              <div className="space-y-2 pt-1">
                {(flags || []).map((flag) => (
                  <div
                    key={flag.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      flag.severity === 'critical'
                        ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                        : flag.severity === 'warning'
                        ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                        : 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center space-x-1.5">
                        {flag.severity === 'critical' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{flag.issueTitle}</span>
                      </div>
                      <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                        {flag.category}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{flag.issueDescription}</p>
                    {flag.proposedFixPreview && (
                      <div className="text-[11px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                        <span className="text-emerald-400 font-semibold">Fix preview: </span>
                        {flag.proposedFixPreview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('meta')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'meta'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Meta Tags & Head</span>
            </button>

            {/* NEW CTA SECTION TAB */}
            <button
              id="tab-cta-links"
              onClick={() => setActiveTab('ctas')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'ctas'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
              <span>CTA Texts & Links</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] font-mono bg-slate-950/80 border border-slate-700 text-amber-300 font-bold">
                {ctasList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'schema'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Schema.org JSON-LD</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Google SERP Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 shrink-0 ${
                activeTab === 'social'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>OpenGraph & Twitter</span>
            </button>
          </div>

          {/* TAB 1: META TAGS */}
          {activeTab === 'meta' && (
            <div className="space-y-4 text-xs">
              
              {/* Meta Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-meta-title" className="font-semibold text-slate-300">
                    Meta Title <span className="text-slate-500 font-normal">(&lt;title&gt;)</span>
                  </label>
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                    isTitleOk
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {titleLength} / {seoGuidelines.titleCharRange.min}-{seoGuidelines.titleCharRange.max} chars
                  </span>
                </div>
                <input
                  id="input-meta-title"
                  type="text"
                  value={data.metaTitle}
                  onChange={(e) => onUpdate({ ...data, metaTitle: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Primary Keyword | Product Title | Brand"
                />
              </div>

              {/* Meta Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="textarea-meta-desc" className="font-semibold text-slate-300">
                    Meta Description <span className="text-slate-500 font-normal">(&lt;meta name=&quot;description&quot;&gt;)</span>
                  </label>
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                    isDescOk
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {descLength} / {seoGuidelines.metaDescCharRange.min}-{seoGuidelines.metaDescCharRange.max} chars
                  </span>
                </div>
                <textarea
                  id="textarea-meta-desc"
                  rows={3}
                  value={data.metaDescription}
                  onChange={(e) => onUpdate({ ...data, metaDescription: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                  placeholder="Compelling 150-160 char summary with primary keywords, value proposition, and call to action..."
                />
              </div>

              {/* Canonical URL & Robots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-canonical-url" className="font-semibold text-slate-300">Canonical URL</label>
                  <input
                    id="input-canonical-url"
                    type="text"
                    value={data.canonicalUrl}
                    onChange={(e) => onUpdate({ ...data, canonicalUrl: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="https://example.com/product"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-robots-tag" className="font-semibold text-slate-300">Robots Meta Tag</label>
                  <input
                    id="input-robots-tag"
                    type="text"
                    value={data.robots}
                    onChange={(e) => onUpdate({ ...data, robots: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="index, follow"
                  />
                </div>
              </div>

              {/* Sitemap Reference */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-sitemap-url" className="font-semibold text-slate-300">Sitemap XML URL</label>
                  <span className="text-[11px] text-emerald-400 font-medium">{data.sitemapStatus || 'Verified'}</span>
                </div>
                <input
                  id="input-sitemap-url"
                  type="text"
                  value={data.sitemapUrl}
                  onChange={(e) => onUpdate({ ...data, sitemapUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="https://example.com/sitemap.xml"
                />
              </div>

              {/* Semantic Entities / Tags */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-300">Target Semantic Entities & Keywords</label>
                <div className="flex flex-wrap gap-1.5">
                  {(data.tags || []).map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-xs"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(idx)}
                        className="text-slate-500 hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add semantic keyword/entity..."
                    className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 rounded-lg text-xs font-semibold"
                  >
                    + Add
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CTA TEXTS & CTA LINKS (NEW DEDICATED SECTION) */}
          {activeTab === 'ctas' && (
            <div className="space-y-5 text-xs">
              
              {/* CTA Statistics & Overview Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                    <span>Total CTAs</span>
                  </div>
                  <div className="text-lg font-bold text-slate-50">{ctasList.length}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <MousePointerClick className="w-3.5 h-3.5 text-blue-400" />
                    <span>Total CTAs</span>
                  </div>
                  <div className="text-lg font-bold text-slate-50">{ctasList.length}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Valid URLs</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-400">{validCtasCount} / {ctasList.length || 0}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Primary CTAs</span>
                  </div>
                  <div className="text-lg font-bold text-amber-400">{primaryCtasCount}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    <span>External Links</span>
                  </div>
                  <div className="text-lg font-bold text-indigo-400">{externalCtasCount}</div>
                </div>
              </div>

              {/* Action and Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ctaSearchQuery}
                      onChange={(e) => setCtaSearchQuery(e.target.value)}
                      placeholder="Search CTA text, link, location..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={ctaTypeFilter}
                    onChange={(e) => setCtaTypeFilter(e.target.value)}
                    className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="all">All CTA Types</option>
                    <option value="primary cta">Primary CTA</option>
                    <option value="secondary button">Secondary Button</option>
                    <option value="action link">Action Link</option>
                    <option value="anchor jump">Anchor Jump</option>
                    <option value="form action">Form Action</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setShowAddCtaForm(!showAddCtaForm);
                    setCtaUrlError(null);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs flex items-center space-x-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddCtaForm ? 'Cancel' : 'Add New CTA'}</span>
                </button>
              </div>

              {/* Inline Add CTA Form */}
              {showAddCtaForm && (
                <div className="p-4 bg-slate-950 border border-indigo-900/50 rounded-xl space-y-3 shadow-inner">
                  <div className="font-semibold text-indigo-300 text-xs flex items-center space-x-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Call-to-Action Link / Button (Valid URLs Only)</span>
                  </div>

                  {ctaUrlError && (
                    <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-center space-x-2 text-xs text-rose-300">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{ctaUrlError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">CTA Anchor Text / Button Label *</label>
                      <input
                        type="text"
                        value={newCtaText}
                        onChange={(e) => setNewCtaText(e.target.value)}
                        placeholder="e.g. Start Free Trial, Schedule Live Demo..."
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Valid Destination URL / Link *</label>
                      <input
                        type="text"
                        value={newCtaLink}
                        onChange={(e) => {
                          setNewCtaLink(e.target.value);
                          if (ctaUrlError) setCtaUrlError(null);
                        }}
                        placeholder="e.g. https://apexflow.ai/signup, /demo, /pricing"
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50 font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Must be a real URL (https://..., /path, or specific section anchor).
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">CTA Type</label>
                      <select
                        value={newCtaType}
                        onChange={(e) => setNewCtaType(e.target.value)}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50"
                      >
                        <option value="Primary CTA">Primary CTA</option>
                        <option value="Secondary Button">Secondary Button</option>
                        <option value="Action Link">Action Link</option>
                        <option value="Anchor Jump">Anchor Jump</option>
                        <option value="Form Action">Form Action</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Page Location</label>
                      <select
                        value={newCtaLocation}
                        onChange={(e) => setNewCtaLocation(e.target.value)}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50"
                      >
                        <option value="Hero Banner">Hero Banner</option>
                        <option value="Main Content">Main Content</option>
                        <option value="Feature Grid">Feature Grid</option>
                        <option value="Pricing Section">Pricing Section</option>
                        <option value="Sidebar / Sticky">Sidebar / Sticky</option>
                        <option value="Footer / Bottom CTA">Footer / Bottom CTA</option>
                        <option value="Header / Navigation">Header / Navigation</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => {
                        setShowAddCtaForm(false);
                        setCtaUrlError(null);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCta}
                      disabled={!newCtaText.trim() || !newCtaLink.trim()}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                    >
                      Save Valid CTA
                    </button>
                  </div>
                </div>
              )}

              {/* List of CTA Cards */}
              <div className="space-y-3">
                {filteredCtas.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <MousePointerClick className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-slate-300 font-medium">No Call-to-Action items found</div>
                    <p className="text-slate-500 text-xs max-w-md mx-auto">
                      No CTAs matching your filter. Click &quot;Add New CTA&quot; to define interactive conversion buttons and links.
                    </p>
                  </div>
                ) : (
                  filteredCtas.map((cta, index) => {
                    const isGeneric = ['click here', 'more', 'link', 'read more', 'learn more', 'here'].includes(cta.text.toLowerCase().trim());

                    return (
                      <div
                        key={cta.id || index}
                        className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                              cta.type === 'Primary CTA'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : cta.type === 'Secondary Button'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {cta.type || 'CTA Link'}
                            </span>

                            <span className="px-2 py-0.5 rounded text-[11px] bg-slate-900 text-slate-400 border border-slate-800">
                              {cta.location || 'Main Content'}
                            </span>

                            {cta.isExternal ? (
                              <span className="px-1.5 py-0.5 rounded text-[11px] bg-blue-950/60 text-blue-300 border border-blue-800/40 flex items-center space-x-1">
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>External</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[11px] bg-teal-950/60 text-teal-300 border border-teal-800/40 flex items-center space-x-1">
                                <Link2 className="w-2.5 h-2.5" />
                                <span>Internal</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {/* Copy Link */}
                            <button
                              onClick={() => handleCopyCtaLink(cta.id, cta.link)}
                              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition"
                              title="Copy CTA Link URL"
                            >
                              {copiedCtaId === cta.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Open in new tab */}
                            {cta.link && cta.link !== '#action' && (
                              <a
                                href={cta.link.startsWith('/') || cta.link.startsWith('#') || cta.link.startsWith('http') ? cta.link : `https://${cta.link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-900 rounded-lg transition"
                                title="Open CTA Link in New Tab"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Delete CTA */}
                            <button
                              onClick={() => handleDeleteCta(cta.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                              title="Delete this CTA"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Editable Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                              CTA Text / Anchor Copy
                            </label>
                            <input
                              type="text"
                              value={cta.text}
                              onChange={(e) => handleUpdateCta(cta.id, 'text', e.target.value)}
                              className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-50 font-medium"
                              placeholder="Button copy / Anchor text"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                                CTA Target URL / Destination
                              </label>
                              {isValidCtaUrl(cta.link) ? (
                                <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Valid URL</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-rose-400 font-medium flex items-center space-x-1">
                                  <XCircle className="w-3 h-3" />
                                  <span>Missing/Invalid URL</span>
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={cta.link}
                              onChange={(e) => handleUpdateCta(cta.id, 'link', e.target.value)}
                              className={`w-full p-2 bg-slate-900 border rounded-lg text-xs font-mono transition ${
                                isValidCtaUrl(cta.link)
                                  ? 'border-slate-800 focus:border-indigo-500 text-indigo-300'
                                  : 'border-rose-800/80 focus:border-rose-500 text-rose-300 bg-rose-950/20'
                              }`}
                              placeholder="https://... or /signup"
                            />
                          </div>
                        </div>

                        {/* Generic Anchor SEO Warning & Instant Upgrade */}
                        {isGeneric && (
                          <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center space-x-1.5 text-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Generic anchor text (&quot;{cta.text}&quot;) has low SEO & conversion weight.</span>
                            </div>
                            <button
                              onClick={() => handleUpgradeGenericAnchor(cta.id, cta.text)}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded text-[11px] font-semibold shrink-0 flex items-center space-x-1 transition"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>Upgrade Anchor</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* TAB 3: SCHEMA.ORG JSON-LD */}
          {activeTab === 'schema' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-300">Schema Types Detected:</span>
                  <div className="flex gap-1.5">
                    {data.schemaTypesFound && data.schemaTypesFound.length > 0 ? (
                      data.schemaTypesFound.map((st, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-mono">
                          @{st}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">No structured schema</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCopySchema}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Copied JSON-LD' : 'Copy JSON-LD'}</span>
                </button>
              </div>

              <textarea
                rows={12}
                value={data.schemaJsonLd}
                onChange={(e) => onUpdate({ ...data, schemaJsonLd: e.target.value })}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                placeholder="JSON-LD Schema..."
              />
            </div>
          )}

          {/* TAB 4: GOOGLE SERP PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white text-slate-900 shadow-md max-w-2xl space-y-1">
                <div className="text-[11px] text-slate-500 flex items-center space-x-1 truncate font-sans">
                  <span>{data.canonicalUrl || 'https://apexflow.ai/product'}</span>
                  <span>› product</span>
                </div>
                <h3 className="text-base text-[#1a0dab] hover:underline cursor-pointer font-medium font-sans truncate">
                  {data.metaTitle || 'Page Title'}
                </h3>
                <p className="text-xs text-[#4d5156] font-sans leading-relaxed line-clamp-2">
                  {data.metaDescription || 'Meta description will be displayed here in search results.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: SOCIAL OPENGRAPH & TWITTER */}
          {activeTab === 'social' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-slate-200">OpenGraph (Facebook / LinkedIn)</h3>
                <div>
                  <label className="text-[11px] text-slate-400">og:title</label>
                  <input
                    type="text"
                    value={data.openGraph?.title || data.metaTitle}
                    onChange={(e) => onUpdate({
                      ...data,
                      openGraph: { ...data.openGraph, title: e.target.value }
                    })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">og:description</label>
                  <textarea
                    rows={2}
                    value={data.openGraph?.description || data.metaDescription}
                    onChange={(e) => onUpdate({
                      ...data,
                      openGraph: { ...data.openGraph, description: e.target.value }
                    })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-slate-200">Twitter Card (X)</h3>
                <div>
                  <label className="text-[11px] text-slate-400">twitter:title</label>
                  <input
                    type="text"
                    value={data.twitterCard?.title || data.metaTitle}
                    onChange={(e) => onUpdate({
                      ...data,
                      twitterCard: { ...data.twitterCard, title: e.target.value }
                    })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">twitter:description</label>
                  <textarea
                    rows={2}
                    value={data.twitterCard?.description || data.metaDescription}
                    onChange={(e) => onUpdate({
                      ...data,
                      twitterCard: { ...data.twitterCard, description: e.target.value }
                    })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-50"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
