const { test, expect } = require('@playwright/test');

const storageKey = 'idenflu-mono-preferences-v1';
const defaults = { fontSize: 14, lineHeight: 22, spacing: 100, controlHeight: 38, radius: 0 };
const custom = { fontSize: 16, lineHeight: 26, spacing: 125, controlHeight: 44, radius: 6 };
const ranges = {
  fontSize: '#studio-font-size',
  lineHeight: '#studio-line-height',
  spacing: '#studio-spacing',
  controlHeight: '#studio-control-height',
  radius: '#studio-radius',
};

async function openApp(page, route = 'components/select', prefix = '') {
  await page.goto(`${prefix}/systems/idenflu-mono/index.html#/${route}`);
  await page.waitForFunction(() => Boolean(window.IdenfluPreferences));
  await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
}

async function openSettings(page) {
  const opener = page.locator('[data-studio-settings-open]:visible').first();
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
    const button = document.querySelector('#studio-preview-button');
    const input = document.querySelector('#studio-preview-input');
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
    await page.locator(selector).evaluate((input, value) => {
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, custom[key]);
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
  const sizes = await page.evaluate(() => [...document.querySelectorAll('.size-preview')].map((group) => {
    const button = group.querySelector('.button');
    return { size: group.dataset.size, height: parseFloat(getComputedStyle(button).height), font: parseFloat(getComputedStyle(button).fontSize) };
  }));
  expect(sizes.map((size) => size.size)).toEqual(['sm', 'md', 'lg']);
  expect(sizes[0].height).toBeLessThan(sizes[1].height);
  expect(sizes[1].height).toBeLessThan(sizes[2].height);
  expect(sizes.every((size) => size.font === 16)).toBe(true);
  await page.locator('#studio-preferences-close').click();
  await page.evaluate(() => { location.hash = '#/components/text-fields'; });
  await expect(page.locator('#view-text-fields')).toBeVisible();
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
  await page.locator('#studio-preferences-copy').click();
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
  await page.locator('#studio-preferences-reset').click();
  expect(await preferences(page)).toEqual(defaults);
  expect(errors).toEqual([]);
});

test('reset restores defaults without losing theme, form edits or validation state', async ({ page }) => {
  await openApp(page, 'patterns/form/profile');
  await page.locator('[data-theme-toggle]:visible').first().click();
  const theme = await page.evaluate(() => ({ current: document.documentElement.dataset.theme, saved: localStorage.getItem('idenflu-mono-theme') }));
  await page.locator('#profile-name').fill('편집 중인 사용자');
  await page.locator('#profile-email').fill('invalid-email');
  await page.locator('#profile-form button[type="submit"]').click();
  await expect(page.locator('#profile-email')).toHaveAttribute('aria-invalid', 'true');
  await page.evaluate((value) => window.IdenfluPreferences.set(value), custom);
  await openSettings(page);
  await page.locator('#studio-preferences-reset').click();
  expect(await preferences(page)).toEqual(defaults);
  await expectRanges(page, defaults);
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
  expect(await page.evaluate(() => ({ current: document.documentElement.dataset.theme, saved: localStorage.getItem('idenflu-mono-theme') }))).toEqual(theme);
  await expect(page.locator('#profile-name')).toHaveValue('편집 중인 사용자');
  await expect(page.locator('#profile-email')).toHaveValue('invalid-email');
  await expect(page.locator('#profile-email')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#studio-preferences-close').click();
  await page.reload();
  await page.waitForFunction(() => Boolean(window.IdenfluPreferences));
  expect(await preferences(page)).toEqual(defaults);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme.current);
});

test('settings support keyboard adjustment, modal focus and Escape return', async ({ page }) => {
  await openApp(page);
  const opener = page.locator('[data-studio-settings-open]:visible').first();
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#studio-settings-dialog')).toBeVisible();
  const font = page.locator('#studio-font-size');
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
  await expect(page.locator('[data-studio-settings-open]:visible').first()).toBeFocused();
});

test('largest preferences remain usable across every route and settings controls at 320px', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await openApp(page);
  await page.evaluate(() => window.IdenfluPreferences.set({ fontSize: 18, lineHeight: 32, spacing: 150, controlHeight: 48, radius: 12 }));
  const routes = await page.locator('[data-route]').evaluateAll((views) => views.map((view) => view.dataset.route));
  for (const route of routes) {
    await page.evaluate((value) => { location.hash = `#/${value}`; }, route);
    await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
    await expect(page.locator('h1:visible')).toHaveCount(1);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll, route).toBeLessThanOrEqual(dimensions.width);
  }
  await page.evaluate(() => { location.hash = '#/components/date-picker'; });
  const dateView = page.locator('[data-route="components/date-picker"]');
  await expect(dateView).toBeVisible();
  for (const picker of await dateView.locator('[data-date-picker]').all()) {
    await picker.locator('.date-trigger').click();
    const popup = picker.locator('.date-popup');
    await expect(popup).toBeVisible();
    const box = await popup.boundingBox();
    const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: innerHeight }));
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
  }
  const lastPicker = dateView.locator('[data-date-picker]').last();
  await lastPicker.locator('.date-trigger').click();
  await page.evaluate(async () => {
    window.IdenfluPreferences.set({ fontSize: 12, lineHeight: 18, spacing: 75, controlHeight: 32, radius: 0 });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const livePopup = lastPicker.locator('.date-popup');
  if (await livePopup.isVisible()) {
    const box = await livePopup.boundingBox();
    const bounds = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: innerHeight }));
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.width);
    expect(box.y + box.height).toBeLessThanOrEqual(bounds.height);
    await page.keyboard.press('Escape');
  } else await expect(lastPicker.locator('.date-trigger')).toHaveAttribute('aria-expanded', 'false');
  await page.evaluate(() => window.IdenfluPreferences.set({ fontSize: 18, lineHeight: 32, spacing: 150, controlHeight: 48, radius: 12 }));
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
  await openApp(page, 'components/select', '/dist');
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
    document.body.append(frame);
    frame.srcdoc = `<link rel="stylesheet" href="/dist/systems/idenflu-mono/${files.styles}"><button id="consumer-button" class="button" type="button">저장</button><script src="/dist/systems/idenflu-mono/${files.runtime}"><\/script>`;
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
