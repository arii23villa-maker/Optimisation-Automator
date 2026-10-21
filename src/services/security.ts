/**
 * Server-side security helpers (server.ts wires them up):
 *   - isPrivateAddress: the SSRF guard's address check
 *   - clientIp: the visitor's address, also behind Vercel's proxy
 *   - rateLimit: per-IP request limits, so the API keys can't be drained by scripted calls
 *   - securityHeaders / contentSecurityPolicy: browser hardening
 *   - signed checkpoints: a run's saved progress travels through the browser; the signature stops anyone from
 *     editing it (for example, to fake an "approved" verdict)
 *   - optional site password (APP_PASSWORD): a signed, HttpOnly session cookie, with a brute-force lockout
 *
 * Limits are kept in memory per server instance. On Vercel, instances come and go, so they slow down abuse rather
 * than make it impossible: for real access control use Vercel Authentication and/or APP_PASSWORD.
 */
import crypto from 'node:crypto';
import dns from 'node:dns';
import net from 'node:net';
import type { Request as Req, Response as Res, NextFunction } from 'express';

// ---------------------------------------------------------------- addresses
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split('.').map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224 // multicast, reserved and broadcast
    );
  }
  const v6 = ip.toLowerCase();
  // IPv4-mapped (::ffff:127.0.0.1 or ::ffff:7f00:1) and NAT64 (64:ff9b::/96) addresses carry an IPv4 address.
  const mapped = v6.match(/^(?:::ffff:|64:ff9b::)(.+)$/);
  if (mapped) {
    const tail = mapped[1];
    if (net.isIPv4(tail)) return isPrivateAddress(tail);
    const hex = tail.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const n = ((parseInt(hex[1], 16) << 16) | parseInt(hex[2], 16)) >>> 0;
      return isPrivateAddress([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'));
    }
    return true;
  }
  return v6 === '::1' || v6 === '::' || /^(fc|fd|fe[89ab]|ff)/.test(v6);
}

/** An error whose message is safe and useful to show to the person using the tool. */
export class UserFacingError extends Error {
  status: number;
  constructor(message: string, status = 422) {
    super(message);
    this.status = status;
  }
}

/** Refuses URLs that aren't public http(s) addresses (the SSRF guard). */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new UserFacingError('That is not a valid URL.', 400);
  }
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw new UserFacingError('Only http and https URLs can be fetched.', 400);
  }
  if (u.username || u.password) {
    throw new UserFacingError('URLs with a user name or password cannot be fetched.', 400);
  }
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (/^localhost$|\.localhost$|\.local$|\.internal$/i.test(host)) {
    throw new UserFacingError('Internal hosts cannot be fetched. Use Paste HTML for intranet or staging pages.', 400);
  }
  const addrs = net.isIP(host) ? [host] : (await dns.promises.lookup(host, { all: true }).catch(() => [])).map((a: any) => a.address);
  if (addrs.length === 0) {
    throw new UserFacingError(`Could not resolve ${host}. Check the URL.`, 400);
  }
  if (addrs.some(isPrivateAddress)) {
    throw new UserFacingError('This URL points to a private network address. Use Paste HTML for intranet or staging pages.', 400);
  }
  return u;
}

/**
 * fetch() for user-supplied URLs: every hop of a redirect is checked against private addresses, so a public page
 * can't redirect the server to an internal one (for example the cloud metadata address 169.254.169.254).
 */
export async function fetchPublic(rawUrl: string, init: RequestInit = {}, maxRedirects = 5): Promise<Response> {
  let url = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    await assertPublicHttpUrl(url);
    const res = await fetch(url, { ...init, redirect: 'manual' });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url).href;
      continue;
    }
    return res;
  }
  throw new UserFacingError('The page redirected too many times.', 400);
}

/** The visitor's IP. Proxy headers are trusted only on Vercel (or with TRUST_PROXY=1), where the proxy sets them. */
export function clientIp(req: Req): string {
  const trustProxy = process.env.VERCEL === '1' || process.env.TRUST_PROXY === '1';
  if (trustProxy) {
    const h = (name: string) => String(req.headers[name] || '').split(',')[0].trim();
    const ip = h('x-vercel-forwarded-for') || h('x-real-ip') || h('x-forwarded-for');
    if (ip) return ip;
  }
  return req.socket?.remoteAddress || 'unknown';
}

// ---------------------------------------------------------------- rate limits
interface Window {
  count: number;
  since: number;
}

