const { test, expect } = require('@playwright/test');

const route = '/systems/idenflu-mono/index.html#/components/data-grid';

test('API shortcuts keep the data-grid route and move keyboard focus to each section', async ({page}) => {
  await page.goto(route);
  for (const id of ['data-grid-props','data-grid-columns','data-grid-events','data-grid-styles','data-grid-behavior']) {
    await page.locator(`.studio-grid-reference-links a[href="#${id}"]`).click();
    await expect(page).toHaveURL(/#\/components\/data-grid$/);
    await expect(page.locator(`#${id}-title`)).toBeFocused();
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.getByRole('heading',{name:'Data grid',level:1})).toHaveCount(1);
});

test('API tables and code samples stay inside the page at narrow widths', async ({page,isMobile}) => {
  await page.goto(route);
  const reference = page.locator('#data-grid-props');
  await reference.scrollIntoViewIfNeeded();
  const table = reference.locator('.studio-grid-reference-table').first();
  await expect(table).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  if (isMobile) {
    const dimensions = await table.evaluate(element => ({available:element.clientWidth,extent:element.scrollWidth}));
    expect(dimensions.extent).toBeGreaterThan(dimensions.available);
    await table.focus();
    await table.press('ArrowRight');
    await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
  const code = page.locator('#data-grid-events .studio-grid-reference-code').first();
  await code.scrollIntoViewIfNeeded();
  await expect(code).toBeVisible();
  await code.focus();
  await expect(code).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
