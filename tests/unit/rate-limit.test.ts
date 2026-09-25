import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryLimiter, clientKey, MAX_PER_WINDOW } from '@/lib/rate-limit';

describe('MemoryLimiter', () => {
  let limiter: MemoryLimiter;

  beforeEach(() => {
    limiter = new MemoryLimiter();
  });

  it('allows exactly MAX_PER_WINDOW requests then blocks', async () => {
    for (let i = 0; i < MAX_PER_WINDOW; i += 1) {
      const result = await limiter.check('k');
      expect(result.ok, `request ${i + 1} should be allowed`).toBe(true);
    }
    const blocked = await limiter.check('k');
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.remaining).toBe(0);
  });

  it('counts each key independently', async () => {
    for (let i = 0; i < MAX_PER_WINDOW; i += 1) await limiter.check('a');
    expect((await limiter.check('a')).ok).toBe(false);
    expect((await limiter.check('b')).ok).toBe(true);
  });

  it('reports remaining budget accurately', async () => {
    expect((await limiter.check('k')).remaining).toBe(MAX_PER_WINDOW - 1);
    expect((await limiter.check('k')).remaining).toBe(MAX_PER_WINDOW - 2);
  });

  it('lets the window expire', async () => {
    vi.useFakeTimers();
    try {
      for (let i = 0; i < MAX_PER_WINDOW; i += 1) await limiter.check('k');
      expect((await limiter.check('k')).ok).toBe(false);
      vi.advanceTimersByTime(11 * 60 * 1000);
      expect((await limiter.check('k')).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('clientKey', () => {
  const make = (ip: string) =>
    new Request('https://example.com/api/contact', { headers: { 'x-forwarded-for': ip } });

  it('never exposes the raw IP', () => {
    const key = clientKey(make('203.0.113.42'));
    expect(key).not.toContain('203.0.113.42');
    expect(key).not.toContain('203');
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });

  it('is stable for the same client and different across clients', () => {
    expect(clientKey(make('203.0.113.42'))).toBe(clientKey(make('203.0.113.42')));
    expect(clientKey(make('203.0.113.42'))).not.toBe(clientKey(make('198.51.100.7')));
  });

  it('takes the first hop from a forwarded chain', () => {
    const chained = new Request('https://example.com/', {
      headers: { 'x-forwarded-for': '203.0.113.42, 70.41.3.18, 150.172.238.178' },
    });
    expect(clientKey(chained)).toBe(clientKey(make('203.0.113.42')));
  });

  it('handles a missing header without throwing', () => {
    expect(clientKey(new Request('https://example.com/'))).toMatch(/^[0-9a-f]{32}$/);
  });
});
