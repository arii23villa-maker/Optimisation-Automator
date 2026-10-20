import React, { useEffect, useState } from 'react';
import { Header, ThemeMode } from './components/Header';
import { GuidelinesTab } from './components/GuidelinesTab';
import { ScrapeFixTab } from './components/ScrapeFixTab';
import { LiveWebpageView } from './components/LiveWebpageView';
import { DiffPreviewModal } from './components/DiffPreviewModal';
import { CodeExportModal } from './components/CodeExportModal';
import { BeforeAfterViewer } from './components/BeforeAfterViewer';
import { 
  DEFAULT_PRODUCT_GUIDELINES, 
  DEFAULT_SEO_GUIDELINES, 
  DEFAULT_GEO_GUIDELINES,
  DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES,
  DEFAULT_STRUCTURE_MAPPING_GUIDELINES,
  DEFAULT_KEYWORDS, 
  DEFAULT_BACKEND_SEO, 
  DEFAULT_COMPONENTS 
} from './data/defaults';
import { 
  loadStoredProfiles, 
  saveProfilesToStorage, 
  resetToDefaultProfiles,
  loadGlobalContentGuidelines,
  saveGlobalContentGuidelines,
  loadGlobalSeoGuidelines,
  saveGlobalSeoGuidelines,
  loadGlobalGeoGuidelines,
  saveGlobalGeoGuidelines,
  loadGlobalCustomerCentricityGuidelines,
  saveGlobalCustomerCentricityGuidelines,
  loadGlobalStructureMappingGuidelines,
  saveGlobalStructureMappingGuidelines,
  loadSavedContentPresets,
  saveSavedContentPresets,
  loadSavedSeoPresets,
  saveSavedSeoPresets,
  loadSavedGeoPresets,
  saveSavedGeoPresets,
  loadSavedProductPresets,
  saveSavedProductPresets,
  loadSavedCustomerCentricityPresets,
  saveSavedCustomerCentricityPresets,
  loadSavedStructureMappingPresets,
  saveSavedStructureMappingPresets,
  loadWorkingProductGuidelines,
  saveWorkingProductGuidelines
} from './data/defaultProfiles';
import { 
  ProductGuidelines, 
  SEOGuidelines, 
  GEOGuidelines,
  ContentGuidelines,
  CustomerCentricityGuidelines,
  StructureMappingGuidelines,
  SavedContentGuideline,
  SavedSeoGuideline,
  SavedGeoGuideline,
  SavedProductGuideline,
  SavedCustomerCentricityGuideline,
  SavedStructureMappingGuideline,
  KeywordItem, 
  SEOBackendData, 
  ContentComponent, 
  AuditSummary, 
  AuditFlag, 
  FixResult,
  GuidelineProfile,
  AgentGuidelineConfig,
  OrchestratorReport,
  NineAgentScores,
  ScoreSnapshot,
  PipelineProgressEvent,
  PipelineVerdict
} from './types';
import { 
  calculateNineAgentScores, 
  buildAgentScoreBreakdown, 
  buildScoreSnapshot 
} from './services/scoringEngine';
import { safeApiPost, runPipelineStream } from './lib/api';
import type { RevisionScope } from './services/pageDraft';
import { CheckCircle2, AlertCircle, Bot, Sparkles } from 'lucide-react';

