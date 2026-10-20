import React, { useState } from 'react';
import { 
  Sliders, 
  FileText, 
  Sparkles, 
  Globe, 
  Mic, 
  Award, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Check, 
  RotateCcw, 
  TrendingUp, 
  Search, 
  RefreshCw, 
  Bookmark,
  FilePlus2,
  ListPlus,
  Eraser,
  Cpu,
  Layers,
  Settings2,
  ExternalLink,
  BookOpen,
  HeartHandshake,
  Network
} from 'lucide-react';
import { 
  ProductGuidelines, 
  SEOGuidelines, 
  GEOGuidelines,
  ContentGuidelines, 
  CustomerCentricityGuidelines,
  StructureMappingGuidelines,
  KeywordItem, 
  GuidelineProfile, 
  AgentGuidelineConfig,
  SavedContentGuideline,
  SavedSeoGuideline,
  SavedGeoGuideline,
  SavedProductGuideline,
  SavedCustomerCentricityGuideline,
  SavedStructureMappingGuideline
} from '../types';
import { 
  DEFAULT_CONTENT_GUIDELINES, 
  DEFAULT_SEO_GUIDELINES, 
  DEFAULT_GEO_GUIDELINES,
  DEFAULT_PRODUCT_GUIDELINES,
  DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES,
  DEFAULT_STRUCTURE_MAPPING_GUIDELINES
} from '../data/defaults';
import { 
  SaveNewContentModal, 
  SaveNewSeoModal, 
  SaveNewGeoModal,
  SaveNewProductModal,
  SaveNewCustomerCentricityModal,
  SaveNewStructureMappingModal,
  PresetManagerModal
} from './GuidelineModals';
import { ActiveGuidelinesInspector } from './ActiveGuidelinesInspector';

interface GuidelinesTabProps {
  contentGuidelines: ContentGuidelines;
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  geoGuidelines?: GEOGuidelines;
  customerCentricityGuidelines?: CustomerCentricityGuidelines;
  structureMappingGuidelines?: StructureMappingGuidelines;
  keywords: KeywordItem[];
  profiles: GuidelineProfile[];
  agentConfig: AgentGuidelineConfig;
  savedContentPresets?: SavedContentGuideline[];
  savedSeoPresets?: SavedSeoGuideline[];
  savedGeoPresets?: SavedGeoGuideline[];
  savedProductPresets?: SavedProductGuideline[];
  savedCustomerCentricityPresets?: SavedCustomerCentricityGuideline[];
  savedStructureMappingPresets?: SavedStructureMappingGuideline[];
  activeContentPresetId?: string;
  activeSeoPresetId?: string;
  activeGeoPresetId?: string;
  activeProductPresetId?: string;
  activeCustomerCentricityPresetId?: string;
  activeStructureMappingPresetId?: string;
  onSelectProfile: (profileId: string) => void;
  onUpdateAgentConfig: (config: AgentGuidelineConfig) => void;
  onSaveNewProfile: (name: string, description: string, category: any) => void;
  onCreateBlankProfile?: (name: string, description: string, category: any) => void;
  onUpdateProfile: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onDeleteAllProfiles?: () => void;
  onCreateBlankGuidelines?: () => void;
  onImportProfiles: (imported: GuidelineProfile[]) => void;
  onResetDefaults: () => void;
  onUpdateContentGuidelines: (updated: ContentGuidelines) => void;
  onUpdateProductGuidelines: (updated: ProductGuidelines) => void;
  onUpdateSeoGuidelines: (updated: SEOGuidelines) => void;
  onUpdateGeoGuidelines?: (updated: GEOGuidelines) => void;
  onUpdateCustomerCentricityGuidelines?: (updated: CustomerCentricityGuidelines) => void;
  onUpdateStructureMappingGuidelines?: (updated: StructureMappingGuidelines) => void;
  onSaveContentGuidelines: (updated: ContentGuidelines) => void;
  onSaveSeoGuidelines: (updated: SEOGuidelines) => void;
  onSaveGeoGuidelines?: (updated: GEOGuidelines) => void;
  onSaveProductGuidelines: (updated: ProductGuidelines) => void;
  onSaveCustomerCentricityGuidelines?: (updated: CustomerCentricityGuidelines) => void;
  onSaveStructureMappingGuidelines?: (updated: StructureMappingGuidelines) => void;
  onSaveNewContentGuideline?: (name: string, description?: string) => void;
  onSelectContentPreset?: (presetId: string) => void;
  onDeleteContentPreset?: (presetId: string) => void;
  onSaveNewSeoGuideline?: (name: string, description?: string) => void;
  onSelectSeoPreset?: (presetId: string) => void;
  onDeleteSeoPreset?: (presetId: string) => void;
  onSaveNewGeoGuideline?: (name: string, description?: string) => void;
  onSelectGeoPreset?: (presetId: string) => void;
  onDeleteGeoPreset?: (presetId: string) => void;
  onSaveNewCustomerCentricityGuideline?: (name: string, description?: string) => void;
  onSelectCustomerCentricityPreset?: (presetId: string) => void;
  onDeleteCustomerCentricityPreset?: (presetId: string) => void;
  onSaveNewStructureMappingGuideline?: (name: string, description?: string) => void;
  onSelectStructureMappingPreset?: (presetId: string) => void;
  onDeleteStructureMappingPreset?: (presetId: string) => void;
  onSaveNewProductGuideline?: (name: string, description?: string, category?: any) => void;
  onSelectProductGuideline?: (profileId: string) => void;
  onSelectProductPreset?: (presetId: string) => void;
  onDeleteProductPreset?: (presetId: string) => void;
  onCreateBlankProductGuideline?: () => void;
  onUpdateKeywords: (updated: KeywordItem[]) => void;
  onGoToScrapeTab: () => void;
  onAutofillKeywords?: () => Promise<void>;
  isAutofillingKeywords?: boolean;
}

const COMMON_SCHEMAS = [
  'FAQPage',
  'Product',
  'SoftwareApplication',
  'Organization',
  'Article',
  'HowTo',
  'LocalBusiness',
  'Review'
];

const GEO_TARGET_ENGINES = [
  { id: 'google_aio', label: 'Google AI Overviews / SGE' },
  { id: 'perplexity', label: 'Perplexity Pro / Search' },
  { id: 'chatgpt_search', label: 'ChatGPT Search' },
  { id: 'gemini_research', label: 'Gemini Deep Research' }
];

