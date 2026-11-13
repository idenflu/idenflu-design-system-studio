const {test, expect} = require('@playwright/test');

const url = '/systems/idenflu-mono/index.html#/components/drawer';
const choose = async (page, field, option) => {
  await page.getByRole('combobox', {name:new RegExp(`^${field}:`)}).click();
  await page.getByRole('option', {name:option, exact:true}).click();
};
const settle = dialog => dialog.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));

test('drawer edges and preset or pixel sizes fit the viewport', {tag:'@mobile'}, async ({page}) => {
  await page.goto(url);
  const opener = page.getByRole('button', {name:'패널 미리보기', exact:true});
  const viewport = page.viewportSize();
  for (const [side, label] of [['right','오른쪽'],['left','왼쪽'],['top','위쪽'],['bottom','아래쪽']]) {
    await choose(page, '패널 위치', label);
    await opener.click();
    const drawer = page.getByRole('dialog', {name:`${label} 패널`, exact:true});
    await expect(drawer).toBeVisible();
    await settle(drawer);
    const bounds = await drawer.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
    if (side === 'right') expect(bounds.x + bounds.width).toBeCloseTo(viewport.width, 0);
    if (side === 'left') expect(bounds.x).toBeCloseTo(0, 0);
    if (side === 'top') expect(bounds.y).toBeCloseTo(0, 0);
    if (side === 'bottom') expect(bounds.y + bounds.height).toBeCloseTo(viewport.height, 0);
    expect(side === 'left' || side === 'right' ? bounds.width : bounds.height).toBeCloseTo(Math.min(480, side === 'left' || side === 'right' ? viewport.width : viewport.height), 0);
    await expect(drawer.getByRole('button', {name:'확인', exact:true})).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
  }
  await choose(page, '패널 위치', '오른쪽');
  for (const [label, pixels] of [['SM · 320px',320],['LG · 640px',640],['사용자 지정 · 560px',560],['전체 화면',viewport.width]]) {
    await choose(page, '패널 크기', label);
    await opener.click();
    const drawer = page.getByRole('dialog', {name:'오른쪽 패널', exact:true});
    await settle(drawer);
    expect((await drawer.boundingBox()).width).toBeCloseTo(Math.min(pixels, viewport.width), 0);
    await drawer.getByRole('button', {name:'패널 닫기', exact:true}).click();
    await expect(opener).toBeFocused();
  }
  await choose(page, '패널 위치', '아래쪽');
  await opener.click();
  const full = page.getByRole('dialog', {name:'아래쪽 패널', exact:true});
  await settle(full);
  expect((await full.boundingBox()).height).toBeCloseTo(viewport.height, 0);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('drawer keeps its header and actions fixed and closes nested layers one at a time', {tag:'@mobile'}, async ({page}) => {
  await page.goto(url);
  const opener = page.getByRole('button', {name:'알림 설정 열기', exact:true});
  await opener.click();
  const drawer = page.getByRole('dialog', {name:'알림 설정', exact:true});
  await settle(drawer);
  const body = drawer.locator('.drawer-body'), header = drawer.locator('.drawer-header'), footer = drawer.locator('.drawer-footer');
  const headerBefore = await header.boundingBox(), footerBefore = await footer.boundingBox();
  await drawer.getByRole('button', {name:'달력 열기', exact:true}).click();
  await expect(page.getByRole('dialog', {name:'날짜 선택 달력', exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', {name:'날짜 선택 달력', exact:true})).toBeHidden();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', {name:'달력 열기', exact:true})).toBeFocused();
  await body.focus();
  await body.press('End');
  await expect.poll(() => body.evaluate(element => element.scrollTop > 0 && Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 1)).toBe(true);
  expect((await header.boundingBox()).y).toBeCloseTo(headerBefore.y, 0);
  expect((await footer.boundingBox()).y).toBeCloseTo(footerBefore.y, 0);
  const scrollTop = await body.evaluate(element => element.scrollTop);
  const apply = footer.getByRole('button', {name:'설정 적용', exact:true});
  await apply.click();
  const confirm = page.getByRole('dialog', {name:'알림 설정 적용', exact:true});
  await expect(confirm).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(confirm).toBeHidden();
  await expect(apply).toBeFocused();
  expect(await body.evaluate(element => element.scrollTop)).toBe(scrollTop);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).toBe('hidden');
  await apply.click();
  await confirm.getByRole('button', {name:'적용', exact:true}).click();
  await expect(confirm).toBeHidden();
  await expect(drawer).toBeVisible();
  await apply.focus();
  await page.keyboard.press('Tab');
  await expect(drawer.getByRole('button', {name:'패널 닫기', exact:true})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden');
  await expect(page.getByText('알림 설정을 적용했습니다.', {exact:true})).toBeVisible();
});

test('drawer backdrop dismissal remains optional and reduced motion removes the entrance effect', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(url);
  const opener = page.getByRole('button', {name:'상세 정보 열기', exact:true});
  await opener.click();
  const settings = page.getByRole('dialog', {name:'프로젝트 설정', exact:true});
  await expect(settings).toHaveCSS('animation-name', 'none');
  await expect(settings.getByRole('textbox', {name:'프로젝트 이름'})).toBeFocused();
  await page.mouse.click(8, 100);
  await expect(settings).toBeHidden();
  await expect(opener).toBeFocused();
  await page.getByRole('button', {name:'알림 설정 열기', exact:true}).click();
  const notifications = page.getByRole('dialog', {name:'알림 설정', exact:true});
  await page.mouse.click(8, 100);
  await expect(notifications).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(notifications).toBeHidden();
});
