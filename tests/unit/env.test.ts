import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Environment validation is the guard that stops a half-configured deploy
 * reaching a visitor. Each case below is a configuration mistake that
 * previously would have failed silently at runtime.
 */

const BASE = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_SITE_URL: 'https://amirmahdi-najafi.ir',
  EMAIL_API_KEY: 'key',
  EMAIL_FROM: 'noreply@amirmahdi-najafi.ir',
  RATE_LIMIT_PEPPER: 'x'.repeat(32),
};

async function parseWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  const previous = { ...process.env };
  Object.keys(process.env).forEach((k) => delete process.env[k]);
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) process.env[key] = value;
  }
  try {
    const { serverEnv } = await import('@/lib/env');
    return serverEnv();
  } finally {
    Object.keys(process.env).forEach((k) => delete process.env[k]);
    Object.assign(process.env, previous);
  }
}

afterEach(() => vi.resetModules());

describe('serverEnv', () => {
  it('accepts a complete production configuration', async () => {
    await expect(parseWith(BASE)).resolves.toBeTruthy();
  });

  it('allows boot without mail; contact rejects delivery separately', async () => {
    await expect(parseWith({ ...BASE, EMAIL_API_KEY: undefined })).resolves.toBeTruthy();
  });

  it('rejects a half-configured Turnstile pair', async () => {
    await expect(parseWith({ ...BASE, TURNSTILE_SECRET_KEY: 'secret' })).rejects.toThrow(
      /Turnstile is half-configured/,
    );

    await expect(parseWith({ ...BASE, NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site' })).rejects.toThrow(
      /Turnstile is half-configured/,
    );
  });

  it('accepts a fully configured Turnstile, allowlist included', async () => {
    await expect(
      parseWith({
        ...BASE,
        TURNSTILE_SECRET_KEY: 'secret',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site',
        TURNSTILE_ALLOWED_HOSTNAMES: 'amirmahdi-najafi.ir',
      }),
    ).resolves.toBeTruthy();
  });

  it('requires a hostname allowlist whenever Turnstile is enabled', async () => {
    await expect(
      parseWith({
        ...BASE,
        TURNSTILE_SECRET_KEY: 'secret',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site',
      }),
    ).rejects.toThrow(/TURNSTILE_ALLOWED_HOSTNAMES is required/);
  });

  it('rejects an allowlist that is only separators', async () => {
    await expect(
      parseWith({
        ...BASE,
        TURNSTILE_SECRET_KEY: 'secret',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site',
        TURNSTILE_ALLOWED_HOSTNAMES: ' , , ',
      }),
    ).rejects.toThrow(/TURNSTILE_ALLOWED_HOSTNAMES is required/);
  });

  it('accepts multiple hostnames so staging can differ from production', async () => {
    await expect(
      parseWith({
        ...BASE,
        TURNSTILE_SECRET_KEY: 'secret',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site',
        TURNSTILE_ALLOWED_HOSTNAMES: 'amirmahdi-najafi.ir,staging.amirmahdi-najafi.ir',
      }),
    ).resolves.toBeTruthy();
  });

  it('rejects a loopback hostname in a production allowlist', async () => {
    for (const host of ['localhost', '127.0.0.1', '::1']) {
      await expect(
        parseWith({
          ...BASE,
          TURNSTILE_SECRET_KEY: 'secret',
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site',
          TURNSTILE_ALLOWED_HOSTNAMES: `amirmahdi-najafi.ir,${host}`,
        }),
      ).rejects.toThrow(/in production/);
    }
  });

  it('allows localhost in the allowlist outside production', async () => {
    await expect(
      parseWith({
        NODE_ENV: 'development',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        TURNSTILE_SECRET_KEY: 'secret',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site',
        TURNSTILE_ALLOWED_HOSTNAMES: 'localhost',
      }),
    ).resolves.toBeTruthy();
  });

  it('accepts neither half of Turnstile', async () => {
    await expect(parseWith(BASE)).resolves.toBeTruthy();
  });

  it('rejects a half-configured Redis pair', async () => {
    await expect(
      parseWith({ ...BASE, RATE_LIMIT_REDIS_REST_URL: 'https://redis.example.com' }),
    ).rejects.toThrow(/half-configured/);
  });

  it('rejects a missing rate-limit pepper in production', async () => {
    await expect(parseWith({ ...BASE, RATE_LIMIT_PEPPER: undefined })).rejects.toThrow(
      /RATE_LIMIT_PEPPER/,
    );
  });

  it('rejects a trailing slash on the site URL', async () => {
    await expect(
      parseWith({ ...BASE, NEXT_PUBLIC_SITE_URL: 'https://amirmahdi-najafi.ir/' }),
    ).rejects.toThrow(/trailing slash/);
  });

  it('rejects plain http in production', async () => {
    await expect(
      parseWith({ ...BASE, NEXT_PUBLIC_SITE_URL: 'http://amirmahdi-najafi.ir' }),
    ).rejects.toThrow(/https/);
  });

  it('rejects HSTS preload without includeSubDomains', async () => {
    await expect(
      parseWith({ ...BASE, HSTS_PRELOAD: 'true', HSTS_INCLUDE_SUBDOMAINS: 'false' }),
    ).rejects.toThrow(/HSTS_PRELOAD/);
  });

  it('does not require mail or a pepper in development', async () => {
    await expect(
      parseWith({ NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }),
    ).resolves.toBeTruthy();
  });

  it('exposes no server secret through a NEXT_PUBLIC_ variable', async () => {
    vi.resetModules();
    const { publicEnv } = await import('@/lib/env');
    const serialised = JSON.stringify(publicEnv);
    expect(Object.keys(publicEnv)).toEqual(['turnstileSiteKey']);
    for (const secret of [
      'EMAIL_API_KEY',
      'TURNSTILE_SECRET_KEY',
      'RATE_LIMIT_PEPPER',
      'GITHUB_TOKEN',
    ]) {
      expect(serialised).not.toContain(secret);
    }
  });
});
