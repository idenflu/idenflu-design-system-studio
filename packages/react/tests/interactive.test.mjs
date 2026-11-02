import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent']) Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
const { DropdownMenu, Popover, Slider, Slides, TextField, Toast, FileUpload, DataState } = await import('../dist/index.js');
const { act, createElement: h } = React;
const fixture = () => { const node = document.createElement('div'); document.body.append(node); const root = createRoot(node); return { node, render: async element => act(async () => root.render(element)), dispose: async () => { await act(async () => root.unmount()); node.remove(); } }; };
const click = async element => { assert.ok(element); await act(async () => element.click()); };
after(() => dom.window.close());

test('FileUpload rejects oversized files, shows selection and supports removal', async () => {
  const f = fixture(), changes = [], errors = [];
  try {
    await f.render(h(FileUpload, {accept:'image/png', maxSizeBytes:3, onFilesChange: files => changes.push(files.map(file => file.name)), onInvalidFiles: message => errors.push(message)}));
    const input = f.node.querySelector('input');
    const choose = async file => { Object.defineProperty(input, 'files', {configurable:true, value:[file]}); await act(async () => input.dispatchEvent(new Event('change', {bubbles:true}))); };
    await choose(new dom.window.File(['1234'], 'large.png', {type:'image/png'}));
    assert.match(errors[0], /크기/);
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    assert.equal(input.checkValidity(), false);
    await choose(new dom.window.File(['12'], 'ok.png', {type:'image/png'}));
    assert.equal(f.node.querySelector('.upload-result strong').textContent, 'ok.png');
    await click([...f.node.querySelectorAll('button')].find(button => button.textContent === '제거'));
    assert.deepEqual(changes.at(-1), []);
    assert.equal(f.node.querySelector('.upload-result'), null);
  } finally { await f.dispose(); }
});

test('DataState loads, filters results and allows clearing the query', async () => {
  const f = fixture();
  try {
    await f.render(h(DataState, {load: async () => ['디자인', '개발'], matches: (item, query) => item.includes(query), getKey: item => item, renderItem: item => item}));
    await click([...f.node.querySelectorAll('button')].find(button => button.textContent === '목록 불러오기'));
    assert.match(f.node.textContent, /2개 항목/);
    const input = f.node.querySelector('input');
    await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, '없는 항목'); input.dispatchEvent(new Event('input', { bubbles:true })); });
    assert.match(f.node.textContent, /검색 결과가 없습니다/);
    await click([...f.node.querySelectorAll('button')].find(button => button.textContent === '검색 초기화'));
    assert.match(f.node.textContent, /2개 항목/);
  } finally { await f.dispose(); }
});

test('package components render on the server without browser-only side effects', () => {
  assert.match(renderToString(h(TextField, { label: '이름', defaultValue: 'mono' })), /mono/);
  assert.match(renderToString(h(Popover, { trigger: '열기' }, '내용')), /aria-expanded="false"/);
});

test('dropdown selection and Escape return focus to its trigger', async () => {
  const f = fixture(), selected = [];
  try {
    await f.render(h(DropdownMenu, { trigger: '메뉴', label: '작업', items: [{ label: '편집', value: 'edit' }, { label: '삭제', value: 'delete', disabled: true }], onSelect: value => selected.push(value) }));
    const trigger = f.node.querySelector('[aria-haspopup=menu]');
    await click(trigger);
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    const items = f.node.querySelectorAll('[role=menuitem]');
    assert.equal(items[1].disabled, true);
    await click(items[0]);
    assert.deepEqual(selected, ['edit']);
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement, trigger);
    await click(trigger);
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  } finally { await f.dispose(); }
});

test('dropdown focuses the first enabled item and closes when focus leaves', async () => {
  const f = fixture();
  try {
    await f.render(h('div', null, h(DropdownMenu, { trigger: '메뉴', label: '작업', items: [{ label: '비활성', value: 'off', disabled: true }, { label: '편집', value: 'edit' }, { label: '복사', value: 'copy' }], onSelect() {} }), h('button', { type: 'button' }, '다음')));
    const trigger = f.node.querySelector('[aria-haspopup=menu]');
    await click(trigger);
    const items = f.node.querySelectorAll('[role=menuitem]');
    assert.equal(document.activeElement, items[1]);
    assert.equal(items[1].tabIndex, -1);
    await act(async () => [...f.node.querySelectorAll('button')].find(element => element.textContent === '다음').focus());
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(document.activeElement.textContent, '다음');
  } finally { await f.dispose(); }
});

test('uncontrolled slider updates and follows form reset', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h('form', null, h(Slider, { 'aria-label': '볼륨', name: 'volume', defaultValue: 25, onValueChange: value => changes.push(value) })));
    const form = f.node.querySelector('form'), input = f.node.querySelector('input');
    await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, '75'); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); });
    assert.deepEqual(changes, [75]);
    assert.equal(input.value, '75');
    await act(async () => form.reset());
    assert.equal(input.value, '25');
  } finally { await f.dispose(); }
});

test('canceled form reset preserves the slider value', async () => {
  const f = fixture();
  try {
    await f.render(h('form', { onReset: event => event.preventDefault() }, h(Slider, { 'aria-label': '볼륨', name: 'volume', defaultValue: 25 })));
    const form = f.node.querySelector('form'), input = f.node.querySelector('input');
    await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, '75'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => form.reset());
    assert.equal(input.value, '75');
    assert.equal(new dom.window.FormData(form).get('volume'), '75');
  } finally { await f.dispose(); }
});

test('slides navigate and toast close action is exposed', async () => {
  const f = fixture(); let closed = 0;
  try {
    await f.render(h('div', null, h(Slides, { slides: ['첫 번째', '두 번째'] }), h(Toast, { onDismiss: () => closed++ }, '저장됨')));
    assert.match(f.node.textContent, /첫 번째/);
    await click([...f.node.querySelectorAll('button')].find(button => button.textContent === '다음'));
    assert.match(f.node.textContent, /두 번째/);
    await click(f.node.querySelector('[aria-label="알림 닫기"]'));
    assert.equal(closed, 1);
  } finally { await f.dispose(); }
});
