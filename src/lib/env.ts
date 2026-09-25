import { z } from 'zod';

/**
 * Environment validation.
 *
 * The rule: fail loudly for configuration the site genuinely cannot run
 * correctly without, stay silent about optional services, and never let a
 * half-configured feature reach a visitor.
 *
 * This is called from instrumentation.ts, so a bad production environment
 * fails at server start rather than at the moment a visitor submits a form.
 */

const isProd = () => process.env.NODE_ENV === 'production';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /** Public origin. Every canonical URL, hreflang and OG image derives from it. */
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .refine((v) => !v.endsWith('/'), { message: 'must not have a trailing slash' }),

  /* --- mail: optional in dev, required together in production ------------- */
  EMAIL_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  CONTACT_DESTINATION: z.string().email().optional(),

  /* --- Turnstile: optional, but all-or-nothing ---------------------------- */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  /** Comma-separated. Required whenever Turnstile is enabled. */
  TURNSTILE_ALLOWED_HOSTNAMES: z.string().optional(),

  /* --- rate limiting: optional, but both halves or neither ---------------- */
  RATE_LIMIT_REDIS_REST_URL: z.string().url().optional(),
  RATE_LIMIT_REDIS_REST_TOKEN: z.string().min(1).optional(),

  /** Pepper for hashing client identifiers. Required in production. */
  RATE_LIMIT_PEPPER: z.string().min(16).optional(),

  GITHUB_TOKEN: z.string().min(1).optional(),

  HSTS_MAX_AGE: z.coerce.number().int().positive().optional(),
  HSTS_INCLUDE_SUBDOMAINS: z.enum(['true', 'false']).optional(),
  HSTS_PRELOAD: z.enum(['true', 'false']).optional(),
});

export type Env = z.infer<typeof baseSchema>;

/** Cross-field rules that a flat schema cannot express. */
function crossChecks(env: Env): string[] {
  const errors: string[] = [];

  // Turnstile: adding ONLY the secret is the trap this guard exists for. The
  // server would then demand a token that no client is producing, and every
  // submission would fail with a generic error nobody could diagnose.
  const siteKey = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const secret = Boolean(env.TURNSTILE_SECRET_KEY);
  if (siteKey !== secret) {
    errors.push(
      'Turnstile is half-configured. Set BOTH NEXT_PUBLIC_TURNSTILE_SITE_KEY and ' +
        'TURNSTILE_SECRET_KEY, or neither. One without the other breaks every ' +
        'contact submission.',
    );
  }

  if (siteKey && secret) {
    const hostnames = (env.TURNSTILE_ALLOWED_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);

    // Checked whenever Turnstile is on, not only in production: the verifier
    // fails closed without an allowlist, so an empty one would reject every
    // submission in development too — the same undiagnosable state the
    // half-configured check exists to prevent.
    if (hostnames.length === 0) {
      errors.push(
        'TURNSTILE_ALLOWED_HOSTNAMES is required when Turnstile is enabled. ' +
          'Set it to the hostname(s) Cloudflare will report, comma-separated ' +
          '(e.g. amirmahdi-najafi.ir). Development may set localhost explicitly. ' +
          'The request Host header is not used, because it is attacker-controlled.',
      );
    }

    if (isProd()) {
      const local = hostnames.filter((h) => h === 'localhost' || h === '127.0.0.1' || h === '::1');
      if (local.length > 0) {
        errors.push(
          `TURNSTILE_ALLOWED_HOSTNAMES contains ${local.join(', ')} in production. ` +
            'A loopback hostname in the production allowlist lets a token solved ' +
            'on a local build satisfy the live site.',
        );
      }
    }
  }

  const redisUrl = Boolean(env.RATE_LIMIT_REDIS_REST_URL);
  const redisToken = Boolean(env.RATE_LIMIT_REDIS_REST_TOKEN);
  if (redisUrl !== redisToken) {
    errors.push(
      'Distributed rate limiting is half-configured. Set BOTH ' +
        'RATE_LIMIT_REDIS_REST_URL and RATE_LIMIT_REDIS_REST_TOKEN, or neither.',
    );
  }

  if (isProd()) {
    // Mail is optional at boot. If no provider is configured, /api/contact
    // fails closed with 503 instead of pretending a message was delivered.
    if (!env.RATE_LIMIT_PEPPER) {
      errors.push(
        'RATE_LIMIT_PEPPER is required in production (32+ random characters). ' +
          'Without it, client identifiers are hashed with a predictable value.',
      );
    }
    if (env.NEXT_PUBLIC_SITE_URL.startsWith('http://')) {
      errors.push('NEXT_PUBLIC_SITE_URL must be https:// in production.');
    }
    if (env.HSTS_PRELOAD === 'true' && env.HSTS_INCLUDE_SUBDOMAINS !== 'true') {
      errors.push(
        'HSTS_PRELOAD=true requires HSTS_INCLUDE_SUBDOMAINS=true. Read the HSTS ' +
          'section of docs/DEPLOYMENT.md before enabling either.',
      );
    }
  }

  return errors;
}

let cached: Env | null = null;

/**
 * Parses and caches the server environment. Throws with every problem listed
 * at once, because fixing configuration one error per restart is miserable.
 *
 * Server-only. Never import this from a client component: it reads secrets.
 */
export function serverEnv(): Env {
  if (cached) return cached;

  const parsed = baseSchema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }

  const errors = crossChecks(parsed.data);
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Feature switches derived from configuration, safe to read anywhere server-side. */
export const features = {
  turnstile: () => Boolean(process.env.TURNSTILE_SECRET_KEY),
  distributedRateLimit: () =>
    Boolean(process.env.RATE_LIMIT_REDIS_REST_URL && process.env.RATE_LIMIT_REDIS_REST_TOKEN),
  mail: () => Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM),
};

/**
 * The ONLY environment value the browser may see.
 *
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is a public widget key by design — Cloudflare
 * publishes it in the HTML. Every other value above is server-only, and no
 * secret is ever given a NEXT_PUBLIC_ prefix.
 */
export const publicEnv = {
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
};
