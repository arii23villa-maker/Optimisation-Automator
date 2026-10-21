# Project Bible — Content Optimizer

The single source of truth for what this tool is, how it works, and why it is built the way it is.
For the current status and next steps, see [HANDOFF.md](HANDOFF.md).

---

## 1. What it is

An **internal Bajaj Finserv tool** that optimizes customer pages on `bajajfinserv.in` (product pages, blogs,
articles) for search engines, voice search and AI answer engines (SEO, AEO, GEO). It also checks the result against
brand, product, compliance and customer-experience guidelines before it can be published.

- **Users:** Bajaj Finserv content, SEO and product teams (non-technical); an admin for usage and costs.
- **Repository:** https://github.com/arii23villa-maker/Optimisation-Automator (branch `main`; currently **public**).
- **Origin:** started as a Google AI Studio "2-agent" demo; rebuilt into a 9-agent pipeline with an enterprise UI.

## 2. Core principles (non-negotiable)

1. **The maker is free; the gates review afterwards.** Agent 7 writes the first draft with full creative freedom.
   Its prompt contains no gate rules. Gates 2–6 audit the draft *after* it is written and send notes back. *Why: the
   owner found that constraining the maker up front produced poor content.*
2. **Never invent facts.** Every figure, rate, fee, claim, credential or name must come from the source page or
   approved product facts, including worked examples and contact details. A figure that isn't in the source
   **blocks approval**. This is one of the two rules the maker always carries: it's about truth, not style.
3. **Rewrite, don't cut.** The maker keeps everything the source covers (topics, steps, fees, disclaimers, FAQs);
   structure, order and wording are its call, and only repetition should go. The maker is given the source's
   size as a target. Gate 4 compares the body (without FAQs) by words: below 70% of the source body is a warning,
   below 50% blocks approval; keeping fewer than 60% of the FAQs is a warning. *Why: in the first real test the maker
   cut a 2,666-word page with 25 FAQs to ~800 words and 3 FAQs. "Don't cut" alone didn't help; a number did (20 of
   25 FAQs kept). FAQs were 60% of that page's words, so they're counted separately.*
3a. **Notes that need an editor go to editors, not the maker.** A gate finding whose fix needs information that
   isn't on the page (a phone number, an example calculation, an author's credentials) is marked
   `needsEditorInput` and shown in the UI, but never sent to the maker. *Why: sent to the maker, these notes made it
   invent a toll-free number and an EMI example in the first real test.*
4. **Never show fabricated data as real.** No synthetic pages when a fetch fails, no estimated search volumes
   (0 / "vol. n/a" until Google Ads verifies), no fake "fixed" scores. Before and after scores both come from real
   gate audits.
5. **Brand naming is per vertical, from evidence.** There's no global "Finserv → Finance" rewrite. Live
   `bajajfinserv.in` lending titles use "| Bajaj Finance"; the legal entity is named in disclosures.
6. **Rates, fees or limits go in guidelines only when current and approved.** Product Guidelines are "approved facts" the maker may
   publish, so a stale rate would reach live pages. Product teams add current figures themselves.
7. **Plain language everywhere in the UI.** A layman should understand every screen, especially the admin panel.

## 3. The agents

| # | Agent | Kind | What it does |
|---|---|---|---|
| 1 | Extraction | deterministic (+ LLM only for pasted HTML) | Fetches the page and extracts metadata, raw JSON-LD, headings, body, tables and FAQs; content starts at the H1 |
| 2 | Compliance gate | LLM + rules | Brand and product rules: forbidden phrases, disclosures, terminology, value propositions |
| 3 | SEO backend gate | rules | Title/description length, brand in title/description, JSON-LD validity, completeness and order, sitemap |
| 4 | Keyword & structure gate | rules | Keyword coverage and placement; heading order (one H1 first, H2 → H3 nesting, FAQ last); content coverage of maker drafts against the source |
| 5 | Customer-centricity gate | LLM + rules | Plain language for the reader persona, friction, dense paragraphs, run-on sentences |
| 6 | EEAT & GEO gate | LLM + rules | Trust signals and how quotable the content is for AI answer engines |
| 7 | Maker | LLM | The only writer: free first draft, then revisions from the notes |
| 8 | Verification gate | rules + LLM | Approves only if all 5 gates pass, there are no forbidden phrases, no unsupported figures or claims, and every AI review actually ran |
| 9 | Orchestrator | deterministic | Runs the loop, keeps scores consistent, streams progress, logs every message |

