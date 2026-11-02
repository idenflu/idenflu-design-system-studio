import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { renderToString } = await import('react-dom/server');
const { createDataGridCsv, downloadDataGridCsv, DataGridCellEditor } = await import('../dist/index.js');
const { act } = React;
const h = React.createElement;
const column = { header: '값', accessor: row => row };
after(() => dom.window.close());

function fixture() {
  const node = document.createElement('div'); document.body.append(node);
  const root = createRoot(node);
  return { node, render: async element => act(async () => root.render(element)), dispose: async () => { await act(async () => root.unmount()); node.remove(); } };
}
async function inputValue(input, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function key(input, value, options = {}) { await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...options }))); }
async function click(button) { assert.ok(button); await act(async () => button.click()); }

test('CSV preserves Korean, escapes delimiters and quotes, and retains null and numeric values', () => {
  const rows = [ { name:'김민수', note:'일반' }, { name:'쉼표, 포함', note:'그가 "확인"\r\n했습니다' }, { name:null, note:-3 }, { name:undefined, note:0 } ];
  const csv = createDataGridCsv({ rows, columns: [{header:'이름', accessor:row => row.name}, {header:'설명', accessor:row => row.note}] });
  assert.equal(csv, '\uFEFF이름,설명\r\n김민수,일반\r\n"쉼표, 포함","그가 ""확인""\r\n했습니다"\r\n,-3\r\n,0\r\n');
  assert.equal(createDataGridCsv({ rows:[], columns:[column] }), '\uFEFF값\r\n');
});

test('CSV neutralizes formula-like text including whitespace prefixes without changing real negative numbers', () => {
  const values = ['=SUM(A1:A2)', '+cmd', '-3', '@SUM(A1)', '\t수식', '\r시작', '  =SUM(A1)', ' \t-1', '  정상', -3, 2.5];
  const csv = createDataGridCsv({rows:values, columns:[column]});
  assert.equal(csv, '\uFEFF값\r\n\'=SUM(A1:A2)\r\n\'+cmd\r\n\'-3\r\n\'@SUM(A1)\r\n\'\t수식\r\n"\'\r시작"\r\n\'  =SUM(A1)\r\n\' \t-1\r\n  정상\r\n-3\r\n2.5\r\n');
  assert.equal(createDataGridCsv({rows:[],columns:[{header:'=위험',accessor:row=>row}]}), '\uFEFF\'=위험\r\n');
});

test('CSV download uses an encoded local Blob, the requested file name, and releases its temporary URL', async () => {
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  const originalClick = dom.window.HTMLAnchorElement.prototype.click, originalTimer = globalThis.setTimeout;
  let blob, download, href, attached, revoked;
  const timers = [];
  try {
    URL.createObjectURL = value => { blob = value; return 'blob:local-csv'; };
    URL.revokeObjectURL = value => { revoked = value; };
    globalThis.setTimeout = callback => { timers.push(callback); return 1; };
    dom.window.HTMLAnchorElement.prototype.click = function () { download=this.download; href=this.getAttribute('href'); attached=document.body.contains(this); };
    downloadDataGridCsv({rows:['한글'],columns:[column],fileName:'프로젝트 목록'});
    assert.equal(download,'프로젝트 목록.csv');
    assert.equal(href,'blob:local-csv');
    assert.equal(attached,true);
    assert.equal(blob.type,'text/csv;charset=utf-8');
    assert.equal((await blob.text()).replace(/^\uFEFF/,''),'값\r\n한글\r\n');
    assert.equal(document.querySelector('a[download]'),null);
    assert.equal(revoked,undefined);
    timers.forEach(callback => callback());
    assert.equal(revoked,'blob:local-csv');
  } finally {
    URL.createObjectURL=originalCreate; URL.revokeObjectURL=originalRevoke;
    dom.window.HTMLAnchorElement.prototype.click=originalClick; globalThis.setTimeout=originalTimer;
  }
});

test('CSV creation and editor rendering are server safe while download gives a useful server error', () => {
  const original = globalThis.document;
  try {
    delete globalThis.document;
    assert.match(createDataGridCsv({rows:['서버'],columns:[column]}),/서버/);
    assert.match(renderToString(h(DataGridCellEditor,{value:'mono',label:'프로젝트',onCommit(){},onCancel(){}})),/mono/);
    assert.throws(() => downloadDataGridCsv({rows:[],columns:[column]}),/브라우저.*createDataGridCsv/);
  } finally { Object.defineProperty(globalThis,'document',{configurable:true,value:original}); }
});

