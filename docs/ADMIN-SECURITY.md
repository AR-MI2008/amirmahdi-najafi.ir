# Single-admin security requirements

This branch is **not deployable as an admin panel yet**. The database migration
and validation helpers are only foundations. Do not expose write routes until
all checks below are implemented and tested.

- Use one admin identity provisioned via server-only configuration; never store
  plaintext passwords or admin credentials in Git.
- Store a password verifier using a memory-hard password hashing algorithm,
  with a unique salt. Rate-limit authentication attempts.
- Use opaque random session tokens. Persist only a cryptographic hash of each
  token in the database. Cookies must be HttpOnly, Secure in production,
  SameSite=Lax or Strict, with a bounded expiration.
- Authorize every admin page, server action and API handler on the server.
- Validate Origin for state-changing requests, and defend against CSRF.
- Validate all content with schema checks, including nested project/post data.
- Restrict upload types, inspect actual file bytes, cap size, randomize storage
  names, and keep writable media outside executable paths.
- Preserve a revision before destructive edits. Record administrative actions.
- Do not make site URL, canonical identity or other build-time SEO invariants
  editable through the CMS.
- Store the SQLite database outside the repository and deployment directory;
  maintain verified off-server backups, including WAL-safe snapshots.
- Run migration and rollback tests before production rollout.
