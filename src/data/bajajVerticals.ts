/**
 * Bajaj Finserv vertical guideline presets.
 *
 * These are STARTING POINTS for each vertical's product, brand and compliance rules.
 * They intentionally contain no interest rates, fees, limits or ratings: anything in
 * Product Guidelines is treated as an approved fact that the maker may publish, so
 * figures must be added by the vertical's product team from current, approved sources.
 * Have each vertical's compliance team review and own its preset.
 */
import type { SavedContentGuideline, SavedProductGuideline, ProductGuidelines } from '../types';

const STAMP = '2026-10-20T00:00:00.000Z';

const LENDING_FORBIDDEN = [
  'guaranteed approval',
  'approval guaranteed',
  '100% approval',
  'no credit check',
  'lowest interest rate in india',
  'zero risk',
  'risk-free',
  'free money',
];

const LENDING_COMPLIANCE =
  'Name the lender as "Bajaj Finance Limited" (an RBI-registered NBFC) where the lending entity is referenced; keep product names that contain "Bajaj Finserv" unchanged. ' +
  'Interest rates, fees and charges must be quoted only from the current approved rate card and described as "subject to change". ' +
  'Where rates are discussed, refer readers to the Key Fact Statement (KFS) and Annual Percentage Rate (APR). ' +
  'Loan approval is at the lender\'s discretion and subject to eligibility and documentation. ' +
  'Link to the grievance redressal page; mention the RBI Integrated Ombudsman Scheme where escalation is discussed.';

function product(
  id: string,
  name: string,
  description: string,
  g: Omit<ProductGuidelines, 'toneOfVoice'> & { toneOfVoice?: string }
): SavedProductGuideline {
  return {
    id,
    name,
    description,
    category: 'bajaj_finserv',
    isBuiltIn: true,
    createdAt: STAMP,
    updatedAt: STAMP,
    guidelines: { toneOfVoice: 'Clear, reassuring, transparent and respectful; never pushy.', ...g },
  };
}

export const BAJAJ_CONTENT_PRESET: SavedContentGuideline = {
  id: 'bfl-content-standard',
  name: 'Bajaj Finserv — Customer Content Standard',
  description: 'House style for bajajfinserv.in customer pages: plain Indian English, transparent costs, disclosures next to claims.',
  category: 'bajaj_finserv',
  isBuiltIn: true,
  createdAt: STAMP,
  updatedAt: STAMP,
  guidelines: {
    toneOfVoice: 'Clear, warm and trustworthy. Explain like a helpful relationship manager, not a salesperson.',
    readabilityLevel: 'Class 8 reading level in Indian English; explain every financial term the first time it appears.',
    paragraphConstraints: 'Maximum 3 sentences (about 60 words) per paragraph. One idea per paragraph.',
    formattingRules: [
      'Write amounts with the ₹ symbol and Indian numbering (lakh, crore), e.g. ₹5 lakh.',
      'Write rates as "% p.a." and say whether they are fixed or floating.',
      'Put fees and charges in a table with a "subject to change" note.',
      'Open every H2 with a one or two sentence direct answer.',
      'Use numbered steps for application and documentation processes.',
    ],
    forbiddenCliches: [
      'game changer',
      'one-stop solution',
      'hassle-free',
      'in today\'s fast-paced world',
      'unlock your dreams',
      'best in class',
      'delve into',
    ],
    grammarAndPerspective: 'Second person ("you", "your"), active voice, present tense.',
    ctaStandards: 'Specific, honest CTAs: "Check your eligibility", "Apply online", "Calculate your EMI", "Read the Key Fact Statement".',
    citationFormatting: 'Name the source in the sentence (e.g. "as per RBI guidelines") and link to the official page.',
    customContentRules:
      'Never state a rate, fee, limit, tenure or approval time that is not on the current approved rate card. Keep mandatory disclaimers next to the claims they qualify.',
  },
};

