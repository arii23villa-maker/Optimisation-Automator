/**
 * LLM router: one entry point for every model call in the app.
 *
 * Each job has an ordered list of provider/model choices. A call tries them in order:
 *   - rate limit with a short wait  → wait and retry the same model once
 *   - server error                  → retry once, then move on
 *   - auth / permission / not found → move on and pause that model for 10 minutes
 *   - unparseable output (JSON jobs)→ move on
 *   - too large for Groq's per-minute token limit → skip Groq for that call
 * Every attempt is logged (usageStore) with tokens, estimated cost, latency and the reason
 * for any failure, which feeds the admin panel.
 *
 * Routing (why):
 *   maker, extraction, fact check → Gemini first: long source pages (tens of thousands of tokens) and long
 *                       structured output; Groq's free tier caps a minute at 8,000 tokens.
 *   review gates, keywords, H2s → Groq first: short prompts, very fast and cheap,
 *                       and it keeps Gemini's quota free for the maker.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { GoogleGenAI } from '@google/genai';
import { recordLlmCall, type LlmErrorType, type LlmProvider } from './usageStore';

export type LlmJob =
  | 'maker'
  | 'extraction'
  | 'gate-compliance'
  | 'gate-customer'
  | 'gate-eeat-geo'
  | 'verify-fidelity'
  | 'keywords'
  | 'h2-optimizer';

export const JOB_LABELS: Record<LlmJob, string> = {
  maker: 'Agent 7 · Maker (writes the page)',
  extraction: 'Agent 1 · Extraction (pasted HTML)',
  'gate-compliance': 'Agent 2 · Compliance gate',
  'gate-customer': 'Agent 5 · Customer-centricity gate',
  'gate-eeat-geo': 'Agent 6 · EEAT & GEO gate',
  'verify-fidelity': 'Agent 8 · Fact check',
  keywords: 'Keyword detection',
  'h2-optimizer': 'H2 optimizer',
};

interface Choice {
  provider: LlmProvider;
  model: string;
}

const GEMINI_MAIN = () => (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();
const GEMINI_LITE = () => (process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite').trim();
const GROQ_MAIN = () => (process.env.GROQ_MODEL || 'openai/gpt-oss-120b').trim();
const GROQ_SMALL = () => (process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b').trim();

export function routeFor(job: LlmJob): Choice[] {
  const geminiFirst: Choice[] = [
    { provider: 'gemini', model: GEMINI_MAIN() },
    { provider: 'gemini', model: GEMINI_LITE() },
    { provider: 'groq', model: GROQ_MAIN() },
  ];
  const groqFirst: Choice[] = [
    { provider: 'groq', model: GROQ_MAIN() },
    { provider: 'groq', model: GROQ_SMALL() },
    { provider: 'gemini', model: GEMINI_MAIN() },
    { provider: 'gemini', model: GEMINI_LITE() },
  ];
  return job === 'maker' || job === 'extraction' || job === 'verify-fidelity' ? geminiFirst : groqFirst;
}

// ---------------------------------------------------------------- prices
// USD per 1M tokens, list prices (Gemini: ai.google.dev/pricing; Groq: console.groq.com/docs/models).
// Free-tier usage is not billed; the admin panel shows these as "estimated at list price".
interface Price {
  input: number;
  output: number;
}
export function priceFor(model: string, at = new Date()): Price | null {
  const m = model.toLowerCase();
  if (m === 'gemini-3.8-flash') return at < new Date('2027-01-01') ? { input: 0.75, output: 3.75 } : { input: 1.5, output: 7.5 };
  if (m === 'gemini-3.1-flash-lite') return { input: 0.25, output: 1.5 };
  if (m === 'gemini-3.1-pro-preview') return { input: 2, output: 12 };
  if (m === 'openai/gpt-oss-120b') return { input: 0.15, output: 0.6 };
  if (m === 'openai/gpt-oss-20b') return { input: 0.075, output: 0.3 };
  if (m === 'qwen/qwen3.8-27b') return { input: 0.8, output: 4 };
  return null;
}
const costOf = (model: string, inTok: number, outTok: number) => {
  const p = priceFor(model);
  return p ? (inTok * p.input + outTok * p.output) / 1_000_000 : 0;
};

// ---------------------------------------------------------------- run context
export const runContext = new AsyncLocalStorage<{ runId: string; pageUrl?: string }>();

// ---------------------------------------------------------------- availability & state
const geminiKey = () =>
  (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY || '').trim();
const groqKey = () => (process.env.GROQ_API_KEY || '').trim();

let testClient: any = null;
/** Tests: route every call to a fake client with models.generateContent({ contents }) → { text }. */
export function setTestClient(client: any) {
  testClient = client;
}

