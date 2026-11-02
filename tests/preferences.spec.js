const { test, expect } = require('@playwright/test');
const documents = require('../packages/react/studio/routes.json');

const storageKey = 'idenflu-mono-preferences-v1';
const defaults = { fontSize: 14, lineHeight: 22, spacing: 100, controlHeight: 38, radius: 0 };
const custom = { fontSize: 16, lineHeight: 26, spacing: 125, controlHeight: 44, radius: 6 };
const ranges = {
  fontSize: '#react-pref-fontSize',
  lineHeight: '#react-pref-lineHeight',
  spacing: '#react-pref-spacing',
  controlHeight: '#react-pref-controlHeight',
  radius: '#react-pref-radius',
};

async function openApp(page, route = 'components/text-fields', prefix = '') {
  await page.goto(`${prefix}/systems/idenflu-mono/index.html#/${route}`);
  await page.waitForFunction(() => Boolean(window.IdenfluPreferences));
  await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
}

async function openSettings(page) {
  const opener = page.getByRole('button', {name:'화면 조정',exact:true});
  await opener.click();
  await expect(page.locator('#studio-settings-dialog')).toBeVisible();
  return opener;
}

async function preferences(page) {
  return page.evaluate(() => window.IdenfluPreferences.get());
}

async function expectRanges(page, values) {
  for (const [key, selector] of Object.entries(ranges)) {
    await expect(page.locator(selector), key).toHaveValue(String(values[key]));
  }
}

async function metrics(page) {
  return page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const button = document.querySelector('.route-text-fields button[type=submit]');
    const input = document.querySelector('.route-text-fields .text-input');
    const buttonStyle = getComputedStyle(button);
    const inputStyle = getComputedStyle(input);
    return {
      bodyFont: parseFloat(body.fontSize),
      bodyLine: parseFloat(body.lineHeight),
      buttonFont: parseFloat(buttonStyle.fontSize),
      buttonHeight: button.getBoundingClientRect().height,
      buttonPadding: parseFloat(buttonStyle.paddingInlineStart),
      buttonRadius: parseFloat(buttonStyle.borderTopLeftRadius),
      inputFont: parseFloat(inputStyle.fontSize),
      inputHeight: input.getBoundingClientRect().height,
      inputRadius: parseFloat(inputStyle.borderTopLeftRadius),
    };
  });
}

test('preferences defaults preserve actual typography and control geometry', async ({ page }) => {
  await openApp(page);
  expect(await preferences(page)).toEqual(defaults);
  await openSettings(page);
  await expectRanges(page, defaults);
  const rendered = await metrics(page);
  expect(rendered.bodyFont).toBe(14);
  expect(rendered.bodyLine).toBe(22);
  expect(rendered.buttonFont).toBe(14);
  expect(rendered.inputFont).toBe(14);
  expect(rendered.buttonHeight).toBeCloseTo(38, 1);
  expect(rendered.inputHeight).toBeCloseTo(38, 1);
  expect(rendered.buttonRadius).toBe(0);
  expect(rendered.inputRadius).toBe(0);
});

test('live adjustments change rendered controls, persist on reload and copy current CSS', async ({ page }) => {
  await openApp(page);
  await openSettings(page);
  const before = await metrics(page);
  for (const [key, selector] of Object.entries(ranges)) {
    await page.locator(selector).fill(String(custom[key]));
  }
  expect(await preferences(page)).toEqual(custom);
  const rendered = await metrics(page);
  expect(rendered.bodyFont).toBe(16);
  expect(rendered.bodyLine).toBe(26);
  expect(rendered.buttonFont).toBe(16);
  expect(rendered.inputFont).toBe(16);
  expect(rendered.buttonHeight).toBeCloseTo(44, 1);
  expect(rendered.inputHeight).toBeCloseTo(44, 1);
  expect(rendered.buttonPadding).toBeGreaterThan(before.buttonPadding);
  expect(rendered.buttonRadius).toBe(6);
  expect(rendered.inputRadius).toBe(6);
  await page.locator('#studio-preferences-close').click();
  await page.evaluate(() => { location.hash = '#/components/text-fields'; });
  await expect(page.locator('.route-text-fields')).toBeVisible();
  expect(await preferences(page)).toEqual(custom);
  await page.reload();
  await page.waitForFunction(() => Boolean(window.IdenfluPreferences));
  expect(await preferences(page)).toEqual(custom);
  await openSettings(page);
  await expectRanges(page, custom);
  expect(await metrics(page)).toEqual(rendered);
  await page.evaluate(() => {
    window.copiedPreferenceCss = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text) => { window.copiedPreferenceCss = text; } },
    });
  });
  const expectedCss = await page.evaluate(() => window.IdenfluPreferences.cssText());
  await page.getByRole('button', {name:'CSS 복사',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.copiedPreferenceCss)).toBe(expectedCss);
  expect(expectedCss).toContain('--font-size-base: 16px');
  expect(expectedCss).toContain('--space-unit: 5px');
  expect(expectedCss).toContain('--control-base-height: 44px');
});

