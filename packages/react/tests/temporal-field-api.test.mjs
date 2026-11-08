import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import ts from 'typescript';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual:true });
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','Node','Event','MouseEvent','KeyboardEvent']) {
  Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { NumberField, DatePicker, DateRangePicker, TimePicker, DateTimePicker, DateTimeRangePicker } = await import('../dist/index.js');
const { createElement:h, act } = React;
const variants = [
  {name:'NumberField',Component:NumberField,initial:'8',edited:['12'],props:{unit:'명'}},
  {name:'DatePicker',Component:DatePicker,initial:'2026-11-02',edited:['2026-11-03']},
  {name:'DateRangePicker',Component:DateRangePicker,initial:['2026-11-02','2026-11-04'],edited:['2026-11-03','2026-11-05'],range:true},
  {name:'TimePicker',Component:TimePicker,initial:'08:30',edited:['09:45']},
  {name:'DateTimePicker',Component:DateTimePicker,initial:'2026-11-02T08:30',edited:['2026-11-03 09:45']},
  {name:'DateTimeRangePicker',Component:DateTimeRangePicker,initial:['2026-11-02T08:30','2026-11-04T08:30'],edited:['2026-11-03 09:45','2026-11-05 09:45'],range:true},
];
function fixture() {
  const node=document.createElement('div'); document.body.append(node);
  const root=createRoot(node);
  return {node,render:element=>act(async()=>root.render(element)),dispose:async()=>{await act(async()=>root.unmount());node.remove();}};
}
async function edit(input,value) {
  await act(async()=>{
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
}
async function commit(input) { await act(async()=>input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))); }
after(()=>dom.window.close());

