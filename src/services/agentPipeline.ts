import { Type } from "@google/genai";
import { generate, extractJson, llmAvailable, routeFor, runContext, setTestClient, type LlmJob } from "./llm";
import * as cheerio from "cheerio";
import { 
  ExtractedPageData, 
  MediaPresence,
  AuditFlag, 
  HeadingKeywordPlan, 
  VerificationResult, 
  AgentExecutionLog,
  OrchestratorReport,
  AgentScoreBreakdown,
  AuditSummary,
  SEOBackendData,
  ContentComponent,
  ProductGuidelines,
  SEOGuidelines,
  ContentGuidelines,
  GEOGuidelines,
  CustomerCentricityGuidelines,
  StructureMappingGuidelines,
  KeywordItem,
  AgentMessagePacket,
  NineAgentScores,
  ScoreSnapshot,
  GuidelineSectionType,
  PageDraft,
  GateResult,
  GateAgentId,
  MakerFeedbackItem,
  PipelineRound,
  PipelineProgressEvent,
  PipelineVerdict,
  FlagSeverity
} from "../types";
import { 
  calculateNineAgentScores, 
  buildAgentScoreBreakdown, 
  buildScoreSnapshot 
} from "./scoringEngine";
import { 
  createMessagePacket, 
  runDeterministicAntiHallucinationChecks,
  AGENT_ROLE_DEFINITIONS 
} from "./agentRoles";
import { 
  DEFAULT_CONTENT_GUIDELINES, 
  DEFAULT_PRODUCT_GUIDELINES, 
  DEFAULT_SEO_GUIDELINES,
  DEFAULT_GEO_GUIDELINES,
  DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES,
  DEFAULT_STRUCTURE_MAPPING_GUIDELINES,
  DEFAULT_BACKEND_SEO
} from "../data/defaults";
import {
  sanitizeGrammarAndPunctuation,
  detectProductNameFromContext
} from "../utils/grammarSanitizer";
import {
  buildDraftSchema,
  checkHeadingStructure,
  coercePageDraft,
  componentsToMarkdown,
  draftPlainText,
  draftToComponent,
  draftToExtracted,
  draftToMarkdown,
  findUnsupportedFigures,
  parseSchemaBlocks,
  componentToDraft,
  mergeDraftByScope,
  notesInScope,
  scopeInstruction,
  diffDrafts,
  RevisionScope,
  DraftChange,
} from "./pageDraft";

export function normalizeBackendData(b?: Partial<SEOBackendData> | null): SEOBackendData {
  return {
    ...DEFAULT_BACKEND_SEO,
    ...(b || {})
  };
}

export function normalizeProductGuidelines(p?: Partial<ProductGuidelines> | null): ProductGuidelines {
  return {
    ...DEFAULT_PRODUCT_GUIDELINES,
    ...(p || {}),
    forbiddenPhrases: Array.isArray(p?.forbiddenPhrases) ? p.forbiddenPhrases : [],
    uniqueSellingPoints: Array.isArray(p?.uniqueSellingPoints) ? p.uniqueSellingPoints : [],
    coreValueProps: Array.isArray(p?.coreValueProps) ? p.coreValueProps : [],
  };
}

export function normalizeSeoGuidelines(s?: Partial<SEOGuidelines> | null): SEOGuidelines {
  return {
    ...DEFAULT_SEO_GUIDELINES,
    ...(s || {}),
    titleCharRange: {
      min: s?.titleCharRange?.min ?? DEFAULT_SEO_GUIDELINES.titleCharRange.min,
      max: s?.titleCharRange?.max ?? DEFAULT_SEO_GUIDELINES.titleCharRange.max,
    },
    metaDescCharRange: {
      min: s?.metaDescCharRange?.min ?? DEFAULT_SEO_GUIDELINES.metaDescCharRange.min,
      max: s?.metaDescCharRange?.max ?? DEFAULT_SEO_GUIDELINES.metaDescCharRange.max,
    },
    schemaRequirements: Array.isArray(s?.schemaRequirements) ? s.schemaRequirements : [],
  };
}

export function normalizeContentGuidelines(c?: Partial<ContentGuidelines> | null): ContentGuidelines {
  return {
    ...DEFAULT_CONTENT_GUIDELINES,
    ...(c || {}),
    formattingRules: Array.isArray(c?.formattingRules) ? c.formattingRules : DEFAULT_CONTENT_GUIDELINES.formattingRules,
    forbiddenCliches: Array.isArray(c?.forbiddenCliches) ? c.forbiddenCliches : DEFAULT_CONTENT_GUIDELINES.forbiddenCliches,
  };
}

export function normalizeGeoGuidelines(g?: Partial<GEOGuidelines> | null): GEOGuidelines {
  return {
    ...DEFAULT_GEO_GUIDELINES,
    ...(g || {}),
    forbiddenAiPatterns: Array.isArray(g?.forbiddenAiPatterns) ? g.forbiddenAiPatterns : DEFAULT_GEO_GUIDELINES.forbiddenAiPatterns,
  };
}

export function normalizeCustomerCentricityGuidelines(c?: Partial<CustomerCentricityGuidelines> | null): CustomerCentricityGuidelines {
  return {
    ...DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES,
    ...(c || {}),
    corePainPointsToAddress: Array.isArray(c?.corePainPointsToAddress) ? c.corePainPointsToAddress : DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.corePainPointsToAddress,
    frictionPatternsToFlag: Array.isArray(c?.frictionPatternsToFlag) ? c.frictionPatternsToFlag : DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.frictionPatternsToFlag,
    objectionHandlingRules: Array.isArray(c?.objectionHandlingRules) ? c.objectionHandlingRules : DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.objectionHandlingRules,
    trustAndReassuranceSignals: Array.isArray(c?.trustAndReassuranceSignals) ? c.trustAndReassuranceSignals : DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.trustAndReassuranceSignals,
    scoringWeights: {
      ...DEFAULT_CUSTOMER_CENTRICITY_GUIDELINES.scoringWeights,
      ...(c?.scoringWeights || {})
    }
  };
}

export function normalizeStructureMappingGuidelines(s?: Partial<StructureMappingGuidelines> | null): StructureMappingGuidelines {
  return {
    ...DEFAULT_STRUCTURE_MAPPING_GUIDELINES,
    ...(s || {}),
    preferredSectionOrder: Array.isArray(s?.preferredSectionOrder) ? s.preferredSectionOrder : DEFAULT_STRUCTURE_MAPPING_GUIDELINES.preferredSectionOrder,
    headingWordCountLimit: {
      min: s?.headingWordCountLimit?.min ?? DEFAULT_STRUCTURE_MAPPING_GUIDELINES.headingWordCountLimit.min,
      max: s?.headingWordCountLimit?.max ?? DEFAULT_STRUCTURE_MAPPING_GUIDELINES.headingWordCountLimit.max
    }
  };
}


// All model calls go through the router (src/services/llm.ts): Groq + Gemini with fallback and usage logging.
/** Tests: supply a fake client with models.generateContent({ contents }) → { text }. */
export function setAgentAIClientForTesting(client: any | null) {
  setTestClient(client);
}

/** Truthy when at least one LLM provider is configured (kept for the existing call sites). */
export const getAIClient = () => (llmAvailable() ? ({} as any) : null);

/** Model shown in agent logs: the first choice for that job. */
const modelFor = (job: LlmJob) => {
  const c = routeFor(job)[0];
  return `${c.provider}:${c.model}`;
};
export const AGENT_PRIMARY_MODEL = modelFor('maker');

export async function generateWithAgentModel(
  _ai: unknown,
  options: { job: LlmJob; contents: string; config?: any; timeoutMs?: number }
): Promise<{ text: string; provider: string; model: string }> {
  const c = options.config || {};
  return generate({
    job: options.job,
    prompt: options.contents,
    json: c.responseMimeType === 'application/json',
    responseSchema: c.responseSchema,
    temperature: c.temperature,
    maxOutputTokens: c.maxOutputTokens,
    timeoutMs: options.timeoutMs,
  });
}

/** JSON array from model output; tolerates {"issues":[...]}-style wrappers some models return. */
function parseJsonArray(text: string): any[] {
  const v = extractJson(text || '');
  if (Array.isArray(v)) return v;
  if (v && typeof v === 'object') {
    const arr = Object.values(v).find((x) => Array.isArray(x));
    if (arr) return arr as any[];
  }
  return [];
}

/** Sentence splitter that does not break on "p.a.", "Rs.", "e.g." and similar abbreviations. */
function splitSentences(text: string): string[] {
  const protectedText = text.replace(/\b(p\.a|Rs|e\.g|i\.e|etc|No|approx|vs|Dr|Mr|Mrs|Ms|Ltd|Pvt|Inc|Co)\./gi, (m) => m.replace(/\./g, '\u2024'));
  return protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9₹"'(])/)
    .map((s) => s.replace(/\u2024/g, '.').trim())
    .filter((s) => s.split(/\s+/).length >= 3);
}

/** What an LLM gate sees: the full heading outline plus as much body text as fits its budget. */
const GATE_CONTENT_CHARS = 12000;
function contentForGate(content: string): string {
  const text = content || '';
  const outline = text
    .split('\n')
    .filter((l) => /^#{1,3}\s/.test(l))
    .map((l) => l.trim())
    .slice(0, 60)
    .join('\n');
  const excerpt = text.length > GATE_CONTENT_CHARS ? `${text.slice(0, GATE_CONTENT_CHARS)}\n[... page continues; see the outline for the remaining sections ...]` : text;
  return `PAGE OUTLINE (every heading on the page, in order):
${outline || '(no headings)'}

PAGE TEXT${text.length > GATE_CONTENT_CHARS ? ' (first part)' : ''}:
${excerpt}

Do not report something as missing if the outline shows a section that likely covers it.`;
}

/** Maps an LLM gate finding to a flag severity; issues that need information not on the page can never block. */
function gateSeverity(f: any): FlagSeverity {
  if (f?.needsInfoNotOnPage === true || f?.needsInfoNotOnPage === 'true') return 'info';
  if (f?.severity === 'high') {
    // Only evidence-backed findings may block publishing.
    const hasQuote = typeof f.quote === 'string' && f.quote.trim().length >= 4;
    const hasRule = typeof f.rule === 'string' && f.rule.trim().length >= 4;
    return hasQuote && hasRule ? 'critical' : 'warning';
  }
  return f?.severity === 'medium' ? 'warning' : 'info';
}
const editorNote = (f: any) => (f?.needsInfoNotOnPage === true || f?.needsInfoNotOnPage === 'true' ? ' (Needs information an editor must supply.)' : '');
const titleFrom = (text: string, fallback: string) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return fallback;
  return t.length > 80 ? `${t.slice(0, 77).replace(/\s+\S*$/, '')}…` : t;
};

// Shared severity rubric for the LLM review gates. "high" blocks publishing, so it is
// reserved for problems the writer can actually fix with the information available.
const GATE_SEVERITY_RULES = `SEVERITY RUBRIC:
- "high": the page would be non-compliant, misleading or unsafe to publish (forbidden phrases, wrong or contradicted facts, missing mandatory disclosures, manipulative claims). A "high" finding MUST quote the exact text and name the exact rule it breaks; if you cannot, it is "medium". Two statements that can both be true (e.g. "no hidden charges" next to a published fee table) are not a contradiction.
- "medium": a clear quality problem the writer can fix with the information on the page or in the guidelines.
- "low": polish.
- If fixing an issue needs information that is NOT in the content or guidelines (author names, registration numbers, phone numbers, source links, example calculations, new statistics), set "needsInfoNotOnPage": true and state what an editor must supply. Never ask the writer to invent facts or figures.`;

// Safe JSON parser helper
export function cleanJsonParse<T = any>(rawText: string, fallback: T): T {
  if (!rawText) return fallback;
  try {
    let clean = rawText.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
    }
    return JSON.parse(clean);
  } catch (e) {
    console.warn("JSON parse error:", e);
    return fallback;
  }
}

// -------------------------------------------------------------
// AGENT 1: INGRESS & SCRAPING AGENT (POWERED BY FIRECRAWL API)
// Fixed schema output: { metaTitle, metaDescription, schema, sitemap, tags, content, media }
// -------------------------------------------------------------

/**
 * Deterministic Media Presence Detection
 * Pure pattern-matching on raw HTML / schema / content without any LLM judgment.
 * - Images: true if page contains at least one <img> tag with a non-empty src.
 * - Video: true if any of: <video> tag, <iframe> matching YouTube/Vimeo/Wistia, or VideoObject in schema JSON-LD.
 * - Podcast: true if any of: <audio> tag, link to Spotify/Apple Podcasts/Google Podcasts/etc., or PodcastEpisode/PodcastSeries in schema JSON-LD.
 */
