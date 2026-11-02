import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1024 });
HTMLElement.prototype.getBoundingClientRect = () => ({ top: 100, bottom: 138, left: 100, right: 660, width: 560, height: 38, x: 100, y: 100, toJSON() {} });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { DateTimePicker, DateTimeRangePicker } = await import('../dist/index.js');
const { act, createElement: h } = React;

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
async function click(element) { assert.ok(element, 'expected an available control'); await act(async () => element.click()); }
async function key(element, value, options = {}) { assert.ok(element); await act(async () => element.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options }))); }
async function edit(input, value) {
  assert.ok(input);
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function blur(input) { await act(async () => input.dispatchEvent(new dom.window.FocusEvent('focusout', { bubbles: true }))); }
async function validity(control) { let valid; await act(async () => { valid = control.checkValidity(); }); return valid; }
const inputs = container => [...container.querySelectorAll('.datetime-input')];
const trigger = container => container.querySelector('.date-trigger');
const popup = container => container.querySelector('.datetime-popup');
const button = (container, text) => [...container.querySelectorAll('button')].find(element => element.textContent.trim() === text);
const timeOption = (container, column, time) => [...container.querySelectorAll(`.datetime-time-list[aria-label="${column}"] [role="option"]`)].find(option => option.textContent.trim() === time);
const day = (container, value) => container.querySelector(`.calendar-day[aria-label="${value}"]`);
const values = form => new dom.window.FormData(form);
after(() => dom.window.close());

test('datetime input normalizes compact, ISO and spaced text and submits canonical local minutes', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h('form', null, h(DateTimePicker, { label: '예약 일시', name: 'booking', onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form'), input = inputs(f.container)[0];
    for (const raw of ['202802290905', '2028-02-29T09:05', '2028-02-29 09:05']) {
      await edit(input, raw);
      await key(input, 'Enter');
      assert.equal(input.value, '2028-02-29 09:05');
      assert.equal(changes.at(-1), '2028-02-29T09:05');
      assert.equal(values(form).get('booking'), '2028-02-29T09:05');
      assert.equal(await validity(input), true);
    }
  } finally { await f.dispose(); }
});

test('invalid calendar dates and times remain editable and never replace the committed form value', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h('form', null, h(DateTimePicker, { label: '예약 일시', name: 'booking', defaultValue: '2026-11-12T14:30', onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form'), input = inputs(f.container)[0];
    for (const raw of ['2026-02-29 14:30', '2026-11-12 24:00', '2026-11-12 14:60']) {
      await edit(input, raw);
      await blur(input);
      assert.equal(input.value, raw);
      assert.equal(input.getAttribute('aria-invalid'), 'true');
      assert.equal(await validity(input), false);
      assert.equal(values(form).get('booking'), '2026-11-12T14:30');
      assert.equal(changes.length, 0);
    }
    await edit(input, '2026-11-12 15:00');
    await blur(input);
    assert.equal(await validity(input), true);
    assert.notEqual(input.getAttribute('aria-invalid'), 'true');
    assert.equal(changes.at(-1), '2026-11-12T15:00');
  } finally { await f.dispose(); }
});

test('calendar and time selection stay pending until explicit confirmation', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h('form', null, h(DateTimePicker, { label: '예약 일시', name: 'booking', defaultValue: '2026-11-12T14:30', minuteStep: 15, onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form');
    await click(trigger(f.container));
    await click(day(f.container, '2026년 11월 13일'));
    await click(timeOption(f.container, '시', '15'));
    await click(timeOption(f.container, '분', '45'));
    assert.ok(popup(f.container));
    assert.equal(changes.length, 0);
    assert.equal(values(form).get('booking'), '2026-11-12T14:30');
    await click(button(popup(f.container), '확인'));
    assert.equal(popup(f.container), null);
    assert.equal(changes.at(-1), '2026-11-13T15:45');
    assert.equal(inputs(f.container)[0].value, '2026-11-13 15:45');
    assert.equal(values(form).get('booking'), '2026-11-13T15:45');
  } finally { await f.dispose(); }
});

test('cancel, Escape and outside dismissal discard pending changes', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h(DateTimePicker, { label: '예약 일시', defaultValue: '2026-11-12T14:30', minuteStep: 15, onValueChange: value => changes.push(value) }));
    for (const dismissal of ['cancel', 'escape', 'outside']) {
      await click(trigger(f.container));
      await click(timeOption(f.container, '시', '15'));
      if (dismissal === 'cancel') await click(button(popup(f.container), '취소'));
      else if (dismissal === 'escape') await key(document.activeElement, 'Escape');
      else await act(async () => document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
      assert.equal(popup(f.container), null);
      assert.equal(inputs(f.container)[0].value, '2026-11-12 14:30');
      assert.equal(changes.length, 0);
      if (dismissal !== 'outside') assert.equal(document.activeElement, trigger(f.container));
    }
  } finally { await f.dispose(); }
});

test('same-day range validation rejects reversed times without sorting and recovers on valid edits', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h('form', null, h(DateTimeRangePicker, { label: '예약 기간', name: 'booking', defaultValue: ['2026-11-12T09:00', '2026-11-12T17:30'], onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form'), [start, end] = inputs(f.container);
    await edit(end, '2026-11-12 08:30');
    await blur(end);
    assert.equal(await validity(form), false);
    assert.equal(end.value, '2026-11-12 08:30');
    assert.equal(changes.length, 0);
    assert.equal(values(form).get('booking-start'), '2026-11-12T09:00');
    assert.equal(values(form).get('booking-end'), '2026-11-12T17:30');
    await edit(end, '2026-11-12 10:30');
    await blur(end);
    assert.equal(await validity(form), true);
    assert.equal(start.value, '2026-11-12 09:00');
    assert.deepEqual(changes.at(-1), ['2026-11-12T09:00', '2026-11-12T10:30']);
    assert.equal(values(form).get('booking-end'), '2026-11-12T10:30');
  } finally { await f.dispose(); }
});

test('range popup edits the active endpoint and confirms both timestamps together', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h(DateTimeRangePicker, { label: '예약 기간', defaultValue: ['2026-11-12T09:00', '2026-11-12T17:30'], minuteStep: 30, onValueChange: value => changes.push(value) }));
    await click(trigger(f.container));
    const endToggle = popup(f.container).querySelector('.datetime-range-tab[aria-label="종료 일시"]');
    await click(endToggle);
    await click(timeOption(f.container, '시', '12'));
    assert.equal(changes.length, 0);
    await click(button(popup(f.container), '확인'));
    assert.deepEqual(changes.at(-1), ['2026-11-12T09:00', '2026-11-12T12:30']);
    assert.deepEqual(inputs(f.container).map(input => input.value), ['2026-11-12 09:00', '2026-11-12 12:30']);
  } finally { await f.dispose(); }
});

