import "dotenv/config";
import express from "express";
import dns from "dns";
import net from "net";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as cheerio from "cheerio";
import { runAgent9OrchestrationPipeline } from "./src/services/agentPipeline";
import { generate as generateLlm, extractJson, llmAvailable, configuredProviders, type LlmJob } from "./src/services/llm";
import { recordFirecrawl, recordRun } from "./src/services/usageStore";
import { computeAdminMetrics } from "./src/services/adminMetrics";
import crypto from "crypto";
import { pickKeywords } from "./src/services/keywordPicker";
import {
  sanitizeGrammarAndPunctuation,
  formatCompliantMetaTitleAndDescription,
  formatCompliantMetaTitle,
  formatCompliantMetaDescription,
  detectProductNameFromContext,
  capitalizeProductEntity,
  countWords,
  countWordsUnderH2,
  filterH2SectionsWithSubstantialContent
} from "./src/utils/grammarSanitizer";
import {
  getGoogleAdsStatus,
  isGoogleAdsConfigured,
  fetchGoogleKeywordHistoricalMetrics,
  fetchGoogleKeywordIdeas,
  applySearchVolumePriorityMatrix
} from "./src/services/googleAdsKeywordService";


const app = express();
const PORT = 3000;

// CORS & Preflight Middleware for embedded iframe and cross-origin safety
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Accept");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  // Reports which integrations are configured (never their values).
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    integrations: {
      gemini: configuredProviders().gemini,
      groq: configuredProviders().groq,
      firecrawl: !!(process.env.FIRECRAWL_API_KEY || "").trim(),
      googleAds: isGoogleAdsConfigured(),
    },
  });
});

// ---------------------------------------------------------------------------
// 1. PAGE DOMAIN & CONTEXT DETECTOR (Domain Understanding & Layman Context)
// ---------------------------------------------------------------------------
// 1. ADVANCED DOMAIN & CONTEXT DETECTOR
// ---------------------------------------------------------------------------
const META_KEYWORD_BLACKLIST = new Set([
  'seo', 'search engine optimization', 'meta', 'metadata', 'meta tags', 'website', 'webpage',
  'page', 'html', 'site', 'home', 'homepage', 'online guide', 'guide', 'free guide',
  'complete guide', 'terms', 'privacy policy', 'overview', 'official site', 'welcome',
  'tags', 'keywords', 'optimization', 'ranking', 'growth', 'articles', 'content', 'web'
]);

export function detectPageDomainAndContext(params: {
  title?: string;
  description?: string;
  headings?: string[];
  bodyText?: string;
  tags?: string[];
}): {
  domain: 'financial' | 'software' | 'health' | 'ecommerce' | 'legal' | 'general';
  coreSubject: string;
  brandName: string;
  recommendedSchemaEntity: 'FinancialProduct' | 'SoftwareApplication' | 'Product' | 'Service' | 'Article';
  plainEnglishSummary: string;
} {
  const { title = '', description = '', headings = [], bodyText = '', tags = [] } = params;
  const combined = `${title} ${description} ${headings.join(' ')} ${tags.join(' ')} ${bodyText.slice(0, 4000)}`.toLowerCase();

  // Extract brand name from title (e.g. "Check Free CIBIL Score Online - BankBazaar" -> "BankBazaar")
  const brandSplit = title.split(/[-|•–—]/);
  let brandName = brandSplit.length > 1 ? brandSplit[brandSplit.length - 1].trim() : '';
  if (!brandName || brandName.length > 25 || ['home', 'official', 'overview', 'page', 'guide', 'online'].includes(brandName.toLowerCase())) {
    brandName = brandSplit[0]?.trim() || 'Online Platform';
  }


  // Extract primary title entity while rejecting meta keywords like 'seo'
  const mainTitlePart = brandSplit[0]?.trim() || title;
  let cleanSubject = mainTitlePart
    .replace(/^(check|get|free|buy|best|how to|what is|find|compare|online)\s+/i, '')
    .replace(/\s+(online|free|in india|guide|reviews?|portal|calculator|app|platform)$/i, '')
    .trim() || mainTitlePart;

  if (META_KEYWORD_BLACKLIST.has(cleanSubject.toLowerCase()) || cleanSubject.length < 3) {
    const viableHeading = headings.find(h => {
      const t = h.replace(/^(what is|how to|why|check|free|get)\s+/i, '').trim();
      return t.length > 4 && !META_KEYWORD_BLACKLIST.has(t.toLowerCase());
    });
    cleanSubject = viableHeading || 'Comprehensive Topic Guide';
  }

  // Domain classification based on deep whole-page inspection
  const isConsumerProduct =
    /oneplus|iphone|samsung|xiaomi|redmi|oppo|vivo|realme|motorola|pixel|macbook|laptop|smartphone|mobile|television|\btv\b|refrigerator|washing machine|air conditioner|\bac\b|microwave|camera|headphone|earbud|smartwatch|tablet|ipad/i.test(combined) ||
    /oneplus|iphone|samsung|mobile|phone|tv|laptop|tablet/i.test(cleanSubject);

  if (isConsumerProduct) {
    const subject = cleanSubject || 'Electronics & Mobile Device';
    return {
      domain: 'ecommerce',
      coreSubject: subject,
      brandName: brandName || 'Online Store',
      recommendedSchemaEntity: 'Product',
      plainEnglishSummary: `Explore ${subject} specifications, features and pricing${brandName ? ` on ${brandName}` : ''}.`,
    };
  }

  const isFinance = /cibil|credit\s*score|credit\s*card|loan|mortgage|bank|interest\s*rate|equifax|experian|crif|debt|emi\s*calculator|tax|investment|mutual\s*fund|insurance/i.test(combined);
  const isHealth = /health|medical|doctor|symptom|hospital|disease|treatment|wellness|fitness|nutrition|pharma/i.test(combined);
  const isLegal = /legal|attorney|lawyer|law\s*firm|court|litigation|statute|compliance\s*officer|gdpr|contract/i.test(combined);
  const isSoftware = /software|api|devops|cloud|platform|saas|sdk|database|kubernetes|docker|analytics|code|app\b/i.test(combined);
  const isEcommerce = /shop|cart|checkout|store|discount|coupon|shipping|apparel|product|buy\s*now/i.test(combined);

  if (isFinance) {
    const isCibil = /cibil|credit\s*score|credit\s*report/i.test(title) || headings.some(h => /cibil|credit\s*score/i.test(h));
    const subject = isCibil ? (cleanSubject || 'CIBIL Credit Score & Report') : (cleanSubject || 'Financial Services');
    return {
      domain: 'financial',
      coreSubject: subject,
      brandName: brandName || 'Financial Services',
      recommendedSchemaEntity: 'FinancialProduct',
      plainEnglishSummary: `Learn how ${subject} works, key requirements, and simple steps to compare options and make informed decisions.`,
    };
  }

  if (isHealth) {
    return {
      domain: 'health',
      coreSubject: cleanSubject || 'Health & Medical Guidance',
      brandName: brandName || 'Health Guide',
      recommendedSchemaEntity: 'Article',
      plainEnglishSummary: `A straightforward, easy-to-read guide explaining ${cleanSubject || 'this health topic'}, what symptoms to look out for, and doctor-approved steps to stay healthy.`,
    };
  }

  if (isLegal) {
    return {
      domain: 'legal',
      coreSubject: cleanSubject || 'Legal & Regulatory Guide',
      brandName: brandName || 'Legal Advisory',
      recommendedSchemaEntity: 'Service',
      plainEnglishSummary: `A plain-English explanation of your legal rights, statutory obligations, and clear options regarding ${cleanSubject || 'this legal issue'} without confusing legal jargon.`,
    };
  }

  if (isSoftware) {
    return {
      domain: 'software',
      coreSubject: cleanSubject || 'Software & Workflow Platform',
      brandName: brandName || 'Software Solutions',
      recommendedSchemaEntity: 'SoftwareApplication',
      plainEnglishSummary: `An easy-to-understand overview of how this software works, how it helps your team get work done faster, and how to connect it to your current everyday tools.`,
    };
  }

  if (isEcommerce) {
    return {
      domain: 'ecommerce',
      coreSubject: cleanSubject || 'Product Overview & Specifications',
      brandName: brandName || 'Online Store',
      recommendedSchemaEntity: 'Product',
      plainEnglishSummary: `A straightforward look at product features, pricing, customer feedback, and delivery details so you know exactly what you are getting before you order.`,
    };
  }

  return {
    domain: 'general',
    coreSubject: cleanSubject || 'Topic Overview & Guidance',
    brandName: brandName || 'Resource Portal',
    recommendedSchemaEntity: 'Service',
    plainEnglishSummary: `Clear, step-by-step guidance on ${cleanSubject || 'this topic'} written in plain everyday language with practical tips and direct answers.`,
  };
}

// ---------------------------------------------------------------------------
// BRAND & GRAMMAR SANITIZER (punctuation and grammar clean-up)
// ---------------------------------------------------------------------------
export function deepSanitizeBrandAndGrammar(input: any): any {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return sanitizeGrammarAndPunctuation(input);
  }

  if (Array.isArray(input)) {
    return input.map(item => deepSanitizeBrandAndGrammar(item));
  }

  if (typeof input === 'object') {
    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      output[key] = deepSanitizeBrandAndGrammar(value);
    }
    return output;
  }

  return input;
}

// ---------------------------------------------------------------------------
// 2. INTELLIGENT CONTENT-DRIVEN KEYWORD EXTRACTOR (< 5ms response time)
// ---------------------------------------------------------------------------
function extractKeywordsAlgorithmic(params: {
  title?: string;
  description?: string;
  headings?: string[];
  h1?: string;
  bodyText?: string;
  tags?: string[];
  url?: string;
  faqQuestions?: string[];
}): any[] {
  return pickKeywords({
    title: params.title,
    description: params.description,
    headings: params.headings,
    h1: params.h1,
    bodyText: params.bodyText,
    url: params.url,
    faqQuestions: params.faqQuestions,
    brandNames: ['Bajaj Finserv', 'Bajaj Finance', 'Bajaj Finance Limited', 'Bajaj', 'Wikipedia'],
  });
}

// JSON model call through the router (Groq + Gemini with fallback and usage logging).
async function callGeminiWithRetry(options: {
  job: LlmJob;
  contents: string;
  responseSchema?: any;
  timeoutMs?: number;
  expect?: 'array' | 'object';
}) {
  const res = await generateLlm({
    job: options.job,
    prompt: options.contents,
    json: true,
    responseSchema: options.responseSchema,
    timeoutMs: options.timeoutMs || 30000,
  });
  const parsed = extractJson(res.text);
  if (options.expect === 'array' && parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
    const arr = Object.values(parsed).find((v) => Array.isArray(v));
    if (arr) return arr;
  }
  return parsed;
}

// Helper: Convert Markdown from Jina or web reader proxies into structured HTML
function convertMarkdownToHtml(md: string, targetUrl: string): string {
  let title = "";
  const titleMatch = md.match(/Title:\s*(.+)/i);
  if (titleMatch) title = titleMatch[1].trim();

  const lines = md.split("\n");
  const htmlParts: string[] = [
    `<!DOCTYPE html><html lang="en"><head><title>${title || "Scraped Content"}</title></head><body>`,
  ];

  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    htmlParts.push('<table border="1" class="scraped-table">');
    if (tableRows.length > 0) {
      htmlParts.push('<thead><tr>');
      tableRows[0].forEach(th => htmlParts.push(`<th>${th}</th>`));
      htmlParts.push('</tr></thead>');
    }
    if (tableRows.length > 1) {
      htmlParts.push('<tbody>');
      for (let r = 1; r < tableRows.length; r++) {
        htmlParts.push('<tr>');
        tableRows[r].forEach(td => htmlParts.push(`<td>${td}</td>`));
        htmlParts.push('</tr>');
      }
      htmlParts.push('</tbody>');
    }
    htmlParts.push('</table>');
    tableRows = [];
    inTable = false;
  };

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inTable) flushTable();
      continue;
    }
    if (line.startsWith("Title:") || line.startsWith("URL Source:") || line.startsWith("Published Time:")) {
      continue;
    }

    // Check for Markdown Table Row: | cell | cell |
    if (line.startsWith("|") && line.endsWith("|")) {
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        continue;
      }
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      if (cells.length > 0) {
        inTable = true;
        tableRows.push(cells);
        continue;
      }
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith("# ")) {
      htmlParts.push(`<h1>${line.replace(/^#\s+/, "")}</h1>`);
    } else if (line.startsWith("## ")) {
      htmlParts.push(`<h2>${line.replace(/^##\s+/, "")}</h2>`);
    } else if (line.startsWith("### ")) {
      htmlParts.push(`<h3>${line.replace(/^###\s+/, "")}</h3>`);
    } else if (line.startsWith("#### ") || line.startsWith("##### ")) {
      htmlParts.push(`<h4>${line.replace(/^#{4,5}\s+/, "")}</h4>`);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        htmlParts.push(`<li><a href="${linkMatch[2]}">${linkMatch[1]}</a></li>`);
      } else {
        htmlParts.push(`<li>${line.replace(/^[-*]\s+/, "")}</li>`);
      }
    } else if (/^\d+\.\s+/.test(line)) {
      htmlParts.push(`<li>${line.replace(/^\d+\.\s+/, "")}</li>`);
    } else {
      const processed = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      htmlParts.push(`<p>${processed}</p>`);
    }
  }

  if (inTable) flushTable();

  htmlParts.push("</body></html>");
  return htmlParts.join("\n");
}