export function detectMediaPresence(params: {
  rawHtml?: string;
  schema?: string;
  pastedText?: string;
  content?: string;
}): MediaPresence {
  const rawHtml = params.rawHtml || '';
  const schema = params.schema || '';
  const pastedText = params.pastedText || '';
  const content = params.content || '';
  const combined = `${rawHtml}\n${schema}\n${pastedText}\n${content}`;

  // 1. Images: true if the page contains at least one <img> tag with a non-empty src
  let hasImages = false;
  if (rawHtml) {
    try {
      const $ = cheerio.load(rawHtml);
      $('img').each((_, el) => {
        const src = $(el).attr('src')?.trim();
        if (src && src.length > 0) {
          hasImages = true;
          return false;
        }
      });
    } catch (_) {}
  }
  if (!hasImages) {
    if (/<img[^>]+src=["'][^"'\s]+["']/i.test(combined) || /!\[.*?\]\([^\)]+\)/i.test(combined)) {
      hasImages = true;
    }
  }

  // 2. Video: true if any of:
  // - a <video> tag
  // - an <iframe> whose src matches YouTube/Vimeo/Wistia embed URLs
  // - a VideoObject schema block in the JSON-LD
  let hasVideo = false;
  if (rawHtml) {
    try {
      const $ = cheerio.load(rawHtml);
      if ($('video').length > 0) {
        hasVideo = true;
      } else {
        const videoEmbedRegex = /(?:youtube\.com\/(?:embed|v|watch)|youtu\.be\/|player\.vimeo\.com|vimeo\.com|fast\.wistia\.(?:net|com)|wistia\.com\/embed|wistia\.net)/i;
        $('iframe').each((_, el) => {
          const src = $(el).attr('src')?.trim() || '';
          if (videoEmbedRegex.test(src)) {
            hasVideo = true;
            return false;
          }
        });
      }
    } catch (_) {}
  }
  if (!hasVideo) {
    if (/<video\b/i.test(combined)) {
      hasVideo = true;
    } else if (/(?:youtube\.com\/(?:embed|v|watch)|youtu\.be\/|player\.vimeo\.com|vimeo\.com|fast\.wistia\.(?:net|com)|wistia\.com\/embed)/i.test(combined)) {
      hasVideo = true;
    }
  }
  if (!hasVideo) {
    if (/["']?@type["']?\s*:\s*["']VideoObject["']/i.test(schema || combined) || /VideoObject/i.test(schema)) {
      hasVideo = true;
    }
  }

  // 3. Podcast: true if any of:
  // - an <audio> tag
  // - a link pointing to Spotify/Apple Podcasts/Google Podcasts/other known podcast host domains
  // - a PodcastEpisode/PodcastSeries schema block
  let hasPodcast = false;
  const podcastHostRegex = /(?:open\.spotify\.com\/(?:show|episode)|podcasts\.apple\.com|podcasts\.google\.com|transistor\.fm|anchor\.fm|buzzsprout\.com|libsyn\.com|podbean\.com|simplecast\.com|megaphone\.fm|captivate\.fm|rss\.com|castos\.com|overcast\.fm|pocketcasts\.com|feedburner\.com)/i;

  if (rawHtml) {
    try {
      const $ = cheerio.load(rawHtml);
      if ($('audio').length > 0) {
        hasPodcast = true;
      } else {
        $('a').each((_, el) => {
          const href = $(el).attr('href')?.trim() || '';
          if (podcastHostRegex.test(href)) {
            hasPodcast = true;
            return false;
          }
        });
      }
    } catch (_) {}
  }
  if (!hasPodcast) {
    if (/<audio\b/i.test(combined) || podcastHostRegex.test(combined)) {
      hasPodcast = true;
    }
  }
  if (!hasPodcast) {
    if (/["']?@type["']?\s*:\s*["'](?:PodcastEpisode|PodcastSeries|PodcastSeason)["']/i.test(schema || combined) ||
        /PodcastEpisode/i.test(schema) || /PodcastSeries/i.test(schema)) {
      hasPodcast = true;
    }
  }

  return {
    hasImages,
    hasVideo,
    hasPodcast,
  };
}

export async function runAgent1Extraction(params: {
  rawHtml?: string;
  url?: string;
  pastedText?: string;
}): Promise<{ data: ExtractedPageData; log: AgentExecutionLog }> {
  const startTime = Date.now();
  const log: AgentExecutionLog = {
    id: `log-agent-1-${Date.now()}`,
    agentId: 'agent-1',
    agentName: 'Agent 1: Ingress & Scraping Agent (Powered by Firecrawl API)',
    role: 'Firecrawl Content Ingress & Ground-Truth Anchor — Scrapes target URLs via Firecrawl API and normalizes raw page data into strict schema with media presence detection without hallucination',
    model: AGENT_PRIMARY_MODEL,
    status: 'running',
    timestamp: new Date().toISOString()
  };

  let metaTitle = '';
  let metaDescription = '';
  let schema = '';
  let sitemap = '';
  let tags = '';
  let content = '';

  const { rawHtml, url, pastedText } = params;

  // 1. Cheerio deterministic fast extraction if HTML is provided
  if (rawHtml) {
    try {
      const $ = cheerio.load(rawHtml);
      metaTitle = $('title').first().text().trim() || $('meta[property="og:title"]').attr('content') || '';
      metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
      
      // Concatenate multiple JSON-LD blocks separated by a blank line
      const schemaParts: string[] = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        const html = $(el).html()?.trim();
        if (html) schemaParts.push(html);
      });
      schema = schemaParts.join('\n\n');

      // Look for sitemap links
      $('link[rel="sitemap"], a[href*="sitemap"]').each((_, el) => {
        if (!sitemap) sitemap = $(el).attr('href') || '';
      });

      tags = $('meta[name="keywords"]').attr('content') || '';

      // Clean non-content elements but keep main body content from H1 to last FAQ
      $('script, style, noscript, nav, footer, header, svg, iframe').remove();
      
      const contentParts: string[] = [];
      const mainContainer = $('main').length ? $('main') : ($('article').length ? $('article') : $('body'));
      
      mainContainer.find('h1, h2, h3, h4, h5, h6, p, li, dt, dd, table').each((_, el) => {
        const tagName = el.tagName?.toLowerCase();
        if (tagName === 'table') {
          const $t = $(el);
          const allRows: string[][] = [];
          $t.find('tr').each((_, tr) => {
            const cells: string[] = [];
            $(tr).find('th, td').each((_, cell) => {
              cells.push($(cell).text().replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim());
            });
            if (cells.some(c => c.length > 0)) {
              allRows.push(cells);
            }
          });
          if (allRows.length > 0) {
            const maxCols = Math.max(...allRows.map(r => r.length));
            const normalized = allRows.map(r => {
              const padded = [...r];
              while (padded.length < maxCols) padded.push('-');
              return padded;
            });
            const tLines: string[] = [];
            const caption = $t.find('caption').text().trim();
            if (caption) tLines.push(`### ${caption}`);
            tLines.push(`| ${normalized[0].join(' | ')} |`);
            tLines.push(`| ${normalized[0].map(() => '---').join(' | ')} |`);
            normalized.slice(1).forEach(r => tLines.push(`| ${r.join(' | ')} |`));
            contentParts.push(tLines.join('\n'));
          }
          return;
        }

        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (!text) return;
        if (tagName === 'h1') contentParts.push(`# ${text}`);
        else if (tagName === 'h2') contentParts.push(`## ${text}`);
        else if (tagName === 'h3') contentParts.push(`### ${text}`);
        else if (tagName === 'h4') contentParts.push(`#### ${text}`);
        else if (tagName === 'li') contentParts.push(`- ${text}`);
        else contentParts.push(text);
      });

      content = contentParts.join('\n\n');
      if (!content) {
        content = mainContainer.text().replace(/\s+/g, ' ').trim();
      }
    } catch (e) {
      console.warn("Cheerio parse warning:", e);
    }
  } else if (pastedText) {
    content = pastedText;
  }

  // 2. Enhance with Gemini LLM for high fidelity 6-field normalization (metadata, schema, etc.)
  const ai = getAIClient();
  const cheerioContent = content; // preserve full cheerio markdown content
  // Only normalise real input; a bare URL would let the model invent page content.
  if (ai && (rawHtml || pastedText)) {
    try {
      const prompt = `You are the Extraction Agent in a content/SEO QA pipeline. Your only job is to take raw input (a fetched page, pasted HTML, or manually pasted fields) and normalize it into a fixed JSON structure. You do not evaluate, judge, or improve anything — you extract and structure only.

INPUT: raw page data (HTML, or manually pasted field values).
Page URL: ${url || 'N/A'}

CRITICAL EXTRACTION RULES:
- If a field cannot be found, return it as an empty string — never guess, invent, or fill in a plausible-sounding value.
- Preserve heading hierarchy exactly as it appears on the page (do not "fix" a skipped heading level here).
- Preserve exact figures, currency symbols (e.g. ₹), and casing as found on the page — do not normalize or fix casing.
- If multiple JSON-LD blocks exist, concatenate them in the schema field, separated by a blank line, in the order they appear on the page.
- Do NOT summarize or truncate the content field. Extract the ENTIRE content from the first H1 to the last FAQ or footer in full markdown structure.

Raw Content Input:
${(rawHtml || pastedText || content || '').slice(0, 50000)}

OUTPUT: Respond with ONLY valid JSON, no commentary, no markdown fences, in exactly this shape:
{
  "metaTitle": string,
  "metaDescription": string,
  "schema": string,
  "sitemap": string,
  "tags": string,
  "content": string
}`;

      const response = await generateWithAgentModel(ai, {
        job: 'extraction',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
        }
      });

      const parsed = cleanJsonParse<any>(response.text || '', null);
      if (parsed) {
        metaTitle = parsed.metaTitle !== undefined ? parsed.metaTitle : metaTitle;
        metaDescription = parsed.metaDescription !== undefined ? parsed.metaDescription : metaDescription;
        schema = parsed.schema !== undefined ? parsed.schema : schema;
        sitemap = parsed.sitemap !== undefined ? parsed.sitemap : sitemap;
        tags = parsed.tags !== undefined ? parsed.tags : tags;
        // Prefer LLM content only if it's at least as long as Cheerio content, otherwise keep full Cheerio markdown content
        if (typeof parsed.content === 'string' && parsed.content.length >= cheerioContent.length) {
          content = parsed.content;
        } else if (!content) {
          content = parsed.content || cheerioContent;
        } else {
          content = cheerioContent; // Default to full Cheerio markdown extraction to guarantee zero truncation from H1 to last FAQ
        }
      }
    } catch (err: any) {
      console.warn("Agent 1 LLM fallback used Cheerio data:", err.message);
      content = cheerioContent;
    }
  }

  // 3. Deterministic Media Presence Detection (no LLM judgment)
  const media = detectMediaPresence({
    rawHtml,
    schema,
    pastedText,
    content,
  });

  const result: ExtractedPageData = {
    metaTitle: metaTitle || '',
    metaDescription: metaDescription || '',
    schema: schema || '',
    sitemap: sitemap || '',
    tags: tags || '',
    content: content || '',
    media,
  };

  log.status = 'completed';
  log.durationMs = Date.now() - startTime;
  log.outputSummary = `Extracted schema successfully. Meta Title: "${result.metaTitle.slice(0, 40)}...", Media: [Images: ${media.hasImages ? '✓' : '—'}, Video: ${media.hasVideo ? '✓' : '—'}, Podcast: ${media.hasPodcast ? '✓' : '—'}], Content length: ${result.content.length} chars`;

  return { data: result, log };
}

// -------------------------------------------------------------
// AGENT 2: GUIDELINE COMPLIANCE AGENT
// Audits strictly against Product Guidelines
// -------------------------------------------------------------
export async function runAgent2Compliance(params: {
  extractedData: ExtractedPageData;
  productGuidelines: ProductGuidelines;
  seoGuidelines?: SEOGuidelines;
  contentGuidelines?: ContentGuidelines;
}): Promise<{ flags: AuditFlag[]; score: number; rationale: string; log: AgentExecutionLog }> {
  const startTime = Date.now();
  const log: AgentExecutionLog = {
    id: `log-agent-2-${Date.now()}`,
    agentId: 'agent-2',
    agentName: 'Agent 2: Guideline Compliance Agent',
    role: 'Audits copy strictly against Product Guidelines (product positioning, target audience, core value props, compliance notes, and forbidden phrases)',
    model: modelFor('gate-compliance'),
    status: 'running',
    timestamp: new Date().toISOString()
  };

  const flags: AuditFlag[] = [];
  const productGuidelines = normalizeProductGuidelines(params?.productGuidelines);
  const contentGuidelines = params?.contentGuidelines || {};
  const extractedData = params?.extractedData || { metaTitle: '', metaDescription: '', schema: '', sitemap: '', tags: '', content: '' };
  let score = 92;
  let rationale = "Content adheres closely to target Product Guidelines and core brand value propositions.";

  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `You are the Guideline Compliance Agent (Agent 2). You check extracted page content against specific product and content guidelines. You are a literal rules-checker for copy terminology, figures, claims, and regulatory alignment.

PRODUCT GUIDELINES:
${JSON.stringify(productGuidelines, null, 2)}

CONTENT GUIDELINES:
${JSON.stringify(contentGuidelines, null, 2)}

SECTIONS TO CHECK:
metaTitle: ${extractedData.metaTitle}
metaDescription: ${extractedData.metaDescription}
tags: ${extractedData.tags}
${contentForGate(extractedData.content)}

CRITICAL BOUNDARIES FOR AGENT 2 (MANDATORY):
- DO NOT audit, flag, or report Schema.org JSON-LD or Sitemap. Agent 3 is the dedicated SEO Backend Data agent solely responsible for technical SEO, schema completeness, and sitemap.
- DO NOT flag Meta Title, Meta Description, Schema, or Sitemap as missing if they are present or managed by backend data.
- Check strictly for:
  * Forbidden phrases or unverified superlatives in copy
  * Figure and financial terms inconsistencies against Product Guidelines
  * Product naming and capitalization
  * Missing required disclaimers or disclosures in content

${GATE_SEVERITY_RULES}

OUTPUT: Respond with ONLY a valid JSON array, no markdown fences, no commentary, matching this exact shape:
[
  {
    "section": "content" | "metaTitle" | "metaDescription",
    "category": "Guidelines",
    "severity": "low" | "medium" | "high",
    "issue": "specific description quoting the offending text and the rule it breaks",
    "suggestion": "the exact correction per the guideline",
    "quote": "the exact text from the page this is about (empty if the issue is something missing)",
    "rule": "the specific guideline rule or standard it breaks",
    "needsInfoNotOnPage": true | false
  
  }
]
If a section has no violations, do not include it. Return [] if nothing violates the guidelines.`;

      const res = await generateWithAgentModel(ai, {
        job: 'gate-compliance',
        contents: prompt,
        config: { responseMimeType: 'application/json', maxOutputTokens: 2048 }
      });

      const parsedArray = parseJsonArray(res.text);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach((f: any, idx: number) => {
          const issueLower = (f.issue || '').toLowerCase();
          const sectionLower = (f.section || '').toLowerCase();
          const suggestionLower = (f.suggestion || '').toLowerCase();

          // CRITICAL: Block hallucinated missing schema/sitemap/meta flags from Agent 2
          if (['schema', 'sitemap'].includes(sectionLower)) return;
          if ((issueLower.includes('schema') || suggestionLower.includes('schema')) && (issueLower.includes('missing') || issueLower.includes('no schema'))) return;
          if ((issueLower.includes('sitemap') || suggestionLower.includes('sitemap')) && (issueLower.includes('missing') || issueLower.includes('no sitemap'))) return;
          if (extractedData.metaTitle && (issueLower.includes('missing title') || issueLower.includes('missing meta title') || issueLower.includes('no title'))) return;
          if (extractedData.metaDescription && (issueLower.includes('missing description') || issueLower.includes('missing meta description') || issueLower.includes('no description'))) return;

          const sev = gateSeverity(f);
          const isProduct = (f.issue?.toLowerCase().includes('regulatory') || f.issue?.toLowerCase().includes('product') || f.issue?.toLowerCase().includes('fact'));
          const gSec: GuidelineSectionType = isProduct ? 'Product Guidelines' : 'Content Guidelines';
          const isMeta = ['metatitle', 'metadescription'].includes(sectionLower);
          const target = isMeta ? 'backend_seo' : 'component';
          const componentId = isMeta ? undefined : 'page_body_content';

          flags.push({
            id: `agent2-flag-${Date.now()}-${idx}`,
            agentOrigin: 'Agent 2: Guideline Compliance',
            guidelineSection: gSec,
            target,
            componentId,
            fieldName: isMeta ? f.section : 'bodyContent',
            category: 'GUIDELINE_COMPLIANCE',
            severity: sev,
            issueTitle: titleFrom(f.issue, `Guideline issue in ${f.section || 'content'}`),
            issueDescription: f.issue || 'Content violates specified guidelines.',
            whyThisSuggestionIsGiven: 'Maintains strict adherence to product and SEO policy standards.',
            guidelineReference: 'Guidelines Rule-Checker',
            proposedFixPreview: (f.suggestion || 'Apply corrective phrasing.') + editorNote(f),
            fixed: false
          });
        });
        if (flags.length > 0) {
          score = Math.max(40, 100 - (flags.length * 10));
          rationale = `Agent 2 identified ${flags.length} rule violation(s) against Product and Content Guidelines.`;
        }
      }
    } catch (err: any) {
      console.warn("Agent 2 LLM error, executing heuristic rule checks:", err.message);
    }
  }

  // Deterministic checks against Product Guidelines
  const fullText = `${extractedData.metaTitle} ${extractedData.metaDescription} ${extractedData.content}`.toLowerCase();

  // 1. Forbidden Phrases Check (Critical Penalty)
  if (productGuidelines.forbiddenPhrases && productGuidelines.forbiddenPhrases.length > 0) {
    productGuidelines.forbiddenPhrases.forEach((phrase, idx) => {
      if (phrase && fullText.includes(phrase.toLowerCase())) {
        score = Math.max(15, score - 25);
        flags.push({
          id: `agent2-rule-forbidden-${idx}`,
          agentOrigin: 'Agent 2: Guideline Compliance',
          guidelineSection: 'Product Guidelines',
          isGatingViolation: true,
          target: 'component',
          componentId: 'page_body_content',
          fieldName: 'bodyContent',
          category: 'GUIDELINE_COMPLIANCE',
          severity: 'critical',
          issueTitle: `Forbidden Phrase Detected: "${phrase}"`,
          issueDescription: `The copy contains the forbidden phrase "${phrase}" which violates Product Guidelines.`,
          whyThisSuggestionIsGiven: 'Product Guidelines strictly ban unapproved phrases to prevent false claims and regulatory risk.',
          guidelineReference: `Product Guidelines: Forbidden Phrases [${phrase}]`,
          proposedFixPreview: `Replace or remove occurrences of "${phrase}".`,
          fixed: false
        });
      }
    });
  }

  // 2. Core Value Props Check
  if (productGuidelines.coreValueProps && productGuidelines.coreValueProps.length > 0) {
    let missingProps = 0;
    productGuidelines.coreValueProps.forEach((prop, idx) => {
      const propTokens = prop.toLowerCase().split(/\s+/).filter(t => t.length > 3);
      const isRepresented = propTokens.some(token => fullText.includes(token));
      if (!isRepresented) {
        missingProps++;
        flags.push({
          id: `agent2-rule-prop-missing-${idx}`,
          agentOrigin: 'Agent 2: Guideline Compliance',
          guidelineSection: 'Product Guidelines',
          target: 'component',
          componentId: 'page_body_content',
          fieldName: 'bodyContent',
          category: 'GUIDELINE_COMPLIANCE',
          severity: 'warning',
          issueTitle: `Core Value Proposition Omitted: "${prop}"`,
          issueDescription: `The page does not highlight this core value proposition defined in Product Guidelines: "${prop}".`,
          whyThisSuggestionIsGiven: 'Product Guidelines require core value props to be communicated to drive conversion.',
          guidelineReference: `Product Guidelines: Core Value Props`,
          proposedFixPreview: `Highlight "${prop}" in a key feature section.`,
          fixed: false
        });
      }
    });
    if (missingProps > 0) {
      score = Math.max(20, score - (missingProps * 8));
    }
  }

  const critCount = flags.filter(f => f.severity === 'critical').length;
  const warnCount = flags.filter(f => f.severity === 'warning').length;
  if (critCount > 0 || warnCount > 0) {
    score = Math.max(15, Math.min(score, 100 - (critCount * 25) - (warnCount * 7)));
    rationale = `Product Guidelines Score: ${score}/100. Identified ${critCount} critical violations and ${warnCount} guideline warnings based on Product Guidelines.`;
  } else {
    rationale = `Product Guidelines Score: ${score}/100. Content fully aligns with product positioning, value props, and forbidden phrase policies.`;
  }

  log.status = 'completed';
  log.durationMs = Date.now() - startTime;
  log.outputSummary = `Product Guidelines Score: ${score}/100. Generated ${flags.length} product compliance flags.`;

  return { flags, score, rationale, log };
}

