import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

// Keep the ordering helper internal to the package API.
const bundle = await build({
  entryPoints:[fileURLToPath(new URL('../src/components/data-grid/data-grid-toolbar.ts', import.meta.url))],
  bundle:true, write:false, platform:'node', format:'esm',
});
const { resolveDataGridToolbarOrder: order } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
const defaults = ['search','selection','columnFilters','density','columns','export','resetFilters','actions'];

const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/',pretendToBeVisual:true});
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','Node','Event','MouseEvent','KeyboardEvent']) {
  Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { DataGrid, Button } = await import('../dist/index.js');
const { act, createElement:h } = React;
after(() => dom.window.close());

function fixture() {
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  return {
    node,
    async render(props) { await act(async () => root.render(h(DataGrid,props))); },
    async dispose() { await act(async () => root.unmount()); node.remove(); },
  };
}
const click = async element => { assert.ok(element,'expected a clickable control'); await act(async () => element.click()); };
const nameOf = element => element.getAttribute('aria-label') || element.labels?.[0]?.textContent.trim() || element.textContent.trim();
const button = (node,name) => [...node.querySelectorAll('button')].find(element => nameOf(element) === name);
const input = async (element,value) => {
  assert.ok(element,'expected an input');
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(element,value);
    element.dispatchEvent(new Event('input',{bubbles:true}));
  });
};
const toolbar = node => node.querySelector('.data-grid-tools');
const controlNames = node => [...toolbar(node).querySelectorAll('button,input')]
  .filter(element => !element.closest('[hidden]'))
  .map(nameOf);
const shownNames = node => [...node.querySelectorAll('tbody tr[data-grid-row-id]')].map(row => row.querySelectorAll('td')[1].textContent.trim());
const columns = [
  {id:'name',header:'이름',accessor:row => row.name,filter:'text'},
  {id:'team',header:'팀',accessor:row => row.team},
];
const rows = [{id:'a',name:'Alpha',team:'디자인'},{id:'b',name:'Beta',team:'개발'}];
const props = {label:'작업 목록',rows,columns,getRowId:row => row.id,getRowLabel:row => row.name,selectable:true};

test('toolbar ordering keeps defaults and returns a fresh array', () => {
  assert.deepEqual(order(),defaults);
  assert.deepEqual(order([]),defaults);
  const first = order();
  first.reverse();
  assert.deepEqual(order(),defaults);
});

test('toolbar ordering ignores duplicates and unknown JavaScript keys without mutating input', () => {
  const requested = Object.freeze(['actions','columns','actions','missing',null,'__proto__','search','columns']);
  assert.deepEqual(order(requested),['actions','columns','search','selection','columnFilters','density','export','resetFilters']);
  assert.deepEqual(requested,['actions','columns','actions','missing',null,'__proto__','search','columns']);
});

test('toolbar groups follow the requested DOM order and preserve consumer action order', async () => {
  const f = fixture();
  const base = {...props,showColumnFilterToggle:true,defaultFilters:{name:'a'},defaultSelectedRowIds:['a'],exportable:true,
    selectionActions:h(React.Fragment,null,h(Button,null,'선택 작업 1'),h(Button,null,'선택 작업 2')),
    toolbarActions:h(React.Fragment,null,h(Button,null,'새 작업 1'),h(Button,null,'새 작업 2'))};
  try {
    await f.render(base);
    await click(button(f.node,'컬럼 필터'));
    const selection = ['선택 작업 1','선택 작업 2','선택한 행 내보내기','선택 해제'];
    assert.deepEqual(controlNames(f.node),['검색',...selection,'컬럼 필터','촘촘한 행 간격','표시 열','CSV 내보내기','필터 초기화','새 작업 1','새 작업 2']);
    await f.render({...base,toolbarOrder:['actions','export','selection','columns','resetFilters','density','columnFilters','search']});
    assert.deepEqual(controlNames(f.node),['새 작업 1','새 작업 2','CSV 내보내기',...selection,'표시 열','필터 초기화','촘촘한 행 간격','컬럼 필터','검색']);
    assert.equal(toolbar(f.node).children.length,8,'keyed groups add no DOM wrappers');
    assert.ok(toolbar(f.node).lastElementChild.classList.contains('data-grid-search'));
    assert.deepEqual([...toolbar(f.node).querySelectorAll('[tabindex]')].map(element => element.getAttribute('tabindex')),[],'controls keep natural tab order');
  } finally { await f.dispose(); }
});

test('partial orders append remaining visible controls while existing props keep controlling visibility', async () => {
  const f = fixture();
  try {
    await f.render({...props,exportable:true,toolbarOrder:['export','missing','export','actions'],toolbarActions:h(Button,null,'추가')});
    assert.deepEqual(controlNames(f.node),['CSV 내보내기','추가','검색','촘촘한 행 간격','표시 열']);
    await f.render({...props,searchable:false,showDensityToggle:false,showColumnVisibility:false,toolbarOrder:defaults,toolbarActions:h(Button,null,'추가')});
    assert.deepEqual(controlNames(f.node),['추가']);
    await f.render({...props,density:'compact',toolbarOrder:['density']});
    assert.equal(button(f.node,'촘촘한 행 간격'),undefined,'read-only controlled density keeps its existing hidden control');
  } finally { await f.dispose(); }
});

