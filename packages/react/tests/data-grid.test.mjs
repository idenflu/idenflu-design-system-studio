import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url:'http://localhost/', pretendToBeVisual:true });
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLSelectElement','Node','Event','MouseEvent','KeyboardEvent']) {
  Object.defineProperty(globalThis, name, { configurable:true, value:dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { DataGrid } = await import('../dist/index.js');
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
const click = async element => { assert.ok(element, 'expected a clickable control'); await act(async () => element.click()); };
function button(node, name) {
  return [...node.querySelectorAll('button')].find(element => {
    if (element.hasAttribute('aria-label')) return element.getAttribute('aria-label') === name;
    const copy = element.cloneNode(true);
    copy.querySelectorAll('[aria-hidden="true"]').forEach(item => item.remove());
    return copy.textContent.trim() === name;
  });
}
function control(node, name) {
  const direct = [...node.querySelectorAll('input,select')].find(element => element.getAttribute('aria-label') === name);
  if (direct) return direct;
  const label = [...node.querySelectorAll('label')].find(element => element.textContent.trim() === name);
  return label?.control || label?.querySelector('input,select') || null;
}
async function input(element, value) {
  assert.ok(element, 'expected an editable control');
  await act(async () => {
    const prototype = element.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : dom.window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles:true }));
  });
}
async function key(element, value, extras = {}) {
  assert.ok(element, 'expected a keyboard target');
  const event = new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true,...extras});
  await act(async () => element.dispatchEvent(event));
  return event;
}
async function choose(node, label, optionLabel) {
  const trigger=[...node.querySelectorAll('[role="combobox"]')].find(element => element.getAttribute('aria-label')?.startsWith(`${label}:`));
  await click(trigger);
  const list=document.getElementById(trigger.getAttribute('aria-controls'));
  await click([...list.querySelectorAll('[role="option"]')].find(element => element.textContent.trim() === optionLabel));
}
function names(node, selectable = false) {
  return [...node.querySelectorAll('tbody tr')]
    .filter(row => row.querySelectorAll('td').length > 1)
    .map(row => row.querySelectorAll('td')[selectable ? 1 : 0].textContent.trim());
}
const columns = [
  { id:'name', header:'이름', accessor:row => row.name },
  { id:'amount', header:'금액', accessor:row => row.amount, align:'end' },
  { id:'team', header:'팀', accessor:row => row.team },
];
const rows = [
  { id:'a', name:'Alpha', amount:10, team:'디자인' },
  { id:'b', name:'Beta', amount:2, team:'개발' },
  { id:'c', name:'Gamma', amount:null, team:'디자인' },
  { id:'d', name:'Delta', amount:2, team:'개발' },
];
const props = {label:'프로젝트 목록', rows, columns, getRowId:row => row.id, getRowLabel:row => row.name};

test('DataGrid sorts numbers stably, keeps missing values last and restores source order', async () => {
  const f = fixture();
  try {
    await f.render(h(DataGrid, props));
    const header = [...f.node.querySelectorAll('th')].find(element => element.textContent.includes('금액'));
    assert.equal(f.node.querySelector('table').getAttribute('role'), null);
    assert.equal(f.node.querySelector('caption').textContent, '프로젝트 목록');
    await click(button(f.node,'금액'));
    assert.equal(header.getAttribute('aria-sort'),'ascending');
    assert.deepEqual(names(f.node),['Beta','Delta','Alpha','Gamma']);
    await click(button(f.node,'금액'));
    assert.equal(header.getAttribute('aria-sort'),'descending');
    assert.deepEqual(names(f.node),['Alpha','Beta','Delta','Gamma']);
    await click(button(f.node,'금액'));
    assert.equal(header.getAttribute('aria-sort'),'none');
    assert.deepEqual(names(f.node),rows.map(row => row.name));
  } finally { await f.dispose(); }
});

