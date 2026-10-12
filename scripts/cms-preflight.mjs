import { DatabaseSync } from 'node:sqlite';
import { accessSync, constants, realpathSync, statSync } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';

export function checkCmsEnvironment(env = process.env) {
  const failures = [];
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 13)) failures.push('Node >=22.13 required');
  try {
    const origin = new URL(env.ADMIN_ORIGIN);
    if (origin.protocol !== 'https:' || origin.origin !== env.ADMIN_ORIGIN)
      failures.push('ADMIN_ORIGIN must be an exact HTTPS origin without a trailing slash');
  } catch {
    failures.push('ADMIN_ORIGIN is missing or invalid');
  }
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(env.ADMIN_PASSWORD_SCRYPT ?? ''))
    failures.push('ADMIN_PASSWORD_SCRYPT is missing or malformed');
  if (env.ADMIN_TRUST_PROXY !== 'true')
    failures.push('ADMIN_TRUST_PROXY must be true behind a configured trusted proxy');
  const path = env.ADMIN_DATABASE_PATH;
  if (!path || !isAbsolute(path)) failures.push('ADMIN_DATABASE_PATH must be absolute');
  else {
    try {
      const root = realpathSync(process.cwd()),
        dbPath = realpathSync(path);
      if (dbPath.startsWith(root + sep)) failures.push('Database resolves inside checkout');
      if ((statSync(dbPath).mode & 0o077) !== 0) failures.push('Database permissions must be 0600');
      accessSync(dbPath, constants.R_OK | constants.W_OK);
      const db = new DatabaseSync(dbPath, { readOnly: true });
      try {
        for (const table of [
          'cms_entries',
          'cms_revisions',
          'admin_sessions',
          'admin_login_attempts',
          'admin_audit_log',
        ]) {
          if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table))
            failures.push(`Missing table: ${table}`);
        }
        if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok')
          failures.push('SQLite quick_check failed');
      } finally {
        db.close();
      }
    } catch {
      failures.push(
        'Database is missing, inaccessible or invalid; initialize it using the application first',
      );
    }
  }
  for (const file of ['0001_admin_cms.sql', '0002_admin_security.sql']) {
    try {
      accessSync(resolve('database/migrations', file), constants.R_OK);
    } catch {
      failures.push(`Missing migration: ${file}`);
    }
  }
  return failures;
}
if (process.argv[1]?.endsWith('cms-preflight.mjs')) {
  const failures = checkCmsEnvironment();
  if (failures.length) {
    failures.forEach((f) => console.error(`FAIL: ${f}`));
    process.exitCode = 1;
  } else
    process.stdout.write(
      'CMS preflight passed. Proxy header overwriting and network isolation must also be verified externally.\n',
    );
}