test('moving groups preserves selection, nested component state and an open column menu', async () => {
  const f = fixture();
  function Counter({label}) {
    const [count,setCount] = React.useState(0);
    return h(Button,{onClick:() => setCount(value => value + 1)},`${label} ${count}`);
  }
  const base = {...props,selectionActions:h(Counter,{label:'선택 작업'}),toolbarActions:h(Counter,{label:'일반 작업'})};
  try {
    await f.render(base);
    await click(f.node.querySelector('tbody input[type="checkbox"]'));
    await click(button(f.node,'선택 작업 0'));
    await click(button(f.node,'일반 작업 0'));
    await click(button(f.node,'표시 열'));
    const selectionButton = button(f.node,'선택 작업 1');
    const actionButton = button(f.node,'일반 작업 1');
    const columnsButton = button(f.node,'표시 열');
    await f.render({...base,toolbarOrder:['actions','columns','selection']});
    assert.equal(button(f.node,'선택 작업 1'),selectionButton);
    assert.equal(button(f.node,'일반 작업 1'),actionButton);
    assert.equal(button(f.node,'표시 열'),columnsButton);
    assert.equal(columnsButton.getAttribute('aria-expanded'),'true');
    assert.equal(f.node.querySelector('tbody input[type="checkbox"]').checked,true);
    await click(button(f.node,'선택 해제'));
    assert.equal(f.node.querySelector('.data-grid-selection'),null);
    assert.equal(f.node.querySelector('tbody input[type="checkbox"]').checked,false);
  } finally { await f.dispose(); }
});

test('reordered search, density, filters, columns and CSV retain their behavior', async () => {
  const f = fixture(), previousPicker = window.showSaveFilePicker;
  let csv;
  try {
    window.showSaveFilePicker = async () => ({createWritable:async () => ({write:async blob => { csv = await blob.text(); },close:async () => {}})});
    await f.render({...props,exportable:true,showColumnFilterToggle:true,toolbarOrder:['export','columns','density','columnFilters','resetFilters','search']});
    await click(button(f.node,'촘촘한 행 간격'));
    assert.equal(f.node.querySelector('.data-grid').getAttribute('data-density'),'compact');
    await input(f.node.querySelector('input[type="search"]'),'Alpha');
    assert.deepEqual(shownNames(f.node),['Alpha']);
    await click(button(f.node,'CSV 내보내기'));
    assert.match(csv,/Alpha/);
    assert.doesNotMatch(csv,/Beta/);
    await click(button(f.node,'검색 초기화'));
    await click(button(f.node,'컬럼 필터'));
    await input(f.node.querySelector('input[aria-label="이름 필터"]'),'Beta');
    assert.deepEqual(shownNames(f.node),['Beta']);
    await click(button(f.node,'필터 초기화'));
    assert.deepEqual(shownNames(f.node),['Alpha','Beta']);
    await click(button(f.node,'표시 열'));
    await click(f.node.querySelector('.data-grid-column-options label:last-child input'));
    assert.equal(f.node.querySelectorAll('thead tr:first-child th').length,2,'selection and name columns remain visible');
    assert.equal(f.node.querySelector('.data-grid-column-options').getAttribute('data-size'),'md');
  } finally { window.showSaveFilePicker = previousPicker; await f.dispose(); }
});

test('toolbar size scopes inherited controls while explicit sizes, rows and footer retain their own scope', async () => {
  const f = fixture();
  const base = {...props,defaultSelectedRowIds:['a'],selectionActions:h(Button,null,'선택 작업'),toolbarActions:h(React.Fragment,null,h(Button,null,'상속 작업'),h(Button,{size:'lg'},'큰 작업'))};
  try {
    await f.render(base);
    assert.equal(toolbar(f.node).getAttribute('data-size'),'sm');
    for (const size of ['lg','md','sm']) {
      await f.render({...base,toolbarSize:size});
      assert.equal(toolbar(f.node).getAttribute('data-size'),size);
      for (const name of ['선택 작업','상속 작업','촘촘한 행 간격','선택 해제','표시 열']) {
        assert.equal(button(f.node,name).closest('[data-size]'),toolbar(f.node),`${name} inherits the toolbar size`);
      }
      assert.equal(f.node.querySelector('input[type="search"]').closest('[data-size]'),toolbar(f.node));
      assert.equal(button(f.node,'큰 작업').getAttribute('data-size'),'lg');
      assert.equal(f.node.querySelector('.data-grid-column-options').getAttribute('data-size'),'md');
      assert.equal(f.node.querySelector('.data-grid-viewport').closest('[data-size]'),null);
      assert.equal(f.node.querySelector('.data-grid-footer').closest('[data-size]'),null);
    }
  } finally { await f.dispose(); }
});

