import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  Bot, 
  Sparkles, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  X,
  FilePlus2,
  AlertTriangle
} from 'lucide-react';
import { GuidelineProfile, AgentGuidelineConfig, ProductGuidelines, SEOGuidelines, KeywordItem } from '../types';

interface GuidelineProfileManagerProps {
  profiles: GuidelineProfile[];
  agentConfig: AgentGuidelineConfig;
  currentProduct: ProductGuidelines;
  currentSeo: SEOGuidelines;
  currentKeywords: KeywordItem[];
  onSelectProfile: (profileId: string) => void;
  onUpdateAgentConfig: (config: AgentGuidelineConfig) => void;
  onSaveNewProfile: (name: string, description: string, category: any) => void;
  onCreateBlankProfile?: (name: string, description: string, category: any) => void;
  onUpdateProfile: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onDeleteAllProfiles?: () => void;
  onImportProfiles: (imported: GuidelineProfile[]) => void;
  onResetDefaults: () => void;
}

export const GuidelineProfileManager: React.FC<GuidelineProfileManagerProps> = ({
  profiles,
  agentConfig,
  currentKeywords,
  onSelectProfile,
  onUpdateAgentConfig,
  onSaveNewProfile,
  onCreateBlankProfile,
  onUpdateProfile,
  onDeleteProfile,
  onDeleteAllProfiles,
  onImportProfiles,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalMode, setModalMode] = useState<'snapshot' | 'blank'>('snapshot');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileCategory, setNewProfileCategory] = useState<'saas' | 'ecommerce' | 'health' | 'voice_aeo' | 'geo_citations' | 'custom'>('custom');

  const activeProfile = (profiles || []).find((p) => p.id === agentConfig.activeProfileId);
  const agent1Profile = (profiles || []).find((p) => p.id === agentConfig.agent1ProfileId) || activeProfile;
  const agent2Profile = (profiles || []).find((p) => p.id === agentConfig.agent2ProfileId) || activeProfile;

  const handleOpenCreateModal = (mode: 'snapshot' | 'blank') => {
    setModalMode(mode);
    setNewProfileName(mode === 'blank' ? 'New Blank Profile' : '');
    setNewProfileDesc('');
    setNewProfileCategory('custom');
    setShowSaveModal(true);
  };

  const handleSaveModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    
    if (modalMode === 'blank' && onCreateBlankProfile) {
      onCreateBlankProfile(newProfileName.trim(), newProfileDesc.trim(), newProfileCategory);
    } else {
      onSaveNewProfile(newProfileName.trim(), newProfileDesc.trim(), newProfileCategory);
    }

    setNewProfileName('');
    setNewProfileDesc('');
    setShowSaveModal(false);
  };

  const handleExportJSON = () => {
    if (profiles.length === 0) {
      alert('No saved profiles to export.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profiles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `seo_guideline_profiles_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportProfiles(parsed);
          } else {
            alert('Invalid JSON format. Expected an array of Guideline Profiles.');
          }
        } catch {
          alert('Could not parse JSON file.');
        }
      };
    }
  };

  const handleDeleteAll = () => {
    if (profiles.length === 0) return;
    if (confirm(`Are you sure you want to permanently delete all ${profiles.length} saved guideline profiles? This cannot be undone.`)) {
      if (onDeleteAllProfiles) {
        onDeleteAllProfiles();
      } else {
        profiles.forEach(p => onDeleteProfile(p.id));
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-50 tracking-tight">
                Guideline Profile Storage
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                profiles.length > 0 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {profiles.length} Saved Profile{profiles.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Create, save, update, or delete guideline profiles for brand guardrails, content pillars, and SEO rules.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            id="btn-save-new-profile"
            onClick={() => handleOpenCreateModal('snapshot')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
            title="Save current editor guidelines as a new reusable profile"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save as Profile</span>
          </button>

          <button
            id="btn-create-blank-profile"
            onClick={() => handleOpenCreateModal('blank')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Create a brand new blank profile"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Create Blank</span>
          </button>

          {activeProfile && (
            <button
              id="btn-update-active-profile"
              onClick={() => onUpdateProfile(activeProfile.id)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Overwrite active custom profile with current changes"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Update Saved</span>
            </button>
          )}

          <button
            onClick={handleExportJSON}
            disabled={profiles.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-50 border border-slate-700 transition disabled:opacity-40"
            title="Export all profiles as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <label 
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-50 border border-slate-700 transition cursor-pointer"
            title="Import profiles from JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          {profiles.length > 0 && (
            <button
              id="btn-delete-all-profiles"
              onClick={handleDeleteAll}
              className="flex items-center space-x-1 p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition"
              title="Delete all saved guideline profiles"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>



      {/* STORED PROFILES CATALOG GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Saved Guideline Profiles:</span>
          {profiles.length > 0 && <span className="text-slate-500 text-[11px]">Click any profile card to activate</span>}
        </div>

        {profiles.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-300 font-semibold">No Saved Guideline Profiles</p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                You can write and configure custom product, SEO, and keyword guidelines below. Save them as reusable profiles or create new blank guideline sets anytime.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                onClick={() => handleOpenCreateModal('snapshot')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current Guidelines as Profile</span>
              </button>
              <button
                onClick={() => handleOpenCreateModal('blank')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                <FilePlus2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Create Blank Profile</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map((p) => {
              const isCurrentActive = p.id === agentConfig.activeProfileId;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProfile(p.id)}
                  className={`relative p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between text-left group ${
                    isCurrentActive
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                          p.category === 'saas'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : p.category === 'ecommerce'
                            ? 'bg-amber-500/20 text-amber-300'
                            : p.category === 'health'
                            ? 'bg-rose-500/20 text-rose-300'
                            : p.category === 'voice_aeo'
                            ? 'bg-purple-500/20 text-purple-300'
                            : p.category === 'geo_citations'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {p.category.replace('_', ' ')}
                        </span>
                      </div>

                      {isCurrentActive && (
                        <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-slate-50 group-hover:text-indigo-300 transition">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.description || 'Custom configured guidelines'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center space-x-2">
                      <span>{p.keywords?.length || 0} keywords</span>
                      <span>•</span>
                      <span>{p.productGuidelines?.uniqueSellingPoints?.length || 0} USPs</span>
                    </div>

                    {/* Delete button */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete guideline profile "${p.name}"?`)) {
                            onDeleteProfile(p.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
                        title="Delete this profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / SAVE PROFILE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-50">
                  {modalMode === 'blank' ? 'Create New Blank Guideline Profile' : 'Save Current Guidelines as Profile'}
                </h3>
              </div>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="p-1 text-slate-400 hover:text-slate-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Profile Name *</label>
                <input
                  type="text"
                  required
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Fintech Enterprise SEO, Dental Clinic GEO, E-commerce Chair"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={newProfileCategory}
                  onChange={(e) => setNewProfileCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="saas">B2B SaaS / Enterprise</option>
                  <option value="ecommerce">E-commerce / Physical Product</option>
                  <option value="health">Health & Medical (YMYL)</option>
                  <option value="voice_aeo">Voice Search & AEO Focus</option>
                  <option value="geo_citations">GEO & LLM Citation Authority</option>
                  <option value="custom">Custom Brand / Industry</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  placeholder="Describe the rules, target audience, tone, and compliance goals..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                {modalMode === 'blank' ? (
                  <span>Will create a clean, blank profile template ready for custom guidelines and keywords.</span>
                ) : (
                  <span>Will snapshot current product guidelines, SEO constraints, and <strong className="text-slate-50">{currentKeywords.length} target keywords</strong> into this profile.</span>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-50 bg-slate-800 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
                >
                  {modalMode === 'blank' ? 'Create Blank Profile' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
