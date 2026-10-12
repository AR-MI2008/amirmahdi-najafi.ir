import 'server-only';
import { createHash } from 'node:crypto';
import { getAdminDatabase } from './database';
import { adminPostSchema } from './post-validation';
import { adminProjectSchema } from './project-validation';
import type { AdminPostInput } from './post-validation';
import type { AdminProjectInput } from './project-validation';

type Kind = 'post' | 'project';
type Content = AdminPostInput | AdminProjectInput;
type StoredEntry = {
  id: number;
  kind: Kind;
  slug: string;
  status: 'draft' | 'published';
  data: Content;
};

function parse(kind: Kind, data: unknown): Content {
  return kind === 'post' ? adminPostSchema.parse(data) : adminProjectSchema.parse(data);
}

function fromRow(row: Record<string, unknown>): StoredEntry {
  const kind = row.kind;
  if (kind !== 'post' && kind !== 'project') throw new Error('Unknown CMS entry kind');
  const data = parse(kind, JSON.parse(String(row.data_json)));
  return {
    id: Number(row.id),
    kind,
    slug: String(row.slug),
    status: row.status === 'published' ? 'published' : 'draft',
    data,
  };
}

export function listAdminEntries(kind: Kind): StoredEntry[] {
  const rows = getAdminDatabase()
    .prepare(
      'SELECT id, kind, slug, status, data_json FROM cms_entries WHERE kind = ? ORDER BY updated_at DESC, id DESC',
    )
    .all(kind);
  return rows.map((row) => fromRow(row as Record<string, unknown>));
}

export function getAdminEntry(kind: Kind, slug: string): StoredEntry | null {
  const row = getAdminDatabase()
    .prepare(
      'SELECT id, kind, slug, status, data_json FROM cms_entries WHERE kind = ? AND slug = ?',
    )
    .get(kind, slug);
  return row ? fromRow(row as Record<string, unknown>) : null;
}

/**
 * Atomic upsert with revision and audit trail. Only call after server-side
 * authentication, authorization, origin checks and input-size validation.
 */
export function entryVersion(data: Content): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export function saveAdminEntry(
  kind: Kind,
  raw: unknown,
  expectedVersion: string | null = null,
): StoredEntry {
  const data = parse(kind, raw);
  const status =
    kind === 'post' ? ((data as AdminPostInput).draft ? 'draft' : 'published') : 'published';
  const db = getAdminDatabase();
  const serialized = JSON.stringify(data);
  db.exec('BEGIN IMMEDIATE');
  try {
    const existing = db
      .prepare('SELECT id, data_json FROM cms_entries WHERE kind = ? AND slug = ?')
      .get(kind, data.slug) as { id: number; data_json: string } | undefined;
    if (
      existing &&
      (!expectedVersion ||
        entryVersion(parse(kind, JSON.parse(existing.data_json))) !== expectedVersion)
    ) {
      throw new Error('CONFLICT');
    }
    if (!existing && expectedVersion) throw new Error('CONFLICT');
    let id: number;
    if (existing) {
      id = existing.id;
      db.prepare('INSERT INTO cms_revisions (entry_id, snapshot_json) VALUES (?, ?)').run(
        id,
        existing.data_json,
      );
      db.prepare(
        "UPDATE cms_entries SET status=?, title_fa=?, title_en=?, data_json=?, updated_at=datetime('now'), published_at=CASE WHEN ?='published' THEN COALESCE(published_at,datetime('now')) ELSE NULL END WHERE id=?",
      ).run(
        status,
        kind === 'post' ? (data as AdminPostInput).title.fa : (data as AdminProjectInput).name.fa,
        kind === 'post' ? (data as AdminPostInput).title.en : (data as AdminProjectInput).name.en,
        serialized,
        status,
        id,
      );
    } else {
      const title =
        kind === 'post' ? (data as AdminPostInput).title : (data as AdminProjectInput).name;
      const result = db
        .prepare(
          "INSERT INTO cms_entries (kind,slug,status,title_fa,title_en,data_json,published_at) VALUES (?,?,?,?,?,?,CASE WHEN ?='published' THEN datetime('now') ELSE NULL END)",
        )
        .run(kind, data.slug, status, title.fa, title.en, serialized, status);
      id = Number(result.lastInsertRowid);
    }
    db.prepare('INSERT INTO admin_audit_log(action,entity_kind,entity_id) VALUES (?,?,?)').run(
      existing ? 'update' : 'create',
      kind,
      id,
    );
    db.exec('COMMIT');
    return { id, kind, slug: data.slug, status, data };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
