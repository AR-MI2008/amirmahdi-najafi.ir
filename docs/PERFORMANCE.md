# Performance

Budgets, not badges. The target is what a visitor on a mid-range Android phone
on a filtered network experiences, which is a harder problem than a Lighthouse
score and is not always the same problem.

## Budgets

| Metric | Budget |
| --- | --- |
| LCP (mobile, 4G) | < 2.0 s |
| INP | < 200 ms |
| CLS | < 0.05 |
| JS transferred, home | < 90 KB gzipped |
| JS transferred, case study | < 70 KB gzipped |
| Fonts | 3 files, self-hosted, `display: swap` |
| Third-party requests | 0 on the critical path |

## What was done

**Server Components by default.** Six client components exist in the whole
site: navigation, theme toggle, language switcher, command palette, blog
filter and contact form. Every case study, every article and the entire
homepage above the fold is server-rendered.

**No animation library.** Motion is CSS custom properties and keyframes. A
spring library would have cost more than every interaction on the site is
worth. The one exception is the hero canvas, which is 120 lines of 2D drawing.

**The hero field is lazy and polite.** Dynamically imported so the hero text
never waits on it, and it stops entirely when scrolled out of view, when the
tab is hidden, or when `prefers-reduced-motion` is set. On coarse pointers it
drops the pointer-tracking pass. No WebGL — nothing here justified a GPU
context or its battery cost.

**Inline SVG instead of images** for every project motif and icon. Zero
requests, zero decode, zero layout shift, and they inherit the accent colour.

**Self-hosted variable fonts.** Three files, subset-ready, `display: swap`,
preloaded for the two faces that appear above the fold. No font CDN — which is
a resilience requirement here, not a micro-optimisation.

**No layout shift by construction.** The hero reserves its height with
`min-height`, the substrate is a background layer, motifs have fixed aspect
ratios, and gallery images carry explicit dimensions.

**Text is never behind JavaScript.** The reveal animation starts at
`opacity: 0` in CSS and runs on load, not on an observer — content is in the
HTML and paints even if the script never arrives. Under reduced motion the
`.reveal` rule sets `opacity: 1` outright.

**Cached third-party reads.** The GitHub call revalidates hourly, times out at
4 seconds, and returns an empty array on any failure, which hides the whole
section rather than rendering an error.

## Measuring

```bash
npm run build            # read the route table: First Load JS per route
npx @next/bundle-analyzer

npx lighthouse https://amirmahdi-najafi.ir/en --preset=desktop --view
npx lighthouse https://amirmahdi-najafi.ir/fa/projects/pad-system \
  --form-factor=mobile --throttling-method=simulate --view
```

Pages worth measuring, because they exercise different work: home (canvas +
GitHub fetch), projects index (five cards), a case study (long document),
blog index (client filter), an article (code blocks), contact (form).

Field data beats lab data. Once Search Console has a month of history, use its
Core Web Vitals report over any local Lighthouse run.

## Things deliberately not done

- No service worker. The site is fast without one and a stale cache is a
  support burden.
- No smooth-scroll library. Native `scroll-behavior` only, and it is disabled
  under reduced motion.
- No scroll hijacking, no scroll snapping, no page-transition loading screen.
  A transition that delays navigation makes the site slower while looking
  faster.
- No preloading of every route on hover. Next's default prefetching is enough.
