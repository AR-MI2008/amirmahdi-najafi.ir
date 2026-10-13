import 'server-only';
import { getAdminDatabase } from './admin/database';
import { adminPostSchema } from './admin/post-validation';
import { adminProjectSchema } from './admin/project-validation';
import type { Post, Project } from './content-source';
function rows(kind: 'post' | 'project') {
  const db = getAdminDatabase();
  if (!db.prepare("SELECT 1 FROM cms_settings WHERE key='content_imported' AND value='v1'").get())
    throw new Error('CMS content import must complete before public SQLite mode');
  return db
    .prepare(
      "SELECT slug,data_json,updated_at FROM cms_entries WHERE kind=? AND status='published'",
    )
    .all(kind);
}
export function listPublishedPosts(): Post[] {
  return rows('post')
    .map((row) => {
      const data = adminPostSchema.parse(JSON.parse(String(row.data_json)));
      if (data.slug !== row.slug) throw new Error('CMS slug mismatch');
      return data;
    })
    .filter((data) => !data.draft)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
}
export function listPublishedProjects(): Project[] {
  return rows('project')
    .map((row) => {
      const data = adminProjectSchema.parse(JSON.parse(String(row.data_json)));
      if (data.slug !== row.slug) throw new Error('CMS slug mismatch');
      return data;
    })
    .filter((data) => !data.draft)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}
export function projectModificationDates(): Record<string, string> {
  const published = new Set(listPublishedProjects().map((p) => p.slug));
  return Object.fromEntries(
    rows('project')
      .filter((r) => published.has(String(r.slug)))
      .map((r) => [String(r.slug), String(r.updated_at).replace(' ', 'T') + 'Z']),
  );
}