test('empty range selects the start date and time before the end and publishes only the final pair', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h('form', null, h(DateTimeRangePicker, { label: '예약 기간', name: 'booking', required: true, min: '2026-11-01T00:00', max: '2026-11-30T23:45', minuteStep: 15, onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form');
    const currentStep = () => popup(f.container).querySelector('.datetime-range-tab[aria-current="step"]')?.getAttribute('aria-label');
    await click(trigger(f.container));
    assert.equal(currentStep(), '시작 일시');
    assert.equal(button(popup(f.container), '확인'), undefined);
    await click(popup(f.container).querySelector('.datetime-range-tab[aria-label="종료 일시"]'));
    assert.equal(currentStep(), '시작 일시');
    assert.match(popup(f.container).querySelector('[role="alert"]').textContent, /입력/);
    await click(day(f.container, '2026년 11월 12일'));
    assert.equal(currentStep(), '시작 일시');
    assert.equal(popup(f.container).querySelector('[role="alert"]'), null);
    await click(timeOption(f.container, '시', '09'));
    await click(timeOption(f.container, '분', '15'));
    assert.equal(currentStep(), '시작 일시');
    assert.equal(changes.length, 0);
    assert.deepEqual(inputs(f.container).map(input => input.value), ['', '']);
    assert.equal(values(form).get('booking-start'), '');
    assert.equal(values(form).get('booking-end'), '');
    await click(button(popup(f.container), '다음'));
    assert.equal(currentStep(), '종료 일시');
    await click(day(f.container, '2026년 11월 13일'));
    await click(timeOption(f.container, '시', '17'));
    await click(timeOption(f.container, '분', '45'));
    assert.equal(changes.length, 0);
    await click(button(popup(f.container), '이전'));
    assert.equal(currentStep(), '시작 일시');
    await click(timeOption(f.container, '시', '10'));
    await click(button(popup(f.container), '다음'));
    assert.equal(currentStep(), '종료 일시');
    assert.equal(timeOption(f.container, '시', '17').getAttribute('aria-selected'), 'true');
    await click(button(popup(f.container), '확인'));
    assert.deepEqual(changes, [['2026-11-12T10:15', '2026-11-13T17:45']]);
    assert.equal(values(form).get('booking-start'), '2026-11-12T10:15');
    assert.equal(values(form).get('booking-end'), '2026-11-13T17:45');
    await click(trigger(f.container));
    assert.equal(currentStep(), '시작 일시');
    await click(button(popup(f.container), '취소'));
    assert.equal(changes.length, 1);
  } finally { await f.dispose(); }
});

test('range steps validate the start timestamp and end-input keyboard opening respects that prerequisite', async () => {
  const f = fixture(), changes = [];
  try {
    for (const start of ['2026-11-12T08:30', '2026-11-12T09:15']) {
      await f.render(h(DateTimeRangePicker, { key: start, label: '예약 기간', defaultValue: [start, '2026-11-12T17:30'], min: '2026-11-12T09:00', max: '2026-11-12T18:00', minuteStep: 30, onValueChange: value => changes.push(value) }));
      await key(inputs(f.container)[1], 'ArrowDown', { altKey: true });
      assert.equal(popup(f.container).querySelector('[aria-current="step"]').getAttribute('aria-label'), '시작 일시');
      await click(button(popup(f.container), '다음'));
      assert.equal(popup(f.container).querySelector('[aria-current="step"]').getAttribute('aria-label'), '시작 일시');
      assert.ok(popup(f.container).querySelector('[role="alert"]'));
      assert.equal(changes.length, 0);
    }
    await f.render(h(DateTimeRangePicker, { key: 'valid', label: '예약 기간', defaultValue: ['2026-11-12T09:00', '2026-11-12T17:30'], minuteStep: 30 }));
    await key(inputs(f.container)[1], 'ArrowDown', { altKey: true });
    assert.equal(popup(f.container).querySelector('[aria-current="step"]').getAttribute('aria-label'), '종료 일시');
    assert.ok(button(popup(f.container), '이전'));
    await key(document.activeElement, 'Escape');
    await click(trigger(f.container));
    assert.equal(popup(f.container).querySelector('[aria-current="step"]').getAttribute('aria-label'), '시작 일시');
    await act(async () => day(f.container, '2026년 11월 14일').dispatchEvent(new MouseEvent('pointerover', { bubbles: true })));
    assert.equal(popup(f.container).querySelectorAll('.is-preview-range, .is-preview-end').length, 0);
  } finally { await f.dispose(); }
});

test('datetime bounds include hours and minutes and minuteStep limits direct and popup input', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h(DateTimePicker, { label: '업무 시간', defaultValue: '2026-11-12T09:30', min: '2026-11-12T09:30', max: '2026-11-12T17:00', minuteStep: 30, onValueChange: value => changes.push(value) }));
    const input = inputs(f.container)[0];
    for (const raw of ['2026-11-12 09:00', '2026-11-12 17:30', '2026-11-12 14:15']) {
      await edit(input, raw);
      await key(input, 'Enter');
      assert.equal(await validity(input), false);
      assert.equal(changes.length, 0);
    }
    await edit(input, '2026-11-12 09:30');
    await key(input, 'Enter');
    assert.equal(await validity(input), true);
    await click(trigger(f.container));
    assert.equal(day(f.container, '2026년 11월 11일').disabled, true);
    assert.equal(day(f.container, '2026년 11월 13일').disabled, true);
    const beforeHours = timeOption(f.container, '시', '08');
    assert.equal(beforeHours.getAttribute('aria-disabled') === 'true' || beforeHours.disabled, true);
    const beforeMinutes = timeOption(f.container, '분', '00');
    assert.equal(beforeMinutes.getAttribute('aria-disabled') === 'true' || beforeMinutes.disabled, true);
    await click(timeOption(f.container, '시', '17'));
    const afterMinutes = timeOption(f.container, '분', '30');
    assert.equal(afterMinutes.getAttribute('aria-disabled') === 'true' || afterMinutes.disabled, true);
  } finally { await f.dispose(); }
});

