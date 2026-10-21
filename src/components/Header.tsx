import React from 'react';
import {
  Download,
  RefreshCw,
  SlidersHorizontal,
  Globe,
  ArrowRightLeft,
  Play,
  Wand2,
  MonitorSmartphone,
  Sun,
  Moon,
  Gauge,
} from 'lucide-react';
import { navigate } from '../lib/route';

type TabId = 'guidelines' | 'scrape_fix' | 'webpage';
export type ThemeMode = 'light' | 'dark';

interface HeaderProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenExport: () => void;
  onOpenGlobalCompare: () => void;
  onRunAudit: () => void;
  onFixAll: () => void;
  isAuditing: boolean;
  isFixing: boolean;
  totalFlags: number;
  criticalCount: number;
  overallScore: number;
  hasAudited: boolean;
  keywordCount: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const scoreTone = (score: number) =>
  score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';

// Each area has its own accent so the app is easy to scan.
const TAB_ACCENT: Record<TabId, { text: string; bar: string; chip: string }> = {
  guidelines: { text: 'text-violet-400', bar: 'bg-violet-500', chip: 'bg-violet-500/15 text-violet-300' },
  scrape_fix: { text: 'text-indigo-400', bar: 'bg-indigo-500', chip: 'bg-indigo-500/15 text-indigo-300' },
  webpage: { text: 'text-teal-400', bar: 'bg-teal-500', chip: 'bg-teal-500/15 text-teal-300' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenExport,
  onOpenGlobalCompare,
  onRunAudit,
  onFixAll,
  isAuditing,
  isFixing,
  totalFlags,
  criticalCount,
  overallScore,
  hasAudited,
  keywordCount,
  theme,
  onToggleTheme,
}) => {
  const busy = isAuditing || isFixing;

  const tabs: { id: TabId; label: string; short: string; icon: React.ReactNode; meta?: React.ReactNode }[] = [
    {
      id: 'guidelines',
      label: 'Guidelines',
      short: 'Guidelines',
      icon: <SlidersHorizontal className="w-4 h-4" />,
      meta: <span className="tabular">{keywordCount} kw</span>,
    },
    {
      id: 'scrape_fix',
      label: 'Audit workspace',
      short: 'Workspace',
      icon: <Globe className="w-4 h-4" />,
      meta: hasAudited ? <span className="tabular">{totalFlags === 0 ? 'Clear' : `${totalFlags} issues`}</span> : undefined,
    },
    {
      id: 'webpage',
      label: 'Page preview',
      short: 'Preview',
      icon: <MonitorSmartphone className="w-4 h-4" />,
    },
  ];

  const iconButton =
    'flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/70 transition-colors';

  return (
    <>
      <header className="app-header sticky top-0 z-40 backdrop-blur">
        <div className="brand-ribbon" />
        <div className="border-b border-slate-800">
          <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="no-wrap flex items-center justify-between h-14 gap-3">
              {/* Product */}
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
                className="flex items-center gap-2.5 min-w-0"
                title="About Content Optimizer"
              >
                <div className="brand-mark w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] font-semibold tracking-tight shrink-0 shadow-sm">
                  CO
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-semibold text-slate-100 leading-tight whitespace-nowrap">Content Optimizer</h1>
                  <p className="text-[11px] text-slate-500 leading-tight whitespace-nowrap">
                    Bajaj Finserv <span className="hidden sm:inline">· SEO &amp; content quality</span>
                  </p>
                </div>
              </a>

              {/* Desktop navigation */}
              <nav className="hidden md:flex items-stretch h-14 gap-1" aria-label="Primary">
                {tabs.map((t) => {
                  const active = activeTab === t.id;
                  const accent = TAB_ACCENT[t.id];
                  return (
                    <button
                      key={t.id}
                      id={`tab-btn-${t.id === 'scrape_fix' ? 'scrape-fix' : t.id}`}
                      onClick={() => onSelectTab(t.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-2 px-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                        active ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className={active ? accent.text : ''}>{t.icon}</span>
                      <span>{t.label}</span>
                      {t.meta && (
                        <span className={`hidden xl:inline px-1.5 py-px rounded-md text-[11px] font-medium ${active ? accent.chip : 'bg-slate-800 text-slate-400'}`}>
                          {t.meta}
                        </span>
                      )}
                      {active && <span className={`absolute left-2 right-2 bottom-0 h-[3px] rounded-t-full ${accent.bar}`} />}
                    </button>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="no-wrap flex items-center gap-1.5 sm:gap-2 shrink-0">
                {hasAudited && (
                  <div className="hidden xl:flex items-center gap-3 pr-3 mr-1 border-r border-slate-800 text-[12px]">
                    <span className="text-slate-500">
                      Score <span className={`tabular font-semibold ${scoreTone(overallScore)}`}>{overallScore}</span>
                    </span>
                    {criticalCount > 0 && (
                      <span className="text-slate-500">
                        Critical <span className="tabular font-semibold text-rose-400">{criticalCount}</span>
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={onToggleTheme}
                  className={iconButton}
                  title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                  aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>

                <button
                  id="btn-global-compare"
                  onClick={onOpenGlobalCompare}
                  className="hidden lg:flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/70 transition-colors"
                  title="Compare original and optimized page side by side"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="hidden xl:inline">Compare</span>
                </button>

                {hasAudited && totalFlags > 0 && (
                  <button
                    id="btn-fix-all"
                    onClick={onFixAll}
                    disabled={busy}
                    className="flex items-center gap-1.5 h-9 px-2.5 sm:px-3 text-[13px] font-medium rounded-lg text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send the gates' notes to the maker, then re-check with all gates"
                  >
                    {isFixing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    <span className="hidden xl:inline">{isFixing ? 'Revising…' : `Revise all (${totalFlags})`}</span>
                  </button>
                )}

                <button
                  id="btn-run-audit"
                  onClick={onRunAudit}
                  disabled={busy}
                  className="flex items-center gap-1.5 h-9 px-3 sm:px-3.5 text-[13px] font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Run the full pipeline: maker draft, five review gates, verification"
                >
                  {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span className="hidden sm:inline whitespace-nowrap">{isAuditing ? 'Running…' : 'Run pipeline'}</span>
                </button>

                <button id="btn-open-export" onClick={onOpenExport} className={`${iconButton} hidden sm:flex`} title="Export code, schema and report" aria-label="Export">
                  <Download className="w-4 h-4" />
                </button>

                <a href="/admin" className={`${iconButton} hidden sm:flex`} title="Admin panel: usage, costs and health" aria-label="Admin panel">
                  <Gauge className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav
        className="app-header md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            const accent = TAB_ACCENT[t.id];
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-medium ${
                  active ? 'text-slate-100' : 'text-slate-500'
                }`}
              >
                {active && <span className={`absolute top-0 inset-x-6 h-[3px] rounded-b-full ${accent.bar}`} />}
                <span className={active ? accent.text : ''}>{t.icon}</span>
                {t.short}
              </button>
            );
          })}
          <button
            onClick={onOpenExport}
            className="flex flex-col items-center justify-center gap-0.5 h-14 text-[11px] font-medium text-slate-500"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </nav>
    </>
  );
};
