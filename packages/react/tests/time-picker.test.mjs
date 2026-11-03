import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','HTMLElement','HTMLInputElement','Node','Event','MouseEvent','KeyboardEvent']){
  Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
}
Object.defineProperty(document.documentElement,'clientWidth',{configurable:true,value:1024});
HTMLElement.prototype.getBoundingClientRect=()=>({top:100,bottom:138,left:100,right:420,width:320,height:38,x:100,y:100,toJSON(){}});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');
const {createRoot}=await import('react-dom/client');
const {renderToString}=await import('react-dom/server');
const {TimePicker}=await import('../dist/index.js');
const {act,createElement:h}=React;
after(()=>dom.window.close());

function fixture(){
  const node=document.createElement('div');document.body.append(node);
  const root=createRoot(node);
  return {node,render:async element=>act(async()=>root.render(element)),dispose:async()=>{await act(async()=>root.unmount());node.remove();}};
}
async function click(element){assert.ok(element);await act(async()=>element.click());}
async function key(element,value,options={}){assert.ok(element);await act(async()=>element.dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true,...options})));}
async function edit(element,value){await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));});}
async function blur(element){await act(async()=>element.dispatchEvent(new dom.window.FocusEvent('focusout',{bubbles:true})));}
async function validity(element){let valid;await act(async()=>{valid=element.checkValidity();});return valid;}
const input=node=>node.querySelector('.time-input');
const trigger=node=>node.querySelector('.date-trigger');
const popup=node=>node.querySelector('.time-popup');
const button=(node,text)=>[...node.querySelectorAll('button')].find(element=>element.textContent.trim()===text);
const option=(node,column,text)=>[...node.querySelectorAll(`[role="listbox"][aria-label="${column}"] [role="option"]`)].find(element=>element.textContent===text);
const submitted=node=>new dom.window.FormData(node.querySelector('form')).get('time');

test('TimePicker normalizes typed times, submits canonical minutes and publishes optional clearing once',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render(h('form',null,h(TimePicker,{label:'시간',name:'time',onValueChange:value=>changes.push(value)})));
    const field=input(f.node);
    for(const raw of ['9:05','0905']){
      await edit(field,raw);await key(field,'Enter');
      assert.equal(field.value,'09:05');assert.equal(submitted(f.node),'09:05');
    }
    assert.deepEqual(changes,['09:05']);
    await edit(field,'');await blur(field);
    assert.equal(submitted(f.node),'');assert.deepEqual(changes,['09:05',null]);
    await key(field,'Enter');assert.equal(changes.length,2);
  }finally{await f.dispose();}
});

test('invalid times remain editable and never replace the committed form value',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render(h('form',null,h(TimePicker,{label:'시간',name:'time',defaultValue:'09:30',onValueChange:value=>changes.push(value)})));
    const field=input(f.node);
    for(const raw of ['24:00','14:60','12:3','오전 9시','-1:00']){
      await edit(field,raw);await blur(field);
      assert.equal(field.value,raw);assert.equal(field.getAttribute('aria-invalid'),'true');
      assert.equal(await validity(field),false);assert.equal(submitted(f.node),'09:30');
    }
    assert.deepEqual(changes,[]);
    await edit(field,'10:15');await key(field,'Enter');
    assert.equal(await validity(field),true);assert.equal(field.hasAttribute('aria-invalid'),false);
    assert.equal(submitted(f.node),'10:15');
  }finally{await f.dispose();}
});

test('time bounds include their endpoints and minuteStep is enforced in typing and picker choices',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render(h(TimePicker,{label:'예약',defaultValue:'10:30',min:'09:00',max:'18:00',minuteStep:15,onValueChange:value=>changes.push(value)}));
    for(const raw of ['08:45','18:15','10:10']){await edit(input(f.node),raw);await key(input(f.node),'Enter');assert.equal(await validity(input(f.node)),false);}
    assert.deepEqual(changes,[]);
    for(const raw of ['09:00','18:00']){await edit(input(f.node),raw);await key(input(f.node),'Enter');assert.equal(changes.at(-1),raw);}
    await click(trigger(f.node));
    assert.equal(option(f.node,'시','08').disabled,true);assert.equal(option(f.node,'시','19').disabled,true);
    assert.equal(option(f.node,'분','00').disabled,false);assert.equal(option(f.node,'분','15').disabled,true);
    await click(option(f.node,'시','09'));
    assert.equal(option(f.node,'분','45').disabled,false);
  }finally{await f.dispose();}
});

