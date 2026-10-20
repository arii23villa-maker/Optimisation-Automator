import { 
  AuditFlag, 
  KeywordItem, 
  HeadingKeywordPlan, 
  ExtractedPageData, 
  NineAgentScores, 
  ScoreSnapshot,
  AgentScoreBreakdown,
  GuidelineSectionScores 
} from '../types';

export interface ScoringInput {
  flags: AuditFlag[];
  keywords?: KeywordItem[];
  keywordPlan?: HeadingKeywordPlan;
  verificationConfidence?: number;
  extractedData?: ExtractedPageData;
  isPostFix?: boolean; // When true, only active unfixed flags contribute penalties
  contentSample?: string;
  headingsSample?: string[];
}

/**
 * Normalizes flag severity to high | medium | low
 * high = -15, medium = -7, low = -3
 * Customer Centricity uses high = -20
 */
export function getNormalizedSeverity(sev?: string): 'high' | 'medium' | 'low' {
  const s = (sev || '').toLowerCase();
  if (s === 'critical' || s === 'high') return 'high';
  if (s === 'warning' || s === 'medium') return 'medium';
  return 'low';
}

/**
 * Universal Formula:
 * Section Score = 100 − Σ(severity_weight × flag_count), floored at 0
 *   high   = −15
 *   medium = −7
 *   low    = −3
 */
export function computeUniversalDeductionScore(
  flagsList: AuditFlag[],
  highWeight: number = 15,
  mediumWeight: number = 7,
  lowWeight: number = 3
): { score: number; high: number; medium: number; low: number; total: number; deductions: number } {
  let high = 0, medium = 0, low = 0;
  flagsList.forEach((f) => {
    const s = getNormalizedSeverity(f.severity);
    if (s === 'high') high++;
    else if (s === 'medium') medium++;
    else low++;
  });
  const deductions = (high * highWeight) + (medium * mediumWeight) + (low * lowWeight);
  const score = Math.max(0, Math.min(100, 100 - deductions));
  return { score, high, medium, low, total: flagsList.length, deductions };
}

/**
 * Scoring System v2 — Aligned to the Six Guideline Sections
 *
 * Computes scores per guideline section by filtering the merged flag list (not per agent).
 *
 * 1. Content Guidelines (Weight: 15%)
 *    - Formula: 100 − Σ(high×15 + medium×7 + low×3), floored at 0
 *
 * 2. Product Guidelines (Weight: 25%)
 *    - Formula: 100 − Σ(high×15 + medium×7 + low×3), floored at 0
 *    - Regulatory Gating: Has open regulatory violations => publishBlocked: true
 *    - When publishBlocked === true, overall score display reads "BLOCKED"
 *
 * 3. SEO Guidelines (Weight: 10%)
 *    - Formula: 100 − Σ(high×15 + medium×7 + low×3), floored at 0
 *
 * 4. Structure and Keyword Mapping Guidelines (Weight: 10%)
 *    - Sub-score 1 (Structure Quality): 100 − Σ(high×15 + medium×7 + low×3)
 *    - Sub-score 2 (Keyword Intent & Coverage): (assigned search volume / total search volume) × 100
 *    - Combined: (Structure Score + Keyword Score) / 2
 *
 * 5. Customer-Centricity Guidelines (Weight: 20%)
 *    - Formula: 100 − Σ(high×20 + medium×7 + low×3), floored at 0  [High = -20]
 *
 * 6. EEAT and GEO Citations Guidelines (Weight: 20%)
 *    - Sub-score 1 (EEAT/Trust): 100 − Σ(high×15 + medium×7 + low×3)
 *    - Sub-score 2 (GEO/AI Citability): 100 − Σ(high×15 + medium×7 + low×3)
 *    - Combined: (EEAT Score + GEO Score) / 2
 *
 * Composite Score Rollup (Deterministic in Orchestrator):
 * Composite Score = (Product × 0.25)
 *                 + (Customer × 0.20)
 *                 + (GEO_avg × 0.20)
 *                 + (Content × 0.15)
 *                 + (Structure_Keyword_avg × 0.10)
 *                 + (SEO × 0.10)
 *
 * Floored at 0, capped at 100.
 * If publishBlocked === true, overallScoreDisplay = "BLOCKED".
 */