// Firecrawl API Configuration for Agent 1 (Ingress & Scraping Agent)
const FIRECRAWL_API_KEY = (process.env.FIRECRAWL_API_KEY || "").trim();

interface FirecrawlScrapeResult {
  html: string;
  rawHtml?: string;
  markdown?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    statusCode?: number;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogSiteName?: string;
    canonicalUrl?: string;
    [key: string]: any;
  };
  links?: string[];
}

/**
 * Strategy 0 (PRIMARY): Agent 1 - Firecrawl API Headless Scraper
 * Bypasses Cloudflare, WAFs, CAPTCHAs, and complex JavaScript SPAs to extract clean HTML, markdown, and rich SEO metadata.
 */
async function scrapeWithFirecrawl(targetUrl: string): Promise<FirecrawlScrapeResult | null> {
  if (!FIRECRAWL_API_KEY) return null;
  let httpError = 0;
  const result = await scrapeWithFirecrawlInner(targetUrl, (code) => (httpError = code));
  if (httpError) {
    throw new UserFacingError(`${targetUrl} returned HTTP ${httpError}${httpError === 404 ? " (page not found)" : ""}. Check the URL.`);
  }
  return result;
}

/** Firecrawl request with usage logging for the admin panel. */
async function firecrawlFetch(kind: "scrape" | "map", target: string, endpoint: string, init: RequestInit): Promise<Response> {
  const started = Date.now();
  try {
    const res = await fetch(endpoint, init);
    recordFirecrawl({
      ts: new Date().toISOString(),
      kind,
      url: target,
      ok: res.ok,
      status: res.status,
      credits: res.ok ? 1 : 0,
      latencyMs: Date.now() - started,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    });
    return res;
  } catch (err: any) {
    recordFirecrawl({ ts: new Date().toISOString(), kind, url: target, ok: false, credits: 0, latencyMs: Date.now() - started, error: String(err?.message || err).slice(0, 200) });
    throw err;
  }
}

async function scrapeWithFirecrawlInner(targetUrl: string, reportHttpError: (code: number) => void): Promise<FirecrawlScrapeResult | null> {
  let httpError = 0;
  try {
    console.info(`[Agent 1: Firecrawl Scraper] Initiating headless scrape for: ${targetUrl}`);
    // Priority 1: onlyMainContent: true extracts pure document body from H1 to FAQs without navigation boilerplate
    const res = await firecrawlFetch("scrape", targetUrl, "https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ["markdown", "html", "rawHtml", "links"],
        onlyMainContent: false,
        timeout: 28000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data) {
        const d = data.data;
        const status = Number(d.metadata?.statusCode || 0);
        if (status >= 400) {
          httpError = status;
          reportHttpError(httpError);
          return null;
        }
        let finalHtml = d.html || d.rawHtml || "";
        if (!finalHtml && d.markdown) {
          finalHtml = convertMarkdownToHtml(d.markdown, targetUrl);
        }
        if ((finalHtml && finalHtml.trim().length > 40) || (d.markdown && d.markdown.trim().length > 40)) {
          console.info(`[Agent 1: Firecrawl Scraper] Successfully scraped ${targetUrl} (${finalHtml.length} html bytes, ${d.markdown?.length || 0} md bytes, title: "${d.metadata?.title || 'N/A'}")`);
          return {
            html: finalHtml,
            rawHtml: d.rawHtml,
            markdown: d.markdown,
            metadata: d.metadata,
            links: Array.isArray(d.links) ? d.links : []
          };
        }
      }
    } else {
      const errText = await res.text();
      console.warn(`[Agent 1: Firecrawl Scraper] Firecrawl API returned HTTP ${res.status}:`, errText);
      // Secondary attempt with onlyMainContent: false if strict mode returned nothing
      try {
        const retryRes = await firecrawlFetch("scrape", targetUrl, "https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: targetUrl,
            formats: ["markdown", "html", "links"],
            onlyMainContent: false,
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          if (retryData?.success && retryData?.data) {
            const rd = retryData.data;
            return {
              html: rd.html || rd.rawHtml || "",
              markdown: rd.markdown,
              metadata: rd.metadata,
              links: Array.isArray(rd.links) ? rd.links : []
            };
          }
        }
      } catch (retryErr: any) {
        console.warn(`[Agent 1: Firecrawl Scraper] Fallback scrape failed:`, retryErr.message);
      }
    }
  } catch (err: any) {
    console.warn(`[Agent 1: Firecrawl Scraper] Firecrawl request failed for ${targetUrl}:`, err.message);
  }
  return null;
}

/**
 * Firecrawl Site URL Mapping for sitemap and deep page discovery
 */
async function mapWithFirecrawl(targetUrl: string): Promise<string[]> {
  if (!FIRECRAWL_API_KEY) return [];
  try {
    console.info(`[Agent 1: Firecrawl] Mapping URLs for domain: ${targetUrl}`);
    const res = await firecrawlFetch("map", targetUrl, "https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: targetUrl }),
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.links)) {
        const validLinks = data.links.filter((l: any) => typeof l === 'string' && l.startsWith('http'));
        console.info(`[Agent 1: Firecrawl] Discovered ${validLinks.length} URLs via Firecrawl map.`);
        return validLinks;
      }
    }
  } catch (err: any) {
    console.warn(`[Agent 1: Firecrawl] Map failed for ${targetUrl}:`, err.message);
  }
  return [];
}

// ----------------------------------------------------
// URL SAFETY: only public http(s) targets may be fetched by the server.
// ----------------------------------------------------
class UserFacingError extends Error {
  status: number;
  constructor(message: string, status = 422) {
    super(message);
    this.status = status;
  }
}

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new UserFacingError("That is not a valid URL.", 400);
  }
  if (!["http:", "https:"].includes(u.protocol)) {
    throw new UserFacingError("Only http and https URLs can be fetched.", 400);
  }
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^localhost$|\.localhost$|\.local$|\.internal$/i.test(host)) {
    throw new UserFacingError("Internal hosts cannot be fetched. Use Paste HTML for intranet or staging pages.", 400);
  }
  const addrs = net.isIP(host) ? [host] : (await dns.promises.lookup(host, { all: true }).catch(() => [])).map((a: any) => a.address);
  if (addrs.length === 0) {
    throw new UserFacingError(`Could not resolve ${host}. Check the URL.`, 400);
  }
  if (addrs.some(isPrivateAddress)) {
    throw new UserFacingError("This URL points to a private network address. Use Paste HTML for intranet or staging pages.", 400);
  }
  return u;
}

// Multi-Tier Resilient Web Fetcher (Powered by Agent 1 Firecrawl with multi-tier fallback)
async function fetchPageHtmlWithMultiFallback(targetUrl: string): Promise<{
  html: string;
  markdown?: string;
  isSynthetic: boolean;
  source: string;
  rawHtml?: string;
  firecrawlMetadata?: any;
  firecrawlLinks?: string[];
}> {
  // Fast path for enterprise intranet & document sharing platforms that strictly require user SSO authentication
  const lowerUrl = targetUrl.toLowerCase();
  const isProtectedHost = 
    lowerUrl.includes("sharepoint.com") || 
    lowerUrl.includes("onedrive.live.com") || 
    lowerUrl.includes("docs.google.com") ||
    lowerUrl.includes("app.box.com") ||
    lowerUrl.includes("dropbox.com/s/");

  if (isProtectedHost) {
    throw new UserFacingError("This document host requires sign-in, so it cannot be fetched. Open the page, copy its HTML, and use Paste HTML.");
  }

  await assertPublicHttpUrl(targetUrl);

  // Strategy 0 (PRIMARY): Agent 1 - Firecrawl API Headless Scraper
  const firecrawlResult = await scrapeWithFirecrawl(targetUrl);
  if (firecrawlResult && (firecrawlResult.html || firecrawlResult.markdown)) {
    return {
      html: firecrawlResult.html || (firecrawlResult.markdown ? convertMarkdownToHtml(firecrawlResult.markdown, targetUrl) : ""),
      markdown: firecrawlResult.markdown,
      rawHtml: firecrawlResult.rawHtml,
      isSynthetic: false,
      source: "agent-1-firecrawl",
      firecrawlMetadata: firecrawlResult.metadata,
      firecrawlLinks: firecrawlResult.links,
    };
  }

  // Strategy 1: Modern Desktop Chrome Browser
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": '"Chromium";v="130", "Google Chrome";v="130", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(3500),
    });
    if (res.status === 404 || res.status === 410) {
      throw new UserFacingError(`${targetUrl} returned HTTP ${res.status} (page not found). Check the URL.`);
    }
    if (res.ok) {
      const text = await res.text();
      const isFirewallBlocked = 
        text.includes("Attention Required! | Cloudflare") || 
        text.includes("Just a moment...") || 
        text.includes("403 Forbidden") || 
        text.includes("Access Denied");
      if (text && text.trim().length > 100 && !isFirewallBlocked) {
        return { html: text, isSynthetic: false, source: "direct-chrome" };
      }
    }
  } catch (err: any) {
    console.warn(`Direct Chrome fetch for ${targetUrl} failed:`, err.message);
  }

  // Strategy 2: Googlebot Crawler UA (passes through crawler-friendly CDN firewall rules)
  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const text = await res.text();
      const isBlocked = text.includes("403 Forbidden") || text.includes("Access Denied") || text.includes("Cloudflare");
      if (text && text.trim().length > 100 && !isBlocked) {
        return { html: text, isSynthetic: false, source: "googlebot" };
      }
    }
  } catch (err: any) {
    console.warn(`Googlebot fetch for ${targetUrl} failed:`, err.message);
  }

  // Strategy 3: Jina AI Reader Proxy (built specifically to bypass Cloudflare and scrape web content for LLMs)
  try {
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const res = await fetch(jinaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/plain, text/markdown, */*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const md = await res.text();
      const isInvalid = 
        md.includes("Failed to fetch") || 
        md.includes("403 Forbidden") || 
        md.includes("Warning: Target URL returned error") ||
        md.includes("Warning: This page maybe requiring CAPTCHA") ||
        md.includes("Attention Required! | Cloudflare") ||
        md.includes("Just a moment...");
      if (md && md.trim().length > 120 && !isInvalid) {
        const converted = convertMarkdownToHtml(md, targetUrl);
        return { html: converted, isSynthetic: false, source: "jina-reader" };
      }
    }
  } catch (err: any) {
    console.warn(`Jina Reader fetch for ${targetUrl} failed:`, err.message);
  }

  // Strategy 4: AllOrigins CORS / HTML proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 100 && !text.includes("403 Forbidden") && !text.includes("Cloudflare")) {
        return { html: text, isSynthetic: false, source: "allorigins-proxy" };
      }
    }
  } catch (err: any) {
    console.warn(`AllOrigins fetch for ${targetUrl} failed:`, err.message);
  }

  // Strategy 5: Codetabs CORS proxy
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 100 && !text.includes("403 Forbidden") && !text.includes("Cloudflare")) {
        return { html: text, isSynthetic: false, source: "codetabs-proxy" };
      }
    }
  } catch (err: any) {
    console.warn(`Codetabs fetch for ${targetUrl} failed:`, err.message);
  }

  // Every strategy failed. Say so rather than inventing a page.
  throw new UserFacingError(
    `Could not fetch ${targetUrl}: the site blocked automated access or did not respond. Open the page in your browser, copy its HTML, and use Paste HTML.`
  );
}

// ----------------------------------------------------
// SITEMAP & ROBOTS.TXT DISCOVERY HELPERS
// ----------------------------------------------------
async function findSitemapUrls(startUrl: string): Promise<string[]> {
  try {
    let parsed: URL;
    if (!startUrl.startsWith("http://") && !startUrl.startsWith("https://")) {
      parsed = new URL(`https://${startUrl}`);
    } else {
      parsed = new URL(startUrl);
    }
    const root = `${parsed.protocol}//${parsed.host}`;
    const candidates: string[] = [];

    // 1. Check robots.txt for Sitemap directives
    try {
      const robotsUrl = `${root}/robots.txt`;
      const res = await fetch(robotsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/plain,*/*",
        },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const match = line.match(/^sitemap:\s*(https?:\/\/[^\s#]+)/i);
          if (match && match[1]) {
            candidates.push(match[1].trim());
          }
        }
      }
    } catch {
      // ignore robots.txt fetch error
    }

    // 2. Fallback to standard /sitemap.xml and /sitemap_index.xml if no sitemap found in robots.txt
    if (candidates.length === 0) {
      candidates.push(`${root}/sitemap.xml`);
      candidates.push(`${root}/sitemap_index.xml`);
    }

    return Array.from(new Set(candidates));
  } catch {
    return [];
  }
}

