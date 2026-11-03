import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/',pretendToBeVisual:true});
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLSelectElement','Node','Event','MouseEvent','KeyboardEvent']) {
  Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
}
dom.window.HTMLElement.prototype.scrollTo = function (options) {
  if (typeof options === 'object') {
    if (options.top !== undefined) this.scrollTop = options.top;
    if (options.left !== undefined) this.scrollLeft = options.left;
  }
};
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const {createRoot} = await import('react-dom/client');
const {renderToString} = await import('react-dom/server');
const {DataGrid} = await import('../dist/index.js');
const {act,createElement:h} = React;
after(()=>dom.window.close());

const rows=Array.from({length:30},(_,index)=>({id:`id-${index+1}`,name:`항목 ${index+1}`,amount:index}));
const columns=[
  {id:'name',header:'이름',accessor:row=>row.name,filter:'text'},
  {id:'amount',header:'금액',accessor:row=>row.amount},
];
const props={label:'가상 목록',rows,columns,getRowId:row=>row.id,getRowLabel:row=>row.name};
function fixture() {
  const node=document.createElement('div');document.body.append(node);
  const root=createRoot(node);
  return {node,render:async element=>act(async()=>root.render(element)),dispose:async()=>{await act(async()=>root.unmount());node.remove();}};
}
function checkbox(node,label) {
  return [...node.querySelectorAll('label')].find(element=>element.textContent.trim()===label)?.querySelector('input[type="checkbox"]');
}
async function click(element) {assert.ok(element,'expected an actionable checkbox');await act(async()=>element.click());}
async function input(element,value) {
  assert.ok(element,'expected a search input');
  await act(async()=>{
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(element,value);
    element.dispatchEvent(new Event('input',{bubbles:true}));
  });
}
function parsed(element) {
  const holder=document.createElement('div');holder.innerHTML=renderToString(element);return holder;
}