export function llmAvailable(): boolean {
  return !!testClient || !!geminiKey() || !!groqKey();
}

export function configuredProviders(): Record<LlmProvider, boolean> {
  return { gemini: !!geminiKey(), groq: !!groqKey() };
}

/** Models paused after auth/permission/not-found errors, so we stop paying for doomed calls. */
const paused = new Map<string, { until: number; reason: string }>();
const PAUSE_MS = 10 * 60 * 1000;

/** Latest Groq quota headers per model (requests per day, tokens per minute). */
export interface GroqQuota {
  model: string;
  requestsPerDay?: number;
  requestsRemainingToday?: number;
  tokensPerMinute?: number;
  tokensRemainingThisMinute?: number;
  at: string;
}
const groqQuota = new Map<string, GroqQuota>();

/** Tests: clear paused models and quota snapshots. */
export function resetRouterState() {
  paused.clear();
  groqQuota.clear();
}

export function routerHealth() {
  const now = Date.now();
  return {
    paused: [...paused.entries()]
      .filter(([, v]) => v.until > now)
      .map(([key, v]) => ({ key, reason: v.reason, resumesAt: new Date(v.until).toISOString() })),
    groqQuota: [...groqQuota.values()],
  };
}

// ---------------------------------------------------------------- errors
class LlmCallError extends Error {
  constructor(
    message: string,
    public type: LlmErrorType,
    public status = 0,
    public retryAfterMs = 0,
    public reason = '',
    /** True when the request was never sent (it failed a local pre-check). */
    public preflight = false
  ) {
    super(message);
  }
}

function rateLimitReason(msg: string): string {
  const m = msg.toLowerCase();
  const limit = msg.match(/limit[:\s]+(\d[\d,]*\d|\d)/i)?.[1];
  const suffix = limit ? ` (${limit})` : '';
  if (/request too large|too large/.test(m)) return `Request larger than the tokens-per-minute limit${suffix}`;
  if (/tokens per minute|\(tpm\)|tokenspermin|input_token_count.*minute|perminute.*token/i.test(m)) return `Tokens per minute limit reached${suffix}`;
  if (/requests per minute|\(rpm\)|requestspermin|perminute.*request|per minute/.test(m)) return `Requests per minute limit reached${suffix}`;
  if (/tokens per day|\(tpd\)/.test(m)) return `Tokens per day limit reached${suffix}`;
  if (/requests per day|\(rpd\)|perday/.test(m)) return `Requests per day limit reached${suffix}`;
  if (/quota|resource_exhausted|exhausted/.test(m)) return 'Quota exhausted';
  return 'Rate limited';
}

function retryAfterFrom(msg: string, header?: string | null): number {
  if (header && !isNaN(Number(header))) return Number(header) * 1000;
  const s = msg.match(/try again in\s+(?:(\d+)m)?([\d.]+)s/i);
  if (s) return (Number(s[1] || 0) * 60 + Number(s[2])) * 1000;
  const d = msg.match(/"retryDelay"\s*:\s*"([\d.]+)s"/);
  if (d) return Number(d[1]) * 1000;
  return 0;
}

