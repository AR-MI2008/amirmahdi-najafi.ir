import { DatabaseSync } from 'node:sqlite';
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, resolve, sep } from 'node:path';
const configured = process.env.ADMIN_DATABASE_PATH;
let db;
try {
  if (!configured || !isAbsolute(configured))
    throw new Error('ADMIN_DATABASE_PATH must be absolute');
  const root = realpathSync(process.cwd()),
    path = resolve(configured);
  if (path === root || path.startsWith(root + sep))
    throw new Error('Database must be outside checkout');
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const canonical = existsSync(path)
    ? realpathSync(path)
    : resolve(realpathSync(dirname(path)), basename(path));
  if (canonical === root || canonical.startsWith(root + sep))
    throw new Error('Database resolves inside checkout');
  process.umask(0o077);
  db = new DatabaseSync(path);
  chmodSync(path, 0o600);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  for (const file of ['0001_admin_cms.sql', '0002_admin_security.sql', '0003_public_content.sql'])
    db.exec(readFileSync(resolve('database/migrations', file), 'utf8'));
  process.stdout.write('CMS database initialized. Existing records were preserved.\n');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  db?.close();
}
