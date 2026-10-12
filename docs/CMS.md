# Content management

On `feature/admin-cms`, `/admin/content` now edits a dedicated SQLite database through Persian forms. This CMS is not deployed and is not yet connected to public rendering. See [stage 6](CMS-STAGE-6.md) for the editor and [stage 7](CMS-STAGE-7.md) for verification, trusted proxy setup and backup/restore. The typed-content documentation below still describes the public rendering source.

> **Payload CMS is NOT installed and NOT running.**
>
> No Payload package appears in `package.json`. The `payload/` directory is a
> scaffold for a future migration, nothing more — it is excluded from lint and
> from the build, and importing from it would fail.
>
> The site runs in **typed-content mode**: content lives in `src/content/*.ts`
> and is served through `src/lib/content-source.ts`. Editing means a commit and
> a redeploy. That is a deliberate launch trade-off, not an oversight.


## Today: typed content modules

All editable content is in `src/content/`:

| File | Holds |
| --- | --- |
| `site.ts` | Name, headline, bio, contact links, availability, metrics, stack, capabilities |
| `projects.ts` | The five case studies, including each project's theme |
| `posts.ts` | Articles, as structured blocks |
| `services.ts` | Service list |

Every string is a `{ en, fa }` pair, so TypeScript refuses to build if a
translation is missing. Edit, commit, deploy.

### Adding a project

Append to the `projects` array. Required: `slug`, `name`, `category`, `role`,
`year`, `status`, `summary`, `intro`, `tech`, `theme`, `capabilities`,
`sections`. It appears automatically in the projects index, the command
palette, the sitemap and the homepage if `featured` is true.

`theme.motif` picks the geometry drawn behind the project: `radar`,
`topology`, `flow`, `trace` or `catalogue`. Add a new one in
`components/project/project-motif.tsx`.

### Adding an article

Append to `posts`. Blocks are `h2`, `p`, `code` or `note`. Set
`draft: true` while writing — drafts are filtered out of listings, the
sitemap and `generateStaticParams`, and the page returns 404.

### Editing metrics

`metrics` in `site.ts`. The rule is in the code comment and it is the real
rule: only numbers that can be evidenced. The section hides itself below two
entries, so deleting an unverifiable metric is always safe.

---

## Phase 2: Payload CMS on PostgreSQL

The collections are already written in `payload/collections/`. They mirror the
content types exactly, including localisation and project theme fields.

### Migration steps

1. Install:

   ```bash
   npm i payload @payloadcms/next @payloadcms/db-postgres @payloadcms/richtext-lexical sharp
   ```

2. Set `DATABASE_URL` and a long random `PAYLOAD_SECRET`.

3. Move `payload/payload.config.ts` to the project root (Payload expects it
   there) and add its Next plugin to `next.config.mjs`.

4. Create the admin route group at `src/app/(payload)/admin/[[...segments]]`
   following Payload's Next.js integration guide.

5. Run migrations and create the first user:

   ```bash
   npx payload migrate:create initial
   npx payload migrate
   npx payload create-first-user
   ```

6. Rewrite `src/lib/content-source.ts` so each function queries Payload
   instead of importing the local module. Return the same shapes. Nothing in
   `src/app` or `src/components` changes.

7. Seed by transcribing the existing modules through the admin, then delete
   the local content files.

### Draft and preview

`versions: { drafts: true }` is set on both content collections, and public
read access is filtered to `_status: published`. That single access rule is
what keeps drafts out of the site, the sitemap and the index — not a
front-end filter, which could be bypassed.

For preview, add a signed preview route that reads with `draft: true` and
returns `noindex`. Do not add an unauthenticated preview URL.


## The content seam

`src/lib/content-source.ts` is the only module allowed to import `src/content`.
That is enforced, not requested: `eslint.config.mjs` carries a
`no-restricted-imports` rule, and `npm run lint` fails if a page or component
reaches past it.

This is what makes the migration a single-file change. Every route already
calls `await getProjects()` rather than importing an array, so swapping the
body of each function for a Payload query touches no page.

One exception, by design. `getSiteConfig()` is synchronous and is not CMS
content: it is read during `generateMetadata` and in `sitemap.ts`, both of
which run before any async boundary, and the site URL it returns underpins
every canonical link, hreflang entry and OG image on the site. Making it
editable would let one typo in an admin field break the site's entire
indexing surface.
