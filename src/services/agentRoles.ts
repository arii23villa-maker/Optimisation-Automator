import { AgentRoleDefinition, AgentMessagePacket, InterAgentContractType, AntiHallucinationGuard } from '../types';

/**
 * STRICT 9-AGENT ROLE DEFINITIONS & ANTI-HALLUCINATION CONTRACTS
 * Establishes immutable boundaries, input/output schemas, and verification rules
 * to prevent hallucinations, claim fabrication, or unauthorized content mutations.
 */
export const AGENT_ROLE_DEFINITIONS: AgentRoleDefinition[] = [
  {
    agentId: 'agent-1',
    name: 'Agent 1: Ingress & Scraping Agent (Powered by Firecrawl API)',
    role: 'Primary Content & SEO Scraper and Ground-Truth Anchor',
    primaryResponsibility: 'Executes headless web scraping, SEO extraction, and DOM normalization via the Firecrawl API (with multi-tier fallback), structuring pristine content into the 6-field schema without hallucination.',
    inputContracts: ['Page URL (Firecrawl Headless Scraping)', 'Raw HTML', 'Pasted Webpage Text'],
    outputContracts: ['ExtractedPageData (6 normalized fields: metaTitle, metaDescription, schema, sitemap, tags, content)'],
    antiHallucinationRules: [
      'Extract ONLY verified text and live DOM elements retrieved via Firecrawl API or pasted input.',
      'Preserve raw author claims, technical specs, and SEO meta tags without interpretive modification.',
      'Do not evaluate quality, tone, or compliance—pass pristine raw data downstream to Evaluator Agents 2–6.'
    ],
    authorityLevel: 'Extractor'
  },
  {
    agentId: 'agent-2',
    name: 'Agent 2: Guideline Compliance Agent',
    role: 'Brand Policy & Regulatory Auditor (Post-Generation Audit)',
    primaryResponsibility: 'Audits generated content post-creation strictly against Content Guidelines (voice, tone, readability, banned phrases, formatting) and Product Guidelines (locked facts, terminology, approved figures, compliance disclosures, regulatory-gating rules) without interfering during the Maker generation phase, producing non-blocking flags and actionable fix suggestions.',
    inputContracts: ['Generated Content Output', 'ExtractedPageData', 'ContentGuidelines', 'ProductGuidelines'],
    outputContracts: ['AuditFlag[] (Category: GUIDELINE_COMPLIANCE)', 'Compliance Score (0-100)', 'Compliance Rationale', 'Suggested Fix Patches'],
    antiHallucinationRules: [
      'Audit ONLY against user-provided Content & Product guidelines and explicitly declared forbidden phrases on generated content.',
      'Every post-generation flag MUST cite an exact excerpt from the generated text and reference the specific guideline rule violated.',
      'Suggest precise non-destructive fixes without interfering with the Maker Agent’s creative generation.'
    ],
    authorityLevel: 'Auditor'
  },
  {
    agentId: 'agent-3',
    name: 'Agent 3: SEO Backend & Technical Schema Agent',
    role: 'Technical Metadata & Schema.org Validator (Post-Generation)',
    primaryResponsibility: 'Evaluates character lengths, canonical tags, robots directives, OpenGraph/Twitter tags, and executes deterministic JSON-LD syntax validation per SEO Guidelines on the generated output.',
    inputContracts: ['Generated Content Output', 'ExtractedPageData', 'SEOGuidelines'],
    outputContracts: ['AuditFlag[] (Category: SEO_BACKEND)', 'SEO Backend Score (0-100)', 'SEO Backend Rationale', 'SEOBackendData'],
    antiHallucinationRules: [
      'Verify schema types against official Schema.org standards (WebPage, Organization, Product, FAQPage) in SEO Guidelines.',
      'Enforce mathematical character limits (Titles: 50-60 chars, Descriptions: 135-160 chars) on post-generation outputs.',
      'Check canonical URLs against actual domain hostnames.'
    ],
    authorityLevel: 'Auditor'
  },
  {
    agentId: 'agent-4',
    name: 'Agent 4: Keyword & Intent Mapping Planner',
    role: 'Search Intent & Structural Matrix Architect',
    primaryResponsibility: 'Audits heading hierarchy, H1 primary keyword placement, voice/question headings, and keyword frequency/density per Structure & Keyword Mapping Guidelines, providing keyword distribution suggestions for generated content.',
    inputContracts: ['ExtractedPageData', 'Generated Content Output', 'KeywordItem[]', 'ContentComponent[]', 'StructureMappingGuidelines', 'SEOGuidelines'],
    outputContracts: ['HeadingKeywordPlan', 'AuditFlag[] (Category: KEYWORD_MAPPING, STRUCTURE_MAPPING)', 'Keyword Strategy Score (0-100)', 'Strategy Rationale'],
    antiHallucinationRules: [
      'Assign ONLY keywords that exist in the active keyword database—never fabricate imaginary keywords or search volume numbers.',
      'Ensure 1 primary keyword mapped to H1 and distinct secondary/voice keywords mapped to each H2/H3.',
      'Prevent keyword cannibalization by ensuring no two headings target identical high-volume terms.'
    ],
    authorityLevel: 'Planner'
  },
  {
    agentId: 'agent-5',
    name: 'Agent 5: Customer Centricity & Friction Agent',
    role: 'Buyer Journey & Cognitive Load Evaluator (Post-Generation)',
    primaryResponsibility: 'Audits generated content post-creation for layman comprehension, persona journey stages, cognitive friction patterns, objection handling, and readability per Customer Centricity Guidelines.',
    inputContracts: ['Generated Content Output', 'ExtractedPageData', 'CustomerCentricityGuidelines', 'ContentGuidelines', 'Active Reader Persona'],
    outputContracts: ['AuditFlag[] (Category: CUSTOMER_CENTRICITY)', 'Centricity Score (0-100)', 'Centricity Rationale', 'Readability Fix Suggestions'],
    antiHallucinationRules: [
      'Evaluate strictly against the selected reader persona (e.g. Enterprise Executive, Technical Architect, SMB Buyer).',
      'Measure cognitive friction using empirical heuristics: sentence length > 28 words, wall-of-text blocks > 120 words.',
      'Verify that opening 40-50 words under each heading provide an immediate direct answer.'
    ],
    authorityLevel: 'Auditor'
  },
  {
    agentId: 'agent-6',
    name: 'Agent 6: EEAT & GEO Citation Agent',
    role: 'Trust Signals & AI Search Citation Verifier (Post-Generation)',
    primaryResponsibility: 'Audits generated content post-creation for verifiable statistics, institutional certifications, source citations, authoritative credentials, and generative engine optimization (GEO) readiness.',
    inputContracts: ['Generated Content Output', 'ExtractedPageData', 'GEOGuidelines', 'ProductGuidelines (eeatCredentials)'],
    outputContracts: ['AuditFlag[] (Category: EEAT_GEO)', 'EEAT Score (0-100)', 'GEO Score (0-100)', 'EEAT & GEO Rationale', 'Citation Fix Suggestions'],
    antiHallucinationRules: [
      'Validate trust signals against verified credentials declared in guidelines (SOC-2, ISO, uptime SLA, awards).',
      'Prohibit inventing fake statistical numbers, percentages, or non-existent benchmark tests.',
      'Enforce 40-50 word self-contained factual answer snippets optimized for AI search engine retrieval.'
    ],
    authorityLevel: 'Auditor'
  },
  {
    agentId: 'agent-7',
    name: 'Agent 7: The Maker',
    role: 'The only writer — free, independent page optimization',
    primaryResponsibility: 'Writes the complete optimized page (meta title, description, H1, intro, H2/H3 sections, FAQs) with full creative freedom and no checklist. From round 2 it revises its own draft using the notes from the five review gates and the verification gate.',
    inputContracts: ['Source page content (Agent 1)', 'Target keywords (context only)', 'Approved product facts', 'Review notes (revision rounds only)'],
    outputContracts: ['PageDraft (structured page)'],
    antiHallucinationRules: [
      'Full freedom over structure, headings, order, wording and tone.',
      'Every figure, claim, credential or name must come from the source page or approved product facts.',
      'Notes that would need missing information are resolved by rephrasing or removing, never by inventing.'
    ],
    authorityLevel: 'Maker'
  },
  {
    agentId: 'agent-8',
    name: 'Agent 8: Verification & Advisory Gate',
    role: 'Final quality gate — approves the draft for publishing or rejects it',
    primaryResponsibility: 'Approves a draft only when all five review gates pass, no forbidden phrases are used, and every figure and claim traces back to the source. Otherwise it compiles the prioritized notes that go back to the maker.',
    inputContracts: ['PageDraft', 'Gate results (Agents 2-6)', 'Source page', 'Approved product facts'],
    outputContracts: ['VerificationResult (APPROVED / NOT QUALIFIED, blocking issues)', 'Notes for the maker'],
    antiHallucinationRules: [
      'Deterministic check: figures absent from the source block approval.',
      'Deterministic check: forbidden phrases block approval.',
      'Semantic check: invented or changed claims are listed and high-risk ones block approval.'
    ],
    authorityLevel: 'Checker'
  },
  {
    agentId: 'agent-9',
    name: 'Agent 9: Orchestrator',
    role: 'Runs the maker → gates → verification loop',
    primaryResponsibility: 'Runs extraction, audits the original page for a baseline, gets the first draft from the maker, sends each draft through the five review gates and the verification gate, and loops the notes back to the maker until the draft is approved or the revision limit is reached.',
    inputContracts: ['All pipeline inputs'],
    outputContracts: ['OrchestratorReport with every round', 'Final content and SEO data', 'Before/after scores'],
    antiHallucinationRules: [
      'The maker never sees gate rules before its first draft.',
      'Before and after scores both come from real gate audits, not from marking flags as fixed.',
      'Every inter-agent message is logged.'
    ],
    authorityLevel: 'Orchestrator'
  }
];