test('datetime reset restores uncontrolled defaults and respects canceled resets and controlled null', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h('form', null, h(DateTimePicker, { label: '예약 일시', name: 'booking', defaultValue: '2026-11-12T14:30' })));
    let form = f.container.querySelector('form'), input = inputs(f.container)[0];
    await edit(input, '2026-11-13 15:00');
    await key(input, 'Enter');
    const prevent = event => event.preventDefault();
    form.addEventListener('reset', prevent);
    await act(async () => form.reset());
    assert.equal(input.value, '2026-11-13 15:00');
    form.removeEventListener('reset', prevent);
    await act(async () => form.reset());
    assert.equal(input.value, '2026-11-12 14:30');
    await f.render(h('form', { key: 'controlled' }, h(DateTimePicker, { label: '예약 일시', name: 'booking', value: null, defaultValue: '2026-11-12T14:30', onValueChange: value => changes.push(value) })));
    form = f.container.querySelector('form'); input = inputs(f.container)[0];
    assert.equal(input.value, '');
    await edit(input, '2026-11-13 15:00');
    await key(input, 'Enter');
    assert.equal(changes.at(-1), '2026-11-13T15:00');
    assert.equal(input.value, '');
    await act(async () => form.reset());
    assert.equal(input.value, '');
    assert.equal(values(form).get('booking'), '');
  } finally { await f.dispose(); }
});