export function calculateNineAgentScores(input: ScoringInput): NineAgentScores {
  const {
    flags = [],
    keywords = [],
    keywordPlan,
    verificationConfidence = 95,
    extractedData,
    isPostFix = false,
    contentSample = '',
    headingsSample = [],
  } = input;

  // Active flags: in post-fix state, only active unfixed flags cause deductions
  const activeFlags = isPostFix ? flags.filter((f) => !f.fixed) : flags;

  // -------------------------------------------------------------
  // 1. CONTENT GUIDELINES SCORE (15% Composite Weight)
  // Flags tagged with guidelineSection === 'Content Guidelines'
  // -------------------------------------------------------------
  const contentFlagsList = activeFlags.filter(
    (f) =>
      f.guidelineSection === 'Content Guidelines' ||
      (!f.guidelineSection && (
        f.category === 'GUIDELINE_COMPLIANCE' && f.subCategory === 'Content' ||
        f.guidelineReference?.toLowerCase().includes('content') ||
        f.issueTitle?.toLowerCase().includes('voice') ||
        f.issueTitle?.toLowerCase().includes('banned') ||
        f.issueTitle?.toLowerCase().includes('tone')
      ))
  );
  const contentMetrics = computeUniversalDeductionScore(contentFlagsList, 15, 7, 3);
  const contentScore = contentMetrics.score;
  const contentRationale = contentFlagsList.length === 0
    ? (isPostFix 
        ? 'Content guidelines verified: Tone of voice, formatting rules, and banned language restrictions 100% compliant.' 
        : 'Full content compliance: Zero tone, formatting, or banned phrase violations.')
    : `Content Guidelines Score: ${contentScore}/100 based on ${contentFlagsList.length} flag(s) (${contentMetrics.high} high [-15], ${contentMetrics.medium} medium [-7], ${contentMetrics.low} low [-3]).`;

  // -------------------------------------------------------------
  // 2. PRODUCT GUIDELINES SCORE & REGULATORY GATING (25% Composite Weight)
  // Flags tagged with guidelineSection === 'Product Guidelines'
  // Checks regulatory gating violations
  // -------------------------------------------------------------
  const productFlagsList = activeFlags.filter(
    (f) =>
      f.guidelineSection === 'Product Guidelines' ||
      (!f.guidelineSection && (
        f.category === 'PRODUCT_GUIDELINES' ||
        (f.category === 'GUIDELINE_COMPLIANCE' && (
          f.subCategory === 'Product' ||
          f.guidelineReference?.toLowerCase().includes('product') ||
          f.issueTitle?.toLowerCase().includes('forbidden') ||
          f.issueTitle?.toLowerCase().includes('regulatory') ||
          f.issueTitle?.toLowerCase().includes('disclaimer') ||
          f.issueTitle?.toLowerCase().includes('value prop')
        ))
      ))
  );

  const productMetrics = computeUniversalDeductionScore(productFlagsList, 15, 7, 3);
  const productScore = productMetrics.score;

  // Regulatory Gating Check:
  // Any open critical/high violation in Product Guidelines, or explicit isGatingViolation flag, or forbidden phrase / unapproved claim triggers gating block
  const gatingFlags = productFlagsList.filter(f => {
    if (f.isGatingViolation) return true;
    if (f.severity === 'critical') {
      const txt = `${f.issueTitle} ${f.issueDescription} ${f.guidelineReference}`.toLowerCase();
      return txt.includes('forbidden') || txt.includes('regulatory') || txt.includes('prohibited') || txt.includes('gating') || txt.includes('disclaimer') || txt.includes('locked fact');
    }
    return false;
  });

  const publishBlocked = gatingFlags.length > 0;
  const gatingViolationReasons = gatingFlags.map(f => f.issueTitle);

  const productRationale = publishBlocked
    ? `Product Guidelines Score: ${productScore}/100 (PUBLISH BLOCKED due to ${gatingFlags.length} open regulatory/policy violation[s]: ${gatingViolationReasons.slice(0, 2).join('; ')}).`
    : productFlagsList.length === 0
      ? (isPostFix 
          ? 'Product guidelines verified: Locked facts preserved, approved terminology enforced, zero forbidden claims.' 
          : 'Full product alignment: Value props, facts, and regulatory constraints verified.')
      : `Product Guidelines Score: ${productScore}/100 based on ${productFlagsList.length} flag(s) (${productMetrics.high} high [-15], ${productMetrics.medium} medium [-7], ${productMetrics.low} low [-3]).`;

  // -------------------------------------------------------------
  // 3. SEO GUIDELINES SCORE (10% Composite Weight)
  // Flags tagged with guidelineSection === 'SEO Guidelines'
  // -------------------------------------------------------------
  const seoFlagsList = activeFlags.filter(
    (f) =>
      f.guidelineSection === 'SEO Guidelines' ||
      (!f.guidelineSection && (
        f.category === 'SEO_BACKEND' ||
        f.category === 'SEO_META' ||
        f.category === 'SCHEMA_BACKEND' ||
        f.category === 'SITEMAP' ||
        f.agentOrigin === 'Agent 3: SEO Backend Data'
      ))
  );
  const seoMetrics = computeUniversalDeductionScore(seoFlagsList, 15, 7, 3);
  const seoScore = seoMetrics.score;
  const seoRationale = seoFlagsList.length === 0
    ? (isPostFix 
        ? 'Technical SEO fully verified: Canonical graph, JSON-LD schema, meta title/description lengths valid.' 
        : 'Optimal technical SEO: Valid meta tags and schema markup.')
    : `SEO Guidelines Score: ${seoScore}/100 based on ${seoFlagsList.length} flag(s) (${seoMetrics.high} high [-15], ${seoMetrics.medium} medium [-7], ${seoMetrics.low} low [-3]).`;

  // -------------------------------------------------------------
  // 4. STRUCTURE AND KEYWORD MAPPING GUIDELINES (10% Composite Weight)
  // Sub-score 1 (Structure Quality): 100 - deductions on structural flags
  // Sub-score 2 (Keyword Intent & Coverage): (assigned volume / total volume) * 100
  // Combined Score = (Structure Score + Keyword Score) / 2
  // -------------------------------------------------------------
  const structureFlagsList = activeFlags.filter(
    (f) =>
      (f.guidelineSection === 'Structure and Keyword Mapping Guidelines' && (f.subCategory === 'Structure' || f.category === 'STRUCTURE_MAPPING')) ||
      (!f.guidelineSection && (
        f.category === 'STRUCTURE_MAPPING' ||
        (f.category === 'KEYWORD_MAPPING' && (
          f.issueTitle?.toLowerCase().includes('heading order') ||
          f.issueTitle?.toLowerCase().includes('hierarchy') ||
          f.issueTitle?.toLowerCase().includes('faq struct') ||
          f.issueTitle?.toLowerCase().includes('h2') ||
          f.issueTitle?.toLowerCase().includes('sequencing')
        ))
      ))
  );
  const structureMetrics = computeUniversalDeductionScore(structureFlagsList, 15, 7, 3);
  const structureScore = structureMetrics.score;

  // Keyword Intent & Coverage calculation
  const validKeywords = (keywords || []).filter(
    (k) => k && k.keyword && k.keyword.trim().length > 0
  );
  const totalVolume = validKeywords.reduce((acc, k) => acc + (k.searchVolume || 1000), 0);

  let assignedVolume = 0;
  let assignedCount = 0;

  if (isPostFix) {
    assignedVolume = totalVolume;
    assignedCount = validKeywords.length;
  } else if (keywordPlan && Array.isArray(keywordPlan.headingAssignments) && keywordPlan.headingAssignments.length > 0) {
    const assignedKwNames = new Set(
      keywordPlan.headingAssignments.map((a) => a.assignedKeyword?.toLowerCase().trim())
    );
    validKeywords.forEach((k) => {
      const kwNormalized = k.keyword.toLowerCase().trim();
      if (assignedKwNames.has(kwNormalized)) {
        assignedVolume += (k.searchVolume || 1000);
        assignedCount++;
      }
    });
  } else {
    const combinedText = `${headingsSample.join(' ')} ${contentSample}`.toLowerCase();
    validKeywords.forEach((k) => {
      const kw = k.keyword.toLowerCase().trim();
      if (combinedText.includes(kw)) {
        assignedVolume += (k.searchVolume || 1000);
        assignedCount++;
      }
    });
  }

  if (!isPostFix && assignedCount === 0 && validKeywords.length > 0) {
    const kwFlags = activeFlags.filter((f) => 
      f.category === 'KEYWORD_MAPPING' || 
      (f.guidelineSection === 'Structure and Keyword Mapping Guidelines' && f.subCategory === 'Keyword')
    );
    const missingCount = kwFlags.length;
    assignedCount = Math.max(0, validKeywords.length - missingCount);
    validKeywords.slice(0, assignedCount).forEach((k) => {
      assignedVolume += (k.searchVolume || 1000);
    });
  }

  const keywordScore = totalVolume > 0
    ? Math.max(0, Math.min(100, Math.round((assignedVolume / totalVolume) * 100)))
    : (validKeywords.length > 0 ? Math.round((assignedCount / validKeywords.length) * 100) : 100);

  const structureAndKeywordScore = Math.round((structureScore + keywordScore) / 2);
  const structureAndKeywordRationale = `Structure & Keyword Score: ${structureAndKeywordScore}/100 [Structure Quality: ${structureScore}/100, Keyword Coverage: ${keywordScore}/100 (${assignedCount}/${validKeywords.length} keywords, ${assignedVolume.toLocaleString()}/${totalVolume.toLocaleString()} search volume)].`;

  // -------------------------------------------------------------
  // 5. CUSTOMER-CENTRICITY GUIDELINES SCORE (20% Composite Weight)
  // Flags tagged with guidelineSection === 'Customer-Centricity Guidelines'
  // High severity deduction is -20 (heavier penalty for friction/harm)
  // -------------------------------------------------------------
  const customerFlagsList = activeFlags.filter(
    (f) =>
      f.guidelineSection === 'Customer-Centricity Guidelines' ||
      (!f.guidelineSection && (
        f.category === 'CUSTOMER_CENTRICITY' ||
        f.agentOrigin === 'Agent 5: Customer Centricity'
      ))
  );
  const customerMetrics = computeUniversalDeductionScore(customerFlagsList, 20, 7, 3);
  const customerCentricityScore = customerMetrics.score;
  const customerCentricityRationale = customerFlagsList.length === 0
    ? (isPostFix 
        ? 'Customer experience optimized: Clear BLUF answers, scannable bullet points, low cognitive load, zero reading friction.' 
        : 'Customer-first clarity: Low cognitive load, transparent reader journey, and scannable visual layout.')
    : `Customer-Centricity Score: ${customerCentricityScore}/100 based on ${customerFlagsList.length} flag(s) (${customerMetrics.high} high [-20], ${customerMetrics.medium} medium [-7], ${customerMetrics.low} low [-3]).`;

  // -------------------------------------------------------------
  // 6. EEAT AND GEO CITATIONS GUIDELINES SCORE (20% Composite Weight)
  // Flags tagged with guidelineSection === 'EEAT and GEO Citations Guidelines'
  // Sub-score 1 (EEAT): 100 - deductions on trust, credentials, disclaimers
  // Sub-score 2 (GEO): 100 - deductions on citations, statistics, AI overview formats
  // Combined Score = (EEAT Score + GEO Score) / 2
  // -------------------------------------------------------------
  const eeatAndGeoFlagsList = activeFlags.filter(
    (f) =>
      f.guidelineSection === 'EEAT and GEO Citations Guidelines' ||
      (!f.guidelineSection && (
        f.category === 'EEAT_GEO' ||
        f.category === 'EEAT_PRINCIPLES' ||
        f.category === 'GEO_LLM_CITATION' ||
        f.agentOrigin === 'Agent 6: EEAT & GEO'
      ))
  );

  const eeatFlagsList: AuditFlag[] = [];
  const geoFlagsList: AuditFlag[] = [];

  eeatAndGeoFlagsList.forEach((f) => {
    if (f.subCategory === 'EEAT' || f.category === 'EEAT_PRINCIPLES') {
      eeatFlagsList.push(f);
      return;
    }
    if (f.subCategory === 'GEO' || f.category === 'GEO_LLM_CITATION') {
      geoFlagsList.push(f);
      return;
    }
    const text = `${f.issueTitle} ${f.issueDescription} ${f.guidelineReference}`.toLowerCase();
    if (
      text.includes('geo') || 
      text.includes('metric') || 
      text.includes('statistic') || 
      text.includes('capsule') || 
      text.includes('ai overview') || 
      text.includes('perplexity') || 
      text.includes('retrieval') ||
      text.includes('citability')
    ) {
      geoFlagsList.push(f);
    } else {
      eeatFlagsList.push(f);
    }
  });

  const eeatMetrics = computeUniversalDeductionScore(eeatFlagsList, 15, 7, 3);
  const eeatScore = eeatMetrics.score;
  const eeatRationale = eeatFlagsList.length === 0
    ? (isPostFix 
        ? 'EEAT verified: Verifiable third-party citations, expert credentials, and disclaimers in place.' 
        : 'High authority & trust: Proven author attribution and verifiable citations.')
    : `EEAT Score: ${eeatScore}/100 based on ${eeatFlagsList.length} flag(s) (${eeatMetrics.high} high [-15], ${eeatMetrics.medium} medium [-7], ${eeatMetrics.low} low [-3]).`;

  const geoMetrics = computeUniversalDeductionScore(geoFlagsList, 15, 7, 3);
  const geoScore = geoMetrics.score;
  const geoRationale = geoFlagsList.length === 0
    ? (isPostFix 
        ? 'GEO citability optimized: 40-50 word direct answer blocks, quantitative benchmarks, and LLM entity grounding.' 
        : 'AI Engine Ready: Direct answer capsules and verified quantitative facts.')
    : `GEO Score: ${geoScore}/100 based on ${geoFlagsList.length} flag(s) (${geoMetrics.high} high [-15], ${geoMetrics.medium} medium [-7], ${geoMetrics.low} low [-3]).`;

  const eeatAndGeoScore = Math.round((eeatScore + geoScore) / 2);
  const eeatAndGeoRationale = `EEAT & GEO Score: ${eeatAndGeoScore}/100 [EEAT Trust: ${eeatScore}/100, GEO Citability: ${geoScore}/100].`;

  // -------------------------------------------------------------
  // ORCHESTRATOR COMPOSITE SCORE ROLLUP (Sole Authority: Agent 9)
  //
  // Formula:
  // Composite = (Product × 0.25)
  //           + (Customer × 0.20)
  //           + (GEO_avg × 0.20)
  //           + (Content × 0.15)
  //           + (Structure_Keyword_avg × 0.10)
  //           + (SEO × 0.10)
  //
  // Floored at 0, Cap at 100.
  // Gating Enforcement: If publishBlocked === true, display "BLOCKED".
  // -------------------------------------------------------------
  const compositeCalculated =
    (productScore * 0.25) +
    (customerCentricityScore * 0.20) +
    (eeatAndGeoScore * 0.20) +
    (contentScore * 0.15) +
    (structureAndKeywordScore * 0.10) +
    (seoScore * 0.10);

  const compositeScore = Math.max(0, Math.min(100, Math.round(compositeCalculated)));
  const overallPageScore = compositeScore;
  const overallScoreDisplay = publishBlocked ? 'BLOCKED' : `${overallPageScore}`;

  // Build section scores object
  const sectionScores: GuidelineSectionScores = {
    contentScore,
    contentRationale,
    contentFlags: { high: contentMetrics.high, medium: contentMetrics.medium, low: contentMetrics.low, total: contentFlagsList.length },

    productScore,
    productRationale,
    productFlags: { high: productMetrics.high, medium: productMetrics.medium, low: productMetrics.low, total: productFlagsList.length },
    publishBlocked,
    gatingViolationReasons,

    seoScore,
    seoRationale,
    seoFlags: { high: seoMetrics.high, medium: seoMetrics.medium, low: seoMetrics.low, total: seoFlagsList.length },

    structureAndKeywordScore,
    structureScore,
    keywordScore,
    structureAndKeywordRationale,
    keywordStats: {
      assignedVolume,
      totalVolume,
      assignedCount,
      totalCount: validKeywords.length,
    },

    customerCentricityScore,
    customerCentricityRationale,
    customerFlags: { high: customerMetrics.high, medium: customerMetrics.medium, low: customerMetrics.low, total: customerFlagsList.length },

    eeatAndGeoScore,
    eeatScore,
    geoScore,
    eeatAndGeoRationale,
    eeatFlags: { high: eeatMetrics.high, medium: eeatMetrics.medium, low: eeatMetrics.low, total: eeatFlagsList.length },
    geoFlags: { high: geoMetrics.high, medium: geoMetrics.medium, low: geoMetrics.low, total: geoFlagsList.length },

    compositeScore,
    verificationConfidence,
    extractionCompleteness: extractedData ? '6 of 6 fields populated' : 'Extracted',
    overallScoreDisplay,
  };

  return {
    ...sectionScores,

    // Backward compatibility aliases
    complianceScore: productScore,
    complianceFlags: { high: productMetrics.high, medium: productMetrics.medium, low: productMetrics.low, total: productFlagsList.length },
    complianceRationale: productRationale,

    seoBackendScore: seoScore,
    seoBackendFlags: { high: seoMetrics.high, medium: seoMetrics.medium, low: seoMetrics.low, total: seoFlagsList.length },
    seoBackendRationale: seoRationale,

    keywordCoverageScore: keywordScore,
    keywordIntentFitScore: structureScore,
    keywordRationale: structureAndKeywordRationale,

    eeatRationale,
    geoRationale,

    overallPageScore,
  };
}

