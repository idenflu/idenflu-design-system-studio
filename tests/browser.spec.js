const { test, expect } = require('@playwright/test');
const { readdirSync } = require('node:fs');
const { resolve } = require('node:path');
const documents = require('../packages/react/studio/routes.json');
const iconNames = readdirSync(resolve(__dirname, '../systems/idenflu-mono/assets/icons/idenflu'))
  .filter(name => name.endsWith('.svg')).map(name => name.slice(0, -4)).sort();
const newOutlineNames = ['home', 'folder', 'edit', 'save', 'external-link', 'refresh', 'bell', 'chat', 'heart', 'star', 'bookmark', 'image', 'attachment', 'globe', 'users', 'shield-check', 'dashboard', 'chart-bar', 'chart-line', 'cart', 'credit-card', 'receipt', 'tag', 'briefcase', 'camera', 'location', 'send', 'help-circle', 'logout', 'undo', 'redo', 'sort'];
const newFilledNames = ['home', 'folder', 'bell', 'chat', 'heart', 'star', 'bookmark', 'image', 'users', 'shield-check', 'dashboard', 'cart', 'credit-card', 'receipt', 'tag', 'briefcase', 'camera', 'location', 'send', 'help-circle'].map(name => `${name}-fill`);
const newIconNames = [...newOutlineNames, ...newFilledNames];

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

test('built React documentation works without the legacy HTML runtime', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/dist/systems/idenflu-mono/index.html#/components/select');
  await expect(page.getByRole('combobox', {name:'담당 팀: 디자인', exact:true})).toBeVisible();
  expect(await page.evaluate(() => typeof window.IdenfluMono)).toBe('undefined');
  await expect(page.locator('script[type="module"]')).toHaveCount(1);
  const response = await page.request.get('/dist/systems/idenflu-mono/manifest.json');
  const manifest = await response.json();
  expect(manifest.files.runtime).toBeUndefined();
  expect(manifest.files.styles).toBeUndefined();
  await page.getByRole('combobox', {name:'담당 팀: 디자인', exact:true}).click();
  await page.getByRole('option', {name:'개발', exact:true}).click();
  await expect(page.getByRole('combobox', {name:'담당 팀: 개발', exact:true})).toBeVisible();
  for (const file of ['runtime.js', 'components.js', 'script.js']) {
    expect((await page.request.get(`/systems/idenflu-mono/${file}`)).status()).toBe(404);
  }
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
    await expect(icons).toHaveCount(iconNames.length);
    await expect(page.locator('.react-studio-icons li > span:last-child')).toHaveText(iconNames);
    expect(iconNames).toEqual(expect.arrayContaining(newIconNames));
    for (const name of iconNames) {
      const icon = page.locator(`.react-studio-icons .icon-${name}`);
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      const url = await icon.evaluate(node => getComputedStyle(node).maskImage.match(/url\(["']?(.*?)["']?\)/)?.[1]);
      expect(url, name).toBeTruthy();
      expect(new URL(url).pathname, name).toBe(`${prefix}/systems/idenflu-mono/assets/icons/idenflu/${name}.svg`);
      expect((await page.request.get(url)).ok(), name).toBe(true);
    }
    const types = page.getByRole('group', {name: '아이콘 유형'});
    await types.getByRole('button', {name: 'Filled', exact: true}).click();
    await expect(icons).toHaveCount(iconNames.filter(name => name.endsWith('-fill')).length);
    const search = page.getByRole('searchbox', {name: '아이콘 검색'});
    await search.fill('bookmark');
    await expect(page.locator('.react-studio-icons li > span:last-child')).toHaveText(['bookmark-fill']);
    await types.getByRole('button', {name: 'Outline', exact: true}).click();
    await expect(page.locator('.react-studio-icons li > span:last-child')).toHaveText(['bookmark']);
    await search.fill('');
    await expect(icons).toHaveCount(iconNames.filter(name => !name.endsWith('-fill')).length);
    await types.getByRole('button', {name: '전체', exact: true}).click();
    await expect(icons).toHaveCount(iconNames.length);
    await search.fill('no-such-icon');
    await expect(icons).toHaveCount(0);
    await expect(page.getByRole('status').filter({hasText: '검색 결과가 없습니다.'})).toBeVisible();
    const bookmark = page.getByRole('button', {name: '북마크', exact: true});
    await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
    await expect(bookmark.locator('.icon-bookmark')).toHaveCount(1);
    await bookmark.click();
    await expect(bookmark).toHaveAttribute('aria-pressed', 'true');
    await expect(bookmark.locator('.icon-bookmark-fill')).toHaveCount(1);
    await bookmark.click();
    await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
    await expect(bookmark.locator('.icon-bookmark')).toHaveCount(1);
    expect(failures).toEqual([]);
  });
}
