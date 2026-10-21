# Architecture

## Overview

A single Node process serves both the API (Express) and the React UI (Vite middleware in development, static
files in production). The UI has three pages (`src/main.tsx`, `src/lib/route.ts`): the landing page at `/` (`LandingPage.tsx`), the workspace
at `/app` (`App.tsx`; it stays mounted while you visit the landing page, so work isn't lost) and the admin panel at
`/admin`. Light/dark theme is shared through `src/lib/theme.ts`. On Vercel, `scripts/build-vercel.mjs` splits this: the UI goes to Vercel's CDN and `server.ts`
becomes one function serving `/api/*` (Build Output API). All agent logic runs on the server; the browser only orchestrates user actions and renders
results.

```
Browser (React)                         Server (Express, server.ts)
───────────────                         ───────────────────────────
UrlFetcherBar ── POST /api/fetch-url ──► fetch (Firecrawl → direct → proxies) → parse → components + keywords
App.handleRunAudit ─ POST /api/run-pipeline (stream) ─► runPipelineStep()  (agentPipeline.ts)
App.runRevision    ─ POST /api/run-pipeline {mode:"revise", reviseScope} ─► same loop, scoped
PipelineRunPanel  ◄── NDJSON progress events + final result (or a checkpoint → lib/api.ts resends with resume)
```

## The pipeline (`src/services/agentPipeline.ts`)

`runPipelineStep(params)` is the entry point for optimizing and revising; `runAgent9OrchestrationPipeline(params)`
runs it to the end without a deadline (tests, scripts). The run is a sequence of steps that each keep their results
only when they finish: `baseline` (gates on the original + first draft in parallel; a finished half is kept) →
`preverify` (revise mode) → per round `draft` → `gates` → `verify` → `finish`. With a `deadline` (Vercel) the run
stops between steps when less than 100 s is left, or abandons the step in progress when a model call would pass
the deadline (`DeadlineError` from the router, passed through every agent's error handler), and returns a
`PipelineCheckpoint`: plain JSON with all progress. Resending the same params with `resume` continues from it.

### Optimize mode (default)

1. **Agent 1 — extraction.** Uses the components the UI already fetched (and raw HTML when given). The model is only
   asked to normalise *real* input; it is never given a bare URL, so it cannot invent page content.
2. **Baseline + first draft, in parallel.**
   - Gates 2–6 audit the original page → *before* scores.
   - Agent 7 writes the first draft from the source page alone (plus target keywords and approved product facts as
     context). Its prompt contains no gate rules: the maker is deliberately free. Two hard rules: truth (no facts,
     figures, examples or contact details that are not in the source or approved facts), and coverage ("rewrite,
     don't cut", with the source body's word count and FAQ count as a target). If the body still comes back below
     70% of the source body, a second maker call rewrites only the sections (`expandMakerSections`), because
     smaller models (Flash-Lite) stop early when one answer has to hold the whole page.
3. **Review.** The draft is converted to markdown, a component and a rebuilt JSON-LD graph (`pageDraft.ts`) and audited
   by gates 2–6.
4. **Verification (Agent 8).** Approves only if:
   - every gate passes (score ≥ `passThreshold`, default 70, and no critical flag);
   - no forbidden phrase appears;
   - no figure in the draft is missing from the source page or approved product facts (deterministic check);
   - the LLM fidelity check finds no high-risk unsupported claim. A flagged claim whose meaningful words and
     numbers almost all occur in the source (`claimLooksSupported`) is only a warning: the model sometimes flags
     claims the source does state;
   - the fidelity check and the gates' AI reviews actually ran: if no model was available, approval is blocked
     ("Fact check could not run", "Review incomplete") instead of passing on rules alone.
   Otherwise it compiles prioritised notes (critical → warning → a few low) for the maker, leaving out findings
   that need an editor (`needsEditorInput`).
5. **Revise.** Notes go back to Agent 7, which revises its own draft. Steps 3–5 repeat up to `maxRevisions` times
   (default 2, so at most 3 drafts).
6. **Select.** The approved draft, or the best-scoring one, is returned with before/after scores, every round, the
   inter-agent message log and a change log.

### Revise mode (`mode: "revise"`)

Used by **Revise all**, **Remediate section/hero** and the **SEO backend** fix. The content currently on screen is
parsed back into a draft (`componentToDraft`), audited by gates 2–6, and Agent 8 compiles the notes. Only notes in
scope are sent to the maker, together with a scope instruction, and the result is merged with
`mergeDraftByScope`, so content outside the scope cannot change even if the model ignores the instruction.

| Scope | Changes |
|---|---|
| `{ kind: "all" }` | Whole page and metadata |
| `{ kind: "meta" }` | Meta title and description only |
| `{ kind: "body" }` | H1, intro, sections, FAQs (metadata unchanged) |
| `{ kind: "intro" }` | H1 and introduction only |
| `{ kind: "section", h2 }` | One H2 section only |

If the content already passes, or no notes apply to the scope, nothing is changed and the report explains why.

## LLM router (`src/services/llm.ts`)

Every model call names a **job** (`maker`, `extraction`, `gate-compliance`, `gate-customer`, `gate-eeat-geo`,
`verify-fidelity`, `keywords`, `h2-optimizer`). `routeFor(job)` returns the ordered provider/model choices; long-input
jobs go Gemini first (a chain of free models: 2.5 Flash, 3.1 Flash-Lite, Gemma 4 31B, 3.8 Flash; each has its own
daily quota), short checks go Groq first and use Gemini (Flash-Lite, Gemma, 2.5 Flash) only after one wait for Groq. For each choice:

| Outcome | Action |
|---|---|
| Success (and valid JSON when `json: true`) | Return; log tokens, latency, estimated cost |
| Rate limit, wait ≤ 20 s | Wait, retry the same model once |
| Server error | Retry once, then next choice |
| Timeout, or server error twice | Next choice; for 3 minutes this model is tried last |
| Every choice failed with an overload, timeout or rate limit | Wait 15 s, 30 s, 45 s and try the list again (up to ~3 min); with a step deadline, a wait that doesn't fit throws `DeadlineError` so the step continues in the next request |
| Step deadline too close | Throw `DeadlineError` (logged as "skipped", type `deadline`); the step is redone in the next request |
| Auth / permission / model not found | Next choice; pause this model for 10 minutes |
| Requests-per-day limit | Next choice; pause this model for an hour |
| Groq-first job, Groq rate-limited | Wait one round (15 s) for Groq before trying Gemini |
| Request larger than Groq's per-minute token limit | Skipped before sending (logged as "skipped") |
| Unparseable JSON | One fresh try on the same model (Flash-Lite sometimes loops until its output cap), then next choice |

Calls inside a pipeline run carry the run id and page URL (AsyncLocalStorage), so the admin panel can attribute cost
to runs. Groq's quota headers (requests per day, tokens per minute) are kept in memory for the panel.

LLM gates ask each finding for `quote`, `rule` and `needsInfoNotOnPage`. A finding is only critical (blocking) when it
quotes the text and names the rule; anything that needs information not on the page is downgraded to low. Gates see
a full heading outline plus the first 12,000 characters, and are told not to report sections as missing when the
outline shows them.

## Usage logging and admin metrics

`usageStore.ts` appends JSON lines to `data/usage/` (`USAGE_LOG_DIR`): `llm-calls.jsonl` (one line per attempt),
`firecrawl.jsonl` and `runs.jsonl`. `adminMetrics.ts` aggregates them on request (7-day and all-time totals, daily
series, rate-limit reasons, job × provider matrix, failures, fallbacks, Firecrawl, runs). Firecrawl's remaining credits
come live from `GET https://api.firecrawl.dev/v2/team/credit-usage` (cached 5 minutes).

Admin API (header `x-admin-password`; 10 wrong attempts per IP per 15 minutes are blocked):

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/login` | Check the password |
| GET | `/api/admin/metrics` | Everything the panel shows |

## Gates

| Gate | Deterministic checks | LLM checks (Groq first, Gemini backup) |
|---|---|---|
| 2 Compliance | Forbidden phrases (gating; a phrase inside a negation such as "not insured by DICGC" doesn't count, `usesPhraseAffirmatively`), core value propositions present | Guideline violations in copy |
| 3 SEO backend | Title/description length and completeness, brand in title/description (when a brand is set), JSON-LD validity, completeness and canonical order, sitemap | — |
| 4 Keyword & structure | Keyword coverage, keywords in headings, frequency, question headings, heading order (`checkHeadingStructure`); for maker drafts, content coverage against the source (`coverageFlags`: body without FAQs < 70% of the source body's words warns, < 50% blocks; fewer than 60% of the FAQs warns) | — |
| 5 Customer centricity | Share of dense paragraphs, run-on sentences, friction patterns, forbidden clichés | Jargon, journey order, objection handling, transparency |
| 6 EEAT & GEO | Figure density, direct-answer capsules | Trust signals, citability, entity clarity |

Findings that need information not on the page are also marked `needsEditorInput`: they stay in the UI for editors
but Agent 8 never sends them to the maker (they led it to invent contact numbers and examples).

All LLM gates share a severity rubric: "high" only for problems that make the page non-compliant or misleading;
anything that needs information not on the page (author names, registration numbers, new statistics) is "low", so
the loop never pushes the maker to invent facts.

Gates 2, 5 and 6 score their AI findings by severity (`scoreFromAiFindings`: critical −20, warning −8, low −2,
findings that need an editor 0; floor 40), then apply their rule checks. (Until 2026-10-20 every finding cost 7–10
points regardless of severity, so a handful of minor notes failed nearly every page.)

Scores shown in the UI all come from the gates (`alignScoresWithGates`). The overall score weights compliance 40%,
customer centricity 20%, EEAT/GEO 20%, structure 10% and SEO 10%.

## Draft model (`src/services/pageDraft.ts`)

`PageDraft = { metaTitle, metaDescription, h1, intro[], sections[{ h2, paragraphs, bullets, h3s[], table? }], faqs[] }`

- `draftToMarkdown` / `markdownToDraft`: the gates read markdown; revisions parse it back.
- `draftToComponent` / `componentToDraft`: conversion to and from the UI component, keeping `originalSnapshot` for diffs.
- `buildDraftSchema`: rebuilds JSON-LD from facts we have (WebPage, BreadcrumbList from the URL, the existing subject
  entity or an Article, Organization when a brand is set, FAQPage from the draft's FAQs), in canonical order.
- `findUnsupportedFigures`: the fabrication guard.
- `diffDrafts`: the change log behind "Changes & rationale".

## Fetching (`server.ts`)

`fetchPageHtmlWithMultiFallback`: Firecrawl (markdown + cleaned HTML + raw HTML) → direct fetch (browser UA) →
Googlebot UA → Jina reader → public CORS proxies. Rules:

- Only public `http(s)` URLs are fetched; private and internal addresses are refused.
- HTTP 404/410 are reported as errors; a page that cannot be fetched is an error, never a generated stand-in.
- JSON-LD is read from the raw HTML (Firecrawl's cleaned HTML strips `<script>` tags).
- Content starts at the page's H1; anything above it is site chrome.

## Keywords (`src/services/keywordPicker.ts`)

Deterministic and grounded: candidate phrases come from the title, H1, headings, description, URL slug and frequent
body n-grams. Numbers, brand fragments and nested fragments are dropped; questions come only from real question
headings and FAQs; one branded variant of the main topic is added when the page uses it. Search volume is 0 unless
Google Ads verifies it. With Gemini configured, `/api/extract-keywords` may refine the selection, still without
estimating volumes.

## Streaming protocol

`POST /api/run-pipeline` with `"stream": true` returns `application/x-ndjson`:

```
{"type":"progress","event":{"stage":"gates","status":"end","agentId":"agent-3","round":1,"score":71,"passed":true,"message":"SEO backend gate: 71 (pass)","at":"…"}}
…
{"type":"result","result":{ finalVerdict, report:{ rounds, baselineGates, … }, flags, updatedComponents, updatedBackend, fixResult, … }}
```

or a final `{"type":"error","error":"…"}`, or, when the request's time is up (Vercel), a final
`{"type":"checkpoint","checkpoint":{…}}`. The client then sends the same body again with `"resume": checkpoint`
(`runPipelineStream` in `src/lib/api.ts` does this automatically, up to 30 requests). The request limit comes from
`FUNCTION_MAX_DURATION` on Vercel (default 300 s, minus 20 s to send the checkpoint), or `PIPELINE_STEP_SECONDS`
locally; without either there is no limit.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Status and which integrations are configured |
| POST | `/api/fetch-url` | `{ url }` or `{ rawHtml }` → backend SEO data, components, keywords |
| POST | `/api/discover-sitemap` | `{ url }` → URLs from robots.txt / sitemaps |
| POST | `/api/extract-keywords` | Page fields → keywords |
| POST | `/api/run-pipeline` | Optimize or revise (see above) |
| POST | `/api/optimize-h2s` | H2 rewrite suggestions (H2 optimizer modal) |
| GET/POST | `/api/google-ads/*` | Keyword Planner status, metrics, ideas |
| POST / GET | `/api/admin/login`, `/api/admin/metrics` | Admin panel (see above) |

## UI theme

Components use Tailwind palette classes. `src/theme.css` (generated by `scripts/build-theme.mjs`) remaps each palette
per theme: the dark theme uses the natural scales; the light theme (default) inverts the neutral scale and shifts the
hue scales so text stays readable on white. Elements inside `.palette-fixed` (page previews) always use the natural
scales. The theme is stored in `localStorage` (`co-theme`) and applied before first paint.

## Testing

- `npm test`: unit tests for the keyword picker and draft model, and pipeline tests that run the real gates,
  verification and revision loop against a scripted model client (`setAgentAIClientForTesting`).
- `npm test` also runs the router tests (`tests/llm.test.ts`, mocked Groq HTTP): routing order, fallback, rate-limit
  retry, pre-flight skip, bad JSON and usage logging.
- `npm run test:e2e`: 9 live Bajaj Finserv pages (3 products, 3 blogs, 3 articles) through the running server;
  writes `docs/E2E-REPORT.md` and per-page before/after content in `docs/e2e-outputs/`. With a working Gemini key it
  also covers maker drafts, the gate loop and a scoped revision.
