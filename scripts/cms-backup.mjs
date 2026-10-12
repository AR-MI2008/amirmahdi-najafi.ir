import { DatabaseSync } from 'node:sqlite';
import { chmodSync, existsSync, mkdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/** VACUUM INTO includes committed WAL changes in a standalone SQLite snapshot. */
export function backupCms(source, destination) {
  if (!source || !destination || !isAbsolute(source) || !isAbsolute(destination)) {
    throw new Error('Source and destination must be absolute paths');
  }
  const root = realpathSync(process.cwd());
  const from = realpathSync(source);
  const to = resolve(destination);
  if (existsSync(to)) throw new Error('Backup destination already exists; choose a new file');
  if (from === root || from.startsWith(root + sep) || to.startsWith(root + sep)) {
    throw new Error('CMS data and backups must be outside the checkout');
  }
  mkdirSync(dirname(to), { recursive: true, mode: 0o700 });
  if (realpathSync(dirname(to)) === root || realpathSync(dirname(to)).startsWith(root + sep))
    throw new Error('Backup path resolves inside checkout');
  const previousUmask = process.umask(0o077);
  let db;
  try {
    db = new DatabaseSync(from, { readOnly: true });
    db.exec('PRAGMA busy_timeout=5000');
    // Fail before creating a backup if this is not a CMS database.
    db.prepare('SELECT id FROM cms_entries LIMIT 1').all();
    db.prepare('VACUUM INTO ?').run(to);
    chmodSync(to, 0o600);
    const snapshot = new DatabaseSync(to, { readOnly: true });
    try {
      const integrity = snapshot.prepare('PRAGMA integrity_check').get();
      if (
        integrity.integrity_check !== 'ok' ||
        snapshot.prepare('PRAGMA foreign_key_check').all().length
      ) {
        throw new Error('Backup integrity check failed; do not use this snapshot');
      }
      return { destination: to, bytes: statSync(to).size, integrity: 'ok' };
    } finally {
      snapshot.close();
    }
  } finally {
    db?.close();
    process.umask(previousUmask);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = backupCms(process.env.ADMIN_DATABASE_PATH, process.argv[2]);
    process.stdout.write(`CMS backup verified: ${result.destination} (${result.bytes} bytes)\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
