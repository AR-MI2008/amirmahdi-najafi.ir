import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, scryptSync, createHash } from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';
const cookie = vi.hoisted(() => ({ value: '' }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: cookie.value }) }),
}));
vi.mock('node:sqlite', async () => {
  const { createRequire } = await import('node:module');
  return createRequire(import.meta.url)('node:sqlite');
});
const dir = mkdtempSync(join(tmpdir(), 'cms-auth-'));
vi.stubEnv('ADMIN_DATABASE_PATH', join(dir, 'cms.sqlite'));
const auth = await import('@/lib/admin/auth');
const limiter = await import('@/lib/admin/login-security');
const { getAdminDatabase } = await import('@/lib/admin/database');
afterAll(() => {
  getAdminDatabase().close();
  vi.unstubAllEnvs();
  rmSync(dir, { recursive: true, force: true });
});
describe('admin authentication', () => {
  it('checks scrypt passwords and fails closed for malformed configuration', () => {
    const salt = randomBytes(16);
    vi.stubEnv(
      'ADMIN_PASSWORD_SCRYPT',
      `${salt.toString('hex')}:${scryptSync('test-secret', salt, 64).toString('hex')}`,
    );
    expect(auth.verifyAdminPassword('test-secret')).toBe(true);
    expect(auth.verifyAdminPassword('wrong')).toBe(false);
    expect(auth.verifyAdminPassword('a'.repeat(1025))).toBe(false);
    vi.stubEnv('ADMIN_PASSWORD_SCRYPT', 'invalid');
    expect(auth.verifyAdminPassword('test-secret')).toBe(false);
  });
  it('stores only session hashes and rejects expired, revoked or forged sessions', async () => {
    const token = auth.createSession();
    expect(auth.verifySession(token)).toBe(true);
    expect(
      getAdminDatabase().prepare('SELECT id_hash FROM admin_sessions').get()?.id_hash,
    ).not.toBe(token);
    cookie.value = token;
    await auth.revokeCurrentSession();
    expect(auth.verifySession(token)).toBe(false);
    const expired = auth.createSession();
    getAdminDatabase()
      .prepare('UPDATE admin_sessions SET expires_at=? WHERE id_hash=?')
      .run('2000-01-01T00:00:00.000Z', createHash('sha256').update(expired).digest('hex'));
    expect(auth.verifySession(expired)).toBe(false);
    expect(auth.verifySession('f'.repeat(64))).toBe(false);
    expect(auth.verifySession('invalid')).toBe(false);
    expect(statSync(join(dir, 'cms.sqlite')).mode & 0o077).toBe(0);
  });
  it('requires trusted proxy and isolates failure buckets by IP', () => {
    const h = new Headers({ 'x-real-ip': '192.0.2.1' });
    vi.stubEnv('ADMIN_TRUST_PROXY', 'false');
    expect(() => limiter.loginKey(h)).toThrow();
    vi.stubEnv('ADMIN_TRUST_PROXY', 'true');
    expect(() => limiter.loginKey(new Headers({ 'x-real-ip': 'not-an-ip' }))).toThrow();
    const key = limiter.loginKey(h),
      other = limiter.loginKey(new Headers({ 'x-real-ip': '192.0.2.2' }));
    for (let i = 0; i < 4; i++) limiter.recordLoginFailure(key);
    expect(limiter.isLoginBlocked(key)).toBe(false);
    limiter.recordLoginFailure(key);
    expect(limiter.isLoginBlocked(key)).toBe(true);
    expect(limiter.isLoginBlocked(other)).toBe(false);
    getAdminDatabase()
      .prepare(
        'UPDATE admin_login_attempts SET window_start=?, locked_until=0 WHERE client_key_hash=?',
      )
      .run(Math.floor(Date.now() / 1000) - 901, key);
    limiter.recordLoginFailure(key);
    expect(limiter.isLoginBlocked(key)).toBe(false);
    expect(
      getAdminDatabase()
        .prepare('SELECT attempt_count FROM admin_login_attempts WHERE client_key_hash=?')
        .get(key)?.attempt_count,
    ).toBe(1);
  });
});
