# Handoff — status and next steps

**Last updated:** 2026-10-21

Read [PROJECT-BIBLE.md](PROJECT-BIBLE.md) first for what the tool is and why it works this way. This file is the
"where we are right now" note. The new owner's step-by-step guide (Vercel, API keys, Claude Code, AI Studio) is
[SETUP-GUIDE.md](SETUP-GUIDE.md).

---

## 1. State right now

| Area | Status |
|---|---|
| 9-agent pipeline (maker-first loop, gates 2–6, Agent 8, revise scopes) | Done; covered by tests |
| Resumable runs (steps + checkpoints, so each request fits Vercel's limit) | Done; tested with a scripted model and in the real 9-page run with a simulated 280 s limit |
| Enterprise UI (light default + dark toggle, mobile bottom nav, honest page preview) | Done |
| Security hardening ([SECURITY.md](SECURITY.md)) | Done; covered by tests/security.test.ts and live checks |
| Landing page at `/` (workspace at `/app`) | Done; checked in light/dark, desktop and phone widths |
| Keyword picker (deterministic, on-page phrases only) | Done |
| Guidelines | **None built in** (removed 2026-10-21); the owner adds them in the Guidelines tab; Export / Import moves all six types between browsers. The old Bajaj set is the e2e fixture `tests/fixtures/bajaj-guidelines.json`. Checked in the browser with empty guidelines |
| LLM router (chain of free Gemini models; cooldowns, overload retries, daily-quota pause, step deadline, cost logging) | Done; tested with mocked HTTP |
| Admin panel at `/admin` | Done; protected by `ADMIN_PASSWORD` |
| Type check / unit tests / build / Vercel build | Passing (66 tests) |
| Vercel deploy (`vercel.json` + `scripts/build-vercel.mjs`, Build Output API) | Built and tested locally (bundled function runs with no `node_modules`); **not yet deployed to a real Vercel project** |
| Real 9-page test on live pages | Run on 2026-10-20; a 4-page re-test on 2026-10-21 stopped after page 1 when the free Gemini quota ran out: see section 2 |

## 2. Real-page tests (2026-10-20 and 21)

### 21 Oct, morning: 4-page re-test, stopped after page 1

Pages: personal-loan, fixed-deposit, blog-prepay-personal-loan, article-emi-affordability, with
`E2E_MAX_REVISIONS=2` and `PIPELINE_STEP_SECONDS=280`. It was stopped after personal-loan because every Gemini
writer was out of daily quota: Flash-Lite and 3.8 Flash from the day before, and **2.5 Flash, whose free tier turned
out to be 20 requests a day** (its quota error says so). The other three pages would only have ended
`MAKER_UNAVAILABLE`.

| Page | Verdict | Score before → after | Drafts | Body kept | FAQs kept | What blocks it |
|---|---|---|---|---|---|---|
| personal-loan | not qualified (23/24 test checks) | 49 → 69 | 1 (the revision failed, see below) | **108%** (2,764 of 2,553 words; was 32%) | 22 of 23 | Invented "without restriction on how you use the funds" (real); a false compliance block (fixed since); keyword 64, customer 50 and compliance 68 under 70 |

One H1, heading order valid, FAQ last, title "Instant Personal Loan up to ₹55 Lakh \| Bajaj Finance" (52 characters),
no invented figures. The output is in `docs/e2e-outputs/personal-loan.md`; `E2E-REPORT.md` is still the 20 Oct run
(the report is written at the end of a run). It found three bugs, all fixed with tests but **not yet through a real
run** (section 3, last three rows).

### 20 Oct, evening

Four runs on 2026-10-20 (IST evening), free-tier Gemini and Groq, against a local server with Vercel's request
limit simulated (`PIPELINE_STEP_SECONDS=280`). The last run, after most fixes, is in [E2E-REPORT.md](E2E-REPORT.md)
and `docs/e2e-outputs/`:

| Page | Verdict | Score before → after | Body kept | FAQs kept | What still blocks it |
|---|---|---|---|---|---|
| personal-loan | not qualified | 59 → 76 | 32% (817 of 2,553 words) | 19 of 23 | Invented "won't affect your credit score"; coverage (body too short) |
| fixed-deposit | not qualified (24/24 test checks) | 59 → 77 | 85% | 20 of 25 | Only the false "insured by DICGC" block, **fixed since** |
| insta-emi-card | not qualified | 70 → 76 | 80% | 20 of 25 | Keyword gate 69 and customer gate 58 (just under 70) |
| blog-prepay-personal-loan | not qualified | 65 → 74 | 66% | 4 of 5 | An invented year (2024); three gates at 63–68 |
| blog-first-time-borrowers | not qualified | 56 → 71 | 59% | 4 of 4 | Fact check couldn't run (Gemini 503); compliance critical |
| blog-loan-in-10-minutes, 3 articles | maker unavailable | — | — | — | **Flash-Lite's free daily quota (500 requests) ran out** |

The 3 articles and the 10-minute-loan blog were completed in the earlier run (scores 47–56 → 62–69, body kept
71–85%), before the later fixes.

What the test proved:

- **Vercel limit:** every request of every run stayed under 280 s (longest 265 s); long runs took 2 requests.
- **No invented content got through.** Agent 8 blocked every invented claim the maker wrote (credit-score
  reassurances, "no prepayment penalty", a 300–900 score range, a year).
- **Coverage** went from 28% of the page in the first run to 59–85% of the body (FAQs counted separately).
- **Scores rose** on every page that got drafts (by 6 to 19 points).

What it didn't prove: **no page has been approved yet.** The last blockers are mostly real (invented claims a single
revision didn't remove; gates just under 70), plus fixes made after the last run (DICGC negation, FAQ lists written
as sections, Groq-first waiting, daily-quota pause) that haven't been through a real run.

