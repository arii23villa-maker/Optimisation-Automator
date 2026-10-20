import { ContentComponent, SEOBackendData, KeywordItem, KeywordDensityItem } from '../types';

/**
 * Clean and normalize text for keyword density analysis
 */
export function extractFullTextFromComponent(
  comp?: ContentComponent | null,
  backend?: SEOBackendData | null,
  isSnapshot: boolean = false
): string {
  if (!comp) return '';

  const snapshot = comp.originalSnapshot;
  const targetHeadings = isSnapshot && snapshot?.headings ? snapshot.headings : (comp.headings || []);
  const targetHeroDesc = isSnapshot && snapshot?.heroDescription !== undefined ? snapshot.heroDescription : (comp.heroDescription || '');
  const targetBody = isSnapshot && snapshot?.bodyContent !== undefined ? snapshot.bodyContent : (comp.bodyContent || '');
  const targetListItems = isSnapshot && snapshot?.listItems ? snapshot.listItems : (comp.listItems || []);
  const targetFaqs = isSnapshot && snapshot?.faqs ? snapshot.faqs : (comp.faqs || []);
  const targetTables = isSnapshot && snapshot?.tables ? snapshot.tables : (comp.tables || []);
  const targetVoice = isSnapshot && snapshot?.voiceAnswerSnippet !== undefined ? snapshot.voiceAnswerSnippet : (comp.voiceAnswerSnippet || '');
  const targetCitation = isSnapshot && snapshot?.citationSource !== undefined ? snapshot.citationSource : (comp.citationSource || '');

  // Extract table text
  const tableTexts = targetTables.flatMap(tbl => [
    tbl.title || '',
    ...tbl.headers,
    ...tbl.rows.flatMap(r => r),
  ]);

  // Combine all narrative text
  const parts: string[] = [
    ...targetHeadings.map(h => h.text),
    targetHeroDesc,
    targetBody,
    ...targetListItems,
    ...tableTexts,
    ...targetFaqs.flatMap(f => [f.question, f.answer]),
    targetVoice,
    targetCitation,
  ];

  return parts.filter(Boolean).join(' ').trim();
}

/**
 * Calculates accurate keyword density comparing scraped (original) vs fixed (remediated) content.
 */
export function calculateKeywordDensityComparison(
  component: ContentComponent | null | undefined,
  backendData: SEOBackendData | null | undefined,
  keywordsList: KeywordItem[] = []
): {
  totalScrapedWords: number;
  totalFixedWords: number;
  items: KeywordDensityItem[];
  summary: {
    totalTracked: number;
    scrapedOptimalCount: number;
    fixedOptimalCount: number;
    scrapedMissingCount: number;
    fixedMissingCount: number;
    averageScrapedDensity: number;
    averageFixedDensity: number;
  };
} {
  const scrapedText = extractFullTextFromComponent(component, backendData, true);
  const fixedText = extractFullTextFromComponent(component, backendData, false);

  const scrapedWords = scrapedText.toLowerCase().split(/\s+/).filter(Boolean);
  const fixedWords = fixedText.toLowerCase().split(/\s+/).filter(Boolean);

  const totalScrapedWords = Math.max(1, scrapedWords.length);
  const totalFixedWords = Math.max(1, fixedWords.length);

  // Collect all unique keywords: Scraped Meta Tags, Backend Tags, and Target Keywords
  const keywordMap = new Map<string, {
    keyword: string;
    source: 'meta_tag' | 'target_keyword' | 'lsi' | 'voice_query';
    searchVolume?: number;
    intent?: string;
    priority?: string;
  }>();

  // 1. Meta Keyword Tags (scraped from HTML meta tags)
  const metaTags = [
    ...(backendData?.scrapedKeywordTags || []),
    ...(backendData?.tags || []),
  ];

  metaTags.forEach(tag => {
    const cleanTag = tag.trim();
    if (cleanTag.length >= 2 && !keywordMap.has(cleanTag.toLowerCase())) {
      keywordMap.set(cleanTag.toLowerCase(), {
        keyword: cleanTag,
        source: 'meta_tag',
        priority: 'meta_tag',
      });
    }
  });

  // 2. Target Ranking Keywords
  (keywordsList || []).forEach(k => {
    const cleanKw = k.keyword.trim();
    if (cleanKw.length >= 2) {
      keywordMap.set(cleanKw.toLowerCase(), {
        keyword: cleanKw,
        source: k.priority === 'voice_question' ? 'voice_query' : k.priority === 'lsi' ? 'lsi' : 'target_keyword',
        searchVolume: k.searchVolume,
        intent: k.intent,
        priority: k.priority,
      });
    }
  });

  const items: KeywordDensityItem[] = [];

  keywordMap.forEach(({ keyword, source, searchVolume, intent, priority }) => {
    const kwLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(kwLower)}\\b`, 'gi');

    const scrapedMatches = (scrapedText.match(regex) || []).length;
    const fixedMatches = (fixedText.match(regex) || []).length;

    const scrapedDensity = parseFloat(((scrapedMatches / totalScrapedWords) * 100).toFixed(2));
    const fixedDensity = parseFloat(((fixedMatches / totalFixedWords) * 100).toFixed(2));

    const getStatus = (density: number, count: number): 'optimal' | 'low' | 'high' | 'missing' => {
      if (count === 0) return 'missing';
      if (density >= 1.0 && density <= 3.2) return 'optimal';
      if (density < 1.0) return 'low';
      return 'high';
    };

    items.push({
      keyword,
      source,
      searchVolume,
      intent,
      priority,
      scrapedCount: scrapedMatches,
      scrapedDensity,
      scrapedStatus: getStatus(scrapedDensity, scrapedMatches),
      fixedCount: fixedMatches,
      fixedDensity,
      fixedStatus: getStatus(fixedDensity, fixedMatches),
      deltaDensity: parseFloat((fixedDensity - scrapedDensity).toFixed(2)),
      deltaCount: fixedMatches - scrapedMatches,
    });
  });

  // Sort by target priority & search volume
  items.sort((a, b) => {
    if (a.source === 'target_keyword' && b.source !== 'target_keyword') return -1;
    if (b.source === 'target_keyword' && a.source !== 'target_keyword') return 1;
    return (b.searchVolume || 0) - (a.searchVolume || 0);
  });

  const scrapedOptimal = items.filter(i => i.scrapedStatus === 'optimal').length;
  const fixedOptimal = items.filter(i => i.fixedStatus === 'optimal').length;
  const scrapedMissing = items.filter(i => i.scrapedCount === 0).length;
  const fixedMissing = items.filter(i => i.fixedCount === 0).length;
  
  const avgScrapedDensity = items.length > 0
    ? parseFloat((items.reduce((acc, i) => acc + i.scrapedDensity, 0) / items.length).toFixed(2))
    : 0;
  const avgFixedDensity = items.length > 0
    ? parseFloat((items.reduce((acc, i) => acc + i.fixedDensity, 0) / items.length).toFixed(2))
    : 0;

  return {
    totalScrapedWords,
    totalFixedWords,
    items,
    summary: {
      totalTracked: items.length,
      scrapedOptimalCount: scrapedOptimal,
      fixedOptimalCount: fixedOptimal,
      scrapedMissingCount: scrapedMissing,
      fixedMissingCount: fixedMissing,
      averageScrapedDensity: avgScrapedDensity,
      averageFixedDensity: avgFixedDensity,
    },
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
