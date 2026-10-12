# Stage 7 — CMS verification and release preparation

Work is confined to `feature/admin-cms`. Nothing is merged into `main` or deployed to the VPS. Public rendering still uses typed content, not the SQLite CMS.

## What changed

- The dashboard now links to the graphical editor. Admin pages use Persian document language, font and RTL direction and carry no-store/noindex headers.
- New posts default to draft; project themes start with valid colors. Invalid input remains in the form. Duplicate creates and stale edits cannot overwrite records.
- Login with a missing/invalid trusted proxy configuration shows a controlled error. Per-IP lockouts, scrypt verification and session expiry/revocation have real SQLite tests. Database paths are normalized and checked against symlink resolution; database, WAL and SHM files have private permissions.
- Dates are checked as real calendar dates, including optional update/project dates. Gallery paths reject backslashes and encoded traversal as well as remote URLs.
- Public regression checks exposed two existing issues: the root loading boundary streamed a 200 before missing-route checks and left only a loading shell without JavaScript; it was removed. Language changes now load a new document so the root language and direction update together. This trades the global loading skeleton for waiting until the complete server response is ready.
- Existing lint errors were repaired: mount timestamps initialize in an effect, theme UI subscribes to the DOM theme, mobile navigation resets on route changes, and palette options separate event handlers from the ref-owning dialog. Only fixture tests are exempt from runtime content-import rules.
- `npm run build` uses [supported webpack](https://nextjs.org/docs/app/api-reference/cli/next). `npm run build:turbopack` keeps the optional Turbopack path; this environment produced an internal error when Turbopack spawned Node workers, including after Node PATH was supplied. No claim is made that Turbopack itself was fixed.

## Isolated browser checks

`npm run test:cms` builds production and runs `playwright.cms.config.ts`. A temporary SQLite database and a generated test-only scrypt password are created outside the checkout. A loopback HTTPS proxy overwrites Host, X-Real-IP and forwarded headers. Its application upstream binds only to 127.0.0.1:3107. All temporary data is removed when the harness stops. Ports 3107 and 3447 must be free; OpenSSL and a Playwright browser are needed.

Install Chromium using `npx playwright install chromium`. If Chrome is already installed, `CMS_E2E_CHANNEL=chrome npm run test:cms` uses a separate headless Chrome profile. The browser tests cover anonymous/forged sessions, login failure, secure cookies, logout and replay rejection, article blocks, project fields, unsafe links, duplicate creation, stale updates, validation preservation, mobile width, and cross-origin action rejection. Mobile tests simulate an iPhone-sized Chromium viewport; they are not tests on a physical phone or Safari.

Screenshots and failure traces stay under ignored `test-results/`; HTML reports are under `playwright-report/cms`. Desktop/mobile CMS screenshots were inspected locally. Public regression checks can reuse the harness with `CMS_E2E_PUBLIC=true CMS_E2E_CHANNEL=chrome npm run test:cms`.

## Server preparation (not applied)

1. Use a dedicated service account, Node >=22.13, and a release containing `database/migrations`, `scripts`, `.next`, `public`, and production dependencies. The tested runtime is recorded in the verification results below.
2. Put secrets in an owner-only environment file outside the checkout, such as `/etc/amirmahdi/site.env`. Set `ADMIN_DATABASE_PATH=/var/lib/amirmahdi-cms/cms.sqlite`, the existing scrypt password hash, `ADMIN_ORIGIN=https://amirmahdi-najafi.ir`, `ADMIN_TRUST_PROXY=true`, site URL and a random rate-limit pepper. Do not expose secrets as NEXT_PUBLIC variables. Directory mode should be 0700 and database mode 0600.
3. Run, as the service account, `node --env-file=/etc/amirmahdi/site.env scripts/cms-init.mjs`, then `node --env-file=/etc/amirmahdi/site.env scripts/cms-preflight.mjs`. Initialization preserves existing records. Preflight checks configuration, tables, permissions, integrity and migrations. It does not prove network isolation.
4. Adapt `deploy/cms-service.service.example` and `deploy/cms-nginx.conf.example`. Check Nginx syntax with `nginx -t`. Bind the app to loopback and ensure port 3000 cannot be reached externally. Overwrite all incoming identity/forwarded headers at the trusted edge. A CDN requires a separately verified trusted real-IP configuration; otherwise every visitor shares the edge IP bucket.
5. Before publication, verify host handling, HTTPS, blocked direct upstream access, IP bucket isolation, no-store headers and cookie settings on the actual VPS. These real-server checks have not been executed in this task.

The sample service is optional and is not installed automatically. Run preflight using the same working directory and account as the service. Existing site deployment scripts and services are not altered.

## Backup and restore

Create a unique snapshot outside the checkout:

```bash
node --env-file=/etc/amirmahdi/site.env scripts/cms-backup.mjs /var/backups/amirmahdi-cms/cms-2026-10-12.sqlite
```

The script uses [SQLite `VACUUM INTO`](https://sqlite.org/lang_vacuum.html#vacuum_with_an_into_clause) to include committed WAL data in a standalone snapshot. It refuses to overwrite an existing file, enforces private permissions and verifies integrity and foreign keys. Copy the resulting snapshot to protected off-server storage. Schedule and retention are deployment responsibilities; no schedule has been installed.

Test a restore into a NEW destination:

```bash
node scripts/cms-restore.mjs /var/backups/amirmahdi-cms/cms-2026-10-12.sqlite /var/lib/amirmahdi-cms/restored.sqlite
```

Restore verifies the snapshot, preserves content/revisions/audit records, invalidates all sessions and clears login failure buckets. It never overwrites the live database. For an actual recovery, stop the service first, preserve the current database and its WAL/SHM together, set ADMIN_DATABASE_PATH to the new verified file, run preflight and restart. Never pair a restored file with stale WAL/SHM files. Rotate the admin password if the recovery relates to a security incident.

`npm run test:ops` tests backup from an open WAL connection and a restore, checks retained content and invalidated sessions, rejects overwrite and unsafe destinations, and tests valid/invalid preflight configurations. A snapshot is sensitive because it contains CMS data and session hashes.

## Verification results

Verified locally on 2026-10-12 with Node 24.19.0, Next 16.3.4, React 19.2.8 and Zod 3.24.1:

| Check | Result |
| --- | --- |
| TypeScript | Passed |
| Repository-wide ESLint | Passed, no warnings |
| Unit tests | 161 passed in 21 files |
| Operational backup/restore/init/preflight test | 1 passed |
| Production webpack build | Passed |
| Public browser regression suite | 97 passed, 1 expected desktop skip for the mobile-only menu test |
| CMS desktop/mobile browser suite | 10 passed (5 desktop + 5 mobile) |
| Visual review | Desktop/mobile forms inspected in installed Chrome |

Dependencies were installed using package.json's permitted ranges through pnpm in this environment; this was not an `npm ci` run. Production dependencies are pinned; development tooling can differ from the npm lockfile. Node 22.13 itself, physical devices, Safari/WebKit, a dependency vulnerability audit and real VPS/Nginx configuration were not tested here. Before release, repeat the checks with `npm ci` in the deployment/CI environment. Turbopack failed locally with an internal process-spawn error and is an optional path, not the standard build.

The first browser runs exposed a real editor remount issue, streamed 200 responses for missing routes, and stale root document language after client locale navigation; these were fixed and verified. Test-only corrections included scoping alerts away from Next's route announcer, making fixture titles unique per device, using direct HTTP for the forged-origin check, selecting the actual Work link in the mobile menu, and allowing 60 seconds for tests visiting ten routes. No failing behavior assertions were removed.

## Remaining release boundary

Public SQLite reading and draft filtering are a subsequent stage. Do not deploy merely because the local tests pass. Actual VPS configuration, TLS/proxy tests, off-server backup scheduling and operator recovery practice remain outstanding.

References: [Next.js build CLI](https://nextjs.org/docs/app/api-reference/cli/next), [Node SQLite](https://nodejs.org/download/release/latest-jod/docs/api/sqlite.html), [SQLite snapshots with VACUUM INTO](https://sqlite.org/lang_vacuum.html#vacuum_with_an_into_clause).
