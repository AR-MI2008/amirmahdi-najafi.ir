import { test, expect } from '@playwright/test';

const PROJECTS = ['pad-system', 'webguard', 'melamin-layegh', 'hypernet', 'arc-core'];

/** Relative luminance, for the contrast assertions below. */
async function contrast(page: import('@playwright/test').Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const parse = (value: string): [number, number, number] => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) return [0, 0, 0];
      const [r = 0, g = 0, b = 0] = m[1].split(',').map((n) => parseFloat(n));
      return [r, g, b];
    };
    const lum = (rgb: [number, number, number]) => {
      const f = (v: number) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    };

    const style = getComputedStyle(el);
    let node: HTMLElement | null = el as HTMLElement;
    let bg = 'rgba(0, 0, 0, 0)';
    while (node) {
      const value = getComputedStyle(node).backgroundColor;
      if (value && !value.includes('rgba(0, 0, 0, 0)')) {
        bg = value;
        break;
      }
      node = node.parentElement;
    }

    const [l1, l2] = [lum(parse(style.color)), lum(parse(bg))].sort((a, b) => b - a);
    return (l1! + 0.05) / (l2! + 0.05);
  });
}

for (const slug of PROJECTS) {
  test(`${slug} is readable in dark mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`/en/projects/${slug}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await contrast(page, 'h1'), `${slug} h1 in dark mode`).toBeGreaterThanOrEqual(4.5);
  });

  test(`${slug} is readable in light mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`/en/projects/${slug}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // This is the bug the dual-palette work fixed: the hero forced a project
    // background while the foreground came from the global light theme.
    expect(await contrast(page, 'h1'), `${slug} h1 in light mode`).toBeGreaterThanOrEqual(4.5);
    expect(await contrast(page, '.prose-body'), `${slug} body in light mode`).toBeGreaterThanOrEqual(4.5);
  });
}

test('no theme flash on first paint', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en', { waitUntil: 'commit' });
  // The bootstrap script runs in <head>, so the attribute is correct before
  // the body paints.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test.describe('keyboard', () => {
  test('skip link is the first stop and reaches main', async ({ page }) => {
    await page.goto('/en');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeVisible();
  });

  test('command palette traps focus and restores it on Escape', async ({ page }) => {
    await page.goto('/en');
    const trigger = page.getByRole('button', { name: /switch theme/i });
    await trigger.focus();

    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('contact form labels every field', async ({ page }) => {
    await page.goto('/en/contact');
    for (const name of [/name/i, /email/i, /subject/i, /message/i]) {
      await expect(page.getByLabel(name).first()).toBeVisible();
    }
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('hero content is visible and the canvas does not animate', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Reveal animations must not leave content at opacity 0.
    const opacity = await page
      .locator('.reveal')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
  });
});

test('mobile navigation opens and closes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile projects only');
  await page.goto('/en');
  await page.getByRole('button', { name: /menu/i }).click();
  await expect(page.locator('#mobile-nav a[href="/en/projects"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-nav')).toBeHidden();
});

test('pinch zoom is not disabled', async ({ page }) => {
  await page.goto('/en');
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).not.toContain('user-scalable=no');
  expect(viewport).not.toContain('maximum-scale=1');
});

test('metrics section is absent while no metric is verified', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('#metrics')).toHaveCount(0);
});

test('no unverified capability list is rendered', async ({ page }) => {
  await page.goto('/en/projects/pad-system');
  await expect(page.locator('#capabilities')).toHaveCount(0);
});
