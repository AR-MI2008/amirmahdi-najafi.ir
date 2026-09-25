# Verification status

**This repository is NOT verified production-ready.** Two things block that
claim, and neither can be resolved from where this work was done.

## What could not be run, and why

The environment this audit was performed in has **no network access**. That
makes the following impossible here, not merely unrun:

| Command | Status |
| --- | --- |
| `npm install` | **Not run** — no registry access |
| `npm run build` | **Not run** — requires installed dependencies |
| `npm run typecheck` | **Not run** — `tsc` needs `next`, `react`, `zod` type packages |
| `npm run lint` | **Not run** — needs `eslint` and `eslint-config-next` |
| `npm run test` | **Partially run** — see below |
| `npm run test:e2e` | **Not run** — needs a built app and browser binaries |
| `npm audit` | **Not run** — no registry access |

`package-lock.json` also **could not be generated**. Producing one requires
resolving the dependency graph against the registry.

Anyone reading a report that says these "should pass" should distrust it.
They have not been run.

## What WAS actually run

### 1. TypeScript parse check — PASS

Every `.ts`, `.tsx` and `.mjs` file in the repository (84 files) parsed with
zero syntax errors, using the TypeScript compiler's parser directly.

This is **not** a type check. It catches syntax and structural errors. It does
not catch a wrong type, a missing property, or a bad import.

### 2. Unit tests — 77 passed, 0 failed

Eight of the fourteen unit test files have no dependency on `zod`,
`next/server`, a DOM, or vitest's mocking utilities. Those were transpiled with the local TypeScript
compiler and executed under Node against a minimal `describe`/`it`/`expect`
shim. These are real results:

```
tests/unit/i18n.test.ts              5 passed
tests/unit/project-theme.test.ts    17 passed
tests/unit/content-honesty.test.ts  11 passed
tests/unit/assets.test.ts            9 passed
tests/unit/seo.test.ts               5 passed
tests/unit/sitemap.test.ts           5 passed
tests/unit/turnstile-verify.test.ts 18 passed
tests/unit/turnstile-flow.test.ts    7 passed
─────────────────────────────────────────────
                                    77 passed, 0 failed
```

The 18 Turnstile verification tests are meaningful offline because
`verifyTurnstileToken` takes an injectable `fetchImpl`, so the Siteverify
request body is asserted directly — including the proof that no `remoteip`
field is sent and that the rate-limit hash never reaches Cloudflare.

One genuine bug was caught this way and fixed: PAD's light-mode background was
byte-identical to its dark-mode foreground, which the "designed, not inverted"
assertion rejected.

Not run: `validation.test.ts` (needs zod), `env.test.ts` (zod + module
mocking), `rate-limit.test.ts` (fake timers), `contact-api.test.ts`
(`next/server`, `vi.stubGlobal`), `locale.test.ts` (imports `src/proxy.ts`,
which imports `next/server`), and `turnstile-widget.test.tsx` (needs jsdom and
`@testing-library/react`, neither installable offline).

**`turnstile-widget.test.tsx` has not been executed.** It is the regression
test for the widget-reset bug and it covers the retry path end to end against
a stubbed Cloudflare API — but it needs three devDependencies that are not
present here. Treat it as unverified until `npm test` runs. The pure decision
it depends on, `shouldResetWidget`, IS covered by the 7 tests above, which did
run.

### 3. Contrast calculation — PASS

All ten project palettes (five projects x two themes) were computed against
WCAG 2.1 relative luminance. Text colours clear 4.5:1 against both background
and surface; decorative accents clear 3:1. Two values were changed to make
this true — both are recorded in `UPGRADE-2026-09.md`.

### 4. Icon generation — PASS

Six icon files generated and re-opened to confirm dimensions and colour mode.
The 512px output was inspected visually.

## Run this first, on a networked machine

```bash
npm install                 # also produces package-lock.json — commit it
npm run typecheck
npm run lint
npm run test                # all 11 unit files, including the 5 skipped here
npm run build
npx playwright install --with-deps
npm run test:e2e
npm audit --omit=dev
```

`npm run verify` chains typecheck, lint, test and build.

### Expect the type check to find things

The parse check cannot see type errors, and roughly 25 files were edited
during this pass — content model changes, an async content layer, renamed
props. The most likely failure sites:

- **`sections.tsx`, `about/page.tsx`, `services/page.tsx`** — components
  converted from sync to `async`. If any is rendered from a client component,
  TypeScript will say so.
- **`project.year` → `projectDate()`** — any remaining reader of the removed
  field.
- **`ProjectTheme.accent` → `theme.dark.accent`** — same.
- **`CapabilityState`** now has a fourth member; any exhaustive switch or
  `Record` keyed on it needs the new case.
- **`dict.project.year` → `dict.project.date`** — the dictionaries are in
  parity (118 keys each, verified), but the generated dictionary type may need
  a rebuild.
- **`next/font/local`** — the build fails without the three woff2 files in
  `public/fonts/`. That is by design; see `public/fonts/README.md`.

These are ordinary migration fallout, expected to be small and mechanical.
They are listed so nobody is surprised by them.

## Blocking before launch

1. Run everything above and fix what it finds.
2. Commit `package-lock.json`.
3. Work through `docs/CONTENT-FACT-CHECK.md`. Until then the site publishes no
   capability list, no project date and no metric — accurate, but thin.
4. Add the three font files.
5. Walk `docs/POST-DEPLOY.md`.
