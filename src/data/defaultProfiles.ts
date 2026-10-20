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
import { BAJAJ_CONTENT_PRESET, BAJAJ_PRODUCT_PRESETS, findById } from './bajajVerticals';

export const BUILT_IN_CONTENT_GUIDELINES: SavedContentGuideline[] = [
  {
    id: 'content-preset-b2b-authority',
    name: 'Executive & B2B Authority',
    description: 'Direct, consultative tone with 8th-grade readability, bold lead-ins, and zero marketing buzzwords.',
    category: 'b2b_saas',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      toneOfVoice: 'Authoritative, direct, consultative, and high-credibility without hype.',
      readabilityLevel: '8th-9th Grade (Flesch-Kincaid 60-70: clear, concise, accessible)',
      paragraphConstraints: 'Maximum 2-3 sentences per paragraph (under 45 words per block). Avoid walls of text.',
      formattingRules: [
        'Use bold lead-ins for all bullet points and benefit items.',
        'Use markdown comparison tables for specs, features, and pricing.',
        'Include immediate "In Plain English" BLUF summaries below every H2 heading.',
        'Never use passive voice; prefer direct active verbs.'
      ],
      forbiddenCliches: [
        'game changer',
        'synergistic',
        'paradigm shift',
        'leverage your potential',
        'delve into',
        'in today\'s fast-paced world',
        'tapestry',
        'seamlessly integrated'
      ],
      grammarAndPerspective: 'Second-person perspective ("you" and "your team"). Present tense, active voice.',
      ctaStandards: 'High-intent, outcome-oriented action phrases (e.g. "Calculate Your Savings", "Review Architecture").',
      citationFormatting: 'Inline bracketed source citations: [Source: Institution, Year].',
      customContentRules: 'Every substantive claim must be supported by an empirical benchmark or statutory reference.'
    }
  },
  {
    id: 'content-preset-d2c-conversational',
    name: 'Direct-to-Consumer (D2C) Conversational',
    description: 'Empathetic, clear, everyday language with 6th-grade readability for maximum conversion and engagement.',
    category: 'e_commerce',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      toneOfVoice: 'Warm, approachable, conversational, and transparent.',
      readabilityLevel: '6th-7th Grade (Everyday language with simple sentence structures)',
      paragraphConstraints: '1-2 sentences maximum. Generous white space for mobile readability.',
      formattingRules: [
        'Ask question headings matching voice search intent (e.g., "How does this work?").',
        'Use numbered steps for onboarding or purchase flows.',
        'Highlight customer guarantees and delivery windows in distinct callout boxes.'
      ],
      forbiddenCliches: [
        'revolutionize',
        'cutting-edge',
        'best in class',
        'groundbreaking',
        'unleash'
      ],
      grammarAndPerspective: 'Conversational second-person with natural contractions (you\'ll, we\'re).',
      ctaStandards: 'Friction-free, low-commitment CTAs ("Check Your Rate in 60 Seconds", "Try Free for 14 Days").',
      citationFormatting: 'Customer-friendly source labels (e.g. "Verified by Trustpilot / BBB").',
      customContentRules: 'Keep legal disclaimers legible in 12px neutral text immediately adjacent to claims.'
    }
  },
  {
    id: 'content-preset-ymyl-regulated',
    name: 'Regulated FinTech & Healthcare (YMYL Strict)',
    description: 'High-rigor factual compliance for banking, loans, medical, and statutory policy standards.',
    category: 'fintech_banking',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      toneOfVoice: 'Objective, clinically precise, legally compliant, and neutral.',
      readabilityLevel: '8th Grade (Plain English eliminating legalistic ambiguity)',
      paragraphConstraints: 'Structured modular sections with distinct statutory disclaimer blocks.',
      formattingRules: [
        'Display APR ranges, processing fees, and representative examples in tabular format.',
        'State regulatory licensing numbers (NMLS, FDIC, RBI, HIPAA) in header or footer.',
        'Never make absolute claims; use conditional qualifiers ("Eligible borrowers may receive").'
      ],
      forbiddenCliches: [
        'guaranteed approval',
        '100% risk-free',
        'instant cash no questions asked',
        'miracle cure',
        'zero hassle guaranteed'
      ],
      grammarAndPerspective: 'Objective third-person and formal second-person.',
      ctaStandards: 'Transparent descriptive CTAs ("View Eligibility & Rates", "Schedule Specialist Consult").',
      citationFormatting: 'Formal statutory citation: [Statute / Regulator Section Ref, Rev. 2025].',
      customContentRules: 'Mandatory inclusion of representative financial examples and licensing caveats.'
    }
  }
];