test('DataGrid searches underlying values, resets pagination and recovers from no results', async () => {
  const f = fixture(); const pages=[];
  try {
    const decorated = columns.map(column => column.id === 'team' ? {...column,cell:() => h('span',null,'표시 전용')} : column);
    await f.render(h(DataGrid,{...props,columns:decorated,defaultPageSize:2,pageSizeOptions:[2,4],onPageChange:page => pages.push(page)}));
    await click(button(f.node,'다음'));
    assert.deepEqual(names(f.node),['Gamma','Delta']);
    await input(control(f.node,'검색'),'디자인');
    assert.deepEqual(names(f.node),['Alpha','Gamma']);
    assert.equal(pages.at(-1),1);
    await input(control(f.node,'검색'),'ALPHA');
    assert.deepEqual(names(f.node),['Alpha']);
    await input(control(f.node,'검색'),'없는 프로젝트');
    assert.deepEqual(names(f.node),[]);
    assert.match(f.node.textContent,/검색 결과/);
    await click(button(f.node,'검색 초기화'));
    assert.equal(control(f.node,'검색').value,'');
    assert.deepEqual(names(f.node),['Alpha','Beta']);
  } finally { await f.dispose(); }
});

test('DataGrid clamps its page when rows shrink and resets on sort and page size changes', async () => {
  const f = fixture();
  try {
    const base = {...props,defaultPageSize:2,pageSizeOptions:[2,4]};
    await f.render(h(DataGrid,base));
    await click(button(f.node,'다음'));
    assert.deepEqual(names(f.node),['Gamma','Delta']);
    await f.render(h(DataGrid,{...base,rows:rows.slice(0,1)}));
    assert.deepEqual(names(f.node),['Alpha']);
    await f.render(h(DataGrid,base));
    await click(button(f.node,'다음'));
    await click(button(f.node,'이름'));
    assert.deepEqual(names(f.node),['Alpha','Beta']);
    await click(button(f.node,'다음'));
    await choose(f.node,'페이지당 행 수','4개');
    assert.deepEqual(names(f.node),['Alpha','Beta','Delta','Gamma']);
    assert.equal(button(f.node,'다음').disabled,true);
  } finally { await f.dispose(); }
});

test('DataGrid selects only selectable rows on the current page and keeps selection across pages and search', async () => {
  const f = fixture(), changes=[];
  try {
    await f.render(h(DataGrid,{...props,selectable:true,isRowSelectable:row => row.id !== 'b',defaultPageSize:2,pageSizeOptions:[2,4],onSelectedRowIdsChange:ids => changes.push(ids)}));
    await click(control(f.node,'현재 페이지 전체 선택'));
    assert.deepEqual(changes.at(-1),['a']);
    assert.equal(control(f.node,'Beta 선택').disabled,true);
    await click(button(f.node,'다음'));
    await click(control(f.node,'Gamma 선택'));
    assert.equal(control(f.node,'현재 페이지 전체 선택').indeterminate,true);
    await click(control(f.node,'현재 페이지 전체 선택'));
    assert.deepEqual([...changes.at(-1)].sort(),['a','c','d']);
    await click(button(f.node,'이전'));
    assert.equal(control(f.node,'Alpha 선택').checked,true);
    assert.equal(control(f.node,'현재 페이지 전체 선택').checked,true);
    await click(control(f.node,'현재 페이지 전체 선택'));
    assert.deepEqual([...changes.at(-1)].sort(),['c','d']);
    await input(control(f.node,'검색'),'Delta');
    assert.equal(control(f.node,'Delta 선택').checked,true);
    await click(button(f.node,'선택 해제'));
    assert.deepEqual(changes.at(-1),[]);
    assert.equal(control(f.node,'Delta 선택').checked,false);
  } finally { await f.dispose(); }
});

