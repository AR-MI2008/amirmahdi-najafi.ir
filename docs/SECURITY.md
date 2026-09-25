# Security notes

No claim of being "secure" is made here. What follows is what is implemented,
what it defends against, and what is deliberately left out.

## Headers

Set in `next.config.mjs` for every response:

| Header | Value | Why |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | Stops MIME confusion on uploads and API responses |
| `X-Frame-Options` | `DENY` | Legacy clickjacking defence alongside CSP `frame-ancestors` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full URLs never leak to third parties |
| `Permissions-Policy` | camera, mic, geolocation, payment, USB all denied | The site needs none of them |
| `Strict-Transport-Security` | `max-age=31536000` (apex only by default) | `includeSubDomains` and `preload` are opt-in env flags — see DEPLOYMENT.md |

## Content Security Policy

Built per request in `src/proxy.ts` so it can carry a nonce.

```
default-src 'self'
script-src   'self' 'nonce-…' 'strict-dynamic'
style-src    'self' 'unsafe-inline'
img-src      'self' data: blob: https://avatars.githubusercontent.com
font-src     'self'
connect-src  'self' https://api.github.com
frame-src    'self' https://challenges.cloudflare.com
object-src   'none'
base-uri     'self'
form-action  'self'
frame-ancestors 'none'
```

Notes, because copied CSP snippets are how people end up with a policy that
allows everything:

- **No `unsafe-eval` in production.** It is added only in development, where
  React Refresh requires it.
- **`unsafe-inline` on styles only.** Next.js injects critical CSS as inline
  `<style>` during streaming; there is no nonce-based path for that today.
  Scripts do not get the same exemption.
- **One inline script exists** — the theme bootstrap in
  `components/shell/theme-script.tsx`. It runs under the nonce. It exists
  because reading the theme after hydration causes a visible flash.
- **No third-party origins on the critical path.** Fonts are self-hosted,
  icons are inline SVG. That is a network-resilience decision first, but it
  also means `connect-src` and `font-src` stay narrow.
- Remove `frame-src` for Turnstile if you never enable it.

## Contact form

Layered, because any single control fails.

| Control | Implementation |
| --- | --- |
| Schema validation | Zod, server-side. Client validation is a convenience, not a control |
| Header injection | Single-line fields reject `\r` and `\n` outright |
| Length limits | Enforced in the schema and by a `Content-Length` check before parsing |
| Oversized payload | Rejected at 16 KB before `request.json()` |
| Rate limit | 5 submissions per 10 minutes per hashed client key. In-memory by default (single process only); Redis adapter available — see the note below |
| Honeypot | Off-screen `website` field; a filled value returns success and sends nothing |
| Timing | Submissions under 3 seconds after render are treated as automated |
| Turnstile | Optional and complete: client widget, server verification, single-use tokens with widget reset on retry. Validated on `success` AND `action` AND an explicit hostname allowlist. Env validation rejects a partial configuration at boot |
| Output escaping | Every value is HTML-escaped before it reaches the email body |
| Error messages | One generic `{ ok: false }` on every failure path |
| Method handling | `GET` returns 405 with `Allow: POST`; wrong content type returns 415 |

The response never distinguishes "invalid email format" from "delivery
failed", and never confirms whether an address exists.

**Delivery is never faked.** With no mail provider configured, production
returns 503 rather than a success the visitor cannot verify — and
`src/lib/env.ts` prevents the server starting in that state at all.

### Turnstile verification

`success: true` is not sufficient on its own, and the server no longer treats
it as such. A token is issued against a sitekey, and one sitekey can serve
several hostnames and several widgets, so `success` alone would accept a token
solved on a staging deployment or on a different form. Three conditions must
all hold:

| Condition | Source |
| --- | --- |
| `success === true` | Siteverify |
| `action === 'contact'` | matches the action the widget is rendered with |
| `hostname` in the allowlist | `TURNSTILE_ALLOWED_HOSTNAMES`, server-side only |

