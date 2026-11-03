const { test, expect } = require('@playwright/test');

for (const transformed of [false, true]) {
  test(`calendar stays interactive in a scrollable modal${transformed ? ' with a transformed body' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/systems/idenflu-mono/index.html?layout=sidebar');
    await page.getByRole('button', { name: '새 프로젝트', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '새 프로젝트', exact: true });
    const body = dialog.locator('.dialog-body');
    if (transformed) await body.evaluate(element => { element.style.transform = 'translateZ(0)'; });
    const trigger = dialog.getByRole('button', { name: '달력 열기', exact: true });
    await trigger.click();
    const popup = dialog.getByRole('dialog', { name: '날짜 선택 달력', exact: true });
    await expect(popup).toBeVisible();
    const expectReachable = () => expect.poll(() => popup.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return [rect.top + 5, rect.bottom - 5].every(y => {
        const hit = document.elementFromPoint(rect.left + rect.width / 2, y);
        return hit === element || element.contains(hit);
      });
    })).toBe(true);
    await expectReachable();
    await popup.getByRole('button', { name: '2026년 11월 21일', exact: true }).click();
    await expect(dialog.getByRole('textbox', { name: '목표 마감일' })).toHaveValue('2026-11-21');
    await trigger.click();
    await expect(popup).toBeVisible();
    await page.setViewportSize({ width: 1100, height: 600 });
    await expectReachable();
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(dialog).toBeVisible();
  });
}
