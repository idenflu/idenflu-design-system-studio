const { test, expect } = require('@playwright/test');

test('component behavior and consumer lifecycle regression suite', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/idenflu-mono-regression.html');
  await page.waitForFunction(() => ['passed', 'failed'].includes(document.documentElement.dataset.testState));
  const failures = await page.evaluate(() => window.regressionResults.filter((result) => !result.passed));
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
});

test('every route has one heading and no page overflow', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/systems/idenflu-mono/index.html#/overview');
  const routes = await page.locator('[data-route]').evaluateAll((views) => views.map((view) => view.dataset.route));
  for (const route of routes) {
    await page.evaluate((value) => { location.hash = `#/${value}`; }, route);
    await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
    await expect(page.locator('h1:visible')).toHaveCount(1);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll, route).toBeLessThanOrEqual(dimensions.width);
  }
  expect(errors).toEqual([]);
  for (const route of ['components/select', 'patterns/data-states']) {
    await page.evaluate((value) => { location.hash = `#/${value}`; }, route);
    await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
    const image = await page.screenshot({ fullPage: false });
    await testInfo.attach(route.replaceAll('/', '-') + '.png', { body: image, contentType: 'image/png' });
  }
});

test('system high contrast and reduced motion retain focus and state', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/systems/idenflu-mono/index.html#/components/buttons');
  const button = page.locator('[data-route="components/buttons"] button').first();
  await button.focus();
  await page.keyboard.press('Tab');
  expect(await page.locator(':focus').evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.evaluate(() => { location.hash = '#/components/loading'; });
  await expect(page.locator('#view-loading')).toBeVisible();
  const motion = await page.locator('#view-loading .spinner').first().evaluate((element) => getComputedStyle(element).animationName);
  expect(motion).toBe('none');
});

test('hover tooltip accepts pointer movement and Escape without trigger focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Touch devices have no persistent hover');
  await page.goto('/systems/idenflu-mono/index.html#/components/tooltip');
  await page.locator('#doc-title').focus();
  const wrap = page.locator('#view-tooltip .tooltip-wrap').first();
  await wrap.locator('button').hover();
  const content = wrap.locator('.tooltip-content');
  await expect(content).toBeVisible();
  await content.hover();
  await expect(content).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(content).toBeHidden();
});

test('built documentation and portable bundle work without demo dependencies', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/dist/systems/idenflu-mono/index.html#/components/select');
  await expect(page.locator('#team-select')).toBeVisible();
  expect(await page.evaluate(() => Boolean(IdenfluMono.get(document.querySelector('[data-select]'))))).toBe(true);
  await expect(page.locator('[data-component-guide]')).toHaveCount(25);
  const response = await page.request.get('/dist/systems/idenflu-mono/manifest.json');
  const manifest = await response.json();
  const outcome = await page.evaluate(async (files) => {
    const frame = document.createElement('iframe'); document.body.append(frame);
    const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
    frame.srcdoc = `<form><div data-select id="consumer"><input type="hidden" value="a"><button type="button" class="select-trigger" role="combobox" aria-label="팀" aria-expanded="false"><span data-select-label>A</span></button><div class="select-popup" hidden><ul role="listbox"><li role="option" data-value="a" aria-selected="true">A</li><li role="option" data-value="b" aria-selected="false">B</li></ul></div></div></form><script src="/dist/systems/idenflu-mono/${files.runtime}"><\/script>`;
    await loaded;
    const runtime = frame.contentWindow.IdenfluMono;
    const widget = runtime.get(frame.contentDocument.querySelector('#consumer'));
    widget.setValue('b'); const value = widget.getValue(); runtime.destroy(frame.contentDocument); frame.remove();
    return value;
  }, manifest.files);
  expect(outcome).toBe('b');
  expect(errors).toEqual([]);
});
