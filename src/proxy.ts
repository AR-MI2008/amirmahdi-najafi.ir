import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/i18n/config';

/*
 * Next.js 16 renamed the middleware convention to proxy.ts, with a default
 * export named `proxy`, running on the Node.js runtime.
 *
 * This file is the ONLY place that decides a locale for an unprefixed URL.
 * next.config.mjs deliberately does not redirect "/" — having both layers
 * claim that URL produced a redirect loop risk and made Accept-Language
 * negotiation unreachable.
 */

/**
 * Picks a locale from Accept-Language. Persian-preferring browsers get /fa,
 * everything else gets /en. Quality values are respected; malformed segments
 * are skipped rather than throwing.
 */
export function negotiateLocale(header: string | null): string {
  if (!header) return defaultLocale;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag.length > 0 && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag === '*') return defaultLocale;
    if (tag === 'fa' || tag.startsWith('fa-')) return 'fa';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
  }
  return defaultLocale;
}

function buildCsp(nonce: string): string {
  const dev = process.env.NODE_ENV === 'development';
  const turnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const cf = 'https://challenges.cloudflare.com';

  return [
    "default-src 'self'",
    // 'strict-dynamic' means host allowlists are ignored by modern browsers;
    // the Cloudflare origin is listed only as a fallback for browsers that
    // do not support it, and only when Turnstile is actually configured.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${turnstile ? ` ${cf}` : ''}${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://avatars.githubusercontent.com",
    "font-src 'self'",
    `connect-src 'self' https://api.github.com${turnstile ? ` ${cf}` : ''}`,
    turnstile ? `frame-src 'self' ${cf}` : "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Locale negotiation happens only at the bare root. Every other URL keeps
  // its explicit locale, so /en/* and /fa/* are never overridden and both
  // language trees stay directly crawlable.
  if (pathname === '/') {
    const locale = negotiateLocale(request.headers.get('accept-language'));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    // 307, not 308: the chosen locale depends on the request, so this
    // redirect must never be cached as permanent.
    const redirect = NextResponse.redirect(url, 307);
    redirect.headers.set('Vary', 'Accept-Language');
    return redirect;
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  // The root layout reads these to set <html lang> and <html dir> without a
  // client round-trip, and to nonce the theme bootstrap script.
  const segment = pathname.split('/')[1] ?? '';
  const locale =
    segment === 'admin'
      ? 'fa'
      : (locales as readonly string[]).includes(segment)
        ? segment
        : defaultLocale;

  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('x-locale', locale);
  headers.set('x-pathname', pathname);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  if (segment === 'admin') {
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  // Every non-asset request passes through, so the CSP nonce and the locale
  // headers are always present when the root layout renders.
  matcher: [
    '/((?!_next/static|_next/image|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|woff2?|txt|xml|webmanifest)$).*)',
  ],
};
