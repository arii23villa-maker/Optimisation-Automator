import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  coercePageDraft,
  draftToMarkdown,
  draftToComponent,
  checkHeadingStructure,
  findUnsupportedFigures,
  buildDraftSchema,
  parseSchemaBlocks,
  markdownToDraft,
  componentToDraft,
  mergeDraftByScope,
  notesInScope,
  diffDrafts,
} from '../src/services/pageDraft';

const draft = coercePageDraft({
  metaTitle: 'Personal Loan: Interest Rates and Eligibility | Bajaj Finance',
  metaDescription: 'Compare personal loan rates from 10% p.a.',
  h1: 'Personal Loan',
  intro: ['Get a loan of up to ₹40 lakh.'],
  sections: [
    { h2: 'Eligibility', paragraphs: ['Age 21 to 80 years.'], bullets: ['Salaried'], h3s: [{ h3: 'Documents', paragraphs: ['KYC'] }] },
    { h2: 'Fees', paragraphs: ['Processing fee up to 3.93%.'], table: { headers: ['Fee', 'Amount'], rows: ['Processing | 3.93%'] } },
  ],
  faqs: [{ question: 'How fast is approval?', answer: 'Approval in 5 minutes.' }],
})!;

test('coerces model output, splitting "a | b" table rows', () => {
  assert.ok(draft);
  assert.deepEqual(draft.sections[1].table!.rows, [['Processing', '3.93%']]);
  assert.equal(coercePageDraft({ h1: '', sections: [] }), null);
});

test('an FAQ written as an H2 section becomes the FAQ list (rendered last)', () => {
  const d = coercePageDraft({
    h1: 'Fixed Deposit',
    intro: ['Open an FD online.'],
    sections: [
      { h2: 'Benefits', paragraphs: ['Fixed returns.'] },
      { h2: 'Frequently Asked Questions', paragraphs: [], h3s: [{ h3: 'What is an FD?', paragraphs: ['A deposit for a fixed term.'] }] },
      { h2: 'How to apply', paragraphs: ['Apply online.'] },
    ],
    faqs: [{ question: 'Is it safe?', answer: 'It is rated AAA.' }],
  })!;
  assert.deepEqual(d.sections.map((s) => s.h2), ['Benefits', 'How to apply']);
  assert.deepEqual(d.faqs.map((f) => f.question), ['Is it safe?', 'What is an FD?']);
  assert.deepEqual(checkHeadingStructure(draftToMarkdown(d)), []);

  const inline = coercePageDraft({
    h1: 'Insta EMI Card',
    sections: [
      { h2: 'Fees', paragraphs: ['Joining fee Rs. 530.'] },
      { h2: 'Frequently Asked Questions', paragraphs: ['Below are common questions.'], bullets: ['Is Bajaj Pay Wallet required? Yes, for cashbacks.', 'What is the joining fee? Rs. 530.'] },
    ],
    faqs: [{ question: 'What is the joining fee?', answer: 'Rs. 530 including taxes.' }],
  })!;
  assert.deepEqual(inline.sections.map((s) => s.h2), ['Fees']);
  assert.deepEqual(inline.faqs.map((f) => f.question), ['What is the joining fee?', 'Is Bajaj Pay Wallet required?']);
});

test('heading structure: draft markdown is clean; violations are flagged', () => {
  assert.deepEqual(checkHeadingStructure(draftToMarkdown(draft)), []);
  const ids = checkHeadingStructure('## Intro\n\n# Title\n\n#### Deep\n\n## FAQs\n\n### Q?\n\n## Contact').map((f) => f.id).sort();
  assert.deepEqual(ids, ['agent4-structure-faq-not-last', 'agent4-structure-h1-not-first', 'agent4-structure-level-skip']);
  assert.equal(checkHeadingStructure('## A\n\n### B')[0].id, 'agent4-structure-no-h1');
});

test('fabrication guard flags only figures absent from the source', () => {
  const source = 'Loan up to Rs. 40 lakh. Rates from 10% p.a. Fee up to 3.93%. Age 21 to 80 years.';
  assert.deepEqual(findUnsupportedFigures(draftToMarkdown(draft).replace(/\|/g, ' '), source), ['5 minutes']);
});

