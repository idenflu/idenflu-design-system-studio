import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent']) Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1024 });
HTMLElement.prototype.getBoundingClientRect = () => ({ top: 100, bottom: 138, left: 100, right: 420, width: 320, height: 38, x: 100, y: 100, toJSON() {} });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { NumberField, DatePicker, DateRangePicker, Icon } = await import('../dist/index.js');
const { act, createElement: h } = React;
function fixture() { const container = document.createElement('div'); document.body.append(container); const root = createRoot(container); return { container, async render(el) { await act(async () => root.render(el)); }, async dispose() { await act(async () => root.unmount()); container.remove(); } }; }
async function click(el) { assert.ok(el); await act(async () => el.click()); }
async function key(el, value) { await act(async () => el.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))); }
async function edit(input, value) { await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); }
async function blur(input) { await act(async () => input.dispatchEvent(new dom.window.FocusEvent('focusout', { bubbles: true }))); }
after(() => dom.window.close());

test('date and number fields expose and clear parent form errors in validation and descriptions', async () => {
  const f = fixture();
  try {
    for (const [Component, value] of [[NumberField,'8'],[DatePicker,'2026-11-02']]) {
      await f.render(h(Component,{label:'입력',defaultValue:value,error:'입력값을 다시 확인해주세요.'}));
      const input = f.container.querySelector('input');
      assert.equal(input.validationMessage,'입력값을 다시 확인해주세요.');
      assert.equal(input.getAttribute('aria-invalid'),'true');
      assert.equal(document.getElementById(input.getAttribute('aria-describedby')).textContent,'입력값을 다시 확인해주세요.');
      await f.render(h(Component,{label:'입력',defaultValue:value}));
      assert.equal(input.validationMessage,'');
      assert.equal(input.hasAttribute('aria-invalid'),false);
    }
  } finally { await f.dispose(); }
});

test('NumberField prefix icon focuses input without changing its submitted value or descriptions', async () => {
  const f = fixture();
  const render = disabled => h('form', null, h(NumberField, {label:'참여 인원', name:'people', defaultValue:'8', unit:'명', prefixIcon:h(Icon, {name:'person'}), disabled}));
  try {
    await f.render(render(false));
    const input = f.container.querySelector('input');
    const prefix = f.container.querySelector('.number-field-prefix');
    assert.equal(prefix.getAttribute('aria-hidden'), 'true');
    assert.equal(f.container.querySelector('label').control, input);
    assert.equal(input.getAttribute('aria-describedby'), `${input.id}-unit`);
    await click(prefix);
    assert.equal(document.activeElement, input);
    await key(input, 'ArrowUp');
    assert.equal(input.value, '9');
    assert.equal(new dom.window.FormData(f.container.querySelector('form')).get('people'), '9');
    await act(async () => f.container.querySelector('form').reset());
    assert.equal(input.value, '8');
    await act(async () => input.blur());
    await f.render(render(true));
    await click(prefix);
    assert.notEqual(document.activeElement, input);
    assert.equal(new dom.window.FormData(f.container.querySelector('form')).has('people'), false);
  } finally { await f.dispose(); }
});

