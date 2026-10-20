import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileSearch,
  PenLine,
  ShieldCheck,
  Repeat,
  ScanSearch,
} from 'lucide-react';
import type { GateResult, OrchestratorReport, PipelineProgressEvent, PipelineRound, FlagSeverity } from '../types';

interface PipelineRunPanelProps {
  report: OrchestratorReport | null;
  isRunning: boolean;
  progress: PipelineProgressEvent[];
  onRun: () => void;
}

const GATE_ORDER = ['agent-2', 'agent-3', 'agent-4', 'agent-5', 'agent-6'] as const;
const GATE_LABEL: Record<string, string> = {
  'agent-2': 'Compliance',
  'agent-3': 'SEO backend',
  'agent-4': 'Keyword & structure',
  'agent-5': 'Customer centricity',
  'agent-6': 'EEAT & GEO',
};

const scoreTone = (s: number) => (s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-rose-400');

const SeverityTag: React.FC<{ severity: FlagSeverity }> = ({ severity }) => {
  const cls =
    severity === 'critical'
      ? 'text-rose-300 border-rose-800 bg-rose-950/40'
      : severity === 'warning'
      ? 'text-amber-300 border-amber-800 bg-amber-950/30'
      : 'text-slate-400 border-slate-700 bg-slate-900';
  return (
    <span className={`inline-block shrink-0 w-[62px] text-center px-1.5 py-px rounded border text-[10.5px] font-medium uppercase tracking-wide ${cls}`}>
      {severity === 'critical' ? 'Critical' : severity === 'warning' ? 'Warning' : 'Low'}
    </span>
  );
};

const GateCell: React.FC<{ gate?: GateResult }> = ({ gate }) => {
  if (!gate) return <td className="px-3 py-2 text-center text-slate-600">—</td>;
  const crit = gate.flags.filter((f) => f.severity === 'critical').length;
  return (
    <td className="px-3 py-2 text-center" title={gate.rationale}>
      <span className="inline-flex items-center gap-1.5">
        {gate.passed ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
        )}
        <span className={`tabular font-medium ${scoreTone(gate.score)}`}>{gate.score}</span>
        {crit > 0 && <span className="text-[11px] text-rose-400 tabular">({crit} crit)</span>}
      </span>
    </td>
  );
};

