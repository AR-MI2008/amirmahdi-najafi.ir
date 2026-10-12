import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { listAdminEntries } from '@/lib/admin/repository';
import { AdminJsonEditor } from './json-editor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin content', robots: { index: false, follow: false } };

export default async function AdminContentPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  const posts = listAdminEntries('post');
  const projects = listAdminEntries('project');
  return (
    <main dir="rtl" style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <Link href="/admin">← داشبورد</Link>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '24px 0' }}>مدیریت محتوای آزمایشی</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>فعلاً ویرایشگر JSON برای آزمایش ذخیره‌سازی است؛ فرم گرافیکی و اتصال سایت عمومی در مراحل بعد اضافه می‌شود.</p>
      <p style={{ marginBottom: 24 }}>مقالات ذخیره‌شده: {posts.length} | پروژه‌های ذخیره‌شده: {projects.length}</p>
      <AdminJsonEditor />
    </main>
  );
}
