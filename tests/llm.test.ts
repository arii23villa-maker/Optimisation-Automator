/**
 * Router tests with a mocked Groq HTTP API (no network, no real keys).
 */
import assert from 'node:assert/strict';
import { test, beforeEach, after } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const logDir = mkdtempSync(path.join(tmpdir(), 'co-usage-'));
process.env.USAGE_LOG_DIR = logDir;
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.GEMINI_API_KEY = '';
process.env.API_KEY = '';
process.env.GOOGLE_API_KEY = '';
process.env.GROQ_TPM_LIMIT = '8000';
process.env.LLM_OVERLOAD_WAIT_MS = '20';

const { generate, extractJson, priceFor, resetRouterState, runContext, isDeadlineError, routeFor, geminiConfig } = await import('../src/services/llm');
const { readEvents } = await import('../src/services/usageStore');
const { computeAdminMetrics } = await import('../src/services/adminMetrics');

type Reply = { status: number; body: any; headers?: Record<string, string> };
let replies: Record<string, Reply[]> = {};
let seenModels: string[] = [];
const realFetch = globalThis.fetch;

beforeEach(() => {
  resetRouterState();
  replies = {};
  seenModels = [];
  rmSync(path.join(logDir, 'llm-calls.jsonl'), { force: true });
  globalThis.fetch = (async (_url: any, init: any) => {
    const model = JSON.parse(init.body).model;
    seenModels.push(model);
    const r = replies[model]?.shift() || { status: 500, body: { error: { message: 'no scripted reply' } } };
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'content-type': 'application/json', ...(r.headers || {}) } });
  }) as any;
});
after(() => {
  globalThis.fetch = realFetch;
  rmSync(logDir, { recursive: true, force: true });
});

const ok = (content: string, prompt = 100, completion = 50): Reply => ({
  status: 200,
  body: { choices: [{ message: { content } }], usage: { prompt_tokens: prompt, completion_tokens: completion } },
  headers: { 'x-ratelimit-limit-requests': '1000', 'x-ratelimit-remaining-requests': '990', 'x-ratelimit-limit-tokens': '8000', 'x-ratelimit-remaining-tokens': '7000' },
});

test('success is logged with tokens and cost', async () => {
  replies['openai/gpt-oss-120b'] = [ok('[]', 1_000_000, 1_000_000)];
  const r = await generate({ job: 'gate-compliance', prompt: 'audit as JSON', json: true });
  assert.equal(r.provider, 'groq');
  const [e] = readEvents<any>('llm-calls.jsonl');
  assert.equal(e.status, 'ok');
  assert.equal(e.inputTokens, 1_000_000);
  assert.equal(Math.round(e.costUsd * 100) / 100, 0.75); // $0.15 in + $0.60 out per 1M
});

test('rate limit with a short wait retries the same model', async () => {
  replies['openai/gpt-oss-120b'] = [
    { status: 429, body: { error: { message: 'Rate limit reached for model `openai/gpt-oss-120b` on tokens per minute (TPM): Limit 8000, Used 7900, Requested 600. Please try again in 0.05s.' } } },
    ok('{"a":1}'),
  ];
  const r = await generate({ job: 'keywords', prompt: 'x JSON', json: true });
  assert.equal(r.model, 'openai/gpt-oss-120b');
  const evs = readEvents<any>('llm-calls.jsonl');
  assert.deepEqual(evs.map((e) => e.status), ['rate_limited', 'ok']);
  assert.match(evs[0].reason, /Tokens per minute limit reached \(8000\)/);
});

test('falls back to the next model and records why', async () => {
  replies['openai/gpt-oss-120b'] = [{ status: 503, body: { error: { message: 'over capacity' } } }, { status: 503, body: { error: { message: 'over capacity' } } }];
  replies['openai/gpt-oss-20b'] = [ok('{"ok":true}')];
  const r = await generate({ job: 'gate-eeat-geo', prompt: 'check JSON', json: true });
  assert.equal(r.model, 'openai/gpt-oss-20b');
  const evs = readEvents<any>('llm-calls.jsonl');
  assert.equal(evs.at(-1).fallbackIndex, 1);
  assert.equal(evs[0].errorType, 'server_error');
});