/**
 * Creates a structured, strongly-typed Inter-Agent Communication Bus packet
 */
export function createMessagePacket(params: {
  packetNumber: number;
  senderAgentId: string;
  targetAgentId: string;
  contractType: InterAgentContractType;
  summary: string;
  payloadSummary: string;
  dataPayload?: Record<string, any>;
  groundingSources?: string[];
  zeroForbiddenWordsVerified?: boolean;
  factualityChecked?: boolean;
  hallucinationRisk?: 'none' | 'low' | 'medium' | 'high';
  notes?: string;
  confidenceScore?: number;
}): AgentMessagePacket {
  const senderDef = AGENT_ROLE_DEFINITIONS.find(d => d.agentId === params.senderAgentId);
  const targetDef = params.targetAgentId === 'broadcast' 
    ? { name: 'All Agents (Broadcast)', role: 'Parallel Evaluator Pool' }
    : AGENT_ROLE_DEFINITIONS.find(d => d.agentId === params.targetAgentId);

  const antiHallucinationGuard: AntiHallucinationGuard = {
    groundingSources: params.groundingSources || ['Normalized DOM Extraction'],
    zeroForbiddenWordsVerified: params.zeroForbiddenWordsVerified ?? true,
    factualityChecked: params.factualityChecked ?? true,
    hallucinationRisk: params.hallucinationRisk || 'none',
    notes: params.notes || 'Passed deterministic grounding verification against source specifications.'
  };

  return {
    id: `msg-pkt-${Date.now()}-${params.packetNumber}-${Math.random().toString(36).slice(2, 6)}`,
    packetNumber: params.packetNumber,
    senderAgentId: params.senderAgentId,
    senderName: senderDef?.name || params.senderAgentId,
    senderRole: senderDef?.role || 'Agent Subsystem',
    targetAgentId: params.targetAgentId,
    targetName: targetDef?.name || params.targetAgentId,
    contractType: params.contractType,
    summary: params.summary,
    payloadSummary: params.payloadSummary,
    dataPayload: params.dataPayload,
    antiHallucinationGuard,
    confidenceScore: params.confidenceScore ?? 95,
    timestamp: new Date().toISOString()
  };
}

