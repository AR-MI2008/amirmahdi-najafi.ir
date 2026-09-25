# Audit and hardening pass — September 2026

What changed, why, and what still needs a human. Read `VERIFICATION.md` for
what was and was not executed.

## 1. Dependencies

| Package | Was | Now |
| --- | --- | --- |
| next | 15.3.2 | **16.3.4** |
| react / react-dom | 19.1.0 | **19.2.8** |
| eslint-config-next | 15.3.2 | 16.3.4 |

Next 16.3.x is the Active LTS line. 16.3.3 carried the August 2026 security
release covering two critical-severity advisories; 16.3.4 is the current patch
on top of it. React 19.2.8 is the current patch on the 19.2 line, which
includes the Server Components fixes from the 2026 advisory cluster.

`zod` stays on 3.24.1 deliberately. Zod 4 is a breaking major (`z.string().email()`
→ `z.email()`, a reworked error API) and this pass had no way to run its test
suite. Bump it as its own change, with tests running.

### Migration work this forced

- **`middleware.ts` → `proxy.ts`**, default export renamed to `proxy`. Next 16
  renamed the convention; `middleware.ts` still works but is deprecated.
- **`next lint` removed.** Now `eslint .` against a flat `eslint.config.mjs`
  built on `eslint-config-next/core-web-vitals`. `next build` no longer lints,
  so lint is a separate step in `npm run verify`.
- **`images.domains` → `images.remotePatterns`** (empty; nothing remote renders).
- The `eslint` key in `next.config.mjs` was removed in 16 — this project never
  set it.

## 2. Root locale redirect

`next.config.mjs` redirected `/` → `/en` while the middleware negotiated
`Accept-Language` on the same URL. The config layer won, so negotiation was
dead code and a Persian browser always landed on English.

`/` is now handled only in `proxy.ts`: 307 (never 308 — the target varies by
request), with `Vary: Accept-Language`. Everything else keeps its explicit
locale, so `/en/*` and `/fa/*` are never overridden and both trees stay
crawlable. Covered by `tests/e2e/locale-routing.spec.ts`.

Malformed locales (`/de`, `/xx`, `/en-US`) now 404 rather than rendering with
a broken dictionary, via `dynamicParams = false` plus a `notFound()` guard.

## 3. HSTS

Was `max-age=63072000; includeSubDomains` — shipped on day one, contradicting
this repo's own deployment notes.

Now `max-age=31536000`, apex only. `HSTS_INCLUDE_SUBDOMAINS` and `HSTS_PRELOAD`
are environment flags, both off, and env validation rejects `preload` without
`includeSubDomains`. The reason lives next to the code: `includeSubDomains` is
irreversible for the full max-age in any browser that has already seen it.

## 4. Project themes

`ProjectTheme` had an `accentLight` that `projectVars()` never read, and heroes
forced a dark project background while foreground colours came from the global
theme. In light mode that produced dark text on a dark panel.

Each project now defines complete `dark` and `light` palettes — background,
surface, accent, accentSecondary, foreground, muted. Inline styles cannot
respond to `[data-theme]`, so both palettes are emitted as raw custom
properties and mapped in `globals.css` under `.project-scope`.

Contrast is asserted, not eyeballed (`tests/unit/project-theme.test.ts`): 4.5:1
for text colours against both background and surface, 3:1 for the decorative
accent. Two palettes moved to pass:

- Melamin dark accent `#b4703a` → `#d08a4e` (was 4.27:1 on surface).
- PAD light background `#eef6fa` → `#ecf4f9`. The first value was identical to
  PAD's dark foreground — the test for "designed, not inverted" caught it.

## 5-7. Content honesty

- **Capabilities.** All 30 are now `state: 'unverified'` and cannot render.
  `docs/CONTENT-FACT-CHECK.md` records each one with its originally claimed
  state so nothing is lost.
