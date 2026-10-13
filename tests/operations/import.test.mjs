import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { importContent } from '../../scripts/cms-import.mjs';
import { createHash } from 'node:crypto';
test('atomic import rolls back a late invalid record and keeps existing edits on retry', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cms-import-')),
    path = join(dir, 'cms.sqlite'),
    db = new DatabaseSync(path);
  try {
    for (const f of ['0001_admin_cms.sql', '0002_admin_security.sql', '0003_public_content.sql'])
      db.exec(readFileSync('database/migrations/' + f, 'utf8'));
    const seed = JSON.parse(readFileSync('database/seed-content.json', 'utf8'));
    seed.entries.push({ kind: 'post', data: { slug: 'INVALID', draft: true } });
    seed.sha256 = createHash('sha256').update(JSON.stringify(seed.entries)).digest('hex');
    const invalid = join(dir, 'invalid.json');
    writeFileSync(invalid, JSON.stringify(seed));
    assert.throws(() => importContent(path, { seedPath: invalid }), /Invalid/);
    assert.equal(db.prepare('SELECT count(*) AS n FROM cms_entries').get().n, 0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM cms_settings').get().n, 0);
    assert.equal(importContent(path).imported, 7);
    db.prepare("UPDATE cms_entries SET status='draft' WHERE kind='project'").run();
    assert.equal(importContent(path).skipped, 7);
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS n FROM cms_entries WHERE kind='project' AND status='published'",
        )
        .get().n,
      0,
    );
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
