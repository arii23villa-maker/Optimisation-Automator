# End-to-end test report — Bajaj Finserv pages

Run: 2026-10-20T18:04:40.631Z against `http://localhost:3005`

Integrations: Gemini **configured**, Firecrawl **configured**, Google Ads **not configured**.

**165/180 checks passed.**

| Page | Checks | Verdict | Primary keyword | Words | Time |
|---|---|---|---|---|---|
| [personal-loan](https://www.bajajfinserv.in/personal-loan) | 22/24 | NOT_QUALIFIED | personal loan | 4511 | 551s |
| [fixed-deposit](https://www.bajajfinserv.in/fixed-deposit) | 24/24 | NOT_QUALIFIED | fixed deposit | 2782 | 467s |
| [insta-emi-card](https://www.bajajfinserv.in/insta-emi-card) | 21/24 | NOT_QUALIFIED | insta emi card | 2666 | 481s |
| [blog-prepay-personal-loan](https://www.bajajfinserv.in/how-to-prepay-personal-loan) | 20/24 | NOT_QUALIFIED | personal loan | 1254 | 357s |
| [blog-first-time-borrowers](https://www.bajajfinserv.in/personal-loan-for-first-time-borrowers) | 22/24 | NOT_QUALIFIED | time borrowers | 2136 | 582s |
| [blog-loan-in-10-minutes](https://www.bajajfinserv.in/instant-personal-loan-in-10-minutes) | 14/15 | MAKER_UNAVAILABLE | personal loan | 1732 | 96s |
| [article-emi-affordability](https://www.bajajfinserv.in/how-much-emi-can-i-afford) | 14/15 | MAKER_UNAVAILABLE | emi | 1070 | 98s |
| [article-fd-closure](https://www.bajajfinserv.in/fd-closure-process) | 14/15 | MAKER_UNAVAILABLE | fd closure | 1471 | 96s |
| [article-digital-personal-loan](https://www.bajajfinserv.in/how-salaried-employees-can-get-a-digital-personal-loan) | 14/15 | MAKER_UNAVAILABLE | personal loan | 1005 | 96s |

## personal-loan

URL: https://www.bajajfinserv.in/personal-loan

- **type**: product
- **source**: agent-1-firecrawl
- **title**: Apply for Instant Personal Loan up to ₹55 lakh at 10% p.a.* \| Bajaj Finance
- **words**: 4511
- **h2Sections**: 12
- **faqs**: 23
- **schemaTypes**: Product, WebPage, FinancialProduct, HowTo, SiteNavigationElement, SiteNavigationElement, SiteNavigationElement, SiteNavigationElement, SiteNavigationElement, LoanOrCredit, FAQPage, BreadcrumbList
- **structureIssues**: none
- **primaryKeyword**: personal loan
- **keywords**: personal loan \| instant personal loan \| personal loan interest rate \| loan amount \| personal loan based \| What are the uses of personal loan? \| bajaj finance personal loan \| personal loan application
- **verdict**: NOT_QUALIFIED
- **requests**: 2 (longest 182s)
- **baselineGates**: Compliance 40, SEO backend 51, Keyword & structure 90, Customer-centricity 46, EEAT & GEO 98
- **baselineFindings**: [Compliance · critical] The page uses the forbidden cliche 'hassle-free'.; [Compliance · warning] The content includes the phrase '100% digital process' which contradicts the…; [Compliance · warning] The lender is referenced as 'Bajaj Finance' or 'Bajaj Finance Personal…; [Compliance · warning] Interest rates and fees are mentioned without explicit reference to the Key…; [Compliance · warning] The mandatory mention of the RBI Integrated Ombudsman Scheme for grievance…; [Compliance · warning] The page lacks the mandatory lender credential description.; [Compliance · info] Paragraph exceeds the 60-word limit.; [SEO backend · warning] Incomplete Schema: Missing [Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (75 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (176 chars); [Customer-centricity · critical] The content presents a contradiction regarding fees. It claims 'No hidden…; [Customer-centricity · info] The EMI calculator is missing a mandatory illustrative APR example including…; [Customer-centricity · warning] The content uses the acronym 'CIBIL' and 'KYC' multiple times without…; [Customer-centricity · warning] The page lacks a clear statement confirming there are zero penalties for…; [Customer-centricity · warning] The page is missing a clear 'Soft-Check Reassurance' badge or explanation…; [Customer-centricity · info] Dense Wall of Text (6 of 103 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"; [EEAT & GEO · info] The page lacks a clear 'Last Updated' date or timestamp, which is critical…; [EEAT & GEO · info] The document lists various fees but does not provide a specific contact…; [EEAT & GEO · info] The metaTitle and headers indicate '10% p.a.*' while the fee tables show a…; [EEAT & GEO · info] The schema entity for 'Provider' contains a partial URL in 'sameAs'…
- **drafts**: 2
- **before**: 59
- **after**: 76
- **blocking**: Unsupported claim: "Checking your eligibility here will not impact your credit score."; Keyword & structure gate did not pass (score 34 < 70, 1 critical)
- **bodyWordsAfter**: 817 (source body 2553, FAQs not counted)
- **faqsAfter**: 19 (source 23)

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
| Every request under 300s (Vercel limit) | PASS | 2 requests, longest 182s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 47 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 76 |
| Maker produced at least one draft | PASS | 2 drafts |
| Final draft has exactly one H1 | PASS | 1 |
| Final draft heading order valid | PASS |  |
| No figures absent from the source | PASS | none |
| Keeps most of the source body (≥ 70% of its words) | **FAIL** | 817 of 2553 words (32%) |
| Keeps most of the source FAQs (≥ 60%) | PASS | 19 of 23 |
| Meta title length 50-60 | **FAIL** | 62 chars: Apply for Instant Personal Loan up to ₹55 Lakh \| Bajaj Finance |
| Brand "Bajaj Finance" in meta title | PASS | Apply for Instant Personal Loan up to ₹55 Lakh \| Bajaj Finance |
| Approved verdict needs zero blocking issues | PASS |  |
| Meta revision leaves the body untouched | PASS | verdict NOT_QUALIFIED |

## fixed-deposit

URL: https://www.bajajfinserv.in/fixed-deposit

- **type**: product
- **source**: agent-1-firecrawl
- **title**: Fixed Deposit - Open FD Online at High Interest Rates \| Bajaj Finance
- **words**: 2782
- **h2Sections**: 7
- **faqs**: 25
- **schemaTypes**: FAQPage, BreadcrumbList
- **structureIssues**: none
- **primaryKeyword**: fixed deposit
- **keywords**: fixed deposit \| interest rates \| fd online \| open fd \| senior citizens \| What is a fixed deposit (FD)? \| What is the tenure for investing in a Bajaj Finance FD? \| bajaj finance fixed deposit
- **verdict**: NOT_QUALIFIED
- **requests**: 2 (longest 195s)
- **baselineGates**: Compliance 50, SEO backend 37, Keyword & structure 53, Customer-centricity 67, EEAT & GEO 82
- **baselineFindings**: [Compliance · warning] Used 'Rs.' instead of '₹' symbol and misused Indian numbering (wrote Rs.…; [Compliance · warning] Missing mandatory disclosure stating that deposits with NBFCs are not…; [Compliance · warning] Used forbidden cliche 'hassle-free' in the FAQ section.; [Compliance · warning] Inconsistent formatting of Indian currency (Rs. vs ₹).; [Compliance · warning] Used unverified superlative 'safest investment'.; [Compliance · info] Paragraph exceeds 3-sentence constraint.; [Compliance · warning] Core Value Proposition Omitted: "Clear premature-withdrawal rules"; [SEO backend · warning] Incomplete Schema: Missing [WebPage, Subject Entity (Product/FinancialProduct/Service), Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (69 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (168 chars); [Keyword & structure · warning] Target Keyword Missing from Headings: "interest rates"; [Keyword & structure · warning] Target Keyword Missing from Headings: "fd online"; [Keyword & structure · warning] Target Keyword Missing from Headings: "open fd"; [Keyword & structure · warning] Target Keyword Missing from Headings: "senior citizens"; [Keyword & structure · info] Target Keyword Missing from Headings: "What is a fixed deposit (FD)?"; [Keyword & structure · info] Target Keyword Missing from Headings: "What is the tenure for investing in a Bajaj Finance FD?"; [Keyword & structure · info] Target Keyword Missing from Headings: "bajaj finance fixed deposit"; [Keyword & structure · info] Voice & Question Headings Below Target (18% < 40%); [Customer-centricity · warning] Use of technical acronyms without immediate explanation, specifically CKYC,…; [Customer-centricity · warning] The process steps contain complex, multi-clause sentences that exceed the…; [Customer-centricity · info] Missing illustrative APR example. While interest rates are mentioned, there…; [Customer-centricity · info] The page lacks a clear, prominent display of a toll-free human support phone…; [Customer-centricity · info] The phrase 'Why is FD the safest investment?' is misleading and overly…; [Customer-centricity · info] Dense Wall of Text (2 of 73 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"; [Customer-centricity · warning] Run-On Sentences Detected (12 sentences > 30 words); [EEAT & GEO · warning] The page uses definitive absolute language in the FAQ ('Why is FD the safest…; [EEAT & GEO · info] The page refers to '8.15% p.a.' and '7.75% p.a.' but fails to include the…; [EEAT & GEO · warning] The section 'Is Tax Deducted at Source (TDS) applicable to Bajaj Finance…; [EEAT & GEO · info] Inconsistent formatting of credit ratings. The page alternates between…
- **drafts**: 2
- **before**: 59
- **after**: 77
- **blocking**: Forbidden phrase used: "insured by dicgc"; Compliance gate did not pass (score 55 < 70, 1 critical)
- **bodyWordsAfter**: 875 (source body 1027, FAQs not counted)
- **faqsAfter**: 20 (source 25)

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
| Every request under 300s (Vercel limit) | PASS | 2 requests, longest 195s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 47 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 77 |
| Maker produced at least one draft | PASS | 2 drafts |
| Final draft has exactly one H1 | PASS | 1 |
| Final draft heading order valid | PASS |  |
| No figures absent from the source | PASS | none |
| Keeps most of the source body (≥ 70% of its words) | PASS | 875 of 1027 words (85%) |
| Keeps most of the source FAQs (≥ 60%) | PASS | 20 of 25 |
| Meta title length 50-60 | PASS | 60 chars: Bajaj Finance Fixed Deposit: Open FD for Predictable Returns |
| Brand "Bajaj Finance" in meta title | PASS | Bajaj Finance Fixed Deposit: Open FD for Predictable Returns |
| Approved verdict needs zero blocking issues | PASS |  |
| Meta revision leaves the body untouched | PASS | verdict NOT_QUALIFIED |

## insta-emi-card

URL: https://www.bajajfinserv.in/insta-emi-card

- **type**: product
- **source**: agent-1-firecrawl
- **title**: Bajaj Finance Insta EMI Card: Apply Online and Get Quick Approval!
- **words**: 2666
- **h2Sections**: 8
- **faqs**: 25
- **schemaTypes**: WebPage, FAQPage, BreadcrumbList
- **structureIssues**: Heading levels skipped (2)
- **primaryKeyword**: insta emi card
- **keywords**: insta emi card \| emi card \| insta emi \| emi network card \| apply online \| Is Bajaj Pay Wallet required for the Insta EMI Card? \| What is the Bajaj Finance Insta EMI Card? \| wallet required
- **verdict**: NOT_QUALIFIED
- **requests**: 2 (longest 192s)
- **baselineGates**: Compliance 61, SEO backend 44, Keyword & structure 73, Customer-centricity 81, EEAT & GEO 90
- **baselineFindings**: [Compliance · critical] The page includes the phrase '100% digital process' which implies no human…; [Compliance · warning] The page mentions 'Zero annual charges' and 'No annual or renewal fee',…; [Compliance · warning] Missing the mandatory EEAT credential disclaimer: 'Credit facility provided…; [Compliance · info] The section 'Fees and charges' includes a header 'The following charges are…; [SEO backend · warning] Incomplete Schema: Missing [Subject Entity (Product/FinancialProduct/Service), Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (66 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (197 chars); [Keyword & structure · warning] Target Keyword Missing from Headings: "emi network card"; [Keyword & structure · warning] Target Keyword Missing from Headings: "apply online"; [Keyword & structure · warning] Heading levels skipped (2); [Customer-centricity · info] The rule states that every rate quote must display an illustrative APR…; [Customer-centricity · warning] The page mentions 'EMI' multiple times without an immediate, simple…; [Customer-centricity · info] The page contains an asterisk and a vague warning regarding 'additional…; [Customer-centricity · warning] The content misses a clear 'soft-check' reassurance badge or explicit…; [Customer-centricity · info] There is no toll-free human support phone number listed, nor are there…; [Customer-centricity · info] Dense Wall of Text (1 of 78 paragraphs exceed 3 sentences); [EEAT & GEO · info] The page provides specific financial fee details (Rs. 530, 4.72% charges)…; [EEAT & GEO · warning] Inconsistent instructions for applying for the card; the FAQ section lists a…; [EEAT & GEO · info] The FAQ section contains a broken sentence: 'Why do I need the Baja' at the…
- **drafts**: 2
- **before**: 70
- **after**: 76
- **blocking**: Keyword & structure gate did not pass (score 69 < 70); Customer-centricity gate did not pass (score 58 < 70)
- **bodyWordsAfter**: 825 (source body 1032, FAQs not counted)
- **faqsAfter**: 20 (source 25)

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
| Every request under 300s (Vercel limit) | PASS | 2 requests, longest 192s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 47 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 76 |
| Maker produced at least one draft | PASS | 2 drafts |
| Final draft has exactly one H1 | PASS | 1 |
| Final draft heading order valid | **FAIL** | FAQ section is not at the end of the page |
| No figures absent from the source | PASS | none |
| Keeps most of the source body (≥ 70% of its words) | PASS | 825 of 1032 words (80%) |
| Keeps most of the source FAQs (≥ 60%) | PASS | 20 of 25 |
| Meta title length 50-60 | **FAIL** | 63 chars: Bajaj Finance Insta EMI Card: Apply Online for Instant Approval |
| Brand "Bajaj Finance" in meta title | PASS | Bajaj Finance Insta EMI Card: Apply Online for Instant Approval |
| Approved verdict needs zero blocking issues | PASS |  |
| Meta revision leaves the body untouched | **FAIL** | verdict NOT_QUALIFIED |

## blog-prepay-personal-loan

URL: https://www.bajajfinserv.in/how-to-prepay-personal-loan

- **type**: blog
- **source**: agent-1-firecrawl
- **title**: How to Prepay a Personal Loan\| Personal Loan Prepayment Procedure \| Bajaj Finance
- **words**: 1254
- **h2Sections**: 7
- **faqs**: 5
- **schemaTypes**: FAQPage, BreadcrumbList
- **structureIssues**: FAQ section is not at the end of the page
- **primaryKeyword**: personal loan
- **keywords**: personal loan \| personal loan prepayment \| prepayment procedure \| personal loan easily \| loan amount \| How long does it take to get a personal loan? \| What is the CIBIL Score required to get a loan? \| bajaj finance personal loan
- **verdict**: NOT_QUALIFIED
- **requests**: 2 (longest 182s)
- **baselineGates**: Compliance 60, SEO backend 29, Keyword & structure 49, Customer-centricity 68, EEAT & GEO 100
- **baselineFindings**: [Compliance · warning] Missing mandatory disclosure regarding interest rates and fees. The…; [Compliance · warning] Use of the forbidden cliché 'simple steps'.; [Compliance · warning] Missing reference to the RBI Integrated Ombudsman Scheme. The guidelines…; [Compliance · warning] Formatting inconsistency: 'Rs.' is used instead of the '₹' symbol as…; [Compliance · warning] Paragraph exceeds the constraint of 3 sentences or 60 words.; [SEO backend · warning] Incomplete Schema: Missing [WebPage, Subject Entity (Product/FinancialProduct/Service), Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (81 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (136 chars); [SEO backend · warning] Brand "Bajaj Finance" missing from meta description; [Keyword & structure · warning] Target Keyword Missing from Headings: "personal loan prepayment"; [Keyword & structure · warning] Target Keyword Missing from Headings: "prepayment procedure"; [Keyword & structure · warning] Target Keyword Missing from Headings: "loan amount"; [Keyword & structure · info] Target Keyword Missing from Headings: "How long does it take to get a personal loan?"; [Keyword & structure · info] Target Keyword Missing from Headings: "What is the CIBIL Score required to get a loan?"; [Keyword & structure · info] Target Keyword Missing from Headings: "bajaj finance personal loan"; [Keyword & structure · info] Voice & Question Headings Below Target (8% < 40%); [Keyword & structure · warning] FAQ section is not at the end of the page; [Customer-centricity · info] The page lacks the mandatory illustrative APR example with representative…; [Customer-centricity · warning] Technical jargon used without immediate explanation for laymen: 'CIBIL',…; [Customer-centricity · warning] The content mixes transactional steps with sales-focused calls to action…; [Customer-centricity · warning] Complex multi-clause sentences exceed 20 words, hindering readability.; [Customer-centricity · warning] Use of vague asterisk claims without immediate clarification nearby.; [EEAT & GEO · info] The 'Related articles' section contains future-dated content ('Jul 07,…; [EEAT & GEO · info] The page lacks a clear 'last updated' date, which is critical for financial…
- **drafts**: 2
- **before**: 65
- **after**: 74
- **blocking**: Figures not found in the source: 22,, 2024; Unsupported claim: "The following table provides an overview of the fees and charges associated with our personal loans. All figures are sub"; Compliance gate did not pass (score 68 < 70); Keyword & structure gate did not pass (score 63 < 70); Customer-centricity gate did not pass (score 68 < 70)
- **bodyWordsAfter**: 617 (source body 931, FAQs not counted)
- **faqsAfter**: 4 (source 5)

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | How to Prepay a Personal Loan\| Personal Loan Prepayment Procedure \| Bajaj Finance |
| Has substantial content (≥200 words) | PASS | 1254 words |
| Found H2 sections | PASS | 7 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | personal loan |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Every request under 300s (Vercel limit) | PASS | 2 requests, longest 182s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 47 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 74 |
| Maker produced at least one draft | PASS | 2 drafts |
| Final draft has exactly one H1 | PASS | 1 |
| Final draft heading order valid | **FAIL** | FAQ section is not at the end of the page |
| No figures absent from the source | **FAIL** | 22,, 2024 |
| Keeps most of the source body (≥ 70% of its words) | **FAIL** | 617 of 931 words (66%) |
| Keeps most of the source FAQs (≥ 60%) | PASS | 4 of 5 |
| Meta title length 50-60 | PASS | 60 chars: Personal Loan Prepayment: How to Prepay a Bajaj Finance Loan |
| Brand "Bajaj Finance" in meta title | PASS | Personal Loan Prepayment: How to Prepay a Bajaj Finance Loan |
| Approved verdict needs zero blocking issues | PASS |  |
| Meta revision leaves the body untouched | **FAIL** | verdict NOT_QUALIFIED |

## blog-first-time-borrowers

URL: https://www.bajajfinserv.in/personal-loan-for-first-time-borrowers

- **type**: blog
- **source**: agent-1-firecrawl
- **title**: Personal Loans for First Time Borrowers \| Bajaj Finance
- **words**: 2136
- **h2Sections**: 12
- **faqs**: 4
- **schemaTypes**: FAQPage, BreadcrumbList
- **structureIssues**: FAQ section is not at the end of the page
- **primaryKeyword**: time borrowers
- **keywords**: time borrowers \| personal loan \| loans for first time \| loan amount \| first-time borrowers \| How to get a personal loan for the first time? \| What is the easiest loan to get for first time borrower? \| credit score
- **verdict**: NOT_QUALIFIED
- **requests**: 2 (longest 207s)
- **baselineGates**: Compliance 22, SEO backend 52, Keyword & structure 67, Customer-centricity 80, EEAT & GEO 96
- **baselineFindings**: [Compliance · critical] The page uses the forbidden phrase '100% online process', which implies…; [Compliance · warning] The lending entity is not explicitly named as 'Bajaj Finance Limited' in the…; [Compliance · critical] Missing 'subject to change' disclaimer for interest rates and fees in the…; [Compliance · warning] The paragraph 'Personal loans are versatile financial products that can be…; [Compliance · warning] Missing reference to the Key Fact Statement (KFS) and Annual Percentage Rate…; [Compliance · warning] Missing mandatory escalation disclaimer regarding the RBI Integrated…; [Compliance · info] Heading '### Rs. 40,000 - Rs. 55 lakh' uses 'Rs.' instead of the required…; [SEO backend · warning] Incomplete Schema: Missing [WebPage, Subject Entity (Product/FinancialProduct/Service), Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Description Length Sub-Optimal (136 chars); [Keyword & structure · info] Target Keyword Missing from Headings: "How to get a personal loan for the first time?"; [Keyword & structure · info] Target Keyword Missing from Headings: "What is the easiest loan to get for first time borrower?"; [Keyword & structure · info] Voice & Question Headings Below Target (9% < 40%); [Keyword & structure · warning] FAQ section is not at the end of the page; [Customer-centricity · info] Missing illustrative APR example with representative loan terms and total…; [Customer-centricity · warning] Section 5 mentions 'prepayment options' but the page fails to explicitly…; [Customer-centricity · warning] Complex financial jargon used without immediate layman definitions for the…; [Customer-centricity · info] Missing information regarding the impact of the initial eligibility check on…; [Customer-centricity · info] The page lacks a dedicated human support contact method (phone/email) for…; [Customer-centricity · warning] Run-On Sentences Detected (3 sentences > 30 words); [EEAT & GEO · info] The content lacks a clear 'last updated' date or a 'last reviewed by'…; [EEAT & GEO · info] The section 'Key offerings: 3 loan types' contains fragmented bullet points…; [EEAT & GEO · info] The 'Disclaimer' heading is present in the outline but the actual disclaimer…; [EEAT & GEO · info] The FAQ answer for 'Can I get loan for first time with no credit score?'…
- **drafts**: 1
- **before**: 56
- **after**: 71
- **blocking**: Fact check could not run (no model available): run again later. No model could complete "Agent 8 · Fact check": gemini:gemini-3.1-flash-lite: Provider server error (503); gemini:gemini; Compliance gate did not pass (score 61 < 70, 1 critical); Keyword & structure gate did not pass (score 68 < 70); Customer-centricity gate did not pass (score 66 < 70)
- **bodyWordsAfter**: 1105 (source body 1879, FAQs not counted)
- **faqsAfter**: 4 (source 4)

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Personal Loans for First Time Borrowers \| Bajaj Finance |
| Has substantial content (≥200 words) | PASS | 2136 words |
| Found H2 sections | PASS | 12 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | time borrowers |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Every request under 300s (Vercel limit) | PASS | 2 requests, longest 207s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 33 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 71 |
| Maker produced at least one draft | PASS | 1 drafts |
| Final draft has exactly one H1 | PASS | 1 |
| Final draft heading order valid | **FAIL** | FAQ section is not at the end of the page |
| No figures absent from the source | PASS | none |
| Keeps most of the source body (≥ 70% of its words) | **FAIL** | 1105 of 1879 words (59%) |
| Keeps most of the source FAQs (≥ 60%) | PASS | 4 of 4 |
| Meta title length 50-60 | PASS | 54 chars: Personal Loan for First Time Borrowers \| Bajaj Finance |
| Brand "Bajaj Finance" in meta title | PASS | Personal Loan for First Time Borrowers \| Bajaj Finance |
| Approved verdict needs zero blocking issues | PASS |  |
| Meta revision leaves the body untouched | PASS | verdict MAKER_UNAVAILABLE |

## blog-loan-in-10-minutes

URL: https://www.bajajfinserv.in/instant-personal-loan-in-10-minutes

- **type**: blog
- **source**: agent-1-firecrawl
- **title**: Get Instant Personal Loan Approval Online in 10 Minutes \| Bajaj Finance
- **words**: 1732
- **h2Sections**: 14
- **faqs**: 12
- **schemaTypes**: Article, FAQPage, BreadcrumbList
- **structureIssues**: FAQ section is not at the end of the page
- **primaryKeyword**: personal loan
- **keywords**: personal loan \| instant personal loan \| loan approval \| approval online \| insta personal loan \| How do I get a loan within 10 minutes? \| How do I get an immediate personal loan? \| personal loan offer
- **verdict**: MAKER_UNAVAILABLE
- **requests**: 1 (longest 93s)
- **baselineGates**: Compliance 75, SEO backend 36, Keyword & structure 63, Customer-centricity 72, EEAT & GEO 85
- **baselineFindings**: [Compliance · critical] Review incomplete: the AI check could not run; [SEO backend · warning] Incomplete Schema: Missing [WebPage, Organization]; [SEO backend · warning] Schema.org Graph Order Out of Canonical Hierarchy; [SEO backend · warning] Meta Title Length Non-Compliant (71 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (168 chars); [SEO backend · warning] Brand "Bajaj Finance" missing from meta description; [Keyword & structure · info] Target Keyword Missing from Headings: "How do I get a loan within 10 minutes?"; [Keyword & structure · info] Target Keyword Missing from Headings: "How do I get an immediate personal loan?"; [Keyword & structure · info] Target Keyword Missing from Headings: "personal loan offer"; [Keyword & structure · info] Voice & Question Headings Below Target (6% < 40%); [Keyword & structure · warning] FAQ section is not at the end of the page; [Customer-centricity · critical] Review incomplete: the AI check could not run; [Customer-centricity · info] Dense Wall of Text (2 of 48 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "one-stop solution"; [Customer-centricity · warning] Forbidden Cliché Detected: "in today's fast-paced world"; [EEAT & GEO · critical] Review incomplete: the AI check could not run
- **drafts**: 0
- **before**: 71
- **after**: undefined
- **blocking**: none

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Get Instant Personal Loan Approval Online in 10 Minutes \| Bajaj Finance |
| Has substantial content (≥200 words) | PASS | 1732 words |
| Found H2 sections | PASS | 14 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | personal loan |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Every request under 300s (Vercel limit) | PASS | 1 requests, longest 93s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 71 |
| Maker produced at least one draft | **FAIL** | 0 drafts |

## article-emi-affordability

URL: https://www.bajajfinserv.in/how-much-emi-can-i-afford

- **type**: article
- **source**: agent-1-firecrawl
- **title**: How much EMI can I afford? – Bajaj Finance Limited
- **words**: 1070
- **h2Sections**: 4
- **faqs**: 0
- **schemaTypes**: BreadcrumbList, Article
- **structureIssues**: none
- **primaryKeyword**: emi
- **keywords**: emi \| emi you can afford \| loan amount \| emi calculators \| determine how much emi \| personal loan \| before deciding \| related videos
- **verdict**: MAKER_UNAVAILABLE
- **requests**: 1 (longest 93s)
- **baselineGates**: Compliance 75, SEO backend 46, Keyword & structure 66, Customer-centricity 75, EEAT & GEO 85
- **baselineFindings**: [Compliance · critical] Review incomplete: the AI check could not run; [SEO backend · warning] Incomplete Schema: Missing [WebPage, Organization, FAQPage]; [SEO backend · warning] Meta Title Length Non-Compliant (50 chars); [SEO backend · warning] Brand "Bajaj Finance" missing from meta description; [SEO backend · warning] Meta Description Sentence Incomplete or Truncated; [Keyword & structure · warning] Target Keyword Missing from Headings: "loan amount"; [Keyword & structure · warning] Target Keyword Missing from Headings: "emi calculators"; [Keyword & structure · info] Target Keyword Missing from Headings: "personal loan"; [Keyword & structure · info] Target Keyword Missing from Headings: "before deciding"; [Keyword & structure · info] Voice & Question Headings Below Target (20% < 40%); [Customer-centricity · critical] Review incomplete: the AI check could not run; [Customer-centricity · info] Dense Wall of Text (1 of 8 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "one-stop solution"; [EEAT & GEO · critical] Review incomplete: the AI check could not run
- **drafts**: 0
- **before**: 73
- **after**: undefined
- **blocking**: none

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | How much EMI can I afford? – Bajaj Finance Limited |
| Has substantial content (≥200 words) | PASS | 1070 words |
| Found H2 sections | PASS | 4 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | emi |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Every request under 300s (Vercel limit) | PASS | 1 requests, longest 93s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 73 |
| Maker produced at least one draft | **FAIL** | 0 drafts |

## article-fd-closure

URL: https://www.bajajfinserv.in/fd-closure-process

- **type**: article
- **source**: agent-1-firecrawl
- **title**: Premature FD Closure: Check Process and Charges
- **words**: 1471
- **h2Sections**: 7
- **faqs**: 6
- **schemaTypes**: BreadcrumbList, Article, FAQPage
- **structureIssues**: none
- **primaryKeyword**: fd closure
- **keywords**: fd closure \| premature fd closure \| fd closure application \| fixed deposit \| fd closure process \| What Happens if I Close my Fixed Deposit prematurely? \| What are the penalty charges for premature closure of FD? \| fd account
- **verdict**: MAKER_UNAVAILABLE
- **requests**: 1 (longest 93s)
- **baselineGates**: Compliance 68, SEO backend 49, Keyword & structure 71, Customer-centricity 69, EEAT & GEO 85
- **baselineFindings**: [Compliance · critical] Review incomplete: the AI check could not run; [Compliance · warning] Core Value Proposition Omitted: "Predictable returns"; [SEO backend · warning] Incomplete Schema: Missing [WebPage, Organization]; [SEO backend · warning] Meta Title Length Non-Compliant (47 chars); [SEO backend · warning] Brand "Bajaj Finance" missing from meta title; [SEO backend · warning] Meta Description Length Sub-Optimal (159 chars); [Keyword & structure · warning] Target Keyword Missing from Headings: "fd closure process"; [Keyword & structure · info] Target Keyword Missing from Headings: "What Happens if I Close my Fixed Deposit prematurely?"; [Keyword & structure · info] Target Keyword Missing from Headings: "What are the penalty charges for premature closure of FD?"; [Keyword & structure · warning] Keyword Usage Below Target Frequency: "fd closure process" (1x < 2x); [Keyword & structure · info] Voice & Question Headings Below Target (25% < 40%); [Customer-centricity · critical] Review incomplete: the AI check could not run; [Customer-centricity · info] Dense Wall of Text (3 of 23 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "one-stop solution"; [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"; [EEAT & GEO · critical] Review incomplete: the AI check could not run
- **drafts**: 0
- **before**: 70
- **after**: undefined
- **blocking**: none

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Premature FD Closure: Check Process and Charges |
| Has substantial content (≥200 words) | PASS | 1471 words |
| Found H2 sections | PASS | 7 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | fd closure |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Every request under 300s (Vercel limit) | PASS | 1 requests, longest 93s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 70 |
| Maker produced at least one draft | **FAIL** | 0 drafts |

## article-digital-personal-loan

URL: https://www.bajajfinserv.in/how-salaried-employees-can-get-a-digital-personal-loan

- **type**: article
- **source**: agent-1-firecrawl
- **title**: Digital Loan - How Salaried Employees Can Get a Digital Personal Loan \| Bajaj Finance Limited
- **words**: 1005
- **h2Sections**: 5
- **faqs**: 3
- **schemaTypes**: BreadcrumbList, Article
- **structureIssues**: none
- **primaryKeyword**: personal loan
- **keywords**: personal loan \| digital personal loan \| salaried employees \| personal loan for salaried \| digital loan \| Who to get a digital personal loan for salaried employees? \| bajaj finance personal loan \| regular personal loan
- **verdict**: MAKER_UNAVAILABLE
- **requests**: 1 (longest 93s)
- **baselineGates**: Compliance 68, SEO backend 52, Keyword & structure 79, Customer-centricity 47, EEAT & GEO 85
- **baselineFindings**: [Compliance · critical] Review incomplete: the AI check could not run; [Compliance · warning] Core Value Proposition Omitted: "Transparent fees and charges"; [SEO backend · warning] Incomplete Schema: Missing [WebPage, Organization, FAQPage]; [SEO backend · warning] Meta Title Length Non-Compliant (93 chars); [SEO backend · warning] Meta Description Length Sub-Optimal (206 chars); [Keyword & structure · info] Target Keyword Missing from Headings: "bajaj finance personal loan"; [Keyword & structure · info] Voice & Question Headings Below Target (30% < 40%); [Customer-centricity · warning] The acronym "KYC" (Know Your Customer) is used later without an immediate…; [Customer-centricity · warning] The acronym "OTP" (One‑Time Password) is used without explanation.; [Customer-centricity · warning] The term "NBFC" appears in the disclaimer without definition.; [Customer-centricity · info] No illustrative APR example with total repayment is provided, which is…; [Customer-centricity · info] The page lacks the required decision‑journey order elements: no soft‑check…; [Customer-centricity · warning] The disclaimer mentions “*” after “within 24 hours* of approval” but no…; [Customer-centricity · info] Several sentences exceed 20 words, making them harder to read for the target…; [Customer-centricity · info] Only an IVR number is provided; there is no dedicated toll‑free human phone…; [Customer-centricity · warning] Dense Wall of Text (4 of 14 paragraphs exceed 3 sentences); [Customer-centricity · warning] Forbidden Cliché Detected: "hassle-free"; [EEAT & GEO · critical] Review incomplete: the AI check could not run
- **drafts**: 0
- **before**: 67
- **after**: undefined
- **blocking**: none

| Check | Result | Detail |
|---|---|---|
| Fetch page | PASS | via agent-1-firecrawl |
| Has meta title | PASS | Digital Loan - How Salaried Employees Can Get a Digital Personal Loan \| Bajaj Finance Limited |
| Has substantial content (≥200 words) | PASS | 1005 words |
| Found H2 sections | PASS | 5 sections |
| Keywords detected (≥3) | PASS | 8 keywords |
| Primary keyword present | PASS | personal loan |
| Every keyword occurs on the page | PASS | all found |
| No invented search volumes | PASS |  |
| No brand-only keyword | PASS |  |
| Every request under 300s (Vercel limit) | PASS | 1 requests, longest 93s |
| Keyword gate never calls an on-page keyword "unused" | PASS | ok |
| Progress events streamed | PASS | 17 events |
| Baseline audit by all 5 gates | PASS |  |
| Scores agree with gates | PASS | overall 67 |
| Maker produced at least one draft | **FAIL** | 0 drafts |