// -------------------------------------------------------------
// AGENT 3: SEO BACKEND DATA AGENT
// Scoring strictly based on SEO Guidelines, Schema Completeness & Canonical Hierarchy Order
// -------------------------------------------------------------
export async function runAgent3SeoBackend(params: {
  extractedData: ExtractedPageData;
  seoGuidelines: SEOGuidelines;
  productGuidelines?: ProductGuidelines;
}): Promise<{ flags: AuditFlag[]; score: number; rationale: string; validatedBackend: Partial<SEOBackendData>; log: AgentExecutionLog }> {
  const startTime = Date.now();
  const log: AgentExecutionLog = {
    id: `log-agent-3-${Date.now()}`,
    agentId: 'agent-3',
    agentName: 'Agent 3: SEO Backend Data Agent',
    role: 'Audits copy strictly against SEO Guidelines (title/meta desc lengths, schema completeness, canonical graph hierarchy order, sitemap)',
    model: 'deterministic',
    status: 'running',
    timestamp: new Date().toISOString()
  };

  const flags: AuditFlag[] = [];
  const seoGuidelines = normalizeSeoGuidelines(params?.seoGuidelines);
  const productGuidelines = normalizeProductGuidelines(params?.productGuidelines);
  const extractedData = params?.extractedData || { metaTitle: '', metaDescription: '', schema: '', sitemap: '', tags: '', content: '' };
  let score = 100;

  // 1. Deterministic JSON-LD Syntax Check
  let isSchemaValid = false;
  let schemaTypes: string[] = [];
  try {
    if (extractedData.schema && extractedData.schema.trim()) {
      // Pages often carry several JSON-LD blocks; Agent 1 joins them with blank lines.
      const nodes = parseSchemaBlocks(extractedData.schema);
      if (nodes.length === 0) {
        JSON.parse(extractedData.schema); // surfaces the real syntax error below
        throw new Error('No JSON-LD objects found');
      }
      isSchemaValid = true;
      schemaTypes = nodes
        .map((g: any) => (Array.isArray(g['@type']) ? g['@type'][0] : g['@type']))
        .filter(Boolean);
    } else {
      score -= 25;
      flags.push({
        id: `agent3-flag-no-schema-${Date.now()}`,
        agentOrigin: 'Agent 3: SEO Backend Data',
        guidelineSection: 'SEO Guidelines',
        target: 'backend_seo',
        fieldName: 'schemaJsonLd',
        category: 'SEO_BACKEND',
        severity: 'critical',
        issueTitle: 'Missing Schema.org Structured Data',
        issueDescription: 'No JSON-LD schema was found on the page. SEO Guidelines require structured data for search engine comprehension.',
        whyThisSuggestionIsGiven: 'Schema structured data is essential for Google search rich snippets, knowledge graph entities, and AI search grounding.',
        guidelineReference: 'SEO Guidelines: Schema Requirements',
        proposedFixPreview: 'Generate a complete Schema.org JSON-LD @graph with WebPage, Breadcrumbs, Product/Service, Organization, and FAQPage.',
        fixed: false
      });
    }
  } catch (e: any) {
    score -= 35;
    flags.push({
      id: `agent3-flag-schema-syntax-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'schemaJsonLd',
      category: 'SEO_BACKEND',
      severity: 'critical',
      issueTitle: 'Malformed Schema.org JSON-LD Syntax',
      issueDescription: `Deterministic schema validator caught JSON syntax error: ${e.message}`,
      whyThisSuggestionIsGiven: 'Invalid JSON-LD prevents Google and search crawlers from indexing structured entities and rich snippets.',
      guidelineReference: 'Schema.org JSON-LD Specification',
      proposedFixPreview: 'Format schema markup as a valid @graph JSON-LD structure.',
      fixed: false
    });
  }

  // 2. Schema Completeness Check: Validate if ALL recommended schemas are present
  if (isSchemaValid) {
    const typesLower = schemaTypes.map(t => t.toLowerCase());
    const missingSchemas: string[] = [];
    if (!typesLower.some(t => ['webpage', 'itempage', 'aboutpage', 'collectionpage'].includes(t))) missingSchemas.push('WebPage');
    if (!typesLower.some(t => ['breadcrumblist', 'breadcrumbs'].includes(t))) missingSchemas.push('BreadcrumbList');
    if (!typesLower.some(t => ['financialproduct', 'softwareapplication', 'product', 'service', 'article', 'webapplication'].includes(t))) {
      missingSchemas.push('Subject Entity (Product/FinancialProduct/Service)');
    }
    if (!typesLower.some(t => ['organization', 'corporation', 'localbusiness'].includes(t))) missingSchemas.push('Organization');
    if (!typesLower.some(t => ['faqpage'].includes(t))) missingSchemas.push('FAQPage');

    if (missingSchemas.length > 0) {
      score -= Math.min(30, missingSchemas.length * 7);
      flags.push({
        id: `agent3-flag-schema-missing-${Date.now()}`,
        agentOrigin: 'Agent 3: SEO Backend Data',
        guidelineSection: 'SEO Guidelines',
        target: 'backend_seo',
        fieldName: 'schemaJsonLd',
        category: 'SEO_BACKEND',
        severity: 'warning',
        issueTitle: `Incomplete Schema: Missing [${missingSchemas.join(', ')}]`,
        issueDescription: `SEO Guidelines require comprehensive schema coverage. Missing entity schemas: ${missingSchemas.join(', ')}.`,
        whyThisSuggestionIsGiven: 'Google rich results and AI search engines need a complete entity graph to qualify for breadcrumbs, sitelinks, knowledge panels, and FAQ accordions.',
        guidelineReference: 'SEO Guidelines: Schema Completeness Standards',
        proposedFixPreview: `Add ${missingSchemas.join(', ')} into the @graph array.`,
        fixed: false
      });
    }

    // 3. Schema Graph Canonical Hierarchy Order Validation
    const getEntityRank = (type: string = ''): number => {
      const t = type.toLowerCase();
      if (['webpage', 'itempage', 'aboutpage', 'collectionpage'].includes(t)) return 1;
      if (['breadcrumblist', 'breadcrumbs'].includes(t)) return 2;
      if (['financialproduct', 'softwareapplication', 'product', 'service', 'article', 'webapplication'].includes(t)) return 3;
      if (['organization', 'corporation', 'localbusiness'].includes(t)) return 4;
      if (['faqpage'].includes(t)) return 5;
      return 6;
    };

    let isOrderValid = true;
    let prevRank = 0;
    for (const type of schemaTypes) {
      const rank = getEntityRank(type);
      if (rank < prevRank) {
        isOrderValid = false;
        break;
      }
      prevRank = Math.max(prevRank, rank);
    }

    if (!isOrderValid && schemaTypes.length > 1) {
      score -= 15;
      flags.push({
        id: `agent3-flag-schema-order-${Date.now()}`,
        agentOrigin: 'Agent 3: SEO Backend Data',
        guidelineSection: 'SEO Guidelines',
        target: 'backend_seo',
        fieldName: 'schemaJsonLd',
        category: 'SEO_BACKEND',
        severity: 'warning',
        issueTitle: 'Schema.org Graph Order Out of Canonical Hierarchy',
        issueDescription: `Current entity order [${schemaTypes.join(' -> ')}] violates canonical hierarchy. Canonical order: WebPage -> BreadcrumbList -> Subject Entity -> Organization -> FAQPage.`,
        whyThisSuggestionIsGiven: 'Search engine bots read structured data top-down; canonical hierarchy ensures primary page definitions and breadcrumb paths resolve before auxiliary entities.',
        guidelineReference: 'Schema.org Graph Canonical Ordering Standards',
        proposedFixPreview: 'Sort @graph array: WebPage (1) -> BreadcrumbList (2) -> Subject Entity (3) -> Organization (4) -> FAQPage (5).',
        fixed: false
      });
    }
  }

  // 4. Meta Title Character Range and Brand & Product Check
  const detectedA3Product = detectProductNameFromContext({
    rawTitle: extractedData.metaTitle,
    rawDescription: extractedData.metaDescription,
    productName: productGuidelines.productName,
  });

  const titleLen = extractedData.metaTitle.length;
  const minTitle = seoGuidelines.titleCharRange?.min || 50;
  const maxTitle = seoGuidelines.titleCharRange?.max || 60;
  if (titleLen === 0) {
    score -= 30;
    flags.push({
      id: `agent3-flag-missing-title-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'metaTitle',
      category: 'SEO_BACKEND',
      severity: 'critical',
      issueTitle: 'Missing Meta Title',
      issueDescription: 'Page has no meta title tag. SEO Guidelines mandate an optimized 50-60 character title.',
      whyThisSuggestionIsGiven: 'Meta title is the most critical on-page ranking signal and primary clickable link on SERPs.',
      guidelineReference: `SEO Guidelines: Title Length Range ${minTitle}-${maxTitle} chars`,
      proposedFixPreview: `Write a ${minTitle}-${maxTitle} character title that leads with "${detectedA3Product}" and the primary keyword.`,
      fixed: false
    });
  } else if (titleLen < minTitle || titleLen > maxTitle) {
    score -= 15;
    flags.push({
      id: `agent3-flag-title-len-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'metaTitle',
      category: 'SEO_BACKEND',
      severity: 'warning',
      issueTitle: `Meta Title Length Non-Compliant (${titleLen} chars)`,
      issueDescription: `Title length is ${titleLen} characters, outside SEO Guidelines target of ${minTitle}-${maxTitle} characters.`,
      whyThisSuggestionIsGiven: 'Titles over 60 characters get truncated on SERPs; titles under 50 characters fail to utilize ranking capacity.',
      guidelineReference: `SEO Guidelines: Title Length Range ${minTitle}-${maxTitle} chars`,
      proposedFixPreview: `Rewrite the title to ${minTitle}-${maxTitle} characters (currently ${titleLen}), keeping the primary keyword near the start.`,
      fixed: false
    });
  }

  // Brand check only applies when the active Product Guidelines name a brand.
  const brandName = (productGuidelines.brandName || '').trim();
  const brandRe = brandName ? new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'i') : null;

  if (extractedData.metaTitle && brandRe && !brandRe.test(extractedData.metaTitle)) {
    score -= 10;
    flags.push({
      id: `agent3-flag-title-brand-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'metaTitle',
      category: 'SEO_BACKEND',
      severity: 'warning',
      issueTitle: `Brand "${brandName}" missing from meta title`,
      issueDescription: `Product Guidelines set the brand as "${brandName}", but the meta title does not mention it.`,
      whyThisSuggestionIsGiven: 'Brand attribution in the title builds recognition and trust on search results pages.',
      guidelineReference: 'Product Guidelines: Brand name',
      proposedFixPreview: `Include "${brandName}" in the title (for example as a " | ${brandName}" suffix) while staying within ${minTitle}-${maxTitle} characters.`,
      fixed: false
    });
  }

  // 5. Meta Description Character Range and Brand & Product Check
  const descLen = extractedData.metaDescription.length;
  const minDesc = seoGuidelines.metaDescCharRange?.min || 135;
  const maxDesc = seoGuidelines.metaDescCharRange?.max || 160;
  if (descLen === 0) {
    score -= 25;
    flags.push({
      id: `agent3-flag-missing-desc-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'metaDescription',
      category: 'SEO_BACKEND',
      severity: 'critical',
      issueTitle: 'Missing Meta Description',
      issueDescription: 'Page has no meta description tag. SEO Guidelines mandate a 135-160 character description.',
      whyThisSuggestionIsGiven: 'Meta description directly influences search CTR and snippet display in search engines.',
      guidelineReference: `SEO Guidelines: Meta Description Range ${minDesc}-${maxDesc} chars`,
      proposedFixPreview: `Write a ${minDesc}-${maxDesc} character description in complete sentences that summarizes the page and includes the primary keyword.`,
      fixed: false
    });
  } else if (descLen < minDesc || descLen > maxDesc) {
    score -= 12;
    flags.push({
      id: `agent3-flag-desc-len-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'metaDescription',
      category: 'SEO_BACKEND',
      severity: 'warning',
      issueTitle: `Meta Description Length Sub-Optimal (${descLen} chars)`,
      issueDescription: `Description length is ${descLen} characters (SEO Guidelines target: ${minDesc}-${maxDesc} chars).`,
      whyThisSuggestionIsGiven: 'Descriptions between 135-160 characters maximize click-through rate without being cut off by search engines.',
      guidelineReference: `SEO Guidelines: Meta Description Range ${minDesc}-${maxDesc} chars`,
      proposedFixPreview: `Rewrite the description to ${minDesc}-${maxDesc} characters (currently ${descLen}) in complete sentences.`,
      fixed: false
    });
  }

  if (extractedData.metaDescription && brandRe && !brandRe.test(extractedData.metaDescription)) {
    score -= 8;
    flags.push({
      id: `agent3-flag-desc-brand-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'metaDescription',
      category: 'SEO_BACKEND',
      severity: 'warning',
      issueTitle: `Brand "${brandName}" missing from meta description`,
      issueDescription: `Product Guidelines set the brand as "${brandName}", but the meta description does not mention it.`,
      whyThisSuggestionIsGiven: 'Brand context in search snippets increases trust and qualified clicks.',
      guidelineReference: 'Product Guidelines: Brand name',
      proposedFixPreview: `Mention "${brandName}" naturally in one complete sentence within ${minDesc}-${maxDesc} characters.`,
      fixed: false
    });
  }

  // 5b. Meta Description Sentence Completeness Check
  const trimmedDesc = extractedData.metaDescription.trim();
  const endsWithTerminalPunctuation = /[.!?]$/.test(trimmedDesc);
  const hasCutoffOrEllipsis = /\.\.\.$|…$|\s+(and|or|the|a|an|with|for|to|of|in|on|at|by|from|which|that|is|are|was|were)$/i.test(trimmedDesc);
  if (trimmedDesc.length > 0 && (!endsWithTerminalPunctuation || hasCutoffOrEllipsis)) {
    score -= 10;
    flags.push({
      id: `agent3-flag-desc-incomplete-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'metaDescription',
      category: 'SEO_BACKEND',
      severity: 'warning',
      issueTitle: 'Meta Description Sentence Incomplete or Truncated',
      issueDescription: 'The meta description cuts off mid-sentence or lacks terminal punctuation (.!?). All descriptions must consist of complete, grammatically sound sentences within character limits.',
      whyThisSuggestionIsGiven: 'Search engines display full sentences more clearly on SERPs and avoid looking abruptly truncated or amateurish.',
      guidelineReference: 'SEO Guidelines: Complete Grammatical Sentences in Meta Descriptions',
      proposedFixPreview: 'Rewrite to ensure every sentence finishes completely with terminal punctuation within 150-160 characters.',
      fixed: false
    });
  }

  // 6. Sitemap Check
  if (!extractedData.sitemap) {
    score -= 10;
    flags.push({
      id: `agent3-flag-sitemap-${Date.now()}`,
      agentOrigin: 'Agent 3: SEO Backend Data',
      guidelineSection: 'SEO Guidelines',
      target: 'backend_seo',
      fieldName: 'sitemapUrl',
      category: 'SEO_BACKEND',
      severity: 'info',
      issueTitle: 'Missing XML Sitemap Directive',
      issueDescription: 'No explicit sitemap reference was detected in document headers or robots meta.',
      whyThisSuggestionIsGiven: 'Sitemaps accelerate crawler indexation of newly published content.',
      guidelineReference: 'SEO Guidelines: Sitemap Indexation Standard',
      proposedFixPreview: 'https://example.com/sitemap.xml',
      fixed: false
    });
  }

  score = Math.max(15, Math.min(100, score));
  const rationale = `SEO Guidelines Score: ${score}/100. Evaluated meta title (${titleLen}/${minTitle}-${maxTitle} chars), meta description (${descLen}/${minDesc}-${maxDesc} chars), schema validity, schema completeness, and canonical @graph hierarchy order.`;

  log.status = 'completed';
  log.durationMs = Date.now() - startTime;
  log.outputSummary = `SEO Guidelines Score: ${score}/100. Schema valid=${isSchemaValid}, entities found=${schemaTypes.length}, created ${flags.length} SEO flags.`;

  return {
    flags,
    score,
    rationale,
    validatedBackend: {
      metaTitle: extractedData.metaTitle,
      metaDescription: extractedData.metaDescription,
      schemaJsonLd: extractedData.schema,
      schemaTypesFound: schemaTypes,
      sitemapUrl: extractedData.sitemap,
    },
    log
  };
}

