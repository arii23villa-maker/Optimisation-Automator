/**
 * Orchestrator tests with a scripted model client (no network, no API key).
 * They exercise the real gates, verification gate, revision loop and scoping.
 */
import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { runAgent9OrchestrationPipeline, runAgent1Extraction, setAgentAIClientForTesting } from '../src/services/agentPipeline';
import { draftToComponent } from '../src/services/pageDraft';
import type { PageDraft, ProductGuidelines } from '../src/types';

const SOURCE = `# Personal Loan

Borrow up to Rs. 40 lakh with interest rates from 10% p.a. Approval takes 24 hours.

## Eligibility

You must be 21 to 80 years old and earn a regular income.

## Fees and charges

The processing fee is up to 3.93% of the loan amount. There are no foreclosure charges for floating rate loans.

## How to apply

Fill the online form, upload your KYC documents and receive the money in your bank account.`;

const draftFor = (extraFigure: boolean, tag = ''): PageDraft => ({
  metaTitle: `Personal Loan up to Rs. 40 Lakh: Rates, Fees and Eligibility${tag}`,
  metaDescription:
    'Borrow up to Rs. 40 lakh at rates from 10% p.a. Check who is eligible, what it costs and how to apply online, with approval in 24 hours after you apply.',
  h1: `Personal Loan: borrow up to Rs. 40 lakh${tag}`,
  intro: [
    'A personal loan lets you borrow up to Rs. 40 lakh at interest rates from 10% p.a., with approval in 24 hours. You can use the money for any personal need and repay it in fixed monthly instalments over the agreed tenure.',
  ],
  sections: [
    { h2: 'Who can apply for a personal loan?', paragraphs: [`You must be 21 to 80 years old and earn a regular income.${tag}`], bullets: [], h3s: [] },
    {
      h2: 'What does a personal loan cost?',
      paragraphs: [
        extraFigure
          ? 'The processing fee is up to 3.93% of the loan amount, and 98% of applicants are approved.'
          : `The processing fee is up to 3.93% of the loan amount.${tag}`,
        'There are no foreclosure charges for floating rate loans.',
      ],
      bullets: [],
      h3s: [],
    },
    { h2: 'How do I apply for a personal loan?', paragraphs: [`Fill the online form and upload your KYC documents.${tag}`], bullets: [], h3s: [] },
  ],
  faqs: [{ question: 'How fast is a personal loan approved?', answer: 'Approval takes 24 hours after you submit your documents.' }],
});

const product: ProductGuidelines = {
  productName: 'Personal Loan',
  brandName: '',
  category: '',
  targetAudience: '',
  uniqueSellingPoints: [],
  coreValueProps: [],
  forbiddenPhrases: [],
  complianceNotes: '',
  eeatCredentials: '',
};

function fakeModel(makerReply: (prompt: string) => PageDraft) {
  const prompts: string[] = [];
  const client: any = {
    models: {
      generateContent: async ({ contents }: { contents: string }) => {
        prompts.push(contents);
        if (contents.includes('You are Agent 7')) return { text: JSON.stringify(makerReply(contents)) };
        if (contents.includes('You are the Extraction Agent')) return { text: '{}' };
        return { text: '[]' }; // LLM gates and the fidelity check find nothing
      },
    },
  };
  setAgentAIClientForTesting(client);
  return prompts;
}

afterEach(() => setAgentAIClientForTesting(null));

const baseParams = {
  productGuidelines: product,
  seoGuidelines: {} as any,
  keywords: [{ id: 'k1', keyword: 'personal loan', searchVolume: 0, intent: 'commercial' as const, priority: 'primary' as const }],
  components: [{ id: 'page_body_content', name: 'Personal Loan', type: 'full_body_content' as const, headings: [], bodyContent: SOURCE }],
  backendData: { metaTitle: 'Personal Loan', metaDescription: 'Get a loan.', canonicalUrl: 'https://www.bajajfinserv.in/personal-loan', schemaJsonLd: '' } as any,
};

