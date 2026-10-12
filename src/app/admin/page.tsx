import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { logoutAdmin } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin dashboard', robots: { index: false, follow: false } };

export default async function AdminDashboard() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  return (
    <main
      dir="rtl"
      style={{ maxWidth: 960, margin: '0 auto', padding: '4rem 1.5rem', minHeight: '100vh' }}
    >
      <p style={{ color: 'var(--muted)' }}>AN / PRIVATE CMS</p>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: 20 }}>داشبورد مدیریت</h1>
      <p style={{ marginTop: 12, color: 'var(--muted)' }}>
        مقاله‌ها و پروژه‌ها را مدیریت کنید. نمایش محتوای CMS در سایت عمومی هنوز فعال نیست.
      </p>
      <section
        style={{ marginTop: 32, padding: 24, border: '1px solid var(--border)', borderRadius: 8 }}
      >
        <h2 style={{ fontSize: '1.2rem' }}>ماژول‌ها</h2>
        <p style={{ marginTop: 12, color: 'var(--muted)' }}>
          مدیریت مقاله‌ها و پروژه‌ها فعال است؛ بارگذاری رسانه و تنظیمات هنوز آماده نیست.
        </p>
        <Link href="/admin/content" style={{ display: 'inline-block', marginTop: 16 }}>
          مدیریت مقاله‌ها و پروژه‌ها
        </Link>
      </section>
      <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
        <Link href="/fa">بازگشت به سایت</Link>
        <form action={logoutAdmin}>
          <button type="submit" style={{ color: 'var(--danger)', cursor: 'pointer' }}>
            خروج امن
          </button>
        </form>
      </div>
    </main>
  );
}
