import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/', pretendToBeVisual:true});
for (const name of ['window','document','navigator','HTMLElement','Node','Event']) Object.defineProperty(globalThis, name, {configurable:true, value:dom.window[name]});
Object.defineProperty(document.documentElement, 'clientWidth', {configurable:true, value:1024});
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
dom.window.HTMLDialogElement.prototype.show = function () { this.setAttribute('open', ''); };
dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { Dialog, Drawer, Popover } = await import('../dist/index.js');
const {act, createElement:h} = React;
after(() => dom.window.close());

function fixture() {
  const node = document.createElement('div'); document.body.append(node);
  const root = createRoot(node);
  return {render:element => act(async () => root.render(element)), dispose:async () => {await act(async () => root.unmount());node.remove();}};
}
const props = {onOpenChange() {}};

test('initial focus targets only a modal descendant and does not repeat on content updates', async () => {
  const f = fixture(), focusRef = React.createRef();
  const outside = document.createElement('button'); document.body.append(outside);
  const view = (open, text, target = focusRef) => h(Drawer, {...props, open, initialFocusRef:target},
    h('button', {ref:focusRef}, '이름 편집'), h('button', {id:'other-focus'}, text));
  try {
    await f.render(view(false, '다음'));
    outside.focus();
    await f.render(view(true, '다음'));
    assert.equal(document.activeElement, focusRef.current);
    document.getElementById('other-focus').focus();
    await f.render(view(true, '바뀐 내용'));
    assert.equal(document.activeElement.id, 'other-focus');
    await f.render(view(false, '다음'));
    focusRef.current.focus();
    await f.render(view(true, '다음', {current:outside}));
    assert.notEqual(document.activeElement, outside);
  } finally { await f.dispose(); outside.remove(); }
});

test('Dialog restores authored overflow styles and priorities without removing unrelated changes', async () => {
  const f = fixture(), root = document.documentElement, body = document.body;
  root.style.setProperty('overflow-x', 'clip');
  root.style.setProperty('overflow-y', 'scroll', 'important');
  body.style.setProperty('overflow', 'auto', 'important');
  try {
    await f.render(h(Dialog, {...props,open:true}, '처리 중'));
    assert.equal(root.style.overflow, 'hidden');
    assert.equal(body.style.overflow, 'hidden');
    assert.equal(root.style.getPropertyPriority('overflow'), 'important');
    root.style.setProperty('--font-size-base', '18px');
    await f.render(h(Dialog, {...props,open:false}, '처리 중'));
    assert.equal(root.style.getPropertyValue('overflow-x'), 'clip');
    assert.equal(root.style.getPropertyValue('overflow-y'), 'scroll');
    assert.equal(root.style.getPropertyPriority('overflow-y'), 'important');
    assert.equal(root.style.getPropertyValue('--font-size-base'), '18px');
    assert.equal(body.style.overflow, 'auto');
    assert.equal(body.style.getPropertyPriority('overflow'), 'important');
  } finally {await f.dispose();root.removeAttribute('style');body.removeAttribute('style');}
});

test('a nonmodal Dialog leaves document scrolling and keyboard navigation available', async () => {
  const f = fixture(), focusRef = React.createRef();
  const root = document.documentElement, body = document.body;
  root.style.overflow = 'auto'; body.style.overflow = 'scroll';
  try {
    await f.render(h(Dialog, {...props,open:true,modal:false,initialFocusRef:focusRef}, h('button',{ref:focusRef},'설정')));
    const dialog = document.querySelector('dialog');
    assert.equal(dialog.open, true);
    assert.equal(dialog.getAttribute('aria-modal'), 'false');
    assert.equal(root.style.overflow, 'auto');
    assert.equal(body.style.overflow, 'scroll');
    assert.equal(document.activeElement, focusRef.current);
    const tab = new dom.window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});
    await act(async () => focusRef.current.dispatchEvent(tab));
    assert.equal(tab.defaultPrevented, false);
    await f.render(h(Dialog, {...props,open:false,modal:false}, '설정'));
    assert.equal(dialog.open, false);
    assert.equal(root.style.overflow, 'auto');
  } finally {await f.dispose();root.removeAttribute('style');body.removeAttribute('style');}
});

