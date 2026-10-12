import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, resolve, sep } from 'node:path';

let db: DatabaseSync | undefined;

export function getAdminDatabase(): DatabaseSync {
  if (db) return db;
  const configured = process.env.ADMIN_DATABASE_PATH;
  const path = configured && isAbsolute(configured) ? resolve(configured) : undefined;
  const root = resolve(process.cwd());
  if (!path || !isAbsolute(path) || path === root || path.startsWith(root + sep)) {
    throw new Error('ADMIN_DATABASE_PATH must be an absolute path outside the repository');
  }
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const canonical = resolve(realpathSync(dirname(path)), path.slice(path.lastIndexOf(sep) + 1));
  const canonicalRoot = realpathSync(root);
  if (
    canonical === canonicalRoot ||
    canonical.startsWith(canonicalRoot + sep) ||
    (existsSync(path) && realpathSync(path).startsWith(canonicalRoot + sep))
  ) {
    throw new Error('ADMIN_DATABASE_PATH must not resolve inside the repository');
  }
  const instance = new DatabaseSync(path);
  try {
    for (const suffix of ['', '-wal', '-shm']) {
      if (existsSync(path + suffix)) chmodSync(path + suffix, 0o600);
    }
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
