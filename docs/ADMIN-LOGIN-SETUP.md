# Admin login: development setup

This is a **development-only authentication milestone**, not a production-ready
admin release. There is currently no persistent session revocation, no durable
login rate limiting and no 2FA. Keep the branch unmerged until these are done.

## Configure secrets outside Git

Generate a password verifier on a trusted machine (never paste the password in
a chat or commit it):

```bash
node -e "const c=require('node:crypto');const p=process.env.ADMIN_PLAIN_PASSWORD;if(!p)throw Error('Set ADMIN_PLAIN_PASSWORD');const s=c.randomBytes(16);console.log(s.toString('hex')+':'+c.scryptSync(p,s,64).toString('hex'))"
```

Set `ADMIN_PASSWORD_SCRYPT` to the resulting value, and set
`ADMIN_SESSION_SECRET` to at least 32 cryptographically random characters.
Do not commit either variable. Configure them in the server environment.

## Security status

- Login and dashboard are server-rendered and authentication is checked
  server-side on each request.
- Sessions use signed, 8-hour, HttpOnly, SameSite=Strict cookies.
- Login/logout server actions require a same-origin request.
- No content-write APIs exist yet.
- Production release requires login rate limiting, revocable sessions backed by
  SQLite, testing, and a reviewed deployment configuration.