function classify(status: number, msg: string, retryHeader?: string | null): LlmCallError {
  const m = msg.toLowerCase();
  if (status === 413 || /request too large/.test(m))
    return new LlmCallError(msg, 'too_large', status, 0, rateLimitReason(msg));
  if (status === 429 || /resource_exhausted|rate limit|quota/.test(m))
    return new LlmCallError(msg, 'rate_limit', status, retryAfterFrom(msg, retryHeader), rateLimitReason(msg));
  if (status === 401 || /api key not valid|invalid api key|unauthenticated/.test(m))
    return new LlmCallError(msg, 'auth', status, 0, 'API key rejected');
  if (status === 403 || /permission|denied access/.test(m))
    return new LlmCallError(msg, 'permission', status, 0, /denied access/.test(m) ? 'Account or project denied access by the provider' : 'Permission denied');
  if (status === 404 || /not found|no longer available|does not exist/.test(m))
    return new LlmCallError(msg, 'model_not_found', status, 0, 'Model not available for this key');
  if (status >= 500) return new LlmCallError(msg, 'server_error', status, 0, `Provider server error (${status})`);
  if (/timed out|timeout|aborted/.test(m)) return new LlmCallError(msg, 'timeout', status, 0, 'Timed out');
  if (/fetch failed|enotfound|econnreset|network/.test(m)) return new LlmCallError(msg, 'network', status, 0, 'Network error');
  return new LlmCallError(msg, 'other', status, 0, msg.slice(0, 120));
}

// ---------------------------------------------------------------- providers
interface ProviderResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateOptions {
  job: LlmJob;
  prompt: string;
  /** Output must parse as JSON; unparseable output counts as a failure and falls back. */
  json?: boolean;
  /** Gemini-only structured output schema (other providers get the shape from the prompt). */
  responseSchema?: any;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out after ${Math.round(ms / 1000)}s`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });

let geminiClient: GoogleGenAI | null = null;
async function callGemini(model: string, o: GenerateOptions): Promise<ProviderResult> {
  if (!geminiKey()) throw new LlmCallError('GEMINI_API_KEY is not set', 'auth', 0, 0, 'No Gemini key configured');
  geminiClient ||= new GoogleGenAI({ apiKey: geminiKey() });
  const config: any = {};
  if (o.json) config.responseMimeType = 'application/json';
  if (o.responseSchema) config.responseSchema = o.responseSchema;
  if (o.temperature !== undefined) config.temperature = o.temperature;
  if (o.maxOutputTokens) config.maxOutputTokens = o.maxOutputTokens;
  try {
    const res: any = await withTimeout(geminiClient.models.generateContent({ model, contents: o.prompt, config }), o.timeoutMs ?? 90_000);
    const u = res.usageMetadata || {};
    return {
      text: res.text || '',
      inputTokens: u.promptTokenCount || 0,
      outputTokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0),
    };
  } catch (err: any) {
    if (err instanceof LlmCallError) throw err;
    const msg = String(err?.message || err);
    const status = Number(err?.status || msg.match(/"code"\s*:\s*(\d{3})/)?.[1] || 0);
    throw classify(status, msg);
  }
}

async function callGroq(model: string, o: GenerateOptions): Promise<ProviderResult> {
  if (!groqKey()) throw new LlmCallError('GROQ_API_KEY is not set', 'auth', 0, 0, 'No Groq key configured');

  // Groq's free tier caps tokens per minute; don't send a request that cannot fit.
  const maxOut = o.maxOutputTokens ?? 4096;
  const est = Math.ceil(o.prompt.length / 3.6) + maxOut;
  const limit = groqQuota.get(model)?.tokensPerMinute || Number(process.env.GROQ_TPM_LIMIT || 8000);
  if (est > limit) {
    // Reason stays constant so the admin panel groups these; the size goes in the message.
    throw new LlmCallError(`Needs ~${est.toLocaleString()} tokens; limit is ${limit.toLocaleString()} per minute`, 'too_large', 0, 0, `Too large for Groq's per-minute token limit (${limit.toLocaleString()})`, true);
  }

  const body: any = {
    model,
    messages: [{ role: 'user', content: o.prompt }],
    max_completion_tokens: maxOut,
  };
  if (o.temperature !== undefined) body.temperature = o.temperature;
  if (/gpt-oss/.test(model)) body.reasoning_effort = o.job === 'maker' ? 'medium' : 'low';

  let res: Response;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(o.timeoutMs ?? 90_000),
    });
  } catch (err: any) {
    throw classify(0, String(err?.message || err));
  }

  const num = (h: string) => {
    const v = res.headers.get(h);
    return v === null || v === '' || isNaN(Number(v)) ? undefined : Number(v);
  };
  if (res.headers.get('x-ratelimit-limit-requests')) {
    groqQuota.set(model, {
      model,
      requestsPerDay: num('x-ratelimit-limit-requests'),
      requestsRemainingToday: num('x-ratelimit-remaining-requests'),
      tokensPerMinute: num('x-ratelimit-limit-tokens'),
      tokensRemainingThisMinute: num('x-ratelimit-remaining-tokens'),
      at: new Date().toISOString(),
    });
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  if (!res.ok) throw classify(res.status, data?.error?.message || text.slice(0, 300), res.headers.get('retry-after'));
  return {
    text: data?.choices?.[0]?.message?.content || '',
    inputTokens: data?.usage?.prompt_tokens || 0,
    outputTokens: data?.usage?.completion_tokens || 0,
  };
}

