import { KeywordItem, SearchIntent } from '../types';

/**
 * Google Ads API / Keyword Planner Service
 * Uses OAuth 2.0 Client Credentials & Refresh Token to query live Google Ads API (v22)
 * for historical search volumes, competitive density, bid estimates, and keyword ideas.
 */

// Credentials come only from the environment (see .env.example). Read lazily so dotenv has loaded.
const env = (k: string) => (process.env[k] || "").trim();
const cfg = () => ({
  clientId: env("GOOGLE_ADS_CLIENT_ID"),
  clientSecret: env("GOOGLE_ADS_CLIENT_SECRET"),
  refreshToken: env("GOOGLE_ADS_REFRESH_TOKEN"),
  customerId: env("GOOGLE_ADS_CUSTOMER_ID"),
  developerToken: env("GOOGLE_ADS_DEVELOPER_TOKEN"),
});

export function isGoogleAdsConfigured(): boolean {
  const c = cfg();
  return !!(c.clientId && c.clientSecret && c.refreshToken && c.customerId && c.developerToken);
}

const GOOGLE_ADS_API_VERSION = 'v22';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

/**
 * Exchanges the refresh token for a fresh Google OAuth access token.
 */
export async function getGoogleAdsAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60 * 1000) {
    return tokenCache.accessToken;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: cfg().clientId,
      client_secret: cfg().clientSecret,
      refresh_token: cfg().refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google OAuth Token Refresh failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 3600;
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: now + expiresIn * 1000,
  };

  return data.access_token;
}

/**
 * Checks connection status to Google Ads API.
 */
export async function getGoogleAdsStatus(): Promise<{
  connected: boolean;
  customerId: string;
  apiVersion: string;
  accessibleCustomers?: string[];
  error?: string;
}> {
  if (!isGoogleAdsConfigured()) {
    return {
      connected: false,
      customerId: cfg().customerId,
      apiVersion: GOOGLE_ADS_API_VERSION,
      error: 'Google Ads is not configured. Set the GOOGLE_ADS_* variables (including GOOGLE_ADS_DEVELOPER_TOKEN) in .env.',
    };
  }
  try {
    const accessToken = await getGoogleAdsAccessToken();
    const res = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': cfg().developerToken,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        customerId: cfg().customerId,
        apiVersion: GOOGLE_ADS_API_VERSION,
        accessibleCustomers: data.resourceNames || [],
      };
    }

    return {
      connected: false,
      customerId: cfg().customerId,
      apiVersion: GOOGLE_ADS_API_VERSION,
      error: `Status ${res.status}: ${await res.text()}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      customerId: cfg().customerId,
      apiVersion: GOOGLE_ADS_API_VERSION,
      error: err.message,
    };
  }
}

export interface GoogleKeywordMetricResult {
  keyword: string;
  searchVolume: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNSPECIFIED';
  competitionIndex: number;
  lowTopOfPageBid: number;
  highTopOfPageBid: number;
  monthlyTrend: Array<{ month: string; year: string; searches: number }>;
}

/**
 * Fetches real historical search volume metrics for a list of keywords from Google Ads API.
 */
export async function fetchGoogleKeywordHistoricalMetrics(
  keywords: string[],
  customerId = cfg().customerId
): Promise<Record<string, GoogleKeywordMetricResult>> {
  if (!keywords || keywords.length === 0 || !isGoogleAdsConfigured()) return {};

  const cleanKeywords = Array.from(
    new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))
  ).slice(0, 100);

  if (cleanKeywords.length === 0) return {};

  try {
    const accessToken = await getGoogleAdsAccessToken();
    const res = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}:generateKeywordHistoricalMetrics`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': cfg().developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: cleanKeywords,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[GoogleAdsAPI] Historical metrics warning (${res.status}):`, errText);
      return {};
    }

    const data = await res.json();
    const resultsMap: Record<string, GoogleKeywordMetricResult> = {};

    if (Array.isArray(data.results)) {
      for (const item of data.results) {
        const kwText = item.text?.toLowerCase();
        const m = item.keywordMetrics;
        if (!kwText || !m) continue;

        const avgVolume = parseInt(m.avgMonthlySearches || '0', 10);
        const compIndex = parseInt(m.competitionIndex || '0', 10);
        const lowBidMicros = parseInt(m.lowTopOfPageBidMicros || '0', 10);
        const highBidMicros = parseInt(m.highTopOfPageBidMicros || '0', 10);

        const monthlyTrend: Array<{ month: string; year: string; searches: number }> = [];
        if (Array.isArray(m.monthlySearchVolumes)) {
          for (const vol of m.monthlySearchVolumes) {
            monthlyTrend.push({
              month: vol.month || '',
              year: vol.year || '',
              searches: parseInt(vol.monthlySearches || '0', 10),
            });
          }
        }

        resultsMap[kwText] = {
          keyword: item.text,
          searchVolume: avgVolume,
          competition: m.competition || 'UNSPECIFIED',
          competitionIndex: compIndex,
          lowTopOfPageBid: lowBidMicros / 1000000,
          highTopOfPageBid: highBidMicros / 1000000,
          monthlyTrend,
        };
      }
    }

    return resultsMap;
  } catch (err: any) {
    console.warn('[GoogleAdsAPI] fetchGoogleKeywordHistoricalMetrics error:', err.message);
    return {};
  }
}

