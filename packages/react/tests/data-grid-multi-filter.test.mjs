import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLSelectElement','Node','Event','MouseEvent','KeyboardEvent'])Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');
const {createRoot}=await import('react-dom/client');
const {DataGrid,MultiSelect}=await import('../dist/index.js');
const {act,createElement:h}=React;
after(()=>dom.window.close());
function fixture(){const node=document.createElement('div');document.body.append(node);const root=createRoot(node);return{node,async render(props){await act(async()=>root.render(h(DataGrid,props)));},async dispose(){await act(async()=>root.unmount());node.remove();}};}
const click=async element=>{assert.ok(element);await act(async()=>element.click());};
async function input(element,value){await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));});}
const button=(node,label)=>[...node.querySelectorAll('button')].find(element=>(element.getAttribute('aria-label')||element.textContent.trim())===label);
const names=node=>[...node.querySelectorAll('tbody tr[data-grid-row-id]')].map(row=>row.querySelector('td').textContent.trim());
const control=(node,label)=>[...node.querySelectorAll('button[role="combobox"]')].find(element=>element.getAttribute('aria-label').startsWith(`${label}:`));
async function open(node,label){const trigger=control(node,label);await click(trigger);return document.getElementById(trigger.getAttribute('aria-controls'));}
async function option(list,label){await click([...list.querySelectorAll('[role="option"]')].find(element=>element.textContent===label));}
const rows=[
  {id:'a',name:'Alpha',team:'design',status:'active',hours:10},
  {id:'b',name:'Beta',team:'dev',status:'active',hours:20},
  {id:'c',name:'Gamma',team:'design',status:'review',hours:30},
  {id:'d',name:'Delta',team:'plan',status:'ready',hours:40},
];
const columns=[
  {id:'name',header:'이름',accessor:row=>row.name,filter:'text'},
  {id:'team',header:'팀',accessor:row=>row.team,filter:'multi-select',filterOptions:[{value:'design',label:'디자인'},{value:'dev',label:'개발'},{value:'plan',label:'기획'}]},
  {id:'status',header:'상태',accessor:row=>row.status,filter:'multi-select',filterOptions:[{value:'active',label:'진행 중'},{value:'review',label:'검토 중'},{value:'ready',label:'준비 중'}]},
  {id:'hours',header:'시간',accessor:row=>row.hours,filter:'number'},
];
const base={label:'복수 필터',rows,columns,getRowId:row=>row.id,pagination:false};

test('multi-select uses OR within a column and AND across text, numeric, other columns and search',async()=>{
  const f=fixture();
  try{
    await f.render({...base,filters:{team:['design','dev']}});assert.deepEqual(names(f.node),['Alpha','Beta','Gamma']);
    await f.render({...base,filters:{team:['design','dev'],status:['active','ready']}});assert.deepEqual(names(f.node),['Alpha','Beta']);
    await f.render({...base,filters:{team:['design','dev'],status:['active'],hours:{min:'15',max:'30'},name:'et'},query:'dev'});assert.deepEqual(names(f.node),['Beta']);
    await f.render({...base,filters:{team:[],status:[]}});assert.deepEqual(names(f.node),rows.map(row=>row.name));
    await f.render({...base,filters:{hours:['invalid-model']}});assert.deepEqual(names(f.node),rows.map(row=>row.name));
  }finally{await f.dispose();}
});

test('popup search preserves choices, summaries retain the full accessible name and last deselection clears the key',async()=>{
  const f=fixture(),changes=[];
  try{
    await f.render({...base,onFiltersChange:value=>changes.push(value)});
    const list=await open(f.node,'팀 필터');
    await option(list,'디자인');await option(list,'개발');
    assert.equal(list.closest('.select-popup').hidden,false);assert.deepEqual(names(f.node),['Alpha','Beta','Gamma']);
    assert.deepEqual(changes.at(-1),{team:['design','dev']});
    const trigger=control(f.node,'팀 필터');
    assert.equal(trigger.querySelector('.select-value-text').textContent,'디자인 외 1개');
    assert.equal(trigger.getAttribute('aria-label'),'팀 필터: 디자인, 개발');
    const search=f.node.querySelector('input[aria-label="팀 필터 검색"]');
    await input(search,'기획');assert.equal(list.querySelectorAll('[role="option"]').length,1);
    assert.deepEqual(names(f.node),['Alpha','Beta','Gamma']);assert.equal(changes.length,2);
    await input(search,'');await option(list,'디자인');await option(list,'개발');
    assert.deepEqual(changes.at(-1),{team:[]});assert.deepEqual(names(f.node),rows.map(row=>row.name));
    assert.equal(trigger.querySelector('.select-value-text').textContent,'전체');
    assert.equal(button(f.node,'필터 초기화'),undefined);
  }finally{await f.dispose();}
});

test('controlled arrays remain immutable and follow external updates, while reset and filter toggles publish empty models',async()=>{
  const f=fixture(),changes=[],selection=Object.freeze(['design']);
  const controlled={...base,filters:{team:selection},onFiltersChange:value=>changes.push(value)};
  try{
    await f.render(controlled);assert.deepEqual(names(f.node),['Alpha','Gamma']);
    const list=await open(f.node,'팀 필터');await option(list,'개발');
    assert.deepEqual(changes.at(-1),{team:['design','dev']});assert.deepEqual(selection,['design']);assert.deepEqual(names(f.node),['Alpha','Gamma']);
    await f.render({...controlled,filters:{team:['dev']}});assert.deepEqual(names(f.node),['Beta']);
    await click(button(f.node,'필터 초기화'));assert.deepEqual(changes.at(-1),{});assert.deepEqual(names(f.node),['Beta']);
    await f.render({...controlled,showColumnFilterToggle:true});assert.deepEqual(names(f.node),rows.map(row=>row.name));
    await click(button(f.node,'컬럼 필터'));assert.deepEqual(names(f.node),['Alpha','Gamma']);
    await click(button(f.node,'컬럼 필터'));assert.deepEqual(changes.at(-1),{});assert.deepEqual(names(f.node),rows.map(row=>row.name));
  }finally{await f.dispose();}
});

