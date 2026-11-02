const { test, expect } = require('@playwright/test');
const documentCount = require('./dist/navigation.json').filter(route => !/^patterns\/(layout|page)\//.test(route)).length;

test('document chrome includes the original home, breadcrumb and footer', async ({ page, isMobile }) => {
  await page.goto('/packages/react/studio/index.html#/overview');
  await expect(page).toHaveTitle('Overview — idenflu mono');
  await expect(page.getByRole('heading', {level:1})).toHaveText(/Form follows\s*function\./);
  await expect(page.getByRole('navigation', {name:'현재 위치'})).toContainText('Getting started');
  await expect(page.getByRole('contentinfo')).toHaveText('idenflu mono38px height / 0px radius / 8px spacing');
  await expect(page.locator('.docs-topbar')).toHaveCSS('position', 'sticky');
  await expect(page.locator('.docs-topbar').getByRole('link', {name:'디자인 시스템 갤러리'})).toBeVisible();
  await expect(page.locator('.sidebar').getByRole('link', {name:'디자인 시스템 갤러리'})).toHaveCount(0);
  if (isMobile) await page.getByRole('button', {name:'메뉴', exact:true}).click();
  await expect(page.locator('.sidebar')).toHaveCSS('position', 'fixed');
  await expect(page.locator('#docs-search-status')).toHaveText(`${documentCount}개 문서`);
  await expect(page.locator('.topbar-gallery')).toHaveAttribute('href', '../../../index.html#/gallery');
  await expect(page.locator('#react-studio-nav')).toContainText('Patterns');
  await expect(page.locator('#react-studio-nav a[href*="patterns/layout/"]')).toHaveCount(0);
  await expect(page.locator('#react-studio-nav a[href*="patterns/page/"]')).toHaveCount(0);
});

test('document search supports Korean aliases, Enter, Escape and the slash shortcut', async ({ page, isMobile }) => {
  await page.goto('/packages/react/studio/index.html#/overview');
  await page.keyboard.press('/');
  const search = page.getByRole('searchbox', {name:'문서 검색'});
  await expect(search).toBeFocused();
  await search.fill('프리픽스');
  await expect(page.locator('#docs-search-status')).toHaveText('1개 문서');
  await expect(page.getByRole('link', {name:'Text fields', exact:true})).toBeVisible();
  await search.press('Enter');
  await expect(page).toHaveURL(/#\/components\/text-fields$/);
  await expect(page.getByRole('heading', {level:1})).toBeFocused();
  if (isMobile) await page.getByRole('button', {name:'메뉴', exact:true}).click();
  await search.focus();
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(page.locator('#docs-search-status')).toHaveText(`${documentCount}개 문서`);
  await search.fill('없는문서xyz');
  await expect(page.locator('#docs-search-status')).toHaveText('검색 결과가 없습니다.');
  await search.press('Escape');
  await expect(page.getByRole('link', {name:'Text fields', exact:true})).toBeVisible();
});

test('navigation remembers collapsed groups and selected links have no fill', async ({ page, isMobile }) => {
  await page.goto('/packages/react/studio/index.html#/components/text-fields');
  if (isMobile) await page.getByRole('button', {name:'메뉴', exact:true}).click();
  const foundations = page.locator('.nav-group').filter({has:page.locator('summary', {hasText:'Foundations'})});
  await foundations.locator('summary').click();
  await expect(foundations).toHaveAttribute('open', '');
  const search = page.getByRole('searchbox', {name:'문서 검색'});
  await search.fill('숫자');
  await search.press('Escape');
  await expect(foundations).toHaveAttribute('open', '');
  const active = page.locator('#react-studio-nav [aria-current="page"]');
  await expect(active).toHaveText('Text fields');
  await expect(active).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await foundations.locator('summary').click();
  await expect(foundations).not.toHaveAttribute('open', '');
});

test('mobile menu traps focus, dismisses on Escape and restores focus', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 메뉴 동작');
  await page.goto('/packages/react/studio/index.html#/overview');
  const trigger = page.getByRole('button', {name:'메뉴', exact:true});
  await trigger.click();
  const sidebar = page.getByRole('dialog', {name:'문서 메뉴'});
  await expect(sidebar).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('#docs-main')).toHaveJSProperty('inert', true);
  await sidebar.getByRole('link', {name:'idenflu mono 홈'}).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(sidebar.locator('.nav-group > summary').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(sidebar.getByRole('link', {name:'idenflu mono 홈'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sidebar).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('#docs-main')).toHaveJSProperty('inert', false);
  await trigger.click();
  await page.locator('.sidebar-backdrop').click({position:{x:310,y:400}});
  await expect(trigger).toBeFocused();
  await expect(page.locator('.sidebar')).toHaveJSProperty('inert', true);
});

test('TOC and document pagination move focus and use the visible menu order', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/text-fields');
  const link = page.getByRole('navigation', {name:'이 페이지 목차'}).getByRole('link', {name:'아이콘과 입력 보조'});
  await link.click();
  await expect(page.getByRole('heading', {name:'아이콘과 입력 보조', exact:true})).toBeFocused();
  await expect(page).toHaveURL(/#\/components\/text-fields$/);
  await page.locator('#next-doc').click();
  await expect(page).toHaveURL(/#\/components\/number-fields$/);
  await expect(page.getByRole('heading', {level:1})).toBeFocused();
  await expect(page.getByRole('navigation', {name:'현재 위치'})).toContainText('Number fields');
  await page.goto('/packages/react/studio/index.html#/components/card');
  await expect(page.locator('#next-doc')).toHaveAttribute('href','#/patterns/form/basic');
  await page.goto('/packages/react/studio/index.html#/patterns/empty-state');
  await expect(page.locator('#next-doc')).toHaveCount(0);
});

test('preferences update sidebar, overview and footer summaries together', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/overview');
  await page.getByRole('button', {name:'화면 조정', exact:true}).click();
  const dialog = page.getByRole('dialog', {name:'화면 조정'});
  await dialog.getByRole('slider', {name:/글자 크기/}).fill('18');
  await dialog.getByRole('slider', {name:/여백/}).fill('150');
  await expect(page.locator('.sidebar-footer')).toContainText('18px type');
  await expect(page.locator('.overview-facts')).toContainText('18px /');
  await expect(page.locator('.docs-footer')).toContainText('12px spacing');
  await dialog.getByRole('button', {name:'화면 조정 닫기', exact:true}).click();
  await expect(page.getByRole('button', {name:'화면 조정', exact:true})).toBeFocused();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test('legacy route aliases resolve to a canonical document and history remains usable', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/foundations');
  await expect(page).toHaveURL(/#\/foundations\/colors$/);
  await page.evaluate(() => { location.hash = '#/components'; });
  await expect(page).toHaveURL(/#\/components\/buttons$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/foundations\/colors$/);
  await expect(page.getByRole('heading', {level:1})).toHaveText('Colors');
  await page.evaluate(() => { location.hash = '#/not-found'; });
  await expect(page).toHaveURL(/#\/overview$/);
});
