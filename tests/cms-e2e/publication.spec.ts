import { test, expect, type Page } from '@playwright/test';
async function login(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('رمز عبور').fill('Local-CMS-E2E-only-2026!');
  await page.getByRole('button', { name: 'ورود به پنل' }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
async function fill(page: Page, path: string, value: string) {
  await page.locator(`[id="cms-${path}"]`).fill(value);
}
async function save(page: Page) {
  await page.getByRole('button', { name: 'ذخیرهٔ تغییرات' }).click();
  await expect(page.locator('.cms-editor [role=status]')).toContainText('ذخیره شد');
}
async function absent(page: Page, slug: string, kind: 'blog' | 'projects') {
  for (const locale of ['fa', 'en']) {
    const res = await page.request.get(`/${locale}/${kind}/${slug}`);
    expect(res.status()).toBe(404);
    expect(await res.text()).not.toContain('Stage8 private marker');
  }
  const sitemap = await page.request.get('/sitemap.xml');
  expect(await sitemap.text()).not.toContain(`/${kind}/${slug}`);
  for (const path of ['/en', '/fa', '/en/blog', '/fa/blog', '/en/projects', '/fa/projects']) {
    const res = await page.request.get(path);
    expect(await res.text()).not.toContain(slug);
  }
}
test('new article is private, published in both languages, updates SEO, withdraws and restores safely', async ({
  page,
}, info) => {
  await login(page);
  const slug = `stage8-article-${info.project.name}`;
  await page.goto('/admin/content?kind=post');
  await fill(page, 'slug', slug);
  await fill(page, 'publishedAt', '2026-10-12');
  await fill(page, 'title.fa', 'مقاله مرحله هشت');
  await fill(page, 'title.en', 'Stage8 private marker');
  await fill(page, 'excerpt.fa', 'خلاصه فارسی مرحله هشت');
  await fill(page, 'excerpt.en', 'Stage8 summary');
  await page.getByRole('button', { name: 'افزودن به بخش‌های مقاله' }).click();
  await page.getByLabel('نوع بخش').selectOption('p');
  await fill(page, 'blocks.0.text.fa', 'متن فارسی مقاله');
  await fill(page, 'blocks.0.text.en', 'Article body');
  await page.getByRole('button', { name: 'ایجاد محتوا', exact: true }).click();
  await expect(page.locator('.cms-editor [role=status]')).toContainText('ذخیره شد');
  await absent(page, slug, 'blog');
  await page.goto(`/admin/content?kind=post&slug=${slug}`);
  await page.getByLabel('پیش‌نویس', { exact: true }).uncheck();
  await save(page);
  for (const [locale, title] of [
    ['fa', 'مقاله مرحله هشت'],
    ['en', 'Stage8 private marker'],
  ]) {
    const res = await page.request.get(`/${locale}/blog/${slug}`);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(title);
    expect(html).toContain(`https://amirmahdi-najafi.ir/${locale}/blog/${slug}`);
  }
  const map = await page.request.get('/sitemap.xml');
  expect(await map.text()).toContain(`/en/blog/${slug}`);
  await page.goto('/en/blog');
  await page.locator('#post-search').fill('Stage8 private marker');
  await expect(page.getByRole('link', { name: /Stage8 private marker/ }).first()).toBeVisible();
  await page.goto(`/admin/content?kind=post&slug=${slug}`);
  await fill(page, 'title.en', 'Stage8 updated title');
  await fill(page, 'excerpt.en', 'Updated summary for metadata');
  await save(page);
  await page.goto(`/en/blog/${slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Stage8 updated title');
  await expect(page).toHaveTitle(/Stage8 updated title/);
  await expect(page.locator('meta[name=description]')).toHaveAttribute(
    'content',
    'Updated summary for metadata',
  );
  await page.goto(`/admin/content?kind=post&slug=${slug}`);
  await page.getByLabel('پیش‌نویس', { exact: true }).check();
  await save(page);
  await absent(page, slug, 'blog');
  await page.goto(`/admin/content?kind=post&slug=${slug}`);
  await page.getByText('تاریخچه و بازگردانی', { exact: true }).click();
  await page.locator('#revision').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'بازگردانی به پیش‌نویس' }).click();
  await expect(page.locator('details [role=status]')).toContainText('به پیش‌نویس');
  await absent(page, slug, 'blog');
  await page.goto(`/admin/content?kind=post&slug=${slug}`);
  await expect(page.locator('[id="cms-title.en"]')).toHaveValue('Stage8 private marker');
  await page.getByLabel('پیش‌نویس', { exact: true }).uncheck();
  await save(page);
  expect((await page.request.get(`/en/blog/${slug}`)).status()).toBe(200);
  // Leave this fixture private so the next device's absence checks are independent.
  await page.goto(`/admin/content?kind=post&slug=${slug}`);
  await page.getByLabel('پیش‌نویس', { exact: true }).check();
  await save(page);
});
test('project publication is independent of lifecycle and appears immediately after build', async ({
  page,
}, info) => {
  await login(page);
  const slug = `stage8-project-${info.project.name}`;
  await page.goto('/admin/content?kind=project');
  await fill(page, 'slug', slug);
  for (const field of ['name', 'category', 'role', 'summary', 'intro']) {
    await fill(page, `${field}.fa`, 'پروژه مرحله هشت');
    await fill(page, `${field}.en`, 'Stage8 project');
  }
  await page.getByLabel('وضعیت', { exact: true }).selectOption('live');
  await page.getByRole('button', { name: 'ایجاد محتوا', exact: true }).click();
  await expect(page.locator('.cms-editor [role=status]')).toContainText('ذخیره شد');
  await absent(page, slug, 'projects');
  await page.goto(`/admin/content?kind=project&slug=${slug}`);
  await page.getByLabel('پیش‌نویس', { exact: true }).uncheck();
  await save(page);
  for (const locale of ['en', 'fa'])
    expect((await page.request.get(`/${locale}/projects/${slug}`)).status()).toBe(200);
  expect(await (await page.request.get('/sitemap.xml')).text()).toContain(`/projects/${slug}`);
  await page.goto(`/admin/content?kind=project&slug=${slug}`);
  await fill(page, 'name.en', 'Updated project');
  await save(page);
  await page.goto(`/en/projects/${slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Updated project');
  await page.goto(`/admin/content?kind=project&slug=${slug}`);
  await page.getByLabel('پیش‌نویس', { exact: true }).check();
  await save(page);
  await absent(page, slug, 'projects');
});
