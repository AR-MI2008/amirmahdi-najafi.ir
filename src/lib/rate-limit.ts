import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Rate limiting.
 *
 * ## Which limiter runs where
 *
 * `MemoryLimiter` is correct for exactly one deployment shape: a SINGLE
 * long-lived Node process, which is what `next start` behind Nginx on one VPS
 * gives you — the documented target in docs/DEPLOYMENT.md.
 *
 * It is WRONG, silently, in every other shape:
 *
 *  - Two or more app instances behind a load balancer. Each keeps its own Map,
 *    so the effective limit is 5 x instances, and which one you hit is luck.
 *  - Serverless or edge functions. Each cold start begins with an empty Map,
 *    so an attacker who paces requests past the container lifetime is never
 *    limited at all.
 *  - Any autoscaling platform, for both reasons at once.
 *
 * The failure mode is the dangerous kind: nothing errors, the limiter just
 * quietly stops limiting. If the deployment ever leaves one process, set
 * RATE_LIMIT_REDIS_REST_URL and RATE_LIMIT_REDIS_REST_TOKEN and the Redis
 * limiter below takes over.
 *
 * ## Privacy
 *
 * No raw client IP is ever stored, logged or sent to Redis. The only thing
 * that leaves this module is a truncated SHA-256 of `ip:pepper`, which cannot
 * be reversed without the pepper and expires with the window.
 */

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the window resets. 0 when not limited. */
  retryAfter: number;
  /** Requests still allowed in this window. */
  remaining: number;
};

export interface RateLimiter {
  readonly name: string;
  check(key: string): Promise<RateLimitResult>;
}

export const WINDOW_MS = 10 * 60 * 1000;
export const MAX_PER_WINDOW = 5;

/* ------------------------------------------------------------ client key -- */

/**
 * A stable, non-reversible identifier for the caller.
 *
 * `x-forwarded-for` is only trustworthy because Nginx sets it (see the proxy
 * block in docs/DEPLOYMENT.md). If this app is ever exposed directly, the
 * header becomes attacker-controlled and this limiter becomes decorative.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || 'unknown';
  const pepper = process.env.RATE_LIMIT_PEPPER ?? 'dev-only-pepper';
  return createHash('sha256').update(`${ip}:${pepper}`).digest('hex').slice(0, 32);
}

/* ---------------------------------------------------------- in-memory ----- */

type Entry = { count: number; resetAt: number };

export class MemoryLimiter implements RateLimiter {
  readonly name = 'memory';
  private buckets = new Map<string, Entry>();

  async check(key: string): Promise<RateLimitResult> {
    this.sweep();
    const now = Date.now();
    const entry = this.buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return { ok: true, retryAfter: 0, remaining: MAX_PER_WINDOW - 1 };
    }
    if (entry.count >= MAX_PER_WINDOW) {
      return {
        ok: false,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        remaining: 0,
      };
    }
    entry.count += 1;
    return { ok: true, retryAfter: 0, remaining: MAX_PER_WINDOW - entry.count };
  }

  /** Opportunistic cleanup so the map cannot grow without bound. */
  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.buckets) if (entry.resetAt <= now) this.buckets.delete(key);
  }

  /** Test seam. */
  reset(): void {
    this.buckets.clear();
  }
}

/* -------------------------------------------------------------- redis ----- */

/**
 * Redis-backed fixed window over the Upstash-compatible REST API.
 *
 * REST rather than a driver on purpose: it needs no TCP connection pool (which
 * serverless handles badly), adds no production dependency, and works from
 * any runtime that has fetch. Any Redis-compatible service exposing the same
 * REST shape will work.
 *
 * Fails OPEN on transport errors. That is a deliberate trade: this limiter
 * protects a contact form, and a Redis outage should not take down the
 * ability to contact the site owner. For an auth endpoint the correct choice
 * would be the opposite.
 */
export class RedisLimiter implements RateLimiter {
  readonly name = 'redis';

  constructor(
    private url: string,
    private token: string,
  ) {}

  private async command(args: (string | number)[]): Promise<unknown> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) throw new Error(`redis rest ${res.status}`);
    const data = (await res.json()) as { result?: unknown };
    return data.result;
  }

  async check(key: string): Promise<RateLimitResult> {
    // Window-aligned key: no separate expiry bookkeeping, no read-then-write race.
    const window = Math.floor(Date.now() / WINDOW_MS);
    const redisKey = `rl:${key}:${window}`;

    try {
      const count = Number(await this.command(['INCR', redisKey]));
      if (count === 1) {
        await this.command(['PEXPIRE', redisKey, WINDOW_MS]);
      }
      const resetAt = (window + 1) * WINDOW_MS;
      if (count > MAX_PER_WINDOW) {
        return {
          ok: false,
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
          remaining: 0,
        };
      }
      return { ok: true, retryAfter: 0, remaining: MAX_PER_WINDOW - count };
    } catch {
      // Never log the key or anything derived from the caller.
      console.error('[rate-limit] redis unavailable, failing open');
      return { ok: true, retryAfter: 0, remaining: MAX_PER_WINDOW };
    }
  }
}

/* ------------------------------------------------------------- selection -- */

let limiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (limiter) return limiter;

  const url = process.env.RATE_LIMIT_REDIS_REST_URL;
  const token = process.env.RATE_LIMIT_REDIS_REST_TOKEN;
  limiter = url && token ? new RedisLimiter(url, token) : new MemoryLimiter();
  return limiter;
}

/** Test seam. */
export function setRateLimiter(next: RateLimiter | null): void {
  limiter = next;
}

export function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
