const { test, expect } = require('@playwright/test');

const sample = '/systems/idenflu-mono/index.html?layout=sidebar';

async function openMemberRoles(page) {
  await page.goto(sample);
  await page.locator('.layout-tree-navigation:visible').getByRole('button', { name: '멤버 관리', exact: true }).click();
  const panel = page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
  const row = panel.locator('tbody tr').filter({ hasText: 'minsu@example.com' });
  const trigger = row.getByRole('combobox', { name: /^김민수 역할:/ });
  await trigger.click();
  await row.getByRole('option', { name: '편집자', exact: true }).click();
  await row.getByRole('option', { name: '뷰어', exact: true }).click();
  await page.keyboard.press('Escape');
  return { panel, row, trigger };
}

for (const { width, adjusted } of [{ width: 1440, adjusted: false }, { width: 1024, adjusted: false }, { width: 1440, adjusted: true }]) {
  test(`member role tags stay on one row at ${width}px${adjusted ? ' with larger controls' : ''}`, async ({ page, isMobile }) => {
    test.skip(isMobile);
    await page.setViewportSize({ width, height: 900 });
    if (adjusted) {
      await page.goto(sample);
      await page.evaluate(() => window.IdenfluPreferences.set({ fontSize: 18, spacing: 150, controlHeight: 48 }));
    }
    const { panel, row } = await openMemberRoles(page);
    const chips = row.locator('.multi-inline-chip');
    await expect(chips).toHaveCount(3);
    const boxes = await chips.evaluateAll(nodes => nodes.map(node => ({ top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom })));
    expect(Math.max(...boxes.map(box => box.top)) - Math.min(...boxes.map(box => box.top))).toBeLessThanOrEqual(1);
    const firstControl = await row.locator('.multi-inline-control').boundingBox();
    const otherControl = await panel.locator('tbody tr').filter({ hasText: 'seoyeon@example.com' }).locator('.multi-inline-control').boundingBox();
    expect(Math.abs(firstControl.height - otherControl.height)).toBeLessThanOrEqual(1);
    await expect(row.getByRole('combobox', { name: /김민수 역할:.*관리자.*편집자.*뷰어/ })).toBeVisible();
  });
}

test('narrow role fields keep tags keyboard accessible and editable', async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 1024, height: 900 });
  const { panel, row, trigger } = await openMemberRoles(page);
  await row.locator('.layout-inline-select').evaluate(element => { element.style.width = '140px'; });
  const tags = row.locator('.multi-inline-tags');
  await expect.poll(() => tags.evaluate(element => element.scrollWidth - element.clientWidth)).toBeGreaterThan(0);
  const firstControl = await row.locator('.multi-inline-control').boundingBox();
  const otherControl = await panel.locator('tbody tr').filter({ hasText: 'seoyeon@example.com' }).locator('.multi-inline-control').boundingBox();
  expect(Math.abs(firstControl.height - otherControl.height)).toBeLessThanOrEqual(1);
  const lastTag = row.getByRole('button', { name: '뷰어 제거', exact: true });
  await lastTag.focus();
  await expect(lastTag).toBeFocused();
  await expect.poll(() => tags.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await lastTag.press('Enter');
  await expect(lastTag).toHaveCount(0);
  await trigger.click();
  await row.getByRole('option', { name: '뷰어', exact: true }).click();
  await expect(lastTag).toHaveCount(1);
});