test('virtual DataGrid renders a bounded initial window and complete row metadata without browser globals',()=>{
  const source=`
    import React from 'react';
    import {renderToString} from 'react-dom/server';
    import {DataGrid} from './dist/index.js';
    if (typeof window !== 'undefined' || typeof document !== 'undefined') throw new Error('expected a server environment');
    const rows=Array.from({length:10000},(_,i)=>({id:String(i),name:'항목 '+i}));
    const html=renderToString(React.createElement(DataGrid,{
      label:'서버 가상 목록',rows,columns:[{id:'name',header:'이름',accessor:r=>r.name,filter:'text'}],
      getRowId:r=>r.id,virtualized:true,selectable:true
    }));
    process.stdout.write(html);
  `;
  const html=execFileSync(process.execPath,['--input-type=module','-e',source],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  const node=document.createElement('div');node.innerHTML=html;
  const table=node.querySelector('table');
  assert.equal(table.getAttribute('role'),null);
  assert.equal(table.getAttribute('aria-rowcount'),'10002');
  assert.equal(table.getAttribute('aria-colcount'),'2');
  const actual=node.querySelectorAll('tbody tr[data-grid-row-id]');
  assert.ok(actual.length>0,'SSR should include its initial viewport');
  assert.ok(actual.length<80,'SSR must not emit the entire data set');
  assert.ok(html.length<150000);
  assert.equal(node.querySelector('.pagination'),null,'virtualization defaults to the full result set');
  assert.deepEqual([...node.querySelectorAll('thead tr')].map(row=>row.getAttribute('aria-rowindex')),['1','2']);
  for (const row of actual) assert.equal(Number(row.getAttribute('aria-rowindex')),Number(row.dataset.gridRowId)+3);
  for (const spacer of node.querySelectorAll('tbody tr[aria-hidden="true"]')) assert.equal(spacer.hasAttribute('aria-rowindex'),false);
});

test('virtualization keeps explicit page slicing and global accessible row positions',()=>{
  const node=parsed(h(DataGrid,{...props,virtualized:true,pagination:true,selectable:true,defaultPage:2,defaultPageSize:5}));
  assert.ok(node.querySelector('.pagination'));
  assert.equal(node.querySelector('table').getAttribute('aria-rowcount'),'32');
  const actual=[...node.querySelectorAll('tbody tr[data-grid-row-id]')];
  assert.deepEqual(actual.map(row=>row.dataset.gridRowId),['id-6','id-7','id-8','id-9','id-10']);
  assert.deepEqual(actual.map(row=>Number(row.getAttribute('aria-rowindex'))),[8,9,10,11,12]);
  assert.ok(checkbox(node,'현재 페이지 전체 선택'));
  assert.equal(checkbox(node,'검색 결과 전체 선택'),undefined);
});

test('pagination can be disabled without turning on virtualization, while ordinary grids retain paging',()=>{
  const all=parsed(h(DataGrid,{...props,pagination:false,defaultPageSize:5}));
  assert.equal(all.querySelectorAll('tbody tr').length,30);
  assert.equal(all.querySelector('.pagination'),null);
  const paged=parsed(h(DataGrid,{...props,virtualized:false,defaultPageSize:5}));
  assert.equal(paged.querySelectorAll('tbody tr').length,5);
  assert.ok(paged.querySelector('.pagination'));
});

test('virtual result selection covers filtered records beyond rendered rows and preserves prior selection',async()=>{
  const f=fixture(),changes=[];
  try {
    await f.render(h(DataGrid,{...props,virtualized:true,selectable:true,onSelectedRowIdsChange:ids=>changes.push(ids)}));
    await click(checkbox(f.node,'검색 결과 전체 선택'));
    assert.deepEqual(changes.at(-1),rows.map(row=>row.id));
    await input(f.node.querySelector('input[type="search"]'),'항목 30');
    assert.match(f.node.querySelector('.data-grid-selection-count').textContent,/30개 선택됨/);
    await click(checkbox(f.node,'검색 결과 전체 선택'));
    assert.equal(changes.at(-1).length,29);
    assert.equal(changes.at(-1).includes('id-30'),false);
    await input(f.node.querySelector('input[type="search"]'),'');
    const all=checkbox(f.node,'검색 결과 전체 선택');
    assert.equal(all.indeterminate,true);
    assert.equal(all.checked,false);
  } finally {await f.dispose();}
});

test('virtual explicit paging selects only its current page and ignores disabled records',async()=>{
  const f=fixture(),changes=[];
  try {
    await f.render(h(DataGrid,{...props,virtualized:true,pagination:true,selectable:true,defaultPage:2,defaultPageSize:5,isRowSelectable:row=>row.id!=='id-7',onSelectedRowIdsChange:ids=>changes.push(ids)}));
    await click(checkbox(f.node,'현재 페이지 전체 선택'));
    assert.deepEqual(changes.at(-1),['id-6','id-8','id-9','id-10']);
  } finally {await f.dispose();}
});

test('switching virtualization on and off preserves selection and restores each mode navigation',async()=>{
  const f=fixture();
  try {
    const base={...props,selectable:true,defaultPageSize:5};
    await f.render(h(DataGrid,base));
    await click(checkbox(f.node,'현재 페이지 전체 선택'));
    await f.render(h(DataGrid,{...base,virtualized:true}));
    assert.ok(checkbox(f.node,'검색 결과 전체 선택'));
    assert.equal(f.node.querySelector('.pagination'),null);
    assert.match(f.node.querySelector('.data-grid-selection-count').textContent,/5개 선택됨/);
    await f.render(h(DataGrid,{...base,virtualized:false}));
    assert.ok(checkbox(f.node,'현재 페이지 전체 선택'));
    assert.ok(f.node.querySelector('.pagination'));
    assert.equal(f.node.querySelectorAll('tbody tr').length,5);
    assert.match(f.node.querySelector('.data-grid-selection-count').textContent,/5개 선택됨/);
  } finally {await f.dispose();}
});

test('invalid virtual estimates and overscan fall back to a usable bounded server window',()=>{
  const many=Array.from({length:1000},(_,index)=>({id:String(index),name:`항목 ${index}`,amount:index}));
  for (const virtualized of [{estimateRowHeight:0,overscan:-5},{estimateRowHeight:Number.NaN,overscan:Number.NaN}]) {
    const node=parsed(h(DataGrid,{...props,rows:many,virtualized}));
    const count=node.querySelectorAll('tbody tr[data-grid-row-id]').length;
    assert.ok(count>0&&count<80);
    assert.equal(/NaN|Infinity/.test(node.querySelector('table').outerHTML),false);
    assert.equal(node.querySelector('table').getAttribute('aria-rowcount'),'1002');
  }
});

test('virtual empty and loading states expose only valid accessible row positions',()=>{
  for (const state of [{rows:[]},{loading:true},{error:'조회에 실패했습니다.'}]) {
    const node=parsed(h(DataGrid,{...props,virtualized:true,...state}));
    const table=node.querySelector('table');
    const count=Number(table.getAttribute('aria-rowcount'));
    for (const row of table.querySelectorAll('tr[aria-rowindex]')) {
      const index=Number(row.getAttribute('aria-rowindex'));
      assert.ok(index>=1&&index<=count);
    }
    assert.equal(node.querySelectorAll('tbody tr[data-grid-row-id]').length,0);
    assert.ok(node.querySelector('.data-grid-state'));
  }
});
