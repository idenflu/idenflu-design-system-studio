const { test, expect } = require('@playwright/test');

const storageKey = 'idenflu-mono-preferences-v1';
const palette = [
  ['Primary', '--primary', '#6b42a1'],
  ['Text Primary', '--text', '#242b36'],
  ['Text Secondary', '--text-secondary', '#596578'],
  ['Surface', '--surface', '#edf2f7'],
  ['Border', '--border', '#8895a7'],
  ['Control Primary', '--primary-control', '#7041a5'],
  ['Canvas', '--canvas', '#fffdf5'],
  ['Danger', '--danger', '#a72948'],
  ['Success', '--success', '#237346'],
  ['Warning', '--warning', '#936211'],
  ['Info', '--info', '#137d8d'],
];
const rgb = (hex) => `rgb(${[1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(', ')})`;
const hexField = (page, label) => page.getByRole('textbox', { name: `${label} HEX`, exact: true });
const tokenValue = (page, token) => page.evaluate(name => getComputedStyle(document.documentElement).getPropertyValue(name).trim().toLowerCase(), token);

async function openSettings(page) {
  await page.getByRole('button', { name: '화면 조정', exact: true }).click();
  await expect(page.locator('#studio-settings-dialog')).toBeVisible();
}

async function selectTheme(page, label) {
  const button = page.getByRole('button', { name: label, exact: true });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

async function changeHex(page, label, value) {
  const field = hexField(page, label);
  await field.fill(value);
  await field.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/foundations/colors');
  await expect(page.locator('[data-route="foundations/colors"]')).toBeVisible();
  await openSettings(page);
  await selectTheme(page, '라이트');
});

test('all base and semantic colors update the palette and rendered components without overflow', async ({ page }) => {
  for (const [label, token, value] of palette) {
    const field = hexField(page, label);
    await expect(field).toHaveAccessibleName(`${label} HEX`);
    if (label === 'Info') {
      // Native color pickers are OS surfaces; dispatch the selection through their input.
      await page.getByLabel(`${label} 색상 선택`, { exact: true }).evaluate((input, color) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, color);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
    } else {
      await changeHex(page, label, value);
    }
    await expect.poll(() => tokenValue(page, token)).toBe(value);
    await expect(field).toHaveValue(value);
    await field.scrollIntoViewIfNeeded();
    const bounds = await field.boundingBox();
    expect(bounds.x, label).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width, label).toBeLessThanOrEqual(page.viewportSize().width);
    await expect(page.locator(`[data-color-token="${token}"] .token-value`)).toHaveText(value.toUpperCase());
    await expect(page.locator(`[data-color-token="${token}"] .react-studio-swatch`)).toHaveCSS('background-color', rgb(value));
  }
  await page.locator('#studio-preferences-close').click();
  await expect(page.getByRole('button', { name: '저장하기', exact: true })).toHaveCSS('background-color', rgb('#7041a5'));
  await expect(page.locator('.react-studio-color-link')).toHaveCSS('color', rgb('#6b42a1'));
  await expect(page.locator('.react-studio-color-surface')).toHaveCSS('background-color', rgb('#edf2f7'));
  await expect(page.locator('.badge--success')).toHaveCSS('color', rgb('#237346'));
  const sizes = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
});

test('HEX edits validate before applying and individual reset preserves other preferences', async ({ page }) => {
  const originalPrimary = await tokenValue(page, '--primary');
  const primary = hexField(page, 'Primary');
  await primary.fill('#zzzzzz');
  await expect(primary).toHaveAttribute('aria-invalid', 'true');
  await primary.press('Enter');
  expect(await tokenValue(page, '--primary')).toBe(originalPrimary);
  await primary.press('Tab');
  await expect(primary).toHaveValue(originalPrimary);
  await expect(primary).toHaveAttribute('aria-invalid', 'false');
  await changeHex(page, 'Primary', '#aBc');
  await expect.poll(() => tokenValue(page, '--primary')).toBe('#aabbcc');
  await expect(primary).toHaveValue('#aabbcc');
  await changeHex(page, 'Success', '#247b48');
  await page.locator('#react-pref-fontSize').fill('16');
  await page.getByRole('button', { name: 'Primary 색상 초기화', exact: true }).click();
  await expect.poll(() => tokenValue(page, '--primary')).toBe(originalPrimary);
  await expect(page.getByRole('button', { name: 'Primary 색상 초기화', exact: true })).toBeDisabled();
  expect(await tokenValue(page, '--success')).toBe('#247b48');
  expect(await page.evaluate(() => window.IdenfluPreferences.get().fontSize)).toBe(16);
});

