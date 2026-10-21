/**
 * Guidelines in the browser: storage, clean-up (sanitize*) and the JSON file used to move them between browsers
 * and people (Guidelines tab → Export / Import).
 *
 * Nothing is built in: a new browser starts with empty guidelines, and each team adds its own in the Guidelines
 * section ("Save as New Guideline" in each of the six sections). They are stored in this browser only
 * (localStorage). The Bajaj Finserv guidelines the real-page test uses are a test fixture:
 * tests/fixtures/bajaj-guidelines.json (same format as an export, so it can also be imported).
 */
import {
  GuidelineProfile,
  ContentGuidelines,
  SEOGuidelines,
  GEOGuidelines,
  ProductGuidelines,
  CustomerCentricityGuidelines,
  StructureMappingGuidelines,
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
} from './defaults';

const STORAGE_KEY_PROFILES = 'seo_guideline_profiles_v5';
const STORAGE_KEY_GLOBAL_CONTENT = 'seo_global_content_guidelines_v1';
const STORAGE_KEY_GLOBAL_SEO = 'seo_global_seo_guidelines_v1';
const STORAGE_KEY_GLOBAL_GEO = 'seo_global_geo_guidelines_v1';
const STORAGE_KEY_GLOBAL_CUSTOMER_CENTRICITY = 'seo_global_customer_centricity_guidelines_v1';
const STORAGE_KEY_GLOBAL_STRUCTURE_MAPPING = 'seo_global_structure_mapping_guidelines_v1';
const STORAGE_KEY_WORKING_PRODUCT = 'seo_working_product_guidelines_v1';
const STORAGE_KEY_SAVED_CONTENT_PRESETS = 'seo_saved_content_presets_v1';
const STORAGE_KEY_SAVED_SEO_PRESETS = 'seo_saved_seo_presets_v1';
const STORAGE_KEY_SAVED_GEO_PRESETS = 'seo_saved_geo_presets_v1';
const STORAGE_KEY_SAVED_PRODUCT_PRESETS = 'seo_saved_product_presets_v1';
const STORAGE_KEY_SAVED_CUSTOMER_CENTRICITY_PRESETS = 'seo_saved_customer_centricity_presets_v1';
const STORAGE_KEY_SAVED_STRUCTURE_MAPPING_PRESETS = 'seo_saved_structure_mapping_presets_v1';

export function sanitizeProductGuidelines(p: any): ProductGuidelines {
  return {
    productName: p?.productName || '',
    brandName: p?.brandName || '',
    category: p?.category || '',
    targetAudience: p?.targetAudience || '',
    toneOfVoice: p?.toneOfVoice || '',
    uniqueSellingPoints: Array.isArray(p?.uniqueSellingPoints) ? p.uniqueSellingPoints.filter((s: any) => typeof s === 'string' && s.trim()) : [],
    coreValueProps: Array.isArray(p?.coreValueProps) ? p.coreValueProps.filter((s: any) => typeof s === 'string' && s.trim()) : [],
    forbiddenPhrases: Array.isArray(p?.forbiddenPhrases) ? p.forbiddenPhrases.filter((s: any) => typeof s === 'string' && s.trim()) : [],
    complianceNotes: p?.complianceNotes || '',
    eeatCredentials: p?.eeatCredentials || p?.researchCredentials || '',
  };
}

export function sanitizeContentGuidelines(c: any): ContentGuidelines {
  return {
    toneOfVoice: c?.toneOfVoice || DEFAULT_CONTENT_GUIDELINES.toneOfVoice,
    readabilityLevel: c?.readabilityLevel || DEFAULT_CONTENT_GUIDELINES.readabilityLevel,
    paragraphConstraints: c?.paragraphConstraints || DEFAULT_CONTENT_GUIDELINES.paragraphConstraints,
    formattingRules: Array.isArray(c?.formattingRules) ? c.formattingRules : DEFAULT_CONTENT_GUIDELINES.formattingRules,
    forbiddenCliches: Array.isArray(c?.forbiddenCliches) ? c.forbiddenCliches : DEFAULT_CONTENT_GUIDELINES.forbiddenCliches,
    grammarAndPerspective: c?.grammarAndPerspective || DEFAULT_CONTENT_GUIDELINES.grammarAndPerspective,
    ctaStandards: c?.ctaStandards || DEFAULT_CONTENT_GUIDELINES.ctaStandards,
    citationFormatting: c?.citationFormatting || DEFAULT_CONTENT_GUIDELINES.citationFormatting,
    customContentRules: c?.customContentRules || DEFAULT_CONTENT_GUIDELINES.customContentRules,
  };
}

