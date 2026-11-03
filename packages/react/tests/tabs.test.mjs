import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','HTMLElement','Node','Event','MouseEvent','KeyboardEvent'])Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');const {createRoot}=await import('react-dom/client');const {Tabs}=await import('../dist/index.js');
const {act,createElement:h}=React;
after(()=>dom.window.close());

async function fixture(props={}){
  const node=document.createElement('div');document.body.append(node);const root=createRoot(node);const events=[];
  function Workspace(){const [items,setItems]=React.useState(['home','first','disabled','last']);const [value,setValue]=React.useState('last');return h(Tabs,{...props,label:'업무 화면',value,onValueChange:setValue,onTabClose:key=>{events.push(key);setItems(values=>values.filter(value=>value!==key));},items:items.map(key=>({value:key,label:key,closable:key!=='home',disabled:key==='disabled',content:h('input',{'aria-label':`${key} 입력`,defaultValue:''})}))});}
  await act(async()=>root.render(h(Workspace)));
  return {node,events,dispose:async()=>{await act(async()=>root.unmount());node.remove();}};
}
const click=async node=>{assert.ok(node);await act(async()=>node.click());};
const key=async(node,value)=>{await act(async()=>node.dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true})));};
const selected=node=>node.querySelector('[role=tab][aria-selected=true]');

test('closing the active tab selects and focuses the previous enabled tab, keeping home pinned',async()=>{
  const f=await fixture();try{
    assert.equal(f.node.querySelector('[aria-label="home 탭 닫기"]'),null);
    await click(f.node.querySelector('[aria-label="last 탭 닫기"]'));
    assert.deepEqual(f.events,['last']);assert.equal(selected(f.node).textContent,'first');assert.equal(document.activeElement,selected(f.node));
    await key(selected(f.node),'Delete');assert.equal(selected(f.node).textContent,'home');assert.equal(document.activeElement,selected(f.node));
    await key(selected(f.node),'Delete');assert.deepEqual(f.events,['last','first']);
    const panel=document.getElementById(selected(f.node).getAttribute('aria-controls'));assert.equal(panel.hidden,false);assert.equal(panel.getAttribute('aria-labelledby'),selected(f.node).id);
  }finally{await f.dispose();}
});

test('closing an inactive tab preserves the active screen and disabled tabs cannot close',async()=>{
  const f=await fixture();try{
    await click(f.node.querySelector('[aria-label="first 탭 닫기"]'));assert.equal(selected(f.node).textContent,'last');
    await click(f.node.querySelector('[aria-label="disabled 탭 닫기"]'));assert.deepEqual(f.events,['first']);
    assert.equal(f.node.querySelector('[aria-label="disabled 탭 닫기"]').disabled,true);
  }finally{await f.dispose();}
});

test('switching with arrow keys preserves panel inputs and skips disabled tabs',async()=>{
  const f=await fixture();try{
    const input=f.node.querySelector('[aria-label="last 입력"]');input.value='작성 중';
    await key(selected(f.node),'ArrowLeft');assert.equal(selected(f.node).textContent,'first');assert.equal(input.closest('[role=tabpanel]').hidden,true);
    await key(selected(f.node),'ArrowRight');assert.equal(selected(f.node).textContent,'last');assert.equal(f.node.querySelector('[aria-label="last 입력"]'),input);assert.equal(input.value,'작성 중');
    assert.equal(f.node.querySelector('button[role=tab] button'),null);
  }finally{await f.dispose();}
});

test('keyboard navigation focuses a tab after hidden tabs become selected',async()=>{
  const f=await fixture();try{
    const tabs=[...f.node.querySelectorAll('[role=tab]')];
    for(const tab of tabs){
      tab.focus=()=>{if(tab.getAttribute('aria-selected')==='true')HTMLElement.prototype.focus.call(tab);};
    }
    selected(f.node).focus();
    await key(selected(f.node),'ArrowLeft');
    assert.equal(selected(f.node).textContent,'first');
    assert.equal(document.activeElement,selected(f.node));
  }finally{await f.dispose();}
});

test('vertical tabs use up and down, skip disabled tabs and preserve panel inputs',async()=>{
  const f=await fixture({orientation:'vertical'});try{
    assert.equal(f.node.querySelector('[role=tablist]').getAttribute('aria-orientation'),'vertical');
    const input=f.node.querySelector('[aria-label="last 입력"]');input.value='작성 중';
    selected(f.node).focus();
    await key(selected(f.node),'ArrowUp');assert.equal(selected(f.node).textContent,'first');assert.equal(document.activeElement,selected(f.node));
    assert.equal(input.closest('[role=tabpanel]').hidden,true);
    await key(selected(f.node),'ArrowDown');assert.equal(selected(f.node).textContent,'last');assert.equal(input.value,'작성 중');
    await key(selected(f.node),'ArrowDown');assert.equal(selected(f.node).textContent,'home');
    await key(selected(f.node),'ArrowUp');assert.equal(selected(f.node).textContent,'last');
    await key(selected(f.node),'Home');assert.equal(selected(f.node).textContent,'home');
    await key(selected(f.node),'End');assert.equal(selected(f.node).textContent,'last');
    await key(selected(f.node),'ArrowLeft');await key(selected(f.node),'ArrowRight');assert.equal(selected(f.node).textContent,'last');
    await key(selected(f.node),'Delete');assert.equal(selected(f.node).textContent,'first');assert.equal(document.activeElement,selected(f.node));
  }finally{await f.dispose();}
});

test('closing the first enabled tab selects its next neighbour',async()=>{
  const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
  function Example(){const [items,setItems]=React.useState(['a','b']);return h(Tabs,{label:'문서',onTabClose:value=>setItems(values=>values.filter(key=>key!==value)),items:items.map(value=>({value,label:value,closable:true,content:value}))});}
  try{await act(async()=>root.render(h(Example)));await click(node.querySelector('[aria-label="a 탭 닫기"]'));assert.equal(selected(node).textContent,'b');assert.equal(document.activeElement,selected(node));await key(selected(node),'Delete');assert.equal(node.querySelectorAll('[role=tab]').length,0);}finally{await act(async()=>root.unmount());node.remove();}
});
