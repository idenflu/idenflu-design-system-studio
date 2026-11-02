import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../systems/idenflu-mono/preferences.js', import.meta.url), 'utf8');
const storageKey = 'idenflu-mono-preferences-v1';
const defaults = { fontSize: 14, lineHeight: 22, spacing: 100, controlHeight: 38, radius: 0 };
const custom = { fontSize: 16, lineHeight: 26, spacing: 125, controlHeight: 44, radius: 6 };
const plain = (value) => JSON.parse(JSON.stringify(value));

function engine({ stored, values = new Map(), blocked = {} } = {}) {
  const storage = new Map(values);
  if (stored !== undefined) storage.set(storageKey, stored);
  const styles = new Map([['--unrelated-property', 'keep']]);
  const events = [];
  const listeners = new Map();
  const calls = [];
  const localStorage = {
    getItem(key) {
      calls.push(['getItem', key]);
      if (blocked.getItem) throw new Error('Storage read blocked');
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      calls.push(['setItem', key]);
      if (blocked.setItem) throw new Error('Storage write blocked');
      storage.set(key, String(value));
    },
    removeItem(key) {
      calls.push(['removeItem', key]);
      if (blocked.removeItem) throw new Error('Storage removal blocked');
      storage.delete(key);
    },
  };
  const document = {
    documentElement: { dataset: {theme:"light"}, style: {
      setProperty(name, value) { styles.set(name, value); },
      removeProperty(name) { styles.delete(name); },
    } },
    dispatchEvent(event) { events.push({ type: event.type, detail: plain(event.detail) }); return true; },
  };
  const window = {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
  };
  class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  }
  let themeObserver;
  class MutationObserver {
    constructor(callback) { themeObserver = callback; }
    observe() {}
  }
  const context = vm.createContext({ window, document, localStorage, CustomEvent, MutationObserver });
  const run = () => vm.runInContext(source, context, { filename: 'preferences.js' });
  run();
  return {
    get api() { return window.IdenfluPreferences; },
    styles, storage, events, calls, run,
    theme(theme) { document.documentElement.dataset.theme = theme; themeObserver(); },
    storageEvent(event) { (listeners.get('storage') || []).forEach((listener) => listener(event)); },
  };
}

test('preference engine starts with defaults, returns copies and initializes once', () => {
  const app = engine();
  assert.deepEqual(plain(app.api.get()), defaults);
  const copy = app.api.get();
  copy.fontSize = -100;
  assert.deepEqual(plain(app.api.get()), defaults);
  assert.deepEqual([...app.styles], [['--unrelated-property', 'keep']]);
  assert.deepEqual(app.events, [{ type: 'preferenceschange', detail: { values: defaults, saved: false, reason: 'load' } }]);
  const original = app.api;
  app.run();
  assert.equal(app.api, original);
  assert.equal(app.events.length, 1);
  assert.equal(app.storage.has(storageKey), false);
});

test('strict partial updates ignore invalid types, unknown keys and inherited values', () => {
  const app = engine();
  for (const value of [null, [], '18', 18, { fontSize: '18', lineHeight: null, spacing: Infinity, controlHeight: NaN, radius: {} }, { unknown: 18 }]) {
    assert.deepEqual(plain(app.api.set(value)), defaults);
  }
  assert.equal(app.events.length, 1, 'ignored updates must not announce a successful change');
  assert.equal(app.storage.has(storageKey), false, 'ignored updates must not create a preference record');
  const inherited = Object.assign(Object.create({ fontSize: 18 }), { radius: 4 });
  assert.deepEqual(plain(app.api.set(inherited)), { ...defaults, radius: 4 });
  assert.deepEqual(Object.keys(JSON.parse(app.storage.get(storageKey))), Object.keys(defaults));
});

test('ranges snap to permitted steps and enforce font-linked line and control minimums', () => {
  const app = engine();
  assert.deepEqual(plain(app.api.set({ fontSize: 99, lineHeight: 1, spacing: 149, controlHeight: 31, radius: 99 })), {
    fontSize: 18, lineHeight: 22, spacing: 150, controlHeight: 36, radius: 12,
  });
  assert.deepEqual(plain(app.api.set({ fontSize: -1, lineHeight: 100, spacing: -10, controlHeight: 99, radius: -9 })), {
    fontSize: 12, lineHeight: 32, spacing: 75, controlHeight: 48, radius: 0,
  });
  assert.deepEqual(plain(app.api.set({ fontSize: 15.4, lineHeight: 18.2, spacing: 111, controlHeight: 33, radius: 2.6 })), {
    fontSize: 15, lineHeight: 19, spacing: 110, controlHeight: 34, radius: 3,
  });
});

