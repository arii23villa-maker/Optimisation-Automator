# Setup guide: host the Content Optimizer and start working on it

This guide is for the new owner of the project. You don't need to be technical. Follow the parts in order the
first time; later you'll only need the part you're working on.

| Part | What you'll do | Time |
|---|---|---|
| [1. Before you start](#1-before-you-start) | Collect what you need | 5 min |
| [2. Get your own API keys](#2-get-your-own-api-keys) | Create Gemini and Groq keys in your name | 10 min |
| [3. Put the site on Vercel](#3-put-the-site-on-vercel) | Import the GitHub repo, add the keys, deploy | 15 min |
| [4. Check that it works](#4-check-that-it-works) | Open the site, add your guidelines, run one page | 30 min |
| [5. Lock the site](#5-lock-the-site-so-only-your-team-can-use-it) | Make sure only your team can open it | 5 min |
| [6. Change API keys later](#6-change-an-api-key-later) | Replace a key on Vercel (and on your computer) | 5 min |
| [7. Work on it with Claude Code](#7-work-on-the-project-with-claude-code) | Edit the project on your computer with Claude | 20 min |
| [8. Work on it in Google AI Studio](#8-work-on-the-project-in-google-ai-studio) | Edit the project in your browser | 15 min |
| [9. If something goes wrong](#9-if-something-goes-wrong) | Common problems and fixes | — |

---

## 1. Before you start

You need:

- **The GitHub repository:** `arii23villa-maker/Optimisation-Automator`. It already has the latest code on the
  `main` branch, so there's nothing to download.
- **Your Vercel account**, already connected to your GitHub (you have this).
- **The `.env` file** that Suman sent you. It holds the settings and keys the app needs. Treat it like a password:
  don't post it, email it around, or upload it to GitHub.
- **A Google account** for the Gemini key, and an email address for a Groq account.

> **Which Vercel plan?** The app works on both. Vercel stops any single request after 5 minutes on the free
> **Hobby** plan (up to about 13 minutes on **Pro**), so a page run is split into several shorter requests
> automatically; you don't have to do anything. Note that Vercel's terms say Hobby is for personal,
> non-commercial use, so check whether a company test site should be on **Pro** ($20/month).

---

## 2. Get your own API keys

The `.env` file from Suman contains **Suman's** keys. Replace them with your own so usage and bills are in your
name. Do these two now; the others are optional.

### 2.1 Gemini key (required: it writes the pages)

1. Go to **https://aistudio.google.com/apikey** and sign in with your Google account.
2. Click **Create API key**. If asked, choose **Create API key in new project**.
3. Copy the key and keep it somewhere safe (a password manager is best).

> If Gemini later says **"Your project has been denied access"**, Google has blocked that Google account. A new
> key on the same account usually doesn't help. See [section 9](#9-if-something-goes-wrong).

### 2.2 Groq key (recommended: it runs the review checks)

1. Go to **https://console.groq.com/keys** and sign up or sign in.
2. Click **Create API Key**, give it a name such as `content-optimizer`, and click **Submit**.
3. Copy the key now: Groq shows it only once.

### 2.3 Optional keys

| Key | Where to get it | What happens without it |
|---|---|---|
| `FIRECRAWL_API_KEY` | https://www.firecrawl.dev → sign in → **API Keys** | The app reads pages directly. A few sites block that. |
| The five `GOOGLE_ADS_…` values | Google Ads API (needs a developer token) | Keywords show "vol. n/a". Search volumes are never guessed. |

---

## 3. Put the site on Vercel

### 3.1 Import the repository

1. Go to **https://vercel.com/new**.
2. Under **Import Git Repository**, find **Optimisation-Automator** and click **Import**.
   - Don't see it? Click **Adjust GitHub App Permissions** (or **Configure GitHub App**), allow access to the
     repository, and come back.
3. On the **Configure Project** screen:
   - **Project Name:** anything, for example `content-optimizer`.
   - **Framework Preset:** leave it as Vercel sets it (**Other**).
   - **Root Directory:** leave it as `./`.
   - **Build and Output Settings:** don't change anything. The project's `vercel.json` already tells Vercel how to
     build it.

### 3.2 Add the environment variables (the keys)

Still on the **Configure Project** screen, open **Environment Variables**.

**Quickest way:** open the `.env` file from Suman in Notepad, select everything (**Ctrl + A**), copy it
(**Ctrl + C**), click inside the first **Key** box on Vercel and paste (**Ctrl + V**). Vercel splits it into one row
per variable.

Then go through the rows and fix these:

| Variable | What to put in it |
|---|---|
| `GEMINI_API_KEY` | **Your** Gemini key from step 2.1 |
| `GROQ_API_KEY` | **Your** Groq key from step 2.2 |
| `ADMIN_PASSWORD` | A new password of your own for the admin page (`/admin`). At least 12 characters. |
| `FUNCTION_MAX_DURATION` | Optional. **Pro plan: add it with `800`** (fewer, longer requests per run). Hobby plan: leave it out. |
| `USAGE_LOG_DIR` | Delete this row if it's there. |
| `GOOGLE_ADS_…` (five rows) | Delete them unless you have your own Google Ads API access. |
| `FIRECRAWL_API_KEY` | Your own Firecrawl key, or leave Suman's for now and replace it later (section 6). |

Leave any other rows (`GROQ_MODEL`, `GROQ_TPM_LIMIT`, and so on) as they are. You don't need to choose Gemini models:
the app uses several free ones in turn on your one key.

> Typing the variables in by hand instead? Type the name exactly as shown (capital letters, underscores) in **Key**
> and the value in **Value**, then click **Add**. Don't put quote marks around values.

### 3.3 Deploy

1. Click **Deploy**.
2. Wait for the build (about 1–3 minutes). When you see a congratulations screen, click **Continue to Dashboard**.
3. Your site address is shown under **Domains**, for example `content-optimizer.vercel.app`.

From now on, **every time new code is pushed to the `main` branch on GitHub, Vercel updates the site by itself**
within a few minutes.

---

## 4. Check that it works

1. Open `https://<your-site>.vercel.app/api/health` in your browser. You should see a short line of text containing
   `"gemini":true` and `"groq":true`. If either says `false`, that key is missing or misspelled (see section 9).
2. Open `https://<your-site>.vercel.app`. A landing page explains the tool; click **Open workspace** (or go straight to
   `https://<your-site>.vercel.app/app`). Click the logo at the top left to get back to the landing page.
3. Add your guidelines (section 4.1 below). The app comes with none: each team writes its own.
4. Run one page:
   1. In **Audit workspace**, paste a page address, for example `https://www.bajajfinserv.in/insta-emi-card`, and
      click **Fetch page**.
   2. Under **Active guidelines**, pick your saved guideline in each box (Content, Product, SEO, and so on). A box
      that says **None saved yet** is skipped: the review gates then use only the tool's own rules (no invented
      facts, no cut content, heading order, SEO basics).
   3. Click **Run pipeline** and watch the progress. At the end you get a verdict, scores and the rewritten page.
5. Open `https://<your-site>.vercel.app/admin` and sign in with your `ADMIN_PASSWORD` to see usage and costs.

### 4.1 Add your guidelines

Guidelines tell the review gates what your brand and products need: tone, brand name, forbidden phrases, required
disclosures, title lengths, page structure and so on. Open the site → **Open workspace** → **Guidelines** tab. There
are six sections:

| Section | What goes in it |
|---|---|
| 1. Content | Tone of voice, reading level, paragraph length, formatting rules, banned clichés |
| 2. Product | Product name, **brand name** (for example "Bajaj Finance"; the SEO gate checks titles for it), audience, selling points, **forbidden phrases**, compliance notes |
| 3. SEO | Title and description lengths, schema types, other SEO rules |
| 4. GEO | How the page should read for AI answer engines |
| 5. Structure | Heading rules, preferred section order, keyword placement |
| 6. Customer centricity | Who the reader is, sentence and paragraph limits, things that put readers off |

For each section:

1. Fill in the fields. You don't have to fill in everything; empty fields are skipped.
2. Click **Save as New Guideline**, give it a name (for example "Personal Loan" or "Bajaj house style") and save.

Make one Product guideline per product (Personal Loan, Fixed Deposit, …). The other sections can usually be shared by
all products.

> **Only put rates, fees and limits in Product guidelines if they are current and approved.** The writer treats
> everything there as an approved fact and may publish it.

**Guidelines are saved in your browser only.** Another computer, another browser or a colleague won't see them
until you share them:

- **Export** (top of the Guidelines tab) downloads one file with every guideline you've saved, in all six sections.
  Keep it as a backup.
- **Import** on the other browser loads that file. Guidelines already there are kept, and importing a newer export of
  the same guidelines updates them instead of adding duplicates.

Clearing your browser's data deletes the guidelines, so export them again after each change.

> The admin page on Vercel only shows **recent** activity. Vercel clears its temporary storage from time to time,
> so older history disappears. Use each provider's own dashboard for billing history.

---

## 5. Lock the site so only your team can use it

Every run uses your API keys' free quota, so don't leave the tool open to everyone. There are two locks; use
either or both.

**Option A: Vercel's login gate** (only people in your Vercel team can open the site)

1. In Vercel, open your project → **Settings** → **Deployment Protection**.
2. Turn on **Vercel Authentication** and set the scope to **All Deployments** (not "Standard Protection", which
   leaves the main address open).
3. Click **Save**.

To give a colleague access, invite them under your team's **Settings → Members** (on Pro, each member is a paid
seat).

**Option B: a site password** (anyone with the password can use it; no Vercel account needed)

1. In Vercel → **Settings** → **Environment Variables**, add `APP_PASSWORD` with a password of your choice
   (12+ characters).
2. **Redeploy** (section 6, step 4).

The landing page stays open to everyone; opening the workspace asks for the password. Share it only with your team.
Ten wrong guesses in a row lock that person out for 15 minutes.

What the tool already does on its own (rate limits, blocking hidden "instructions to the AI" in pages, refusing
private network addresses, and more) is explained in [SECURITY.md](SECURITY.md).

**If Suman needs to run the automated test against your site** (recommended before you start using it):

1. On the same **Deployment Protection** page, find **Protection Bypass for Automation** and click **Add Secret**
   (or **Generate**).
2. Copy the secret and send it to Suman privately, together with your site address. Suman can delete-and-regenerate
   it later, or you can remove it once testing is done.

> Also consider making the GitHub repository **private** (GitHub → the repo → **Settings** → scroll to
> **Danger Zone** → **Change visibility** → **Make private**). Vercel keeps working with private repositories.

---

## 6. Change an API key later

Do this whenever you replace Suman's keys with yours, or a key stops working, or you want to rotate a key.

### On Vercel (the live site)

1. Open your project in Vercel → **Settings** → **Environment Variables**.
2. Find the variable (for example `GROQ_API_KEY`), click the **⋯** menu on its right → **Edit**.
3. Paste the new value and click **Save**.
4. **Important:** the site keeps using the old key until it is rebuilt. Go to the **Deployments** tab, click the
   **⋯** menu on the top (newest) deployment → **Redeploy** → **Redeploy**.
5. After 1–3 minutes, open `/api/health` again to check the key shows `true`.

The keys you're most likely to change:

| Variable | Where to get a new one |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `GROQ_API_KEY` | https://console.groq.com/keys |
| `FIRECRAWL_API_KEY` | https://www.firecrawl.dev (dashboard → API Keys) |
| `ADMIN_PASSWORD` | Make one up |

### On your computer (if you work on the project locally)

1. Open the `.env` file in the project folder with Notepad.
2. Replace the value after the `=` sign, for example `GROQ_API_KEY="your-new-key"`.
3. Save the file, then stop and start the app again (in Claude Code, just ask: *"restart the app"*).

### When you've switched everything to your own keys

Tell Suman, so Suman can switch off the old keys on their accounts.

---

## 7. Work on the project with Claude Code

Claude Code is Claude working directly in the project's files on your computer. You describe what you want in
plain English; it reads the code, makes the change, runs it and shows you. It needs a paid Claude plan (Pro or Max).

### 7.1 One-time setup (Windows)

1. **Install Node.js:** go to https://nodejs.org, download the **LTS** version, run the installer and accept the
   defaults.
2. **Install GitHub Desktop:** go to https://desktop.github.com, install it and sign in with your GitHub account.
3. **Copy the project to your computer:** in GitHub Desktop, click **File → Clone repository**, pick
   **Optimisation-Automator**, keep the suggested folder (for example `Documents\GitHub\Optimisation-Automator`)
   and click **Clone**.
   - Avoid folder names with `&` in them; they break some of the project's tools on Windows.
4. **Add the `.env` file:** copy the `.env` file (with your own keys, see section 6) into that project folder.
   - The name must be exactly `.env`, with no `.txt` at the end. In File Explorer, turn on
     **View → Show → File name extensions** to check.
   - Git is set up to never upload this file, so it stays on your computer.
5. **Install Claude:** go to https://claude.ai/download, install the Claude desktop app and sign in.

### 7.2 Start working

1. Open the Claude app and go to the **Code** tab.
2. Choose the project folder (`Documents\GitHub\Optimisation-Automator`).
3. For your first message, paste this:

   > Read README.md, docs/PROJECT-BIBLE.md and docs/HANDOFF.md so you understand this project. Then install what
   > it needs, start the app and open it for me.

4. Then ask for what you want in plain words, for example:
   - *"Show the brand name field more prominently in the Guidelines tab."*
   - *"The FAQ section is too long in the output. Make the maker keep it to 6 questions."*
   - *"Run the real 9-page test and tell me the results."*

### 7.3 Publish your changes to the live site

When you're happy with a change, tell Claude:

> Commit these changes and push them to GitHub.

Vercel sees the new code and updates your site in a few minutes. Watch it under your Vercel project →
**Deployments**: the newest one should say **Ready**.

### 7.4 Get other people's changes

If someone else (or AI Studio, section 8) pushed changes, tell Claude *"pull the latest changes from GitHub"*, or
click **Fetch origin** then **Pull origin** in GitHub Desktop.

---

## 8. Work on the project in Google AI Studio

Google AI Studio's **Build** mode lets you edit the app in your browser by chatting with Gemini, with nothing to
install. Google describes the GitHub import as a new feature, so the button names below may be slightly different
on your screen.

### 8.1 Import the project

1. Go to **https://aistudio.google.com** and sign in.
2. Click **Build** in the left menu.
3. In the chat box, click the **+** (**Add files**) button → **Import from GitHub**.
4. Allow AI Studio to access your GitHub if it asks, then choose **Optimisation-Automator**.

### 8.2 Add the keys

1. Open **Settings** → **Secrets** in your AI Studio app.
2. `GEMINI_API_KEY` is set up for you automatically.
3. Add the others as new secrets, with the same names as in your `.env` file: at least `GROQ_API_KEY` and
   `ADMIN_PASSWORD`, and `FIRECRAWL_API_KEY` if you have one.

### 8.3 Keep AI Studio and GitHub in sync

1. Open **Settings** → **GitHub** and link the existing repository **Optimisation-Automator**.
2. After making changes in AI Studio, use **push** to send them to GitHub. Vercel then updates the live site.
3. If you also changed things in Claude Code, use **pull** in AI Studio first to bring those changes in.
4. If AI Studio shows **Resolve conflicts**, it means the same file was changed in two places. Pick the version you
   want for each file, or ask Claude Code to help.

> **Check the live site after each push from AI Studio.** AI Studio can reorganise files when it imports a project.
> Open Vercel → **Deployments**: the newest deployment should say **Ready**. If it says **Error**, click the
> previous deployment that said **Ready** → **⋯** → **Promote** (or **Instant Rollback**) to put the old version
> back, then ask Claude Code: *"The Vercel build is failing after the last push from AI Studio. Find out why and
> fix it."*

---

## 9. If something goes wrong

| What you see | What it means | What to do |
|---|---|---|
| Vercel shows **Build Failed** | The code didn't build | Open the failed deployment → **Build Logs**. Copy the red lines into Claude Code and ask it to fix it, or send them to Suman. Meanwhile, roll back as in section 8.3. |
| `/api/health` shows `"gemini":false` (or `groq`) | The key is missing or the name is misspelled | Check the variable name in Vercel (section 6), then **Redeploy**. |
| Gemini error **"Your project has been denied access"** | Google has blocked that Google account for the Gemini API. It isn't a problem in the app. | In AI Studio, check the **Projects** and **Billing** pages for a warning with an appeal link. Turning on billing for the project, or confirming your date of birth in your Google Account, has fixed it for some people. Otherwise, create the key with a different Google account. |
| You see **FUNCTION_INVOCATION_TIMEOUT**, or a run ends with "could not finish within the hosting time limit" | One step took longer than Vercel allows a request, usually because Gemini is overloaded | Wait a few minutes and run it again. On Pro, set `FUNCTION_MAX_DURATION` to `800` and **Redeploy**. If `FUNCTION_MAX_DURATION` is set on Hobby, it must be `300` or less. |
| Messages about **rate limit** or long waits | Groq's free plan allows only a little use per minute | Wait and try again, or upgrade Groq to its paid Developer tier at https://console.groq.com/settings/billing. |
| Pages are checked but **not rewritten** ("MAKER_UNAVAILABLE") | Gemini couldn't write the page: its free tier was busy ("high demand"), the free daily limits of all its Gemini models are used up, or the key isn't working | Busy: try again in a few minutes. Daily limit: it resets every day at 12:30 IST. Key: check `/api/health` and the rows above. |
| A run says **"Fact check could not run"** or **"Review incomplete"** | A model wasn't available for one of the checks, so the page can't be approved yet | Run it again later. The tool won't approve a page on a partial check. |
| The admin page says it's **disabled** | `ADMIN_PASSWORD` isn't set | Add it in Vercel (section 6), then **Redeploy**. |
| Someone outside your team can open the site | Protection is off or set to "Standard" | Section 5: **Vercel Authentication**, scope **All Deployments**. |

**More detail** for when you or Claude need it: [README.md](../README.md) (setup and settings),
[PROJECT-BIBLE.md](PROJECT-BIBLE.md) (how the tool works and why), [HANDOFF.md](HANDOFF.md) (current status and next
steps).
