import { describe, expect, it } from 'vitest';
import {
  allowedHostnames,
  verifyTurnstileToken,
  TURNSTILE_ACTION,
} from '@/lib/turnstile-verify';

/**
 * `success: true` was previously the whole check. These tests pin the two
 * additional bindings — action and hostname — and the absence of remoteip.
 */

const SECRET = 'test-secret';
const HOSTS = ['amirmahdi-najafi.ir'];

/** Records every Siteverify call so the request body can be asserted. */
function stubSiteverify(payload: Record<string, unknown>) {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const fetchImpl = (async (url: unknown, init: unknown) => {
    const request = init as { body: string };
    calls.push({ url: String(url), body: JSON.parse(request.body) as Record<string, unknown> });
    return {
      json: async () => payload,
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const good = {
  success: true,
  action: TURNSTILE_ACTION,
  hostname: 'amirmahdi-najafi.ir',
};

describe('verifyTurnstileToken', () => {
  it('accepts success + contact action + allowed hostname', async () => {
    const { fetchImpl } = stubSiteverify(good);
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a wrong action even when Cloudflare says success', async () => {
    const { fetchImpl } = stubSiteverify({ ...good, action: 'login' });
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('wrong-action');
  });

  it('rejects a missing action', async () => {
    const { fetchImpl } = stubSiteverify({ success: true, hostname: 'amirmahdi-najafi.ir' });
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a hostname outside the allowlist', async () => {
    const { fetchImpl } = stubSiteverify({ ...good, hostname: 'evil.example.com' });
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('wrong-hostname');
  });

  it('does not implicitly allow localhost in a production allowlist', async () => {
    const { fetchImpl } = stubSiteverify({ ...good, hostname: 'localhost' });
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(false);
  });

  it('allows a hostname that IS explicitly configured', async () => {
    const { fetchImpl } = stubSiteverify({ ...good, hostname: 'localhost' });
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: ['localhost'],
      fetchImpl,
    });
    expect(result.ok).toBe(true);
  });

  it('compares hostnames case-insensitively', async () => {
    const { fetchImpl } = stubSiteverify({ ...good, hostname: 'AmirMahdi-Najafi.IR' });
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects success: false', async () => {
    const { fetchImpl } = stubSiteverify({
      success: false,
      'error-codes': ['invalid-input-response'],
    });
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('rejected');
  });

  it('rejects a missing token when Turnstile is enabled', async () => {
    const { fetchImpl, calls } = stubSiteverify(good);
    const result = await verifyTurnstileToken(undefined, {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('no-token');
    // No point calling Cloudflare with nothing.
    expect(calls.length).toBe(0);
  });

  it('requires no token when Turnstile is disabled', async () => {
    const { fetchImpl, calls } = stubSiteverify(good);
    const result = await verifyTurnstileToken(undefined, { secret: undefined, fetchImpl });
    expect(result.ok).toBe(true);
    expect(calls.length).toBe(0);
  });

  it('fails closed when no hostname allowlist is configured', async () => {
    const { fetchImpl, calls } = stubSiteverify(good);
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: [],
      fetchImpl,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('misconfigured');
    expect(calls.length).toBe(0);
  });

  it('fails closed when Siteverify is unreachable', async () => {
    const fetchImpl = (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    const result = await verifyTurnstileToken('tok', {
      secret: SECRET,
      hostnames: HOSTS,
      fetchImpl,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('request-failed');
  });
});

describe('siteverify request body', () => {
  it('sends no remoteip field at all', async () => {
    const { fetchImpl, calls } = stubSiteverify(good);
    await verifyTurnstileToken('tok', { secret: SECRET, hostnames: HOSTS, fetchImpl });

    expect(calls.length).toBe(1);
    const body = calls[0]!.body;
    expect(Object.keys(body).sort()).toEqual(['response', 'secret']);
    expect('remoteip' in body).toBe(false);
  });

  it('never sends the rate-limit hash to Cloudflare', async () => {
    const { fetchImpl, calls } = stubSiteverify(good);
    // A value shaped exactly like clientKey() output.
    const rateLimitHash = 'a'.repeat(32);
    await verifyTurnstileToken('tok', { secret: SECRET, hostnames: HOSTS, fetchImpl });

    const serialised = JSON.stringify(calls[0]!.body);
    expect(serialised).not.toContain(rateLimitHash);
    expect(serialised).not.toContain('remoteip');
  });

  it('posts to Cloudflare siteverify', async () => {
    const { fetchImpl, calls } = stubSiteverify(good);
    await verifyTurnstileToken('tok', { secret: SECRET, hostnames: HOSTS, fetchImpl });
    expect(calls[0]!.url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
  });
});

describe('allowedHostnames', () => {
  it('parses a comma-separated list, trimming and lowercasing', () => {
    expect(allowedHostnames(' A.example.com , b.example.com ')).toEqual([
      'a.example.com',
      'b.example.com',
    ]);
  });

  it('returns an empty list for empty or absent configuration', () => {
    expect(allowedHostnames('')).toEqual([]);
    expect(allowedHostnames(undefined)).toEqual([]);
    expect(allowedHostnames(' , , ')).toEqual([]);
  });
});