test('NumberField increments exact decimal strings, clamps limits and resets', async () => {
  const f = fixture(), changes = [];
  try { await f.render(h('form', null, h(NumberField, { label: '금액', name: 'amount', defaultValue: '9007199254740993.1', decimals: 1, step: '0.1', min: '9007199254740993.0', max: '9007199254740993.2', onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form'), input = form.querySelector('input');
    assert.equal(input.getAttribute('aria-valuemin'), '9007199254740993');
    assert.equal(input.getAttribute('aria-valuemax'), '9007199254740993.2');
    assert.equal(input.getAttribute('aria-valuenow'), '9007199254740993.1');
    await click(form.querySelector('[aria-label="금액 증가"]'));
    assert.equal(input.value, '9007199254740993.2'); assert.equal(changes.at(-1), '9007199254740993.2'); assert.equal(form.querySelector('[aria-label="금액 증가"]').disabled, true);
    assert.equal(input.getAttribute('aria-valuenow'), '9007199254740993.2');
    await act(async () => form.reset()); assert.equal(input.value, '9007199254740993.1');
  } finally { await f.dispose(); }
});

test('NumberField preserves exact negative decimal ARIA values', async () => {
  const f = fixture();
  try {
    await f.render(h(NumberField, { label: '차액', defaultValue: '-9007199254740993.123456', decimals: 6, min: '-9007199254740993.123457', max: '-9007199254740993.123455' }));
    const input = f.container.querySelector('input');
    assert.equal(input.getAttribute('aria-valuemin'), '-9007199254740993.123457');
    assert.equal(input.getAttribute('aria-valuemax'), '-9007199254740993.123455');
    assert.equal(input.getAttribute('aria-valuenow'), '-9007199254740993.123456');
  } finally { await f.dispose(); }
});

test('NumberField validates precision and controlled edits follow the parent', async () => {
  const f = fixture(), changes = [];
  function Controlled() { const [value, setValue] = React.useState('1'); return h(NumberField, { label: '수량', value, decimals: 0, onValueChange: next => { changes.push(next); setValue(next); } }); }
  try { await f.render(h(Controlled)); const input = f.container.querySelector('input'); input.focus(); await edit(input, '1.2'); await blur(input);
    assert.equal(input.getAttribute('aria-invalid'), 'true'); assert.match(f.container.textContent, /정수만/); assert.equal(input.checkValidity(), false);
    await edit(input, '2'); await blur(input); assert.equal(input.value, '2'); assert.equal(input.checkValidity(), true); await key(input, 'ArrowUp'); assert.equal(input.value, '3'); assert.equal(changes.at(-1), '3');
  } finally { await f.dispose(); }
});

test('grouped NumberField formats its initial value and form reset without losing decimal precision', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h('form', null, h(NumberField, {label:'금액', defaultValue:'-9007199254740993.1200', decimals:4, grouping:true, onValueChange:value => changes.push(value)})));
    const form = f.container.querySelector('form'), input = form.querySelector('input');
    assert.equal(input.value, '-9,007,199,254,740,993.1200');
    assert.equal(input.getAttribute('aria-valuenow'), '-9007199254740993.12');
    await edit(input, '-9007199254740992.3400'); await blur(input);
    assert.equal(input.value, '-9,007,199,254,740,992.3400');
    assert.equal(changes.at(-1), '-9007199254740992.34');
    await act(async () => form.reset());
    assert.equal(input.value, '-9,007,199,254,740,993.1200');
  } finally { await f.dispose(); }
});

test('controlled grouped NumberField keeps editing drafts and formats parent updates and rejected changes', async () => {
  const f = fixture(), changes = [];
  const field = value => h(NumberField, {label:'금액', value, decimals:2, grouping:true, step:'0.25', onValueChange:next => changes.push(next)});
  try {
    await f.render(field('1234.50'));
    const input = f.container.querySelector('input');
    assert.equal(input.value, '1,234.50');
    input.focus(); await edit(input, '12,34'); input.setSelectionRange(2, 2);
    await f.render(field('1234.50'));
    assert.equal(input.value, '12,34'); assert.equal(input.selectionStart, 2);
    await blur(input);
    assert.equal(input.value, '12,34'); assert.equal(input.getAttribute('aria-invalid'), 'true');
    await f.render(field('7654321.00'));
    assert.equal(input.value, '7,654,321.00'); assert.equal(input.getAttribute('aria-invalid'), null);
    await edit(input, '1000.05'); await blur(input);
    assert.equal(changes.at(-1), '1000.05'); assert.equal(input.value, '7,654,321.00');
    await key(input, 'ArrowUp');
    assert.equal(changes.at(-1), '7654321.25'); assert.equal(input.value, '7,654,321.00');
    await f.render(field(null)); assert.equal(input.value, '');
  } finally { await f.dispose(); }
});

test('grouped NumberField preserves an invalid default when the form is reset', async () => {
  const f = fixture();
  try {
    await f.render(h('form', null, h(NumberField, {label:'금액', defaultValue:'12,34.00', decimals:2, grouping:true})));
    const form = f.container.querySelector('form'), input = form.querySelector('input');
    assert.equal(input.value, '12,34.00');
    await edit(input, '1234.00'); await blur(input); assert.equal(input.value, '1,234.00');
    await act(async () => form.reset()); assert.equal(input.value, '12,34.00'); assert.equal(input.checkValidity(), false);
  } finally { await f.dispose(); }
});

test('DatePicker validates leap days and normalizes eight-digit input', async () => {
  const f = fixture(), changes = [];
  try { await f.render(h('form', null, h(DatePicker, { label: '날짜', name: 'date', onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form'), input = form.querySelector('input'); input.focus(); await edit(input, '20230229'); assert.equal(form.checkValidity(), false); await blur(input);
    assert.equal(input.getAttribute('aria-invalid'), 'true'); assert.equal(form.checkValidity(), false);
    await edit(input, '20240229'); await blur(input); assert.equal(input.value, '2024-02-29'); assert.equal(changes.at(-1), '2024-02-29'); assert.equal(form.checkValidity(), true);
  } finally { await f.dispose(); }
});

test('DatePicker clamps keyboard focus to boundaries and Escape restores trigger', async () => {
  const f = fixture();
  try { await f.render(h(DatePicker, { label: '날짜', min: '2020-01-10', max: '2020-01-20' })); const trigger = f.container.querySelector('.date-trigger'); await click(trigger);
    assert.equal(document.activeElement.getAttribute('aria-label'), '2020년 1월 20일'); await key(document.activeElement, 'ArrowRight'); assert.equal(document.activeElement.getAttribute('aria-label'), '2020년 1월 20일');
    await key(document.activeElement, 'Escape'); assert.equal(trigger.getAttribute('aria-expanded'), 'false'); assert.equal(document.activeElement, trigger);
  } finally { await f.dispose(); }
});

test('DateRangePicker sorts calendar selection and restores the initial value on reset', async () => {
  const f = fixture(), changes = [];
  try { await f.render(h('form', null, h(DateRangePicker, { label: '기간', name: 'period', defaultValue: ['2020-01-20', null], onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form'); await click(form.querySelector('.date-trigger')); await click(form.querySelector('[aria-label="2020년 1월 12일"]'));
    assert.deepEqual(changes.at(-1), ['2020-01-12', '2020-01-20']); assert.deepEqual([...form.querySelectorAll('input')].map(input => input.value), ['2020-01-12', '2020-01-20']);
    await act(async () => form.reset()); assert.deepEqual([...form.querySelectorAll('input')].map(input => input.value), ['2020-01-20', '']);
  } finally { await f.dispose(); }
});

test('controlled DatePicker reports calendar selection and reflects parent updates', async () => {
  const f = fixture(), changes = [];
  function Controlled() { const [value, setValue] = React.useState('2020-01-10'); return h(DatePicker, { label: '날짜', value, onValueChange: next => { changes.push(next); setValue(next); } }); }
  try { await f.render(h(Controlled)); await click(f.container.querySelector('.date-trigger')); await click(f.container.querySelector('[aria-label="2020년 1월 12일"]'));
    assert.equal(changes.at(-1), '2020-01-12'); assert.equal(f.container.querySelector('input').value, '2020-01-12');
  } finally { await f.dispose(); }
});

test('editing a date before opening the calendar focuses the normalized date', async () => {
  const f = fixture();
  try { await f.render(h(DatePicker, { label: '날짜', defaultValue: '2020-01-10' })); const input = f.container.querySelector('input'); input.focus(); await edit(input, '20200113'); await blur(input); await click(f.container.querySelector('.date-trigger'));
    assert.equal(input.value, '2020-01-13'); assert.equal(document.activeElement.getAttribute('aria-label'), '2020년 1월 13일');
  } finally { await f.dispose(); }
});

test('DateRangePicker blocks reversed dates in form validation while editing', async () => {
  const f = fixture();
  try { await f.render(h('form', null, h(DateRangePicker, { label: '기간', defaultValue: ['2020-01-10', '2020-01-20'] })));
    const form = f.container.querySelector('form'), end = form.querySelectorAll('input')[1]; await edit(end, '2020-01-01'); assert.equal(form.checkValidity(), false); await blur(end);
    assert.match(f.container.textContent, /종료일은 시작일보다 빠를 수 없습니다/);
  } finally { await f.dispose(); }
});

test('DateRangePicker previews a prospective range on hover without committing it', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h(DateRangePicker, { label: '기간', defaultValue: ['2020-01-20', null], onValueChange: value => changes.push(value) }));
    await click(f.container.querySelector('.date-trigger'));
    const target = f.container.querySelector('[aria-label="2020년 1월 12일"]');
    await act(async () => target.dispatchEvent(new MouseEvent('pointerover', { bubbles: true })));
    assert.ok(target.classList.contains('is-preview-end'));
    assert.ok(f.container.querySelector('[aria-label="2020년 1월 15일"]').classList.contains('is-preview-range'));
    assert.match(f.container.querySelector('.calendar-range-summary').textContent, /2020-01-12 – 2020-01-20 \(미리보기\)/);
    assert.deepEqual(changes, []);
    await act(async () => target.dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body })));
    assert.equal(f.container.querySelector('.is-preview-range'), null);
  } finally { await f.dispose(); }
});

test('NumberField selects on first click while preserving deliberate drag selection', async () => {
  const f = fixture();
  try {
    await f.render(h(NumberField, { label: '수량', defaultValue: '12345', selectOnFocus: true }));
    const input = f.container.querySelector('input');
    await act(async () => { input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 10, clientY: 10 })); input.focus(); input.setSelectionRange(2, 2); input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, clientX: 10, clientY: 10 })); });
    assert.equal(input.selectionStart, 0); assert.equal(input.selectionEnd, 5);
    await act(async () => { input.blur(); input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 10, clientY: 10 })); input.focus(); input.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 30, clientY: 10 })); input.setSelectionRange(1, 3); input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, clientX: 30, clientY: 10 })); });
    assert.equal(input.selectionStart, 1); assert.equal(input.selectionEnd, 3);
  } finally { await f.dispose(); }
});

