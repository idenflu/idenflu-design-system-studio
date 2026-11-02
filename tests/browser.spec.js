const { test, expect } = require('@playwright/test');
const documents = require('../packages/react/studio/routes.json');

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
  const routes = documents.map(item => item.route);
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
  await expect(page.locator('.route-loading')).toBeVisible();
  const motion = await page.locator('.route-loading .spinner').first().evaluate((element) => getComputedStyle(element).animationName);
  expect(motion).toBe('none');
});

test('hover tooltip accepts pointer movement and Escape without trigger focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Touch devices have no persistent hover');
  await page.goto('/systems/idenflu-mono/index.html#/components/tooltip');
  await page.locator('#doc-title').focus();
  const wrap = page.locator('.route-tooltip .tooltip-wrap').first();
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
  await expect(page.getByRole('combobox', {name:'담당 팀: 디자인', exact:true})).toBeVisible();
  expect(await page.evaluate(() => typeof window.IdenfluMono)).toBe('undefined');
  await expect(page.locator('script[type="module"]')).toHaveCount(1);
  const response = await page.request.get('/dist/systems/idenflu-mono/manifest.json');
  const manifest = await response.json();
  const outcome = await page.evaluate(async (files) => {
    const frame = document.createElement('iframe');
    const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
    frame.srcdoc = `<form><div data-select id="consumer"><input type="hidden" value="a"><button type="button" class="select-trigger" role="combobox" aria-label="팀" aria-expanded="false"><span data-select-label>A</span></button><div class="select-popup" hidden><ul role="listbox"><li role="option" data-value="a" aria-selected="true">A</li><li role="option" data-value="b" aria-selected="false">B</li></ul></div></div></form><script src="/dist/systems/idenflu-mono/${files.runtime}"><\/script>`;
    document.body.append(frame);
    await loaded;
    const runtime = frame.contentWindow.IdenfluMono;
    const widget = runtime.get(frame.contentDocument.querySelector('#consumer'));
    widget.setValue('b'); const value = widget.getValue(); runtime.destroy(frame.contentDocument); frame.remove();
    return value;
  }, manifest.files);
  expect(outcome).toBe('b');
  expect(errors).toEqual([]);
});

for (const prefix of ['', '/dist']) {
  test(`old React preview redirects to canonical mono document (${prefix || 'dev'})`, async ({ page }) => {
    await page.goto(`${prefix}/packages/react/studio/index.html?source=bookmark#/components/loading`);
    await expect(page).toHaveURL(new RegExp(`${prefix}/systems/idenflu-mono/index\\.html\\?source=bookmark#/components/loading$`));
    await expect(page.getByRole('heading', {level:1})).toHaveText('Skeleton & spinner');
    await page.getByRole('link', {name:'디자인 시스템 갤러리'}).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/index\\.html#/gallery$`));
    await page.locator('a[href*="systems/idenflu-mono/index.html"]').first().click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/systems/idenflu-mono/index\\.html#/overview$`));
    await expect(page.getByRole('heading', {level:1})).toContainText('Form follows');
  });
}

for (const prefix of ['', '/dist']) {
  test(`foundation SVG icons resolve from the canonical document (${prefix || 'dev'})`, async ({page}) => {
    const failures = [];
    page.on('response', response => { if (response.status() >= 400 && /\.(svg|woff2)(?:$|\?)/.test(response.url())) failures.push(response.url()); });
    await page.goto(`${prefix}/systems/idenflu-mono/index.html#/foundations/icons`);
    const icons = page.locator('.react-studio-icons .ui-icon');
    await expect(icons).toHaveCount(47);
    const urls = await icons.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).maskImage.match(/url\(["']?(.*?)["']?\)/)?.[1]));
    for (const url of urls) {
      expect(url).toContain(`${prefix}/systems/idenflu-mono/assets/icons/idenflu/`);
      expect((await page.request.get(url)).ok(), url).toBe(true);
    }
    expect(failures).toEqual([]);
  });
}
