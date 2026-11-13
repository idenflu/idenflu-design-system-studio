import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import ts from 'typescript';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual:true });
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','Node','Event','MouseEvent','KeyboardEvent']) {
  Object.defineProperty(globalThis, name, { configurable:true, value:dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { Select, SearchSelect, MultiSelect } = await import('../dist/index.js');
const { createElement:h, act } = React;
const options = [{value:'design',label:'디자인'},{value:'development',label:'개발'}];
const variants = [
  {name:'Select', Component:Select, props:{}, tag:'BUTTON', empty:''},
  {name:'SearchSelect', Component:SearchSelect, props:{}, tag:'INPUT', empty:''},
  {name:'MultiSelect', Component:MultiSelect, props:{searchable:true}, tag:'BUTTON', empty:[]},
  {name:'inline MultiSelect', Component:MultiSelect, props:{searchable:true,presentation:'inline'}, tag:'BUTTON', empty:[]},
];
function fixture() {
  const node=document.createElement('div'); document.body.append(node);
  const root=createRoot(node);
  return {node,render:element=>act(async()=>root.render(element)),dispose:async()=>{await act(async()=>root.unmount());node.remove();}};
}
async function click(node) { assert.ok(node); await act(async()=>node.click()); }
after(()=>dom.window.close());

for (const {name,Component,props,tag,empty} of variants) {
  test(`${name} exposes its real control and merges helper, external description and error`, async()=>{
    const f=fixture(), ref=React.createRef();
    const render=(extra={})=>f.render(h('form',null,
      h('p',{id:'external-description'},'조직에서 사용할 팀입니다.'),
      h(Component,{label:'담당 팀',name:'team',options,...props,ref,helperText:'팀을 선택하세요.','aria-describedby':'external-description','aria-invalid':false,error:h('span',null,'선택한 팀에 접근할 수 없습니다.'),...extra})));
    try {
      await render();
      const control=ref.current, native=f.node.querySelector('select');
      assert.equal(control.tagName,tag);
      assert.equal(control,f.node.querySelector('[id$="-trigger"]'));
      assert.notEqual(control,native);
      assert.equal(control.getAttribute('aria-invalid'),'true','external errors override aria-invalid=false');
      assert.ok(control.closest('.custom-select').classList.contains('is-invalid'));
      const ids=control.getAttribute('aria-describedby').split(' ');
      assert.equal(new Set(ids).size,3);
      assert.deepEqual(ids.map(id=>document.getElementById(id).textContent),[
        '조직에서 사용할 팀입니다.','팀을 선택하세요.','선택한 팀에 접근할 수 없습니다.',
      ]);
      assert.equal(f.node.querySelectorAll('.field-error').length,1);
      await act(async()=>control.focus());
      assert.equal(document.activeElement,control);
      await render({error:undefined,helperText:undefined});
      assert.equal(ref.current,control,'a normal update keeps the public DOM ref stable');
      assert.equal(control.getAttribute('aria-invalid'),'false');
      assert.equal(control.getAttribute('aria-describedby'),'external-description');
      assert.equal(f.node.querySelector('.field-error'),null);
      assert.equal(f.node.querySelector('[helpertext],[error],[buttonref],[inputref]'),null);
    } finally { await f.dispose(); }
    assert.equal(ref.current,null,'unmount clears the ref');
  });

  test(`${name} keeps server errors app-owned through native validation, selection and reset`, async()=>{
    const f=fixture(), ref=React.createRef(), changes=[];
    const render=(error='서버에서 사용할 수 없는 팀입니다.')=>f.render(h('form',null,
      h(Component,{label:'담당 팀',name:'team',required:true,options,...props,ref,error,onValueChange:value=>changes.push(value)})));
    try {
      await render();
      const form=f.node.querySelector('form');
      let valid;
      await act(async()=>{valid=form.checkValidity();});
      assert.equal(valid,false);
      assert.equal(document.activeElement,ref.current,'native required failure focuses the public control');
      assert.equal(f.node.querySelectorAll('.field-error').length,1);
      assert.equal(f.node.querySelector('.field-error').textContent,'서버에서 사용할 수 없는 팀입니다.');
      assert.equal(f.node.textContent.includes('항목을 선택해주세요.'),false,'server error wins over native fallback');
      if(ref.current.getAttribute('aria-expanded')!=='true') await click(ref.current);
      await click(f.node.querySelector('[role="option"]'));
      assert.equal(new dom.window.FormData(form).get('team'),'design');
      assert.equal(form.checkValidity(),true,'external error does not replace native validity');
      assert.equal(ref.current.getAttribute('aria-invalid'),'true','selection does not clear app-owned errors');
      await act(async()=>form.reset());
      assert.equal(new dom.window.FormData(form).get('team'),tag==='INPUT'||Component===Select?'':null);
      assert.equal(f.node.querySelector('.field-error').textContent,'서버에서 사용할 수 없는 팀입니다.');
      // Passing no external error after a reset also clears the attempted native error.
      await f.render(h('form',null,h(Component,{label:'담당 팀',name:'team',required:true,options,...props,ref})));
      assert.equal(f.node.querySelector('.field-error'),null);
      assert.notEqual(ref.current.getAttribute('aria-invalid'),'true');
      assert.deepEqual(changes,[Array.isArray(empty)?['design']:'design'],'reset does not emit a user change');
      await act(async()=>{valid=form.checkValidity();});
      assert.equal(valid,false);
      assert.match(f.node.querySelector('[role="alert"]').textContent,/선택/);
    } finally { await f.dispose(); }
  });
}

test('Select accepts an empty explicit error and preserves external invalid state without an error message', async()=>{
  const f=fixture();
  try {
    await f.render(h(Select,{label:'팀',options,error:''}));
    let control=f.node.querySelector('[role="combobox"]');
    assert.equal(control.getAttribute('aria-invalid'),'true');
    assert.ok(document.getElementById(control.getAttribute('aria-describedby')));
    await f.render(h(Select,{label:'팀',options,'aria-invalid':'true'}));
    control=f.node.querySelector('[role="combobox"]');
    assert.equal(control.getAttribute('aria-invalid'),'true');
    assert.equal(control.getAttribute('aria-describedby'),null);
    assert.ok(control.closest('.custom-select').classList.contains('is-invalid'));
    assert.equal(f.node.querySelector('.field-error'),null);
  } finally { await f.dispose(); }
});

test('controlled selections stay authoritative when the parent keeps its value on reset', async()=>{
  const f=fixture();
  try {
    for (const {Component,props,empty} of variants) {
      const value=Array.isArray(empty)?['development']:'development';
      await f.render(h('form',null,h(Component,{label:'유지할 팀',name:'team',required:true,options,...props,value})));
      const form=f.node.querySelector('form');
      await act(async()=>form.reset());
      assert.deepEqual(new dom.window.FormData(form).getAll('team'),['development']);
      assert.equal(form.checkValidity(),true);
      assert.match(f.node.querySelector('[id$="-trigger"]').getAttribute('aria-label'),/유지할 팀/);
    }
  } finally { await f.dispose(); }
});

test('MultiSelect ref follows presentation changes and callback ref replacement', async()=>{
  const f=fixture(), assigned=[], replacement=[];
  const first=node=>assigned.push(node), second=node=>replacement.push(node);
  try {
    await f.render(h(MultiSelect,{label:'팀',options,ref:first}));
    const initial=assigned.at(-1);
    await f.render(h(MultiSelect,{label:'팀',options,ref:first,presentation:'inline'}));
    const inline=assigned.at(-1);
    assert.notEqual(inline,initial);
    assert.ok(inline.classList.contains('multi-inline-trigger'));
    assert.ok(assigned.includes(null));
    await f.render(h(MultiSelect,{label:'팀',options,ref:second,presentation:'inline'}));
    assert.equal(assigned.at(-1),null);
    assert.equal(replacement.at(-1),inline);
  } finally { await f.dispose(); }
  assert.equal(replacement.at(-1),null);
});

test('Select public ref types match their interactive DOM controls',()=>{
  const program=ts.createProgram([fileURLToPath(new URL('./select-field-api.types.tsx',import.meta.url))],{
    target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,
    jsx:ts.JsxEmit.ReactJSX,lib:['lib.es2020.d.ts','lib.dom.d.ts'],strict:true,skipLibCheck:true,noEmit:true,
  });
  const diagnostics=ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{
    getCanonicalFileName:file=>file,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n',
  }));
});

