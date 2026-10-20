/**
 * End-to-end test against real Bajaj Finserv pages, through the running server's HTTP API.
 *
 *   1. npm run dev            (in one terminal)
 *   2. npm run test:e2e       (in another)
 *
 * Options (env): BASE_URL (default http://localhost:3000), E2E_PAGES (comma-separated keys or URLs),
 * E2E_REPORT (default docs/E2E-REPORT.md), E2E_MAX_REVISIONS (default 1).
 *
 * What runs depends on configured integrations (GET /api/health):
 *   - always: fetch + extraction, keyword picker, baseline audit by gates 2-6, verdict handling
 *   - with GEMINI_API_KEY: maker drafts, gate loop, verification gate, and a scoped meta revision
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { BAJAJ_PROFILES } from '../src/data/defaultProfiles';
import { checkHeadingStructure, findUnsupportedFigures, parseSchemaBlocks } from '../src/services/pageDraft';

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const REPORT = process.env.E2E_REPORT || 'docs/E2E-REPORT.md';
const MAX_REVISIONS = Number(process.env.E2E_MAX_REVISIONS || 1);

const B = 'https://www.bajajfinserv.in';
const PAGES: Record<string, { url: string; profile: string; type: 'product' | 'blog' | 'article' }> = {
  // Product pages
  'personal-loan': { url: `${B}/personal-loan`, profile: 'bfl-profile-personal-loan', type: 'product' },
  'business-loan': { url: `${B}/business-loan`, profile: 'bfl-profile-business-loan', type: 'product' },
  'home-loan': { url: `${B}/home-loan`, profile: 'bfl-profile-home-loan', type: 'product' },
  'gold-loan': { url: `${B}/gold-loan`, profile: 'bfl-profile-gold-loan', type: 'product' },
  'fixed-deposit': { url: `${B}/fixed-deposit`, profile: 'bfl-profile-fixed-deposit', type: 'product' },
  'insta-emi-card': { url: `${B}/insta-emi-card`, profile: 'bfl-profile-insta-emi-card', type: 'product' },
  // Blogs (en-blogs sitemap)
  'blog-prepay-personal-loan': { url: `${B}/how-to-prepay-personal-loan`, profile: 'bfl-profile-personal-loan', type: 'blog' },
  'blog-first-time-borrowers': { url: `${B}/personal-loan-for-first-time-borrowers`, profile: 'bfl-profile-personal-loan', type: 'blog' },
  'blog-loan-in-10-minutes': { url: `${B}/instant-personal-loan-in-10-minutes`, profile: 'bfl-profile-personal-loan', type: 'blog' },
  // Articles (en-adp sitemap)
  'article-emi-affordability': { url: `${B}/how-much-emi-can-i-afford`, profile: 'bfl-profile-personal-loan', type: 'article' },
  'article-fd-closure': { url: `${B}/fd-closure-process`, profile: 'bfl-profile-fixed-deposit', type: 'article' },
  'article-digital-personal-loan': { url: `${B}/how-salaried-employees-can-get-a-digital-personal-loan`, profile: 'bfl-profile-personal-loan', type: 'article' },
};

/** The default real-test set: 3 product pages, 3 blogs, 3 articles. */
const DEFAULT_SET = [
  'personal-loan', 'fixed-deposit', 'insta-emi-card',
  'blog-prepay-personal-loan', 'blog-first-time-borrowers', 'blog-loan-in-10-minutes',
  'article-emi-affordability', 'article-fd-closure', 'article-digital-personal-loan',
];
const OUTPUT_DIR = process.env.E2E_OUTPUT_DIR || 'docs/e2e-outputs';

type Check = { name: string; ok: boolean; detail: string };
type PageResult = { key: string; url: string; checks: Check[]; summary: Record<string, string | number>; seconds: number };

