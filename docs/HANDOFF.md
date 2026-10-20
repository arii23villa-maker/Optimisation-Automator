# Handoff — status and next steps

**Last updated:** 2026-10-20 · **Last code commit:** `064e5ca` (Groq + Gemini router, usage tracking, admin panel)

Read [PROJECT-BIBLE.md](PROJECT-BIBLE.md) first for what the tool is and why it works this way. This file is the
"where we are right now" note for the next working session.

---

## 1. State right now

| Area | Status |
|---|---|
| 9-agent pipeline (maker-first loop, gates 2–6, Agent 8, revise scopes) | Done; covered by tests |
| Enterprise UI (light default + dark toggle, mobile bottom nav, honest page preview) | Done |
| Keyword picker (deterministic, on-page phrases only) | Done |
| Bajaj Finserv vertical presets (9 verticals + content standard) | Done; **needs review by each vertical's compliance owner** |
| LLM router (Gemini + Groq, fallbacks, cost/token logging) | Done; tested with mocked HTTP |
| Admin panel at `/admin` | Done; protected by `ADMIN_PASSWORD` |
| Type check / unit tests / build | Passing (29 tests) |
| **Real 9-page test on live Bajaj Finserv pages** | **Not run yet: waiting for a working Gemini key** |
| `docs/E2E-REPORT.md` | **Stale**: from an older 6-page run before the router existed; the next run replaces it |

## 2. Blocker: the Gemini key

The current `GEMINI_API_KEY` can list models, but every generate call returns **403 "Your project has been denied
access"**: Google has blocked that Cloud project. This isn't a code problem.

**What the owner is doing:** creating a new key in a **new Google Cloud project, or a different Google account**, at
https://aistudio.google.com/apikey, then putting it in `.env` as `GEMINI_API_KEY=…`.

Until then:

- The maker (Agent 7) can't write full pages. Groq's free tier allows only 8,000 tokens per minute, and a page is
  10–25k tokens, so the router skips it. Runs end as **MAKER_UNAVAILABLE**: pages are audited but not rewritten.
- Gates 2, 5 and 6, keywords and the H2 optimizer still run on Groq.

## 3. First thing to do in the next session

When the owner says the new Gemini key is in `.env`:

1. **Probe the key with a single call** (it prints only OK or the error, never the key):

   ```bash
   node -e "require('dotenv/config');const{GoogleGenAI}=require('@google/genai');new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY}).models.generateContent({model:'gemini-3.8-flash',contents:'Say OK'}).then(r=>console.log('OK',r.text)).catch(e=>console.log('FAIL',e.status,e.message))"
   ```

2. **Restart the dev server** so it picks up the new `.env`. Stop any old one on port 3000 first.

   ```bash
   node node_modules/tsx/dist/cli.mjs server.ts
   ```

3. **Check** `GET http://localhost:3000/api/health`: `integrations.gemini` and `integrations.groq` should be `true`.
4. **Run the 9-page real test.** It takes a while, because of Groq rate-limit waits.

   ```bash
   node node_modules/tsx/dist/cli.mjs scripts/e2e-bajaj.ts
   ```

   - Pages (`DEFAULT_SET` in `scripts/e2e-bajaj.ts`):

     | Type | Pages |
     |---|---|
     | Products | personal-loan, fixed-deposit, insta-emi-card |
     | Blogs | how-to-prepay-personal-loan, personal-loan-for-first-time-borrowers, instant-personal-loan-in-10-minutes |
     | Articles | how-much-emi-can-i-afford, fd-closure-process, how-salaried-employees-can-get-a-digital-personal-loan |

   - Output: `docs/E2E-REPORT.md` plus one before/after file per page in `docs/e2e-outputs/<page>.md`.
   - Options:
     - `E2E_PAGES=personal-loan,fd-closure` runs a subset;
     - `E2E_MAX_REVISIONS=1` makes runs shorter;
     - `E2E_REPORT` and `E2E_OUTPUT_DIR` change the output paths.
5. **Report to the owner:** verdict per page, before→after scores, drafts used, cost, and the output files.
6. **Look hard for problems:**
   - invented figures getting through;
   - false "critical" findings from the gates;
   - heading order;
   - brand naming ("Bajaj Finance" vs "Bajaj Finserv" per vertical);
   - FAQ at the end;
   - schema;
   - Groq rate-limit storms;
   - fallback frequency, shown in the admin panel.