test('column filters inherit toolbar size without resetting filters, selection or sorting', async () => {
  const f = fixture(), filterChanges = [], selectionChanges = [], sortChanges = [];
  const filterColumns = [
    {...columns[0]},
    {id:'amount',header:'금액',accessor:row => row.amount,filter:'number'},
    {...columns[1],filter:'select',filterOptions:[{value:'디자인',label:'디자인'},{value:'개발',label:'개발'}]},
  ];
  const base = {...props,columns:filterColumns,showColumnFilterToggle:true,
    rows:[
      {id:'a',name:'Alpha',amount:10,team:'디자인'},
      {id:'b',name:'Beta',amount:20,team:'디자인'},
      {id:'c',name:'Gamma',amount:30,team:'개발'},
      {id:'d',name:'Delta',amount:40,team:'디자인'},
    ],
    onFiltersChange:value => filterChanges.push(value),
    onSelectedRowIdsChange:value => selectionChanges.push(value),
    onSortChange:value => sortChanges.push(value),
  };
  try {
    await f.render(base);
    await click(button(f.node,'컬럼 필터'));
    const filterRow = f.node.querySelector('.data-grid-filter-row');
    const text = filterRow.querySelector('input[aria-label="이름 필터"]');
    const minimum = filterRow.querySelector('input[aria-label="금액 최솟값"]');
    const maximum = filterRow.querySelector('input[aria-label="금액 최댓값"]');
    const select = filterRow.querySelector('[role="combobox"]');
    await input(text,'a');
    await input(minimum,'5');
    await input(maximum,'25');
    await click(select);
    const list = document.getElementById(select.getAttribute('aria-controls'));
    await click([...list.querySelectorAll('[role="option"]')].find(element => element.textContent.trim() === '디자인'));
    await click(button(f.node,'금액'));
    await click(button(f.node,'금액'));
    await click(f.node.querySelector('tbody tr[data-grid-row-id="a"] input[type="checkbox"]'));
    await click(button(f.node,'표시 열'));
    const changeCounts = [filterChanges.length,selectionChanges.length,sortChanges.length];
    assert.deepEqual(filterChanges.at(-1),{name:'a',amount:{min:'5',max:'25'},team:'디자인'});
    assert.deepEqual(selectionChanges.at(-1),['a']);
    assert.deepEqual(sortChanges.at(-1),{columnId:'amount',direction:'desc'});

    for (const size of ['sm','md','lg']) {
      await f.render({...base,toolbarSize:size});
      assert.equal(f.node.querySelector('.data-grid-filter-row'),filterRow,'size changes retain the filter controls');
      assert.equal(filterRow.getAttribute('data-size'),size);
      assert.equal(toolbar(f.node).getAttribute('data-size'),size);
      for (const control of [text,minimum,maximum,select]) {
        assert.equal(control.closest('[data-size]'),filterRow,'text, numeric and select filters inherit the row scope');
      }
      assert.equal(text.value,'a');
      assert.equal(minimum.value,'5');
      assert.equal(maximum.value,'25');
      assert.equal(select.getAttribute('aria-label'),'팀 필터: 디자인');
      assert.deepEqual(shownNames(f.node),['Beta','Alpha']);
      assert.equal(button(f.node,'금액').closest('th').getAttribute('aria-sort'),'descending');
      assert.equal(f.node.querySelector('tbody tr[data-grid-row-id="a"] input[type="checkbox"]').checked,true);
      assert.deepEqual([filterChanges.length,selectionChanges.length,sortChanges.length],changeCounts,'size changes do not publish data changes');
      assert.equal(f.node.querySelector('tbody').closest('[data-size]'),null);
      assert.equal(f.node.querySelector('tbody input[type="checkbox"]').closest('[data-size]'),null);
      assert.equal(f.node.querySelector('.data-grid-footer').closest('[data-size]'),null);
      assert.equal(f.node.querySelector('.data-grid').getAttribute('data-density'),'default');
      const columnOptions = f.node.querySelector('.data-grid-column-options');
      assert.equal(columnOptions.getAttribute('data-size'),'md');
      assert.equal(columnOptions.querySelector('input').closest('[data-size]'),columnOptions);
      assert.equal(button(f.node,'표시 열').getAttribute('aria-expanded'),'true');
    }
  } finally { await f.dispose(); }
});

test('toolbar size and ordering render on the server without browser globals', () => {
  const source = `
import React from 'react';
import {renderToString} from 'react-dom/server';
import {DataGrid,Button} from './dist/index.js';
if(typeof window !== 'undefined' || typeof document !== 'undefined') throw new Error('unexpected browser global');
console.log(renderToString(React.createElement(DataGrid,{label:'서버 목록',rows:[{id:'one',name:'Alpha'}],columns:[{id:'name',header:'이름',accessor:row => row.name}],getRowId:row => row.id,toolbarSize:'md',toolbarOrder:['actions','export','search'],exportable:true,toolbarActions:React.createElement(Button,null,'서버 작업')})));`;
  const output = execFileSync(process.execPath,['--input-type=module','-e',source],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  const node = document.createElement('div');
  node.innerHTML = output;
  assert.equal(toolbar(node).getAttribute('data-size'),'md');
  assert.deepEqual(controlNames(node),['서버 작업','CSV 내보내기','검색','촘촘한 행 간격']);
});