export function sanitizeSeoGuidelines(s: any): SEOGuidelines {
  return {
    voiceSearchOptimized: s?.voiceSearchOptimized ?? false,
    aeoDirectAnswerTarget: s?.aeoDirectAnswerTarget ?? false,
    geoLlmCitationFocus: s?.geoLlmCitationFocus ?? false,
    eeatStandard: s?.eeatStandard || 'standard',
    titleCharRange: {
      min: Number(s?.titleCharRange?.min) || 50,
      max: Number(s?.titleCharRange?.max) || 60,
    },
    metaDescCharRange: {
      min: Number(s?.metaDescCharRange?.min) || 140,
      max: Number(s?.metaDescCharRange?.max) || 160,
    },
    headingHierarchyRules: s?.headingHierarchyRules || DEFAULT_SEO_GUIDELINES.headingHierarchyRules,
    schemaRequirements: Array.isArray(s?.schemaRequirements) ? s.schemaRequirements : DEFAULT_SEO_GUIDELINES.schemaRequirements,
    sitemapGuidelines: s?.sitemapGuidelines || DEFAULT_SEO_GUIDELINES.sitemapGuidelines,
    customRules: s?.customRules || DEFAULT_SEO_GUIDELINES.customRules,
  };
}

export function sanitizeGeoGuidelines(g: any): GEOGuidelines {
  return {
    enableGeoOptimization: g?.enableGeoOptimization ?? false,
    blufDirectAnswerTarget: g?.blufDirectAnswerTarget ?? false,
    authoritativeStatistics: g?.authoritativeStatistics ?? false,
    aiOverviewSnippetFormat: g?.aiOverviewSnippetFormat || DEFAULT_GEO_GUIDELINES.aiOverviewSnippetFormat,
    llmCitationStrategy: g?.llmCitationStrategy || DEFAULT_GEO_GUIDELINES.llmCitationStrategy,
    entityDensityAndSchema: g?.entityDensityAndSchema || DEFAULT_GEO_GUIDELINES.entityDensityAndSchema,
    brandQuotationStandard: g?.brandQuotationStandard || DEFAULT_GEO_GUIDELINES.brandQuotationStandard,
    sourceVerificationStyle: g?.sourceVerificationStyle || DEFAULT_GEO_GUIDELINES.sourceVerificationStyle,
    forbiddenAiPatterns: Array.isArray(g?.forbiddenAiPatterns) ? g.forbiddenAiPatterns : DEFAULT_GEO_GUIDELINES.forbiddenAiPatterns,
    customGeoRules: g?.customGeoRules || DEFAULT_GEO_GUIDELINES.customGeoRules,
    targetEngines: Array.isArray(g?.targetEngines) ? g.targetEngines : DEFAULT_GEO_GUIDELINES.targetEngines,
    knowledgeSources: Array.isArray(g?.knowledgeSources) ? g.knowledgeSources : DEFAULT_GEO_GUIDELINES.knowledgeSources,
    entityRelationships: Array.isArray(g?.entityRelationships) ? g.entityRelationships : DEFAULT_GEO_GUIDELINES.entityRelationships,
    citationFormat: g?.citationFormat || DEFAULT_GEO_GUIDELINES.citationFormat,
    statDensityRequirement: g?.statDensityRequirement || DEFAULT_GEO_GUIDELINES.statDensityRequirement,
    directAnswerStandard: g?.directAnswerStandard || DEFAULT_GEO_GUIDELINES.directAnswerStandard,
    sourceAttributionStandard: g?.sourceAttributionStandard || DEFAULT_GEO_GUIDELINES.sourceAttributionStandard,
    multiPerspectiveRequirement: g?.multiPerspectiveRequirement || DEFAULT_GEO_GUIDELINES.multiPerspectiveRequirement,
  };
}