for (const {name,Component,initial,edited,props={},range=false} of variants) {
  test(`${name} exposes visible input refs and merges external, helper and error descriptions`,async()=>{
    const f=fixture(), ref=React.createRef(), end=React.createRef();
    const render=(extra={})=>f.render(h('form',null,
      h('p',{id:'external-help'},'조직 공통 안내'),
      h(Component,{label:'입력',name:'field',defaultValue:initial,...props,ref,...range&&{endInputRef:end},helperText:'필드 안내',error:'서버 오류','aria-describedby':'external-help','aria-invalid':false,...extra})));
    try {
      await render();
      const controls=range?[ref.current,end.current]:[ref.current];
      assert.deepEqual(controls,Array.from(f.node.querySelectorAll('input[type="text"]')));
      assert.equal(new Set(controls).size,range?2:1);
      for (const control of controls) {
        assert.ok(control instanceof HTMLInputElement);
        assert.equal(control.getAttribute('aria-invalid'),'true','field errors override external false');
        assert.equal(control.validationMessage,'서버 오류','the ref reaches native custom validity');
        assert.equal(control.validity.valid,false);
        const ids=control.getAttribute('aria-describedby').split(' ');
        assert.deepEqual(ids.map(id=>document.getElementById(id)?.textContent),['조직 공통 안내','필드 안내',...props.unit?[props.unit]:[],'서버 오류']);
        await act(async()=>control.focus());
        assert.equal(document.activeElement,control);
      }
      assert.equal(f.node.querySelector('[endinputref],[inputref],[helpertext]'),null);
      await render({error:undefined,helperText:undefined});
      assert.equal(ref.current,controls[0]);
      if(range) assert.equal(end.current,controls[1]);
      for (const control of controls) {
        assert.equal(control.getAttribute('aria-invalid'),'false');
        assert.equal(control.validationMessage,'');
        assert.equal(control.getAttribute('aria-describedby'),`external-help${props.unit?` ${control.id}-unit`:''}`);
      }
      await render({error:undefined,helperText:undefined,'aria-invalid':true});
      for (const control of controls) {
        assert.equal(control.getAttribute('aria-invalid'),'true');
        assert.equal(control.validity.valid,true,'external ARIA invalid does not create a native error');
        assert.ok(control.closest('.is-invalid,.has-error'));
      }
      await render({error:undefined,helperText:undefined,disabled:true});
      for (const control of controls) assert.equal(control.disabled,true);
      assert.equal(Array.from(new dom.window.FormData(f.node.querySelector('form'))).length,0);
      await render({error:undefined,helperText:undefined,readOnly:true});
      for (const control of controls) assert.equal(control.readOnly,true);
      assert.equal(Array.from(new dom.window.FormData(f.node.querySelector('form'))).length,range?2:1);
      for (const button of f.node.querySelectorAll('button')) assert.equal(button.disabled,true);
    } finally { await f.dispose(); }
    assert.equal(ref.current,null);
    assert.equal(end.current,null);
  });

  test(`${name} keeps editing, validation and form reset working through the public refs`,async()=>{
    const f=fixture(), ref=React.createRef(), end=React.createRef(), changes=[];
    try {
      await f.render(h('form',null,h(Component,{label:'입력',name:'field',defaultValue:initial,...props,ref,...range&&{endInputRef:end},'aria-describedby':'reset-help','aria-invalid':false,onValueChange:value=>changes.push(value)}),h('p',{id:'reset-help'},'초기화 안내')));
      const form=f.node.querySelector('form'), controls=range?[ref.current,end.current]:[ref.current];
      const initialEntries=Array.from(new dom.window.FormData(form));
      for (const [index,control] of controls.entries()) {
        await edit(control,edited[index]);
        await commit(control);
      }
      assert.equal(changes.length,controls.length);
      assert.notDeepEqual(Array.from(new dom.window.FormData(form)),initialEntries);
      await edit(ref.current,'invalid');
      await commit(ref.current);
      for (const control of controls) {
        assert.equal(control.getAttribute('aria-invalid'),'true','internal errors override external false');
        assert.equal(control.validity.valid,false);
        const ids=control.getAttribute('aria-describedby').split(' ');
        assert.equal(ids[0],'reset-help');
        assert.ok(ids.some(id=>id.endsWith('-error')));
      }
      await act(async()=>form.reset());
      assert.equal(changes.length,controls.length,'reset does not publish a user edit');
      assert.deepEqual(Array.from(new dom.window.FormData(form)),initialEntries);
      for (const [index,control] of controls.entries()) {
        assert.equal(range?[ref.current,end.current][index]:ref.current,control,'reset preserves the referenced node');
        assert.equal(control.getAttribute('aria-invalid'),'false');
        assert.equal(control.validity.valid,true);
        assert.equal(control.getAttribute('aria-describedby'),`reset-help${props.unit?` ${control.id}-unit`:''}`);
      }
    } finally { await f.dispose(); }
  });
}

test('range callback refs are replaced and cleared for both endpoints',async()=>{
  const f=fixture(), assigned=[[],[]], replacements=[[],[]];
  const first=assigned.map(values=>node=>{values.push(node);});
  const second=replacements.map(values=>node=>{values.push(node);});
  try {
    await f.render(h(DateTimeRangePicker,{label:'기간',ref:first[0],endInputRef:first[1]}));
    const controls=Array.from(f.node.querySelectorAll('input[type="text"]'));
    assert.deepEqual(assigned.map(values=>values.at(-1)),controls);
    await f.render(h(DateTimeRangePicker,{label:'기간',ref:second[0],endInputRef:second[1]}));
    assert.deepEqual(assigned.map(values=>values.at(-1)),[null,null]);
    assert.deepEqual(replacements.map(values=>values.at(-1)),controls);
  } finally { await f.dispose(); }
  assert.deepEqual(replacements.map(values=>values.at(-1)),[null,null]);
});

test('numeric and temporal public types expose input refs and retain native error strings',()=>{
  const program=ts.createProgram([fileURLToPath(new URL('./temporal-field-api.types.tsx',import.meta.url))],{
    target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,
    jsx:ts.JsxEmit.ReactJSX,lib:['lib.es2020.d.ts','lib.dom.d.ts'],strict:true,skipLibCheck:true,noEmit:true,
  });
  const diagnostics=ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{
    getCanonicalFileName:file=>file,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n',
  }));
});
