import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('node:sqlite', async () => {
  const { createRequire } = await import('node:module');
  return createRequire(import.meta.url)('node:sqlite');
});
const dir = mkdtempSync(join(tmpdir(), 'cms-test-'));
vi.stubEnv('ADMIN_DATABASE_PATH', join(dir, 'cms.sqlite'));
const { saveAdminEntry, getAdminEntry, entryVersion } = await import('@/lib/admin/repository');
const { getAdminDatabase } = await import('@/lib/admin/database');
afterAll(() => {
  getAdminDatabase().close();
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});
it('saves atomically, rejects duplicate creation and stale edits, preserves revisions', () => {
  const data = {
    slug: 'test-post',
    draft: true,
    featured: false,
    category: 'development' as const,
    tags: [],
    publishedAt: '2026-10-12',
    title: { fa: 'عنوان', en: 'Title' },
    excerpt: { fa: 'خلاصه', en: 'Summary' },
    blocks: [],
  };
  const first = saveAdminEntry('post', data);
  expect(() => saveAdminEntry('post', data)).toThrow('CONFLICT');
  const version = entryVersion(first.data);
  saveAdminEntry('post', { ...data, title: { fa: 'جدید', en: 'New' } }, version);
  expect(() => saveAdminEntry('post', data, version)).toThrow('CONFLICT');
  expect(getAdminEntry('post', data.slug)?.data).toMatchObject({ title: { fa: 'جدید' } });
  expect(getAdminDatabase().prepare('SELECT count(*) AS n FROM cms_revisions').get()?.n).toBe(1);
  expect(getAdminDatabase().prepare('SELECT count(*) AS n FROM admin_audit_log').get()?.n).toBe(2);
});
