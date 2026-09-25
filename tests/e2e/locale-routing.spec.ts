import { test, expect } from '@playwright/test';

/**
 * Locale negotiation must live in exactly one layer (src/proxy.ts). These
 * tests exist because next.config.mjs previously also redirected "/", which
 * made Accept-Language negotiation unreachable.
 */

test.describe('root negotiation', () => {
  test.use({ locale: 'fa-IR' });

  test('sends a Persian-preferring browser to /fa', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/fa$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});

test.describe('root fallback', () => {
  test.use({ locale: 'de-DE' });

  test('sends any other browser to /en', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('explicit locales are never overridden', () => {
  test.use({ locale: 'fa-IR' });

  test('a Persian browser asking for /en/projects stays on /en/projects', async ({ page }) => {
    await page.goto('/en/projects');
    await expect(page).toHaveURL(/\/en\/projects$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('a Persian browser asking for a deep English page stays there', async ({ page }) => {
    await page.goto('/en/projects/pad-system');
    await expect(page).toHaveURL(/\/en\/projects\/pad-system$/);
  });
});

test('both language trees are directly crawlable', async ({ request }) => {
  for (const path of ['/en', '/fa', '/en/projects', '/fa/projects', '/en/about', '/fa/about']) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), `${path} should be directly reachable`).toBe(200);
  }
});

test('the root redirect is temporary, not permanent', async ({ request }) => {
  const res = await request.get('/', { maxRedirects: 0 });
  // 307 — the target depends on the request, so it must never be cached
  // as a permanent redirect.
  expect(res.status()).toBe(307);
  expect(res.headers()['vary']).toContain('Accept-Language');
});

test.describe('malformed locales', () => {
  for (const path of ['/de', '/xx/projects', '/en-US', '/EN']) {
    test(`${path} returns a real 404`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
    });
  }
});

test('a missing project returns 404, not a rendered shell', async ({ request }) => {
  const res = await request.get('/en/projects/does-not-exist');
  expect(res.status()).toBe(404);
});

test('a missing article returns 404', async ({ request }) => {
  const res = await request.get('/en/blog/does-not-exist');
  expect(res.status()).toBe(404);
});