export const GuidelinesTab: React.FC<GuidelinesTabProps> = ({
  contentGuidelines,
  productGuidelines,
  seoGuidelines,
  geoGuidelines = DEFAULT_GEO_GUIDELINES,
  customerCentricityGuidelines = DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES,
  structureMappingGuidelines = DEFAULT_STRUCTURE_MAPPING_GUIDELINES,
  keywords,
  profiles,
  agentConfig,
  savedContentPresets = [],
  savedSeoPresets = [],
  savedGeoPresets = [],
  savedProductPresets = [],
  savedCustomerCentricityPresets = [],
  savedStructureMappingPresets = [],
  activeContentPresetId = 'content-preset-default',
  activeSeoPresetId = 'seo-preset-default',
  activeGeoPresetId = 'geo-preset-master-citation',
  activeProductPresetId = 'product-preset-enterprise-solutions',
  activeCustomerCentricityPresetId = 'customer-preset-direct-buyer',
  activeStructureMappingPresetId = 'structure-preset-commercial-hierarchy',
  onSelectProfile,
  onUpdateAgentConfig,
  onSaveNewProfile,
  onCreateBlankProfile,
  onUpdateProfile,
  onDeleteProfile,
  onDeleteAllProfiles,
  onCreateBlankGuidelines,
  onImportProfiles,
  onResetDefaults,
  onUpdateContentGuidelines,
  onUpdateProductGuidelines,
  onUpdateSeoGuidelines,
  onUpdateGeoGuidelines,
  onUpdateCustomerCentricityGuidelines,
  onUpdateStructureMappingGuidelines,
  onSaveContentGuidelines,
  onSaveSeoGuidelines,
  onSaveGeoGuidelines,
  onSaveProductGuidelines,
  onSaveCustomerCentricityGuidelines,
  onSaveStructureMappingGuidelines,
  onSaveNewContentGuideline,
  onSelectContentPreset,
  onDeleteContentPreset,
  onSaveNewSeoGuideline,
  onSelectSeoPreset,
  onDeleteSeoPreset,
  onSaveNewGeoGuideline,
  onSelectGeoPreset,
  onDeleteGeoPreset,
  onSaveNewCustomerCentricityGuideline,
  onSelectCustomerCentricityPreset,
  onDeleteCustomerCentricityPreset,
  onSaveNewStructureMappingGuideline,
  onSelectStructureMappingPreset,
  onDeleteStructureMappingPreset,
  onSaveNewProductGuideline,
  onSelectProductGuideline,
  onSelectProductPreset,
  onDeleteProductPreset,
  onCreateBlankProductGuideline,
  onUpdateKeywords,
  onGoToScrapeTab,
  onAutofillKeywords,
  isAutofillingKeywords = false,
}) => {
  // Save confirmation states
  const [contentSaved, setContentSaved] = useState<boolean>(false);
  const [seoSaved, setSeoSaved] = useState<boolean>(false);
  const [geoSaved, setGeoSaved] = useState<boolean>(false);
  const [productSaved, setProductSaved] = useState<boolean>(false);
  const [structureSaved, setStructureSaved] = useState<boolean>(false);
  const [customerSaved, setCustomerSaved] = useState<boolean>(false);

  // Modal states for creating & saving new guidelines
  const [isNewContentModalOpen, setIsNewContentModalOpen] = useState<boolean>(false);
  const [isNewSeoModalOpen, setIsNewSeoModalOpen] = useState<boolean>(false);
  const [isNewGeoModalOpen, setIsNewGeoModalOpen] = useState<boolean>(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState<boolean>(false);
  const [isNewStructureModalOpen, setIsNewStructureModalOpen] = useState<boolean>(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);

  // Preset Manager Modals (Browse all presets)
  const [isManageContentModalOpen, setIsManageContentModalOpen] = useState<boolean>(false);
  const [isManageSeoModalOpen, setIsManageSeoModalOpen] = useState<boolean>(false);
  const [isManageGeoModalOpen, setIsManageGeoModalOpen] = useState<boolean>(false);
  const [isManageProductModalOpen, setIsManageProductModalOpen] = useState<boolean>(false);
  const [isManageStructureModalOpen, setIsManageStructureModalOpen] = useState<boolean>(false);
  const [isManageCustomerModalOpen, setIsManageCustomerModalOpen] = useState<boolean>(false);

  // Content Guidelines list inputs
  const [newForbiddenCliche, setNewForbiddenCliche] = useState<string>('');
  const [newFormattingRule, setNewFormattingRule] = useState<string>('');

  // Product Guidelines list inputs
  const [newUSP, setNewUSP] = useState('');
  const [newValueProp, setNewValueProp] = useState('');
  const [newForbidden, setNewForbidden] = useState('');
  const [newSchema, setNewSchema] = useState('');
  
  // GEO Guidelines list inputs
  const [newGeoSource, setNewGeoSource] = useState('');
  const [newGeoEntityRule, setNewGeoEntityRule] = useState('');

  // Structure & Mapping list inputs
  const [newPreferredSection, setNewPreferredSection] = useState('');

  // Customer Centricity list inputs
  const [newCorePainPoint, setNewCorePainPoint] = useState('');
  const [newFrictionPattern, setNewFrictionPattern] = useState('');
  const [newObjectionRule, setNewObjectionRule] = useState('');
  const [newTrustSignal, setNewTrustSignal] = useState('');

  // New Keyword Input
  const [newKwText, setNewKwText] = useState('');
  const [newKwVol, setNewKwVol] = useState<number>(10000);
  const [newKwIntent, setNewKwIntent] = useState<'commercial' | 'informational' | 'transactional'>('commercial');
  const [newKwPriority, setNewKwPriority] = useState<'primary' | 'secondary' | 'voice_question' | 'lsi'>('primary');

  // Quick Paste JSON/Text State
  const [pasteMode, setPasteMode] = useState<boolean>(false);
  const [rawPastedText, setRawPastedText] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const showCopyNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Section 1: Content Guidelines Handlers
  const handleTriggerSaveContent = () => {
    onSaveContentGuidelines(contentGuidelines);
    setContentSaved(true);
    showCopyNotice('Content Guidelines saved successfully!');
    setTimeout(() => setContentSaved(false), 2500);
  };

  const handleResetBlankContent = () => {
    onUpdateContentGuidelines({ ...DEFAULT_CONTENT_GUIDELINES });
    showCopyNotice('Content Guidelines reset to default template.');
  };

  const handleAddForbiddenCliche = () => {
    if (!newForbiddenCliche.trim()) return;
    const current = contentGuidelines?.forbiddenCliches || [];
    if (!current.includes(newForbiddenCliche.trim())) {
      onUpdateContentGuidelines({
        ...contentGuidelines,
        forbiddenCliches: [...current, newForbiddenCliche.trim()]
      });
    }
    setNewForbiddenCliche('');
  };

  const handleRemoveForbiddenCliche = (idx: number) => {
    const current = contentGuidelines?.forbiddenCliches || [];
    onUpdateContentGuidelines({
      ...contentGuidelines,
      forbiddenCliches: current.filter((_, i) => i !== idx)
    });
  };

  const handleAddFormattingRule = () => {
    if (!newFormattingRule.trim()) return;
    const current = contentGuidelines?.formattingRules || [];
    onUpdateContentGuidelines({
      ...contentGuidelines,
      formattingRules: [...current, newFormattingRule.trim()]
    });
    setNewFormattingRule('');
  };

  const handleRemoveFormattingRule = (idx: number) => {
    const current = contentGuidelines?.formattingRules || [];
    onUpdateContentGuidelines({
      ...contentGuidelines,
      formattingRules: current.filter((_, i) => i !== idx)
    });
  };

  // Section 2: Product Guidelines Handlers
  const handleTriggerSaveProduct = () => {
    onSaveProductGuidelines(productGuidelines);
    setProductSaved(true);
    showCopyNotice('Product Guidelines saved successfully!');
    setTimeout(() => setProductSaved(false), 2500);
  };

  const handleResetBlankProduct = () => {
    if (onCreateBlankProductGuideline) {
      onCreateBlankProductGuideline();
    } else {
      onUpdateProductGuidelines({ ...DEFAULT_PRODUCT_GUIDELINES });
    }
    showCopyNotice('Product Guidelines reset to blank template.');
  };

  // Section 3: SEO Guidelines Handlers
  const handleTriggerSaveSeo = () => {
    onSaveSeoGuidelines(seoGuidelines);
    setSeoSaved(true);
    showCopyNotice('SEO Guidelines saved successfully!');
    setTimeout(() => setSeoSaved(false), 2500);
  };

  const handleResetBlankSeo = () => {
    onUpdateSeoGuidelines({ ...DEFAULT_SEO_GUIDELINES });
    showCopyNotice('SEO Guidelines reset to default template.');
  };

  // Section 4: GEO Guidelines Handlers
  const handleTriggerSaveGeo = () => {
    if (onSaveGeoGuidelines) {
      onSaveGeoGuidelines(geoGuidelines);
    }
    setGeoSaved(true);
    showCopyNotice('GEO Guidelines saved successfully!');
    setTimeout(() => setGeoSaved(false), 2500);
  };

  const handleResetBlankGeo = () => {
    if (onUpdateGeoGuidelines) {
      onUpdateGeoGuidelines({ ...DEFAULT_GEO_GUIDELINES });
    }
    showCopyNotice('GEO Guidelines reset to default template.');
  };

  const handleToggleTargetEngine = (engineId: string) => {
    if (!onUpdateGeoGuidelines) return;
    const current = geoGuidelines.targetEngines || [];
    const next = current.includes(engineId)
      ? current.filter(id => id !== engineId)
      : [...current, engineId];
    onUpdateGeoGuidelines({
      ...geoGuidelines,
      targetEngines: next
    });
  };

  const handleAddGeoSource = () => {
    if (!newGeoSource.trim() || !onUpdateGeoGuidelines) return;
    const current = geoGuidelines.knowledgeSources || [];
    if (!current.includes(newGeoSource.trim())) {
      onUpdateGeoGuidelines({
        ...geoGuidelines,
        knowledgeSources: [...current, newGeoSource.trim()]
      });
    }
    setNewGeoSource('');
  };

  const handleRemoveGeoSource = (idx: number) => {
    if (!onUpdateGeoGuidelines) return;
    const current = geoGuidelines.knowledgeSources || [];
    onUpdateGeoGuidelines({
      ...geoGuidelines,
      knowledgeSources: current.filter((_, i) => i !== idx)
    });
  };

  const handleAddGeoEntityRule = () => {
    if (!newGeoEntityRule.trim() || !onUpdateGeoGuidelines) return;
    const current = geoGuidelines.entityRelationships || [];
    onUpdateGeoGuidelines({
      ...geoGuidelines,
      entityRelationships: [...current, newGeoEntityRule.trim()]
    });
    setNewGeoEntityRule('');
  };

  const handleRemoveGeoEntityRule = (idx: number) => {
    if (!onUpdateGeoGuidelines) return;
    const current = geoGuidelines.entityRelationships || [];
    onUpdateGeoGuidelines({
      ...geoGuidelines,
      entityRelationships: current.filter((_, i) => i !== idx)
    });
  };

  // Section 5: Structure & Mapping Handlers
  const handleTriggerSaveStructure = () => {
    if (onSaveStructureMappingGuidelines) {
      onSaveStructureMappingGuidelines(structureMappingGuidelines);
    }
    setStructureSaved(true);
    showCopyNotice('Structure & Mapping Guidelines saved successfully!');
    setTimeout(() => setStructureSaved(false), 2500);
  };

  const handleResetBlankStructure = () => {
    if (onUpdateStructureMappingGuidelines) {
      onUpdateStructureMappingGuidelines({ ...DEFAULT_STRUCTURE_MAPPING_GUIDELINES });
    }
    showCopyNotice('Structure & Mapping Guidelines reset to default template.');
  };

  const handleAddPreferredSection = () => {
    if (!newPreferredSection.trim() || !onUpdateStructureMappingGuidelines) return;
    const current = structureMappingGuidelines.preferredSectionOrder || [];
    if (!current.includes(newPreferredSection.trim())) {
      onUpdateStructureMappingGuidelines({
        ...structureMappingGuidelines,
        preferredSectionOrder: [...current, newPreferredSection.trim()]
      });
    }
    setNewPreferredSection('');
  };

  const handleRemovePreferredSection = (idx: number) => {
    if (!onUpdateStructureMappingGuidelines) return;
    const current = structureMappingGuidelines.preferredSectionOrder || [];
    onUpdateStructureMappingGuidelines({
      ...structureMappingGuidelines,
      preferredSectionOrder: current.filter((_, i) => i !== idx)
    });
  };

  // Section 6: Customer Centricity Handlers
  const handleTriggerSaveCustomer = () => {
    if (onSaveCustomerCentricityGuidelines) {
      onSaveCustomerCentricityGuidelines(customerCentricityGuidelines);
    }
    setCustomerSaved(true);
    showCopyNotice('Customer Centricity Guidelines saved successfully!');
    setTimeout(() => setCustomerSaved(false), 2500);
  };

  const handleResetBlankCustomer = () => {
    if (onUpdateCustomerCentricityGuidelines) {
      onUpdateCustomerCentricityGuidelines({ ...DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES });
    }
    showCopyNotice('Customer Centricity Guidelines reset to default template.');
  };

  const handleAddFrictionPattern = () => {
    if (!newFrictionPattern.trim() || !onUpdateCustomerCentricityGuidelines) return;
    const current = customerCentricityGuidelines.frictionPatternsToFlag || [];
    if (!current.includes(newFrictionPattern.trim())) {
      onUpdateCustomerCentricityGuidelines({
        ...customerCentricityGuidelines,
        frictionPatternsToFlag: [...current, newFrictionPattern.trim()]
      });
    }
    setNewFrictionPattern('');
  };

  const handleRemoveFrictionPattern = (idx: number) => {
    if (!onUpdateCustomerCentricityGuidelines) return;
    const current = customerCentricityGuidelines.frictionPatternsToFlag || [];
    onUpdateCustomerCentricityGuidelines({
      ...customerCentricityGuidelines,
      frictionPatternsToFlag: current.filter((_, i) => i !== idx)
    });
  };

  const handleAddPainPoint = () => {
    if (!newCorePainPoint.trim() || !onUpdateCustomerCentricityGuidelines) return;
    const current = customerCentricityGuidelines.corePainPointsToAddress || [];
    if (!current.includes(newCorePainPoint.trim())) {
      onUpdateCustomerCentricityGuidelines({
        ...customerCentricityGuidelines,
        corePainPointsToAddress: [...current, newCorePainPoint.trim()]
      });
    }
    setNewCorePainPoint('');
  };

  const handleRemovePainPoint = (idx: number) => {
    if (!onUpdateCustomerCentricityGuidelines) return;
    const current = customerCentricityGuidelines.corePainPointsToAddress || [];
    onUpdateCustomerCentricityGuidelines({
      ...customerCentricityGuidelines,
      corePainPointsToAddress: current.filter((_, i) => i !== idx)
    });
  };

  const handleAddObjectionRule = () => {
    if (!newObjectionRule.trim() || !onUpdateCustomerCentricityGuidelines) return;
    const current = customerCentricityGuidelines.objectionHandlingRules || [];
    if (!current.includes(newObjectionRule.trim())) {
      onUpdateCustomerCentricityGuidelines({
        ...customerCentricityGuidelines,
        objectionHandlingRules: [...current, newObjectionRule.trim()]
      });
    }
    setNewObjectionRule('');
  };

  const handleRemoveObjectionRule = (idx: number) => {
    if (!onUpdateCustomerCentricityGuidelines) return;
    const current = customerCentricityGuidelines.objectionHandlingRules || [];
    onUpdateCustomerCentricityGuidelines({
      ...customerCentricityGuidelines,
      objectionHandlingRules: current.filter((_, i) => i !== idx)
    });
  };

  const handleAddTrustSignal = () => {
    if (!newTrustSignal.trim() || !onUpdateCustomerCentricityGuidelines) return;
    const current = customerCentricityGuidelines.trustAndReassuranceSignals || [];
    if (!current.includes(newTrustSignal.trim())) {
      onUpdateCustomerCentricityGuidelines({
        ...customerCentricityGuidelines,
        trustAndReassuranceSignals: [...current, newTrustSignal.trim()]
      });
    }
    setNewTrustSignal('');
  };

  const handleRemoveTrustSignal = (idx: number) => {
    if (!onUpdateCustomerCentricityGuidelines) return;
    const current = customerCentricityGuidelines.trustAndReassuranceSignals || [];
    onUpdateCustomerCentricityGuidelines({
      ...customerCentricityGuidelines,
      trustAndReassuranceSignals: current.filter((_, i) => i !== idx)
    });
  };

  // Clear all working guidelines
  const handleClearAllGuidelines = () => {
    if (confirm('Are you sure you want to clear all working product guidelines, SEO constraints, GEO rules, and target keywords from the editor?')) {
      if (onCreateBlankGuidelines) {
        onCreateBlankGuidelines();
      } else {
        onUpdateProductGuidelines({
          productName: '',
          category: '',
          targetAudience: '',
          toneOfVoice: '',
          uniqueSellingPoints: [],
          coreValueProps: [],
          forbiddenPhrases: [],
          complianceNotes: '',
          eeatCredentials: ''
        });
        onUpdateSeoGuidelines({
          voiceSearchOptimized: true,
          aeoDirectAnswerTarget: true,
          geoLlmCitationFocus: true,
          eeatStandard: 'standard',
          titleCharRange: { min: 50, max: 60 },
          metaDescCharRange: { min: 140, max: 160 },
          headingHierarchyRules: '',
          schemaRequirements: [],
          sitemapGuidelines: '',
          customRules: ''
        });
        if (onUpdateGeoGuidelines) {
          onUpdateGeoGuidelines({ ...DEFAULT_GEO_GUIDELINES });
        }
        onUpdateKeywords([]);
      }
      showCopyNotice('Working editor cleared.');
    }
  };

  // USPs handlers
  const handleAddUSP = () => {
    if (!newUSP.trim()) return;
    onUpdateProductGuidelines({
      ...productGuidelines,
      uniqueSellingPoints: [...productGuidelines.uniqueSellingPoints, newUSP.trim()]
    });
    setNewUSP('');
  };

  const handleRemoveUSP = (index: number) => {
    onUpdateProductGuidelines({
      ...productGuidelines,
      uniqueSellingPoints: productGuidelines.uniqueSellingPoints.filter((_, i) => i !== index)
    });
  };

  const handleClearUSPs = () => {
    if (productGuidelines.uniqueSellingPoints.length === 0) return;
    onUpdateProductGuidelines({
      ...productGuidelines,
      uniqueSellingPoints: []
    });
  };

  // Value Props handlers
  const handleAddValueProp = () => {
    if (!newValueProp.trim()) return;
    onUpdateProductGuidelines({
      ...productGuidelines,
      coreValueProps: [...productGuidelines.coreValueProps, newValueProp.trim()]
    });
    setNewValueProp('');
  };

  const handleRemoveValueProp = (index: number) => {
    onUpdateProductGuidelines({
      ...productGuidelines,
      coreValueProps: productGuidelines.coreValueProps.filter((_, i) => i !== index)
    });
  };

  const handleClearValueProps = () => {
    if (productGuidelines.coreValueProps.length === 0) return;
    onUpdateProductGuidelines({
      ...productGuidelines,
      coreValueProps: []
    });
  };

  // Forbidden Words handlers
  const handleAddForbidden = () => {
    if (!newForbidden.trim()) return;
    onUpdateProductGuidelines({
      ...productGuidelines,
      forbiddenPhrases: [...productGuidelines.forbiddenPhrases, newForbidden.trim()]
    });
    setNewForbidden('');
  };

  const handleRemoveForbidden = (index: number) => {
    onUpdateProductGuidelines({
      ...productGuidelines,
      forbiddenPhrases: productGuidelines.forbiddenPhrases.filter((_, i) => i !== index)
    });
  };

  const handleClearForbidden = () => {
    if (productGuidelines.forbiddenPhrases.length === 0) return;
    onUpdateProductGuidelines({
      ...productGuidelines,
      forbiddenPhrases: []
    });
  };

  // Schema handlers
  const handleAddSchema = (typeToAdd?: string) => {
    const val = (typeToAdd || newSchema).trim();
    if (!val) return;
    const currentSchemas = seoGuidelines?.schemaRequirements || [];
    if (!currentSchemas.includes(val)) {
      onUpdateSeoGuidelines({
        ...seoGuidelines,
        schemaRequirements: [...currentSchemas, val]
      });
    }
    if (!typeToAdd) setNewSchema('');
  };

  const handleRemoveSchema = (index: number) => {
    const currentSchemas = seoGuidelines?.schemaRequirements || [];
    onUpdateSeoGuidelines({
      ...seoGuidelines,
      schemaRequirements: currentSchemas.filter((_, i) => i !== index)
    });
  };

  // Keywords handlers
  const handleAddKeyword = () => {
    if (!newKwText.trim()) return;
    const newItem: KeywordItem = {
      id: `kw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      keyword: newKwText.trim(),
      searchVolume: Number(newKwVol) || 1000,
      intent: newKwIntent,
      priority: newKwPriority
    };
    onUpdateKeywords([...keywords, newItem]);
    setNewKwText('');
    setNewKwVol(10000);
  };

  const handleRemoveKeyword = (id: string) => {
    onUpdateKeywords(keywords.filter(k => k.id !== id));
  };

  const handleClearAllKeywords = () => {
    if (confirm('Clear all target ranking keywords?')) {
      onUpdateKeywords([]);
    }
  };

  // Paste raw parser
  const handleApplyPastedGuidelines = () => {
    if (!rawPastedText.trim()) return;
    try {
      if (rawPastedText.trim().startsWith('{')) {
        const parsed = JSON.parse(rawPastedText);
        if (parsed.productGuidelines || parsed.productName) {
          const pg = parsed.productGuidelines || parsed;
          onUpdateProductGuidelines({
            ...productGuidelines,
            ...pg
          });
        }
        if (parsed.seoGuidelines) {
          onUpdateSeoGuidelines({
            ...seoGuidelines,
            ...parsed.seoGuidelines
          });
        }
        if (parsed.geoGuidelines && onUpdateGeoGuidelines) {
          onUpdateGeoGuidelines({
            ...geoGuidelines,
            ...parsed.geoGuidelines
          });
        }
        if (parsed.contentGuidelines) {
          onUpdateContentGuidelines({
            ...contentGuidelines,
            ...parsed.contentGuidelines
          });
        }
        if (Array.isArray(parsed.keywords)) {
          onUpdateKeywords(parsed.keywords);
        }
        showCopyNotice('Parsed & applied JSON guidelines successfully!');
        setPasteMode(false);
        setRawPastedText('');
        return;
      }
    } catch (_) {}

    // Fallback simple key-value parser
    const lines = rawPastedText.split('\n');
    let updatedProduct = { ...productGuidelines };
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.startsWith('product:') || lower.startsWith('name:')) {
        updatedProduct.productName = line.replace(/^(product|name):\s*/i, '').trim();
      } else if (lower.startsWith('category:') || lower.startsWith('industry:')) {
        updatedProduct.category = line.replace(/^(category|industry):\s*/i, '').trim();
      } else if (lower.startsWith('audience:') || lower.startsWith('icp:')) {
        updatedProduct.targetAudience = line.replace(/^(audience|icp):\s*/i, '').trim();
      } else if (lower.startsWith('tone:')) {
        updatedProduct.toneOfVoice = line.replace(/^tone:\s*/i, '').trim();
      }
    });

    onUpdateProductGuidelines(updatedProduct);
    showCopyNotice('Applied key-value guidelines to fields.');
    setPasteMode(false);
    setRawPastedText('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header bar with global actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-50 flex items-center space-x-2">
              <span>Optimization Guidelines & Rules Studio</span>
              <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Agent 2 & 9 Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Agent 2 follows <strong className="text-slate-300">Section 2: Product Guidelines</strong>, Technical SEO is configured in <strong className="text-slate-300">Section 3</strong>, and Target Keywords are automatically populated from scraping.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-clear-all-guidelines"
            onClick={handleClearAllGuidelines}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 transition flex items-center space-x-1.5 cursor-pointer"
            title="Clear all fields in the working guideline editor"
          >
            <Eraser className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Editor</span>
          </button>

          <button
            onClick={() => setPasteMode(!pasteMode)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{pasteMode ? 'Close Paste Box' : 'Paste Raw Guidelines'}</span>
          </button>
        </div>
      </div>

      {/* Quick Paste Modal / Drawer */}
      {pasteMode && (
        <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-300 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Paste Custom Guidelines (JSON or Text Format)</span>
            </h3>
            <span className="text-xs text-slate-400">Auto-populates fields below</span>
          </div>
          <textarea
            rows={6}
            value={rawPastedText}
            onChange={(e) => setRawPastedText(e.target.value)}
            placeholder={`Product: Your Product Name
Category: Your Category / Industry
Audience: Target persona or buyer segment
Tone: Authoritative, pragmatic, clear
Or paste raw JSON schema...`}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setPasteMode(false)}
              className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyPastedGuidelines}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Parse & Apply to Form
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {copiedNotification && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs px-4 py-2 rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Active Guidelines Inspector & Quick Switcher */}
      <ActiveGuidelinesInspector
        contentGuidelines={contentGuidelines}
        productGuidelines={productGuidelines}
        seoGuidelines={seoGuidelines}
        geoGuidelines={geoGuidelines}
        customerCentricityGuidelines={customerCentricityGuidelines}
        structureMappingGuidelines={structureMappingGuidelines}
        savedContentPresets={savedContentPresets}
        savedProductPresets={savedProductPresets}
        savedSeoPresets={savedSeoPresets}
        savedGeoPresets={savedGeoPresets}
        savedCustomerCentricityPresets={savedCustomerCentricityPresets}
        savedStructureMappingPresets={savedStructureMappingPresets}
        activeContentPresetId={activeContentPresetId}
        activeProductPresetId={activeProductPresetId}
        activeSeoPresetId={activeSeoPresetId}
        activeGeoPresetId={activeGeoPresetId}
        activeCustomerCentricityPresetId={activeCustomerCentricityPresetId}
        activeStructureMappingPresetId={activeStructureMappingPresetId}
        onSelectContentPreset={onSelectContentPreset}
        onSelectProductPreset={onSelectProductPreset}
        onSelectSeoPreset={onSelectSeoPreset}
        onSelectGeoPreset={onSelectGeoPreset}
        onSelectCustomerCentricityPreset={onSelectCustomerCentricityPreset}
        onSelectStructureMappingPreset={onSelectStructureMappingPreset}
      />

      {/* ========================================================================= */}
      {/* SECTION 1: CONTENT GUIDELINES (GLOBAL / PRESETS) */}
      {/* ========================================================================= */}
      <div id="section-1-content" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>Section 1: Content Guidelines</span>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Global / Reusable Presets
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Universal tone, readability grade, paragraph constraints, formatting standards, and forbidden buzzwords.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedContentPresets && savedContentPresets.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <select
                  id="select-content-preset"
                  value={activeContentPresetId}
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectContentPreset?.(e.target.value);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer max-w-[210px] truncate"
                >
                  {savedContentPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  id="btn-browse-content-presets"
                  onClick={() => setIsManageContentModalOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                  title="Browse & manage all Content presets"
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Presets</span>
                </button>
              </div>
            )}

            <button
              type="button"
              id="btn-save-as-new-content-guideline"
              onClick={() => setIsNewContentModalOpen(true)}
              className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-700/50 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              title="Save current content settings as a new reusable preset"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save as New Guideline</span>
            </button>

            <button
              type="button"
              id="btn-reset-content-guidelines"
              onClick={handleResetBlankContent}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Reset to clean default content template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id="btn-save-content-guidelines"
              onClick={handleTriggerSaveContent}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition flex items-center space-x-1.5 cursor-pointer ${
                contentSaved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {contentSaved ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{contentSaved ? 'Saved Content Guidelines!' : 'Save Content Guidelines'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Tone of Voice (Global)</label>
            <input
              type="text"
              value={contentGuidelines?.toneOfVoice || ''}
              onChange={(e) => onUpdateContentGuidelines({ ...contentGuidelines, toneOfVoice: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              placeholder="e.g. Authoritative, direct, customer-centric, pragmatic"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Readability Target Grade</label>
            <input
              type="text"
              value={contentGuidelines?.readabilityLevel || ''}
              onChange={(e) => onUpdateContentGuidelines({ ...contentGuidelines, readabilityLevel: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              placeholder="e.g. Grade 7-8 Flesch-Kincaid (Plain, scannable English)"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Paragraph & Sentence Constraints</label>
            <input
              type="text"
              value={contentGuidelines?.paragraphConstraints || ''}
              onChange={(e) => onUpdateContentGuidelines({ ...contentGuidelines, paragraphConstraints: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              placeholder="e.g. Max 2-3 sentences per paragraph. Front-load core answer."
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Call-to-Action (CTA) Standards</label>
            <input
              type="text"
              value={contentGuidelines?.ctaStandards || ''}
              onChange={(e) => onUpdateContentGuidelines({ ...contentGuidelines, ctaStandards: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              placeholder="e.g. Action-oriented, value-driven (e.g., 'Start 14-Day Free Trial')"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Grammar & Narrative Perspective</label>
            <input
              type="text"
              value={contentGuidelines?.grammarAndPerspective || ''}
              onChange={(e) => onUpdateContentGuidelines({ ...contentGuidelines, grammarAndPerspective: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              placeholder="e.g. Second person ('you'/'your'), active voice, present tense"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Citation & Empirical Proof Formatting</label>
            <input
              type="text"
              value={contentGuidelines?.citationAndProofRules || ''}
              onChange={(e) => onUpdateContentGuidelines({ ...contentGuidelines, citationAndProofRules: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              placeholder="e.g. Include specific metrics and verifiable source context"
            />
          </div>

          {/* Forbidden Buzzwords / Clichés */}
          <div className="space-y-2 md:col-span-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-rose-300 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Forbidden Buzzwords & AI Clichés</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(contentGuidelines?.forbiddenCliches || []).length} items blacklisted
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newForbiddenCliche}
                onChange={(e) => setNewForbiddenCliche(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddForbiddenCliche(); } }}
                placeholder="Add banned cliché (e.g. 'delve into', 'in conclusion', 'supercharge')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddForbiddenCliche}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-slate-50 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add Cliché
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-32 overflow-y-auto">
              {(contentGuidelines?.forbiddenCliches || []).map((term, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]"
                >
                  <span>{term}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveForbiddenCliche(idx)}
                    className="hover:text-rose-100 ml-1 text-rose-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Formatting Rules */}
          <div className="space-y-2 md:col-span-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-purple-300 flex items-center space-x-1.5">
                <ListPlus className="w-3.5 h-3.5 text-purple-400" />
                <span>Formatting & Scannability Rules</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(contentGuidelines?.formattingRules || []).length} rules active
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFormattingRule}
                onChange={(e) => setNewFormattingRule(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFormattingRule(); } }}
                placeholder="Add formatting rule (e.g. 'Use bold lead-in phrases for bullet points')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddFormattingRule}
                className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-slate-50 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add Rule
              </button>
            </div>
            <div className="space-y-1.5 pt-1.5">
              {(contentGuidelines?.formattingRules || []).map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                  <span>• {rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFormattingRule(idx)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">Custom Content Rules & Directives</label>
            <textarea
              rows={2}
              value={contentGuidelines?.customContentRules || ''}
              onChange={(e) => onUpdateContentGuidelines({ ...contentGuidelines, customContentRules: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-purple-500 focus:outline-none leading-relaxed"
              placeholder="Additional global formatting, legal style, and structure rules..."
            />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PRODUCT GUIDELINES (PRODUCT-SPECIFIC / CHANGES PER URL) */}
      {/* ========================================================================= */}
      <div id="section-2-product" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>Section 2: Product & Commercial Guidelines</span>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Product Specific / Profile
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Product name, category, target audience, USPs, forbidden claims, and compliance notes tailored for the selected product/URL.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedProductPresets && savedProductPresets.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <select
                  id="select-product-preset"
                  value={activeProductPresetId}
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectProductPreset?.(e.target.value);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[210px] truncate"
                >
                  {savedProductPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  id="btn-browse-product-presets"
                  onClick={() => setIsManageProductModalOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                  title="Browse & manage all Product presets"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Presets</span>
                </button>
              </div>
            )}

            <button
              type="button"
              id="btn-save-as-new-product-guideline"
              onClick={() => setIsNewProductModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              title="Save current product guidelines as a new profile/preset"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save as New Guideline</span>
            </button>

            <button
              type="button"
              id="btn-reset-product-guidelines"
              onClick={handleResetBlankProduct}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Clear to blank product template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id="btn-save-product-guidelines"
              onClick={handleTriggerSaveProduct}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition flex items-center space-x-1.5 cursor-pointer ${
                productSaved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {productSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{productSaved ? 'Saved Product Guidelines!' : 'Save Product Guidelines'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Product Name</label>
            <input
              type="text"
              value={productGuidelines.productName}
              onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, productName: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. ApexFlow AI Workspace"
            />
          </div>

          {/* Brand Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Brand name</label>
            <input
              type="text"
              value={productGuidelines.brandName || ''}
              onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, brandName: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Bajaj Finance (leave empty to skip brand checks)"
            />
            <p className="text-[11px] text-slate-500">The SEO gate checks that titles and descriptions mention this brand.</p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Industry / Product Category</label>
            <input
              type="text"
              value={productGuidelines.category}
              onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, category: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Enterprise B2B Productivity & Workflow Automation"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">Target Audience & Ideal Customer Profile (ICP)</label>
            <textarea
              rows={2}
              value={productGuidelines.targetAudience}
              onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, targetAudience: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              placeholder="e.g. CTOs, VP of Engineering, Operations Leads, Enterprise IT Directors..."
            />
          </div>

          {/* Unique Selling Points (USPs) */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-indigo-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Unique Selling Points (USPs)</span>
              </label>
              {productGuidelines.uniqueSellingPoints.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearUSPs}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newUSP}
                onChange={(e) => setNewUSP(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUSP(); } }}
                placeholder="Add a USP (e.g. 10x faster deployment without code changes)..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddUSP}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="space-y-1.5 pt-1.5">
              {productGuidelines.uniqueSellingPoints.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-1">No USPs added yet.</div>
              ) : (
                productGuidelines.uniqueSellingPoints.map((usp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                    <span>• {usp}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUSP(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Core Value Props */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Core Value Propositions</span>
              </label>
              {productGuidelines.coreValueProps.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearValueProps}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newValueProp}
                onChange={(e) => setNewValueProp(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddValueProp(); } }}
                placeholder="Add core value prop (e.g. Cuts infrastructure costs by 45%)..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddValueProp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="space-y-1.5 pt-1.5">
              {productGuidelines.coreValueProps.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-1">No value props added yet.</div>
              ) : (
                productGuidelines.coreValueProps.map((vp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                    <span>• {vp}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValueProp(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Forbidden Product Phrases */}
          <div className="space-y-2 md:col-span-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-rose-300 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Product-Specific Forbidden Phrases & Claims</span>
              </label>
              {productGuidelines.forbiddenPhrases.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearForbidden}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newForbidden}
                onChange={(e) => setNewForbidden(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddForbidden(); } }}
                placeholder="Add banned claim (e.g. '100% bug free guarantee', 'unlimited free tier')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddForbidden}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-slate-50 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add Banned Claim
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {productGuidelines.forbiddenPhrases.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-1">No forbidden phrases defined.</div>
              ) : (
                productGuidelines.forbiddenPhrases.map((phrase, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs"
                  >
                    <span>{phrase}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveForbidden(idx)}
                      className="hover:text-rose-100 ml-1 text-rose-400 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Compliance & EEAT Credentials */}
          <div className="space-y-1.5">
            <label className="font-semibold text-amber-300">Mandatory Compliance & Disclaimers</label>
            <textarea
              rows={3}
              value={productGuidelines.complianceNotes}
              onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, complianceNotes: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none leading-relaxed"
              placeholder="e.g. SOC-2 Type II audit date (Q3 2025), GDPR/CCPA readiness, mandatory FDA disclaimers..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-emerald-300">EEAT Authority & Research Credentials</label>
            <textarea
              rows={3}
              value={productGuidelines.eeatCredentials}
              onChange={(e) => onUpdateProductGuidelines({ ...productGuidelines, eeatCredentials: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Built by Stanford AI researchers; peer-reviewed benchmark published in ACM Transactions 2025..."
            />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: SEO GUIDELINES (GLOBAL / PRESETS) */}
      {/* ========================================================================= */}
      <div id="section-3-seo" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>Section 3: Technical SEO & Schema Guidelines</span>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Global / Presets
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Technical SEO character ranges, Schema.org entities, voice search formatting, and crawler snippet rules.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedSeoPresets && savedSeoPresets.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <select
                  id="select-seo-preset"
                  value={activeSeoPresetId}
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectSeoPreset?.(e.target.value);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[210px] truncate"
                >
                  {savedSeoPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  id="btn-browse-seo-presets"
                  onClick={() => setIsManageSeoModalOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                  title="Browse & manage all SEO presets"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Presets</span>
                </button>
              </div>
            )}

            <button
              type="button"
              id="btn-save-as-new-seo-guideline"
              onClick={() => setIsNewSeoModalOpen(true)}
              className="px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-700/50 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              title="Save current SEO guidelines as a new preset"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save as New Guideline</span>
            </button>

            <button
              type="button"
              id="btn-reset-seo-guidelines"
              onClick={handleResetBlankSeo}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Reset to clean default SEO template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id="btn-save-seo-guidelines"
              onClick={handleTriggerSaveSeo}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition flex items-center space-x-1.5 cursor-pointer ${
                seoSaved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {seoSaved ? <Check className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              <span>{seoSaved ? 'Saved SEO Guidelines!' : 'Save SEO Guidelines'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          
          {/* Title & Meta Desc Char Ranges */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Meta Character Length Targets</span>
              <span className="text-[11px] text-slate-400 font-mono">SERP Snippet Rules</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Meta Title Min-Max</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="number"
                    value={seoGuidelines.titleCharRange.min}
                    onChange={(e) => onUpdateSeoGuidelines({
                      ...seoGuidelines,
                      titleCharRange: { ...seoGuidelines.titleCharRange, min: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-center text-xs text-slate-50"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="number"
                    value={seoGuidelines.titleCharRange.max}
                    onChange={(e) => onUpdateSeoGuidelines({
                      ...seoGuidelines,
                      titleCharRange: { ...seoGuidelines.titleCharRange, max: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-center text-xs text-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Meta Desc Min-Max</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="number"
                    value={seoGuidelines.metaDescCharRange.min}
                    onChange={(e) => onUpdateSeoGuidelines({
                      ...seoGuidelines,
                      metaDescCharRange: { ...seoGuidelines.metaDescCharRange, min: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-center text-xs text-slate-50"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="number"
                    value={seoGuidelines.metaDescCharRange.max}
                    onChange={(e) => onUpdateSeoGuidelines({
                      ...seoGuidelines,
                      metaDescCharRange: { ...seoGuidelines.metaDescCharRange, max: Number(e.target.value) }
                    })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-center text-xs text-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Engine Optimization Toggles */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="font-semibold text-slate-300">Technical Search Engines Flags</div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seoGuidelines.voiceSearchOptimized}
                  onChange={(e) => onUpdateSeoGuidelines({
                    ...seoGuidelines,
                    voiceSearchOptimized: e.target.checked
                  })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-900"
                />
                <span className="text-slate-200">Voice Search (Conversational Q&A H3 headings)</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seoGuidelines.aeoDirectAnswerTarget}
                  onChange={(e) => onUpdateSeoGuidelines({
                    ...seoGuidelines,
                    aeoDirectAnswerTarget: e.target.checked
                  })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-900"
                />
                <span className="text-slate-200">AEO Direct Answer Target (40-60 word concise snippets)</span>
              </label>
            </div>
          </div>

          {/* Schema.org Entity Requirements */}
          <div className="space-y-2 md:col-span-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-blue-300 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Required Schema.org Structured Data Entities</span>
              </label>
              <span className="text-[11px] text-slate-500">JSON-LD Microdata Output</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSchema}
                onChange={(e) => setNewSchema(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSchema(); } }}
                placeholder="Custom Schema Entity (e.g. TechArticle, WebPage, AggregateRating)..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddSchema()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add Entity
              </button>
            </div>

            {/* Quick-add chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick Add:</span>
              {COMMON_SCHEMAS.map((schema) => {
                const isSelected = (seoGuidelines?.schemaRequirements || []).includes(schema);
                return (
                  <button
                    key={schema}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        const idx = (seoGuidelines?.schemaRequirements || []).indexOf(schema);
                        handleRemoveSchema(idx);
                      } else {
                        handleAddSchema(schema);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    +{schema}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(seoGuidelines?.schemaRequirements || []).length === 0 ? (
                <div className="text-xs text-slate-500 italic py-1 px-2">
                  No schema types required yet. Click quick-add above or type a custom schema entity.
                </div>
              ) : (
                (seoGuidelines?.schemaRequirements || []).map((type, idx) => (
                  <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-blue-950/40 text-blue-300 text-xs border border-blue-800/60">
                    <span>@{type}</span>
                    <button
                      onClick={() => handleRemoveSchema(idx)}
                      className="text-blue-400 hover:text-blue-200 ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Heading Hierarchy & Keyword Rules */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">Heading Hierarchy & Keyword Placement Rules</label>
            <textarea
              rows={2}
              value={seoGuidelines.headingHierarchyRules}
              onChange={(e) => onUpdateSeoGuidelines({ ...seoGuidelines, headingHierarchyRules: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Strict H1 with primary search volume keyword, H2s for secondary features, H3s for conversational voice queries..."
            />
          </div>

          {/* Sitemap & Technical Directives */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">Sitemap, Crawlability & Canonical Rules</label>
            <textarea
              rows={2}
              value={seoGuidelines.sitemapGuidelines || ''}
              onChange={(e) => onUpdateSeoGuidelines({ ...seoGuidelines, sitemapGuidelines: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Ensure canonical self-referential tag, clean internal anchor text with descriptive keywords..."
            />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: GENERATIVE ENGINE OPTIMIZATION (GEO) & AI OVERVIEW GUIDELINES */}
      {/* ========================================================================= */}
      <div id="section-4-geo" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>Section 4: Generative Engine Optimization (GEO) & AI Overview Guidelines</span>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Global / Presets
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Directives for LLM citation (Google AI Overviews, Perplexity, ChatGPT Search, Gemini), BLUF answer blocks, entity graphs, and numeric density.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedGeoPresets && savedGeoPresets.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <select
                  id="select-geo-preset"
                  value={activeGeoPresetId}
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectGeoPreset?.(e.target.value);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[210px] truncate"
                >
                  {savedGeoPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.isBuiltIn ? '(Preset)' : '(Custom)'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  id="btn-browse-geo-presets"
                  onClick={() => setIsManageGeoModalOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                  title="Browse & manage all GEO presets"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Presets</span>
                </button>
              </div>
            )}

            <button
              type="button"
              id="btn-save-as-new-geo-guideline"
              onClick={() => setIsNewGeoModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
              title="Save current GEO guidelines as a new preset"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save as New Guideline</span>
            </button>

            <button
              type="button"
              id="btn-reset-geo-guidelines"
              onClick={handleResetBlankGeo}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Reset to clean default GEO template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id="btn-save-geo-guidelines"
              onClick={handleTriggerSaveGeo}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition flex items-center space-x-1.5 cursor-pointer ${
                geoSaved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {geoSaved ? <Check className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
              <span>{geoSaved ? 'Saved GEO Guidelines!' : 'Save GEO Guidelines'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          
          {/* Target Engine Multi-Selector */}
          <div className="space-y-2 md:col-span-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Generative & Answer Engines</span>
              </label>
              <span className="text-[11px] text-slate-400">Select engines to optimize citations for</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {GEO_TARGET_ENGINES.map(engine => {
                const isSelected = (geoGuidelines?.targetEngines || []).includes(engine.id);
                return (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => handleToggleTargetEngine(engine.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-medium text-xs truncate">{engine.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Citation Format & Snippet Target */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">LLM Citation & Snippet Formulation Standard</label>
            <input
              type="text"
              value={geoGuidelines?.citationFormat || ''}
              onChange={(e) => onUpdateGeoGuidelines?.({ ...geoGuidelines, citationFormat: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Authoritative BLUF definitions with bracketed empirical proof and numeric benchmarks"
            />
          </div>

          {/* Stat & Metric Density Target */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Empirical Metric & Statistical Density Target</label>
            <input
              type="text"
              value={geoGuidelines?.statDensityRequirement || ''}
              onChange={(e) => onUpdateGeoGuidelines?.({ ...geoGuidelines, statDensityRequirement: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Minimum 1 verifiable benchmark or performance metric per 120-150 words"
            />
          </div>

          {/* Answer Engine Direct Answer Rule */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Direct Answer (BLUF) Formulation Rule</label>
            <input
              type="text"
              value={geoGuidelines?.directAnswerStandard || ''}
              onChange={(e) => onUpdateGeoGuidelines?.({ ...geoGuidelines, directAnswerStandard: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. The first sentence directly under every H2/H3 must answer the question with zero fluff"
            />
          </div>

          {/* Source Attribution Standard */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Source Attribution & Benchmark Standard</label>
            <input
              type="text"
              value={geoGuidelines?.sourceAttributionStandard || ''}
              onChange={(e) => onUpdateGeoGuidelines?.({ ...geoGuidelines, sourceAttributionStandard: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Cite specific institution names and publication years (e.g., 'According to Gartner 2025...')"
            />
          </div>

          {/* Multi-Perspective & Comparison Requirement */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">Comparative Matrix & Multi-Perspective Standard</label>
            <textarea
              rows={2}
              value={geoGuidelines?.multiPerspectiveRequirement || ''}
              onChange={(e) => onUpdateGeoGuidelines?.({ ...geoGuidelines, multiPerspectiveRequirement: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Provide balanced comparative feature breakdown tables against conventional alternatives to earn multi-document synthesis citations."
            />
          </div>

          {/* Knowledge Priority Sources & Domains */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Primary Benchmark & Knowledge Domains</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(geoGuidelines?.knowledgeSources || []).length} sources
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGeoSource}
                onChange={(e) => setNewGeoSource(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGeoSource(); } }}
                placeholder="Add source (e.g. Gartner, IEEE, Official Docs, ACM, Statista)..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddGeoSource}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {(geoGuidelines?.knowledgeSources || []).map((source, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs"
                >
                  <span>{source}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGeoSource(idx)}
                    className="hover:text-emerald-100 ml-1 text-emerald-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Structured Entity Relationships */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Entity Graph & Ontological Directives</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(geoGuidelines?.entityRelationships || []).length} rules
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGeoEntityRule}
                onChange={(e) => setNewGeoEntityRule(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGeoEntityRule(); } }}
                placeholder="Add entity relationship directive (e.g. 'Declare product as an [AI Workspace] for [B2B]')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddGeoEntityRule}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="space-y-1.5 pt-1.5">
              {(geoGuidelines?.entityRelationships || []).map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                  <span>• {rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGeoEntityRule(idx)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom GEO Directives */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-emerald-300 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Custom GEO Directives & Synthesis Guidelines</span>
            </label>
            <textarea
              rows={3}
              value={geoGuidelines?.customGeoRules || ''}
              onChange={(e) => onUpdateGeoGuidelines?.({ ...geoGuidelines, customGeoRules: e.target.value })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Ensure every technical paragraph specifies exact latency numbers, integration protocols, and cryptographic standards so AI systems can synthesize complete factual summaries without ambiguity."
            />
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: STRUCTURE & KEYWORD MAPPING GUIDELINES (AGENT 4) */}
      {/* ========================================================================= */}
      <div id="section-5-structure" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>Section 5: Structure & Keyword Mapping Guidelines</span>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Followed by Agent 4
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Governs search intent mapping, heading hierarchy, keyword distribution, and structural flow enforced by Agent 4.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedStructureMappingPresets && savedStructureMappingPresets.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <select
                  value={activeStructureMappingPresetId}
                  onChange={(e) => onSelectStructureMappingPreset?.(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-amber-300 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer max-w-[210px] truncate"
                  title="Switch active Structure & Mapping preset"
                >
                  {savedStructureMappingPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.id === activeStructureMappingPresetId ? '✓' : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsManageStructureModalOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                  title="Browse, search, and manage all Structure & Mapping presets"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Presets ({savedStructureMappingPresets.length})</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsNewStructureModalOpen(true)}
              className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
              title="Save current structure mapping directives as a reusable preset"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Save as New Guideline</span>
            </button>

            <button
              type="button"
              onClick={handleResetBlankStructure}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
              title="Reset Structure rules to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerSaveStructure}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm flex items-center space-x-1.5 cursor-pointer ${
                structureSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {structureSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{structureSaved ? 'Saved!' : 'Save Structure Guidelines'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Search Intent Mapping Strategy */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">
              Search Intent Mapping Strategy (Commercial, Informational, Transactional)
            </label>
            <input
              type="text"
              value={structureMappingGuidelines?.searchIntentMappingStrategy || ''}
              onChange={(e) => onUpdateStructureMappingGuidelines?.({
                ...structureMappingGuidelines,
                searchIntentMappingStrategy: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              placeholder="e.g. Map commercial intents to problem/solution headings, informational queries to clear definitions and FAQs."
            />
          </div>

          {/* Heading Hierarchy Rules */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">
              Heading Hierarchy & Section Nesting Directives
            </label>
            <textarea
              rows={2}
              value={structureMappingGuidelines?.headingHierarchyRule || ''}
              onChange={(e) => onUpdateStructureMappingGuidelines?.({
                ...structureMappingGuidelines,
                headingHierarchyRule: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Strict H1 -> H2 -> H3 flow without skipping levels. Exactly one H1 per page containing primary keyword."
            />
          </div>

          {/* Hierarchy Parameters Grid */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 md:col-span-2">
            <h4 className="font-bold text-amber-300 text-xs flex items-center space-x-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              <span>Keyword & Density Thresholds Enforced by Agent 4</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Min Keyword Freq / Sec</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={structureMappingGuidelines?.minKeywordFrequency ?? 2}
                  onChange={(e) => onUpdateStructureMappingGuidelines?.({
                    ...structureMappingGuidelines,
                    minKeywordFrequency: parseInt(e.target.value) || 2
                  })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-center font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Max Density %</label>
                <input
                  type="number"
                  step="0.1"
                  min={0.5}
                  max={5.0}
                  value={structureMappingGuidelines?.maxKeywordDensityPercent ?? 2.5}
                  onChange={(e) => onUpdateStructureMappingGuidelines?.({
                    ...structureMappingGuidelines,
                    maxKeywordDensityPercent: parseFloat(e.target.value) || 2.5
                  })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-center font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Headings Target KW %</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={structureMappingGuidelines?.targetKeywordsInHeadingsMinPercent ?? 60}
                  onChange={(e) => onUpdateStructureMappingGuidelines?.({
                    ...structureMappingGuidelines,
                    targetKeywordsInHeadingsMinPercent: parseInt(e.target.value) || 60
                  })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-center font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Voice Question H3 %</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={structureMappingGuidelines?.voiceQuestionHeadingsTarget ?? 30}
                  onChange={(e) => onUpdateStructureMappingGuidelines?.({
                    ...structureMappingGuidelines,
                    voiceQuestionHeadingsTarget: parseInt(e.target.value) || 30
                  })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-center font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-300 font-semibold">Strict Primary Keyword in H1 Header</span>
              <button
                type="button"
                onClick={() => onUpdateStructureMappingGuidelines?.({
                  ...structureMappingGuidelines,
                  requirePrimaryKeywordInH1: !structureMappingGuidelines.requirePrimaryKeywordInH1
                })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  structureMappingGuidelines.requirePrimaryKeywordInH1 ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    structureMappingGuidelines.requirePrimaryKeywordInH1 ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preferred Section Order */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-amber-300 flex items-center space-x-1.5">
                <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Preferred Section Flow & Content Order</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(structureMappingGuidelines?.preferredSectionOrder || []).length} sections sequenced
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPreferredSection}
                onChange={(e) => setNewPreferredSection(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPreferredSection(); } }}
                placeholder="Add ordered section (e.g. 'Hero with Pain Point', 'Interactive Feature Matrix', 'Social Proof', 'FAQ')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddPreferredSection}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add Section
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {(structureMappingGuidelines?.preferredSectionOrder || []).map((sec, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs"
                >
                  <span className="text-[11px] font-mono text-amber-400/70 font-bold">#{idx + 1}</span>
                  <span>{sec}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePreferredSection(idx)}
                    className="hover:text-amber-100 ml-1 text-amber-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Keyword Distribution Rules */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">
              Keyword Distribution & Anchor Placement Directives
            </label>
            <textarea
              rows={2}
              value={structureMappingGuidelines?.keywordDistributionRules || ''}
              onChange={(e) => onUpdateStructureMappingGuidelines?.({
                ...structureMappingGuidelines,
                keywordDistributionRules: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Distribute secondary keywords evenly across H2 subsections; anchor text must be natural, descriptive, and non-generic."
            />
          </div>

          {/* Custom Structure Directives */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-amber-300 flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Custom Structure & Mapping Directives</span>
            </label>
            <textarea
              rows={2}
              value={structureMappingGuidelines?.customStructureRules || ''}
              onChange={(e) => onUpdateStructureMappingGuidelines?.({
                ...structureMappingGuidelines,
                customStructureRules: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-amber-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Ensure every feature block links to the solution architecture; prevent orphaned paragraphs or excessive list nesting."
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: CUSTOMER CENTRICITY GUIDELINES (AGENT 5 & SCORING) */}
      {/* ========================================================================= */}
      <div id="section-6-customer-centricity" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>Section 6: Customer Centricity Guidelines</span>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Followed by Agent 5 & Scoring
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Enforces layman readability, user friction elimination, objection resolution, and calibrates Agent 5 scoring benchmarks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedCustomerCentricityPresets && savedCustomerCentricityPresets.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <select
                  value={activeCustomerCentricityPresetId}
                  onChange={(e) => onSelectCustomerCentricityPreset?.(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-semibold text-rose-300 focus:ring-1 focus:ring-rose-500 focus:outline-none cursor-pointer max-w-[210px] truncate"
                  title="Switch active Customer Centricity preset"
                >
                  {savedCustomerCentricityPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.id === activeCustomerCentricityPresetId ? '✓' : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsManageCustomerModalOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                  title="Browse, search, and manage all Customer Centricity presets"
                >
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  <span>Presets ({savedCustomerCentricityPresets.length})</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
              title="Save current customer centricity rules as a reusable preset"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Save as New Guideline</span>
            </button>

            <button
              type="button"
              onClick={handleResetBlankCustomer}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
              title="Reset Customer Centricity rules to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerSaveCustomer}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm flex items-center space-x-1.5 cursor-pointer ${
                customerSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {customerSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{customerSaved ? 'Saved!' : 'Save Customer Guidelines'}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Target Customer Persona */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Target Customer Persona & Decision-Maker Profile</label>
            <input
              type="text"
              value={customerCentricityGuidelines?.targetCustomerPersona || ''}
              onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                ...customerCentricityGuidelines,
                targetCustomerPersona: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              placeholder="e.g. Non-technical VP of Growth or small business owner seeking rapid ROI without complexity"
            />
          </div>

          {/* Reading Accessibility & Layman Standard */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Reading Accessibility & Layman Standard</label>
            <input
              type="text"
              value={customerCentricityGuidelines?.readingAccessibility || ''}
              onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                ...customerCentricityGuidelines,
                readingAccessibility: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              placeholder="e.g. 8th-grade level, zero unexplained enterprise jargon, plain-language summaries"
            />
          </div>

          {/* Empathy and Tone */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">Empathy, Tone & Value Orientation</label>
            <input
              type="text"
              value={customerCentricityGuidelines?.empathyAndTone || ''}
              onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                ...customerCentricityGuidelines,
                empathyAndTone: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              placeholder="e.g. Highly empathetic, collaborative, customer-first, transparent about setup and trade-offs"
            />
          </div>

          {/* Decision Journey Order */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-slate-300">Customer Decision Journey Stage Ordering</label>
            <input
              type="text"
              value={customerCentricityGuidelines?.decisionJourneyOrder || ''}
              onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                ...customerCentricityGuidelines,
                decisionJourneyOrder: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              placeholder="e.g. Problem Validation -> Solution Feasibility -> Risk Mitigation -> ROI Justification -> Frictionless Action"
            />
          </div>

          {/* Sentence & Paragraph Constraints */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-rose-300 text-xs flex items-center space-x-1.5">
              <Settings2 className="w-3.5 h-3.5" />
              <span>Cognitive Load & Readability Knobs</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Max Words / Sentence</label>
                <input
                  type="number"
                  min={10}
                  max={45}
                  value={customerCentricityGuidelines?.maxSentenceWords ?? 22}
                  onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                    ...customerCentricityGuidelines,
                    maxSentenceWords: parseInt(e.target.value) || 22
                  })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-center font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Max Sentences / Paragraph</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={customerCentricityGuidelines?.maxParagraphSentences ?? 3}
                  onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                    ...customerCentricityGuidelines,
                    maxParagraphSentences: parseInt(e.target.value) || 3
                  })}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-center font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Scoring Engine Weight Allocation */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-rose-300 text-xs flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Agent 5 Scoring Engine Weight Allocation (%)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Accessibility</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={customerCentricityGuidelines?.scoringWeights?.laymanAccessibilityWeight ?? 30}
                  onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                    ...customerCentricityGuidelines,
                    scoringWeights: {
                      ...customerCentricityGuidelines.scoringWeights,
                      laymanAccessibilityWeight: parseInt(e.target.value) || 30
                    }
                  })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-center font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Objections</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={customerCentricityGuidelines?.scoringWeights?.objectionHandlingWeight ?? 25}
                  onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                    ...customerCentricityGuidelines,
                    scoringWeights: {
                      ...customerCentricityGuidelines.scoringWeights,
                      objectionHandlingWeight: parseInt(e.target.value) || 25
                    }
                  })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-center font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Friction-Free</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={customerCentricityGuidelines?.scoringWeights?.frictionEliminationWeight ?? 25}
                  onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                    ...customerCentricityGuidelines,
                    scoringWeights: {
                      ...customerCentricityGuidelines.scoringWeights,
                      frictionEliminationWeight: parseInt(e.target.value) || 25
                    }
                  })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-center font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Journey Flow</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={customerCentricityGuidelines?.scoringWeights?.journeyStructureWeight ?? 20}
                  onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                    ...customerCentricityGuidelines,
                    scoringWeights: {
                      ...customerCentricityGuidelines.scoringWeights,
                      journeyStructureWeight: parseInt(e.target.value) || 20
                    }
                  })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-center font-mono text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Friction Patterns to Flag */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-rose-300 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Friction Patterns & Jargon to Flag and Eliminate (Agent 5 Penalties)</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(customerCentricityGuidelines?.frictionPatternsToFlag || []).length} patterns active
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFrictionPattern}
                onChange={(e) => setNewFrictionPattern(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFrictionPattern(); } }}
                placeholder="Add friction pattern (e.g. 'Dense walls of technical jargon without lay definitions', 'Hidden pricing')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddFrictionPattern}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {(customerCentricityGuidelines?.frictionPatternsToFlag || []).map((pattern, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs"
                >
                  <span>{pattern}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFrictionPattern(idx)}
                    className="hover:text-rose-100 ml-1 text-rose-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Core Pain Points to Address */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-rose-300 flex items-center space-x-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                <span>Core Customer Pain Points to Address</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(customerCentricityGuidelines?.corePainPointsToAddress || []).length} items
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCorePainPoint}
                onChange={(e) => setNewCorePainPoint(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPainPoint(); } }}
                placeholder="Add pain point (e.g. 'Frustrated by slow support responses')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddPainPoint}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto">
              {(customerCentricityGuidelines?.corePainPointsToAddress || []).map((pt, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                  <span>• {pt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePainPoint(idx)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Objection Handling Rules */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-rose-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Objection Handling Directives</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(customerCentricityGuidelines?.objectionHandlingRules || []).length} rules
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newObjectionRule}
                onChange={(e) => setNewObjectionRule(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddObjectionRule(); } }}
                placeholder="Add objection rule (e.g. 'Directly address cost vs in-house build upfront')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddObjectionRule}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto">
              {(customerCentricityGuidelines?.objectionHandlingRules || []).map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                  <span>• {rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjectionRule(idx)}
                    className="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trust & Reassurance Signals */}
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-xl border border-slate-800 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-rose-300 flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-rose-400" />
                <span>Trust & Reassurance Signals Required</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {(customerCentricityGuidelines?.trustAndReassuranceSignals || []).length} signals
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTrustSignal}
                onChange={(e) => setNewTrustSignal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTrustSignal(); } }}
                placeholder="Add trust signal (e.g. 'Explicit enterprise security certifications', 'Risk-free trial period')..."
                className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-50 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddTrustSignal}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                + Add Signal
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {(customerCentricityGuidelines?.trustAndReassuranceSignals || []).map((sig, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs"
                >
                  <span>{sig}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTrustSignal(idx)}
                    className="hover:text-rose-100 ml-1 text-rose-400 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Custom Customer Rules */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="font-semibold text-rose-300 flex items-center space-x-2">
              <Award className="w-4 h-4 text-rose-400" />
              <span>Custom Customer Centricity Directives</span>
            </label>
            <textarea
              rows={2}
              value={customerCentricityGuidelines?.customCustomerRules || ''}
              onChange={(e) => onUpdateCustomerCentricityGuidelines?.({
                ...customerCentricityGuidelines,
                customCustomerRules: e.target.value
              })}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:ring-1 focus:ring-rose-500 focus:outline-none leading-relaxed"
              placeholder="e.g. Every technical claim must be immediately paired with the direct user benefit and time saved."
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: TARGET KEYWORDS & SEARCH VOLUMES */}
      {/* ========================================================================= */}
      <div id="section-7-keywords" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 scroll-mt-20">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>Section 7: Target Keywords & Search Volume Priority Matrix</span>
                <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {keywords.length} Keywords Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Primary keywords target H1 and Title; secondary keywords target H2s; voice questions target H3s.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            {keywords.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllKeywords}
                className="px-3 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-semibold border border-slate-700 hover:border-rose-800/60 transition cursor-pointer"
              >
                Clear Keywords
              </button>
            )}

            {onAutofillKeywords && (
              <button
                id="btn-autofill-keywords-tab1"
                type="button"
                onClick={onAutofillKeywords}
                disabled={isAutofillingKeywords}
                className="flex items-center space-x-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 shrink-0 cursor-pointer"
                title="Extract & Autofill target keywords from currently scraped page"
              >
                {isAutofillingKeywords ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-200" />
                    <span>Extracting Keywords...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Autofill Keywords from Scraped Page</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Add Keyword Form */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Target Ranking Keyword</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newKwText}
                onChange={(e) => setNewKwText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                placeholder="Keyword phrase (e.g. ai workflow automation platform)..."
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 text-xs"
              />
            </div>
            <div>
              <input
                type="number"
                value={newKwVol}
                onChange={(e) => setNewKwVol(Number(e.target.value))}
                placeholder="Search Volume (e.g. 10000)"
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={newKwPriority}
                onChange={(e: any) => setNewKwPriority(e.target.value)}
                className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-50 text-xs"
              >
                <option value="primary">Primary (H1)</option>
                <option value="secondary">Secondary (H2)</option>
                <option value="voice_question">Voice Query (H3)</option>
                <option value="lsi">LSI / Semantic</option>
              </select>
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Keywords Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3">Keyword Phrase</th>
                <th className="py-2.5 px-3">Monthly Volume</th>
                <th className="py-2.5 px-3">Search Intent</th>
                <th className="py-2.5 px-3">Heading Target Priority</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(keywords || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No target keywords defined. Add keyword phrases above or use &ldquo;Autofill Keywords from Page&rdquo;.
                  </td>
                </tr>
              ) : (
                (keywords || []).map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-100 flex items-center space-x-2">
                      <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{kw.keyword}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-indigo-300">
                      {kw.searchVolume.toLocaleString()} /mo
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize ${
                        kw.intent === 'commercial' 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : kw.intent === 'informational'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {kw.intent}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        kw.priority === 'primary'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : kw.priority === 'secondary'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : kw.priority === 'voice_question'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {kw.priority === 'primary' ? 'Primary #1 (H1 + Meta Title)' : kw.priority === 'secondary' ? 'Secondary (H2)' : kw.priority === 'voice_question' ? 'Voice Question (H3)' : 'LSI / Body'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleRemoveKeyword(kw.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Remove keyword"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Bottom Floating Step Navigation */}
      <div className="hidden md:flex sticky bottom-4 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Guidelines, GEO rules, and keywords are active and ready for scraping & audit.</span>
        </div>

        <button
          id="btn-proceed-to-scrape-tab"
          onClick={onGoToScrapeTab}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center space-x-2 transition cursor-pointer"
        >
          <span>Go to Scrape, Audit & Fix Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Save as New Guideline Modals */}
      {isNewContentModalOpen && (
        <SaveNewContentModal
          isOpen={isNewContentModalOpen}
          onClose={() => setIsNewContentModalOpen(false)}
          onSave={(name, desc) => {
            onSaveNewContentGuideline?.(name, desc);
            setIsNewContentModalOpen(false);
            showCopyNotice(`Content preset "${name}" saved!`);
          }}
        />
      )}

      {isNewProductModalOpen && (
        <SaveNewProductModal
          isOpen={isNewProductModalOpen}
          onClose={() => setIsNewProductModalOpen(false)}
          onSave={(name, desc, category) => {
            onSaveNewProductGuideline?.(name, desc, category);
            setIsNewProductModalOpen(false);
            showCopyNotice(`Product profile "${name}" saved!`);
          }}
        />
      )}

      {isNewSeoModalOpen && (
        <SaveNewSeoModal
          isOpen={isNewSeoModalOpen}
          onClose={() => setIsNewSeoModalOpen(false)}
          onSave={(name, desc) => {
            onSaveNewSeoGuideline?.(name, desc);
            setIsNewSeoModalOpen(false);
            showCopyNotice(`SEO preset "${name}" saved!`);
          }}
        />
      )}

      {isNewGeoModalOpen && (
        <SaveNewGeoModal
          isOpen={isNewGeoModalOpen}
          onClose={() => setIsNewGeoModalOpen(false)}
          onSave={(name, desc) => {
            onSaveNewGeoGuideline?.(name, desc);
            setIsNewGeoModalOpen(false);
            showCopyNotice(`GEO preset "${name}" saved!`);
          }}
        />
      )}

      {/* Preset Manager Modals */}
      {isManageContentModalOpen && (
        <PresetManagerModal
          isOpen={isManageContentModalOpen}
          onClose={() => setIsManageContentModalOpen(false)}
          type="content"
          title="Content Guidelines Library"
          subtitle="Browse, apply, and manage tone of voice and readability presets"
          presets={savedContentPresets}
          activePresetId={activeContentPresetId}
          onSelect={(id) => onSelectContentPreset?.(id)}
          onDelete={(id) => onDeleteContentPreset?.(id)}
          onOpenSaveNew={() => setIsNewContentModalOpen(true)}
        />
      )}

      {isManageProductModalOpen && (
        <PresetManagerModal
          isOpen={isManageProductModalOpen}
          onClose={() => setIsManageProductModalOpen(false)}
          type="product"
          title="Product Guidelines Library"
          subtitle="Browse, apply, and manage product definitions, USPs, and compliance rules"
          presets={savedProductPresets}
          activePresetId={activeProductPresetId}
          onSelect={(id) => onSelectProductPreset?.(id)}
          onDelete={(id) => onDeleteProductPreset?.(id)}
          onOpenSaveNew={() => setIsNewProductModalOpen(true)}
        />
      )}

      {isManageSeoModalOpen && (
        <PresetManagerModal
          isOpen={isManageSeoModalOpen}
          onClose={() => setIsManageSeoModalOpen(false)}
          type="seo"
          title="Technical SEO & Schema Library"
          subtitle="Browse, apply, and manage search engine optimization and structured data standards"
          presets={savedSeoPresets}
          activePresetId={activeSeoPresetId}
          onSelect={(id) => onSelectSeoPreset?.(id)}
          onDelete={(id) => onDeleteSeoPreset?.(id)}
          onOpenSaveNew={() => setIsNewSeoModalOpen(true)}
        />
      )}

      {isManageGeoModalOpen && (
        <PresetManagerModal
          isOpen={isManageGeoModalOpen}
          onClose={() => setIsManageGeoModalOpen(false)}
          type="geo"
          title="Generative Engine Optimization (GEO) Library"
          subtitle="Browse, apply, and manage AI Overview citation and LLM synthesis presets"
          presets={savedGeoPresets}
          activePresetId={activeGeoPresetId}
          onSelect={(id) => onSelectGeoPreset?.(id)}
          onDelete={(id) => onDeleteGeoPreset?.(id)}
          onOpenSaveNew={() => setIsNewGeoModalOpen(true)}
        />
      )}

      {/* Structure Mapping Save & Manage Modals */}
      {isNewStructureModalOpen && (
        <SaveNewStructureMappingModal
          isOpen={isNewStructureModalOpen}
          onClose={() => setIsNewStructureModalOpen(false)}
          onSave={(name, desc) => {
            onSaveNewStructureMappingGuideline?.(name, desc);
            setIsNewStructureModalOpen(false);
            showCopyNotice(`Structure preset "${name}" saved!`);
          }}
        />
      )}

      {isManageStructureModalOpen && (
        <PresetManagerModal
          isOpen={isManageStructureModalOpen}
          onClose={() => setIsManageStructureModalOpen(false)}
          type="structure"
          title="Structure & Keyword Mapping Library"
          subtitle="Browse, apply, and manage heading hierarchies and search intent mapping presets for Agent 4"
          presets={savedStructureMappingPresets}
          activePresetId={activeStructureMappingPresetId}
          onSelect={(id) => onSelectStructureMappingPreset?.(id)}
          onDelete={(id) => onDeleteStructureMappingPreset?.(id)}
          onOpenSaveNew={() => setIsNewStructureModalOpen(true)}
        />
      )}

      {/* Customer Centricity Save & Manage Modals */}
      {isNewCustomerModalOpen && (
        <SaveNewCustomerCentricityModal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          onSave={(name, desc) => {
            onSaveNewCustomerCentricityGuideline?.(name, desc);
            setIsNewCustomerModalOpen(false);
            showCopyNotice(`Customer Centricity preset "${name}" saved!`);
          }}
        />
      )}

      {isManageCustomerModalOpen && (
        <PresetManagerModal
          isOpen={isManageCustomerModalOpen}
          onClose={() => setIsManageCustomerModalOpen(false)}
          type="customer"
          title="Customer Centricity & UX Friction Library"
          subtitle="Browse, apply, and manage customer empathy, friction elimination, and scoring presets for Agent 5"
          presets={savedCustomerCentricityPresets}
          activePresetId={activeCustomerCentricityPresetId}
          onSelect={(id) => onSelectCustomerCentricityPreset?.(id)}
          onDelete={(id) => onDeleteCustomerCentricityPreset?.(id)}
          onOpenSaveNew={() => setIsNewCustomerModalOpen(true)}
        />
      )}

    </div>
  );
};