/** Parses JSON from model output (tolerates code fences and leading prose). */
export function extractJson(text: string): any | undefined {
  if (!text) return undefined;
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.search(/[[{]/);
    const end = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
  }
  return undefined;
}

// ---------------------------------------------------------------- entry point
export interface GenerateResult {
  text: string;
  provider: LlmProvider | 'test';
  model: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generate(o: GenerateOptions): Promise<GenerateResult> {
  if (testClient) {
    const r = await testClient.models.generateContent({ model: 'test', contents: o.prompt, config: {} });
    return { text: r.text || '', provider: 'test', model: 'test' };
  }

  const ctx = runContext.getStore();
  const choices = routeFor(o.job);
  const failures: string[] = [];

  for (let i = 0; i < choices.length; i++) {
    const { provider, model } = choices[i];
    const key = `${provider}:${model}`;
    if (provider === 'gemini' && !geminiKey()) continue;
    if (provider === 'groq' && !groqKey()) continue;
    const p = paused.get(key);
    if (p && p.until > Date.now()) {
      failures.push(`${key}: paused (${p.reason})`);
      continue;
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      const started = Date.now();
      const base = { ts: new Date().toISOString(), runId: ctx?.runId, pageUrl: ctx?.pageUrl, job: o.job, provider, model, fallbackIndex: i, attempt };
      try {
        const r = provider === 'gemini' ? await callGemini(model, o) : await callGroq(model, o);
        const latencyMs = Date.now() - started;
        const cost = costOf(model, r.inputTokens, r.outputTokens);
        if (o.json && extractJson(r.text) === undefined) {
          recordLlmCall({ ...base, status: 'error', errorType: 'bad_output', reason: 'Output was not valid JSON', message: r.text.slice(0, 200), latencyMs, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUsd: cost });
          failures.push(`${key}: invalid JSON`);
          break; // next choice
        }
        recordLlmCall({ ...base, status: 'ok', latencyMs, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUsd: cost });
        return { text: r.text, provider, model };
      } catch (raw: any) {
        const e: LlmCallError = raw instanceof LlmCallError ? raw : classify(0, String(raw?.message || raw));
        const latencyMs = Date.now() - started;
        const status = e.preflight ? 'skipped' : e.type === 'rate_limit' || e.type === 'too_large' ? 'rate_limited' : 'error';
        recordLlmCall({ ...base, status, errorType: e.type, reason: e.reason, message: e.message.slice(0, 300), latencyMs, inputTokens: 0, outputTokens: 0, costUsd: 0 });
        failures.push(`${key}: ${e.reason || e.type}`);

        if (e.type === 'auth' || e.type === 'permission' || e.type === 'model_not_found') {
          paused.set(key, { until: Date.now() + PAUSE_MS, reason: e.reason });
          break;
        }
        if (e.type === 'rate_limit' && attempt === 1 && e.retryAfterMs > 0 && e.retryAfterMs <= 20_000) {
          await sleep(e.retryAfterMs + 250);
          continue;
        }
        if (e.type === 'server_error' && attempt === 1) {
          await sleep(1000);
          continue;
        }
        break;
      }
    }
  }
  throw new Error(`No model could complete "${JOB_LABELS[o.job]}": ${failures.join('; ') || 'no provider configured (set GEMINI_API_KEY or GROQ_API_KEY)'}`);
}
