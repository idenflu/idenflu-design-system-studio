import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
const { Badge, Icon, Table } = await import('../dist/index.js');
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

test('Badge maps each explicit size to data-size while preserving content, variants and native props', async () => {
  const f = fixture(); let clicks = 0;
  try {
    for (const size of ['sm', 'md', 'lg']) {
      await f.render(h(Badge, {
        size, variant: 'success', appearance: 'solid', className: 'custom-badge',
        id: 'status', title: '처리 상태', role: 'status', 'data-record': 'complete',
        onClick: () => clicks++,
      }, h(Icon, { name: 'check' }), '완료'));
      const badge = f.container.querySelector('#status');
      assert.equal(badge.tagName, 'SPAN');
      assert.equal(badge.getAttribute('data-size'), size);
      assert.equal(badge.hasAttribute('size'), false);
      assert.equal(badge.getAttribute('role'), 'status');
      assert.equal(badge.getAttribute('title'), '처리 상태');
      assert.equal(badge.getAttribute('data-record'), 'complete');
      assert.equal(badge.textContent, '완료');
      assert.equal(badge.className, 'badge badge--success badge--solid custom-badge');
      assert.equal(badge.querySelector('.ui-icon').getAttribute('aria-hidden'), 'true');
      assert.equal(badge.hasAttribute('variant'), false);
      assert.equal(badge.hasAttribute('appearance'), false);
      await act(async () => badge.click());
    }
    assert.equal(clicks, 3);
  } finally { await f.dispose(); }
});

test('Badge leaves its size unset for scope and compact table inheritance, but retains an explicit md override', async () => {
  const f = fixture();
  try {
    const render = size => h('div', { 'data-size': 'lg' },
      h(Badge, { id: 'scoped-badge' }, '기본'),
      h(Table, { density: 'compact' }, h('tbody', null, h('tr', null,
        h('td', null, h(Badge, { id: 'table-badge', size }, '완료')),
      ))),
    );
    await f.render(render('md'));
    assert.equal(f.container.querySelector('#scoped-badge').hasAttribute('data-size'), false);
    const badge = f.container.querySelector('#table-badge');
    assert.equal(badge.closest('table').getAttribute('data-density'), 'compact');
    assert.equal(badge.getAttribute('data-size'), 'md');
    assert.equal(badge.hasAttribute('size'), false);
    await f.render(render(undefined));
    assert.equal(badge.hasAttribute('data-size'), false);
    assert.equal(badge.hasAttribute('size'), false);
    assert.equal(badge.className, 'badge');
  } finally { await f.dispose(); }
});

test('Badge preserves an existing data-size unless the public size prop explicitly overrides it', async () => {
  const f = fixture();
  try {
    await f.render(h(Badge, { 'data-size': 'lg' }, '기존 크기'));
    const badge = f.container.querySelector('.badge');
    assert.equal(badge.getAttribute('data-size'), 'lg');
    await f.render(h(Badge, { 'data-size': 'lg', size: 'sm' }, '명시 크기'));
    assert.equal(badge.getAttribute('data-size'), 'sm');
    assert.equal(badge.hasAttribute('size'), false);
    await f.render(h(Badge, null, '기본 크기'));
    assert.equal(badge.hasAttribute('data-size'), false);
  } finally { await f.dispose(); }
});

test('Badge server markup exposes explicit sizes without fixing the default or leaking component props', () => {
  const markup = renderToString(h('div', null,
    h(Badge, { id: 'default' }, '기본'),
    ...['sm', 'md', 'lg'].map(size => h(Badge, {
      key: size, id: size, size, variant: 'warning', appearance: 'solid',
    }, h(Icon, { name: 'warning' }), size)),
  ));
  const container = document.createElement('div');
  container.innerHTML = markup;
  assert.equal(container.querySelector('#default').hasAttribute('data-size'), false);
  for (const size of ['sm', 'md', 'lg']) {
    const badge = container.querySelector(`#${size}`);
    assert.equal(badge.getAttribute('data-size'), size);
    assert.ok(badge.classList.contains('badge--warning'));
    assert.ok(badge.classList.contains('badge--solid'));
    assert.ok(badge.querySelector('.ui-icon'));
  }
  assert.equal(container.querySelector('[size], [variant], [appearance]'), null);
});