The allowlist is configuration, never the request `Host` header — that header
is attacker-controlled, so deriving the allowlist from it would make the check
decorative. Verification fails closed when the allowlist is empty, and env
validation refuses to start with Turnstile enabled and no allowlist. A loopback
entry (`localhost`, `127.0.0.1`, `::1`) is rejected in production.

**No `remoteip` is sent.** That field means the visitor's real IP address, and
this application never holds one — the only client identifier it has is a
salted hash used for rate limiting. Sending that hash would put a non-IP value
in a field documented to contain an IP: useless to Cloudflare and misleading to
anyone reading its logs. The field is optional, so it is omitted rather than
populated with something untrue, and no raw IP is introduced to fill it.

Cloudflare `error-codes` are logged server-side and never returned to the
browser, which sees the same generic `{ ok: false }` as every other rejection.
The secret, the token and the visitor's IP are never logged.

**The in-memory limiter is single-process only.** Behind two instances or on
serverless it stops limiting without erroring. Set
`RATE_LIMIT_REDIS_REST_URL` and `RATE_LIMIT_REDIS_REST_TOKEN` before scaling
beyond one process. Raw IPs are never stored: the key is a truncated SHA-256
of `ip:pepper`, and `RATE_LIMIT_PEPPER` is required in production.

## Privacy of request data

Client IPs are never stored. The rate limiter's key is a SHA-256 of the IP
with a server-side pepper, truncated, and it lives in memory with a ten-minute
window. There is no persistent record of who submitted what beyond the email
that reaches the inbox.

## Admin

There is no admin surface until Payload is introduced. When it is:

- Authentication is Payload's, with an 8-hour token, 5 failed attempts before
  a 15-minute lock, and `HttpOnly` + `Secure` + `SameSite=Lax` cookies.
- Every collection declares server-side `access` functions. Client-side role
  checks are not a control and are not used.
- Public reads are filtered to published documents at the access layer, so an
  unauthenticated request cannot retrieve a draft even by guessing an ID.
- **The admin path is not renamed.** Obscurity is not access control, and a
  renamed path creates the illusion of protection.
- The architecture is MFA-ready: Payload supports adding a second factor to
  the users collection without touching the rest of the app.

## Uploads

`payload/collections/media.ts` restricts MIME types to images, caps file size
at 5 MB, rewrites filenames to a safe character set, and neutralises
executable extensions. SVG is allowed for logos — if untrusted people ever get
upload access, remove SVG or sanitise it, because SVG can carry script.

## Dependencies

Four production dependencies: `next`, `react`, `react-dom`, `zod`. No
animation library, no icon package, no utility grab-bag — motion is CSS and
one small canvas, icons are inline SVG. Fewer packages is a security position,
not just a bundle-size one.

```bash
npm run audit:deps
npm outdated
```

## Pre-launch test checklist

Test the application only. Never point these at systems you do not own.

- [ ] Submit `<script>alert(1)</script>` in every field; confirm the received
      email shows escaped text and no page renders it
- [ ] Submit `Subject\r\nBcc: attacker@example.com`; confirm rejection (unit
      test `validation.test.ts` covers this — verify it end to end too)
- [ ] Submit 6 times in 10 minutes; confirm 429 with `Retry-After`
- [ ] `GET /api/contact` → 405
- [ ] `POST /api/contact` with `text/plain` → 415
- [ ] `POST /api/contact` with a 1 MB body → 413
- [ ] Fill the honeypot; confirm 200 and no email
- [ ] Check headers: `curl -sI https://amirmahdi-najafi.ir | sort`
- [ ] Open the console on every page type; confirm zero CSP violations
- [ ] `curl -I http://amirmahdi-najafi.ir` → 301 to HTTPS
- [ ] `curl -I https://www.amirmahdi-najafi.ir` → 301 to apex
- [ ] Search the built bundle for secrets:
      `grep -ril "sk_\|secret\|password" .next/static | head`
- [ ] Confirm `productionBrowserSourceMaps` is false and no `.map` files are
      served from `/_next/static`
- [ ] Trigger an error and confirm no stack trace reaches the browser