async function postJson(path: string, body: unknown, timeoutMs = 180_000): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}: ${text.slice(0, 200)}`);
  return json;
}

async function runPipeline(body: any): Promise<{ result: any; events: any[] }> {
  const res = await fetch(`${BASE}/api/run-pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, stream: true }),
    signal: AbortSignal.timeout(20 * 60_000),
  });
  if (!res.ok || !res.body) throw new Error(`run-pipeline HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split('\n').map((l) => JSON.parse(l));
  const err = lines.find((l) => l.type === 'error');
  if (err) throw new Error(err.error);
  return { result: lines.find((l) => l.type === 'result')?.result, events: lines.filter((l) => l.type === 'progress').map((l) => l.event) };
}

function guidelinesFor(profileId: string) {
  const p = BAJAJ_PROFILES.find((x) => x.id === profileId)!;
  return {
    productGuidelines: p.productGuidelines,
    seoGuidelines: p.seoGuidelines,
    contentGuidelines: p.contentGuidelines,
    geoGuidelines: p.geoGuidelines,
    customerCentricityGuidelines: p.customerCentricityGuidelines,
    structureMappingGuidelines: p.structureMappingGuidelines,
    readerContext: p.readerContext,
  };
}

async function testPage(key: string, url: string, profileId: string, gemini: boolean): Promise<PageResult> {
  const started = Date.now();
  const checks: Check[] = [];
  const summary: Record<string, string | number> = {};
  const check = (name: string, ok: boolean, detail = '') => checks.push({ name, ok, detail });
  const g = guidelinesFor(profileId);

  // 1. Fetch + extraction (Agent 1 on the server).
  let fetched: any;
  try {
    fetched = await postJson('/api/fetch-url', { url });
  } catch (e: any) {
    check('Fetch page', false, e.message);
    return { key, url, checks, summary, seconds: Math.round((Date.now() - started) / 1000) };
  }
  const comp = fetched.components?.[0];
  const body: string = comp?.bodyContent || '';
  const words = body.split(/\s+/).filter(Boolean).length;
  summary.type = PAGES[key]?.type || 'custom';
  summary.source = fetched.fetchSource;
  summary.title = fetched.backend?.metaTitle || '';
  summary.words = words;
  summary.h2Sections = comp?.h2Sections?.length || 0;
  summary.faqs = comp?.faqs?.length || 0;
  check('Fetch page', true, `via ${fetched.fetchSource}`);
  check('Has meta title', !!fetched.backend?.metaTitle, fetched.backend?.metaTitle || 'missing');
  check('Has substantial content (≥200 words)', words >= 200, `${words} words`);
  check('Found H2 sections', (comp?.h2Sections?.length || 0) >= 2, `${comp?.h2Sections?.length || 0} sections`);
  const schemaNodes = parseSchemaBlocks(fetched.backend?.schemaJsonLd || '');
  summary.schemaTypes = schemaNodes.map((n: any) => n['@type']).filter(Boolean).join(', ') || 'none';
  const structure = checkHeadingStructure(body);
  summary.structureIssues = structure.map((f) => f.issueTitle).join('; ') || 'none';

  // 2. Keyword picker.
  const kws: any[] = fetched.keywords || [];
  const primary = kws.find((k) => k.priority === 'primary');
  const pageText = `${fetched.backend?.metaTitle} ${fetched.backend?.metaDescription} ${body} ${(comp?.headings || []).map((h: any) => h.text).join(' ')} ${url.replace(/[-/]/g, ' ')}`.toLowerCase();
  summary.primaryKeyword = primary?.keyword || '—';
  summary.keywords = kws.map((k) => k.keyword).join(' | ');
  check('Keywords detected (≥3)', kws.length >= 3, `${kws.length} keywords`);
  check('Primary keyword present', !!primary, primary?.keyword || 'none');
  const missing = kws.filter((k) => !pageText.includes(String(k.keyword).toLowerCase().replace(/\?$/, '')));
  check('Every keyword occurs on the page', missing.length === 0, missing.map((k) => k.keyword).join(', ') || 'all found');
  check('No invented search volumes', kws.every((k) => k.searchVolume === 0 || k.source === 'google_keyword_planner'), '');
  check('No brand-only keyword', !kws.some((k) => /^bajaj( finserv| finance)?$/i.test(k.keyword)), '');

  // 3. Full pipeline with the vertical's guidelines.
  const { result, events } = await runPipeline({
    url,
    backendData: fetched.backend,
    components: fetched.components,
    keywords: kws,
    maxRevisions: MAX_REVISIONS,
    ...g,
  });
  const report = result.report;
  summary.verdict = result.finalVerdict;
  summary.baselineGates = (report.baselineGates || []).map((x: any) => `${x.gateName.replace(' gate', '')} ${x.score}`).join(', ');
  summary.baselineFindings = (report.baselineGates || [])
    .flatMap((x: any) => x.flags.filter((fl: any) => fl.severity !== 'passed').map((fl: any) => `[${x.gateName.replace(' gate', '')} · ${fl.severity}] ${fl.issueTitle}`))
    .join('; ') || 'none';
  const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9₹%]+/g, ' ').replace(/\s+/g, ' ').trim();
  const normPage = ` ${normalize(pageText)} `;
  const falseUnused = (report.baselineGates || [])
    .flatMap((x: any) => x.flags)
    .map((fl: any) => fl.issueTitle.match(/Keyword Unused: "(.+)"/)?.[1])
    .filter((k: string | undefined) => k && normPage.includes(` ${normalize(k)} `));
  check('Keyword gate never calls an on-page keyword "unused"', falseUnused.length === 0, falseUnused.join(', ') || 'ok');
  check('Progress events streamed', events.some((e) => e.stage === 'done'), `${events.length} events`);
  check('Baseline audit by all 5 gates', (report.baselineGates || []).length === 5, '');
  check('Scores agree with gates', result.nineAgentScores?.overallPageScore === result.overallScore, `overall ${result.overallScore}`);

  if (!gemini) {
    check('Maker reports missing key honestly', result.finalVerdict === 'MAKER_UNAVAILABLE' && /GEMINI_API_KEY/.test(report.makerError || ''), report.makerError || '');
    check('Content unchanged without a maker', result.updatedComponents?.[0]?.bodyContent === body, '');
  } else {
    const rounds = report.rounds || [];
    const selected = rounds.find((r: any) => r.round === report.selectedRound);
    summary.drafts = rounds.length;
    summary.before = result.beforeScores?.overallScore;
    summary.after = result.afterScores?.overallScore;
    summary.blocking = (selected?.verification?.blockingIssues || []).join('; ') || 'none';
    check('Maker produced at least one draft', rounds.length >= 1, `${rounds.length} drafts`);
    if (selected) {
      const md = result.updatedComponents[0].bodyContent as string;
      const h1s = (md.match(/^# /gm) || []).length;
      check('Final draft has exactly one H1', h1s === 1, `${h1s}`);
      check('Final draft heading order valid', checkHeadingStructure(md).length === 0, checkHeadingStructure(md).map((f) => f.issueTitle).join('; '));
      const sourceText = `${body}\n${fetched.backend?.metaTitle}\n${fetched.backend?.metaDescription}\n${fetched.backend?.schemaJsonLd}`;
      const invented = findUnsupportedFigures(md, `${sourceText}\n${JSON.stringify(g.productGuidelines)}`);
      check('No figures absent from the source', invented.length === 0, invented.join(', ') || 'none');
      const t = result.updatedBackend.metaTitle || '';
      check('Meta title length 50-60', t.length >= 50 && t.length <= 60, `${t.length} chars: ${t}`);
      const brand = g.productGuidelines.brandName;
      if (brand) check(`Brand "${brand}" in meta title`, new RegExp(brand, 'i').test(t), t);
      check('Approved verdict needs zero blocking issues', result.finalVerdict !== 'APPROVED' || (selected.verification.blockingIssues || []).length === 0, '');

      // Save the actual output for review.
      mkdirSync(OUTPUT_DIR, { recursive: true });
      const notes = rounds.flatMap((r: any) => (r.feedbackToMaker || []).map((n: any) => `- [draft ${r.round}] [${n.severity}] ${n.source}: ${n.issue}`));
      writeFileSync(
        `${OUTPUT_DIR}/${key}.md`,
        [
          `# ${key}`,
          '',
          `Source: ${url}`,
          `Verdict: **${result.finalVerdict}** after ${rounds.length} draft(s) · score ${result.beforeScores?.overallScore} → ${result.afterScores?.overallScore}`,
          '',
          '## Metadata',
          '',
          '| | Before | After |',
          '|---|---|---|',
          `| Title | ${String(fetched.backend?.metaTitle || '').replace(/\|/g, '\\|')} | ${String(result.updatedBackend.metaTitle || '').replace(/\|/g, '\\|')} |`,
          `| Description | ${String(fetched.backend?.metaDescription || '').replace(/\|/g, '\\|')} | ${String(result.updatedBackend.metaDescription || '').replace(/\|/g, '\\|')} |`,
          '',
          '## Blocking issues on the returned draft',
          '',
          ...((selected.verification.blockingIssues || []).length ? selected.verification.blockingIssues.map((b: string) => `- ${b}`) : ['- none']),
          '',
          '## Notes the gates sent to the maker',
          '',
          ...(notes.length ? notes : ['- none']),
          '',
          '## Optimized content',
          '',
          md,
        ].join('\n')
      );

      // 4. Scoped revision: metadata only; the body must not change.
      const revised = await runPipeline({
        url,
        backendData: result.updatedBackend,
        components: result.updatedComponents,
        keywords: kws,
        mode: 'revise',
        reviseScope: { kind: 'meta' },
        maxRevisions: 1,
        ...g,
      });
      const bodyAfter = revised.result.updatedComponents?.[0]?.bodyContent;
      check('Meta revision leaves the body untouched', bodyAfter === md, revised.result.report.note || `verdict ${revised.result.finalVerdict}`);
    }
  }

  return { key, url, checks, summary, seconds: Math.round((Date.now() - started) / 1000) };
}

