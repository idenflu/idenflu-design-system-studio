import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url:'http://localhost/', pretendToBeVisual:true });
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','Node','Event','MouseEvent','KeyboardEvent']) {
  Object.defineProperty(globalThis, name, { configurable:true, value:dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { Button, DataGrid } = await import('../dist/index.js');
const { act, createElement:h } = React;
after(() => dom.window.close());

function fixture() {
  const node = document.createElement('div');
  document.body.append(node);
  const root = createRoot(node);
  return {
    node,
    async render(element) { await act(async () => root.render(element)); },
    async dispose() { await act(async () => root.unmount()); node.remove(); },
  };
}
function button(node, name) {
  return [...node.querySelectorAll('button')].find(element => {
    if (element.hasAttribute('aria-label')) return element.getAttribute('aria-label') === name;
    const copy = element.cloneNode(true);
    copy.querySelectorAll('[aria-hidden="true"]').forEach(item => item.remove());
    return copy.textContent.trim() === name;
  });
}
function checkbox(node, name) {
  const label=[...node.querySelectorAll('label')].find(element=>element.textContent.trim() === name);
  return label?.control || label?.querySelector('input[type="checkbox"]');
}
async function click(element) {
  assert.ok(element, 'expected a clickable control');
  await act(async () => element.click());
}
const rows = [{id:'a',name:'Alpha',amount:10},{id:'b',name:'Beta',amount:20}];
const columns = [
  {id:'name',header:'이름',accessor:row => row.name},
  {id:'amount',header:'금액',accessor:row => row.amount},
];
const props = {label:'프로젝트 목록',rows,columns,getRowId:row => row.id,getRowLabel:row => row.name};

test('toolbar actions stay mounted while selection actions follow valid selected rows', async () => {
  const f=fixture();
  function SettingsAction() {
    const [opened,setOpened]=React.useState(false);
    return h(Button,{onClick:()=>setOpened(value=>!value),'aria-pressed':opened},'설정');
  }
  const base={...props,selectable:true,toolbarActions:h(React.Fragment,null,h(SettingsAction),h(Button,null,'추가')),
    selectionActions:h(Button,null,'선택 처리')};
  try {
    await f.render(h(DataGrid,base));
    const settings=button(f.node,'설정'),add=button(f.node,'추가');
    assert.ok(f.node.querySelector('.data-grid-toolbar').contains(settings));
    assert.equal(button(f.node,'선택 처리'),undefined);
    await click(settings);
    assert.equal(settings.getAttribute('aria-pressed'),'true');
    await click(checkbox(f.node,'Alpha 선택'));
    assert.ok(button(f.node,'선택 처리'));
    await click(checkbox(f.node,'Beta 선택'));
    assert.match(f.node.querySelector('.data-grid-selection-count').textContent,/2개 선택됨/);
    await click(button(f.node,'선택 해제'));
    assert.equal(button(f.node,'선택 처리'),undefined);
    assert.equal(button(f.node,'설정'),settings);
    assert.equal(button(f.node,'추가'),add);
    assert.equal(settings.getAttribute('aria-pressed'),'true','selection changes preserve custom action state');

    await f.render(h(DataGrid,{...base,selectedRowIds:['removed','b'],isRowSelectable:row=>row.id!=='b'}));
    assert.equal(button(f.node,'선택 처리'),undefined,'stale and unselectable IDs do not show selection actions');
    assert.equal(button(f.node,'설정'),settings);
    await f.render(h(DataGrid,{...base,selectable:false,selectedRowIds:['a']}));
    assert.equal(button(f.node,'선택 처리'),undefined);
    assert.equal(button(f.node,'추가'),add);
  } finally {await f.dispose();}
});

test('toolbar actions remain usable with empty data and zero search results', async () => {
  const f=fixture();let calls=0;
  const base={...props,toolbarActions:h(Button,{onClick:()=>calls++},'추가')};
  try {
    await f.render(h(DataGrid,{...base,rows:[]}));
    const add=button(f.node,'추가');
    assert.equal(add.disabled,false);
    assert.match(f.node.textContent,/등록된 데이터가 없습니다/);
    await click(add);
    await f.render(h(DataGrid,{...base,query:'일치하는 항목 없음'}));
    assert.match(f.node.textContent,/검색 결과가 없습니다/);
    assert.equal(button(f.node,'추가'),add);
    assert.equal(add.disabled,false);
    await click(add);
    assert.equal(calls,2);
  } finally {await f.dispose();}
});

test('toolbar handlers receive the original click event and can update parent-owned rows', async () => {
  const f=fixture(),events=[],bubbled=[];
  function Harness() {
    const [items,setItems]=React.useState([]);
    return h('div',{onClick:event=>bubbled.push(event.nativeEvent)},h(DataGrid,{...props,rows:items,
      toolbarActions:h(Button,{onClick:event=>{
        events.push({nativeEvent:event.nativeEvent,target:event.target,currentTarget:event.currentTarget,shiftKey:event.shiftKey});
        setItems(current=>[...current,{id:`new-${current.length}`,name:'새 프로젝트',amount:0}]);
      }},h('span',null,'추가'))}));
  }
  try {
    await f.render(h(Harness));
    const add=button(f.node,'추가'),target=add.querySelector('span');
    const event=new MouseEvent('click',{bubbles:true,cancelable:true,shiftKey:true});
    await act(async()=>target.dispatchEvent(event));
    assert.deepEqual(events,[{nativeEvent:event,target,currentTarget:add,shiftKey:true}]);
    assert.deepEqual(bubbled,[event]);
    assert.equal(f.node.querySelector('tr[data-grid-row-id="new-0"] td').textContent,'새 프로젝트');
    assert.match(f.node.querySelector('.data-grid-heading').textContent,/1개 항목/);
    assert.equal(button(f.node,'추가'),add);
  } finally {await f.dispose();}
});

test('custom toolbar actions are independent of all optional built-in tools', async () => {
  const f=fixture();
  try {
    await f.render(h(DataGrid,{...props,searchable:false,showDensityToggle:false,showColumnVisibility:false,
      showColumnFilterToggle:false,exportable:false,toolbarActions:h(React.Fragment,null,h(Button,null,'설정'),h(Button,null,'추가'))}));
    const toolbar=f.node.querySelector('.data-grid-toolbar');
    assert.deepEqual([...toolbar.querySelectorAll('button')].map(element=>element.textContent.trim()),['설정','추가']);
    assert.equal(toolbar.querySelector('input[type="search"]'),null);
    assert.equal(button(f.node,'촘촘한 행 간격'),undefined);
    assert.equal(button(f.node,'표시 열'),undefined);
    assert.equal(button(f.node,'CSV 내보내기'),undefined);
  } finally {await f.dispose();}
});

test('loading and error states preserve toolbar actions and leave disabled and busy states to the consumer', async () => {
  const f=fixture();let calls=0;
  const render=({loading=false,error,disabled=false,busy=false}={})=>f.render(h(DataGrid,{...props,loading,error,
    toolbarActions:h(Button,{disabled,'aria-busy':busy || undefined,onClick:()=>calls++},'추가')}));
  try {
    await render();
    const add=button(f.node,'추가');
    for (const state of [{loading:true},{error:'연결 실패'}]) {
      await render(state);
      assert.equal(button(f.node,'추가'),add);
      assert.equal(add.disabled,false,'grid state must not disable consumer controls');
      assert.equal(add.hasAttribute('aria-busy'),false);
      await click(add);
    }
    assert.equal(calls,2);
    await render({loading:true,disabled:true,busy:true});
    assert.equal(add.disabled,true);
    assert.equal(add.getAttribute('aria-busy'),'true');
    await click(add);
    assert.equal(calls,2);
    await render({error:'연결 실패',disabled:false,busy:false});
    assert.equal(add.disabled,false);
    assert.equal(add.hasAttribute('aria-busy'),false);
    await click(add);
    assert.equal(calls,3);
  } finally {await f.dispose();}
});

test('toolbar actions render on the server without browser globals in empty, loading and error states', () => {
  const entry=new URL('../dist/index.js',import.meta.url).href;
  const source=`import React from 'react';
import {renderToString} from 'react-dom/server';
import {Button,DataGrid} from ${JSON.stringify(entry)};
if (typeof window !== 'undefined' || typeof document !== 'undefined') throw new Error('browser globals should be absent');
const h=React.createElement;
const base={label:'서버 목록',rows:[],columns:[{id:'name',header:'이름',accessor:row=>row.name}],getRowId:row=>row.id,
  searchable:false,showDensityToggle:false,showColumnVisibility:false,selectable:true,
  toolbarActions:h(React.Fragment,null,h(Button,null,'설정'),h(Button,null,'추가')),selectionActions:h(Button,null,'선택 처리')};
console.log(JSON.stringify([{}, {loading:true}, {error:'연결 실패'}].map(state=>renderToString(h(DataGrid,{...base,...state})))));`;
  const output=execFileSync(process.execPath,['--input-type=module','-e',source],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  for (const html of JSON.parse(output)) {
    const node=document.createElement('div');
    node.innerHTML=html;
    assert.ok(node.querySelector('.data-grid-toolbar').contains(button(node,'설정')));
    assert.ok(button(node,'추가'));
    assert.equal(button(node,'선택 처리'),undefined);
    assert.ok(node.querySelector('table'));
  }
});
