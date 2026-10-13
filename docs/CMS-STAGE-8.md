# Stage 8 — SQLite public content and controlled publication

Implemented on `feature/admin-cms`; neither `main` nor the VPS was changed.

## Public source

`CONTENT_SOURCE=typed` (the default) keeps the version-controlled public source. Set `CONTENT_SOURCE=sqlite` only after initialization, backup, import and preflight. An unrecognized mode is an error. SQLite mode requires a completed import marker and never falls back to typed records if a slug is missing, withdrawn, private or the database is unavailable.

Published posts/projects are selected by the database publication status **and** their validated `draft=false` payload. Home sections, project lists, blog search, command-palette search, related/next entries and sitemap use this same server-only source. Cache is scoped to one React request, not shared across visitors or saves. Services, profile configuration and verified metrics stay in version control.

Detail routes resolve new slugs at request time instead of restricting them to build-time slugs. The sitemap is dynamic. Successful writes/withdrawals/restores invalidate both language layouts and sitemap. Canonical URLs, titles, descriptions, Open Graph and JSON-LD read current published content. Post edits stamp a real update date; project sitemap modification dates reflect database updates, not project completion dates. See [Next.js route segment configuration](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config).

## Publication and revisions

Projects now have `draft`, independently of lifecycle status (`live`, `prototype`, etc.). New posts and projects start as drafts. Existing legacy project payloads receive a draft flag matching their stored publication status through idempotent migration 0003. Review legacy published records before enabling public mode.

The admin editor has a private history panel listing the latest twenty revisions. Restore is authenticated, origin-checked and version-checked and accepts only a revision belonging to that entry. It writes a fresh revision and restores into **draft**; it cannot silently republish historical/private content. Open and review the restored entry, then explicitly publish it. A content hash is normalized through the schema so property order cannot break edit conflict detection.

## Transfer current content

`database/seed-content.json` is a portable, checksum-verified snapshot generated and Zod-validated from typed sources: **2 posts and 5 projects**. The exporter reads repository content, not the live CMS database. It needs development dependencies only when regenerating the snapshot:

```bash
npm run cms:export-seed
```

For a new or existing deployment database, run as the service account from the checkout:

```bash
node --env-file=/etc/amirmahdi/site.env scripts/cms-init.mjs
node --env-file=/etc/amirmahdi/site.env scripts/cms-backup.mjs /var/backups/amirmahdi-cms/before-stage8.sqlite
node --env-file=/etc/amirmahdi/site.env scripts/cms-import.mjs --dry-run
node --env-file=/etc/amirmahdi/site.env scripts/cms-import.mjs
```

Use a new, unique backup filename. Dry run rolls back all seed inserts, audit records and the readiness marker. Actual import is transactional and idempotent: it inserts missing `(kind,slug)` records only and **never overwrites existing edits or publication state**. Repeating the import reports skipped records. It preserves slugs, bilingual content, publication dates, themes and unverified-capability gates. Existing slug conflicts must be reviewed rather than automatically overwritten.

Then set `CONTENT_SOURCE=sqlite` in the protected service environment and run preflight. The initial dataset was also imported into a dedicated local staging database outside the repository; no production database was opened or changed.

## Recovery

A private restore from editor history affects one entry and withdraws it pending review. For full database recovery, use stage 7's verified snapshot restore into a new file, stop the service, change its database path, preflight and restart. Sessions are invalidated by snapshot restore.

Switching explicitly back to typed mode displays the original repository snapshot and can re-expose an old record withdrawn in CMS. Therefore use a verified SQLite backup, not typed-mode rollback, when a withdrawal is privacy-related. There is no automatic typed fallback.

## Verification

Verified locally on 2026-10-13:

- TypeScript, repository-wide ESLint (no warnings) and production webpack build passed.
- 165 unit tests in 22 files passed, including real SQLite publication filtering, stable slugs, duplicate import, legacy normalization and revision conflicts.
- 2 operational tests passed: WAL backup/restore and transactional import rollback/retry.
- 14 CMS browser tests passed (7 desktop + 7 simulated mobile), including brand-new slugs after build, two-language publication, SEO updates, withdrawal, search/sitemap exclusion and revision restore as draft.
- The complete public regression suite ran in SQLite mode: 97 passed and 1 expected skip for the mobile-only menu in the desktop project.
- A persistent local staging database was initialized, dry-run tested, imported (7 inserts), and imported again (7 skips).

Dependencies were installed through the permitted package.json ranges using pnpm, not deployment-environment npm ci. No production credentials or databases were used. The first new project test found that a defaulted boolean was labeled optional; that label was corrected before the successful full run. Schema-normalized revision hashes fixed an ordering conflict discovered by the restore test.

## Deployment boundary

The implementation and local SQLite-backed tests are ready for review; activation on the live VPS is a separate stage. Physical phones, Safari/WebKit, the actual Nginx/CDN cache and firewall, deployment-environment `npm ci`, minimum Node 22.13 and a dependency audit still require separate verification. The test runtime is Node 24.19 with installed Chrome and a simulated mobile viewport. Publication is explicit; there is no timed/scheduled publication, media upload or slug renaming. Existing open browser pages are not actively refreshed; fresh requests use current publication state.
