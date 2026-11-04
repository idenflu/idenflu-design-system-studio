const { test, expect } = require('@playwright/test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { Badge, Icon, Table } = require('../dist/index.cjs');

const route = '/systems/idenflu-mono/index.html#/components/feedback';
const sizes = ['sm', 'md', 'lg'];
const expected = {
  sm: { height: 20, font: 12, line: 16, padding: 6, icon: 12 },
  md: { height: 24, font: 13, line: 18, padding: 8, icon: 14 },
  lg: { height: 28, font: 14, line: 20, padding: 10, icon: 16 },
};
const sample = (page, size) => page.locator('#badge-sizes').getByRole('group', { name: `${size.toUpperCase()} 배지`, exact: true }).locator('.badge');

async function metrics(badges) {
  return badges.evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
    const icon = element.querySelector('.ui-icon'), iconBounds = icon?.getBoundingClientRect();
    return {
      height: bounds.height,
      font: parseFloat(style.fontSize),
      line: parseFloat(style.lineHeight),
      padding: parseFloat(style.paddingInlineStart),
      paddingEnd: parseFloat(style.paddingInlineEnd),
      icon: iconBounds?.width ?? null,
      iconHeight: iconBounds?.height ?? null,
      color: style.color,
      background: style.backgroundColor,
      unclipped: element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1,
    };
  }));
}

async function expectSize(badges, size) {
  const values = await metrics(badges), target = expected[size];
  expect(values.length).toBeGreaterThan(0);
  for (const value of values) {
    expect(value).toMatchObject({ height: target.height, font: target.font, line: target.line, padding: target.padding, paddingEnd: target.padding, unclipped: true });
    if (value.icon !== null) expect(value).toMatchObject({ icon: target.icon, iconHeight: target.icon });
  }
  return values;
}

test('Badge sizes share geometry across text, icon and solid examples without changing status colors', { tag: ['@mobile', '@theme'] }, async ({ page }) => {
  await page.goto(route);
  const palettes = [];
  for (const size of sizes) {
    const badges = sample(page, size);
    await expect(badges).toHaveCount(3);
    expect(await badges.evaluateAll(elements => elements.map(element => element.getAttribute('data-size')))).toEqual([size, size, size]);
    const values = await expectSize(badges, size);
    expect(values.map(value => value.icon)).toEqual([null, expected[size].icon, expected[size].icon]);
    palettes.push(values.map(({ color, background }) => ({ color, background })));
  }
  expect(palettes[1]).toEqual(palettes[0]);
  expect(palettes[2]).toEqual(palettes[0]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('Badge inherits all size metrics from a scope or compact table and honors explicit overrides', { tag: ['@mobile', '@theme'] }, async ({ page }) => {
  await page.goto(route);
  const section = page.locator('#badge-size-inheritance');
  const scope = section.getByRole('group', { name: 'SM 상위 크기와 명시한 배지 크기', exact: true });
  const scopedBadges = scope.locator('.badge');
  const compactBadges = section.locator('table[data-density="compact"] .badge');
  for (const badges of [scopedBadges, compactBadges]) {
    await expect(badges).toHaveCount(3);
    expect(await badges.first().getAttribute('data-size')).toBeNull();
    for (let index = 0; index < sizes.length; index++) await expectSize(badges.nth(index), sizes[index]);
    await expect(badges.nth(1)).toHaveAttribute('data-size', 'md');
    await expect(badges.nth(2)).toHaveAttribute('data-size', 'lg');
  }
  for (const size of sizes) {
    await scope.evaluate((element, value) => element.setAttribute('data-size', value), size);
    await expectSize(scopedBadges.first(), size);
    await expectSize(scopedBadges.nth(1), 'md');
    await expectSize(scopedBadges.nth(2), 'lg');
  }
});

function standaloneMarkup() {
  const h = React.createElement;
  const badge = (size, icon = true, appearance = 'default') => h(Badge, { size, variant: 'success', appearance },
    icon ? h(Icon, { name: 'check-circle' }) : null, h('span', { 'data-badge-label': '' }, '완료'));
  return renderToStaticMarkup(h('main', { id: 'badge-fixture', style: { display: 'grid', gap: 12, padding: 8 } },
    ...sizes.map(size => h('div', { key: size, 'data-fixture-size': size, style: { display: 'flex', flexWrap: 'wrap', gap: 8 } },
      badge(size, false), badge(size), badge(size, true, 'solid'))),
    h('div', { 'data-fixture-default': '' }, badge(undefined)),
    h('div', { 'data-fixture-scope': '', 'data-size': 'sm' }, badge(undefined), badge('md'), badge('lg')),
    h(Table, { density: 'compact', style: { minWidth: 0 } }, h('tbody', null,
      ...[undefined, 'md', 'lg'].map((size, index) => h('tr', { key: index }, h('td', null, badge(size)))))),
  ));
}

async function mountStandalone(page, theme) {
  await page.setContent(`<!doctype html><html lang="ko"${theme ? ` data-theme="${theme}"` : ''}><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="/packages/react/dist/styles.css">
    <style>body { margin:0; }</style>
    </head><body>${standaloneMarkup()}</body></html>`);
}

test('published Badge styles match Studio and expand safely with larger public font settings', { tag: ['@mobile', '@theme'] }, async ({ page }) => {
  await page.goto(route);
  const theme = await page.locator('html').getAttribute('data-theme');
  const studio = {};
  for (const size of sizes) studio[size] = await metrics(sample(page, size));
  await mountStandalone(page, theme);
  for (const size of sizes) {
    const badges = page.locator(`[data-fixture-size="${size}"] .badge`);
    await expectSize(badges, size);
    expect(await metrics(badges)).toEqual(studio[size]);
  }
  await expectSize(page.locator('[data-fixture-default] .badge'), 'md');
  for (const selector of ['[data-fixture-scope] .badge', 'table[data-density="compact"] .badge']) {
    const badges = page.locator(selector);
    for (let index = 0; index < sizes.length; index++) await expectSize(badges.nth(index), sizes[index]);
  }
  await page.locator('html').evaluate(element => {
    element.style.setProperty('--font-size-base', '20px');
    element.style.setProperty('--line-height-base', '32px');
  });
  const enlarged = { sm: { height: 30, font: 18, line: 26 }, md: { height: 32, font: 19, line: 28 }, lg: { height: 34, font: 20, line: 30 } };
  for (const size of sizes) {
    const badges = page.locator(`[data-fixture-size="${size}"] .badge`);
    for (const value of await metrics(badges)) expect(value).toMatchObject({ ...enlarged[size], unclipped: true });
    const labelsInside = await badges.locator('[data-badge-label]').evaluateAll(labels => labels.every(label => {
      const text = label.getBoundingClientRect(), badge = label.closest('.badge').getBoundingClientRect();
      return text.left >= badge.left && text.right <= badge.right && text.top >= badge.top && text.bottom <= badge.bottom;
    }));
    expect(labelsInside).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