test('disabled and readonly datetime controls cannot open and external errors remain linked', async () => {
  const f = fixture();
  try {
    for (const props of [{ disabled: true }, { readOnly: true }]) {
      await f.render(h('form', { key: JSON.stringify(props) }, h(DateTimePicker, { label: '예약 일시', name: 'booking', defaultValue: '2026-11-12T14:30', ...props })));
      const input = inputs(f.container)[0];
      assert.equal(trigger(f.container).disabled, true);
      await click(trigger(f.container));
      assert.equal(popup(f.container), null);
      assert.equal(input.value, '2026-11-12 14:30');
      assert.equal(values(f.container.querySelector('form')).has('booking'), !props.disabled);
    }
    await f.render(h(DateTimePicker, { label: '예약 일시', defaultValue: '2026-11-12T14:30', helperText: '분 단위로 입력하세요.', error: '이미 예약된 시간입니다.' }));
    const input = inputs(f.container)[0];
    assert.equal(input.validationMessage, '이미 예약된 시간입니다.');
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    const descriptions = input.getAttribute('aria-describedby').split(/\s+/).map(id => document.getElementById(id)?.textContent).join(' ');
    assert.match(descriptions, /분 단위/);
    assert.match(descriptions, /이미 예약된/);
  } finally { await f.dispose(); }
});

test('keyboard opens the datetime calendar, moves dates and escapes without publishing', async () => {
  const f = fixture(), changes = [];
  try {
    await f.render(h(DateTimePicker, { label: '예약 일시', defaultValue: '2026-11-12T14:30', onValueChange: value => changes.push(value) }));
    const input = inputs(f.container)[0];
    await act(async () => input.focus());
    await key(input, 'ArrowDown', { altKey: true });
    assert.ok(popup(f.container));
    await key(document.activeElement, 'ArrowRight');
    assert.equal(document.activeElement.getAttribute('aria-label'), '2026년 11월 13일');
    await key(document.activeElement, 'Enter');
    assert.ok(popup(f.container));
    assert.equal(changes.length, 0);
    await key(document.activeElement, 'Escape');
    assert.equal(popup(f.container), null);
    assert.equal(document.activeElement, trigger(f.container));
    assert.equal(inputs(f.container)[0].value, '2026-11-12 14:30');
  } finally { await f.dispose(); }
});