export const BUILT_IN_SEO_GUIDELINES: SavedSeoGuideline[] = [
  {
    id: 'seo-preset-aio-voice',
    name: 'Modern AI Search & Voice/AEO Optimized',
    description: 'Targeted for Google AI Overviews, Perplexity citations, and conversational voice assistants.',
    category: 'voice_aeo',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      voiceSearchOptimized: true,
      aeoDirectAnswerTarget: true,
      geoLlmCitationFocus: true,
      eeatStandard: 'high',
      titleCharRange: { min: 50, max: 60 },
      metaDescCharRange: { min: 140, max: 160 },
      headingHierarchyRules: 'Strict H1 (1 per page) -> H2 (Conversational Questions with Secondary Keywords) -> H3 (Evidence & Subtopics). No skipped heading levels.',
      schemaRequirements: ['WebPage', 'BreadcrumbList', 'Product', 'Organization', 'FAQPage'],
      sitemapGuidelines: 'Clean XML sitemap with daily changefreq and canonical HTTPS URL.',
      customRules: 'Provide a 40-50 word direct answer paragraph immediately beneath each H2 for voice assistants and AI summary snippets.'
    }
  },
  {
    id: 'seo-preset-strict-eeat',
    name: 'Strict YMYL & LLM Citation Authority',
    description: 'High-authority setup requiring verified schema graphs (Article, Person, Org) and strict metadata limits.',
    category: 'eeat_ymyl',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      voiceSearchOptimized: true,
      aeoDirectAnswerTarget: true,
      geoLlmCitationFocus: true,
      eeatStandard: 'ymyl_strict',
      titleCharRange: { min: 52, max: 58 },
      metaDescCharRange: { min: 145, max: 158 },
      headingHierarchyRules: 'H1 with primary entity name, H2 with question + topical modifier, H3 with evidence and data attribution.',
      schemaRequirements: ['WebPage', 'BreadcrumbList', 'Organization', 'Article', 'Person', 'FAQPage'],
      sitemapGuidelines: 'Daily changefreq, lastmod ISO-8601 timestamps, image tags included.',
      customRules: 'Structured credentials, publication date, reviewer bio, and statutory licenses must be declared in JSON-LD and page markup.'
    }
  },
  {
    id: 'seo-preset-ecommerce',
    name: 'E-Commerce & Product Catalog SEO Standard',
    description: 'Tailored for transactional pages, product catalogs, rich snippets, and Google Merchant indexing.',
    category: 'e_commerce',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      voiceSearchOptimized: true,
      aeoDirectAnswerTarget: true,
      geoLlmCitationFocus: false,
      eeatStandard: 'standard',
      titleCharRange: { min: 48, max: 60 },
      metaDescCharRange: { min: 135, max: 155 },
      headingHierarchyRules: 'H1: Product Brand & Model Name; H2: Key Specifications, Pricing & Financing, Verified Customer Reviews, FAQ.',
      schemaRequirements: ['Product', 'Offer', 'AggregateRating', 'BreadcrumbList', 'Organization', 'FAQPage'],
      sitemapGuidelines: 'Hourly auto-generated sitemap with image captions and product availability status.',
      customRules: 'Include in-stock availability, price currency, delivery estimates, and return policies in schema.'
    }
  }
];

export const BUILT_IN_GEO_GUIDELINES: SavedGeoGuideline[] = [
  {
    id: 'geo-preset-master-citation',
    name: 'Perplexity & ChatGPT Search Citation Master',
    description: 'Engineered for AI answer engines with BLUF direct answers, authoritative statistics, and structured source anchors.',
    category: 'ai_engines',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      enableGeoOptimization: true,
      blufDirectAnswerTarget: true,
      authoritativeStatistics: true,
      aiOverviewSnippetFormat: 'definitive_paragraph',
      targetEngines: ['google_aio', 'perplexity', 'chatgpt_search', 'gemini_research'],
      llmCitationStrategy: 'Anchor authoritative source name, publication date, and methodology immediately following any numerical or regulatory claim.',
      entityDensityAndSchema: 'Connect Primary Entity to parent Knowledge Graph entity using sameAs Wikidata and Crunchbase links.',
      brandQuotationStandard: 'Incorporate verified corporate statements or executive quotes with credential attribution.',
      sourceVerificationStyle: 'Direct inline citations linked to primary governmental, academic, or industry benchmark sources.',
      forbiddenAiPatterns: [
        'as an ai language model',
        'it is important to remember',
        'in conclusion',
        'furthermore without context'
      ],
      customGeoRules: 'Inject high-density factual answers in the first 45 words of every major section.',
      statDensityRequirement: 'At least 1 verified metric or statistic per 150 words of body content.',
      directAnswerStandard: '40-50 word Bottom Line Up Front (BLUF) direct answers answering user search intent.',
      sourceAttributionStandard: 'Formal regulatory, academic, or certified third-party audit reports.',
      multiPerspectiveRequirement: 'Present structured comparison matrices or tables for LLM citation extraction.'
    }
  },
  {
    id: 'geo-preset-aio-bullet',
    name: 'Google AI Overviews & SGE Snippet Dominance',
    description: 'Optimized for Google SGE / AI Overviews with concise bullet summaries, fast facts, and schema grounding.',
    category: 'google_aio',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      enableGeoOptimization: true,
      blufDirectAnswerTarget: true,
      authoritativeStatistics: true,
      aiOverviewSnippetFormat: 'bullet_summary',
      targetEngines: ['google_aio', 'gemini_research'],
      llmCitationStrategy: 'Use bold keyword anchors followed by short definitive explanations optimized for multi-source synthesis.',
      entityDensityAndSchema: 'High entity density matching Google Knowledge Graph concepts with clear schema markup.',
      brandQuotationStandard: 'Short, quotable expert soundbites with author credentials and organization name.',
      sourceVerificationStyle: 'Primary industry source attribution with publication year.',
      forbiddenAiPatterns: ['it is worth noting', 'dive deep into', 'unprecedented growth without numbers'],
      customGeoRules: 'Break down complex topics into clear numbered or bulleted criteria.',
      statDensityRequirement: 'Include verified quantitative metrics in introductory summary blocks.',
      directAnswerStandard: 'Bullet summaries with bold lead-ins answering specific question queries.',
      sourceAttributionStandard: 'Industry benchmark reports and regulatory filings.',
      multiPerspectiveRequirement: 'Comparative feature matrices for easy LLM table synthesis.'
    }
  }
];

