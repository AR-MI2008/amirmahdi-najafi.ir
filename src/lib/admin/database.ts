import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let db: DatabaseSync | undefined;

/**
 * Uses built-in node:sqlite (requires Node >=22.13).
 * No database is created until a server-side CMS operation is requested.
 */
export function getAdminDatabase(): DatabaseSync {
  if (db) return db;
  const path = process.env.ADMIN_DATABASE_PATH;
  if (!path || !path.startsWith('/')) {
    throw new Error('ADMIN_DATABASE_PATH must be an absolute path outside the repository');
  }
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const instance = new DatabaseSync(path);
  instance.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  const migrationRoot = resolve(process.cwd(), 'database/migrations');
  instance.exec(readFileSync(resolve(migrationRoot, '0001_admin_cms.sql'), 'utf8'));
  instance.exec(readFileSync(resolve(migrationRoot, '0002_admin_security.sql'), 'utf8'));
  db = instance;
  return instance;
}
