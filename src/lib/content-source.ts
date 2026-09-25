/**
 * The content repository. This is the ONLY module in the app that may import
 * src/content directly — eslint.config.mjs enforces that with a
 * no-restricted-imports rule, so the claim is checkable rather than a promise
 * in a comment.
 *
 * MODE: typed content. Payload CMS is NOT installed and NOT running. The
 * scaffold in payload/ is future-facing only; see docs/CMS.md. Nothing in
 * package.json depends on it, so no unused production dependency ships.
 *
 * When Payload is introduced, only this file changes: each async function
 * becomes an awaited query, the signatures stay identical, and no page or
 * component is edited.
 */
import {
  projects as localProjects,
  getProject as localGetProject,
  featuredProjects as localFeatured,
  nextProject as localNextProject,
  publishableCapabilities as localPublishableCapabilities,
  projectDate as localProjectDate,
} from '@/content/projects';
import {
  publishedPosts as localPosts,
  getPost as localGetPost,
  adjacentPosts as localAdjacent,
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

export async function getProjects() {
  return localProjects;
}

export async function getFeaturedProjects() {
  return localFeatured();
}

export async function getProjectBySlug(slug: string) {
  return localGetProject(slug);
}

export async function getNextProject(slug: string) {
  return localNextProject(slug);
}

export async function getProjectSlugs() {
  return localProjects.map((p) => p.slug);
}

/* ------------------------------------------------------------------- posts */

export async function getPosts() {
  return localPosts();
}

export async function getPostBySlug(slug: string) {
  return localGetPost(slug);
}

export async function getAdjacentPosts(slug: string) {
  return localAdjacent(slug);
}

export async function getPostSlugs() {
  return localPosts().map((p) => p.slug);
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
