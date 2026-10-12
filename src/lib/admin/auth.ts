import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'an_admin_session';
const MAX_AGE_SECONDS = 8 * 60 * 60;

function sessionKey(): string | null {
  const key = process.env.ADMIN_SESSION_SECRET;
  return key && key.length >= 32 ? key : null;
}

/**
 * ADMIN_PASSWORD_SCRYPT format: saltHex:derivedKeyHex
 * Generate outside GitHub using scryptSync(password, randomBytes(16), 64).
 */
export function verifyAdminPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_SCRYPT;
  if (!stored || password.length > 1024) return false;
  const [saltHex, keyHex, ...rest] = stored.split(':');
  if (!saltHex || !keyHex || rest.length || !/^[a-f0-9]{32}$/i.test(saltHex) || !/^[a-f0-9]{128}$/i.test(keyHex)) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

function signature(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('hex');
}

export function createSession(): string {
  const key = sessionKey();
  if (!key) throw new Error('Admin session secret is not configured');
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
    nonce: randomBytes(24).toString('hex'),
  })).toString('base64url');
  return payload + '.' + signature(payload, key);
}

export function verifySession(token: string | undefined): boolean {
  const key = sessionKey();
  if (!key || !token || token.length > 1024) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, mac] = parts;
  if (!payload || !mac || !/^[a-f0-9]{64}$/.test(mac)) return false;
  const expected = Buffer.from(signature(payload, key), 'hex');
  if (!timingSafeEqual(Buffer.from(mac, 'hex'), expected)) return false;
  try {
    const value: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!value || typeof value !== 'object' || !('exp' in value) || !('nonce' in value)) return false;
    const record = value as { exp: unknown; nonce: unknown };
    return typeof record.exp === 'number'
      && Number.isInteger(record.exp)
      && record.exp > Math.floor(Date.now() / 1000)
      && record.exp <= Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS
      && typeof record.nonce === 'string'
      && /^[a-f0-9]{48}$/.test(record.nonce);
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(COOKIE_NAME)?.value);
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/admin',
};
