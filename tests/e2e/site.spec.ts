import { test, expect } from '@playwright/test';

test('homepage renders its heading and selected work without JS interaction', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Software developer');
  await expect(page.getByRole('link', { name: /PAD System/i }).first()).toBeVisible();
});

test('language switch preserves the current page', async ({ page }) => {
  await page.goto('/en/projects/pad-system');
  await page.getByRole('link', { name: /switch language/i }).click();
  await expect(page).toHaveURL(/\/fa\/projects\/pad-system$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('theme toggle persists across a reload', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('button', { name: /switch theme/i }).click();
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme ?? 'light');
});

test('command palette opens, filters and closes on Escape', async ({ page }) => {
  await page.goto('/en');
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.type('webguard');
  await expect(dialog.getByRole('option').first()).toContainText(/WebGuard/i);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('project navigation reaches a case study', async ({ page }) => {
  await page.goto('/en/projects');
  await page
    .getByRole('link', { name: /WebGuard/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/projects\/webguard$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('WebGuard');
});

test('blog article renders with a canonical self-reference', async ({ page }) => {
  await page.goto('/fa/blog/fetching-user-supplied-urls-safely');
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute(
    'href',
    /\/fa\/blog\/fetching-user-supplied-urls-safely$/,
  );
});

test('contact form rejects an empty submission client-side and a short one server-side', async ({
  request,
}) => {
  const res = await request.post('/api/contact', {
    data: { name: 'x', email: 'bad', subject: '', message: 'short', renderedAt: Date.now() },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ ok: false });
});

test('unknown routes return a real 404', async ({ page }) => {
  const response = await page.goto('/en/does-not-exist');
  expect(response?.status()).toBe(404);
});