## 4. Pipeline flow

**Optimize** (`POST /api/run-pipeline`):

1. Agent 1 extracts the page.
2. Gates 2–6 audit the **original** page (baseline score), while Agent 7 writes draft 1 in parallel.
3. Gates 2–6 audit the draft, then Agent 8 decides.
4. If the draft is NOT QUALIFIED, Agent 8's prioritised notes go to Agent 7, which revises. Repeat up to
   `maxRevisions` (default 2, so at most 3 drafts).
5. The approved draft, or the best-scoring one, is applied in the UI. The original stays in `originalSnapshot` for
   diffs.

**Steps and checkpoints** (`runPipelineStep` in `agentPipeline.ts`): the run is a sequence of steps (baseline +
first draft → gates → verify → draft → gates → verify …). Each step keeps its results only when it finishes. On
Vercel, where one request may run 300 s (Hobby) or up to 800 s (Pro), the server stops 20 s before the limit, either
between steps or by abandoning the step in progress, and returns a **checkpoint** (all progress so far, as JSON).
The browser sends the same request again with `resume: checkpoint` and the run continues, so a long run takes a few
requests but nothing is skipped or shortened. Locally and on servers without a limit the run is one request.
A step that can't finish within a whole request three times in a row ends the run with a clear error.

**Revise** (`mode: "revise"`, used by Revise all, Remediate section/hero and the SEO fix): the content on screen is
parsed back into a draft, audited, and only **in-scope** notes are sent to the maker. The result is merged with
`mergeDraftByScope`, so out-of-scope content cannot change.

| Scope | What can change |
|---|---|
| `all` | everything |
| `meta` | title and description |
| `body` | H1, intro, sections, FAQs |
| `intro` | H1 and intro |
| `section` | one H2 section |

**Verdicts:**

| Verdict | Meaning |
|---|---|
| `APPROVED` | Every check passed |
| `NOT_QUALIFIED` | The best draft was applied, but blocking issues remain |
| `MAKER_UNAVAILABLE` | No model could write the page |

## 5. LLM routing (`src/services/llm.ts`)

| Job | First choice | Backups | Why |
|---|---|---|---|
| `maker`, `verify-fidelity`, `extraction` | Gemini `gemini-2.5-flash` | `gemini-3.1-flash-lite` → `gemma-4-31b-it` → `gemini-3.8-flash` → Groq `gpt-oss-120b` | Whole pages (10–25k tokens) and long structured output |
| `gate-compliance`, `gate-customer`, `gate-eeat-geo`, `keywords`, `h2-optimizer` | Groq `openai/gpt-oss-120b` | Groq `gpt-oss-20b` → `gemini-3.1-flash-lite` → `gemma-4-31b-it` → `gemini-2.5-flash` | Short prompts; fast and cheap; Gemini only after one wait for Groq |

Router behaviour:

- **Rate limit with a wait ≤ 20 s:** retry the same model once.
- **Server error:** retry once.
- **Timeout, or a server error twice:** for 3 minutes that model goes to the back of the line (it is still used if
  nothing else is left), so later calls don't each wait on an overloaded model.
- **Every model overloaded** (503s, timeouts, per-minute limits): wait 15 s, 30 s, then 45 s and go down the list
  again, for up to ~3 minutes. On Vercel, a wait that doesn't fit in the request ends it, and the step is retried in
  the next request.
- **Step deadline (Vercel):** no call starts or runs past the request's deadline; running out of time is not a
  model failure: the orchestrator saves its progress and continues in the next request (section 4).
- **Auth, permission or model-not-found error:** pause that model for 10 minutes.
- **Requests-per-day limit:** pause that model for an hour (free quotas reset daily; Gemini at midnight Pacific).
- **Review checks (Groq first) wait one round for Groq** before using Gemini, so they don't spend the maker's
  Gemini quota at every Groq per-minute limit (they used half of it in the first real test).
- **Request bigger than Groq's tokens-per-minute limit:** skipped before it's sent.
- **Unparseable JSON:** one fresh try on the same model, then the next model. (Flash-Lite sometimes loops until
  its 16k output cap, which cuts the JSON off; a fresh try is usually fine.)
- **Every attempt is logged** with tokens, latency, estimated cost and the reason for any failure.