export function sanitizeCustomerCentricityGuidelines(c: any): CustomerCentricityGuidelines {
  return {
    targetCustomerPersona: c?.targetCustomerPersona || DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.targetCustomerPersona,
    empathyAndTone: c?.empathyAndTone || DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.empathyAndTone,
    readingAccessibility: c?.readingAccessibility || DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.readingAccessibility,
    maxSentenceWords: Number(c?.maxSentenceWords) || DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.maxSentenceWords,
    maxParagraphSentences: Number(c?.maxParagraphSentences) || DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.maxParagraphSentences,
    corePainPointsToAddress: Array.isArray(c?.corePainPointsToAddress) ? c.corePainPointsToAddress : DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.corePainPointsToAddress,
    frictionPatternsToFlag: Array.isArray(c?.frictionPatternsToFlag) ? c.frictionPatternsToFlag : DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.frictionPatternsToFlag,
    decisionJourneyOrder: c?.decisionJourneyOrder || DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.decisionJourneyOrder,
    objectionHandlingRules: Array.isArray(c?.objectionHandlingRules) ? c.objectionHandlingRules : DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.objectionHandlingRules,
    trustAndReassuranceSignals: Array.isArray(c?.trustAndReassuranceSignals) ? c.trustAndReassuranceSignals : DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.trustAndReassuranceSignals,
    scoringWeights: {
      laymanAccessibilityWeight: Number(c?.scoringWeights?.laymanAccessibilityWeight) || 30,
      objectionHandlingWeight: Number(c?.scoringWeights?.objectionHandlingWeight) || 25,
      frictionEliminationWeight: Number(c?.scoringWeights?.frictionEliminationWeight) || 25,
      journeyStructureWeight: Number(c?.scoringWeights?.journeyStructureWeight) || 20,
    },
    customCustomerRules: c?.customCustomerRules || DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.customCustomerRules,
  };
}

export function sanitizeStructureMappingGuidelines(s: any): StructureMappingGuidelines {
  return {
    headingHierarchyRule: s?.headingHierarchyRule || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.headingHierarchyRule,
    requirePrimaryKeywordInH1: s?.requirePrimaryKeywordInH1 ?? DEFAULT_STRUCTURE_MAPPING_GUIDELINES.requirePrimaryKeywordInH1,
    minKeywordFrequency: Number(s?.minKeywordFrequency) || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.minKeywordFrequency,
    maxKeywordDensityPercent: Number(s?.maxKeywordDensityPercent) || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.maxKeywordDensityPercent,
    targetKeywordsInHeadingsMinPercent: Number(s?.targetKeywordsInHeadingsMinPercent) || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.targetKeywordsInHeadingsMinPercent,
    headingWordCountLimit: {
      min: Number(s?.headingWordCountLimit?.min) || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.headingWordCountLimit.min,
      max: Number(s?.headingWordCountLimit?.max) || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.headingWordCountLimit.max,
    },
    voiceQuestionHeadingsTarget: Number(s?.voiceQuestionHeadingsTarget) || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.voiceQuestionHeadingsTarget,
    preferredSectionOrder: Array.isArray(s?.preferredSectionOrder) ? s.preferredSectionOrder : DEFAULT_STRUCTURE_MAPPING_GUIDELINES.preferredSectionOrder,
    searchIntentMappingStrategy: s?.searchIntentMappingStrategy || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.searchIntentMappingStrategy,
    keywordDistributionRules: s?.keywordDistributionRules || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.keywordDistributionRules,
    customStructureRules: s?.customStructureRules || DEFAULT_STRUCTURE_MAPPING_GUIDELINES.customStructureRules,
  };
}

