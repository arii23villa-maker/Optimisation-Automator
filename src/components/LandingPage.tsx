import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Bot,
  Code2,
  FileSearch,
  Gauge,
  GitCompareArrows,
  KeyRound,
  Layers,
  ListChecks,
  MessageSquareQuote,
  Mic,
  Moon,
  Pause,
  PenLine,
  Play,
  Repeat,
  Ruler,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Workflow,
} from 'lucide-react';
import { navigate } from '../lib/route';
import { useTheme } from '../lib/theme';

/**
 * Landing page at "/". Every example on it is real: the replay and the "caught in testing" cards quote what the
 * pipeline actually produced in test runs on live bajajfinserv.in pages on 20 Oct 2026 (docs/E2E-REPORT.md,
 * docs/e2e-outputs/). Nothing here is a made-up score or result.
 */

const openWorkspace = (e?: React.MouseEvent) => {
  e?.preventDefault();
  navigate('/app');
};

type Family = 'extract' | 'maker' | 'gate' | 'verify' | 'orchestrate';
const FAMILY: Record<Family, { ring: string; text: string; chip: string; dot: string; label: string }> = {
  extract: { ring: 'ring-blue-500/40', text: 'text-blue-400', chip: 'bg-blue-500/10 text-blue-300 border-blue-500/30', dot: 'bg-blue-500', label: 'Reads' },
  maker: { ring: 'ring-violet-500/40', text: 'text-violet-400', chip: 'bg-violet-500/10 text-violet-300 border-violet-500/30', dot: 'bg-violet-500', label: 'Writes' },
  gate: { ring: 'ring-teal-500/40', text: 'text-teal-400', chip: 'bg-teal-500/10 text-teal-300 border-teal-500/30', dot: 'bg-teal-500', label: 'Reviews' },
  verify: { ring: 'ring-amber-500/40', text: 'text-amber-400', chip: 'bg-amber-500/10 text-amber-300 border-amber-500/30', dot: 'bg-amber-500', label: 'Verifies' },
  orchestrate: { ring: 'ring-emerald-500/40', text: 'text-emerald-400', chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-500', label: 'Runs the loop' },
};

// ---------------------------------------------------------------- content (all of it true)

/** Moments from real test runs on bajajfinserv.in/insta-emi-card, 20 Oct 2026. */
const REPLAY: { agent: string; family: Family; icon: React.ReactNode; title: string; body: React.ReactNode; tone?: 'block' | 'ok' }[] = [
  {
    agent: 'Agent 1 · Extraction',
    family: 'extract',
    icon: <FileSearch className="h-4 w-4" />,
    title: 'Reads the live page',
    body: (
      <>
        <span className="tabular font-medium text-slate-100">2,666</span> words, <span className="tabular font-medium text-slate-100">8</span> sections and{' '}
        <span className="tabular font-medium text-slate-100">25</span> FAQs, from the H1 down. Menus and footers are left out.
      </>
    ),
  },
  {
    agent: 'Gate 3 · SEO backend',
    family: 'gate',
    icon: <Code2 className="h-4 w-4" />,
    title: 'Audits the original first',
    body: (
      <>
        The page title is <span className="tabular font-medium text-slate-100">66</span> characters; the vertical’s guideline asks for{' '}
        <span className="tabular font-medium text-slate-100">52–58</span>. The fees table has no “subject to change” note.
      </>
    ),
  },
  {
    agent: 'Gate 4 · Keyword & structure',
    family: 'gate',
    icon: <Layers className="h-4 w-4" />,
    title: 'Catches a rewrite that cut too much',
    body: (
      <>
        An early draft kept only <span className="tabular font-medium text-rose-300">576 of 2,666</span> words. Flagged as content dropped, and sent back:
        rewrite, don’t cut.
      </>
    ),
    tone: 'block',
  },
  {
    agent: 'Agent 8 · Verification',
    family: 'verify',
    icon: <BadgeCheck className="h-4 w-4" />,
    title: 'Blocks an invented phone number',
    body: (
      <>
        “please call <span className="lp-strike" data-on="true">1800-123-4567 (Mon–Fri 9 am–7 pm)</span>” is not on the page. The source lists{' '}
        <span className="tabular font-medium text-slate-100">+91 8698010101</span> and no hours.
      </>
    ),
    tone: 'block',
  },
  {
    agent: 'Agent 9 · Orchestrator',
    family: 'orchestrate',
    icon: <Workflow className="h-4 w-4" />,
    title: 'Improves it, without pretending',
    body: (
      <>
        After revisions the score rose from <span className="tabular font-medium text-slate-100">70</span> to{' '}
        <span className="tabular font-medium text-emerald-300">76</span>. Two gates were still under 70, so the page was <em>not</em> approved.
      </>
    ),
    tone: 'ok',
  },
];

const AGENTS: { n: number; name: string; family: Family; icon: React.ReactNode; kind: string; what: string }[] = [
  { n: 1, name: 'Extraction', family: 'extract', icon: <FileSearch className="h-4 w-4" />, kind: 'Rules (AI only to tidy pasted HTML)', what: 'Reads the page: title, description, schema, headings, body, tables and FAQs, starting at the H1. This is the ground truth every later check compares against.' },
  { n: 7, name: 'Maker', family: 'maker', icon: <PenLine className="h-4 w-4" />, kind: 'AI writer', what: 'The only writer. It rewrites the page freely, with two rules it can never break: invent nothing, and keep everything the source covers. Then it revises from the reviewers’ notes.' },
  { n: 2, name: 'Compliance', family: 'gate', icon: <Scale className="h-4 w-4" />, kind: 'Rules + AI', what: 'Forbidden phrases, mandatory disclosures, terminology and value propositions from the vertical’s guidelines. It also blocks pages that contain text aimed at manipulating an AI.' },
  { n: 3, name: 'SEO backend', family: 'gate', icon: <Code2 className="h-4 w-4" />, kind: 'Rules', what: 'Title and description length, brand in the title, valid and complete JSON-LD in the right order, sitemap.' },
  { n: 4, name: 'Keyword & structure', family: 'gate', icon: <KeyRound className="h-4 w-4" />, kind: 'Rules', what: 'Keywords in the right places, one H1 first, H3s inside H2s, FAQ last, and whether the rewrite kept the source’s content.' },
  { n: 5, name: 'Customer centricity', family: 'gate', icon: <Users className="h-4 w-4" />, kind: 'Rules + AI', what: 'Plain language for the reader, explained jargon, short paragraphs and sentences, and the worries a customer actually has.' },
  { n: 6, name: 'EEAT & GEO', family: 'gate', icon: <MessageSquareQuote className="h-4 w-4" />, kind: 'Rules + AI', what: 'Trust signals, consistent entity names, and direct answers AI engines can quote.' },
  { n: 8, name: 'Verification', family: 'verify', icon: <BadgeCheck className="h-4 w-4" />, kind: 'Rules + an independent AI check', what: 'Approves only if all five gates pass and every figure, link and claim traces back to the source. Its fact check is done by a different model from the one that wrote the draft whenever one is available.' },
  { n: 9, name: 'Orchestrator', family: 'orchestrate', icon: <Workflow className="h-4 w-4" />, kind: 'Rules', what: 'Runs the loop, keeps every score consistent, and splits long runs into short steps so nothing is cut off.' },
];

const GATE_CHECKS: { id: string; name: string; family: Family; checks: { text: string; ai?: boolean }[] }[] = [
  {
    id: 'compliance',
    name: 'Compliance',
    family: 'gate',
    checks: [
      { text: 'No forbidden phrase from the vertical’s guidelines (a phrase inside a negation, such as “not insured by DICGC”, is fine)' },
      { text: 'Mandatory disclosures present, e.g. a “subject to change” note next to fees' },
      { text: 'Core value propositions of the product are covered' },
      { text: 'No text addressed to an AI hidden in the page' },
      { text: 'Guideline violations in the copy, each with a quote and the rule it breaks', ai: true },
    ],
  },
  {
    id: 'seo',
    name: 'SEO backend',
    family: 'gate',
    checks: [
      { text: 'Title and description lengths within the vertical’s ranges' },
      { text: 'Brand in the title and description where the vertical requires it' },
      { text: 'Valid JSON-LD: page, breadcrumbs, the product or article, organisation, FAQ' },
      { text: 'Schema blocks in canonical order; sitemap present' },
    ],
  },
  {
    id: 'structure',
    name: 'Keyword & structure',
    family: 'gate',
    checks: [
      { text: 'Target keywords used, and the important ones in headings' },
      { text: 'Exactly one H1, first; every H3 inside an H2; FAQ last' },
      { text: 'Body keeps at least 70% of the source’s words (below 50% blocks)' },
      { text: 'At least 60% of the source’s FAQs kept' },
    ],
  },
  {
    id: 'customer',
    name: 'Customer centricity',
    family: 'gate',
    checks: [
      { text: 'No walls of text: paragraphs over 3 sentences are flagged' },
      { text: 'Friction patterns and clichés from the guidelines' },
      { text: 'Jargon and acronyms explained (KYC, OTP, NBFC…)', ai: true },
      { text: 'Order of the journey, objections, transparency about costs', ai: true },
    ],
  },
  {
    id: 'eeat',
    name: 'EEAT & GEO',
    family: 'gate',
    checks: [
      { text: 'Concrete facts AI engines can quote, not vague claims' },
      { text: 'Direct answers near the top of sections' },
      { text: 'Trust signals and consistent entity names', ai: true },
      { text: 'Things only an editor can add (author, last-updated date) go to editors, not the writer', ai: true },
    ],
  },
  {
    id: 'verify',
    name: 'Verification',
    family: 'verify',
    checks: [
      { text: 'Every figure in the draft appears in the source or approved facts' },
      { text: 'Every link and email address appears in the source' },
      { text: 'No forbidden phrase; all five gates passed' },
      { text: 'Claims checked against the source, by a different model from the writer when one is available', ai: true },
      { text: 'If any check couldn’t run, the page isn’t approved' },
    ],
  },
];

const CAUGHT: { label: string; blockedBy: string; family: Family; quote: React.ReactNode; why: string }[] = [
  {
    label: 'Invented contact details',
    blockedBy: 'Agent 8 · Verification',
    family: 'verify',
    quote: <>please call <span className="lp-strike" data-on="true">1800-123-4567</span> (Mon–Fri 9 am–7 pm)</>,
    why: 'Not on the Insta EMI Card page, which lists a different number and no opening hours.',
  },
  {
    label: 'A promise the product can’t make',
    blockedBy: 'Gate 2 · Compliance',
    family: 'gate',
    quote: <>grow your savings with <span className="lp-strike" data-on="true">guaranteed</span>, predictable returns</>,
    why: 'Written for the Fixed Deposit page. The compliance gate flagged it as critical: it implies a guarantee the NBFC doesn’t give.',
  },
  {
    label: 'A page cut to a fifth',
    blockedBy: 'Gate 4 · Keyword & structure',
    family: 'gate',
    quote: <>draft kept <span className="tabular">576</span> of <span className="tabular">2,666</span> words</>,
    why: 'Shorter isn’t better when facts, steps and FAQs disappear. The maker was sent back to restore them.',
  },
];

const VERTICALS = ['Personal Loan', 'Business Loan', 'Home Loan', 'Gold Loan', 'Fixed Deposit', 'Insta EMI Card', 'Co-branded Credit Cards', 'Insurance', 'Mutual Funds'];

// ---------------------------------------------------------------- pieces

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-indigo-400">{children}</p>;
}