test('invalid JSON counts as a failure and falls back', async () => {
  replies['openai/gpt-oss-120b'] = [ok('Sure! Here is my answer without JSON')];
  replies['openai/gpt-oss-20b'] = [ok('```json\n[{"issue":"x"}]\n```')];
  const r = await generate({ job: 'gate-customer', prompt: 'JSON please', json: true });
  assert.equal(r.model, 'openai/gpt-oss-20b');
  assert.equal(readEvents<any>('llm-calls.jsonl')[0].errorType, 'bad_output');
});

test('requests larger than Groq per-minute limit are skipped without being sent', async () => {
  await assert.rejects(generate({ job: 'maker', prompt: 'x'.repeat(40_000), maxOutputTokens: 16384 }), /No model could complete/);
  assert.equal(seenModels.length, 0, 'nothing was sent');
  const [e] = readEvents<any>('llm-calls.jsonl');
  assert.equal(e.status, 'skipped');
  assert.match(e.reason, /Too large for Groq/);
});

test('permission errors pause the model', async () => {
  replies['openai/gpt-oss-20b'] = [{ status: 403, body: { error: { message: 'Your project has been denied access' } } }];
  replies['openai/gpt-oss-120b'] = [{ status: 500, body: {} }, { status: 500, body: {} }, { status: 500, body: {} }, { status: 500, body: {} }];
  await assert.rejects(generate({ job: 'keywords', prompt: 'JSON' }));
  const before = seenModels.filter((m) => m === 'openai/gpt-oss-20b').length;
  await assert.rejects(generate({ job: 'keywords', prompt: 'JSON' }));
  assert.equal(seenModels.filter((m) => m === 'openai/gpt-oss-20b').length, before, 'paused model not called again');
});

test('a model that keeps failing goes to the back of the line for the next calls', async () => {
  replies['openai/gpt-oss-120b'] = [{ status: 503, body: {} }, { status: 503, body: {} }];
  replies['openai/gpt-oss-20b'] = [ok('{"a":1}'), ok('{"a":2}')];
  await generate({ job: 'gate-compliance', prompt: 'JSON', json: true });
  seenModels = [];
  const r = await generate({ job: 'gate-compliance', prompt: 'JSON', json: true });
  assert.equal(r.model, 'openai/gpt-oss-20b');
  assert.deepEqual(seenModels, ['openai/gpt-oss-20b'], 'the failing model was not tried first');
});

test('when every model is briefly overloaded, the router waits and tries the list once more', async () => {
  const busy = { status: 503, body: { error: { message: 'high demand' } } };
  replies['openai/gpt-oss-120b'] = [busy, busy, ok('{"a":1}')];
  replies['openai/gpt-oss-20b'] = [busy, busy];
  const r = await generate({ job: 'keywords', prompt: 'JSON', json: true });
  assert.equal(r.model, 'openai/gpt-oss-120b');
  assert.equal(seenModels.length, 5);
});

test('a daily quota pauses the model instead of waiting and retrying', async () => {
  const daily = { status: 429, body: { error: { message: 'Rate limit reached on requests per day (RPD): Limit 1000. Please try again in 7h.' } } };
  replies['openai/gpt-oss-120b'] = [daily];
  replies['openai/gpt-oss-20b'] = [ok('{"a":1}'), ok('{"a":2}')];
  await generate({ job: 'keywords', prompt: 'JSON', json: true });
  seenModels = [];
  const r = await generate({ job: 'keywords', prompt: 'JSON', json: true });
  assert.equal(r.model, 'openai/gpt-oss-20b');
  assert.deepEqual(seenModels, ['openai/gpt-oss-20b'], 'the exhausted model is not called again');
});

test('review checks wait one round for Groq before spending Gemini quota', async () => {
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  try {
    const tpm = { status: 429, body: { error: { message: 'Rate limit reached on tokens per minute (TPM): Limit 8000. Please try again in 30s.' } } };
    replies['openai/gpt-oss-120b'] = [tpm, ok('[]')];
    replies['openai/gpt-oss-20b'] = [tpm];
    const r = await generate({ job: 'gate-compliance', prompt: 'JSON', json: true });
    assert.equal(r.model, 'openai/gpt-oss-120b', 'Groq answered after the wait; Gemini was never called');
  } finally {
    process.env.GEMINI_API_KEY = '';
  }
});

