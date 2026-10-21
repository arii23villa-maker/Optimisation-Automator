export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';

export interface KeywordItem {
  id: string;
  keyword: string;
  searchVolume: number;
  intent: SearchIntent;
  priority: 'primary' | 'secondary' | 'voice_question' | 'lsi';
  isCoveredInH1?: boolean;
  isCoveredInH2?: boolean;
  isCoveredInH3?: boolean;
  notes?: string;
  competition?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNSPECIFIED' | string;
  competitionIndex?: number;
  lowTopOfPageBid?: number;
  highTopOfPageBid?: number;
  monthlyTrend?: Array<{ month: string; year: string; searches: number }>;
  source?: 'google_keyword_planner' | 'algorithmic' | 'gemini_ai';
}

export interface ContentGuidelines {
  toneOfVoice: string;
  readabilityLevel: string;
  paragraphConstraints: string;
  formattingRules: string[];
  forbiddenCliches: string[];
  grammarAndPerspective: string;
  ctaStandards: string;
  citationFormatting: string;
  customContentRules: string;
}

export interface SavedContentGuideline {
  id: string;
  name: string;
  description?: string;
  category?: string;
  guidelines: ContentGuidelines;
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export interface ProductGuidelines {
  productName: string;
  /** Brand that must appear in titles/descriptions (e.g. "Bajaj Finance"). Leave empty to skip brand checks. */
  brandName?: string;
  category: string;
  targetAudience: string;
  toneOfVoice?: string;
  uniqueSellingPoints: string[];
  coreValueProps: string[];
  forbiddenPhrases: string[];
  complianceNotes: string;
  eeatCredentials: string;
}

export interface SavedProductGuideline {
  id: string;
  name: string;
  description?: string;
  category?: string;
  guidelines: ProductGuidelines;
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export interface SEOGuidelines {
  voiceSearchOptimized: boolean;
  aeoDirectAnswerTarget: boolean;
  geoLlmCitationFocus: boolean;
  eeatStandard: 'high' | 'ymyl_strict' | 'standard';
  titleCharRange: { min: number; max: number };
  metaDescCharRange: { min: number; max: number };
  headingHierarchyRules: string;
  schemaRequirements: string[];
  sitemapGuidelines: string;
  customRules: string;
}

export interface SavedSeoGuideline {
  id: string;
  name: string;
  description?: string;
  category?: string;
  guidelines: SEOGuidelines;
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export interface GEOGuidelines {
  enableGeoOptimization: boolean;
  blufDirectAnswerTarget: boolean;
  authoritativeStatistics: boolean;
  aiOverviewSnippetFormat: 'definitive_paragraph' | 'bullet_summary' | 'step_by_step' | 'comparison_matrix';
  llmCitationStrategy: string;
  entityDensityAndSchema: string;
  brandQuotationStandard: string;
  sourceVerificationStyle: string;
  forbiddenAiPatterns: string[];
  customGeoRules: string;
  targetEngines?: string[];
  knowledgeSources?: string[];
  entityRelationships?: string[];
  citationFormat?: string;
  statDensityRequirement?: string;
  directAnswerStandard?: string;
  sourceAttributionStandard?: string;
  multiPerspectiveRequirement?: string;
}

export interface SavedGeoGuideline {
  id: string;
  name: string;
  description?: string;
  category?: string;
  guidelines: GEOGuidelines;
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export interface CustomerCentricityGuidelines {
  targetCustomerPersona: string;
  empathyAndTone: string;
  readingAccessibility: string;
  maxSentenceWords: number;
  maxParagraphSentences: number;
  corePainPointsToAddress: string[];
  frictionPatternsToFlag: string[];
  decisionJourneyOrder: string;
  objectionHandlingRules: string[];
  trustAndReassuranceSignals: string[];
  scoringWeights?: {
    laymanAccessibilityWeight: number;
    objectionHandlingWeight: number;
    frictionEliminationWeight: number;
    journeyStructureWeight: number;
  };
  customCustomerRules?: string;
}

export interface SavedCustomerCentricityGuideline {
  id: string;
  name: string;
  description?: string;
  category?: string;
  guidelines: CustomerCentricityGuidelines;
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export interface StructureMappingGuidelines {
  headingHierarchyRule: string;
  requirePrimaryKeywordInH1: boolean;
  minKeywordFrequency: number;
  maxKeywordDensityPercent: number;
  targetKeywordsInHeadingsMinPercent: number;
  headingWordCountLimit: { min: number; max: number };
  voiceQuestionHeadingsTarget: number;
  preferredSectionOrder: string[];
  searchIntentMappingStrategy: string;
  keywordDistributionRules: string;
  customStructureRules?: string;
}

export interface SavedStructureMappingGuideline {
  id: string;
  name: string;
  description?: string;
  category?: string;
  guidelines: StructureMappingGuidelines;
  createdAt: string;
  updatedAt: string;
  isBuiltIn?: boolean;
}

export interface HeadingItem {
  tag: 'h1' | 'h2' | 'h3' | 'h4';
  text: string;
  id?: string;
  voiceIntent?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  voiceIntent?: string;
}

export interface TableData {
  id: string;
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface H2SectionData {
  id: string;
  order: number;
  h2Text: string;
  originalH2Text?: string;
  voiceIntent?: string;
  targetKeyword?: string;
  searchVolume?: number;
  wordCount?: number;
  h3Headings: HeadingItem[];
  bodyParagraphs: string[];
  listItems: string[];
  tables: TableData[];
  faqs?: FaqItem[];
  voiceAnswerSnippet?: string;
  citationSource?: string;
  status?: 'non_compliant' | 'fixing' | 'recently_fixed' | 'compliant';
  originalSnapshot?: {
    h2Text: string;
    wordCount?: number;
    h3Headings: HeadingItem[];
    bodyParagraphs: string[];
    listItems: string[];
    tables: TableData[];
    faqs?: FaqItem[];
    voiceAnswerSnippet?: string;
    citationSource?: string;
  };
}

export interface ContentComponent {
  id: string;
  name: string;
  type: 'hero' | 'features' | 'process' | 'faq' | 'eeat_proof' | 'specs_pricing' | 'cta_footer' | 'full_body_content' | 'custom';
  headings: HeadingItem[];
  bodyContent: string;
  heroDescription?: string;
  faqs?: FaqItem[];
  listItems?: string[];
  tables?: TableData[];
  h2Sections?: H2SectionData[];
  voiceAnswerSnippet?: string;
  citationSource?: string;
  status?: 'non_compliant' | 'fixing' | 'recently_fixed' | 'compliant';
  originalSnapshot?: {
    headings: HeadingItem[];
    bodyContent: string;
    heroDescription?: string;
    faqs?: FaqItem[];
    listItems?: string[];
    tables?: TableData[];
    h2Sections?: H2SectionData[];
    voiceAnswerSnippet?: string;
    citationSource?: string;
  };
}

export interface CtaItem {
  id: string;
  text: string;
  link: string;
  type?: 'Primary CTA' | 'Secondary Button' | 'Text Link' | 'Anchor Jump' | 'Form Action' | string;
  location?: string;
  isExternal?: boolean;
  target?: string;
  targetKeyword?: string;
  notes?: string;
}

export interface MediaPresence {
  hasImages: boolean;
  hasVideo: boolean;
  hasPodcast: boolean;
}

export interface SEOBackendData {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  robots: string;
  sitemapUrl: string;
  sitemapStatus?: string;
  tags: string[];
  scrapedKeywordTags?: string[];
  media?: MediaPresence;
  ctas?: CtaItem[];
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    siteName?: string;
  };
  twitterCard: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  schemaJsonLd: string;
  schemaTypesFound: string[];
  status?: 'non_compliant' | 'fixing' | 'recently_fixed' | 'compliant';
  originalSnapshot?: {
    metaTitle: string;
    metaDescription: string;
    schemaJsonLd: string;
    tags: string[];
    scrapedKeywordTags?: string[];
    canonicalUrl?: string;
    robots?: string;
    sitemapUrl?: string;
    ctas?: CtaItem[];
    media?: MediaPresence;
  };
}

// -------------------------------------------------------------
// 9-AGENT ARCHITECTURE SPECIFIC TYPES
// -------------------------------------------------------------

/** Agent 1: Strict Normalized Extracted Page Shape with Media Presence */
export interface ExtractedPageData {
  metaTitle: string;
  metaDescription: string;
  schema: string;
  sitemap: string;
  tags: string;
  content: string;
  media: MediaPresence;
  rawUrl?: string;
  extractedAt?: string;
}

/** Originating agent for any flagged audit item */
export type AgentOrigin = 
  | 'Agent 1: Extraction'
  | 'Agent 2: Guideline Compliance'
  | 'Agent 3: SEO Backend Data'
  | 'Agent 4: Keyword & Intent Mapping'
  | 'Agent 5: Customer Centricity'
  | 'Agent 6: EEAT & GEO'
  | 'Agent 7: Optimization Maker'
  | 'Agent 8: Verification Gate'
  | 'Agent 9: Orchestrator';

export type FlagSeverity = 'critical' | 'warning' | 'info' | 'passed';

export type FlagCategory = 
  | 'GUIDELINE_COMPLIANCE'   // Agent 2
  | 'SEO_BACKEND'            // Agent 3
  | 'KEYWORD_MAPPING'        // Agent 4
  | 'STRUCTURE_MAPPING'      // Agent 4
  | 'CUSTOMER_CENTRICITY'    // Agent 5
  | 'EEAT_GEO'               // Agent 6
  | 'SEO_META' 
  | 'SCHEMA_BACKEND' 
  | 'SITEMAP' 
  | 'VOICE_SEARCH_AEO' 
  | 'GEO_LLM_CITATION' 
  | 'EEAT_PRINCIPLES' 
  | 'PRODUCT_GUIDELINES';

export type GuidelineSectionType = 
  | 'Product Guidelines'
  | 'Content Guidelines'
  | 'SEO Guidelines'
  | 'Structure and Keyword Mapping Guidelines'
  | 'Customer-Centricity Guidelines'
  | 'EEAT and GEO Citations Guidelines';

export interface AuditFlag {
  id: string;
  agentOrigin: AgentOrigin;
  guidelineSection: GuidelineSectionType;
  target: 'backend_seo' | 'component';
  componentId?: string;
  fieldName?: string; // e.g. 'metaTitle', 'schemaJsonLd', 'H1', 'faq_item', 'H2'
  category: FlagCategory;
  severity: FlagSeverity;
  issueTitle: string;
  issueDescription: string;
  whyThisSuggestionIsGiven?: string;
  guidelineReference: string;
  proposedFixPreview: string;
  subCategory?: 'EEAT' | 'GEO' | 'Structure' | 'Keyword' | 'Product' | 'Content';
  isGatingViolation?: boolean; // Regulatory gating violation (Product Guidelines)
  /** Fixing it needs information that is not on the page (phone number, example calculation, author): for editors, not the maker. */
  needsEditorInput?: boolean;
  fixed?: boolean;
  verificationVerdict?: 'ACCEPT' | 'REJECT' | 'ESCALATE' | 'PENDING';
  retryCount?: number;
}

/** Agent 4 Output: Heading to Keyword & Intent Assignment Plan */
export interface HeadingKeywordPlan {
  headingAssignments: {
    headingText: string;
    headingLevel: 'h1' | 'h2' | 'h3';
    assignedKeyword: string;
    searchVolume: number;
    intent: SearchIntent;
    matchRationale: string;
    suggestedHeadingRewrite?: string;
  }[];
  unplacedKeywords: {
    keyword: string;
    searchVolume: number;
    intent: SearchIntent;
    recommendedPlacement: string;
  }[];
  headingsNeedingKeywords: {
    headingText: string;
    reason: string;
    suggestedKeywords: string[];
  }[];
}

/** Agent 8 Quality Gate Output */
export interface VerificationResult {
  verdict: 'ACCEPT' | 'REJECT' | 'ESCALATE';
  reason: string;
  restartFrom?: 'Agent 7' | 'Agent 4' | 'Agent 2' | 'None';
  failureContext?: string;
  confidenceScore: number;
  timestamp: string;
  /** Issues that stop the draft from qualifying for publish. */
  blockingIssues?: string[];
  /** Figures in the draft that do not appear in the source or approved guideline facts. */
  unsupportedFigures?: string[];
}

/** Agent 7 output: a complete, structured page draft. */
export interface PageDraftSubsection {
  h3: string;
  paragraphs: string[];
  bullets: string[];
}

export interface PageDraftSection {
  h2: string;
  paragraphs: string[];
  bullets: string[];
  h3s: PageDraftSubsection[];
  table?: { title?: string; headers: string[]; rows: string[][] };
}

export interface PageDraft {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string[];
  sections: PageDraftSection[];
  faqs: { question: string; answer: string }[];
}

export type GateAgentId = 'agent-2' | 'agent-3' | 'agent-4' | 'agent-5' | 'agent-6';

/** One review gate's verdict on one draft. */
export interface GateResult {
  gateId: GateAgentId;
  gateName: string;
  score: number;
  passed: boolean;
  rationale: string;
  flags: AuditFlag[];
}

/** One actionable item the gates / verifier send back to the maker. */
export interface MakerFeedbackItem {
  source: string;
  severity: FlagSeverity;
  issue: string;
  suggestion: string;
  /** Where the issue lives, so revisions can be scoped (e.g. "metaTitle", "bodyContent"). */
  field?: string;
  target?: "backend_seo" | "component";
}

/** One maker → gates → verification cycle. */
export interface PipelineRound {
  round: number;
  draft: PageDraft;
  gates: GateResult[];
  verification: VerificationResult;
  overallScore: number;
  feedbackToMaker: MakerFeedbackItem[];
  makerDurationMs: number;
}

export type PipelineVerdict = 'APPROVED' | 'NOT_QUALIFIED' | 'MAKER_UNAVAILABLE';

/** Streaming progress events emitted while the orchestrator runs. */
export interface PipelineProgressEvent {
  stage: 'extract' | 'baseline' | 'draft' | 'gates' | 'verify' | 'done' | 'error';
  status: 'start' | 'end';
  round?: number;
  agentId?: string;
  message: string;
  score?: number;
  passed?: boolean;
  at: string;
}

/** Agent 9: Orchestrator Pipeline Telemetry & Execution Log */
export interface AgentExecutionLog {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  model: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  durationMs?: number;
  details?: string;
  outputSummary?: string;
  timestamp: string;
}

export interface GuidelineSectionScores {
  // 1. Content Guidelines Score
  contentScore: number;
  contentRationale: string;
  contentFlags: { high: number; medium: number; low: number; total: number };

