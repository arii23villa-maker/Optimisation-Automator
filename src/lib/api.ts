/**
 * API client. Retries transient gateway errors and surfaces every other failure as an
 * Error with the server's message. It never substitutes locally generated data for a
 * failed request: a result shown in the UI is always a result the server produced.
 */

import type { PipelineProgressEvent } from '../types';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  ok: boolean;
  status: number;
}

const TRANSIENT_STATUS = new Set([502, 503, 504]);
// LLM-backed rewrites routinely take longer than a minute.
const SLOW_ENDPOINTS = new Set(['/api/fix', '/api/optimize-h2s', '/api/optimize-headings', '/api/optimize-full-body', '/api/fetch-url']);

function describeFailure(status: number, statusText: string, rawText: string, parsed: any): string {
  if (parsed && typeof parsed === 'object') {
    const msg = parsed.error || parsed.message;
    if (msg) return String(msg);
  }
  const trimmed = (rawText || '').trim();
  if (/^<!doctype|^<html/i.test(trimmed)) {
    return `The server returned an HTML page instead of JSON (HTTP ${status}). A proxy or firewall may be blocking the request.`;
  }
  return trimmed.slice(0, 300) || `HTTP ${status} ${statusText}`.trim();
}

/** The server needs a sign-in (APP_PASSWORD is set and the session is missing or expired). */
export const LOGIN_REQUIRED_EVENT = 'co-login-required';
function noticeLoginRequired(status: number, parsed: any) {
  if (status === 401 && parsed?.loginRequired) window.dispatchEvent(new Event(LOGIN_REQUIRED_EVENT));
}

/** An error worth retrying: the network dropped, or a gateway/host limit cut the request off. */
class RetryableError extends Error {
  readonly retryable = true;
}

export async function safeApiPost<T = any>(
  url: string,
  body: any,
  options: { timeoutMs?: number; retries?: number } = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? (SLOW_ENDPOINTS.has(url) ? 180_000 : 60_000);
  const maxRetries = options.retries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const rawText = await response.text();
      let parsed: any = null;
      try {
        parsed = rawText.trim() ? JSON.parse(rawText) : {};
      } catch {
        parsed = null;
      }

      if (response.ok && parsed !== null && parsed?.success !== false) {
        return parsed as T;
      }
      if (TRANSIENT_STATUS.has(response.status) && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      noticeLoginRequired(response.status, parsed);
      throw new Error(describeFailure(response.status, response.statusText, rawText, parsed));
    } catch (err: any) {
      lastError =
        err?.name === 'AbortError'
          ? new Error(`Request to ${url} timed out after ${Math.round(timeoutMs / 1000)}s.`)
          : err instanceof Error
          ? err
          : new Error(String(err));
      // Only network-level failures are retried; HTTP errors above are final.
      const isNetwork = err instanceof TypeError;
      if (isNetwork && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error(`Request to ${url} failed.`);
}

/** A run on a host with a short request limit (Vercel) takes a few requests; this caps a stuck run. */
const MAX_PIPELINE_REQUESTS = 30;

/**
 * Runs the orchestrator with live progress. The server streams NDJSON lines:
 * {"type":"progress","event":{...}} … then {"type":"result","result":{...}} or {"type":"error","error":"…"}.
 * Where requests are time-limited, a request may instead end with {"type":"checkpoint","checkpoint":{...}};
 * the run then continues in a new request from that checkpoint, so callers just see one long run.
 */
export async function runPipelineStream<T = any>(
  body: any,
  onProgress: (event: PipelineProgressEvent) => void,
  options: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<T> {
  let resume: unknown;
  let retries = 0;
  for (let request = 1; request <= MAX_PIPELINE_REQUESTS; request++) {
    let step: { result: T } | { checkpoint: unknown };
    try {
      step = await runPipelineRequest<T>({ ...body, resume }, onProgress, options);
    } catch (err: any) {
      // A dropped connection or a host time-out loses only the step in progress: continue from the last
      // checkpoint (or start again if there is none yet), at most twice in a row.
      if (err?.retryable && !options.signal?.aborted && retries < 2) {
        retries++;
        await new Promise((r) => setTimeout(r, 3000 * retries));
        continue;
      }
      throw err;
    }
    retries = 0;
    if ('result' in step) return step.result;
    resume = step.checkpoint;
  }
  throw new Error(`The pipeline did not finish within ${MAX_PIPELINE_REQUESTS} requests.`);
}

async function runPipelineRequest<T>(
  body: any,
  onProgress: (event: PipelineProgressEvent) => void,
  options: { timeoutMs?: number; signal?: AbortSignal }
): Promise<{ result: T } | { checkpoint: unknown }> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15 * 60 * 1000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch('/api/run-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
      credentials: 'same-origin',
      body: JSON.stringify({ ...body, stream: true }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const rawText = await response.text().catch(() => '');
      let parsed: any = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        /* not JSON */
      }
      noticeLoginRequired(response.status, parsed);
      const message = describeFailure(response.status, response.statusText, rawText, parsed);
      throw TRANSIENT_STATUS.has(response.status) ? new RetryableError(message) : new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: T | null = null;
    let checkpoint: unknown = null;

    const handleLine = (line: string) => {
      if (!line.trim()) return;
      let msg: any;
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      if (msg.type === 'progress' && msg.event) onProgress(msg.event);
      else if (msg.type === 'result') result = msg.result as T;
      else if (msg.type === 'checkpoint') checkpoint = msg.checkpoint;
      else if (msg.type === 'error') throw new Error(msg.error || 'Pipeline failed');
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        handleLine(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    handleLine(buffer);

    if (result) return { result };
    if (checkpoint) return { checkpoint };
    throw new Error('The pipeline ended without returning a result.');
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(options.signal?.aborted ? 'Pipeline run cancelled.' : 'Pipeline run timed out.');
    }
    // fetch() and stream reads throw TypeError when the connection drops.
    if (err instanceof TypeError) throw new RetryableError(`The connection dropped (${err.message}).`);
    throw err;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
  }
}