test('preference API rejects invalid types, clamps linked values and tolerates corrupt storage', async ({ page }) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, '{invalid JSON');
  }, storageKey);
  await openApp(page);
  expect(await preferences(page)).toEqual(defaults);
  const ignored = await page.evaluate(() => {
    const api = window.IdenfluPreferences;
    api.set(null);
    api.set([]);
    return api.set({ fontSize: '18', lineHeight: null, spacing: Infinity, controlHeight: NaN, radius: {}, unknown: 20 });
  });
  expect(ignored).toEqual(defaults);
  const clamped = await page.evaluate(() => window.IdenfluPreferences.set({ fontSize: 99, lineHeight: 1, spacing: 149, controlHeight: 31, radius: 99 }));
  expect(clamped).toEqual({ fontSize: 18, lineHeight: 22, spacing: 150, controlHeight: 36, radius: 12 });
  const snapshot = await page.evaluate(() => {
    const api = window.IdenfluPreferences;
    const value = api.get();
    value.fontSize = -1000;
    return api.get();
  });
  expect(snapshot).toEqual(clamped);
  for (const value of ['null', '[]', '{"fontSize":"18","lineHeight":null,"spacing":"150","controlHeight":"48","radius":"12"}']) {
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: storageKey, value });
    await page.reload();
    await page.waitForFunction(() => Boolean(window.IdenfluPreferences));
    expect(await preferences(page), value).toEqual(defaults);
  }
});

test('storage failures retain in-memory adjustments and report an unsaved preference event', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript((key) => {
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function (name, ...args) {
        if (name === key) throw new DOMException('Storage unavailable in this test', 'SecurityError');
        return original.call(this, name, ...args);
      };
    }
  }, storageKey);
  await openApp(page);
  expect(await preferences(page)).toEqual(defaults);
  const result = await page.evaluate((value) => {
    let lastEvent;
    document.addEventListener('preferenceschange', (event) => { lastEvent = event.detail; }, { once: true });
    const applied = window.IdenfluPreferences.set(value);
    return { applied, event: lastEvent };
  }, custom);
  expect(result.applied).toEqual(custom);
  expect(result.event.values).toEqual(custom);
  expect(result.event.saved).toBe(false);
  await openSettings(page);
  await expectRanges(page, custom);
  expect((await metrics(page)).bodyFont).toBe(16);
  await page.locator('#studio-settings-dialog').getByRole('button', {name:'초기화',exact:true}).click();
  expect(await preferences(page)).toEqual(defaults);
  expect(errors).toEqual([]);
});

test('reset restores defaults without losing theme, form edits or validation state', async ({ page }) => {
  await openApp(page, 'patterns/form/profile');
  await page.locator('.theme-toggle').click();
  const theme = await page.evaluate(() => ({ current: document.documentElement.dataset.theme, saved: localStorage.getItem('idenflu-mono-theme') }));
  await page.getByRole('textbox', {name:'이름 필수',exact:true}).fill('편집 중인 사용자');
  await page.getByRole('textbox', {name:'이메일 필수',exact:true}).fill('invalid-email');
  await page.locator('.route-profile form button[type="submit"]').click();
  await expect(page.getByRole('textbox', {name:'이메일 필수',exact:true})).toHaveAttribute('aria-invalid', 'true');
  await page.evaluate((value) => window.IdenfluPreferences.set(value), custom);
  await openSettings(page);
  await page.locator('#studio-settings-dialog').getByRole('button', {name:'초기화',exact:true}).click();
  expect(await preferences(page)).toEqual(defaults);
  await expectRanges(page, defaults);
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
  expect(await page.evaluate(() => ({ current: document.documentElement.dataset.theme, saved: localStorage.getItem('idenflu-mono-theme') }))).toEqual(theme);
  await expect(page.getByRole('textbox', {name:'이름 필수',exact:true})).toHaveValue('편집 중인 사용자');
  await expect(page.getByRole('textbox', {name:'이메일 필수',exact:true})).toHaveValue('invalid-email');
  await expect(page.getByRole('textbox', {name:'이메일 필수',exact:true})).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#studio-preferences-close').click();
  await page.reload();
  await page.waitForFunction(() => Boolean(window.IdenfluPreferences));
  expect(await preferences(page)).toEqual(defaults);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme.current);
});