async function parseSitemapXml(sitemapUrl: string, seen: Set<string> = new Set()): Promise<string[]> {
  if (seen.has(sitemapUrl)) return [];
  seen.add(sitemapUrl);

  const urls: string[] = [];
  try {
    const res = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/xml,application/xml,text/html,*/*",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return urls;

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    // Check for Sitemap Index (<sitemap><loc>...</loc></sitemap>)
    const subSitemaps: string[] = [];
    $("sitemap > loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) subSitemaps.push(loc);
    });

    if (subSitemaps.length > 0) {
      for (const subSm of subSitemaps.slice(0, 10)) { // limit to first 10 child sitemaps
        const subUrls = await parseSitemapXml(subSm, seen);
        urls.push(...subUrls);
      }
      return urls;
    }

    // Regular Sitemap (<url><loc>...</loc></url> or <loc>)
    $("url > loc, loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc && loc.startsWith("http")) {
        urls.push(loc);
      }
    });

    return urls;
  } catch (err: any) {
    console.warn(`Failed to parse sitemap ${sitemapUrl}:`, err.message);
    return urls;
  }
}

async function discoverUrlsFromSitemap(startUrl: string): Promise<{ sitemapsFound: string[]; urls: string[] }> {
  const sitemapCandidates = await findSitemapUrls(startUrl);
  const allUrls: string[] = [];
  const validSitemaps: string[] = [];
  const seen = new Set<string>();

  for (const smUrl of sitemapCandidates) {
    const found = await parseSitemapXml(smUrl, seen);
    if (found.length > 0) {
      validSitemaps.push(smUrl);
      allUrls.push(...found);
    }
  }

  // Firecrawl URL mapping integration: Discover complete site architecture via Firecrawl API
  if (allUrls.length < 5) {
    try {
      const firecrawlMappedUrls = await mapWithFirecrawl(startUrl);
      if (firecrawlMappedUrls.length > 0) {
        allUrls.push(...firecrawlMappedUrls);
        if (validSitemaps.length === 0) {
          validSitemaps.push("Firecrawl Site Map Engine");
        }
      }
    } catch (err: any) {
      console.warn("Firecrawl mapping fallback warning:", err.message);
    }
  }

  // Deduplicate and preserve order
  const deduped: string[] = [];
  const seenUrls = new Set<string>();
  for (const u of allUrls) {
    if (!seenUrls.has(u)) {
      seenUrls.add(u);
      deduped.push(u);
    }
  }

  return {
    sitemapsFound: validSitemaps.length > 0 ? validSitemaps : sitemapCandidates,
    urls: deduped,
  };
}

// ----------------------------------------------------
// 0. SITEMAP DISCOVERY API ROUTE
// ----------------------------------------------------
app.post("/api/discover-sitemap", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "Please provide a valid website URL or domain." });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    await assertPublicHttpUrl(targetUrl);
    const discovery = await discoverUrlsFromSitemap(targetUrl);
    return res.json({
      success: true,
      rootUrl: targetUrl,
      sitemapsFound: discovery.sitemapsFound,
      urls: discovery.urls,
      total: discovery.urls.length,
    });
  } catch (err: any) {
    console.error("Sitemap discovery error:", err);
    return res.status(err instanceof UserFacingError ? err.status : 500).json({ error: err.message || "Failed to discover sitemap." });
  }
});

// ----------------------------------------------------
// 1. URL FETCH & PARSER ENDPOINT (COMPREHENSIVE FULL-WEBPAGE SCRAPER)
// ----------------------------------------------------
app.post("/api/fetch-url", async (req, res) => {
  try {
    const { url, rawHtml } = req.body;
    let html = rawHtml || "";
    let isSynthetic = false;
    let fetchSource = "raw-html";

    let targetUrl = (url || "").trim();
    if (targetUrl && !targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    let firecrawlMeta: any = null;
    let rawHtmlForMeta = "";
    let firecrawlLinks: string[] = [];

    if (!html && targetUrl) {
      const fetchResult = await fetchPageHtmlWithMultiFallback(targetUrl);
      html = fetchResult.html;
      isSynthetic = fetchResult.isSynthetic;
      fetchSource = fetchResult.source;
      firecrawlMeta = fetchResult.firecrawlMetadata;
      rawHtmlForMeta = fetchResult.rawHtml || "";
      firecrawlLinks = fetchResult.firecrawlLinks || [];
    }

    if (!html || typeof html !== "string" || !html.trim()) {
      return res.status(400).json({ error: "Enter a URL or paste the page HTML." });
    }

    // Load with Cheerio
    const $ = cheerio.load(html);

    // Helper: Clean raw text and decode common HTML entities
    const cleanText = (txt: string) => {
      return (txt || "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&mdash;/g, "—")
        .replace(/&ndash;/g, "–")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    };

    // Helper: Extract voice search direct answer snippet
    const extractVoiceSnippet = (body: string): string => {
      if (!body) return "";
      const sentences = body.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 15);
      if (sentences.length > 0) {
        const combined = sentences.slice(0, 2).join(" ");
        const words = combined.split(/\s+/);
        if (words.length > 55) {
          return words.slice(0, 50).join(" ") + "...";
        }
        return combined;
      }
      return body.slice(0, 140);
    };

    // Helper: Extract EEAT citation source or proof data
    const extractCitationSource = (body: string): string => {
      if (!body) return "";
      const statMatches = body.match(
        /(\d+%\s*[\w\s]{4,30})|(\b(?:SOC-2|ISO\s*\d+|HIPAA|GDPR|Gartner|Forrester|Harvard|Stanford|Bloomberg|MIT|Statista|Forbes|IEEE|IDC)\b[\w\s]{0,35})/i
      );
      if (statMatches && statMatches[0]) {
        return statMatches[0].trim();
      }
      return "";
    };

    // 1. Extract SEO Backend Metadata (Enriched with Agent 1 Firecrawl API Metadata)
    const metaTitle =
      firecrawlMeta?.title ||
      $("title").first().text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      $("meta[name='twitter:title']").attr("content") ||
      firecrawlMeta?.ogTitle ||
      $("h1").first().text().trim() ||
      "Optimized Landing Page";

    const metaDescription =
      firecrawlMeta?.description ||
      $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='twitter:description']").attr("content") ||
      firecrawlMeta?.ogDescription ||
      $("p").first().text().trim().slice(0, 160) ||
      "";

    const canonicalUrl =
      firecrawlMeta?.canonicalUrl ||
      $("link[rel='canonical']").attr("href") ||
      firecrawlMeta?.sourceURL ||
      url ||
      $("meta[property='og:url']").attr("content") ||
      "";

    const robots =
      $("meta[name='robots']").attr("content") ||
      $("meta[name='googlebot']").attr("content") ||
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    // Discover Sitemap
    let sitemapUrl = "";
    $("link[rel='sitemap']").each((_, el) => {
      const href = $(el).attr("href");
      if (href) sitemapUrl = href;
    });
    if (!sitemapUrl && url) {
      try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        sitemapUrl = `${parsed.origin}/sitemap.xml`;
      } catch {
        sitemapUrl = "/sitemap.xml";
      }
    }

    // OpenGraph & Twitter metadata
    const openGraph = {
      title: firecrawlMeta?.ogTitle || $("meta[property='og:title']").attr("content") || metaTitle,
      description: firecrawlMeta?.ogDescription || $("meta[property='og:description']").attr("content") || metaDescription,
      image: firecrawlMeta?.ogImage || $("meta[property='og:image']").attr("content") || $("meta[property='og:image:secure_url']").attr("content") || "",
      type: $("meta[property='og:type']").attr("content") || "website",
      siteName: firecrawlMeta?.ogSiteName || $("meta[property='og:site_name']").attr("content") || "",
      url: $("meta[property='og:url']").attr("content") || canonicalUrl,
    };

    const twitterCard = {
      card: $("meta[name='twitter:card']").attr("content") || "summary_large_image",
      title: firecrawlMeta?.ogTitle || $("meta[name='twitter:title']").attr("content") || metaTitle,
      description: firecrawlMeta?.ogDescription || $("meta[name='twitter:description']").attr("content") || metaDescription,
      image: firecrawlMeta?.ogImage || $("meta[name='twitter:image']").attr("content") || openGraph.image || "",
    };

    // Meta Keywords & Tags
    const metaKeywords =
      $("meta[name='keywords']").attr("content") ||
      $("meta[name='news_keywords']").attr("content") ||
      "";
    const articleTags = $("meta[property='article:tag']").map((_, el) => $(el).attr("content")).get();
    const classification = $("meta[name='classification']").attr("content") || "";
    
    const combinedMetaTags = [
      ...metaKeywords.split(","),
      ...articleTags,
      ...classification.split(","),
    ]
      .map((s) => s.trim())
      .filter((s) => Boolean(s) && !META_KEYWORD_BLACKLIST.has(s.toLowerCase()));

    const uniqueKeywordTags = Array.from(new Set(combinedMetaTags));
    const initialDomain = detectPageDomainAndContext({ title: metaTitle, description: metaDescription });
    // Clean, genuine tags derived from actual metadata and page headings - NEVER hardcoded domain biases
    const extractedHeadingTags: string[] = [];
    $("h1, h2").each((_, el) => {
      // Skip headings that belong to site chrome (menus, navigation, footers).
      if ($(el).closest("nav, header, footer, [role='navigation'], [role='banner'], [role='contentinfo']").length) return;
      const txt = $(el).text().trim().replace(/[-|•–—].*$/, '').trim();
      if (/^(main )?menu$|^navigation$|^quick links$|^footer$|^search$/i.test(txt)) return;
      if (txt.length >= 4 && txt.length <= 40 && !META_KEYWORD_BLACKLIST.has(txt.toLowerCase())) {
        extractedHeadingTags.push(txt.toLowerCase());
      }
    });

    const fallbackTags = [
      initialDomain.coreSubject.toLowerCase(),
      ...extractedHeadingTags.slice(0, 4),
    ].filter(Boolean);

    const tags = uniqueKeywordTags.length > 0 ? uniqueKeywordTags : (fallbackTags.length > 0 ? fallbackTags : [initialDomain.coreSubject.toLowerCase()]);

    // Parse Schema.org JSON-LD
    const schemaTypesFound: string[] = [];
    const jsonLdObjects: any[] = [];
    const $schemaSource = rawHtmlForMeta ? cheerio.load(rawHtmlForMeta) : $;
    $schemaSource("script[type='application/ld+json']").each((_, el) => {
      try {
        const raw = $schemaSource(el).html();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              jsonLdObjects.push(p);
              if (p["@type"]) schemaTypesFound.push(p["@type"]);
            });
          } else if (parsed) {
            jsonLdObjects.push(parsed);
            if (parsed["@type"]) {
              schemaTypesFound.push(parsed["@type"]);
            }
            if (Array.isArray(parsed["@graph"])) {
              parsed["@graph"].forEach((item: any) => {
                if (item["@type"]) schemaTypesFound.push(item["@type"]);
              });
            }
          }
        }
      } catch {
        // ignore invalid script tag
      }
    });

    let combinedSchemaJson = "";
    if (jsonLdObjects.length > 0) {
      combinedSchemaJson =
        jsonLdObjects.length === 1
          ? JSON.stringify(jsonLdObjects[0], null, 2)
          : JSON.stringify(jsonLdObjects, null, 2);
    }
    // No JSON-LD on the page: leave it empty so the SEO gate reports it, rather than inventing one.

    const backendSEO: any = {
      metaTitle,
      metaDescription,
      canonicalUrl,
      robots,
      sitemapUrl,
      sitemapStatus: "Extracted from DOM / Canonical root",
      tags: tags,
      scrapedKeywordTags: uniqueKeywordTags,
      ctas: [],
      openGraph,
      twitterCard,
      schemaJsonLd: combinedSchemaJson,
      schemaTypesFound: Array.from(new Set(schemaTypesFound)),
      status: "non_compliant",
      originalSnapshot: {
        metaTitle,
        metaDescription,
        schemaJsonLd: combinedSchemaJson,
        canonicalUrl,
        robots,
        sitemapUrl,
        tags: tags,
        scrapedKeywordTags: uniqueKeywordTags,
        ctas: [],
      },
    };

    // ----------------------------------------------------
    // 2. EXTRACT ALL CTA TEXTS & CTA LINKS ACROSS WEBPAGE
    //    (Strict Rule: Take ONLY CTAs that have valid URLs)
    // ----------------------------------------------------
    const extractedCtas: {
      id: string;
      text: string;
      link: string;
      type: string;
      location: string;
      isExternal: boolean;
      targetKeyword?: string;
    }[] = [];

    const seenCtaKeys = new Set<string>();

    const isValidCtaUrl = (rawLink: string | undefined | null): boolean => {
      if (!rawLink || typeof rawLink !== "string") return false;
      const link = rawLink.trim();
      if (!link || link.length === 0) return false;

      const lower = link.toLowerCase();

      // Block javascript pseudo-protocols, void triggers, and dummy script links
      if (
        lower.startsWith("javascript:") ||
        lower.startsWith("void(") ||
        lower === "javascript:void(0)" ||
        lower === "javascript:void(0);" ||
        lower === "javascript:;" ||
        lower === "about:blank" ||
        lower === "undefined" ||
        lower === "null" ||
        lower === "none"
      ) {
        return false;
      }

      // Block dummy or empty hash anchors
      if (
        lower === "#" ||
        lower === "#!" ||
        lower === "#_" ||
        lower === "#action" ||
        lower === "#cta-action" ||
        lower === "#cta" ||
        lower === "#none" ||
        lower === "#null" ||
        lower === "#undefined" ||
        lower === "#top" ||
        lower === "#content"
      ) {
        return false;
      }

      // Valid absolute web URL (http:// or https://)
      if (lower.startsWith("http://") || lower.startsWith("https://")) {
        try {
          const parsed = new URL(link);
          return Boolean(parsed.hostname && (parsed.hostname.includes(".") || parsed.hostname === "localhost"));
        } catch {
          return false;
        }
      }

      // Valid protocol-relative URL (//domain.com/path)
      if (lower.startsWith("//") && lower.length > 4 && lower.includes(".")) {
        return true;
      }

      // Valid root-relative or relative path (/signup, /pricing, /demo, ./contact, ../products)
      if (lower.startsWith("/") && lower.length > 1 && !lower.startsWith("//")) {
        return true;
      }
      if (lower.startsWith("./") || lower.startsWith("../")) {
        return true;
      }

      // Valid direct contact actions
      if (lower.startsWith("mailto:") && lower.includes("@") && lower.length > 8) {
        return true;
      }
      if (lower.startsWith("tel:") && lower.length > 5) {
        return true;
      }

      // Valid named anchor link targeting a specific section ID (e.g. #pricing, #contact, #free-trial, #faqs)
      if (lower.startsWith("#") && lower.length > 2) {
        const anchorId = lower.slice(1).trim();
        const bannedAnchors = ["", "action", "cta-action", "cta", "void", "none", "null", "undefined", "top", "_"];
        return !bannedAnchors.includes(anchorId);
      }

      // Valid domain-like string (e.g. app.domain.com/signup or domain.io)
      if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(link)) {
        return true;
      }

      return false;
    };

    $("a, button, [role='button'], input[type='submit'], input[type='button'], [class*='btn'], [class*='button'], [class*='cta']").each((cIdx, el) => {
      const $el = $(el);
      const text = cleanText($el.text() || $el.attr("value") || $el.attr("title") || $el.attr("aria-label") || "");
      let link = cleanText($el.attr("href") || $el.attr("formaction") || $el.attr("data-href") || $el.attr("data-url") || "");

      if (!link && el.tagName.toLowerCase() === "button") {
        const formAction = $el.closest("form").attr("action");
        if (formAction) {
          link = cleanText(formAction);
        }
      }

      // Skip elements without valid text
      if (!text || text.length < 2 || text.length > 80) return;

      // STRICT VALIDATION: Take ONLY those which have valid URLs against them
      if (!isValidCtaUrl(link)) {
        return;
      }

      // Normalize / resolve relative link if targetUrl is provided
      let normalizedLink = link;
      if (targetUrl && (link.startsWith("/") || link.startsWith("./") || link.startsWith("../"))) {
        try {
          normalizedLink = new URL(link, targetUrl).href;
        } catch {
          normalizedLink = link;
        }
      }

      // Infer location
      let location = "Main Content";
      if ($el.closest("header, nav, [role='banner']").length > 0) {
        location = "Header / Navigation";
      } else if ($el.closest("footer, [role='contentinfo']").length > 0) {
        location = "Footer / Bottom CTA";
      } else if ($el.closest("aside, [role='complementary']").length > 0) {
        location = "Sidebar / Sticky";
      } else if ($el.closest("section, div").first().find("h1").length > 0 || cIdx < 3) {
        location = "Hero Banner";
      }

      // Infer CTA Type
      let ctaType = "Action Link";
      const classes = ($el.attr("class") || "").toLowerCase();
      if (el.tagName.toLowerCase() === "button" || classes.includes("primary") || classes.includes("main") || classes.includes("highlight")) {
        ctaType = "Primary CTA";
      } else if (classes.includes("secondary") || classes.includes("outline") || classes.includes("ghost")) {
        ctaType = "Secondary Button";
      } else if (normalizedLink.startsWith("#")) {
        ctaType = "Anchor Jump";
      } else if (el.tagName.toLowerCase() === "button" || $el.attr("type") === "submit") {
        ctaType = "Form Action";
      }

      const isExternal = normalizedLink.startsWith("http://") || normalizedLink.startsWith("https://");

      const key = `${text.toLowerCase()}:::${normalizedLink.toLowerCase()}`;
      if (!seenCtaKeys.has(key)) {
        seenCtaKeys.add(key);
        extractedCtas.push({
          id: `cta-${extractedCtas.length + 1}`,
          text,
          link: normalizedLink,
          type: ctaType,
          location,
          isExternal,
          targetKeyword: text,
        });
      }
    });

    if (extractedCtas.length === 0 && isSynthetic) {
      const baseUrl = targetUrl || "https://example.com";
      extractedCtas.push(
        {
          id: "cta-1",
          text: "Get Started Free",
          link: `${baseUrl}#get-started`,
          type: "Primary CTA",
          location: "Hero Banner",
          isExternal: false,
          targetKeyword: "Get Started Free",
        },
        {
          id: "cta-2",
          text: "Schedule a Live Demo",
          link: `${baseUrl}#demo`,
          type: "Secondary Button",
          location: "Main Content",
          isExternal: false,
          targetKeyword: "Live Demo",
        },
        {
          id: "cta-3",
          text: "Contact Enterprise Sales",
          link: `${baseUrl}#contact`,
          type: "Action Link",
          location: "Footer / Bottom CTA",
          isExternal: false,
          targetKeyword: "Enterprise Sales",
        }
      );
    }

    backendSEO.ctas = extractedCtas;
    backendSEO.originalSnapshot.ctas = JSON.parse(JSON.stringify(extractedCtas));

    // ----------------------------------------------------
    // 2.5 DETERMINISTIC MEDIA PRESENCE DETECTION (NO LLM JUDGMENT)
    // ----------------------------------------------------
    let mediaHasImages = false;
    $("img").each((_, el) => {
      const src = cleanText($(el).attr("src") || "");
      if (src && src.length > 0) {
        mediaHasImages = true;
        return false;
      }
    });

    let mediaHasVideo = false;
    if ($("video").length > 0) {
      mediaHasVideo = true;
    } else {
      const videoEmbedRegex = /(?:youtube\.com\/(?:embed|v|watch)|youtu\.be\/|player\.vimeo\.com|vimeo\.com|fast\.wistia\.(?:net|com)|wistia\.com\/embed|wistia\.net)/i;
      $("iframe").each((_, el) => {
        const src = cleanText($(el).attr("src") || "");
        if (videoEmbedRegex.test(src)) {
          mediaHasVideo = true;
          return false;
        }
      });
    }
    if (!mediaHasVideo && (combinedSchemaJson.includes("VideoObject") || /"VideoObject"/i.test(combinedSchemaJson))) {
      mediaHasVideo = true;
    }

    let mediaHasPodcast = false;
    if ($("audio").length > 0) {
      mediaHasPodcast = true;
    } else {
      const podcastHostRegex = /(?:open\.spotify\.com\/(?:show|episode)|podcasts\.apple\.com|podcasts\.google\.com|transistor\.fm|anchor\.fm|buzzsprout\.com|libsyn\.com|podbean\.com|simplecast\.com|megaphone\.fm|captivate\.fm|rss\.com|castos\.com|overcast\.fm|pocketcasts\.com|feedburner\.com)/i;
      $("a").each((_, el) => {
        const href = cleanText($(el).attr("href") || "");
        if (podcastHostRegex.test(href)) {
          mediaHasPodcast = true;
          return false;
        }
      });
    }
    if (!mediaHasPodcast && (combinedSchemaJson.includes("PodcastEpisode") || combinedSchemaJson.includes("PodcastSeries") || /PodcastEpisode|PodcastSeries/i.test(combinedSchemaJson))) {
      mediaHasPodcast = true;
    }

    const detectedMedia = {
      hasImages: mediaHasImages,
      hasVideo: mediaHasVideo,
      hasPodcast: mediaHasPodcast,
    };

    backendSEO.media = detectedMedia;
    backendSEO.originalSnapshot.media = { ...detectedMedia };

    // ----------------------------------------------------
    // 3. COMPREHENSIVE DOM CLEANING & SCOPED EXTRACTION
    //    (Strictly from first H1 of the page till the last FAQ)
    // ----------------------------------------------------
    
    // Create a working clone of the body
    const bodyClone = $("body").clone();

    // Strip non-content and footer elements to ensure clean extraction
    bodyClone
      .find(
        "script:not([type='application/ld+json']), style, noscript, iframe, svg, canvas, object, embed, select, footer, [role='contentinfo'], #footer, .site-footer, .footer, .footer-container, .footer-wrapper, .copyright, #copyright, .cookie-banner, .cookie-notice, #cookie-banner, .consent-banner, #cookie-law, .ad-unit, .adsbygoogle, nav, [role='navigation']"
      )
      .remove();

    const questionWordRegex = /^(how|what|why|can|is|are|will|where|when|which|who|does|do|should|could)\b/i;

    const extractedFaqs: { id: string; question: string; answer: string; voiceIntent: string }[] = [];

    // --- STEP A: Extract FAQs from Schema.org JSON-LD (FAQPage) ---
    jsonLdObjects.forEach((obj, objIdx) => {
      const inspectSchemaItem = (item: any) => {
        if (!item) return;
        const typeStr = String(item["@type"] || "").toLowerCase();
        if (typeStr.includes("faqpage") || typeStr.includes("faq") || typeStr.includes("qapage")) {
          const entities = Array.isArray(item.mainEntity) ? item.mainEntity : (item.mainEntity ? [item.mainEntity] : []);
          entities.forEach((qObj: any, qIdx: number) => {
            const qText = cleanText(qObj.name || qObj.text || qObj.headline || "");
            const ansObj = qObj.acceptedAnswer || qObj.suggestedAnswer || qObj.answer;
            let aText = "";
            if (typeof ansObj === "string") {
              aText = cleanText(ansObj);
            } else if (ansObj && typeof ansObj === "object") {
              aText = cleanText(ansObj.text || ansObj.name || ansObj.description || "");
            }
            if (qText && aText && !extractedFaqs.some(f => f.question.toLowerCase() === qText.toLowerCase())) {
              extractedFaqs.push({
                id: `faq-schema-${objIdx}-${qIdx}`,
                question: qText,
                answer: aText,
                voiceIntent: "Voice Search Question (Schema.org Verified)",
              });
            }
          });
        }
      };

      inspectSchemaItem(obj);
      if (Array.isArray(obj["@graph"])) {
        obj["@graph"].forEach(inspectSchemaItem);
      }
    });

    // --- STEP B: Extract DOM FAQs ---
    // 1. <details> accordions
    bodyClone.find("details").each((dIdx, dEl) => {
      const summaryEl = $(dEl).find("summary").first();
      const qText = cleanText(summaryEl.text());
      if (qText) {
        const dClone = $(dEl).clone();
        dClone.find("summary").remove();
        const aText = cleanText(dClone.text());
        if (aText && !extractedFaqs.some(f => f.question.toLowerCase() === qText.toLowerCase())) {
          extractedFaqs.push({
            id: `faq-details-${dIdx}`,
            question: qText,
            answer: aText.length > 400 ? aText.slice(0, 380) + "..." : aText,
            voiceIntent: "Voice Search Question (<details> Accordion)",
          });
        }
      }
    });

    // 2. Class-based FAQ items
    bodyClone.find(".faq-item, .accordion-item, [class*='faq__item'], [class*='faq-item'], [class*='AccordionItem'], [itemtype*='Question']").each((fIdx, fEl) => {
      const qEl = $(fEl).find(".faq-question, .accordion-header, [class*='question'], [class*='trigger'], [class*='title'], [itemprop='name'], button, h3, h4").first();
      const aEl = $(fEl).find(".faq-answer, .accordion-body, [class*='answer'], [class*='content'], [class*='panel'], [itemprop='text'], p").first();
      const qText = cleanText(qEl.text());
      const aText = cleanText(aEl.text());
      if (qText && aText && qText.length > 6 && !extractedFaqs.some(f => f.question.toLowerCase() === qText.toLowerCase())) {
        extractedFaqs.push({
          id: `faq-dom-${fIdx}`,
          question: qText,
          answer: aText.length > 400 ? aText.slice(0, 380) + "..." : aText,
          voiceIntent: "Voice Search Question",
        });
      }
    });

    // 3. <dl> Description lists
    bodyClone.find("dl").each((dlIdx, dlEl) => {
      $(dlEl).find("dt").each((dtIdx, dtEl) => {
        const qText = cleanText($(dtEl).text());
        const ddEl = $(dtEl).next("dd");
        const aText = cleanText(ddEl.text());
        if (qText && aText && (qText.includes("?") || qText.length > 10) && !extractedFaqs.some(f => f.question.toLowerCase() === qText.toLowerCase())) {
          extractedFaqs.push({
            id: `faq-dl-${dlIdx}-${dtIdx}`,
            question: qText,
            answer: aText.length > 400 ? aText.slice(0, 380) + "..." : aText,
            voiceIntent: "Voice Search Question",
          });
        }
      });
    });

    // 4. Question headings (H2, H3, H4 ending in ? or question words)
    bodyClone.find("h2, h3, h4, [class*='question-title']").each((hIdx, hEl) => {
      const qText = cleanText($(hEl).text());
      if ((qText.includes("?") || questionWordRegex.test(qText)) && qText.length > 10) {
        let nextP = $(hEl).next("p");
        if (nextP.length === 0) {
          nextP = $(hEl).parent().find("p").first();
        }
        const aText = cleanText(nextP.text());
        if (aText && aText.length > 15 && !extractedFaqs.some(f => f.question.toLowerCase() === qText.toLowerCase())) {
          extractedFaqs.push({
            id: `faq-heading-${hIdx}`,
            question: qText,
            answer: aText.length > 400 ? aText.slice(0, 380) + "..." : aText,
            voiceIntent: "Voice Search Question",
          });
        }
      }
    });

    // ----------------------------------------------------
    // 3. COMPREHENSIVE EXACT-ORDER DOM EXTRACTION
    //    (Captures entire webpage content in exact live sequence and format)
    //    (Rule: Show H2s and content under it ONLY if content under that H2 has > 10 words)
    // ----------------------------------------------------
    const allHeadings: { tag: string; text: string; voiceIntent?: string }[] = [];
    const allParagraphs: string[] = [];
    const allListItems: string[] = [];
    const extractedTables: { id: string; title?: string; headers: string[]; rows: string[][] }[] = [];

    // Accurate word count calculator
    const countWords = (str: string): number => {
      if (!str) return 0;
      const plain = str
        .replace(/<[^>]+>/g, " ")
        .replace(/[#*`|_~>]/g, " ")
        .replace(/[-–—]/g, " ")
        .trim();
      if (!plain) return 0;
      const words = plain.split(/\s+/).filter((w) => w.length > 0 && /[\w\d]/.test(w));
      return words.length;
    };

    const formatTableMarkdown = (tbl: { title?: string; headers: string[]; rows: string[][] }): string => {
      const lines: string[] = [];
      if (tbl.title) lines.push(`### ${tbl.title}`);
      lines.push(`| ${tbl.headers.join(" | ")} |`);
      lines.push(`| ${tbl.headers.map(() => "---").join(" | ")} |`);
      tbl.rows.forEach((r) => {
        lines.push(`| ${r.join(" | ")} |`);
      });
      return lines.join("\n");
    };

    const extractTableData = ($t: any, index: number) => {
      let tableTitle = cleanText($t.find("caption, figcaption").text());
      if (!tableTitle) {
        const prevEl = $t.prev("h2, h3, h4, h5, p, strong");
        if (prevEl.length > 0) tableTitle = cleanText(prevEl.text());
      }
      if (!tableTitle) {
        const parentPrev = $t.parent().prev("h2, h3, h4, h5, p, strong");
        if (parentPrev.length > 0) tableTitle = cleanText(parentPrev.text());
      }

      const headers: string[] = [];
      const rows: string[][] = [];
      const theadThs = $t.find("thead th, thead td, thead [role='columnheader']");
      const allTrs = $t.find("tr, [role='row']");

      if (theadThs.length > 0) {
        theadThs.each((_: any, cell: any) => {
          const txt = cleanText($(cell).text());
          headers.push(txt || `Column ${headers.length + 1}`);
        });
      } else if (allTrs.length > 0) {
        allTrs.first().find("th, td, [role='columnheader'], [role='cell']").each((_: any, cell: any) => {
          const txt = cleanText($(cell).text());
          headers.push(txt || `Column ${headers.length + 1}`);
        });
      }

      allTrs.each((rIdx: number, rEl: any) => {
        if (theadThs.length === 0 && rIdx === 0) return;
        if ($(rEl).closest("thead").length > 0) return;
        const rowCells: string[] = [];
        $(rEl).find("td, th, [role='cell']").each((_: any, cell: any) => {
          rowCells.push(cleanText($(cell).text()));
        });
        if (rowCells.some((c) => c.length > 0)) {
          rows.push(rowCells);
        }
      });

      if (headers.length > 0 && rows.length > 0) {
        const tableId = `tbl-${index}`;
        return {
          id: tableId,
          title: tableTitle || `Table ${index}: ${headers[0] || 'Data'} Overview`,
          headers,
          rows,
        };
      }
      return null;
    };

    interface DocBlock {
      type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'blockquote' | 'list' | 'table' | 'faq';
      tag?: string;
      text: string;
      markdown: string;
      voiceIntent?: string;
      listItems?: string[];
      tableData?: { id: string; title?: string; headers: string[]; rows: string[][] };
      faqData?: { id: string; question: string; answer: string; voiceIntent: string };
    }

    const docBlocks: DocBlock[] = [];
    const seenBlockTexts = new Set<string>();
    const seenTableIds = new Set<string>();

    const walkDomNode = (elNode: any) => {
      if (!elNode || elNode.type !== 'tag') return;
      const $node = $(elNode);
      const tag = (elNode.tagName || '').toLowerCase();
      const role = ($node.attr('role') || '').toLowerCase();
      const ariaLevel = $node.attr('aria-level');

      // Skip non-content tags
      if (['script', 'style', 'noscript', 'svg', 'canvas', 'iframe', 'select', 'option'].includes(tag)) {
        return;
      }

      // Check if Heading
      const isHeading = (tag.startsWith('h') && /^h[1-6]$/.test(tag)) || role === 'heading';
      if (isHeading) {
        let headingLevel = tag.startsWith('h') && /^h[1-6]$/.test(tag) ? tag : (ariaLevel ? `h${ariaLevel}` : 'h2');
        if (headingLevel === 'h5' || headingLevel === 'h6') headingLevel = 'h4';
        const hText = cleanText($node.text());
        if (hText && hText.length >= 2 && hText.length <= 300) {
          const isVoiceQ = hText.includes('?') || questionWordRegex.test(hText);
          const voiceIntent = isVoiceQ
            ? 'Voice Search Question'
            : headingLevel === 'h1'
            ? 'Primary Search & Intent Anchor'
            : 'Secondary Subtopic & Semantic Scope';

          let mdPrefix = '#';
          if (headingLevel === 'h2') mdPrefix = '##';
          else if (headingLevel === 'h3') mdPrefix = '###';
          else if (headingLevel === 'h4') mdPrefix = '####';

          docBlocks.push({
            type: headingLevel as any,
            tag: headingLevel,
            text: hText,
            markdown: `${mdPrefix} ${hText}`,
            voiceIntent,
          });
        }
        return; // Do not recurse into heading children
      }

      // Check if Table
      if (tag === 'table' || role === 'table' || role === 'grid') {
        const tbl = extractTableData($node, extractedTables.length + 1);
        if (tbl && !seenTableIds.has(tbl.id)) {
          seenTableIds.add(tbl.id);
          extractedTables.push(tbl);
          docBlocks.push({
            type: 'table',
            text: `${tbl.title || ''} ${tbl.headers.join(' ')} ${tbl.rows.map(r => r.join(' ')).join(' ')}`,
            markdown: formatTableMarkdown(tbl),
            tableData: tbl,
          });
        }
        return;
      }

      // Check if List (ul or ol)
      if (tag === 'ul' || tag === 'ol') {
        const isOrdered = tag === 'ol';
        const items: string[] = [];
        $node.find('> li').each((idx: number, liEl: any) => {
          const liText = cleanText($(liEl).text());
          if (liText && liText.length >= 2) {
            items.push(liText);
            if (!allListItems.includes(liText)) allListItems.push(liText);
          }
        });
        if (items.length > 0) {
          const mdList = items.map((it, i) => isOrdered ? `${i + 1}. ${it}` : `- ${it}`).join('\n');
          docBlocks.push({
            type: 'list',
            text: items.join(' '),
            markdown: mdList,
            listItems: items,
          });
        }
        return;
      }

      // Check if dl
      if (tag === 'dl') {
        const items: string[] = [];
        $node.children('dt').each((_: any, dtEl: any) => {
          const dtText = cleanText($(dtEl).text());
          const ddText = cleanText($(dtEl).next('dd').text());
          if (dtText && ddText) {
            items.push(`- **${dtText}**: ${ddText}`);
          } else if (dtText) {
            items.push(`- ${dtText}`);
          }
        });
        if (items.length > 0) {
          docBlocks.push({
            type: 'list',
            text: items.join(' '),
            markdown: items.join('\n'),
            listItems: items,
          });
        }
        return;
      }

      // Check if details (accordion FAQ)
      if (tag === 'details') {
        const qText = cleanText($node.children('summary').first().text());
        const dClone = $node.clone();
        dClone.children('summary').remove();
        const aText = cleanText(dClone.text());
        if (qText) {
          const faqItem = {
            id: `faq-details-${extractedFaqs.length + 1}`,
            question: qText,
            answer: aText,
            voiceIntent: 'Voice Search Question (<details> Accordion)',
          };
          if (!extractedFaqs.some(f => f.question.toLowerCase() === qText.toLowerCase())) {
            extractedFaqs.push(faqItem);
          }
          docBlocks.push({
            type: 'faq',
            text: `${qText} ${aText}`,
            markdown: `### ${qText}\n\n${aText}`,
            faqData: faqItem,
          });
        }
        return;
      }

      // Check if blockquote
      if (tag === 'blockquote') {
        const text = cleanText($node.text());
        if (text && text.length >= 10 && !seenBlockTexts.has(text)) {
          seenBlockTexts.add(text);
          allParagraphs.push(text);
          docBlocks.push({
            type: 'blockquote',
            text,
            markdown: `> ${text}`,
          });
        }
        return;
      }

      // Check if paragraph
      if (tag === 'p') {
        const text = cleanText($node.text());
        if (text && text.length >= 4 && !seenBlockTexts.has(text)) {
          seenBlockTexts.add(text);
          allParagraphs.push(text);
          docBlocks.push({
            type: 'paragraph',
            text,
            markdown: text,
          });
        }
        return;
      }

      // Check for leaf text containers (div, section, article, etc.)
      const hasBlockChildren = $node.children('h1, h2, h3, h4, h5, h6, [role="heading"], p, blockquote, ul, ol, dl, table, details, div, section, article, main').length > 0;
      if (!hasBlockChildren) {
        const text = cleanText($node.text());
        if (text && text.length >= 15 && !seenBlockTexts.has(text)) {
          seenBlockTexts.add(text);
          allParagraphs.push(text);
          docBlocks.push({
            type: 'paragraph',
            text,
            markdown: text,
          });
        }
        return;
      }

      // Recurse children in exact document order
      $node.children().each((_: any, child: any) => {
        walkDomNode(child);
      });
    };

    // Walk entire bodyClone from top to bottom in exact live webpage order
    bodyClone.children().each((_: any, child: any) => {
      walkDomNode(child);
    });

    // Page content starts at the H1: anything above it is header / mega-menu chrome.
    const firstH1Index = docBlocks.findIndex((b) => b.type === "h1");
    if (firstH1Index > 0) docBlocks.splice(0, firstH1Index);

    // ------------------------------------------------------------------------
    // STRICT FILTERING & PARTITIONING:
    // "For content under H2s, show me the H2s and the content under it only
    // if the content under that H2 has more than 10 words."
    // ------------------------------------------------------------------------
    const fullBodyStreamParts: string[] = [];
    const extractedH2Sections: any[] = [];

    // Find indices of all H2 blocks
    const h2Indices: number[] = [];
    docBlocks.forEach((b, idx) => {
      if (b.type === 'h2') {
        h2Indices.push(idx);
      }
    });

    // 1. Process top-of-page content before the very first H2 (Hero / Overview)
    const firstH2Idx = h2Indices.length > 0 ? h2Indices[0] : docBlocks.length;
    const introBlocks = docBlocks.slice(0, firstH2Idx);

    introBlocks.forEach((b) => {
      fullBodyStreamParts.push(b.markdown);
      if (b.type === 'h1' || b.type === 'h3' || b.type === 'h4') {
        if (!allHeadings.some(h => h.text.toLowerCase() === b.text.toLowerCase())) {
          allHeadings.push({
            tag: b.tag || b.type,
            text: b.text,
            voiceIntent: b.voiceIntent,
          });
        }
      }
    });

    // 2. Process each H2 and the content under it in exact webpage sequence
    h2Indices.forEach((h2Idx, i) => {
      const h2Block = docBlocks[h2Idx];
      const nextH2Idx = i < h2Indices.length - 1 ? h2Indices[i + 1] : docBlocks.length;
      const contentBlocksUnderH2 = docBlocks.slice(h2Idx + 1, nextH2Idx);

      // Collect all text under this H2 (excluding the H2 heading itself)
      const contentUnderH2Text = contentBlocksUnderH2.map((b) => b.text).join(' ');
      const wordCount = countWords(contentUnderH2Text);

      // MANDATORY USER RULE:
      // Show the H2 and the content under it ONLY if the content under that H2 has more than 10 words (> 10)
      if (wordCount > 10) {
        // A. Add H2 and content under it to fullBodyStreamParts in exact order and format
        fullBodyStreamParts.push(h2Block.markdown);
        contentBlocksUnderH2.forEach((b) => {
          fullBodyStreamParts.push(b.markdown);
        });

        // B. Add H2 to allHeadings
        allHeadings.push({
          tag: 'h2',
          text: h2Block.text,
          voiceIntent: h2Block.voiceIntent || 'Secondary Subtopic & Semantic Scope',
        });

        // Add any subheadings under this H2
        contentBlocksUnderH2.forEach((b) => {
          if ((b.type === 'h3' || b.type === 'h4') && !allHeadings.some(h => h.text.toLowerCase() === b.text.toLowerCase())) {
            allHeadings.push({
              tag: b.tag || b.type,
              text: b.text,
              voiceIntent: b.voiceIntent || 'Voice Search Question',
            });
          }
        });

        // C. Extract sub-elements for structured H2 section
        const secH3s = contentBlocksUnderH2
          .filter((b) => b.type === 'h3')
          .map((b) => ({
            tag: 'h3' as const,
            text: b.text,
            voiceIntent: b.voiceIntent || 'Secondary Subtopic / Query',
          }));

        const secParagraphs = contentBlocksUnderH2
          .filter((b) => b.type === 'paragraph' || b.type === 'blockquote')
          .map((b) => b.text);

        const secListItems = contentBlocksUnderH2.flatMap((b) => b.listItems || []);
        const secTables = contentBlocksUnderH2.filter((b) => b.tableData).map((b) => b.tableData!);
        const secFaqs = contentBlocksUnderH2.filter((b) => b.faqData).map((b) => b.faqData!);

        // Link any Schema.org FAQs related to this H2
        extractedFaqs.forEach((f) => {
          if (
            f.question.toLowerCase().includes(h2Block.text.toLowerCase().slice(0, 15)) ||
            (i === h2Indices.length - 1 && h2Block.text.toLowerCase().includes('faq'))
          ) {
            if (!secFaqs.some((sf) => sf.id === f.id)) {
              secFaqs.push(f);
            }
          }
        });

        const sectionBody = secParagraphs.length > 0 ? secParagraphs.join('\n\n') : contentUnderH2Text;
        const secVoiceSnippet = extractVoiceSnippet(sectionBody);
        const secCitation = extractCitationSource(sectionBody);

        extractedH2Sections.push({
          id: `h2-sec-${extractedH2Sections.length + 1}`,
          order: extractedH2Sections.length + 1,
          h2Text: h2Block.text,
          originalH2Text: h2Block.text,
          voiceIntent: h2Block.voiceIntent || 'Secondary Subtopic & Semantic Scope',
          wordCount,
          h3Headings: secH3s,
          bodyParagraphs: secParagraphs.length > 0 ? secParagraphs : [sectionBody],
          listItems: secListItems,
          tables: secTables,
          faqs: secFaqs,
          voiceAnswerSnippet: secVoiceSnippet,
          citationSource: secCitation,
          status: 'non_compliant',
          originalSnapshot: {
            h2Text: h2Block.text,
            wordCount,
            h3Headings: JSON.parse(JSON.stringify(secH3s)),
            bodyParagraphs: secParagraphs.length > 0 ? [...secParagraphs] : [sectionBody],
            listItems: [...secListItems],
            tables: JSON.parse(JSON.stringify(secTables)),
            faqs: JSON.parse(JSON.stringify(secFaqs)),
            voiceAnswerSnippet: secVoiceSnippet,
            citationSource: secCitation,
          },
        });
      }
      // If wordCount <= 10: Intentionally filtered out! The H2 and its content are NOT shown.
    });

    // 3. Fallback only if 0 H2 sections had > 10 words, create a clean section from body paragraphs if available
    if (extractedH2Sections.length === 0 && allParagraphs.length > 0) {
      const combinedAllP = allParagraphs.join(' ');
      const totalWords = countWords(combinedAllP);
      if (totalWords > 10) {
        const fallbackTitle = allHeadings.find(h => h.tag === 'h1')?.text || `${metaTitle.split(/[-|:]/)[0].trim()} Overview`;
        extractedH2Sections.push({
          id: 'h2-sec-1',
          order: 1,
          h2Text: fallbackTitle,
          originalH2Text: fallbackTitle,
          voiceIntent: 'Primary Search & Intent Anchor',
          wordCount: totalWords,
          h3Headings: [],
          bodyParagraphs: allParagraphs,
          listItems: allListItems,
          tables: extractedTables,
          faqs: extractedFaqs,
          voiceAnswerSnippet: extractVoiceSnippet(combinedAllP),
          citationSource: extractCitationSource(combinedAllP),
          status: 'non_compliant',
          originalSnapshot: {
            h2Text: fallbackTitle,
            wordCount: totalWords,
            h3Headings: [],
            bodyParagraphs: [...allParagraphs],
            listItems: [...allListItems],
            tables: JSON.parse(JSON.stringify(extractedTables)),
            faqs: JSON.parse(JSON.stringify(extractedFaqs)),
            voiceAnswerSnippet: extractVoiceSnippet(combinedAllP),
            citationSource: extractCitationSource(combinedAllP),
          },
        });
      }
    }

    // Allocate any unassigned tables to the last section
    if (extractedH2Sections.length > 0 && extractedTables.length > 0) {
      extractedTables.forEach((tbl, tIdx) => {
        const isPresent = extractedH2Sections.some(sec => (sec.tables || []).some((t: any) => t.id === tbl.id));
        if (!isPresent) {
          const targetSec = extractedH2Sections[Math.min(tIdx, extractedH2Sections.length - 1)];
          if (targetSec) {
            targetSec.tables = targetSec.tables || [];
            targetSec.tables.push(tbl);
            if (targetSec.originalSnapshot) {
              targetSec.originalSnapshot.tables = targetSec.originalSnapshot.tables || [];
              targetSec.originalSnapshot.tables.push(tbl);
            }
          }
        }
      });
    }

    // Ensure first H1 is at top of allHeadings
    const foundH1 = docBlocks.find(b => b.type === 'h1')?.text || $("h1").first().text().trim();
    if (foundH1 && !allHeadings.some(h => h.tag === 'h1')) {
      allHeadings.unshift({
        tag: 'h1',
        text: cleanText(foundH1),
        voiceIntent: 'Primary Search & Intent Anchor',
      });
    } else if (allHeadings.length === 0 && metaTitle) {
      allHeadings.push({
        tag: 'h1',
        text: metaTitle,
        voiceIntent: 'Primary Search & Intent Anchor',
      });
    }

    const fullBodyText = fullBodyStreamParts.length > 0
      ? fullBodyStreamParts.join("\n\n").trim()
      : allParagraphs.join("\n\n").trim() || "Webpage content loaded.";

    const voiceAnswerSnippet = extractVoiceSnippet(fullBodyText);
    const citationSource = extractCitationSource(fullBodyText);
    const primaryH1Text = allHeadings.find((h) => h.tag?.toLowerCase() === "h1")?.text || metaTitle || "Webpage Body & Voice Copy";
    const primaryTopic = metaTitle.split(/[-|:]/)[0].trim() || "Enterprise Solution";

    const heroParagraph = allParagraphs[0] || `Empower your teams with ${primaryTopic}. Automate complex workflows, eliminate manual toil, and scale infrastructure with enterprise-grade reliability.`;

    const unifiedComponent = {
      id: "page_body_content",
      name: primaryH1Text.length > 65 ? primaryH1Text.slice(0, 62) + "..." : primaryH1Text,
      type: "full_body_content",
      headings: allHeadings,
      heroDescription: heroParagraph,
      bodyContent: fullBodyText,
      h2Sections: extractedH2Sections,
      faqs: extractedFaqs,
      listItems: allListItems,
      tables: extractedTables,
      voiceAnswerSnippet: voiceAnswerSnippet || extractedFaqs[0]?.answer || "",
      citationSource,
      status: "non_compliant" as const,
      originalSnapshot: {
        headings: JSON.parse(JSON.stringify(allHeadings)),
        heroDescription: heroParagraph,
        bodyContent: fullBodyText,
        h2Sections: JSON.parse(JSON.stringify(extractedH2Sections)),
        faqs: JSON.parse(JSON.stringify(extractedFaqs)),
        listItems: [...allListItems],
        tables: JSON.parse(JSON.stringify(extractedTables)),
        voiceAnswerSnippet: voiceAnswerSnippet || extractedFaqs[0]?.answer || "",
        citationSource,
      },
    };

    const components = [unifiedComponent];

    // ----------------------------------------------------
    // 4. INSTANT KEYWORD EXTRACTION FROM EXTRACTED METADATA & CONTENT (<5ms)
    // ----------------------------------------------------
    const allHeadingsFlat = components.flatMap((c) => c.headings.map((h: any) => h.text));
    const sampleFullText = components.map((c) => c.bodyContent).join("\n\n").slice(0, 60000);

    const extractedKeywords = extractKeywordsAlgorithmic({
      title: metaTitle,
      description: metaDescription,
      headings: allHeadingsFlat,
      h1: allHeadings.find((h: any) => h.tag === "h1")?.text,
      bodyText: sampleFullText,
      tags,
      url: targetUrl,
      faqQuestions: extractedFaqs.map((f: any) => f.question),
    });

    return res.json({
      success: true,
      url: url || "Custom HTML Input",
      backend: backendSEO,
      components,
      keywords: extractedKeywords,
      isSynthetic,
      fetchSource,
      agentResponsible: "Agent 1: Ingress & Scraping Agent (Powered by Firecrawl API)",
      notice: fetchSource === "raw-html"
        ? "Parsed the pasted HTML."
        : `Fetched ${url} via ${fetchSource === "agent-1-firecrawl" ? "Firecrawl" : fetchSource}.`,
    });
  } catch (err: any) {
    console.error("Error in /api/fetch-url:", err);
    const status = err instanceof UserFacingError ? err.status : 500;
    return res.status(status).json({ error: err.message || "Failed to fetch the page." });
  }
});

// ----------------------------------------------------
// GOOGLE ADS KEYWORD PLANNER API ENDPOINTS
// ----------------------------------------------------
app.get("/api/google-ads/status", async (_req, res) => {
  try {
    const status = await getGoogleAdsStatus();
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ connected: false, error: err.message });
  }
});

app.post("/api/google-ads/metrics", async (req, res) => {
  try {
    const { keywords } = req.body;
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: "keywords array required" });
    }
    const metrics = await fetchGoogleKeywordHistoricalMetrics(keywords);
    return res.json({ success: true, metrics });
  } catch (err: any) {
    console.error("Error in /api/google-ads/metrics:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/google-ads/keyword-ideas", async (req, res) => {
  try {
    const { keywords, url, geoTarget } = req.body;
    const ideas = await fetchGoogleKeywordIdeas({ keywords, url, geoTarget });
    const prioritized = applySearchVolumePriorityMatrix(ideas);
    return res.json({ success: true, keywords: prioritized });
  } catch (err: any) {
    console.error("Error in /api/google-ads/keyword-ideas:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// KEYWORD AUTOFILL & EXTRACTION ENDPOINT (<500ms)
// ----------------------------------------------------
app.post("/api/extract-keywords", async (req, res) => {
  try {
    const { title, description, headings, bodyText, tags, url, h1, faqQuestions } = req.body;

    // Deterministic baseline: phrases that actually occur on the page.
    let extractedKeywords = extractKeywordsAlgorithmic({
      title,
      description,
      headings: Array.isArray(headings) ? headings : [],
      h1,
      bodyText: String(bodyText || '').slice(0, 60000),
      tags: Array.isArray(tags) ? tags : [],
      url,
      faqQuestions: Array.isArray(faqQuestions) ? faqQuestions : [],
    });

    // Optionally refine with Gemini if available with a tight 3s timeout
    if (llmAvailable()) {
      const kwPrompt = `
Pick 6 to 8 target keywords this page is targeting, for Google Search, voice search (AEO) and AI answer engines (GEO).
Rules:
- Every keyword must be a phrase a searcher would type AND must be clearly supported by the page content below. Prefer 2-4 word phrases.
- Exactly one 'primary' keyword: the main topic, as it appears in the title or H1.
- 'voice_question' keywords must be real questions the page answers.
- Do not estimate search volume: always return searchVolume 0 (verified volumes are added later from Google Ads).
Candidate phrases found on the page (you may use, refine or replace them): ${JSON.stringify(extractedKeywords.map((k: any) => k.keyword))}
For each keyword, determine:
- keyword: string phrase
- searchVolume: 0
- intent: 'commercial' | 'informational' | 'transactional'
- priority: 'primary' (for H1 & Title), 'secondary' (for H2 feature sections), 'voice_question' (for conversational H3 voice answers), or 'lsi' (for body semantics)
- notes: concise strategic guidance for heading or copy placement

Page Title: ${title || ''}
Page Description: ${description || ''}
Page Headings: ${JSON.stringify((headings || []).slice(0, 10))}
Tags: ${JSON.stringify(tags || [])}
Body Content Sample: ${String(bodyText || '').slice(0, 6000)}

Return strict JSON array of objects with fields: id, keyword, searchVolume, intent, priority, notes.
`;
      try {
        const aiKeywords = await callGeminiWithRetry({
          job: 'keywords',
          expect: 'array',
          contents: kwPrompt,
          timeoutMs: 15000,
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                keyword: { type: Type.STRING },
                searchVolume: { type: Type.INTEGER },
                intent: { type: Type.STRING },
                priority: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
              required: ["id", "keyword", "searchVolume", "intent", "priority"],
            },
          },
        });

        if (Array.isArray(aiKeywords) && aiKeywords.length > 0) {
          extractedKeywords = aiKeywords
            .filter((k: any) => k && typeof k.keyword === 'string' && k.keyword.trim())
            .map((k: any, i: number) => ({ ...k, id: k.id || `kw-ai-${Date.now()}-${i}`, searchVolume: 0, source: 'gemini_ai' }));
        }
      } catch (geminiErr) {
        // Fallback already prepared
      }
    }

    // Enrich with verified real Google Ads Keyword Planner search volumes & competition
    try {
      const kwTexts = extractedKeywords.map(k => k.keyword);
      const googleMetrics = await fetchGoogleKeywordHistoricalMetrics(kwTexts);

      extractedKeywords = extractedKeywords.map(k => {
        const gm = googleMetrics[k.keyword.toLowerCase()];
        if (gm && gm.searchVolume > 0) {
          return {
            ...k,
            searchVolume: gm.searchVolume,
            competition: gm.competition,
            competitionIndex: gm.competitionIndex,
            lowTopOfPageBid: gm.lowTopOfPageBid,
            highTopOfPageBid: gm.highTopOfPageBid,
            monthlyTrend: gm.monthlyTrend,
            source: 'google_keyword_planner',
            notes: `Google Ads Verified (${gm.searchVolume.toLocaleString()}/mo, Comp: ${gm.competition})`
          };
        }
        return k;
      });
    } catch (gErr) {
      console.warn("[GoogleAdsAPI] Keyword enrichment skipped:", gErr);
    }

    // Apply the Search Volume Priority Matrix
    extractedKeywords = applySearchVolumePriorityMatrix(extractedKeywords);

    return res.json({
      success: true,
      keywords: extractedKeywords,
    });
  } catch (err: any) {
    console.error("Error in /api/extract-keywords:", err);
    return res.status(500).json({ error: err.message || "Failed to extract keywords" });
  }
});

// ----------------------------------------------------
// 4B. H2 OPTIMIZER (VOICE SEARCH, AEO, GEO & SEO KEYWORDS)
// ----------------------------------------------------
app.post("/api/optimize-h2s", async (req, res) => {
  const { components, keywords, productGuidelines, seoGuidelines, mode } = req.body;

  // Extract all H2s across components
  const extractedH2s: { componentId: string; componentName: string; text: string; voiceIntent?: string }[] = [];
  for (const comp of components || []) {
    for (const h of comp.headings || []) {
      if (h.tag?.toLowerCase() === "h2") {
        extractedH2s.push({
          componentId: comp.id,
          componentName: comp.name,
          text: h.text,
          voiceIntent: h.voiceIntent,
        });
      }
    }
  }

  if (extractedH2s.length === 0) {
    return res.json({
      items: [],
      summary: "No H2 subheadings found across components. Add H2 elements to optimize them.",
    });
  }

  try {
    const prompt = `
You are the Lead SEO, Voice Search & AEO/GEO Architect.
Your task is to review all existing H2 subheadings from a webpage and optimize each one to strictly adhere to:

MANDATORY RULES:
1. PRESERVE ORIGINAL TOPIC & MEANING: Keep the specific subject matter and domain of each original H2 intact (e.g. if the H2 is about "Pricing", keep it about pricing; if it is about "Security", keep it about security).
2. Voice Search & AEO Formatting: Make them conversational, natural queries, question-led ("How...", "Why...", "What makes..."), or high-intent subtopics that voice assistants and answer engines extract as direct subtopic answers.
3. SEO Keyword Integration: Weave in high-priority secondary and long-tail search volume keywords without keyword stuffing.
4. Compliance & Tone: Maintain brand voice, emphasize factual USPs, and strictly avoid forbidden words (${(productGuidelines?.forbiddenPhrases || []).join(", ")}).

Input Data:
--- PRODUCT GUIDELINES ---
${JSON.stringify(productGuidelines, null, 2)}

--- TARGET KEYWORDS (Ranked by Search Volume) ---
${JSON.stringify(keywords, null, 2)}

--- EXISTING H2 HEADINGS ---
${JSON.stringify(extractedH2s, null, 2)}

Optimization Mode: ${mode || "balanced"}

For EVERY input H2 heading, produce an optimized version, assign the best target keyword, search volume, conversational voice intent, and rationale.
Return STRICT JSON array of objects according to the schema.
`;

    const result = await callGeminiWithRetry({
      job: 'h2-optimizer',
      contents: prompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "High-level summary of the H2 optimization strategy" },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                componentId: { type: Type.STRING },
                componentName: { type: Type.STRING },
                originalText: { type: Type.STRING },
                optimizedText: { type: Type.STRING },
                targetKeyword: { type: Type.STRING },
                searchVolume: { type: Type.INTEGER },
                voiceIntent: { type: Type.STRING },
                rationale: { type: Type.STRING },
                selected: { type: Type.BOOLEAN },
              },
              required: ["componentId", "componentName", "originalText", "optimizedText", "targetKeyword", "searchVolume", "voiceIntent", "rationale"],
            },
          },
        },
        required: ["summary", "items"],
      },
    });

    // Ensure selected flag is set
    const items = (result.items || []).map((item: any) => ({ ...item, selected: true }));
    return res.json({ summary: result.summary, items });
  } catch (err: any) {
    console.warn("Gemini H2 Optimization API high demand / error. Executing heuristic H2 engine:", err.message);

    // Heuristic fallback
    const secondaryKws = (keywords || []).filter((k: any) => k.priority === "secondary" || k.priority === "voice_question");
    const fallbackKws = secondaryKws.length > 0 ? secondaryKws : keywords || [];

    const items = extractedH2s.map((h2, idx) => {
      const kwObj = fallbackKws[idx % fallbackKws.length] || {
        keyword: "Structured Workflow Optimization",
        searchVolume: 0,
      };
      
      let optimizedText = h2.text;
      const lower = h2.text.toLowerCase();
      if (!lower.includes("how") && !lower.includes("why") && !lower.includes("what")) {
        if (idx === 0) {
          optimizedText = `How ${kwObj.keyword} Streamlines ${h2.text}`;
        } else if (idx === 1) {
          optimizedText = `Why Teams Rely on ${h2.text} for ${kwObj.keyword}`;
        } else {
          optimizedText = `Key Capabilities: ${h2.text} with ${kwObj.keyword}`;
        }
      } else {
        optimizedText = `${h2.text} with ${kwObj.keyword}`;
      }

      return {
        componentId: h2.componentId,
        componentName: h2.componentName,
        originalText: h2.text,
        optimizedText,
        targetKeyword: kwObj.keyword,
        searchVolume: kwObj.searchVolume || 8500,
        voiceIntent: idx % 2 === 0 ? "Voice Question / Direct Answer" : "Commercial Subtopic & Feature Extraction",
        rationale: `Preserved original heading context "${h2.text}", mapped to secondary keyword "${kwObj.keyword}", and formatted for AEO voice discovery.`,
        selected: true,
      };
    });

    return res.json({
      summary: "H2 subheadings contextually optimized with secondary search volume keywords, preserving original heading topics and AEO question structure.",
      items,
    });
  }
});

// ----------------------------------------------------
// 6. NINE-AGENT AUTONOMOUS ORCHESTRATION PIPELINE (AGENT 9)
// ----------------------------------------------------
app.post(["/api/run-pipeline", "/api/orchestrate"], async (req, res) => {
  const {
    url,
    rawHtml,
    productGuidelines,
    seoGuidelines,
    contentGuidelines,
    geoGuidelines,
    customerCentricityGuidelines,
    structureMappingGuidelines,
    keywords,
    backendData,
    components,
    readerContext,
    maxRevisions,
    passThreshold,
    stream,
    mode,
    reviseScope,
  } = req.body;

  // With stream=true the response is NDJSON: {"type":"progress",...} lines, then one {"type":"result",...} line.
  const streaming = stream === true;
  const send = (obj: unknown) => {
    if (!res.writableEnded) res.write(JSON.stringify(obj) + "\n");
  };
  if (streaming) {
    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
  }

  const runStarted = Date.now();
  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const runPageUrl = url || backendData?.canonicalUrl;
  try {
    const pipelineResult = await runAgent9OrchestrationPipeline({
      runId,
      url,
      rawHtml,
      productGuidelines,
      seoGuidelines,
      contentGuidelines,
      geoGuidelines,
      customerCentricityGuidelines,
      structureMappingGuidelines,
      keywords,
      backendData,
      components,
      readerContext,
      maxRevisions: typeof maxRevisions === "number" ? maxRevisions : undefined,
      passThreshold: typeof passThreshold === "number" ? passThreshold : undefined,
      mode: mode === "revise" ? "revise" : "optimize",
      reviseScope: reviseScope && typeof reviseScope.kind === "string" ? reviseScope : undefined,
      onProgress: streaming ? (event) => send({ type: "progress", event }) : undefined,
    });

    // Categorize flag counts for dashboard consumption
    const flags = pipelineResult.deduplicatedFlags || [];
    const criticalCount = flags.filter((f: any) => f.severity === "critical").length;
    const warningCount = flags.filter((f: any) => f.severity === "warning").length;
    const infoCount = flags.filter((f: any) => f.severity === "info").length;
    const passedCount = flags.filter((f: any) => f.severity === "passed").length;

    // Top recommendations are the verification gate's blocking issues for the returned draft.
    const selected = (pipelineResult.report.rounds || []).find((r) => r.round === pipelineResult.report.selectedRound);
    const topRecommendations = (selected?.verification.blockingIssues || []).slice(0, 5);

    // A FixResult-shaped change log, so "Changes & rationale" shows what actually changed and why.
    const notes = pipelineResult.notesAddressed || [];
    const reasonFor = (title: string, field: string) => {
      const t = title.toLowerCase();
      const hit =
        notes.find((n) => n.field && field.toLowerCase().includes(n.field.toLowerCase())) ||
        notes.find((n) => t.length > 3 && n.issue.toLowerCase().includes(t));
      if (hit) return `${hit.source}: ${hit.issue}`.slice(0, 220);
      return pipelineResult.report.mode === "revise"
        ? "Revised by the maker to resolve the review notes for this run."
        : "Rewritten by the maker in its free first draft, then checked by all five gates.";
    };
    const selectedRound = (pipelineResult.report.rounds || []).find((r) => r.round === pipelineResult.report.selectedRound);
    const fixResult = pipelineResult.changeLog.length
      ? {
          isBackend: false,
          updatedBackend: pipelineResult.updatedBackend,
          updatedComponents: pipelineResult.updatedComponents,
          fixedFlagIds: [],
          explanation: selectedRound?.verification.reason || "",
          improvementsMade: notes.slice(0, 20).map((n) => n.issue),
          verificationResult: selectedRound?.verification,
          sectionChanges: pipelineResult.changeLog.map((c) => ({
            id: c.id,
            sectionTitle: c.sectionTitle,
            sectionType: c.sectionType,
            fieldChanged: c.fieldChanged,
            agentId: "agent-7",
            agentName: "Agent 7: The Maker",
            agentRole: "Writes and revises the page; every change was re-checked by gates 2-6 and Agent 8",
            oneLinerReason: reasonFor(c.sectionTitle, c.fieldChanged),
            beforeSnippet: c.before,
            afterSnippet: c.after,
          })),
          diffSummary: pipelineResult.changeLog
            .filter((c) => c.sectionType === "backend_seo")
            .map((c) => ({ field: c.fieldChanged, before: c.before, after: c.after })),
        }
      : null;

    recordRun({
      ts: new Date().toISOString(),
      runId,
      pageUrl: runPageUrl,
      mode: mode === "revise" ? "revise" : "optimize",
      scope: reviseScope?.kind,
      verdict: pipelineResult.finalVerdict,
      drafts: pipelineResult.report.rounds?.length || 0,
      durationMs: Date.now() - runStarted,
      scoreBefore: pipelineResult.beforeScores?.overallScore,
      scoreAfter: pipelineResult.afterScores?.overallScore,
    });

    const payload = {
      success: true,
      fixResult,
      finalVerdict: pipelineResult.finalVerdict,
      baselineFlags: pipelineResult.baselineFlags,
      report: pipelineResult.report,
      overallScore: pipelineResult.overallScore,
      complianceScore: pipelineResult.nineAgentScores.complianceScore,
      seoBackendScore: pipelineResult.nineAgentScores.seoBackendScore,
      keywordCoverageScore: pipelineResult.nineAgentScores.keywordCoverageScore,
      customerCentricityScore: pipelineResult.nineAgentScores.customerCentricityScore,
      eeatScore: pipelineResult.nineAgentScores.eeatScore,
      geoScore: pipelineResult.nineAgentScores.geoScore,
      verificationConfidence: pipelineResult.nineAgentScores.verificationConfidence,
      extractionCompleteness: pipelineResult.nineAgentScores.extractionCompleteness,
      nineAgentScores: pipelineResult.nineAgentScores,
      beforeScores: pipelineResult.beforeScores,
      afterScores: pipelineResult.afterScores,
      seoScore: pipelineResult.nineAgentScores.seoBackendScore,
      voiceAeoScore: pipelineResult.nineAgentScores.keywordCoverageScore,
      geoEeatScore: Math.round((pipelineResult.nineAgentScores.eeatScore + pipelineResult.nineAgentScores.geoScore) / 2),
      backendScore: pipelineResult.nineAgentScores.seoBackendScore,
      agentScores: pipelineResult.agentScores,
      totalFlags: flags.length,
      criticalCount,
      warningCount,
      infoCount,
      passedCount,
      topRecommendations,
      flags,
      updatedComponents: pipelineResult.updatedComponents,
      updatedBackend: pipelineResult.updatedBackend,
      communicationBus: pipelineResult.communicationBus,
    };
    if (streaming) {
      send({ type: "result", result: payload });
      return res.end();
    }
    return res.json(payload);
  } catch (err: any) {
    console.error("Error in /api/run-pipeline orchestration:", err);
    const message = err?.message || "Pipeline failed";
    recordRun({
      ts: new Date().toISOString(),
      runId,
      pageUrl: runPageUrl,
      mode: mode === "revise" ? "revise" : "optimize",
      scope: reviseScope?.kind,
      drafts: 0,
      durationMs: Date.now() - runStarted,
      error: String(message).slice(0, 300),
    });
    if (streaming) {
      send({ type: "error", error: message });
      return res.end();
    }
    return res.status(500).json({ error: message, status: 500 });
  }
});

// ----------------------------------------------------
// ADMIN PANEL API (password: ADMIN_PASSWORD in .env)
// ----------------------------------------------------
const adminPassword = () => (process.env.ADMIN_PASSWORD || "").trim();
const sha = (v: string) => crypto.createHash("sha256").update(v).digest();
const passwordMatches = (given: unknown) =>
  typeof given === "string" && !!adminPassword() && crypto.timingSafeEqual(sha(given), sha(adminPassword()));

// Simple brute-force brake: 10 wrong passwords per IP per 15 minutes.
const adminFailures = new Map<string, { count: number; since: number }>();
function adminGuard(req: express.Request, res: express.Response): boolean {
  if (!adminPassword()) {
    res.status(503).json({ error: "The admin panel is disabled. Set ADMIN_PASSWORD in .env and restart the server." });
    return false;
  }
  const ip = req.ip || "unknown";
  const f = adminFailures.get(ip);
  if (f && f.count >= 10 && Date.now() - f.since < 15 * 60 * 1000) {
    res.status(429).json({ error: "Too many wrong passwords. Try again in 15 minutes." });
    return false;
  }
  const given = req.get("x-admin-password") ?? req.body?.password;
  if (!passwordMatches(given)) {
    const cur = f && Date.now() - f.since < 15 * 60 * 1000 ? f : { count: 0, since: Date.now() };
    cur.count++;
    adminFailures.set(ip, cur);
    res.status(401).json({ error: "Wrong admin password." });
    return false;
  }
  adminFailures.delete(ip);
  return true;
}

let firecrawlCreditCache: { at: number; value: any; error?: string } | null = null;
async function firecrawlCredits(): Promise<{ value: any; error?: string }> {
  if (firecrawlCreditCache && Date.now() - firecrawlCreditCache.at < 5 * 60 * 1000) return firecrawlCreditCache;
  if (!FIRECRAWL_API_KEY) return { value: null, error: "FIRECRAWL_API_KEY is not set" };
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/team/credit-usage", {
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok || !j?.data) throw new Error(j?.error || `HTTP ${r.status}`);
    firecrawlCreditCache = {
      at: Date.now(),
      value: { remaining: j.data.remainingCredits, plan: j.data.planCredits, periodStart: j.data.billingPeriodStart, periodEnd: j.data.billingPeriodEnd },
    };
  } catch (err: any) {
    firecrawlCreditCache = { at: Date.now(), value: null, error: String(err?.message || err) };
  }
  return firecrawlCreditCache;
}

app.post("/api/admin/login", (req, res) => {
  if (!adminGuard(req, res)) return;
  res.json({ ok: true });
});

app.get("/api/admin/metrics", async (req, res) => {
  if (!adminGuard(req, res)) return;
  try {
    const fc = await firecrawlCredits();
    res.setHeader("Cache-Control", "no-store");
    res.json(
      computeAdminMetrics({
        firecrawlLive: fc.value,
        firecrawlError: fc.error,
        integrations: {
          gemini: configuredProviders().gemini,
          groq: configuredProviders().groq,
          firecrawl: !!FIRECRAWL_API_KEY,
          googleAds: isGoogleAdsConfigured(),
        },
      })
    );
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Could not compute metrics" });
  }
});

// ----------------------------------------------------
// API 404 & ERROR HANDLING MIDDLEWARE
// ----------------------------------------------------
// Ensure all /api/* routes return JSON and never fall through to Vite SPA HTML
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.path}`,
    status: 404,
  });
});

// Express API Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`Unhandled error on ${req.method} ${req.path}:`, err);
  if (req.path.startsWith("/api/")) {
    return res.status(500).json({
      error: err?.message || "Internal Server Error occurred while processing request",
      status: 500,
    });
  }
  next(err);
});

// ----------------------------------------------------
// 6. VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
  // A full maker → gates → verification run can take several minutes.
  server.requestTimeout = 15 * 60 * 1000;
  server.headersTimeout = 15 * 60 * 1000 + 1000;
}

startServer();
