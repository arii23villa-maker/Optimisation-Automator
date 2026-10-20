# Architecture

## Overview

A single Node process serves both the API (Express) and the React UI (Vite middleware in development, static
files in production). All agent logic runs on the server; the browser only orchestrates user actions and renders
results.

```
Browser (React)                         Server (Express, server.ts)
───────────────                         ───────────────────────────
UrlFetcherBar ── POST /api/fetch-url ──► fetch (Firecrawl → direct → proxies) → parse → components + keywords
App.handleRunAudit ─ POST /api/run-pipeline (stream) ─► runAgent9OrchestrationPipeline()  (agentPipeline.ts)
App.runRevision    ─ POST /api/run-pipeline {mode:"revise", reviseScope} ─► same loop, scoped
PipelineRunPanel  ◄── NDJSON progress events + final result
```

## The pipeline (`src/services/agentPipeline.ts`)

`runAgent9OrchestrationPipeline(params)` is the single entry point for optimizing and revising.

### Optimize mode (default)

1. **Agent 1 — extraction.** Uses the components the UI already fetched (and raw HTML when given). The model is only
   asked to normalise *real* input; it is never given a bare URL, so it cannot invent page content.
2. **Baseline + first draft, in parallel.**
   - Gates 2–6 audit the original page → *before* scores.
   - Agent 7 writes the first draft from the source page alone (plus target keywords and approved product facts as
     context). Its prompt contains no gate rules: the maker is deliberately free. The one hard rule is truth: no
     facts or figures that are not in the source or approved facts.
3. **Review.** The draft is converted to markdown, a component and a rebuilt JSON-LD graph (`pageDraft.ts`) and audited
   by gates 2–6.
4. **Verification (Agent 8).** Approves only if:
   - every gate passes (score ≥ `passThreshold`, default 70, and no critical flag);
   - no forbidden phrase appears;
   - no figure in the draft is missing from the source page or approved product facts (deterministic check);
   - the LLM fidelity check finds no high-risk unsupported claim.
   Otherwise it compiles prioritised notes (critical → warning → a few low) for the maker.
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

## Gates

| Gate | Deterministic checks | LLM checks (needs Gemini) |
|---|---|---|
| 2 Compliance | Forbidden phrases (gating), core value propositions present | Guideline violations in copy |
| 3 SEO backend | Title/description length and completeness, brand in title/description (when a brand is set), JSON-LD validity, completeness and canonical order, sitemap | — |
| 4 Keyword & structure | Keyword coverage, keywords in headings, frequency, question headings, heading order (`checkHeadingStructure`) | — |
| 5 Customer centricity | Share of dense paragraphs, run-on sentences, friction patterns, forbidden clichés | Jargon, journey order, objection handling, transparency |
| 6 EEAT & GEO | Figure density, direct-answer capsules | Trust signals, citability, entity clarity |

All LLM gates share a severity rubric: "high" only for problems that make the page non-compliant or misleading;
anything that needs information not on the page (author names, registration numbers, new statistics) is "low", so
the loop never pushes the maker to invent facts.

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

or a final `{"type":"error","error":"…"}`.

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

## UI theme

Components use Tailwind palette classes. `src/theme.css` (generated by `scripts/build-theme.mjs`) remaps each palette
per theme: the dark theme uses the natural scales; the light theme (default) inverts the neutral scale and shifts the
hue scales so text stays readable on white. Elements inside `.palette-fixed` (page previews) always use the natural
scales. The theme is stored in `localStorage` (`co-theme`) and applied before first paint.

## Testing

- `npm test`: unit tests for the keyword picker and draft model, and pipeline tests that run the real gates,
  verification and revision loop against a scripted model client (`setAgentAIClientForTesting`).
- `npm run test:e2e`: live Bajaj Finserv pages through the running server; writes `docs/E2E-REPORT.md`. With
  `GEMINI_API_KEY` it also covers maker drafts, the gate loop and a scoped revision.
