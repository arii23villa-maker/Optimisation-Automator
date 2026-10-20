import { 
  ProductGuidelines, 
  SEOGuidelines, 
  GEOGuidelines, 
  ContentGuidelines, 
  CustomerCentricityGuidelines,
  StructureMappingGuidelines,
  KeywordItem, 
  SEOBackendData, 
  ContentComponent 
} from '../types';

export const DEFAULT_CONTENT_GUIDELINES: ContentGuidelines = {
  toneOfVoice: '',
  readabilityLevel: '',
  paragraphConstraints: '',
  formattingRules: [],
  forbiddenCliches: [],
  grammarAndPerspective: '',
  ctaStandards: '',
  citationFormatting: '',
  customContentRules: ''
};

export const DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES: CustomerCentricityGuidelines = {
  targetCustomerPersona: '',
  empathyAndTone: '',
  readingAccessibility: '',
  maxSentenceWords: 20,
  maxParagraphSentences: 3,
  corePainPointsToAddress: [],
  frictionPatternsToFlag: [],
  decisionJourneyOrder: '',
  objectionHandlingRules: [],
  trustAndReassuranceSignals: [],
  scoringWeights: {
    laymanAccessibilityWeight: 30,
    objectionHandlingWeight: 25,
    frictionEliminationWeight: 25,
    journeyStructureWeight: 20,
  },
  customCustomerRules: ''
};

export const DEFAULT_STRUCTURE_MAPPING_GUIDELINES: StructureMappingGuidelines = {
  headingHierarchyRule: '',
  requirePrimaryKeywordInH1: true,
  minKeywordFrequency: 2,
  maxKeywordDensityPercent: 3.0,
  targetKeywordsInHeadingsMinPercent: 75,
  headingWordCountLimit: { min: 3, max: 10 },
  voiceQuestionHeadingsTarget: 30,
  preferredSectionOrder: [],
  searchIntentMappingStrategy: '',
  keywordDistributionRules: '',
  customStructureRules: ''
};

export const DEFAULT_PRODUCT_GUIDELINES: ProductGuidelines = {
  productName: '',
  category: '',
  targetAudience: '',
  toneOfVoice: '',
  uniqueSellingPoints: [],
  coreValueProps: [],
  forbiddenPhrases: [],
  complianceNotes: '',
  eeatCredentials: ''
};

export const DEFAULT_SEO_GUIDELINES: SEOGuidelines = {
  voiceSearchOptimized: false,
  aeoDirectAnswerTarget: false,
  geoLlmCitationFocus: false,
  eeatStandard: 'standard',
  titleCharRange: { min: 50, max: 60 },
  metaDescCharRange: { min: 140, max: 160 },
  headingHierarchyRules: '',
  schemaRequirements: [],
  sitemapGuidelines: '',
  customRules: ''
};

export const DEFAULT_GEO_GUIDELINES: GEOGuidelines = {
  enableGeoOptimization: false,
  blufDirectAnswerTarget: false,
  authoritativeStatistics: false,
  aiOverviewSnippetFormat: 'definitive_paragraph',
  llmCitationStrategy: '',
  entityDensityAndSchema: '',
  brandQuotationStandard: '',
  sourceVerificationStyle: '',
  forbiddenAiPatterns: [],
  customGeoRules: '',
  targetEngines: [],
  knowledgeSources: [],
  entityRelationships: [],
  citationFormat: '',
  statDensityRequirement: '',
  directAnswerStandard: '',
  sourceAttributionStandard: '',
  multiPerspectiveRequirement: ''
};

export const DEFAULT_KEYWORDS: KeywordItem[] = [];

export const DEFAULT_BACKEND_SEO: SEOBackendData = {
  metaTitle: '',
  metaDescription: '',
  canonicalUrl: '',
  robots: 'index, follow',
  sitemapUrl: '',
  sitemapStatus: '',
  tags: [],
  ctas: [],
  openGraph: {
    title: '',
    description: '',
    image: '',
    type: 'website',
    siteName: ''
  },
  twitterCard: {
    card: 'summary_large_image',
    title: '',
    description: '',
    image: ''
  },
  schemaJsonLd: '',
  schemaTypesFound: []
};

export const DEFAULT_COMPONENTS: ContentComponent[] = [];
