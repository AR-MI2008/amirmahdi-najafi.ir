import { describe, expect, it } from 'vitest';
import { alternates, absolute } from '@/lib/seo';
import { projects } from '@/content/projects';
import { publishedPosts } from '@/content/posts';

describe('alternates', () => {
  it('canonicalises each locale to itself, never to English', () => {
    expect(alternates('/projects', 'fa').canonical).toBe(absolute('/fa/projects'));
    expect(alternates('/projects', 'en').canonical).toBe(absolute('/en/projects'));
  });

  it('emits both hreflang values plus x-default', () => {
    const { languages } = alternates('/about', 'en');
    expect(languages.en).toBe(absolute('/en/about'));
    expect(languages['fa-IR']).toBe(absolute('/fa/about'));
    expect(languages['x-default']).toBe(absolute('/en/about'));
  });
});

describe('content integrity', () => {
  it('gives every project both languages and a unique slug', () => {
    const slugs = new Set<string>();
    for (const project of projects) {
      expect(project.name.en.length).toBeGreaterThan(0);
      expect(project.name.fa.length).toBeGreaterThan(0);
      expect(project.summary.fa.length).toBeGreaterThan(0);
      expect(slugs.has(project.slug)).toBe(false);
      slugs.add(project.slug);
    }
  });

  it('uses lowercase hyphenated slugs everywhere', () => {
    for (const item of [...projects, ...publishedPosts()]) {
      expect(item.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('excludes drafts from the published set', () => {
    expect(publishedPosts().every((post) => !post.draft)).toBe(true);
  });
});
