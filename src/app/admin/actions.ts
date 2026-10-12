'use server';

import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { validAdminOrigin } from '@/lib/admin/request-security';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  adminCookie,
  createSession,
  revokeCurrentSession,
  verifyAdminPassword,
} from '@/lib/admin/auth';
import { getAdminDatabase } from '@/lib/admin/database';

async function requireSameOrigin(): Promise<Headers> {
  const h = await headers();
  if (!validAdminOrigin(h)) throw new Error('Invalid request origin');
  return h;
}

function loginKey(h: Headers): string {
  const ip = h.get('x-real-ip');
  // Enable only behind a proxy that overwrites X-Real-IP and blocks direct access.
  if (process.env.ADMIN_TRUST_PROXY !== 'true' || !ip || !isIP(ip)) {
    throw new Error('Trusted admin proxy is not configured');
  }
  return createHash('sha256').update(ip).digest('hex');
}

function isLoginBlocked(key: string): boolean {
  const row = getAdminDatabase()
    .prepare('SELECT locked_until FROM admin_login_attempts WHERE client_key_hash=?')
    .get(key) as { locked_until: number } | undefined;
  return Boolean(row && row.locked_until > Math.floor(Date.now() / 1000));
}

function recordLoginFailure(key: string): void {
  const now = Math.floor(Date.now() / 1000);
  const db = getAdminDatabase();
  db.prepare(
    `INSERT INTO admin_login_attempts(client_key_hash,window_start,attempt_count,locked_until)
    VALUES (?, ?, 1, 0)
    ON CONFLICT(client_key_hash) DO UPDATE SET
      window_start=CASE WHEN ?-window_start >= 900 THEN ? ELSE window_start END,
      attempt_count=CASE WHEN ?-window_start >= 900 THEN 1 ELSE attempt_count+1 END,
      locked_until=CASE
        WHEN ?-window_start >= 900 THEN 0
        WHEN attempt_count+1 >= 5 THEN ?+900 ELSE locked_until END`,
  ).run(key, now, now, now, now, now, now);
}

export async function loginAdmin(formData: FormData): Promise<void> {
  const h = await requireSameOrigin();
  const key = loginKey(h);
  if (isLoginBlocked(key)) redirect('/admin/login?error=1');
  const password = formData.get('password');
  if (typeof password !== 'string' || !verifyAdminPassword(password)) {
    recordLoginFailure(key);
    redirect('/admin/login?error=1');
  }
  const db = getAdminDatabase();
  db.prepare('DELETE FROM admin_login_attempts WHERE client_key_hash=?').run(key);
  const store = await cookies();
  store.set({ ...adminCookie, value: createSession() });
  redirect('/admin');
}

export async function logoutAdmin(): Promise<void> {
  await requireSameOrigin();
  await revokeCurrentSession();
  const store = await cookies();
  store.set({ ...adminCookie, value: '', maxAge: 0 });
  redirect('/admin/login');
}
