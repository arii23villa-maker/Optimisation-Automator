import React, { useState } from 'react';
import { 
  Network, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Key, 
  UserCheck, 
  Award, 
  PenTool, 
  ShieldAlert, 
  RefreshCw, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  Info,
  Sparkles,
  Lock
} from 'lucide-react';
import { AgentMessagePacket, AgentRoleDefinition, InterAgentContractType } from '../types';
import { AGENT_ROLE_DEFINITIONS } from '../services/agentRoles';

interface InterAgentBusViewerProps {
  packets?: AgentMessagePacket[];
  activeAgentFilter?: string;
  onFilterChange?: (agentId: string) => void;
}

export const InterAgentBusViewer: React.FC<InterAgentBusViewerProps> = ({
  packets = [],
  activeAgentFilter = 'all',
  onFilterChange
}) => {
  const [selectedTab, setSelectedTab] = useState<'stream' | 'roles' | 'anti_hallucination'>('stream');
  const [selectedAgent, setSelectedAgent] = useState<string>(activeAgentFilter);
  const [expandedPacketId, setExpandedPacketId] = useState<string | null>(null);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    if (onFilterChange) onFilterChange(agentId);
  };

  const filteredPackets = packets.filter(p => {
    if (selectedAgent === 'all') return true;
    return p.senderAgentId === selectedAgent || p.targetAgentId === selectedAgent;
  });

  const getContractBadge = (type: InterAgentContractType) => {
    switch (type) {
      case 'GROUND_TRUTH_EXTRACT':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full"><FileText className="w-3 h-3" /> Ground Truth Extract</span>;
      case 'COMPLIANCE_CONSTRAINTS':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full"><ShieldAlert className="w-3 h-3" /> Compliance Constraints</span>;
      case 'TECHNICAL_SEO_CONTRACT':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full"><Layers className="w-3 h-3" /> Technical Schema Contract</span>;
      case 'KEYWORD_INTENT_MAP':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full"><Key className="w-3 h-3" /> Keyword Intent Map</span>;
      case 'CUSTOMER_FRICTION_REPORT':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full"><UserCheck className="w-3 h-3" /> Customer Friction Report</span>;
      case 'TRUST_CITATIONS_PROOF':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full"><Award className="w-3 h-3" /> Trust Citations Proof</span>;
      case 'REMEDIATION_DIRECTIVE':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full"><PenTool className="w-3 h-3" /> Remediation Directive</span>;
      case 'PROPOSED_REMEDIATION':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full"><Sparkles className="w-3 h-3" /> Proposed Remediation</span>;
      case 'VERIFICATION_QUALITY_GATE':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" /> Verification Quality Gate</span>;
      case 'ORCHESTRATION_SYNC':
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full"><Network className="w-3 h-3" /> Orchestration Sync</span>;
    }
  };

  const getAgentColor = (agentId: string) => {
    switch (agentId) {
      case 'agent-1': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'agent-2': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'agent-3': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'agent-4': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'agent-5': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'agent-6': return 'text-teal-700 bg-teal-50 border-teal-200';
      case 'agent-7': return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'agent-8': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'agent-9': return 'text-slate-800 bg-slate-100 border-slate-300';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
      {/* Header Bar */}
      <div className="bg-slate-900 text-slate-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-slate-50">9-Agent Inter-Communication Bus & Protocol</h3>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                ZERO-HALLUCINATION PROTOCOL ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict data contracts, anti-hallucination guardrails, and deterministic verification telemetry across all 9 agents.
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setSelectedTab('stream')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedTab === 'stream' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Live Bus Packets ({packets.length})
          </button>
          <button
            onClick={() => setSelectedTab('roles')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedTab === 'roles' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            9-Agent Role Matrix
          </button>
          <button
            onClick={() => setSelectedTab('anti_hallucination')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              selectedTab === 'anti_hallucination' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Anti-Hallucination Guardrails
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE BUS STREAM */}
      {selectedTab === 'stream' && (
        <div className="p-5 space-y-4">
          {/* Agent Filter Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter Agent:
            </span>
            <button
              onClick={() => handleAgentSelect('all')}
              className={`px-2.5 py-1 rounded-md border font-medium transition-all ${
                selectedAgent === 'all'
                  ? 'bg-slate-900 text-slate-50 border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Packets ({packets.length})
            </button>
            {AGENT_ROLE_DEFINITIONS.map(agent => (
              <button
                key={agent.agentId}
                onClick={() => handleAgentSelect(agent.agentId)}
                className={`px-2.5 py-1 rounded-md border font-medium transition-all whitespace-nowrap ${
                  selectedAgent === agent.agentId
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {agent.name.split(':')[0]} ({packets.filter(p => p.senderAgentId === agent.agentId || p.targetAgentId === agent.agentId).length})
              </button>
            ))}
          </div>

          {/* Packet Stream List */}
          {filteredPackets.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <Network className="w-8 h-8 mx-auto text-slate-400 mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-700">No communication packets for current filter</p>
              <p className="text-xs text-slate-500 mt-1">Run an SEO Audit or Scrape & Fix pipeline to record real-time inter-agent messaging.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPackets.map((pkt) => {
                const isExpanded = expandedPacketId === pkt.id;
                return (
                  <div 
                    key={pkt.id} 
                    className="border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-all shadow-sm overflow-hidden"
                  >
                    <div 
                      onClick={() => setExpandedPacketId(isExpanded ? null : pkt.id)}
                      className="p-3.5 cursor-pointer bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                          #{pkt.packetNumber}
                        </span>

                        {/* Sender & Target Badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getAgentColor(pkt.senderAgentId)}`}>
                            {pkt.senderName.split(':')[0]}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getAgentColor(pkt.targetAgentId)}`}>
                            {pkt.targetName.split(':')[0]}
                          </span>
                        </div>

                        {/* Contract Badge */}
                        <div className="hidden sm:block shrink-0">
                          {getContractBadge(pkt.contractType)}
                        </div>

                        {/* Summary */}
                        <div className="truncate text-xs font-medium text-slate-700 flex-1">
                          {pkt.summary}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Anti-Hallucination Status Indicator */}
                        <div className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Grounded</span>
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                          {pkt.confidenceScore}% conf
                        </span>

                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Packet Details */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 bg-white space-y-3 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h5 className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-indigo-600" /> Contract Payload Detail
                            </h5>
                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                              {pkt.payloadSummary}
                            </p>
                          </div>

                          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
                            <h5 className="font-semibold text-emerald-900 mb-1 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Anti-Hallucination Verification Guard
                            </h5>
                            <ul className="space-y-1 text-emerald-800">
                              <li className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Grounding Sources: {pkt.antiHallucinationGuard.groundingSources.join(', ')}</span>
                              </li>
                              <li className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Zero Forbidden Words Enforced: {pkt.antiHallucinationGuard.zeroForbiddenWordsVerified ? 'Yes (100% Passed)' : 'Violations Flagged'}</span>
                              </li>
                              <li className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Hallucination Risk: <strong className="uppercase font-bold text-emerald-700">{pkt.antiHallucinationGuard.hallucinationRisk}</strong></span>
                              </li>
                              <li className="text-[11px] text-emerald-700/90 italic pt-1">
                                Note: {pkt.antiHallucinationGuard.notes}
                              </li>
                            </ul>
                          </div>
                        </div>

                        {pkt.dataPayload && (
                          <div className="p-2.5 bg-slate-900 rounded-lg text-slate-200 font-mono text-[11px] overflow-x-auto">
                            <div className="text-slate-400 text-[11px] uppercase font-bold mb-1">Raw Payload Object</div>
                            <pre>{JSON.stringify(pkt.dataPayload, null, 2)}</pre>
                          </div>
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

      {/* TAB 2: 9-AGENT ROLE DEFINITION MATRIX */}
      {selectedTab === 'roles' && (
        <div className="p-5 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Immutable Agent Boundaries:</strong> Each agent has a single, well-defined authority. Only Agent 7 has write authority to modify copy, Agent 8 acts as the deterministic quality gate, Agents 2-6 perform parallel evaluation, Agent 1 provides the ground-truth anchor, and Agent 9 orchestrates state transitions.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGENT_ROLE_DEFINITIONS.map(agent => (
              <div 
                key={agent.agentId}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getAgentColor(agent.agentId)}`}>
                      {agent.name.split(':')[0]}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {agent.authorityLevel}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-1">{agent.role}</h4>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">{agent.primaryResponsibility}</p>

                  <div className="space-y-2 text-[11px] mb-3">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Input Contracts:</span>
                      <div className="flex flex-wrap gap-1">
                        {agent.inputContracts.map((ic, i) => (
                          <span key={i} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                            {ic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Output Contracts:</span>
                      <div className="flex flex-wrap gap-1">
                        {agent.outputContracts.map((oc, i) => (
                          <span key={i} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-700 font-medium">
                            {oc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2.5 mt-2 bg-white -mx-4 -mb-4 p-3 rounded-b-xl">
                  <span className="text-[11px] uppercase font-bold text-emerald-700 flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Anti-Hallucination Guardrails:
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-0.5">
                    {agent.antiHallucinationRules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ANTI-HALLUCINATION GUARDRAILS SPECIFICATION */}
      {selectedTab === 'anti_hallucination' && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Deterministic Grounding</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Agent 1 extracts factual content and DOM elements without interpretative alteration. Downstream evaluators (Agents 2-6) quote exact text strings from the extracted source and verify claims against uploaded product guidelines.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Zero Forbidden Words Enforced</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Agent 2 enforces prohibited words, superlatives (&quot;world&apos;s best&quot;), and ungrounded claims. When Agent 7 rewrites copy, Agent 8 runs an automated deterministic regex scan to reject any forbidden phrase instantly.
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-2">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>Maker-Checker Quality Loop</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Agent 7 (The Maker) produces candidate rewrites that are passed to Agent 8 (The Checker) with exact failure context. If Agent 8 issues a REJECT verdict, Agent 7 retries with structured feedback to guarantee factual fidelity.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Inter-Agent Communication Flow Architecture
            </h4>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200 font-medium">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                <span>1. Agent 1 (Extraction)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                <span>2. Agents 2, 3, 4, 5, 6 (Parallel Scoring)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1.5 text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                <span>3. Agent 9 (Message Bus & Deduplication)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1.5 text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                <span>4. Agent 7 (Maker Rewrite)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                <span>5. Agent 8 (Checker Quality Gate)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
