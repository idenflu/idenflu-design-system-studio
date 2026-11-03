const { test, expect } = require('@playwright/test');

const sample = '/systems/idenflu-mono/index.html?layout=sidebar';
const panel = page => page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');

async function navigate(page, label) {
  await page.locator('.layout-tree-navigation:visible').getByRole('button', { name: label, exact: true }).click();
  await expect(panel(page).getByRole('heading', { level: 1, name: label, exact: true })).toBeVisible();
}

test('vertical settings uses keyboard navigation and shares general settings with already-open tabs', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto(sample);
  await navigate(page, '워크스페이스 설정');
  await expect(panel(page).getByRole('textbox', { name: '워크스페이스 이름', exact: true })).toHaveValue('제품팀');
  await navigate(page, '버티컬 탭 설정');

  const list = panel(page).getByRole('tablist', { name: '워크스페이스 설정 분류', exact: true });
  await expect(list).toHaveAttribute('aria-orientation', 'vertical');
  const general = list.getByRole('tab', { name: '기본 정보', exact: true });
  const notifications = list.getByRole('tab', { name: '알림', exact: true });
  const generalPanel = panel(page).getByRole('tabpanel', { name: '기본 정보', exact: true });
  const listBox = await list.boundingBox(), panelBox = await generalPanel.boundingBox();
  expect(listBox.x + listBox.width).toBeLessThanOrEqual(panelBox.x);
  await general.focus();
  await general.press('ArrowDown');
  await expect(notifications).toBeFocused();
  await expect(notifications).toHaveAttribute('aria-selected', 'true');
  await notifications.press('ArrowUp');
  await expect(general).toBeFocused();

  const name = generalPanel.getByRole('textbox', { name: '워크스페이스 이름', exact: true });
  await name.fill('공유된 워크스페이스');
  await generalPanel.getByRole('button', { name: '변경사항 저장', exact: true }).click();
  await page.getByRole('tab', { name: '워크스페이스 설정', exact: true }).click();
  await expect(panel(page).getByRole('textbox', { name: '워크스페이스 이름', exact: true })).toHaveValue('공유된 워크스페이스');

  await page.getByRole('tab', { name: '버티컬 탭 설정', exact: true }).click();
  await name.fill('아직 저장하지 않은 이름');
  await page.getByRole('tab', { name: '워크스페이스 설정', exact: true }).click();
  await panel(page).getByRole('textbox', { name: '워크스페이스 이름', exact: true }).fill('다른 화면에서 저장');
  await panel(page).getByRole('button', { name: '변경사항 저장', exact: true }).click();
  await page.getByRole('tab', { name: '버티컬 탭 설정', exact: true }).click();
  await expect(name).toHaveValue('아직 저장하지 않은 이름');
});

test('vertical settings shares notification changes with an already-open settings page', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto(sample);
  await navigate(page, '알림 설정');
  await expect(panel(page).getByRole('switch', { name: '프로젝트 변경 알림', exact: true })).toBeChecked();
  await navigate(page, '버티컬 탭 설정');
  const list = panel(page).getByRole('tablist', { name: '워크스페이스 설정 분류', exact: true });
  await list.getByRole('tab', { name: '알림', exact: true }).click();
  const notificationPanel = panel(page).getByRole('tabpanel', { name: '알림', exact: true });
  await notificationPanel.getByRole('switch', { name: '프로젝트 변경 알림', exact: true }).uncheck();
  await page.getByRole('tab', { name: '알림 설정', exact: true }).click();
  await expect(panel(page).getByRole('switch', { name: '프로젝트 변경 알림', exact: true })).not.toBeChecked();
  await panel(page).getByRole('switch', { name: '프로젝트 변경 알림', exact: true }).check();
  await page.getByRole('tab', { name: '버티컬 탭 설정', exact: true }).click();
  await expect(notificationPanel.getByRole('switch', { name: '프로젝트 변경 알림', exact: true })).toBeChecked();
});