test('DataGrid controlled state follows parent updates for search, sorting, pagination and selection', async () => {
  const f = fixture(), changes={query:[],sort:[],page:[],pageSize:[],selected:[]};
  function Harness() {
    const [query,setQuery]=React.useState('');
    const [sort,setSort]=React.useState(null);
    const [page,setPage]=React.useState(1);
    const [pageSize,setPageSize]=React.useState(2);
    const [selected,setSelected]=React.useState([]);
    return h(DataGrid,{...props,selectable:true,query,sort,page,pageSize,selectedRowIds:selected,pageSizeOptions:[2,4],
      onQueryChange:value => {changes.query.push(value);setQuery(value);},
      onSortChange:value => {changes.sort.push(value);setSort(value);},
      onPageChange:value => {changes.page.push(value);setPage(value);},
      onPageSizeChange:value => {changes.pageSize.push(value);setPageSize(value);},
      onSelectedRowIdsChange:value => {changes.selected.push(value);setSelected(value);},
    });
  }
  try {
    await f.render(h(Harness));
    await click(button(f.node,'다음'));
    assert.equal(changes.page.at(-1),2);
    assert.deepEqual(names(f.node,true),['Gamma','Delta']);
    await click(button(f.node,'금액'));
    assert.deepEqual(changes.sort.at(-1),{columnId:'amount',direction:'asc'});
    assert.deepEqual(names(f.node,true),['Beta','Delta']);
    assert.equal(changes.page.at(-1),1);
    await click(control(f.node,'Beta 선택'));
    assert.deepEqual(changes.selected.at(-1),['b']);
    await choose(f.node,'페이지당 행 수','4개');
    assert.equal(changes.pageSize.at(-1),4);
    assert.equal(names(f.node,true).length,4);
    await input(control(f.node,'검색'),'개발');
    assert.equal(changes.query.at(-1),'개발');
    assert.deepEqual(names(f.node,true),['Beta','Delta']);
    assert.equal(control(f.node,'Beta 선택').checked,true);
  } finally { await f.dispose(); }
});

test('DataGrid keeps a visible column and applies initial hidden columns to headers and cells', async () => {
  const f = fixture();
  try {
    await f.render(h(DataGrid,{...props,defaultHiddenColumnIds:['team']}));
    assert.equal([...f.node.querySelectorAll('th')].some(element => element.textContent.includes('팀')),false);
    assert.equal(f.node.querySelector('tbody tr').querySelectorAll('td').length,2);
    await click(button(f.node,'표시 열'));
    await click(control(f.node,'금액'));
    assert.equal(f.node.querySelector('tbody tr').querySelectorAll('td').length,1);
    assert.equal(control(f.node,'이름').disabled,true);
    await click(control(f.node,'팀'));
    assert.equal(control(f.node,'이름').disabled,false);
    assert.equal(f.node.querySelector('tbody tr').querySelectorAll('td').length,2);
  } finally { await f.dispose(); }
});

test('DataGrid hides stale rows while loading or errored and exposes retry and empty states', async () => {
  const f = fixture(); let retries=0;
  try {
    await f.render(h(DataGrid,{...props,loading:true}));
    assert.deepEqual(names(f.node),[]);
    assert.ok(f.node.querySelector('[aria-busy="true"]'));
    assert.match(f.node.textContent,/불러오는|로딩/);
    await f.render(h(DataGrid,{...props,error:'서버 연결 실패',onRetry:() => retries++}));
    assert.deepEqual(names(f.node),[]);
    assert.match(f.node.textContent,/서버 연결 실패/);
    await click(button(f.node,'다시 시도'));
    assert.equal(retries,1);
    await f.render(h(DataGrid,{...props,rows:[],emptyMessage:'새 프로젝트를 등록하세요.'}));
    assert.deepEqual(names(f.node),[]);
    assert.match(f.node.textContent,/새 프로젝트를 등록하세요/);
    await f.render(h(DataGrid,props));
    assert.deepEqual(names(f.node),rows.map(row => row.name));
  } finally { await f.dispose(); }
});

test('DataGrid ignores removed or unselectable IDs when selection changes', async () => {
  const f = fixture(), changes=[];
  try {
    await f.render(h(DataGrid,{...props,selectable:true,defaultSelectedRowIds:['removed','b'],isRowSelectable:row => row.id !== 'b',onSelectedRowIdsChange:ids => changes.push(ids)}));
    assert.equal(control(f.node,'Beta 선택').checked,false);
    await click(control(f.node,'Alpha 선택'));
    assert.deepEqual(changes.at(-1),['a']);
  } finally { await f.dispose(); }
});

