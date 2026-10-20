import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  Flame,
  Gauge,
  KeyRound,
  ListChecks,
  LogOut,
  Moon,
  PauseCircle,
  RefreshCw,
  Repeat,
  Route,
  ShieldAlert,
  Sun,
  Timer,
  XCircle,
  Zap,
} from 'lucide-react';
import { HBars, Meter, StackedColumns } from './charts';

// ------------------------------------------------------------------ types (subset of /api/admin/metrics)
type Totals = { calls: number; ok: number; failed: number; rateLimited: number; skipped: number; inputTokens: number; outputTokens: number; costUsd: number };
interface Metrics {
  generatedAt: string;
  integrations: Record<string, boolean>;
  usdInrRate: number | null;
  totals: { last7d: Totals; allTime: Totals };
  providers: Record<
    'gemini' | 'groq',
    { configured: boolean; last7d: Totals; allTime: Totals; medianLatencyMs: number | null; successRate7d: number | null; rateLimitShare7d?: number; lastOkAt: string | null; lastFailure: { ts: string; reason?: string } | null }
  >;
  daily: { date: string; gemini: { calls: number; tokens: number; costUsd: number }; groq: { calls: number; tokens: number; costUsd: number } }[];
  rateLimits: { last7d: number; allTime: number; avoided7d: number; reasons: { reason: string; provider: string; model: string; last7d: number; allTime: number; lastAt: string }[] };
  jobMatrix: { job: string; label: string; route: string[]; primary: string; gemini: { calls: number; ok: number }; groq: { calls: number; ok: number } }[];
  failuresByProvider: { provider: string; model: string; errorType: string; reason: string; last7d: number; allTime: number; lastAt: string }[];
  recentFailures: { ts: string; provider: string; model: string; job: string; status: string; errorType?: string; reason?: string; message?: string; pageUrl?: string }[];
  fallbacks: { last7d: number; allTime: number };
  firecrawl: {
    live: { remaining: number; plan: number; used: number; percentUsed: number | null; periodStart?: string; periodEnd?: string } | null;
    liveError: string | null;
    requests7d: number;
    requestsAllTime: number;
    failed7d: number;
    recentFailures: { ts: string; url: string; error?: string; status?: number }[];
  };
  pipeline: {
    last7d: number;
    allTime: number;
    verdicts7d: Record<string, number>;
    verdictsAllTime: Record<string, number>;
    avgDurationMs: number | null;
    avgDrafts: number | null;
    avgCostUsd: number | null;
    recent: { ts: string; pageUrl?: string; mode: string; scope?: string; verdict?: string; drafts: number; durationMs: number; scoreBefore?: number; scoreAfter?: number; costUsd: number; error?: string }[];
  };
  health: {
    paused: { key: string; reason: string; resumesAt: string }[];
    groqQuota: { model: string; requestsPerDay?: number; requestsRemainingToday?: number; tokensPerMinute?: number; tokensRemainingThisMinute?: number; at: string }[];
  };
  prices: { model: string; input: number | null; output: number | null }[];
}

