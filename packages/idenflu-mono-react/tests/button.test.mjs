import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { Button, IconButton } from '../dist/index.js';

test('Button exposes the chosen CVA classes and preserves its label while loading', () => {
  const doc = new JSDOM(renderToStaticMarkup(React.createElement(Button, {variant:'outline', color:'danger', loading:true}, '저장'))).window.document;
  const button=doc.querySelector('button');
  assert.ok(button.classList.contains('idsButton'));
  assert.ok(button.classList.contains('button--outline'));
  assert.ok(button.classList.contains('button-color--danger'));
  assert.equal(button.disabled,true);
  assert.equal(button.getAttribute('aria-busy'),'true');
  assert.equal(button.querySelector('.button-loading-content').textContent,'저장');
  assert.equal(button.querySelector('.button-loading-spinner').getAttribute('aria-hidden'),'true');
  assert.equal(button.hasAttribute('color'),false);
});

test('IconButton forwards the tooltip position and keeps its accessible name while loading', () => {
  const doc = new JSDOM(renderToStaticMarkup(React.createElement(IconButton, {label:'설정', tooltipPosition:'left', loading:true}, 'icon'))).window.document;
  assert.equal(doc.querySelector('.tooltip-wrap').dataset.position,'left');
  assert.equal(doc.querySelector('button').getAttribute('aria-label'),'설정');
  assert.equal(doc.querySelector('button').disabled,true);
});
