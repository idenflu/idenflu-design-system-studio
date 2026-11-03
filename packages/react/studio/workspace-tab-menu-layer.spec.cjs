const { test, expect } = require('@playwright/test');

const sample = '/systems/idenflu-mono/index.html?layout=sidebar';

for (const scrollGrid of [false, true]) {
  test(`open tabs menu stays above grid headers${scrollGrid ? ' after scrolling' : ''}`, async ({ page, isMobile }) => {
    test.skip(isMobile);
    await page.setViewportSize({ width: 950, height: 900 });
    await page.goto(sample);
    const navigation = page.locator('.layout-tree-navigation:visible');
    for (const label of ['진행 중 프로젝트', '검토 요청', '완료된 프로젝트', '마스터-디테일', '멤버 관리', '워크스페이스 설정', '알림 설정', '버티컬 탭 설정']) {
      await navigation.getByRole('button', { name: label, exact: true }).click();
    }
    await navigation.getByRole('button', { name: '전체 프로젝트', exact: true }).click();
    const panel = page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
    const grid = panel.locator('.data-grid-scroll');
    if (scrollGrid) {
      await grid.evaluate(element => { element.scrollTop = 100; element.scrollLeft = element.scrollWidth; });
      await expect.poll(() => grid.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      await expect.poll(() => grid.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBe(0);
    }
    await page.getByRole('button', { name: '열린 탭 메뉴', exact: true }).click();
    const menu = page.getByRole('menu', { name: '열린 탭과 탭 관리', exact: true });
    await expect(menu).toBeVisible();

    // Use a point where an actual grid header intersects a visible menu item.
    // A bounding-box-only check misses a header painted above the menu.
    const target = await page.evaluate(() => {
      const menu = document.querySelector('.layout-tabs-toolbar [role="menu"]');
      const headers = [...document.querySelectorAll('.layout-workspace-tabs > .tab-panel:not([hidden]) .data-grid-table thead th')];
      const menuRect = menu.getBoundingClientRect();
      const names = new Set(['진행 중 프로젝트', '검토 요청', '완료된 프로젝트', '마스터-디테일', '멤버 관리', '워크스페이스 설정', '알림 설정', '버티컬 탭 설정']);
      for (const item of menu.querySelectorAll('[role="menuitem"]')) {
        const label = item.textContent.trim();
        if (!names.has(label)) continue;
        const rect = item.getBoundingClientRect();
        for (const header of headers) {
          const h = header.getBoundingClientRect();
          const left = Math.max(rect.left, h.left, menuRect.left), right = Math.min(rect.right, h.right, menuRect.right - 16);
          const top = Math.max(rect.top, h.top, menuRect.top), bottom = Math.min(rect.bottom, h.bottom, menuRect.bottom);
          if (right - left < 8 || bottom - top < 8) continue;
          const x = (left + right) / 2, y = (top + bottom) / 2;
          return { label, x, y, hit: item.contains(document.elementFromPoint(x, y)) };
        }
      }
      return null;
    });
    expect(target, 'test requires a menu item overlapping a grid header').not.toBeNull();
    expect(target.hit, 'menu must receive pointer events above the grid header').toBe(true);
    await page.mouse.click(target.x, target.y);
    await expect(menu).toBeHidden();
    await expect(page.locator('.layout-workspace-tabs > .tab-list [role="tab"][aria-selected="true"]')).toContainText(target.label);
  });
}