  // 2. Product Guidelines Score & Gating Status
  productScore: number;
  productRationale: string;
  productFlags: { high: number; medium: number; low: number; total: number };
  publishBlocked: boolean;
  gatingViolationReasons: string[];

  // 3. SEO Guidelines Score
  seoScore: number;
  seoRationale: string;
  seoFlags: { high: number; medium: number; low: number; total: number };

  // 4. Structure & Keyword Mapping Score (Average of 2 sub-scores)
  structureAndKeywordScore: number;
  structureScore: number;
  keywordScore: number;
  structureAndKeywordRationale: string;
  keywordStats: {
    assignedVolume: number;
    totalVolume: number;
    assignedCount: number;
    totalCount: number;
  };

  // 5. Customer-Centricity Score
  customerCentricityScore: number;
  customerCentricityRationale: string;
  customerFlags: { high: number; medium: number; low: number; total: number };

  // 6. EEAT & GEO Citations Score (Average of 2 sub-scores)
  eeatAndGeoScore: number;
  eeatScore: number;
  geoScore: number;
  eeatAndGeoRationale: string;
  eeatFlags: { high: number; medium: number; low: number; total: number };
  geoFlags: { high: number; medium: number; low: number; total: number };

  // Orchestrator Composite Score (0-100)
  compositeScore: number;
  // Verification Confidence (0-100) from Agent 8 for triage ranking
  verificationConfidence?: number;
  // Extraction completeness from Agent 1
  extractionCompleteness?: string;
  // Display string for overall score (either formatted number or "BLOCKED")
  overallScoreDisplay: string;
}

export interface NineAgentScores extends GuidelineSectionScores {
  guidelineSectionScores?: GuidelineSectionScores;

