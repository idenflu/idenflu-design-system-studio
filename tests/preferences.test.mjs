import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../systems/idenflu-mono/preferences.js', import.meta.url), 'utf8');
const storageKey = 'idenflu-mono-preferences-v1';
const defaults = { fontSize: 14, lineHeight: 22, spacing: 100, controlHeight: 36, radius: 0, fontFamily: 'pretendard' };
const custom = { fontSize: 16, lineHeight: 26, spacing: 125, controlHeight: 44, radius: 6, fontFamily: 'pretendard' };
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

test('previous default snapshots adopt 36px without losing colors or custom sizes', () => {
  const colors = {light:{'--primary':'#2255aa'}};
  const previous = engine({stored:JSON.stringify({...defaults,controlHeight:38,colors})});
  assert.deepEqual(plain(previous.api.get()), {...defaults,colors});
  assert.equal(previous.styles.get('--control-base-height'), '36px');
  const customized = {...custom,controlHeight:38,colors};
  assert.deepEqual(plain(engine({stored:JSON.stringify(customized)}).api.get()), customized);
  previous.api.set({controlHeight:38});
  const record = previous.storage.get(storageKey);
  assert.equal(JSON.parse(record).defaultsVersion, 2);
  assert.equal(engine({stored:record}).api.get().controlHeight, 38);
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
  assert.deepEqual(Object.keys(JSON.parse(app.storage.get(storageKey))), [...Object.keys(defaults), 'defaultsVersion']);
});

test('font choices persist, export and synchronize while preserving sizes, colors and reset ownership', () => {
  const app = engine({values:new Map([['consumer-draft','keep']])});
  app.api.set({...custom, colors:{light:{'--primary':'#2255aa'}}});
  const next = app.api.set({fontFamily:'wanted-sans'});
  assert.equal(next.fontFamily, 'wanted-sans');
  assert.equal(next.fontSize, custom.fontSize);
  assert.equal(next.colors.light['--primary'], '#2255aa');
  assert.match(app.styles.get('--font-family-body'), /^"Wanted Sans Variable", Pretendard,/);
  assert.match(app.api.cssText(), /--font-family-body: "Wanted Sans Variable", Pretendard,/);
  const restored = engine({stored:app.storage.get(storageKey)});
  assert.deepEqual(plain(restored.api.get()), plain(next));
  restored.storageEvent({key:storageKey,newValue:JSON.stringify({fontFamily:'pretendard',fontSize:16})});
  assert.equal(restored.api.get().fontFamily, 'pretendard');
  assert.match(restored.styles.get('--font-family-body'), /^Pretendard,/);
  app.api.reset();
  assert.equal(app.api.get().fontFamily, 'pretendard');
  assert.equal(app.styles.has('--font-family-body'), false);
  assert.equal(app.storage.get('consumer-draft'), 'keep');
});

test('font preferences accept only registered own values and hydrate legacy size records with Pretendard', () => {
  const app = engine();
  for (const fontFamily of ['Arial','toString','__proto__','url(evil)',null,12,{}]) {
    assert.deepEqual(plain(app.api.set({fontFamily})), defaults);
  }
  assert.deepEqual(plain(app.api.set(Object.create({fontFamily:'wanted-sans'}))), defaults);
  assert.equal(app.events.length, 1);
  assert.equal(app.storage.has(storageKey), false);
  const legacy = engine({stored:JSON.stringify({fontSize:16,lineHeight:26,spacing:125,controlHeight:44,radius:6})});
  assert.deepEqual(plain(legacy.api.get()), custom);
  const fontOnly = engine({stored:JSON.stringify({fontFamily:'wanted-sans'})});
  assert.deepEqual(plain(fontOnly.api.get()), {...defaults,fontFamily:'wanted-sans'});
  assert.match(fontOnly.styles.get('--font-family-body'), /Wanted Sans Variable/);
  const invalidStored = engine({stored:JSON.stringify({fontFamily:'Arial'})});
  assert.deepEqual(plain(invalidStored.api.get()), defaults);
  assert.equal(invalidStored.events[0].detail.saved, false);
  assert.deepEqual(plain(app.api.fonts).map(({value}) => value), ['pretendard','wanted-sans']);
});

