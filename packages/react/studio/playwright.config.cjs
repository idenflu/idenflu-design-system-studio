const base = require('../../../playwright.config.js');
const path = require('node:path');
module.exports = { ...base, testDir: '.', testMatch: '**/*.spec.cjs', reporter: [['list']], use: { ...base.use, ...(process.env.IDENFLU_TEST_CHROMIUM ? { launchOptions: { executablePath: process.env.IDENFLU_TEST_CHROMIUM } } : {}) }, webServer: { ...base.webServer, cwd: path.resolve(__dirname, '../../..') } };
