'use server';

import { loginKey, isLoginBlocked, recordLoginFailure } from '@/lib/admin/login-security';
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

export async function loginAdmin(formData: FormData): Promise<void> {
  const h = await requireSameOrigin();
  let key: string;
  try {
    key = loginKey(h);
  } catch {
    console.error('[admin] trusted proxy configuration is missing or invalid');
    redirect('/admin/login?error=2');
  }
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
