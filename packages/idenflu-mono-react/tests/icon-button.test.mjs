import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
const { IconButton } = await import('../dist/index.js');
const { act, createElement: h } = React;
after(() => dom.window.close());

function fixture() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  return {
    container,
    async render(element) { await act(async () => root.render(element)); },
    async dispose() { await act(async () => root.unmount()); container.remove(); },
  };
}
const icon = () => h('svg', { 'data-icon': 'settings', role: 'img', 'aria-label': '장식 아이콘', viewBox: '0 0 16 16' }, h('path', { d: 'M2 8h12' }));
const tooltipText = (container, button) => button.getAttribute('aria-describedby')?.split(' ').map(id => container.querySelector(`[id="${id}"]`)?.textContent).filter(Boolean);

test('IconButton supplies its name, default tooltip and button semantics while forwarding refs and native props', async () => {
  const f = fixture(), ref = React.createRef(); let clicks = 0;
  try {
    await f.render(h(IconButton, {
      ref, id: 'settings-button', label: '설정', name: 'action', value: 'settings',
      className: 'custom-action', 'data-action': 'settings', 'aria-label': '다른 이름',
      iconOnly: false, onClick: () => clicks++,
    }, icon()));
    const button = f.container.querySelector('button');
    assert.equal(ref.current, button);
    assert.equal(button.id, 'settings-button');
    assert.equal(button.type, 'button');
    assert.equal(button.name, 'action');
    assert.equal(button.value, 'settings');
    assert.equal(button.getAttribute('data-action'), 'settings');
    assert.equal(button.getAttribute('aria-label'), '설정');
    assert.equal(button.classList.contains('button--ghost'), true);
    assert.equal(button.classList.contains('button--icon'), true);
    assert.equal(button.classList.contains('custom-action'), true);
    assert.ok(button.querySelector('[data-icon]').closest('[aria-hidden="true"]'));
    assert.deepEqual(tooltipText(f.container, button), ['설정']);
    assert.equal(button.hasAttribute('label'), false);
    assert.equal(button.hasAttribute('tooltip'), false);
    assert.equal(button.hasAttribute('icononly'), false);
    await act(async () => button.click());
    assert.equal(clicks, 1);
  } finally { await f.dispose(); }
});

test('IconButton preserves native disabled behavior and caller event handlers', async () => {
  const f = fixture(); let clicks = 0, focuses = 0; const keys = [];
  try {
    const render = disabled => h(IconButton, {
      label: '다운로드', disabled, tooltip: false,
      onClick: () => clicks++, onFocus: () => focuses++,
      onKeyDown: event => keys.push(event.key),
    }, icon());
    await f.render(render(false));
    const button = f.container.querySelector('button');
    await act(async () => {
      button.focus();
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      button.click();
    });
    assert.equal(document.activeElement, button);
    assert.equal(focuses, 1);
    assert.deepEqual(keys, ['Enter']);
    assert.equal(clicks, 1);
    await f.render(render(true));
    assert.equal(button.disabled, true);
    await act(async () => button.click());
    assert.equal(clicks, 1);
  } finally { await f.dispose(); }
});

test('IconButton shares Button variants, sizes and explicit native button types', async () => {
  const f = fixture();
  try {
    for (const size of ['sm', 'md', 'lg']) {
      await f.render(h(IconButton, { label: '저장', variant: 'default', color: 'primary', size, type: 'submit', tooltip: false }, icon()));
      const button = f.container.querySelector('button');
      assert.equal(button.type, 'submit');
      assert.equal(button.getAttribute('data-size'), size);
      assert.equal(button.classList.contains('button--icon'), true);
      assert.equal(button.classList.contains('button--ghost'), false);
    }
    await f.render(h(IconButton, { label: '초기화', variant: 'outline', type: 'reset', tooltip: false }, icon()));
    assert.equal(f.container.querySelector('button').type, 'reset');
    assert.ok(f.container.querySelector('.button--outline'));
  } finally { await f.dispose(); }
});

test('IconButton merges custom tooltip descriptions, updates its label and can omit the tooltip', async () => {
  const f = fixture();
  try {
    const render = props => h('div', null,
      h('p', { id: 'action-help' }, '사용자 설명'),
      h(IconButton, { label: '도움말', 'aria-describedby': 'action-help', ...props }, icon()),
    );
    await f.render(render({ tooltip: h('strong', null, '자세한 안내') }));
    let button = f.container.querySelector('button');
    assert.equal(button.getAttribute('aria-label'), '도움말');
    assert.deepEqual(tooltipText(f.container, button), ['사용자 설명', '자세한 안내']);
    assert.equal(f.container.querySelector('[role=tooltip] strong').textContent, '자세한 안내');

    await f.render(render({ label: '검색' }));
    button = f.container.querySelector('button');
    assert.equal(button.getAttribute('aria-label'), '검색');
    assert.deepEqual(tooltipText(f.container, button), ['사용자 설명', '검색']);

    await f.render(render({ label: '닫기', tooltip: false }));
    button = f.container.querySelector('button');
    assert.equal(button.getAttribute('aria-label'), '닫기');
    assert.equal(button.getAttribute('aria-describedby'), 'action-help');
    assert.equal(f.container.querySelector('[role=tooltip]'), null);
    assert.equal(f.container.querySelector('.tooltip-wrap'), null);
  } finally { await f.dispose(); }
});

test('IconButton default names and custom or omitted tooltips are present in server markup', () => {
  const markup = renderToString(h('div', null,
    h(IconButton, { label: '설정' }, icon()),
    h(IconButton, { label: '다운로드', tooltip: h('strong', null, '파일 받기') }, icon()),
    h(IconButton, { label: '닫기', tooltip: false }, icon()),
  ));
  const container = document.createElement('div');
  container.innerHTML = markup;
  const buttons = [...container.querySelectorAll('button')];
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-label')), ['설정', '다운로드', '닫기']);
  assert.deepEqual(buttons.map(button => button.type), ['button', 'button', 'button']);
  assert.equal(container.querySelectorAll('[role=tooltip]').length, 2);
  assert.deepEqual([...container.querySelectorAll('[role=tooltip]')].map(element => element.textContent), ['설정', '파일 받기']);
  for (const button of buttons) assert.ok(button.querySelector('[data-icon]').closest('[aria-hidden="true"]'));
});
