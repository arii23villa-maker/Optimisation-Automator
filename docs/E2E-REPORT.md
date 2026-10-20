# End-to-end test report — Bajaj Finserv pages

> **Stale (kept for reference).** This run predates the Gemini + Groq router, the 9-page test set and the gate
> quality fixes. It covered only the deterministic parts on 6 pages. The next run of `scripts/e2e-bajaj.ts`, after the
> new Gemini key is in place, overwrites this file. See [HANDOFF.md](HANDOFF.md).

Run: 2026-10-20T08:35:33.137Z against `http://localhost:3000`

Integrations: Gemini **not configured**, Firecrawl **configured**, Google Ads **not configured**.

> Without `GEMINI_API_KEY` the maker (Agent 7), the LLM parts of gates 2, 5 and 6, and the semantic check in Agent 8 cannot run. This run covers fetching, extraction, keyword picking, the deterministic gate checks, scoring and verdict handling. Re-run `npm run test:e2e` after adding the key to cover the maker loop.

**90/90 checks passed.**

| Page | Checks | Verdict | Primary keyword | Words | Time |
|---|---|---|---|---|---|
| [personal-loan](https://www.bajajfinserv.in/personal-loan) | 15/15 | MAKER_UNAVAILABLE | personal loan | 4511 | 3s |
| [business-loan](https://www.bajajfinserv.in/business-loan) | 15/15 | MAKER_UNAVAILABLE | business loan | 3456 | 1s |
| [home-loan](https://www.bajajfinserv.in/home-loan) | 15/15 | MAKER_UNAVAILABLE | home loan | 3795 | 1s |
| [gold-loan](https://www.bajajfinserv.in/gold-loan) | 15/15 | MAKER_UNAVAILABLE | gold loan | 3582 | 1s |
| [fixed-deposit](https://www.bajajfinserv.in/fixed-deposit) | 15/15 | MAKER_UNAVAILABLE | fixed deposit | 2782 | 2s |
| [insta-emi-card](https://www.bajajfinserv.in/insta-emi-card) | 15/15 | MAKER_UNAVAILABLE | insta emi card | 2666 | 1s |

## personal-loan

URL: https://www.bajajfinserv.in/personal-loan

- **source**: agent-1-firecrawl
- **title**: Apply for Instant Personal Loan up to ₹55 lakh at 10% p.a.* \| Bajaj Finance
- **words**: 4511
- **h2Sections**: 12
- **faqs**: 23
- **schemaTypes**: Product, WebPage, FinancialProduct, HowTo, SiteNavigationElement, SiteNavigationElement, SiteNavigationElement, SiteNavigationElement, SiteNavigationElement, LoanOrCredit, FAQPage, BreadcrumbList
- **structureIssues**: none
- **primaryKeyword**: personal loan
- **keywords**: personal loan \| instant personal loan \| personal loan interest rate \| loan amount \| personal loan based \| What are the uses of personal loan? \| bajaj finance personal loan \| personal loan application
- **verdict**: MAKER_UNAVAILABLE
- **baselineGates**: Compliance 92, SEO backend 51, Keyword & structure 90, Customer-centricity 78, EEAT & GEO 85
- **baselineFindings**: [SEO backend · warning] Incomplete Schema: Missing [Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (75 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (176 chars); [Customer-centricity · info] Dense Wall of Text (6 of 103 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Apply for Instant Personal Loan up to ₹55 lakh at 10% p.a.* \| Bajaj Finance |
| Has substantial content (≥200 words) | PASS | 4511 words |
| Found H2 sections | PASS | 12 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | personal loan |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 84 |
| Maker reports missing key honestly | PASS | The maker needs a Gemini API key. Set GEMINI_API_KEY in .env and restart the server. |
| Content unchanged without a maker | PASS |  |

## business-loan

URL: https://www.bajajfinserv.in/business-loan

- **source**: agent-1-firecrawl
- **title**: Apply for Business Loan Online - Up to 80 lakh \| Bajaj Finance.
- **words**: 3456
- **h2Sections**: 7
- **faqs**: 21
- **schemaTypes**: WebPage, Product, FAQPage, BreadcrumbList
- **structureIssues**: Heading levels skipped (1)
- **primaryKeyword**: business loan
- **keywords**: business loan \| instant business loan \| apply for business loan \| business loan online \| business loan decisions \| What is a business loan, and how much can one borrow? \| bajaj finance business loan \| small business loan
- **verdict**: MAKER_UNAVAILABLE
- **baselineGates**: Compliance 92, SEO backend 41, Keyword & structure 73, Customer-centricity 77, EEAT & GEO 85
- **baselineFindings**: [SEO backend · warning] Incomplete Schema: Missing [Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (63 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (172 chars); [SEO backend · warning] Meta Description Sentence Incomplete or Truncated; [Keyword & structure · warning] Target Keyword Missing from Headings: "business loan online"; [Keyword & structure · info] Target Keyword Missing from Headings: "bajaj finance business loan"; [Keyword & structure · warning] Heading levels skipped (1); [Customer-centricity · info] Dense Wall of Text (5 of 74 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Apply for Business Loan Online - Up to 80 lakh \| Bajaj Finance. |
| Has substantial content (≥200 words) | PASS | 3456 words |
| Found H2 sections | PASS | 7 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | business loan |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 81 |
| Maker reports missing key honestly | PASS | The maker needs a Gemini API key. Set GEMINI_API_KEY in .env and restart the server. |
| Content unchanged without a maker | PASS |  |

## home-loan

URL: https://www.bajajfinserv.in/home-loan

- **source**: agent-1-firecrawl
- **title**: Home Loan - Apply Housing Loan up to Rs. 15 crore* \| Bajaj Finance
- **words**: 3795
- **h2Sections**: 8
- **faqs**: 29
- **schemaTypes**: FinancialProduct, HowTo, WebPage, LoanOrCredit, FAQPage, BreadcrumbList
- **structureIssues**: FAQ section is not at the end of the page
- **primaryKeyword**: home loan
- **keywords**: home loan \| housing loan \| eligibility criteria \| home loan application \| interest rate \| What is the home loan processing fee? \| bajaj finance home loan \| documents required
- **verdict**: MAKER_UNAVAILABLE
- **baselineGates**: Compliance 92, SEO backend 51, Keyword & structure 78, Customer-centricity 76, EEAT & GEO 85
- **baselineFindings**: [SEO backend · warning] Incomplete Schema: Missing [Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (66 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (205 chars); [Keyword & structure · info] Target Keyword Missing from Headings: "bajaj finance home loan"; [Keyword & structure · warning] FAQ section is not at the end of the page; [Customer-centricity · info] Dense Wall of Text (8 of 91 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Home Loan - Apply Housing Loan up to Rs. 15 crore* \| Bajaj Finance |
| Has substantial content (≥200 words) | PASS | 3795 words |
| Found H2 sections | PASS | 8 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | home loan |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 82 |
| Maker reports missing key honestly | PASS | The maker needs a Gemini API key. Set GEMINI_API_KEY in .env and restart the server. |
| Content unchanged without a maker | PASS |  |

## gold-loan

URL: https://www.bajajfinserv.in/gold-loan

- **source**: agent-1-firecrawl
- **title**: Gold Loan - Apply Loan Against Gold Online Up to Rs. 2 crore \| Bajaj Finance
- **words**: 3582
- **h2Sections**: 8
- **faqs**: 23
- **schemaTypes**: Product, FAQPage, BreadcrumbList
- **structureIssues**: Heading levels skipped (1)
- **primaryKeyword**: gold loan
- **keywords**: gold loan \| loan against gold \| gold loan online \| apply for gold loan \| gold loan eligibility \| How can you repay your gold loan? \| How to get a gold loan with the best interest rate? \| bajaj finance gold loan
- **verdict**: MAKER_UNAVAILABLE
- **baselineGates**: Compliance 92, SEO backend 56, Keyword & structure 49, Customer-centricity 78, EEAT & GEO 85
- **baselineFindings**: [SEO backend · warning] Incomplete Schema: Missing [WebPage, Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (76 chars); [Keyword & structure · warning] Target Keyword Missing from Headings: "loan against gold"; [Keyword & structure · warning] Target Keyword Missing from Headings: "gold loan online"; [Keyword & structure · warning] Target Keyword Missing from Headings: "apply for gold loan"; [Keyword & structure · warning] Target Keyword Missing from Headings: "gold loan eligibility"; [Keyword & structure · info] Target Keyword Missing from Headings: "How can you repay your gold loan?"; [Keyword & structure · info] Target Keyword Missing from Headings: "How to get a gold loan with the best interest rate?"; [Keyword & structure · info] Voice & Question Headings Below Target (31% < 40%); [Keyword & structure · warning] Heading levels skipped (1); [Customer-centricity · info] Dense Wall of Text (6 of 100 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Gold Loan - Apply Loan Against Gold Online Up to Rs. 2 crore \| Bajaj Finance |
| Has substantial content (≥200 words) | PASS | 3582 words |
| Found H2 sections | PASS | 8 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | gold loan |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 80 |
| Maker reports missing key honestly | PASS | The maker needs a Gemini API key. Set GEMINI_API_KEY in .env and restart the server. |
| Content unchanged without a maker | PASS |  |

## fixed-deposit

URL: https://www.bajajfinserv.in/fixed-deposit

- **source**: agent-1-firecrawl
- **title**: Fixed Deposit - Open FD Online at High Interest Rates \| Bajaj Finance
- **words**: 2782
- **h2Sections**: 7
- **faqs**: 25
- **schemaTypes**: FAQPage, BreadcrumbList
- **structureIssues**: none
- **primaryKeyword**: fixed deposit
- **keywords**: fixed deposit \| interest rates \| fd online \| open fd \| senior citizens \| What is a fixed deposit (FD)? \| What is the tenure for investing in a Bajaj Finance FD? \| bajaj finance fixed deposit
- **verdict**: MAKER_UNAVAILABLE
- **baselineGates**: Compliance 84, SEO backend 37, Keyword & structure 53, Customer-centricity 73, EEAT & GEO 85
- **baselineFindings**: [Compliance · warning] Core Value Proposition Omitted: "Clear premature-withdrawal rules"; [SEO backend · warning] Incomplete Schema: Missing [WebPage, Subject Entity (Product/FinancialProduct/Service), Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (69 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (168 chars); [Keyword & structure · warning] Target Keyword Missing from Headings: "interest rates"; [Keyword & structure · warning] Target Keyword Missing from Headings: "fd online"; [Keyword & structure · warning] Target Keyword Missing from Headings: "open fd"; [Keyword & structure · warning] Target Keyword Missing from Headings: "senior citizens"; [Keyword & structure · info] Target Keyword Missing from Headings: "What is a fixed deposit (FD)?"; [Keyword & structure · info] Target Keyword Missing from Headings: "What is the tenure for investing in a Bajaj Finance FD?"; [Keyword & structure · info] Target Keyword Missing from Headings: "bajaj finance fixed deposit"; [Keyword & structure · info] Voice & Question Headings Below Target (18% < 40%); [Customer-centricity · info] Dense Wall of Text (2 of 73 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"; [Customer-centricity · warning] Run-On Sentences Detected (12 sentences > 30 words)

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Fixed Deposit - Open FD Online at High Interest Rates \| Bajaj Finance |
| Has substantial content (≥200 words) | PASS | 2782 words |
| Found H2 sections | PASS | 7 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | fixed deposit |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 74 |
| Maker reports missing key honestly | PASS | The maker needs a Gemini API key. Set GEMINI_API_KEY in .env and restart the server. |
| Content unchanged without a maker | PASS |  |

## insta-emi-card

URL: https://www.bajajfinserv.in/insta-emi-card

- **source**: agent-1-firecrawl
- **title**: Bajaj Finance Insta EMI Card: Apply Online and Get Quick Approval!
- **words**: 2666
- **h2Sections**: 8
- **faqs**: 25
- **schemaTypes**: WebPage, FAQPage, BreadcrumbList
- **structureIssues**: Heading levels skipped (2)
- **primaryKeyword**: insta emi card
- **keywords**: insta emi card \| emi card \| insta emi \| emi network card \| apply online \| Is Bajaj Pay Wallet required for the Insta EMI Card? \| What is the Bajaj Finance Insta EMI Card? \| wallet required
- **verdict**: MAKER_UNAVAILABLE
- **baselineGates**: Compliance 92, SEO backend 44, Keyword & structure 73, Customer-centricity 85, EEAT & GEO 85
- **baselineFindings**: [SEO backend · warning] Incomplete Schema: Missing [Subject Entity (Product/FinancialProduct/Service), Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (66 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (197 chars); [Keyword & structure · warning] Target Keyword Missing from Headings: "emi network card"; [Keyword & structure · warning] Target Keyword Missing from Headings: "apply online"; [Keyword & structure · warning] Heading levels skipped (2); [Customer-centricity · info] Dense Wall of Text (1 of 78 paragraphs exceed 3 sentences)

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Bajaj Finance Insta EMI Card: Apply Online and Get Quick Approval! |
| Has substantial content (≥200 words) | PASS | 2666 words |
| Found H2 sections | PASS | 8 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | insta emi card |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 83 |
| Maker reports missing key honestly | PASS | The maker needs a Gemini API key. Set GEMINI_API_KEY in .env and restart the server. |
| Content unchanged without a maker | PASS |  |