function renderReport(results: PageResult[], health: any): string {
  const passed = results.reduce((n, r) => n + r.checks.filter((c) => c.ok).length, 0);
  const total = results.reduce((n, r) => n + r.checks.length, 0);
  const lines: string[] = [];
  lines.push('# End-to-end test report — Bajaj Finserv pages', '');
  lines.push(`Run: ${new Date().toISOString()} against \`${BASE}\``, '');
  lines.push(
    `Integrations: Gemini **${health.integrations?.gemini ? 'configured' : 'not configured'}**, Firecrawl **${health.integrations?.firecrawl ? 'configured' : 'not configured'}**, Google Ads **${health.integrations?.googleAds ? 'configured' : 'not configured'}**.`,
    ''
  );
  if (!health.integrations?.gemini) {
    lines.push('> Without `GEMINI_API_KEY` the maker (Agent 7), the LLM parts of gates 2, 5 and 6, and the semantic check in Agent 8 cannot run. This run covers fetching, extraction, keyword picking, the deterministic gate checks, scoring and verdict handling. Re-run `npm run test:e2e` after adding the key to cover the maker loop.', '');
  }
  lines.push(`**${passed}/${total} checks passed.**`, '');
  lines.push('| Page | Checks | Verdict | Primary keyword | Words | Time |', '|---|---|---|---|---|---|');
  for (const r of results) {
    const ok = r.checks.filter((c) => c.ok).length;
    lines.push(`| [${r.key}](${r.url}) | ${ok}/${r.checks.length} | ${r.summary.verdict ?? '—'} | ${r.summary.primaryKeyword ?? '—'} | ${r.summary.words ?? '—'} | ${r.seconds}s |`);
  }
  for (const r of results) {
    lines.push('', `## ${r.key}`, '', `URL: ${r.url}`, '');
    for (const [k, v] of Object.entries(r.summary)) lines.push(`- **${k}**: ${String(v).replace(/\|/g, '\\|')}`);
    lines.push('', '| Check | Result | Detail |', '|---|---|---|');
    for (const c of r.checks) lines.push(`| ${c.name} | ${c.ok ? 'PASS' : '**FAIL**'} | ${c.detail.replace(/\|/g, '\\|').slice(0, 200)} |`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  const gemini = !!health.integrations?.gemini;
  const selection = (process.env.E2E_PAGES || DEFAULT_SET.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const results: PageResult[] = [];
  for (const sel of selection) {
    const entry = PAGES[sel] || { url: sel, profile: 'bfl-profile-personal-loan' };
    const key = PAGES[sel] ? sel : new URL(sel).pathname;
    process.stdout.write(`• ${key} … `);
    try {
      const r = await testPage(key, entry.url, entry.profile, gemini);
      results.push(r);
      console.log(`${r.checks.filter((c) => c.ok).length}/${r.checks.length} checks (${r.seconds}s)`);
    } catch (e: any) {
      results.push({ key, url: entry.url, checks: [{ name: 'Run', ok: false, detail: e.message }], summary: {}, seconds: 0 });
      console.log(`error: ${e.message}`);
    }
  }
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, renderReport(results, health));
  console.log(`\nReport written to ${REPORT}`);
  const failed = results.some((r) => r.checks.some((c) => !c.ok));
  process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
