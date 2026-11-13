const {test, expect} = require('@playwright/test');

test('read-only select variants keep focus and values without opening', {tag:'@mobile'}, async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/select');
  const controls = [
    page.getByRole('combobox',{name:'읽기 전용 선택: 디자인'}),
    page.getByRole('combobox',{name:'읽기 전용 검색 선택'}),
    page.getByRole('combobox',{name:'읽기 전용 복수 선택: 디자인, 개발'}),
    page.getByRole('combobox',{name:'읽기 전용 태그 선택: 디자인, 개발'}),
  ];
  for (const control of controls) {
    await control.scrollIntoViewIfNeeded();
    await control.focus();
    await expect(control).toBeFocused();
    await expect(control).toHaveAttribute('aria-readonly','true');
    await control.press('ArrowDown');
    await control.click();
    await expect(control).toHaveAttribute('aria-expanded','false');
    const background = await control.evaluate(el => getComputedStyle(el.closest('.custom-select').querySelector('.select-trigger,.search-select-control,.multi-inline-control')).backgroundColor);
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
  }
  await expect(controls[1]).toHaveValue('디자인');
  await expect(controls[1]).toHaveAttribute('readonly','');
  const inline=controls[3].locator('..');
  await expect(inline.locator('button.multi-inline-chip')).toHaveCount(0);
  await expect(inline.getByRole('button',{name:'읽기 전용 태그 선택 모두 지우기'})).toBeDisabled();
});
