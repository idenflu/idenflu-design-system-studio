const { test, expect } = require('@playwright/test');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const documents = require('../systems/idenflu-mono/studio/routes.json');
const sprite = readFileSync(resolve(__dirname, '../packages/idenflu-mono-react/assets/icons/icons.svg'), 'utf8');
const iconNames = [...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]).sort();

test('every route has one heading and no page overflow', {tag:'@mobile'}, async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/systems/idenflu-mono/index.html#/overview');
  for (const {route, title} of documents) {
    await page.evaluate((value) => { location.hash = `#/${value}`; }, route);
    await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
    await expect(page.locator('h1:visible')).toHaveCount(1);
    await expect(page.getByRole('heading', {level:1})).toHaveText(route === 'overview' ? /Form follows\s*function\./ : title);
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

test('tooltip delays pointer enter and leave and cancels pending actions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Touch devices have no persistent hover');
  await page.goto('/systems/idenflu-mono/index.html#/components/tooltip');
  const button = page.getByRole('button', {name: '지연 툴팁'});
  const tooltip = button.locator('..').getByRole('tooltip', {includeHidden: true});
  await button.hover();
  await expect(tooltip).toBeHidden();
  await expect(tooltip).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toBeHidden();
  await button.hover();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await expect(tooltip).toBeHidden();
  await button.focus();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
});

test('built React documentation works without the legacy HTML runtime', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/dist/systems/idenflu-mono/index.html#/components/select');
  const basicSelect = page.locator('.react-studio-section').filter({has:page.getByRole('heading', {level:2, name:'기본 선택', exact:true})});
  await expect(basicSelect.getByRole('combobox', {name:'담당 팀: 디자인', exact:true})).toBeVisible();
  expect(await page.evaluate(() => typeof window.IdenfluMono)).toBe('undefined');
  await expect(page.locator('script[type="module"]')).toHaveCount(1);
  const response = await page.request.get('/dist/systems/idenflu-mono/manifest.json');
  const manifest = await response.json();
  expect(manifest.files.runtime).toBeUndefined();
  expect(manifest.files.styles).toBeUndefined();
  await basicSelect.getByRole('combobox', {name:'담당 팀: 디자인', exact:true}).click();
  await basicSelect.getByRole('option', {name:'개발', exact:true}).click();
  await expect(basicSelect.getByRole('combobox', {name:'담당 팀: 개발', exact:true})).toBeVisible();
  for (const file of ['runtime.js', 'components.js', 'script.js']) {
    expect((await page.request.get(`/systems/idenflu-mono/${file}`)).status()).toBe(404);
  }
  expect(errors).toEqual([]);
});

for (const prefix of ['', '/dist']) {
  test(`foundation icons use the sprite catalog (${prefix || 'dev'})`, async ({page}) => {
    const failures = [];
    page.on('response', response => { if (response.status() >= 400 && /\.svg(?:$|\?)/.test(response.url())) failures.push(response.url()); });
    await page.goto(`${prefix}/systems/idenflu-mono/index.html#/foundations/icons`);
    const icons = page.locator('.react-studio-icons .ui-icon');
    await expect(icons).toHaveCount(iconNames.length);
    for (const name of iconNames) {
      const icon = page.locator(`.react-studio-icons .icon-${name}`);
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(await icon.evaluate(node => getComputedStyle(node).maskImage), name).toContain('data:image/svg+xml');
    }
    const search = page.getByRole('searchbox', {name:'아이콘 검색'});
    await search.fill('BookmarkIcon');
    await expect(page.locator('.react-studio-icons li')).toHaveCount(1);
    await expect(page.locator('.react-studio-icons li')).toContainText('bookmark');
    await expect(page.getByText('<Icon name="save" />', {exact:false})).toBeVisible();
    await expect(page.getByText('<SaveIcon />', {exact:false}).first()).toBeVisible();
    expect(failures).toEqual([]);
  });
}

for (const prefix of ['', '/dist']) {
  test(`root gallery opens the current mono components (${prefix || 'dev'})`, {tag:'@mobile'}, async ({page,isMobile}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${prefix}/index.html`);
    await page.getByRole('link', {name:'idenflu mono 디자인 시스템 보기'}).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/systems/idenflu-mono/index\\.html#/overview$`));
    for (const route of ['components/data-grid', 'components/time-picker']) {
      const title = documents.find(item => item.route === route).title;
      if (isMobile) await page.getByRole('button', {name:'메뉴',exact:true}).click();
      const search = page.getByRole('searchbox', {name:'문서 검색'});
      await search.fill(title);
      await search.press('Enter');
      await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
      await expect(page.getByRole('heading', {level:1})).toHaveText(title);
      await expect(page.getByRole('heading', {level:1})).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
  test(`root documentation bookmarks preserve query and route (${prefix || 'dev'})`, async ({page}) => {
    await page.goto(`${prefix}/index.html?source=bookmark#/components/time-picker`);
    await expect(page).toHaveURL(new RegExp(`${prefix}/systems/idenflu-mono/index\\.html\\?source=bookmark#/components/time-picker$`));
    await expect(page.locator('[data-route="components/time-picker"]')).toBeVisible();
  });
}