test('theme palettes persist separately, export together and reset to theme defaults', async ({ page }) => {
  const lightPrimary = await tokenValue(page, '--primary');
  await changeHex(page, 'Primary', '#673ab7');
  await selectTheme(page, '다크');
  const darkPrimary = await tokenValue(page, '--primary');
  const darkDanger = await tokenValue(page, '--danger');
  expect(darkPrimary).not.toBe('#673ab7');
  await changeHex(page, 'Primary', '#c4a7ff');
  await changeHex(page, 'Danger', '#ff99aa');
  await selectTheme(page, '라이트');
  await expect(hexField(page, 'Primary')).toHaveValue('#673ab7');
  await selectTheme(page, '다크');
  await expect(hexField(page, 'Primary')).toHaveValue('#c4a7ff');
  await page.locator('#studio-preferences-close').click();
  await page.reload();
  await expect(page.locator('[data-route="foundations/colors"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => tokenValue(page, '--primary')).toBe('#c4a7ff');
  expect(await tokenValue(page, '--danger')).toBe('#ff99aa');
  await openSettings(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedColorCss = text; } } });
  });
  await page.getByRole('button', { name: 'CSS 복사', exact: true }).click();
  const exported = await page.evaluate(() => window.copiedColorCss);
  expect(exported).toContain(':root[data-theme="light"]');
  expect(exported).toContain('--primary: #673ab7;');
  expect(exported).toContain(':root[data-theme="dark"]');
  expect(exported).toContain('--primary: #c4a7ff;');
  expect(exported).toContain('--danger: #ff99aa;');
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect.poll(() => tokenValue(page, '--primary')).toBe(darkPrimary);
  expect(await tokenValue(page, '--danger')).toBe(darkDanger);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await selectTheme(page, '라이트');
  await expect.poll(() => tokenValue(page, '--primary')).toBe(lightPrimary);
  expect(await page.evaluate(() => window.IdenfluPreferences.get().colors)).toBeUndefined();
});

test('high contrast uses system colors and restores saved colors when disabled', async ({ page }) => {
  await changeHex(page, 'Primary', '#7844aa');
  await changeHex(page, 'Danger', '#ab2849');
  const saved = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(page.getByText('고대비 모드에서는 시스템 색상을 사용합니다.', { exact: false })).toBeVisible();
  await expect(hexField(page, 'Primary')).toHaveCount(0);
  await expect(page.locator('#studio-settings-dialog input[type="color"]')).toHaveCount(0);
  await expect.poll(() => tokenValue(page, '--primary')).not.toBe('#7844aa');
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--primary'))).toBe('');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(saved);
  await page.emulateMedia({ forcedColors: 'none' });
  await expect(hexField(page, 'Primary')).toHaveValue('#7844aa');
  await expect(hexField(page, 'Danger')).toHaveValue('#ab2849');
  await expect.poll(() => tokenValue(page, '--primary')).toBe('#7844aa');
  expect(await tokenValue(page, '--danger')).toBe('#ab2849');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(saved);
});

test('exported colors apply to consumers without a theme attribute', async ({ page }) => {
  await changeHex(page, 'Primary', '#7844aa');
  await selectTheme(page, '다크');
  await changeHex(page, 'Primary', '#ccabff');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedConsumerCss = text; } } });
  });
  await page.getByRole('button', { name: 'CSS 복사', exact: true }).click();
  const consumer = await page.evaluate(async () => {
    const frame = document.createElement('iframe');
    const loaded = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
    frame.srcdoc = `<link rel="stylesheet" href="/packages/react/dist/styles.css"><style>${window.copiedConsumerCss}</style><a id="consumer-link" href="#" style="color:var(--primary)">자세히 보기</a>`;
    document.body.append(frame);
    await loaded;
    const root = frame.contentDocument.documentElement;
    const read = () => ({ primary: frame.contentWindow.getComputedStyle(root).getPropertyValue('--primary').trim(), linkColor: frame.contentWindow.getComputedStyle(frame.contentDocument.querySelector('#consumer-link')).color });
    const noTheme = { theme: root.getAttribute('data-theme'), ...read() };
    root.dataset.theme = 'light';
    const light = read();
    root.dataset.theme = 'dark';
    const dark = read();
    frame.remove();
    return { noTheme, light, dark };
  });
  expect(consumer.noTheme).toEqual({ theme: null, primary: '#7844aa', linkColor: rgb('#7844aa') });
  expect(consumer.light).toEqual({ primary: '#7844aa', linkColor: rgb('#7844aa') });
  expect(consumer.dark).toEqual({ primary: '#ccabff', linkColor: rgb('#ccabff') });
});