export const BUILT_IN_PRODUCT_GUIDELINES: SavedProductGuideline[] = [
  {
    id: 'product-preset-fintech-loans',
    name: 'FinTech Personal Loans & Credit Services',
    description: 'Comprehensive guidelines for personal lending, credit cards, fixed APR ranges, and statutory lending disclosures.',
    category: 'fintech_banking',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      productName: 'Personal Loan & Credit Line Platform',
      brandName: 'Bajaj Finance',
      category: 'Banking, Financial Services & Insurance (BFSI)',
      targetAudience: 'Salaried professionals, self-employed individuals, and credit-conscious consumers seeking flexible borrowing.',
      toneOfVoice: 'Reassuring, transparent, legally compliant, and empowering.',
      uniqueSellingPoints: [
        'Instant pre-qualification without impacting credit score',
        'Same-day direct bank disbursement upon digital KYC verification',
        'Zero prepayment penalties or hidden monthly management fees',
        '100% paperless encrypted application completed in under 5 minutes'
      ],
      coreValueProps: [
        'Transparent fixed APR from 8.99% to 24.99% based on credit profile',
        'Flexible repayment tenures from 12 to 60 months with customizable EMI plans',
        'Direct bank-grade 256-bit AES encryption with SOC-2 compliance'
      ],
      forbiddenPhrases: [
        'guaranteed approval',
        '100% free loan',
        'instant cash no questions asked',
        'no credit check required',
        'zero risk investment',
        'free money'
      ],
      complianceNotes: 'All loan rates, tenure options, processing fees (1.5%), and Representative APR examples must be clearly stated adjacent to loan calculators. Must comply with statutory lending disclosures.',
      eeatCredentials: 'Licensed Lending Partner (NMLS #194820), ISO 27001 Certified, FDIC/RBI Regulatory compliant banking infrastructure.'
    }
  },
  {
    id: 'product-preset-enterprise-saas',
    name: 'Enterprise Cloud & B2B SaaS Platform',
    description: 'Enterprise guidelines for IT leadership, cybersecurity compliance (SOC-2, HIPAA), and SLA performance.',
    category: 'b2b_saas',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      productName: 'NextGen Cloud Intelligence & Automation Platform',
      category: 'B2B Enterprise Software & Cloud Infrastructure',
      targetAudience: 'Chief Information Officers (CIOs), CTOs, VP of Engineering, and Enterprise DevOps Directors.',
      toneOfVoice: 'Authoritative, technical, consultative, and performance-oriented.',
      uniqueSellingPoints: [
        'Sub-50ms query latency across multi-petabyte distributed datasets',
        'Native private cloud VPC integrations with AWS, Google Cloud, and Azure',
        'Automated zero-downtime schema migrations and automated failover clustering',
        'End-to-end telemetry observability with AI-driven root-cause diagnostics'
      ],
      coreValueProps: [
        'Contractually guaranteed 99.99% uptime SLA with financial backing',
        'Certified compliance with SOC-2 Type II, HIPAA, ISO 27001, and GDPR',
        'Enterprise Single Sign-On (SSO) with Okta, Azure AD, and PingIdentity SAML'
      ],
      forbiddenPhrases: [
        'the only tool you will ever need',
        'instant magic results',
        'unlimited everything for free',
        'cheapest cloud on earth',
        'works with 100% zero effort'
      ],
      complianceNotes: 'Do not claim proprietary patents without registered verification. SOC-2 Type II audit reports available under mutual NDA.',
      eeatCredentials: 'SOC-2 Type II Certified (2025), ISO/IEC 27001:2022, FedRAMP In-Process, trusted by 40+ Fortune 500 engineering teams.'
    }
  },
  {
    id: 'product-preset-healthcare-wellness',
    name: 'Clinical Healthcare & Telehealth Services',
    description: 'Guidelines for medical practices, telehealth consultations, doctor credentials, and HIPAA compliance.',
    category: 'healthcare',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      productName: 'Telehealth & Digital Clinical Consultation Care',
      category: 'Healthcare, Clinical & Telemedicine Services',
      targetAudience: 'Patients seeking licensed specialist consultations, ongoing chronic care support, and digital prescription refills.',
      toneOfVoice: 'Compassionate, scientifically rigorous, reassuring, and clinically accurate.',
      uniqueSellingPoints: [
        'Board-certified licensed physicians and specialists available 24/7/365',
        'HIPAA-compliant end-to-end encrypted HD video consultations',
        'Direct prescription routing to your local pharmacy in under 2 hours',
        'In-network coverage accepted by 80+ leading national health insurers'
      ],
      coreValueProps: [
        'Average clinical wait time under 15 minutes without an appointment',
        'Secure centralized digital medical record storage accessible from any device',
        'Transparent copay pricing displayed upfront prior to consultation'
      ],
      forbiddenPhrases: [
        'miracle cure',
        '100% guaranteed remedy',
        'treats all diseases permanently',
        'replaces emergency medical hospital care',
        'no doctor consultation needed'
      ],
      complianceNotes: 'Telehealth consultations are not intended for medical emergencies. In life-threatening emergencies, patients must be directed to call 911 immediately.',
      eeatCredentials: 'Board-Certified Medical Review Board, HIPAA Compliant Infrastructure, LegitScript Certified Healthcare Merchant.'
    }
  }
];

