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
