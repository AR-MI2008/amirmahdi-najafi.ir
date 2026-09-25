/**
 * Server-side Turnstile verification.
 *
 * Kept out of the route handler so the validation rules can be tested
 * directly, and so the rules are visible in one place rather than inline in a
 * request pipeline.
 */

/** Only the fields we actually validate. Cloudflare returns more. */
export type SiteverifyResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
};

// Shared with the client component so the two cannot drift apart.
export { TURNSTILE_ACTION } from './turnstile-flow';
import { TURNSTILE_ACTION } from './turnstile-flow';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Parses TURNSTILE_ALLOWED_HOSTNAMES.
 *
 * Server-side configuration on purpose. The request Host header is
 * attacker-controlled, so using it to decide which hostnames are acceptable
 * would make the check decorative: anyone replaying a token from another
 * origin could simply send a matching Host.
 */
export function allowedHostnames(raw = process.env.TURNSTILE_ALLOWED_HOSTNAMES): string[] {
  return (raw ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h.length > 0);
}

export type VerificationOutcome =
  | { ok: true }
  | { ok: false; reason: 'no-token' | 'request-failed' | 'rejected' | 'wrong-action' | 'wrong-hostname' | 'misconfigured' };

/**
 * `success: true` alone is not enough.
 *
 * A token is issued for a specific sitekey, and a sitekey can be served on
 * more than one hostname and used by more than one widget. Checking only
 * `success` means a token solved on a staging deployment, or on a different
 * form using the same sitekey, is accepted here. Binding the result to the
 * expected action AND an explicitly configured hostname closes both.
 *
 * remoteip is deliberately NOT sent. The field means the visitor's real IP,
 * and this application never handles one: the only client identifier it has
 * is a salted hash used for rate limiting. Sending that hash would be sending
 * a value that is not an IP address in a field documented to contain one —
 * meaningless at best, and misleading to anyone reading Cloudflare's logs.
 * The field is optional, so it is omitted.
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  options: { secret?: string; hostnames?: string[]; fetchImpl?: typeof fetch } = {},
): Promise<VerificationOutcome> {
  const secret = options.secret ?? process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // Turnstile disabled.

  if (!token) return { ok: false, reason: 'no-token' };

  const hostnames = options.hostnames ?? allowedHostnames();
  if (hostnames.length === 0) {
    // Env validation should have prevented this. Fail closed rather than
    // silently accepting any hostname.
    console.error('[turnstile] no allowed hostnames configured; rejecting');
    return { ok: false, reason: 'misconfigured' };
  }

  const doFetch = options.fetchImpl ?? fetch;

  let data: SiteverifyResponse;
  try {
    const res = await doFetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No remoteip. See the note above.
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(4000),
    });
    data = (await res.json()) as SiteverifyResponse;
  } catch {
    // Never log the token or the secret.
    console.error('[turnstile] siteverify unreachable');
    return { ok: false, reason: 'request-failed' };
  }

  if (data.success !== true) {
    // Error codes are Cloudflare diagnostics, not visitor data — safe to log,
    // never returned to the browser.
    console.error(`[turnstile] rejected: ${(data['error-codes'] ?? []).join(',') || 'unknown'}`);
    return { ok: false, reason: 'rejected' };
  }

  if (data.action !== TURNSTILE_ACTION) {
    console.error(`[turnstile] unexpected action: ${String(data.action)}`);
    return { ok: false, reason: 'wrong-action' };
  }

  const hostname = (data.hostname ?? '').toLowerCase();
  if (!hostnames.includes(hostname)) {
    console.error(`[turnstile] hostname not allowed: ${hostname || 'absent'}`);
    return { ok: false, reason: 'wrong-hostname' };
  }

  return { ok: true };
}
