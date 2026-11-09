import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {Grid, GridItem} from '../dist/index.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/', pretendToBeVisual:true});
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'MouseEvent']) {
  Object.defineProperty(globalThis, name, {configurable:true, value:dom.window[name]});
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const {createRoot} = await import('react-dom/client');
const {act, createElement:h} = React;
after(() => dom.window.close());

function fixture() {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  return {container, render:element => act(async () => root.render(element)), dispose:async () => {await act(async () => root.unmount()); container.remove();}};
}
const value = (element, property, breakpoint) => element.style.getPropertyValue(`--mono-grid-${property}-${breakpoint}`);

test('Grid responsive markup is deterministic without browser globals or viewport measurement', () => {
  const view = h(Grid, {columns:{sm:2, lg:4}, gap:{base:2, md:8}, 'aria-label':'프로젝트 정보'},
    h('input', {name:'name', defaultValue:'mono'}),
    h(GridItem, {colSpan:'full'}, '설명'));
  const descriptors = new Map(['window','document'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  let server;
  try {
    for (const name of descriptors.keys()) delete globalThis[name];
    server = renderToString(view);
  } finally {
    for (const [name, descriptor] of descriptors) Object.defineProperty(globalThis, name, descriptor);
  }
  assert.equal(renderToString(view), server);
  const markup = new JSDOM(server);
  try {
    const grid = markup.window.document.querySelector('.mono-grid');
    assert.equal(grid.getAttribute('aria-label'), '프로젝트 정보');
    assert.equal(grid.getAttribute('role'), null);
    assert.equal(grid.children[0].getAttribute('name'), 'name');
    assert.equal(grid.children[1].textContent, '설명');
    assert.equal(value(grid, 'columns', 'base'), '1');
    assert.equal(value(grid, 'columns', 'md'), '2');
    assert.equal(value(grid, 'columns', 'xl'), '4');
  } finally {markup.window.close();}
});

test('Grid and GridItem forward native props, refs and caller styles without layout prop attributes', async () => {
  const f = fixture(), gridRef = React.createRef(), itemRef = React.createRef(), clicks = [];
  try {
    await f.render(h(Grid, {
      id:'layout', ref:gridRef, className:'project-layout', columns:2, gap:4,
      rowGap:2, columnGap:8, alignItems:'center', justifyItems:'end',
      style:{gridTemplateColumns:'1fr 2fr', '--mono-grid-columns-base':3},
      'data-purpose':'form', 'aria-labelledby':'layout-name', onClick:() => clicks.push('grid'),
    }, h(GridItem, {
      id:'field', ref:itemRef, className:'project-field', colSpan:'full', rowSpan:2,
      alignSelf:'end', justifySelf:'start', tabIndex:0,
      style:{padding:'4px', '--mono-grid-item-column-base':'2 / -1'},
      onClick:() => clicks.push('item'),
    }, '필드')));
    const grid = f.container.firstElementChild, item = grid.firstElementChild;
    assert.equal(gridRef.current, grid);
    assert.equal(itemRef.current, item);
    assert.equal(grid.tagName, 'DIV');
    assert.equal(item.tagName, 'DIV');
    assert.ok(grid.classList.contains('project-layout'));
    assert.ok(item.classList.contains('project-field'));
    assert.equal(grid.dataset.purpose, 'form');
    assert.equal(grid.getAttribute('aria-labelledby'), 'layout-name');
    assert.equal(grid.getAttribute('role'), null);
    assert.equal(item.getAttribute('role'), null);
    assert.equal(item.tabIndex, 0);
    assert.equal(grid.style.gridTemplateColumns, '1fr 2fr');
    assert.equal(value(grid, 'columns', 'base'), '3');
    assert.equal(item.style.padding, '4px');
    assert.equal(value(item, 'item-column', 'base'), '2 / -1');
    for (const name of ['columns','gap','rowgap','columngap','alignitems','justifyitems']) assert.equal(grid.hasAttribute(name), false);
    for (const name of ['colspan','rowspan','alignself','justifyself']) assert.equal(item.hasAttribute(name), false);
    await act(async () => item.click());
    assert.deepEqual(clicks, ['item','grid']);
    await f.render(null);
    assert.equal(gridRef.current, null);
    assert.equal(itemRef.current, null);
  } finally {await f.dispose();}
});

test('axis gaps follow the shared gap until explicitly overridden and retain sparse breakpoint values', async () => {
  const f = fixture();
  try {
    await f.render(h(Grid, {
      columns:{md:3}, gap:{base:2, sm:4, lg:10}, rowGap:{md:8}, columnGap:{base:0, xl:12},
      alignItems:{sm:'center'}, justifyItems:{lg:'end'},
    }));
    const grid = f.container.firstElementChild;
    assert.deepEqual(['base','sm','md','lg','xl'].map(bp => value(grid, 'row-gap', bp)), ['var(--space-2)','var(--space-4)','var(--space-8)','var(--space-8)','var(--space-8)']);
    assert.deepEqual(['base','sm','md','lg','xl'].map(bp => value(grid, 'column-gap', bp)), ['var(--space-0)','var(--space-0)','var(--space-0)','var(--space-0)','var(--space-12)']);
    assert.equal(value(grid, 'columns', 'sm'), '1');
    assert.equal(value(grid, 'columns', 'xl'), '3');
    assert.equal(value(grid, 'align', 'base'), 'stretch');
    assert.equal(value(grid, 'align', 'xl'), 'center');
    assert.equal(value(grid, 'justify', 'md'), 'stretch');
    assert.equal(value(grid, 'justify', 'xl'), 'end');
  } finally {await f.dispose();}
});

test('rerendering sparse responsive props replaces old values while keeping child inputs mounted', async () => {
  const f = fixture();
  const view = props => h(Grid, props, h(GridItem, {colSpan:props.columns === 1 ? 1 : {sm:2, lg:'full'}}, h('input', {defaultValue:'편집 중'})));
  try {
    await f.render(view({columns:{base:2, lg:4}, gap:{base:2, xl:12}, rowGap:8, alignItems:'end'}));
    const grid = f.container.firstElementChild, item = grid.firstElementChild, input = item.firstElementChild;
    input.value = '저장 전 입력';
    await f.render(view({columns:1}));
    assert.equal(item.firstElementChild, input);
    assert.equal(input.value, '저장 전 입력');
    assert.equal(value(grid, 'columns', 'lg'), '1');
    assert.equal(value(grid, 'row-gap', 'xl'), 'var(--space-6)');
    assert.equal(value(grid, 'column-gap', 'xl'), 'var(--space-6)');
    assert.equal(value(grid, 'align', 'lg'), 'stretch');
    assert.equal(value(item, 'item-column', 'lg'), 'span min(1, var(--mono-grid-columns, 1))');
    await f.render(view({columns:{lg:3}, gap:{md:10}}));
    assert.equal(value(grid, 'columns', 'base'), '1');
    assert.equal(value(grid, 'columns', 'xl'), '3');
    assert.equal(value(grid, 'row-gap', 'sm'), 'var(--space-6)');
    assert.equal(value(grid, 'row-gap', 'xl'), 'var(--space-10)');
  } finally {await f.dispose();}
});

test('nested grids and items define their own defaults at every breakpoint', async () => {
  const f = fixture();
  try {
    await f.render(h(Grid, {columns:{base:2, lg:6}, gap:12, alignItems:'end'},
      h(GridItem, {colSpan:'full', rowSpan:3, alignSelf:'end'},
        h(Grid, {'data-inner':true}, h(GridItem, null, '안쪽 항목')))));
    const outer = f.container.firstElementChild, outerItem = outer.firstElementChild;
    const inner = outerItem.firstElementChild, innerItem = inner.firstElementChild;
    assert.equal(value(outer, 'columns', 'lg'), '6');
    for (const bp of ['base','sm','md','lg','xl']) {
      assert.equal(value(inner, 'columns', bp), '1');
      assert.equal(value(inner, 'row-gap', bp), 'var(--space-6)');
      assert.equal(value(inner, 'align', bp), 'stretch');
      assert.equal(value(innerItem, 'item-row', bp), 'span 1');
      assert.equal(value(innerItem, 'item-align', bp), 'auto');
    }
    assert.equal(value(outerItem, 'item-column', 'base'), '1 / -1');
    assert.equal(value(outerItem, 'item-row', 'xl'), 'span 3');
  } finally {await f.dispose();}
});

test('GridItem responsive spans and self alignment carry forward with safe positive integer fallbacks', async () => {
  const f = fixture();
  try {
    await f.render(h(Grid, {columns:0}, h(GridItem, {colSpan:{sm:2.9, lg:'full'}, rowSpan:{base:-2, md:2.9}, alignSelf:{sm:'center'}, justifySelf:{lg:'end'}}, '내용')));
    const grid = f.container.firstElementChild, item = grid.firstElementChild;
    assert.equal(value(grid, 'columns', 'base'), '1');
    assert.equal(value(item, 'item-column', 'base'), 'span min(1, var(--mono-grid-columns, 1))');
    assert.equal(value(item, 'item-column', 'md'), 'span min(2, var(--mono-grid-columns, 1))');
    assert.equal(value(item, 'item-column', 'xl'), '1 / -1');
    assert.equal(value(item, 'item-row', 'sm'), 'span 1');
    assert.equal(value(item, 'item-row', 'xl'), 'span 2');
    assert.equal(value(item, 'item-align', 'base'), 'auto');
    assert.equal(value(item, 'item-align', 'xl'), 'center');
    assert.equal(value(item, 'item-justify', 'md'), 'auto');
    assert.equal(value(item, 'item-justify', 'xl'), 'end');
  } finally {await f.dispose();}
});
