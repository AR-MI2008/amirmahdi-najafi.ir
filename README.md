# amirmahdi-najafi.ir

> ## CMS development branch
>
> The private SQLite CMS has graphical Persian post/project forms on
> `feature/admin-cms`. It is not deployed. Stage 8 connects public content to SQLite via an explicit
> source setting, with draft filtering, migration and revision restore;
> see [CMS stage 8](docs/CMS-STAGE-8.md). Stage 7 adds runtime preflight and
> verified backup/restore tools; see [CMS stage 7](docs/CMS-STAGE-7.md) for actual
> validation results and release requirements. A lockfile is present and the
> standard production build uses webpack.
>
> Content is also gated: capability lists, project dates and metrics are
> withheld until `docs/CONTENT-FACT-CHECK.md` is worked through.



The bilingual personal site of **Amirmahdi Najafi** — Software Developer,
AI Builder & Founder.

Next.js 15 (App Router) · TypeScript (strict) · Tailwind · Zod · Payload-ready
content layer. English and Persian, both first-class, both indexable.

---

## Quick start

```bash
# 1. install
npm install

# 2. fonts — download the four woff2 files listed in public/fonts/README.md
#    and drop them into public/fonts/  (the build fails without them)

# 3. environment
cp .env.example .env
#    set NEXT_PUBLIC_SITE_URL at minimum

# 4. run
npm run dev          # http://localhost:3000 → redirects to /en or /fa
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build using webpack |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint flat config (`eslint .` — `next lint` was removed in Next 16) |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright, desktop + mobile |
| `npm run audit:deps` | `npm audit` on production dependencies |

---

## Structure

```
src/
  app/
    layout.tsx              root <html>, fonts, theme bootstrap
    [locale]/               every page, en + fa
      page.tsx              home
      about | services | contact
      projects/             index + [slug] case studies
      blog/                 index + [slug] articles
    api/contact             validated, rate-limited form endpoint
    api/og                  dynamic branded OG images
    sitemap.ts robots.ts    generated, drafts excluded
  components/
    ui/                     Container, Section, ButtonLink, Breadcrumbs, JsonLd
    shell/                  Navigation, Footer, ThemeToggle, LanguageSwitcher,
                            CommandPalette, SkipLink
    home/                   Hero + HeroField (canvas) + all homepage sections
    project/                ProjectCard, ProjectMotif, case-study primitives
  content/                  site, projects, posts, services — typed, bilingual
  i18n/                     locale config, dictionaries, path switching
  lib/                      seo, jsonld, github, rate-limit, validation, utils
  middleware.ts             locale negotiation + per-request CSP nonce
payload/                    CMS collections for phase 2 (see docs/CMS.md)
docs/                       deployment, SEO, security, performance, post-deploy
tests/                      unit (vitest) + e2e (playwright)
```

### Where content lives

Everything editable is in `src/content/*.ts` — typed, bilingual, checked at
build time. `src/lib/content-source.ts` is the single seam between the UI and
the content store, so moving to Payload changes one file, not the site.

**Content rules encoded in the types and enforced by review:**

- No metric without evidence. `metrics` renders 2–5 entries and hides itself
  below two. Delete a number you cannot defend; do not estimate it.
- Empty social URLs render nothing. There are no dead icons.
- Project capabilities carry an explicit state: implemented, in development,
  or planned. Roadmap items are never shown as shipped.
- Drafts are excluded from listings, sitemap and indexing.

---

## Design system

The visual language is called **Precision Technology**: hairline rules instead
of card shadows, a 2–8px radius scale rather than pills, one accent, and
substrate geometry that carries information rather than decoration.

Tokens live in `src/app/globals.css` as CSS variables — colour, spacing, type
scale, radii, motion durations and easings. Dark and light are designed
separately; light is not an inversion, and its accent is darkened to `#0071A0`
so text and icons clear WCAG AA on `#F7F9FB`.

Each project case study overrides the accent, background, surface and glow
tokens locally through `projectVars()`, so PAD reads as PAD and Melamin Layegh
reads as a manufacturer's site, while the navigation, typography, footer and
interaction language stay identical.

---

## Documentation

| Document | Contents |
| --- | --- |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Build, environment, DNS, HTTPS, backup |
| [docs/CMS.md](docs/CMS.md) | Content editing today; Payload migration |
| [docs/SEO-CHECKLIST.md](docs/SEO-CHECKLIST.md) | What is implemented and how to verify it |
| [docs/SECURITY.md](docs/SECURITY.md) | Headers, CSP, form defences, admin, test checklist |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md) | Budgets, what was optimised, how to measure |
| [docs/POST-DEPLOY.md](docs/POST-DEPLOY.md) | Ordered checklist for launch day |
| [public/fonts/README.md](public/fonts/README.md) | Font sources and licences |

---

## Licence

Source is private. Fonts are SIL OFL 1.1 and are not committed to the
repository — see `public/fonts/README.md`.


## Documentation index

| File | Read it when |
| --- | --- |
| `docs/VERIFICATION.md` | **First.** What has and has not been run |
| `docs/CONTENT-FACT-CHECK.md` | **Before launch.** Every claim needing your sign-off |
| `docs/UPGRADE-2026-09.md` | Understanding what the audit changed and why |
| `docs/DEPLOYMENT.md` | Deploying, Nginx, DNS, certificates, HSTS staging |
| `docs/SECURITY.md` | Headers, CSP, contact-form defences, pre-launch tests |
| `docs/SEO-CHECKLIST.md` | Canonicals, hreflang, structured data, indexing |
| `docs/PERFORMANCE.md` | Budgets and what was deliberately not done |
| `docs/POST-DEPLOY.md` | Launch day, in order |
| `docs/CMS.md` | Content editing today, Payload migration later |
