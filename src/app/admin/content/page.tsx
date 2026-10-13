import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import {
  listAdminEntries,
  getAdminEntry,
  entryVersion,
  listAdminRevisions,
} from '@/lib/admin/repository';
import { ContentEditor } from './content-editor';
import './content.css';
import { getContentMode } from '@/lib/content-mode';
import { RevisionRestore } from './revision-restore';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: 'مدیریت محتوا', robots: { index: false, follow: false } };
export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  const params = await searchParams;
  const kind = params.kind === 'post' || params.kind === 'project' ? params.kind : null;
  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  const entry = kind && slug ? getAdminEntry(kind, slug) : null;
  if (kind && slug && !entry) notFound();
  const posts = listAdminEntries('post'),
    projects = listAdminEntries('project');
  return (
    <main dir="rtl" className="cms-main">
      <Link href="/admin">بازگشت به داشبورد</Link>
      <h1>مدیریت مقاله‌ها و پروژه‌ها</h1>
      <p>
        {getContentMode() === 'sqlite'
          ? 'منبع عمومی SQLite فعال است؛ فقط محتوای منتشرشده نمایش داده می‌شود.'
          : 'منبع عمومی هنوز فایل‌های ثابت است؛ برای نمایش CMS باید انتقال محتوا و فعال‌سازی SQLite انجام شود.'}
      </p>
      <nav className="cms-buttons">
        <Link href="/admin/content?kind=post">مقالهٔ جدید</Link>
        <Link href="/admin/content?kind=project">پروژهٔ جدید</Link>
        <Link href="/admin/content">فهرست محتوا</Link>
      </nav>
      {kind ? (
        <>
          <h2>
            {entry ? 'ویرایش' : 'ایجاد'} {kind === 'post' ? 'مقاله' : 'پروژه'}
          </h2>
          <ContentEditor
            key={`${kind}:${slug ?? 'new'}`}
            kind={kind}
            initial={entry?.data}
            version={entry ? entryVersion(entry.data) : ''}
            originalSlug={entry?.slug}
          />
          {entry && (
            <RevisionRestore
              kind={kind}
              slug={entry.slug}
              version={entryVersion(entry.data)}
              revisions={listAdminRevisions(kind, entry.slug)}
            />
          )}
        </>
      ) : (
        (
          [
            ['مقاله‌ها', posts],
            ['پروژه‌ها', projects],
          ] as const
        ).map(([title, entries]) => (
          <section key={title}>
            <h2>
              {title} ({entries.length})
            </h2>
            {entries.length === 0 ? (
              <p>هنوز محتوایی ثبت نشده است.</p>
            ) : (
              <ul>
                {entries.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/content?kind=${e.kind}&slug=${encodeURIComponent(e.slug)}`}>
                      {'title' in e.data ? e.data.title.fa : e.data.name.fa}
                    </Link>{' '}
                    — {e.status === 'draft' ? 'پیش‌نویس' : 'منتشرشده'}{' '}
                    <span dir="ltr">({e.slug})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </main>
  );
}