export const BUILT_IN_CUSTOMER_CENTRICITY_GUIDELINES: SavedCustomerCentricityGuideline[] = [
  {
    id: 'customer-preset-ymyl-empathy',
    name: 'Empathetic Consumer & YMYL Transparency',
    description: 'Designed for high-trust financial and sensitive decisions. Low cognitive load, proactive objection handling, and clear reassurance.',
    category: 'financial_ymyl',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      targetCustomerPersona: 'Credit-conscious consumers and families navigating critical financial or life decisions.',
      empathyAndTone: 'Reassuring, compassionate, transparent, and non-judgmental. Eliminate sales pressure.',
      readingAccessibility: '8th-Grade layman readability (Flesch-Kincaid 60-70). Explain every financial/technical acronym immediately.',
      maxSentenceWords: 20,
      maxParagraphSentences: 3,
      corePainPointsToAddress: [
        'Fear of hidden origination or processing fees',
        'Anxiety about credit score hit during rate checks',
        'Unclear repayment schedules or compounding interest',
        'Unresponsive customer support during urgent disputes'
      ],
      frictionPatternsToFlag: [
        'Buried fee disclosures or asterisks without direct explanation',
        'Aggressive countdown/false scarcity timers',
        'Vague APR claims like "Rates as low as...*" without typical ranges',
        'Complex run-on multi-clause sentences (>20 words)',
        'Missing human contact phone or dispute assistance details'
      ],
      decisionJourneyOrder: '1. Soft-Check Reassurance -> 2. Transparent Cost Calculator -> 3. Simple 3-Step Process -> 4. Clear FAQ & Human Support Access',
      objectionHandlingRules: [
        'Proactively explain eligibility if credit score is below average',
        'Directly state there are zero penalties for early prepayment or payoff',
        'Clarify state licensing, security standards, and FDIC/partner bank backing'
      ],
      trustAndReassuranceSignals: [
        '"No impact on credit score" soft check badge',
        '256-bit SSL bank-grade security encryption',
        'Dedicated toll-free human phone support with hours',
        'BBB / Trustpilot verified rating badge',
        'Full statutory licensing & APR disclosure block'
      ],
      scoringWeights: {
        laymanAccessibilityWeight: 30,
        objectionHandlingWeight: 25,
        frictionEliminationWeight: 25,
        journeyStructureWeight: 20
      },
      customCustomerRules: 'Every rate quote must display an illustrative APR example with representative loan terms and total repayment calculation.'
    }
  },
  {
    id: 'customer-preset-b2b-executive',
    name: 'B2B Decision-Maker & ROI Clarity',
    description: 'Engineered for enterprise buyers and IT procurement teams. Zero fluff, rapid value comprehension, and clear technical validation.',
    category: 'b2b_enterprise',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      targetCustomerPersona: 'Busy VP/Director-level buyers, IT security officers, and operations managers evaluating team software.',
      empathyAndTone: 'Respectful of time, pragmatic, consultative, and evidence-driven. Speaks to business outcomes.',
      readingAccessibility: 'Professional yet direct (8th-10th grade). Zero buzzwords, acronym soup, or generic marketing superlatives.',
      maxSentenceWords: 22,
      maxParagraphSentences: 3,
      corePainPointsToAddress: [
        'Implementation timeline and migration downtime',
        'SOC-2/GDPR compliance and data residency',
        'Total cost of ownership and seat expansion costs',
        'User adoption curve and team onboarding training'
      ],
      frictionPatternsToFlag: [
        'Gated pricing without ballpark starting tier',
        'Generic "request a demo" forms with >6 required fields',
        'Vague claims lacking quantitative customer proof',
        'Unclear distinction between plans or tiers'
      ],
      decisionJourneyOrder: '1. Executive BLUF Summary & Target Problem -> 2. Quantified ROI & Customer Proof -> 3. Architecture & Integration Compatibility -> 4. Transparent Tier Comparison -> 5. Frictionless Trial CTA',
      objectionHandlingRules: [
        'Clarify enterprise SSO, SCIM, and role-based access control availability',
        'State average time-to-value (e.g. deployed in under 14 days)',
        'Detail API reliability, uptime SLA (99.99%), and SOC-2 Type II audit report access'
      ],
      trustAndReassuranceSignals: [
        'Enterprise SOC-2 Type II / ISO 27001 verified compliance',
        'Customer case studies with verified ROI percentages',
        'Dedicated enterprise customer success manager SLA',
        '99.99% guaranteed uptime status page link'
      ],
      scoringWeights: {
        laymanAccessibilityWeight: 25,
        objectionHandlingWeight: 30,
        frictionEliminationWeight: 25,
        journeyStructureWeight: 20
      },
      customCustomerRules: 'Address procurement readiness and security checklist items directly in a dedicated enterprise trust section.'
    }
  },
  {
    id: 'customer-preset-d2c-shopper',
    name: 'Frictionless D2C E-Commerce Shopper',
    description: 'Designed for modern online shoppers. Instant reassurance on shipping, returns, sizing/compatibility, and checkout confidence.',
    category: 'ecommerce',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      targetCustomerPersona: 'Mobile-first shoppers comparing products quickly and seeking immediate purchase confidence.',
      empathyAndTone: 'Friendly, enthusiastic, direct, and helpful. Warm and authentic.',
      readingAccessibility: '6th-8th grade reading level. Highly visual, scannable bullet points and bold specs.',
      maxSentenceWords: 18,
      maxParagraphSentences: 2,
      corePainPointsToAddress: [
        'Unexpected shipping costs added at checkout',
        'Complicated or expensive return policies',
        'Doubt over sizing, compatibility, or authenticity',
        'Slow delivery times'
      ],
      frictionPatternsToFlag: [
        'Hidden shipping charges or surprise cart surcharges',
        'Missing dimensions or compatibility matrix',
        'Complex return terms with restocking fees',
        'Absence of real customer photo reviews'
      ],
      decisionJourneyOrder: '1. Hero Visual & Key Value -> 2. Transparent Pricing & In-Stock Status -> 3. Verified Reviews & Rating Breakdown -> 4. Free Shipping & 30-Day Return Guarantee -> 5. 1-Click Secure Checkout',
      objectionHandlingRules: [
        'State exact shipping transit times and cutoff hours',
        'Reassure with 30-day no-questions-asked refund policy',
        'Provide clear size/fit guide or compatibility finder'
      ],
      trustAndReassuranceSignals: [
        'Free shipping over $50 guarantee',
        '30-day money-back satisfaction guarantee',
        'Verified customer review badges with star ratings',
        'Secure payment badges (Apple Pay, PayPal, Visa, Mastercard)'
      ],
      scoringWeights: {
        laymanAccessibilityWeight: 35,
        objectionHandlingWeight: 20,
        frictionEliminationWeight: 30,
        journeyStructureWeight: 15
      },
      customCustomerRules: 'Include shipping speed and return policy within 1 viewport of the primary Add-to-Cart / Buy button.'
    }
  }
];