test('an avoided model (the draft writer, for the fact check) is tried last', async () => {
  replies['openai/gpt-oss-20b'] = [ok('{"a":1}')];
  const r = await generate({ job: 'keywords', prompt: 'JSON', json: true, avoidModels: ['groq:openai/gpt-oss-120b'] });
  assert.equal(r.model, 'openai/gpt-oss-20b');
  assert.deepEqual(seenModels, ['openai/gpt-oss-20b'], 'the avoided model was not asked first');
});

test('a call is not started when the step deadline is too close', async () => {
  replies['openai/gpt-oss-120b'] = [ok('{"a":1}')];
  await assert.rejects(
    runContext.run({ runId: 't', deadline: Date.now() + 3_000 }, () => generate({ job: 'keywords', prompt: 'JSON', json: true })),
    (e: any) => isDeadlineError(e)
  );
  assert.equal(seenModels.length, 0, 'nothing was sent');
});

test('writing jobs chain the free Gemini models; checks overflow to Gemini only after Groq', () => {
  assert.deepEqual(routeFor('maker').map((c) => c.model), ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemma-4-31b-it', 'gemini-3.8-flash', 'openai/gpt-oss-120b']);
  assert.deepEqual(routeFor('gate-compliance').map((c) => c.model), ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'gemini-3.1-flash-lite', 'gemma-4-31b-it', 'gemini-2.5-flash']);
  process.env.GEMINI_MODELS = 'gemini-3.8-flash';
  try {
    assert.deepEqual(routeFor('maker').map((c) => c.model), ['gemini-3.8-flash', 'openai/gpt-oss-120b']);
  } finally {
    delete process.env.GEMINI_MODELS;
  }
});

test('2.5 models keep half of a large output budget for the answer (thinking counts against it)', () => {
  assert.deepEqual(geminiConfig('gemini-2.5-flash', { json: true, maxOutputTokens: 32768 }).thinkingConfig, { thinkingBudget: 16384 });
  assert.equal(geminiConfig('gemini-2.5-flash', { maxOutputTokens: 2048 }).thinkingConfig, undefined, 'short checks keep the default');
  assert.equal(geminiConfig('gemini-3.1-flash-lite', { maxOutputTokens: 32768 }).thinkingConfig, undefined, 'other models unchanged');
  assert.equal(geminiConfig('gemma-4-31b-it', { maxOutputTokens: 32768 }).thinkingConfig, undefined);
});

test('metrics aggregate calls, rate limits and failures', async () => {
  replies['openai/gpt-oss-120b'] = [
    { status: 429, body: { error: { message: 'on requests per day (RPD): Limit 1000. Please try again in 30m0s.' } } },
  ];
  replies['openai/gpt-oss-20b'] = [ok('{"x":1}')];
  await generate({ job: 'h2-optimizer', prompt: 'JSON', json: true });
  const m = computeAdminMetrics({ integrations: { gemini: false, groq: true } });
  assert.equal(m.totals.allTime.calls, 2);
  assert.equal(m.rateLimits.allTime, 1);
  assert.match(m.rateLimits.reasons[0].reason, /Requests per day/);
  assert.equal(m.fallbacks.allTime, 1);
  assert.equal(m.providers.groq.allTime.ok, 1);
  assert.ok(m.jobMatrix.find((j: any) => j.job === 'maker').primary === 'gemini');
});

test('helpers: JSON extraction and prices', () => {
  assert.deepEqual(extractJson('Here:\n```json\n{"a":[1]}\n```'), { a: [1] });
  assert.deepEqual(extractJson('noise [1,2] tail'), [1, 2]);
  assert.equal(extractJson('nothing'), undefined);
  assert.deepEqual(priceFor('gemini-3.8-flash', new Date('2026-10-20')), { input: 0.75, output: 3.75 });
  assert.deepEqual(priceFor('gemini-3.8-flash', new Date('2027-02-01')), { input: 1.5, output: 7.5 });
});