export const BAJAJ_PRODUCT_PRESETS: SavedProductGuideline[] = [
  product('bfl-product-personal-loan', 'Bajaj Finserv — Personal Loan', 'Unsecured personal loans offered by Bajaj Finance Limited.', {
    productName: 'Personal Loan',
    brandName: 'Bajaj Finance',
    category: 'Lending — Unsecured personal loans',
    targetAudience: 'Salaried and self-employed individuals in India planning a large expense or consolidating debt.',
    uniqueSellingPoints: ['Online application', 'Flexible repayment tenure', 'Minimal documentation for eligible customers'],
    coreValueProps: ['Clear eligibility criteria', 'Transparent fees and charges', 'Fast online process'],
    forbiddenPhrases: LENDING_FORBIDDEN,
    complianceNotes: LENDING_COMPLIANCE,
    eeatCredentials: 'Lender: Bajaj Finance Limited, a non-banking financial company registered with the Reserve Bank of India.',
  }),
  product('bfl-product-business-loan', 'Bajaj Finserv — Business Loan', 'Business and MSME loans offered by Bajaj Finance Limited.', {
    productName: 'Business Loan',
    brandName: 'Bajaj Finance',
    category: 'Lending — Business & MSME loans',
    targetAudience: 'Self-employed professionals, proprietors and MSME owners needing working capital or expansion funds.',
    uniqueSellingPoints: ['Online application', 'Collateral-free options for eligible businesses', 'Flexible repayment'],
    coreValueProps: ['Clear eligibility and documents list', 'Transparent charges', 'Repayment that fits business cash flow'],
    forbiddenPhrases: LENDING_FORBIDDEN,
    complianceNotes: `${LENDING_COMPLIANCE} State GST/registration requirements exactly as listed on the approved eligibility page.`,
    eeatCredentials: 'Lender: Bajaj Finance Limited, a non-banking financial company registered with the Reserve Bank of India.',
  }),
  product('bfl-product-home-loan', 'Bajaj Finserv — Home Loan', 'Home loans. Titles use "Bajaj Finance" as on bajajfinserv.in; the lender named in disclosures is Bajaj Housing Finance Limited (verify per page).', {
    productName: 'Home Loan',
    brandName: 'Bajaj Finance',
    category: 'Lending — Home loans',
    targetAudience: 'First-time and repeat home buyers, and borrowers looking to transfer an existing home loan.',
    uniqueSellingPoints: ['Balance transfer option', 'Long repayment tenure', 'Online application and tracking'],
    coreValueProps: ['Clear eligibility and property document requirements', 'Transparent processing charges', 'Guidance through the loan journey'],
    forbiddenPhrases: LENDING_FORBIDDEN,
    complianceNotes:
      'Name the lender as "Bajaj Housing Finance Limited" (a housing finance company registered with the National Housing Bank) unless the page states otherwise. ' +
      'Quote rates only from the current approved rate card, state whether they are fixed or floating and "subject to change". ' +
      'Tax-benefit content must say benefits are as per prevailing tax laws and advise readers to consult a tax advisor. ' +
      'Approval is subject to eligibility, property documents and the lender\'s policies.',
    eeatCredentials: 'Lender: Bajaj Housing Finance Limited, a housing finance company registered with the National Housing Bank.',
  }),
  product('bfl-product-gold-loan', 'Bajaj Finserv — Gold Loan', 'Loans against gold jewellery offered by Bajaj Finance Limited.', {
    productName: 'Gold Loan',
    brandName: 'Bajaj Finance',
    category: 'Lending — Secured loans against gold',
    targetAudience: 'Individuals who own gold jewellery and need short-term funds quickly.',
    uniqueSellingPoints: ['Quick disbursal at branches', 'Flexible repayment options', 'Secure storage of pledged gold'],
    coreValueProps: ['Clear valuation process', 'Transparent charges', 'Safe custody of jewellery'],
    forbiddenPhrases: LENDING_FORBIDDEN,
    complianceNotes: `${LENDING_COMPLIANCE} Loan-to-value limits must match current RBI norms and the approved rate card; explain auction policy for non-repayment plainly.`,
    eeatCredentials: 'Lender: Bajaj Finance Limited, a non-banking financial company registered with the Reserve Bank of India.',
  }),
  product('bfl-product-fixed-deposit', 'Bajaj Finserv — Fixed Deposit', 'Corporate fixed deposits accepted by Bajaj Finance Limited.', {
    productName: 'Fixed Deposit',
    brandName: 'Bajaj Finance',
    category: 'Deposits — Corporate fixed deposits',
    targetAudience: 'Savers and senior citizens looking for predictable returns on their savings.',
    uniqueSellingPoints: ['Choice of tenures', 'Cumulative and non-cumulative payout options', 'Online booking'],
    coreValueProps: ['Predictable returns', 'Clear premature-withdrawal rules', 'Transparent payout options'],
    forbiddenPhrases: ['risk-free', 'zero risk', 'insured by dicgc', 'government guaranteed', 'guaranteed by rbi'],
    complianceNotes:
      'Deposits are accepted by Bajaj Finance Limited. State clearly that deposits with NBFCs are not insured by DICGC. ' +
      'Quote interest rates and credit ratings only from the current approved rate card and rating letters, with the effective date. ' +
      'Explain premature withdrawal rules and TDS as per prevailing tax laws.',
    eeatCredentials: 'Issuer: Bajaj Finance Limited, a deposit-taking NBFC registered with the Reserve Bank of India.',
  }),
  product('bfl-product-insta-emi-card', 'Bajaj Finserv — Insta EMI Card & EMI Network', 'EMI card and no-cost EMI shopping on the Bajaj Finserv EMI Network.', {
    productName: 'Insta EMI Card',
    brandName: 'Bajaj Finance',
    category: 'Consumer finance — EMI card and EMI Network',
    targetAudience: 'Shoppers who want to buy electronics, appliances and other products on EMI at partner stores and online.',
    uniqueSellingPoints: ['Shop on EMI at partner stores and online', 'Pre-approved limit for eligible customers', 'Digital card'],
    coreValueProps: ['Clear EMI and fee terms', 'Wide partner network', 'Simple activation'],
    forbiddenPhrases: ['guaranteed approval', 'free card for everyone', 'no charges ever', 'zero risk'],
    complianceNotes:
      'bajajfinserv.in refers to the card as "Bajaj Finance Insta EMI Card"; the lender is Bajaj Finance Limited. "No Cost EMI" must explain how the cost is covered (e.g. by the brand or merchant) and any processing fee. ' +
      'Joining or annual fees and limits must be quoted from the approved fee schedule.',
    eeatCredentials: 'Credit facility provided by Bajaj Finance Limited, an RBI-registered NBFC.',
  }),
  product('bfl-product-credit-card', 'Bajaj Finserv — Co-branded Credit Cards', 'Credit cards co-branded with partner banks.', {
    productName: 'Bajaj Finserv Co-branded Credit Card',
    brandName: 'Bajaj Finserv',
    category: 'Cards — Co-branded credit cards',
    targetAudience: 'Customers comparing credit cards for rewards, EMI conversion and everyday spends.',
    uniqueSellingPoints: ['Rewards on everyday spends', 'EMI conversion on large purchases', 'Online application'],
    coreValueProps: ['Clear fees, charges and reward rules', 'Transparent interest on revolving credit', 'Secure usage'],
    forbiddenPhrases: ['guaranteed approval', 'lifetime free for all', 'unlimited rewards', 'zero interest always'],
    complianceNotes:
      'Co-branded cards are issued by the partner bank named on the card; state the issuer and that issuance is subject to the bank\'s policies. ' +
      'Fees, finance charges and reward rules must match the issuer\'s current Most Important Terms and Conditions (MITC); link to the MITC.',
    eeatCredentials: 'Issuer: the partner bank named on the card, regulated by the Reserve Bank of India.',
  }),
  product('bfl-product-insurance', 'Bajaj Finserv — Insurance', 'Insurance products distributed as a corporate agent.', {
    productName: 'Insurance',
    brandName: 'Bajaj Finserv',
    category: 'Insurance distribution — health, life, motor and pocket insurance',
    targetAudience: 'Individuals and families comparing insurance cover for health, life, vehicles and everyday risks.',
    uniqueSellingPoints: ['Compare plans from partner insurers', 'Buy online', 'Help with renewals'],
    coreValueProps: ['Clear inclusions and exclusions', 'Transparent premiums', 'Support during claims'],
    forbiddenPhrases: ['guaranteed claim settlement', '100% claim approval', 'covers everything', 'no exclusions', 'risk-free'],
    complianceNotes:
      'Include "Insurance is the subject matter of solicitation." Name the insurer for each plan; Bajaj Finance Limited acts as a corporate agent registered with IRDAI (add the registration number from the approved disclosure). ' +
      'Benefits, exclusions and premiums must match the insurer\'s policy wording; advise readers to read the policy wording before buying.',
    eeatCredentials: 'Distributor: Bajaj Finance Limited, registered with IRDAI as a corporate agent. Insurer: as named on each plan.',
  }),
  product('bfl-product-mutual-funds', 'Bajaj Finserv — Mutual Funds & Investments', 'Mutual fund and investment content.', {
    productName: 'Mutual Funds',
    brandName: 'Bajaj Finserv',
    category: 'Investments — mutual funds and SIPs',
    targetAudience: 'First-time and experienced investors exploring SIPs, lump-sum investments and fund categories.',
    uniqueSellingPoints: ['Start SIPs online', 'Compare fund categories', 'Track investments digitally'],
    coreValueProps: ['Plain-language explanation of risk', 'Transparent costs (expense ratio, exit load)', 'Goal-based investing guidance'],
    forbiddenPhrases: ['guaranteed returns', 'assured returns', 'risk-free', 'cannot lose money', 'double your money'],
    complianceNotes:
      'Include the SEBI-mandated disclaimer: "Mutual Fund investments are subject to market risks, read all scheme related documents carefully." ' +
      'Past performance must be labelled as not indicative of future returns. Do not project returns. Name the AMC for each scheme.',
    eeatCredentials: 'Schemes are offered by the asset management company named on each scheme document; mutual funds are regulated by SEBI.',
  }),
];

/** Lookup by id that survives array reordering. */
export function findById<T extends { id: string }>(list: T[], id: string): T | undefined {
  return list.find((x) => x.id === id);
}
