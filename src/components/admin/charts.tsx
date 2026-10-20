/**
 * Small, dependency-free SVG charts for the admin panel.
 * Colours come from CSS variables defined on .viz-root (see AdminPanel), validated with the
 * dataviz palette checker: Gemini = slot 1 (blue), Groq = slot 2 (orange).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface StackSeries {
  key: string;
  label: string;
  color: string; // CSS colour or var()
}

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : `${Math.round(n * 100) / 100}`;

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/** Stacked columns per day with hover tooltip, legend and an optional table view. */
export const StackedColumns: React.FC<{
  rows: { label: string; values: Record<string, number> }[];
  series: StackSeries[];
  format: (n: number) => string;
  ariaLabel: string;
}> = ({ rows, series, format, ariaLabel }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  // On narrow screens the chart scrolls sideways; start at the most recent day.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [rows, asTable]);
  const W = 720;
  const H = 220;
  const pad = { l: 44, r: 8, t: 10, b: 28 };
  const max = niceMax(Math.max(0, ...rows.map((r) => series.reduce((s, x) => s + (r.values[x.key] || 0), 0))));
  const band = (W - pad.l - pad.r) / Math.max(1, rows.length);
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, max / 2, max];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
        <button onClick={() => setAsTable((v) => !v)} className="text-[12px] underline underline-offset-2" style={{ color: 'var(--text-secondary)' }}>
          {asTable ? 'Show chart' : 'Show as table'}
        </button>
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] tabular">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left font-medium py-1.5 pr-3">Day</th>
                {series.map((s) => (
                  <th key={s.key} className="text-right font-medium py-1.5 px-3">{s.label}</th>
                ))}
                <th className="text-right font-medium py-1.5 pl-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} style={{ borderTop: '1px solid var(--grid)' }}>
                  <td className="py-1.5 pr-3" style={{ color: 'var(--text-secondary)' }}>{r.label}</td>
                  {series.map((s) => (
                    <td key={s.key} className="text-right py-1.5 px-3">{format(r.values[s.key] || 0)}</td>
                  ))}
                  <td className="text-right py-1.5 pl-3 font-medium">{format(series.reduce((a, s) => a + (r.values[s.key] || 0), 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={scroller} className="overflow-x-auto -mx-1 px-1">
        <div className="relative min-w-[560px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--axis)' : 'var(--grid)'} strokeWidth={1} />
                <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)" className="tabular">
                  {compact(t)}
                </text>
              </g>
            ))}
            {rows.map((r, i) => {
              const cx = pad.l + band * i + band / 2;
              let acc = 0;
              const segs = series
                .map((s) => ({ s, v: r.values[s.key] || 0 }))
                .filter((x) => x.v > 0);
              return (
                <g key={r.label}>
                  {/* generous hit target */}
                  <rect x={pad.l + band * i} y={pad.t} width={band} height={H - pad.t - pad.b} fill={hover === i ? 'var(--hover)' : 'transparent'} onMouseEnter={() => setHover(i)} />
                  {segs.map(({ s, v }, j) => {
                    const top = y(acc + v);
                    const bottom = y(acc);
                    acc += v;
                    const h = Math.max(0, bottom - top - (j > 0 ? 2 : 0)); // 2px surface gap between stacked segments
                    const isTop = j === segs.length - 1;
                    const r4 = Math.min(4, h / 2, barW / 2);
                    const x = cx - barW / 2;
                    const yTop = top;
                    const d = isTop
                      ? `M${x},${yTop + h} L${x},${yTop + r4} Q${x},${yTop} ${x + r4},${yTop} L${x + barW - r4},${yTop} Q${x + barW},${yTop} ${x + barW},${yTop + r4} L${x + barW},${yTop + h} Z`
                      : `M${x},${yTop} H${x + barW} V${yTop + h} H${x} Z`;
                    return <path key={s.key} d={d} fill={s.color} pointerEvents="none" />;
                  })}
                  {(i % 2 === 0 || rows.length <= 8) && (
                    <text x={cx} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                      {r.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {hover !== null && rows[hover] && (
            <div
              className="absolute top-1 pointer-events-none rounded-lg px-3 py-2 text-[12px] shadow-lg"
              style={{
                left: `${Math.min(78, Math.max(2, ((pad.l + band * hover + band / 2) / W) * 100 - 10))}%`,
                background: 'var(--tooltip-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="font-medium mb-1">{rows[hover].label}</div>
              {series.map((s) => (
                <div key={s.key} className="flex items-center gap-2 tabular">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span className="ml-auto pl-3 font-medium">{format(rows[hover].values[s.key] || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

/** Horizontal bars for one measure across categories (values labelled at the tip). */
export const HBars: React.FC<{
  rows: { label: string; value: number; sub?: string }[];
  color: string;
  format?: (n: number) => string;
  empty: string;
}> = ({ rows, color, format = (n) => String(n), empty }) => {
  const max = useMemo(() => Math.max(1, ...rows.map((r) => r.value)), [rows]);
  if (!rows.length) return <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{empty}</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} title={`${r.label}: ${format(r.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span style={{ color: 'var(--text-primary)' }}>{r.label}</span>
            <span className="tabular font-medium" style={{ color: 'var(--text-primary)' }}>{format(r.value)}</span>
          </div>
          {r.sub && <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{r.sub}</div>}
          <div className="mt-1 h-2.5 rounded" style={{ background: 'var(--track)' }}>
            <div className="h-2.5 rounded" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

/** Usage meter: fill colour reflects how close to the limit we are. */
export const Meter: React.FC<{ used: number; total: number; label: string }> = ({ used, total, label }) => {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color = pct >= 90 ? 'var(--status-critical)' : pct >= 70 ? 'var(--status-warning)' : 'var(--series-1)';
  return (
    <div>
      <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--track)' }} role="meter" aria-valuenow={used} aria-valuemin={0} aria-valuemax={total} aria-label={label}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] tabular" style={{ color: 'var(--text-muted)' }}>
        <span>0</span>
        <span>{total.toLocaleString()}</span>
      </div>
    </div>
  );
};
