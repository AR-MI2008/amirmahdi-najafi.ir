import { test, expect } from '@playwright/test';

const PAGES = [
  '/en',
  '/fa',
  '/en/projects',
  '/fa/projects',
  '/en/projects/pad-system',
  '/fa/projects/pad-system',
  '/en/about',
  '/en/services',
  '/en/blog',
  '/en/contact',
];

test('every page canonicalises to itself, never to the other language', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical, `${path} canonical`).toContain(path);
  }
});

test('hreflang is reciprocal and includes x-default', async ({ page }) => {
  await page.goto('/fa/projects/pad-system');
  const links = page.locator('link[rel="alternate"]');
  const hrefs = await links.evaluateAll((nodes) =>
    nodes.map((n) => [n.getAttribute('hreflang'), n.getAttribute('href')]),
  );
  const map = Object.fromEntries(hrefs);
  expect(map['en']).toContain('/en/projects/pad-system');
  expect(map['fa-IR']).toContain('/fa/projects/pad-system');
  expect(map['x-default']).toContain('/en/projects/pad-system');
});

test('titles and descriptions are unique per page and per language', async ({ page }) => {
  const seen = new Map<string, string>();
  for (const path of PAGES) {
    await page.goto(path);
    const title = await page.title();
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');

    expect(title.length, `${path} has no title`).toBeGreaterThan(0);
    expect(description?.length ?? 0, `${path} has no description`).toBeGreaterThan(0);
    expect(seen.has(title), `${path} duplicates the title of ${seen.get(title)}`).toBe(false);
    seen.set(title, path);
  }
});

test('Open Graph and Twitter metadata are present', async ({ page }) => {
  await page.goto('/en/projects/webguard');
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
    await expect(page.locator(`meta[property="${property}"]`)).toHaveCount(1);
  }
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
});

test('Person JSON-LD lists only defensible profiles', async ({ page }) => {
  await page.goto('/en');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const person = blocks.map((b) => JSON.parse(b)).find((b) => b['@type'] === 'Person');

  expect(person).toBeTruthy();
  expect(person.sameAs).toContain('https://github.com/AR-MI2008');
  expect(person.sameAs.join(' ')).not.toContain('t.me');
});

test('a project without a representative URL emits no sameAs', async ({ page }) => {
  await page.goto('/en/projects/hypernet');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const work = blocks.map((b) => JSON.parse(b)).find((b) => b['@type'] === 'CreativeWork');
  expect(work.sameAs).toBeUndefined();
});

test('breadcrumbs render and are marked up', async ({ page }) => {
  await page.goto('/en/projects/pad-system');
  await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible();
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const crumbs = blocks.map((b) => JSON.parse(b)).find((b) => b['@type'] === 'BreadcrumbList');
  expect(crumbs.itemListElement.length).toBeGreaterThanOrEqual(3);
});

test('content is present without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/en/projects/pad-system');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/Problem/i).first()).toBeVisible();

  await page.goto('/fa');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await context.close();
});

test('robots.txt and sitemap.xml are served', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap:');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('/en/projects/pad-system');
  expect(xml).toContain('/fa/projects/pad-system');
});

test('every declared icon is served, not 404', async ({ request }) => {
  for (const asset of [
    '/favicon.svg',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/icon-512.png',
    '/icon-maskable-512.png',
    '/site.webmanifest',
  ]) {
    const res = await request.get(asset);
    expect(res.status(), `${asset} is declared but not served`).toBe(200);
  }
});
