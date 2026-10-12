# Single-admin CMS implementation plan

Development branch: `feature/admin-cms`.

## Scope

- Private admin login and dashboard at `/admin`.
- Projects and articles management with Persian and English fields.
- Media uploads and site content management in subsequent phases.
- SQLite persistence, secure sessions, backups, and audit history.

## Implementation sequence

1. Audit existing Next.js routes, proxy, CSP, content types and deployment.
2. Add SQLite database schema and migration tooling.
3. Implement single-admin authentication, session cookies, authorization and rate limiting.
4. Build protected admin interface and projects/posts editing workflows.
5. Migrate typed content into the database without changing public rendering contracts.
6. Add revalidation, previews, media safety and backup/restore.
7. Run typecheck, lint, tests, build and deployment validation before any merge.

## Safety

- Never commit passwords, keys or production database files.
- Do not modify the `main` branch or production deployment before verification.
- Keep canonical site identity and URL configuration outside editable CMS fields.
