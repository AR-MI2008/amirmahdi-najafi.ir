import type { Metadata } from 'next';
import { locales, type Locale } from '@/i18n/config';
import { getSiteConfig } from '@/lib/content-source';

const site = getSiteConfig();

const base = site.url.replace(/\/$/, '');

export function absolute(path: string): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** hreflang set for a path expressed WITHOUT its locale prefix, e.g. "/projects". */
export function alternates(pathWithoutLocale: string, locale: Locale) {
  const clean = pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l === 'fa' ? 'fa-IR' : 'en'] = absolute(`/${l}${clean}`);
  languages['x-default'] = absolute(`/en${clean}`);
  return {
    // Every localized page canonicalises to ITSELF.
    canonical: absolute(`/${locale}${clean}`),
    languages,
  };
}

type BuildArgs = {
  locale: Locale;
  path: string; // without locale prefix
  title: string;
  description: string;
  ogTitle?: string;
  ogSubtitle?: string;
  accent?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
};

export function buildMetadata(args: BuildArgs): Metadata {
  const { locale, path, title, description, noindex } = args;
  const ogUrl = new URL(absolute('/api/og'));
  ogUrl.searchParams.set('title', args.ogTitle ?? title);
  if (args.ogSubtitle) ogUrl.searchParams.set('subtitle', args.ogSubtitle);
  if (args.accent) ogUrl.searchParams.set('accent', args.accent);
  ogUrl.searchParams.set('locale', locale);

  return {
    title,
    description,
    alternates: alternates(path, locale),
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      type: args.type ?? 'website',
      title,
      description,
      url: alternates(path, locale).canonical,
      siteName: site.name[locale],
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
      ...(args.publishedTime ? { publishedTime: args.publishedTime } : {}),
      ...(args.modifiedTime ? { modifiedTime: args.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl.toString()],
    },
  };
}