/** Auto-playing replay of real moments from a test run. Pauses on hover or focus; steps are clickable. */
function RunReplay() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: '-80px' });
  const playing = !paused && visible && !reduce;
  const STEP_MS = 4800;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % REPLAY.length), STEP_MS);
    return () => clearTimeout(t);
  }, [step, playing]);

  const m = REPLAY[step];
  return (
    <div
      ref={ref}
      className="lp-card lp-glow relative overflow-hidden rounded-3xl p-5 sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Replay of a real test run on the Insta EMI Card page"
    >
      <div className="no-wrap flex items-center justify-between gap-3">
        <div className="no-wrap flex min-w-0 items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 blur-[3px]" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="truncate text-[12px] font-medium text-slate-400">Replay · real test run · bajajfinserv.in/insta-emi-card</p>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:text-slate-100"
          aria-label={paused ? 'Play the replay' : 'Pause the replay'}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="relative mt-5 min-h-[13.5rem] sm:min-h-[12rem]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduce ? undefined : { opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${FAMILY[m.family].chip}`}>
              {m.icon} {m.agent}
            </span>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">{m.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{m.body}</p>
            {m.tone === 'block' && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[12px] font-medium text-rose-300">
                <Ban className="h-3.5 w-3.5" /> Blocked: sent back to the maker
              </p>
            )}
            {m.tone === 'ok' && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[12px] font-medium text-amber-300">
                <Repeat className="h-3.5 w-3.5" /> Not approved yet: honest about it
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5" role="tablist" aria-label="Replay steps">
        {REPLAY.map((r, i) => (
          <button
            key={r.agent}
            role="tab"
            aria-selected={i === step}
            aria-label={`Step ${i + 1}: ${r.title}`}
            onClick={() => setStep(i)}
            className="flex h-8 items-center"
          >
            <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <span
                className={`absolute inset-y-0 left-0 rounded-full ${FAMILY[r.family].dot} ${i < step ? 'w-full' : 'w-0'}`}
                style={i === step ? { width: playing ? '100%' : '35%', transition: playing ? `width ${STEP_MS}ms linear` : 'none' } : undefined}
                key={`${i}-${step}-${playing}`}
              />
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-500">Moments from test runs on 20 Oct 2026, quoted from the tool’s own output.</p>
    </div>
  );
}

/** The loop: read → write → review ×5 → verify, with notes flowing back to the maker. */
function LoopDiagram() {
  const stages: { family: Family; title: string; sub: string; icon: React.ReactNode }[] = [
    { family: 'extract', title: 'Read', sub: 'Agent 1 extracts the facts', icon: <FileSearch className="h-5 w-5" /> },
    { family: 'maker', title: 'Write', sub: 'Agent 7 drafts freely', icon: <PenLine className="h-5 w-5" /> },
    { family: 'gate', title: 'Review', sub: 'Gates 2–6 score the draft', icon: <ListChecks className="h-5 w-5" /> },
    { family: 'verify', title: 'Verify', sub: 'Agent 8 approves or returns notes', icon: <BadgeCheck className="h-5 w-5" /> },
  ];
  return (
    <div className="relative">
      <div className="grid gap-3 md:grid-cols-4 md:gap-5">
        {stages.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08} className="relative">
            <div className={`lp-card relative h-full rounded-2xl p-5 ring-1 ${FAMILY[s.family].ring}`}>
              <div className="no-wrap flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${FAMILY[s.family].chip}`}>{s.icon}</span>
                <span className="tabular text-[12px] font-semibold text-slate-600">0{i + 1}</span>
              </div>
              <p className="lp-serif mt-4 text-3xl text-slate-100">{s.title}</p>
              <p className="mt-1 text-[14px] text-slate-400">{s.sub}</p>
            </div>
            {i < stages.length - 1 && (
              <svg className="absolute -right-5 top-1/2 hidden h-4 w-5 -translate-y-1/2 md:block" viewBox="0 0 20 16" aria-hidden>
                <line x1="0" y1="8" x2="20" y2="8" className="lp-dash" stroke="var(--color-slate-500)" strokeWidth="1.5" />
              </svg>
            )}
          </Reveal>
        ))}
      </div>
      {/* Return path: notes go back from verification to the maker. */}
      <div className="relative mx-auto mt-2 hidden h-16 md:block" aria-hidden>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 64" preserveAspectRatio="none">
          <path d="M 875 0 C 875 50, 820 58, 740 58 L 510 58 C 430 58, 375 50, 375 0" fill="none" stroke="var(--color-violet-500)" strokeWidth="1.5" className="lp-dash" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="absolute left-[62.5%] top-[2.6rem] -translate-x-1/2 whitespace-nowrap rounded-full border border-violet-500/30 bg-slate-950 px-3 py-0.5 text-[12px] text-violet-300">
          not qualified → prioritised notes back to the maker
        </span>
      </div>
      <p className="mt-4 flex items-start gap-2 text-[13px] text-slate-500 md:mt-1">
        <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
        Up to 2 revision rounds. The approved draft, or the best one, is applied; the original is kept for comparison.
      </p>
    </div>
  );
}

