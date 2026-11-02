const { test, expect } = require('@playwright/test');
const React = require('../packages/react/node_modules/react');
const { renderToStaticMarkup } = require('../packages/react/node_modules/react-dom/server');

const host = `<style>
  body { font-family:Georgia,serif; font-size:18px; line-height:1.6; color:#353535; background:#fff4e5; }
</style><main id="host">
  <h1>기존 제목</h1><h2>기존 부제목</h2><h3>기존 소제목</h3><p>기존 본문</p>
  <a href="#host">기존 링크</a><ul><li>기존 목록</li></ul>
  <button type="button">기존 버튼</button><input placeholder="기존 입력" />
</main>`;
async function setup(page) {
  await page.goto('/packages/react/examples/index.html');
  await page.setContent(`<!doctype html><html lang="ko"><body>${host}<div id="components" style="width:240px"></div></body></html>`);
}
async function hostMetrics(page) {
  return page.evaluate(() => {
    const props = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'backgroundColor', 'marginTop', 'marginBottom', 'paddingLeft', 'borderRadius', 'textDecorationLine', 'boxSizing', 'appearance', 'colorScheme'];
    return Object.fromEntries(['html', 'body', ...['h1', 'h2', 'h3', 'p', 'a', 'ul', 'button', 'input'].map(name => `#host ${name}`)].map(selector => {
      const element = document.querySelector(selector), style = getComputedStyle(element);
      return [selector, Object.fromEntries(props.map(prop => [prop, style[prop]]))];
    }));
  });
}

test('component CSS preserves the host page and native controls in both themes', async ({ page }) => {
  await setup(page);
  const before = await hostMetrics(page);
  await page.addStyleTag({ url: '/packages/react/dist/styles.css' });
  expect(await hostMetrics(page)).toEqual(before);
  await page.locator('html').evaluate(element => { element.dataset.theme = 'dark'; });
  expect(await hostMetrics(page)).toEqual(before);
});

test('React components keep their geometry without the optional document reset', async ({ page }) => {
  const { Button, TextField, Chip, Card, Tabs } = require('../packages/react/dist/index.cjs');
  await setup(page);
  const before = await hostMetrics(page);
  const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(Button, null, '컴포넌트 버튼'),
    React.createElement(TextField, { label: '컴포넌트 입력', defaultValue: '입력값' }),
    React.createElement(Chip, { interactive: false }, '표시 칩'),
    React.createElement(Card, null, React.createElement('h3', null, '카드 제목'), React.createElement('p', null, '카드 본문')),
    React.createElement(Tabs, { label: '컴포넌트 탭', items: [{ value: 'one', label: '첫 탭', content: '탭 내용' }, { value: 'two', label: '둘째 탭', content: '둘째 내용' }] }),
  ));
  await page.locator('#components').evaluate((element, html) => { element.innerHTML = html; }, markup);
  await page.addStyleTag({ url: '/packages/react/dist/styles.css' });
  await expect(page.locator('#components .button')).toHaveCSS('font-size', '14px');
  await expect(page.locator('#components .button')).toHaveCSS('box-sizing', 'border-box');
  await expect(page.locator('#components .text-input')).toHaveCSS('height', '38px');
  await expect(page.locator('#components .text-input')).toHaveCSS('width', '240px');
  await expect(page.locator('#components .chip')).toHaveCSS('font-size', '14px');
  await expect(page.locator('#components .tab-list')).toHaveCSS('display', 'flex');
  expect(await hostMetrics(page)).toEqual(before);
});

test('document reset is an explicit opt-in for applications adopting the whole system', async ({ page }) => {
  await setup(page);
  await page.addStyleTag({ url: '/packages/react/dist/reset.css' });
  await page.addStyleTag({ url: '/packages/react/dist/styles.css' });
  await expect(page.locator('html')).toHaveCSS('font-size', '14px');
  await expect(page.locator('#host a')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.locator('#host h1')).toHaveCSS('margin-top', '0px');
});