## 4. Environment and quirks

- **The project path contains `&`** (`D:\project\Aritra seo-&-content-dual-agent-optimizer`). `npm run …` and `npx`
  fail on Windows, so call tools through Node:

  | Task | Command |
  |---|---|
  | Type check | `node node_modules/typescript/bin/tsc --noEmit` |
  | Tests | `node --import ./node_modules/tsx/dist/esm/index.mjs --test tests/*.test.ts` |
  | Build | `node node_modules/vite/bin/vite.js build` |
  | Theme | `node scripts/build-theme.mjs` |

- **Shell quoting:** for complex one-off scripts, write a `.cjs` file to the scratchpad and run it with `node`,
  rather than fighting bash or PowerShell quoting.
- **Node** v24. The server is on port 3000 (Express + Vite middleware).
- **`.env`** holds:
  - `GEMINI_API_KEY` (to be replaced) and `GROQ_API_KEY` (works, free tier);
  - `FIRECRAWL_API_KEY`;
  - the Google Ads values (**`GOOGLE_ADS_DEVELOPER_TOKEN` is empty**, so volumes show "vol. n/a");
  - `ADMIN_PASSWORD` (generated; read it from `.env` and never print it).
- **Usage logs** are in `data/usage/*.jsonl` (git-ignored). They hold the Groq-only smoke runs from 2026-10-20,
  which is why the admin panel already shows data and some MAKER_UNAVAILABLE runs.

## 5. Provider limits to keep in mind

| Provider | Plan | Limits |
|---|---|---|
| Groq | Free (owner's choice: "stay free, adapt") | 1,000 requests/day; **8,000 tokens/min per model** |
| Gemini | Free tier on `gemini-3.8-flash` | Per Google's current free-tier quotas; list prices rise on 2027-01-01 |
| Firecrawl | Free | 1,000 credits/month; about 950 left on 2026-10-20; resets 2026-11-07 |

Gates 2, 5 and 6 compete for Groq's 8k/min, so rate-limit waits are expected; the admin panel shows them. Groq's
Developer tier removes this if it becomes a problem.

## 6. Known issues and open items

- **Real-page validation of the full loop with Gemini hasn't happened yet.** This is the main risk. The gate prompts
  were tuned on Groq-only runs.
- **The numeric fabrication guard is literal.** The same figure in a different form (for example "₹5 lakh" vs
  "5,00,000") may be flagged as unsupported. Watch for this in the 9-page run.
- **Guideline presets are stored per browser** (`localStorage`), not shared between users.
- **The tool has no login of its own.** Deploy it behind company SSO/VPN.
- **The repo is public.** The owner should consider making it private.
- **Rotate the secrets** that were hard-coded in old commits: the Firecrawl key, and the Google Ads client secret and
  refresh token.
- **Optional:** a Google Ads developer token (verified volumes), the Groq paid tier, and compliance review of each
  vertical preset.

## 7. Working agreements with the owner

- The owner is Suman Debnath; the tool is for Bajaj Finserv's internal use only.
- **Ask before big decisions;** explain things in plain language.
- **Commit and push only when asked.** Scan staged files for secrets before every commit, using the patterns
  `fc-`, `AIza`, `gsk_`, `GOCSPX-`, `1//0`, `gh?_`, `sk-`. End commit messages with the Co-Authored-By trailer.
- **Never print secret values,** including `ADMIN_PASSWORD`.
- **The maker stays free;** the gates review afterwards. **Never invent facts or show made-up data as real.**

## 8. Where to look

| Need | File |
|---|---|
| Design, agents, routing, decisions | [PROJECT-BIBLE.md](PROJECT-BIBLE.md) |
| Technical flow, API, streaming | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Vertical presets | [BAJAJ-VERTICALS.md](BAJAJ-VERTICALS.md) |
| Setup, config, scripts | [../README.md](../README.md) |
| Pipeline code | `src/services/agentPipeline.ts`, `src/services/pageDraft.ts` |
| Model router | `src/services/llm.ts` |
| Admin panel | `src/components/admin/`, `src/services/adminMetrics.ts`, `src/services/usageStore.ts` |
| Real-page test | `scripts/e2e-bajaj.ts` |
