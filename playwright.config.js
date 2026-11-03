const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 90000,
  globalTimeout: 10 * 60 * 1000,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { ...(process.env.IDENFLU_TEST_CHROMIUM ? { launchOptions: { executablePath: process.env.IDENFLU_TEST_CHROMIUM } } : {}), baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop-light', grepInvert: /@mobile-only\b/, use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 }, colorScheme: 'light' } },
    { name: 'desktop-dark', grep: /@theme\b/, use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' } },
    { name: 'mobile', grep: /@mobile\b/, use: { browserName: 'chromium', viewport: { width: 320, height: 740 }, colorScheme: 'light', isMobile: true, hasTouch: true } },
  ],
  webServer: { command: process.env.CI ? 'node scripts/serve.mjs' : 'npm run dev', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