test('DataGrid combines global, text, select and numeric column filters with AND semantics', async () => {
  const f = fixture(), filterChanges=[];
  const filterColumns = [
    {...columns[0],filter:'text'},
    {...columns[1],filter:'number'},
    {...columns[2],filter:'select',filterOptions:[{value:'디자인',label:'디자인'},{value:'개발',label:'개발'}]},
  ];
  try {
    await f.render(h(DataGrid,{...props,columns:filterColumns,defaultPageSize:2,pageSizeOptions:[2,4],onFiltersChange:value => filterChanges.push(value)}));
    await click(button(f.node,'다음'));
    await input(control(f.node,'이름 필터'),'a');
    await choose(f.node,'팀 필터','디자인');
    assert.deepEqual(names(f.node),['Alpha','Gamma']);
    await input(control(f.node,'금액 최솟값'),'5');
    await input(control(f.node,'금액 최댓값'),'15');
    assert.deepEqual(names(f.node),['Alpha']);
    assert.deepEqual(filterChanges.at(-1).amount,{min:'5',max:'15'});
    await input(control(f.node,'검색'),'개발');
    assert.deepEqual(names(f.node),[]);
    await input(control(f.node,'검색'),'Alpha');
    assert.deepEqual(names(f.node),['Alpha']);
    await input(control(f.node,'금액 최솟값'),'11');
    assert.deepEqual(names(f.node),[]);
    assert.match(f.node.textContent,/검색 결과/);
    await click(button(f.node,'조건 초기화'));
    assert.deepEqual(names(f.node),['Alpha','Beta']);
    assert.equal(control(f.node,'검색').value,'');
    assert.equal(control(f.node,'이름 필터').value,'');
    assert.equal(control(f.node,'금액 최솟값').value,'');
    assert.deepEqual(filterChanges.at(-1),{});
  } finally { await f.dispose(); }
});

test('DataGrid numeric bounds include zero and exclude missing numeric values', async () => {
  const f = fixture();
  try {
    await f.render(h(DataGrid,{...props,
      rows:[...rows,{id:'zero',name:'Zero',amount:0,team:'디자인'},{id:'negative',name:'Negative',amount:-5,team:'디자인'}],
      columns:columns.map(column => column.id === 'amount' ? {...column,filter:'number'} : column),
      defaultFilters:{amount:{min:'0',max:'0'}},
    }));
    assert.deepEqual(names(f.node),['Zero']);
    await input(control(f.node,'금액 최솟값'),'-5');
    assert.deepEqual(names(f.node),['Zero','Negative']);
  } finally { await f.dispose(); }
});

test('DataGrid controlled column filters publish changes and follow external replacements', async () => {
  const f = fixture(), changes=[];
  const base={...props,columns:columns.map(column => column.id === 'name' ? {...column,filter:'text'} : column),filters:{},onFiltersChange:value => changes.push(value)};
  try {
    await f.render(h(DataGrid,base));
    await input(control(f.node,'이름 필터'),'Alpha');
    assert.deepEqual(changes.at(-1),{name:'Alpha'});
    assert.deepEqual(names(f.node),rows.map(row => row.name));
    await f.render(h(DataGrid,{...base,filters:changes.at(-1)}));
    assert.deepEqual(names(f.node),['Alpha']);
    assert.equal(control(f.node,'이름 필터').value,'Alpha');
    await f.render(h(DataGrid,base));
    assert.deepEqual(names(f.node),rows.map(row => row.name));
    assert.equal(control(f.node,'이름 필터').value,'');
  } finally { await f.dispose(); }
});

