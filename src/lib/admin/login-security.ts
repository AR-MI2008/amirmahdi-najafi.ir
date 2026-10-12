import 'server-only';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { getAdminDatabase } from './database';

export function loginKey(h: Headers): string {
  const ip = h.get('x-real-ip');
  // The proxy must overwrite this header and prevent direct upstream access.
  if (process.env.ADMIN_TRUST_PROXY !== 'true' || !ip || !isIP(ip)) {
    throw new Error('Trusted admin proxy is not configured');
  }
  return createHash('sha256').update(ip).digest('hex');
}
export function isLoginBlocked(key: string): boolean {
  const row = getAdminDatabase()
    .prepare('SELECT locked_until FROM admin_login_attempts WHERE client_key_hash=?')
    .get(key) as { locked_until: number } | undefined;
  return Boolean(row && row.locked_until > Math.floor(Date.now() / 1000));
}
export function recordLoginFailure(key: string): void {
  const now = Math.floor(Date.now() / 1000);
  getAdminDatabase()
    .prepare(
      `INSERT INTO admin_login_attempts(client_key_hash,window_start,attempt_count,locked_until)
    VALUES (?, ?, 1, 0)
    ON CONFLICT(client_key_hash) DO UPDATE SET
      window_start=CASE WHEN ?-window_start >= 900 THEN ? ELSE window_start END,
      attempt_count=CASE WHEN ?-window_start >= 900 THEN 1 ELSE attempt_count+1 END,
      locked_until=CASE
        WHEN ?-window_start >= 900 THEN 0
        WHEN attempt_count+1 >= 5 THEN ?+900 ELSE locked_until END`,
    )
    .run(key, now, now, now, now, now, now);
}
