/**
 * Append-only usage log for the admin panel (server-side only).
 *
 * Three JSONL files under data/usage/ (or USAGE_LOG_DIR):
 *   llm-calls.jsonl   one line per model call attempt (success, failure, rate limit or skip)
 *   firecrawl.jsonl   one line per Firecrawl request
 *   runs.jsonl        one line per pipeline run
 *
 * Files survive restarts but not a fresh deploy on an ephemeral host; point USAGE_LOG_DIR
 * at persistent storage in production.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type LlmProvider = 'gemini' | 'groq';
export type LlmCallStatus = 'ok' | 'rate_limited' | 'error' | 'skipped';
export type LlmErrorType =
  | 'rate_limit'
  | 'auth'
  | 'permission'
  | 'model_not_found'
  | 'timeout'
  | 'server_error'
  | 'network'
  | 'bad_output'
  | 'too_large'
  /** Stopped at the step deadline (Vercel time limit); the step is retried in the next request. */
  | 'deadline'
  | 'other';

export interface LlmCallEvent {
  ts: string;
  runId?: string;
  pageUrl?: string;
  job: string;
  provider: LlmProvider;
  model: string;
  status: LlmCallStatus;
  errorType?: LlmErrorType;
  /** Plain-language reason, e.g. "Tokens per minute limit (8,000) reached". */
  reason?: string;
  message?: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  /** 0 = primary choice for the job, 1+ = fallback position. */
  fallbackIndex: number;
  attempt: number;
}

export interface FirecrawlEvent {
  ts: string;
  kind: 'scrape' | 'map';
  url: string;
  ok: boolean;
  status?: number;
  credits: number;
  latencyMs: number;
  error?: string;
}

export interface RunEvent {
  ts: string;
  runId: string;
  pageUrl?: string;
  mode: 'optimize' | 'revise';
  scope?: string;
  verdict?: string;
  drafts: number;
  durationMs: number;
  scoreBefore?: number;
  scoreAfter?: number;
  error?: string;
}

// Vercel functions can only write to /tmp, which is wiped whenever an instance is recycled,
// so on Vercel the admin panel only shows recent activity.
const dir = () =>
  process.env.USAGE_LOG_DIR ||
  (process.env.VERCEL === '1' ? '/tmp/content-optimizer-usage' : path.join(process.cwd(), 'data', 'usage'));
let enabled = process.env.USAGE_LOGGING !== 'off';

export function setUsageLogging(on: boolean) {
  enabled = on;
}

function append(file: string, obj: unknown) {
  if (!enabled) return;
  try {
    const d = dir();
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
    appendFileSync(path.join(d, file), JSON.stringify(obj) + '\n');
  } catch (err) {
    console.warn('[usage] could not write log:', (err as Error).message);
  }
}

export const recordLlmCall = (e: LlmCallEvent) => append('llm-calls.jsonl', e);
export const recordFirecrawl = (e: FirecrawlEvent) => append('firecrawl.jsonl', e);
export const recordRun = (e: RunEvent) => append('runs.jsonl', e);

export function readEvents<T>(file: 'llm-calls.jsonl' | 'firecrawl.jsonl' | 'runs.jsonl'): T[] {
  const p = path.join(dir(), file);
  if (!existsSync(p)) return [];
  const out: T[] = [];
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip a partial line */
    }
  }
  return out;
}
