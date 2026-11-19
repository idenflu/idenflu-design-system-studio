import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { CodeBlock } from '../dist/index.js';

test('JSON formatting preserves tokens and supports 0, 2, and 4 space indents', () => {
  const code = String.raw`{"id":9007199254740993,"id":1e+20,"text":"\"{[","empty":[{},[]]}`;
  for (const indentSize of [0, undefined, 4, -1, 1.5, Infinity]) {
    const spaces = [0, 4].includes(indentSize) ? indentSize : 2;
    const indent = ' '.repeat(spaces);
    const expected = [
      '{',
      `${indent}"id": 9007199254740993,`,
      `${indent}"id": 1e+20,`,
      indent + String.raw`"text": "\"{[",`,
      `${indent}"empty": [`,
      `${indent}${indent}{},`,
      `${indent}${indent}[]`,
      `${indent}]`,
      '}',
    ].join('\n');
    const html = renderToString(createElement(CodeBlock, { code, language: 'JSON', format: 'pretty', indentSize }));
    const dom = new JSDOM(html);
    assert.equal(dom.window.document.querySelector('code').textContent, expected);
    dom.window.close();
  }
});

test('defaults, unsupported languages, and invalid JSON display literal source', () => {
  for (const props of [
    { language: 'json', code: '\n{"value":"<button>"}' },
    { language: 'json', code: '{"value":', format: 'pretty' },
    { language: 'YAML', code: 'name: <button>', format: 'pretty' },
  ]) {
    const dom = new JSDOM(renderToString(createElement(CodeBlock, props)));
    assert.equal(dom.window.document.querySelector('code').textContent, props.code);
    assert.equal(dom.window.document.querySelector('button'), null);
    dom.window.close();
  }
});

test('XML hydrates without mismatch and preserves mixed content and xml:space', async () => {
  const code = '<?xml version="1.0"?><root><group><leaf/></group><p>Hi <b>there</b> !</p><keep xml:space="preserve"><inner>  <leaf/>  </inner></keep></root>';
  const props = { code, language: 'xml', format: 'pretty' };
  const dom = new JSDOM(renderToString(createElement(CodeBlock, props)));
  const { window } = dom;
  const { document } = window;
  Object.assign(globalThis, { window, document, DOMParser: window.DOMParser, XMLSerializer: window.XMLSerializer, IS_REACT_ACT_ENVIRONMENT: true });
  const text = () => document.querySelector('code').textContent;
  const errors = [];
  let root;
  try {
    assert.equal(text(), code);
    await act(async () => {
      root = hydrateRoot(document.body, createElement(CodeBlock, props), { onRecoverableError: error => errors.push(error) });
    });
    assert.deepEqual(errors, []);

    for (const indentSize of [2, 0, 4]) {
      await act(async () => root.render(createElement(CodeBlock, { ...props, indentSize })));
      const indent = ' '.repeat(indentSize);
      assert.equal(text(), [
        '<?xml version="1.0"?>', '<root>', `${indent}<group>`, `${indent}${indent}<leaf/>`,
        `${indent}</group>`, `${indent}<p>Hi <b>there</b> !</p>`,
        `${indent}<keep xml:space="preserve"><inner>  <leaf/>  </inner></keep>`, '</root>',
      ].join('\n'));
    }

    for (const source of ['<root><broken></root>', '<!DOCTYPE root><root><leaf/></root>']) {
      await act(async () => root.render(createElement(CodeBlock, { ...props, code: source })));
      assert.equal(text(), source);
    }
  } finally {
    if (root) await act(async () => root.unmount());
    dom.window.close();
    for (const key of ['window', 'document', 'DOMParser', 'XMLSerializer', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[key];
  }
});
