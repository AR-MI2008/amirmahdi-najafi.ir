# Deployment

Target: any Node.js 22.13+ host that can run `next start` — a VPS with Nginx in
front, or a managed Node platform. Nothing in the build is provider-specific.

## 1. Build

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm run start        # listens on :3000
```

The build fails if the font files are missing. That is intentional — a missing
self-hosted font would silently fall back to a system face and change every
page's metrics.

## 2. Environment

Copy `.env.example` to a protected environment file and fill it. Production
requires a site URL and a random `RATE_LIMIT_PEPPER`. Without a mail provider,
the contact endpoint returns 503 instead of claiming delivery.

For CMS initialization, trusted proxy setup, preflight and verified SQLite
backup/restore, follow [CMS stage 7](CMS-STAGE-7.md). The standard build uses
webpack; `npm run build:turbopack` is an optional diagnostic path.

Never prefix a secret with `NEXT_PUBLIC_`. Anything with that prefix is
compiled into the browser bundle.

## 3. Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name amirmahdi-najafi.ir;

  ssl_certificate     /etc/letsencrypt/live/amirmahdi-najafi.ir/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/amirmahdi-najafi.ir/privkey.pem;

  client_max_body_size 1m;

  location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   Upgrade           $http_upgrade;
    proxy_set_header   Connection        "upgrade";
  }
}

# www → apex, and http → https. One canonical host: the apex.
server {
  listen 80;
  listen 443 ssl http2;
  server_name www.amirmahdi-najafi.ir;
  ssl_certificate     /etc/letsencrypt/live/amirmahdi-najafi.ir/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/amirmahdi-najafi.ir/privkey.pem;
  return 301 https://amirmahdi-najafi.ir$request_uri;
}

server {
  listen 80;
  server_name amirmahdi-najafi.ir;
  return 301 https://amirmahdi-najafi.ir$request_uri;
}
```

`X-Forwarded-For` matters: the contact form's rate limiter reads it. Without
it every visitor shares one bucket.

## 4. DNS

| Record | Name | Value |
| --- | --- | --- |
| A | `@` | server IPv4 |
| AAAA | `@` | server IPv6, if available |
| CNAME | `www` | `amirmahdi-najafi.ir.` |

Certificates cover both names:

```bash
certbot --nginx -d amirmahdi-najafi.ir -d www.amirmahdi-najafi.ir
```

## 5. HSTS

`Strict-Transport-Security` is set in `next.config.mjs` with
`includeSubDomains`. Before the first deploy, confirm that **every** subdomain
you will ever use on this domain serves HTTPS. If any does not, remove
`includeSubDomains` first — the directive is cached by browsers for two years
and cannot be recalled.

Do not add `preload` unless you have read what it commits you to. It is a
hardcoded browser list and removal takes months.

## 6. Process management

```ini
# /etc/systemd/system/amirmahdi.service
[Unit]
Description=amirmahdi-najafi.ir
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/amirmahdi
EnvironmentFile=/srv/amirmahdi/.env
ExecStart=/usr/bin/node node_modules/.bin/next start -p 3000
Restart=always
User=www-data
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/srv/amirmahdi/.next

[Install]
WantedBy=multi-user.target
```

## 7. Backup

Until Payload is introduced, content is in Git — the repository *is* the
content backup. Once the database exists:

```bash
# nightly, retain 14 days
pg_dump "$DATABASE_URL" | gzip > /var/backups/amirmahdi-$(date +%F).sql.gz
find /var/backups -name 'amirmahdi-*.sql.gz' -mtime +14 -delete

# media
rsync -a --delete /srv/amirmahdi/media/ /var/backups/media/
```

Restore:

```bash
gunzip -c /var/backups/amirmahdi-YYYY-MM-DD.sql.gz | psql "$DATABASE_URL"
rsync -a /var/backups/media/ /srv/amirmahdi/media/
```

A backup you have not restored from is not a backup. Restore into a scratch
database once, write down how long it took, and put a reminder in the calendar
to repeat it every quarter.


## HSTS — when includeSubDomains may be enabled

The default header is deliberately conservative:

```
Strict-Transport-Security: max-age=31536000
```

Apex only, one year, no `includeSubDomains`, no `preload`. Both are opt-in
environment flags (`HSTS_INCLUDE_SUBDOMAINS`, `HSTS_PRELOAD`), and
`src/lib/env.ts` refuses to boot if `preload` is set without
`includeSubDomains`.

### Why the caution

`includeSubDomains` tells every browser that has seen the header that **every**
subdomain of `amirmahdi-najafi.ir` — including ones that do not exist yet —
must be HTTPS, for the full `max-age`. Removing the header later does not undo
it. A browser that saw it once keeps enforcing until the timer expires, and
there is no way to reach that browser and tell it otherwise.

The realistic ways this hurts:

- A mail or webmail interface on `mail.` without a valid certificate.
- A hosting or cPanel panel on a subdomain over plain HTTP.
- A staging or device subdomain reachable only on a local network.
- Any subdomain whose certificate lapses — with HSTS the browser shows a
  bypass-proof error rather than a warning.

### Checklist before setting `HSTS_INCLUDE_SUBDOMAINS=true`

1. List every DNS record for the zone. Every single one.
   ```bash
   dig +short any amirmahdi-najafi.ir
   ```
2. For each host, confirm HTTPS with a valid, auto-renewing certificate:
   ```bash
   for host in www mail panel; do
     echo "--- $host"
     curl -sSI "https://$host.amirmahdi-najafi.ir" | head -1
   done
   ```
3. Confirm certificate renewal is automated and tested for all of them, not
   just the apex.
4. Decide that no future subdomain will need plain HTTP. This is the part that
   is easy to get wrong, because it is a prediction, not a check.
5. Only then set `HSTS_INCLUDE_SUBDOMAINS=true` and redeploy.

Consider raising `max-age` in stages — 300, then 86400, then a week — watching
for breakage before committing to a year. A short `max-age` is cheap to
recover from; a year is not.

### Preload

`HSTS_PRELOAD=true` is a further step and should be treated as permanent.
Removal from the preload list takes months to propagate through browser
releases. Do not enable it unless the domain will be HTTPS-only indefinitely,
and only after a successful submission at https://hstspreload.org.
