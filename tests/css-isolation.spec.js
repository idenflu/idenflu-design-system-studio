const { test, expect } = require('@playwright/test');
const React = require('../packages/idenflu-mono-react/node_modules/react');
const { renderToStaticMarkup } = require('../packages/idenflu-mono-react/node_modules/react-dom/server');

const host = `<style>
  body { font-family:Georgia,serif; font-size:18px; line-height:1.6; color:#353535; background:#fff4e5; }
</style><main id="host">
  <h1>기존 제목</h1><h2>기존 부제목</h2><h3>기존 소제목</h3><p>기존 본문</p>
  <a href="#host">기존 링크</a><ul><li>기존 목록</li></ul>
  <button type="button">기존 버튼</button><input placeholder="기존 입력" />
</main>`;
async function setup(page) {
  await page.goto('/');
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
  await page.addStyleTag({ url: '/packages/idenflu-mono-react/dist/styles.css' });
  expect(await hostMetrics(page)).toEqual(before);
  await page.locator('html').evaluate(element => { element.dataset.theme = 'dark'; });
  expect(await hostMetrics(page)).toEqual(before);
});

test('React components keep their geometry without the optional document reset', async ({ page }) => {
  const { Button, TextField, Chip, Card, Tabs } = require('../packages/idenflu-mono-react/dist/index.cjs');
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
  await page.addStyleTag({ url: '/packages/idenflu-mono-react/dist/styles.css' });
  await expect(page.locator('#components .button')).toHaveCSS('font-size', '14px');
  await expect(page.locator('#components .button')).toHaveCSS('box-sizing', 'border-box');
  await expect(page.locator('#components .text-input')).toHaveCSS('height', '36px');
  await expect(page.locator('#components .text-input')).toHaveCSS('width', '240px');
  await expect(page.locator('#components .chip')).toHaveCSS('font-size', '14px');
  await expect(page.locator('#components .tab-list')).toHaveCSS('display', 'flex');
  expect(await hostMetrics(page)).toEqual(before);
});

test('document reset is an explicit opt-in for applications adopting the whole system', async ({ page }) => {
  await setup(page);
  await page.addStyleTag({ url: '/packages/idenflu-mono-react/dist/reset.css' });
  await page.addStyleTag({ url: '/packages/idenflu-mono-react/dist/styles.css' });
  await expect(page.locator('html')).toHaveCSS('font-size', '14px');
  await expect(page.locator('#host a')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.locator('#host h1')).toHaveCSS('margin-top', '0px');
});

for (const variant of ['default', 'divided']) {
  test(`${variant} dialog sections keep spacing and aligned actions with only package CSS`, {tag:['@theme','@mobile']}, async ({ page }, testInfo) => {
    const { Dialog, DialogHeader, DialogBody, DialogFooter, Button } = require('../packages/idenflu-mono-react/dist/index.cjs');
    await setup(page);
    const before = await hostMetrics(page);
    const markup = renderToStaticMarkup(React.createElement(Dialog, {
      open: false, onOpenChange() {}, variant,
      'aria-labelledby': 'package-dialog-title', 'aria-describedby': 'package-dialog-description',
    },
    React.createElement(DialogHeader, null, React.createElement('h2', {id:'package-dialog-title'}, '스케줄 관리 닫기')),
    React.createElement(DialogBody, null, React.createElement('p', {id:'package-dialog-description'}, '저장하지 않은 작업 내용이 사라질 수 있습니다.')),
    React.createElement(DialogFooter, null,
      React.createElement(Button, {variant:'ghost'}, '취소'),
      React.createElement(Button, {variant:'danger'}, '탭 닫기'),
    )));
    await page.locator('#components').evaluate((element, html) => { element.innerHTML = html; }, markup);
    await page.addStyleTag({url:'/packages/idenflu-mono-react/dist/styles.css'});
    await page.locator('html').evaluate((element, theme) => { element.dataset.theme = theme; }, testInfo.project.use.colorScheme);
    expect(await hostMetrics(page)).toEqual(before);
    await page.locator('dialog').evaluate(element => element.showModal());
    const dialog = page.getByRole('dialog', {name:'스케줄 관리 닫기'});
    const footer = dialog.locator('.dialog-footer');
    await expect(footer).toHaveCSS('display', 'flex');
    await expect(footer).toHaveCSS('justify-content', 'flex-end');
    const geometry = await dialog.evaluate(element => {
      const header = element.querySelector('.dialog-header').getBoundingClientRect();
      const text = element.querySelector('.dialog-body p').getBoundingClientRect();
      const footer = element.querySelector('.dialog-footer');
      const buttons = [...footer.querySelectorAll('button')].map(button => button.getBoundingClientRect());
      const style = getComputedStyle(footer), bounds = footer.getBoundingClientRect();
      return {
        descriptionGap: text.top - header.bottom,
        actionsGap: buttons[0].top - text.bottom,
        buttonGap: buttons[1].left - buttons[0].right,
        alignedRight: bounds.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth) - buttons[1].right,
        headerBorder: getComputedStyle(element.querySelector('.dialog-header')).borderBottomWidth,
        footerBorder: style.borderTopWidth,
        overflows: element.scrollWidth > element.clientWidth,
      };
    });
    expect(geometry.descriptionGap).toBeGreaterThanOrEqual(8);
    expect(geometry.actionsGap).toBeGreaterThanOrEqual(16);
    expect(geometry.buttonGap).toBeGreaterThanOrEqual(8);
    expect(Math.abs(geometry.alignedRight)).toBeLessThan(1);
    expect(geometry.headerBorder).toBe(variant === 'divided' ? '1px' : '0px');
    expect(geometry.footerBorder).toBe(variant === 'divided' ? '1px' : '0px');
    expect(geometry.overflows).toBe(false);
    await expect(footer.getByRole('button', {name:'탭 닫기'})).toBeInViewport();
  });
}
