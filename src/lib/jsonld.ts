import type { Locale } from '@/i18n/config';
import { getSiteConfig, getSameAs } from '@/lib/content-source';

const site = getSiteConfig();
import type { Project, Post } from '@/lib/content-source';
import { absolute } from './seo';

/** JSON-LD must describe what is visibly on the page. Nothing more. */

export function personSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: site.name[locale],
    alternateName: locale === 'en' ? 'Amir Mahdi Najafi' : 'امیر مهدی نجفی',
    url: absolute(`/${locale}`),
    jobTitle: site.headline[locale],
    description: site.bio[locale],
    sameAs: getSameAs(),
    knowsAbout: [
      'Software development',
      'Web application development',
      'Backend engineering',
      'Web security',
      'Embedded systems',
    ],
    knowsLanguage: ['fa', 'en'],
  };
}

export function websiteSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: absolute(`/${locale}`),
    name: site.name[locale],
    inLanguage: locale === 'fa' ? 'fa-IR' : 'en',
    publisher: { '@id': `${site.url}/#person` },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

/**
 * sameAs comes ONLY from an explicit `canonicalUrl` on the project.
 *
 * It used to be `links.find(l => l.href.startsWith('http'))` — the first
 * arbitrary link. sameAs is an identity assertion ("this URL IS this thing"),
 * so pointing it at a docs page, a vendor, or a blog post about the project
 * asserts something false. Three of five projects have a URL that genuinely
 * is the project; two do not, and emit no sameAs at all.
 */
export function projectSchema(project: Project, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.name[locale],
    description: project.summary[locale],
    url: absolute(`/${locale}/projects/${project.slug}`),
    inLanguage: locale === 'fa' ? 'fa-IR' : 'en',
    creator: { '@id': `${site.url}/#person` },
    ...(project.canonicalUrl ? { sameAs: project.canonicalUrl } : {}),
  };
}

export function postSchema(post: Post, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title[locale],
    description: post.excerpt[locale],
    url: absolute(`/${locale}/blog/${post.slug}`),
    mainEntityOfPage: absolute(`/${locale}/blog/${post.slug}`),
    inLanguage: locale === 'fa' ? 'fa-IR' : 'en',
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@id': `${site.url}/#person` },
    keywords: post.tags.join(', '),
  };
}
