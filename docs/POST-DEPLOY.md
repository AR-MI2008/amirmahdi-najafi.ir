# Post-deployment checklist

In order. Each step assumes the one above it passed.

## 1. The site is actually up

- [ ] `https://amirmahdi-najafi.ir` loads and redirects to `/en` or `/fa`
- [ ] `http://` → 301 → `https://`
- [ ] `https://www.` → 301 → apex
- [ ] `/en`, `/fa`, all five case studies, both blog articles, about, services,
      contact all return 200 in both languages
- [ ] `/en/nonsense` returns a real 404, not a 200 with a 404 page
- [ ] `/sitemap.xml` and `/robots.txt` return valid content

## 2. Bilingual correctness

- [ ] `<html lang="fa" dir="rtl">` on Persian pages, `lang="en" dir="ltr"` on English
- [ ] Persian text renders in Vazirmatn, not a system fallback
- [ ] Switching language from a case study lands on the same case study
- [ ] Persian pages reviewed on a phone specifically — RTL layouts break in
      places LTR ones do not (icon direction, borders, breadcrumb separators)

## 3. Appearance

- [ ] Light mode reviewed on every page type, not just the home page
- [ ] No theme flash on first load, hard refresh, or with a cold cache
- [ ] Checked at 320, 375, 430, 768, 1024, 1440 and 1920 px wide
- [ ] No horizontal overflow at any of those widths, in either language
- [ ] With `prefers-reduced-motion: reduce` set at the OS level: the canvas
      does not run, reveals are instant, and nothing is missing

## 4. Accessibility

- [ ] Tab through the home page: skip link appears first, focus is always
      visible, order matches reading order
- [ ] Command palette: opens with the keyboard, traps focus, closes on Escape,
      returns focus to whatever was focused before
- [ ] Contact form: every input has a label, errors are announced, the success
      message uses `role="status"`
- [ ] Contrast checked in both themes — the light accent is `#0071A0`
      specifically to pass here
- [ ] Pinch-zoom works on mobile

## 5. Email

- [ ] Submit the form for real; the email arrives
- [ ] Reply-to is the sender's address
- [ ] Check the spam folder — if it landed there, fix SPF and DKIM on the
      sending domain before launch
- [ ] Submit with the honeypot filled; nothing arrives, no error shown

## 6. Security

Run the checklist in `docs/SECURITY.md`, then:

- [ ] https://securityheaders.com — review every finding, do not chase a grade
- [ ] https://www.ssllabs.com/ssltest/
- [ ] Browser console shows zero CSP violations on every page type

## 7. Search Console and Bing

These require account access and domain verification — they cannot be
configured from the codebase.

1. https://search.google.com/search-console → add a **Domain** property for
   `amirmahdi-najafi.ir`
2. Verify with the DNS TXT record it gives you
3. Submit `https://amirmahdi-najafi.ir/sitemap.xml`
4. Use URL Inspection on `/en` and `/fa` → *Request indexing*
5. Set international targeting: nothing to do — hreflang handles it. Do not
   set a country target; that would work against the Persian pages
6. https://www.bing.com/webmasters → import from Search Console, or verify
   separately and submit the same sitemap

Indexing takes days to weeks. Do not resubmit repeatedly; it does not help.

## 8. First week

- [ ] Search Console → Coverage: confirm both language trees are indexed and
      nothing is marked "Alternate page with proper canonical tag"
- [ ] Search Console → Core Web Vitals: check once real traffic exists
- [ ] Confirm the GitHub section still renders (the unauthenticated API limit
      is 60 requests/hour; add `GITHUB_TOKEN` if it disappears)
- [ ] Verify the nightly database backup ran, and restore one into a scratch
      database to prove it works