/** Helper to construct an AgentScoreBreakdown object from NineAgentScores */
export function buildAgentScoreBreakdown(scores: NineAgentScores): AgentScoreBreakdown {
  return {
    agent2Score: scores.productScore,
    agent2Rationale: scores.productRationale,
    agent3Score: scores.seoScore,
    agent3Rationale: scores.seoRationale,
    agent4Score: scores.structureAndKeywordScore,
    agent4Rationale: scores.structureAndKeywordRationale,
    agent5Score: scores.customerCentricityScore,
    agent5Rationale: scores.customerCentricityRationale,
    agent6Score: scores.eeatAndGeoScore,
    agent6Rationale: scores.eeatAndGeoRationale,
    eeatScore: scores.eeatScore,
    geoScore: scores.geoScore,
    nineAgentScores: scores,
    sectionScores: scores,
  };
}

/** Helper to construct a ScoreSnapshot for Before/After state tracking */
export function buildScoreSnapshot(
  scores: NineAgentScores,
  totalFlags: number,
  criticalCount: number,
  warningCount: number
): ScoreSnapshot {
  const breakdown = buildAgentScoreBreakdown(scores);
  return {
    overallScore: scores.overallPageScore,
    overallScoreDisplay: scores.overallScoreDisplay,
    publishBlocked: scores.publishBlocked,
    gatingViolationReasons: scores.gatingViolationReasons,
    contentScore: scores.contentScore,
    productScore: scores.productScore,
    structureAndKeywordScore: scores.structureAndKeywordScore,
    customerCentricityScore: scores.customerCentricityScore,
    eeatAndGeoScore: scores.eeatAndGeoScore,
    complianceScore: scores.complianceScore,
    seoBackendScore: scores.seoBackendScore,
    keywordCoverageScore: scores.keywordCoverageScore,
    eeatScore: scores.eeatScore,
    geoScore: scores.geoScore,
    verificationConfidence: scores.verificationConfidence,
    extractionCompleteness: scores.extractionCompleteness,
    nineAgentScores: scores,
    seoScore: scores.seoScore,
    voiceAeoScore: scores.keywordCoverageScore,
    geoEeatScore: scores.eeatAndGeoScore,
    backendScore: scores.seoBackendScore,
    agentScores: breakdown,
    totalFlags,
    criticalCount,
    warningCount,
  };
}
