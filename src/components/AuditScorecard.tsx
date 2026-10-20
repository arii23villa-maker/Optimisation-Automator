import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Mic, 
  Sparkles, 
  Cpu, 
  Bot, 
  Layers, 
  TrendingUp,
  Award,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calculator,
  Scale,
  ArrowRightLeft,
  Package,
  BookOpen,
  Target,
  Users,
  Lock,
  AlertOctagon
} from 'lucide-react';
import { AuditSummary } from '../types';
import { BeforeAfterScorecardSection } from './BeforeAfterScorecardSection';

interface AuditScorecardProps {
  summary: AuditSummary | null;
  hasAudited: boolean;
  isAuditing: boolean;
  isFixing: boolean;
  onRunAudit: () => void;
  onFixAll: () => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const AuditScorecard: React.FC<AuditScorecardProps> = ({
  summary,
  hasAudited,
  isAuditing,
  isFixing,
  onRunAudit,
  onFixAll,
  selectedFilter,
  onSelectFilter,
}) => {
  const [showScoringRubric, setShowScoringRubric] = useState(false);
  const [showBeforeAfterView, setShowBeforeAfterView] = useState(false);

  if (!hasAudited && !isAuditing) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
          <Bot className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-base font-bold text-slate-50">9-Agent Autonomous SEO Pipeline Ready</h3>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Launch 9-Agent Pipeline&quot; to extract all webpage content and evaluate against the 6 finalized guideline sections with deterministic scoring.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={onRunAudit}
            disabled={isAuditing}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg flex items-center space-x-2 transition"
          >
            <Bot className="w-4 h-4" />
            <span>Launch 9-Agent Pipeline</span>
          </button>
        </div>
      </div>
    );
  }

  const score = summary?.overallScore ?? 0;
  const isBlocked = summary?.publishBlocked ?? false;
  const gatingReasons = summary?.gatingViolationReasons || [];

  const getScoreColor = (val: number, blocked: boolean) => {
    if (blocked) return 'text-rose-400 border-rose-500/60 bg-rose-950/40';
    if (val >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (val >= 65) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
  };

  const hasOptimized = summary?.isOptimized || Boolean(summary?.beforeScores);

  return (
    <div className="space-y-6">
      
      {/* View Switcher Header Bar if optimization has occurred */}
      {hasOptimized && (
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Optimization complete! You can view live scorecard or before &amp; after comparison:</span>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowBeforeAfterView(false)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                !showBeforeAfterView 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Current Scorecard
            </button>
            <button
              id="btn-toggle-before-after-scorecard"
              onClick={() => setShowBeforeAfterView(true)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                showBeforeAfterView 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Before &amp; After Scoring Delta</span>
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED BEFORE & AFTER SCORING SECTION */}
      {showBeforeAfterView && summary && (
        <BeforeAfterScorecardSection summary={summary} />
      )}

      {/* STANDARD CURRENT AUDIT SCORECARD */}
      {!showBeforeAfterView && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          
          {/* Top Row: Overall Score & Gating Status */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            
            {/* Main Score Dial / Metric */}
            <div className={`md:col-span-4 flex items-center justify-between p-4 rounded-xl border ${
              isBlocked ? 'bg-rose-950/20 border-rose-800/80' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-18 h-18 rounded-2xl border flex flex-col items-center justify-center font-bold font-mono text-xl shadow-inner ${getScoreColor(score, isBlocked)}`}>
                  {isAuditing ? (
                    <span className="text-sm animate-pulse">Scanning</span>
                  ) : isBlocked ? (
                    <div className="text-center">
                      <span className="text-xs font-black tracking-wide text-rose-300 block">BLOCKED</span>
                      <span className="text-[10px] font-normal text-slate-400">{score}/100</span>
                    </div>
                  ) : (
                    <>
                      <span>{score}</span>
                      <span className="text-[10px] font-normal uppercase tracking-wide text-slate-400">/ 100</span>
                    </>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide font-semibold text-slate-400 flex items-center space-x-1.5">
                    <span>Overall Page Status</span>
                    {!isBlocked && score >= 85 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {isBlocked && <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />}
                  </div>
                  <div className="text-sm font-bold text-slate-50 mt-0.5">
                    {isAuditing 
                      ? 'Pipeline Evaluating...' 
                      : isBlocked 
                        ? 'Publish Blocked (Regulatory Gating)' 
                        : score >= 85 
                          ? 'Optimized & Search-Ready' 
                          : score >= 65 
                            ? 'Needs Content & Schema Polish' 
                            : 'Policy Violations Detected'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {isBlocked 
                      ? 'Open regulatory/forbidden claim flag'
                      : 'Product • Customer • EEAT/GEO • Content • SEO'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowScoringRubric(!showScoringRubric)}
                className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 transition"
                title="How is scoring calculated?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Regulatory Gating Alert Banner (if blocked) */}
            {isBlocked && (
              <div className="md:col-span-8 p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/60 flex items-start space-x-3 text-xs text-rose-200">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-2">
                    <span>REGULATORY GATING ACTIVE: Content cannot be approved for publication</span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-900 text-[11px] font-mono font-bold">Gated</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    A composite score alone does not authorize publishing when open gating rules exist. Active violations:
                  </p>
                  <ul className="list-disc list-inside text-rose-200 font-mono text-[11px] space-y-0.5">
                    {gatingReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 6 Guideline Section Sub-scores (Scoring v2) */}
            {!isBlocked && (
              <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                
                {/* 1. Product Guidelines (25%) */}
                <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
                    <Package className="w-3 h-3 text-rose-400" />
                    <span>Product (25%)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-50">
                    {summary?.productScore ?? summary?.complianceScore ?? '--'}<span className="text-[11px] text-slate-500 font-normal">/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${summary?.productScore ?? summary?.complianceScore ?? 0}%` }} />
                  </div>
                </div>

                {/* 2. Customer-Centricity (20%) */}
                <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
                    <Users className="w-3 h-3 text-indigo-400" />
                    <span>Customer (20%)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-50">
                    {summary?.customerCentricityScore ?? '--'}<span className="text-[11px] text-slate-500 font-normal">/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${summary?.customerCentricityScore || 0}%` }} />
                  </div>
                </div>

                {/* 3. EEAT & GEO Citations (20%) */}
                <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
                    <Award className="w-3 h-3 text-emerald-400" />
                    <span>EEAT/GEO (20%)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-50">
                    {summary?.eeatAndGeoScore ?? summary?.geoEeatScore ?? '--'}<span className="text-[11px] text-slate-500 font-normal">/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${summary?.eeatAndGeoScore ?? summary?.geoEeatScore ?? 0}%` }} />
                  </div>
                </div>

                {/* 4. Content Guidelines (15%) */}
                <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    <span>Content (15%)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-50">
                    {summary?.contentScore ?? '--'}<span className="text-[11px] text-slate-500 font-normal">/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${summary?.contentScore || 0}%` }} />
                  </div>
                </div>

                {/* 5. Structure & Keyword (10%) */}
                <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
                    <Target className="w-3 h-3 text-purple-400" />
                    <span>Structure/KW (10%)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-50">
                    {summary?.structureAndKeywordScore ?? summary?.keywordCoverageScore ?? '--'}<span className="text-[11px] text-slate-500 font-normal">/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${summary?.structureAndKeywordScore ?? summary?.keywordCoverageScore ?? 0}%` }} />
                  </div>
                </div>

                {/* 6. SEO Guidelines (10%) */}
                <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                    <span>SEO (10%)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-50">
                    {summary?.seoScore ?? summary?.seoBackendScore ?? '--'}<span className="text-[11px] text-slate-500 font-normal">/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${summary?.seoScore ?? summary?.seoBackendScore ?? 0}%` }} />
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* 6 GUIDELINE SECTION BREAKDOWN MATRIX (SCORING V2) */}
          <div className="p-4 bg-slate-950/80 border border-indigo-500/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-50 uppercase tracking-wide">
                  Scores Computed Across 6 Guideline Sections (Scoring System v2)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                Filtered Merged Flag List
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {/* 1. Content Guidelines */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">1. Content Guidelines (15%)</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    (summary?.contentScore ?? 80) >= 80 ? 'text-emerald-400 bg-emerald-950/40' : (summary?.contentScore ?? 80) >= 60 ? 'text-amber-400 bg-amber-950/40' : 'text-rose-400 bg-rose-950/40'
                  }`}>
                    {summary?.contentScore ?? '--'}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  Voice, banned words, formatting rules, punctuation, and style adherence.
                </p>
              </div>

              {/* 2. Product Guidelines */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">2. Product Guidelines (25%)</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    isBlocked 
                      ? 'text-rose-300 bg-rose-950 border border-rose-800' 
                      : (summary?.productScore ?? 80) >= 80 ? 'text-emerald-400 bg-emerald-950/40' : 'text-amber-400 bg-amber-950/40'
                  }`}>
                    {isBlocked ? 'GATED' : `${summary?.productScore ?? summary?.complianceScore ?? '--'}/100`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  Locked facts, value propositions, terminology, and regulatory gating rules.
                </p>
              </div>

              {/* 3. SEO Guidelines */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">3. SEO Guidelines (10%)</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    (summary?.seoScore ?? 80) >= 80 ? 'text-emerald-400 bg-emerald-950/40' : 'text-amber-400 bg-amber-950/40'
                  }`}>
                    {summary?.seoScore ?? summary?.seoBackendScore ?? '--'}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  Title &amp; description lengths, JSON-LD schema, canonical order, and sitemaps.
                </p>
              </div>

              {/* 4. Structure & Keyword Mapping */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">4. Structure &amp; Keyword (10%)</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    (summary?.structureAndKeywordScore ?? 80) >= 80 ? 'text-emerald-400 bg-emerald-950/40' : 'text-amber-400 bg-amber-950/40'
                  }`}>
                    {summary?.structureAndKeywordScore ?? summary?.keywordCoverageScore ?? '--'}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  H2 sequence, FAQ structure, search intent fit, and keyword volume coverage.
                </p>
              </div>

              {/* 5. Customer-Centricity */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">5. Customer-Centricity (20%)</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    (summary?.customerCentricityScore ?? 80) >= 80 ? 'text-emerald-400 bg-emerald-950/40' : 'text-amber-400 bg-amber-950/40'
                  }`}>
                    {summary?.customerCentricityScore ?? '--'}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  Plain-language comprehension, journey order, friction removal, and scannability.
                </p>
              </div>

              {/* 6. EEAT and GEO Citations */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">6. EEAT &amp; GEO Citations (20%)</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    (summary?.eeatAndGeoScore ?? 80) >= 80 ? 'text-emerald-400 bg-emerald-950/40' : 'text-amber-400 bg-amber-950/40'
                  }`}>
                    {summary?.eeatAndGeoScore ?? summary?.geoEeatScore ?? '--'}/100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  YMYL trust proof, author credentials, empirical stats, and AI overview capsules.
                </p>
              </div>
            </div>
          </div>

          {/* Scoring Rubric & Calculation Basis Drawer */}
          {showScoringRubric && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-50">
                    Scoring System v2 — Mathematical Rubric &amp; Gating Basis
                  </h4>
                </div>
                <button
                  onClick={() => setShowScoringRubric(false)}
                  className="text-xs text-slate-400 hover:text-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="font-bold text-indigo-300 flex items-center space-x-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Orchestrator Composite Weighting (YMYL Priority)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Weights reflect regulatory/trust risk and reader harm over technical SEO:
                  </p>
                  <div className="font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg text-indigo-200 border border-slate-800 leading-relaxed">
                    Composite = (Product × 0.25) + (Customer × 0.20) + (EEAT_GEO_avg × 0.20) + (Content × 0.15) + (Structure_KW_avg × 0.10) + (SEO × 0.10)
                  </div>
                  <p className="text-[10.5px] text-amber-300 mt-1">
                    * Regulatory Gating Rule: Any open regulatory violation sets display to <strong>BLOCKED</strong> regardless of composite score.
                  </p>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="font-bold text-amber-300 flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Universal Deduction Formula</span>
                  </div>
                  <div className="font-mono text-[11px] bg-slate-950 p-2 rounded-lg text-amber-200 border border-slate-800">
                    Section Score = 100 − Σ(severity_weight × flag_count), floored at 0
                  </div>
                  <ul className="space-y-1 font-mono text-[10.5px] text-slate-300 mt-1">
                    <li>• <strong>General</strong>: High: -15 | Medium: -7 | Low: -3</li>
                    <li>• <strong>Customer-Centricity</strong>: High: -20 | Medium: -7 | Low: -3</li>
                    <li>• <strong>Keyword Coverage</strong>: (Assigned Search Vol / Total Search Vol) × 100</li>
                    <li>• <strong>Agent 8 Verification</strong>: Triage queue ordering (does not alter score)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs & Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
            
            {/* Severity Filters */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => onSelectFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  selectedFilter === 'all'
                    ? 'bg-slate-700 text-slate-50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>All Issues</span>
                <span className="px-1.5 py-0.2 bg-slate-900 rounded-full text-[11px] font-mono">
                  {summary?.totalFlags || 0}
                </span>
              </button>

              <button
                onClick={() => onSelectFilter('critical')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  selectedFilter === 'critical'
                    ? 'bg-rose-900/60 border border-rose-600 text-rose-200'
                    : 'bg-slate-800/60 text-slate-400 hover:text-rose-300'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Critical / Gating</span>
                <span className="px-1.5 py-0.2 bg-rose-950 text-rose-300 rounded-full text-[11px] font-mono">
                  {summary?.criticalCount || 0}
                </span>
              </button>

              <button
                onClick={() => onSelectFilter('warning')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  selectedFilter === 'warning'
                    ? 'bg-amber-900/60 border border-amber-600 text-amber-200'
                    : 'bg-slate-800/60 text-slate-400 hover:text-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Warnings</span>
                <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded-full text-[11px] font-mono">
                  {summary?.warningCount || 0}
                </span>
              </button>

              <button
                onClick={() => onSelectFilter('info')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  selectedFilter === 'info'
                    ? 'bg-blue-900/60 border border-blue-600 text-blue-200'
                    : 'bg-slate-800/60 text-slate-400 hover:text-blue-300'
                }`}
              >
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Improvement</span>
                <span className="px-1.5 py-0.2 bg-blue-950 text-blue-300 rounded-full text-[11px] font-mono">
                  {summary?.infoCount || 0}
                </span>
              </button>
            </div>

            {/* 1-Click Fix All Button (Agent 7 Maker & Agent 8 Verifier) */}
            {summary && summary.totalFlags > 0 && (
              <button
                id="btn-fix-all-scorecard"
                onClick={onFixAll}
                disabled={isFixing || isAuditing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg flex items-center space-x-2 text-xs"
                title="Execute Agent 7 (Optimization Maker) and Agent 8 (Consensus Verifier) auto-remediation loop"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Auto-Remediate All Issues (Agents 7 & 8) ({summary.totalFlags})</span>
              </button>
            )}

          </div>

          {/* Top Strategic Recommendations */}
          {summary?.topRecommendations && summary.topRecommendations.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Agent 1 Strategic Focus:</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {(summary.topRecommendations || []).map((rec, i) => (
                  <li key={i} className="flex items-start space-x-2 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-mono text-indigo-400 text-[11px] font-bold">0{i+1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
