import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Search, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Layers,
  ArrowRight,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { ContentComponent, SEOBackendData, KeywordItem, KeywordDensityItem } from '../types';
import { calculateKeywordDensityComparison } from '../utils/keywordDensity';

interface KeywordDensityComparisonTableProps {
  component?: ContentComponent | null;
  backendData?: SEOBackendData | null;
  keywords?: KeywordItem[];
  title?: string;
  subtitle?: string;
  isCompact?: boolean;
}

export const KeywordDensityComparisonTable: React.FC<KeywordDensityComparisonTableProps> = ({
  component,
  backendData,
  keywords = [],
  title = "Keyword Density & Usage Comparison",
  subtitle = "Scraped Meta Keyword Tags & Target SEO Keywords: Before Scraping vs. After Agent 2 Remediation",
  isCompact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'meta_tag' | 'target_keyword' | 'optimal' | 'improved'>('all');

  const comparison = useMemo(() => {
    return calculateKeywordDensityComparison(component, backendData, keywords);
  }, [component, backendData, keywords]);

  const filteredItems = useMemo(() => {
    return comparison.items.filter(item => {
      const matchesSearch = item.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.intent && item.intent.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'meta_tag') return item.source === 'meta_tag';
      if (filterType === 'target_keyword') return item.source === 'target_keyword' || item.source === 'lsi' || item.source === 'voice_query';
      if (filterType === 'optimal') return item.fixedStatus === 'optimal';
      if (filterType === 'improved') return item.deltaCount > 0;

      return true;
    });
  }, [comparison.items, searchQuery, filterType]);

  const getStatusBadge = (status: 'optimal' | 'low' | 'high' | 'missing', density: number, count: number) => {
    switch (status) {
      case 'optimal':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{density}% ({count}) • Optimal</span>
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{density}% ({count}) • Low</span>
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>{density}% ({count}) • High</span>
          </span>
        );
      case 'missing':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 flex items-center space-x-1">
            <Minus className="w-3 h-3 text-slate-500" />
            <span>0% (0) • Missing</span>
          </span>
        );
    }
  };

  return (
    <div 
      id="keyword-density-comparison-container"
      className="rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden space-y-4"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-slate-50 tracking-tight">
                {title}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {comparison.summary.totalTracked} Keywords Tracked
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Summary Metric Badges */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
            <div className="text-[11px] font-mono uppercase text-slate-400">Scraped Words</div>
            <div className="font-mono font-bold text-slate-200">{comparison.totalScrapedWords}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-900/50 space-y-0.5">
            <div className="text-[11px] font-mono uppercase text-emerald-400">Fixed Words</div>
            <div className="font-mono font-bold text-emerald-300">{comparison.totalFixedWords}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-teal-900/50 space-y-0.5">
            <div className="text-[11px] font-mono uppercase text-teal-400">Optimal Density</div>
            <div className="font-mono font-bold text-teal-300">
              {comparison.summary.scrapedOptimalCount} → {comparison.summary.fixedOptimalCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword, intent, or tag..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-slate-50 placeholder-slate-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({comparison.items.length})
          </button>
          <button
            onClick={() => setFilterType('meta_tag')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center space-x-1 ${
              filterType === 'meta_tag' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3 h-3" />
            <span>Scraped Meta Tags</span>
          </button>
          <button
            onClick={() => setFilterType('target_keyword')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center space-x-1 ${
              filterType === 'target_keyword' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Target Keywords</span>
          </button>
          <button
            onClick={() => setFilterType('optimal')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center space-x-1 ${
              filterType === 'optimal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Optimal (1.0-3.2%)</span>
          </button>
          <button
            onClick={() => setFilterType('improved')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center space-x-1 ${
              filterType === 'improved' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>Increased Density</span>
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="px-6 pb-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wide">
              <th className="py-3 px-3">Keyword & Source</th>
              <th className="py-3 px-3">Priority / Intent</th>
              <th className="py-3 px-3">Scraped (Before)</th>
              <th className="py-3 px-3">Fixed (After Agent 2)</th>
              <th className="py-3 px-3">Density Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                  No matching keywords found. Try clearing your search filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isMetaTag = item.source === 'meta_tag';
                const isPositiveDelta = item.deltaDensity > 0;
                const isZeroDelta = item.deltaDensity === 0;

                return (
                  <tr 
                    key={idx} 
                    className="hover:bg-slate-950/60 transition group"
                  >
                    {/* Keyword Name & Source Badge */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-50 tracking-tight">
                          {item.keyword}
                        </span>
                        {isMetaTag ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-1">
                            <Tag className="w-2.5 h-2.5" />
                            <span>Meta Tag</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1">
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>SEO Target</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Priority & Intent */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-[11px] font-medium text-slate-300">
                          {item.intent ? item.intent.charAt(0).toUpperCase() + item.intent.slice(1) : (isMetaTag ? 'Scraped Tag' : 'Commercial')}
                        </span>
                        {item.searchVolume ? (
                          <span className="text-[11px] font-mono text-slate-400">
                            {item.searchVolume.toLocaleString()} /mo vol
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500">
                            Tag attribute
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Scraped Before */}
                    <td className="py-3.5 px-3">
                      <div>
                        {getStatusBadge(item.scrapedStatus, item.scrapedDensity, item.scrapedCount)}
                      </div>
                    </td>

                    {/* Fixed After */}
                    <td className="py-3.5 px-3">
                      <div>
                        {getStatusBadge(item.fixedStatus, item.fixedDensity, item.fixedCount)}
                      </div>
                    </td>

                    {/* Delta */}
                    <td className="py-3.5 px-3 font-mono">
                      <div className="flex items-center space-x-1.5">
                        {isPositiveDelta ? (
                          <span className="text-emerald-400 font-bold flex items-center">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                            +{item.deltaDensity}% (+{item.deltaCount})
                          </span>
                        ) : isZeroDelta ? (
                          <span className="text-slate-400 font-medium">
                            0.00% (No change)
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                            {item.deltaDensity}% ({item.deltaCount})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
