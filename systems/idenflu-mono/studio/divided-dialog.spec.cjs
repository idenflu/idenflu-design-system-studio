const { test, expect } = require('@playwright/test');

test('divided dialog confirms and returns focus to its opener', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/overlays');
  const opener = page.getByRole('button', { name: '구분선 타입 열기', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: '프로젝트 상세', exact: true });
  await expect(dialog).toHaveAccessibleDescription('프로젝트의 기본 정보와 공유 범위를 확인합니다.');
  await expect(dialog.locator(':scope > header')).toContainText('프로젝트 상세');
  await expect(dialog.locator('.dialog-body')).toContainText('디자인 시스템 고도화');
  await expect(dialog.locator(':scope > footer').getByRole('button', { name: '확인', exact: true })).toBeInViewport();
  await dialog.getByRole('button', { name: '확인', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.getByText('프로젝트 상세를 확인했습니다.', { exact: true })).toBeVisible();
});

test('long divided dialog scrolls its body while header and footer stay visible', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/overlays');
  const opener = page.getByRole('button', { name: '스크롤 타입 열기', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: '프로젝트 운영 안내', exact: true });
  const header = dialog.locator('.dialog-header');
  const body = dialog.locator('.dialog-body');
  const footer = dialog.locator('.dialog-footer');
  const before = { header: await header.boundingBox(), footer: await footer.boundingBox() };
  expect(await body.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await body.focus();
  await body.press('End');
  await expect.poll(() => body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await expect(header).toBeInViewport();
  await expect(footer).toBeInViewport();
  expect((await header.boundingBox()).y).toBeCloseTo(before.header.y, 1);
  expect((await footer.boundingBox()).y).toBeCloseTo(before.footer.y, 1);
  const confirm = footer.getByRole('button', { name: '확인', exact: true });
  await confirm.focus();
  await confirm.press('Tab');
  await expect(dialog.getByRole('button', { name: '운영 안내 닫기', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
