import { describe, expect, it } from 'vitest';
import { projects, publishableCapabilities, projectDate } from '@/content/projects';
import { metrics, sameAs, socialLinks, site } from '@/content/site';
import { publishedPosts, posts } from '@/content/posts';

/**
 * These tests encode the rules from docs/CONTENT-FACT-CHECK.md.
 *
 * They are not style checks. Each one corresponds to a specific way the site
 * previously said something it could not defend, and each will fail loudly if
 * that regresses.
 */

describe('unverified claims cannot reach a visitor', () => {
  it('never publishes a capability still marked unverified', () => {
    for (const project of projects) {
      for (const capability of publishableCapabilities(project)) {
        expect(
          capability.state,
          `${project.slug}: "${capability.label.en}" is published while unverified`,
        ).not.toBe('unverified');
      }
    }
  });

  it('omits every unverified project date rather than guessing one', () => {
    for (const project of projects) {
      if (!project.startDate && !project.displayDate) {
        expect(
          projectDate(project, 'en'),
          `${project.slug} renders a date with nothing to base it on`,
        ).toBeNull();
      }
    }
  });

  it('requires a real ISO date before any date is rendered', () => {
    for (const project of projects) {
      if (project.startDate) expect(project.startDate).toMatch(/^\d{4}(-\d{2})?(-\d{2})?$/);
      if (project.endDate) expect(project.endDate).toMatch(/^\d{4}(-\d{2})?(-\d{2})?$/);
    }
  });
});

describe('metrics', () => {
  it('renders nothing below two entries, so an empty set is a valid state', () => {
    expect(metrics.length === 0 || metrics.length >= 2).toBe(true);
  });

  it('does not reintroduce a shipped-product count that contradicts project status', () => {
    const shipped = projects.filter((p) => p.status === 'live' || p.status === 'delivered').length;
    const claim = metrics.find((m) => /shipped|running|محصول/i.test(m.label.en + m.label.fa));
    if (claim) {
      expect(
        Number(claim.value),
        'a "products shipped" metric must not exceed the number of live/delivered projects',
      ).toBeLessThanOrEqual(shipped);
    }
  });
});

describe('identity', () => {
  it('keeps sameAs to profiles that unambiguously identify the same person', () => {
    const profiles = sameAs();
    expect(profiles).toContain(site.github);
    expect(profiles).not.toContain(site.telegram);
    for (const url of profiles) expect(url.startsWith('https://')).toBe(true);
  });

  it('renders no social link with an empty href', () => {
    for (const link of socialLinks()) {
      expect(link.href.length, `${link.id} rendered with an empty href`).toBeGreaterThan(0);
    }
  });

  it('leaves LinkedIn and Instagram absent until they are configured', () => {
    const ids = socialLinks().map((l) => l.id);
    if (!site.linkedin) expect(ids).not.toContain('linkedin');
    if (!site.instagram) expect(ids).not.toContain('instagram');
  });
});

describe('project structured data', () => {
  it('only claims sameAs where a URL genuinely is the project', () => {
    for (const project of projects) {
      if (project.canonicalUrl) {
        expect(project.canonicalUrl).toMatch(/^https:\/\//);
        // The canonical URL must be one the page actually links to, so schema
        // and page never disagree.
        const linked = project.links.some((l) => l.href === project.canonicalUrl);
        expect(linked, `${project.slug}: canonicalUrl is not linked on the page`).toBe(true);
      }
    }
  });

  it('leaves projects without a representative URL free of sameAs', () => {
    const withoutLinks = projects.filter((p) => p.links.length === 0);
    for (const project of withoutLinks) {
      expect(project.canonicalUrl, `${project.slug} invented a canonicalUrl`).toBeUndefined();
    }
  });
});

describe('drafts', () => {
  it('excludes drafts from the published set', () => {
    const drafts = posts.filter((p) => p.draft);
    for (const draft of drafts) {
      expect(publishedPosts().map((p) => p.slug)).not.toContain(draft.slug);
    }
  });
});