test('array changes reset pagination once and CSV exports the matching union across pages',async()=>{
  const f=fixture(),pages=[],previous=window.showSaveFilePicker;let csv;
  window.showSaveFilePicker=async()=>({createWritable:async()=>({write:async blob=>{csv=await blob.text();},close:async()=>{}})});
  try{
    await f.render({...base,pagination:true,defaultPage:2,defaultPageSize:1,onPageChange:value=>pages.push(value),exportable:true});
    assert.deepEqual(names(f.node),['Beta']);
    const list=await open(f.node,'팀 필터');await option(list,'디자인');
    assert.deepEqual(names(f.node),['Alpha']);assert.deepEqual(pages,[1]);
    await option(list,'개발');await click(button(f.node,'CSV 내보내기'));
    assert.match(csv,/Alpha/);assert.match(csv,/Beta/);assert.match(csv,/Gamma/);assert.doesNotMatch(csv,/Delta/);
    await click(button(f.node,'필터 초기화'));assert.deepEqual(names(f.node),['Alpha']);
  }finally{window.showSaveFilePicker=previous;await f.dispose();}
});

test('empty and reserved-looking option values round-trip without an all-option collision',async()=>{
  const f=fixture();
  const values=[{id:'empty',value:''},{id:'null',value:null},{id:'zero',value:0},{id:'all',value:'all'},{id:'prefix',value:'option:x'}];
  const props={label:'경계값',rows:values,columns:[{id:'value',header:'값',accessor:row=>row.value,filter:'multi-select',filterOptions:[{value:'',label:'미지정'},{value:'0',label:'영'},{value:'all',label:'문자 all'},{value:'option:x',label:'접두사'}]}],getRowId:row=>row.id,pagination:false};
  try{
    await f.render(props);const list=await open(f.node,'값 필터');
    await option(list,'미지정');assert.equal(f.node.querySelectorAll('tbody tr[data-grid-row-id]').length,2);
    await option(list,'문자 all');await option(list,'접두사');await option(list,'영');
    assert.equal(f.node.querySelectorAll('tbody tr[data-grid-row-id]').length,5);
    await option(list,'미지정');assert.deepEqual([...f.node.querySelectorAll('tbody tr[data-grid-row-id]')].map(row=>row.dataset.gridRowId),['zero','all','prefix']);
  }finally{await f.dispose();}
});

test('MultiSelect summary is opt-in, keeps its accessible names and does not limit inline tags',async()=>{
  const node=document.createElement('div');document.body.append(node);const root=createRoot(node);
  const props={label:'팀',options:columns[1].filterOptions,defaultValue:['design','dev','plan']};
  try{
    await act(async()=>root.render(h(MultiSelect,props)));
    const trigger=node.querySelector('button[role="combobox"]');assert.equal(trigger.querySelector('.select-value-text').textContent,'디자인, 개발, 기획');
    await act(async()=>root.render(h(MultiSelect,{...props,maxVisibleLabels:1})));
    assert.equal(trigger.querySelector('.select-value-text').textContent,'디자인 외 2개');assert.equal(trigger.getAttribute('aria-label'),'팀: 디자인, 개발, 기획');
    await act(async()=>root.render(h(MultiSelect,{...props,maxVisibleLabels:0})));
    assert.equal(trigger.querySelector('.select-value-text').textContent,'디자인, 개발, 기획');
    await act(async()=>root.render(h(MultiSelect,{...props,maxVisibleLabels:1,presentation:'inline'})));
    assert.equal(node.querySelectorAll('.multi-inline-chip').length,3);
  }finally{await act(async()=>root.unmount());node.remove();}
});

test('virtualized grids apply array filters before counting and windowing rows',async()=>{
  const prototype=dom.window.HTMLElement.prototype;
  const original=['clientWidth','clientHeight'].map(key=>[key,Object.getOwnPropertyDescriptor(prototype,key)]);
  const previousScrollTo=prototype.scrollTo;
  for(const [key] of original)Object.defineProperty(prototype,key,{configurable:true,get(){return this.classList.contains('data-grid-scroll')?(key==='clientWidth'?640:400):0;}});
  prototype.scrollTo=function(options){if(typeof options==='object'&&options.top!==undefined)this.scrollTop=options.top;};
  const f=fixture(),many=Array.from({length:6000},(_,index)=>({...rows[index%4],id:`v-${index}`}));
  try{
    await f.render({...base,rows:many,virtualized:true,filters:{team:['design','dev'],status:['active']}});
    assert.equal(f.node.querySelector('table').getAttribute('aria-rowcount'),'3002');
    const rendered=[...f.node.querySelectorAll('tbody tr[data-grid-row-id]')];
    assert.ok(rendered.length>0&&rendered.length<50,'only a measured window is mounted');
    assert.ok(names(f.node).every(name=>name==='Alpha'||name==='Beta'));
    await f.render({...base,rows:many,virtualized:true,filters:{team:['plan']}});
    assert.equal(f.node.querySelector('table').getAttribute('aria-rowcount'),'1502');
    assert.ok(names(f.node).length>0&&names(f.node).every(name=>name==='Delta'));
  }finally{
    await f.dispose();prototype.scrollTo=previousScrollTo;
    for(const [key,descriptor] of original){if(descriptor)Object.defineProperty(prototype,key,descriptor);else delete prototype[key];}
  }
});
