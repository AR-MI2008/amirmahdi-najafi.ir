import 'server-only';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getAdminDatabase } from './database';

const COOKIE_NAME = 'an_admin_session';
const MAX_AGE_SECONDS = 8 * 60 * 60;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export function verifyAdminPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_SCRYPT;
  if (!stored || password.length > 1024) return false;
  const [saltHex, keyHex, ...rest] = stored.split(':');
  if (
    !saltHex ||
    !keyHex ||
    rest.length ||
    !/^[a-f0-9]{32}$/i.test(saltHex) ||
    !/^[a-f0-9]{128}$/i.test(keyHex)
  )
    return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Random opaque token. Only its SHA-256 hash is persisted. */
export function createSession(): string {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000).toISOString();
  getAdminDatabase()
    .prepare('INSERT INTO admin_sessions (id_hash, expires_at) VALUES (?, ?)')
    .run(hash(token), expiresAt);
  return token;
}

export function verifySession(token: string | undefined): boolean {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const row = getAdminDatabase()
    .prepare(
      'SELECT 1 AS valid FROM admin_sessions WHERE id_hash=? AND revoked_at IS NULL AND expires_at > ?',
    )
    .get(hash(token), new Date().toISOString());
  return Boolean(row);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(COOKIE_NAME)?.value);
}

export async function revokeCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    getAdminDatabase()
      .prepare("UPDATE admin_sessions SET revoked_at=datetime('now') WHERE id_hash=?")
      .run(hash(token));
  }
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/admin',
};
