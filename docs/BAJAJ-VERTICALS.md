# Bajaj Finserv vertical guidelines

The tool ships with one guideline profile per Bajaj Finserv vertical (`src/data/bajajVerticals.ts`,
registered in `src/data/defaultProfiles.ts`). Each profile combines:

- **Product guidelines** for the vertical (product, brand used in titles, audience, value propositions, forbidden
  phrases, compliance notes, credentials);
- **Bajaj Finserv — Customer Content Standard** (house style: Indian English, ₹ with lakh/crore, "% p.a.",
  disclosures next to claims);
- **Strict YMYL & LLM Citation Authority** SEO rules;
- **Empathetic Consumer & YMYL Transparency** customer-centricity rules;
- **High-Intent Commercial & Voice AEO** structure rules;
- a reader persona for the customer-centricity gate.

| Profile | Brand checked in title/description | Key compliance points |
|---|---|---|
| Personal Loan | Bajaj Finance | Lender named as Bajaj Finance Limited (RBI-registered NBFC); rates "subject to change"; KFS/APR; approval at lender's discretion; grievance redressal |
| Business Loan | Bajaj Finance | As personal loan, plus eligibility/GST requirements exactly as on the approved page |
| Home Loan | Bajaj Finance (as in live titles) | Lender in disclosures: Bajaj Housing Finance Limited (verify per page); tax benefits "as per prevailing tax laws" |
| Gold Loan | Bajaj Finance | LTV limits per current RBI norms; plain explanation of auction policy |
| Fixed Deposit | Bajaj Finance | Deposits with NBFCs are not insured by DICGC; rates and ratings with effective date; premature withdrawal and TDS rules |
| Insta EMI Card | Bajaj Finance | Named "Bajaj Finance Insta EMI Card" on the site; "No Cost EMI" must explain who bears the cost and any fee |
| Co-branded Credit Cards | Bajaj Finserv | Issued by the partner bank named on the card; fees per the issuer's MITC |
| Insurance | Bajaj Finserv | "Insurance is the subject matter of solicitation."; Bajaj Finance Limited as IRDAI corporate agent (add registration number); insurer named per plan |
| Mutual Funds | Bajaj Finserv | SEBI disclaimer "Mutual Fund investments are subject to market risks, read all scheme related documents carefully."; no return projections; AMC named per scheme |

## What is deliberately not in the presets

**Interest rates, fees, limits, tenures and ratings.** Everything in Product Guidelines is treated as an approved
fact: the maker may publish it and the verification gate accepts it. A stale rate in a preset would therefore reach
live pages. Each vertical's product team should add current figures (with an effective date) to their preset in the
Guidelines tab, and remove them when they change.

## Brand naming

Earlier versions rewrote every "Bajaj Finserv" to "Bajaj Finance" in all generated text. That broke names that
legitimately contain "Bajaj Finserv" (group companies, co-branded products) and links such as `bajajfinserv.in`. Brand naming is
now a per-vertical rule: the **Brand name** field in Product Guidelines drives the SEO gate's title/description check,
and compliance notes say which legal entity to name in disclosures. The brand values above follow what live
`bajajfinserv.in` page titles use as of October 2026.

## Ownership

These presets are starting points written by engineering. Before relying on them for publishing, each vertical's
**compliance and product owners must review and own** their preset: brand naming, mandatory disclosures,
forbidden phrases and approved facts.
