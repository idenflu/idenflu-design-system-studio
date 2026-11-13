import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><head><style>.popup-test-ltr button{direction:ltr}.popup-test-rtl button{direction:rtl}</style></head><body></body></html>', { url:'http://localhost/', pretendToBeVisual:true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'KeyboardEvent']) Object.defineProperty(globalThis, name, { configurable:true, value:dom.window[name] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
const { Popover, DropdownMenu, DropdownMenuItem } = await import('../dist/index.js');
const { act, createElement:h } = React;

let layout;
const observers = new Set();
dom.window.ResizeObserver = class {
  targets = new Set();
  constructor(callback) { this.callback = callback; observers.add(this); }
  observe(element) { this.targets.add(element); }
  disconnect() { observers.delete(this); }
};
Object.defineProperty(document.documentElement, 'clientWidth', { configurable:true, get:() => layout.viewportWidth });
const isPopup = element => element.matches('.popover-content,.action-options');
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable:true, get() { return isPopup(this) ? layout.popupWidth : layout.triggerWidth; } });
const rect = (left, width) => ({ x:left, y:100, top:100, bottom:138, left, right:left + width, width, height:38, toJSON() {} });
HTMLElement.prototype.getBoundingClientRect = function () {
  if (isPopup(this)) return rect(layout.originLeft + (parseFloat(this.style.left) || 0) * layout.scale, layout.popupWidth * layout.scale);
  if (this.hasAttribute('aria-expanded')) return rect(layout.triggerLeft, layout.triggerWidth);
  return rect(layout.originLeft, 500);
};
after(() => dom.window.close());

function fixture(direction = 'ltr') {
  layout = { triggerLeft:300, triggerWidth:80, popupWidth:240, originLeft:93, viewportWidth:1024, scale:1 };
  const node = document.createElement('div');
  node.className = `popup-test-${direction}`;
  document.body.append(node);
  const root = createRoot(node);
  return {
    node,
    render:element => act(async () => root.render(element)),
    dispose:async () => { await act(async () => root.unmount()); node.remove(); assert.equal(observers.size, 0); },
  };
}
const menuItems = [{ label:'편집', value:'edit' }, { label:'사용 안 함', value:'disabled', disabled:true }, { label:'복사', value:'copy' }];
const view = (Component, props = {}) => h(Component, { trigger:h('button', {type:'button'}, '열기'), ...(Component === Popover ? { defaultOpen:true } : { onSelect() {} }), ...props }, Component === Popover ? '내용' : menuItems.map(item => h(DropdownMenuItem, { key:item.value, value:item.value, disabled:item.disabled }, item.label)));
const click = element => act(async () => element.click());
const key = (element, value) => act(async () => element.dispatchEvent(new KeyboardEvent('keydown', { key:value, bubbles:true, cancelable:true })));
const popup = node => node.querySelector('.popover-content,.action-options');
const left = node => popup(node).getBoundingClientRect().left;
async function openMenu(Component, node) { if (Component === DropdownMenu) await click(node.querySelector('[aria-expanded]')); }

for (const Component of [Popover, DropdownMenu]) {
  for (const direction of ['ltr', 'rtl']) {
    test(`${Component.name} uses logical ${direction} alignment and defaults to start`, async () => {
      const f = fixture(direction);
      try {
        const expected = direction === 'ltr' ? { start:300, center:220, end:140 } : { start:140, center:220, end:300 };
        for (const align of [undefined, 'start', 'center', 'end']) {
          await f.render(view(Component, { align }));
          if (popup(f.node).hidden) await openMenu(Component, f.node);
          assert.equal(popup(f.node).dataset.align, align ?? 'start');
          // JSDOM's CSS parser drops right:auto; verify the positioned edge instead.
          assert.equal(left(f.node), expected[align ?? 'start']);
        }
      } finally { await f.dispose(); }
    });
  }

  test(`${Component.name} clamps both viewport edges without changing the preferred alignment`, async () => {
    const f = fixture();
    try {
      layout.triggerLeft = 960;
      layout.triggerWidth = 40;
      await f.render(view(Component, { align:'start' }));
      await openMenu(Component, f.node);
      assert.equal(left(f.node), 772);
      assert.equal(popup(f.node).dataset.align, 'start');
      layout.triggerLeft = -50;
      await f.render(view(Component, { align:'end' }));
      assert.equal(left(f.node), 12);
      assert.equal(popup(f.node).dataset.align, 'end');
    } finally { await f.dispose(); }
  });

  test(`${Component.name} updates for popup resize, ancestor scroll, viewport resize and scale`, async () => {
    const f = fixture();
    try {
      await f.render(view(Component, { align:'end' }));
      await openMenu(Component, f.node);
      assert.equal(left(f.node), 140);
      const observer = [...observers].find(item => item.targets.has(popup(f.node)));
      assert.ok(observer);
      assert.ok(observer.targets.has(f.node.querySelector('[aria-expanded]')));
      layout.popupWidth = 320;
      await act(async () => observer.callback([], observer));
      assert.equal(left(f.node), 60);
      // The containing block has its own border/scroll origin, separate from the trigger.
      layout.originLeft = 53;
      layout.triggerLeft = 500;
      await act(async () => f.node.dispatchEvent(new Event('scroll')));
      assert.equal(left(f.node), 260);
      layout.viewportWidth = 480;
      await act(async () => window.dispatchEvent(new Event('resize')));
      assert.equal(left(f.node), 148);
      layout.scale = 0.5;
      await act(async () => observer.callback([], observer));
      assert.equal(left(f.node), 308);
      assert.equal(popup(f.node).style.left, '510px');
    } finally { await f.dispose(); }
  });
}

test('end-aligned menus retain keyboard focus, selection, Escape and outside dismissal', async () => {
  const f = fixture(), selected = [];
  try {
    await f.render(view(DropdownMenu, { align:'end', onSelect:value => selected.push(value) }));
    const trigger = f.node.querySelector('[aria-expanded]');
    await key(trigger, 'ArrowUp');
    const items = f.node.querySelectorAll('[role=menuitem]');
    assert.equal(document.activeElement, items[2]);
    await key(items[2], 'ArrowDown');
    assert.equal(document.activeElement, items[0]);
    await click(items[0]);
    assert.deepEqual(selected, ['edit']);
    assert.equal(document.activeElement, trigger);
    await key(trigger, 'ArrowDown');
    await key(document.activeElement, 'Escape');
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, trigger);
    await click(trigger);
    await act(async () => document.body.dispatchEvent(new Event('pointerdown', { bubbles:true })));
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  } finally { await f.dispose(); }
});

test('aligned popups render on the server', () => {
  assert.match(renderToString(view(Popover, { align:'center' })), /data-align="center"/);
  assert.match(renderToString(view(DropdownMenu, { align:'end' })), /data-align="end"/);
});
