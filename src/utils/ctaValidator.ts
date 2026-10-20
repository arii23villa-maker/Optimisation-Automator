/**
 * Call-To-Action (CTA) URL Validation & Normalization Utility
 * Ensures ONLY CTAs with valid, navigable destinations are parsed, stored, and displayed.
 */

export interface CtaValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  isExternal: boolean;
  linkCategory: 'external' | 'internal' | 'anchor' | 'contact' | 'invalid';
  reason?: string;
}

/**
 * Checks if a CTA destination string is a genuine, valid URL.
 * Rejects:
 * - empty strings or whitespace
 * - javascript: and pseudo-protocol script triggers (e.g. javascript:void(0))
 * - bare hashes (#, #!, #action, #cta-action, #none, #null, #undefined, #top)
 * - placeholders (void(0), about:blank, undefined, null)
 */
export function isValidCtaUrl(rawLink: string | undefined | null): boolean {
  if (!rawLink || typeof rawLink !== 'string') return false;
  const link = rawLink.trim();
  if (!link || link.length === 0) return false;

  const lower = link.toLowerCase();

  // Block javascript pseudo-protocols, void triggers, and dummy script links
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('void(') ||
    lower === 'javascript:void(0)' ||
    lower === 'javascript:void(0);' ||
    lower === 'javascript:;' ||
    lower === 'about:blank' ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower === 'none'
  ) {
    return false;
  }

  // Block dummy or empty hash anchors
  if (
    lower === '#' ||
    lower === '#!' ||
    lower === '#_' ||
    lower === '#action' ||
    lower === '#cta-action' ||
    lower === '#cta' ||
    lower === '#none' ||
    lower === '#null' ||
    lower === '#undefined' ||
    lower === '#top' ||
    lower === '#content'
  ) {
    return false;
  }

  // Valid absolute web URL (http:// or https://)
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      const parsed = new URL(link);
      return Boolean(parsed.hostname && (parsed.hostname.includes('.') || parsed.hostname === 'localhost'));
    } catch {
      return false;
    }
  }

  // Valid protocol-relative URL (//domain.com/path)
  if (lower.startsWith('//') && lower.length > 4 && lower.includes('.')) {
    return true;
  }

  // Valid root-relative or relative path (/signup, /pricing, /demo, ./contact, ../products)
  if (lower.startsWith('/') && lower.length > 1 && !lower.startsWith('//')) {
    return true;
  }
  if (lower.startsWith('./') || lower.startsWith('../')) {
    return true;
  }

  // Valid direct contact actions
  if (lower.startsWith('mailto:') && lower.includes('@') && lower.length > 8) {
    return true;
  }
  if (lower.startsWith('tel:') && lower.length > 5) {
    return true;
  }

  // Valid named anchor link targeting a specific section ID (e.g. #pricing, #contact, #free-trial, #faqs)
  if (lower.startsWith('#') && lower.length > 2) {
    const anchorId = lower.slice(1).trim();
    const bannedAnchors = ['', 'action', 'cta-action', 'cta', 'void', 'none', 'null', 'undefined', 'top', '_'];
    return !bannedAnchors.includes(anchorId);
  }

  // Valid domain-like string (e.g. app.domain.com/signup or domain.io)
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(link)) {
    return true;
  }

  return false;
}

/**
 * Validates and classifies a CTA URL, returning detailed metadata
 */
export function validateCtaUrl(rawLink: string | undefined | null, baseUrl?: string): CtaValidationResult {
  if (!rawLink || typeof rawLink !== 'string') {
    return {
      isValid: false,
      normalizedUrl: '',
      isExternal: false,
      linkCategory: 'invalid',
      reason: 'Empty or missing destination URL',
    };
  }

  const link = rawLink.trim();
  if (!isValidCtaUrl(link)) {
    return {
      isValid: false,
      normalizedUrl: link,
      isExternal: false,
      linkCategory: 'invalid',
      reason: 'Invalid URL format, placeholder or script trigger',
    };
  }

  const lower = link.toLowerCase();

  // Contact actions
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) {
    return {
      isValid: true,
      normalizedUrl: link,
      isExternal: true,
      linkCategory: 'contact',
    };
  }

  // Named anchor jumps
  if (lower.startsWith('#')) {
    return {
      isValid: true,
      normalizedUrl: link,
      isExternal: false,
      linkCategory: 'anchor',
    };
  }

  // External web URLs
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('//')) {
    return {
      isValid: true,
      normalizedUrl: link,
      isExternal: true,
      linkCategory: 'external',
    };
  }

  // Relative paths
  if (baseUrl && (link.startsWith('/') || link.startsWith('./') || link.startsWith('../'))) {
    try {
      const resolved = new URL(link, baseUrl).href;
      return {
        isValid: true,
        normalizedUrl: resolved,
        isExternal: false,
        linkCategory: 'internal',
      };
    } catch {
      return {
        isValid: true,
        normalizedUrl: link,
        isExternal: false,
        linkCategory: 'internal',
      };
    }
  }

  return {
    isValid: true,
    normalizedUrl: link,
    isExternal: false,
    linkCategory: 'internal',
  };
}