export const BUILT_IN_STRUCTURE_MAPPING_GUIDELINES: SavedStructureMappingGuideline[] = [
  {
    id: 'structure-preset-voice-aeo',
    name: 'High-Intent Commercial & Voice AEO Architecture',
    description: 'Structured for high search volume capture, single H1 anchor, conversational question H2/H3s, and direct AEO voice snippets.',
    category: 'voice_aeo',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      headingHierarchyRule: 'Strict single H1 topic anchor -> H2 major search-volume chapters -> H3 conversational voice queries. Never skip heading levels (no H2 directly into H4).',
      requirePrimaryKeywordInH1: true,
      minKeywordFrequency: 2,
      maxKeywordDensityPercent: 2.8,
      targetKeywordsInHeadingsMinPercent: 80,
      headingWordCountLimit: { min: 4, max: 10 },
      voiceQuestionHeadingsTarget: 40,
      preferredSectionOrder: [
        'Hero Definition & Core Search Intent (H1)',
        'Key Benefits & Quantified Performance (H2)',
        'How It Works / 3-Step Process (H2)',
        'Feature Breakdown & Comparative Matrix (H2)',
        'Frequent Voice Questions & Direct BLUF Answers (H2)',
        'Customer Reviews & Verified Proof (H2)',
        'Final Call to Action (H2)'
      ],
      searchIntentMappingStrategy: 'Primary high-volume commercial keywords mapped to H1 and first H2; secondary informational and voice question long-tail keywords mapped to H3 FAQ sections.',
      keywordDistributionRules: 'Primary target keyword in H1, first paragraph, and at least one H2. Target secondary keywords distributed evenly across body sub-sections with no clustering.',
      customStructureRules: 'Every question-based H2/H3 heading must be immediately followed by a concise 40-50 word direct answer paragraph suitable for voice assistants.'
    }
  },
  {
    id: 'structure-preset-enterprise-authority',
    name: 'Comprehensive Enterprise Authority Matrix',
    description: 'Deep topical authority hierarchy with systematic feature breakdown, comparison tables, and exhaustive technical drilldowns.',
    category: 'enterprise',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      headingHierarchyRule: 'Definitive H1 product/service title -> H2 thematic silos (Capabilities, Security, Pricing, Integrations) -> H3 feature specifications.',
      requirePrimaryKeywordInH1: true,
      minKeywordFrequency: 3,
      maxKeywordDensityPercent: 2.5,
      targetKeywordsInHeadingsMinPercent: 75,
      headingWordCountLimit: { min: 3, max: 9 },
      voiceQuestionHeadingsTarget: 25,
      preferredSectionOrder: [
        'Product Overview & Value Proposition (H1)',
        'Core Capabilities & Architecture (H2)',
        'Enterprise Security, Compliance & Governance (H2)',
        'Integrations & Ecosystem Workflow (H2)',
        'Pricing Tiers & Feature Matrix (H2)',
        'Frequently Asked Technical Questions (H2)',
        'Implementation & Next Steps (H2)'
      ],
      searchIntentMappingStrategy: 'Categorical solutions keywords in H1/H2; feature-specific search queries in H3; competitor comparison queries in pricing/matrix sections.',
      keywordDistributionRules: 'Distribute primary and LSI terms across logical topical silos. Ensure each H2 section contains at least 2 distinct mapped keywords.',
      customStructureRules: 'Include a structured markdown comparison table under the feature and pricing sections.'
    }
  },
  {
    id: 'structure-preset-conversion-landing',
    name: 'Conversion-Focused Modular Landing Page',
    description: 'Streamlined single-page hierarchy designed for fast scannability, commercial keyword density, and rapid conversion.',
    category: 'conversion',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    guidelines: {
      headingHierarchyRule: 'Single high-impact H1 value proposition -> H2 core proof chapters -> H3 detail bullets. Keep headings punchy and benefit-driven.',
      requirePrimaryKeywordInH1: true,
      minKeywordFrequency: 2,
      maxKeywordDensityPercent: 3.0,
      targetKeywordsInHeadingsMinPercent: 70,
      headingWordCountLimit: { min: 3, max: 8 },
      voiceQuestionHeadingsTarget: 30,
      preferredSectionOrder: [
        'Hero Value Anchor (H1)',
        'Immediate Pain Point & Solution Overview (H2)',
        'Core Advantages & Customer Outcomes (H2)',
        'Interactive Calculator / Comparison (H2)',
        'Frequently Asked Questions (H2)',
        'Risk-Free Guarantee & Application CTA (H2)'
      ],
      searchIntentMappingStrategy: 'Focus on transactional and commercial investigation queries across all headings. Relegate pure informational keywords to FAQ.',
      keywordDistributionRules: 'Primary keyword in H1, first CTA anchor, and conclusion. Secondary keywords in subheadings and benefit list headers.',
      customStructureRules: 'Keep all body paragraphs under 40 words with bold lead-ins for rapid visual scanning.'
    }
  }
];

