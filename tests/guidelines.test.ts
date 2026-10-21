/**
 * Guidelines in the browser: nothing is built in, and the export/import file moves every guideline type.
 */
import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';

// In-memory stand-in for the browser's localStorage.
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const storage = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });

const g = await import('../src/data/defaultProfiles');
const d = await import('../src/data/defaults');

beforeEach(() => storage.clear());

const preset = (id: string, guidelines: any) => ({ id, name: `Guideline ${id}`, description: '', category: 'custom', createdAt: 'x', updatedAt: 'x', guidelines });

test('a new browser starts with no guidelines at all', () => {
  assert.deepEqual(g.loadStoredProfiles(), []);
  for (const load of [g.loadSavedContentPresets, g.loadSavedProductPresets, g.loadSavedSeoPresets, g.loadSavedGeoPresets, g.loadSavedCustomerCentricityPresets, g.loadSavedStructureMappingPresets]) {
    assert.deepEqual(load(), []);
  }
  assert.deepEqual(g.loadGlobalContentGuidelines(), d.DEFAULT_CONTENT_GUIDELINES);
  assert.deepEqual(g.loadWorkingProductGuidelines(), { ...d.DEFAULT_PRODUCT_GUIDELINES, brandName: '' });
  assert.equal(g.loadGlobalSeoGuidelines().titleCharRange.min, 50, 'neutral SEO limits stay');
});

test('copies of the old built-in guidelines stored in a browser become editable', () => {
  storage.setItem('seo_saved_product_presets_v1', JSON.stringify([{ ...preset('bfl-product-x', { productName: 'X' }), isBuiltIn: true }]));
  const [p] = g.loadSavedProductPresets();
  assert.equal(p.isBuiltIn, false);
  assert.equal(p.guidelines.productName, 'X');
});

test('export → import keeps every guideline type and profiles; import adds, never deletes', () => {
  const presets = {
    content: [preset('c1', { toneOfVoice: 'Plain', forbiddenCliches: ['game changer'] })],
    product: [preset('p1', { productName: 'Personal Loan', brandName: 'Bajaj Finance', forbiddenPhrases: ['guaranteed approval'] })],
    seo: [preset('s1', { titleCharRange: { min: 45, max: 58 }, schemaRequirements: ['FAQPage'] })],
    geo: [preset('g1', { enableGeoOptimization: true, llmCitationStrategy: 'Quote the brand' })],
    customerCentricity: [preset('cc1', { targetCustomerPersona: 'First-time borrower', maxSentenceWords: 18 })],
    structureMapping: [preset('sm1', { preferredSectionOrder: ['Features', 'Eligibility'], minKeywordFrequency: 3 })],
  };
  const profile = { id: 'prof1', name: 'PL', productGuidelines: presets.product[0].guidelines, seoGuidelines: presets.seo[0].guidelines, keywords: [], readerContext: 'Salaried borrower' };
  const file = JSON.parse(JSON.stringify(g.buildGuidelineFile([profile as any], presets as any)));
  assert.equal(file.format, g.GUIDELINE_FILE_FORMAT);

  const back = g.parseGuidelineFile(file)!;
  assert.ok(back);
  for (const s of g.PRESET_SECTIONS) assert.equal(back.presets[s].length, 1, `${s} travels`);
  assert.equal(back.presets.content[0].guidelines.forbiddenCliches[0], 'game changer');
  assert.equal(back.presets.product[0].guidelines.brandName, 'Bajaj Finance');
  assert.equal(back.presets.seo[0].guidelines.titleCharRange.max, 58);
  assert.equal(back.presets.geo[0].guidelines.llmCitationStrategy, 'Quote the brand');
  assert.equal(back.presets.customerCentricity[0].guidelines.maxSentenceWords, 18);
  assert.deepEqual(back.presets.structureMapping[0].guidelines.preferredSectionOrder, ['Features', 'Eligibility']);
  assert.equal(back.profiles[0].readerContext, 'Salaried borrower');
  assert.equal(back.profiles[0].productGuidelines.brandName, 'Bajaj Finance');

  const mine = [preset('c0', {}), { ...preset('c1', {}), name: 'old name' }];
  const merged = g.mergeById(mine as any[], back.presets.content as any[]);
  assert.deepEqual(merged.map((p) => p.id), ['c0', 'c1'], 'kept mine, replaced the same id');
  assert.equal(merged[1].name, 'Guideline c1');
});

test('import refuses files that are not guideline exports', () => {
  for (const bad of [null, 'text', 42, {}, { presets: 'x' }]) assert.equal(g.parseGuidelineFile(bad), null);
  assert.equal(g.parseGuidelineFile([{ id: 'a', name: 'A' }])!.profiles.length, 1, 'a plain list of profiles still imports');
});

test('the real-page test fixture is a complete guidelines file', () => {
  const fixture = JSON.parse(readFileSync('tests/fixtures/bajaj-guidelines.json', 'utf8'));
  const parsed = g.parseGuidelineFile(fixture)!;
  for (const id of ['personal-loan', 'business-loan', 'home-loan', 'gold-loan', 'fixed-deposit', 'insta-emi-card']) {
    const p = fixture.profiles.find((x: any) => x.id === `bfl-profile-${id}`);
    assert.ok(p, id);
    for (const k of ['productGuidelines', 'seoGuidelines', 'contentGuidelines', 'geoGuidelines', 'customerCentricityGuidelines', 'structureMappingGuidelines']) assert.ok(p[k], `${id} ${k}`);
    assert.ok(p.productGuidelines.brandName, `${id} brand`);
  }
  for (const s of g.PRESET_SECTIONS) assert.ok(parsed.presets[s].length >= 1, `fixture has ${s} guidelines`);
});