// ------------------------------------------------------------------ formatting
const n = (v: number) => v.toLocaleString('en-IN');
const compact = (v: number) => (v >= 1e7 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e4 ? `${(v / 1e3).toFixed(0)}K` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : `${v}`);
const usd = (v: number) => (v === 0 ? '$0' : v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`);
const inr = (v: number, rate: number | null) => (rate ? `≈ ₹${(v * rate).toLocaleString('en-IN', { maximumFractionDigits: v * rate < 1 ? 2 : 0 })}` : '');
const secs = (ms: number | null) => (ms === null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`);
function ago(ts?: string | null) {
  if (!ts) return 'never';
  const s = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
const when = (ts: string) => new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const shortUrl = (u?: string) => (u ? u.replace(/^https?:\/\/(www\.)?/, '') : '—');

// Plain-language meaning of each failure type.
const ERROR_HELP: Record<string, { what: string; todo: string }> = {
  rate_limit: { what: 'The provider asked us to slow down (too many requests or words in a short time).', todo: 'Usually clears within a minute. If it happens a lot, upgrade the plan or run fewer pages at once.' },
  too_large: { what: "The request was bigger than the provider's per-minute allowance.", todo: "Expected for long pages on Groq's free tier; those go to Gemini automatically." },
  auth: { what: 'The API key was rejected or is missing.', todo: 'Check the key in .env and restart the server.' },
  permission: { what: 'The provider has blocked this account or project.', todo: 'Create a new key under a working account, or contact the provider.' },
  model_not_found: { what: 'This model is not available to this key.', todo: 'Choose another model in .env (GEMINI_MODEL / GROQ_MODEL).' },
  timeout: { what: 'The model took too long to answer.', todo: 'Retried with another model automatically; persistent timeouts mean the provider is overloaded.' },
  server_error: { what: 'The provider had a temporary problem on its side.', todo: 'Retried automatically. Nothing to do unless it continues for hours.' },
  network: { what: 'The server could not reach the provider.', todo: 'Check the server internet connection or firewall.' },
  bad_output: { what: 'The model answered, but not in the required format.', todo: 'Another model was tried automatically.' },
  other: { what: 'An unexpected error.', todo: 'See the message for details.' },
};
const JOB_PLAIN: Record<string, string> = {
  maker: 'Writes the optimized page',
  extraction: 'Cleans up pasted HTML',
  'gate-compliance': 'Checks brand & product rules',
  'gate-customer': 'Checks readability for customers',
  'gate-eeat-geo': 'Checks trust & AI-citation readiness',
  'verify-fidelity': 'Fact-checks the draft against the source',
  keywords: 'Picks target keywords',
  'h2-optimizer': 'Suggests better H2 headings',
};
const VERDICT: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  APPROVED: { label: 'Approved for publishing', icon: <CheckCircle2 className="w-4 h-4" />, tone: 'var(--status-good)' },
  NOT_QUALIFIED: { label: 'Does not qualify yet', icon: <AlertTriangle className="w-4 h-4" />, tone: 'var(--status-warning)' },
  MAKER_UNAVAILABLE: { label: 'Writer unavailable', icon: <PauseCircle className="w-4 h-4" />, tone: 'var(--status-serious)' },
  FAILED: { label: 'Run failed', icon: <XCircle className="w-4 h-4" />, tone: 'var(--status-critical)' },
};

// ------------------------------------------------------------------ chart & status colours (validated)
const VIZ_CSS = `
.viz-root {
  --series-1: #2a78d6; /* Gemini */
  --series-2: #eb6834; /* Groq */
  --series-3: #6250d6; /* single-measure bars */
  --status-good: #0ca30c; --status-warning: #d99400; --status-serious: #ec835a; --status-critical: #d03b3b;
  --text-primary: var(--color-slate-100); --text-secondary: var(--color-slate-400); --text-muted: var(--color-slate-500);
  --grid: var(--color-slate-800); --axis: var(--color-slate-600); --track: var(--color-slate-800);
  --border: var(--color-slate-700); --tooltip-bg: var(--color-slate-900);
  --hover: color-mix(in oklab, var(--color-slate-500) 10%, transparent);
}
:root[data-theme="dark"] .viz-root {
  --series-1: #3987e5; --series-2: #d95926; --series-3: #9085e9; --status-warning: #fab219;
}`;

