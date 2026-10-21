import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickKeywords } from '../src/services/keywordPicker';

const personalLoanPage = {
  title: 'Personal Loan - Apply for Personal Loan Online at Low Interest Rate | Bajaj Finserv',
  h1: 'Personal Loan',
  url: 'https://www.bajajfinserv.in/personal-loan',
  description: 'Apply for a personal loan online with Bajaj Finance. Check personal loan interest rates, eligibility and documents required.',
  headings: [
    'Personal Loan',
    'Features and benefits of our personal loan',
    'Personal loan eligibility criteria',
    'Documents required for a personal loan',
    'Personal loan interest rates and charges',
    'How to apply for a personal loan',
    'Frequently asked questions',
    'What is the minimum salary for a personal loan?',
  ],
  faqQuestions: ['What is the minimum salary for a personal loan?', 'Can I prepay my personal loan?'],
  bodyText: `A personal loan from Bajaj Finance helps you meet planned and unplanned expenses.
Personal loan interest rates start at the rate shown on this page. Check your personal loan eligibility before you apply.
Personal loan eligibility depends on age, income and credit score. Keep your documents required ready: KYC documents, salary slips and bank statements.
You can apply for a personal loan online in a few steps. Personal loan interest rates and charges are listed in the table below.
Use the personal loan EMI calculator to plan repayments. The personal loan EMI calculator shows your monthly instalment.`,
};

test('primary keyword comes from the title/H1, not the brand', () => {
  const kws = pickKeywords(personalLoanPage);
  const primary = kws.find((k) => k.priority === 'primary')!;
  assert.equal(primary.keyword, 'personal loan');
  assert.ok(!kws.some((k) => /^bajaj( finserv| finance)?$/.test(k.keyword)), 'brand alone is never a keyword');
});

test('every keyword occurs on the page and no volume is invented', () => {
  const kws = pickKeywords(personalLoanPage);
  const pageText = JSON.stringify(personalLoanPage).toLowerCase();
  for (const k of kws) {
    assert.equal(k.searchVolume, 0);
    assert.ok(pageText.includes(k.keyword.toLowerCase().replace(/\?$/, '')), `"${k.keyword}" not on page`);
  }
});

test('questions only come from the page', () => {
  const kws = pickKeywords(personalLoanPage);
  const qs = kws.filter((k) => k.priority === 'voice_question').map((k) => k.keyword);
  assert.deepEqual(qs, ['What is the minimum salary for a personal loan?', 'Can I prepay my personal loan?']);

  const noQuestions = pickKeywords({ ...personalLoanPage, faqQuestions: [], headings: personalLoanPage.headings.slice(0, 5) });
  assert.equal(noQuestions.filter((k) => k.priority === 'voice_question').length, 0, 'no templated questions');
});

test('secondary keywords are distinct multi-word topics', () => {
  const kws = pickKeywords(personalLoanPage);
  const secondary = kws.filter((k) => k.priority === 'secondary').map((k) => k.keyword);
  assert.ok(secondary.length >= 2);
  assert.ok(secondary.every((k) => k.includes(' ')));
  assert.ok(secondary.some((k) => /interest rate/.test(k)) || secondary.some((k) => /eligibility/.test(k)));
});

test('a Wikipedia-style page does not pick a section name like "history"', () => {
  const kws = pickKeywords({
    title: 'Search engine optimization - Wikipedia',
    h1: 'Search engine optimization',
    url: 'https://en.wikipedia.org/wiki/Search_engine_optimization',
    headings: ['History', 'Relationship with Google', 'Methods', 'Getting indexed', 'As marketing strategy'],
    bodyText:
      'Search engine optimization (SEO) is the process of improving the quality and quantity of website traffic to a website or a web page from search engines. Search engine optimization targets unpaid traffic. Webmasters and content providers began optimizing websites for search engines in the mid-1990s. Search engines use complex mathematical algorithms. Search engine optimization practices evolved.',
  });
  assert.equal(kws[0].priority, 'primary');
  assert.equal(kws[0].keyword, 'search engine optimization');
  assert.ok(!kws.some((k) => k.keyword === 'history'));
});

test("no numbers, brand fragments or nested near-duplicates", () => {
  const kws = pickKeywords({
    title: "Apply for Instant Personal Loan up to ₹55 lakh at 10% p.a.* | Bajaj Finance",
    h1: "Personal Loan",
    url: "https://www.bajajfinserv.in/personal-loan",
    headings: ["Personal loan interest rate, fees and charges", "How to apply for a Personal Loan"],
    brandNames: ["Bajaj Finserv", "Bajaj Finance"],
    bodyText:
      "Get an instant personal loan up to 55 lakh. Bajaj Finance personal loan interest rate starts at 10% p.a. " +
      "Check the personal loan interest rate before you apply. An instant personal loan is approved in 24 hours. " +
      "Personal loan interest rate depends on your profile. Bajaj Finance personal loan offers flexible tenure.",
  });
  const words = kws.map((k) => k.keyword);
  assert.ok(!words.some((k) => /\d/.test(k)), "no numeric phrases: " + words);
  assert.ok(!words.some((k) => /^(bajaj )?finance personal$/.test(k)), "no brand fragments: " + words);
  assert.ok(words.includes("personal loan interest rate"));
  assert.ok(!words.includes("personal loan interest"), "nested fragment dropped: " + words);
  assert.ok(words.includes("bajaj finance personal loan"), "one proper branded keyword: " + words);
});

test('no fragments that end mid-phrase ("personal loan based")', () => {
  const kws = pickKeywords({
    ...personalLoanPage,
    bodyText:
      `${personalLoanPage.bodyText}\nYour personal loan based on income is approved faster. A personal loan based on salary needs fewer documents. ` +
      'Personal loan based offers depend on your profile. Charges apply according to the schedule.',
  });
  const words = kws.map((k) => k.keyword);
  assert.ok(!words.some((k) => /\b(based|according)$/.test(k)), 'fragment picked: ' + words);
  assert.ok(words.includes('documents required'), '"required" still ends a real keyword: ' + words);
});
