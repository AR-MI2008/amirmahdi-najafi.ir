import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryLimiter, setRateLimiter } from '@/lib/rate-limit';

/**
 * The contact endpoint is the only place on the site that accepts input, so
 * every rejection path is pinned here — including the one that used to lie.
 */

const ORIGINAL_ENV = { ...process.env };

function payload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Person',
    email: 'test@example.com',
    subject: 'Enquiry about a project',
    message: 'This message is comfortably longer than the twenty character minimum.',
    website: '',
    // Older than the 3s bot threshold.
    renderedAt: Date.now() - 10_000,
    ...overrides,
  };
}

function post(body: unknown, headers: Record<string, string> = {}) {
  const raw = JSON.stringify(body);
  return new Request('https://amirmahdi-najafi.ir/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': String(new TextEncoder().encode(raw).byteLength),
      'x-forwarded-for': '203.0.113.42',
      ...headers,
    },
    body: raw,
  });
}

async function route() {
  vi.resetModules();
  return import('@/app/api/contact/route');
}

const HOSTNAME = 'amirmahdi-najafi.ir';

function enableTurnstile() {
  process.env.NODE_ENV = 'development';
  process.env.TURNSTILE_SECRET_KEY = 'secret';
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site';
  process.env.TURNSTILE_ALLOWED_HOSTNAMES = HOSTNAME;
}

/** Mocks Siteverify while letting any other fetch resolve harmlessly. */
function siteverify(payload: Record<string, unknown>) {
  return vi.fn(async (url: unknown) =>
    String(url).includes('siteverify')
      ? new Response(JSON.stringify(payload), { status: 200 })
      : new Response('{}', { status: 200 }),
  );
}

beforeEach(() => {
  setRateLimiter(new MemoryLimiter());
});

afterEach(() => {
  setRateLimiter(null);
  Object.keys(process.env).forEach((k) => delete process.env[k]);
  Object.assign(process.env, ORIGINAL_ENV);
  vi.unstubAllGlobals();
});

describe('method and content type', () => {
  it('rejects GET with 405 and an Allow header', async () => {
    const { GET } = await route();
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
  });

  it('rejects a non-JSON content type with 415', async () => {
    const { POST } = await route();
    const res = await POST(
      new Request('https://x/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'hello',
      }),
    );
    expect(res.status).toBe(415);
  });
});

describe('payload limits', () => {
  it('rejects an oversized declared body with 413 before parsing', async () => {
    const { POST } = await route();
    const res = await POST(
      new Request('https://x/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': '2000000' },
        body: '{}',
      }),
    );
    expect(res.status).toBe(413);
  });

  it('rejects an oversized actual body even when Content-Length lies', async () => {
    const { POST } = await route();
    const res = await POST(
      post(payload({ message: 'x'.repeat(50_000) }), { 'content-length': '10' }),
    );
    expect(res.status).toBe(413);
  });

  it('rejects malformed JSON with 400', async () => {
    const { POST } = await route();
    const res = await POST(
      new Request('https://x/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
        body: '{not json',
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe('mail provider availability', () => {
  it('returns 503 in production when no provider is configured — never a fake success', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.EMAIL_API_KEY;
    delete process.env.EMAIL_FROM;

    const { POST } = await route();
    const res = await POST(post(payload()));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false });
  });

  it('reports undelivered in development rather than claiming it sent', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.EMAIL_API_KEY;

    const { POST } = await route();
    const res = await POST(post(payload()));
    const body = (await res.json()) as { ok: boolean; delivered?: boolean };
    expect(res.status).toBe(200);
    expect(body.delivered).toBe(false);
  });

  it('returns 502 when the provider itself fails', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_API_KEY = 'key';
    process.env.EMAIL_FROM = 'noreply@example.com';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));

    const { POST } = await route();
    const res = await POST(post(payload()));
    expect(res.status).toBe(502);
  });

  it('succeeds when the provider accepts the message', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_API_KEY = 'key';
    process.env.EMAIL_FROM = 'noreply@example.com';
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await route();
    const res = await POST(post(payload()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    // The visitor's address must be the reply-to, not the from.
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>;
    expect(sent.reply_to).toBe('test@example.com');
    expect(sent.from).toBe('noreply@example.com');
  });
});