// ------------------------------------------------------------------ small building blocks
const Section: React.FC<{ icon: React.ReactNode; title: string; explain: string; className?: string; children: React.ReactNode; right?: React.ReactNode }> = ({ icon, title, explain, className = '', children, right }) => (
  <section className={`rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5 ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-slate-300 shrink-0">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-100">{title}</h2>
          <p className="text-[13px] text-slate-500 leading-snug">{explain}</p>
        </div>
      </div>
      {right}
    </div>
    {children}
  </section>
);

const Tile: React.FC<{ label: string; week: string; all: string; note?: string; icon: React.ReactNode; tone?: string }> = ({ label, week, all, note, icon, tone }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
    <div className="flex items-center gap-2 text-[13px] text-slate-400">
      <span style={{ color: tone || 'var(--text-secondary)' }}>{icon}</span>
      {label}
    </div>
    <div className="mt-2 text-[28px] leading-none font-semibold text-slate-100">{week}</div>
    <div className="mt-1 text-[12px] text-slate-500">last 7 days</div>
    <div className="mt-3 pt-3 border-t border-slate-800 flex items-baseline justify-between gap-2 text-[13px]">
      <span className="text-slate-500">All time</span>
      <span className="font-medium text-slate-200 tabular">{all}</span>
    </div>
    {note && <div className="mt-1 text-[12px] text-slate-500">{note}</div>}
  </div>
);

const StatusPill: React.FC<{ tone: string; icon: React.ReactNode; children: React.ReactNode }> = ({ tone, icon, children }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[12px] font-medium border border-slate-700 text-slate-200">
    <span style={{ color: tone }}>{icon}</span>
    {children}
  </span>
);

function providerStatus(p: Metrics['providers']['gemini'], paused: boolean) {
  if (!p.configured) return { label: 'Not configured', tone: 'var(--text-muted)', icon: <KeyRound className="w-3.5 h-3.5" /> };
  if (paused) return { label: 'Paused after errors', tone: 'var(--status-critical)', icon: <PauseCircle className="w-3.5 h-3.5" /> };
  if (p.last7d.calls === 0) return { label: 'No calls this week', tone: 'var(--text-muted)', icon: <Activity className="w-3.5 h-3.5" /> };
  if (!p.lastOkAt || (p.successRate7d ?? 100) < 50) return { label: 'Failing', tone: 'var(--status-critical)', icon: <XCircle className="w-3.5 h-3.5" /> };
  if ((p.successRate7d ?? 100) < 90) return { label: 'Some failures', tone: 'var(--status-warning)', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  if ((p.rateLimitShare7d ?? 0) >= 20) return { label: 'Working, often rate-limited', tone: 'var(--status-warning)', icon: <Gauge className="w-3.5 h-3.5" /> };
  return { label: 'Healthy', tone: 'var(--status-good)', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
}

// ------------------------------------------------------------------ login
const PW_KEY = 'co-admin-pw';

const Login: React.FC<{ onDone: (pw: string) => void; error: string | null }> = ({ onDone, error }) => {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(error);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      onDone(pw);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="brand-mark w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] font-semibold">CO</div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100">Admin panel</h1>
            <p className="text-[12px] text-slate-500">Content Optimizer · usage &amp; health</p>
          </div>
        </div>
        <label className="block space-y-1.5">
          <span className="text-[13px] text-slate-300">Admin password</span>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />
        </label>
        {msg && <p className="text-[13px] text-rose-400">{msg}</p>}
        <button disabled={busy || !pw} className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50">
          {busy ? 'Checking…' : 'Open admin panel'}
        </button>
        <a href="/" className="block text-center text-[13px] text-slate-500 hover:text-slate-300">Back to the tool</a>
      </form>
    </div>
  );
};

// ------------------------------------------------------------------ panel
export const AdminPanel: React.FC = () => {
  const [pw, setPw] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(PW_KEY);
    } catch {
      return null;
    }
  });
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState<'calls' | 'tokens' | 'costUsd'>('calls');
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('co-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const load = useCallback(async () => {
    if (!pw) return;
    setLoading(true);
    try {
      const r = await fetch('/api/admin/metrics', { headers: { 'x-admin-password': pw } });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        try {
          sessionStorage.removeItem(PW_KEY);
        } catch {
          /* ignore */
        }
        setPw(null);
        setError('Your session expired or the password changed. Sign in again.');
        return;
      }
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setData(j);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pw]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const dailyRows = useMemo(
    () =>
      (data?.daily || []).map((d) => ({
        label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        values: { gemini: (d.gemini as any)[metric], groq: (d.groq as any)[metric] },
      })),
    [data, metric]
  );

  if (!pw) {
    return (
      <Login
        error={error}
        onDone={(p) => {
          try {
            sessionStorage.setItem(PW_KEY, p);
          } catch {
            /* ignore */
          }
          setPw(p);
        }}
      />
    );
  }

  const rate = data?.usdInrRate ?? null;
  const pausedKeys = new Set((data?.health.paused || []).map((p) => p.key.split(':')[0]));

  return (
    <div className="viz-root min-h-screen bg-slate-950 text-slate-200">
      <style>{VIZ_CSS}</style>
      <header className="app-header sticky top-0 z-30 backdrop-blur">
        <div className="brand-ribbon" />
        <div className="border-b border-slate-800">
          <div className="no-wrap max-w-[1280px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
            <div className="no-wrap flex items-center gap-2.5 min-w-0">
              <div className="brand-mark w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] font-semibold shrink-0">CO</div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-slate-100 leading-tight">Admin panel</h1>
                <p className="text-[11px] text-slate-500 leading-tight truncate">
                  {data ? `Updated ${ago(data.generatedAt)} · refreshes every minute` : 'Loading…'}
                </p>
              </div>
            </div>
            <div className="no-wrap flex items-center gap-1.5 shrink-0">
              <a href="/" className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-700 text-[13px] text-slate-300 hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4" /> Back to tool
              </a>
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800" aria-label="Toggle theme">
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button onClick={load} className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[13px]" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => {
                  try {
                    sessionStorage.removeItem(PW_KEY);
                  } catch {
                    /* ignore */
                  }
                  setPw(null);
                }}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-3 sm:px-6 py-5 space-y-5">
        {error && (
          <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-3 text-[13px] text-rose-300 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {!data ? (
          <p className="text-slate-500 text-sm">Loading metrics…</p>
        ) : (
          <>
            {/* 1. At a glance */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              <Tile icon={<Zap className="w-4 h-4" />} label="AI calls" week={n(data.totals.last7d.calls)} all={n(data.totals.allTime.calls)} note={`${n(data.totals.last7d.ok)} succeeded this week`} />
              <Tile icon={<CircleDollarSign className="w-4 h-4" />} label="Estimated cost" week={usd(data.totals.last7d.costUsd)} all={usd(data.totals.allTime.costUsd)} note={rate ? inr(data.totals.last7d.costUsd, rate) + ' this week' : 'At list prices'} />
              <Tile icon={<Coins className="w-4 h-4" />} label="Tokens used" week={compact(data.totals.last7d.inputTokens + data.totals.last7d.outputTokens)} all={compact(data.totals.allTime.inputTokens + data.totals.allTime.outputTokens)} note={`${compact(data.totals.last7d.inputTokens)} read · ${compact(data.totals.last7d.outputTokens)} written`} />
              <Tile icon={<Gauge className="w-4 h-4" />} tone="var(--status-warning)" label="Rate-limit hits" week={n(data.rateLimits.last7d)} all={n(data.rateLimits.allTime)} note={data.rateLimits.avoided7d ? `${n(data.rateLimits.avoided7d)} more avoided by routing` : undefined} />
              <Tile icon={<Repeat className="w-4 h-4" />} label="Backup model used" week={n(data.fallbacks.last7d)} all={n(data.fallbacks.allTime)} note="Times the first-choice model failed and another answered" />
              <Tile icon={<ListChecks className="w-4 h-4" />} label="Pages processed" week={n(data.pipeline.last7d)} all={n(data.pipeline.allTime)} note={data.pipeline.avgCostUsd !== null ? `${usd(data.pipeline.avgCostUsd)} average per run` : undefined} />
            </div>

            {/* 2. Daily activity */}
            <Section
              icon={<Activity className="w-4 h-4" />}
              title="Daily AI usage — Gemini vs Groq"
              explain="How much work each provider did per day over the last 14 days. Hover a day for exact numbers."
              right={
                <div className="flex gap-1 p-1 rounded-lg bg-slate-800 text-[12px]">
                  {([
                    ['calls', 'Calls'],
                    ['tokens', 'Tokens'],
                    ['costUsd', 'Cost'],
                  ] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setMetric(k)} className={`px-2.5 h-7 rounded-md ${metric === k ? 'bg-slate-900 text-slate-100 shadow-sm' : 'text-slate-400'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              }
            >
              <StackedColumns
                rows={dailyRows}
                series={[
                  { key: 'gemini', label: 'Gemini', color: 'var(--series-1)' },
                  { key: 'groq', label: 'Groq', color: 'var(--series-2)' },
                ]}
                format={metric === 'costUsd' ? usd : metric === 'tokens' ? compact : (v) => n(v)}
                ariaLabel={`Daily ${metric} by provider`}
              />
            </Section>

            {/* 3. Providers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(['gemini', 'groq'] as const).map((key) => {
                const p = data.providers[key];
                const st = providerStatus(p, pausedKeys.has(key));
                const paused = data.health.paused.filter((x) => x.key.startsWith(key + ':'));
                return (
                  <Section
                    key={key}
                    icon={<span className="inline-block w-3 h-3 rounded-sm" style={{ background: key === 'gemini' ? 'var(--series-1)' : 'var(--series-2)' }} />}
                    title={key === 'gemini' ? 'Gemini (Google)' : 'Groq'}
                    explain={key === 'gemini' ? 'Writes the optimized pages and fact-checks them; backs up Groq.' : 'Runs the quick checks (compliance, readability, trust/AI-citation, keywords, H2s); backs up Gemini.'}
                    right={<StatusPill tone={st.tone} icon={st.icon}>{st.label}</StatusPill>}
                  >
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-[13px]">
                      {[
                        ['Calls (7 days)', n(p.last7d.calls)],
                        ['Calls (all time)', n(p.allTime.calls)],
                        ['Success rate (7 days)', p.successRate7d === null ? '—' : `${p.successRate7d}%`],
                        ['Time spent rate-limited', `${p.rateLimitShare7d ?? 0}% of calls`],
                        ['Tokens (7 days)', compact(p.last7d.inputTokens + p.last7d.outputTokens)],
                        ['Tokens (all time)', compact(p.allTime.inputTokens + p.allTime.outputTokens)],
                        ['Typical response time', secs(p.medianLatencyMs)],
                        ['Cost (7 days)', usd(p.last7d.costUsd)],
                        ['Cost (all time)', usd(p.allTime.costUsd)],
                        ['Rate-limit hits (7 days)', n(p.last7d.rateLimited)],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-slate-500">{k}</dt>
                          <dd className="text-slate-100 font-medium tabular">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 pt-3 border-t border-slate-800 text-[13px] space-y-1">
                      <div className="text-slate-400">
                        Last success: <span className="text-slate-200">{ago(p.lastOkAt)}</span>
                      </div>
                      {p.lastFailure && (
                        <div className="text-slate-400">
                          Last failure: <span className="text-slate-200">{ago(p.lastFailure.ts)}</span> — {p.lastFailure.reason}
                        </div>
                      )}
                      {paused.map((x) => (
                        <div key={x.key} className="text-rose-400">
                          {x.key.split(':')[1]} is paused until {new Date(x.resumesAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}: {x.reason}
                        </div>
                      ))}
                    </div>
                  </Section>
                );
              })}
            </div>

            {/* 4. Who does which job */}
            <Section icon={<Route className="w-4 h-4" />} title="Which provider does which job" explain="Each task has a first-choice model and backups. The counts show who actually did the work.">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-slate-500 text-left">
                      <th className="font-medium py-2 pr-4">Task</th>
                      <th className="font-medium py-2 pr-4">First choice</th>
                      <th className="font-medium py-2 pr-4">Backups (in order)</th>
                      <th className="font-medium py-2 px-3 text-right">Done by Gemini</th>
                      <th className="font-medium py-2 pl-3 text-right">Done by Groq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.jobMatrix.map((j) => (
                      <tr key={j.job} className="border-t border-slate-800 align-top">
                        <td className="py-2 pr-4">
                          <div className="text-slate-100">{JOB_PLAIN[j.job] || j.label}</div>
                          <div className="text-[12px] text-slate-500">{j.label}</div>
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: j.primary === 'gemini' ? 'var(--series-1)' : 'var(--series-2)' }} />
                            {j.route[0].replace(/^(gemini|groq):/, (m) => (m === 'gemini:' ? 'Gemini · ' : 'Groq · '))}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-400">{j.route.slice(1).map((r) => r.replace('gemini:', 'Gemini · ').replace('groq:', 'Groq · ')).join(' → ')}</td>
                        <td className="py-2 px-3 text-right tabular">{n(j.gemini.ok)}<span className="text-slate-500">/{n(j.gemini.calls)}</span></td>
                        <td className="py-2 pl-3 text-right tabular">{n(j.groq.ok)}<span className="text-slate-500">/{n(j.groq.calls)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[12px] text-slate-500">“12/14” means 12 successful answers out of 14 attempts.</p>
              </div>
            </Section>

            {/* 5. Rate limits */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <Section className="lg:col-span-3" icon={<Gauge className="w-4 h-4" />} title="Why we hit rate limits" explain="A rate limit is the provider saying “slow down”. Each bar is one reason, counted over all time; the line below shows the last 7 days.">
                <HBars
                  color="var(--series-3)"
                  empty="No rate limits recorded. Good."
                  rows={data.rateLimits.reasons.map((r) => ({
                    label: r.reason,
                    value: r.allTime,
                    sub: `${r.provider === 'gemini' ? 'Gemini' : 'Groq'} · ${r.model} · ${n(r.last7d)} in the last 7 days · last ${ago(r.lastAt)}`,
                  }))}
                  format={(v) => n(v)}
                />
              </Section>
              <Section className="lg:col-span-2" icon={<Timer className="w-4 h-4" />} title="Groq allowance right now" explain="Groq's limits from its most recent answer (free tier: requests per day and tokens per minute).">
                {data.health.groqQuota.length === 0 ? (
                  <p className="text-[13px] text-slate-500">No Groq calls since the server started.</p>
                ) : (
                  <div className="space-y-4">
                    {data.health.groqQuota.map((q) => (
                      <div key={q.model} className="space-y-2">
                        <div className="text-[13px] text-slate-200 font-medium">{q.model}</div>
                        {q.requestsPerDay !== undefined && (
                          <div>
                            <div className="flex justify-between text-[12px] text-slate-400 mb-1">
                              <span>Requests used today</span>
                              <span className="tabular">{n((q.requestsPerDay || 0) - (q.requestsRemainingToday || 0))} of {n(q.requestsPerDay || 0)}</span>
                            </div>
                            <Meter used={(q.requestsPerDay || 0) - (q.requestsRemainingToday || 0)} total={q.requestsPerDay || 0} label="Groq requests used today" />
                          </div>
                        )}
                        {q.tokensPerMinute !== undefined && (
                          <div className="text-[12px] text-slate-400">
                            Tokens per minute: <span className="text-slate-200 tabular">{n(q.tokensPerMinute)}</span> (as of {ago(q.at)})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* 6. Failures by provider */}
            <Section icon={<ShieldAlert className="w-4 h-4" />} title="What is failing and why" explain="Grouped by provider and reason, with what it means and what to do. Failed calls are retried on a backup model automatically.">
              {data.failuresByProvider.length === 0 ? (
                <p className="text-[13px] text-slate-500">No failures recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="font-medium py-2 pr-4">Provider · model</th>
                        <th className="font-medium py-2 pr-4">Reason</th>
                        <th className="font-medium py-2 pr-4">What it means / what to do</th>
                        <th className="font-medium py-2 px-3 text-right">7 days</th>
                        <th className="font-medium py-2 px-3 text-right">All time</th>
                        <th className="font-medium py-2 pl-3">Last seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.failuresByProvider.map((f, i) => {
                        const help = ERROR_HELP[f.errorType] || ERROR_HELP.other;
                        return (
                          <tr key={i} className="border-t border-slate-800 align-top">
                            <td className="py-2 pr-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: f.provider === 'gemini' ? 'var(--series-1)' : 'var(--series-2)' }} />
                                {f.provider === 'gemini' ? 'Gemini' : 'Groq'}
                              </span>
                              <div className="text-[12px] text-slate-500">{f.model}</div>
                            </td>
                            <td className="py-2 pr-4 text-slate-100">{f.reason || f.errorType}</td>
                            <td className="py-2 pr-4 text-slate-400 min-w-[16rem]">
                              {help.what} <span className="text-slate-300">{help.todo}</span>
                            </td>
                            <td className="py-2 px-3 text-right tabular">{n(f.last7d)}</td>
                            <td className="py-2 px-3 text-right tabular">{n(f.allTime)}</td>
                            <td className="py-2 pl-3 whitespace-nowrap text-slate-400" title={when(f.lastAt)}>{ago(f.lastAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* 7. Firecrawl + pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Section icon={<Flame className="w-4 h-4" />} title="Firecrawl credits this month" explain="Firecrawl fetches pages from bajajfinserv.in. Each page fetch uses about 1 credit.">
                {data.firecrawl.live ? (
                  <div className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[28px] leading-none font-semibold text-slate-100">{n(data.firecrawl.live.remaining)}</div>
                        <div className="text-[13px] text-slate-500 mt-1">credits left of {n(data.firecrawl.live.plan)}</div>
                      </div>
                      <div className="text-right text-[13px] text-slate-400">
                        <div>
                          <span className="text-slate-100 font-medium">{n(data.firecrawl.live.used)}</span> used ({data.firecrawl.live.percentUsed}%)
                        </div>
                        {data.firecrawl.live.periodEnd && <div>Resets {new Date(data.firecrawl.live.periodEnd).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>}
                      </div>
                    </div>
                    <Meter used={data.firecrawl.live.used} total={data.firecrawl.live.plan} label="Firecrawl credits used" />
                  </div>
                ) : (
                  <p className="text-[13px] text-rose-400">Could not read Firecrawl credits: {data.firecrawl.liveError}</p>
                )}
                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3 text-[13px]">
                  <div>
                    <div className="text-slate-500">Fetches (7 days)</div>
                    <div className="text-slate-100 font-medium tabular">{n(data.firecrawl.requests7d)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Fetches (all time)</div>
                    <div className="text-slate-100 font-medium tabular">{n(data.firecrawl.requestsAllTime)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Failed (7 days)</div>
                    <div className="text-slate-100 font-medium tabular">{n(data.firecrawl.failed7d)}</div>
                  </div>
                </div>
              </Section>

              <Section icon={<ListChecks className="w-4 h-4" />} title="Page runs and outcomes" explain="Every time a page is optimized or revised. “Approved” means all five checks and the fact check passed.">
                <div className="space-y-2">
                  {(['APPROVED', 'NOT_QUALIFIED', 'MAKER_UNAVAILABLE', 'FAILED'] as const).map((k) => (
                    <div key={k} className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="inline-flex items-center gap-2 text-slate-200">
                        <span style={{ color: VERDICT[k].tone }}>{VERDICT[k].icon}</span>
                        {VERDICT[k].label}
                      </span>
                      <span className="tabular text-slate-400">
                        <span className="text-slate-100 font-medium">{n(data.pipeline.verdicts7d[k] || 0)}</span> this week · {n(data.pipeline.verdictsAllTime[k] || 0)} all time
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3 text-[13px]">
                  <div>
                    <div className="text-slate-500">Average time</div>
                    <div className="text-slate-100 font-medium">{secs(data.pipeline.avgDurationMs)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Average drafts</div>
                    <div className="text-slate-100 font-medium">{data.pipeline.avgDrafts ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Average cost</div>
                    <div className="text-slate-100 font-medium">{data.pipeline.avgCostUsd === null ? '—' : usd(data.pipeline.avgCostUsd)}</div>
                  </div>
                </div>
              </Section>
            </div>

            {/* 8. Recent runs */}
            <Section icon={<ListChecks className="w-4 h-4" />} title="Recent page runs" explain="The latest 25 runs, newest first.">
              {data.pipeline.recent.length === 0 ? (
                <p className="text-[13px] text-slate-500">No runs yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="font-medium py-2 pr-4">When</th>
                        <th className="font-medium py-2 pr-4">Page</th>
                        <th className="font-medium py-2 pr-4">Type</th>
                        <th className="font-medium py-2 pr-4">Outcome</th>
                        <th className="font-medium py-2 px-3 text-right">Score</th>
                        <th className="font-medium py-2 px-3 text-right">Drafts</th>
                        <th className="font-medium py-2 px-3 text-right">Time</th>
                        <th className="font-medium py-2 pl-3 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pipeline.recent.map((r, i) => {
                        const v = VERDICT[r.error ? 'FAILED' : r.verdict || 'FAILED'] || VERDICT.FAILED;
                        return (
                          <tr key={i} className="border-t border-slate-800 align-top">
                            <td className="py-2 pr-4 whitespace-nowrap text-slate-400" title={when(r.ts)}>{ago(r.ts)}</td>
                            <td className="py-2 pr-4 text-slate-200 max-w-[18rem] truncate" title={r.pageUrl}>{shortUrl(r.pageUrl)}</td>
                            <td className="py-2 pr-4 text-slate-400 whitespace-nowrap">{r.mode === 'revise' ? `Revision (${r.scope || 'all'})` : 'Full optimization'}</td>
                            <td className="py-2 pr-4">
                              <span className="inline-flex items-center gap-1.5 text-slate-200" title={r.error}>
                                <span style={{ color: v.tone }}>{v.icon}</span>
                                {v.label}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right tabular whitespace-nowrap">{r.scoreBefore ?? '—'} → {r.scoreAfter ?? '—'}</td>
                            <td className="py-2 px-3 text-right tabular">{r.drafts}</td>
                            <td className="py-2 px-3 text-right tabular">{secs(r.durationMs)}</td>
                            <td className="py-2 pl-3 text-right tabular">{usd(r.costUsd)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* 9. Recent failures */}
            <Section icon={<AlertTriangle className="w-4 h-4" />} title="Recent failures (latest first)" explain="Every failed or limited AI call, with the job it was doing and the page it was for.">
              {data.recentFailures.length === 0 ? (
                <p className="text-[13px] text-slate-500">Nothing has failed.</p>
              ) : (
                <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
                  <table className="w-full text-[13px]">
                    <thead className="sticky top-0 bg-slate-900">
                      <tr className="text-slate-500 text-left">
                        <th className="font-medium py-2 pr-4">When</th>
                        <th className="font-medium py-2 pr-4">Provider · model</th>
                        <th className="font-medium py-2 pr-4">Job</th>
                        <th className="font-medium py-2 pr-4">Reason</th>
                        <th className="font-medium py-2 pl-3">Page</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentFailures.map((f, i) => (
                        <tr key={i} className="border-t border-slate-800 align-top" title={f.message}>
                          <td className="py-2 pr-4 whitespace-nowrap text-slate-400" title={when(f.ts)}>{ago(f.ts)}</td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            {f.provider === 'gemini' ? 'Gemini' : 'Groq'} <span className="text-slate-500">· {f.model}</span>
                          </td>
                          <td className="py-2 pr-4 text-slate-300">{f.job}</td>
                          <td className="py-2 pr-4 text-slate-100">
                            {f.reason || f.errorType}
                            {f.status === 'skipped' && <span className="text-slate-500"> (not sent)</span>}
                          </td>
                          <td className="py-2 pl-3 text-slate-400 max-w-[16rem] truncate" title={f.pageUrl}>{shortUrl(f.pageUrl)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* 10. Setup & prices */}
            <Section icon={<KeyRound className="w-4 h-4" />} title="Setup and price list" explain="Which services are connected, and the list prices used for the cost estimates (USD per 1 million tokens).">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ul className="space-y-2 text-[13px]">
                  {[
                    ['Gemini', data.integrations.gemini, 'Writes pages'],
                    ['Groq', data.integrations.groq, 'Runs the checks'],
                    ['Firecrawl', data.integrations.firecrawl, 'Fetches pages'],
                    ['Google Ads (search volumes)', data.integrations.googleAds, 'Needs all five GOOGLE_ADS_* values incl. the developer token'],
                  ].map(([name, on, what]) => (
                    <li key={String(name)} className="flex items-center justify-between gap-3">
                      <span className="text-slate-200">
                        {name} <span className="text-slate-500">· {what}</span>
                      </span>
                      <StatusPill tone={on ? 'var(--status-good)' : 'var(--text-muted)'} icon={on ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}>
                        {on ? 'Connected' : 'Not set up'}
                      </StatusPill>
                    </li>
                  ))}
                </ul>
                <div>
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-slate-500 text-left">
                        <th className="font-medium py-1.5 pr-3">Model</th>
                        <th className="font-medium py-1.5 px-3 text-right">Input</th>
                        <th className="font-medium py-1.5 pl-3 text-right">Output</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.prices.map((p) => (
                        <tr key={p.model} className="border-t border-slate-800">
                          <td className="py-1.5 pr-3 text-slate-200">{p.model}</td>
                          <td className="py-1.5 px-3 text-right tabular">{p.input === null ? 'unknown' : `$${p.input}`}</td>
                          <td className="py-1.5 pl-3 text-right tabular">{p.output === null ? 'unknown' : `$${p.output}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-[12px] text-slate-500">
                    Free-tier usage is not billed; these estimates show what the same usage would cost at list price.
                    {rate ? ` Rupee figures use ₹${rate} per US$ (USD_INR_RATE in .env).` : ' Set USD_INR_RATE in .env to also show rupees.'}
                  </p>
                </div>
              </div>
            </Section>
          </>
        )}
      </main>
    </div>
  );
};