test('DataGrid criteria resets respect controlled page ownership and notify once', async () => {
  const criteriaCases=[
    {name:'query',next:{query:'a'},expected:['Alpha'],controlledExpected:['Beta']},
    {name:'filters',next:{filters:{team:'디자인'}},expected:['Alpha'],controlledExpected:['Gamma']},
    {name:'sort',next:{sort:{columnId:'amount',direction:'desc'}},expected:['Alpha'],controlledExpected:['Beta']},
    {name:'pageSize',next:{pageSize:2},expected:['Alpha','Beta'],controlledExpected:['Gamma','Delta']},
  ];
  for (const controlledPage of [false,true]) for (const scenario of criteriaCases) {
    const f=fixture(), pages=[];
    const base={...props,query:'',filters:{},sort:null,pageSize:1,pageSizeOptions:[1,2],defaultPage:2,
      ...(controlledPage ? {page:2} : {}),
      columns:columns.map(column => column.id === 'team' ? {...column,filter:'select',filterOptions:[{value:'디자인',label:'디자인'},{value:'개발',label:'개발'}]} : column),
      onPageChange:page => pages.push(page),
    };
    const description=`${scenario.name}, ${controlledPage ? 'controlled page ignored by owner' : 'defaultPage=2'}`;
    try {
      await f.render(h(DataGrid,base));
      assert.deepEqual(names(f.node),['Beta'],description);
      const next={...base,...scenario.next};
      await f.render(h(DataGrid,next));
      const expected=controlledPage ? scenario.controlledExpected : scenario.expected;
      assert.deepEqual(names(f.node),expected,description);
      assert.deepEqual(pages,[1],description);
      // The controlled page remains the source of truth until its owner updates it.
      // An unrelated render must not repeat the reset callback or change that page.
      await f.render(h(DataGrid,{...next,className:'unrelated-parent-render'}));
      assert.deepEqual(names(f.node),expected,description);
      assert.deepEqual(pages,[1],description);
      if (controlledPage) {
        await f.render(h(DataGrid,{...next,page:1}));
        assert.deepEqual(names(f.node),scenario.expected,description);
        assert.deepEqual(pages,[1],description);
      }
    } finally { await f.dispose(); }
  }
  const f=fixture(), pages=[];
  function IgnoringPageOwner() {
    const [query,setQuery]=React.useState('');
    return h(DataGrid,{...props,query,onQueryChange:setQuery,page:2,pageSize:1,pageSizeOptions:[1,2],onPageChange:page => pages.push(page)});
  }
  try {
    await f.render(h(IgnoringPageOwner));
    await input(control(f.node,'검색'),'a');
    assert.deepEqual(names(f.node),['Beta']);
    assert.deepEqual(pages,[1], 'UI handler and criteria effect must not request the same reset twice');
  } finally { await f.dispose(); }
});

test('DataGrid column separators resize by keyboard and respect configured bounds', async () => {
  const f = fixture();
  try {
    await f.render(h(DataGrid,{...props,columns:[{...columns[0],resizable:true,width:140,minWidth:100,maxWidth:180},columns[1]]}));
    const separator=f.node.querySelector('[role="separator"][aria-label="이름 열 너비"]');
    assert.ok(separator);
    assert.equal(separator.getAttribute('aria-orientation'),'vertical');
    assert.equal(separator.getAttribute('aria-valuenow'),'140');
    assert.equal((await key(separator,'ArrowRight')).defaultPrevented,true);
    assert.equal(separator.getAttribute('aria-valuenow'),'150');
    await key(separator,'ArrowRight',{shiftKey:true});
    assert.equal(separator.getAttribute('aria-valuenow'),'151');
    await key(separator,'Home');
    assert.equal(separator.getAttribute('aria-valuenow'),'100');
    await key(separator,'ArrowLeft');
    assert.equal(separator.getAttribute('aria-valuenow'),'100');
    await key(separator,'End');
    assert.equal(separator.getAttribute('aria-valuenow'),'180');
    await key(separator,'ArrowRight');
    assert.equal(separator.getAttribute('aria-valuenow'),'180');
  } finally { await f.dispose(); }
});