/**
 * Generates keyword ideas directly from Google Ads Keyword Planner API
 * using either seed keywords or a page URL.
 */
export async function fetchGoogleKeywordIdeas(params: {
  keywords?: string[];
  url?: string;
  customerId?: string;
  geoTarget?: string;
}): Promise<KeywordItem[]> {
  const { keywords = [], url, customerId = cfg().customerId } = params;
  if (!isGoogleAdsConfigured()) return [];

  try {
    const accessToken = await getGoogleAdsAccessToken();
    const bodyPayload: any = {
      includeAdultKeywords: false,
    };

    if (url && url.trim().startsWith('http')) {
      bodyPayload.urlSeed = { url: url.trim() };
    } else if (keywords.length > 0) {
      bodyPayload.keywordSeed = {
        keywords: keywords.slice(0, 10).map((k) => k.trim()),
      };
    } else {
      bodyPayload.keywordSeed = {
        keywords: ['financial services', 'online guidance'],
      };
    }

    const res = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}:generateKeywordIdeas`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': cfg().developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[GoogleAdsAPI] generateKeywordIdeas warning (${res.status}):`, errText);
      return [];
    }

    const data = await res.json();
    const rawIdeas: Array<{
      keyword: string;
      volume: number;
      comp: string;
      compIdx: number;
      lowBid: number;
      highBid: number;
      trend: any[];
    }> = [];

    if (Array.isArray(data.results)) {
      for (const item of data.results) {
        const text = item.text?.trim();
        const m = item.keywordIdeaMetrics;
        if (!text || !m) continue;

        const volume = parseInt(m.avgMonthlySearches || '0', 10);
        const compIdx = parseInt(m.competitionIndex || '0', 10);
        const lowBid = parseInt(m.lowTopOfPageBidMicros || '0', 10) / 1000000;
        const highBid = parseInt(m.highTopOfPageBidMicros || '0', 10) / 1000000;

        rawIdeas.push({
          keyword: text,
          volume,
          comp: m.competition || 'UNSPECIFIED',
          compIdx,
          lowBid,
          highBid,
          trend: m.monthlySearchVolumes || [],
        });
      }
    }

    // Sort by search volume descending
    rawIdeas.sort((a, b) => b.volume - a.volume);

    // Convert into KeywordItem format with Search Volume Priority Matrix
    const mappedKeywords: KeywordItem[] = rawIdeas.slice(0, 30).map((item, idx) => {
      const lower = item.keyword.toLowerCase();
      let intent: SearchIntent = 'commercial';
      if (/how|what|why|guide|tips|process|eligibility|steps|when|where/i.test(lower)) {
        intent = 'informational';
      } else if (/apply|buy|check|login|calculator|quote|interest|rates|register/i.test(lower)) {
        intent = 'transactional';
      }

      let priority: 'primary' | 'secondary' | 'voice_question' | 'lsi' = 'secondary';
      if (idx === 0) {
        priority = 'primary';
      } else if (/^(how|what|why|is|can|where|when|which)\b/i.test(lower) || lower.includes('?')) {
        priority = 'voice_question';
      } else if (idx <= 3) {
        priority = 'secondary';
      } else {
        priority = 'lsi';
      }

      return {
        id: `kw-gads-${Date.now()}-${idx}`,
        keyword: item.keyword,
        searchVolume: item.volume,
        intent,
        priority,
        competition: item.comp,
        competitionIndex: item.compIdx,
        lowTopOfPageBid: item.lowBid,
        highTopOfPageBid: item.highBid,
        source: 'google_keyword_planner',
        notes: `Google Ads API Verified (${item.volume.toLocaleString()}/mo, Comp: ${item.comp})`,
      };
    });

    return mappedKeywords;
  } catch (err: any) {
    console.warn('[GoogleAdsAPI] fetchGoogleKeywordIdeas error:', err.message);
    return [];
  }
}

/**
 * Evaluates and organizes a list of keywords into the Search Volume Priority Matrix:
 * - Primary (H1 & Meta Title Target): Highest volume core query
 * - Secondary (H2 Sections): High-volume feature/benefit targets
 * - Voice Query (H3 AEO Answers): Conversational questions
 * - LSI / Semantic: Long-tail supporting entities
 */
export function applySearchVolumePriorityMatrix(keywords: KeywordItem[]): KeywordItem[] {
  if (!keywords || keywords.length === 0) return [];

  // Sort by search volume descending
  const sorted = [...keywords].sort((a, b) => (b.searchVolume || 0) - (a.searchVolume || 0));

  let primaryAssigned = false;
  return sorted.map((kw, idx) => {
    const textLower = kw.keyword.toLowerCase();
    const isQuestion =
      /^(how|what|why|is|can|where|when|which|steps to|tips to)\b/i.test(textLower) ||
      textLower.includes('?');

    let priority: 'primary' | 'secondary' | 'voice_question' | 'lsi' = kw.priority;

    if (!primaryAssigned && !isQuestion) {
      priority = 'primary';
      primaryAssigned = true;
    } else if (isQuestion) {
      priority = 'voice_question';
    } else if (idx <= 3) {
      priority = 'secondary';
    } else {
      priority = idx <= 7 ? 'secondary' : 'lsi';
    }

    return {
      ...kw,
      priority,
    };
  });
}
