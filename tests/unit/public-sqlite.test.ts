import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it, vi } from 'vitest';
vi.mock('node:sqlite', async () => {
  const { createRequire } = await import('node:module');
  return createRequire(import.meta.url)('node:sqlite');
});
const dir = mkdtempSync(join(tmpdir(), 'cms-public-'));
const path = join(dir, 'cms.sqlite');
vi.stubEnv('ADMIN_DATABASE_PATH', path);
vi.stubEnv('CONTENT_SOURCE', 'sqlite');
const { getAdminDatabase } = await import('@/lib/admin/database');
const { saveAdminEntry, getAdminEntry, entryVersion, restoreAdminRevision, listAdminRevisions } =
  await import('@/lib/admin/repository');
const source = await import('@/lib/content-source');
const { importContent } = await import('../../scripts/cms-import.mjs');
const snapshot = JSON.parse(readFileSync('database/seed-content.json', 'utf8'));
afterAll(() => {
  getAdminDatabase().close();
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});
it('requires completed import and validates an atomic, idempotent transfer with identical slugs', async () => {
  await expect(source.getProjects()).rejects.toThrow('import');
  expect(importContent(path, { dryRun: true })).toMatchObject({ imported: 7, dryRun: true });
  expect(getAdminDatabase().prepare('SELECT count(*) AS n FROM cms_entries').get()?.n).toBe(0);
  expect(importContent(path)).toMatchObject({ imported: 7, skipped: 0 });
  expect(importContent(path)).toMatchObject({ imported: 0, skipped: 7 });
  expect((await source.getProjectSlugs()).sort()).toEqual(
    snapshot.entries
      .filter((e: { kind: string }) => e.kind === 'project')
      .map((e: { data: { slug: string } }) => e.data.slug)
      .sort(),
  );
  expect((await source.getPosts()).length).toBe(2);
});
it('publishes new content, updates both languages, withdraws and restores without a typed fallback', async () => {
  const data = {
    slug: 'new-after-build',
    draft: true,
    featured: true,
    category: 'development' as const,
    tags: [],
    publishedAt: '2026-10-12',
    title: { fa: 'خصوصی', en: 'Private' },
    excerpt: { fa: 'خلاصه', en: 'Summary' },
    blocks: [],
  };
  const first = saveAdminEntry('post', data);
  expect(await source.getPostBySlug(data.slug)).toBeUndefined();
  const published = saveAdminEntry(
    'post',
    { ...data, draft: false, title: { fa: 'منتشرشده', en: 'Published' } },
    entryVersion(first.data),
  );
  expect((await source.getPostBySlug(data.slug))?.title.en).toBe('Published');
  expect(await source.getPostSlugs()).toContain(data.slug);
  const revision = listAdminRevisions('post', data.slug)[0]!;
  expect(() => restoreAdminRevision('post', data.slug, revision.id, 'f'.repeat(64))).toThrow(
    'CONFLICT',
  );
  restoreAdminRevision('post', data.slug, revision.id, entryVersion(published.data));
  expect(await source.getPostBySlug(data.slug)).toBeUndefined();
  const original = (await source.getPosts())[0]!;
  const entry = getAdminEntry('post', original.slug)!;
  saveAdminEntry('post', { ...entry.data, draft: true }, entryVersion(entry.data));
  expect(await source.getPostBySlug(original.slug)).toBeUndefined();
  importContent(path);
  expect(await source.getPostBySlug(original.slug)).toBeUndefined();
});
it('separates project lifecycle from publication and hides unpublished records everywhere', async () => {
  const original = (await source.getProjects())[0]!;
  const entry = getAdminEntry('project', original.slug)!;
  const withdrawn = saveAdminEntry(
    'project',
    { ...entry.data, draft: true, status: 'live' },
    entryVersion(entry.data),
  );
  expect(withdrawn.status).toBe('draft');
  expect(await source.getProjectBySlug(original.slug)).toBeUndefined();
  const sitemap = (await import('@/app/sitemap')).default;
  expect((await sitemap()).some((e) => e.url.endsWith('/projects/' + original.slug))).toBe(false);
  expect((await source.getFeaturedProjects()).some((p) => p.slug === original.slug)).toBe(false);
  expect(await source.getProjectModificationDates()).not.toHaveProperty(original.slug);
  saveAdminEntry('project', { ...withdrawn.data, draft: false }, entryVersion(withdrawn.data));
  expect(await source.getProjectBySlug(original.slug)).toBeDefined();
  expect(
    (await sitemap()).find((e) => e.url.endsWith('/projects/' + original.slug))?.lastModified,
  ).toBeInstanceOf(Date);
});
it('normalizes legacy project publication without changing lifecycle or revisions', () => {
  const db = getAdminDatabase();
  const legacy = {
    ...snapshot.entries.find((e: { kind: string }) => e.kind === 'project').data,
    slug: 'legacy',
  };
  delete legacy.draft;
  db.prepare(
    "INSERT INTO cms_entries(kind,slug,status,title_fa,title_en,data_json) VALUES('project','legacy','published','قدیمی','Legacy',?)",
  ).run(JSON.stringify(legacy));
  db.exec(readFileSync('database/migrations/0003_public_content.sql', 'utf8'));
  expect(getAdminEntry('project', 'legacy')?.data.draft).toBe(false);
});