for (const {name,Component,props,empty} of variants) {
  test(`${name} readOnly preserves focus and submission while preventing changes`, async()=>{
    const f=fixture(), ref=React.createRef(), changes=[];
    const initial=Array.isArray(empty) ? ['design','development'] : 'design';
    const render=readOnly=>f.render(h('form',null,h(Component,{label:'담당 팀',name:'team',options,...props,ref,defaultValue:initial,clearable:true,readOnly,onValueChange:value=>changes.push(value)})));
    try {
      await render(false);
      await click(ref.current);
      assert.equal(ref.current.getAttribute('aria-expanded'),'true');
      await render(true);
      const control=ref.current, form=f.node.querySelector('form');
      assert.equal(control.getAttribute('aria-readonly'),'true');
      assert.equal(control.getAttribute('aria-expanded'),'false');
      await act(async()=>control.focus());
      assert.equal(document.activeElement,control);
      await click(control);
      await act(async()=>control.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})));
      assert.equal(control.getAttribute('aria-expanded'),'false');
      if (control.tagName==='INPUT') assert.equal(control.readOnly,true);
      assert.equal(f.node.querySelectorAll('.multi-inline-chip button, button.multi-inline-chip').length,0);
      for (const button of f.node.querySelectorAll('.multi-clear,.multi-inline-clear')) assert.equal(button.disabled,true);
      assert.deepEqual(new dom.window.FormData(form).getAll('team'),Array.isArray(initial)?initial:[initial]);
      assert.deepEqual(changes,[]);
      await render(false);
      await click(control);
      assert.equal(control.getAttribute('aria-expanded'),'true');
    } finally { await f.dispose(); }
  });
}

for (const {name,Component,props,empty} of variants) {
  test(`${name} skips required validation only while readOnly`, async()=>{
    const f=fixture();
    const render=readOnly=>f.render(h('form',null,h(Component,{label:'팀',name:'team',options,...props,required:true,readOnly})));
    try {
      await render(true);
      const form=f.node.querySelector('form');
      assert.equal(form.checkValidity(),true);
      await render(false);
      let valid;
      await act(async()=>{valid=form.checkValidity();});
      assert.equal(valid,false);
    } finally { await f.dispose(); }
  });
}