export const BUILT_IN_PROFILES: GuidelineProfile[] = [
  {
    id: 'profile-fintech-personal-loans',
    name: 'FinTech Personal Loans & Credit',
    description: 'Pre-configured compliance and SEO guidelines for banking, lending, APR disclosures, and voice AEO.',
    category: 'custom',
    isBuiltIn: true,
    contentGuidelines: BUILT_IN_CONTENT_GUIDELINES[2].guidelines,
    productGuidelines: BUILT_IN_PRODUCT_GUIDELINES[0].guidelines,
    seoGuidelines: BUILT_IN_SEO_GUIDELINES[0].guidelines,
    geoGuidelines: BUILT_IN_GEO_GUIDELINES[0].guidelines,
    customerCentricityGuidelines: BUILT_IN_CUSTOMER_CENTRICITY_GUIDELINES[0].guidelines,
    structureMappingGuidelines: BUILT_IN_STRUCTURE_MAPPING_GUIDELINES[0].guidelines,
    keywords: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'profile-enterprise-b2b-saas',
    name: 'Enterprise Cloud & B2B SaaS',
    description: 'Optimized for high-intent B2B decision makers, technical E-E-A-T, and Perplexity/ChatGPT LLM citations.',
    category: 'saas',
    isBuiltIn: true,
    contentGuidelines: BUILT_IN_CONTENT_GUIDELINES[0].guidelines,
    productGuidelines: BUILT_IN_PRODUCT_GUIDELINES[1].guidelines,
    seoGuidelines: BUILT_IN_SEO_GUIDELINES[1].guidelines,
    geoGuidelines: BUILT_IN_GEO_GUIDELINES[0].guidelines,
    customerCentricityGuidelines: BUILT_IN_CUSTOMER_CENTRICITY_GUIDELINES[1].guidelines,
    structureMappingGuidelines: BUILT_IN_STRUCTURE_MAPPING_GUIDELINES[1].guidelines,
    keywords: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

// ---------------------------------------------------------------
// Bajaj Finserv verticals come first: this is an internal Bajaj Finserv tool.
// ---------------------------------------------------------------
BUILT_IN_CONTENT_GUIDELINES.unshift(BAJAJ_CONTENT_PRESET);
BUILT_IN_PRODUCT_GUIDELINES.unshift(...BAJAJ_PRODUCT_PRESETS);

const bajajProfile = (productPresetId: string, readerContext: string): GuidelineProfile => {
  const productPreset = findById(BUILT_IN_PRODUCT_GUIDELINES, productPresetId)!;
  return {
    id: productPresetId.replace('bfl-product-', 'bfl-profile-'),
    name: productPreset.name,
    description: productPreset.description || '',
    category: 'bajaj_finserv',
    isBuiltIn: true,
    contentGuidelines: BAJAJ_CONTENT_PRESET.guidelines,
    productGuidelines: productPreset.guidelines,
    seoGuidelines: findById(BUILT_IN_SEO_GUIDELINES, 'seo-preset-strict-eeat')!.guidelines,
    geoGuidelines: findById(BUILT_IN_GEO_GUIDELINES, 'geo-preset-master-citation')!.guidelines,
    customerCentricityGuidelines: findById(BUILT_IN_CUSTOMER_CENTRICITY_GUIDELINES, 'customer-preset-ymyl-empathy')!.guidelines,
    structureMappingGuidelines: findById(BUILT_IN_STRUCTURE_MAPPING_GUIDELINES, 'structure-preset-voice-aeo')!.guidelines,
    keywords: [],
    readerContext,
    createdAt: '2026-10-20T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
  };
};

export const BAJAJ_PROFILES: GuidelineProfile[] = [
  bajajProfile('bfl-product-personal-loan', 'Indian borrower comparing personal loan rates, eligibility and repayment before applying.'),
  bajajProfile('bfl-product-business-loan', 'Small business owner who needs funds quickly and wants clear eligibility and costs.'),
  bajajProfile('bfl-product-home-loan', 'Home buyer comparing lenders on rates, tenure, documents and balance transfer.'),
  bajajProfile('bfl-product-gold-loan', 'Customer who needs short-term funds against gold and worries about safety of jewellery.'),
  bajajProfile('bfl-product-fixed-deposit', 'Saver or senior citizen comparing FD returns, safety and withdrawal rules.'),
  bajajProfile('bfl-product-insta-emi-card', 'Shopper who wants to buy on EMI and needs to understand fees and partner stores.'),
  bajajProfile('bfl-product-credit-card', 'Customer comparing credit card rewards, fees and eligibility.'),
  bajajProfile('bfl-product-insurance', 'Family comparing insurance cover, premiums, exclusions and claim support.'),
  bajajProfile('bfl-product-mutual-funds', 'Investor exploring SIPs who needs risk explained plainly and costs made clear.'),
];
BUILT_IN_PROFILES.unshift(...BAJAJ_PROFILES);

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
    isBuiltIn: Boolean(p?.isBuiltIn),
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

export function loadStoredProfiles(): GuidelineProfile[] {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY_PROFILES) || localStorage.getItem('seo_guideline_profiles_v4');
    if (!rawData) {
      return BUILT_IN_PROFILES.map(sanitizeProfile);
    }
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const ids = new Set(parsed.map((p: any) => p?.id));
      const missing = BUILT_IN_PROFILES.filter((b) => !ids.has(b.id));
      const missingBajaj = missing.filter((b) => b.category === 'bajaj_finserv');
      const missingOther = missing.filter((b) => b.category !== 'bajaj_finserv');
      return [...missingBajaj, ...parsed, ...missingOther].map(sanitizeProfile);
    }
    return BUILT_IN_PROFILES.map(sanitizeProfile);
  } catch (err) {
    console.warn('Failed to load profiles from localStorage:', err);
    return BUILT_IN_PROFILES.map(sanitizeProfile);
  }
}

