# SEO

SEO here is architectural, not a plugin. Rendering, URLs, internationalisation
and internal linking were decided with crawling in mind; the metadata is the
last layer, not the strategy.

## Implemented

**Rendering.** Every page is a Server Component. All content — headings, copy,
project case studies, articles — is in the initial HTML. Nothing requires
JavaScript, a hover, a click or a scroll to become visible to a crawler. The
only client components are the theme toggle, language switcher, navigation
state, command palette, blog filter and contact form.

**URLs.** Lowercase, hyphenated, no dates, no query-string variants of main
content. Explicit locale prefixes: `/en/…` and `/fa/…`.

**Canonical.** Every localised page canonicalises to itself. `/fa/projects`
does *not* point at `/en/projects` — that is the single most common way to
delete a language from the index.

**hreflang.** `en`, `fa-IR` and `x-default` on every page, generated from one
function (`lib/seo.ts`) so the two languages cannot drift apart.

**Language switching.** Preserves the logical page:
`/en/projects/pad-system` → `/fa/projects/pad-system`. Unit-tested.

**Redirects.** Only the bare `/` negotiates a locale, with a 307. Every other
URL keeps its explicit locale, so both trees are directly crawlable. No
user-agent sniffing, no forced geographic redirect.

**Titles and descriptions.** Unique per page and per language, written for
readers. The home title leads with the entity: *Amirmahdi Najafi — Software
Developer, AI Builder & Founder*, and its Persian equivalent reads naturally
rather than transliterating the English.

**Structured data.** `Person` and `WebSite` on every page, `BreadcrumbList` on
projects, articles and sections, `CreativeWork` on case studies,
`BlogPosting` on articles. `sameAs` lists only profiles that exist — GitHub
and Telegram today. No `Organization`, no `Review`, no `AggregateRating`.
Every claim in the JSON-LD is visible on the page.

**Open Graph.** Generated at `/api/og` per page, with the page title, its
subtitle and the project's accent colour. Localised, because Persian titles
differ.

**Sitemap.** Generated from content at `app/sitemap.ts`. Includes both
locales of every static page, project and published article, with
`alternates.languages`. Excludes drafts, API routes and previews. Real
`lastModified`; no fabricated `changeFrequency`.

**robots.txt.** Allows the site, disallows `/admin`, `/api/`, `/preview`.
Never blocks CSS or JS. Points at the sitemap.

**Internal linking.** Home → each case study; projects index → each case
study; each case study → next project and contact; about → active projects;
articles → previous and next; services → contact. Nothing important is
reachable only from the sitemap. No keyword list in the footer.

**Breadcrumbs.** Visible on projects, articles and sub-pages, with matching
`BreadcrumbList` markup.

**Images.** Project motifs are inline SVG — no request, no layout shift.
Gallery images carry explicit `width`/`height`, lazy loading and localised
alt text.

**404.** Real 404 status with a useful page. No soft 404.

## Entity consistency

One name, one bio, one job title, one image, the same `sameAs` set on every
page. `knowsAbout` lists the five areas the case studies actually
demonstrate. That consistency is what lets a search engine — or a generative
answer engine — resolve "Amirmahdi Najafi" to one entity rather than several.

The route to being cited by AI search is the same as being trusted by a
reader: clear authorship, dated content, specific claims, a strong About page
and case studies that say what was built and what was not. There are no
hidden keyword blocks, no cloaked text, no "GEO" tricks. Those get sites
demoted, not surfaced.

## Verification

```bash
# canonical and hreflang on a Persian project page
curl -s https://amirmahdi-najafi.ir/fa/projects/pad-system \
  | grep -E 'canonical|hreflang'

# sitemap parses and excludes drafts
curl -s https://amirmahdi-najafi.ir/sitemap.xml | head -40

# robots
curl -s https://amirmahdi-najafi.ir/robots.txt

# structured data
# paste a page URL into https://validator.schema.org/
```

## Audit checklist

- [ ] Every indexable page has a unique title and description in both languages
- [ ] Every page canonicalises to itself
- [ ] hreflang is reciprocal — the Persian page points at the English one and back
- [ ] Exactly one `<h1>` per page; heading levels never skip
- [ ] Sitemap contains no draft, admin, API or preview URL
- [ ] Disabling JavaScript still shows all content on home, a case study and an article
- [ ] Rich Results Test passes for Person, BreadcrumbList and BlogPosting
- [ ] OG image renders for a project, an article and the home page, in both languages
- [ ] No duplicate host: `www` and `http` both 301 to the apex over HTTPS
- [ ] Mobile rendering matches desktop content (no hidden-on-mobile copy)