- **Dates.** `year` (a guess) is gone. Optional `startDate` / `endDate` /
  `displayDate` exist and are all absent, so no date reaches the page,
  metadata, JSON-LD or the sitemap.
- **Metrics.** Emptied. "5 products shipped and running" contradicted two
  projects marked prototype and in-development on their own pages.

## 8. Icons

`favicon.ico`, `apple-touch-icon.png`, `icon-192.png` and `icon-512.png` were
declared and did not exist. All are now generated from the AN monogram, plus
`icon-maskable-512.png` with an 80% safe zone so Android does not crop the
glyph. `tests/unit/assets.test.ts` fails if a declared asset goes missing.

## 9. CMS architecture

Approach **B**: typed content for launch, with a real abstraction.

`src/lib/content-source.ts` is now the only module permitted to import
`src/content`, enforced by a `no-restricted-imports` rule in
`eslint.config.mjs`. Twenty-one files that reached past it were rewired.

Payload is documented as **not installed and not running**. No Payload package
appears in `package.json`, so no unused production dependency ships.

`getSiteConfig()` is deliberately synchronous and deliberately not CMS content:
it is read during `generateMetadata` and in `sitemap.ts`, before any async
boundary, and one typo in an admin field should not be able to break every
canonical URL.

## 10. Contact delivery

The endpoint returned `{ ok: true }` when no mail provider was configured — a
visitor saw "thanks, I'll be in touch" for a message that was discarded.

Production now cannot reach that state: env validation refuses to boot without
`EMAIL_API_KEY` and `EMAIL_FROM`, and if the branch is reached anyway the
endpoint returns 503. Development logs the intended recipient and returns
`{ ok: true, delivered: false }` so the UI can tell the truth.

## 11. Turnstile

The backend verified tokens the frontend never produced. Setting only
`TURNSTILE_SECRET_KEY` would have made every submission fail with a generic
error nobody could diagnose.

The feature is now complete: a client widget using explicit rendering (implicit
mode races hydration), a labelled accessible container, token passed to the
API, single-use token cleared after each attempt, submit disabled with an
explanation while no token exists, and a graceful message pointing at Telegram
or email if the widget cannot load. CSP adds the Cloudflare origin only when
the site key is set. Env validation rejects a half-configured pair at boot.

## 12. Rate limiting

The in-memory `Map` is documented as valid for exactly one long-lived Node
process, with the failure mode spelled out: across instances or on serverless
it does not error, it just quietly stops limiting.

There is now a `RateLimiter` interface with two adapters — `MemoryLimiter` and
`RedisLimiter` over an Upstash-compatible REST API (no driver, no connection
pool, no new dependency). Redis is selected automatically when both env vars
are present. It fails open, which is the right trade for a contact form and
the wrong one for auth — noted in the code.

No raw IP is stored, logged or transmitted anywhere; the key is a truncated
SHA-256 of `ip:pepper`, and the pepper is required in production.

## 13. Sitemap

`lastModified: new Date()` on every static page and project claimed the whole
site changed on each build. It is now omitted wherever no real timestamp
exists. Articles keep their genuine `publishedAt`/`updatedAt`.

## 15-16. Structured data

`sameAs` on `Person` is GitHub only. Telegram was removed: a username is not
identity evidence and a wrong `sameAs` edge is worse than none. It remains a
contact link.

Project `sameAs` no longer takes the first arbitrary HTTP link. It comes from
an explicit `canonicalUrl`, set on three of five projects. HyperNet and Arc
Core have no URL that represents them, so they emit none.

## 17. Environment validation

`src/lib/env.ts` replaces the unused `envSchema`. It runs at server start via
`src/instrumentation.ts`, reports every problem at once, and distinguishes
genuinely required configuration from optional services. `publicEnv` exposes
exactly one value — the Turnstile site key, which Cloudflare publishes in the
HTML by design. No secret carries a `NEXT_PUBLIC_` prefix.
