import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
const { TextField, Select, SearchSelect, MultiSelect } = await import('../dist/index.js');
const { act, createElement: h } = React;
const options = [{ value: 'a', label: '디자인' }, { value: 'b', label: '개발' }];
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
async function click(element) { assert.ok(element); await act(async () => element.click()); }

function linkedLabel(container, control, hidden) {
  const label = container.querySelector('label');
  assert.equal(label.control, control);
  assert.equal(label.htmlFor, control.id);
  assert.equal(label.classList.contains('sr-only'), hidden);
  assert.equal(label.hasAttribute('hidden'), false);
  assert.equal(label.hasAttribute('aria-hidden'), false);
  assert.equal(control.hasAttribute('aria-hidden'), false);
  assert.equal(container.querySelector('[hidelabel]'), null);
  return label;
}

test('TextField hides only its label and removes the horizontal label column', async () => {
  const f = fixture(), ref = React.createRef();
  try {
    const render = hideLabel => h(TextField, {
      id: 'email', ref, label: h('span', null, '이메일'), hideLabel,
      type: 'email', labelPosition: 'left', containerClassName: 'email-field',
      defaultValue: 'mono@example.com', prefix: '@', helperText: '업무 이메일',
      error: '주소를 확인해주세요', 'aria-describedby': 'external-help',
    });
    await f.render(render(undefined));
    const input = f.container.querySelector('input');
    assert.equal(linkedLabel(f.container, input, false).textContent, '이메일');
    assert.ok(f.container.querySelector('.field-horizontal'));

    await f.render(render(true));
    linkedLabel(f.container, input, true);
    assert.equal(ref.current, input);
    assert.equal(input.type, 'email');
    assert.equal(input.value, 'mono@example.com');
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    assert.equal(input.getAttribute('aria-describedby'), 'external-help email-prefix email-help email-error');
    assert.equal(f.container.querySelector('.field-horizontal,.field-horizontal__label,.field-horizontal__body'), null);
    assert.ok(f.container.querySelector('.email-field'));

    await f.render(render(false));
    linkedLabel(f.container, input, false);
    assert.ok(f.container.querySelector('.field-horizontal'));
  } finally { await f.dispose(); }
});

test('TextField with hideLabel preserves edits, action callbacks and native form reset', async () => {
  const f = fixture(), edits = []; let actions = 0;
  try {
    await f.render(h('form', null, h(TextField, {
      label: '검색', hideLabel: true, name: 'query', defaultValue: '초기',
      onChange: event => edits.push(event.target.value),
      action: h('button', { type: 'button', onClick: () => actions++ }, '검색'),
    })));
    const input = f.container.querySelector('input');
    linkedLabel(f.container, input, true);
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, '변경');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click(f.container.querySelector('button'));
    assert.deepEqual(edits, ['변경']);
    assert.equal(actions, 1);
    assert.equal(new dom.window.FormData(f.container.querySelector('form')).get('query'), '변경');
    await act(async () => f.container.querySelector('form').reset());
    assert.equal(input.value, '초기');
  } finally { await f.dispose(); }
});

const selectVariants = [
  ['Select', Select, {}],
  ['SearchSelect', SearchSelect, {}],
  ['MultiSelect', MultiSelect, {}],
  ['searchable MultiSelect', MultiSelect, { searchable: true }],
  ['inline MultiSelect', MultiSelect, { presentation: 'inline', clearable: true }],
  ['searchable inline MultiSelect', MultiSelect, { presentation: 'inline', searchable: true, clearable: true }],
];

for (const [name, Component, variant] of selectVariants) {
  test(`${name} supports hidden linked labels, selection callbacks and form reset`, async () => {
    const f = fixture(), changes = [], multiple = Component === MultiSelect;
    try {
      const render = hideLabel => h('form', null, h(Component, {
        ...variant, options, label: '팀', hideLabel, name: 'team', required: true,
        defaultValue: multiple ? ['a'] : 'a', onValueChange: next => changes.push(next),
        'aria-describedby': 'team-help',
      }));
      await f.render(render(undefined));
      const control = f.container.querySelector('[role=combobox]');
      linkedLabel(f.container, control, false);

      await f.render(render(true));
      linkedLabel(f.container, control, true);
      assert.equal(control.getAttribute('aria-required'), 'true');
      assert.equal(control.getAttribute('aria-describedby'), 'team-help');
      assert.equal(control.getAttribute('aria-label'), Component === SearchSelect ? '팀' : '팀: 디자인');
      if (control.tagName === 'BUTTON') assert.equal(control.type, 'button');

      await click(control);
      if (multiple && variant.searchable) {
        const search = f.container.querySelector('.multi-search-input');
        assert.equal(search.getAttribute('aria-label'), '팀 검색');
        assert.equal(document.activeElement, search);
      }
      await click([...f.container.querySelectorAll('[role=option]')].find(option => option.textContent.includes('개발')));
      assert.deepEqual(changes, [multiple ? ['a', 'b'] : 'b']);
      const form = f.container.querySelector('form');
      assert.deepEqual(new dom.window.FormData(form).getAll('team'), multiple ? ['a', 'b'] : ['b']);
      if (multiple && variant.presentation === 'inline') assert.ok(f.container.querySelector('[aria-label="개발 제거"]'));

      await act(async () => form.reset());
      assert.deepEqual(new dom.window.FormData(form).getAll('team'), ['a']);
      assert.equal(control.getAttribute('aria-expanded'), 'false');
      assert.deepEqual(changes, [multiple ? ['a', 'b'] : 'b']);
      linkedLabel(f.container, control, true);
    } finally { await f.dispose(); }
  });
}

test('hidden labels retain their control connections in server markup', () => {
  const markup = renderToString(h('form', null,
    h(TextField, { label: '이름', hideLabel: true, labelPosition: 'left' }),
    ...selectVariants.map(([name, Component, variant]) => h(Component, { key: name, ...variant, options, label: name, hideLabel: true })),
  ));
  const container = document.createElement('div');
  container.innerHTML = markup;
  const labels = [...container.querySelectorAll('label')];
  assert.equal(labels.length, 7);
  const controlIds = new Set();
  for (const label of labels) {
    assert.ok(label.control);
    assert.equal(label.classList.contains('sr-only'), true);
    assert.equal(label.hasAttribute('hidden'), false);
    assert.equal(label.hasAttribute('aria-hidden'), false);
    controlIds.add(label.control.id);
  }
  assert.equal(controlIds.size, labels.length);
  assert.equal(container.querySelector('.field-horizontal'), null);
  assert.equal(container.querySelector('[hidelabel]'), null);
});
