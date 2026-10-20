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
   approved product facts. A figure that isn't in the source **blocks approval**. This is the one rule the maker
   always carries: it's about truth, not style.
3. **Never show fabricated data as real.** No synthetic pages when a fetch fails, no estimated search volumes
   (0 / "vol. n/a" until Google Ads verifies), no fake "fixed" scores. Before and after scores both come from real
   gate audits.
4. **Brand naming is per vertical, from evidence.** There's no global "Finserv → Finance" rewrite. Live
   `bajajfinserv.in` lending titles use "| Bajaj Finance"; the legal entity is named in disclosures.
5. **No rates, fees or limits in guideline presets.** Product Guidelines are "approved facts" the maker may
   publish, so a stale rate would reach live pages. Product teams add current figures themselves.
6. **Plain language everywhere in the UI.** A layman should understand every screen, especially the admin panel.

## 3. The agents

| # | Agent | Kind | What it does |
|---|---|---|---|
| 1 | Extraction | deterministic (+ LLM only for pasted HTML) | Fetches the page and extracts metadata, raw JSON-LD, headings, body, tables and FAQs; content starts at the H1 |
| 2 | Compliance gate | LLM + rules | Brand and product rules: forbidden phrases, disclosures, terminology, value propositions |
| 3 | SEO backend gate | rules | Title/description length, brand in title/description, JSON-LD validity, completeness and order, sitemap |
| 4 | Keyword & structure gate | rules | Keyword coverage and placement; heading order (one H1 first, H2 → H3 nesting, FAQ last) |
| 5 | Customer-centricity gate | LLM + rules | Plain language for the reader persona, friction, dense paragraphs, run-on sentences |
| 6 | EEAT & GEO gate | LLM + rules | Trust signals and how quotable the content is for AI answer engines |
| 7 | Maker | LLM | The only writer: free first draft, then revisions from the notes |
| 8 | Verification gate | rules + LLM | Approves only if all 5 gates pass, there are no forbidden phrases, and no unsupported figures or claims |
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
| `maker`, `verify-fidelity`, `extraction` | Gemini `gemini-3.8-flash` | Gemini `gemini-3.1-flash-lite` → Groq `gpt-oss-120b` | Whole pages (10–25k tokens) and long structured output |
| `gate-compliance`, `gate-customer`, `gate-eeat-geo`, `keywords`, `h2-optimizer` | Groq `openai/gpt-oss-120b` | Groq `gpt-oss-20b` → Gemini 3.8 flash → Gemini lite | Short prompts; fast and cheap; keeps Gemini's quota for writing |

Router behaviour:

- **Rate limit with a wait ≤ 20 s:** retry the same model once.
- **Server error:** retry once.
- **Auth, permission or model-not-found error:** pause that model for 10 minutes.
- **Request bigger than Groq's tokens-per-minute limit:** skipped before it's sent.
- **Unparseable JSON:** move on to the next model.
- **Every attempt is logged** with tokens, latency, estimated cost and the reason for any failure.

**Model choice:** `gemini-3.8-flash` is Google's current recommended model; it has a free tier and up to 65k output
tokens. `gemini-3.1-pro-preview` writes slightly better but has no free tier and costs about 3× more. Switch with
`GEMINI_MODEL`. Qwen on Groq is a "preview, not for production" model, so it isn't used.

**List prices (USD per 1M tokens, checked 2026-10-20):**

| Model | Input | Output |
|---|---|---|
| `gemini-3.8-flash` | $0.75 until 2026-12-31, then $1.50 | $3.75 until 2026-12-31, then $7.50 |
| `gemini-3.1-flash-lite` | $0.25 | $1.50 |
| `gemini-3.1-pro-preview` | $2 | $12 |
| `gpt-oss-120b` | $0.15 | $0.60 |
| `gpt-oss-20b` | $0.075 | $0.30 |

Free-tier usage isn't billed; the panel shows estimates at list price.

**Free-tier limits:** Groq allows 1,000 requests a day and **8,000 tokens per minute per model**. The maker can't run
on Groq's free tier for full pages.

## 6. Gate rules that matter

- **LLM gates see the whole page outline** (every heading) plus the first 12,000 characters, and are told not to
  report a section as missing when the outline shows it exists.
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

## 9. Guidelines and Bajaj verticals

There are six guideline sections:

- content;
- product (including **brand name**);
- SEO;
- GEO;
- customer centricity;
- structure & keywords.

Built-in Bajaj profiles (`src/data/bajajVerticals.ts`) cover Personal Loan, Business Loan, Home Loan, Gold Loan,
Fixed Deposit, Insta EMI Card, Co-branded Credit Cards, Insurance and Mutual Funds. Presets are stored per browser
in `localStorage`. Details: [BAJAJ-VERTICALS.md](BAJAJ-VERTICALS.md). **Each vertical's compliance owner must review
their preset.**

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
| POST | `/api/run-pipeline` | Optimize or revise; `stream: true` returns NDJSON progress |
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
| `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `GROQ_MODEL`, `GROQ_FALLBACK_MODEL`, `GROQ_TPM_LIMIT` | Model overrides and Groq budget |
| `FIRECRAWL_API_KEY` | Primary scraper |
| `GOOGLE_ADS_CLIENT_ID`, `_CLIENT_SECRET`, `_REFRESH_TOKEN`, `_CUSTOMER_ID`, `_DEVELOPER_TOKEN` | Verified search volumes |
| `ADMIN_PASSWORD` | Admin panel |
| `USD_INR_RATE` | Rupee estimates in the panel |
| `USAGE_LOG_DIR` | Usage log location |
| `ALLOWED_ORIGINS` | Cross-origin API access (closed by default) |

## 13. Security

- **Secrets live only in `.env`.** The old hard-coded Firecrawl key and Google Ads client secret and refresh token
  were exposed in earlier code and **should be rotated**.
- **SSRF guard:** private and internal addresses are refused.
- **CORS is closed** by default.
- **The DLP-evasion code was removed.**
- **The admin panel** compares passwords in constant time, and blocks an IP after 10 wrong attempts in 15 minutes.
- **The tool itself has no login.** Deploy it behind company SSO/VPN, and consider making the repo private.

## 14. Development

- **Windows path quirk:** the folder name contains `&`, which breaks `npm run` and `npx` on Windows. Run tools
  through Node: `node node_modules/tsx/dist/cli.mjs server.ts`, `node node_modules/typescript/bin/tsc --noEmit`,
  `node --import ./node_modules/tsx/dist/esm/index.mjs --test tests/*.test.ts`.
- **Tests (29):**

  | Suite | Tests | Covers |
  |---|---|---|
  | `tests/keywordPicker.test.ts` | 6 | Keyword picker |
  | `tests/pageDraft.test.ts` | 9 | Draft model |
  | `tests/pipeline.test.ts` | 6 | Real gates and loop with a scripted model |
  | `tests/llm.test.ts` | 8 | Router, with mocked Groq HTTP |

- **E2E:** `scripts/e2e-bajaj.ts` runs the 9-page default set (3 products, 3 blogs, 3 articles). It writes
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
| 2026-10-20 | `gemini-3.8-flash` as maker model | Recommended by Google, has a free tier, strong long output |
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
