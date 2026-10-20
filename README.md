# Content Optimizer

Internal Bajaj Finserv tool that optimizes customer pages on `bajajfinserv.in` for search engines, voice search
and AI answer engines (SEO, AEO and GEO), and checks the result against brand, product, compliance and
customer-experience guidelines before it can be published.

It runs a multi-agent pipeline:

```
Agent 1  Extract ──► Agent 7  Maker (free first draft)
                          │
                          ▼
            Agents 2–6  Review gates ──► Agent 8  Verification gate ──► APPROVED
                          ▲                             │
                          └──── notes back to maker ◄───┘  (NOT QUALIFIED → revise, up to N rounds)

                  Agent 9  Orchestrator runs the loop and logs every message
```

| Agent | Role |
|---|---|
| 1 · Extraction | Fetches the page (Firecrawl, with direct-fetch fallback) and extracts metadata, JSON-LD, headings, body, tables and FAQs. Content starts at the page's H1, so site menus are left out. |
| 2 · Compliance gate | Brand and product guidelines: forbidden phrases, mandatory disclosures, terminology, value propositions. |
| 3 · SEO backend gate | Title and description length, brand in title/description, JSON-LD validity, completeness and order, sitemap. |
| 4 · Keyword & structure gate | Keyword coverage and placement; heading order (one H1 first, H2 → H3 nesting, FAQ last). |
| 5 · Customer-centricity gate | Plain language for the reader persona, friction patterns, paragraph and sentence length. |
| 6 · EEAT & GEO gate | Trust signals and how quotable the content is for AI answer engines. |
| 7 · Maker | The only writer. Writes the first draft with full creative freedom (no gate rules), then revises using the gates' notes. It may never invent facts. |
| 8 · Verification gate | Approves only when all five gates pass, no forbidden phrase is used, and every figure and claim traces back to the source page or approved product facts. |
| 9 · Orchestrator | Runs the loop, keeps scores consistent, streams progress to the UI. |

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env      # then fill in the keys (see below)
npm run dev               # http://localhost:3000
```

Then in the app:

1. **Audit workspace** → enter a `bajajfinserv.in` URL (or use **Paste HTML** for staging/intranet pages) → **Fetch page**.
2. Check the **Active guidelines**: pick the Bajaj Finserv vertical (Personal Loan, Home Loan, Fixed Deposit, …).
3. **Run pipeline.** Progress streams live; the panel shows the verdict, a gate-by-draft score table, blocking issues
   and the notes sent to the maker each round. The best draft is applied; the original stays available for comparison.
4. Use **Revise all** (header), **Remediate section** (per H2) or the SEO backend fix to revise only that part; each
   revision goes through the same gates and verification.
5. **Page preview** shows the page as it stands (page, Google result, clean HTML export).

## Configuration (`.env`)

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | **Yes** | The maker (Agent 7), the LLM checks in gates 2, 5 and 6, and Agent 8's semantic fact check. Without it the tool still fetches, extracts and audits deterministically, but cannot write content. |
| `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL` | No | Model overrides. The fallback is used if the primary errors. |
| `FIRECRAWL_API_KEY` | Recommended | Primary scraper. Without it the server fetches pages directly, which some sites block. |
| `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN` | No | Verified search volumes from Keyword Planner. All five are needed. Without them keywords show "vol. n/a"; volumes are never estimated. |
| `ALLOWED_ORIGINS` | No | Comma-separated origins allowed to call the API cross-origin. Same-origin always works. |

`GET /api/health` reports which integrations are configured (never their values).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Express + Vite) on port 3000. |
| `npm run build` / `npm start` | Production build to `dist/` and run it. |
| `npm run lint` | TypeScript type check. |
| `npm test` | Unit and pipeline tests (no network, no API key; the model is scripted). |
| `npm run test:e2e` | End-to-end test against live Bajaj Finserv pages through the running server; writes [docs/E2E-REPORT.md](docs/E2E-REPORT.md). Start `npm run dev` first. |
| `npm run theme` | Regenerates `src/theme.css` from `scripts/build-theme.mjs`. |

> On Windows, if the project folder name contains `&`, `npm run` cannot find local binaries. Run them through Node,
> e.g. `node node_modules/tsx/dist/cli.mjs server.ts`.

## Bajaj Finserv verticals

Built-in guideline presets for Personal Loan, Business Loan, Home Loan, Gold Loan, Fixed Deposit, Insta EMI Card,
Co-branded Credit Cards, Insurance and Mutual Funds. They hold rules, structure and mandatory disclosures but **no
rates, fees or limits**: anything in Product Guidelines is an approved fact the maker may publish, so figures must be
added by each vertical's product team from current approved sources. See [docs/BAJAJ-VERTICALS.md](docs/BAJAJ-VERTICALS.md).

## Project layout

```
server.ts                     Express API + Vite middleware (fetch/extract, keywords, pipeline endpoint)
src/
  App.tsx                     App shell and state; pipeline and revision handlers
  components/                 UI (Header, PipelineRunPanel, ScrapeFixTab, GuidelinesTab, LiveWebpageView, …)
  services/
    agentPipeline.ts          Agents 1–9 and the orchestrator loop
    pageDraft.ts              Draft model: markdown/component conversion, heading-order check,
                              fabrication guard, schema builder, revision scopes, change log
    keywordPicker.ts          Deterministic keyword picker (phrases that occur on the page)
    scoringEngine.ts          Section scores and snapshots
    googleAdsKeywordService.ts
  data/
    bajajVerticals.ts         Bajaj Finserv vertical presets
    defaultProfiles.ts        Built-in presets/profiles and local storage
  lib/api.ts                  API client (honest errors, streaming pipeline client)
  theme.css                   Generated colour system (light default, dark toggle)
tests/                        node:test suites
scripts/                      e2e-bajaj.ts, build-theme.mjs
docs/                         Architecture, verticals, E2E report
scraper.py                    Standalone Python scraper (not used by the app)
```

## Security notes

- Secrets live only in `.env` (git-ignored). **Rotate the Firecrawl key and the Google Ads client secret/refresh
  token**: earlier versions of this code had them hard-coded.
- The server only fetches public `http(s)` URLs; private/internal addresses are refused (use Paste HTML instead).
- CORS is closed by default (`ALLOWED_ORIGINS` to open it).
- There is no authentication: deploy behind the company SSO/VPN.

## Known limitations

- Without `GEMINI_API_KEY` the maker cannot run, so pages are audited but not rewritten.
- The verification gate's numeric check is literal: a figure must appear in the source page or Product Guidelines.
  Rephrasings of the same figure in different units may be flagged.
- Guideline presets are stored per browser (`localStorage`), not shared between users.
