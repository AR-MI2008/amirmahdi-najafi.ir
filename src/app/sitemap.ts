import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { getProjects, getPosts } from '@/lib/content-source';
import { absolute } from '@/lib/seo';

/**
 * Only indexable public pages. No admin, no drafts, no API routes, no preview.
 *
 * lastModified is OMITTED wherever no real timestamp exists. It used to be
 * `new Date()` on every static page and every project, which told crawlers the
 * entire site changed on each build. That is not a small inaccuracy: a sitemap
 * that claims constant freshness and cannot back it up trains a crawler to
 * ignore the field, so the blog posts — which DO have real dates — lose the
 * signal too. Absent is honest and costs nothing.
 *
 * changeFrequency is omitted for the same reason.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['', '/about', '/projects', '/services', '/blog', '/contact'];
  const projects = await getProjects();
  const posts = await getPosts();

  const languagesFor = (path: string) =>
    Object.fromEntries(locales.map((l) => [l === 'fa' ? 'fa-IR' : 'en', absolute(`/${l}${path}`)]));

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: absolute(`/${locale}${path}`),
        // No lastModified: these pages have no content timestamp.
        alternates: { languages: languagesFor(path) },
      });
    }

    for (const project of projects) {
      const path = `/projects/${project.slug}`;
      entries.push({
        url: absolute(`/${locale}${path}`),
        // No lastModified: project content carries no verified date. When
        // docs/CONTENT-FACT-CHECK.md is worked through and real dates land in
        // the content model, add `lastModified: new Date(project.endDate ?? …)`
        // here — not before.
        priority: project.featured ? 0.8 : 0.6,
        alternates: { languages: languagesFor(path) },
      });
    }

    for (const post of posts) {
      const path = `/blog/${post.slug}`;
      entries.push({
        // Articles are the one content type with a real, published timestamp.
        url: absolute(`/${locale}${path}`),
        lastModified: new Date(post.updatedAt ?? post.publishedAt),
        alternates: { languages: languagesFor(path) },
      });
    }
  }

  return entries;
}