// -------------------------------------------------------------
// AGENT 4: KEYWORD & INTENT MAPPING AGENT
// Governed by Structure & Keyword Mapping Guidelines:
// 1. Heading hierarchy & primary keyword presence in H1
// 2. Scraped keyword frequency and coverage
// 3. Keywords in H1/H2/H3 headings and Voice Search question mapping
// -------------------------------------------------------------
export async function runAgent4KeywordIntentMapping(params: {
  extractedData: ExtractedPageData;
  keywords: KeywordItem[];
  components: ContentComponent[];
  structureMappingGuidelines?: StructureMappingGuidelines;
}): Promise<{ plan: HeadingKeywordPlan; score: number; rationale: string; flags: AuditFlag[]; log: AgentExecutionLog }> {
  const startTime = Date.now();
  const structureGuidelines = normalizeStructureMappingGuidelines(params?.structureMappingGuidelines);
  const log: AgentExecutionLog = {
    id: `log-agent-4-${Date.now()}`,
    agentId: 'agent-4',
    agentName: 'Agent 4: Keyword & Intent Mapping Agent',
    role: 'Audits structure hierarchy, H1 primary keyword presence, heading keyword mapping, and frequency',
    model: 'deterministic',
    status: 'running',
    timestamp: new Date().toISOString()
  };

  const extractedData = params?.extractedData || { metaTitle: '', metaDescription: '', schema: '', sitemap: '', tags: '', content: '' };
  const rawKeywords = Array.isArray(params?.keywords) ? params.keywords : [];
  const components = Array.isArray(params?.components) ? params.components : [];
  const flags: AuditFlag[] = [];

  // Extract all existing headings from components and extractedData
  const existingHeadings: { text: string; level: 'h1' | 'h2' | 'h3' }[] = [];
  components.forEach(c => {
    (c.headings || []).forEach(h => {
      existingHeadings.push({
        text: (h.text || '').trim(),
        level: (h.tag?.toLowerCase() as any) || 'h2'
      });
    });
  });

  if (existingHeadings.length === 0 && extractedData.metaTitle) {
    existingHeadings.push({ text: extractedData.metaTitle, level: 'h1' });
  }

  // Ensure safe keywords array
  let safeKeywords = rawKeywords.filter(k => k && k.keyword && k.keyword.trim().length > 0);
  if (safeKeywords.length === 0) {
    const fallbackTags = (extractedData.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    if (fallbackTags.length > 0) {
      safeKeywords = fallbackTags.slice(0, 6).map((tag, idx) => ({
        id: `kw-auto-${idx}`,
        keyword: tag,
        searchVolume: 0,
        intent: idx === 0 ? 'commercial' as const : 'informational' as const,
        priority: idx === 0 ? 'primary' as const : 'secondary' as const
      }));
    } else {
      const primaryTerm = extractedData.metaTitle.split(/[-|•]/)[0]?.trim() || 'Online Guide';
      safeKeywords = [{
        id: 'kw-auto-1',
        keyword: primaryTerm,
        searchVolume: 0,
        intent: 'commercial' as const,
        priority: 'primary' as const
      }];
    }
  }

  // -------------------------------------------------------------------------
  // DETERMINISTIC SCRAPED KEYWORD AUDIT:
  // Criteria 1: Number of times each keyword is used (frequency)
  // Criteria 2: Whether all of them have been used (coverage)
  // Criteria 3: If keywords are present in headings (H1, H2, H3)
  // -------------------------------------------------------------------------
  const fullPageText = `${extractedData.metaTitle} ${extractedData.metaDescription} ${extractedData.tags} ${extractedData.content} ${components.map(c => `${c.name} ${c.bodyContent} ${(c.listItems || []).join(' ')}`).join(' ')}`.toLowerCase();
  const normalizeForMatch = (t: string) => t.toLowerCase().replace(/[^a-z0-9₹%]+/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedPageText = ` ${normalizeForMatch(`${fullPageText} ${existingHeadings.map((h) => h.text).join(' . ')}`)} `;

  let usedKeywordsCount = 0;
  let keywordsInHeadingsCount = 0;
  let totalOccurrencesAll = 0;
  const keywordUsageCounts: Record<string, number> = {};
  const keywordStats: { keyword: string; count: number; inHeadings: boolean; inH1: boolean; inH2: boolean; inH3: boolean; priority: string }[] = [];

  for (const kwItem of safeKeywords) {
    const rawKw = kwItem.keyword.trim().toLowerCase();
    if (!rawKw) continue;

    // 1. Frequency count in page copy
    const kwNorm = normalizeForMatch(rawKw);
    const count = kwNorm ? normalizedPageText.split(` ${kwNorm} `).length - 1 : 0;
    totalOccurrencesAll += count;
    keywordUsageCounts[rawKw] = count;

    // 2. Heading presence check
    let inH1 = false;
    let inH2 = false;
    let inH3 = false;

    for (const h of existingHeadings) {
      const hTextLower = ` ${normalizeForMatch(h.text)} `;
      if (kwNorm && hTextLower.includes(` ${kwNorm} `)) {
        if (h.level === 'h1') inH1 = true;
        if (h.level === 'h2') inH2 = true;
        if (h.level === 'h3') inH3 = true;
      }
    }

    const inAnyHeading = inH1 || inH2 || inH3;
    if (count > 0) usedKeywordsCount++;
    if (inAnyHeading) keywordsInHeadingsCount++;

    keywordStats.push({
      keyword: kwItem.keyword,
      count,
      inHeadings: inAnyHeading,
      inH1,
      inH2,
      inH3,
      priority: kwItem.priority || 'secondary'
    });

    // Generate specific flags for unused keywords
    if (count === 0) {
      flags.push({
        id: `agent4-flag-unused-${kwItem.id || Math.random().toString(36).substr(2, 5)}`,
        agentOrigin: 'Agent 4: Keyword & Intent Mapping',
        guidelineSection: 'Structure and Keyword Mapping Guidelines',
        target: 'component',
        fieldName: kwItem.priority === 'primary' ? 'H1' : 'bodyContent',
        category: 'KEYWORD_MAPPING',
        severity: kwItem.priority === 'primary' ? 'critical' : kwItem.priority === 'secondary' ? 'warning' : 'info',
        issueTitle: `Scraped Target Keyword Unused: "${kwItem.keyword}" (0 occurrences)`,
        issueDescription: `The scraped target keyword "${kwItem.keyword}" was not used anywhere in the page body text or headings.`,
        whyThisSuggestionIsGiven: 'All scraped target keywords must be used in the content to capture high-intent search queries.',
        guidelineReference: 'Target Keyword Coverage Standard',
        proposedFixPreview: `Weave "${kwItem.keyword}" naturally into the section body copy.`,
        fixed: false
      });
    } else if (!inAnyHeading) {
      flags.push({
        id: `agent4-flag-missing-heading-${kwItem.id || Math.random().toString(36).substr(2, 5)}`,
        agentOrigin: 'Agent 4: Keyword & Intent Mapping',
        guidelineSection: 'Structure and Keyword Mapping Guidelines',
        target: 'component',
        fieldName: kwItem.priority === 'primary' ? 'H1' : 'H2',
        category: 'KEYWORD_MAPPING',
        severity: kwItem.priority === 'primary' ? 'critical' : kwItem.priority === 'secondary' ? 'warning' : 'info',
        issueTitle: `Target Keyword Missing from Headings: "${kwItem.keyword}"`,
        issueDescription: `The keyword "${kwItem.keyword}" is used in body copy (${count}x) but is absent from all H1, H2, and H3 headings.`,
        whyThisSuggestionIsGiven: 'Search engines place disproportionate ranking weight on headings. Placing target keywords in headings signals topical relevance.',
        guidelineReference: 'Heading Keyword Optimization Standards',
        proposedFixPreview: `Add "${kwItem.keyword}" to an ${kwItem.priority === 'primary' ? 'H1' : 'H2'} heading.`,
        fixed: false
      });
    }
  }

  // -------------------------------------------------------------------------
  // STRUCTURE GUIDELINE SPECIFIC EVALUATIONS (Agent 4 Rules)
  // -------------------------------------------------------------------------
  let structurePenalty = 0;

  // Rule 1: requirePrimaryKeywordInH1
  if (structureGuidelines.requirePrimaryKeywordInH1 && safeKeywords.length > 0) {
    const primaryKw = safeKeywords.find(k => k.priority === 'primary') || safeKeywords[0];
    const inH1 = existingHeadings.some(h => h.level === 'h1' && h.text.toLowerCase().includes(primaryKw.keyword.toLowerCase()));
    if (!inH1) {
      structurePenalty += 12;
      flags.push({
        id: `agent4-rule-h1-primary-${Date.now()}`,
        agentOrigin: 'Agent 4: Keyword & Intent Mapping',
        guidelineSection: 'Structure and Keyword Mapping Guidelines',
        target: 'component',
        fieldName: 'heading',
        category: 'STRUCTURE_MAPPING',
        severity: 'critical',
        issueTitle: `Structure Violation: Primary Keyword Missing from H1 ("${primaryKw.keyword}")`,
        issueDescription: `Structure & Keyword Mapping Guidelines mandate that the primary target keyword must be placed in the main page H1 heading.`,
        whyThisSuggestionIsGiven: 'Search engines and answer engines weight the H1 tag as the primary architectural relevance anchor for the entire page.',
        guidelineReference: 'Structure & Keyword Mapping Guidelines: H1 Primary Keyword Rule',
        proposedFixPreview: `Add "${primaryKw.keyword}" to the primary H1 title.`,
        fixed: false
      });
    }
  }

  // Rule 2: minKeywordFrequency
  if (structureGuidelines.minKeywordFrequency > 1) {
    safeKeywords.forEach((kwItem, idx) => {
      const occurrences = keywordUsageCounts[kwItem.keyword.toLowerCase()] || 0;
      if (occurrences > 0 && occurrences < structureGuidelines.minKeywordFrequency) {
        structurePenalty += 4;
        flags.push({
          id: `agent4-rule-min-freq-${idx}`,
          agentOrigin: 'Agent 4: Keyword & Intent Mapping',
          guidelineSection: 'Structure and Keyword Mapping Guidelines',
          target: 'component',
          fieldName: 'bodyContent',
          category: 'STRUCTURE_MAPPING',
          severity: 'warning',
          issueTitle: `Keyword Usage Below Target Frequency: "${kwItem.keyword}" (${occurrences}x < ${structureGuidelines.minKeywordFrequency}x)`,
          issueDescription: `The keyword "${kwItem.keyword}" appears only ${occurrences} time(s). Structure Guidelines set minimum frequency at ${structureGuidelines.minKeywordFrequency}x.`,
          whyThisSuggestionIsGiven: 'Sufficient topical depth requires core target terms to be reinforced across relevant sub-sections.',
          guidelineReference: `Structure Guidelines: Min Keyword Frequency (${structureGuidelines.minKeywordFrequency}x)`,
          proposedFixPreview: `Incorporate "${kwItem.keyword}" naturally into an additional section or FAQ.`,
          fixed: false
        });
      }
    });
  }

  // Rule 3: voiceQuestionHeadingsTarget
  if (structureGuidelines.voiceQuestionHeadingsTarget > 0 && existingHeadings.length > 0) {
    const questionHeadings = existingHeadings.filter(h => 
      /^(how|what|why|when|where|who|can|is|are|does|should|which)\b|\?$/i.test(h.text)
    );
    const questionPercent = Math.round((questionHeadings.length / existingHeadings.length) * 100);
    if (questionPercent < structureGuidelines.voiceQuestionHeadingsTarget) {
      structurePenalty += 5;
      flags.push({
        id: `agent4-rule-voice-headings-${Date.now()}`,
        agentOrigin: 'Agent 4: Keyword & Intent Mapping',
        guidelineSection: 'Structure and Keyword Mapping Guidelines',
        target: 'component',
        fieldName: 'heading',
        category: 'STRUCTURE_MAPPING',
        severity: 'info',
        issueTitle: `Voice & Question Headings Below Target (${questionPercent}% < ${structureGuidelines.voiceQuestionHeadingsTarget}%)`,
        issueDescription: `Structure Guidelines specify a ${structureGuidelines.voiceQuestionHeadingsTarget}% target for question-form headings to capture voice searches and direct LLM answer extraction.`,
        whyThisSuggestionIsGiven: 'Voice search and AI query engines map directly to natural language questions.',
        guidelineReference: 'Structure Guidelines: Voice & Question Architecture',
        proposedFixPreview: 'Format H2 or H3 section titles as direct customer questions (e.g. "What is...", "How does...").',
        fixed: false
      });
    }
  }

  // Rule 4: Heading order — single H1 first, H2 → H3 nesting without skips, FAQ section last.
  const structureFlags = checkHeadingStructure(extractedData.content || "");
  structureFlags.forEach(f => {
    structurePenalty += f.severity === "critical" ? 12 : 6;
    flags.push(f);
  });

  // -------------------------------------------------------------------------
  // SCORING FORMULA BASED ON STRUCTURE GUIDELINES & SCRAPED KEYWORDS:
  // 1. Coverage Ratio: Whether all of the scraped keywords have been used (35% weight)
  // 2. Headings Ratio: Whether the keywords are present in headings (35% weight)
  // 3. Frequency Health: Number of times used without stuffing (20% weight)
  // 4. Structure & Hierarchy Health: Evaluated from Structure Guidelines (10% weight)
  // -------------------------------------------------------------------------
  const totalKws = safeKeywords.length || 1;
  const coverageRatio = usedKeywordsCount / totalKws;
  const coverageScore = coverageRatio * 100;

  const headingRatio = keywordsInHeadingsCount / totalKws;
  const headingScore = headingRatio * 100;

  const avgOccurrences = totalOccurrencesAll / totalKws;
  let frequencyScore = 0;
  if (avgOccurrences >= 1.5 && avgOccurrences <= 6) {
    frequencyScore = 100;
  } else if (avgOccurrences > 0 && avgOccurrences < 1.5) {
    frequencyScore = 70;
  } else if (avgOccurrences > 6 && avgOccurrences <= 10) {
    frequencyScore = 80;
  } else if (avgOccurrences > 10) {
    frequencyScore = 50; // Keyword stuffing penalty
  } else {
    frequencyScore = 15; // Zero usage
  }

  const rawScore = Math.round(
    (coverageScore * 0.35) +
    (headingScore * 0.35) +
    (frequencyScore * 0.20) +
    (Math.max(0, 100 - structurePenalty * 3) * 0.10)
  );
  const score = Math.max(15, Math.min(100, rawScore - Math.min(25, structurePenalty)));

  const coverageStatus = usedKeywordsCount === totalKws 
    ? `All ${totalKws} scraped keywords used (${Math.round(coverageRatio * 100)}% coverage)`
    : `${usedKeywordsCount} of ${totalKws} scraped keywords used (${Math.round(coverageRatio * 100)}% coverage)`;
  
  const headingStatus = `${keywordsInHeadingsCount} of ${totalKws} present in headings (H1/H2/H3)`;
  const rationale = `Agent 4 Structure & Keyword Score: ${score}/100. ${coverageStatus}; ${headingStatus}; Structure guidelines compliance: ${Math.max(0, 100 - structurePenalty)}%; Average usage: ${avgOccurrences.toFixed(1)}x per keyword.`;

  // Build the structured heading assignment plan
  let plan: HeadingKeywordPlan = {
    headingAssignments: safeKeywords.map((k, idx) => ({
      headingText: existingHeadings[idx]?.text || `Key Section ${idx + 1}`,
      headingLevel: (existingHeadings[idx]?.level || (idx === 0 ? 'h1' : 'h2')),
      assignedKeyword: k.keyword,
      searchVolume: k.searchVolume,
      intent: k.intent,
      matchRationale: `Target keyword mapped to ${idx === 0 ? 'H1 primary headline' : 'H2 feature section'}`,
      suggestedHeadingRewrite: idx === 0 
        ? `${k.keyword} - Comprehensive Guide & Overview`
        : `${k.keyword}: Key Features, Standards & Usage`
    })),
    unplacedKeywords: safeKeywords.filter(k => !keywordStats.find(s => s.keyword === k.keyword && s.inHeadings)).map(k => ({
      keyword: k.keyword,
      searchVolume: k.searchVolume,
      intent: k.intent,
      recommendedPlacement: 'Add to H2 or H3 heading'
    })),
    headingsNeedingKeywords: existingHeadings.filter(h => !safeKeywords.some(k => h.text.toLowerCase().includes(k.keyword.toLowerCase()))).map(h => ({
      headingText: h.text,
      reason: 'Heading does not contain any scraped target keyword',
      suggestedKeywords: safeKeywords.slice(0, 2).map(k => k.keyword)
    }))
  };

  log.status = 'completed';
  log.durationMs = Date.now() - startTime;
  log.outputSummary = `Scraped Keyword Score: ${score}/100. ${usedKeywordsCount}/${totalKws} used, ${keywordsInHeadingsCount}/${totalKws} in headings, ${totalOccurrencesAll} total occurrences.`;

  return { plan, score, rationale, flags, log };
}

// -------------------------------------------------------------
// AGENT 5: CUSTOMER CENTRICITY & CONTENT AGENT
// Governed by Customer Centricity Guidelines:
// 1. Plain-language layman comprehension & target persona alignment
// 2. Journey-stage ordering & proactive objection handling
// 3. Friction pattern elimination & sentence/paragraph readability constraints
// -------------------------------------------------------------
export async function runAgent5CustomerCentricity(params: {
  extractedData: ExtractedPageData;
  contentGuidelines?: ContentGuidelines;
  productGuidelines?: ProductGuidelines;
  customerCentricityGuidelines?: CustomerCentricityGuidelines;
  readerContext?: string;
}): Promise<{ flags: AuditFlag[]; score: number; rationale: string; log: AgentExecutionLog }> {
  const startTime = Date.now();
  const customerGuidelines = normalizeCustomerCentricityGuidelines(params?.customerCentricityGuidelines);
  const log: AgentExecutionLog = {
    id: `log-agent-5-${Date.now()}`,
    agentId: 'agent-5',
    agentName: 'Agent 5: Customer Centricity Agent',
    role: 'Audits copy strictly against Customer Centricity Guidelines, layman accessibility, and UX friction patterns',
    model: modelFor('gate-customer'),
    status: 'running',
    timestamp: new Date().toISOString()
  };

  const flags: AuditFlag[] = [];
  const contentGuidelines = normalizeContentGuidelines(params?.contentGuidelines);
  const productGuidelines = normalizeProductGuidelines(params?.productGuidelines);
  const extractedData = params?.extractedData || { metaTitle: '', metaDescription: '', schema: '', sitemap: '', tags: '', content: '' };
  const readerContext = params?.readerContext || customerGuidelines.targetCustomerPersona;
  let score = 88;
  let rationale = "Content adheres to Customer Centricity Guidelines, written in accessible layman language with low friction.";

  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `You are the Customer Centricity Agent (Agent 5). You evaluate content purely from the perspective of the person reading it — a real customer trying to make a decision or complete a task — based strictly on the provided Customer Centricity Guidelines.

CUSTOMER CENTRICITY GUIDELINES:
- Target Persona: ${customerGuidelines.targetCustomerPersona || 'General consumer or decision-maker'}
- Empathy & Tone: ${customerGuidelines.empathyAndTone || 'Empathetic, clear, transparent, consultative'}
- Reading Level: ${customerGuidelines.readingAccessibility || '8th-9th Grade layman accessibility (clear, short sentences)'}
- Core Pain Points to Address: ${customerGuidelines.corePainPointsToAddress.join('; ') || 'Clarity on fees, ease of use, turnaround time'}
- Friction Patterns to Flag: ${customerGuidelines.frictionPatternsToFlag.join('; ') || 'Buried fees, unexplained asterisks, artificial countdowns'}
- Decision Journey Order: ${customerGuidelines.decisionJourneyOrder || 'Eligibility → Pricing/Costs → Features → How to Apply'}
- Objection Handling Rules: ${customerGuidelines.objectionHandlingRules.join('; ') || 'Upfront answers on guarantees, credit impact, cancellation'}
- Trust Signals: ${customerGuidelines.trustAndReassuranceSignals.join('; ') || 'Explicit privacy, transparent contact, security guarantees'}
- Custom Rules: ${customerGuidelines.customCustomerRules || 'None'}

PAGE CONTENT:
${contentForGate(extractedData.content)}

Evaluate for:
1. Plain-language comprehension — flag jargon used without explanation nearby for the target persona.
2. Journey-stage relevance — does information appear in the order a real decision-maker needs it, or is it organized for search engines instead?
3. Objection/anxiety handling — are customer worries and objections handled proactively according to the rules?
4. Transparency over conversion pressure — flag buried fees, asterisks with fine print, unearned urgency language, or aggressive countdowns.
5. Reading accessibility — sentence length (> ${customerGuidelines.maxSentenceWords || 20} words), paragraph length (> ${customerGuidelines.maxParagraphSentences || 3} sentences), unexplained numbers.

${GATE_SEVERITY_RULES}

OUTPUT: Respond with ONLY a valid JSON array, no markdown fences, no commentary:
[
  {
    "section": "content",
    "category": "Customer",
    "severity": "low" | "medium" | "high",
    "issue": "specific description of what's unclear, missing, or manipulative, quoting the relevant text",
    "suggestion": "specific, concrete fix — not generic advice like 'be clearer', but the actual clarification, reordering, or addition needed",
    "quote": "the exact text from the page this is about (empty if the issue is something missing)",
    "rule": "the specific guideline rule or standard it breaks",
    "needsInfoNotOnPage": true | false
  }
]
Only flag concrete issues you can point to in the text. Return [] if genuinely customer-friendly.`;

      const res = await generateWithAgentModel(ai, {
        job: 'gate-customer',
        contents: prompt,
        config: { responseMimeType: 'application/json', maxOutputTokens: 2048 }
      });

      const parsedArray = parseJsonArray(res.text);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach((f: any, idx: number) => {
          const sev = gateSeverity(f);
          flags.push({
            id: `agent5-flag-${Date.now()}-${idx}`,
            agentOrigin: 'Agent 5: Customer Centricity',
            guidelineSection: 'Customer-Centricity Guidelines',
            target: 'component',
            fieldName: 'bodyContent',
            category: 'CUSTOMER_CENTRICITY',
            severity: sev,
            issueTitle: titleFrom(f.issue, 'Readability and clarity'),
            issueDescription: f.issue || 'Content lacks customer clarity or reader accessibility.',
            whyThisSuggestionIsGiven: 'Customer centricity reduces cognitive friction, builds trust, and helps users make informed decisions.',
            guidelineReference: 'Customer Centricity Guidelines: Layman Comprehension & Friction Elimination',
            proposedFixPreview: (f.suggestion || 'Clarify phrasing for the reader in plain terms.') + editorNote(f),
            fixed: false
          });
        });
        if (parsedArray.length > 0) {
          score = Math.max(40, 100 - (parsedArray.length * 7));
          rationale = `Agent 5 identified ${parsedArray.length} customer centricity / UX friction issue(s) based on guidelines.`;
        }
      }
    } catch (e: any) {
      console.warn("Agent 5 LLM warning:", e.message);
    }
  }

  // Deterministic checks for Customer Centricity Guidelines & Readability
  const textSample = extractedData.content || '';
  // Only prose paragraphs count: headings, tables and lists are already scannable.
  const paragraphs = textSample
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p && !/^(#{1,6}\s|\||[-*•]\s|\d+[.)]\s)/.test(p));

  const maxSentencesAllowed = customerGuidelines.maxParagraphSentences || 3;
  const maxWordsAllowed = customerGuidelines.maxSentenceWords || 20;

  // 1. Paragraph constraints, scaled by how much of the page is affected (long pages are not punished for length alone).
  let longParagraphs = 0;
  paragraphs.forEach(p => {
    if (splitSentences(p).length > maxSentencesAllowed) longParagraphs++;
  });
  const longShare = paragraphs.length ? longParagraphs / paragraphs.length : 0;

  if (longParagraphs > 0) {
    score = Math.max(20, score - Math.min(24, Math.round(longShare * 40) + 2));
    flags.push({
      id: `agent5-rule-long-para-${Date.now()}`,
      agentOrigin: 'Agent 5: Customer Centricity',
      guidelineSection: 'Customer-Centricity Guidelines',
      target: 'component',
      fieldName: 'bodyContent',
      category: 'CUSTOMER_CENTRICITY',
      severity: longShare > 0.25 ? 'warning' : 'info',
      issueTitle: `Dense Wall of Text (${longParagraphs} of ${paragraphs.length} paragraphs exceed ${maxSentencesAllowed} sentences)`,
      issueDescription: `Customer Centricity Guidelines require paragraphs to be capped at ${maxSentencesAllowed} sentences to keep copy easily readable and mobile-friendly.`,
      whyThisSuggestionIsGiven: 'Shorter paragraphs significantly improve reader retention and reduce cognitive fatigue.',
      guidelineReference: `Customer Centricity Guidelines: Paragraph Constraints (Max ${maxSentencesAllowed} sentences)`,
      proposedFixPreview: 'Break dense paragraphs into 2-sentence chunks with bulleted lists.',
      fixed: false
    });
  }

  // 2. Friction Patterns Check from Customer Centricity Guidelines
  if (customerGuidelines.frictionPatternsToFlag && customerGuidelines.frictionPatternsToFlag.length > 0) {
    customerGuidelines.frictionPatternsToFlag.forEach((pattern, idx) => {
      if (pattern && textSample.toLowerCase().includes(pattern.toLowerCase())) {
        score = Math.max(20, score - 6);
        flags.push({
          id: `agent5-rule-friction-${idx}`,
          agentOrigin: 'Agent 5: Customer Centricity',
          guidelineSection: 'Customer-Centricity Guidelines',
          target: 'component',
          fieldName: 'bodyContent',
          category: 'CUSTOMER_CENTRICITY',
          severity: 'warning',
          issueTitle: `UX Friction Pattern Detected: "${pattern}"`,
          issueDescription: `The copy exhibits a friction pattern ("${pattern}") flagged by Customer Centricity Guidelines.`,
          whyThisSuggestionIsGiven: 'Customers react negatively to hidden conditions, unearned urgency, or obscured terms.',
          guidelineReference: `Customer Centricity Guidelines: Flagged Friction Pattern [${pattern}]`,
          proposedFixPreview: `Remove "${pattern}" or replace with transparent, upfront customer terms.`,
          fixed: false
        });
      }
    });
  }

  // 3. Forbidden Clichés Check from Content Guidelines
  if (contentGuidelines.forbiddenCliches && contentGuidelines.forbiddenCliches.length > 0) {
    contentGuidelines.forbiddenCliches.forEach((cliche, idx) => {
      if (cliche && textSample.toLowerCase().includes(cliche.toLowerCase())) {
        score = Math.max(20, score - 6);
        flags.push({
          id: `agent5-rule-cliche-${idx}`,
          agentOrigin: 'Agent 5: Customer Centricity',
          guidelineSection: 'Content Guidelines',
          target: 'component',
          fieldName: 'bodyContent',
          category: 'CUSTOMER_CENTRICITY',
          severity: 'warning',
          issueTitle: `Forbidden Cliché Detected: "${cliche}"`,
          issueDescription: `The copy contains generic filler phrase "${cliche}" banned by Content Guidelines.`,
          whyThisSuggestionIsGiven: 'Generic clichés dilute brand credibility and signal AI-generated copy.',
          guidelineReference: `Content Guidelines: Forbidden Clichés [${cliche}]`,
          proposedFixPreview: `Replace "${cliche}" with specific, factual layman language.`,
          fixed: false
        });
      }
    });
  }

  // 4. Sentence Length Readability Check (Target based on maxSentenceWords)
  const allSentences = paragraphs.flatMap(p => splitSentences(p));
  const wordsPerSentence = allSentences.map(s => s.split(/\s+/).length);
  const avgWords = wordsPerSentence.length > 0 ? (wordsPerSentence.reduce((a, b) => a + b, 0) / wordsPerSentence.length) : 16;
  const runOnCount = wordsPerSentence.filter(w => w > (maxWordsAllowed + 10)).length;
  const runOnShare = wordsPerSentence.length ? runOnCount / wordsPerSentence.length : 0;

  if (runOnCount > 2 && runOnShare > 0.05) {
    score = Math.max(20, score - Math.min(15, Math.round(runOnShare * 60)));
    flags.push({
      id: `agent5-rule-runon-${Date.now()}`,
      agentOrigin: 'Agent 5: Customer Centricity',
      guidelineSection: 'Customer-Centricity Guidelines',
      target: 'component',
      fieldName: 'bodyContent',
      category: 'CUSTOMER_CENTRICITY',
      severity: 'warning',
      issueTitle: `Run-On Sentences Detected (${runOnCount} sentences > ${maxWordsAllowed + 10} words)`,
      issueDescription: `Customer Centricity Guidelines target crisp sentences (~${maxWordsAllowed} words). Multiple sentences are excessively long.`,
      whyThisSuggestionIsGiven: 'Easily readable content requires short, punchy sentences for layman comprehension.',
      guidelineReference: `Customer Centricity Guidelines: Readability Standards (~${maxWordsAllowed} words)`,
      proposedFixPreview: 'Split complex compound sentences into crisp, single-clause statements.',
      fixed: false
    });
  }

  score = Math.max(20, Math.min(100, score));
  rationale = `Agent 5 Customer Centricity Score: ${score}/100. Evaluated Customer Centricity Guidelines (${customerGuidelines.targetCustomerPersona || 'Target Customer'}), layman language accessibility, average sentence length (${avgWords.toFixed(1)} words), and paragraph conciseness.`;

  log.status = 'completed';
  log.durationMs = Date.now() - startTime;
  log.outputSummary = `Customer Centricity Score: ${score}/100. Generated ${flags.length} customer centricity flags.`;

  return { flags, score, rationale, log };
}