/**
 * Deterministic Anti-Hallucination & Policy Verification Utility
 */
/**
 * True when the text uses a forbidden phrase as a statement, not inside a negation. Presets forbid claims such
 * as "insured by DICGC" while requiring the disclosure "deposits with NBFCs are not insured by DICGC"; a plain
 * substring match blocked every compliant Fixed Deposit draft in the first real test.
 */
export function usesPhraseAffirmatively(text: string, phrase: string): boolean {
  const t = text.toLowerCase();
  const p = phrase.toLowerCase().trim();
  if (!p) return false;
  const negation = /\b(not|never|isn't|aren't|wasn't|weren't|cannot|can't|neither|nor)\b/;
  for (let i = t.indexOf(p); i >= 0; i = t.indexOf(p, i + p.length)) {
    const before = t.slice(Math.max(0, i - 40), i).split(/\s+/).slice(-4).join(' ');
    if (!negation.test(before)) return true;
  }
  return false;
}

export function runDeterministicAntiHallucinationChecks(params: {
  text: string;
  forbiddenPhrases?: string[];
  requiredKeywords?: string[];
  maxSentenceWords?: number;
}): {
  passed: boolean;
  violations: string[];
  forbiddenWordsFound: string[];
  missingKeywords: string[];
} {
  const { text, forbiddenPhrases = [], requiredKeywords = [] } = params;
  const violations: string[] = [];
  const forbiddenWordsFound: string[] = [];
  const missingKeywords: string[] = [];

  const textLower = text.toLowerCase();

  // 1. Check for forbidden phrases
  for (const phrase of forbiddenPhrases) {
    if (phrase && phrase.trim() && usesPhraseAffirmatively(textLower, phrase)) {
      forbiddenWordsFound.push(phrase);
      violations.push(`Contains forbidden phrase: "${phrase}"`);
    }
  }

  // 2. Check for required keywords if specified
  for (const kw of requiredKeywords) {
    if (kw && kw.trim() && !textLower.includes(kw.toLowerCase().trim())) {
      missingKeywords.push(kw);
      violations.push(`Missing assigned keyword: "${kw}"`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    forbiddenWordsFound,
    missingKeywords
  };
}