/** Allows `max` requests per IP per `windowMs` for this limiter; answers 429 beyond that. */
export function rateLimit(name: string, max: number, windowMs: number, when: (req: Req) => boolean = () => true) {
  const hits = new Map<string, Window>();
  return (req: Req, res: Res, next: NextFunction) => {
    if (!when(req)) return next();
    const now = Date.now();
    const key = clientIp(req);
    const w = hits.get(key);
    const cur = w && now - w.since < windowMs ? w : { count: 0, since: now };
    cur.count++;
    hits.set(key, cur);
    if (hits.size > 5000) for (const [k, v] of hits) if (now - v.since >= windowMs) hits.delete(k);
    if (cur.count > max) {
      const retry = Math.ceil((cur.since + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ error: `Too many requests (${name}). Try again in ${Math.ceil(retry / 60)} minute(s).`, status: 429 });
    }
    next();
  };
}

/** Counts failed password attempts per IP; locks out after `max` failures in `windowMs`. */
export function createLockout(max = 10, windowMs = 15 * 60 * 1000) {
  const failures = new Map<string, Window>();
  return {
    locked(ip: string): boolean {
      const f = failures.get(ip);
      return !!f && f.count >= max && Date.now() - f.since < windowMs;
    },
    fail(ip: string) {
      const f = failures.get(ip);
      const cur = f && Date.now() - f.since < windowMs ? f : { count: 0, since: Date.now() };
      cur.count++;
      failures.set(ip, cur);
    },
    clear(ip: string) {
      failures.delete(ip);
    },
  };
}

// ---------------------------------------------------------------- headers
/**
 * Content-Security-Policy for the app's HTML. `inlineScriptHashes` covers the small inline theme script in
 * index.html. FRAME_ANCESTORS (default: this site and Google AI Studio) controls who may embed the app.
 */
export function contentSecurityPolicy(inlineScriptHashes: string[] = []): string {
  const frameAncestors = (process.env.FRAME_ANCESTORS || "'self' https://aistudio.google.com").trim();
  return [
    "default-src 'self'",
    `script-src 'self' ${inlineScriptHashes.map((h) => `'${h}'`).join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
  ].join('; ');
}

export const BASE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/** sha256 hashes (CSP format) of inline <script> blocks in an HTML document. */
export function inlineScriptHashes(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    out.push(`sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}`);
  }
  return out;
}

export function securityHeaders(_req: Req, res: Res, next: NextFunction) {
  for (const [k, v] of Object.entries(BASE_SECURITY_HEADERS)) res.setHeader(k, v);
  next();
}

// ---------------------------------------------------------------- signing
let fallbackSecret: string | null = null;
/**
 * Signing secret. SESSION_SECRET if set; otherwise derived from the configured keys, so every Vercel instance
 * shares it. (If no keys are set at all, a random one is used for this process.)
 */
function secret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const material = [process.env.GEMINI_API_KEY, process.env.GROQ_API_KEY, process.env.ADMIN_PASSWORD, process.env.APP_PASSWORD]
    .filter(Boolean)
    .join('|');
  if (material) return crypto.createHash('sha256').update(`content-optimizer|${material}`).digest('hex');
  fallbackSecret ||= crypto.randomBytes(32).toString('hex');
  return fallbackSecret;
}

const hmac = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');
const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export interface SignedCheckpoint<T = unknown> {
  data: T;
  sig: string;
}

export function signCheckpoint<T>(data: T): SignedCheckpoint<T> {
  return { data, sig: hmac(`checkpoint|${JSON.stringify(data)}`) };
}

/** The checkpoint's data if the signature is valid; otherwise null. */
export function verifyCheckpoint<T = unknown>(value: unknown): T | null {
  const v = value as SignedCheckpoint<T>;
  if (!v || typeof v !== 'object' || typeof v.sig !== 'string' || v.data === undefined) return null;
  return safeEqual(v.sig, hmac(`checkpoint|${JSON.stringify(v.data)}`)) ? v.data : null;
}

// ---------------------------------------------------------------- optional site password
export const SESSION_COOKIE = 'co_session';
const SESSION_HOURS = 12;

export const sitePasswordRequired = () => !!(process.env.APP_PASSWORD || '').trim();

export function passwordMatches(given: unknown, expected: string): boolean {
  if (typeof given !== 'string' || !expected) return false;
  const h = (v: string) => crypto.createHash('sha256').update(v).digest();
  return crypto.timingSafeEqual(h(given), h(expected));
}

export function newSessionCookie(secure: boolean): string {
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const value = `${expires}.${hmac(`session|${expires}`)}`;
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function hasValidSession(req: Req): boolean {
  const raw = String(req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!raw) return false;
  const [expires, sig] = raw.slice(SESSION_COOKIE.length + 1).split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return safeEqual(sig, hmac(`session|${expires}`));
}