export function sanitizeProfile(p: any): GuidelineProfile {
  return {
    id: p?.id || `profile-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: p?.name || 'Untitled Product Profile',
    description: p?.description || '',
    category: p?.category || 'custom',
    isBuiltIn: false, // nothing is built in any more
    contentGuidelines: sanitizeContentGuidelines(p?.contentGuidelines),
    productGuidelines: sanitizeProductGuidelines(p?.productGuidelines),
    seoGuidelines: sanitizeSeoGuidelines(p?.seoGuidelines),
    geoGuidelines: sanitizeGeoGuidelines(p?.geoGuidelines),
    customerCentricityGuidelines: sanitizeCustomerCentricityGuidelines(p?.customerCentricityGuidelines),
    structureMappingGuidelines: sanitizeStructureMappingGuidelines(p?.structureMappingGuidelines),
    keywords: Array.isArray(p?.keywords) ? p.keywords : [],
    readerContext: p?.readerContext || undefined,
    createdAt: p?.createdAt || new Date().toISOString(),
    updatedAt: p?.updatedAt || new Date().toISOString(),
  };
}

/** One saved guideline of any section, cleaned up. Nothing is built in any more, so none is marked built-in. */
function sanitizePreset<G>(p: any, cleanGuidelines: (g: any) => G, i = 0) {
  const now = new Date().toISOString();
  return {
    id: typeof p?.id === 'string' && p.id.trim() ? p.id : `preset-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    name: typeof p?.name === 'string' && p.name.trim() ? p.name : 'Untitled guideline',
    description: p?.description || '',
    category: p?.category || 'custom',
    isBuiltIn: false,
    createdAt: p?.createdAt || now,
    updatedAt: p?.updatedAt || now,
    guidelines: cleanGuidelines(p?.guidelines),
  };
}

function loadList<T>(key: string, clean: (x: any, i: number) => T, fallbackKey?: string): T[] {
  try {
    const raw = localStorage.getItem(key) || (fallbackKey ? localStorage.getItem(fallbackKey) : null);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(clean) : [];
  } catch (err) {
    console.warn(`Failed to load ${key} from localStorage:`, err);
    return [];
  }
}

