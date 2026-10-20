import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Sliders, 
  Key, 
  FileText, 
  ShieldAlert, 
  Award, 
  Volume2, 
  Search,
  Bot
} from 'lucide-react';
import { ProductGuidelines, SEOGuidelines, KeywordItem, SearchIntent } from '../types';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  keywords: KeywordItem[];
  onUpdateProductGuidelines: (g: ProductGuidelines) => void;
  onUpdateSeoGuidelines: (g: SEOGuidelines) => void;
  onUpdateKeywords: (kw: KeywordItem[]) => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({
  isOpen,
  onClose,
  productGuidelines,
  seoGuidelines,
  keywords,
  onUpdateProductGuidelines,
  onUpdateSeoGuidelines,
  onUpdateKeywords,
}) => {
  const [activeTab, setActiveTab] = useState<'product' | 'seo' | 'keywords'>('keywords');

  // Keyword state
  const [newKw, setNewKw] = useState('');
  const [newVolume, setNewVolume] = useState<number>(10000);
  const [newIntent, setNewIntent] = useState<SearchIntent>('commercial');
  const [newPriority, setNewPriority] = useState<'primary' | 'secondary' | 'voice_question' | 'lsi'>('secondary');

  // USP / Value prop input states
  const [newUsp, setNewUsp] = useState('');
  const [newValProp, setNewValProp] = useState('');
  const [newForbidden, setNewForbidden] = useState('');
  const [newSchema, setNewSchema] = useState('');

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    if (!newKw.trim()) return;
    const item: KeywordItem = {
      id: `kw-${Date.now()}`,
      keyword: newKw.trim(),
      searchVolume: Number(newVolume) || 1000,
      intent: newIntent,
      priority: newPriority,
    };
    // Keep sorted by volume descending
    const updated = [...keywords, item].sort((a, b) => b.searchVolume - a.searchVolume);
    onUpdateKeywords(updated);
    setNewKw('');
  };

  const handleRemoveKeyword = (id: string) => {
    onUpdateKeywords(keywords.filter((k) => k.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-50">Guidelines & Target Keywords Manager</h2>
              <p className="text-xs text-slate-400">
                Configure guidelines and target keywords that Agent 2 checks for brand compliance and policy enforcement.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-50 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-6 gap-2">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'keywords'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Target Keywords ({keywords.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('product')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'product'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Product & Brand Guidelines</span>
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'seo'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>SEO, AEO & EEAT Guidelines</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-xs sm:text-sm">
          
          {/* TAB 1: KEYWORDS HIERARCHY */}
          {activeTab === 'keywords' && (
            <div className="space-y-6">
              
              {/* Info banner */}
              <div className="bg-indigo-950/40 border border-indigo-800/40 p-3.5 rounded-xl flex items-start space-x-3 text-xs">
                <Search className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-slate-300">
                  <span className="font-semibold text-indigo-300">Search Volume Hierarchy & Voice Search Matching:</span> Keywords are ranked in descending order of search volume.
                  Guidelines verify that <strong className="text-slate-50">Primary Keyword</strong> is in the H1 and Meta Title, <strong className="text-slate-50">Secondary Keywords</strong> in H2s, and <strong className="text-slate-50">Voice Question Queries</strong> in H3s.
                </div>
              </div>

              {/* Add Keyword Form */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="font-semibold text-xs text-slate-300">Add Target Keyword</div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] text-slate-400 mb-1">Keyword / Voice Query</label>
                    <input
                      type="text"
                      value={newKw}
                      onChange={(e) => setNewKw(e.target.value)}
                      placeholder="e.g. ai workflow automation platform"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Monthly Vol</label>
                    <input
                      type="number"
                      value={newVolume}
                      onChange={(e) => setNewVolume(Number(e.target.value))}
                      placeholder="45000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Intent</label>
                    <select
                      value={newIntent}
                      onChange={(e) => setNewIntent(e.target.value as SearchIntent)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="commercial">Commercial</option>
                      <option value="informational">Informational</option>
                      <option value="transactional">Transactional</option>
                      <option value="navigational">Navigational</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="primary">Primary (#1)</option>
                      <option value="secondary">Secondary</option>
                      <option value="voice_question">Voice Question</option>
                      <option value="lsi">LSI / Semantic</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center transition"
                      title="Add Keyword"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>

              {/* Keyword List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Current Keywords ({keywords.length}) — Sorted by Search Volume</span>
                  <span className="text-[11px] text-slate-500">Highest volume prioritizes primary H1 and Meta Title</span>
                </div>

                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  {(keywords || []).map((kw, idx) => (
                    <div key={kw.id} className="p-3 flex items-center justify-between hover:bg-slate-900/60 transition text-xs">
                      
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-slate-500 text-[11px] w-5 text-right">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100 text-xs sm:text-sm">
                            {kw.keyword}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span className="text-indigo-400 font-mono font-medium">
                              {kw.searchVolume.toLocaleString()} searches/mo
                            </span>
                            <span>•</span>
                            <span className="capitalize">{kw.intent} intent</span>
                            {kw.notes && <span>• {kw.notes}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                          kw.priority === 'primary' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : kw.priority === 'voice_question'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : kw.priority === 'secondary'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          {kw.priority.replace('_', ' ')}
                        </span>
                        
                        <button
                          onClick={() => handleRemoveKeyword(kw.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Remove keyword"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRODUCT GUIDELINES */}
          {activeTab === 'product' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productGuidelines.productName}
                    onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, productName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category / Domain</label>
                  <input
                    type="text"
                    value={productGuidelines.category}
                    onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Audience</label>
                <textarea
                  rows={2}
                  value={productGuidelines.targetAudience}
                  onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, targetAudience: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tone of Voice Guidelines</label>
                <textarea
                  rows={2}
                  value={productGuidelines.toneOfVoice}
                  onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, toneOfVoice: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* USPs List */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Unique Selling Points (USPs)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUsp}
                    onChange={(e) => setNewUsp(e.target.value)}
                    placeholder="Add verified USP..."
                    className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newUsp.trim()) {
                        onUpdateProductGuidelines({
                          ...productGuidelines,
                          uniqueSellingPoints: [...productGuidelines.uniqueSellingPoints, newUsp.trim()],
                        });
                        setNewUsp('');
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(productGuidelines?.uniqueSellingPoints || []).map((usp, i) => (
                    <span key={i} className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs border border-slate-700">
                      <span>{usp}</span>
                      <button
                        onClick={() => {
                          const updated = (productGuidelines?.uniqueSellingPoints || []).filter((_, idx) => idx !== i);
                          onUpdateProductGuidelines({ ...productGuidelines, uniqueSellingPoints: updated });
                        }}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Forbidden Words */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1 text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Forbidden Phrases & Brand Anti-Patterns</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newForbidden}
                    onChange={(e) => setNewForbidden(e.target.value)}
                    placeholder="e.g. Magic, Revolutionary, Guaranteed #1..."
                    className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newForbidden.trim()) {
                        onUpdateProductGuidelines({
                          ...productGuidelines,
                          forbiddenPhrases: [...(productGuidelines?.forbiddenPhrases || []), newForbidden.trim()],
                        });
                        setNewForbidden('');
                      }
                    }}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(productGuidelines?.forbiddenPhrases || []).map((word, i) => (
                    <span key={i} className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-950/40 text-rose-300 text-xs border border-rose-800/40">
                      <span>{word}</span>
                      <button
                        onClick={() => {
                          const updated = (productGuidelines?.forbiddenPhrases || []).filter((_, idx) => idx !== i);
                          onUpdateProductGuidelines({ ...productGuidelines, forbiddenPhrases: updated });
                        }}
                        className="text-rose-400 hover:text-rose-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* EEAT Credentials & Compliance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1 text-emerald-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>EEAT Credentials & Author Authority</span>
                  </label>
                  <textarea
                    rows={2}
                    value={productGuidelines.eeatCredentials}
                    onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, eeatCredentials: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Compliance & Verifiable Citations</label>
                  <textarea
                    rows={2}
                    value={productGuidelines.complianceNotes}
                    onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, complianceNotes: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SEO GUIDELINES */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="font-semibold text-xs text-indigo-300">Title Tag Constraints</div>
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <span>Min:</span>
                    <input
                      type="number"
                      value={seoGuidelines.titleCharRange.min}
                      onChange={(e) => onUpdateSeoGuidelines({
                        ...seoGuidelines,
                        titleCharRange: { ...seoGuidelines.titleCharRange, min: Number(e.target.value) }
                      })}
                      className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-center"
                    />
                    <span>Max:</span>
                    <input
                      type="number"
                      value={seoGuidelines.titleCharRange.max}
                      onChange={(e) => onUpdateSeoGuidelines({
                        ...seoGuidelines,
                        titleCharRange: { ...seoGuidelines.titleCharRange, max: Number(e.target.value) }
                      })}
                      className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-center"
                    />
                    <span>chars</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="font-semibold text-xs text-indigo-300">Meta Description Constraints</div>
                  <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <span>Min:</span>
                    <input
                      type="number"
                      value={seoGuidelines.metaDescCharRange.min}
                      onChange={(e) => onUpdateSeoGuidelines({
                        ...seoGuidelines,
                        metaDescCharRange: { ...seoGuidelines.metaDescCharRange, min: Number(e.target.value) }
                      })}
                      className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-center"
                    />
                    <span>Max:</span>
                    <input
                      type="number"
                      value={seoGuidelines.metaDescCharRange.max}
                      onChange={(e) => onUpdateSeoGuidelines({
                        ...seoGuidelines,
                        metaDescCharRange: { ...seoGuidelines.metaDescCharRange, max: Number(e.target.value) }
                      })}
                      className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-center"
                    />
                    <span>chars</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Heading Hierarchy & Voice Search Rules</label>
                <textarea
                  rows={3}
                  value={seoGuidelines.headingHierarchyRules}
                  onChange={(e) => onUpdateSeoGuidelines({ ...seoGuidelines, headingHierarchyRules: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Schema Requirements */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Required Schema.org Types</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSchema}
                    onChange={(e) => setNewSchema(e.target.value)}
                    placeholder="e.g. Product, SoftwareApplication, FAQPage, Organization..."
                    className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSchema.trim()) {
                        onUpdateSeoGuidelines({
                          ...seoGuidelines,
                          schemaRequirements: [...seoGuidelines.schemaRequirements, newSchema.trim()],
                        });
                        setNewSchema('');
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Add Schema Type
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(seoGuidelines?.schemaRequirements || []).map((sch, i) => (
                    <span key={i} className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-950/50 text-blue-300 text-xs border border-blue-800/40 font-mono">
                      <span>{sch}</span>
                      <button
                        onClick={() => {
                          const updated = (seoGuidelines?.schemaRequirements || []).filter((_, idx) => idx !== i);
                          onUpdateSeoGuidelines({ ...seoGuidelines, schemaRequirements: updated });
                        }}
                        className="text-blue-400 hover:text-rose-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GEO (Generative Engine Optimization) & LLM Citation Rules</label>
                <textarea
                  rows={2}
                  value={seoGuidelines.customRules}
                  onChange={(e) => onUpdateSeoGuidelines({ ...seoGuidelines, customRules: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md"
          >
            Save & Close Guidelines
          </button>
        </div>

      </div>
    </div>
  );
};
