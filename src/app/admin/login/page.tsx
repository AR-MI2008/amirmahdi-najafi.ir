import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { loginAdmin } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect('/admin');
  const { error } = await searchParams;
  return (
    <main dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: '100%', maxWidth: 420, border: '1px solid var(--border)', padding: 32, borderRadius: 8, background: 'var(--surface)' }}>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>AN / PRIVATE ACCESS</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '18px 0' }}>ورود مدیر</h1>
        {error === '1' && <p role="alert" style={{ color: 'var(--danger)', marginBottom: 16 }}>ورود ناموفق بود. اطلاعات را بررسی کنید.</p>}
        <form action={loginAdmin} style={{ display: 'grid', gap: 16 }}>
          <label htmlFor="password">رمز عبور</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required minLength={1} maxLength={1024}
            style={{ width: '100%', padding: 12, border: '1px solid var(--border-strong)', borderRadius: 4, background: 'var(--bg)', color: 'var(--fg)' }} />
          <button type="submit" style={{ padding: 14, background: 'var(--accent)', color: 'var(--accent-contrast)', borderRadius: 4, fontWeight: 700 }}>ورود به پنل</button>
        </form>
      </section>
    </main>
  );
}