test('settings support keyboard adjustment, modal focus and Escape return', async ({ page }) => {
  await openApp(page);
  const opener = page.getByRole('button', {name:'화면 조정',exact:true});
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#studio-settings-dialog')).toBeVisible();
  const font = page.locator('#react-pref-fontSize');
  await font.focus();
  await font.press('ArrowRight');
  await expect(font).toHaveValue('15');
  expect((await preferences(page)).fontSize).toBe(15);
  await font.press('Home');
  await expect(font).toHaveValue('12');
  await font.press('End');
  await expect(font).toHaveValue('18');
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('#studio-settings-dialog').contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#studio-settings-dialog')).toBeHidden();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.setViewportSize({ width: page.viewportSize().width > 900 ? 320 : 1440, height: 900 });
  await page.locator('#studio-preferences-close').click();
  await expect(page.getByRole('button', {name:'화면 조정',exact:true})).toBeFocused();
});

test('largest preferences remain usable across every route and settings controls at 320px', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await openApp(page);
  await page.evaluate(() => window.IdenfluPreferences.set({ fontSize: 18, lineHeight: 32, spacing: 150, controlHeight: 48, radius: 12 }));
  const routes = documents.map(item => item.route);
  for (const route of routes) {
    await page.evaluate((value) => { location.hash = `#/${value}`; }, route);
    await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
    await expect(page.locator('h1:visible')).toHaveCount(1);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll, route).toBeLessThanOrEqual(dimensions.width);
  }
  await openSettings(page);
  const dialog = await page.locator('#studio-settings-dialog').boundingBox();
  expect(dialog.x).toBeGreaterThanOrEqual(0);
  expect(dialog.x + dialog.width).toBeLessThanOrEqual(320);
  for (const selector of Object.values(ranges)) {
    await page.locator(selector).focus();
    const box = await page.locator(selector).boundingBox();
    expect(box.x, selector).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, selector).toBeLessThanOrEqual(320);
    expect(box.y, selector).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, selector).toBeLessThanOrEqual(740);
  }
  await expect(page.locator('#studio-preferences-close')).toBeVisible();
  await testInfo.attach('preferences-largest-mobile.png', { body: await page.screenshot(), contentType: 'image/png' });
  await page.locator('#studio-preferences-close').click();
  await expect(page.locator('#studio-settings-dialog')).toBeHidden();
});

test('built documentation loads preferences early and portable consumers retain their own defaults', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page, 'components/text-fields', '/dist');
  const response = await page.request.get('/dist/systems/idenflu-mono/manifest.json');
  expect(response.ok()).toBe(true);
  const { files } = await response.json();
  expect(typeof files.preferences).toBe('string');
  expect((await page.request.get(`/dist/systems/idenflu-mono/${files.preferences}`)).ok()).toBe(true);
  const early = await page.evaluate((name) => {
    const script = [...document.scripts].find((element) => element.src.endsWith(`/${name}`));
    const sheet = document.querySelector('link[rel="stylesheet"]');
    return Boolean(script && !script.defer && !script.async && (script.compareDocumentPosition(sheet) & Node.DOCUMENT_POSITION_FOLLOWING));
  }, files.preferences);
  expect(early).toBe(true);
  await page.evaluate((value) => window.IdenfluPreferences.set(value), custom);
  await openSettings(page);
  await expectRanges(page, custom);
  expect((await metrics(page)).buttonFont).toBe(16);
  const consumer = await page.evaluate(async (files) => {
    const frame = document.createElement('iframe');
    const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
    frame.srcdoc = `<link rel="stylesheet" href="/dist/systems/idenflu-mono/${files.styles}"><button id="consumer-button" class="button" type="button">저장</button><script src="/dist/systems/idenflu-mono/${files.runtime}"><\/script>`;
    document.body.append(frame);
    await loaded;
    const button = frame.contentDocument.querySelector('#consumer-button');
    const style = frame.contentWindow.getComputedStyle(button);
    const value = { font: parseFloat(style.fontSize), height: button.getBoundingClientRect().height, runtime: Boolean(frame.contentWindow.IdenfluMono), dialog: Boolean(frame.contentDocument.querySelector('#studio-settings-dialog')) };
    frame.remove();
    return value;
  }, files);
  expect(consumer).toEqual({ font: 14, height: 38, runtime: true, dialog: false });
  expect(errors).toEqual([]);
});
