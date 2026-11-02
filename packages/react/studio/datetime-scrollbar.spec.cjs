const { test, expect } = require('@playwright/test');

test.use({ launchOptions: {
  ...(process.env.IDENFLU_TEST_CHROMIUM ? { executablePath: process.env.IDENFLU_TEST_CHROMIUM } : {}),
  ignoreDefaultArgs: ['--hide-scrollbars'],
} });

for (const scrollbar of ['platform', 'with-buttons']) {
  test(`hour and minute scrollbar clicks and drags keep the pending picker open (${scrollbar})`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'Touch scrolling has no mouse scrollbar gutter.');
    await page.goto('/systems/idenflu-mono/index.html#/components/datetime-picker');
    if (scrollbar === 'with-buttons') await page.addStyleTag({ content: `
      .datetime-time-list { scrollbar-width:auto; }
      .datetime-time-list::-webkit-scrollbar { width:14px; }
      .datetime-time-list::-webkit-scrollbar-button { display:none; }
      .datetime-time-list::-webkit-scrollbar-button:vertical:decrement:start,
      .datetime-time-list::-webkit-scrollbar-button:vertical:increment:end { display:block; height:14px; }
      .datetime-time-list::-webkit-scrollbar-thumb { min-height:24px; background:#888; }
    ` });
    const input = page.locator('#datetime-entry');
    const field = page.locator('.datetime-picker').filter({ has: input });
    await field.getByRole('button', { name: '날짜 및 시간 선택 열기' }).click();
    const dialog = page.getByRole('dialog', { name: '날짜 및 시간 선택', exact: true });
    const day = dialog.locator('.calendar-day:not(:disabled)').first();
    const [, year, month, date] = (await day.getAttribute('aria-label')).match(/^(\d+)년 (\d+)월 (\d+)일$/);
    const selectedDate = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
    await day.click();

    for (const label of ['시', '분']) {
      await test.step(`${label} scrollbar track and thumb`, async () => {
        const list = dialog.getByRole('listbox', { name: label, exact: true });
        await list.scrollIntoViewIfNeeded();
        const geometry = await list.evaluate(element => {
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const rightBorder = parseFloat(style.borderRightWidth) || 0;
          const gutter = element.offsetWidth - element.clientWidth - (parseFloat(style.borderLeftWidth) || 0) - rightBorder;
          return { x: box.right - rightBorder - gutter / 2, top: box.top + element.clientTop, height: element.clientHeight, contentHeight: element.scrollHeight, gutter };
        });
        expect(geometry.gutter, 'The regression must exercise a real native scrollbar gutter.').toBeGreaterThan(0);
        expect(await list.evaluate(element => element.scrollHeight)).toBeGreaterThan(geometry.height);
        await list.evaluate(element => { element.scrollTop = 0; });
        await list.evaluate(element => {
          element.dataset.scrollPending = 'true';
          element.addEventListener('scrollend', () => { delete element.dataset.scrollPending; }, { once: true });
        });
        await page.mouse.click(geometry.x, geometry.top + geometry.height * 0.8);
        await expect(dialog).toBeVisible();
        await expect.poll(() => list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
        await expect(input).toHaveValue('');
        await expect.poll(() => list.getAttribute('data-scroll-pending')).toBeNull();

        await list.evaluate(async element => {
          element.scrollTop = 0;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        await expect.poll(() => list.evaluate(element => element.scrollTop)).toBe(0);
        // Native end buttons can occupy one scrollbar thickness on Linux/Windows.
        // Pick the middle of the thumb area shared by themes with and without them.
        const thumbEnd = geometry.height * geometry.height / geometry.contentHeight;
        expect(thumbEnd).toBeGreaterThan(geometry.gutter);
        const thumbY = geometry.top + (geometry.gutter + thumbEnd) / 2;
        await page.mouse.move(geometry.x, thumbY);
        await page.mouse.down();
        await page.mouse.move(geometry.x, geometry.top + geometry.height * 0.6, { steps: 8 });
        await page.mouse.up();
        await expect(dialog).toBeVisible();
        await expect.poll(() => list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
        await expect(input).toHaveValue('');
      });
    }

    await dialog.getByRole('listbox', { name: '시', exact: true }).getByRole('option', { name: '10', exact: true }).click();
    await dialog.getByRole('listbox', { name: '분', exact: true }).getByRole('option', { name: '25', exact: true }).click();
    await expect(input).toHaveValue('');
    await dialog.getByRole('button', { name: '확인', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(input).toHaveValue(`${selectedDate} 10:25`);
  });
}
