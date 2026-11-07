const { test, expect } = require('@playwright/test');

const sample = '/systems/idenflu-mono/index.html?layout=sidebar';
const activePanel = page => page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');

async function openProfile(page) {
  await page.getByRole('button', { name: /사용자 메뉴/ }).click();
  await page.getByRole('menuitem', { name: '내 프로필', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '내 프로필', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function expectReadOnlyRoles(dialog, labels) {
  const trigger = dialog.getByRole('combobox', { name: /^역할:/ });
  await expect(trigger).toBeDisabled();
  for (const label of labels) await expect(dialog.getByRole('button', { name: `${label} 제거`, exact: true })).toBeDisabled();
  await trigger.evaluate(element => element.click());
  await expect(dialog.locator('.custom-select[data-multiselect] .select-popup:not([hidden])')).toHaveCount(0);
}

test('profile roles are disabled and stay unchanged when personal information is saved or cancelled', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto(sample);
  let dialog = await openProfile(page);
  await expectReadOnlyRoles(dialog, ['워크스페이스 관리자']);
  await dialog.getByRole('textbox', { name: '이름', exact: true }).fill('최지민');
  await dialog.getByRole('textbox', { name: '이메일', exact: true }).fill('jimin@example.com');
  await dialog.getByRole('button', { name: '저장', exact: true }).click();
  await expect(dialog).toBeHidden();

  dialog = await openProfile(page);
  await expectReadOnlyRoles(dialog, ['워크스페이스 관리자']);
  await expect(dialog.getByRole('textbox', { name: '이름', exact: true })).toHaveValue('최지민');
  await dialog.getByRole('textbox', { name: '이름', exact: true }).fill('저장하지 않은 이름');
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(dialog).toBeHidden();
  dialog = await openProfile(page);
  await expectReadOnlyRoles(dialog, ['워크스페이스 관리자']);
  await expect(dialog.getByRole('textbox', { name: '이름', exact: true })).toHaveValue('최지민');
});

test('member management changes are reflected in the disabled profile field', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto(sample);
  await page.locator('.layout-tree-navigation:visible').getByRole('button', { name: '멤버 관리', exact: true }).click();
  const row = activePanel(page).locator('tbody tr').filter({ hasText: 'minsu@example.com' });
  await row.getByRole('combobox', { name: /^김민수 역할:/ }).click();
  await row.getByRole('option', { name: '편집자', exact: true }).click();
  await page.keyboard.press('Escape');
  const dialog = await openProfile(page);
  await expectReadOnlyRoles(dialog, ['워크스페이스 관리자', '편집자']);
  await dialog.getByRole('button', { name: '저장', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(row.getByRole('button', { name: '관리자 제거', exact: true })).toBeVisible();
  await expect(row.getByRole('button', { name: '편집자 제거', exact: true })).toBeVisible();
});

test('disabled profile roles remain visible in a short modal', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 1440, height: 520 });
  await page.goto(sample);
  const dialog = await openProfile(page);
  await expectReadOnlyRoles(dialog, ['워크스페이스 관리자']);
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(dialog).toBeHidden();
});
