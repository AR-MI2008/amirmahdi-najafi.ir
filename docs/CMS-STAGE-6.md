# Stage 6: graphical CMS editor

The authenticated `/admin/content` page lists SQLite records and opens create/edit forms for posts and projects. All schema fields are editable, including bilingual fields, article block types, project sections, capabilities, galleries, links and themes. Lists support adding/removing/moving items. No raw JSON editor is exposed. Validation errors appear beside fields; submissions preserve entered values on failure. Slugs are immutable on edits.

Writes require authentication, a trusted origin, a 250,000-byte payload limit, and the exact existing Zod schema. The repository checks an SHA-256 snapshot version inside its transaction; duplicate creates and stale updates fail without losing revisions or audit history. Successful forms lock until reopened from the refreshed list.

## Server setup before use

- Node >=22.13 and `ADMIN_DATABASE_PATH` outside the checkout are required.
- Set `ADMIN_ORIGIN` to the exact HTTPS admin origin. Production writes fail closed without it.
- Login requires `ADMIN_TRUST_PROXY=true` and a valid `X-Real-IP`. Enable only when the reverse proxy overwrites this header and the app port cannot be reached directly. Shared IPs still share a rate-limit bucket. No proxy was configured on the live server in this task.
- Logout clears the cookie using its original `/admin` path.
- Database migrations must be available at runtime under `database/migrations`.

## Limits

CMS records are not connected to public rendering. There is no deployment, media upload, delete operation, rich-text/Markdown preview, or slug renaming. Persian and English content are both required by existing schemas. Project records follow the existing published repository behavior; project status is its lifecycle state, not a publication toggle. A gallery uses existing local image paths. SQLite backup and proxy configuration remain deployment responsibilities.

Validation: typecheck; production webpack build; full unit suite including form interaction, origin boundary and real SQLite transactional revision/conflict checks. Browser end-to-end and visual device checks have not been performed. Default Turbopack build stalled in this environment and was stopped; webpack build succeeded. Repository-wide lint has existing errors in public components and content-import tests; CMS lint is checked separately.
