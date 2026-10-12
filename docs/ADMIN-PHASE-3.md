# Phase 3 — Content validation and persistence contract

Implemented in this commit:

- Complete strict runtime schemas for existing Post and Project TypeScript models.
- Durable SQLite login-attempt table migration for future lockout enforcement.
- No public site routes have been changed.

## Persistence contract

1. Database records use the existing cms_entries table and preserve the
   full project/post JSON in data_json, after successful Zod validation.
2. On save, use a transaction to append a previous snapshot to cms_revisions,
   update cms_entries and write admin_audit_log.
3. Only published entries appear on public routes; unpublished content remains
   accessible solely to authenticated administrators.
4. Keep typed file content as the fallback until a tested migration imports
   all existing projects/posts.
5. Avoid mixing incompatible partial schemas into the public content-source.
6. Run build, typecheck, unit tests and security tests before merging.

## Blocking work before production

- Install a compatible SQLite driver, with a committed lockfile and verified
  compatibility with the deployed Node.js version.
- Implement database-backed, revocable sessions and persistent login lockouts.
- Implement transactional repository CRUD and authenticated server actions.
- Add tests for schema compatibility, CSRF, rate limits and session revocation.
- Verify production DB storage and backups.

**Do not deploy this branch yet.** No SQLite driver has been installed, and
no database is opened by the app at runtime.