## 3. What changed because of the real test

The first real runs (Gemini key from a second Google account; the first account's key gets 403 "project denied
access") exposed these problems. Each is fixed and has a test:

| Found | Fix |
|---|---|
| One page took 943 s; Vercel Hobby stops a request at 300 s | Resumable pipeline: steps + checkpoints; the browser continues the run in a new request. Every request in the final run stayed under the limit |
| 3.8 Flash: ~20 free requests/day, ~150 s per call, timeouts; then Flash-Lite's 500/day ran out in one test day | A chain of free Gemini models, each with its own daily quota: 2.5 Flash → Flash-Lite → Gemma 4 31B → 3.8 Flash (chosen by a bake-off on the real maker prompt, 2026-10-21) |
| Timeouts repeated on every call to an overloaded model | Timed-out or failing models go to the back of the line for 3 min |
| Free-tier "503 high demand" spells of a minute or more | Router waits 15 / 30 / 45 s and retries the list; on Vercel a wait that doesn't fit continues in the next request |
| Flash-Lite sometimes loops to its 16k output cap (invalid JSON) | One fresh try on the same model before moving on |
| Maker cut a 2,666-word page to ~800 words and 25 FAQs to 3 | "Rewrite, don't cut" rule with the source's body word count and FAQ count as a target; a second maker call rewrites the sections when the body is still short; gate 4 checks coverage |
| Maker invented a toll-free number, an EMI example and a "soft check" claim | Gate findings that need an editor (`needsEditorInput`) are no longer sent to the maker; Agent 8 still blocks invented claims |
| Gates' AI reviews and Agent 8's fact check failed silently (rules only) | A review that couldn't run blocks approval ("Review incomplete", "Fact check could not run") |
| Fact check blocked a claim the source states (Form 121) | A flagged claim whose words and numbers all occur in the source is only a warning |
| Gates 2, 5, 6 scored "100 − 7..10 per finding": minor notes failed every page | Severity-weighted scoring; editor-only findings don't count |
| Maker wrote FAQs as an H2 section (0 FAQs counted, FAQ not last) | Such a section is moved into the FAQ list unchanged |
| FD drafts that included the required "not insured by DICGC" disclosure were blocked for the forbidden phrase "insured by DICGC" | A forbidden phrase inside a negation doesn't count |
| 21 Oct: a long-page revision on 2.5 Flash thought for its maximum 24,576 tokens, leaving too little of the 32,768 budget, so its JSON was cut off | 2.5 models keep half of a large output budget for the answer (`geminiConfig`) |
| 21 Oct: compliance blocked personal-loan for a missing "subject to change"/KFS note that was on the page, past the 12,000 characters the AI gates read | A "missing" finding whose quoted wording is further down the page becomes a warning (`checkAgainstFullPage`) |
| 21 Oct: the keyword picker chose "personal loan based", and the keyword gate told the maker to use it | Phrases ending in "based", "according", "due" and similar words are not keywords |

## 4. Next steps

0. **Final re-test on the final code, then commit and push (owner's order).**
   - **Done (21 Oct): the hard-coded guidelines are removed** (`src/data/bajajVerticals.ts` deleted; no `BUILT_IN_*`
     lists or `BAJAJ_PROFILES` in `src/data/defaultProfiles.ts`; `src/data/defaults.ts` had only empty text and
     neutral limits, which stay). The e2e test reads `tests/fixtures/bajaj-guidelines.json`, generated from the old
     built-ins and checked identical. Empty guidelines were checked in unit tests (pipeline approves a clean draft and
     still blocks an invented figure) and in the browser (empty states, saving a guideline, export, import, reload).
     The profile manager's export (`GuidelineProfileManager.tsx`) turned out never to be shown in the UI and to miss
     the per-section guidelines, so **Export / Import now sit in the Guidelines tab header** and cover all six
     types plus profiles. `GuidelineProfileManager.tsx` is still unused.
   - The 21 Oct morning re-test stopped after page 1 (section 2). Re-run the same 4 pages after Gemini's daily reset
     (12:30 IST), when all four Gemini models are fresh. The owner chose 3–4 pages over 9 to save the free quota:

     ```bash
     BASE_URL=http://localhost:3005 E2E_MAX_REVISIONS=2 E2E_PAGES=personal-loan,fixed-deposit,blog-prepay-personal-loan,article-emi-affordability node node_modules/tsx/dist/cli.mjs scripts/e2e-bajaj.ts
     ```

     2.5 Flash's 20 requests a day cover about the first two or three pages; Flash-Lite writes the rest. Groq's
     daily tokens refill continuously (~8,300 an hour per model), so the checks spill over to Gemini after ~5 pages.
   - Then scan the staged files for secrets, commit, and push to `main` (only when the owner says so).
1. **Deploy to the new owner's Vercel** (SETUP-GUIDE.md) and run the 9-page test against the live site. The Gemini
   key stays in Vercel; the test needs only the site address and the protection-bypass secret:

   ```bash
   BASE_URL=https://<site>.vercel.app VERCEL_BYPASS_SECRET=<secret> node node_modules/tsx/dist/cli.mjs scripts/e2e-bajaj.ts
   ```

2. **Run it when Gemini is quiet.** Free-tier Gemini was overloaded for long stretches in the evening (IST); daily
   quotas reset at midnight Pacific time (12:30 IST). Overloaded ("high demand") attempts appear to count against the
   daily quota too: on 20 Oct Flash-Lite's 500 were 271 answers and ~225 failed attempts.
3. **Look at the open quality items** in section 6, especially approval rates.
4. **Compliance review** of whatever guidelines the new owner's teams add (the old Bajaj set in
   `tests/fixtures/bajaj-guidelines.json` was written by engineering and never reviewed; see BAJAJ-VERTICALS.md).
5. **Switch off the old keys** after the new owner has replaced them with their own (Groq, Firecrawl, Google Ads,
   the second-account Gemini key).

Commands (the project path contains `&`, so call tools through Node, see section 5):

| Task | Command |
|---|---|
| Probe Gemini (prints OK or the error, never the key) | `node -e "require('dotenv/config');const{GoogleGenAI}=require('@google/genai');new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}).models.generateContent({model:'gemini-2.5-flash',contents:'Say OK'}).then(r=>console.log('OK',r.text)).catch(e=>console.log('FAIL',e.status,e.message))"` |
| Dev server, simulating Vercel's limit | `PIPELINE_STEP_SECONDS=280 node node_modules/tsx/dist/cli.mjs server.ts` |
| 9-page test (local server) | `node node_modules/tsx/dist/cli.mjs scripts/e2e-bajaj.ts` (`E2E_PAGES=…` for a subset, `E2E_MAX_REVISIONS` default 1) |
| Vercel build, locally | `node scripts/build-vercel.mjs` |

## 5. Environment and quirks

- **The project path contains `&`** (`D:\project\Aritra seo-&-content-dual-agent-optimizer`). `npm run …` and `npx`
  fail on Windows, so call tools through Node:

  | Task | Command |
  |---|---|
  | Type check | `node node_modules/typescript/bin/tsc --noEmit` |
  | Tests | `node --import ./node_modules/tsx/dist/esm/index.mjs --test tests/*.test.ts` |
  | Build | `node node_modules/vite/bin/vite.js build` |
  | Theme | `node scripts/build-theme.mjs` |

- **Shell quoting:** for complex one-off scripts, write a file and run it with `node`, rather than fighting bash or
  PowerShell quoting.
- **Node** v24. The server is on port 3000 (`PORT` overrides it).
- **`.env`** holds `GEMINI_API_KEY` (second Google account; works), `GROQ_API_KEY` (free tier), `FIRECRAWL_API_KEY`,
  the Google Ads values (**`GOOGLE_ADS_DEVELOPER_TOKEN` is empty**, so volumes show "vol. n/a") and `ADMIN_PASSWORD`
  (never print it).
- **Usage logs** are in `data/usage/*.jsonl` (git-ignored); they include all of 2026-10-20's test runs.

## 6. Known issues and open items

- **Approval rate: 0 so far** (9 pages on 20 Oct, personal-loan on 21 Oct). Re-run with the final code after
  12:30 IST and look at what still blocks approval. Run the e2e test with `E2E_MAX_REVISIONS=2` (the app's
  default; the script's own default is 1): the second round gives the maker another chance to remove invented
  claims.
- **A revision is applied even when it scores lower** than the content it started from (personal-loan's metadata
  revision: 81 → 67). Partly score noise: the same text scored 69 and 81 in two audits, mostly because of the false
  compliance block fixed on 21 Oct.
- **Long pages may come out short.** Flash-Lite writes at most ~1,500–2,500 words per answer, so when it has to
  write a long page (Personal Loan's body: 2,553 words) the coverage check blocks it. 2.5 Flash, now first in the
  chain, wrote 109% of the Insta EMI Card body in the bake-off; long pages still need checking in a full run.
- **Free-tier capacity.** 2.5 Flash, the best writer, allows only **20 requests a day** (Google's quota error,
  2026-10-21), enough for about two pages; Flash-Lite (500 a day) does most of the writing after that, and keeps
  less of a long page. Gemma 4 31B (~1,500 a day) is capped at 16,000 tokens a minute, too few for a long page's
  maker prompt. Groq's 200,000 tokens a day per model refill continuously (~8,300 an hour).
- **Other free providers checked (2026-10-21):** Cerebras is now a 30-day $5 trial; OpenRouter's free models allow
  50 requests a day; Mistral no longer publishes free limits and may train on free-tier data; NVIDIA Build
  (build.nvidia.com) allows 40 requests a minute with no daily cap and strong open models, but its trial terms
  are for testing and evaluation only (not publishing the generated content) and it isn't wired in.
- **Free-tier reliability.** Gemini's free tier was overloaded for minutes at a time. Runs then end
  `MAKER_UNAVAILABLE` (reported honestly; run again later). The owner chose free tiers only for now.
- **Meta titles** often land a few characters outside 50–60, or without the brand; the SEO gate flags it, but one
  revision round doesn't always fix it.
- **The numeric fabrication guard is literal.** The same figure in a different form ("₹5 lakh" vs "5,00,000") may be
  flagged.
- **Usage logs on Vercel are temporary** (`/tmp`); the admin panel shows recent activity only.
- **Guidelines are stored per browser** (`localStorage`), not shared between users; Export / Import in the
  Guidelines tab moves them. Shared server-side storage would need a small database.
- **The tool has no login of its own.** On Vercel use Vercel Authentication with "All Deployments" (SETUP-GUIDE §5).
- **The repo is public.** The owner should make it private.
- **Rotate the secrets** that were hard-coded in old commits: the Firecrawl key and the Google Ads client secret and
  refresh token.

## 7. Working agreements with the owner

- The owner is Suman Debnath, handing the project to a non-technical friend; the tool is for Bajaj Finserv's
  internal use only. The Vercel site is for approvals and testing; if approved, the enterprise app is hosted
  elsewhere. It must work on Vercel Hobby without losing quality.
- **Free tiers only** for Gemini and Groq.
- **Ask before big decisions;** explain things in plain language.
- **Commit and push only when asked.** Scan staged files for secrets before every commit, using the patterns
  `fc-`, `AIza`, `AQ.`, `gsk_`, `GOCSPX-`, `1//0`, `gh?_`, `sk-`. End commit messages with the Co-Authored-By trailer.
- **Never print secret values,** including `ADMIN_PASSWORD`.
- **The maker stays free on structure and wording; it never invents facts and rewrites rather than cuts.**

## 8. Where to look

| Need | File |
|---|---|
| New owner's guide | [SETUP-GUIDE.md](SETUP-GUIDE.md) |
| Design, agents, routing, decisions | [PROJECT-BIBLE.md](PROJECT-BIBLE.md) |
| Technical flow, API, streaming, checkpoints | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Guidelines (storage, export/import) | `src/data/defaultProfiles.ts`, Guidelines tab (`src/components/GuidelinesTab.tsx`) |
| The e2e test's Bajaj guidelines | `tests/fixtures/bajaj-guidelines.json`, [BAJAJ-VERTICALS.md](BAJAJ-VERTICALS.md) |
| Setup, config, scripts | [../README.md](../README.md) |
| Pipeline code | `src/services/agentPipeline.ts`, `src/services/pageDraft.ts` |
| Model router | `src/services/llm.ts` |
| Vercel build | `vercel.json`, `scripts/build-vercel.mjs` |
| Admin panel | `src/components/admin/`, `src/services/adminMetrics.ts`, `src/services/usageStore.ts` |
| Real-page test | `scripts/e2e-bajaj.ts` |
