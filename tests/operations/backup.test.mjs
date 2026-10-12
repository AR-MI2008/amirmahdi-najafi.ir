import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, chmodSync, rmSync, statSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { backupCms } from '../../scripts/cms-backup.mjs';
import { restoreCms } from '../../scripts/cms-restore.mjs';
import { checkCmsEnvironment } from '../../scripts/cms-preflight.mjs';

test('backs up live WAL, verifies integrity, prevents overwrite and restores records', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cms-backup-'));
  const source = join(dir, 'live.sqlite'),
    destination = join(dir, 'backup.sqlite'),
    db = new DatabaseSync(source);
  try {
    db.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0;');
    for (const migration of ['0001_admin_cms.sql', '0002_admin_security.sql'])
      db.exec(readFileSync(join('database/migrations', migration), 'utf8'));
    db.prepare(
      "INSERT INTO cms_entries(kind,slug,status,title_fa,title_en,data_json) VALUES('post','test','draft','آزمایش','Test','{}')",
    ).run();
    chmodSync(source, 0o600);
    const result = backupCms(source, destination);
    assert.equal(result.integrity, 'ok');
    assert.equal(statSync(destination).mode & 0o077, 0);
    assert.throws(() => backupCms(source, destination), /already exists/);
    const restored = new DatabaseSync(destination);
    try {
      assert.equal(restored.prepare('SELECT slug FROM cms_entries').get().slug, 'test');
      assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    } finally {
      restored.close();
    }
    db.prepare('INSERT INTO admin_sessions(id_hash,expires_at) VALUES (?,?)').run(
      'a'.repeat(64),
      '2099-01-01',
    );
    const second = join(dir, 'with-session.sqlite');
    backupCms(source, second);
    const target = join(dir, 'restored.sqlite');
    restoreCms(second, target);
    const restoredDb = new DatabaseSync(target);
    try {
      assert.equal(restoredDb.prepare('SELECT count(*) AS n FROM admin_sessions').get().n, 0);
      assert.equal(restoredDb.prepare('SELECT slug FROM cms_entries').get().slug, 'test');
      assert.equal(
        restoredDb.prepare("SELECT count(*) AS n FROM admin_audit_log WHERE action='restore'").get()
          .n,
        1,
      );
    } finally {
      restoredDb.close();
    }
    execFileSync(process.execPath, ['scripts/cms-init.mjs'], {
      env: { ...process.env, ADMIN_DATABASE_PATH: source },
    });
    assert.equal(db.prepare('SELECT count(*) AS n FROM cms_entries').get().n, 1);
    const valid = {
      ADMIN_ORIGIN: 'https://admin.example.com',
      ADMIN_PASSWORD_SCRYPT: `${'a'.repeat(32)}:${'b'.repeat(128)}`,
      ADMIN_TRUST_PROXY: 'true',
      ADMIN_DATABASE_PATH: source,
    };
    assert.deepEqual(checkCmsEnvironment(valid), []);
    assert.ok(checkCmsEnvironment({ ...valid, ADMIN_TRUST_PROXY: 'false' }).length);
    assert.ok(checkCmsEnvironment({ ...valid, ADMIN_ORIGIN: 'http://admin.example.com' }).length);
    assert.throws(() => backupCms(source, join(process.cwd(), 'unsafe-backup.sqlite')), /outside/);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
