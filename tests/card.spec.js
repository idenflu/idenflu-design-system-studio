const { test, expect } = require('@playwright/test');
const React = require('../packages/idenflu-mono-react/node_modules/react');
const { renderToStaticMarkup } = require('../packages/idenflu-mono-react/node_modules/react-dom/server');

test('card parts use explicit classes and radius respects defaults and overrides', { tag: '@mobile' }, async ({ page }) => {
  const { Card, CardTitle, CardDescription, CardLabel, CardFooter } = require('../packages/idenflu-mono-react/dist/index.cjs');
  const h = React.createElement;
  const markup = renderToStaticMarkup(h(React.Fragment, null,
    h(Card, { id: 'default', style: { '--radius-control': '5px' } },
      h(CardLabel, { className: 'custom-label' }, 'LABEL'),
      h(CardTitle, { as: 'h2', id: 'title' }, 'Title'),
      h(CardDescription, null, 'Description'),
      h('div', null, h('h3', { id: 'nested-title' }, 'Nested title'), h('p', { id: 'nested-text' }, 'Nested text')),
      h(CardFooter, null, 'Footer')),
    h(Card, { id: 'number', radius: 8 }),
    h(Card, { id: 'string', radius: '1rem' }),
    h(Card, { id: 'style', radius: 8, style: { borderRadius: 3 } }),
  ));
  await page.goto('/');
  await page.setContent(`<div>${markup}</div>`);
  await page.addStyleTag({ url: '/packages/idenflu-mono-react/dist/styles.css' });
  await expect(page.locator('#default')).toHaveCSS('border-radius', '5px');
  await expect(page.locator('#number')).toHaveCSS('border-radius', '8px');
  await expect(page.locator('#string')).toHaveCSS('border-radius', '16px');
  await expect(page.locator('#style')).toHaveCSS('border-radius', '3px');
  await expect(page.locator('#title')).toHaveClass('card-title');
  await expect(page.locator('#title')).toHaveCSS('margin-top', '12px');
  await expect(page.locator('#nested-title')).toHaveCSS('margin-top', '0px');
  await expect(page.locator('#nested-text')).toHaveCSS('margin-top', '0px');
  await expect(page.locator('.card-description')).toHaveCSS('margin-top', '8px');
  await expect(page.locator('.custom-label')).toHaveClass(/card-label/);
  await expect(page.locator('.card-footer')).toHaveCSS('display', 'flex');
});