// -------------------------------------------------------------
// AGENT 6: EEAT & GEO AGENT
// Scoring strictly based on GEO Guidelines:
// 1. Verifiable statistics & metric density (percentages, benchmarks)
// 2. Direct answer blocks (40-50 words) optimized for AI Overviews / Perplexity
// 3. Entity clarity & named institutional/author trust signals
// 4. Citation formatting (clear attributions, data sources)
// -------------------------------------------------------------
export async function runAgent6EeatGeo(params: {
  extractedData: ExtractedPageData;
  geoGuidelines?: GEOGuidelines;
  productGuidelines?: ProductGuidelines;
  seoGuidelines?: SEOGuidelines;
}): Promise<{ flags: AuditFlag[]; score: number; rationale: string; log: AgentExecutionLog }> {
  const startTime = Date.now();
  const log: AgentExecutionLog = {
    id: `log-agent-6-${Date.now()}`,
    agentId: 'agent-6',
    agentName: 'Agent 6: EEAT & GEO Agent',
    role: 'Audits copy strictly against GEO Guidelines (verifiable statistics, 40-50 word direct answer blocks, entity clarity, citation formatting)',
    model: modelFor('gate-eeat-geo'),
    status: 'running',
    timestamp: new Date().toISOString()
  };

  const flags: AuditFlag[] = [];
  const geoGuidelines = normalizeGeoGuidelines(params?.geoGuidelines);
  const productGuidelines = normalizeProductGuidelines(params?.productGuidelines);
  const extractedData = params?.extractedData || { metaTitle: '', metaDescription: '', schema: '', sitemap: '', tags: '', content: '' };
  let score = 85;
  let rationale = "Content audited against GEO Guidelines for AI Overviews, Perplexity, and ChatGPT search citations.";

  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `You are the EEAT/GEO Agent. You evaluate content for two related but distinct things: (1) EEAT — Experience, Expertise, Authoritativeness, Trust, per Google's quality standards (apply YMYL strictness when the topic is finance, health, legal or safety); and (2) GEO — how likely this content is to be confidently cited by AI answer engines (ChatGPT, Perplexity, AI Overviews, etc.).

${GATE_SEVERITY_RULES}

SECTIONS TO EVALUATE:
metaTitle: ${extractedData.metaTitle}
metaDescription: ${extractedData.metaDescription}
schema (truncated): ${(extractedData.schema || "").slice(0, 2500)}
sitemap: ${extractedData.sitemap}
tags: ${extractedData.tags}
${contentForGate(extractedData.content)}

Check for:
EEAT:
- Missing author attribution/credentials on informational content
- Claims about regulation, rates, or borrower rights not tied to a citable source
- Missing or incomplete trust signals (registration numbers, grievance contact, full fee disclosure)
- Stale or missing "last updated" / dateModified signals on figures likely to change

GEO:
- Vague or marketing-soft language where a precise extractable fact should be ("competitive rates" instead of the actual range)
- Sections that require surrounding context to be understood as a standalone quotable answer
- Missing or inconsistent entity naming (product name, legal entity, regulator) that would make it hard for an LLM to resolve who/what is being described
- Absence of original, specific data points where a generic claim is made instead

OUTPUT: Respond with ONLY a valid JSON array, no markdown fences, no commentary:
[
  {
    "section": "metaTitle" | "metaDescription" | "schema" | "sitemap" | "tags" | "content",
    "category": "EEAT" | "GEO",
    "severity": "low" | "medium" | "high",
    "issue": "specific description, quoting the vague/missing/contradictory text",
    "suggestion": "specific fix — the actual citable fact, attribution, or consistency correction needed",
    "quote": "the exact text from the page this is about (empty if the issue is something missing)",
    "rule": "the specific guideline rule or standard it breaks",
    "needsInfoNotOnPage": true | false
  }
]
Return [] for a category with no issues. Do not flag SEO mechanics.`;

      const res = await generateWithAgentModel(ai, {
        job: 'gate-eeat-geo',
        contents: prompt,
        config: { responseMimeType: 'application/json', maxOutputTokens: 2048 }
      });

      const parsedArray = parseJsonArray(res.text);
      if (Array.isArray(parsedArray)) {
        parsedArray.forEach((f: any, idx: number) => {
          const sev = gateSeverity(f);
          const subCat: 'EEAT' | 'GEO' = (f.category?.toUpperCase() === 'GEO' ? 'GEO' : 'EEAT');
          const section = String(f.section || 'content');
          const isBackend = ['metatitle', 'metadescription', 'schema', 'sitemap', 'tags'].includes(section.toLowerCase());
          flags.push({
            id: `agent6-flag-${Date.now()}-${idx}`,
            agentOrigin: 'Agent 6: EEAT & GEO',
            guidelineSection: 'EEAT and GEO Citations Guidelines',
            target: isBackend ? 'backend_seo' : 'component',
            componentId: isBackend ? undefined : 'page_body_content',
            fieldName: isBackend ? section : 'bodyContent',
            category: 'EEAT_GEO',
            subCategory: subCat,
            severity: sev,
            issueTitle: titleFrom(f.issue, `${f.category || 'EEAT/GEO'} issue in ${f.section || 'content'}`),
            issueDescription: f.issue || 'Content lacks EEAT authority or GEO citation readiness.',
            whyThisSuggestionIsGiven: 'Enhances YMYL trust signals and AI answer engine citability.',
            guidelineReference: `EEAT & GEO Standards (${f.category || 'EEAT'})`,
            proposedFixPreview: (f.suggestion || 'Apply corrective attribution or citable fact.') + editorNote(f),
            fixed: false
          });
        });
        if (parsedArray.length > 0) {
          score = Math.max(40, 100 - (parsedArray.length * 9));
          rationale = `Agent 6 identified ${parsedArray.length} EEAT / GEO citation issue(s).`;
        }
      }
    } catch (e: any) {
      console.warn("Agent 6 LLM error:", e.message);
    }
  }

  // Deterministic checks against GEO Guidelines
  const textContent = extractedData.content || '';

  // 1. Metric / Number Density Check
  const metricMatches = textContent.match(/\b\d+(\.\d+)?(%|\s*percent|\s*k|\s*m|\s*billion|\s*million|\s*x|\s*hours|\s*days|\s*seconds|\s*pts)?\b/gi) || [];
  const hasStatistics = metricMatches.length >= 3;
  if (!hasStatistics) {
    score = Math.max(20, score - 15);
    flags.push({
      id: `agent6-rule-metrics-${Date.now()}`,
      agentOrigin: 'Agent 6: EEAT & GEO',
      guidelineSection: 'EEAT and GEO Citations Guidelines',
      target: 'component',
      fieldName: 'bodyContent',
      category: 'EEAT_GEO',
      subCategory: 'GEO',
      severity: 'info',
      issueTitle: 'Low Statistical Density for GEO Citation',
      issueDescription: `Page contains only ${metricMatches.length} quantifiable figures. AI answer engines prefer specific, extractable facts.`,
      whyThisSuggestionIsGiven: 'LLMs require factual, quantifiable benchmarks to extract and cite in answer cards.',
      guidelineReference: 'GEO Guidelines: Statistical Proof Density Standard',
      proposedFixPreview: 'State the specific figures that already exist in the source or approved product facts (rates, fees, limits, timelines) instead of vague wording. Do not invent new numbers; an editor must supply any missing data.',
      fixed: false
    });
  }

  // 2. Direct Answer Capsules Check (40-50 word answer under headings)
  const answerCapsules = textContent.split(/\n\s*\n/).filter(p => {
    const wordCount = p.trim().split(/\s+/).length;
    return wordCount >= 35 && wordCount <= 60;
  });
  if (answerCapsules.length === 0) {
    score = Math.max(20, score - 12);
    flags.push({
      id: `agent6-rule-capsule-${Date.now()}`,
      agentOrigin: 'Agent 6: EEAT & GEO',
      guidelineSection: 'EEAT and GEO Citations Guidelines',
      target: 'component',
      fieldName: 'bodyContent',
      category: 'EEAT_GEO',
      subCategory: 'GEO',
      severity: 'warning',
      issueTitle: 'Missing 40-50 Word Direct Answer Capsules',
      issueDescription: 'No standalone 40-50 word summary answers detected under headings. GEO Guidelines require direct answer capsules for AI Overview snippets.',
      whyThisSuggestionIsGiven: 'Perplexity and Google AI Overviews extract self-contained 40-50 word summary definitions directly.',
      guidelineReference: 'GEO Guidelines: Direct Answer Capsules',
      proposedFixPreview: 'Add a concise 40-50 word direct definition immediately following the primary H2 heading.',
      fixed: false
    });
  }

  score = Math.max(20, Math.min(100, score));
  rationale = `GEO Guidelines Score: ${score}/100. Evaluated statistical proof density (${metricMatches.length} metrics found), direct answer capsules (${answerCapsules.length} detected), and AI citation readiness.`;

  log.status = 'completed';
  log.durationMs = Date.now() - startTime;
  log.outputSummary = `GEO Guidelines Score: ${score}/100. Metrics: ${metricMatches.length}, Direct capsules: ${answerCapsules.length}, generated ${flags.length} GEO flags.`;

  return { flags, score, rationale, log };
}

