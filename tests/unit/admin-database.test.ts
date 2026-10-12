import { mkdtempSync, rmSync, symlinkSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('node:sqlite', async () => {
  const { createRequire } = await import('node:module');
  return createRequire(import.meta.url)('node:sqlite');
});
it('rejects relative, normalized and symlink paths inside checkout and creates private external data', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cms-path-'));
  const { getAdminDatabase } = await import('@/lib/admin/database');
  let db: ReturnType<typeof getAdminDatabase> | undefined;
  try {
    for (const value of [
      'relative.sqlite',
      `${process.cwd()}/../${process.cwd().split('/').at(-1)}/blocked.sqlite`,
    ]) {
      vi.stubEnv('ADMIN_DATABASE_PATH', value);
      expect(() => getAdminDatabase()).toThrow();
    }
    symlinkSync(process.cwd(), join(dir, 'checkout'), 'dir');
    vi.stubEnv('ADMIN_DATABASE_PATH', join(dir, 'checkout', 'blocked.sqlite'));
    expect(() => getAdminDatabase()).toThrow();
    expect(existsSync(join(process.cwd(), 'blocked.sqlite'))).toBe(false);
    const path = join(dir, 'private', 'cms.sqlite');
    vi.stubEnv('ADMIN_DATABASE_PATH', path);
    db = getAdminDatabase();
    expect(statSync(path).mode & 0o077).toBe(0);
    expect(statSync(path + '-wal').mode & 0o077).toBe(0);
  } finally {
    db?.close();
    vi.unstubAllEnvs();
    rmSync(dir, { recursive: true, force: true });
  }
});
