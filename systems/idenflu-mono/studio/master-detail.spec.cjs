const { test, expect } = require('@playwright/test');

const sample = '/systems/idenflu-mono/index.html?layout=sidebar';
const panel = page => page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');

async function openMasterDetail(page) {
  await page.goto(sample);
  const menu = page.locator('.layout-tree-navigation:visible');
  await menu.getByRole('button', { name: '마스터-디테일', exact: true }).click();
  await expect(panel(page).getByRole('heading', { name: '마스터-디테일', exact: true })).toBeVisible();
  return { menu, content: panel(page) };
}

test('master-detail shows the selected project beside its list and reuses its tab', async ({ page, isMobile }) => {
  test.skip(isMobile);
  const { menu, content } = await openMasterDetail(page);
  const list = content.getByRole('group', { name: '프로젝트 목록', exact: true });
  const detail = content.getByRole('region', { name: '프로젝트 상세', exact: true });
  const first = list.getByRole('button', { name: '디자인 시스템 v2 PRJ-001', exact: true });
  const second = list.getByRole('button', { name: '모바일 앱 온보딩 PRJ-002', exact: true });
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(detail.getByRole('heading', { name: '디자인 시스템 v2', exact: true })).toBeVisible();
  const listBox = await list.boundingBox(), detailBox = await detail.boundingBox();
  expect(listBox.x + listBox.width).toBeLessThanOrEqual(detailBox.x);

  await second.click();
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await expect(detail.getByRole('heading', { name: '모바일 앱 온보딩', exact: true })).toBeVisible();
  await menu.getByRole('button', { name: '마스터-디테일', exact: true }).click();
  await expect(page.getByRole('tab', { name: '마스터-디테일', exact: true })).toHaveCount(1);
  await expect(detail.getByRole('heading', { name: '모바일 앱 온보딩', exact: true })).toBeVisible();
});

test('master-detail filters the list, updates detail and handles no matches', async ({ page, isMobile }) => {
  test.skip(isMobile);
  const { content } = await openMasterDetail(page);
  const search = content.getByRole('searchbox', { name: '프로젝트 검색', exact: true });
  const list = content.getByRole('group', { name: '프로젝트 목록', exact: true });
  const detail = content.getByRole('region', { name: '프로젝트 상세', exact: true });
  await search.fill('파트너 포털');
  await expect(list.getByRole('button', { name: '파트너 포털 PRJ-003', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(detail.getByRole('heading', { name: '파트너 포털', exact: true })).toBeVisible();
  await search.fill('검색 결과가 없는 프로젝트');
  await expect(content.getByText('검색 결과가 없습니다.', { exact: true })).toBeVisible();
  await expect(content.getByText('프로젝트를 찾을 수 없습니다.', { exact: true })).toBeVisible();
  await search.clear();
  await expect(list.getByRole('button', { name: '디자인 시스템 v2 PRJ-001', exact: true })).toBeVisible();
});

test('editing the detail updates the shared project list', async ({ page, isMobile }) => {
  test.skip(isMobile);
  const { menu, content } = await openMasterDetail(page);
  const detail = content.getByRole('region', { name: '프로젝트 상세', exact: true });
  await detail.getByRole('combobox', { name: '프로젝트 상태: 진행 중', exact: true }).click();
  await detail.getByRole('option', { name: '완료', exact: true }).click();
  await expect(detail.getByRole('combobox', { name: '프로젝트 상태: 완료', exact: true })).toBeVisible();
  await menu.getByRole('button', { name: '전체 프로젝트', exact: true }).click();
  await expect(panel(page).locator('.data-grid-table tbody tr').filter({ hasText: '디자인 시스템 v2' })).toContainText('완료');
});

test('detail fields adapt to their panel width without truncating current values', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 950, height: 900 });
  const { content } = await openMasterDetail(page);
  const detail = content.getByRole('region', { name: '프로젝트 상세', exact: true });
  const state = detail.getByRole('combobox', { name: '프로젝트 상태: 진행 중', exact: true });
  const team = detail.getByRole('combobox', { name: '담당 팀: 프로덕트 디자인', exact: true });
  const due = detail.getByRole('textbox', { name: '목표 마감일', exact: true });
  const fits = async () => {
    expect(await team.locator('.select-value-text').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(due).toHaveValue('2026-11-12');
    expect(await due.evaluate(element => {
      const style = getComputedStyle(element);
      const context = document.createElement('canvas').getContext('2d');
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const available = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      return context.measureText(element.value).width <= available;
    })).toBe(true);
  };
  const narrowState = await state.boundingBox(), narrowTeam = await team.boundingBox();
  expect(narrowTeam.x).toBeCloseTo(narrowState.x, 1);
  expect(narrowTeam.y).toBeGreaterThan(narrowState.y + narrowState.height);
  await fits();
  expect(await content.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 1440, height: 900 });
  const wideState = await state.boundingBox(), wideTeam = await team.boundingBox();
  expect(wideTeam.y).toBeCloseTo(wideState.y, 1);
  expect(wideState.x + wideState.width).toBeLessThanOrEqual(wideTeam.x);
  await fits();
});