test('picker choices remain pending until confirmation and cancel, Escape and outside clicks discard them',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render(h('form',null,h(TimePicker,{label:'시작 시간',name:'time',defaultValue:'09:30',minuteStep:15,onValueChange:value=>changes.push(value)})));
    for(const dismissal of ['cancel','escape','outside']){
      await click(trigger(f.node));await click(option(f.node,'시','14'));await click(option(f.node,'분','45'));
      assert.equal(submitted(f.node),'09:30');assert.deepEqual(changes,[]);
      if(dismissal==='cancel')await click(button(popup(f.node),'취소'));
      else if(dismissal==='escape')await key(document.activeElement,'Escape');
      else await act(async()=>document.body.dispatchEvent(new MouseEvent('pointerdown',{bubbles:true})));
      assert.equal(popup(f.node),null);assert.equal(input(f.node).value,'09:30');
      if(dismissal!=='outside')assert.equal(document.activeElement,trigger(f.node));
    }
    await click(trigger(f.node));await click(option(f.node,'시','14'));await click(option(f.node,'분','45'));await click(button(popup(f.node),'확인'));
    assert.deepEqual(changes,['14:45']);assert.equal(submitted(f.node),'14:45');assert.equal(popup(f.node),null);
    assert.equal(document.activeElement,trigger(f.node));
  }finally{await f.dispose();}
});

test('controlled values follow parent updates, keep null empty and restore rejected edits',async()=>{
  const f=fixture(),changes=[];
  const field=value=>h('form',null,h(TimePicker,{label:'시간',name:'time',value,defaultValue:'12:00',onValueChange:next=>changes.push(next)}));
  try{
    await f.render(field(null));assert.equal(input(f.node).value,'');assert.equal(submitted(f.node),'');
    await f.render(field('09:30'));await edit(input(f.node),'10:15');
    await f.render(field('09:30'));assert.equal(input(f.node).value,'10:15');
    await key(input(f.node),'Enter');assert.deepEqual(changes,['10:15']);assert.equal(input(f.node).value,'09:30');assert.equal(submitted(f.node),'09:30');
    await click(trigger(f.node));await f.render(field('11:45'));
    assert.equal(popup(f.node),null);assert.equal(input(f.node).value,'11:45');
    await f.render(field(null));assert.equal(input(f.node).value,'');
  }finally{await f.dispose();}
});

test('keyboard opening and list navigation skip disabled options without publishing prematurely',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render(h(TimePicker,{label:'시간',defaultValue:'10:30',min:'09:00',max:'12:00',minuteStep:15,onValueChange:value=>changes.push(value)}));
    await key(input(f.node),'ArrowDown',{altKey:true});
    assert.equal(document.activeElement,option(f.node,'시','10'));
    await key(document.activeElement,'Home');assert.equal(document.activeElement,option(f.node,'시','09'));
    await key(document.activeElement,'End');assert.equal(document.activeElement,option(f.node,'시','12'));
    assert.equal(option(f.node,'분','00').getAttribute('aria-selected'),'true');
    await key(document.activeElement,'PageUp');assert.equal(document.activeElement,option(f.node,'시','09'));
    assert.deepEqual(changes,[]);
    await click(button(popup(f.node),'확인'));assert.deepEqual(changes,['09:00']);
  }finally{await f.dispose();}
});

test('required and parent errors connect to validity and disabled or readOnly fields cannot change',async()=>{
  const f=fixture();
  try{
    await f.render(h(TimePicker,{label:'필수 시간',required:true,helperText:'시간을 입력하세요.'}));
    await key(input(f.node),'Enter');assert.equal(await validity(input(f.node)),false);
    const ids=input(f.node).getAttribute('aria-describedby').split(' ');
    assert.equal(ids.length,2);ids.forEach(id=>assert.ok(document.getElementById(id)));
    await f.render(h(TimePicker,{label:'필수 시간',value:'09:30',error:'예약할 수 없는 시간입니다.'}));
    assert.equal(input(f.node).validationMessage,'예약할 수 없는 시간입니다.');
    await f.render(h(TimePicker,{label:'필수 시간',value:'09:30'}));assert.equal(input(f.node).validationMessage,'');
    for(const state of ['disabled','readOnly']){
      await f.render(h('form',null,h(TimePicker,{label:'시간',name:'time',defaultValue:'09:30',[state]:true})));
      assert.equal(trigger(f.node).disabled,true);await key(input(f.node),'ArrowDown',{altKey:true});assert.equal(popup(f.node),null);
      assert.equal(submitted(f.node),state==='disabled'?null:'09:30');
    }
  }finally{await f.dispose();}
});