test('successful updates apply CSS, persist exact state and return exportable current CSS', () => {
  const app = engine();
  assert.deepEqual(plain(app.api.set(custom)), custom);
  const expectedProperties = {
    '--font-size-base': '16px',
    '--line-height-base': '26px',
    '--space-unit': '5px',
    '--control-base-height': '44px',
    '--radius-control': '6px',
  };
  for (const [property, value] of Object.entries(expectedProperties)) {
    assert.equal(app.styles.get(property), value);
    assert(app.api.cssText().includes(`${property}: ${value};`));
  }
  assert.deepEqual(JSON.parse(app.storage.get(storageKey)), custom);
  assert.deepEqual(app.events.at(-1), { type: 'preferenceschange', detail: { values: custom, saved: true, reason: 'set' } });
  assert.equal(app.styles.get('--unrelated-property'), 'keep');
});

test('stored records hydrate before UI and corrupt or incorrectly typed records fall back', () => {
  const stored = engine({ stored: JSON.stringify({ fontSize: 18, lineHeight: 18, spacing: 101, controlHeight: 32, radius: 2, unknown: 99 }) });
  assert.deepEqual(plain(stored.api.get()), { fontSize: 18, lineHeight: 22, spacing: 100, controlHeight: 36, radius: 2 });
  assert.equal(stored.styles.get('--font-size-base'), '18px');
  assert.equal(stored.events[0].detail.reason, 'load');
  assert.equal(stored.events[0].detail.saved, true);
  assert.equal(stored.calls.filter(([method]) => method === 'setItem').length, 0, 'reading a record must not rewrite storage');
  for (const raw of ['{broken', 'null', '[]', '42', '"18"', '{"unknown":20}', '{"fontSize":"18","spacing":null}']) {
    const app = engine({ stored: raw });
    assert.deepEqual(plain(app.api.get()), defaults, raw);
    assert.deepEqual([...app.styles], [['--unrelated-property', 'keep']], raw);
    assert.equal(app.events[0].detail.saved, false, raw);
  }
});

test('storage exceptions preserve in-memory controls and accurately report unsaved changes', () => {
  const app = engine({ blocked: { getItem: true, setItem: true, removeItem: true } });
  assert.deepEqual(plain(app.api.get()), defaults);
  assert.deepEqual(plain(app.api.set(custom)), custom);
  assert.equal(app.styles.get('--font-size-base'), '16px');
  assert.deepEqual(app.events.at(-1).detail, { values: custom, saved: false, reason: 'set' });
  assert.deepEqual(plain(app.api.reset()), defaults);
  assert.deepEqual(app.events.at(-1).detail, { values: defaults, saved: false, reason: 'reset' });
  assert.deepEqual([...app.styles], [['--unrelated-property', 'keep']]);
});

test('reset removes only preference storage and owned CSS overrides', () => {
  const otherValues = new Map([['idenflu-mono-theme', 'dark'], ['consumer-draft', 'unsaved text']]);
  const app = engine({ values: otherValues });
  app.api.set(custom);
  assert.deepEqual(plain(app.api.reset()), defaults);
  assert.equal(app.storage.has(storageKey), false);
  assert.deepEqual(app.storage, otherValues);
  assert.deepEqual([...app.styles], [['--unrelated-property', 'keep']]);
  assert.deepEqual(app.events.at(-1).detail, { values: defaults, saved: true, reason: 'reset' });
  assert(app.calls.every(([, key]) => key === storageKey), 'engine accessed an unrelated storage key');
  assert.deepEqual(plain(engine({ values: app.storage }).api.get()), defaults);
});

test('storage synchronization reacts only to its key and clears invalid remote preferences', () => {
  const app = engine();
  app.storageEvent({ key: storageKey, newValue: JSON.stringify(custom) });
  assert.deepEqual(plain(app.api.get()), custom);
  assert.equal(app.styles.get('--space-unit'), '5px');
  assert.deepEqual(app.events.at(-1).detail, { values: custom, saved: true, reason: 'storage' });
  const eventCount = app.events.length;
  app.storageEvent({ key: 'idenflu-mono-theme', newValue: 'dark' });
  assert.equal(app.events.length, eventCount);
  assert.deepEqual(plain(app.api.get()), custom);
  app.storageEvent({ key: storageKey, newValue: '{broken' });
  assert.deepEqual(plain(app.api.get()), defaults);
  assert.deepEqual([...app.styles], [['--unrelated-property', 'keep']]);
  app.storageEvent({ key: storageKey, newValue: JSON.stringify(custom) });
  app.storageEvent({ key: null, newValue: null });
  assert.deepEqual(plain(app.api.get()), defaults);
  assert.deepEqual(app.events.at(-1).detail, { values: defaults, saved: false, reason: 'storage' });
  assert.equal(app.calls.filter(([method]) => method !== 'getItem').length, 0, 'remote updates must not write back to storage');
});


