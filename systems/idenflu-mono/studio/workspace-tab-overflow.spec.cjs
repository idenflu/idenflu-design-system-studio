const { test, expect } = require('@playwright/test');

const sample = '/systems/idenflu-mono/index.html?layout=sidebar';
const tabList = page => page.getByRole('tablist', { name: '열린 업무 화면', exact: true });
const scrollLeft = list => list.evaluate(element => element.scrollLeft);

async function expectSelectedTabInView(list) {
  await expect.poll(() => list.evaluate(element => {
    const selected = element.querySelector('[role="tab"][aria-selected="true"]');
    if (!selected) return false;
    const outer = element.getBoundingClientRect(), inner = selected.getBoundingClientRect();
    return inner.left >= outer.left - 1 && inner.right <= outer.right + 1;
  })).toBe(true);
}

test('workspace overflow controls scroll tabs without changing the selection', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 950, height: 900 });
  await page.goto(sample);
  const menu = page.locator('.layout-tree-navigation:visible');
  for (const label of ['진행 중 프로젝트', '검토 요청', '완료된 프로젝트', '마스터-디테일', '멤버 관리', '워크스페이스 설정', '알림 설정', '버티컬 탭 설정']) {
    await menu.getByRole('button', { name: label, exact: true }).click();
  }
  const list = tabList(page);
  const previous = page.getByRole('button', { name: '이전 탭 보기', exact: true });
  const next = page.getByRole('button', { name: '다음 탭 보기', exact: true });
  await expect(previous).toBeVisible();
  await expect(next).toBeVisible();
  await expect(page.getByRole('tab', { name: '버티컬 탭 설정', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expectSelectedTabInView(list);

  for (let i = 0; i < 10 && await previous.isEnabled(); i++) {
    const before = await scrollLeft(list);
    await previous.click();
    await expect.poll(() => scrollLeft(list)).toBeLessThan(before);
  }
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  expect(await scrollLeft(list)).toBeLessThanOrEqual(1);
  const selectedOutside = await list.evaluate(element => {
    const selected = element.querySelector('[role="tab"][aria-selected="true"]').getBoundingClientRect();
    return selected.left >= element.getBoundingClientRect().right;
  });
  expect(selectedOutside).toBe(true);

  await page.getByRole('button', { name: /업무 알림/ }).click();
  await expect.poll(() => scrollLeft(list)).toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  await expect.poll(() => scrollLeft(list)).toBeLessThanOrEqual(1);
  const content = page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
  await content.getByRole('textbox', { name: '워크스페이스 이름', exact: true }).fill('스크롤 유지 검증');
  await content.getByRole('button', { name: '변경사항 저장', exact: true }).click();
  await expect(content.getByRole('status')).toHaveText('변경사항을 저장했습니다.');
  await expect.poll(() => scrollLeft(list)).toBeLessThanOrEqual(1);
  const before = await scrollLeft(list);
  await next.click();
  await expect.poll(() => scrollLeft(list)).toBeGreaterThan(before);
  await expect(page.getByRole('tab', { name: '버티컬 탭 설정', exact: true })).toHaveAttribute('aria-selected', 'true');
  for (let i = 0; i < 10 && await next.isEnabled(); i++) {
    const beforeNext = await scrollLeft(list);
    await next.click();
    await expect.poll(() => scrollLeft(list)).toBeGreaterThan(beforeNext);
  }
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();

  await page.getByRole('button', { name: '열린 탭 메뉴', exact: true }).click();
  await page.getByRole('menuitem', { name: '진행 중 프로젝트', exact: true }).click();
  await expect(page.getByRole('tab', { name: '진행 중 프로젝트', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expectSelectedTabInView(list);
  await page.getByRole('tab', { name: '진행 중 프로젝트', exact: true }).focus();
  await page.keyboard.press('End');
  const last = page.getByRole('tab', { name: '버티컬 탭 설정', exact: true });
  await expect(last).toHaveAttribute('aria-selected', 'true');
  await expect(last).toBeFocused();
  await expectSelectedTabInView(list);

  await page.setViewportSize({ width: 2200, height: 900 });
  await expect(previous).toBeHidden();
  await expect(next).toBeHidden();
  await page.setViewportSize({ width: 950, height: 900 });
  await expect(previous).toBeVisible();
  await expect(next).toBeVisible();
  await expectSelectedTabInView(list);
});

test('workspace tabs do not show scroll controls when they fit', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(sample);
  await expect(page.getByRole('button', { name: '이전 탭 보기', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: '다음 탭 보기', exact: true })).toBeHidden();
  await expectSelectedTabInView(tabList(page));
});
