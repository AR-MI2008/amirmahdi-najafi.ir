# Payload CMS layer (phase 2)

The site currently reads content from typed modules in `src/content/*`. They
are the source of truth, they are type-checked at build time, and the site
runs with no database.

This directory holds the Payload collection definitions that replace them.
The swap point is a single seam: `src/lib/content-source.ts`. Nothing in
`src/app` or `src/components` imports `src/content/*` directly through more
than that seam, so moving to the database does not touch the UI.

See `docs/CMS.md` for the migration steps.