test('cancelled React form reset preserves date and number drafts and errors', async () => {
  const f = fixture();
  try {
    await f.render(h('form', { onReset: event => event.preventDefault() },
      h(NumberField, { label: '수량', defaultValue: '1' }),
      h(DatePicker, { label: '날짜', defaultValue: '2020-01-10' }),
      h(DateRangePicker, { label: '기간', defaultValue: ['2020-01-10', '2020-01-20'] })));
    const form = f.container.querySelector('form');
    const [number, date, start, end] = form.querySelectorAll('input');
    await edit(number, '3'); await blur(number);
    await edit(date, '20200112'); await blur(date);
    await edit(end, '2020-01-01'); await blur(end);
    assert.equal(end.getAttribute('aria-invalid'), 'true');
    await act(async () => form.reset());
    assert.deepEqual([number.value, date.value, start.value, end.value], ['3', '2020-01-12', '2020-01-10', '2020-01-01']);
    assert.equal(end.getAttribute('aria-invalid'), 'true');
    assert.match(f.container.textContent, /종료일은 시작일보다 빠를 수 없습니다/);
  } finally { await f.dispose(); }
});


test('controlled null values stay empty on mount and reset instead of using defaults', async () => {
  const f = fixture();
  const cases = [
    [NumberField, {value:null, defaultValue:'42'}, ['']],
    [DatePicker, {value:null, defaultValue:'2026-11-02'}, ['']],
    [DateRangePicker, {value:[null,null], defaultValue:['2026-11-02','2026-11-03']}, ['','']],
    [DateRangePicker, {value:[null,'2026-11-03'], defaultValue:['2026-11-02','2026-11-04']}, ['','2026-11-03']],
  ];
  try {
    for (const [index, [Component, props, expected]] of cases.entries()) {
      await f.render(h('form', {key:index}, h(Component, {label:'입력', name:'value', ...props})));
      const form = f.container.querySelector('form');
      const values = () => [...form.querySelectorAll('input')].map(input => input.value);
      assert.deepEqual(values(), expected);
      assert.deepEqual([...new dom.window.FormData(form).values()], expected);
      await act(async () => form.reset());
      assert.deepEqual(values(), expected);
    }
    await f.render(h(NumberField, {label:'기본값', defaultValue:'42'}));
    assert.equal(f.container.querySelector('input').value,'42');
    await f.render(h(DatePicker, {label:'기본값', defaultValue:'2026-11-02'}));
    assert.equal(f.container.querySelector('input').value,'2026-11-02');
  } finally { await f.dispose(); }
});