export function saveProfilesToStorage(profiles: GuidelineProfile[]): void {
  try {
    const sanitized = (profiles || []).map(sanitizeProfile);
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(sanitized));
  } catch (err) {
    console.warn('Failed to save profiles to localStorage:', err);
  }
}

export function loadGlobalContentGuidelines(): ContentGuidelines {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOBAL_CONTENT);
    if (raw) {
      return sanitizeContentGuidelines(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Failed to load global content guidelines:', e);
  }
  return sanitizeContentGuidelines(BUILT_IN_CONTENT_GUIDELINES[0]?.guidelines || DEFAULT_CONTENT_GUIDELINES);
}

export function saveGlobalContentGuidelines(guidelines: ContentGuidelines): void {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_CONTENT, JSON.stringify(guidelines));
  } catch (e) {
    console.warn('Failed to save global content guidelines:', e);
  }
}

export function loadSavedContentPresets(): SavedContentGuideline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_CONTENT_PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customIds = new Set(parsed.map((p: any) => p.id));
        const missingBuiltIns = BUILT_IN_CONTENT_GUIDELINES.filter(b => !customIds.has(b.id));
        return [...parsed, ...missingBuiltIns];
      }
    }
  } catch (e) {
    console.warn('Failed to load saved content presets:', e);
  }
  return [...BUILT_IN_CONTENT_GUIDELINES];
}

export function saveSavedContentPresets(presets: SavedContentGuideline[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_CONTENT_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save content presets:', e);
  }
}

export function loadGlobalSeoGuidelines(): SEOGuidelines {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOBAL_SEO);
    if (raw) {
      return sanitizeSeoGuidelines(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Failed to load global SEO guidelines:', e);
  }
  return sanitizeSeoGuidelines(BUILT_IN_SEO_GUIDELINES[0]?.guidelines || DEFAULT_SEO_GUIDELINES);
}

export function saveGlobalSeoGuidelines(guidelines: SEOGuidelines): void {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_SEO, JSON.stringify(guidelines));
  } catch (e) {
    console.warn('Failed to save global SEO guidelines:', e);
  }
}

export function loadSavedSeoPresets(): SavedSeoGuideline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_SEO_PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customIds = new Set(parsed.map((p: any) => p.id));
        const missingBuiltIns = BUILT_IN_SEO_GUIDELINES.filter(b => !customIds.has(b.id));
        return [...parsed, ...missingBuiltIns];
      }
    }
  } catch (e) {
    console.warn('Failed to load saved SEO presets:', e);
  }
  return [...BUILT_IN_SEO_GUIDELINES];
}

export function saveSavedSeoPresets(presets: SavedSeoGuideline[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_SEO_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save SEO presets:', e);
  }
}

export function loadGlobalGeoGuidelines(): GEOGuidelines {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOBAL_GEO);
    if (raw) {
      return sanitizeGeoGuidelines(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Failed to load global GEO guidelines:', e);
  }
  return sanitizeGeoGuidelines(BUILT_IN_GEO_GUIDELINES[0]?.guidelines || DEFAULT_GEO_GUIDELINES);
}

export function saveGlobalGeoGuidelines(guidelines: GEOGuidelines): void {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_GEO, JSON.stringify(guidelines));
  } catch (e) {
    console.warn('Failed to save global GEO guidelines:', e);
  }
}

export function loadSavedGeoPresets(): SavedGeoGuideline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_GEO_PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customIds = new Set(parsed.map((p: any) => p.id));
        const missingBuiltIns = BUILT_IN_GEO_GUIDELINES.filter(b => !customIds.has(b.id));
        return [...parsed, ...missingBuiltIns];
      }
    }
  } catch (e) {
    console.warn('Failed to load saved GEO presets:', e);
  }
  return [...BUILT_IN_GEO_GUIDELINES];
}

export function saveSavedGeoPresets(presets: SavedGeoGuideline[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_GEO_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save GEO presets:', e);
  }
}

export function loadSavedProductPresets(): SavedProductGuideline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_PRODUCT_PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customIds = new Set(parsed.map((p: any) => p.id));
        const missingBuiltIns = BUILT_IN_PRODUCT_GUIDELINES.filter(b => !customIds.has(b.id));
        return [...parsed, ...missingBuiltIns];
      }
    }
  } catch (e) {
    console.warn('Failed to load saved Product presets:', e);
  }
  return [...BUILT_IN_PRODUCT_GUIDELINES];
}

export function saveSavedProductPresets(presets: SavedProductGuideline[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_PRODUCT_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save Product presets:', e);
  }
}

