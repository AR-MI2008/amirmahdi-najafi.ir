'use server';

import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminCookie, createSession, verifyAdminPassword } from '@/lib/admin/auth';

async function requireSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get('origin');
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!origin || !host) throw new Error('Invalid request origin');
  const parsed = new URL(origin);
  const expectedProtocol = process.env.NODE_ENV === 'production' ? 'https:' : parsed.protocol;
  if (parsed.protocol !== expectedProtocol || parsed.host !== host) throw new Error('Invalid request origin');
}

export async function loginAdmin(formData: FormData): Promise<void> {
  await requireSameOrigin();
  const password = formData.get('password');
  if (typeof password !== 'string' || !verifyAdminPassword(password)) {
    redirect('/admin/login?error=1');
  }
  const store = await cookies();
  store.set({ ...adminCookie, value: createSession() });
  redirect('/admin');
}

export async function logoutAdmin(): Promise<void> {
  await requireSameOrigin();
  const store = await cookies();
  store.delete(adminCookie.name);
  redirect('/admin/login');
}