describe('bot handling', () => {
  it('rejects a filled honeypot without sending anything', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_API_KEY = 'key';
    process.env.EMAIL_FROM = 'noreply@example.com';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await route();
    const res = await POST(post(payload({ website: 'http://spam.example' })));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats an instant submission as automated', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await route();
    await POST(post(payload({ renderedAt: Date.now() })));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('turnstile paths', () => {
  it('does not require a token when Turnstile is disabled', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.TURNSTILE_SECRET_KEY;

    const { POST } = await route();
    const res = await POST(post(payload()));
    expect(res.status).toBe(200);
  });

  it('rejects a missing token when Turnstile is enabled', async () => {
    enableTurnstile();

    const { POST } = await route();
    const res = await POST(post(payload()));
    expect(res.status).toBe(400);
  });

  it('accepts a token Cloudflare verifies with the right action and hostname', async () => {
    enableTurnstile();
    vi.stubGlobal('fetch', siteverify({ success: true, action: 'contact', hostname: HOSTNAME }));

    const { POST } = await route();
    const res = await POST(post(payload({ turnstileToken: 'tok' })));
    expect(res.status).toBe(200);
  });

  it('rejects a token Cloudflare refuses', async () => {
    enableTurnstile();
    vi.stubGlobal('fetch', siteverify({ success: false, 'error-codes': ['timeout-or-duplicate'] }));

    const { POST } = await route();
    const res = await POST(post(payload({ turnstileToken: 'bad' })));
    expect(res.status).toBe(400);
  });

  it('rejects a token solved for a different action', async () => {
    enableTurnstile();
    vi.stubGlobal('fetch', siteverify({ success: true, action: 'signup', hostname: HOSTNAME }));

    const { POST } = await route();
    const res = await POST(post(payload({ turnstileToken: 'tok' })));
    expect(res.status).toBe(400);
  });

  it('rejects a token solved on a hostname outside the allowlist', async () => {
    enableTurnstile();
    vi.stubGlobal(
      'fetch',
      siteverify({ success: true, action: 'contact', hostname: 'copy.example.com' }),
    );

    const { POST } = await route();
    const res = await POST(post(payload({ turnstileToken: 'tok' })));
    expect(res.status).toBe(400);
  });

  it('never sends the rate-limit hash to Cloudflare as remoteip', async () => {
    enableTurnstile();
    const fetchMock = siteverify({ success: true, action: 'contact', hostname: HOSTNAME });
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await route();
    await POST(post(payload({ turnstileToken: 'tok' })));

    const call = fetchMock.mock.calls.find(([url]) => String(url).includes('siteverify'));
    expect(call).toBeTruthy();
    const body = JSON.parse(call![1].body as string) as Record<string, unknown>;

    expect('remoteip' in body).toBe(false);
    expect(Object.keys(body).sort()).toEqual(['response', 'secret']);
    // The forwarded IP must not reach Cloudflare in any form, hashed or raw.
    expect(JSON.stringify(body)).not.toContain('203.0.113.42');
  });

  it('does not leak Cloudflare error codes to the browser', async () => {
    enableTurnstile();
    vi.stubGlobal('fetch', siteverify({ success: false, 'error-codes': ['invalid-input-secret'] }));

    const { POST } = await route();
    const res = await POST(post(payload({ turnstileToken: 'tok' })));
    expect(await res.json()).toEqual({ ok: false });
  });
});

describe('rate limiting', () => {
  it('returns 429 with Retry-After once the window is exhausted', async () => {
    process.env.NODE_ENV = 'development';
    const { POST } = await route();

    for (let i = 0; i < 5; i += 1) await POST(post(payload()));
    const res = await POST(post(payload()));

    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
});

describe('error shape', () => {
  it('returns an identical generic body on every failure path', async () => {
    const { POST } = await route();
    const bodies = await Promise.all([
      POST(post(payload({ email: 'not-an-email' }))).then((r) => r.json()),
      POST(post(payload({ message: 'too short' }))).then((r) => r.json()),
      POST(post(payload({ name: '' }))).then((r) => r.json()),
    ]);
    for (const body of bodies) expect(body).toEqual({ ok: false });
  });
});
