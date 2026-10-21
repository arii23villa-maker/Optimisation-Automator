/**
 * LLM router: one entry point for every model call in the app.
 *
 * Each job has an ordered list of provider/model choices. A call tries them in order:
 *   - rate limit with a short wait  → wait and retry the same model once
 *   - server error                  → retry once, then move on
 *   - auth / permission / not found → move on and pause that model for 10 minutes
 *   - timeout, or a server error twice → move on; for 3 minutes that model goes to the back of
 *                                       the line (still used if nothing else is left)
 *   - unparseable output (JSON jobs)→ one fresh try on the same model, then move on
 *   - too large for Groq's per-minute token limit → skip Groq for that call
 * Every attempt is logged (usageStore) with tokens, estimated cost, latency and the reason
 * for any failure, which feeds the admin panel.
 *
 * Step deadline: when the run context carries a deadline (on Vercel, where a request has a hard
 * time limit), no call starts or runs past it. Running out of time throws DeadlineError, which the
 * agents pass through untouched so the orchestrator can save its progress and continue the run in
 * the next request, instead of treating the step as failed.
 *
 * Routing (why):
 *   maker, extraction, fact check → Gemini first: long source pages (tens of thousands of tokens) and long
 *                       structured output; Groq's free tier caps a minute at 8,000 tokens.
 *                       Several free Gemini models are chained (see DEFAULT_GEMINI_WRITERS): each has its own
 *                       daily quota, so together they give about 2,000 free requests a day on one key.
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

/**
 * Free Gemini models for writing and fact-checking, best first. Each model has its own free daily quota per
 * Google project, so chaining them multiplies capacity on one key (2026-10-20 test on the Insta EMI Card page):
 *   gemini-2.5-flash       20/day          best coverage (109% of the source body, 21/25 FAQs), 45 s; the 20
 *                                          requests (Google's 429 says so, 2026-10-21) last about two pages
 *   gemini-3.1-flash-lite  500/day         fast, but keeps only ~45–65% of the body
 *   gemma-4-31b-it         ~1,500/day but only 16,000 tokens/min; 71% of the body, 24/25 FAQs, ~85 s; often
 *                          "high demand" in testing, so it mostly serves the short review checks
 *   gemini-3.8-flash       20/day          slow under load (~150 s)
 * A model that hits its daily quota is paused, so the next one takes over. GEMINI_MODELS overrides the list.
 */