test('controlled NumberField reformats unchanged values when grouping changes', async () => {
  const f = fixture(), changes = [];
  const field = grouping => h(NumberField, {label:'금액', value:'1234.50', decimals:2, grouping, onValueChange:value => changes.push(value)});
  try {
    await f.render(field(true));
    const input = f.container.querySelector('input');
    assert.equal(input.value,'1,234.50');
    await f.render(field(false));
    assert.equal(input.value,'1234.50');
    assert.equal(input.checkValidity(),true);
    assert.equal(input.getAttribute('aria-valuenow'),'1234.5');
    await f.render(field(true));
    assert.equal(input.value,'1,234.50');
    assert.equal(input.checkValidity(),true);
    assert.deepEqual(changes,[]);
  } finally { await f.dispose(); }
});

test('format changes preserve uncommitted numbers and validate precision without rounding', async () => {
  const f = fixture(), changes = [];
  const field = (grouping, decimals) => h(NumberField, {label:'금액', value:'1234.50', decimals, grouping, onValueChange:value => changes.push(value)});
  try {
    await f.render(field(true,2));
    const input = f.container.querySelector('input');
    input.focus();
    await edit(input,'9876.25');
    await f.render(field(false,2));
    assert.equal(input.value,'9876.25');
    assert.equal(input.checkValidity(),true);
    await f.render(field(true,2));
    assert.equal(input.value,'9,876.25');
    await f.render(field(true,1));
    assert.equal(input.value,'9876.25');
    assert.equal(input.checkValidity(),false);
    assert.match(input.validationMessage,/소수점은 최대 1자리/);
    await f.render(field(true,3));
    assert.equal(input.value,'9,876.25');
    assert.equal(input.checkValidity(),true);
    await edit(input,'1234.');
    await f.render(field(false,3));
    assert.equal(input.value,'1234.');
    await f.render(field(true,3));
    assert.equal(input.value,'1,234.');
    await edit(input,'12,34');
    await f.render(field(false,3));
    assert.equal(input.value,'12,34');
    assert.equal(input.checkValidity(),false);
    assert.deepEqual(changes,[]);
  } finally { await f.dispose(); }
});

test('uncontrolled NumberField keeps edited values across formatting changes and resets using the latest format', async () => {
  const f = fixture();
  const field = grouping => h('form', null, h(NumberField, {label:'금액', defaultValue:'1234.50', grouping, decimals:2}));
  try {
    await f.render(field(true));
    const form = f.container.querySelector('form'), input = form.querySelector('input');
    await edit(input,'9876.25');
    await blur(input);
    assert.equal(input.value,'9,876.25');
    await f.render(field(false));
    assert.equal(input.value,'9876.25');
    assert.equal(input.checkValidity(),true);
    await act(async () => form.reset());
    assert.equal(input.value,'1234.50');
  } finally { await f.dispose(); }
});
