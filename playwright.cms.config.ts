import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: process.env.CMS_E2E_PUBLIC === 'true' ? './tests/e2e' : './tests/cms-e2e',
  fullyParallel: false,
  // Some existing SEO cases visit ten routes in one test.
  timeout: 60_000,
  workers: process.env.CMS_E2E_PUBLIC === 'true' ? 2 : 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/cms', open: 'never' }]],
  use: {
    baseURL: 'https://localhost:3447',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    channel: process.env.CMS_E2E_CHANNEL || undefined,
  },
  projects: [
    { name: 'cms-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'cms-mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'node tests/support/cms-server.mjs',
    url: 'https://localhost:3447/admin/login',
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
