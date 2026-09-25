import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { posts, publishedPosts } from '@/content/posts';

describe('sitemap', () => {
  it('excludes drafts, admin, API and preview URLs', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    for (const draft of posts.filter((p) => p.draft)) {
      expect(urls.some((u) => u.includes(draft.slug))).toBe(false);
    }
    for (const forbidden of ['/api/', '/admin', '/preview', '/_next']) {
      expect(urls.some((u) => u.includes(forbidden))).toBe(false);
    }
  });

  it('does not fabricate lastModified on pages with no real timestamp', async () => {
    const entries = await sitemap();
    const published = publishedPosts().map((p) => p.slug);

    for (const entry of entries) {
      const isArticle = published.some((slug) => entry.url.includes(`/blog/${slug}`));
      if (!isArticle) {
        expect(
          entry.lastModified,
          `${entry.url} claims a modification date it cannot support`,
        ).toBeUndefined();
      }
    }
  });

  it('uses the real publication date for articles', async () => {
    const entries = await sitemap();
    for (const post of publishedPosts()) {
      const entry = entries.find((e) => e.url.endsWith(`/en/blog/${post.slug}`));
      expect(entry?.lastModified).toEqual(new Date(post.updatedAt ?? post.publishedAt));
    }
  });

  it('gives every entry both hreflang alternates', async () => {
    for (const entry of await sitemap()) {
      const languages = entry.alternates?.languages as Record<string, string> | undefined;
      expect(languages?.en).toBeTruthy();
      expect(languages?.['fa-IR']).toBeTruthy();
    }
  });

  it('lists both language trees', async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.includes('/en/projects'))).toBe(true);
    expect(urls.some((u) => u.includes('/fa/projects'))).toBe(true);
  });
});