test('color preferences validate tokens, keep theme overrides separate and export derived states', () => {
  const app = engine();
  const invalid = { colors: { light: { '--primary': 'red', '--text': 'url(evil)', '--unknown': '#123456', '--canvas': 123 } } };
  assert.deepEqual(plain(app.api.set(invalid)), defaults);
  assert.equal(app.events.length, 1);
  app.api.set({ colors: { light: { '--primary': '#AbC', '--success': '#287544' }, dark: { '--primary': '#aabbff', '--canvas': '#101010' } } });
  assert.equal(app.styles.get('--primary'), '#aabbcc');
  assert.equal(app.styles.get('--success'), '#287544');
  assert.match(app.styles.get('--primary-hover'), /var\(--primary\)/);
  assert.match(app.styles.get('--success-surface'), /var\(--success\)/);
  assert.match(app.api.cssText(), /:root\[data-theme="light"\]/);
  assert.match(app.api.cssText(), /:root\[data-theme="dark"\]/);
  assert.match(app.api.cssText(), /--primary: #aabbff;/);
  const copy = app.api.get();
  copy.colors.light['--primary'] = '#000000';
  assert.equal(app.api.get().colors.light['--primary'], '#aabbcc');
  app.theme('dark');
  assert.equal(app.styles.get('--primary'), '#aabbff');
  assert.equal(app.styles.get('--canvas'), '#101010');
  assert.equal(app.styles.has('--success'), false);
  assert.equal(app.styles.has('--success-surface'), false);
  app.api.set({ colors: { dark: { '--primary': null } } });
  assert.equal(app.styles.has('--primary'), false);
  assert.equal(app.styles.has('--primary-hover'), false);
  assert.equal(app.styles.get('--canvas'), '#101010');
  app.theme('light');
  assert.equal(app.styles.get('--primary'), '#aabbcc');
  const restored = engine({ stored: app.storage.get(storageKey) });
  assert.deepEqual(plain(restored.api.get()), plain(app.api.get()));
  assert.equal(restored.styles.get('--primary'), '#aabbcc');
  app.api.reset();
  assert.deepEqual(plain(app.api.get()), defaults);
  assert.deepEqual([...app.styles], [['--unrelated-property', 'keep']]);
  assert.doesNotMatch(app.api.cssText(), /--primary/);
});

test('color-only storage updates hydrate and synchronize without losing numeric preferences', () => {
  const record = { colors: { dark: { '--danger': '#ff8888' } } };
  const app = engine({ stored: JSON.stringify(record) });
  assert.equal(app.events[0].detail.saved, true);
  app.theme('dark');
  assert.equal(app.styles.get('--danger-text'), '#ff8888');
  app.api.set({fontSize:16});
  assert.equal(app.api.get().colors.dark['--danger'], '#ff8888');
  app.storageEvent({key:storageKey,newValue:JSON.stringify({colors:{dark:{'--info':'#aabbcc'}}})});
  assert.equal(app.styles.has('--danger'), false);
  assert.equal(app.styles.get('--info'), '#aabbcc');
  app.storageEvent({key:storageKey,newValue:null});
  assert.deepEqual([...app.styles], [['--unrelated-property', 'keep']]);
});


// Measure the resulting colors independently of the preference API under test.
const measuredContrast = (first, second) => {
  const luminance = hex => {
    const encoded = hex.replace('#', '');
    const normalized = encoded.length === 3 ? [...encoded].map(char => char + char).join('') : encoded;
    const linear = normalized.match(/../g).map(part => parseInt(part, 16) / 255).map(value => value < 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
};
const buttonProperties = ['--primary-control', '--primary-control-hover', '--primary-control-pressed'];
const dangerProperties = ['--danger-control', '--danger-control-hover', '--danger-control-pressed'];
function assertReadableButtons(styles, properties, foreground) {
  for (const property of properties) {
    const ratio = measuredContrast(styles.get(property), styles.get(foreground));
    assert(ratio >= 4.5, `${property}: ${ratio.toFixed(4)}:1`);
  }
}

test('contrast API recognizes shorthand colors and rejects non-HEX values', () => {
  const { api } = engine();
  assert.equal(api.contrastRatio('#000', '#fff'), 21);
  assert.equal(api.contrastRatio('#aBc', '#aabbcc'), 1);
  assert(Math.abs(api.contrastRatio('#ffeb3b', '#ffffff') - 1.221037733598236) < 0.000001);
  for (const invalid of ['red', 'CanvasText', '#ffffff00', '#12345', null, 123]) {
    assert.equal(api.contrastRatio(invalid, '#fff'), null);
    assert.equal(api.contrastRatio('#fff', invalid), null);
  }
});

test('primary controls retain readable text through every interaction state for bright and dark colors', () => {
  const app = engine();
  const colors = ['#ffeb3b', '#ffffff', '#000000', '#777777', '#747474', '#4263cc', '#f2a3a7'];
  for (const theme of ['light', 'dark']) {
    app.theme(theme);
    for (const background of colors) {
      app.api.set({colors:{[theme]:{'--primary-control':background}}});
      assert.equal(app.styles.get('--primary-control'), background, 'the chosen background remains exact');
      assertReadableButtons(app.styles, buttonProperties, '--text-on-primary');
      const foreground = app.styles.get('--text-on-primary');
      assert(['#000000', '#ffffff'].includes(foreground));
      assert.equal(app.styles.get('--focus-on-primary'), foreground);
    }
  }
});

test('saving the default dark Danger color separates status text from accessible filled-button colors', () => {
  const app = engine();
  app.theme('dark');
  app.api.set({colors:{dark:{'--danger':'#f2a3a7'}}});
  assert.equal(app.styles.get('--danger'), '#f2a3a7', 'the selected status color remains exact');
  assert.notEqual(app.styles.get('--danger-control'), '#f2a3a7');
  assertReadableButtons(app.styles, dangerProperties, '--text-on-danger');
  assert(measuredContrast(app.styles.get('--danger-text'), '#151719') >= 4.5);
  assert(measuredContrast(app.styles.get('--danger-text'), '#30282a') >= 4.5);
});

test('danger foregrounds remain readable against custom light and dark canvas and status surfaces', () => {
  const app = engine();
  for (const [theme, canvas] of [['light', '#ffffff'], ['light', '#fffdf5'], ['dark', '#151719'], ['dark', '#101010']]) {
    app.theme(theme);
    for (const danger of ['#ffffff', '#000000', '#ffeb3b', '#777777', '#f2a3a7']) {
      app.api.set({colors:{[theme]:{'--danger':danger,'--canvas':canvas}}});
      const canvasChannels = canvas.slice(1).match(/../g).map(part => parseInt(part, 16));
      const dangerChannels = danger.slice(1).match(/../g).map(part => parseInt(part, 16));
      const surface = '#' + canvasChannels.map((channel, index) => Math.round(channel * 0.88 + dangerChannels[index] * 0.12).toString(16).padStart(2, '0')).join('');
      assert(measuredContrast(app.styles.get('--danger-text'), canvas) >= 4.5, `${theme} status on canvas`);
      assert(measuredContrast(app.styles.get('--danger-text'), surface) >= 4.5, `${theme} status on surface`);
      assertReadableButtons(app.styles, dangerProperties, '--text-on-danger');
    }
  }
});

test('contrast-derived tokens hydrate, export by theme and clear with individual or full resets', () => {
  const app = engine();
  app.api.set({colors:{light:{'--primary-control':'#ffeb3b','--danger':'#eeeeee'},dark:{'--primary-control':'#000000','--danger':'#f2a3a7'}}});
  const snapshot = [...app.styles].filter(([key]) => key.startsWith('--primary-control') || key.startsWith('--danger') || key.startsWith('--text-on-'));
  const hydrated = engine({stored:app.storage.get(storageKey)});
  for (const [key, value] of snapshot) assert.equal(hydrated.styles.get(key), value, key);
  const exported = app.api.cssText();
  assert.match(exported, /:root\[data-theme="light"\]/);
  assert.match(exported, /:root\[data-theme="dark"\]/);
  assert.match(exported, /--text-on-primary: #000000;/);
  assert.match(exported, /--text-on-primary: #ffffff;/);
  assert.match(exported, /--text-on-danger: #[0-9a-f]{6};/);
  app.theme('dark');
  assertReadableButtons(app.styles, buttonProperties, '--text-on-primary');
  assertReadableButtons(app.styles, dangerProperties, '--text-on-danger');
  app.api.set({colors:{dark:{'--primary-control':null,'--danger':null}}});
  for (const property of [...buttonProperties,...dangerProperties,'--text-on-primary','--text-on-danger','--danger-text']) assert.equal(app.styles.has(property), false, property);
  app.theme('light');
  assertReadableButtons(app.styles, buttonProperties, '--text-on-primary');
  app.api.reset();
  assert.deepEqual([...app.styles], [['--unrelated-property', 'keep']]);
  assert.doesNotMatch(app.api.cssText(), /--text-on-(?:primary|danger)/);
});