export function loadWorkingProductGuidelines(profiles?: GuidelineProfile[], activeProfileId?: string): ProductGuidelines {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKING_PRODUCT);
    if (raw) {
      return sanitizeProductGuidelines(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Failed to load working product guidelines:', e);
  }
  if (Array.isArray(profiles) && activeProfileId) {
    const active = profiles.find(p => p.id === activeProfileId);
    if (active) return sanitizeProductGuidelines(active.productGuidelines);
  }
  if (Array.isArray(profiles) && profiles.length > 0) {
    return sanitizeProductGuidelines(profiles[0].productGuidelines);
  }
  return sanitizeProductGuidelines(BUILT_IN_PRODUCT_GUIDELINES[0]?.guidelines || DEFAULT_PRODUCT_GUIDELINES);
}

export function saveWorkingProductGuidelines(guidelines: ProductGuidelines): void {
  try {
    localStorage.setItem(STORAGE_KEY_WORKING_PRODUCT, JSON.stringify(guidelines));
  } catch (e) {
    console.warn('Failed to save working product guidelines:', e);
  }
}

export function loadGlobalCustomerCentricityGuidelines(): CustomerCentricityGuidelines {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOBAL_CUSTOMER_CENTRICITY);
    if (raw) {
      return sanitizeCustomerCentricityGuidelines(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Failed to load global customer centricity guidelines:', e);
  }
  return sanitizeCustomerCentricityGuidelines(BUILT_IN_CUSTOMER_CENTRICITY_GUIDELINES[0]?.guidelines || DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES);
}

export function saveGlobalCustomerCentricityGuidelines(guidelines: CustomerCentricityGuidelines): void {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_CUSTOMER_CENTRICITY, JSON.stringify(guidelines));
  } catch (e) {
    console.warn('Failed to save global customer centricity guidelines:', e);
  }
}

export function loadSavedCustomerCentricityPresets(): SavedCustomerCentricityGuideline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_CUSTOMER_CENTRICITY_PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customIds = new Set(parsed.map((p: any) => p.id));
        const missingBuiltIns = BUILT_IN_CUSTOMER_CENTRICITY_GUIDELINES.filter(b => !customIds.has(b.id));
        return [...parsed, ...missingBuiltIns];
      }
    }
  } catch (e) {
    console.warn('Failed to load saved customer centricity presets:', e);
  }
  return [...BUILT_IN_CUSTOMER_CENTRICITY_GUIDELINES];
}

export function saveSavedCustomerCentricityPresets(presets: SavedCustomerCentricityGuideline[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_CUSTOMER_CENTRICITY_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save customer centricity presets:', e);
  }
}

export function loadGlobalStructureMappingGuidelines(): StructureMappingGuidelines {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOBAL_STRUCTURE_MAPPING);
    if (raw) {
      return sanitizeStructureMappingGuidelines(JSON.parse(raw));
    }
  } catch (e) {
    console.warn('Failed to load global structure mapping guidelines:', e);
  }
  return sanitizeStructureMappingGuidelines(BUILT_IN_STRUCTURE_MAPPING_GUIDELINES[0]?.guidelines || DEFAULT_STRUCTURE_MAPPING_GUIDELINES);
}

export function saveGlobalStructureMappingGuidelines(guidelines: StructureMappingGuidelines): void {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_STRUCTURE_MAPPING, JSON.stringify(guidelines));
  } catch (e) {
    console.warn('Failed to save global structure mapping guidelines:', e);
  }
}

export function loadSavedStructureMappingPresets(): SavedStructureMappingGuideline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_STRUCTURE_MAPPING_PRESETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const customIds = new Set(parsed.map((p: any) => p.id));
        const missingBuiltIns = BUILT_IN_STRUCTURE_MAPPING_GUIDELINES.filter(b => !customIds.has(b.id));
        return [...parsed, ...missingBuiltIns];
      }
    }
  } catch (e) {
    console.warn('Failed to load saved structure mapping presets:', e);
  }
  return [...BUILT_IN_STRUCTURE_MAPPING_GUIDELINES];
}

export function saveSavedStructureMappingPresets(presets: SavedStructureMappingGuideline[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_STRUCTURE_MAPPING_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.warn('Failed to save structure mapping presets:', e);
  }
}

export function resetToDefaultProfiles(): GuidelineProfile[] {
  try {
    localStorage.removeItem(STORAGE_KEY_PROFILES);
    localStorage.removeItem(STORAGE_KEY_GLOBAL_CONTENT);
    localStorage.removeItem(STORAGE_KEY_GLOBAL_SEO);
    localStorage.removeItem(STORAGE_KEY_GLOBAL_GEO);
    localStorage.removeItem(STORAGE_KEY_GLOBAL_CUSTOMER_CENTRICITY);
    localStorage.removeItem(STORAGE_KEY_GLOBAL_STRUCTURE_MAPPING);
    localStorage.removeItem(STORAGE_KEY_WORKING_PRODUCT);
    localStorage.removeItem(STORAGE_KEY_SAVED_CONTENT_PRESETS);
    localStorage.removeItem(STORAGE_KEY_SAVED_SEO_PRESETS);
    localStorage.removeItem(STORAGE_KEY_SAVED_GEO_PRESETS);
    localStorage.removeItem(STORAGE_KEY_SAVED_PRODUCT_PRESETS);
    localStorage.removeItem(STORAGE_KEY_SAVED_CUSTOMER_CENTRICITY_PRESETS);
    localStorage.removeItem(STORAGE_KEY_SAVED_STRUCTURE_MAPPING_PRESETS);
    localStorage.removeItem('seo_guideline_profiles_v4');
    localStorage.removeItem('seo_guideline_profiles_v3');
    localStorage.removeItem('seo_guideline_profiles_v2');
    localStorage.removeItem('seo_guideline_profiles_v1');
  } catch (err) {
    console.warn('Failed to clear storage:', err);
  }
  return BUILT_IN_PROFILES.map(sanitizeProfile);
}