const STEPS = [
  { key: 'extract', label: 'Extract', agent: 'Agent 1', icon: FileSearch, tone: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { key: 'draft', label: 'Maker draft', agent: 'Agent 7', icon: PenLine, tone: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  { key: 'gates', label: 'Review gates', agent: 'Agents 2–6', icon: ScanSearch, tone: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  { key: 'verify', label: 'Verification', agent: 'Agent 8', icon: ShieldCheck, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { key: 'loop', label: 'Revise or finish', agent: 'Agent 9', icon: Repeat, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
] as const;

const GATE_DOT: Record<string, string> = {
  'agent-2': 'bg-violet-500',
  'agent-3': 'bg-indigo-500',
  'agent-4': 'bg-teal-500',
  'agent-5': 'bg-amber-500',
  'agent-6': 'bg-rose-500',
};

function useElapsed(running: boolean) {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!running) {
      setStart(null);
      return;
    }
    setStart(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return start ? Math.floor((now - start) / 1000) : 0;
}

const fmtSecs = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`);

export const PipelineRunPanel: React.FC<PipelineRunPanelProps> = ({ report, isRunning, progress, onRun }) => {
  const elapsed = useElapsed(isRunning);
  const [openRound, setOpenRound] = useState<number | null>(null);

  const rounds: PipelineRound[] = report?.rounds || [];
  const selected = rounds.find((r) => r.round === report?.selectedRound) || rounds[rounds.length - 1];
  const verdict = report?.finalVerdict;

  // Stage the stepper from live progress while running.
  const activeStage = useMemo(() => {
    const last = progress[progress.length - 1];
    if (!last) return null;
    if (last.stage === 'baseline') return 'gates';
    return last.stage;
  }, [progress]);
  const currentRound = useMemo(() => progress.reduce((m, e) => Math.max(m, e.round || 0), 0), [progress]);

  const before = report?.baselineGates;
  const columns: { label: string; gates?: GateResult[]; round?: PipelineRound }[] = [
    { label: report?.mode === 'revise' ? 'Before' : 'Original', gates: before },
    ...rounds.map((r) => ({ label: `Draft ${r.round}`, gates: r.gates, round: r })),
  ];

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Optimization pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The maker writes freely, five gates review the draft, and the verification gate approves it or sends notes back for revision.
          </p>
        </div>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {isRunning ? `Running · ${fmtSecs(elapsed)}` : report ? 'Run again' : 'Run pipeline'}
        </button>
      </div>

      {/* Stepper */}
      <ol className="grid grid-cols-2 sm:grid-cols-5 border-b border-slate-800">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active =
            isRunning &&
            (activeStage === s.key || (s.key === 'loop' && activeStage === 'draft' && currentRound > 1));
          const doneAll = !isRunning && !!report;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-2.5 px-4 py-2.5 ${i > 0 ? 'border-l border-slate-800' : ''} ${
                active ? 'bg-indigo-950/40' : ''
              }`}
            >
              <span className={`flex items-center justify-center w-7 h-7 rounded-md border shrink-0 ${s.tone} ${active ? 'ring-2 ring-offset-0 ring-current/30' : ''}`}>
                {active ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
              </span>
              <span className="min-w-0">
                <span className={`block text-[12px] font-medium truncate ${active ? 'text-slate-100' : 'text-slate-300'}`}>{s.label}</span>
                <span className="block text-[11px] text-slate-500 truncate">{s.agent}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Live log */}
      {isRunning && (
        <div className="px-4 py-3 space-y-1 max-h-56 overflow-y-auto font-mono text-[12px]">
          {progress.length === 0 && <div className="text-slate-500">Starting…</div>}
          {progress.slice(-14).map((e, i) => (
            <div key={i} className="flex gap-3 text-slate-400">
              <span className="text-slate-600 tabular shrink-0">{new Date(e.at).toLocaleTimeString([], { hour12: false })}</span>
              <span className={e.passed === false ? 'text-rose-300' : e.passed ? 'text-emerald-300' : e.status === 'end' ? 'text-slate-300' : ''}>
                {e.round ? `[draft ${e.round}] ` : ''}
                {e.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Idle, no report yet */}
      {!isRunning && !report && (
        <div className="px-4 py-6 text-sm text-slate-500">
          Fetch a page, then run the pipeline. A typical run makes 1–3 drafts and takes one to four minutes.
        </div>
      )}

      {/* Result */}
      {!isRunning && report && (
        <div className="divide-y divide-slate-800">
          {/* Verdict */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              {verdict === 'APPROVED' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : verdict === 'NOT_QUALIFIED' ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  {report.mode === 'revise' && <span className="text-slate-400 font-normal">{report.scopeLabel} · </span>}
                  {verdict === 'APPROVED'
                    ? 'Approved for publishing'
                    : verdict === 'NOT_QUALIFIED'
                    ? 'Does not qualify yet'
                    : 'Maker could not run'}
                </div>
                <div className="text-xs text-slate-500">
                  {report.note
                    ? report.note
                    : verdict === 'MAKER_UNAVAILABLE'
                    ? report.makerError
                    : `${rounds.length} draft${rounds.length === 1 ? '' : 's'} · showing draft ${report.selectedRound} · ${fmtSecs(Math.round(report.totalDurationMs / 1000))}`}
                </div>
              </div>
            </div>
            {selected && (
              <div className="flex items-center gap-6 text-xs text-slate-500 ml-auto">
                <span>
                  Unsupported figures{' '}
                  <span className={`tabular font-semibold ${selected.verification.unsupportedFigures?.length ? 'text-rose-400' : 'text-slate-300'}`}>
                    {selected.verification.unsupportedFigures?.length || 0}
                  </span>
                </span>
                <span>
                  Blocking issues{' '}
                  <span className={`tabular font-semibold ${selected.verification.blockingIssues?.length ? 'text-amber-400' : 'text-slate-300'}`}>
                    {selected.verification.blockingIssues?.length || 0}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Gate matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="text-left font-medium px-4 py-2">Gate</th>
                  {columns.map((c) => (
                    <th
                      key={c.label}
                      className={`font-medium px-3 py-2 text-center ${c.round && c.round.round === report.selectedRound ? 'text-slate-200' : ''}`}
                    >
                      {c.label}
                      {c.round && c.round.round === report.selectedRound ? ' · selected' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {GATE_ORDER.map((id) => (
                  <tr key={id}>
                    <td className="px-4 py-2 text-slate-300 whitespace-nowrap">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${GATE_DOT[id]}`} />
                      {GATE_LABEL[id]} <span className="text-slate-600 text-[11px]">· {id.replace('agent-', 'Agent ')}</span>
                    </td>
                    {columns.map((c) => (
                      <GateCell key={c.label} gate={c.gates?.find((g) => g.gateId === id)} />
                    ))}
                  </tr>
                ))}
                <tr className="bg-slate-950/30">
                  <td className="px-4 py-2 text-slate-300 whitespace-nowrap">
                    Verification <span className="text-slate-600 text-[11px]">· Agent 8</span>
                  </td>
                  {columns.map((c) => (
                    <td key={c.label} className="px-3 py-2 text-center">
                      {c.round ? (
                        c.round.verification.verdict === 'ACCEPT' ? (
                          <span className="text-emerald-400 font-medium">Approved</span>
                        ) : (
                          <span className="text-rose-400">Rejected</span>
                        )
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Blocking issues */}
          {selected && (selected.verification.blockingIssues?.length || 0) > 0 && (
            <div className="px-4 py-3">
              <h3 className="text-xs font-medium text-slate-300 mb-2">Why draft {selected.round} does not qualify</h3>
              <ul className="space-y-1 text-[13px] text-slate-400">
                {selected.verification.blockingIssues!.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rounds */}
          {rounds.length > 0 && (
            <div className="px-4 py-3 space-y-1.5">
              <h3 className="text-xs font-medium text-slate-300 mb-1">Rounds</h3>
              {rounds.map((r) => {
                const open = openRound === r.round;
                return (
                  <div key={r.round} className="border border-slate-800 rounded-md">
                    <button
                      onClick={() => setOpenRound(open ? null : r.round)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-[13px] hover:bg-slate-800/40"
                    >
                      {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                      <span className="text-slate-200 font-medium">Draft {r.round}</span>
                      <span className="text-slate-500 truncate">{r.draft.h1}</span>
                      <span className="ml-auto flex items-center gap-4 text-xs text-slate-500 shrink-0">
                        <span>
                          Score <span className={`tabular font-medium ${scoreTone(r.overallScore)}`}>{r.overallScore}</span>
                        </span>
                        <span>{r.gates.filter((g) => g.passed).length}/5 gates</span>
                        <span>{r.feedbackToMaker.length} notes</span>
                      </span>
                    </button>
                    {open && (
                      <div className="border-t border-slate-800 px-3 py-2.5 space-y-3">
                        <p className="text-[13px] text-slate-400">{r.verification.reason}</p>
                        {r.feedbackToMaker.length > 0 ? (
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5">Notes sent to the maker</div>
                            <ul className="space-y-1.5">
                              {r.feedbackToMaker.map((n, i) => (
                                <li key={i} className="flex gap-2.5 text-[13px]">
                                  <SeverityTag severity={n.severity} />
                                  <span className="text-slate-300">
                                    {n.issue}
                                    {n.suggestion && <span className="block text-slate-500">→ {n.suggestion}</span>}
                                    <span className="block text-[11px] text-slate-600">{n.source}</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-[13px] text-slate-500">No notes — this draft was approved.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