  // Legacy aliases for backward compatibility with existing components
  complianceScore: number;
  complianceFlags: { high: number; medium: number; low: number; total: number };
  complianceRationale: string;

  seoBackendScore: number;
  seoBackendFlags: { high: number; medium: number; low: number; total: number };
  seoBackendRationale: string;

  keywordCoverageScore: number;
  keywordIntentFitScore?: number;
  keywordRationale: string;

  eeatRationale: string;
  geoRationale: string;

  overallPageScore: number;
}

export interface AgentScoreBreakdown {
  agent2Score: number; // Guideline & Policy Compliance
  agent2Rationale: string;
  agent3Score: number; // SEO Backend & Technical Schema
  agent3Rationale: string;
  agent4Score: number; // Keyword & Intent Mapping
  agent4Rationale: string;
  agent5Score: number; // Customer Centricity & Reader Experience
  agent5Rationale: string;
  agent6Score: number; // EEAT & GEO LLM Citations
  agent6Rationale: string;
  eeatScore?: number;  // Dedicated EEAT score
  geoScore?: number;   // Dedicated GEO score
  nineAgentScores?: NineAgentScores;
  sectionScores?: GuidelineSectionScores;
}

/** Inter-Agent Communication Bus Protocol Packet */
export type InterAgentContractType =
  | 'GROUND_TRUTH_EXTRACT'      // Agent 1 -> Agents 2-6, 9
  | 'COMPLIANCE_CONSTRAINTS'    // Agent 2 -> Agent 7, 9
  | 'TECHNICAL_SEO_CONTRACT'    // Agent 3 -> Agent 7, 9
  | 'KEYWORD_INTENT_MAP'        // Agent 4 -> Agent 7, 9
  | 'CUSTOMER_FRICTION_REPORT'  // Agent 5 -> Agent 7, 9
  | 'TRUST_CITATIONS_PROOF'     // Agent 6 -> Agent 7, 9
  | 'REMEDIATION_DIRECTIVE'     // Agent 9 -> Agent 7
  | 'PROPOSED_REMEDIATION'      // Agent 7 -> Agent 8
  | 'VERIFICATION_QUALITY_GATE' // Agent 8 -> Agent 7 / Agent 9
  | 'ORCHESTRATION_SYNC';       // Agent 9 -> All

export interface AntiHallucinationGuard {
  groundingSources: string[];
  zeroForbiddenWordsVerified: boolean;
  factualityChecked: boolean;
  hallucinationRisk: 'none' | 'low' | 'medium' | 'high';
  notes: string;
  verifiedDirectClaimsCount?: number;
}

export interface AgentMessagePacket {
  id: string;
  packetNumber: number;
  senderAgentId: string;
  senderName: string;
  senderRole: string;
  targetAgentId: string;
  targetName: string;
  contractType: InterAgentContractType;
  summary: string;
  payloadSummary: string;
  dataPayload?: Record<string, any>;
  antiHallucinationGuard: AntiHallucinationGuard;
  confidenceScore: number;
  timestamp: string;
}

export interface AgentRoleDefinition {
  agentId: string;
  name: string;
  role: string;
  primaryResponsibility: string;
  inputContracts: string[];
  outputContracts: string[];
  antiHallucinationRules: string[];
  authorityLevel: 'Extractor' | 'Auditor' | 'Planner' | 'Maker' | 'Checker' | 'Orchestrator';
}

export interface OrchestratorReport {
  pipelineRunId: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  totalDurationMs: number;
  extractedData?: ExtractedPageData;
  keywordPlan?: HeadingKeywordPlan;
  agentLogs: AgentExecutionLog[];
  deduplicatedFlagCount: number;
  resolvedFlagCount: number;
  activeReaderContext?: string;
  verificationResults: VerificationResult[];
  agentScores?: AgentScoreBreakdown;
  communicationBus?: AgentMessagePacket[];
  /** Maker → gates → verification cycles, in order. */
  rounds?: PipelineRound[];
  /** Gate results for the original (unoptimized) page. */
  baselineGates?: GateResult[];
  finalVerdict?: PipelineVerdict;
  /** Round whose draft was returned as the final content. */
  selectedRound?: number;
  makerError?: string;
  /** "optimize" writes a new page from the source; "revise" improves the content on screen. */
  mode?: "optimize" | "revise";
  /** Human-readable scope of a revision, e.g. "Meta title & description". */
  scopeLabel?: string;
  /** Explanation when nothing needed to change. */
  note?: string;
}

export interface ScoreSnapshot {
  overallScore: number;
  overallScoreDisplay?: string;
  publishBlocked?: boolean;
  gatingViolationReasons?: string[];
  contentScore?: number;
  productScore?: number;
  structureAndKeywordScore?: number;
  customerCentricityScore?: number;
  eeatAndGeoScore?: number;
  complianceScore?: number;
  seoBackendScore?: number;
  keywordCoverageScore?: number;
  eeatScore?: number;
  geoScore?: number;
  verificationConfidence?: number;
  extractionCompleteness?: string;
  nineAgentScores?: NineAgentScores;
  // Backward compatibility fields
  seoScore: number;
  voiceAeoScore: number;
  geoEeatScore: number;
  backendScore: number;
  agentScores?: AgentScoreBreakdown;
  totalFlags?: number;
  criticalCount?: number;
  warningCount?: number;
}

export interface AuditSummary {
  overallScore: number; // 0 - 100 (Overall Page Score from Agent 9)
  overallScoreDisplay?: string; // e.g. "82" or "BLOCKED"
  publishBlocked?: boolean;
  gatingViolationReasons?: string[];
  contentScore?: number;
  productScore?: number;
  structureAndKeywordScore?: number;
  customerCentricityScore?: number;
  eeatAndGeoScore?: number;
  complianceScore?: number;       // Agent 2 (0-100)
  seoBackendScore?: number;       // Agent 3 (0-100)
  keywordCoverageScore?: number;  // Agent 4 (0-100)
  eeatScore?: number;             // Agent 6 EEAT (0-100)
  geoScore?: number;              // Agent 6 GEO (0-100)
  verificationConfidence?: number; // Agent 8 (0-100)
  extractionCompleteness?: string; // Agent 1
  nineAgentScores?: NineAgentScores; // Full 9-agent scorecard
  // Backward compatibility fields
  seoScore: number;
  voiceAeoScore: number;
  geoEeatScore: number;
  backendScore: number;
  agentScores?: AgentScoreBreakdown;
  totalFlags: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  passedCount: number;
  topRecommendations: string[];
  byAgentCounts?: {
    agent2Compliance: number;
    agent3SeoBackend: number;
    agent4KeywordMapping: number;
    agent5CustomerCentricity: number;
    agent6EeatGeo: number;
  };
  beforeScores?: ScoreSnapshot;
  afterScores?: ScoreSnapshot;
  isOptimized?: boolean;
}

export interface H2OptimizationItem {
  componentId: string;
  componentName: string;
  originalText: string;
  optimizedText: string;
  targetKeyword: string;
  searchVolume: number;
  voiceIntent: string;
  rationale: string;
  selected: boolean;
}

export interface KeywordDensityItem {
  keyword: string;
  source: 'meta_tag' | 'target_keyword' | 'lsi' | 'voice_query';
  searchVolume?: number;
  intent?: string;
  priority?: string;
  scrapedCount: number;
  scrapedDensity: number;
  scrapedStatus: 'optimal' | 'low' | 'high' | 'missing';
  fixedCount: number;
  fixedDensity: number;
  fixedStatus: 'optimal' | 'low' | 'high' | 'missing';
  deltaDensity: number;
  deltaCount: number;
}

export interface FullBodyAnalytics {
  totalWordCount: number;
  readingTimeMinutes: number;
  readabilityScore: number;
  readabilityGrade: string;
  keywordDensity: {
    keyword: string;
    count: number;
    densityPercent: number;
    status: 'optimal' | 'low' | 'high';
  }[];
  densityComparison?: KeywordDensityItem[];
  voiceSnippetCount: number;
  eeatStatCount: number;
}

export interface GuidelineProfile {
  id: string;
  name: string;
  description: string;
  category: 'saas' | 'ecommerce' | 'health' | 'voice_aeo' | 'geo_citations' | 'bajaj_finserv' | 'custom';
  contentGuidelines?: ContentGuidelines;
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  geoGuidelines?: GEOGuidelines;
  customerCentricityGuidelines?: CustomerCentricityGuidelines;
  structureMappingGuidelines?: StructureMappingGuidelines;
  keywords: KeywordItem[];
  readerContext?: string; // Audience & decision criteria for Agent 5
  createdAt?: string;
  updatedAt?: string;
  isBuiltIn?: boolean;
}

export interface AgentGuidelineConfig {
  unified: boolean;
  activeProfileId: string;
  agent1ProfileId: string;
  agent2ProfileId: string;
}

export interface SectionChangeItem {
  id: string;
  sectionTitle: string;
  sectionType: 'hero' | 'h2_section' | 'body' | 'faq' | 'table' | 'backend_seo' | 'general';
  fieldChanged: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  oneLinerReason: string;
  beforeSnippet?: string;
  afterSnippet?: string;
  guidelineAdheredTo?: string;
}

export interface FixResult {
  componentId?: string;
  isBackend?: boolean;
  updatedBackend?: SEOBackendData;
  updatedComponent?: ContentComponent;
  updatedComponents?: ContentComponent[];
  fixedFlagIds: string[];
  explanation: string;
  improvementsMade: string[];
  sectionChanges?: SectionChangeItem[];
  verificationResult?: VerificationResult;
  diffSummary?: {
    field: string;
    before: string;
    after: string;
  }[];
}
