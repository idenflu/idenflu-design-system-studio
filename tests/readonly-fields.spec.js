const { test, expect } = require('@playwright/test');

for (const [route, label, container] of [
  ['text-fields', '읽기 전용', '.text-input'],
  ['number-fields', '읽기 전용', '.number-field'],
  ['date-picker', '읽기 전용 날짜', '.date-field'],
  ['time-picker', '읽기 전용 시간', '.time-field'],
  ['datetime-picker', '읽기 전용 일시', '.datetime-field'],
  ['select', '읽기 전용 검색 선택', '.search-select-control'],
]) {
  test(`read-only ${route} keeps its normal background and muted text @mobile @theme`, async ({ page }) => {
    await page.goto(`/systems/idenflu-mono/index.html#/components/${route}`);
    const field = page.getByRole(route === 'select' ? 'combobox' : route === 'number-fields' ? 'spinbutton' : 'textbox', { name: label, exact: true });
    await field.scrollIntoViewIfNeeded();
    const actual = await field.evaluate((el, selector) => {
      const box = el.matches(selector) ? el : el.closest(selector);
      const probe = document.createElement('span');
      probe.style.color = 'var(--disabled-text)';
      probe.style.backgroundColor = selector === '.number-field' ? 'var(--surface-raised)' : 'var(--field-background)';
      (box === el ? box.parentElement : box).appendChild(probe);
      const result = { color: getComputedStyle(el).color, background: getComputedStyle(box).backgroundColor, expectedColor: getComputedStyle(probe).color, expectedBackground: getComputedStyle(probe).backgroundColor };
      probe.remove();
      return result;
    }, container);
    expect(actual.color).toBe(actual.expectedColor);
    expect(actual.background).toBe(actual.expectedBackground);
    await field.focus();
    await expect(field).toBeFocused();
  });
}
