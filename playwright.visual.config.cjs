const { defineConfig } = require('@playwright/test');
const base = require('./playwright.config');

module.exports = defineConfig({
  ...base,
  outputDir: './test-results/visual',
  testDir: './tests/visual',
  testMatch: '**/*.spec.cjs',
  snapshotPathTemplate: '{testDir}/baselines/{platform}/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0.002 } },
  projects: ['light', 'dark'].map(theme => ({
    name: theme,
    use: { browserName: 'chromium', viewport: { width: 1080, height: 1000 }, colorScheme: theme, deviceScaleFactor: 1, launchOptions: base.use.launchOptions ?? {} },
  })),
});