const DEFAULT_GEMINI_WRITERS = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemma-4-31b-it', 'gemini-3.8-flash'];
/** Where the review checks overflow when Groq is busy: the model with the largest free quota first. */
// Gemma has a large daily quota but was mostly overloaded in testing; 2.5 Flash is the last resort (it is the writer's).
const DEFAULT_GEMINI_CHECKERS = ['gemini-3.1-flash-lite', 'gemma-4-31b-it', 'gemini-2.5-flash'];
const list = (v: string | undefined) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);
const geminiWriters = () => {
  const custom = list(process.env.GEMINI_MODELS);
  if (custom.length) return custom;
  // Older .env files name two models.
  const legacy = list([process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL].filter(Boolean).join(','));
  return legacy.length ? legacy : DEFAULT_GEMINI_WRITERS;
};
const geminiCheckers = () => list(process.env.GEMINI_CHECK_MODELS).length ? list(process.env.GEMINI_CHECK_MODELS) : DEFAULT_GEMINI_CHECKERS;
const GROQ_MAIN = () => (process.env.GROQ_MODEL || 'openai/gpt-oss-120b').trim();
const GROQ_SMALL = () => (process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b').trim();

export function routeFor(job: LlmJob): Choice[] {
  const gemini = (models: string[]): Choice[] => models.map((model) => ({ provider: 'gemini', model }));
  if (job === 'maker' || job === 'extraction' || job === 'verify-fidelity') {
    return [...gemini(geminiWriters()), { provider: 'groq', model: GROQ_MAIN() }];
  }
  return [{ provider: 'groq', model: GROQ_MAIN() }, { provider: 'groq', model: GROQ_SMALL() }, ...gemini(geminiCheckers())];
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
  if (m === 'gemini-2.5-flash') return { input: 0.3, output: 2.5 };
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
export const runContext = new AsyncLocalStorage<{ runId: string; pageUrl?: string; /** epoch ms; see "Step deadline" above */ deadline?: number }>();

/** The current step ran out of time. Not a model failure: the run continues in the next request. */
export class DeadlineError extends Error {
  readonly isDeadline = true;
  constructor(message = 'Out of time for this step; it will continue in the next request') {
    super(message);
  }
}
export const isDeadlineError = (e: unknown): e is DeadlineError => !!(e as any)?.isDeadline;
/** For catch blocks that degrade gracefully on model errors: running out of time must not be degraded. */
export function rethrowIfDeadline(e: unknown) {
  if (isDeadlineError(e)) throw e;
}
/** A call needs at least this long to be worth starting. */
const MIN_CALL_MS = 8_000;

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
/** After a requests-per-day limit. Free-tier quotas reset daily (Gemini: midnight Pacific time). */
const DAILY_PAUSE_MS = 60 * 60 * 1000;
/** Models that just timed out or kept failing: tried last for a while, so each call doesn't wait on them. */
const cooled = new Map<string, { until: number; reason: string }>();
const COOL_MS = 3 * 60 * 1000;

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
  cooled.clear();
  groqQuota.clear();
}

export function routerHealth() {
  const now = Date.now();
  return {
    paused: [...paused.entries()]
      .filter(([, v]) => v.until > now)
      .map(([key, v]) => ({ key, reason: v.reason, resumesAt: new Date(v.until).toISOString() })),
    cooledDown: [...cooled.entries()]
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
  /** Try these models last, e.g. the model that wrote a draft, when fact-checking it ("provider:model" or model). */
  avoidModels?: string[];
}

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out after ${Math.round(ms / 1000)}s`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });

/** Request settings for a Gemini or Gemma call. */
export function geminiConfig(model: string, o: Pick<GenerateOptions, 'json' | 'responseSchema' | 'temperature' | 'maxOutputTokens'>): any {
  const config: any = {};
  if (o.json) config.responseMimeType = 'application/json';
  if (o.responseSchema) config.responseSchema = o.responseSchema;
  if (o.temperature !== undefined) config.temperature = o.temperature;
  // Gemini/Gemma answers run longer than Groq's for the same check; 2,048 tokens cut Gemma's JSON off in testing.
  // (Groq keeps the requested cap: its per-minute limit counts requested output tokens too.)
  if (o.maxOutputTokens) config.maxOutputTokens = Math.max(o.maxOutputTokens, 4096);
  // 2.5 models count their thinking in maxOutputTokens and may think for up to 24,576 tokens. In the real test
  // (2026-10-21) a long-page revision thought that much and its 32,768 budget had ~8k left for an ~8k answer, so
  // the JSON was cut off. Keep half of a large budget for the answer.
  if (/^gemini-2\.5-/.test(model) && config.maxOutputTokens >= 16_384) {
    config.thinkingConfig = { thinkingBudget: Math.floor(config.maxOutputTokens / 2) };
  }
  return config;
}

let geminiClient: GoogleGenAI | null = null;
async function callGemini(model: string, o: GenerateOptions): Promise<ProviderResult> {
  if (!geminiKey()) throw new LlmCallError('GEMINI_API_KEY is not set', 'auth', 0, 0, 'No Gemini key configured');
  geminiClient ||= new GoogleGenAI({ apiKey: geminiKey() });
  const config = geminiConfig(model, o);
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
  const ctx = runContext.getStore();
  const deadline = ctx?.deadline;
  const timeLeft = () => (deadline ? deadline - Date.now() : Infinity);

  if (testClient) {
    if (timeLeft() < MIN_CALL_MS) throw new DeadlineError();
    const r = await testClient.models.generateContent({ model: 'test', contents: o.prompt, config: {} });
    return { text: r.text || '', provider: 'test', model: 'test' };
  }

  const failures: string[] = [];
  const started = Date.now();
  // Free tiers have overload spells ("high demand" 503s, timeouts, per-minute limits) that can last minutes.
  // When every model failed for such a reason, wait and go down the list again (15 s, 30 s, 45 s), for up to
  // ~3 minutes in all. With a step deadline (Vercel), a wait that doesn't fit ends this request instead, and
  // the step is retried in the next one, so nothing is skipped.
  //
  // Groq-first jobs (the review checks) wait one round for Groq before using Gemini: Groq's per-minute limit
  // clears within a minute, while Gemini's free daily quota is what the maker needs. In the first real test the
  // checks used half of Flash-Lite's 500 daily requests by spilling over at every per-minute limit.
  const groqFirst = routeFor(o.job)[0]?.provider === 'groq' && !!groqKey();
  let useGemini = !groqFirst;
  for (let pass = 0; ; pass++) {
    const r = await tryChoices(o, ctx, timeLeft, failures, useGemini);
    if (r.result) return r.result;
    const giveUp = !r.onlyOverload || pass >= OVERLOAD_PASSES || Date.now() - started > 180_000;
    if (!useGemini && (giveUp || pass >= GROQ_ONLY_PASSES)) {
      useGemini = true; // Groq can't do it (too large, or still limited after a wait): Gemini is the backup
      continue;
    }
    if (giveUp) break;
    const wait = overloadWaitMs() * (pass + 1);
    if (timeLeft() < wait + 30_000) {
      if (deadline) throw new DeadlineError();
      break;
    }
    await sleep(wait);
  }
  throw new Error(`No model could complete "${JOB_LABELS[o.job]}": ${failures.join('; ') || 'no provider configured (set GEMINI_API_KEY or GROQ_API_KEY)'}`);
}

const OVERLOAD_PASSES = 3;
/** Passes a Groq-first job stays on Groq before Gemini may be used. */
const GROQ_ONLY_PASSES = 1;
const overloadWaitMs = () => Number(process.env.LLM_OVERLOAD_WAIT_MS) || 15_000;

/** One pass down the job's model list. `onlyOverload`: every failure was an overload, timeout or rate limit. */
async function tryChoices(
  o: GenerateOptions,
  ctx: { runId: string; pageUrl?: string } | undefined,
  timeLeft: () => number,
  failures: string[],
  useGemini: boolean
): Promise<{ result?: GenerateResult; onlyOverload: boolean }> {
  let overloaded = false;
  let otherFailure = false;
  // Cooled-down models keep their relative order but go to the back of the line.
  const now = Date.now();
  const routed = routeFor(o.job).map((c, i) => ({ ...c, fallbackIndex: i }));
  const isCool = (c: Choice) => (cooled.get(`${c.provider}:${c.model}`)?.until || 0) > now;
  const avoided = new Set(o.avoidModels || []);
  const isAvoided = (c: Choice) => avoided.has(c.model) || avoided.has(`${c.provider}:${c.model}`);
  const back = (c: Choice) => isCool(c) || isAvoided(c);
  const choices = [...routed.filter((c) => !back(c)), ...routed.filter(back)];

  for (const { provider, model, fallbackIndex } of choices) {
    const key = `${provider}:${model}`;
    if (provider === 'gemini' && (!geminiKey() || !useGemini)) continue;
    if (provider === 'groq' && !groqKey()) continue;
    const p = paused.get(key);
    if (p && p.until > Date.now()) {
      failures.push(`${key}: paused (${p.reason})`);
      continue;
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      const started = Date.now();
      const base = { ts: new Date().toISOString(), runId: ctx?.runId, pageUrl: ctx?.pageUrl, job: o.job, provider, model, fallbackIndex, attempt };
      const wanted = o.timeoutMs ?? 90_000;
      const left = timeLeft() - 2_000;
      if (left < MIN_CALL_MS) throw new DeadlineError();
      const cappedByDeadline = left < wanted;
      const call: GenerateOptions = cappedByDeadline ? { ...o, timeoutMs: left } : o;
      try {
        const r = provider === 'gemini' ? await callGemini(model, call) : await callGroq(model, call);
        const latencyMs = Date.now() - started;
        const cost = costOf(model, r.inputTokens, r.outputTokens);
        if (o.json && extractJson(r.text) === undefined) {
          recordLlmCall({ ...base, status: 'error', errorType: 'bad_output', reason: 'Output was not valid JSON', message: r.text.slice(0, 200), latencyMs, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUsd: cost });
          failures.push(`${key}: invalid JSON`);
          // Usually a one-off (e.g. Flash-Lite looping until its output cap): one fresh try, then the next model.
          if (attempt === 1) continue;
          otherFailure = true;
          break;
        }
        recordLlmCall({ ...base, status: 'ok', latencyMs, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUsd: cost });
        return { result: { text: r.text, provider, model }, onlyOverload: false };
      } catch (raw: any) {
        const e: LlmCallError = raw instanceof LlmCallError ? raw : classify(0, String(raw?.message || raw));
        const latencyMs = Date.now() - started;
        if (e.type === 'timeout' && cappedByDeadline) {
          // Cut short by the step deadline, not by the model: retry the whole step in the next request.
          recordLlmCall({ ...base, status: 'skipped', errorType: 'deadline', reason: 'Stopped at the hosting time limit; continued in the next request', message: e.message.slice(0, 300), latencyMs, inputTokens: 0, outputTokens: 0, costUsd: 0 });
          throw new DeadlineError();
        }
        const status = e.preflight ? 'skipped' : e.type === 'rate_limit' || e.type === 'too_large' ? 'rate_limited' : 'error';
        recordLlmCall({ ...base, status, errorType: e.type, reason: e.reason, message: e.message.slice(0, 300), latencyMs, inputTokens: 0, outputTokens: 0, costUsd: 0 });
        failures.push(`${key}: ${e.reason || e.type}`);
        const daily = e.type === 'rate_limit' && /per day/i.test(e.reason);
        if (daily) {
          // A daily quota won't come back by waiting a minute: stop calling this model for a while.
          paused.set(key, { until: Date.now() + DAILY_PAUSE_MS, reason: e.reason });
          otherFailure = true;
          break;
        }
        if (e.type === 'server_error' || e.type === 'rate_limit' || e.type === 'timeout') overloaded = true;
        else if (e.type !== 'too_large') otherFailure = true;

        if (e.type === 'auth' || e.type === 'permission' || e.type === 'model_not_found') {
          paused.set(key, { until: Date.now() + PAUSE_MS, reason: e.reason });
          break;
        }
        if (e.type === 'rate_limit' && attempt === 1 && e.retryAfterMs > 0 && e.retryAfterMs <= 20_000) {
          if (e.retryAfterMs + 250 > timeLeft() - MIN_CALL_MS) throw new DeadlineError();
          await sleep(e.retryAfterMs + 250);
          continue;
        }
        if (e.type === 'server_error' && attempt === 1) {
          await sleep(1000);
          continue;
        }
        if (e.type === 'timeout' || e.type === 'server_error') {
          cooled.set(key, { until: Date.now() + COOL_MS, reason: e.type === 'timeout' ? 'Timed out' : 'Repeated server errors' });
        }
        break;
      }
    }
  }
  return { onlyOverload: overloaded && !otherFailure };
}
