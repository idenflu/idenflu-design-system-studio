import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import * as icons from '../dist/icons/index.js';
import { generateIcons } from '../scripts/generate-icons.mjs';

const sprite = await readFile(new URL('../assets/icons/icons.svg', import.meta.url), 'utf8');
const parse = text => new JSDOM(text, { contentType: 'image/svg+xml' }).window.document;
const nameOf = id => id.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('') + 'Icon';

test('every symbol produces a component preserving drawing elements and attributes', () => {
  const symbols = [...parse(sprite).documentElement.children];
  assert.equal(Object.keys(icons).length, symbols.length);
  for (const symbol of symbols) {
    const name = nameOf(symbol.id), component = icons[name];
    assert.ok(component, name);
    const rendered = parse(renderToStaticMarkup(React.createElement(component))).documentElement;
    const originalNodes = [symbol, ...symbol.querySelectorAll('*')];
    const renderedNodes = [rendered, ...rendered.querySelectorAll('*')];
    assert.equal(originalNodes.length, renderedNodes.length, name);
    originalNodes.forEach((node, index) => {
      const result = renderedNodes[index];
      if (index) assert.equal(result.localName, node.localName, name);
      for (const attr of node.attributes) {
        if (index === 0 && attr.name === 'id') continue;
        const actual = result.getAttribute(attr.name);
        if (attr.name === 'id') assert.ok(actual.endsWith('-' + attr.value), name);
        else if (attr.value.includes('url(#')) assert.ok(actual.includes('-' + attr.value.slice(5)), name);
        else assert.equal(actual, attr.value, `${name}: ${attr.name}`);
      }
    });
  }
});

test('the component sprite contains outline symbols with the common stroke settings', () => {
  const symbols = [...parse(sprite).documentElement.children];
  assert.ok(symbols.length > 0);
  for (const symbol of symbols) {
    assert.doesNotMatch(symbol.id, /-fill$/);
    for (const [name, value] of Object.entries({viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', 'stroke-width':'1.5', 'stroke-linecap':'square', 'stroke-linejoin':'miter'})) {
      assert.equal(symbol.getAttribute(name), value, `${symbol.id}: ${name}`);
    }
  }
});

test('size, accessible label, color inheritance and isolated mask IDs work', () => {
  const doc = parse(`<root>${renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(icons.PinOffIcon, { size: 20, label: '고정 해제', 'data-test': 'one' }),
    React.createElement(icons.PinOffIcon), React.createElement(icons.PlusIcon)))}</root>`);
  const [first, second, add] = doc.documentElement.children;
  assert.equal(first.getAttribute('width'), '20');
  assert.equal(first.getAttribute('aria-label'), '고정 해제');
  assert.equal(first.getAttribute('role'), 'img');
  assert.equal(first.getAttribute('data-test'), 'one');
  assert.equal(second.getAttribute('aria-hidden'), 'true');
  assert.equal(add.getAttribute('stroke'), 'currentColor');
  const a = first.querySelector('mask').id, b = second.querySelector('mask').id;
  assert.notEqual(a, b);
  assert.equal(first.querySelector('[mask]').getAttribute('mask'), `url(#${a})`);
  assert.equal(second.querySelector('[mask]').getAttribute('mask'), `url(#${b})`);
});

test('generator rejects unresolved references and duplicate names', () => {
  assert.throws(() => generateIcons('<svg xmlns="http://www.w3.org/2000/svg"><symbol id="x"><path mask="url(#missing)"/></symbol></svg>'), /Missing ID/);
  assert.throws(() => generateIcons('<svg xmlns="http://www.w3.org/2000/svg"><symbol id="x"/><symbol id="x"/></svg>'), /duplicate symbol/);
});

test('a single icon import excludes unrelated drawings', async () => {
  const result = await build({ stdin: { contents: "export { PlusIcon } from '@idenflu/mono-react/icons'", resolveDir: new URL('..', import.meta.url).pathname }, bundle: true, write: false, format: 'esm', external: ['react', 'react/jsx-runtime'] });
  assert.match(result.outputFiles[0].text, /M5 12h14/);
  assert.doesNotMatch(result.outputFiles[0].text, /BookmarkIcon|PinOffIcon/);
});

test('renamed and removed icons expose only their intended component names', () => {
  for (const name of ['PlusIcon', 'XIcon', 'XCircleIcon', 'VisibilityOffIcon', 'ExcelIcon', 'RotateIcon', 'MinusIcon', 'TrashIcon', 'UserIcon', 'ArrowRightLeftIcon', 'AsteriskSquareIcon', 'CalendarClockIcon', 'CropIcon', 'FilePenIcon', 'FolderInputIcon', 'FolderOutputIcon', 'LineHeightIcon', 'ListIcon', 'PenLineIcon', 'PlayDisabledIcon', 'RestartIcon', 'RotateAsteriskIcon', 'TableIcon', 'Table2Icon', 'TextIcon', 'TreeIcon']) assert.ok(icons[name], name);
  for (const name of ['AddIcon', 'CloseIcon', 'CloseCircleIcon', 'ErrorCircleIcon', 'EyeOffIcon', 'MicrosoftExcelIcon', 'RefreshIcon', 'RemoveIcon', 'Trash2Icon', 'BriefcaseIcon', 'CartIcon', 'CreditCardIcon', 'CrownIcon', 'IdCardIcon', 'ReceiptIcon', 'PersonIcon']) assert.equal(icons[name], undefined, name);
});

test('name-based icons and CSS masks cover the same final sprite symbols', async () => {
  const symbols = [...parse(sprite).documentElement.children];
  const names = await readFile(new URL('../src/icons/icon-names.ts', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/components/icon/icon.css', import.meta.url), 'utf8');
  for (const symbol of symbols) {
    assert.ok(names.includes(JSON.stringify(symbol.id)), symbol.id);
    const rule = css.split('\n').find(line => line.startsWith(`.icon-${symbol.id} {`));
    assert.ok(rule, symbol.id);
    const encoded = rule.match(/data:image\/svg\+xml,([^" ]+)/)?.[1];
    assert.ok(encoded, symbol.id);
    const mask = parse(decodeURIComponent(encoded)).documentElement;
    assert.equal(mask.localName, 'svg');
    assert.equal(mask.querySelectorAll('*').length, symbol.querySelectorAll('*').length, symbol.id);
  }
  assert.doesNotMatch(css, /assets\/icons\//);
});
