import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Search, 
  Mic, 
  Bot, 
  TrendingUp, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { ContentComponent, KeywordItem, ProductGuidelines, SEOGuidelines, H2OptimizationItem } from '../types';
import { safeApiPost } from '../lib/api';

interface H2OptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: ContentComponent[];
  keywords: KeywordItem[];
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  onApplyH2s: (updatedComponents: ContentComponent[], summary: string) => void;
}

export const H2OptimizerModal: React.FC<H2OptimizerModalProps> = ({
  isOpen,
  onClose,
  components,
  keywords,
  productGuidelines,
  seoGuidelines,
  onApplyH2s,
}) => {
  const [optimizationMode, setOptimizationMode] = useState<'balanced' | 'voice_aeo' | 'geo_eeat' | 'keyword_volume'>('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<H2OptimizationItem[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Total H2s found across all components
  const existingH2Count = components.reduce((acc, comp) => {
    return acc + (comp.headings?.filter((h) => h.tag?.toLowerCase() === 'h2').length || 0);
  }, 0);

  // Trigger H2 Optimization API
  const handleGenerateOptimizations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await safeApiPost<{
        items?: H2OptimizationItem[];
        summary?: string;
      }>('/api/optimize-h2s', {
        components,
        keywords,
        productGuidelines,
        seoGuidelines,
        mode: optimizationMode,
      });

      setItems(data.items || []);
      setSummary(data.summary || '');
      setHasGenerated(true);
    } catch (err: any) {
      console.error('Error optimizing H2s:', err);
      setError(err.message || 'H2 optimization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle selection of specific H2 item
  const handleToggleSelect = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  // Edit an optimized text value
  const handleEditText = (index: number, newText: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, optimizedText: newText } : item))
    );
  };

  // Apply selected H2s back to components
  const handleApply = () => {
    const selectedItems = items.filter((item) => item.selected);
    if (selectedItems.length === 0) return;

    const updatedComponents = components.map((comp) => {
      const compItems = selectedItems.filter((it) => it.componentId === comp.id);
      if (compItems.length === 0) return comp;

      let itemIndex = 0;
      const updatedHeadings = (comp.headings || []).map((h) => {
        if (h.tag?.toLowerCase() === 'h2' && itemIndex < compItems.length) {
          const match = compItems[itemIndex];
          itemIndex++;
          return {
            ...h,
            text: match.optimizedText,
            voiceIntent: match.voiceIntent,
          };
        }
        return h;
      });

      return {
        ...comp,
        headings: updatedHeadings,
        status: 'recently_fixed' as const,
      };
    });

    onApplyH2s(updatedComponents, summary || 'H2 headings updated according to Voice Search, AEO, GEO, and SEO keyword guidelines.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-50">H2 Subheadings Optimizer</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Voice AEO • GEO • SEO Keywords
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transform standard H2s into high-ranking conversational questions, entity-rich citations, and search volume keyword targets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-50 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">
          
          {/* Configuration & Mode Selection */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Select Optimization Strategy</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Found {existingH2Count} H2 subheadings across {components.length} components.
                </p>
              </div>

              {/* Mode Badges */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'balanced', label: 'Balanced (All Engines)', icon: Zap },
                  { id: 'voice_aeo', label: 'Voice Search & AEO', icon: Mic },
                  { id: 'geo_eeat', label: 'GEO & LLM Authority', icon: ShieldCheck },
                  { id: 'keyword_volume', label: 'High Search Volume', icon: TrendingUp },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = optimizationMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setOptimizationMode(mode.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keyword chips preview */}
            <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Available Keywords:</span>
              {keywords.map((kw) => (
                <span
                  key={kw.id}
                  className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-1"
                >
                  <span>{kw.keyword}</span>
                  <span className="text-[11px] text-indigo-400 font-mono">({kw.searchVolume.toLocaleString()}/mo)</span>
                </span>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleGenerateOptimizations}
                disabled={isLoading || existingH2Count === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>{isLoading ? 'Optimizing H2s with AI...' : 'Run H2 Voice & SEO Optimization'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Results List */}
          {hasGenerated && items.length > 0 && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Optimized H2 Subheadings ({items.filter(i => i.selected).length}/{items.length} Selected)
                  </h3>
                  <p className="text-xs text-slate-400">{summary}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setItems(prev => prev.map(i => ({ ...i, selected: true })))}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => setItems(prev => prev.map(i => ({ ...i, selected: false })))}
                    className="text-xs text-slate-400 hover:text-slate-300 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.selected
                        ? 'bg-slate-950 border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/50 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1">
                        
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSelect(idx)}
                          className="mt-1 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                        />

                        <div className="space-y-2 flex-1">
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              H2 • {item.componentName}
                            </span>

                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                              <Mic className="w-2.5 h-2.5" />
                              <span>{item.voiceIntent}</span>
                            </span>

                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                              <TrendingUp className="w-2.5 h-2.5" />
                              <span>KW: {item.targetKeyword} ({item.searchVolume.toLocaleString()}/mo)</span>
                            </span>
                          </div>

                          {/* Before & After comparison */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            
                            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                Original Scraped H2:
                              </span>
                              <p className="text-xs text-rose-300/90 line-through decoration-rose-500/50">
                                {item.originalText || 'Untitled H2'}
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-1">
                              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center space-x-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Optimized H2 (Editable):</span>
                              </span>
                              <input
                                type="text"
                                value={item.optimizedText}
                                onChange={(e) => handleEditText(idx, e.target.value)}
                                className="w-full p-1.5 bg-slate-900 border border-indigo-500/40 rounded-lg text-xs font-semibold text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                            </div>

                          </div>

                          <p className="text-[11px] text-slate-400 pt-1">
                            <span className="font-semibold text-slate-300">Strategic Rationale: </span>
                            {item.rationale}
                          </p>

                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-50 hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!hasGenerated || items.filter(i => i.selected).length === 0}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center space-x-2 transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Apply Selected H2s to Page ({items.filter(i => i.selected).length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
