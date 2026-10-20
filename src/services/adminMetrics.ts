/**
 * Aggregates the usage logs into the numbers shown on the admin panel.
 */
import { readEvents, type FirecrawlEvent, type LlmCallEvent, type RunEvent } from './usageStore';
import { JOB_LABELS, priceFor, routeFor, routerHealth, configuredProviders, type LlmJob } from './llm';

const DAY = 24 * 60 * 60 * 1000;

/** Groups older "too large" reasons (which included the request size) with the current wording. */
const normReason = (r?: string) =>
  (r || '').replace(/Too large for Groq's tokens-per-minute limit (needs ~[d,]+ of ([d,]+))/, "Too large for Groq's per-minute token limit ($1)");

export interface Totals {
  calls: number;
  ok: number;
  failed: number;
  rateLimited: number;
  skipped: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

const emptyTotals = (): Totals => ({ calls: 0, ok: 0, failed: 0, rateLimited: 0, skipped: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 });

function addTo(t: Totals, e: LlmCallEvent) {
  // A "call" is a request that actually reached the provider; skips never left the server.
  if (e.status !== 'skipped') t.calls++;
  if (e.status === 'ok') t.ok++;
  else if (e.status === 'rate_limited') t.rateLimited++;
  else if (e.status === 'skipped') t.skipped++;
  else t.failed++;
  t.inputTokens += e.inputTokens || 0;
  t.outputTokens += e.outputTokens || 0;
  t.costUsd += e.costUsd || 0;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function computeAdminMetrics(opts: {
  now?: Date;
  firecrawlLive?: { remaining: number; plan: number; periodStart?: string; periodEnd?: string } | null;
  firecrawlError?: string;
  integrations: Record<string, boolean>;
}) {
  const now = opts.now || new Date();
  const since7 = now.getTime() - 7 * DAY;
  const calls = readEvents<LlmCallEvent>('llm-calls.jsonl');
  const fc = readEvents<FirecrawlEvent>('firecrawl.jsonl');
  const runs = readEvents<RunEvent>('runs.jsonl');
  const recent = (ts: string) => new Date(ts).getTime() >= since7;

  // ---- totals and per provider
  const totals = { last7d: emptyTotals(), allTime: emptyTotals() };
  const providers: Record<string, { last7d: Totals; allTime: Totals; latencies: number[]; lastOkAt?: string; lastFailure?: { ts: string; reason?: string } }> = {
    gemini: { last7d: emptyTotals(), allTime: emptyTotals(), latencies: [] },
    groq: { last7d: emptyTotals(), allTime: emptyTotals(), latencies: [] },
  };
  for (const e of calls) {
    const p = providers[e.provider];
    addTo(totals.allTime, e);
    if (p) addTo(p.allTime, e);
    if (recent(e.ts)) {
      addTo(totals.last7d, e);
      if (p) addTo(p.last7d, e);
    }
    if (!p) continue;
    if (e.status === 'ok') {
      p.latencies.push(e.latencyMs);
      if (!p.lastOkAt || e.ts > p.lastOkAt) p.lastOkAt = e.ts;
    } else if (e.status !== 'skipped' && (!p.lastFailure || e.ts > p.lastFailure.ts)) {
      p.lastFailure = { ts: e.ts, reason: e.reason || e.errorType };
    }
  }
  const median = (xs: number[]) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const providerSummary = Object.fromEntries(
    Object.entries(providers).map(([k, v]) => {
      const reached = v.last7d.calls;
      return [
        k,
        {
          configured: (configuredProviders() as any)[k],
          last7d: v.last7d,
          allTime: v.allTime,
          medianLatencyMs: median(v.latencies.slice(-500)),
          // Rate-limit waits are retried and counted separately, so they don't count as failures here.
          successRate7d: reached - v.last7d.rateLimited > 0 ? Math.round((v.last7d.ok / (reached - v.last7d.rateLimited)) * 100) : null,
          rateLimitShare7d: reached ? Math.round((v.last7d.rateLimited / reached) * 100) : 0,
          lastOkAt: v.lastOkAt || null,
          lastFailure: v.lastFailure || null,
        },
      ];
    })
  );

  // ---- daily series (last 14 days)
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(isoDay(new Date(now.getTime() - i * DAY)));
  const daily = days.map((date) => ({
    date,
    gemini: { calls: 0, tokens: 0, costUsd: 0, failed: 0 },
    groq: { calls: 0, tokens: 0, costUsd: 0, failed: 0 },
  }));
  const dayIndex = new Map(days.map((d, i) => [d, i]));
  for (const e of calls) {
    const i = dayIndex.get(e.ts.slice(0, 10));
    if (i === undefined || e.status === 'skipped') continue;
    const bucket = (daily[i] as any)[e.provider];
    if (!bucket) continue;
    bucket.calls++;
    bucket.tokens += (e.inputTokens || 0) + (e.outputTokens || 0);
    bucket.costUsd += e.costUsd || 0;
    if (e.status !== 'ok') bucket.failed++;
  }

  // ---- rate limits and reasons
  const rlReasons = new Map<string, { reason: string; provider: string; model: string; last7d: number; allTime: number; lastAt: string }>();
  for (const e of calls) {
    if (e.status !== 'rate_limited' && e.status !== 'skipped') continue;
    // Older entries carried the request size in the reason; group them with the current wording.
    const reason = (e.reason || 'Rate limited').replace(
      /Too large for Groq's tokens-per-minute limit \(needs ~[\d,]+ of ([\d,]+)\)/,
      "Too large for Groq's per-minute token limit ($1)"
    );
    const key = `${e.provider}|${e.model}|${reason}`;
    const r = rlReasons.get(key) || { reason, provider: e.provider, model: e.model, last7d: 0, allTime: 0, lastAt: e.ts };
    r.allTime++;
    if (recent(e.ts)) r.last7d++;
    if (e.ts > r.lastAt) r.lastAt = e.ts;
    rlReasons.set(key, r);
  }

  // ---- which provider does which job
  const jobs = Object.keys(JOB_LABELS) as LlmJob[];
  const jobMatrix = jobs.map((job) => {
    const route = routeFor(job);
    const row: any = { job, label: JOB_LABELS[job], route: route.map((c) => `${c.provider}:${c.model}`), primary: route[0].provider };
    for (const prov of ['gemini', 'groq']) {
      const evs = calls.filter((e) => e.job === job && e.provider === prov && e.status !== 'skipped');
      row[prov] = {
        calls: evs.length,
        ok: evs.filter((e) => e.status === 'ok').length,
        calls7d: evs.filter((e) => recent(e.ts)).length,
      };
    }
    return row;
  });

  // ---- failures
  const failures = new Map<string, { provider: string; model: string; errorType: string; reason: string; last7d: number; allTime: number; lastAt: string }>();
  for (const e of calls) {
    if (e.status === 'ok') continue;
    const reasonText = normReason(e.reason);
    const key = `${e.provider}|${e.model}|${e.errorType}|${reasonText}`;
    const f = failures.get(key) || { provider: e.provider, model: e.model, errorType: e.errorType || 'other', reason: reasonText, last7d: 0, allTime: 0, lastAt: e.ts };
    f.allTime++;
    if (recent(e.ts)) f.last7d++;
    if (e.ts > f.lastAt) f.lastAt = e.ts;
    failures.set(key, f);
  }
  const recentFailures = calls
    .filter((e) => e.status !== 'ok')
    .slice(-60)
    .reverse()
    .map((e) => ({ ts: e.ts, provider: e.provider, model: e.model, job: JOB_LABELS[e.job as LlmJob] || e.job, status: e.status, errorType: e.errorType, reason: e.reason, message: e.message, pageUrl: e.pageUrl, fellBackTo: null as string | null }));

  // ---- fallbacks: successful answers that did not come from the job's first choice
  const fallbacks = {
    last7d: calls.filter((e) => e.status === 'ok' && e.fallbackIndex > 0 && recent(e.ts)).length,
    allTime: calls.filter((e) => e.status === 'ok' && e.fallbackIndex > 0).length,
  };

  // ---- Firecrawl
  const fc7 = fc.filter((e) => recent(e.ts));
  const firecrawl = {
    live: opts.firecrawlLive
      ? {
          ...opts.firecrawlLive,
          used: Math.max(0, opts.firecrawlLive.plan - opts.firecrawlLive.remaining),
          percentUsed: opts.firecrawlLive.plan ? Math.round(((opts.firecrawlLive.plan - opts.firecrawlLive.remaining) / opts.firecrawlLive.plan) * 100) : null,
        }
      : null,
    liveError: opts.firecrawlError || null,
    requests7d: fc7.length,
    requestsAllTime: fc.length,
    failed7d: fc7.filter((e) => !e.ok).length,
    creditsLogged7d: fc7.reduce((n, e) => n + (e.credits || 0), 0),
    recentFailures: fc.filter((e) => !e.ok).slice(-10).reverse(),
  };

  // ---- pipeline runs
  const costByRun = new Map<string, number>();
  for (const e of calls) if (e.runId) costByRun.set(e.runId, (costByRun.get(e.runId) || 0) + (e.costUsd || 0));
  const verdictCounts = (list: RunEvent[]) => {
    const out: Record<string, number> = { APPROVED: 0, NOT_QUALIFIED: 0, MAKER_UNAVAILABLE: 0, FAILED: 0 };
    for (const r of list) out[r.error ? 'FAILED' : r.verdict || 'FAILED'] = (out[r.error ? 'FAILED' : r.verdict || 'FAILED'] || 0) + 1;
    return out;
  };
  const runs7 = runs.filter((r) => recent(r.ts));
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const pipeline = {
    last7d: runs7.length,
    allTime: runs.length,
    verdicts7d: verdictCounts(runs7),
    verdictsAllTime: verdictCounts(runs),
    avgDurationMs: avg(runs.map((r) => r.durationMs)),
    avgDrafts: runs.length ? Math.round((runs.reduce((a, r) => a + (r.drafts || 0), 0) / runs.length) * 10) / 10 : null,
    avgCostUsd: runs.length ? runs.reduce((a, r) => a + (costByRun.get(r.runId) || 0), 0) / runs.length : null,
    recent: runs
      .slice(-25)
      .reverse()
      .map((r) => ({ ...r, costUsd: costByRun.get(r.runId) || 0 })),
  };

  const health = routerHealth();
  const priceModels = Array.from(new Set(jobs.flatMap((j) => routeFor(j).map((c) => c.model))));

  return {
    generatedAt: now.toISOString(),
    integrations: opts.integrations,
    usdInrRate: Number(process.env.USD_INR_RATE) || null,
    totals,
    providers: providerSummary,
    daily,
    rateLimits: {
      last7d: calls.filter((e) => (e.status === 'rate_limited') && recent(e.ts)).length,
      allTime: calls.filter((e) => e.status === 'rate_limited').length,
      avoided7d: calls.filter((e) => e.status === 'skipped' && recent(e.ts)).length,
      reasons: [...rlReasons.values()].sort((a, b) => b.allTime - a.allTime),
    },
    jobMatrix,
    failuresByProvider: [...failures.values()].sort((a, b) => b.allTime - a.allTime),
    recentFailures,
    fallbacks,
    firecrawl,
    pipeline,
    health,
    prices: priceModels.map((m) => ({ model: m, ...(priceFor(m, now) || { input: null, output: null }) })),
  };
}