test('cell editor focuses and selects its draft, commits exact text explicitly, and does not commit on blur', async () => {
  const f=fixture(), commits=[], cancels=[];
  try {
    await f.render(h(DataGridCellEditor,{value:'디자인 시스템',label:'프로젝트 이름',onCommit:value=>commits.push(value),onCancel:()=>cancels.push(true)}));
    const input=f.node.querySelector('input');
    assert.equal(document.activeElement,input);
    assert.equal(input.selectionStart,0); assert.equal(input.selectionEnd,input.value.length);
    await inputValue(input,'  수정된 이름  ');
    await act(async()=>input.blur());
    assert.deepEqual(commits,[]); assert.deepEqual(cancels,[]);
    await key(input,'Enter');
    assert.deepEqual(commits,['  수정된 이름  ']);
    await click(f.node.querySelector('[aria-label="프로젝트 이름 저장"]'));
    assert.deepEqual(commits,['  수정된 이름  ','  수정된 이름  ']);
  } finally { await f.dispose(); }
});

test('cell editor links validation errors and recovers after editing before commit', async () => {
  const f=fixture(), commits=[];
  try {
    await f.render(h(DataGridCellEditor,{value:'',label:'이름',validate:value=>value.trim() ? undefined : '이름을 입력해주세요.',onCommit:value=>commits.push(value),onCancel(){}}));
    const input=f.node.querySelector('input');
    await key(input,'Enter');
    assert.deepEqual(commits,[]);
    assert.equal(input.getAttribute('aria-invalid'),'true');
    const error=document.getElementById(input.getAttribute('aria-describedby'));
    assert.equal(error.textContent,'이름을 입력해주세요.');
    assert.equal(error.getAttribute('role'),'alert');
    assert.equal(document.activeElement,input);
    await inputValue(input,'새 이름');
    assert.equal(input.hasAttribute('aria-invalid'),false);
    assert.equal(f.node.querySelector('[role="alert"]'),null);
    await key(input,'Enter'); assert.deepEqual(commits,['새 이름']);
  } finally { await f.dispose(); }
});

test('cell editor cancels by Escape or its button and ignores IME composition Enter', async () => {
  const f=fixture(), commits=[], cancels=[];
  try {
    await f.render(h(DataGridCellEditor,{value:'초안',label:'제목',onCommit:value=>commits.push(value),onCancel:()=>cancels.push(true)}));
    const input=f.node.querySelector('input');
    await inputValue(input,'수정 중');
    await key(input,'Enter',{isComposing:true});
    await key(input,'Enter',{keyCode:229});
    assert.deepEqual(commits,[]);
    await key(input,'Escape');
    assert.deepEqual(cancels,[true]); assert.deepEqual(commits,[]);
    await click(f.node.querySelector('[aria-label="제목 취소"]'));
    assert.deepEqual(cancels,[true,true]);
  } finally { await f.dispose(); }
});

test('number editor accepts decimal drafts and optional blanks', async () => {
  const f=fixture(), commits=[];
  try {
    await f.render(h(DataGridCellEditor,{value:'1.25',type:'number',label:'예산',onCommit:value=>commits.push(value),onCancel(){}}));
    const input=f.node.querySelector('input');
    assert.equal(input.step,'any');
    await key(input,'Enter'); assert.deepEqual(commits,['1.25']);
    await inputValue(input,''); await key(input,'Enter'); assert.deepEqual(commits,['1.25','']);
  } finally { await f.dispose(); }
});

test('number editor rejects nonfinite initial values without publishing a draft', async () => {
  const f=fixture(), commits=[];
  try {
    await f.render(h(DataGridCellEditor,{value:'Infinity',type:'number',label:'금액',onCommit:value=>commits.push(value),onCancel(){}}));
    await key(f.node.querySelector('input'),'Enter');
    assert.equal(f.node.querySelector('[role="alert"]').textContent,'올바른 숫자를 입력해주세요.');
    assert.deepEqual(commits,[]);
  } finally { await f.dispose(); }
});