test('form reset restores the first default without publishing and respects prevented resets',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render(h('form',null,h(TimePicker,{label:'시간',name:'time',defaultValue:'09:30',onValueChange:value=>changes.push(value)})));
    const form=f.node.querySelector('form');
    await edit(input(f.node),'11:15');await key(input(f.node),'Enter');await click(trigger(f.node));
    await act(async()=>form.reset());assert.equal(input(f.node).value,'09:30');assert.equal(submitted(f.node),'09:30');assert.equal(popup(f.node),null);
    assert.deepEqual(changes,['11:15']);
    await edit(input(f.node),'12:30');await key(input(f.node),'Enter');
    form.addEventListener('reset',event=>event.preventDefault(),{once:true});
    await act(async()=>form.reset());assert.equal(input(f.node).value,'12:30');
    await f.render(h('form',null,h(TimePicker,{label:'시간',name:'time',value:'15:00'})));
    await edit(input(f.node),'16:00');await act(async()=>form.reset());assert.equal(input(f.node).value,'15:00');
  }finally{await f.dispose();}
});

test('empty availability disables confirmation and disabling an open picker discards its draft',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render(h(TimePicker,{label:'시간',min:'09:01',max:'09:14',minuteStep:15}));await click(trigger(f.node));
    assert.equal(button(popup(f.node),'확인').disabled,true);assert.match(popup(f.node).textContent,/선택 가능한 시간이 없습니다/);
    await f.render(h(TimePicker,{label:'시간',defaultValue:'10:00',onValueChange:value=>changes.push(value)}));
    await click(button(popup(f.node),'취소'));await click(trigger(f.node));await click(option(f.node,'시','14'));
    await f.render(h(TimePicker,{label:'시간',disabled:true,onValueChange:value=>changes.push(value)}));assert.equal(popup(f.node),null);assert.deepEqual(changes,[]);
  }finally{await f.dispose();}
});

test('IME composition does not publish time changes or open the picker',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render(h(TimePicker,{label:'시간',onValueChange:value=>changes.push(value)}));
    await edit(input(f.node),'0930');await key(input(f.node),'Enter',{isComposing:true});await key(input(f.node),'Enter',{keyCode:229});
    assert.deepEqual(changes,[]);
    await act(async()=>input(f.node).dispatchEvent(new Event('compositionstart',{bubbles:true})));
    await click(trigger(f.node));assert.equal(popup(f.node),null);await blur(input(f.node));assert.deepEqual(changes,[]);
    await act(async()=>input(f.node).dispatchEvent(new Event('compositionend',{bubbles:true})));
    await key(input(f.node),'Enter');assert.deepEqual(changes,['09:30']);
  }finally{await f.dispose();}
});

test('changing time constraints updates pending choices without publishing a new value',async()=>{
  const f=fixture(),changes=[];
  const render=props=>h(TimePicker,{label:'시간',defaultValue:'09:30',onValueChange:value=>changes.push(value),...props});
  try{
    await f.render(render({minuteStep:15}));await click(trigger(f.node));
    await f.render(render({min:'11:00',max:'12:00',minuteStep:30}));
    assert.equal(option(f.node,'시','09').disabled,true);
    assert.equal(option(f.node,'시','11').getAttribute('aria-selected'),'true');
    assert.equal(option(f.node,'분','00').getAttribute('aria-selected'),'true');
    assert.equal(input(f.node).value,'09:30');assert.deepEqual(changes,[]);
    await f.render(render({min:'11:01',max:'11:14',minuteStep:15}));
    assert.equal(button(popup(f.node),'확인').disabled,true);
    assert.equal(popup(f.node).querySelectorAll('[role="option"]:not(:disabled)[tabindex="0"]').length,0);
  }finally{await f.dispose();}
});

test('TimePicker renders on the server and rejects invalid range or step configuration',()=>{
  assert.match(renderToString(h(TimePicker,{label:'시간',defaultValue:'14:30',name:'time'})),/14:30/);
  for(const props of [{minuteStep:7},{minuteStep:0},{min:'9:00'},{max:'24:00'},{min:'18:00',max:'09:00'}]){
    assert.throws(()=>renderToString(h(TimePicker,{label:'시간',...props})),RangeError);
  }
});
