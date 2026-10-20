import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  Layers, 
  Database,
  Share2
} from 'lucide-react';
import { SEOBackendData, ContentComponent, AuditSummary, ProductGuidelines, SEOGuidelines, KeywordItem } from '../types';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendData: SEOBackendData;
  components: ContentComponent[];
  auditSummary: AuditSummary | null;
  productGuidelines: ProductGuidelines;
  keywords: KeywordItem[];
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  backendData,
  components,
  auditSummary,
  productGuidelines,
  keywords,
}) => {
  const [activeTab, setActiveTab] = useState<'html' | 'react' | 'schema' | 'markdown' | 'report'>('html');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate Clean HTML Output
  const generateHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${backendData.metaTitle || ''}</title>
  <meta name="description" content="${backendData.metaDescription || ''}">
  <link rel="canonical" href="${backendData.canonicalUrl || ''}">
  <meta name="robots" content="${backendData.robots || 'index, follow'}">
  ${backendData.tags && backendData.tags.length > 0 ? `<meta name="keywords" content="${backendData.tags.join(', ')}">` : ''}

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${backendData.openGraph?.type || 'website'}">
  <meta property="og:title" content="${backendData.openGraph?.title || backendData.metaTitle}">
  <meta property="og:description" content="${backendData.openGraph?.description || backendData.metaDescription}">
  ${backendData.openGraph?.image ? `<meta property="og:image" content="${backendData.openGraph.image}">` : ''}

  <!-- Twitter -->
  <meta name="twitter:card" content="${backendData.twitterCard?.card || 'summary_large_image'}">
  <meta name="twitter:title" content="${backendData.twitterCard?.title || backendData.metaTitle}">
  <meta name="twitter:description" content="${backendData.twitterCard?.description || backendData.metaDescription}">

  <!-- Schema.org JSON-LD Structured Data -->
  <script type="application/ld+json">
${backendData.schemaJsonLd || '{}'}
  </script>
</head>
<body>
${(components || [])
  .map(
    (c) => `  <!-- Section: ${c.name} -->
  <section id="${c.id}" class="section-${c.type}">
${(c.headings || []).map((h) => `    <${h.tag}>${h.text}</${h.tag}>`).join('\n')}
    <p>${c.bodyContent}</p>
${c.listItems && c.listItems.length > 0 ? `    <ul>\n${(c.listItems || []).map((li) => `      <li>${li}</li>`).join('\n')}\n    </ul>` : ''}
${c.voiceAnswerSnippet ? `    <!-- Voice Search / AEO Direct Answer Snippet -->\n    <div class="voice-answer-snippet" data-aeo="direct-answer">\n      <p>${c.voiceAnswerSnippet}</p>\n    </div>` : ''}
${c.citationSource ? `    <footer class="eeat-citation"><cite>Source: ${c.citationSource}</cite></footer>` : ''}
  </section>`
  )
  .join('\n\n')}

${backendData.ctas && backendData.ctas.length > 0 ? `  <!-- Call-to-Action Links & Buttons -->
  <section class="cta-actions-container" aria-label="Calls to Action">
${backendData.ctas.map(cta => `    <a href="${cta.link}" class="cta-btn ${cta.type === 'Primary CTA' ? 'cta-primary' : 'cta-secondary'}" ${cta.isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}>${cta.text}</a>`).join('\n')}
  </section>` : ''}
</body>
</html>`;
  };

  // Generate React JSX Component Output
  const generateReact = () => {
    return `import React from 'react';
import Head from 'next/head'; // Or standard helmet

export default function OptimizedProductPage() {
  const schemaData = ${backendData.schemaJsonLd || '{}'};

  return (
    <>
      <Head>
        <title>${backendData.metaTitle}</title>
        <meta name="description" content="${backendData.metaDescription}" />
        <link rel="canonical" href="${backendData.canonicalUrl}" />
        <meta name="robots" content="${backendData.robots}" />
        <meta property="og:title" content="${backendData.openGraph?.title || backendData.metaTitle}" />
        <meta property="og:description" content="${backendData.openGraph?.description || backendData.metaDescription}" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>

      <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">
${(components || [])
  .map(
    (c) => `        {/* ${c.name} */}
        <section id="${c.id}" className="space-y-4">
${(c.headings || [])
  .map((h) => {
    const Tag = h.tag;
    return `          <${Tag} className="${
      Tag === 'h1'
        ? 'text-4xl font-extrabold tracking-tight text-slate-900'
        : Tag === 'h2'
        ? 'text-2xl font-bold text-slate-800'
        : 'text-lg font-semibold text-indigo-700'
    }">
            ${h.text}
          </${Tag}>`;
  })
  .join('\n')}
          <p className="text-base text-slate-600 leading-relaxed">
            ${c.bodyContent}
          </p>
${
  c.listItems && c.listItems.length > 0
    ? `          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
${(c.listItems || []).map((li) => `            <li className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 font-medium">✓ ${li}</li>`).join('\n')}
          </ul>`
    : ''
}
${
  c.voiceAnswerSnippet
    ? `          {/* Voice Search Direct Answer Snippet */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-900">
            <strong>Direct Answer:</strong> ${c.voiceAnswerSnippet}
          </div>`
    : ''
}
        </section>`
  )
  .join('\n\n')}

${
  backendData.ctas && backendData.ctas.length > 0
    ? `        {/* Call to Action Actions */}
        <section className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-200">
${backendData.ctas.map(cta => `          <a
            href="${cta.link}"
            className="px-6 py-3 rounded-xl font-semibold text-sm ${cta.type === 'Primary CTA' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}"
            ${cta.isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}
          >
            ${cta.text}
          </a>`).join('\n')}
        </section>`
    : ''
}
      </main>
    </>
  );
}`;
  };

  // Generate Markdown Output
  const generateMarkdown = () => {
    return `# ${backendData.metaTitle}

> **Meta Description**: ${backendData.metaDescription}  
> **Canonical URL**: ${backendData.canonicalUrl}  
> **Target Keywords**: ${(keywords || []).map((k) => `${k.keyword} (${k.searchVolume}/mo)`).join(', ')}

---

${(components || [])
  .map((c) => {
    const headingsMd = (c.headings || [])
      .map((h) => {
        const hashes = h.tag === 'h1' ? '#' : h.tag === 'h2' ? '##' : '###';
        return `${hashes} ${h.text}`;
      })
      .join('\n\n');

    const listMd =
      c.listItems && c.listItems.length > 0
        ? `\n\n${(c.listItems || []).map((li) => `- ${li}`).join('\n')}`
        : '';

    const voiceMd = c.voiceAnswerSnippet
      ? `\n\n> **Voice Search (AEO) Answer**: ${c.voiceAnswerSnippet}`
      : '';

    const eeatMd = c.citationSource ? `\n\n*Source: ${c.citationSource}*` : '';

    return `${headingsMd}\n\n${c.bodyContent}${listMd}${voiceMd}${eeatMd}`;
  })
  .join('\n\n---\n\n')}${
    backendData.ctas && backendData.ctas.length > 0
      ? `\n\n---\n\n## Calls to Action & Conversion Links\n\n${backendData.ctas.map(cta => `- [${cta.text}](${cta.link}) *(${cta.type || 'CTA'} - ${cta.location || 'Page'})*`).join('\n')}`
      : ''
  }`;
  };

  // Generate Report
  const generateReport = () => {
    return JSON.stringify(
      {
        product: productGuidelines.productName,
        category: productGuidelines.category,
        overallScore: auditSummary?.overallScore ?? 0,
        seoScore: auditSummary?.seoScore ?? 0,
        voiceAeoScore: auditSummary?.voiceAeoScore ?? 0,
        geoEeatScore: auditSummary?.geoEeatScore ?? 0,
        backendScore: auditSummary?.backendScore ?? 0,
        metaTitle: backendData.metaTitle,
        metaDescription: backendData.metaDescription,
        keywordsTargeted: keywords,
        schemaTypesConfigured: backendData.schemaTypesFound,
        componentCount: components.length,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  };

  const getContent = () => {
    switch (activeTab) {
      case 'html':
        return generateHtml();
      case 'react':
        return generateReact();
      case 'schema':
        return backendData.schemaJsonLd;
      case 'markdown':
        return generateMarkdown();
      case 'report':
        return generateReport();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = getContent();
    const ext = activeTab === 'html' ? 'html' : activeTab === 'react' ? 'tsx' : activeTab === 'schema' ? 'json' : activeTab === 'markdown' ? 'md' : 'json';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized-page-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-50">Export Optimized Code & Content</h2>
              <p className="text-xs text-slate-400">
                Download or copy clean HTML, React JSX, Schema.org JSON-LD, Markdown, or Audit Report.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-6 gap-2">
          <button
            onClick={() => setActiveTab('html')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'html'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Complete HTML</span>
          </button>
          
          <button
            onClick={() => setActiveTab('react')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'react'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>React / Next.js</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'schema'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Schema JSON-LD</span>
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'markdown'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Markdown Content</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'report'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Audit Report JSON</span>
          </button>
        </div>

        {/* Code View Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950">
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
            {getContent()}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Format: <code className="text-indigo-300 font-mono">.{activeTab === 'html' ? 'html' : activeTab === 'react' ? 'tsx' : activeTab === 'schema' ? 'json' : activeTab === 'markdown' ? 'md' : 'json'}</code>
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