/** Nine agents on a ring (desktop) or a list (phone); picking one shows what it does. */
function AgentRing() {
  const [active, setActive] = useState(1); // the maker
  const a = AGENTS[active];
  const ring = AGENTS.map((x, i) => {
    const angle = (i / AGENTS.length) * Math.PI * 2 - Math.PI / 2;
    return { ...x, i, left: 50 + 42 * Math.cos(angle), top: 50 + 42 * Math.sin(angle) };
  });
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative mx-auto hidden aspect-square w-full max-w-[30rem] lg:block">
        <div className="absolute inset-[8%] rounded-full border border-dashed border-slate-700" aria-hidden />
        <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-teal-500/10 blur-xl" aria-hidden />
        <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="lp-serif text-5xl text-slate-100">9</p>
          <p className="text-[13px] text-slate-400">agents, one job each</p>
        </div>
        {ring.map((x) => (
          <button
            key={x.n}
            onClick={() => setActive(x.i)}
            onMouseEnter={() => setActive(x.i)}
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-2xl px-2 py-2 transition-transform duration-300 ${active === x.i ? 'scale-110' : 'hover:scale-105'}`}
            style={{ left: `${x.left}%`, top: `${x.top}%` }}
            aria-pressed={active === x.i}
            aria-label={`Agent ${x.n}: ${x.name}`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${FAMILY[x.family].chip} ${active === x.i ? `ring-4 ${FAMILY[x.family].ring}` : ''}`}
            >
              {x.icon}
            </span>
            <span className={`whitespace-nowrap text-[12px] font-medium ${active === x.i ? 'text-slate-100' : 'text-slate-400'}`}>{x.name}</span>
          </button>
        ))}
      </div>

      {/* Phone and tablet: chips */}
      <div className="flex flex-wrap gap-2 lg:hidden" role="tablist" aria-label="Agents">
        {AGENTS.map((x, i) => (
          <button
            key={x.n}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] ${active === i ? FAMILY[x.family].chip : 'border-slate-700 text-slate-400'}`}
          >
            <span className="tabular">{x.n}</span> {x.name}
          </button>
        ))}
      </div>

      <div className="lp-card min-h-[16rem] min-w-0 rounded-3xl p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={a.n} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3 }}>
            <div className="no-wrap flex items-center gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${FAMILY[a.family].chip}`}>{a.icon}</span>
              <div>
                <p className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${FAMILY[a.family].text}`}>
                  Agent {a.n} · {FAMILY[a.family].label}
                </p>
                <p className="text-xl font-semibold text-slate-100">{a.name}</p>
              </div>
            </div>
            <p className="mt-5 text-[16px] leading-relaxed text-slate-300">{a.what}</p>
            <p className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-slate-800/70 px-2.5 py-1 text-[12px] text-slate-400">
              <Bot className="h-3.5 w-3.5" /> {a.kind}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function GateTabs() {
  const [tab, setTab] = useState(GATE_CHECKS[0].id);
  const g = GATE_CHECKS.find((x) => x.id === tab)!;
  return (
    <div className="lp-card overflow-hidden rounded-3xl">
      <div className="scrollbar-none flex overflow-x-auto border-b border-slate-800 px-2" role="tablist" aria-label="Checks by reviewer">
        {GATE_CHECKS.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={`relative shrink-0 whitespace-nowrap px-4 py-3.5 text-[13px] font-medium transition-colors ${tab === x.id ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {x.name}
            {tab === x.id && <motion.span layoutId="lp-tab" className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${FAMILY[x.family].dot}`} />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.ul key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="grid gap-2 p-5 sm:grid-cols-2 sm:p-6">
          {g.checks.map((c) => (
            <li key={c.text} className="no-wrap flex items-start gap-3 rounded-xl bg-slate-950/50 p-3.5">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${c.ai ? 'border-violet-500/30 bg-violet-500/10 text-violet-300' : 'border-teal-500/30 bg-teal-500/10 text-teal-300'}`}>
                {c.ai ? <Sparkles className="h-3.5 w-3.5" /> : <Ruler className="h-3.5 w-3.5" />}
              </span>
              <span className="text-[14px] leading-relaxed text-slate-300">
                {c.text}
                <span className="ml-2 align-middle text-[11px] font-medium uppercase tracking-wide text-slate-500">{c.ai ? 'AI check' : 'rule'}</span>
              </span>
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------- page

export function LandingPage() {
  const [theme, toggleTheme] = useTheme();
  const primary =
    'inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-lg active:scale-[0.98]';
  const secondary =
    'inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800';

  return (
    <div className="min-h-screen overflow-x-clip bg-slate-950 text-slate-200">
      {/* Floating navigation */}
      <div className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
        <header className="lp-card no-wrap mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full pl-2 pr-2 shadow-lg sm:pl-3">
          <a href="/" className="no-wrap flex min-w-0 items-center gap-2.5" aria-label="Content Optimizer home">
            <span className="brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tracking-tight text-white">CO</span>
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-sm font-semibold leading-tight text-slate-100">Content Optimizer</span>
              <span className="hidden whitespace-nowrap text-[11px] leading-tight text-slate-500 sm:block">Bajaj Finserv · SEO &amp; content quality</span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
            {[
              ['#loop', 'How it works'],
              ['#agents', 'Agents'],
              ['#checks', 'Checks'],
              ['#caught', 'Caught in testing'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100">
                {label}
              </a>
            ))}
          </nav>
          <div className="no-wrap flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <a href="/app" onClick={openWorkspace} className={`${primary} h-10 px-4 text-[13px]`}>
              <span className="hidden sm:inline">Open workspace</span>
              <span className="sm:hidden">Open</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </header>
      </div>

      <main>
        {/* Hero */}
        <section className="relative -mt-[4.25rem] overflow-hidden pt-[4.25rem]">
          <div className="lp-mesh" aria-hidden />
          <div className="lp-grid" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-28">
            <div className="min-w-0">
              <Reveal>
                <span className="lp-card inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> For Bajaj Finserv content, SEO and compliance teams
                </span>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] text-slate-100 sm:text-6xl lg:text-[4.25rem]">
                  Rewrite the page.
                  <br />
                  <span className="lp-serif italic text-[1.08em] bg-gradient-to-r from-blue-500 via-violet-500 to-teal-500 bg-clip-text pr-1 text-transparent">Prove</span>{' '}
                  every word.
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-400">
                  Content Optimizer rewrites bajajfinserv.in pages for Google, voice assistants and AI answers. Then five reviewers and a verifier
                  check every change against your guidelines and the original page, and nothing invented gets through.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a href="/app" onClick={openWorkspace} className={`${primary} h-12`}>
                    Open the workspace <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href="#loop" className={`${secondary} h-12`}>See how it works</a>
                </div>
              </Reveal>
              <Reveal delay={0.24}>
                <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-800 pt-6">
                  {[
                    ['9', 'agents'],
                    ['5', 'review gates'],
                    ['0', 'invented figures allowed'],
                  ].map(([n, l]) => (
                    <div key={l}>
                      <dt className="lp-serif text-4xl text-slate-100">{n}</dt>
                      <dd className="mt-1 text-[13px] leading-snug text-slate-500">{l}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
            <Reveal delay={0.15} className="min-w-0">
              <RunReplay />
            </Reveal>
          </div>
        </section>

        {/* Search, voice, AI */}
        <section className="border-y border-slate-800 bg-slate-900/30">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px overflow-hidden px-4 sm:px-6 md:grid-cols-3">
            {[
              { k: 'SEO', t: 'Ranks in search', d: 'Titles, descriptions, headings and keywords people actually type, plus complete schema for rich results.', icon: <Search className="h-5 w-5" />, c: 'text-blue-400' },
              { k: 'AEO', t: 'Answers out loud', d: 'Direct answers up front and real FAQs, so a voice assistant can read out a clear reply.', icon: <Mic className="h-5 w-5" />, c: 'text-teal-400' },
              { k: 'GEO', t: 'Gets quoted by AI', d: 'Concrete, sourced facts and consistent names that AI answer engines can cite.', icon: <MessageSquareQuote className="h-5 w-5" />, c: 'text-violet-400' },
            ].map((x, i) => (
              <Reveal key={x.k} delay={i * 0.06} className="py-10 md:px-6 md:first:pl-0 md:last:pr-0">
                <div className="no-wrap flex items-center gap-3">
                  <span className={x.c}>{x.icon}</span>
                  <span className="font-mono text-[12px] text-slate-500">{x.k}</span>
                </div>
                <h3 className="lp-serif mt-4 text-3xl text-slate-100">{x.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{x.d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* The loop */}
        <section id="loop" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
          <Reveal className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
              Write freely. <span className="lp-serif italic">Review hard.</span>
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-400">
              Checklists make bad first drafts, so the maker writes without one. The checks come afterwards, all of them, every round, and the page is only
              approved when they all pass.
            </p>
          </Reveal>
          <div className="mt-12">
            <LoopDiagram />
          </div>
        </section>

        {/* Agents */}
        <section id="agents" className="relative scroll-mt-24 overflow-hidden border-y border-slate-800 bg-slate-900/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal className="max-w-2xl">
              <Eyebrow>The agents</Eyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
                One writes. <span className="lp-serif italic">Eight keep it honest.</span>
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-slate-400">Pick an agent to see what it does, and whether it works by fixed rules, AI, or both.</p>
            </Reveal>
            <div className="mt-12">
              <AgentRing />
            </div>
          </div>
        </section>

        {/* Checks */}
        <section id="checks" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
          <Reveal className="max-w-2xl">
            <Eyebrow>What gets checked</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
              Rules where possible. <span className="lp-serif italic">AI where needed.</span>
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-400">
              Anything that can be measured is checked by fixed rules, the same way every time. AI reviews only what needs judgement, and must quote the text
              and name the rule before it can block a page.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="mt-10">
            <GateTabs />
          </Reveal>
        </section>

        {/* Caught in testing */}
        <section id="caught" className="relative scroll-mt-24 overflow-hidden border-y border-slate-800 bg-slate-900/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal className="max-w-2xl">
              <Eyebrow>Caught in testing</Eyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
                It says <span className="lp-serif italic">no</span>, so you don’t have to.
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-slate-400">
                Real drafts from test runs on live bajajfinserv.in pages (20 Oct 2026). The AI wrote these; the checks stopped them.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {CAUGHT.map((c, i) => (
                <Reveal key={c.label} delay={i * 0.08}>
                  <figure className="lp-card flex h-full flex-col rounded-3xl p-6">
                    <figcaption className="text-[12px] font-semibold uppercase tracking-[0.14em] text-rose-400">{c.label}</figcaption>
                    <blockquote className="lp-serif mt-4 text-[1.6rem] leading-snug text-slate-100">“{c.quote}”</blockquote>
                    <p className="mt-4 flex-1 text-[14px] leading-relaxed text-slate-400">{c.why}</p>
                    <p className={`mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${FAMILY[c.family].chip}`}>
                      <ShieldCheck className="h-3.5 w-3.5" /> Blocked by {c.blockedBy}
                    </p>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Guidelines + outputs */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Your rules, per product</Eyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
              Every vertical gets <span className="lp-serif italic">its own</span> guidelines.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-400">
              Brand naming, structure, mandatory disclosures, forbidden phrases and approved product facts are set per vertical by the teams who own them, in
              the Guidelines section. Current rates and fees come from those teams, never from the AI.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <Eyebrow>What you get back</Eyebrow>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { t: 'Before and after scores', d: 'The original and the rewrite, scored by the same five gates.', icon: <Gauge className="h-4 w-4" /> },
                { t: 'Every change, explained', d: 'A change log with the reviewer’s note behind each edit.', icon: <GitCompareArrows className="h-4 w-4" /> },
                { t: 'Targeted revisions', d: 'Revise only the title, the intro or one section.', icon: <Repeat className="h-4 w-4" /> },
                { t: 'Ready to publish', d: 'Page preview, Google preview, rebuilt schema, clean HTML.', icon: <Code2 className="h-4 w-4" /> },
              ].map((o) => (
                <div key={o.t} className="lp-card rounded-2xl p-4">
                  <p className="no-wrap flex items-center gap-2 text-[14px] font-semibold text-slate-100">
                    <span className="text-indigo-400">{o.icon}</span>
                    {o.t}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{o.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Verticals marquee */}
        <div className="overflow-hidden border-y border-slate-800 py-5" aria-label="Product pages it is built for">
          <div className="lp-marquee gap-3">
            {[...VERTICALS, ...VERTICALS].map((v, i) => (
              <span key={`${v}-${i}`} className="lp-serif whitespace-nowrap px-4 text-2xl text-slate-500" aria-hidden={i >= VERTICALS.length}>
                {v} <span className="text-slate-700">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <section className="relative overflow-hidden">
          <div className="lp-mesh opacity-70" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
            <Reveal>
              <h2 className="text-4xl font-semibold tracking-[-0.03em] text-slate-100 sm:text-6xl">
                Start with <span className="lp-serif italic">one</span> page.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-slate-400">
                Add your guidelines once, paste a page address, run the pipeline. You’ll see the original’s scores, the rewrite, and exactly what changed and why.
              </p>
              <div className="mt-9 flex justify-center">
                <a href="/app" onClick={openWorkspace} className={`${primary} h-12`}>
                  Open the workspace <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-[12px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Content Optimizer · an internal tool for Bajaj Finserv. A person reviews every page before it is published.</p>
          <div className="flex gap-5">
            <a href="/app" onClick={openWorkspace} className="hover:text-slate-300">Workspace</a>
            <a href="/admin" className="hover:text-slate-300">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