// -------------------------------------------------------------
// AGENT 7: THE MAKER
// The only agent that writes. Round 1 is fully independent: it sees the source page and
// optional context (target keywords, approved product facts) and never the gates' rules.
// From round 2 it receives the consolidated notes from the five review gates and the
// verification gate, and revises its own previous draft.
// -------------------------------------------------------------

const STRING_LIST = { type: Type.ARRAY, items: { type: Type.STRING } };

const PAGE_DRAFT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    metaTitle: { type: Type.STRING },
    metaDescription: { type: Type.STRING },
    h1: { type: Type.STRING },
    intro: STRING_LIST,
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          h2: { type: Type.STRING },
          paragraphs: STRING_LIST,
          bullets: STRING_LIST,
          h3s: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { h3: { type: Type.STRING }, paragraphs: STRING_LIST, bullets: STRING_LIST },
              required: ['h3', 'paragraphs'],
            },
          },
          table: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              headers: STRING_LIST,
              rows: { ...STRING_LIST, description: 'Each row as "cell | cell | cell"' },
            },
          },
        },
        required: ['h2', 'paragraphs'],
      },
    },
    faqs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } },
        required: ['question', 'answer'],
      },
    },
  },
  required: ['metaTitle', 'metaDescription', 'h1', 'intro', 'sections', 'faqs'],
};

