const { defineConfig } = require('@playwright/test');
const base = require('./playwright.config');

// Small browser-engine contract suite; the full Studio suite remains Chromium.
module.exports = defineConfig({
  ...base,
  outputDir: './test-results/compat',
  testDir: './systems/idenflu-mono/studio',
  testMatch: ['overlays.spec.cjs', 'select-binding-reset.spec.cjs', 'datetime-picker.spec.cjs'],
  grep: /native dialog, select|Select binding resets|datetime selection stays pending|datetime range rejects/,
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName,
    use: { browserName, viewport: { width: 1440, height: 1000 }, colorScheme: 'light', launchOptions: {} },
  })),
});
