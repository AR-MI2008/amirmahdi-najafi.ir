import { test, expect, type Page } from '@playwright/test';
const password = 'Local-CMS-E2E-only-2026!';
async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('رمز عبور').fill(password);
  await page.getByRole('button', { name: 'ورود به پنل' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
async function text(page: Page, path: string, value: string) {
  await page.locator(`[id="cms-${path}"]`).fill(value);
}
async function bilingual(page: Page, path: string, fa: string, en: string) {
  await text(page, `${path}.fa`, fa);
  await text(page, `${path}.en`, en);
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
test('anonymous and forged sessions cannot open content; admin is Persian and uncached', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: 'an_admin_session',
      value: 'f'.repeat(64),
      domain: 'localhost',
      path: '/admin',
      secure: true,
    },
  ]);
  const response = await page.goto('/admin/content');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  expect(response?.headers()['cache-control']).toContain('no-store');
  expect(response?.headers()['x-robots-tag']).toContain('noindex');
});
test('invalid login is generic, successful login creates secure cookie, logout revokes it', async ({
  page,
  context,
  browser,
}) => {
  await page.goto('/admin/login');
  await page.getByLabel('رمز عبور').fill('wrong');
  await page.getByRole('button', { name: 'ورود به پنل' }).click();
  await expect(page.locator('main [role=alert]')).toContainText('ورود ناموفق');
  await page.getByLabel('رمز عبور').fill(password);
  await page.getByRole('button', { name: 'ورود به پنل' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const cookie = (await context.cookies()).find((c) => c.name === 'an_admin_session')!;
  expect(cookie).toMatchObject({
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/admin',
  });
  await page.getByRole('button', { name: 'خروج امن' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await context.cookies()).find((c) => c.name === 'an_admin_session')).toBeUndefined();
  const replay = await browser.newContext({ ignoreHTTPSErrors: true });
  await replay.addCookies([cookie]);
  const tab = await replay.newPage();
  await tab.goto('https://localhost:3447/admin/content');
  await expect(tab).toHaveURL(/\/admin\/login$/);
  await replay.close();
});
test('creates and edits a post with block controls, preserves invalid input, rejects duplicate and stale edits', async ({
  page,
  context,
}, info) => {
  await login(page);
  await page.getByRole('link', { name: 'مدیریت مقاله‌ها و پروژه‌ها' }).click();
  await page.getByRole('link', { name: 'مقالهٔ جدید' }).click();
  const slug = `e2e-post-${info.project.name}`;
  await text(page, 'slug', slug);
  await bilingual(page, 'title', 'مقالهٔ آزمایشی', 'Test article');
  await bilingual(page, 'excerpt', 'خلاصهٔ آزمایشی', 'Test excerpt');
  await text(page, 'publishedAt', '2026-02-30');
  await page.getByRole('button', { name: 'ایجاد محتوا', exact: true }).click();
  await expect(page.locator('[id="cms-publishedAt"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('[id="cms-title.fa"]')).toHaveValue('مقالهٔ آزمایشی');
  await text(page, 'publishedAt', '2026-10-12');
  await page.getByRole('button', { name: 'افزودن به بخش‌های مقاله' }).click();
  await page.getByLabel('نوع بخش').selectOption('p');
  await bilingual(page, 'blocks.0.text', 'متن فارسی مقاله', 'Article paragraph');
  await page.getByRole('button', { name: 'افزودن به بخش‌های مقاله' }).click();
  await page.getByLabel('نوع بخش').nth(1).selectOption('code');
  await text(page, 'blocks.1.lang', 'js');
  await text(page, 'blocks.1.code', 'console.log("test");');
  await page.getByRole('button', { name: 'انتقال به بالا' }).nth(1).click();
  await expect(page.locator('[id="cms-blocks.0.code"]')).toHaveValue('console.log("test");');
  await page.getByRole('button', { name: 'حذف مورد 1' }).first().click();
  await fits(page);
  await page.screenshot({ path: info.outputPath('post-form.png'), fullPage: true });
  await page.getByRole('button', { name: 'ایجاد محتوا', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('ذخیره شد');
  await page.getByRole('link', { name: 'فهرست محتوا' }).click();
  await page.getByRole('link', { name: 'مقالهٔ آزمایشی', exact: true }).click();
  await expect(page.locator('[id="cms-slug"]')).toBeDisabled();
  const stale = await context.newPage();
  await stale.goto(page.url());
  await text(page, 'title.fa', `مقالهٔ ویرایش‌شده ${info.project.name}`);
  await page.getByRole('button', { name: 'ذخیرهٔ تغییرات' }).click();
  await expect(page.getByRole('status')).toContainText('ذخیره شد');
  await text(stale, 'title.fa', 'ویرایش قدیمی');
  await stale.getByRole('button', { name: 'ذخیرهٔ تغییرات' }).click();
  await expect(stale.locator('main [role=alert]')).toContainText('رکورد تغییر کرده');
  await stale.close();
  await page.getByRole('link', { name: 'فهرست محتوا' }).click();
  await page
    .getByRole('link', { name: `مقالهٔ ویرایش‌شده ${info.project.name}`, exact: true })
    .click();
  await expect(page.locator('[id="cms-blocks.0.text.fa"]')).toHaveValue('متن فارسی مقاله');
  // A duplicate create must never overwrite an existing record.
  await page.getByRole('link', { name: 'مقالهٔ جدید' }).click();
  await text(page, 'slug', slug);
  await text(page, 'publishedAt', '2026-10-12');
  await bilingual(page, 'title', 'رکورد تکراری', 'Duplicate');
  await bilingual(page, 'excerpt', 'خلاصه', 'Summary');
  await page.getByRole('button', { name: 'ایجاد محتوا', exact: true }).click();
  await expect(page.locator('main [role=alert]')).toContainText('قبلاً ثبت شده');
});
test('creates and edits a full project through graphical fields and rejects unsafe links', async ({
  page,
}, info) => {
  await login(page);
  await page.goto('/admin/content?kind=project');
  await text(page, 'slug', `e2e-project-${info.project.name}`);
  for (const path of ['name', 'category', 'role', 'summary', 'intro'])
    await bilingual(page, path, `پروژه ${path}`, `Project ${path}`);
  await page.getByRole('button', { name: 'افزودن به پیوندها' }).click();
  await bilingual(page, 'links.0.label', 'سایت', 'Website');
  await text(page, 'links.0.href', 'javascript:alert(1)');
  for (const mode of ['dark', 'light'])
    for (const color of [
      'background',
      'surface',
      'accent',
      'accentSecondary',
      'foreground',
      'muted',
    ])
      await text(page, `theme.${mode}.${color}`, mode === 'dark' ? '#102030' : '#e0e0e0');
  await page.getByRole('button', { name: 'ایجاد محتوا', exact: true }).click();
  await expect(page.locator('[id="cms-links.0.href"]')).toHaveAttribute('aria-invalid', 'true');
  await text(page, 'links.0.href', 'https://example.com');
  await page.getByRole('button', { name: 'افزودن به قابلیت‌ها' }).click();
  await bilingual(page, 'capabilities.0.label', 'قابلیت', 'Capability');
  await page.getByRole('button', { name: 'افزودن به بخش‌ها', exact: true }).click();
  await text(page, 'sections.0.id', 'overview');
  await bilingual(page, 'sections.0.title', 'معرفی', 'Overview');
  await page
    .locator('fieldset')
    .filter({ has: page.locator('[id="cms-sections.0.id"]') })
    .last()
    .getByRole('button', { name: 'افزودن به فارسی', exact: true })
    .click();
  await text(page, 'sections.0.body.fa.0', 'متن معرفی');
  await page.getByRole('button', { name: 'افزودن به انگلیسی', exact: true }).click();
  await text(page, 'sections.0.body.en.0', 'Overview text');
  await page.getByRole('button', { name: 'افزودن به تصاویر' }).click();
  await text(page, 'gallery.0.src', '/icon-192.png');
  await bilingual(page, 'gallery.0.alt', 'تصویر', 'Image');
  await text(page, 'gallery.0.width', '192');
  await text(page, 'gallery.0.height', '192');
  await fits(page);
  await page.screenshot({ path: info.outputPath('project-form.png'), fullPage: true });
  await page.getByRole('button', { name: 'ایجاد محتوا', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('ذخیره شد');
  await page.getByRole('link', { name: 'فهرست محتوا' }).click();
  await page.getByRole('link', { name: 'پروژه name', exact: true }).click();
  await text(page, 'name.fa', 'پروژهٔ ویرایش‌شده');
  await page.getByRole('button', { name: 'ذخیرهٔ تغییرات' }).click();
  await expect(page.getByRole('status')).toContainText('ذخیره شد');
});
test('cross-origin action fails without creating a session', async ({ page, context }) => {
  await page.goto('/admin/login');
  await page.getByLabel('رمز عبور').fill(password);
  const actionField = page.locator('form input[name^="$ACTION_ID_"]');
  const actionName = await actionField.getAttribute('name');
  expect(actionName).toBeTruthy();
  const response = await page.request.post('/admin/login', {
    headers: { origin: 'https://attacker.example' },
    multipart: { [actionName!]: '', password },
    maxRedirects: 0,
  });
  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect((await context.cookies()).find((c) => c.name === 'an_admin_session')).toBeUndefined();
});
