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

// Each case selects its own themes; only viewport-sensitive cases need a mobile repeat.
test.beforeEach(async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/foundations/colors');
  await expect(page.locator('[data-route="foundations/colors"]')).toBeVisible();
  await openSettings(page);
  await selectTheme(page, '라이트');
});

test('all base and semantic colors update the palette and rendered components without overflow', {tag:'@mobile'}, async ({ page }) => {
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

const measuredRgbContrast = (first, second) => {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const values = channels.map(channel => color.startsWith('color(srgb ') ? channel : channel / 255).map(value => value < 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const low = Math.min(luminance(first), luminance(second));
  const high = Math.max(luminance(first), luminance(second));
  return (high + 0.05) / (low + 0.05);
};

async function exportedButtonColors(page) {
  return page.evaluate(async () => {
    const frame = document.createElement('iframe');
    const loaded = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
    const theme = document.documentElement.dataset.theme;
    frame.srcdoc = `<html data-theme="${theme}"><head><link rel="stylesheet" href="/packages/react/dist/styles.css"><style>${window.IdenfluPreferences.cssText()} button { transition: none !important; }</style></head><body><button class="button" id="primary">확인</button><button class="button button--danger" id="danger">삭제</button></body></html>`;
    document.body.append(frame);
    await loaded;
    const samples = [];
    for (const name of ['primary', 'danger']) {
      const button = frame.contentDocument.getElementById(name);
      const original = button.className;
      for (const state of ['', 'is-hovered', 'is-pressed']) {
        button.className = `${original} ${state}`;
        const styles = frame.contentWindow.getComputedStyle(button);
        samples.push({ name, state: state || 'normal', text: styles.color, background: styles.backgroundColor });
      }
    }
    frame.remove();
    return samples;
  });
}

test('edited primary and default dark Danger colors export readable real button styles in every state', async ({ page }) => {
  await selectTheme(page, '다크');
  // Saving the visible default danger swatch previously made danger buttons unreadable.
  const defaultDanger = await tokenValue(page, '--danger');
  expect(defaultDanger).toBe('#f2a3a7');
  await changeHex(page, 'Danger', defaultDanger);
  for (const primary of ['#ffeb3b', '#ffffff', '#000000', '#777777']) {
    await changeHex(page, 'Control Primary', primary);
    const samples = await exportedButtonColors(page);
    for (const sample of samples) {
      expect(measuredRgbContrast(sample.text, sample.background), `${primary} ${sample.name} ${sample.state}`).toBeGreaterThanOrEqual(4.5);
    }
  }
  const dangerButton = await tokenValue(page, '--danger-control');
  expect(dangerButton).not.toBe(defaultDanger);
  expect(await tokenValue(page, '--danger')).toBe(defaultDanger);
  await page.locator('#studio-preferences-close').click();
  await page.reload();
  await expect(page.locator('[data-route="foundations/colors"]')).toBeVisible();
  for (const sample of await exportedButtonColors(page)) {
    expect(measuredRgbContrast(sample.text, sample.background), `reload ${sample.name} ${sample.state}`).toBeGreaterThanOrEqual(4.5);
  }
});

test('low text contrast is announced and clears when the edited foreground is reset', async ({ page }) => {
  const status = page.locator('#studio-color-contrast');
  await changeHex(page, 'Text Primary', '#ffffff');
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(status).toContainText('일부 글자색의 대비가 권장 기준 4.5:1보다 낮습니다.');
  await expect(status).toContainText('본문 / 배경: 1.00:1');
  await expect(hexField(page, 'Text Primary')).toHaveAttribute('aria-describedby', /studio-color-contrast/);
  await page.getByRole('button', {name:'Text Primary 색상 초기화',exact:true}).click();
  await expect(status).not.toContainText('본문 / 배경');
  await expect(hexField(page, 'Text Primary')).not.toHaveValue('#ffffff');
});


test('danger text consumers and inverse spinners retain contrast after a bright primary edit', async ({ page }) => {
  for (const theme of ['라이트', '다크']) {
    await selectTheme(page, theme);
    await changeHex(page, 'Control Primary', '#ffeb3b');
    await changeHex(page, 'Danger', '#f2a3a7');
    const samples = await page.evaluate(async () => {
      const frame = document.createElement('iframe');
      const loaded = new Promise(resolve => frame.addEventListener('load', resolve, {once:true}));
      const theme = document.documentElement.dataset.theme;
      const spinners = `
        <span data-kind="ring" class="spinner spinner--inverse"></span>
        <span data-kind="dots" class="spinner-dots spinner--inverse"><span></span><span></span><span></span></span>
        <span data-kind="bars" class="spinner-bars spinner--inverse"><span></span><span></span><span></span></span>
        <svg data-kind="nova" class="nova-spinner nova-spinner--inverse" viewBox="0 0 24 24"><path class="nova-spinner__facet" d="M2 2H22V22Z" /></svg>`;
      frame.srcdoc = `<html data-theme="${theme}"><head><link rel="stylesheet" href="/packages/react/dist/styles.css"><style>${window.IdenfluPreferences.cssText()} * { animation:none !important; transition:none !important; }</style></head><body>
        <div id="canvas" style="background:var(--canvas)"><span id="badge" class="badge badge--danger">오류</span><p id="helper" class="component-helper is-error">입력 오류</p><p id="field" class="field-error">필수 항목</p></div>
        <div id="inverse" style="background:var(--inverse-canvas)">${spinners}</div>
        <button id="button" class="button">처리 중 ${spinners}</button>
      </body></html>`;
      document.body.append(frame);
      await loaded;
      const doc = frame.contentDocument;
      const style = element => frame.contentWindow.getComputedStyle(element);
      const canvas = style(doc.getElementById('canvas')).backgroundColor;
      const result = ['badge','helper','field'].map(name => {
        const element = doc.getElementById(name), appearance = style(element);
        return {name, kind:'text', foreground:appearance.color, background:name === 'badge' ? appearance.backgroundColor : canvas};
      });
      for (const container of ['inverse','button']) {
        const stage = doc.getElementById(container), background = style(stage).backgroundColor;
        for (const spinner of stage.querySelectorAll('[data-kind]')) {
          const kind = spinner.dataset.kind;
          const foreground = kind === 'ring' ? style(spinner).borderTopColor : kind === 'nova' ? style(spinner.querySelector('path')).fill : style(spinner.firstElementChild).backgroundColor;
          result.push({name:`${container} ${kind}`,kind:'spinner',foreground,background});
        }
      }
      frame.remove();
      return result;
    });
    for (const sample of samples) {
      expect(measuredRgbContrast(sample.foreground,sample.background), `${theme} ${sample.name}`).toBeGreaterThanOrEqual(sample.kind === 'text' ? 4.5 : 3);
    }
  }
});
