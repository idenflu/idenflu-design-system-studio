const { test, expect } = require('@playwright/test');

test('datetime selection stays pending until confirmation and cancel restores the committed value', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/datetime-picker');
  const field = page.locator('.datetime-picker').filter({ has: page.locator('#datetime-basic') });
  const result = page.getByRole('status').filter({ hasText: '확정된 일시:' });
  await field.getByRole('button', { name: '날짜 및 시간 선택 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '날짜 및 시간 선택', exact: true });
  await dialog.getByRole('button', { name: '2026년 11월 13일', exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('listbox', { name: '시', exact: true }).getByRole('option', { name: '15', exact: true }).click();
  await dialog.getByRole('listbox', { name: '분', exact: true }).getByRole('option', { name: '45', exact: true }).click();
  await expect(result).toContainText('2026-11-12 14:30');
  await dialog.getByRole('button', { name: '확인', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#datetime-basic')).toHaveValue('2026-11-13 15:45');
  await expect(result).toContainText('2026-11-13 15:45');
  await field.getByRole('button', { name: '날짜 및 시간 선택 열기' }).click();
  await dialog.getByRole('listbox', { name: '시', exact: true }).getByRole('option', { name: '16', exact: true }).click();
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(result).toContainText('2026-11-13 15:45');
  await expect(field.getByRole('button', { name: '날짜 및 시간 선택 열기' })).toBeFocused();
});

test('datetime range rejects a reversed time and updates the selected endpoint without changing the start', async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/datetime-picker');
  const start = page.getByRole('textbox', { name: '이용 시작 일시', exact: true });
  const end = page.getByRole('textbox', { name: '이용 종료 일시', exact: true });
  const result = page.getByRole('status').filter({ hasText: '확정된 기간:' });
  await end.fill('2026-11-12 08:30');
  await end.press('Tab');
  await expect(end).toHaveAttribute('aria-invalid', 'true');
  await expect(result).toContainText('2026-11-12 17:30');
  await end.fill('2026-11-12 10:30');
  await end.press('Enter');
  await expect(result).toContainText('2026-11-12 10:30');
  const field = page.locator('.datetime-picker').filter({ has: start });
  await field.getByRole('button', { name: '기간 및 시간 선택 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '기간 및 시간 선택', exact: true });
  await dialog.getByRole('button', { name: '다음', exact: true }).click();
  await dialog.getByRole('listbox', { name: '시', exact: true }).getByRole('option', { name: '12', exact: true }).click();
  await dialog.getByRole('button', { name: '확인', exact: true }).click();
  await expect(start).toHaveValue('2026-11-12 09:00');
  await expect(end).toHaveValue('2026-11-12 12:30');
});

test('datetime popup stays within the viewport and its confirmation remains reachable', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/datetime-picker');
  const field = page.locator('.datetime-picker').filter({ has: page.locator('#datetime-basic') });
  await field.getByRole('button', { name: '날짜 및 시간 선택 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '날짜 및 시간 선택', exact: true });
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  const confirm = dialog.getByRole('button', { name: '확인', exact: true });
  await confirm.scrollIntoViewIfNeeded();
  await confirm.click();
  await expect(dialog).toHaveCount(0);
});

test('an empty datetime range completes start date and time before moving to the end', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/datetime-picker');
  const field = page.locator('.datetime-picker').filter({ has: page.locator('#datetime-range-empty-start') });
  await field.getByRole('button', { name: '기간 및 시간 선택 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '기간 및 시간 선택', exact: true });
  const steps = dialog.locator('.datetime-range-tab');
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await expect(dialog.getByRole('button', { name: '확인', exact: true })).toHaveCount(0);
  const day = dialog.locator('.calendar-day:not(:disabled)').first();
  const [, year, month, date] = (await day.getAttribute('aria-label')).match(/^(\d+)년 (\d+)월 (\d+)일$/);
  const selectedDate = `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}`;
  await day.click();
  await dialog.getByRole('listbox', { name: '시', exact: true }).getByRole('option', { name: '09', exact: true }).click();
  await dialog.getByRole('listbox', { name: '분', exact: true }).getByRole('option', { name: '15', exact: true }).click();
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await dialog.getByRole('button', { name: '다음', exact: true }).click();
  await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#datetime-range-empty-start')).toHaveValue('');
  await expect(page.locator('#datetime-range-empty-end')).toHaveValue('');
  await dialog.getByRole('listbox', { name: '시', exact: true }).getByRole('option', { name: '17', exact: true }).click();
  await dialog.getByRole('listbox', { name: '분', exact: true }).getByRole('option', { name: '45', exact: true }).click();
  await dialog.getByRole('button', { name: '이전', exact: true }).click();
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await dialog.getByRole('button', { name: '다음', exact: true }).click();
  await dialog.getByRole('button', { name: '확인', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#datetime-range-empty-start')).toHaveValue(`${selectedDate} 09:15`);
  await expect(page.locator('#datetime-range-empty-end')).toHaveValue(`${selectedDate} 17:45`);
});

test('datetime calendar uses the existing date picker typography and control styles', {tag:['@theme','@mobile']}, async ({ page }) => {
  const calendarStyles = () => {
    const read = selector => {
      const style = getComputedStyle(document.querySelector(selector));
      return Object.fromEntries(['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'height', 'padding', 'backgroundColor'].map(key => [key, style[key]]));
    };
    return { heading: read('.date-popup .calendar-header strong'), weekdays: read('.date-popup .calendar-weekdays'), day: read('.date-popup .calendar-day:not([aria-pressed="true"]):not(.is-today)'), navigation: read('.date-popup .calendar-nav') };
  };
  await page.goto('/systems/idenflu-mono/index.html#/components/date-picker');
  const dateField = page.locator('.date-picker').filter({ has: page.getByRole('textbox', { name: '날짜', exact: true }) });
  await dateField.getByRole('button', { name: '달력 열기', exact: true }).click();
  const dateStyles = await page.evaluate(calendarStyles);
  await page.goto('/systems/idenflu-mono/index.html#/components/datetime-picker');
  await page.locator('.datetime-picker').filter({ has: page.locator('#datetime-basic') }).getByRole('button', { name: '날짜 및 시간 선택 열기' }).click();
  expect(await page.evaluate(calendarStyles)).toEqual(dateStyles);
});

test('datetime still dismisses on keyboard exit, outside click and Escape after popup pointer interaction', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/datetime-picker');
  const input = page.locator('#datetime-basic');
  const field = page.locator('.datetime-picker').filter({ has: input });
  const trigger = field.getByRole('button', { name: '날짜 및 시간 선택 열기' });
  const dialog = page.getByRole('dialog', { name: '날짜 및 시간 선택', exact: true });

  await trigger.click();
  await dialog.locator('.datetime-time-label').first().click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '확인', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#datetime-entry')).toBeFocused();

  await trigger.click();
  await dialog.getByRole('button', { name: '이전 달', exact: true }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog).toHaveCount(0);
  await expect(input).toBeFocused();

  await trigger.click();
  await dialog.locator('.datetime-time-label').first().click();
  const popupBox = await dialog.boundingBox();
  await page.mouse.click(popupBox.x - 2, popupBox.y + 10);
  await expect(dialog).toHaveCount(0);

  await trigger.click();
  await dialog.locator('.datetime-time-label').first().click();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(input).toHaveValue('2026-11-12 14:30');
});