test('Escape closes a nonmodal dialog only after its nested popup', async () => {
  const f = fixture();
  function Example() {
    const [open,setOpen] = React.useState(true);
    return h(Dialog, {open,onOpenChange:setOpen,modal:false}, h(Popover,{trigger:'내부 설정',defaultOpen:true},h('button',null,'적용')));
  }
  try {
    await f.render(h(Example));
    const dialog = document.querySelector('dialog');
    const popup = dialog.querySelector('[role="region"]');
    await act(async () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
    assert.equal(popup.hidden, true);
    assert.equal(dialog.open, true);
    assert.equal(document.documentElement.style.overflow, '');
    await act(async () => document.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
    assert.equal(dialog.open, false);
  } finally {await f.dispose();}
});

test('modal changes during an opening preserve its native mode, focus, ARIA and lock until reopening', async () => {
  const f = fixture(), prototype = dom.window.HTMLDialogElement.prototype;
  const originalModal = prototype.showModal, originalShow = prototype.show;
  const firstRef = React.createRef(), secondRef = React.createRef();
  const calls = [], requests = [];
  prototype.showModal = function () { calls.push('modal'); originalModal.call(this); };
  prototype.show = function () { calls.push('nonmodal'); originalShow.call(this); };
  const view = (open,modal,initialFocusRef=firstRef) => h(Dialog,{open,modal,initialFocusRef,onOpenChange:value=>requests.push(value)},
    h('button',{ref:firstRef},'첫 번째'), h('button',{ref:secondRef},'두 번째'));
  const tab = async target => {
    const event = new dom.window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});
    await act(async () => target.dispatchEvent(event));
    return event.defaultPrevented;
  };
  try {
    await f.render(view(true,true));
    const dialog = document.querySelector('dialog');
    assert.equal(document.documentElement.style.overflow, 'hidden');
    await f.render(view(true,false));
    assert.deepEqual(calls,['modal']);
    assert.equal(dialog.open, true);
    assert.equal(dialog.getAttribute('aria-modal'), null);
    assert.equal(document.documentElement.style.overflow, 'hidden');
    assert.equal(await tab(firstRef.current), true);
    await f.render(view(true,false,secondRef));
    assert.equal(document.activeElement, secondRef.current);
    assert.deepEqual(calls,['modal']);
    assert.equal(document.documentElement.style.overflow, 'hidden');
    await f.render(view(false,false,secondRef));
    assert.equal(dialog.open, false);
    assert.equal(document.documentElement.style.overflow, '');
    await f.render(view(true,false,secondRef));
    assert.deepEqual(calls,['modal','nonmodal']);
    assert.equal(dialog.getAttribute('aria-modal'), 'false');
    assert.equal(document.documentElement.style.overflow, '');
    await f.render(view(true,true));
    assert.deepEqual(calls,['modal','nonmodal']);
    assert.equal(dialog.getAttribute('aria-modal'), 'false');
    assert.equal(document.documentElement.style.overflow, '');
    assert.equal(await tab(firstRef.current), false);
    await f.render(view(false,true));
    await f.render(view(true,true));
    assert.deepEqual(calls,['modal','nonmodal','modal']);
    assert.equal(dialog.getAttribute('aria-modal'), null);
    assert.equal(document.documentElement.style.overflow, 'hidden');
    await act(async () => dialog.dispatchEvent(new Event('close')));
    assert.deepEqual(requests,[]);
    await act(async () => { dialog.close(); dialog.dispatchEvent(new Event('close')); });
    assert.deepEqual(requests,[false]);
  } finally {await f.dispose();prototype.showModal=originalModal;prototype.show=originalShow;}
});

test('Dialog and Drawer in separate React roots keep the lock until the last modal leaves', async () => {
  const first = fixture(), second = fixture();
  try {
    await first.render(h(Dialog, {...props,open:true}, '첫 번째'));
    await second.render(h(Drawer, {...props,open:true}, '두 번째'));
    await first.render(h(Dialog, {...props,open:false}, '첫 번째'));
    assert.equal(document.documentElement.style.overflow, 'hidden');
    assert.equal(document.body.style.overflow, 'hidden');
    await second.render(null);
    assert.equal(document.documentElement.style.overflow, '');
    assert.equal(document.body.style.overflow, '');
    assert.equal(document.documentElement.style.getPropertyValue('scrollbar-gutter'), '');
  } finally {await first.dispose();await second.dispose();}
});

test('StrictMode replay, repeated opening and unmount release every scroll lock', async () => {
  const f = fixture();
  const view = open => h(React.StrictMode, null, h(Dialog, {...props,open}, '모달'));
  try {
    await f.render(view(true));
    assert.equal(document.documentElement.style.overflow, 'hidden');
    await f.render(view(false));
    assert.equal(document.documentElement.style.overflow, '');
    await f.render(view(true));
    assert.equal(document.documentElement.style.overflow, 'hidden');
    await f.render(null);
    assert.equal(document.documentElement.style.overflow, '');
    assert.equal(document.body.style.overflow, '');
  } finally {await f.dispose();}
});

test('a nested native cancel or close event does not close the outer dialog', async () => {
  const f = fixture();
  function Example() {
    const [outer,setOuter] = React.useState(true), [inner,setInner] = React.useState(true);
    return h(Dialog, {open:outer,onOpenChange:setOuter}, h(Dialog, {open:inner,onOpenChange:setInner}, '내부 창'));
  }
  try {
    for (const type of ['cancel','close']) {
      await f.render(h(Example, {key:type}));
      const dialogs = document.querySelectorAll('dialog');
      await act(async () => {
        if (type === 'close') dialogs[1].close();
        dialogs[1].dispatchEvent(new Event(type, {bubbles:true,cancelable:true}));
      });
      assert.equal(dialogs[1].open, false);
      assert.equal(dialogs[0].open, true);
      assert.equal(document.documentElement.style.overflow, 'hidden');
    }
  } finally {await f.dispose();}
  assert.equal(document.documentElement.style.overflow, '');
});

test('native focus scrolling and unmount preserve the original document position', async () => {
  const f = fixture(), win = dom.window, prototype = win.HTMLDialogElement.prototype;
  const showModal = prototype.showModal, scrollTo = win.scrollTo;
  win.scrollX = 12; win.scrollY = 250;
  win.scrollTo = ({left,top}) => { win.scrollX = left; win.scrollY = top; };
  prototype.showModal = function () { this.setAttribute('open','');win.scrollX=0;win.scrollY=0; };
  try {
    await f.render(h(Dialog, {...props,open:true}, '모달'));
    assert.equal(win.scrollX, 12);
    assert.equal(win.scrollY, 250);
    win.scrollY = 600;
    await f.render(null);
    assert.equal(win.scrollX, 12);
    assert.equal(win.scrollY, 250);
  } finally {
    await f.dispose();prototype.showModal=showModal;win.scrollTo=scrollTo;win.scrollX=0;win.scrollY=0;
  }
});