**Model choice (free tiers only, owner's decision):** each Gemini model has its own free daily quota per Google
project, so the router chains several on one key (`GEMINI_MODELS` changes the list). Tested on the Insta EMI Card
page on 2026-10-21 with the real maker prompt:

| Model | Free requests/day | Result |
|---|---|---|
| `gemini-2.5-flash` | 20 (Google's quota error, 2026-10-21) | Best: body 109% of the source, 21 of 25 FAQs, no invented figures, 45 s. Its 20 requests last about two pages |
| `gemini-3.1-flash-lite` | 500 | Fast; keeps only ~45–65% of the body |
| `gemma-4-31b-it` | ~1,500, but only 16,000 tokens/min | Body 71%, 24 of 25 FAQs, no invented figures, ~85 s; on 2026-10-21 mostly "high demand" (about 1 success in 30) |
| `gemini-3.8-flash` | 20 | ~150 s per call under load |
| `gemma-4-26b-a4b-it` | — | Rejected: its JSON came back cut off |
| `gemini-2.5-flash-lite` | — | Retired by Google |

When a model hits its daily quota it is paused for an hour and the next one takes over. `gemini-3.1-pro-preview`
has no free tier. Qwen on Groq is a "preview, not for production" model, so it isn't used.

**List prices (USD per 1M tokens, checked 2026-10-20):**

| Model | Input | Output |
|---|---|---|
| `gemini-3.8-flash` | $0.75 until 2026-12-31, then $1.50 | $3.75 until 2026-12-31, then $7.50 |
| `gemini-3.1-flash-lite` | $0.25 | $1.50 |
| `gemini-3.1-pro-preview` | $2 | $12 |
| `gpt-oss-120b` | $0.15 | $0.60 |
| `gpt-oss-20b` | $0.075 | $0.30 |

Free-tier usage isn't billed; the panel shows estimates at list price.

**Free-tier limits:** Groq allows 1,000 requests a day, **8,000 tokens per minute** and **200,000 tokens a day per
model**. The daily tokens refill continuously (about 8,300 an hour), so a drained model is half full again after about
12 hours. The maker can't run on Groq's free tier for full pages. Gemini (per Google project and model, reset at
midnight Pacific): 2.5 Flash 20 requests a day, Flash-Lite 500, Gemma 4 31B ~1,500 (but 16,000 tokens a minute, too
few for a long page's maker prompt), 3.8 Flash 20. So 2.5 Flash writes the first page or two of the day and
Flash-Lite does most of the writing after that.

## 6. Gate rules that matter

- **LLM gates see the whole page outline** (every heading) plus the first 12,000 characters, and are told not to
  report a section as missing when the outline shows it exists. A blocking finding that says required wording is
  missing, when the wording it quotes is on the page past those 12,000 characters, becomes a warning
  (`checkAgainstFullPage`). *Why: the real test on 2026-10-21 blocked a Personal Loan draft for a missing "subject
  to change" note it had at character 13,358.*
- **Evidence for blocking findings.** Each LLM finding returns `quote`, `rule` and `needsInfoNotOnPage`. A finding is
  **critical (blocking)** only if it quotes the text *and* names the rule. Anything that needs information not on the
  page (author, registration number, APR example, phone number) is downgraded to low. Two statements that can both
  be true are not a contradiction.
- **Severity rubric** (shared by all LLM gates):

  | Severity | Meaning |
  |---|---|
  | high | Non-compliant or misleading |
  | medium | A fixable quality problem |
  | low | Polish |

- **A gate passes** when its score is ≥ `passThreshold` (default 70) and it has no critical flag.
- **Scores shown in the UI all come from the gates** (`alignScoresWithGates`). The overall score weights compliance
  40%, customer centricity 20%, EEAT/GEO 20%, structure 10% and SEO 10%.
- **Customer-centricity readability** counts only prose paragraphs, and is scaled by the share of dense paragraphs,
  so long pages aren't penalised for length alone.

## 7. Keywords (`src/services/keywordPicker.ts`)

Keywords are deterministic and grounded in the page:

- Candidates come from the title, H1, headings, description, URL slug and frequent body n-grams.
- The picker drops numbers, brand fragments and nested fragments; singular and plural count as one keyword.
- Questions come only from the page's own headings and FAQs.
- It adds one branded variant (for example "bajaj finance personal loan") when the page uses it.
- Volumes are 0 unless Google Ads verifies them.

## 8. Data model (`src/types.ts`, `src/services/pageDraft.ts`)

`PageDraft = { metaTitle, metaDescription, h1, intro[], sections[{ h2, paragraphs, bullets, h3s[], table? }], faqs[] }`

- `draftToMarkdown` / `markdownToDraft`: the gates read markdown, and revisions parse it back.
- `draftToComponent` / `componentToDraft`: the UI's unified `page_body_content` component.
- `buildDraftSchema`: rebuilds JSON-LD (WebPage, BreadcrumbList, subject entity, Organization, FAQPage) in canonical
  order.
- `findUnsupportedFigures`: the fabrication guard.
- `checkHeadingStructure`: heading order.
- `diffDrafts`: the change log behind "Changes & rationale".

## 9. Guidelines

There are six guideline sections:

- content;
- product (including **brand name**);
- SEO;
- GEO;
- customer centricity;
- structure & keywords.

**Nothing is built in.** The app starts with empty guidelines; each team writes its own in the Guidelines tab and
saves them per section (**Save as New Guideline**), then picks them under **Active guidelines** in the workspace.
With no guidelines, the gates still apply the tool's own rules (no invented facts, coverage, heading order, SEO
basics, the neutral limits in `src/data/defaults.ts`).

Guidelines are stored per browser (`localStorage`, `src/data/defaultProfiles.ts`). **Export / Import** in the
Guidelines tab moves every saved guideline of all six sections (and any profiles) as one JSON file
(`format: "content-optimizer-guidelines"`). Import adds to what's there: an item with the same id is replaced,
nothing is deleted, and a section with nothing selected gets the first imported guideline.

The Bajaj Finserv guidelines that used to be built in (9 verticals + content standard) are now the real-page test's
fixture, `tests/fixtures/bajaj-guidelines.json`, in the export format. Details: [BAJAJ-VERTICALS.md](BAJAJ-VERTICALS.md).

## 10. UI

- **Theme:** light, colourful enterprise theme by default, with a dark toggle (stored as `co-theme`). Colours are
  remapped per theme at the CSS-variable level in `src/theme.css`, generated by `scripts/build-theme.mjs`. Page
  previews use `.palette-fixed`.
- **Tabs:** Guidelines, Audit workspace, Page preview.
- **Mobile:** bottom tab bar; toolbars wrap (`.no-wrap` opts out); tables scroll sideways.
- **Pipeline panel:** stepper, live log, verdict, a gate-by-draft score matrix, blocking issues, and notes per round.
- **Page preview:** renders only the real content and URL. It has a Google-result view and a clean HTML export, with
  no demo chrome.
- **Admin panel** at `/admin`, protected by `ADMIN_PASSWORD`:
  - calls, cost, tokens and rate limits (7 days and all time);
  - a daily Gemini vs Groq chart;
  - provider health;
  - which provider does which job;
  - rate-limit reasons;
  - failures, with what each means and what to do;
  - Firecrawl credits (live);
  - page runs and their outcomes;
  - the price list.

  Chart colours were validated with the dataviz palette checker: Gemini is blue, Groq is orange.

## 11. Backend and API (`server.ts`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Status and which integrations are configured (never their values) |
| POST | `/api/fetch-url` | Fetch and extract a page, or parse `rawHtml` |
| POST | `/api/discover-sitemap` | URLs from robots.txt / sitemaps (only the first 10 child sitemaps) |
| POST | `/api/extract-keywords` | Keywords for page fields |
| POST | `/api/run-pipeline` | Optimize or revise; `stream: true` returns NDJSON progress. On a time-limited host a request may end with a checkpoint; resend the same body with `resume` |
| POST | `/api/optimize-h2s` | H2 suggestions for the H2 optimizer modal |
| GET/POST | `/api/google-ads/*` | Keyword Planner (needs all five `GOOGLE_ADS_*` values) |
| POST / GET | `/api/admin/login`, `/api/admin/metrics` | Admin panel (`x-admin-password`) |

**Fetching:** Firecrawl (markdown + cleaned HTML + raw HTML for JSON-LD) → direct fetch → Googlebot user agent →
Jina reader → public proxies. Only public `http(s)` URLs are fetched; 404s are errors; a page that can't be fetched
is an error, never a generated stand-in.

**Usage logs:** `data/usage/{llm-calls,firecrawl,runs}.jsonl` (git-ignored; `USAGE_LOG_DIR` to move them).

## 12. Configuration (`.env`, see `.env.example`)

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY`, `GROQ_API_KEY` | LLM providers (at least one) |
| `GEMINI_MODELS`, `GEMINI_CHECK_MODELS`, `GROQ_MODEL`, `GROQ_FALLBACK_MODEL`, `GROQ_TPM_LIMIT` | Model chains and Groq budget (older `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL` still work) |
| `FIRECRAWL_API_KEY` | Primary scraper |
| `GOOGLE_ADS_CLIENT_ID`, `_CLIENT_SECRET`, `_REFRESH_TOKEN`, `_CUSTOMER_ID`, `_DEVELOPER_TOKEN` | Verified search volumes |
| `ADMIN_PASSWORD` | Admin panel |
| `USD_INR_RATE` | Rupee estimates in the panel |
| `USAGE_LOG_DIR` | Usage log location (on Vercel `/tmp`, temporary) |
| `FUNCTION_MAX_DURATION` | Vercel: seconds one request may run (default 300); each pipeline request stops 20 s before it |
| `PIPELINE_STEP_SECONDS` | Local testing: simulate that request limit |
| `ALLOWED_ORIGINS` | Cross-origin API access (closed by default) |

## 13. Security

Full details in [SECURITY.md](SECURITY.md). Summary:

- **Access:** Vercel Authentication (recommended) and/or the optional site password `APP_PASSWORD` (signed
  HttpOnly session cookie); separate `ADMIN_PASSWORD` for `/admin`; 10 wrong passwords per IP in 15 minutes
  lock that IP out.
- **Rate limits per IP** on the API, fetches, keyword tools and new pipeline runs.
- **SSRF guard:** private, internal and reserved addresses refused in every notation; every redirect hop and
  every robots.txt sitemap re-checked.
- **Prompt injection:** page content fenced as data in every prompt; hidden "instructions to the AI" detected and
  blocking approval (editor-only finding).
- **Signed checkpoints:** a run's saved progress can't be edited in the browser to fake a verdict.
- **Headers:** strict Content-Security-Policy (inline theme script by hash), nosniff, referrer and permissions
  policies, HSTS, COOP; CORS closed by default; no `X-Powered-By`.
- **Secrets live only in `.env` / Vercel.** Rotate the Firecrawl key and Google Ads secret/refresh token that were
  hard-coded in earlier code. Make the repo private.

## 14. Development

- **Windows path quirk:** the folder name contains `&`, which breaks `npm run` and `npx` on Windows. Run tools
  through Node: `node node_modules/tsx/dist/cli.mjs server.ts`, `node node_modules/typescript/bin/tsc --noEmit`,
  `node --import ./node_modules/tsx/dist/esm/index.mjs --test tests/*.test.ts`.
- **Tests (66):**

  | Suite | Tests | Covers |
  |---|---|---|
  | `tests/keywordPicker.test.ts` | 7 | Keyword picker (incl. no fragments like "personal loan based") |
  | `tests/pageDraft.test.ts` | 10 | Draft model (incl. FAQ sections moved into the FAQ list) |
  | `tests/pipeline.test.ts` | 18 | Real gates and loop with a scripted model; empty guidelines; resuming from checkpoints; coverage and length pass; incomplete reviews; fact-check false alarms; "missing" findings about text further down a long page; severity scoring; prompt injection |
  | `tests/guidelines.test.ts` | 5 | Nothing built in; export/import of all six guideline types and profiles (import adds, never deletes); bad files refused; the e2e fixture is complete |
  | `tests/llm.test.ts` | 16 | Router, with mocked Groq HTTP; cooldown, overload retry, daily quota, Groq-first waiting, avoided models, step deadline, model order, 2.5 Flash thinking budget |
  | `tests/security.test.ts` | 10 | SSRF (incl. redirects), signed checkpoints and sessions, lockout, rate limit, prompt-injection detection and fencing, link guard, CSP |

- **E2E:** `scripts/e2e-bajaj.ts` runs the 9-page default set (3 products, 3 blogs, 3 articles) with the guidelines
  in `tests/fixtures/bajaj-guidelines.json` (`E2E_GUIDELINES` points it at another export file). It writes
  `docs/E2E-REPORT.md` and `docs/e2e-outputs/<page>.md`; `E2E_PAGES=…` runs a subset.
- **Test hooks:** `setAgentAIClientForTesting(client)` routes all LLM calls to a fake; `resetRouterState()` clears
  paused models.

## 15. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-10-20 | Maker-first loop: free draft, then gate notes | Owner's design; constraining the maker hurt quality |
| 2026-10-20 | A figure absent from the source blocks approval | Regulated YMYL content; no invented numbers |
| 2026-10-20 | Removed synthetic pages, fake volumes, fake "fixed" scores, legacy `/api/audit` and `/api/fix` | Fabricated data presented as real |
| 2026-10-20 | Brand per vertical; no global Finserv→Finance rewrite | The rewrite corrupted names and links |
| 2026-10-20 | Light theme default with dark toggle; mobile bottom nav | Owner asked for enterprise, colourful, mobile-friendly |
| 2026-10-20 | Gemini for writing and fact-check, Groq for checks; each backs up the other | Context size versus Groq's free-tier limits |
| 2026-10-20 | `gemini-3.8-flash` as maker model | Recommended by Google, has a free tier, strong long output (superseded below) |
| 2026-10-20 | Free tiers only; Flash-Lite leads, 3.8 Flash is the backup | 3.8 Flash's free tier is ~20 requests/day and was slow/overloaded in the real test |
| 2026-10-20 | Maker keeps the source's coverage, with a size target; gate 4 checks body words and FAQ count | First real test cut a page to ~30% of its content |
| 2026-10-20 | Findings needing editor input are not sent to the maker | They made the maker invent a phone number and an EMI example |
| 2026-10-20 | A review that couldn't run blocks approval | Failed AI checks used to pass silently on rules alone |
| 2026-10-20 | A "claim not in source" whose words are all in the source only warns | Fact check falsely blocked a claim the source states (Form 121) |
| 2026-10-21 | Security hardening: rate limits, optional site password, redirect-safe SSRF guard, prompt-injection fencing and detection, signed checkpoints, CSP | Owner asked for a secure, failproof system before handoff |
| 2026-10-21 | Fact check prefers a different model from the writer; links/emails not in the source block approval | Owner asked how to keep older models from hallucinating |
| 2026-10-21 | Landing page at `/`; workspace moves to `/app` | Owner asked for an introduction before the audit UI |
| 2026-10-21 | No built-in guidelines; Export / Import in the Guidelines tab; the Bajaj guidelines become the e2e test fixture | The new owner adds his own guidelines; the profile export that existed was never shown in the UI and missed the per-section guidelines |
| 2026-10-21 | AI-gate "missing" findings are checked against the whole page; 2.5 Flash keeps half its output budget for the answer | Real test: a disclaimer past the gates' 12,000 characters was reported missing; a long revision's JSON was cut off |
| 2026-10-21 | Chain free Gemini models: 2.5 Flash → Flash-Lite → Gemma 4 31B → 3.8 Flash; checks overflow to Gemma | Each model has its own free quota; 2.5 Flash wrote the most complete page in a bake-off; Flash-Lite alone ran out in one test day |
| 2026-10-20 | Daily quota pauses a model; review checks wait for Groq before using Gemini | A full day of testing used up Flash-Lite's 500 requests, half of them by the checks |
| 2026-10-20 | A forbidden phrase inside a negation ("not insured by DICGC") is not a violation | The FD preset requires that disclosure but forbade the phrase, so compliant drafts were blocked |
| 2026-10-20 | Gates 2, 5, 6 score AI findings by severity; editor-only findings don't count | Count-based scoring failed nearly every page in the real test |
| 2026-10-20 | Short drafts get a second maker call for the sections | Flash-Lite stops early when one answer holds the whole page |
| 2026-10-20 | Router: models that time out or keep failing go last for 3 min; up to 3 more passes (15/30/45 s) when all are overloaded | Free-tier overload spikes (503 "high demand") |
| 2026-10-20 | Resumable pipeline: steps with checkpoints, so one request stays under Vercel's limit | The Vercel site is for approvals and testing on any plan, including Hobby (300 s per request), with no loss of quality |
| 2026-10-20 | Blocking LLM findings need a quote and a rule; "needs info" findings are downgraded | Live tests showed false criticals |
| 2026-10-20 | Admin panel behind `ADMIN_PASSWORD`; usage in JSONL files | Owner's choice; simple and local |

## 16. Glossary

| Term | Meaning |
|---|---|
| SEO / AEO / GEO | Search-engine, answer-engine (voice) and generative-engine (AI answers) optimization |
| EEAT | Experience, Expertise, Authoritativeness, Trust (Google's quality criteria) |
| YMYL | "Your Money or Your Life" topics such as finance and health, held to stricter standards |
| Gate | A reviewer agent (2–6) that audits a draft and scores it |
| Draft / round | One maker output plus its gate and verification results |
| Blocking issue | Something that stops Agent 8 from approving |
| TPM / RPD | Tokens per minute / requests per day (provider rate limits) |
| KFS / APR | Key Fact Statement / Annual Percentage Rate (RBI lending disclosures) |
