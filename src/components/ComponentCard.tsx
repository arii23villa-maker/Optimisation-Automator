import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Mic, 
  Award, 
  Layers, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Quote, 
  List,
  Check,
  ArrowRightLeft,
  Search,
  CheckCircle
} from 'lucide-react';
import { ContentComponent, AuditFlag, HeadingItem, KeywordItem } from '../types';

interface ComponentCardProps {
  component: ContentComponent;
  flags: AuditFlag[];
  keywords: KeywordItem[];
  onUpdate: (updated: ContentComponent) => void;
  onFixSection: (componentId: string) => void;
  isFixingThis: boolean;
  isFixingAny: boolean;
  onOpenCompare?: (component: ContentComponent) => void;
  onOpenH2Optimizer?: () => void;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  flags,
  keywords,
  onUpdate,
  onFixSection,
  isFixingThis,
  isFixingAny,
  onOpenCompare,
  onOpenH2Optimizer,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newListItem, setNewListItem] = useState('');

  const criticalFlags = flags.filter((f) => f.severity === 'critical');
  const warningFlags = flags.filter((f) => f.severity === 'warning');

  const isRecentlyFixed = component.status === 'recently_fixed';
  const isCompliant = (component.status === 'compliant' || flags.length === 0) && !isRecentlyFixed;
  const isNonCompliant = (flags.length > 0 || component.status === 'non_compliant') && !isRecentlyFixed && !isCompliant;

  // Box highlight styling
  const getContainerBoxClasses = () => {
    if (isRecentlyFixed) {
      return 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-950/10';
    }
    if (isNonCompliant) {
      return 'border-rose-500 ring-2 ring-rose-500/25 bg-rose-950/10';
    }
    return 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-950/10';
  };

  const handleUpdateHeading = (index: number, newText: string) => {
    const updatedHeadings = [...component.headings];
    updatedHeadings[index] = { ...updatedHeadings[index], text: newText };
    onUpdate({ ...component, headings: updatedHeadings });
  };

  const handleAddHeading = (tag: 'h1' | 'h2' | 'h3') => {
    const item: HeadingItem = {
      tag,
      text: tag === 'h1' ? 'New Primary Voice Heading' : tag === 'h2' ? 'New Subtopic H2' : 'How does this benefit my team?',
      voiceIntent: tag === 'h3' ? 'Voice Question' : 'Subtopic',
    };
    onUpdate({ ...component, headings: [...component.headings, item] });
  };

  const handleRemoveHeading = (index: number) => {
    const updatedHeadings = component.headings.filter((_, i) => i !== index);
    onUpdate({ ...component, headings: updatedHeadings });
  };

  const handleAddListItem = () => {
    if (!newListItem.trim()) return;
    const updated = [...(component.listItems || []), newListItem.trim()];
    onUpdate({ ...component, listItems: updated });
    setNewListItem('');
  };

  const handleRemoveListItem = (index: number) => {
    const updated = (component.listItems || []).filter((_, i) => i !== index);
    onUpdate({ ...component, listItems: updated });
  };

  const getComponentTypeBadge = (type: string) => {
    switch (type) {
      case 'hero':
        return { label: 'Hero / H1 Above-The-Fold', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'features':
        return { label: 'Features & USPs (H2s)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'faq':
        return { label: 'Voice Search & FAQ (AEO)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'eeat_proof':
        return { label: 'EEAT Authority & LLM Citations', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: 'Component Section', color: 'bg-slate-700/50 text-slate-300 border-slate-600' };
    }
  };

  const badgeInfo = getComponentTypeBadge(component.type);

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-200 border ${getContainerBoxClasses()}`}>
      
      {/* Component Header */}
      <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className={`p-2 rounded-xl border ${
            isRecentlyFixed 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : isNonCompliant
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-50">
                {component.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeInfo.color}`}>
                {badgeInfo.label}
              </span>
              {isRecentlyFixed ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Remediated by Agent 7 (Verified by Agent 8)</span>
                </span>
              ) : isCompliant ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Compliant & Verified</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>{flags.length} Non-Compliant Flags</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span>{component.headings.length} Headings</span>
              <span>•</span>
              <span>Type: {component.type}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          
          {/* Compare Before vs After */}
          {onOpenCompare && (
            <button
              onClick={() => onOpenCompare(component)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-slate-50 rounded-xl text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
              title="Compare Before and After side-by-side"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Compare Before/After</span>
            </button>
          )}

          {flags.length > 0 && (
            <button
              onClick={() => onFixSection(component.id)}
              disabled={isFixingThis || isFixingAny}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition ${
                isFixingThis
                  ? 'bg-emerald-600/60 text-emerald-100 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Agent 7 Maker rewrites and Agent 8 Verifier validates headings, body, voice answers, and EEAT citations for this component"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>{isFixingThis ? 'Optimizing (Agents 7 & 8)...' : 'Auto-Optimize Section'}</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-50 rounded-lg hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5 bg-slate-900/90">
          
          {/* Agent 1 Diagnostics Flags */}
          {flags.length > 0 && (
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-rose-900/40">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Agent 1 Flags ({flags.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">Click &quot;Fix This Section&quot; to apply AI remediation</span>
              </div>

              <div className="space-y-2 pt-1">
                {(flags || []).map((flag) => (
                  <div
                    key={flag.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      flag.severity === 'critical'
                        ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                        : flag.severity === 'warning'
                        ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                        : 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center space-x-1.5">
                        {flag.severity === 'critical' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{flag.issueTitle}</span>
                      </div>
                      <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                        {flag.category}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{flag.issueDescription}</p>
                    {flag.proposedFixPreview && (
                      <div className="text-[11px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                        <span className="text-emerald-400 font-semibold">Fix preview: </span>
                        {flag.proposedFixPreview}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Headings Hierarchy Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span>Headings & Keyword Hierarchy</span>
              </label>
              <div className="flex gap-1 items-center">
                {onOpenH2Optimizer && (component.headings || []).some(h => h.tag?.toLowerCase() === 'h2') && (
                  <button
                    onClick={onOpenH2Optimizer}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold flex items-center space-x-1 transition mr-1"
                    title="Optimize H2s for Voice Search, AEO, GEO & Keywords"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Optimize H2s</span>
                  </button>
                )}
                {component.type === 'hero' && (
                  <button
                    onClick={() => handleAddHeading('h1')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                  >
                    + H1
                  </button>
                )}
                <button
                  onClick={() => handleAddHeading('h2')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  + H2
                </button>
                <button
                  onClick={() => handleAddHeading('h3')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-medium"
                >
                  + H3 (Voice)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {(component.headings || []).map((heading, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded font-mono text-[11px] font-bold uppercase shrink-0 ${
                    heading.tag === 'h1'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : heading.tag === 'h2'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {heading.tag}
                  </span>
                  <input
                    type="text"
                    value={heading.text}
                    onChange={(e) => handleUpdateHeading(idx, e.target.value)}
                    className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleRemoveHeading(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    title="Remove heading"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Body Content Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Body Content & Paragraphs</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {component.bodyContent.split(/\s+/).filter(Boolean).length} words
              </span>
            </label>
            <textarea
              rows={3}
              value={component.bodyContent}
              onChange={(e) => onUpdate({ ...component, bodyContent: e.target.value })}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              placeholder="Enter section descriptive copy..."
            />
          </div>

          {/* Voice Search Direct Answer Snippet (AEO) */}
          <div className="space-y-1.5 p-3.5 bg-slate-950 rounded-xl border border-purple-900/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span>Voice Search & AEO Direct Answer (40-50 words target)</span>
              </label>
              <span className="text-[11px] font-mono text-purple-300">
                {(component.voiceAnswerSnippet || '').split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={2}
              value={component.voiceAnswerSnippet || ''}
              onChange={(e) => onUpdate({ ...component, voiceAnswerSnippet: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-purple-200 focus:ring-1 focus:ring-purple-500 focus:outline-none leading-relaxed"
              placeholder="Direct conversational answer suitable for voice assistant speech readouts..."
            />
          </div>

          {/* EEAT & Citation Sources (GEO) */}
          <div className="space-y-1.5 p-3.5 bg-slate-950 rounded-xl border border-emerald-900/30">
            <label className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>EEAT Authority & GEO Citation Source</span>
            </label>
            <input
              type="text"
              value={component.citationSource || ''}
              onChange={(e) => onUpdate({ ...component, citationSource: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. ACM Research Paper 2025, SOC-2 Audit Report Q3 2025, Independent Benchmark..."
            />
          </div>

          {/* List Items (Features/Bullets) */}
          {component.listItems && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Bullet Points & Highlights</label>
              <div className="space-y-1.5">
                {(component.listItems || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200">
                    <span className="flex items-center space-x-2">
                      <span className="text-emerald-400">•</span>
                      <span>{item}</span>
                    </span>
                    <button
                      onClick={() => handleRemoveListItem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newListItem}
                  onChange={(e) => setNewListItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddListItem(); } }}
                  placeholder="Add bullet item..."
                  className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-50"
                />
                <button
                  type="button"
                  onClick={handleAddListItem}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 rounded-lg text-xs font-semibold"
                >
                  + Add Bullet
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
