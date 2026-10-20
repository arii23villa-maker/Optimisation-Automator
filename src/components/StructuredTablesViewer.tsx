import React, { useState } from 'react';
import { Table, Copy, Check, Sparkles, Database, Layers } from 'lucide-react';
import { TableData } from '../types';

interface StructuredTablesViewerProps {
  tables?: TableData[];
  onNotifyToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const StructuredTablesViewer: React.FC<StructuredTablesViewerProps> = ({
  tables = [],
  onNotifyToast,
}) => {
  const [copiedTableId, setCopiedTableId] = useState<string | null>(null);

  if (!tables || tables.length === 0) {
    return null;
  }

  const handleCopyMarkdown = (table: TableData) => {
    const headerRow = `| ${table.headers.join(' | ')} |`;
    const separatorRow = `| ${table.headers.map(() => '---').join(' | ')} |`;
    const bodyRows = table.rows.map(r => `| ${r.join(' | ')} |`).join('\n');
    const fullMarkdown = `${headerRow}\n${separatorRow}\n${bodyRows}`;

    navigator.clipboard.writeText(fullMarkdown);
    setCopiedTableId(table.id);
    setTimeout(() => setCopiedTableId(null), 2000);
    onNotifyToast?.('Copied structured table to Markdown!', 'success');
  };

  return (
    <div className="space-y-5">
      {tables.map((table, idx) => (
        <div 
          key={table.id || idx}
          className="rounded-2xl bg-slate-950 border border-teal-500/30 overflow-hidden shadow-lg space-y-3 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Table className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-50">
                  {table.title || `Structured Table Data #${idx + 1}`}
                </span>
                <span className="text-[11px] font-mono text-teal-400 ml-2">
                  ({table.rows.length} rows × {table.headers.length} cols)
                </span>
              </div>
            </div>

            <button
              onClick={() => handleCopyMarkdown(table)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 flex items-center space-x-1 transition"
            >
              {copiedTableId === table.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>{copiedTableId === table.id ? 'Copied' : 'Copy Table'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-[11px] font-mono font-bold text-teal-300 border-b border-teal-900/50">
                  {table.headers.map((h, hIdx) => (
                    <th key={hIdx} className="py-2.5 px-3 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {table.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/50 transition">
                    {row.map((cell, cIdx) => (
                      <td 
                        key={cIdx} 
                        className={`py-2.5 px-3 font-medium ${
                          cIdx === 0 ? 'text-slate-200 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