test('ranges snap to permitted steps and enforce font-linked line and control minimums', () => {
  const app = engine();
  assert.deepEqual(plain(app.api.set({ fontSize: 99, lineHeight: 1, spacing: 149, controlHeight: 31, radius: 99 })), {
    ...defaults, fontSize: 18, lineHeight: 22, spacing: 150, controlHeight: 36, radius: 12,
  });
  assert.deepEqual(plain(app.api.set({ fontSize: -1, lineHeight: 100, spacing: -10, controlHeight: 99, radius: -9 })), {
    ...defaults, fontSize: 12, lineHeight: 32, spacing: 75, controlHeight: 48, radius: 0,
  });
  assert.deepEqual(plain(app.api.set({ fontSize: 15.4, lineHeight: 18.2, spacing: 111, controlHeight: 33, radius: 2.6 })), {
    ...defaults, fontSize: 15, lineHeight: 19, spacing: 110, controlHeight: 34, radius: 3,
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
  assert.deepEqual(JSON.parse(app.storage.get(storageKey)), { ...custom, defaultsVersion: 2 });
  assert.deepEqual(app.events.at(-1), { type: 'preferenceschange', detail: { values: custom, saved: true, reason: 'set' } });
  assert.equal(app.styles.get('--unrelated-property'), 'keep');
});

test('stored records hydrate before UI and corrupt or incorrectly typed records fall back', () => {
  const stored = engine({ stored: JSON.stringify({ fontSize: 18, lineHeight: 18, spacing: 101, controlHeight: 32, radius: 2, unknown: 99 }) });
  assert.deepEqual(plain(stored.api.get()), { ...defaults, fontSize: 18, lineHeight: 22, spacing: 100, controlHeight: 36, radius: 2 });
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


const chipRoles = ['primary','success','warning','danger','neutral','secondary'];
test('solid toast foregrounds remain readable after status color overrides and reset with them', () => {
  const app = engine();
  for (const theme of ['light','dark']) {
    app.theme(theme);
    for (const background of ['#ffffff','#000000','#ffeb3b','#777777','#4263cc']) {
      app.api.set({colors:{[theme]:Object.fromEntries(['info','success','warning','danger'].map(role => [`--${role}`,background]))}});
      for (const role of ['info','success','warning','danger']) {
        const foreground = app.styles.get(`--toast-on-${role}`);
        assert(app.api.contrastRatio(foreground,background) >= 4.5, `${theme} ${role} ${foreground} on ${background}`);
      }
    }
  }
  app.api.reset();
  for (const role of ['info','success','warning','danger']) assert.equal(app.styles.has(`--toast-on-${role}`), false);
});
const chipProperty = role => `--chip-${role}-selected-text`;
const chipThemeDefaults = {
  light: {primary:'#4263cc',success:'#38754d',warning:'#8c641b',danger:'#ad3131',neutral:'#edf0fb',secondary:'#e1e4e9'},
  dark: {primary:'#9aafff',success:'#9acba6',warning:'#e2c27f',danger:'#f2a3a7',neutral:'#28314b',secondary:'#343941'},
};
function assertReadableChips(app, theme, customAccent) {
  for (const role of chipRoles) {
    const background = role === 'danger' ? app.styles.get('--danger-text') || chipThemeDefaults[theme].danger : ['primary','success','warning'].includes(role) ? customAccent || chipThemeDefaults[theme][role] : chipThemeDefaults[theme][role];
    const foreground = app.styles.get(chipProperty(role));
    assert.match(foreground, /^#[0-9a-f]{6}$/i, `${theme} ${role} has a concrete exportable foreground`);
    const ratio = measuredContrast(foreground,background);
    assert(ratio >= 4.5, `${theme} ${role}: ${foreground} on ${background} = ${ratio.toFixed(4)}:1`);
  }
}

test('selected chip foregrounds stay readable for bright, dark and midtone accents in both themes', () => {
  const app = engine();
  for (const theme of ['light','dark']) {
    app.theme(theme);
    for (const accent of ['#ffeb3b','#ffffff','#000000','#777777']) {
      app.api.set({colors:{[theme]:{'--primary':accent,'--success':accent,'--warning':accent,'--danger':accent}}});
      assertReadableChips(app,theme,accent);
    }
  }
});

test('changing only canvas still derives safe selected chip foregrounds', () => {
  for (const theme of ['light','dark']) {
    const app = engine();
    app.theme(theme);
    app.api.set({colors:{[theme]:{'--canvas':theme === 'light' ? '#000000' : '#ffffff'}}});
    assertReadableChips(app,theme);
  }
});

test('selected chip contrast tokens hydrate, export, synchronize and reset with their palettes', () => {
  const app = engine();
  app.api.set({colors:{light:{'--primary':'#ffeb3b','--success':'#ffffff','--warning':'#777777'},dark:{'--primary':'#000000','--danger':'#f2a3a7'}}});
  const record = app.storage.get(storageKey);
  const hydrated = engine({stored:record});
  for (const role of chipRoles) assert.equal(hydrated.styles.get(chipProperty(role)),app.styles.get(chipProperty(role)));
  const exported = app.api.cssText();
  for (const role of chipRoles) assert.match(exported,new RegExp(`${chipProperty(role)}: #[0-9a-f]{6};`));
  app.theme('dark');
  for (const role of chipRoles) assert(app.styles.has(chipProperty(role)));
  app.api.set({colors:{dark:{'--primary':null,'--danger':null}}});
  for (const role of chipRoles) assert.equal(app.styles.has(chipProperty(role)),false,`removed dark override: ${role}`);
  app.storageEvent({key:storageKey,newValue:record});
  for (const role of chipRoles) assert(app.styles.has(chipProperty(role)));
  app.api.reset();
  for (const role of chipRoles) assert.equal(app.styles.has(chipProperty(role)),false);
  assert.doesNotMatch(app.api.cssText(),/--chip-.*-selected-text/);
});