function loadOne<T>(key: string, clean: (x: any) => T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return clean(JSON.parse(raw));
  } catch (err) {
    console.warn(`Failed to load ${key} from localStorage:`, err);
  }
  return clean(fallback);
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to save ${key} to localStorage:`, err);
  }
}

export function loadStoredProfiles(): GuidelineProfile[] {
  return loadList(STORAGE_KEY_PROFILES, sanitizeProfile, 'seo_guideline_profiles_v4');
}
export function saveProfilesToStorage(profiles: GuidelineProfile[]): void {
  save(STORAGE_KEY_PROFILES, (profiles || []).map(sanitizeProfile));
}

export const loadGlobalContentGuidelines = (): ContentGuidelines =>
  loadOne(STORAGE_KEY_GLOBAL_CONTENT, sanitizeContentGuidelines, DEFAULT_CONTENT_GUIDELINES);
export const saveGlobalContentGuidelines = (g: ContentGuidelines) => save(STORAGE_KEY_GLOBAL_CONTENT, g);
export const loadSavedContentPresets = (): SavedContentGuideline[] =>
  loadList(STORAGE_KEY_SAVED_CONTENT_PRESETS, (p, i) => sanitizePreset(p, sanitizeContentGuidelines, i));
export const saveSavedContentPresets = (presets: SavedContentGuideline[]) => save(STORAGE_KEY_SAVED_CONTENT_PRESETS, presets);

export const loadGlobalSeoGuidelines = (): SEOGuidelines =>
  loadOne(STORAGE_KEY_GLOBAL_SEO, sanitizeSeoGuidelines, DEFAULT_SEO_GUIDELINES);
export const saveGlobalSeoGuidelines = (g: SEOGuidelines) => save(STORAGE_KEY_GLOBAL_SEO, g);
export const loadSavedSeoPresets = (): SavedSeoGuideline[] =>
  loadList(STORAGE_KEY_SAVED_SEO_PRESETS, (p, i) => sanitizePreset(p, sanitizeSeoGuidelines, i));
export const saveSavedSeoPresets = (presets: SavedSeoGuideline[]) => save(STORAGE_KEY_SAVED_SEO_PRESETS, presets);

export const loadGlobalGeoGuidelines = (): GEOGuidelines =>
  loadOne(STORAGE_KEY_GLOBAL_GEO, sanitizeGeoGuidelines, DEFAULT_GEO_GUIDELINES);
export const saveGlobalGeoGuidelines = (g: GEOGuidelines) => save(STORAGE_KEY_GLOBAL_GEO, g);
export const loadSavedGeoPresets = (): SavedGeoGuideline[] =>
  loadList(STORAGE_KEY_SAVED_GEO_PRESETS, (p, i) => sanitizePreset(p, sanitizeGeoGuidelines, i));
export const saveSavedGeoPresets = (presets: SavedGeoGuideline[]) => save(STORAGE_KEY_SAVED_GEO_PRESETS, presets);

export const loadSavedProductPresets = (): SavedProductGuideline[] =>
  loadList(STORAGE_KEY_SAVED_PRODUCT_PRESETS, (p, i) => sanitizePreset(p, sanitizeProductGuidelines, i));
export const saveSavedProductPresets = (presets: SavedProductGuideline[]) => save(STORAGE_KEY_SAVED_PRODUCT_PRESETS, presets);

export function loadWorkingProductGuidelines(profiles?: GuidelineProfile[], activeProfileId?: string): ProductGuidelines {
  const active = Array.isArray(profiles) ? profiles.find((p) => p.id === activeProfileId) || profiles[0] : undefined;
  return loadOne(STORAGE_KEY_WORKING_PRODUCT, sanitizeProductGuidelines, active?.productGuidelines || DEFAULT_PRODUCT_GUIDELINES);
}
export const saveWorkingProductGuidelines = (g: ProductGuidelines) => save(STORAGE_KEY_WORKING_PRODUCT, g);

export const loadGlobalCustomerCentricityGuidelines = (): CustomerCentricityGuidelines =>
  loadOne(STORAGE_KEY_GLOBAL_CUSTOMER_CENTRICITY, sanitizeCustomerCentricityGuidelines, DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES);
export const saveGlobalCustomerCentricityGuidelines = (g: CustomerCentricityGuidelines) => save(STORAGE_KEY_GLOBAL_CUSTOMER_CENTRICITY, g);
export const loadSavedCustomerCentricityPresets = (): SavedCustomerCentricityGuideline[] =>
  loadList(STORAGE_KEY_SAVED_CUSTOMER_CENTRICITY_PRESETS, (p, i) => sanitizePreset(p, sanitizeCustomerCentricityGuidelines, i));
export const saveSavedCustomerCentricityPresets = (presets: SavedCustomerCentricityGuideline[]) =>
  save(STORAGE_KEY_SAVED_CUSTOMER_CENTRICITY_PRESETS, presets);

export const loadGlobalStructureMappingGuidelines = (): StructureMappingGuidelines =>
  loadOne(STORAGE_KEY_GLOBAL_STRUCTURE_MAPPING, sanitizeStructureMappingGuidelines, DEFAULT_STRUCTURE_MAPPING_GUIDELINES);
export const saveGlobalStructureMappingGuidelines = (g: StructureMappingGuidelines) => save(STORAGE_KEY_GLOBAL_STRUCTURE_MAPPING, g);
export const loadSavedStructureMappingPresets = (): SavedStructureMappingGuideline[] =>
  loadList(STORAGE_KEY_SAVED_STRUCTURE_MAPPING_PRESETS, (p, i) => sanitizePreset(p, sanitizeStructureMappingGuidelines, i));
export const saveSavedStructureMappingPresets = (presets: SavedStructureMappingGuideline[]) =>
  save(STORAGE_KEY_SAVED_STRUCTURE_MAPPING_PRESETS, presets);

/** Clears every guideline stored in this browser. */
export function resetToDefaultProfiles(): GuidelineProfile[] {
  try {
    [
      STORAGE_KEY_PROFILES,
      STORAGE_KEY_GLOBAL_CONTENT,
      STORAGE_KEY_GLOBAL_SEO,
      STORAGE_KEY_GLOBAL_GEO,
      STORAGE_KEY_GLOBAL_CUSTOMER_CENTRICITY,
      STORAGE_KEY_GLOBAL_STRUCTURE_MAPPING,
      STORAGE_KEY_WORKING_PRODUCT,
      STORAGE_KEY_SAVED_CONTENT_PRESETS,
      STORAGE_KEY_SAVED_SEO_PRESETS,
      STORAGE_KEY_SAVED_GEO_PRESETS,
      STORAGE_KEY_SAVED_PRODUCT_PRESETS,
      STORAGE_KEY_SAVED_CUSTOMER_CENTRICITY_PRESETS,
      STORAGE_KEY_SAVED_STRUCTURE_MAPPING_PRESETS,
      'seo_guideline_profiles_v4',
      'seo_guideline_profiles_v3',
      'seo_guideline_profiles_v2',
      'seo_guideline_profiles_v1',
    ].forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Failed to clear storage:', err);
  }
  return [];
}

// ---------------------------------------------------------------
// Export / import file (Guidelines tab). One JSON file holds every saved guideline of all six sections plus
// any profiles, so guidelines can move between browsers and teammates.
// ---------------------------------------------------------------

export const GUIDELINE_FILE_FORMAT = 'content-optimizer-guidelines';

export interface GuidelinePresets {
  content: SavedContentGuideline[];
  product: SavedProductGuideline[];
  seo: SavedSeoGuideline[];
  geo: SavedGeoGuideline[];
  customerCentricity: SavedCustomerCentricityGuideline[];
  structureMapping: SavedStructureMappingGuideline[];
}

export interface GuidelineFile {
  format: typeof GUIDELINE_FILE_FORMAT;
  version: 2;
  exportedAt: string;
  profiles: GuidelineProfile[];
  presets: GuidelinePresets;
}

export const PRESET_SECTIONS: (keyof GuidelinePresets)[] = ['content', 'product', 'seo', 'geo', 'customerCentricity', 'structureMapping'];

const PRESET_CLEANERS: Record<keyof GuidelinePresets, (g: any) => any> = {
  content: sanitizeContentGuidelines,
  product: sanitizeProductGuidelines,
  seo: sanitizeSeoGuidelines,
  geo: sanitizeGeoGuidelines,
  customerCentricity: sanitizeCustomerCentricityGuidelines,
  structureMapping: sanitizeStructureMappingGuidelines,
};

export function buildGuidelineFile(profiles: GuidelineProfile[], presets: GuidelinePresets): GuidelineFile {
  return {
    format: GUIDELINE_FILE_FORMAT,
    version: 2,
    exportedAt: new Date().toISOString(),
    profiles: (profiles || []).map(sanitizeProfile),
    presets: Object.fromEntries(
      PRESET_SECTIONS.map((s) => [s, (presets?.[s] || []).map((p: any, i: number) => sanitizePreset(p, PRESET_CLEANERS[s], i))])
    ) as unknown as GuidelinePresets,
  };
}

/**
 * Reads an exported guidelines file. Also accepts a plain array of profiles (the older profile export).
 * Returns null when the data isn't a guidelines file.
 */
export function parseGuidelineFile(data: unknown): { profiles: GuidelineProfile[]; presets: GuidelinePresets } | null {
  const empty = (): GuidelinePresets => ({ content: [], product: [], seo: [], geo: [], customerCentricity: [], structureMapping: [] });
  if (Array.isArray(data)) return { profiles: data.map(sanitizeProfile), presets: empty() };
  const d = data as any;
  if (!d || typeof d !== 'object' || (!Array.isArray(d.profiles) && (!d.presets || typeof d.presets !== 'object'))) return null;
  const presets = empty();
  for (const s of PRESET_SECTIONS) {
    const list = Array.isArray(d.presets?.[s]) ? d.presets[s] : [];
    (presets as any)[s] = list.map((p: any, i: number) => sanitizePreset(p, PRESET_CLEANERS[s], i));
  }
  return { profiles: Array.isArray(d.profiles) ? d.profiles.map(sanitizeProfile) : [], presets };
}

/** Adds imported items to a list: an item with the same id is replaced, new ones are added at the end. */
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(incoming.map((x) => [x.id, x]));
  const kept = existing.map((x) => byId.get(x.id) || x);
  const known = new Set(existing.map((x) => x.id));
  return [...kept, ...incoming.filter((x) => !known.has(x.id))];
}
