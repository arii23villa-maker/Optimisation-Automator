import React from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Check, 
  Bot, 
  Award, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { FixResult } from '../types';

interface DiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixResult: FixResult | null;
}

export const DiffPreviewModal: React.FC<DiffPreviewModalProps> = ({
  isOpen,
  onClose,
  fixResult,
}) => {
  if (!isOpen || !fixResult) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-50 flex items-center space-x-2">
                <span>Agent 2: Remediation & Optimization Complete</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {(fixResult.fixedFlagIds || []).length} Issues Resolved
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                SEO • AEO Voice Search • GEO LLM Citations • Product Guidelines Enforced
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-50 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-xs sm:text-sm">
          
          {/* AI Explanation Banner */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-300">
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Optimization Strategy & AI Rationale:</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {fixResult.explanation}
            </p>
          </div>

          {/* List of Specific Improvements */}
          {fixResult.improvementsMade && fixResult.improvementsMade.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Key Enhancements Executed:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(fixResult.improvementsMade || []).map((imp, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start space-x-2 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diff Summary If Available */}
          {fixResult.diffSummary && fixResult.diffSummary.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Field Comparison (Before vs. After):</span>
              </h3>
              <div className="space-y-3">
                {(fixResult.diffSummary || []).map((diff, i) => (
                  <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="font-mono text-xs font-semibold text-indigo-300 uppercase">
                      {diff.field}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg space-y-1">
                        <div className="text-[11px] uppercase font-bold text-rose-400">Before</div>
                        <div className="text-slate-300">{diff.before || '(empty / non-compliant)'}</div>
                      </div>
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg space-y-1">
                        <div className="text-[11px] uppercase font-bold text-emerald-400">After (Optimized)</div>
                        <div className="text-slate-100 font-medium">{diff.after}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center space-x-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Changes applied directly to your canvas</span>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md"
          >
            Done & Return to Workspace
          </button>
        </div>

      </div>
    </div>
  );
};
