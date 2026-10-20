import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Code, Copy, Lock, Monitor, Search, Smartphone, Tablet } from 'lucide-react';
import type { ContentComponent, KeywordItem, PageDraft, ProductGuidelines, SEOBackendData } from '../types';
import { componentToDraft } from '../services/pageDraft';

interface LiveWebpageViewProps {
  backendData: SEOBackendData;
  components: ContentComponent[];
  keywords?: KeywordItem[];
  productGuidelines?: ProductGuidelines;
  onBackToAudit?: () => void;
}

type ViewMode = 'page' | 'serp' | 'html';
type Device = 'desktop' | 'tablet' | 'mobile';

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function breadcrumbOf(url: string, h1: string): string[] {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (!parts.length) return ['Home'];
    return ['Home', ...parts.slice(0, -1).map((p) => decodeURIComponent(p).replace(/[-_]+/g, ' ')), h1];
  } catch {
    return ['Home', h1];
  }
}

/** Clean, publishable HTML built only from the page's own content and metadata. */
function buildHtml(d: PageDraft, backend: SEOBackendData): string {
  const sections = d.sections
    .map((s) => {
      const table = s.table
        ? `\n      <table>\n        <thead><tr>${s.table.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>\n        <tbody>\n${s.table.rows
            .map((r) => `          <tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
            .join('\n')}\n        </tbody>\n      </table>`
        : '';
      const bullets = s.bullets.length ? `\n      <ul>\n${s.bullets.map((b) => `        <li>${esc(b)}</li>`).join('\n')}\n      </ul>` : '';
      const h3s = s.h3s
        .map(
          (h) =>
            `\n      <h3>${esc(h.h3)}</h3>${h.paragraphs.map((p) => `\n      <p>${esc(p)}</p>`).join('')}${
              h.bullets.length ? `\n      <ul>\n${h.bullets.map((b) => `        <li>${esc(b)}</li>`).join('\n')}\n      </ul>` : ''
            }`
        )
        .join('');
      return `    <section>\n      <h2>${esc(s.h2)}</h2>${s.paragraphs.map((p) => `\n      <p>${esc(p)}</p>`).join('')}${bullets}${table}${h3s}\n    </section>`;
    })
    .join('\n');
  const faqs = d.faqs.length
    ? `\n    <section>\n      <h2>Frequently asked questions</h2>\n${d.faqs
        .map((f) => `      <h3>${esc(f.question)}</h3>\n      <p>${esc(f.answer)}</p>`)
        .join('\n')}\n    </section>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(backend.metaTitle || d.metaTitle || d.h1)}</title>
  <meta name="description" content="${esc(backend.metaDescription || d.metaDescription)}">${
    backend.canonicalUrl ? `\n  <link rel="canonical" href="${esc(backend.canonicalUrl)}">` : ''
  }${backend.robots ? `\n  <meta name="robots" content="${esc(backend.robots)}">` : ''}${
    backend.schemaJsonLd ? `\n  <script type="application/ld+json">\n${backend.schemaJsonLd}\n  </script>` : ''
  }
</head>
<body>
  <main>
    <h1>${esc(d.h1)}</h1>
${d.intro.map((p) => `    <p>${esc(p)}</p>`).join('\n')}
${sections}${faqs}
  </main>
</body>
</html>`;
}

export const LiveWebpageView: React.FC<LiveWebpageViewProps> = ({ backendData, components, productGuidelines, onBackToAudit }) => {
  const [view, setView] = useState<ViewMode>('page');
  const [device, setDevice] = useState<Device>('desktop');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const draft = useMemo(() => componentToDraft(components[0], backendData), [components, backendData]);
  const url = backendData.canonicalUrl || '';
  const host = hostOf(url);
  const brand = productGuidelines?.brandName || host || 'Preview';
  const html = useMemo(() => (draft ? buildHtml(draft, backendData) : ''), [draft, backendData]);
  const isOptimized = components[0]?.status === 'recently_fixed' || components[0]?.status === 'compliant';

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  if (!draft) {
    return (
      <div className="palette-fixed rounded-xl border border-slate-200 bg-white p-8 sm:p-12 text-center space-y-3">
        <div className="mx-auto w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
          <Monitor className="w-5 h-5" />
        </div>
        <h2 className="text-base font-semibold text-slate-900">Nothing to preview yet</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Fetch a page in the Audit workspace. The preview shows the page exactly as the content stands now: the original, or the
          optimized version after a pipeline run.
        </p>
        {onBackToAudit && (
          <button onClick={onBackToAudit} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Go to workspace
          </button>
        )}
      </div>
    );
  }

  const frame =
    device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[780px]' : 'max-w-5xl';
  const crumbs = breadcrumbOf(url, draft.h1);
  const titleLen = (backendData.metaTitle || draft.metaTitle || '').length;
  const descLen = (backendData.metaDescription || draft.metaDescription || '').length;

  const segBtn = (active: boolean) =>
    `h-8 px-3 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className="palette-fixed space-y-4">
      {/* Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToAudit && (
            <button onClick={onBackToAudit} className="h-8 w-8 rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center" aria-label="Back to workspace">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Page preview</div>
            <div className="text-xs text-slate-500 truncate">
              {isOptimized ? 'Optimized content' : 'Original content'} · {host || 'pasted HTML'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100">
            <button className={segBtn(view === 'page')} onClick={() => setView('page')}>
              <Monitor className="w-3.5 h-3.5" /> Page
            </button>
            <button className={segBtn(view === 'serp')} onClick={() => setView('serp')}>
              <Search className="w-3.5 h-3.5" /> Google
            </button>
            <button className={segBtn(view === 'html')} onClick={() => setView('html')}>
              <Code className="w-3.5 h-3.5" /> HTML
            </button>
          </div>
          {view === 'page' && (
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-slate-100">
              <button className={segBtn(device === 'desktop')} onClick={() => setDevice('desktop')} aria-label="Desktop width">
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button className={segBtn(device === 'tablet')} onClick={() => setDevice('tablet')} aria-label="Tablet width">
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button className={segBtn(device === 'mobile')} onClick={() => setDevice('mobile')} aria-label="Phone width">
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button onClick={copyHtml} className="h-8 px-3 rounded-md bg-slate-900 text-white text-[13px] font-medium flex items-center gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy HTML'}
          </button>
        </div>
      </div>

      {view === 'serp' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-8 space-y-4">
          <div className="max-w-2xl space-y-1">
            <div className="flex items-center gap-2 text-[13px] text-slate-700">
              <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-600">
                {brand.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{url || host}</span>
            </div>
            <div className="text-[20px] leading-snug text-blue-700">{(backendData.metaTitle || draft.metaTitle).slice(0, 60)}{titleLen > 60 ? '…' : ''}</div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {(backendData.metaDescription || draft.metaDescription).slice(0, 160)}
              {descLen > 160 ? '…' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Title <b className={titleLen >= 50 && titleLen <= 60 ? 'text-emerald-700' : 'text-amber-700'}>{titleLen}</b> chars (50–60)
            </span>
            <span>
              Description <b className={descLen >= 140 && descLen <= 160 ? 'text-emerald-700' : 'text-amber-700'}>{descLen}</b> chars (140–160)
            </span>
            <span>Google truncates longer text with “…”.</span>
          </div>
        </div>
      )}

      {view === 'html' && (
        <pre className="rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs leading-relaxed p-4 overflow-auto max-h-[70vh]">
          {html}
        </pre>
      )}

      {view === 'page' && (
        <div className={`mx-auto ${frame} rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden`}>
          {/* Browser chrome */}
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-100 border-b border-slate-200">
            <div className="hidden sm:flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-1.5 h-7 px-3 rounded-md bg-white border border-slate-200 text-xs text-slate-600">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{url || 'Pasted HTML (no URL)'}</span>
            </div>
          </div>

          {/* Page */}
          <article className="px-5 sm:px-10 py-8 sm:py-10 text-slate-800">
            <div className="text-xs font-semibold tracking-wide text-indigo-700 uppercase mb-3">{brand}</div>
            <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span>/</span>}
                  <span className={i === crumbs.length - 1 ? 'text-slate-800 font-medium capitalize' : 'capitalize'}>{c}</span>
                </React.Fragment>
              ))}
            </nav>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">{draft.h1}</h1>
            <div className="mt-4 space-y-3 max-w-3xl">
              {draft.intro.map((p, i) => (
                <p key={i} className={i === 0 ? 'text-base sm:text-lg text-slate-700 leading-relaxed' : 'text-slate-700 leading-relaxed'}>
                  {p}
                </p>
              ))}
            </div>

            <div className="mt-10 space-y-10">
              {draft.sections.map((s, i) => (
                <section key={i} className="max-w-3xl space-y-3">
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">{s.h2}</h2>
                  {s.paragraphs.map((p, j) => (
                    <p key={j} className="text-slate-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
                  {s.bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                      {s.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {s.table && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        {s.table.title && <caption className="text-left px-3 py-2 text-xs font-medium text-slate-500">{s.table.title}</caption>}
                        <thead className="bg-slate-50">
                          <tr>
                            {s.table.headers.map((h, j) => (
                              <th key={j} className="text-left font-semibold text-slate-700 px-3 py-2 border-b border-slate-200">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.table.rows.map((r, j) => (
                            <tr key={j} className="border-b border-slate-100 last:border-0">
                              {r.map((c, k) => (
                                <td key={k} className="px-3 py-2 text-slate-700 align-top">
                                  {c}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {s.h3s.map((h, j) => (
                    <div key={j} className="space-y-2 pt-2">
                      <h3 className="text-lg font-semibold text-slate-900">{h.h3}</h3>
                      {h.paragraphs.map((p, k) => (
                        <p key={k} className="text-slate-700 leading-relaxed">
                          {p}
                        </p>
                      ))}
                      {h.bullets.length > 0 && (
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                          {h.bullets.map((b, k) => (
                            <li key={k}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>
              ))}

              {draft.faqs.length > 0 && (
                <section className="max-w-3xl space-y-3">
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Frequently asked questions</h2>
                  <div className="divide-y divide-slate-200 border-y border-slate-200">
                    {draft.faqs.map((f, i) => {
                      const open = openFaq === i;
                      return (
                        <div key={i}>
                          <button
                            onClick={() => setOpenFaq(open ? null : i)}
                            className="w-full flex items-center justify-between gap-3 py-3 text-left font-medium text-slate-900"
                            aria-expanded={open}
                          >
                            <span>{f.question}</span>
                            <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </button>
                          {open && <p className="pb-4 text-slate-700 leading-relaxed">{f.answer}</p>}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </article>
        </div>
      )}
    </div>
  );
};