/** Strips stray markdown the model sometimes leaves inside plain-text fields. */
function cleanDraftText(d: PageDraft): PageDraft {
  const clean = (s: string) =>
    sanitizeGrammarAndPunctuation(
      s.replace(/^#{1,6}\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^[-*•]\s+/, '').replace(/\s{2,}/g, ' ').trim()
    );
  const list = (a: string[]) => a.map(clean).filter(Boolean);
  return {
    metaTitle: clean(d.metaTitle),
    metaDescription: clean(d.metaDescription),
    h1: clean(d.h1),
    intro: list(d.intro),
    sections: d.sections.map((s) => ({
      ...s,
      h2: clean(s.h2),
      paragraphs: list(s.paragraphs),
      bullets: list(s.bullets),
      h3s: s.h3s.map((h) => ({ h3: clean(h.h3), paragraphs: list(h.paragraphs), bullets: list(h.bullets) })),
    })),
    faqs: d.faqs.map((f) => ({ question: clean(f.question), answer: clean(f.answer) })),
  };
}

function approvedProductFacts(p: ProductGuidelines): string {
  return [
    p.productName && `Product: ${p.productName}`,
    p.brandName && `Brand: ${p.brandName}`,
    p.uniqueSellingPoints?.length ? `Unique selling points: ${p.uniqueSellingPoints.join('; ')}` : '',
    p.coreValueProps?.length ? `Core value propositions: ${p.coreValueProps.join('; ')}` : '',
    p.complianceNotes && `Compliance notes / mandatory disclosures: ${p.complianceNotes}`,
    p.eeatCredentials && `Verified credentials: ${p.eeatCredentials}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function runAgent7Maker(params: {
  round: number;
  sourceMarkdown: string;
  sourceTitle: string;
  sourceDescription: string;
  url?: string;
  keywords: KeywordItem[];
  productGuidelines: ProductGuidelines;
  readerContext?: string;
  previousDraft?: PageDraft;
  feedback?: MakerFeedbackItem[];
  /** Limits what a revision may change (e.g. only one section). */
  scopeInstruction?: string;
}): Promise<{ draft: PageDraft; log: AgentExecutionLog }> {
  const startTime = Date.now();
  const log: AgentExecutionLog = {
    id: `log-agent-7-${params.round}-${Date.now()}`,
    agentId: 'agent-7',
    agentName: 'Agent 7: The Maker',
    role: !params.previousDraft
      ? 'Writes the optimized page freely from the source content'
      : `Revises its draft to resolve ${params.feedback?.length || 0} review notes`,
    model: AGENT_PRIMARY_MODEL,
    status: 'running',
    timestamp: new Date().toISOString(),
  };

  const ai = getAIClient();
  if (!ai) {
    throw new Error('The maker needs an LLM key. Set GEMINI_API_KEY (and optionally GROQ_API_KEY) in .env and restart the server.');
  }

  const pg = params.productGuidelines;
  const keywordLines = params.keywords
    .filter((k) => k?.keyword)
    .slice(0, 12)
    .map((k) => `- ${k.keyword} (${k.priority}${k.intent ? `, ${k.intent}` : ''})`)
    .join('\n');
  const facts = approvedProductFacts(pg);
  const source = `Title: ${params.sourceTitle || '(none)'}
Description: ${params.sourceDescription || '(none)'}

${(params.sourceMarkdown || '').slice(0, 30000)}`;

  const truthRule = `One rule is not negotiable because it concerns truth, not style: do not invent facts. Every figure, price, rate, fee, limit, date, statistic, certification, award, guarantee, person or organisation you mention must come from the SOURCE PAGE or the APPROVED PRODUCT FACTS. If the source has no number for something, write the sentence without one.`;

  const outputSpec = `OUTPUT FIELDS (plain text in every field — no markdown symbols such as #, ** or leading dashes):
- metaTitle, metaDescription: the search result title and snippet.
- h1: exactly one main heading.
- intro: 1-3 short paragraphs; the first one answers the reader's main question directly.
- sections: the H2 sections in the order a reader needs them. Use h3s only for genuine sub-topics of their H2. bullets and table are optional (table rows as "cell | cell | cell").
- faqs: questions real readers ask, each answered in 2-4 sentences. FAQs are rendered after all sections, so do not create an FAQ H2 yourself.`;

  let prompt: string;
  if (!params.previousDraft) {
    prompt = `You are Agent 7, the Maker — the only writer in this pipeline. Rewrite the page below into the strongest version you can: for real readers first, and for search engines and AI answer engines second.

You have full creative freedom over structure, headings, order, wording, tone, length and formatting. You are not bound by any checklist. Specialist reviewers will read your draft afterwards and send you notes.

${truthRule}

${outputSpec}

CONTEXT (use it if it helps):
Page URL: ${params.url || 'n/a'}
Product: ${pg.productName || 'n/a'}${pg.brandName ? `\nBrand: ${pg.brandName}` : ''}
Audience: ${params.readerContext || pg.targetAudience || 'n/a'}
${keywordLines ? `Search terms people use for this topic:\n${keywordLines}` : ''}

${facts ? `APPROVED PRODUCT FACTS (may be used):\n${facts}\n` : ''}
SOURCE PAGE:
${source}`;
  } else {
    const notes = (params.feedback || [])
      .map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] [${f.source}] ${f.issue}${f.suggestion ? ` → ${f.suggestion}` : ''}`)
      .join('\n');
    prompt = `You are Agent 7, the Maker. Your previous draft was reviewed by the compliance, SEO, keyword & structure, customer-centricity and EEAT/GEO gates, and by the verification gate. Revise your draft so that every note below is resolved.

Keep everything that was not criticised. Restructure if that is the best way to resolve a note. Notes are ordered most important first; CRITICAL notes block publishing.

${truthRule} If a note asks for information that is not in the source or the approved facts, resolve it without inventing anything: rephrase, soften or remove the claim.

${outputSpec}
${params.scopeInstruction ? `\n${params.scopeInstruction}\n` : ''}
REVIEW NOTES:
${notes || '(none)'}

YOUR PREVIOUS DRAFT (JSON):
${JSON.stringify(params.previousDraft)}

${facts ? `APPROVED PRODUCT FACTS:\n${facts}\n` : ''}
SOURCE PAGE (for fact checking):
${source}`;
  }

  let draft: PageDraft | null = null;
  let lastError = '';
  for (let attempt = 1; attempt <= 2 && !draft; attempt++) {
    try {
      const res = await generateWithAgentModel(ai, {
        job: 'maker',
        contents: attempt === 1 ? prompt : `${prompt}\n\nYour previous reply was not valid JSON for the required fields. Reply with the JSON object only.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: PAGE_DRAFT_RESPONSE_SCHEMA,
          temperature: params.round === 1 ? 0.7 : 0.4,
          maxOutputTokens: 16384,
        },
        timeoutMs: 150_000,
      });
      draft = coercePageDraft(cleanJsonParse<any>(res.text || '', null));
      if (!draft) lastError = 'Maker returned an incomplete draft (missing H1 or sections).';
    } catch (err: any) {
      lastError = err?.message || String(err);
      if (/^No model could complete/.test(lastError)) break; // nothing left to try
    }
  }
  if (!draft) {
    log.status = 'failed';
    log.durationMs = Date.now() - startTime;
    throw new Error(`Maker failed in round ${params.round}: ${lastError}`);
  }

  draft = cleanDraftText(draft);
  log.status = 'completed';
  log.durationMs = Date.now() - startTime;
  log.outputSummary = `Round ${params.round}: H1 "${draft.h1.slice(0, 60)}", ${draft.sections.length} sections, ${draft.faqs.length} FAQs, ${draftPlainText(draft).split(/\s+/).length} words.`;
  return { draft, log };
}

// -------------------------------------------------------------
// AGENT 8: VERIFICATION & ADVISORY GATE
// Final quality gate. It decides whether the maker's draft qualifies for publishing:
// all five review gates must pass, no forbidden phrases, and no facts or figures
// that are absent from the source. It also compiles the notes sent back to the maker.
// -------------------------------------------------------------

const SEVERITY_ORDER: Record<FlagSeverity, number> = { critical: 0, warning: 1, info: 2, passed: 3 };

export function isGatePassed(score: number, flags: AuditFlag[], threshold: number): boolean {
  return score >= threshold && !flags.some((f) => f.severity === 'critical');
}

export async function runAgent8VerificationGate(params: {
  round: number;
  draft: PageDraft;
  gates: GateResult[];
  sourceText: string;
  allowedFactsText: string;
  productGuidelines: ProductGuidelines;
  passThreshold: number;
  overallScore: number;
}): Promise<{ verification: VerificationResult; feedback: MakerFeedbackItem[]; log: AgentExecutionLog }> {
  const startTime = Date.now();
  const log: AgentExecutionLog = {
    id: `log-agent-8-${params.round}-${Date.now()}`,
    agentId: 'agent-8',
    agentName: 'Agent 8: Verification & Advisory Gate',
    role: 'Decides whether the draft qualifies for publishing and compiles the notes for the maker',
    model: modelFor('verify-fidelity'),
    status: 'running',
    timestamp: new Date().toISOString(),
  };

  const draftText = draftPlainText(params.draft);
  const blocking: string[] = [];
  const own: MakerFeedbackItem[] = [];

  // 1. Forbidden phrases (deterministic).
  const forbidden = runDeterministicAntiHallucinationChecks({
    text: draftText,
    forbiddenPhrases: params.productGuidelines.forbiddenPhrases || [],
  }).forbiddenWordsFound;
  forbidden.forEach((p) => {
    blocking.push(`Forbidden phrase used: "${p}"`);
    own.push({ source: 'Agent 8 Verification', target: 'component', severity: 'critical', issue: `The draft uses the forbidden phrase "${p}".`, suggestion: `Remove or rephrase "${p}".` });
  });

  // 2. Figures that do not exist in the source or approved facts (deterministic).
  const unsupportedFigures = findUnsupportedFigures(draftText, `${params.sourceText}\n${params.allowedFactsText}`);
  if (unsupportedFigures.length) {
    blocking.push(`Figures not found in the source: ${unsupportedFigures.slice(0, 8).join(', ')}`);
    own.push({
      source: 'Agent 8 Verification', target: 'component',
      severity: 'critical',
      issue: `These figures do not appear in the source page or approved product facts: ${unsupportedFigures.join(', ')}.`,
      suggestion: 'Remove each figure or replace it with the exact figure from the source. Do not estimate.',
    });
  }

  // 3. Semantic fidelity: invented claims or changed meaning (LLM).
  const ai = getAIClient();
  if (ai) {
    try {
      const res = await generateWithAgentModel(ai, {
        job: 'verify-fidelity',
        contents: `You are Agent 8, the verification gate. Compare the DRAFT with the SOURCE and APPROVED FACTS. List every claim in the draft that is not supported by them: invented features, guarantees, certifications, people or organisations, contradicted facts, or meaning that changed. Ignore style, wording, structure and SEO.

Severity: "high" if publishing it would mislead a reader or create legal/regulatory risk; "medium" if it is an unsupported but harmless embellishment.

Respond with ONLY a JSON array: [{"claim": "exact text from the draft", "problem": "why it is unsupported", "severity": "high" | "medium"}]. Return [] if everything is supported.

APPROVED FACTS:
${params.allowedFactsText || '(none)'}

SOURCE:
${params.sourceText.slice(0, 20000)}

DRAFT:
${draftToMarkdown(params.draft).slice(0, 20000)}`,
        config: { responseMimeType: 'application/json', temperature: 0 },
        timeoutMs: 90_000,
      });
      const issues = parseJsonArray(res.text);
      (Array.isArray(issues) ? issues : []).slice(0, 15).forEach((i: any) => {
        if (!i?.claim) return;
        const high = String(i.severity).toLowerCase() === 'high';
        if (high) blocking.push(`Unsupported claim: "${String(i.claim).slice(0, 120)}"`);
        own.push({
          source: 'Agent 8 Verification', target: 'component',
          severity: high ? 'critical' : 'warning',
          issue: `Unsupported claim: "${i.claim}". ${i.problem || ''}`.trim(),
          suggestion: 'Remove the claim or restate only what the source says.',
        });
      });
    } catch (err: any) {
      console.warn('[Agent 8] Fidelity check skipped:', err?.message);
    }
  }

  // 4. Every review gate must pass.
  params.gates.forEach((g) => {
    if (!g.passed) {
      const crit = g.flags.filter((f) => f.severity === 'critical').length;
      blocking.push(
        `${g.gateName} did not pass (score ${g.score}${g.score < params.passThreshold ? ` < ${params.passThreshold}` : ''}${crit ? `, ${crit} critical` : ''})`
      );
    }
  });

  // Notes for the maker: every critical and warning flag, plus a few low-severity ones.
  const gateNotes: MakerFeedbackItem[] = params.gates.flatMap((g) =>
    g.flags
      .filter((f) => f.severity !== 'passed')
      .map((f) => ({
        source: g.gateName,
        severity: f.severity,
        issue: `${f.issueTitle}${f.issueDescription && f.issueDescription !== f.issueTitle ? ` — ${f.issueDescription}` : ''}`,
        suggestion: f.proposedFixPreview || '',
        field: f.fieldName,
        target: f.target,
      }))
  );
  const seen = new Set<string>();
  let infoCount = 0;
  const feedback = [...own, ...gateNotes]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .filter((n) => {
      const key = n.issue.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      if (n.severity === 'info') return ++infoCount <= 6;
      return true;
    })
    .slice(0, 40);

  const accepted = blocking.length === 0;
  const verification: VerificationResult = {
    verdict: accepted ? 'ACCEPT' : 'REJECT',
    reason: accepted
      ? `All five review gates passed (threshold ${params.passThreshold}), no forbidden phrases, and every figure and claim traces back to the source.`
      : `${blocking.length} blocking issue${blocking.length === 1 ? '' : 's'}: ${blocking.slice(0, 3).join('; ')}${blocking.length > 3 ? '…' : ''}`,
    restartFrom: accepted ? 'None' : 'Agent 7',
    failureContext: accepted ? undefined : feedback.map((f) => `[${f.severity}] ${f.issue}`).join('\n'),
    confidenceScore: params.overallScore,
    blockingIssues: blocking,
    unsupportedFigures,
    timestamp: new Date().toISOString(),
  };

  log.status = 'completed';
  log.durationMs = Date.now() - startTime;
  log.outputSummary = `Round ${params.round}: ${accepted ? 'APPROVED' : 'NOT QUALIFIED'} — ${blocking.length} blocking issue(s), ${feedback.length} note(s) for the maker.`;
  return { verification, feedback, log };
}

// -------------------------------------------------------------
// AGENT 9: ORCHESTRATOR
//   1. Agent 1 extracts the page (ground truth).
//   2. In parallel: gates 2-6 audit the ORIGINAL page (baseline score) and
//      Agent 7 writes its first draft independently.
//   3. Gates 2-6 audit the draft; Agent 8 decides whether it qualifies.
//   4. If not, all notes go back to Agent 7, which revises; repeat 3.
//   5. The approved draft (or the best-scoring one) is returned with both scores.
// -------------------------------------------------------------

const GATE_NAMES: Record<GateAgentId, string> = {
  'agent-2': 'Compliance gate',
  'agent-3': 'SEO backend gate',
  'agent-4': 'Keyword & structure gate',
  'agent-5': 'Customer-centricity gate',
  'agent-6': 'EEAT & GEO gate',
};

async function runReviewGates(params: {
  extracted: ExtractedPageData;
  components: ContentComponent[];
  keywords: KeywordItem[];
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  contentGuidelines: ContentGuidelines;
  geoGuidelines: GEOGuidelines;
  customerCentricityGuidelines: CustomerCentricityGuidelines;
  structureMappingGuidelines: StructureMappingGuidelines;
  readerContext?: string;
  passThreshold: number;
  componentId: string;
  emit: (stage: PipelineProgressEvent['stage'], status: PipelineProgressEvent['status'], message: string, extra?: Partial<PipelineProgressEvent>) => void;
  stage: 'baseline' | 'gates';
  round?: number;
}): Promise<{ gates: GateResult[]; flags: AuditFlag[]; keywordPlan: HeadingKeywordPlan; logs: AgentExecutionLog[] }> {
  const p = params;
  const wrap = async <T extends { flags: AuditFlag[]; score: number; rationale: string; log: AgentExecutionLog }>(
    id: GateAgentId,
    fn: () => Promise<T>
  ): Promise<T> => {
    p.emit(p.stage, 'start', `${GATE_NAMES[id]} reviewing`, { agentId: id, round: p.round });
    const r = await fn();
    const passed = isGatePassed(r.score, r.flags, p.passThreshold);
    p.emit(p.stage, 'end', `${GATE_NAMES[id]}: ${r.score}${passed ? ' (pass)' : ' (fail)'}`, { agentId: id, round: p.round, score: r.score, passed });
    return r;
  };

  const [a2, a3, a4, a5, a6] = await Promise.all([
    wrap('agent-2', () => runAgent2Compliance({ extractedData: p.extracted, productGuidelines: p.productGuidelines, seoGuidelines: p.seoGuidelines, contentGuidelines: p.contentGuidelines })),
    wrap('agent-3', () => runAgent3SeoBackend({ extractedData: p.extracted, seoGuidelines: p.seoGuidelines, productGuidelines: p.productGuidelines })),
    wrap('agent-4', async () => {
      const r = await runAgent4KeywordIntentMapping({ extractedData: p.extracted, keywords: p.keywords, components: p.components, structureMappingGuidelines: p.structureMappingGuidelines });
      return { ...r, flags: r.flags };
    }),
    wrap('agent-5', () => runAgent5CustomerCentricity({ extractedData: p.extracted, contentGuidelines: p.contentGuidelines, productGuidelines: p.productGuidelines, customerCentricityGuidelines: p.customerCentricityGuidelines, readerContext: p.readerContext })),
    wrap('agent-6', () => runAgent6EeatGeo({ extractedData: p.extracted, geoGuidelines: p.geoGuidelines, productGuidelines: p.productGuidelines, seoGuidelines: p.seoGuidelines })),
  ]);

  const byId: [GateAgentId, { flags: AuditFlag[]; score: number; rationale: string }][] = [
    ['agent-2', a2], ['agent-3', a3], ['agent-4', a4], ['agent-5', a5], ['agent-6', a6],
  ];

  // Normalise targets so the UI can attach every component flag to the page body.
  byId.forEach(([, r]) =>
    r.flags.forEach((f) => {
      if (f.target !== 'backend_seo') {
        f.target = 'component';
        f.componentId = p.componentId;
      }
    })
  );

  const gates: GateResult[] = byId.map(([id, r]) => ({
    gateId: id,
    gateName: GATE_NAMES[id],
    score: r.score,
    passed: isGatePassed(r.score, r.flags, p.passThreshold),
    rationale: r.rationale,
    flags: r.flags,
  }));

  const seen = new Set<string>();
  const flags = gates
    .flatMap((g) => g.flags)
    .filter((f) => {
      const key = `${f.target}-${f.fieldName}-${(f.issueTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return { gates, flags, keywordPlan: a4.plan, logs: [a2.log, a3.log, a4.log, a5.log, a6.log] };
}

/**
 * Makes every displayed score come from the gates themselves, so the header score, the
 * scorecard and the pipeline panel never disagree. Weights follow the guideline sections:
 * compliance (content + product) 40%, customer 20%, EEAT/GEO 20%, structure 10%, SEO 10%.
 */
export function alignScoresWithGates(nine: NineAgentScores, gates: GateResult[]): NineAgentScores {
  const s = (id: GateAgentId) => gates.find((g) => g.gateId === id)?.score ?? 0;
  const compliance = s('agent-2');
  const seo = s('agent-3');
  const structure = s('agent-4');
  const customer = s('agent-5');
  const eeatGeo = s('agent-6');
  const overall = Math.round(compliance * 0.4 + customer * 0.2 + eeatGeo * 0.2 + structure * 0.1 + seo * 0.1);
  return {
    ...nine,
    contentScore: compliance,
    productScore: compliance,
    complianceScore: compliance,
    seoScore: seo,
    seoBackendScore: seo,
    structureAndKeywordScore: structure,
    keywordCoverageScore: structure,
    customerCentricityScore: customer,
    eeatAndGeoScore: eeatGeo,
    eeatScore: eeatGeo,
    geoScore: eeatGeo,
    compositeScore: overall,
    overallPageScore: overall,
    overallScoreDisplay: nine.publishBlocked ? 'BLOCKED' : `${overall}`,
  };
}

export async function runAgent9OrchestrationPipeline(
  params: Parameters<typeof orchestratePipeline>[0]
): ReturnType<typeof orchestratePipeline> {
  const runId = params.runId || `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return runContext.run({ runId, pageUrl: params.url || params.backendData?.canonicalUrl }, () => orchestratePipeline({ ...params, runId }));
}

async function orchestratePipeline(params: {
  /** Identifier for usage logs; generated when omitted. */
  runId?: string;
  rawHtml?: string;
  url?: string;
  pastedText?: string;
  productGuidelines: ProductGuidelines;
  seoGuidelines: SEOGuidelines;
  contentGuidelines?: ContentGuidelines;
  geoGuidelines?: GEOGuidelines;
  customerCentricityGuidelines?: CustomerCentricityGuidelines;
  structureMappingGuidelines?: StructureMappingGuidelines;
  keywords: KeywordItem[];
  components: ContentComponent[];
  backendData: SEOBackendData;
  readerContext?: string;
  /** Revision rounds after the first draft (default 2, so at most 3 drafts). */
  maxRevisions?: number;
  /** Minimum score each review gate needs to pass (default 70). */
  passThreshold?: number;
  /** "optimize" (default) writes a new page; "revise" improves the content on screen. */
  mode?: 'optimize' | 'revise';
  /** What a revision may change (revise mode only). */
  reviseScope?: RevisionScope;
  onProgress?: (event: PipelineProgressEvent) => void;
}): Promise<{
  changeLog: DraftChange[];
  notesAddressed: MakerFeedbackItem[];
  report: OrchestratorReport;
  extractedData: ExtractedPageData;
  keywordPlan: HeadingKeywordPlan;
  deduplicatedFlags: AuditFlag[];
  baselineFlags: AuditFlag[];
  updatedComponents: ContentComponent[];
  updatedBackend: SEOBackendData;
  agentScores: AgentScoreBreakdown;
  overallScore: number;
  nineAgentScores: NineAgentScores;
  beforeScores: ScoreSnapshot;
  afterScores?: ScoreSnapshot;
  communicationBus: AgentMessagePacket[];
  finalVerdict: PipelineVerdict;
}> {
  const pipelineStartTime = Date.now();
  const pipelineRunId = params.runId || `run-${Date.now()}`;
  const logs: AgentExecutionLog[] = [];
  const bus: AgentMessagePacket[] = [];
  let packet = 1;
  const passThreshold = Math.max(0, Math.min(100, params.passThreshold ?? 70));
  const maxRounds = 1 + Math.max(0, Math.min(5, params.maxRevisions ?? 2));

  const emit = (
    stage: PipelineProgressEvent['stage'],
    status: PipelineProgressEvent['status'],
    message: string,
    extra: Partial<PipelineProgressEvent> = {}
  ) => {
    try {
      params.onProgress?.({ stage, status, message, at: new Date().toISOString(), ...extra });
    } catch {
      /* progress is best effort */
    }
  };

  const productGuidelines = normalizeProductGuidelines(params?.productGuidelines);
  const seoGuidelines = normalizeSeoGuidelines(params?.seoGuidelines);
  const contentGuidelines = normalizeContentGuidelines(params?.contentGuidelines);
  const geoGuidelines = normalizeGeoGuidelines(params?.geoGuidelines);
  const customerCentricityGuidelines = normalizeCustomerCentricityGuidelines(params?.customerCentricityGuidelines);
  const structureMappingGuidelines = normalizeStructureMappingGuidelines(params?.structureMappingGuidelines);
  const safeKeywords = Array.isArray(params?.keywords) ? params.keywords : [];
  const safeComponents = Array.isArray(params?.components) ? params.components : [];
  const safeBackendData = normalizeBackendData(params?.backendData);
  const pageUrl = params?.url || safeBackendData.canonicalUrl || '';
  const primaryComponent = safeComponents[0];
  const componentId = primaryComponent?.id || 'page_body_content';

  const mode: 'optimize' | 'revise' = params.mode === 'revise' ? 'revise' : 'optimize';
  const scope: RevisionScope = params.reviseScope || { kind: 'all' };
  const scopeLabel =
    mode === 'optimize' ? 'Full page'
    : scope.kind === 'all' ? 'Full page'
    : scope.kind === 'meta' ? 'Meta title & description'
    : scope.kind === 'body' ? 'Page body'
    : scope.kind === 'intro' ? 'H1 & introduction'
    : `Section "${scope.h2}"`;
  const reviseStart = mode === 'revise' ? componentToDraft(primaryComponent, safeBackendData) : null;
  if (mode === 'revise' && !reviseStart) {
    throw new Error('There is no page content to revise. Fetch a page first.');
  }
  // Content as it was originally scraped (before any optimization) stays part of the fact base.
  const originalSnapshotText = [
    safeBackendData.originalSnapshot?.metaTitle,
    safeBackendData.originalSnapshot?.metaDescription,
    ...safeComponents.map((c) =>
      [c.originalSnapshot?.bodyContent, c.originalSnapshot?.heroDescription, ...(c.originalSnapshot?.faqs || []).map((q) => `${q.question} ${q.answer}`)]
        .filter(Boolean)
        .join('\n')
    ),
  ]
    .filter(Boolean)
    .join('\n');

  // ---- 1. Agent 1: extraction (ground truth) ----
  emit('extract', 'start', 'Agent 1 extracting page content');
  const extractionResult = await runAgent1Extraction({ rawHtml: params?.rawHtml, url: params?.url, pastedText: params?.pastedText });
  logs.push(extractionResult.log);
  const componentMarkdown = componentsToMarkdown(safeComponents);
  const sourceMarkdown =
    extractionResult.data.content && extractionResult.data.content.length >= componentMarkdown.length
      ? extractionResult.data.content
      : componentMarkdown || extractionResult.data.content;
  const original: ExtractedPageData = {
    metaTitle: extractionResult.data.metaTitle || safeBackendData.metaTitle || '',
    metaDescription: extractionResult.data.metaDescription || safeBackendData.metaDescription || '',
    schema: extractionResult.data.schema || safeBackendData.schemaJsonLd || '',
    sitemap: extractionResult.data.sitemap || safeBackendData.sitemapUrl || '',
    tags: extractionResult.data.tags || (safeBackendData.tags || []).join(', ') || '',
    content: sourceMarkdown,
    media: extractionResult.data.media || safeBackendData.media || { hasImages: false, hasVideo: false, hasPodcast: false },
  };
  emit('extract', 'end', `Extracted ${original.content.split(/\s+/).filter(Boolean).length} words`);

  if (!original.content.trim()) {
    throw new Error('No page content to optimize. Fetch a URL or paste HTML first.');
  }

  bus.push(createMessagePacket({
    packetNumber: packet++,
    senderAgentId: 'agent-1',
    targetAgentId: 'broadcast',
    contractType: 'GROUND_TRUTH_EXTRACT',
    summary: `Extracted source page${pageUrl ? ` for ${pageUrl}` : ''}.`,
    payloadSummary: `Title: "${original.metaTitle.slice(0, 60)}", ${original.content.length} chars of content.`,
    dataPayload: { metaTitle: original.metaTitle, contentChars: original.content.length, media: original.media },
    groundingSources: [pageUrl || 'Pasted content'],
    hallucinationRisk: 'none',
    notes: 'Source content is the fact base for the maker and the verification gate.',
    confidenceScore: 100,
  }));

  if (!productGuidelines.productName || /enterprise|digital solutions|online platform|official guide|comprehensive topic/i.test(productGuidelines.productName)) {
    productGuidelines.productName = detectProductNameFromContext({
      rawTitle: original.metaTitle,
      rawDescription: original.metaDescription,
      headings: safeComponents.flatMap((c) => (c.headings || []).map((h: any) => h.text || '')),
      url: pageUrl,
      primaryKeyword: safeKeywords.find((k) => k.priority === 'primary')?.keyword,
    });
  }

  const gateInputs = {
    keywords: safeKeywords,
    productGuidelines,
    seoGuidelines,
    contentGuidelines,
    geoGuidelines,
    customerCentricityGuidelines,
    structureMappingGuidelines,
    readerContext: params?.readerContext,
    passThreshold,
    componentId,
    emit,
  };
  const allowedFactsText = approvedProductFacts(productGuidelines);
  const sourceTextForFacts = `${original.metaTitle}\n${original.metaDescription}\n${original.content}\n${original.schema}\n${originalSnapshotText}`;

  // ---- 2. Baseline audit (the original page, or the content being revised) ----
  const makerInput = {
    sourceMarkdown: original.content,
    sourceTitle: original.metaTitle,
    sourceDescription: original.metaDescription,
    url: pageUrl,
    keywords: safeKeywords,
    productGuidelines,
    readerContext: params?.readerContext,
  };
  const baselineExtracted = reviseStart ? draftToExtracted(reviseStart, original, original.schema) : original;
  const baselineComponents = reviseStart ? [draftToComponent(reviseStart, primaryComponent)] : safeComponents;
  emit('baseline', 'start', reviseStart ? 'Gates 2-6 auditing the current content' : 'Gates 2-6 auditing the original page');

  // In optimize mode the maker writes its first draft in parallel: it does not need the gates.
  const firstDraftStarted = Date.now();
  type DraftAttempt = { ok: boolean; draft?: PageDraft; log?: AgentExecutionLog; error?: string };
  let firstDraftTask: Promise<DraftAttempt> | null = null;
  if (!reviseStart) {
    emit('draft', 'start', 'Agent 7 writing the first draft', { round: 1, agentId: 'agent-7' });
    firstDraftTask = runAgent7Maker({ ...makerInput, round: 1 }).then(
      (r) => ({ ok: true, draft: r.draft, log: r.log }),
      (e: any) => ({ ok: false, error: e?.message || String(e) })
    );
  }

  const baseline = await runReviewGates({ ...gateInputs, extracted: baselineExtracted, components: baselineComponents, stage: 'baseline' });
  logs.push(...baseline.logs);
  emit('baseline', 'end', `${reviseStart ? 'Current content' : 'Original page'} scored by gates: ${baseline.gates.map((g) => g.score).join(' / ')}`);

  const beforeNine = alignScoresWithGates(calculateNineAgentScores({
    flags: baseline.flags,
    keywords: safeKeywords,
    keywordPlan: baseline.keywordPlan,
    extractedData: baselineExtracted,
    isPostFix: false,
  }), baseline.gates);
  const beforeScores = buildScoreSnapshot(
    beforeNine,
    baseline.flags.length,
    baseline.flags.filter((f) => f.severity === 'critical').length,
    baseline.flags.filter((f) => f.severity === 'warning').length
  );

  // ---- 3/4. Draft → gates → verification, revising until approved or out of rounds ----
  const rounds: PipelineRound[] = [];
  const roundFlags: AuditFlag[][] = [];
  const roundPlans: HeadingKeywordPlan[] = [];
  const roundNine: NineAgentScores[] = [];
  const roundSchema: string[] = [];
  const notesAddressed: MakerFeedbackItem[] = [];
  let makerError: string | undefined;
  let note: string | undefined;
  let preVerification: VerificationResult | undefined;

  let firstDraftResult: DraftAttempt | null = null;
  if (firstDraftTask) {
    firstDraftResult = await firstDraftTask;
  } else if (reviseStart) {
    // Revise mode: Agent 8 compiles the notes for the content as it is now.
    emit('verify', 'start', 'Agent 8 reviewing the current content', { round: 0, agentId: 'agent-8' });
    const pre = await runAgent8VerificationGate({
      round: 0,
      draft: reviseStart,
      gates: baseline.gates,
      sourceText: sourceTextForFacts,
      allowedFactsText,
      productGuidelines,
      passThreshold,
      overallScore: beforeNine.overallPageScore,
    });
    logs.push(pre.log);
    preVerification = pre.verification;
    const notes = notesInScope(pre.feedback, scope);
    emit('verify', 'end', `Current content: ${pre.verification.verdict === 'ACCEPT' ? 'approved' : 'not qualified'}; ${notes.length} notes in scope`, {
      round: 0,
      agentId: 'agent-8',
      passed: pre.verification.verdict === 'ACCEPT',
    });
    if (pre.verification.verdict === 'ACCEPT' && scope.kind === 'all') {
      note = 'The current content already passes every gate, so nothing was revised.';
    } else if (notes.length === 0) {
      note = `No review notes apply to ${scopeLabel.toLowerCase()}, so nothing was revised.`;
    } else {
      notesAddressed.push(...notes);
      emit('draft', 'start', `Agent 7 revising ${scopeLabel.toLowerCase()} (${notes.length} notes)`, { round: 1, agentId: 'agent-7' });
      firstDraftResult = await runAgent7Maker({
        ...makerInput,
        round: 1,
        previousDraft: reviseStart,
        feedback: notes,
        scopeInstruction: scopeInstruction(scope),
      }).then(
        (r) => ({ ok: true, draft: mergeDraftByScope(reviseStart, r.draft, scope), log: r.log }),
        (e: any) => ({ ok: false, error: e?.message || String(e) })
      );
    }
  }

  let current: { draft: PageDraft; durationMs: number } | null = null;
  if (firstDraftResult?.ok && firstDraftResult.draft) {
    if (firstDraftResult.log) logs.push(firstDraftResult.log);
    current = { draft: firstDraftResult.draft, durationMs: Date.now() - firstDraftStarted };
    emit('draft', 'end', firstDraftResult.log?.outputSummary || 'Draft ready', { round: 1, agentId: 'agent-7' });
  } else if (firstDraftResult) {
    makerError = firstDraftResult.error;
    emit('draft', 'end', `Maker unavailable: ${makerError}`, { round: 1, agentId: 'agent-7' });
  }

  for (let round = 1; current && round <= maxRounds; round++) {
    const { draft } = current;

    bus.push(createMessagePacket({
      packetNumber: packet++,
      senderAgentId: 'agent-7',
      targetAgentId: 'broadcast',
      contractType: 'PROPOSED_REMEDIATION',
      summary: round === 1 ? 'Maker submitted its first draft for review.' : `Maker submitted revision ${round - 1} for review.`,
      payloadSummary: `H1 "${draft.h1.slice(0, 60)}", ${draft.sections.length} sections, ${draft.faqs.length} FAQs.`,
      groundingSources: ['Source page', 'Approved product facts'],
      factualityChecked: false,
      hallucinationRisk: 'medium',
      notes: 'Unverified until the verification gate runs.',
      confidenceScore: 0,
    }));

    const schema = buildDraftSchema({ draft, originalSchema: original.schema, url: pageUrl, brandName: productGuidelines.brandName });
    const draftExtracted = draftToExtracted(draft, original, schema);
    const draftComponent = draftToComponent(draft, primaryComponent);

    emit('gates', 'start', `Gates 2-6 reviewing draft ${round}`, { round });
    const review = await runReviewGates({ ...gateInputs, extracted: draftExtracted, components: [draftComponent], stage: 'gates', round });
    logs.push(...review.logs);
    emit('gates', 'end', `Draft ${round} gate scores: ${review.gates.map((g) => g.score).join(' / ')}`, { round });

    review.gates.forEach((g) =>
      bus.push(createMessagePacket({
        packetNumber: packet++,
        senderAgentId: g.gateId,
        targetAgentId: 'agent-8',
        contractType:
          g.gateId === 'agent-2' ? 'COMPLIANCE_CONSTRAINTS'
          : g.gateId === 'agent-3' ? 'TECHNICAL_SEO_CONTRACT'
          : g.gateId === 'agent-4' ? 'KEYWORD_INTENT_MAP'
          : g.gateId === 'agent-5' ? 'CUSTOMER_FRICTION_REPORT'
          : 'TRUST_CITATIONS_PROOF',
        summary: `${g.gateName}: ${g.score}/100 — ${g.passed ? 'pass' : 'fail'} (draft ${round}).`,
        payloadSummary: g.rationale,
        dataPayload: { score: g.score, passed: g.passed, flags: g.flags.length },
        groundingSources: ['Active guidelines'],
        zeroForbiddenWordsVerified: !g.flags.some((f) => /forbidden/i.test(f.issueTitle)),
        hallucinationRisk: 'none',
        notes: `${g.flags.filter((f) => f.severity === 'critical').length} critical, ${g.flags.filter((f) => f.severity === 'warning').length} warnings.`,
        confidenceScore: g.score,
      }))
    );

    const nine = alignScoresWithGates(calculateNineAgentScores({
      flags: review.flags,
      keywords: safeKeywords,
      keywordPlan: review.keywordPlan,
      extractedData: draftExtracted,
      isPostFix: false,
    }), review.gates);

    emit('verify', 'start', `Agent 8 verifying draft ${round}`, { round, agentId: 'agent-8' });
    const check = await runAgent8VerificationGate({
      round,
      draft,
      gates: review.gates,
      sourceText: sourceTextForFacts,
      allowedFactsText,
      productGuidelines,
      passThreshold,
      overallScore: nine.overallPageScore,
    });
    logs.push(check.log);
    const accepted = check.verification.verdict === 'ACCEPT';
    emit('verify', 'end', accepted ? `Draft ${round} approved` : `Draft ${round} not qualified: ${check.verification.blockingIssues?.length || 0} blocking issues`, {
      round,
      agentId: 'agent-8',
      passed: accepted,
      score: nine.overallPageScore,
    });

    bus.push(createMessagePacket({
      packetNumber: packet++,
      senderAgentId: 'agent-8',
      targetAgentId: accepted ? 'agent-9' : 'agent-7',
      contractType: 'VERIFICATION_QUALITY_GATE',
      summary: `Verification: ${accepted ? 'APPROVED' : 'NOT QUALIFIED'} (draft ${round}).`,
      payloadSummary: check.verification.reason,
      dataPayload: { verdict: check.verification.verdict, blocking: check.verification.blockingIssues, unsupportedFigures: check.verification.unsupportedFigures },
      groundingSources: ['Source page', 'Approved product facts', 'Gate results'],
      factualityChecked: true,
      zeroForbiddenWordsVerified: !check.feedback.some((f) => /forbidden phrase/i.test(f.issue)),
      hallucinationRisk: (check.verification.unsupportedFigures?.length || 0) > 0 ? 'high' : 'low',
      confidenceScore: nine.overallPageScore,
    }));

    rounds.push({
      round,
      draft,
      gates: review.gates,
      verification: check.verification,
      overallScore: nine.overallPageScore,
      feedbackToMaker: accepted ? [] : check.feedback,
      makerDurationMs: current.durationMs,
    });
    roundFlags.push(review.flags);
    roundPlans.push(review.keywordPlan);
    roundNine.push(nine);
    roundSchema.push(schema);

    if (accepted || round === maxRounds) break;
    const notesForMaker = mode === 'revise' ? notesInScope(check.feedback, scope) : check.feedback;
    if (notesForMaker.length === 0) break;
    notesAddressed.push(...notesForMaker);

    // ---- revise ----
    bus.push(createMessagePacket({
      packetNumber: packet++,
      senderAgentId: 'agent-9',
      targetAgentId: 'agent-7',
      contractType: 'REMEDIATION_DIRECTIVE',
      summary: `Sending ${notesForMaker.length} review notes to the maker for revision ${round}.`,
      payloadSummary: check.feedback.slice(0, 3).map((f) => f.issue).join(' | '),
      dataPayload: { notes: check.feedback.length },
      groundingSources: ['Gate results', 'Verification gate'],
      hallucinationRisk: 'none',
      confidenceScore: nine.overallPageScore,
    }));
    emit('draft', 'start', `Agent 7 revising (${notesForMaker.length} notes)`, { round: round + 1, agentId: 'agent-7' });
    const started = Date.now();
    try {
      const next = await runAgent7Maker({
        ...makerInput,
        round: round + 1,
        previousDraft: draft,
        feedback: notesForMaker,
        scopeInstruction: mode === 'revise' ? scopeInstruction(scope) : undefined,
      });
      logs.push(next.log);
      current = { draft: mode === 'revise' ? mergeDraftByScope(draft, next.draft, scope) : next.draft, durationMs: Date.now() - started };
      emit('draft', 'end', next.log.outputSummary || `Revision ${round} ready`, { round: round + 1, agentId: 'agent-7' });
    } catch (e: any) {
      makerError = e?.message || String(e);
      emit('draft', 'end', `Revision failed: ${makerError}`, { round: round + 1, agentId: 'agent-7' });
      current = null;
    }
  }

  // ---- 5. Pick the result ----
  const approvedIdx = rounds.findIndex((r) => r.verification.verdict === 'ACCEPT');
  const bestIdx = rounds.length
    ? approvedIdx >= 0
      ? approvedIdx
      : rounds.reduce((best, r, i) => (r.overallScore > rounds[best].overallScore ? i : best), 0)
    : -1;
  const finalVerdict: PipelineVerdict =
    rounds.length > 0
      ? approvedIdx >= 0 ? 'APPROVED' : 'NOT_QUALIFIED'
      : makerError || !preVerification
      ? 'MAKER_UNAVAILABLE'
      : preVerification.verdict === 'ACCEPT' ? 'APPROVED' : 'NOT_QUALIFIED';

  let updatedComponents = safeComponents;
  let updatedBackend: SEOBackendData = { ...safeBackendData, media: original.media };
  let finalFlags = baseline.flags;
  let finalPlan = baseline.keywordPlan;
  let finalNine = beforeNine;
  let afterScores: ScoreSnapshot | undefined;

  if (bestIdx >= 0) {
    const chosen = rounds[bestIdx];
    const schema = roundSchema[bestIdx];
    const component = draftToComponent(chosen.draft, primaryComponent);
    updatedComponents = [component, ...safeComponents.slice(1)];
    updatedBackend = {
      ...updatedBackend,
      metaTitle: chosen.draft.metaTitle,
      metaDescription: chosen.draft.metaDescription,
      schemaJsonLd: schema,
      schemaTypesFound: parseSchemaBlocks(schema).map((n: any) => n['@type']).filter(Boolean),
      openGraph: { ...(updatedBackend.openGraph || {}), title: chosen.draft.metaTitle, description: chosen.draft.metaDescription },
      twitterCard: { ...(updatedBackend.twitterCard || {}), title: chosen.draft.metaTitle, description: chosen.draft.metaDescription },
      status: chosen.verification.verdict === 'ACCEPT' ? 'compliant' : 'non_compliant',
      originalSnapshot: safeBackendData.originalSnapshot || {
        metaTitle: safeBackendData.metaTitle,
        metaDescription: safeBackendData.metaDescription,
        schemaJsonLd: safeBackendData.schemaJsonLd,
        tags: safeBackendData.tags,
        canonicalUrl: safeBackendData.canonicalUrl,
        robots: safeBackendData.robots,
        sitemapUrl: safeBackendData.sitemapUrl,
        ctas: safeBackendData.ctas,
        media: safeBackendData.media,
      },
    };
    component.status = chosen.verification.verdict === 'ACCEPT' ? 'compliant' : 'recently_fixed';
    finalFlags = roundFlags[bestIdx];
    finalPlan = roundPlans[bestIdx];
    finalNine = roundNine[bestIdx];
    afterScores = buildScoreSnapshot(
      finalNine,
      finalFlags.length,
      finalFlags.filter((f) => f.severity === 'critical').length,
      finalFlags.filter((f) => f.severity === 'warning').length
    );
  }

  const agentScores = buildAgentScoreBreakdown(finalNine);
  const totalDurationMs = Date.now() - pipelineStartTime;

  bus.push(createMessagePacket({
    packetNumber: packet++,
    senderAgentId: 'agent-9',
    targetAgentId: 'broadcast',
    contractType: 'ORCHESTRATION_SYNC',
    summary: `Run finished in ${Math.round(totalDurationMs / 1000)}s: ${finalVerdict.replace('_', ' ').toLowerCase()} after ${rounds.length} draft(s).`,
    payloadSummary: `Score ${beforeNine.overallPageScore} → ${finalNine.overallPageScore}.${makerError ? ` Maker error: ${makerError}` : ''}`,
    dataPayload: { finalVerdict, rounds: rounds.length, before: beforeNine.overallPageScore, after: finalNine.overallPageScore },
    hallucinationRisk: 'none',
    confidenceScore: finalNine.overallPageScore,
  }));

  logs.push({
    id: `log-agent-9-${Date.now()}`,
    agentId: 'agent-9',
    agentName: 'Agent 9: Orchestrator',
    role: 'Runs extraction, maker drafts, the five review gates and the verification gate',
    model: 'Deterministic controller',
    status: 'completed',
    durationMs: totalDurationMs,
    outputSummary: `${finalVerdict} after ${rounds.length} draft(s). Score ${beforeNine.overallPageScore} → ${finalNine.overallPageScore}.`,
    timestamp: new Date().toISOString(),
  });
  emit('done', 'end', finalVerdict === 'APPROVED' ? 'Approved for publishing' : finalVerdict === 'NOT_QUALIFIED' ? 'Finished: does not qualify yet' : 'Finished: maker unavailable', { score: finalNine.overallPageScore, passed: finalVerdict === 'APPROVED' });

  const report: OrchestratorReport = {
    pipelineRunId,
    status: 'completed',
    totalDurationMs,
    extractedData: original,
    keywordPlan: finalPlan,
    agentLogs: logs,
    deduplicatedFlagCount: finalFlags.length,
    resolvedFlagCount: Math.max(0, baseline.flags.length - finalFlags.length),
    activeReaderContext: params.readerContext,
    verificationResults: rounds.map((r) => r.verification),
    agentScores,
    communicationBus: bus,
    rounds,
    baselineGates: baseline.gates,
    finalVerdict,
    selectedRound: bestIdx >= 0 ? rounds[bestIdx].round : undefined,
    makerError,
    mode,
    scopeLabel,
    note,
  };

  const startDraft = reviseStart || componentToDraft(primaryComponent, safeBackendData);
  const changeLog = bestIdx >= 0 ? diffDrafts(startDraft, rounds[bestIdx].draft) : [];

  return {
    report,
    extractedData: original,
    keywordPlan: finalPlan,
    deduplicatedFlags: finalFlags,
    baselineFlags: baseline.flags,
    updatedComponents,
    updatedBackend,
    agentScores,
    overallScore: finalNine.overallPageScore,
    nineAgentScores: finalNine,
    beforeScores,
    afterScores,
    communicationBus: bus,
    finalVerdict,
    changeLog,
    notesAddressed,
  };
}