export default function App() {
  // Main Tab Navigation State: 'guidelines' | 'scrape_fix' | 'webpage'
  const [activeTab, setActiveTab] = useState<'guidelines' | 'scrape_fix' | 'webpage'>('scrape_fix');

  // Light theme by default; the choice is remembered per browser.
  const [theme, setTheme] = useState<ThemeMode>(() =>
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('co-theme', theme);
    } catch {
      /* storage may be unavailable */
    }
  }, [theme]);

  // Guideline Profiles & Agent Routing State
  const [profiles, setProfiles] = useState<GuidelineProfile[]>(() => loadStoredProfiles());
  const [agentConfig, setAgentConfig] = useState<AgentGuidelineConfig>(() => {
    const saved = localStorage.getItem('agent_guideline_config_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse agent config from storage:', e);
      }
    }
    const defaultId = profiles[0]?.id || '';
    return {
      unified: true,
      activeProfileId: defaultId,
      agent1ProfileId: defaultId,
      agent2ProfileId: defaultId,
    };
  });

  // Saved Guideline Presets
  const [savedContentPresets, setSavedContentPresets] = useState<SavedContentGuideline[]>(() => {
    return loadSavedContentPresets();
  });
  const [savedSeoPresets, setSavedSeoPresets] = useState<SavedSeoGuideline[]>(() => {
    return loadSavedSeoPresets();
  });
  const [savedGeoPresets, setSavedGeoPresets] = useState<SavedGeoGuideline[]>(() => {
    return loadSavedGeoPresets();
  });
  const [savedProductPresets, setSavedProductPresets] = useState<SavedProductGuideline[]>(() => {
    return loadSavedProductPresets();
  });
  const [savedStructureMappingPresets, setSavedStructureMappingPresets] = useState<SavedStructureMappingGuideline[]>(() => {
    return loadSavedStructureMappingPresets();
  });
  const [savedCustomerCentricityPresets, setSavedCustomerCentricityPresets] = useState<SavedCustomerCentricityGuideline[]>(() => {
    return loadSavedCustomerCentricityPresets();
  });

  // Active Preset Tracking
  const [activeContentPresetId, setActiveContentPresetId] = useState<string>(() => {
    return localStorage.getItem('active_content_preset_id') || 'bfl-content-standard';
  });
  const [activeSeoPresetId, setActiveSeoPresetId] = useState<string>(() => {
    return localStorage.getItem('active_seo_preset_id') || 'seo-preset-strict-eeat';
  });
  const [activeGeoPresetId, setActiveGeoPresetId] = useState<string>(() => {
    return localStorage.getItem('active_geo_preset_id') || 'geo-preset-master-citation';
  });
  const [activeProductPresetId, setActiveProductPresetId] = useState<string>(() => {
    return localStorage.getItem('active_product_preset_id') || 'bfl-product-personal-loan';
  });
  const [activeStructureMappingPresetId, setActiveStructureMappingPresetId] = useState<string>(() => {
    return localStorage.getItem('active_structure_mapping_preset_id') || 'structure-preset-voice-aeo';
  });
  const [activeCustomerCentricityPresetId, setActiveCustomerCentricityPresetId] = useState<string>(() => {
    return localStorage.getItem('active_customer_centricity_preset_id') || 'customer-preset-ymyl-empathy';
  });

  // Current Active Working Guidelines & Keywords
  const [contentGuidelines, setContentGuidelines] = useState<ContentGuidelines>(() => {
    return loadGlobalContentGuidelines();
  });
  const [productGuidelines, setProductGuidelines] = useState<ProductGuidelines>(() => {
    return loadWorkingProductGuidelines(profiles, agentConfig.activeProfileId);
  });
  const [seoGuidelines, setSeoGuidelines] = useState<SEOGuidelines>(() => {
    return loadGlobalSeoGuidelines();
  });
  const [geoGuidelines, setGeoGuidelines] = useState<GEOGuidelines>(() => {
    return loadGlobalGeoGuidelines();
  });
  const [structureMappingGuidelines, setStructureMappingGuidelines] = useState<StructureMappingGuidelines>(() => {
    return loadGlobalStructureMappingGuidelines();
  });
  const [customerCentricityGuidelines, setCustomerCentricityGuidelines] = useState<CustomerCentricityGuidelines>(() => {
    return loadGlobalCustomerCentricityGuidelines();
  });
  const [keywords, setKeywords] = useState<KeywordItem[]>(() => {
    const active = profiles.find(p => p.id === agentConfig.activeProfileId);
    return active?.keywords || profiles[0]?.keywords || DEFAULT_KEYWORDS;
  });

  // ==================== CONTENT GUIDELINES HANDLERS ====================
  const handleSaveContentGuidelines = (updated: ContentGuidelines) => {
    setContentGuidelines(updated);
    saveGlobalContentGuidelines(updated);
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, contentGuidelines: updated, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast('Content Guidelines saved successfully.', 'success');
  };

  const handleSaveNewContentGuideline = (name: string, description?: string) => {
    const newPreset: SavedContentGuideline = {
      id: `content-preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      description: description?.trim() || 'Custom Content Guidelines',
      guidelines: { ...contentGuidelines },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false
    };
    const updated = [...savedContentPresets, newPreset];
    setSavedContentPresets(updated);
    saveSavedContentPresets(updated);
    setActiveContentPresetId(newPreset.id);
    try { localStorage.setItem('active_content_preset_id', newPreset.id); } catch (_) {}
    showToast(`Created & Selected new Content Guideline: "${name}"`, 'success');
  };

  const handleSelectContentPreset = (presetId: string) => {
    const preset = (savedContentPresets || []).find(p => p.id === presetId);
    if (!preset) return;
    setContentGuidelines({ ...preset.guidelines });
    saveGlobalContentGuidelines(preset.guidelines);
    setActiveContentPresetId(presetId);
    try { localStorage.setItem('active_content_preset_id', presetId); } catch (_) {}
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, contentGuidelines: { ...preset.guidelines }, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast(`Applied Content Guideline: "${preset.name}"`, 'success');
  };

  const handleDeleteContentPreset = (presetId: string) => {
    const updated = savedContentPresets.filter(p => p.id !== presetId);
    setSavedContentPresets(updated);
    saveSavedContentPresets(updated);
    if (activeContentPresetId === presetId) {
      const fallback = updated[0]?.id || '';
      setActiveContentPresetId(fallback);
      try { localStorage.setItem('active_content_preset_id', fallback); } catch (_) {}
    }
    showToast('Custom Content Guideline deleted.', 'info');
  };

  // ==================== SEO GUIDELINES HANDLERS ====================
  const handleSaveSeoGuidelines = (updated: SEOGuidelines) => {
    setSeoGuidelines(updated);
    saveGlobalSeoGuidelines(updated);
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, seoGuidelines: updated, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast('SEO Guidelines saved successfully.', 'success');
  };

  const handleSaveNewSeoGuideline = (name: string, description?: string) => {
    const newPreset: SavedSeoGuideline = {
      id: `seo-preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      description: description?.trim() || 'Custom SEO Guidelines',
      guidelines: { ...seoGuidelines },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false
    };
    const updated = [...savedSeoPresets, newPreset];
    setSavedSeoPresets(updated);
    saveSavedSeoPresets(updated);
    setActiveSeoPresetId(newPreset.id);
    try { localStorage.setItem('active_seo_preset_id', newPreset.id); } catch (_) {}
    showToast(`Created & Selected new SEO Guideline: "${name}"`, 'success');
  };

  const handleSelectSeoPreset = (presetId: string) => {
    const preset = (savedSeoPresets || []).find(p => p.id === presetId);
    if (!preset) return;
    setSeoGuidelines({ ...preset.guidelines });
    saveGlobalSeoGuidelines(preset.guidelines);
    setActiveSeoPresetId(presetId);
    try { localStorage.setItem('active_seo_preset_id', presetId); } catch (_) {}
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, seoGuidelines: { ...preset.guidelines }, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast(`Applied SEO Guideline: "${preset.name}"`, 'success');
  };

  const handleDeleteSeoPreset = (presetId: string) => {
    const updated = savedSeoPresets.filter(p => p.id !== presetId);
    setSavedSeoPresets(updated);
    saveSavedSeoPresets(updated);
    if (activeSeoPresetId === presetId) {
      const fallback = updated[0]?.id || '';
      setActiveSeoPresetId(fallback);
      try { localStorage.setItem('active_seo_preset_id', fallback); } catch (_) {}
    }
    showToast('Custom SEO Guideline deleted.', 'info');
  };

  // ==================== GEO GUIDELINES HANDLERS ====================
  const handleSaveGeoGuidelines = (updated: GEOGuidelines) => {
    setGeoGuidelines(updated);
    saveGlobalGeoGuidelines(updated);
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, geoGuidelines: updated, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast('GEO Guidelines saved successfully.', 'success');
  };

  const handleSaveNewGeoGuideline = (name: string, description?: string) => {
    const newPreset: SavedGeoGuideline = {
      id: `geo-preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      description: description?.trim() || 'Custom GEO Guidelines',
      guidelines: { ...geoGuidelines },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false
    };
    const updated = [...savedGeoPresets, newPreset];
    setSavedGeoPresets(updated);
    saveSavedGeoPresets(updated);
    setActiveGeoPresetId(newPreset.id);
    try { localStorage.setItem('active_geo_preset_id', newPreset.id); } catch (_) {}
    showToast(`Created & Selected new GEO Guideline: "${name}"`, 'success');
  };

  const handleSelectGeoPreset = (presetId: string) => {
    const preset = (savedGeoPresets || []).find(p => p.id === presetId);
    if (!preset) return;
    setGeoGuidelines({ ...preset.guidelines });
    saveGlobalGeoGuidelines(preset.guidelines);
    setActiveGeoPresetId(presetId);
    try { localStorage.setItem('active_geo_preset_id', presetId); } catch (_) {}
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, geoGuidelines: { ...preset.guidelines }, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast(`Applied GEO Guideline: "${preset.name}"`, 'success');
  };

  const handleDeleteGeoPreset = (presetId: string) => {
    const updated = savedGeoPresets.filter(p => p.id !== presetId);
    setSavedGeoPresets(updated);
    saveSavedGeoPresets(updated);
    if (activeGeoPresetId === presetId) {
      const fallback = updated[0]?.id || '';
      setActiveGeoPresetId(fallback);
      try { localStorage.setItem('active_geo_preset_id', fallback); } catch (_) {}
    }
    showToast('Custom GEO Guideline deleted.', 'info');
  };

  // ==================== PRODUCT GUIDELINES & PRESETS HANDLERS ====================
  const handleSaveProductGuidelines = (updated: ProductGuidelines) => {
    setProductGuidelines(updated);
    saveWorkingProductGuidelines(updated);
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, productGuidelines: updated, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
      const activeName = (profiles || []).find(p => p.id === agentConfig.activeProfileId)?.name || 'Active Profile';
      showToast(`Product Guidelines saved for "${activeName}".`, 'success');
    } else {
      showToast('Product Guidelines saved to working storage.', 'success');
    }
  };

  const handleSelectProductPreset = (presetId: string) => {
    const preset = (savedProductPresets || []).find(p => p.id === presetId);
    if (!preset) return;
    setProductGuidelines({ ...preset.guidelines });
    saveWorkingProductGuidelines(preset.guidelines);
    setActiveProductPresetId(presetId);
    try { localStorage.setItem('active_product_preset_id', presetId); } catch (_) {}
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, productGuidelines: { ...preset.guidelines }, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast(`Applied Product Guideline: "${preset.name}"`, 'success');
  };

  const handleSaveNewProductGuideline = (name: string, description?: string, category?: any) => {
    const newProductPreset: SavedProductGuideline = {
      id: `product-preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim() || productGuidelines.productName || 'New Product Preset',
      description: description?.trim() || 'Custom Product Guidelines',
      category: category || 'b2b_saas',
      guidelines: { ...productGuidelines, productName: productGuidelines.productName || name.trim() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false
    };
    const updatedPresets = [...savedProductPresets, newProductPreset];
    setSavedProductPresets(updatedPresets);
    saveSavedProductPresets(updatedPresets);
    setActiveProductPresetId(newProductPreset.id);
    try { localStorage.setItem('active_product_preset_id', newProductPreset.id); } catch (_) {}

    // Also register as a Profile for agent routing
    const newProfile: GuidelineProfile = {
      id: `profile-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim() || productGuidelines.productName || 'New Product Profile',
      description: description?.trim() || 'Custom Product Guidelines',
      category: category || 'custom',
      isBuiltIn: false,
      productGuidelines: { ...newProductPreset.guidelines },
      seoGuidelines: { ...seoGuidelines },
      geoGuidelines: { ...geoGuidelines },
      contentGuidelines: { ...contentGuidelines },
      keywords: [...keywords],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    saveProfilesToStorage(updatedProfiles);
    saveWorkingProductGuidelines(newProfile.productGuidelines);

    const newConfig: AgentGuidelineConfig = {
      ...agentConfig,
      activeProfileId: newProfile.id,
      agent1ProfileId: newProfile.id,
      agent2ProfileId: newProfile.id,
    };
    handleUpdateAgentConfig(newConfig);
    showToast(`Created & Applied new Product Guideline: "${newProductPreset.name}"`, 'success');
  };

  const handleDeleteProductPreset = (presetId: string) => {
    const updated = savedProductPresets.filter(p => p.id !== presetId);
    setSavedProductPresets(updated);
    saveSavedProductPresets(updated);
    if (activeProductPresetId === presetId) {
      const fallback = updated[0]?.id || '';
      setActiveProductPresetId(fallback);
      try { localStorage.setItem('active_product_preset_id', fallback); } catch (_) {}
    }
    showToast('Custom Product Guideline deleted.', 'info');
  };

  const handleCreateBlankProductGuideline = () => {
    setProductGuidelines({ ...DEFAULT_PRODUCT_GUIDELINES });
    saveWorkingProductGuidelines({ ...DEFAULT_PRODUCT_GUIDELINES });
    showToast('Cleared product guidelines to blank template.', 'info');
  };

  // ==================== STRUCTURE & KEYWORD MAPPING GUIDELINES HANDLERS (AGENT 4) ====================
  const handleSaveStructureMappingGuidelines = (updated: StructureMappingGuidelines) => {
    setStructureMappingGuidelines(updated);
    saveGlobalStructureMappingGuidelines(updated);
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, structureMappingGuidelines: updated, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast('Structure & Keyword Mapping Guidelines saved successfully.', 'success');
  };

  const handleSaveNewStructureMappingGuideline = (name: string, description?: string) => {
    const newPreset: SavedStructureMappingGuideline = {
      id: `structure-preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      description: description?.trim() || 'Custom Structure & Heading Mapping Guidelines',
      guidelines: { ...structureMappingGuidelines },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false
    };
    const updated = [...savedStructureMappingPresets, newPreset];
    setSavedStructureMappingPresets(updated);
    saveSavedStructureMappingPresets(updated);
    setActiveStructureMappingPresetId(newPreset.id);
    try { localStorage.setItem('active_structure_mapping_preset_id', newPreset.id); } catch (_) {}
    showToast(`Created & Selected Structure Guideline: "${name}"`, 'success');
  };

  const handleSelectStructureMappingPreset = (presetId: string) => {
    const preset = (savedStructureMappingPresets || []).find(p => p.id === presetId);
    if (!preset) return;
    setStructureMappingGuidelines({ ...preset.guidelines });
    saveGlobalStructureMappingGuidelines(preset.guidelines);
    setActiveStructureMappingPresetId(presetId);
    try { localStorage.setItem('active_structure_mapping_preset_id', presetId); } catch (_) {}
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, structureMappingGuidelines: { ...preset.guidelines }, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast(`Applied Structure Guideline: "${preset.name}"`, 'success');
  };

  const handleDeleteStructureMappingPreset = (presetId: string) => {
    const updated = savedStructureMappingPresets.filter(p => p.id !== presetId);
    setSavedStructureMappingPresets(updated);
    saveSavedStructureMappingPresets(updated);
    if (activeStructureMappingPresetId === presetId) {
      const fallback = updated[0]?.id || '';
      setActiveStructureMappingPresetId(fallback);
      try { localStorage.setItem('active_structure_mapping_preset_id', fallback); } catch (_) {}
    }
    showToast('Custom Structure Guideline deleted.', 'info');
  };

  // ==================== CUSTOMER CENTRICITY GUIDELINES HANDLERS (AGENT 5) ====================
  const handleSaveCustomerCentricityGuidelines = (updated: CustomerCentricityGuidelines) => {
    setCustomerCentricityGuidelines(updated);
    saveGlobalCustomerCentricityGuidelines(updated);
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, customerCentricityGuidelines: updated, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast('Customer Centricity & UX Guidelines saved successfully.', 'success');
  };

  const handleSaveNewCustomerCentricityGuideline = (name: string, description?: string) => {
    const newPreset: SavedCustomerCentricityGuideline = {
      id: `customer-preset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      description: description?.trim() || 'Custom Customer Centricity Guidelines',
      guidelines: { ...customerCentricityGuidelines },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false
    };
    const updated = [...savedCustomerCentricityPresets, newPreset];
    setSavedCustomerCentricityPresets(updated);
    saveSavedCustomerCentricityPresets(updated);
    setActiveCustomerCentricityPresetId(newPreset.id);
    try { localStorage.setItem('active_customer_centricity_preset_id', newPreset.id); } catch (_) {}
    showToast(`Created & Selected Customer Centricity Guideline: "${name}"`, 'success');
  };

  const handleSelectCustomerCentricityPreset = (presetId: string) => {
    const preset = (savedCustomerCentricityPresets || []).find(p => p.id === presetId);
    if (!preset) return;
    setCustomerCentricityGuidelines({ ...preset.guidelines });
    saveGlobalCustomerCentricityGuidelines(preset.guidelines);
    setActiveCustomerCentricityPresetId(presetId);
    try { localStorage.setItem('active_customer_centricity_preset_id', presetId); } catch (_) {}
    if (agentConfig.activeProfileId) {
      const updatedProfiles = profiles.map(p => 
        p.id === agentConfig.activeProfileId 
          ? { ...p, customerCentricityGuidelines: { ...preset.guidelines }, updatedAt: new Date().toISOString() } 
          : p
      );
      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);
    }
    showToast(`Applied Customer Centricity Guideline: "${preset.name}"`, 'success');
  };

  const handleDeleteCustomerCentricityPreset = (presetId: string) => {
    const updated = savedCustomerCentricityPresets.filter(p => p.id !== presetId);
    setSavedCustomerCentricityPresets(updated);
    saveSavedCustomerCentricityPresets(updated);
    if (activeCustomerCentricityPresetId === presetId) {
      const fallback = updated[0]?.id || '';
      setActiveCustomerCentricityPresetId(fallback);
      try { localStorage.setItem('active_customer_centricity_preset_id', fallback); } catch (_) {}
    }
    showToast('Custom Customer Centricity Guideline deleted.', 'info');
  };

  // Autofill keywords toggle & loading state
  const [autoExtractKeywords, setAutoExtractKeywords] = useState<boolean>(true);
  const [isAutofillingKeywords, setIsAutofillingKeywords] = useState<boolean>(false);

  // Content & SEO Backend State
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [backendData, setBackendData] = useState<SEOBackendData>(DEFAULT_BACKEND_SEO);
  const [components, setComponents] = useState<ContentComponent[]>(DEFAULT_COMPONENTS);

  // Agent 1 & 2 Execution State
  const [hasAudited, setHasAudited] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isFixing, setIsFixing] = useState<boolean>(false);
  const [fixingComponentId, setFixingComponentId] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);

  // Audit Results
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [auditFlags, setAuditFlags] = useState<AuditFlag[]>([]);
  const [orchestratorReport, setOrchestratorReport] = useState<OrchestratorReport | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgressEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Fix Results & Modals
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isDiffOpen, setIsDiffOpen] = useState<boolean>(false);
  const [isGlobalCompareOpen, setIsGlobalCompareOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync agentConfig to localStorage
  const handleUpdateAgentConfig = (config: AgentGuidelineConfig) => {
    setAgentConfig(config);
    localStorage.setItem('agent_guideline_config_v1', JSON.stringify(config));
  };

  // Select and Activate a Stored Guideline Profile
  const handleSelectProfile = (profileId: string) => {
    const selected = (profiles || []).find(p => p.id === profileId);
    if (!selected) return;

    setProductGuidelines(selected.productGuidelines);
    saveWorkingProductGuidelines(selected.productGuidelines);

    if (selected.contentGuidelines) {
      setContentGuidelines(selected.contentGuidelines);
      saveGlobalContentGuidelines(selected.contentGuidelines);
    }
    if (selected.geoGuidelines) {
      setGeoGuidelines(selected.geoGuidelines);
      saveGlobalGeoGuidelines(selected.geoGuidelines);
    }
    if (selected.structureMappingGuidelines) {
      setStructureMappingGuidelines(selected.structureMappingGuidelines);
      saveGlobalStructureMappingGuidelines(selected.structureMappingGuidelines);
    }
    if (selected.customerCentricityGuidelines) {
      setCustomerCentricityGuidelines(selected.customerCentricityGuidelines);
      saveGlobalCustomerCentricityGuidelines(selected.customerCentricityGuidelines);
    }
    setSeoGuidelines(selected.seoGuidelines);
    saveGlobalSeoGuidelines(selected.seoGuidelines);
    setKeywords(selected.keywords);

    const newConfig: AgentGuidelineConfig = {
      ...agentConfig,
      activeProfileId: profileId,
      ...(agentConfig.unified ? { agent1ProfileId: profileId, agent2ProfileId: profileId } : {})
    };
    handleUpdateAgentConfig(newConfig);

    showToast(`Loaded Profile "${selected.name}"! Working guidelines and keywords updated.`, 'success');
  };

  // Save Current Editor state as a New Stored Profile
  const handleSaveNewProfile = (name: string, description: string, category: any) => {
    const newProfile: GuidelineProfile = {
      id: `profile-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      description: description.trim() || 'Custom user configured SEO & Product Guidelines',
      category: category || 'custom',
      isBuiltIn: false,
      productGuidelines: { ...productGuidelines },
      contentGuidelines: { ...contentGuidelines },
      seoGuidelines: { ...seoGuidelines },
      geoGuidelines: { ...geoGuidelines },
      structureMappingGuidelines: { ...structureMappingGuidelines },
      customerCentricityGuidelines: { ...customerCentricityGuidelines },
      keywords: [...keywords],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    saveProfilesToStorage(updated);
    saveWorkingProductGuidelines(newProfile.productGuidelines);

    const newConfig: AgentGuidelineConfig = {
      ...agentConfig,
      activeProfileId: newProfile.id,
      agent1ProfileId: newProfile.id,
      agent2ProfileId: newProfile.id,
    };
    handleUpdateAgentConfig(newConfig);

    showToast(`Created & Saved Guideline Profile: "${name}"`, 'success');
  };

  // Create a brand new blank profile
  const handleCreateBlankProfile = (name: string, description: string, category: any) => {
    const newProfile: GuidelineProfile = {
      id: `profile-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim() || 'New Blank Profile',
      description: description.trim() || 'Custom blank guideline profile',
      category: category || 'custom',
      isBuiltIn: false,
      productGuidelines: { ...DEFAULT_PRODUCT_GUIDELINES },
      seoGuidelines: { ...DEFAULT_SEO_GUIDELINES },
      geoGuidelines: { ...DEFAULT_GEO_GUIDELINES },
      structureMappingGuidelines: { ...DEFAULT_STRUCTURE_MAPPING_GUIDELINES },
      customerCentricityGuidelines: { ...DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES },
      keywords: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    saveProfilesToStorage(updated);
    handleSelectProfile(newProfile.id);

    showToast(`Created blank guideline profile: "${newProfile.name}"`, 'success');
  };

  // Update an existing custom profile
  const handleUpdateProfile = (profileId: string) => {
    const target = (profiles || []).find(p => p.id === profileId);
    if (!target) return;

    const updated = profiles.map(p => {
      if (p.id === profileId) {
        return {
          ...p,
          productGuidelines: { ...productGuidelines },
          contentGuidelines: { ...contentGuidelines },
          seoGuidelines: { ...seoGuidelines },
          geoGuidelines: { ...geoGuidelines },
          structureMappingGuidelines: { ...structureMappingGuidelines },
          customerCentricityGuidelines: { ...customerCentricityGuidelines },
          keywords: [...keywords],
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProfiles(updated);
    saveProfilesToStorage(updated);
    showToast(`Updated Profile "${target.name}" with current editor state.`, 'success');
  };

  // Delete a stored custom profile
  const handleDeleteProfile = (profileId: string) => {
    const updated = profiles.filter(p => p.id !== profileId);
    setProfiles(updated);
    saveProfilesToStorage(updated);

    if (agentConfig.activeProfileId === profileId) {
      const fallback = updated[0]?.id || '';
      if (fallback) {
        handleSelectProfile(fallback);
      } else {
        handleUpdateAgentConfig({
          ...agentConfig,
          activeProfileId: '',
          agent1ProfileId: agentConfig.agent1ProfileId === profileId ? '' : agentConfig.agent1ProfileId,
          agent2ProfileId: agentConfig.agent2ProfileId === profileId ? '' : agentConfig.agent2ProfileId,
        });
      }
    }
    showToast('Guideline profile deleted.', 'info');
  };

  // Delete all stored profiles
  const handleDeleteAllProfiles = () => {
    resetToDefaultProfiles();
    setProfiles([]);
    handleUpdateAgentConfig({
      ...agentConfig,
      activeProfileId: '',
      agent1ProfileId: '',
      agent2ProfileId: '',
    });
    showToast('All saved guideline profiles deleted.', 'info');
  };

  // Create clean blank working guidelines in editor
  const handleCreateBlankGuidelines = () => {
    setProductGuidelines(DEFAULT_PRODUCT_GUIDELINES);
    setSeoGuidelines(DEFAULT_SEO_GUIDELINES);
    setGeoGuidelines(DEFAULT_GEO_GUIDELINES);
    setStructureMappingGuidelines(DEFAULT_STRUCTURE_MAPPING_GUIDELINES);
    setCustomerCentricityGuidelines(DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES);
    setKeywords(DEFAULT_KEYWORDS);
    showToast('Cleared editor. Ready to build new guidelines.', 'info');
  };

  // Import Profiles
  const handleImportProfiles = (imported: GuidelineProfile[]) => {
    setProfiles(imported);
    saveProfilesToStorage(imported);
    if (imported.length > 0) {
      handleSelectProfile(imported[0].id);
    }
    showToast(`Imported ${imported.length} Guideline Profile(s)!`, 'success');
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    const defaults = resetToDefaultProfiles();
    setProfiles(defaults);
    setContentGuidelines(loadGlobalContentGuidelines());
    setProductGuidelines(DEFAULT_PRODUCT_GUIDELINES);
    setSeoGuidelines(DEFAULT_SEO_GUIDELINES);
    setGeoGuidelines(DEFAULT_GEO_GUIDELINES);
    setStructureMappingGuidelines(loadGlobalStructureMappingGuidelines());
    setCustomerCentricityGuidelines(loadGlobalCustomerCentricityGuidelines());
    setKeywords(DEFAULT_KEYWORDS);
    setSavedContentPresets(loadSavedContentPresets());
    setSavedSeoPresets(loadSavedSeoPresets());
    setSavedGeoPresets(loadSavedGeoPresets());
    setSavedProductPresets(loadSavedProductPresets());
    setSavedStructureMappingPresets(loadSavedStructureMappingPresets());
    setSavedCustomerCentricityPresets(loadSavedCustomerCentricityPresets());
    setActiveContentPresetId('content-preset-default');
    setActiveSeoPresetId('seo-preset-default');
    setActiveGeoPresetId('geo-preset-master-citation');
    setActiveProductPresetId('product-preset-enterprise-solutions');
    setActiveStructureMappingPresetId('structure-preset-strict-h1h2');
    setActiveCustomerCentricityPresetId('customer-preset-empathetic-layman');
    const firstId = defaults[0]?.id || '';
    handleUpdateAgentConfig({
      unified: true,
      activeProfileId: firstId,
      agent1ProfileId: firstId,
      agent2ProfileId: firstId,
    });
    showToast('Reset guidelines and presets to default state.', 'info');
  };

  // Guidelines are taken directly: Product from Section 2, SEO from Section 3, and Keywords autofilled from scraping
  const getAgent2Guidelines = () => {
    return { productGuidelines, seoGuidelines, keywords };
  };

  // Dedicated Autofill Target Keywords function from Scraped DOM or Current Components
  const handleAutofillKeywords = async () => {
    setIsAutofillingKeywords(true);
    try {
      const headings = components.flatMap(c => (c.headings || []).map(h => h.text)).filter(Boolean);
      const bodyText = components.map(c => c.bodyContent).join('\n\n');

      const data = await safeApiPost<{ keywords: KeywordItem[] }>('/api/extract-keywords', {
        title: backendData.metaTitle || components[0]?.name || '',
        description: backendData.metaDescription || '',
        headings,
        h1: components.flatMap(c => c.headings || []).find(h => h.tag === 'h1')?.text,
        bodyText,
        tags: (backendData as any).scrapedKeywordTags || (backendData as any).tags || [],
        url: /^https?:/i.test(currentUrl) ? currentUrl : backendData.canonicalUrl,
        faqQuestions: components.flatMap(c => (c.faqs || []).map(f => f.question)),
      });

      if (data.keywords && data.keywords.length > 0) {
        setKeywords(data.keywords);
        const primary = data.keywords.find(k => k.priority === 'primary') || data.keywords[0];
        showToast(`Detected ${data.keywords.length} target keywords. Primary: "${primary?.keyword}".`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Autofill failed: ${err.message}`, 'error');
    } finally {
      setIsAutofillingKeywords(false);
    }
  };

  // ---------------------------------------------------------------
  // Pipeline: every run (optimize or revise) goes through the same loop:
  // maker → five review gates → verification gate → notes back to the maker.
  // ---------------------------------------------------------------
  type PipelinePayload = {
    report?: OrchestratorReport;
    finalVerdict?: PipelineVerdict;
    totalFlags: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    passedCount?: number;
    topRecommendations?: string[];
    flags: AuditFlag[];
    nineAgentScores?: NineAgentScores;
    beforeScores?: ScoreSnapshot;
    afterScores?: ScoreSnapshot;
    updatedComponents?: ContentComponent[];
    updatedBackend?: SEOBackendData;
    fixResult?: FixResult | null;
  };

  const pipelineRequestBase = () => {
    const activeGuidelines = getAgent2Guidelines();
    return {
      url: currentUrl && /^https?:/i.test(currentUrl) ? currentUrl : undefined,
      productGuidelines: activeGuidelines.productGuidelines,
      seoGuidelines: activeGuidelines.seoGuidelines,
      contentGuidelines,
      geoGuidelines,
      structureMappingGuidelines,
      customerCentricityGuidelines,
      keywords: activeGuidelines.keywords,
      backendData,
      components,
      readerContext: profiles.find((p) => p.id === (agentConfig.agent2ProfileId || agentConfig.activeProfileId))?.readerContext,
    };
  };

  const applyPipelineResult = (data: PipelinePayload) => {
    const activeGuidelines = getAgent2Guidelines();
    if (data.report) setOrchestratorReport(data.report);

    const scores: NineAgentScores =
      data.nineAgentScores ||
      calculateNineAgentScores({ flags: data.flags || [], keywords: activeGuidelines.keywords, keywordPlan: data.report?.keywordPlan });

    setAuditSummary({
      overallScore: scores.overallPageScore,
      overallScoreDisplay: scores.overallScoreDisplay || (scores.publishBlocked ? 'BLOCKED' : `${scores.overallPageScore}`),
      publishBlocked: scores.publishBlocked ?? false,
      gatingViolationReasons: scores.gatingViolationReasons || [],
      contentScore: scores.contentScore ?? scores.complianceScore,
      productScore: scores.productScore ?? scores.complianceScore,
      seoScore: scores.seoScore ?? scores.seoBackendScore,
      structureAndKeywordScore: scores.structureAndKeywordScore ?? scores.keywordCoverageScore,
      customerCentricityScore: scores.customerCentricityScore,
      eeatAndGeoScore: scores.eeatAndGeoScore ?? Math.round((scores.eeatScore + scores.geoScore) / 2),
      guidelineSectionScores: scores.guidelineSectionScores,
      complianceScore: scores.complianceScore,
      seoBackendScore: scores.seoBackendScore,
      keywordCoverageScore: scores.keywordCoverageScore,
      eeatScore: scores.eeatScore,
      geoScore: scores.geoScore,
      verificationConfidence: scores.verificationConfidence,
      extractionCompleteness: scores.extractionCompleteness,
      nineAgentScores: scores,
      voiceAeoScore: scores.keywordCoverageScore,
      geoEeatScore: Math.round((scores.eeatScore + scores.geoScore) / 2),
      backendScore: scores.seoBackendScore,
      agentScores: data.report?.agentScores || buildAgentScoreBreakdown(scores),
      totalFlags: data.totalFlags,
      criticalCount: data.criticalCount,
      warningCount: data.warningCount,
      infoCount: data.infoCount,
      passedCount: data.passedCount || 0,
      topRecommendations: data.topRecommendations || [],
      beforeScores: data.beforeScores,
      afterScores: data.afterScores,
      isOptimized: !!data.afterScores,
    } as AuditSummary);
    setAuditFlags(data.flags || []);
    setHasAudited(true);

    // Apply the selected draft; the originals stay in originalSnapshot for the diff views.
    const producedDraft = (data.report?.rounds?.length || 0) > 0;
    if (producedDraft && data.updatedComponents?.length) setComponents(data.updatedComponents);
    if (producedDraft && data.updatedBackend) setBackendData(data.updatedBackend);
    if (data.fixResult) setFixResult(data.fixResult);

    const before = data.beforeScores?.overallScore;
    const after = data.afterScores?.overallScore;
    const scoreNote = before !== undefined && after !== undefined ? ` Score ${before} → ${after}.` : '';
    const what = data.report?.mode === 'revise' ? `${data.report.scopeLabel || 'Revision'}:` : 'Pipeline:';
    if (data.report?.note) {
      showToast(`${what} ${data.report.note}`, 'info');
    } else if (data.finalVerdict === 'APPROVED') {
      showToast(`${what} approved for publishing after ${data.report?.rounds?.length || 1} draft(s).${scoreNote}`, 'success');
    } else if (data.finalVerdict === 'NOT_QUALIFIED') {
      showToast(`${what} best draft applied, but it does not qualify yet (${data.topRecommendations?.length || 0} blocking issues).${scoreNote}`, 'info');
    } else {
      showToast(`${what} the maker could not run — ${data.report?.makerError || 'unknown error'}`, 'error');
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setPipelineProgress([]);
    try {
      const data = await runPipelineStream<PipelinePayload>(pipelineRequestBase(), (event) =>
        setPipelineProgress((prev) => [...prev, event])
      );
      applyPipelineResult(data);
    } catch (err: any) {
      console.error(err);
      showToast(`Pipeline failed: ${err.message}`, 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  /** Revises the content on screen within a scope, then re-runs the gates and verification. */
  const runRevision = async (reviseScope: RevisionScope, fixingId: string | null) => {
    setIsFixing(true);
    setFixingComponentId(fixingId);
    setPipelineProgress([]);
    try {
      const data = await runPipelineStream<PipelinePayload>(
        { ...pipelineRequestBase(), mode: 'revise', reviseScope, maxRevisions: reviseScope.kind === 'all' ? 2 : 1 },
        (event) => setPipelineProgress((prev) => [...prev, event])
      );
      applyPipelineResult(data);
    } catch (err: any) {
      console.error(err);
      showToast(`Revision failed: ${err.message}`, 'error');
    } finally {
      setIsFixing(false);
      setFixingComponentId(null);
    }
  };

  // Section-level fix: "hero" → H1 & intro, an H2 section id → that section, otherwise the page body.
  const handleFixSection = async (id: string) => {
    if (id === 'hero') return runRevision({ kind: 'intro' }, id);
    const sec = components.flatMap((c) => c.h2Sections || []).find((s) => s.id === id);
    if (sec) return runRevision({ kind: 'section', h2: sec.h2Text }, id);
    return runRevision({ kind: 'body' }, id);
  };

  const handleFixBackend = async () => runRevision({ kind: 'meta' }, 'backend');

  const handleFixAll = async () => runRevision({ kind: 'all' }, null);

  // Fetch URL & Extract Backend Data + Components + Keywords
  const handleFetchUrl = async (url: string, rawHtml?: string) => {
    setIsLoadingUrl(true);
    try {
      const data = await safeApiPost<{
        backend?: SEOBackendData;
        components?: ContentComponent[];
        keywords?: KeywordItem[];
        notice?: string;
        isSynthetic?: boolean;
        fetchSource?: string;
      }>('/api/fetch-url', { url, rawHtml });

      if (data.backend) {
        setBackendData({
          ...data.backend,
          status: 'non_compliant',
          originalSnapshot: { ...data.backend }
        });
      }
      if (data.components && data.components.length > 0) {
        const prepared = data.components.map((c: ContentComponent) => ({
          ...c,
          status: 'non_compliant',
          originalSnapshot: { ...c }
        }));
        setComponents(prepared);
      }
      if (data.keywords && data.keywords.length > 0) {
        setKeywords(data.keywords);
      } else {
        // Automatically extract & autofill keywords from scraped page
        setTimeout(() => {
          handleAutofillKeywords();
        }, 100);
      }
      
      setCurrentUrl(url || 'Custom HTML');
      setHasAudited(false);
      setAuditFlags([]);
      setAuditSummary(null);
      const kwNote = autoExtractKeywords && data.keywords?.length
        ? ` and autofilled ${data.keywords.length} target ranking keywords`
        : '';
      
      if (data.notice) {
        showToast(data.notice, 'info');
      } else {
        showToast(`Scraped & Extracted ${data.components?.length || 0} sections, SEO backend data${kwNote}!`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleAddNewComponent = () => {
    const newComp: ContentComponent = {
      id: `comp-custom-${Date.now()}`,
      name: 'Custom Product Section',
      type: 'custom',
      headings: [
        { tag: 'h2', text: 'Voice Search Optimized Section Title' },
        { tag: 'h3', text: 'How does this solve key customer intent?' }
      ],
      bodyContent: 'Enter narrative content structured for search intent and LLM authority citations.',
      listItems: ['High-impact benefit 1', 'Verified performance metric 2'],
      voiceAnswerSnippet: 'Direct 40-50 word answer targeting voice assistants and Google AI Overview.',
      citationSource: 'Verified Technical Benchmark 2025',
      status: 'non_compliant'
    };
    newComp.originalSnapshot = { ...newComp };
    setComponents([...components, newComp]);
    showToast('Added new editable component section', 'info');
  };

  // Compile overall Before & After comparison for global view
  const getGlobalBeforeAfter = () => {
    const origBackend = backendData.originalSnapshot || backendData;
    const comps = Array.isArray(components) ? components : [];

    const beforeItems = [
      { label: 'Meta Title', value: origBackend.metaTitle || 'None' },
      { label: 'Meta Description', value: origBackend.metaDescription || 'None' },
      { label: 'Schema JSON-LD', value: origBackend.schemaJsonLd || '{}' },
      ...comps.map(c => {
        const origHeadings = c.originalSnapshot?.headings || c.headings || [];
        return {
          label: `${c.name || 'Section'} (Headings)`,
          value: origHeadings.length > 0 
            ? origHeadings.map(h => `${(h.tag || 'H2').toUpperCase()}: ${h.text || ''}`).join('\n')
            : 'No headings'
        };
      }),
      ...comps.map(c => ({
        label: `${c.name || 'Section'} (Voice Snippet)`,
        value: c.originalSnapshot?.voiceAnswerSnippet || c.voiceAnswerSnippet || 'None'
      }))
    ];

    const afterItems = [
      { label: 'Meta Title', value: backendData.metaTitle || 'None' },
      { label: 'Meta Description', value: backendData.metaDescription || 'None' },
      { label: 'Schema JSON-LD', value: backendData.schemaJsonLd || '{}' },
      ...comps.map(c => {
        const currentHeadings = c.headings || [];
        return {
          label: `${c.name || 'Section'} (Headings)`,
          value: currentHeadings.length > 0
            ? currentHeadings.map(h => `${(h.tag || 'H2').toUpperCase()}: ${h.text || ''}`).join('\n')
            : 'No headings'
        };
      }),
      ...comps.map(c => ({
        label: `${c.name || 'Section'} (Voice Snippet)`,
        value: c.voiceAnswerSnippet || 'None'
      }))
    ];

    return { beforeItems, afterItems };
  };

  const globalComparisonData = getGlobalBeforeAfter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-slate-50">
      
      {/* 1. Header with Tab Switching & Global Actions */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGlobalCompare={() => setIsGlobalCompareOpen(true)}
        onRunAudit={handleRunAudit}
        onFixAll={handleFixAll}
        isAuditing={isAuditing}
        isFixing={isFixing}
        totalFlags={auditFlags.length}
        criticalCount={auditFlags.filter((f) => f.severity === 'critical').length}
        overallScore={auditSummary?.overallScore ?? 0}
        hasAudited={hasAudited}
        keywordCount={keywords.length}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-20 md:bottom-5 right-3 left-3 sm:left-auto sm:right-5 z-50 sm:max-w-md pl-3 pr-4 py-3 rounded-lg shadow-xl border border-slate-700 border-l-4 bg-slate-900 text-[13px] text-slate-200 flex items-start gap-2.5 ${
            toastMessage.type === 'success'
              ? 'border-l-emerald-500'
              : toastMessage.type === 'error'
              ? 'border-l-rose-500'
              : 'border-l-indigo-500'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-px shrink-0 text-emerald-400" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 mt-px shrink-0 text-rose-400" />
          ) : (
            <Bot className="w-4 h-4 mt-px shrink-0 text-indigo-400" />
          )}
          <span className="leading-snug">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6 space-y-4 sm:space-y-6 min-w-0">
        
        {/* TAB 1: PRODUCT, CONTENT SEO & GEO GUIDELINES */}
        {activeTab === 'guidelines' && (
          <GuidelinesTab
            contentGuidelines={contentGuidelines}
            productGuidelines={productGuidelines}
            seoGuidelines={seoGuidelines}
            geoGuidelines={geoGuidelines}
            structureMappingGuidelines={structureMappingGuidelines}
            customerCentricityGuidelines={customerCentricityGuidelines}
            keywords={keywords}
            profiles={profiles}
            agentConfig={agentConfig}
            savedContentPresets={savedContentPresets}
            savedSeoPresets={savedSeoPresets}
            savedGeoPresets={savedGeoPresets}
            savedProductPresets={savedProductPresets}
            savedStructureMappingPresets={savedStructureMappingPresets}
            savedCustomerCentricityPresets={savedCustomerCentricityPresets}
            activeContentPresetId={activeContentPresetId}
            activeSeoPresetId={activeSeoPresetId}
            activeGeoPresetId={activeGeoPresetId}
            activeProductPresetId={activeProductPresetId}
            activeStructureMappingPresetId={activeStructureMappingPresetId}
            activeCustomerCentricityPresetId={activeCustomerCentricityPresetId}
            onSelectProfile={handleSelectProfile}
            onUpdateAgentConfig={handleUpdateAgentConfig}
            onSaveNewProfile={handleSaveNewProfile}
            onCreateBlankProfile={handleCreateBlankProfile}
            onUpdateProfile={handleUpdateProfile}
            onDeleteProfile={handleDeleteProfile}
            onDeleteAllProfiles={handleDeleteAllProfiles}
            onCreateBlankGuidelines={handleCreateBlankGuidelines}
            onImportProfiles={handleImportProfiles}
            onResetDefaults={handleResetDefaults}
            onUpdateContentGuidelines={setContentGuidelines}
            onUpdateProductGuidelines={setProductGuidelines}
            onUpdateSeoGuidelines={setSeoGuidelines}
            onUpdateGeoGuidelines={setGeoGuidelines}
            onUpdateStructureMappingGuidelines={setStructureMappingGuidelines}
            onUpdateCustomerCentricityGuidelines={setCustomerCentricityGuidelines}
            onSaveContentGuidelines={handleSaveContentGuidelines}
            onSaveSeoGuidelines={handleSaveSeoGuidelines}
            onSaveGeoGuidelines={handleSaveGeoGuidelines}
            onSaveProductGuidelines={handleSaveProductGuidelines}
            onSaveStructureMappingGuidelines={handleSaveStructureMappingGuidelines}
            onSaveCustomerCentricityGuidelines={handleSaveCustomerCentricityGuidelines}
            onSaveNewContentGuideline={handleSaveNewContentGuideline}
            onSelectContentPreset={handleSelectContentPreset}
            onDeleteContentPreset={handleDeleteContentPreset}
            onSaveNewSeoGuideline={handleSaveNewSeoGuideline}
            onSelectSeoPreset={handleSelectSeoPreset}
            onDeleteSeoPreset={handleDeleteSeoPreset}
            onSaveNewGeoGuideline={handleSaveNewGeoGuideline}
            onSelectGeoPreset={handleSelectGeoPreset}
            onDeleteGeoPreset={handleDeleteGeoPreset}
            onSaveNewProductGuideline={handleSaveNewProductGuideline}
            onSelectProductGuideline={handleSelectProfile}
            onSelectProductPreset={handleSelectProductPreset}
            onDeleteProductPreset={handleDeleteProductPreset}
            onCreateBlankProductGuideline={handleCreateBlankProductGuideline}
            onSaveNewStructureMappingGuideline={handleSaveNewStructureMappingGuideline}
            onSelectStructureMappingPreset={handleSelectStructureMappingPreset}
            onDeleteStructureMappingPreset={handleDeleteStructureMappingPreset}
            onSaveNewCustomerCentricityGuideline={handleSaveNewCustomerCentricityGuideline}
            onSelectCustomerCentricityPreset={handleSelectCustomerCentricityPreset}
            onDeleteCustomerCentricityPreset={handleDeleteCustomerCentricityPreset}
            onUpdateKeywords={setKeywords}
            onGoToScrapeTab={() => setActiveTab('scrape_fix')}
            onAutofillKeywords={handleAutofillKeywords}
            isAutofillingKeywords={isAutofillingKeywords}
          />
        )}

        {/* TAB 2: SCRAPE, AUDIT & FIX WITH BOX HIGHLIGHTS & SIDE-BY-SIDE */}
        {activeTab === 'scrape_fix' && (
          <ScrapeFixTab
            currentUrl={currentUrl}
            onFetchUrl={handleFetchUrl}
            isLoadingUrl={isLoadingUrl}
            backendData={backendData}
            setBackendData={setBackendData}
            components={components}
            setComponents={setComponents}
            keywords={keywords}
            productGuidelines={productGuidelines}
            seoGuidelines={seoGuidelines}
            contentGuidelines={contentGuidelines}
            geoGuidelines={geoGuidelines}
            structureMappingGuidelines={structureMappingGuidelines}
            customerCentricityGuidelines={customerCentricityGuidelines}
            savedContentPresets={savedContentPresets}
            savedProductPresets={savedProductPresets}
            savedSeoPresets={savedSeoPresets}
            savedGeoPresets={savedGeoPresets}
            savedStructureMappingPresets={savedStructureMappingPresets}
            savedCustomerCentricityPresets={savedCustomerCentricityPresets}
            activeContentPresetId={activeContentPresetId}
            activeProductPresetId={activeProductPresetId}
            activeSeoPresetId={activeSeoPresetId}
            activeGeoPresetId={activeGeoPresetId}
            activeStructureMappingPresetId={activeStructureMappingPresetId}
            activeCustomerCentricityPresetId={activeCustomerCentricityPresetId}
            onSelectContentPreset={handleSelectContentPreset}
            onSelectProductPreset={handleSelectProductPreset}
            onSelectSeoPreset={handleSelectSeoPreset}
            onSelectGeoPreset={handleSelectGeoPreset}
            onSelectStructureMappingPreset={handleSelectStructureMappingPreset}
            onSelectCustomerCentricityPreset={handleSelectCustomerCentricityPreset}
            profiles={profiles}
            agentConfig={agentConfig}
            onSelectProfile={handleSelectProfile}
            onNavigateToGuidelinesTab={() => setActiveTab('guidelines')}
            autoExtractKeywords={autoExtractKeywords}
            onToggleAutoExtractKeywords={setAutoExtractKeywords}
            onAutofillKeywords={handleAutofillKeywords}
            isAutofillingKeywords={isAutofillingKeywords}
            hasAudited={hasAudited}
            isAuditing={isAuditing}
            isFixing={isFixing}
            fixingComponentId={fixingComponentId}
            auditSummary={auditSummary}
            auditFlags={auditFlags}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            orchestratorReport={orchestratorReport}
            pipelineProgress={pipelineProgress}
            fixResult={fixResult}
            onRunAudit={handleRunAudit}
            onFixSection={handleFixSection}
            onFixBackend={handleFixBackend}
            onFixAll={handleFixAll}
            onAddNewComponent={handleAddNewComponent}
            onNotifyToast={showToast}
          />
        )}

        {/* TAB 3: LIVE INTERACTIVE WEBPAGE VIEW */}
        {activeTab === 'webpage' && (
          <LiveWebpageView
            components={components}
            backendData={backendData}
            keywords={keywords}
            productGuidelines={productGuidelines}
            onBackToAudit={() => setActiveTab('scrape_fix')}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t border-slate-800 py-3 px-4 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Content Optimizer</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500" />Non-compliant</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500" />Revised</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Passed verification</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DiffPreviewModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        fixResult={fixResult}
      />

      <CodeExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        backendData={backendData}
        components={components}
        auditSummary={auditSummary}
        productGuidelines={productGuidelines}
        keywords={keywords}
      />

      {/* Global Side-by-Side Comparison */}
      {isGlobalCompareOpen && (
        <BeforeAfterViewer
          isOpen={isGlobalCompareOpen}
          onClose={() => setIsGlobalCompareOpen(false)}
          sectionTitle="Full Page Before vs. After Optimization Diff"
          beforeContent={components.map(c => (c.originalSnapshot?.bodyContent || c.bodyContent)).join('\n\n')}
          afterContent={components.map(c => c.bodyContent).join('\n\n')}
          beforeItems={globalComparisonData.beforeItems}
          afterItems={globalComparisonData.afterItems}
        />
      )}

    </div>
  );
}
