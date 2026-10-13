import { DatabaseSync } from 'node:sqlite';
import { readFileSync, realpathSync, chmodSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function importContent(
  path,
  { dryRun = false, seedPath = resolve('database/seed-content.json') } = {},
) {
  if (!path || !isAbsolute(path)) throw new Error('ADMIN_DATABASE_PATH must be absolute');
  const canonical = realpathSync(path),
    root = realpathSync(process.cwd());
  if (canonical.startsWith(root + sep)) throw new Error('Database must be outside checkout');
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  if (
    seed.version !== 1 ||
    createHash('sha256').update(JSON.stringify(seed.entries)).digest('hex') !== seed.sha256
  )
    throw new Error('Seed integrity check failed');
  const db = new DatabaseSync(canonical);
  chmodSync(canonical, 0o600);
  let imported = 0,
    skipped = 0;
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE;');
  try {
    for (const { kind, data } of seed.entries) {
      if (
        !['post', 'project'].includes(kind) ||
        !data ||
        typeof data.draft !== 'boolean' ||
        typeof data.slug !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)
      )
        throw new Error('Invalid seed record');
      if (db.prepare('SELECT 1 FROM cms_entries WHERE kind=? AND slug=?').get(kind, data.slug)) {
        skipped++;
        continue;
      }
      const title = kind === 'post' ? data.title : data.name,
        status = data.draft ? 'draft' : 'published';
      const row = db
        .prepare(
          "INSERT INTO cms_entries(kind,slug,status,title_fa,title_en,data_json,published_at) VALUES(?,?,?,?,?,?,CASE WHEN ?='published' THEN datetime('now') ELSE NULL END)",
        )
        .run(kind, data.slug, status, title.fa, title.en, JSON.stringify(data), status);
      db.prepare(
        "INSERT INTO admin_audit_log(action,entity_kind,entity_id) VALUES('import',?,?)",
      ).run(kind, Number(row.lastInsertRowid));
      imported++;
    }
    db.prepare(
      "INSERT INTO cms_settings(key,value) VALUES('content_imported','v1') ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    ).run();
    db.prepare(
      "INSERT INTO cms_settings(key,value) VALUES('seed_sha256',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    ).run(seed.sha256);
    db.exec(dryRun ? 'ROLLBACK' : 'COMMIT');
    return { imported, skipped, dryRun };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.stdout.write(
      JSON.stringify(
        importContent(process.env.ADMIN_DATABASE_PATH, {
          dryRun: process.argv.includes('--dry-run'),
        }),
      ) + '\n',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
