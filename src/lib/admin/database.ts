import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve, sep } from 'node:path';

let db: DatabaseSync | undefined;

export function getAdminDatabase(): DatabaseSync {
  if (db) return db;
  const path = process.env.ADMIN_DATABASE_PATH;
  const root = resolve(process.cwd());
  if (!path || !isAbsolute(path) || path === root || path.startsWith(root + sep)) {
    throw new Error('ADMIN_DATABASE_PATH must be an absolute path outside the repository');
  }
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const instance = new DatabaseSync(path);
  try {
    instance.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    const migrationRoot = resolve(process.cwd(), 'database/migrations');
    instance.exec(readFileSync(resolve(migrationRoot, '0001_admin_cms.sql'), 'utf8'));
    instance.exec(readFileSync(resolve(migrationRoot, '0002_admin_security.sql'), 'utf8'));
    db = instance;
    return instance;
  } catch (error) {
    instance.close();
    throw error;
  }
}
