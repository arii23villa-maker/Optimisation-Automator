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
| 4 · Keyword & structure gate | Keyword coverage and placement; heading order (one H1 first, H2 → H3 nesting, FAQ last); flags drafts that drop much of the source content. |
| 5 · Customer-centricity gate | Plain language for the reader persona, friction patterns, paragraph and sentence length. |
| 6 · EEAT & GEO gate | Trust signals and how quotable the content is for AI answer engines. |
| 7 · Maker | The only writer. Writes the first draft freely (no gate rules), then revises using the gates' notes. Two rules always apply: never invent facts, and rewrite rather than cut (keep the source's topics and FAQs). |
| 8 · Verification gate | Approves only when all five gates pass, no forbidden phrase is used, and every figure and claim traces back to the source page or approved product facts. |
| 9 · Orchestrator | Runs the loop, keeps scores consistent, streams progress to the UI. |

More detail:

| Doc | What it covers |
|---|---|
| [docs/SETUP-GUIDE.md](docs/SETUP-GUIDE.md) | Step by step for the owner: host on Vercel, set and change API keys, work on it in Claude Code or Google AI Studio |
| [docs/PROJECT-BIBLE.md](docs/PROJECT-BIBLE.md) | What the tool is, its principles, agents, routing, decisions, glossary |
| [docs/HANDOFF.md](docs/HANDOFF.md) | Current status, blockers and the exact next steps |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical flow, router, logging, API, streaming |
| [docs/SECURITY.md](docs/SECURITY.md) | Access control, rate limits, SSRF, prompt injection, signed checkpoints, headers, owner's checklist |
| [docs/BAJAJ-VERTICALS.md](docs/BAJAJ-VERTICALS.md) | The Bajaj Finserv guidelines the real-page test uses (no longer built into the app) |

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env      # then fill in the keys (see below)
npm run dev               # http://localhost:3000
```

The landing page is at `/`, the workspace at `/app`, the admin panel at `/admin`. Then, in the workspace:

1. **Guidelines** tab → add your guidelines (the app ships with none): fill in a section and click **Save as New
   Guideline**, or **Import** a file exported from another browser. See [docs/SETUP-GUIDE.md](docs/SETUP-GUIDE.md) §4.1.
2. **Audit workspace** → enter a `bajajfinserv.in` URL (or use **Paste HTML** for staging/intranet pages) → **Fetch
   page**, and pick your saved guidelines under **Active guidelines**.
3. **Run pipeline.** Progress streams live; the panel shows the verdict, a gate-by-draft score table, blocking issues
   and the notes sent to the maker each round. The best draft is applied; the original stays available for comparison.
4. Use **Revise all** (header), **Remediate section** (per H2) or the SEO backend fix to revise only that part; each
   revision goes through the same gates and verification.
5. **Page preview** shows the page as it stands (page, Google result, clean HTML export).

## Configuration (`.env`)

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | **Yes** | Writes pages (Agent 7) and fact-checks drafts (Agent 8); backup for Groq. Without a working Gemini key, pages are audited but not rewritten. |
| `GROQ_API_KEY` | Recommended | Runs the review gates (2, 5, 6), keyword detection and the H2 optimizer; backup for Gemini. |
| `GEMINI_MODELS` | No | Comma-separated free Gemini models to chain for writing and fact-checking, best first. Default `gemini-2.5-flash,gemini-3.1-flash-lite,gemma-4-31b-it,gemini-3.8-flash`. (Older `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL` still work.) |
| `GEMINI_CHECK_MODELS` | No | Gemini models the review checks use when Groq is busy. Default `gemini-3.1-flash-lite,gemma-4-31b-it,gemini-2.5-flash`. |
| `GROQ_MODEL` / `GROQ_FALLBACK_MODEL` | No | Defaults `openai/gpt-oss-120b` / `openai/gpt-oss-20b`. |
| `GROQ_TPM_LIMIT` | No | Groq tokens-per-minute limit (free tier 8000). Requests that cannot fit are skipped instead of sent. |
| `ADMIN_PASSWORD` | For /admin | Password for the admin panel. The panel is disabled until it is set. |
| `APP_PASSWORD` | No | Site password: the workspace and API need a sign-in; the landing page stays public. |
| `SESSION_SECRET`, `FRAME_ANCESTORS`, `TRUST_PROXY` | No | Signing secret, framing policy, proxy trust. See [docs/SECURITY.md](docs/SECURITY.md). |
| `USD_INR_RATE` | No | Shows rupee estimates next to USD in the admin panel. |
| `USAGE_LOG_DIR` | No | Where usage logs are written (default `data/usage`; on Vercel `/tmp`, which is temporary). Point at persistent storage in production. |
| `FUNCTION_MAX_DURATION` | No | Vercel only: longest one request may run, in seconds (default 300, the Hobby maximum; Pro allows 800). Pipeline runs are split into requests that stop 20 s before it. |
| `PIPELINE_STEP_SECONDS` | No | Local testing: simulate that request limit (for example `280`). |
| `FIRECRAWL_API_KEY` | Recommended | Primary scraper. Without it the server fetches pages directly, which some sites block. |
| `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN` | No | Verified search volumes from Keyword Planner. All five are needed. Without them keywords show "vol. n/a"; volumes are never estimated. |
| `ALLOWED_ORIGINS` | No | Comma-separated origins allowed to call the API cross-origin. Same-origin always works. |

`GET /api/health` reports which integrations are configured (never their values).

## Models and routing

All model calls go through one router (`src/services/llm.ts`). Each job has a first choice and backups:

| Job | First choice | Backups |
|---|---|---|
| Write / revise the page (Agent 7) | Gemini `gemini-2.5-flash` | `gemini-3.1-flash-lite` → `gemma-4-31b-it` → `gemini-3.8-flash` → Groq `gpt-oss-120b` |
| Fact check (Agent 8) | Gemini `gemini-2.5-flash` | same chain |
| Clean up pasted HTML (Agent 1) | Gemini `gemini-2.5-flash` | same chain |
| Review gates 2, 5, 6; keywords; H2 optimizer | Groq `gpt-oss-120b` | Groq `gpt-oss-20b` → `gemini-3.1-flash-lite` → `gemma-4-31b-it` → `gemini-2.5-flash` |

Why: writing and fact-checking read whole pages (often 10–25k tokens) and write long structured output, which
Gemini handles and Groq's free tier (8,000 tokens per minute) cannot. The checks are short and benefit from Groq's
speed and price, which also keeps Gemini's quota for writing. The project uses free tiers only. Each Gemini model has its own free daily quota
on the same key, so the router chains them: 2.5 Flash (best coverage, but only 20 a day), 3.1 Flash-Lite (500),
Gemma 4 31B (~1,500, but 16,000 tokens a minute and often overloaded) and 3.8 Flash (20). When one runs out it is paused and the next takes over (`GEMINI_MODELS`
changes the list).

The router retries a rate limit once when the wait is under 20 s, retries server errors once, tries a model last
for 3 minutes after it times out or keeps failing, pauses a model for 10 minutes after an auth/permission/not-found error, retries unparseable JSON once on the same model and then treats it as a failure, and logs every attempt.

## Admin panel

Open **/admin** (gauge icon in the header) and sign in with `ADMIN_PASSWORD`. One page, refreshed every minute:

- AI calls, estimated cost, tokens, rate-limit hits, backup-model use and pages processed (last 7 days and all time)
- Daily Gemini vs Groq chart (calls, tokens or cost; hover for numbers or switch to a table)
- Per-provider health: status, success rate, typical response time, last success and failure, paused models
- Which provider does which job, with first choice, backups and who actually did the work
- Why rate limits happened, and Groq's remaining daily allowance
- What is failing and why, in plain language with what to do, plus a list of recent failures
- Firecrawl monthly credits (live from Firecrawl), fetches and failures
- Page runs and outcomes (approved / does not qualify / writer unavailable / failed), with time, drafts and cost per run
- Connected services and the price list used for cost estimates

Costs are estimates at list price; free-tier usage is not billed. Usage is logged to `data/usage/*.jsonl`
(git-ignored).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Express + Vite) on port 3000. |
| `npm run build` / `npm start` | Production build to `dist/` and run it. |
| `npm run vercel-build` | Vercel build (run by Vercel via `vercel.json`): the site goes to Vercel's CDN and `server.ts` becomes one function that serves `/api/*`. Output in `.vercel/output/`. See [docs/SETUP-GUIDE.md](docs/SETUP-GUIDE.md). |
| `npm run lint` | TypeScript type check. |
| `npm test` | Unit and pipeline tests (no network, no API key; the model is scripted). |
| `npm run test:e2e` | Real test against 9 live Bajaj Finserv pages (3 products, 3 blogs, 3 articles) through the running server, with the guidelines in `tests/fixtures/bajaj-guidelines.json`; writes [docs/E2E-REPORT.md](docs/E2E-REPORT.md) and each page's before/after content to `docs/e2e-outputs/`. Start `npm run dev` first. `E2E_PAGES=personal-loan,blog-prepay-personal-loan` runs a subset. To test a deployed site, set `BASE_URL` (and `VERCEL_BYPASS_SECRET` if Deployment Protection is on). |
| `npm run theme` | Regenerates `src/theme.css` from `scripts/build-theme.mjs`. |

> On Windows, if the project folder name contains `&`, `npm run` cannot find local binaries. Run them through Node,
> e.g. `node node_modules/tsx/dist/cli.mjs server.ts`.

## Guidelines

The app has **no built-in guidelines**. Each team adds its own in the Guidelines tab (content, product with brand
name, SEO, GEO, structure, customer centricity) with **Save as New Guideline**. They are stored per browser
(`localStorage`); **Export** / **Import** in the Guidelines tab move every saved guideline, in all six sections, as one
JSON file. With no guidelines the review gates still apply the tool's own rules (no invented facts, coverage, heading
order, SEO basics).

Anything in Product guidelines is an approved fact the maker may publish, so rates, fees and limits belong there only
when they're current and approved. The Bajaj Finserv guidelines the real-page test uses are in
`tests/fixtures/bajaj-guidelines.json` (an export file); see [docs/BAJAJ-VERTICALS.md](docs/BAJAJ-VERTICALS.md).

## Project layout

```
server.ts                     Express API + Vite middleware (fetch/extract, keywords, pipeline endpoint)
src/
  App.tsx                     App shell and state; pipeline and revision handlers
  components/                 UI (Header, PipelineRunPanel, ScrapeFixTab, GuidelinesTab, LiveWebpageView, …)
    admin/                    Admin panel (/admin) and its charts
  services/
    agentPipeline.ts          Agents 1–9 and the orchestrator loop
    llm.ts                    LLM router (Gemini + Groq): routing, retries, fallback, cost and token accounting
    usageStore.ts             Append-only usage logs (LLM calls, Firecrawl, runs)
    adminMetrics.ts           Aggregates the logs for the admin panel
    pageDraft.ts              Draft model: markdown/component conversion, heading-order check,
                              fabrication guard, schema builder, revision scopes, change log
    keywordPicker.ts          Deterministic keyword picker (phrases that occur on the page)
    scoringEngine.ts          Section scores and snapshots
    googleAdsKeywordService.ts
  data/
    defaults.ts               Empty guideline templates and neutral limits (title length, sentence length)
    defaultProfiles.ts        Guidelines in the browser: storage, clean-up, export/import file
  lib/api.ts                  API client (honest errors, streaming pipeline client)
  theme.css                   Generated colour system (light default, dark toggle)
tests/                        node:test suites; fixtures/ holds the real-page test's guidelines
scripts/                      e2e-bajaj.ts, build-theme.mjs, build-vercel.mjs
vercel.json                   Tells Vercel to run scripts/build-vercel.mjs
docs/                         Project bible, handoff, architecture, verticals, E2E report and outputs
scraper.py                    Standalone Python scraper (not used by the app)
```

## Security notes

See [docs/SECURITY.md](docs/SECURITY.md) for the full picture. In short:

- Optional site password (`APP_PASSWORD`), admin password, brute-force lockout, per-IP rate limits.
- SSRF guard with every redirect re-checked; page content fenced and screened for prompt injection; signed run
  checkpoints; strict Content-Security-Policy and security headers.

- Secrets live only in `.env` (git-ignored). **Rotate the Firecrawl key and the Google Ads client secret/refresh
  token**: earlier versions of this code had them hard-coded.
- The server only fetches public `http(s)` URLs; private/internal addresses are refused (use Paste HTML instead).
- CORS is closed by default (`ALLOWED_ORIGINS` to open it).
- The tool itself has no login (only `/admin` is password-protected): deploy behind the company SSO/VPN, or on
  Vercel turn on **Vercel Authentication** with scope **All Deployments** (free on every plan).

## Known limitations

- Without a working Gemini key the maker cannot run on full pages (Groq's free tier is too small), so pages are
  audited but not rewritten.
- On Groq's free tier the three review gates compete for 8,000 tokens per minute; expect rate-limit waits
  (visible in the admin panel). Groq's paid Developer tier removes this.
- The verification gate's numeric check is literal: a figure must appear in the source page or Product Guidelines.
  Rephrasings of the same figure in different units may be flagged.
- Guidelines are stored per browser (`localStorage`), not shared between users: use Export / Import in the
  Guidelines tab to move them.
- Free tiers only: the chained Gemini models give about 2,000 requests a day, but each has "high demand"
  spells; when all are busy, runs end `MAKER_UNAVAILABLE` (try again later). Quotas reset at midnight Pacific time.
- When a page has to be written by Flash-Lite (2.5 Flash busy or used up), long pages come out shorter than the
  coverage target and are blocked by the coverage check (see docs/HANDOFF.md).
- On Vercel a request may run at most 300 s (Hobby) or 800 s (Pro). A pipeline run is split into several requests
  that each stay under the limit, so runs complete on either plan; they just take a few requests. Usage logs on
  Vercel are temporary.