test('DataGrid validates editable cells, commits through the parent and cancels without changing rows', async () => {
  const f = fixture(), edits=[];
  function Harness() {
    const [items,setItems]=React.useState(rows);
    return h(DataGrid,{...props,rows:items,columns:[
      {...columns[0],editable:row => row.id !== 'b',validate:value => value.trim() ? undefined : '이름을 입력해주세요.'},
      columns[1],
    ],onCellEdit:edit => {
      edits.push(edit);
      setItems(current => current.map(row => row.id === edit.rowId ? {...row,name:edit.value} : row));
    }});
  }
  try {
    await f.render(h(Harness));
    assert.equal(button(f.node,'Beta 이름 편집'),undefined);
    await click(button(f.node,'Alpha 이름 편집'));
    await input(control(f.node,'이름'),'   ');
    await key(control(f.node,'이름'),'Enter');
    assert.equal(edits.length,0);
    assert.match(f.node.textContent,/이름을 입력해주세요/);
    await input(control(f.node,'이름'),'Renamed');
    await key(control(f.node,'이름'),'Enter');
    assert.equal(edits.length,1);
    assert.equal(edits[0].rowId,'a');
    assert.equal(edits[0].columnId,'name');
    assert.equal(edits[0].value,'Renamed');
    assert.equal(names(f.node)[0],'Renamed');
    assert.equal(document.activeElement.getAttribute('aria-label'),'Renamed 이름 편집');
    await click(button(f.node,'Renamed 이름 편집'));
    await input(control(f.node,'이름'),'Discarded');
    await key(control(f.node,'이름'),'Escape');
    assert.equal(edits.length,1);
    assert.equal(names(f.node)[0],'Renamed');
    assert.equal(document.activeElement.getAttribute('aria-label'),'Renamed 이름 편집');
  } finally { await f.dispose(); }
});

test('DataGrid restores table focus after an active editor disappears without stealing focus from other controls', async () => {
  for (const transition of ['remove-row','loading']) for (const focusTarget of ['editor','search','outside']) {
    const f=fixture(), edits=[];
    const base={...props,columns:[{...columns[0],editable:true},columns[1]],onCellEdit:edit => edits.push(edit)};
    const render=values => f.render(h('div',null,h(DataGrid,values),h('button',{type:'button',id:'outside-control'},'다른 작업')));
    const description=`${transition}, focus on ${focusTarget}`;
    try {
      await render(base);
      await click(button(f.node,'Alpha 이름 편집'));
      assert.equal(document.activeElement,control(f.node,'이름'),description);
      const destination=focusTarget === 'search' ? control(f.node,'검색') : focusTarget === 'outside' ? f.node.querySelector('#outside-control') : null;
      if (destination) await act(async () => destination.focus());
      await render({...base,...(transition === 'remove-row' ? {rows:rows.filter(row => row.id !== 'a')} : {loading:true})});
      assert.equal(f.node.querySelector('[role="group"][aria-label="이름 편집"]'),null,description);
      assert.equal(edits.length,0,description);
      assert.equal(document.activeElement,destination || f.node.querySelector('[role="region"][aria-label="프로젝트 목록 표"]'),description);
    } finally { await f.dispose(); }
  }
});

test('DataGrid renders on the server without browser globals', () => {
  const entry = new URL('../dist/index.js',import.meta.url).href;
  const source = `import React from 'react';
import { renderToString } from 'react-dom/server';
import { DataGrid } from ${JSON.stringify(entry)};
if (typeof window !== 'undefined' || typeof document !== 'undefined') throw new Error('browser globals should be absent');
console.log(renderToString(React.createElement(DataGrid, {label:'서버 목록',rows:[{id:'one',name:'Alpha'}],columns:[{id:'name',header:'이름',accessor:row => row.name}],getRowId:row => row.id})));`;
  const output = execFileSync(process.execPath,['--input-type=module','-e',source],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  assert.match(output,/서버 목록/);
  assert.match(output,/Alpha/);
  assert.match(output,/<table/);
});
