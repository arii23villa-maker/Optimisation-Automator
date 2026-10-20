import React, { useState } from 'react';
import { safeApiPost } from '../lib/api';
import { 
  Globe, 
  ArrowRight, 
  FileCode, 
  CheckCircle, 
  Layers, 
  Sparkles, 
  Code2, 
  Database,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Search,
  Network,
  ListTree,
  ExternalLink,
  ChevronRight,
  X,
  Flame,
  ShieldCheck
} from 'lucide-react';

interface UrlFetcherBarProps {
  currentUrl: string;
  onFetchUrl: (url: string, rawHtml?: string) => Promise<void>;
  isLoading: boolean;
  componentCount: number;
  keywordCount: number;
  autoExtractKeywords?: boolean;
  onToggleAutoExtractKeywords?: (val: boolean) => void;
}

export const UrlFetcherBar: React.FC<UrlFetcherBarProps> = ({
  currentUrl,
  onFetchUrl,
  isLoading,
  componentCount,
  keywordCount,
  autoExtractKeywords = true,
  onToggleAutoExtractKeywords,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl || '');
  const [showHtmlPaste, setShowHtmlPaste] = useState(false);
  const [showSitemapDrawer, setShowSitemapDrawer] = useState(false);
  const [sitemapDomain, setSitemapDomain] = useState('');
  const [isDiscoveringSitemap, setIsDiscoveringSitemap] = useState(false);
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [discoveredSitemaps, setDiscoveredSitemaps] = useState<string[]>([]);
  const [customHtml, setCustomHtml] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!inputUrl.trim() && !customHtml.trim()) {
      setErrorMsg('Please enter a valid website URL or paste HTML.');
      return;
    }

    try {
      if (showHtmlPaste && customHtml.trim()) {
        await onFetchUrl('', customHtml);
        setShowHtmlPaste(false);
      } else {
        await onFetchUrl(inputUrl);
      }
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch and extract content.');
    }
  };

  const handleDiscoverSitemap = async () => {
    const target = (sitemapDomain || inputUrl || currentUrl).trim();
    if (!target) {
      setErrorMsg('Please enter a website URL or domain to discover sitemaps.');
      return;
    }
    setIsDiscoveringSitemap(true);
    setErrorMsg(null);
    try {
      const data = await safeApiPost<{
        success: boolean;
        urls?: string[];
        sitemapsFound?: string[];
        error?: string;
      }>('/api/discover-sitemap', { url: target });

      setDiscoveredUrls(data.urls || []);
      setDiscoveredSitemaps(data.sitemapsFound || []);
      if ((data.urls || []).length === 0) {
        setErrorMsg('No indexed URLs found in sitemaps or robots.txt for this domain.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error running sitemap discovery.');
    } finally {
      setIsDiscoveringSitemap(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Source page</h2>
            <p className="text-xs text-slate-500">
              Agent 1 fetches the page, its metadata and schema. Use pasted HTML for intranet or staging pages.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="w-4 h-4 text-slate-500" />
            </div>
            <input
              id="input-page-url"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://www.bajajfinserv.in/personal-loan"
              className="w-full h-9 pl-9 pr-3 bg-slate-950 border border-slate-700 rounded-md text-slate-100 placeholder-slate-600 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-fetch-url"
              type="submit"
              disabled={isLoading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Fetching…</span>
                </>
              ) : (
                <>
                  <span>Fetch page</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              id="btn-toggle-sitemap-drawer"
              type="button"
              onClick={() => {
                setShowSitemapDrawer(!showSitemapDrawer);
                if (showHtmlPaste) setShowHtmlPaste(false);
                if (!sitemapDomain) setSitemapDomain(inputUrl || currentUrl);
              }}
              className={`h-9 px-3 rounded-md border text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                showSitemapDrawer
                  ? "bg-slate-800 border-slate-600 text-slate-100"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
              title="Discover pages from the site sitemap.xml or robots.txt"
            >
              <ListTree className="w-4 h-4" />
              <span className="hidden sm:inline">Sitemap</span>
            </button>

            <button
              id="btn-toggle-html-paste"
              type="button"
              onClick={() => {
                setShowHtmlPaste(!showHtmlPaste);
                if (showSitemapDrawer) setShowSitemapDrawer(false);
              }}
              className={`h-9 px-3 rounded-md border text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                showHtmlPaste
                  ? "bg-slate-800 border-slate-600 text-slate-100"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
              title="Paste raw HTML directly"
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden sm:inline">Paste HTML</span>
            </button>
          </div>
        </form>

        {/* Sitemap Discovery Drawer */}
        {showSitemapDrawer && (
          <div className="p-4 bg-slate-950 border border-teal-500/40 rounded-xl space-y-3 animate-in fade-in duration-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ListTree className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-semibold text-teal-300">
                  Sitemap & Robots.txt URL Discovery (Scraper Integration)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSitemapDrawer(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={sitemapDomain}
                onChange={(e) => setSitemapDomain(e.target.value)}
                placeholder="Enter domain (e.g. https://apexflow.ai or example.com)"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleDiscoverSitemap}
                disabled={isDiscoveringSitemap || !sitemapDomain.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isDiscoveringSitemap ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning Sitemaps...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Discover Site URLs</span>
                  </>
                )}
              </button>
            </div>

            {discoveredSitemaps.length > 0 && (
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <span className="text-slate-500">Found Sitemaps:</span>
                {discoveredSitemaps.map((sm, idx) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-teal-300 font-mono">
                    {sm}
                  </span>
                ))}
              </div>
            )}

            {discoveredUrls.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
                  <span>Discovered URLs ({discoveredUrls.length}):</span>
                  <span className="text-[11px] text-slate-400">Click any URL to scrape & audit immediately</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {discoveredUrls.slice(0, 50).map((pageUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setInputUrl(pageUrl);
                        setShowSitemapDrawer(false);
                        onFetchUrl(pageUrl);
                      }}
                      className="w-full text-left p-2 bg-slate-900/90 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-700/60 rounded-lg text-xs text-slate-200 hover:text-indigo-200 transition flex items-center justify-between group"
                    >
                      <span className="font-mono truncate mr-2">{pageUrl}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Sample Links for 1-Click Fast Scraping */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="text-slate-500">Examples:</span>
          {[
            { label: 'Personal loan', url: 'https://www.bajajfinserv.in/personal-loan' },
            { label: 'Home loan', url: 'https://www.bajajfinserv.in/home-loan' },
            { label: 'Fixed deposit', url: 'https://www.bajajfinserv.in/fixed-deposit' },
            { label: 'Insta EMI Card', url: 'https://www.bajajfinserv.in/insta-emi-card' },
          ].map((sample) => (
            <button
              key={sample.url}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setErrorMsg(null);
                setInputUrl(sample.url);
                onFetchUrl(sample.url);
              }}
              className="px-2 py-0.5 rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-[11px] disabled:opacity-50"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Custom HTML Drawer */}
        {showHtmlPaste && (
          <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label htmlFor="textarea-raw-html" className="text-xs font-medium text-indigo-300 flex items-center space-x-1.5">
                <FileCode className="w-4 h-4" />
                <span>Paste Raw HTML (for Intranet / Staging / Offline Pages)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Extracts Meta, Schema JSON-LD, Keywords & DOM components
              </span>
            </div>
            <textarea
              id="textarea-raw-html"
              rows={4}
              value={customHtml}
              onChange={(e) => setCustomHtml(e.target.value)}
              placeholder="<html><head><title>...</title></head><body>...</body></html>"
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHtmlPaste(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !customHtml.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                Parse Pasted HTML
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setShowHtmlPaste(true);
                  setErrorMsg(null);
                }}
                className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-[11px] font-medium border border-rose-700/50 transition flex items-center space-x-1"
              >
                <Code2 className="w-3 h-3" />
                <span>Paste Raw HTML</span>
              </button>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                aria-label="Dismiss message"
                className="p-1 hover:bg-rose-900/80 text-rose-300 hover:text-slate-50 rounded-md transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Extraction Status & Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs">
          <div className="min-w-0 text-slate-500">
            {currentUrl ? (
              <span className="font-mono text-[12px] truncate block max-w-xl">
                Source: <span className="text-slate-300">{currentUrl}</span>
              </span>
            ) : (
              <span>No page loaded yet.</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            {onToggleAutoExtractKeywords && (
              <label className="flex items-center gap-1.5 cursor-pointer text-[12px] text-slate-300">
                <input
                  type="checkbox"
                  checked={autoExtractKeywords}
                  onChange={(e) => onToggleAutoExtractKeywords(e.target.checked)}
                  className="w-3.5 h-3.5 accent-indigo-500"
                />
                <span>Auto-detect target keywords</span>
              </label>
            )}
            <span className="flex items-center gap-1.5 text-[12px]">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="tabular text-slate-200">{componentCount}</span> sections
            </span>
            <span className="flex items-center gap-1.5 text-[12px]">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span className="tabular text-slate-200">{keywordCount}</span> keywords
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
