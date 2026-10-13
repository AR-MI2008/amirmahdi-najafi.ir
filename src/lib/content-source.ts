import 'server-only';
import { cache } from 'react';
import { getContentMode } from './content-mode';
/** Server-only content seam. SQLite mode reads published records only and never
 * falls back to typed files. Typed mode supports an explicit, reversible rollout.
 * Site configuration and non-CMS services remain version-controlled.
 */
import {
  projects as localProjects,
  publishableCapabilities as localPublishableCapabilities,
  projectDate as localProjectDate,
} from '@/content/projects';
import {
  posts as allLocalPosts,
  readingTime as localReadingTime,
  categoryLabels as localCategoryLabels,
} from '@/content/posts';
import { services as localServices } from '@/content/services';
import {
  site as localSite,
  metrics as localMetrics,
  stack as localStack,
  capabilities as localCapabilities,
  socialLinks as localSocialLinks,
  sameAs as localSameAs,
} from '@/content/site';

/* Types re-exported so consumers never need to reach past this module. */
export type {
  Project,
  ProjectStatus,
  ProjectTheme,
  ProjectPalette,
  Capability,
  CapabilityState,
  CaseSection,
} from '@/content/projects';
export type { Post, Block } from '@/content/posts';
export type { Service } from '@/content/services';
export type { Metric, SocialLink } from '@/content/site';

/* ---------------------------------------------------------------- projects */

export const getProjects = cache(async () => {
  if (getContentMode() === 'typed') return [...localProjects].sort((a, b) => a.order - b.order);
  const { listPublishedProjects } = await import('./public-content');
  return listPublishedProjects();
});
export async function getFeaturedProjects() {
  return (await getProjects()).filter((p) => p.featured);
}
export async function getProjectBySlug(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug);
}
export async function getNextProject(slug: string) {
  const list = await getProjects();
  const index = list.findIndex((p) => p.slug === slug);
  const next = list[(index + 1) % list.length];
  if (!next) throw new Error('No published project available');
  return next;
}
export async function getProjectSlugs() {
  return (await getProjects()).map((p) => p.slug);
}
export const getPosts = cache(async () => {
  if (getContentMode() === 'typed')
    return allLocalPosts
      .filter((p) => !p.draft)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const { listPublishedPosts } = await import('./public-content');
  return listPublishedPosts();
});
export async function getPostBySlug(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug);
}
export async function getAdjacentPosts(slug: string) {
  const list = await getPosts();
  const index = list.findIndex((p) => p.slug === slug);
  return index < 0 ? {} : { prev: list[index + 1], next: list[index - 1] };
}
export async function getPostSlugs() {
  return (await getPosts()).map((p) => p.slug);
}
export async function getProjectModificationDates(): Promise<Record<string, string>> {
  if (getContentMode() === 'typed') return {};
  const { projectModificationDates } = await import('./public-content');
  return projectModificationDates();
}

export const categoryLabels = localCategoryLabels;

/* ---------------------------------------------------------------- services */

export async function getServices() {
  return localServices;
}

/* ---------------------------------------------------------------- site-ish */

export async function getMetrics() {
  return localMetrics;
}

export async function getStack() {
  return localStack;
}

export async function getCapabilities() {
  return localCapabilities;
}

/**
 * Site configuration — name, URL, contact handles.
 *
 * Deliberately synchronous and deliberately NOT a CMS document. It is read
 * during `generateMetadata`, in `sitemap.ts` and at module scope in
 * `lib/seo.ts`, all of which run before any async boundary. Treating build-time
 * configuration as editable content would let one typo in an admin field break
 * every canonical URL on the site.
 */
export function getSiteConfig() {
  return localSite;
}

export function getSocialLinks() {
  return localSocialLinks();
}

export function getSameAs() {
  return localSameAs();
}

/* ------------------------------------------------------------ pure helpers */

export const publishableCapabilities = localPublishableCapabilities;
export const projectDate = localProjectDate;
export const readingTime = localReadingTime;