test('optimize: invented figure is rejected, notes reach the maker, clean revision is approved', async () => {
  const prompts = fakeModel((p) => draftFor(!p.includes('REVIEW NOTES:')));
  const result = await runAgent9OrchestrationPipeline({ ...baseParams, passThreshold: 0 });
  const rounds = result.report.rounds!;

  assert.equal(rounds.length, 2);
  assert.equal(rounds[0].verification.verdict, 'REJECT');
  assert.deepEqual(rounds[0].verification.unsupportedFigures, ['98%']);
  assert.ok(prompts.find((p) => p.includes('REVIEW NOTES:'))!.includes('98%'), 'gate notes are in the revision prompt');
  const first = prompts.find((p) => p.includes('You are Agent 7') && !p.includes('REVIEW NOTES:'))!;
  assert.ok(!/SEVERITY RUBRIC|Forbidden Phrases|titleCharRange/i.test(first), 'first draft is free of gate rules');
  assert.equal(result.finalVerdict, 'APPROVED');
  assert.equal(result.updatedBackend.metaTitle, draftFor(false).metaTitle, 'maker metadata is kept');
  assert.equal(result.updatedComponents[0].originalSnapshot?.bodyContent, SOURCE);
  assert.ok(result.changeLog.length > 0);
});

test('optimize at the real threshold: a clean draft passes all five gates', async () => {
  fakeModel(() => draftFor(false));
  const result = await runAgent9OrchestrationPipeline(baseParams);
  const last = result.report.rounds![result.report.rounds!.length - 1];
  assert.ok(last.gates.every((g) => g.passed), last.gates.map((g) => `${g.gateName}=${g.score}`).join(', '));
  assert.equal(result.finalVerdict, 'APPROVED');
});

test('revise meta scope: only title and description change', async () => {
  const current = draftFor(false);
  current.metaTitle = 'Personal Loan'; // too short → SEO gate note on metaTitle
  const comp = draftToComponent(current, baseParams.components[0] as any);
  const prompts = fakeModel(() => draftFor(false, ' (rewritten)'));
  const result = await runAgent9OrchestrationPipeline({
    ...baseParams,
    components: [comp],
    backendData: { ...baseParams.backendData, metaTitle: current.metaTitle, metaDescription: current.metaDescription },
    mode: 'revise',
    reviseScope: { kind: 'meta' },
    maxRevisions: 1,
  });
  const revisePrompt = prompts.find((p) => p.includes('You are Agent 7'))!;
  assert.ok(revisePrompt.includes('SCOPE: change ONLY metaTitle and metaDescription'));
  assert.ok(result.report.rounds!.length >= 1);
  assert.equal(result.updatedBackend.metaTitle, draftFor(false).metaTitle + ' (rewritten)');
  assert.ok(!result.updatedComponents[0].bodyContent.includes('(rewritten)'), 'body untouched');
  assert.equal(result.report.mode, 'revise');
});

test('revise section scope: only the chosen H2 changes', async () => {
  const current = draftFor(false);
  current.sections[1].paragraphs = [
    'The processing fee is up to 3.93% of the loan amount. It is deducted from the loan. You pay it once. It is not refundable. It is shown in your agreement.',
  ];
  const comp = draftToComponent(current, baseParams.components[0] as any);
  fakeModel(() => draftFor(false, ' (rewritten)'));
  const result = await runAgent9OrchestrationPipeline({
    ...baseParams,
    components: [comp],
    backendData: { ...baseParams.backendData, metaTitle: current.metaTitle, metaDescription: current.metaDescription },
    mode: 'revise',
    reviseScope: { kind: 'section', h2: 'What does a personal loan cost?' },
    maxRevisions: 0,
  });
  assert.equal(result.report.note, undefined, 'the dense section produces an in-scope note');
  const body = result.updatedComponents[0].bodyContent;
  assert.ok(body.includes('The processing fee is up to 3.93% of the loan amount. (rewritten)'), 'target section rewritten');
  assert.ok(!body.includes('regular income. (rewritten)'), 'other sections untouched');
  assert.equal(result.updatedBackend.metaTitle, current.metaTitle, 'metadata untouched');
});

test('revise reports when nothing needs to change', async () => {
  fakeModel(() => draftFor(false, ' (should not be used)'));
  const comp = draftToComponent(draftFor(false), baseParams.components[0] as any);
  const result = await runAgent9OrchestrationPipeline({
    ...baseParams,
    components: [comp],
    backendData: { ...baseParams.backendData, metaTitle: draftFor(false).metaTitle, metaDescription: draftFor(false).metaDescription },
    mode: 'revise',
    reviseScope: { kind: 'meta' },
  });
  assert.equal(result.report.rounds!.length, 0);
  assert.match(result.report.note || '', /nothing was revised/);
});

test('Agent 1 never asks the model to extract a page from a bare URL', async () => {
  const prompts = fakeModel(() => draftFor(false));
  await runAgent1Extraction({ url: 'https://www.bajajfinserv.in/personal-loan' });
  assert.equal(prompts.length, 0);
});
