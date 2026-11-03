const { test, expect } = require('@playwright/test');

const sample = '/systems/idenflu-mono/index.html?layout=sidebar';
const activePanel = page => page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');

async function expectNoOuterOverflow(page) {
  const panel = activePanel(page);
  const grid = panel.locator('.data-grid');
  await expect.poll(() => panel.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  await expect.poll(() => grid.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

for (const [width, height] of [[1687, 1126], [1440, 900]]) {
  test(`workspace grid tooltips do not create horizontal overflow at ${width}px`, async ({ page, isMobile }) => {
    test.skip(isMobile);
    await page.setViewportSize({ width, height });
    await page.goto(sample);
    const grid = activePanel(page).locator('.data-grid');
    await expect(grid).toBeVisible();
    await expectNoOuterOverflow(page);
    for (const name of ['촘촘한 행 간격', 'CSV 내보내기']) {
      const button = grid.getByRole('button', { name, exact: true });
      await button.hover();
      await expect(button.locator('..').getByRole('tooltip')).toBeVisible();
      await expectNoOuterOverflow(page);
    }
  });
}

test('narrow desktop retains working horizontal scrolling inside the grid', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 1024, height: 720 });
  await page.goto(sample);
  const grid = activePanel(page).locator('.data-grid');
  const scroll = grid.locator('.data-grid-scroll');
  await expect.poll(() => scroll.evaluate(element => element.scrollWidth - element.clientWidth)).toBeGreaterThan(0);
  await expectNoOuterOverflow(page);
  await scroll.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await expect.poll(() => scroll.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await expectNoOuterOverflow(page);
});