test('schema is rebuilt in canonical order and multi-block JSON-LD parses', () => {
  const schema = buildDraftSchema({
    draft,
    originalSchema: '{"@context":"https://schema.org","@type":"Organization","name":"Bajaj"}\n\n{"@context":"https://schema.org","@type":"WebPage","name":"Old"}',
    url: 'https://www.example.com/loans/personal-loan',
    brandName: 'Bajaj Finance',
  });
  assert.deepEqual(parseSchemaBlocks(schema).map((n: any) => n['@type']), ['WebPage', 'BreadcrumbList', 'Article', 'Organization', 'FAQPage']);
  assert.equal(parseSchemaBlocks('{"@type":"A"}\n\n{"@type":"B"}').length, 2);
});

test('component conversion keeps originals and puts FAQ headings last', () => {
  const comp = draftToComponent(draft, { id: 'page_body_content', name: 'x', type: 'full_body_content', headings: [], bodyContent: 'old' });
  assert.equal(comp.originalSnapshot?.bodyContent, 'old');
  assert.equal(comp.headings.filter((h) => h.tag === 'h1').length, 1);
  assert.equal(comp.headings[comp.headings.length - 1].text, 'How fast is approval?');
});

test('markdown round-trips back into a draft', () => {
  const back = markdownToDraft(draftToMarkdown(draft), { metaTitle: draft.metaTitle, metaDescription: draft.metaDescription })!;
  assert.equal(back.h1, draft.h1);
  assert.deepEqual(back.sections.map((s) => s.h2), ['Eligibility', 'Fees']);
  assert.equal(back.sections[0].h3s[0].h3, 'Documents');
  assert.deepEqual(back.sections[1].table!.rows, [['Processing', '3.93%']]);
  assert.deepEqual(back.faqs, draft.faqs);

  const fromComp = componentToDraft(draftToComponent(draft), { metaTitle: 'T', metaDescription: 'D' })!;
  assert.equal(fromComp.metaTitle, 'T');
  assert.equal(fromComp.sections.length, 2);
});

test('scoped merges change only what is in scope', () => {
  const next = {
    ...draft,
    metaTitle: 'NEW TITLE',
    h1: 'NEW H1',
    sections: draft.sections.map((s) => ({ ...s, paragraphs: ['changed'] })),
  };
  const meta = mergeDraftByScope(draft, next, { kind: 'meta' });
  assert.equal(meta.metaTitle, 'NEW TITLE');
  assert.equal(meta.h1, draft.h1);
  assert.deepEqual(meta.sections, draft.sections);

  const sec = mergeDraftByScope(draft, next, { kind: 'section', h2: 'Fees' });
  assert.deepEqual(sec.sections[0], draft.sections[0]);
  assert.deepEqual(sec.sections[1].paragraphs, ['changed']);
  assert.equal(sec.metaTitle, draft.metaTitle);

  const body = mergeDraftByScope(draft, next, { kind: 'body' });
  assert.equal(body.metaTitle, draft.metaTitle);
  assert.equal(body.h1, 'NEW H1');
});

test('notes are filtered by scope', () => {
  const notes = [
    { issue: 'title too long', field: 'metaTitle', target: 'backend_seo' },
    { issue: 'schema missing', field: 'schemaJsonLd', target: 'backend_seo' },
    { issue: 'wall of text', field: 'bodyContent', target: 'component' },
  ];
  assert.deepEqual(notesInScope(notes, { kind: 'meta' }).map((n) => n.issue), ['title too long']);
  assert.deepEqual(notesInScope(notes, { kind: 'body' }).map((n) => n.issue), ['wall of text']);
  assert.equal(notesInScope(notes, { kind: 'all' }).length, 3);
});

test('diff lists changed parts only', () => {
  const next = { ...draft, metaTitle: 'Other', sections: [draft.sections[0], { ...draft.sections[1], paragraphs: ['New fee text'] }] };
  const titles = diffDrafts(draft, next).map((c) => c.sectionTitle);
  assert.deepEqual(titles, ['Meta title', 'Fees']);
});
