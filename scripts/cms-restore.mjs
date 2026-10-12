import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { backupCms } from './cms-backup.mjs';

/** Restores into a NEW file. Never overwrites the database used by the app. */
export function restoreCms(snapshot, destination) {
  const result = backupCms(snapshot, destination);
  const db = new DatabaseSync(destination);
  try {
    db.exec('PRAGMA foreign_keys=ON; BEGIN IMMEDIATE;');
    db.exec('DELETE FROM admin_sessions; DELETE FROM admin_login_attempts;');
    db.prepare("INSERT INTO admin_audit_log(action,entity_kind) VALUES ('restore','system')").run();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  } finally {
    db.close();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = restoreCms(process.argv[2], process.argv[3]);
    process.stdout.write(
      `CMS restore verified in NEW file: ${result.destination}. All sessions invalidated.\n`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
