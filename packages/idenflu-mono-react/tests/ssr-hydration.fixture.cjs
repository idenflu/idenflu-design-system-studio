const assert=require('node:assert/strict');
const {readFileSync,writeFileSync}=require('node:fs');
const {createRequire}=require('node:module');
const options=Object.fromEntries(process.argv.slice(2).map(value=>{
  const offset=value.indexOf('='); return [value.slice(2,offset),value.slice(offset+1)];
}));
const prefix='mono-compat-';

async function main() {
  let dom;
  if(options.mode==='hydrate') {
    const {JSDOM}=createRequire(options['jsdom-from'])('jsdom');
    dom=new JSDOM(`<!doctype html><html><body><div id="root">${readFileSync(options.markup,'utf8')}</div></body></html>`,{pretendToBeVisual:true,url:'http://localhost/'});
    for(const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLButtonElement','Node','Event','MouseEvent','KeyboardEvent','CustomEvent']) {
      Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
    }
    globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  }
  const React=require('react');
  const components=options.format==='esm'?await import('@idenflu/mono-react'):require('@idenflu/mono-react');
  const {PageHeader,Select,SearchSelect,NumberField,DatePicker,DateRangePicker,TimePicker,DateTimePicker,DateTimeRangePicker}=components;
  const h=React.createElement;
  const headerRef=React.createRef();
  const refs=Object.fromEntries(['team','searchTeam','number','date','rangeStart','rangeEnd','time','datetime','datetimeStart','datetimeEnd'].map(name=>[name,React.createRef()]));
  const common={label:'입력','aria-describedby':'shared-help','aria-invalid':false,helperText:'필드 안내'};
  const teams=[{value:'design',label:'디자인'},{value:'development',label:'개발'}];
  const fixture=()=>h('form',null,
    h(PageHeader,{ref:headerRef,title:'예약 입력',headingLevel:2,description:'공개 패키지 서버 렌더링과 폼 연결'}),
    h('p',{id:'shared-help'},'조직 공통 안내'),
    h(Select,{...common,label:'담당 팀',name:'team',options:teams,defaultValue:'design',ref:refs.team}),
    h(SearchSelect,{...common,label:'팀 검색',name:'search-team',options:teams,defaultValue:'design',ref:refs.searchTeam}),
    h(NumberField,{...common,label:'수량',name:'quantity',defaultValue:'8',unit:'명',ref:refs.number}),
    h(DatePicker,{...common,label:'날짜',name:'date',defaultValue:'2026-11-02',ref:refs.date}),
    h(DateRangePicker,{...common,label:'기간',name:'period',defaultValue:['2026-11-02','2026-11-04'],ref:refs.rangeStart,endInputRef:refs.rangeEnd}),
    h(TimePicker,{...common,label:'시간',name:'time',defaultValue:'08:30',ref:refs.time}),
    h(DateTimePicker,{...common,label:'일시',name:'appointment',defaultValue:'2026-11-02T08:30',ref:refs.datetime}),
    h(DateTimeRangePicker,{...common,label:'일시 기간',name:'appointment-period',defaultValue:['2026-11-02T08:30','2026-11-04T08:30'],ref:refs.datetimeStart,endInputRef:refs.datetimeEnd}));
  const warnings=[],errors=[];
  const originals={error:console.error,warn:console.warn};
  console.error=(...args)=>warnings.push(args.map(String).join(' '));
  console.warn=(...args)=>warnings.push(args.map(String).join(' '));
  let root;
  try {
    if(options.mode==='ssr') {
      const {renderToString}=require('react-dom/server');
      writeFileSync(options.markup,renderToString(fixture(),{identifierPrefix:prefix}));
    } else {
      const {hydrateRoot}=require('react-dom/client');
      const act=React.act??require('react-dom/test-utils').act;
      const container=document.getElementById('root');
      const serverInputs=Array.from(container.querySelectorAll('input[type="text"]'));
      const serverRangeStart=container.querySelector('input[name="period-start"]');
      await act(async()=>{root=hydrateRoot(container,fixture(),{identifierPrefix:prefix,onRecoverableError:error=>errors.push(error.message)});});
      assert.deepEqual(Array.from(container.querySelectorAll('input[type="text"]')),serverInputs,'hydration reuses the server-rendered inputs');
      assert.equal(headerRef.current.tagName,'HEADER');
      assert.equal(headerRef.current.getAttribute('aria-labelledby'),headerRef.current.querySelector('h2').id);
      assert.equal(refs.team.current.tagName,'BUTTON');
      for(const [name,ref] of Object.entries(refs)) {
        const control=ref.current;
        assert.ok(control,`${name} receives its public DOM ref`);
        if(name!=='team') assert.equal(control.tagName,'INPUT');
        const descriptions=control.getAttribute('aria-describedby').split(' ');
        assert.equal(descriptions[0],'shared-help');
        assert.ok(descriptions.every(id=>document.getElementById(id)),`${name} descriptions point to hydrated content`);
        assert.equal(control.getAttribute('aria-invalid'),'false');
      }
      assert.notEqual(refs.rangeStart.current,refs.rangeEnd.current);
      assert.notEqual(refs.datetimeStart.current,refs.datetimeEnd.current);
      const ids=Array.from(container.querySelectorAll('[id]'),node=>node.id);
      assert.equal(new Set(ids).size,ids.length,'server/client useId values stay unique');
      const form=container.querySelector('form');
      const formData=()=>Array.from(new dom.window.FormData(form));
      const initial=[['team','design'],['search-team','design'],['quantity','8'],['date','2026-11-02'],['period-start','2026-11-02'],['period-end','2026-11-04'],['time','08:30'],['appointment','2026-11-02T08:30'],['appointment-period-start','2026-11-02T08:30'],['appointment-period-end','2026-11-04T08:30']];
      assert.deepEqual(formData(),initial);
      assert.equal(form.checkValidity(),true);
      for(const ref of Object.values(refs)) {
        await act(async()=>ref.current.focus());
        assert.equal(document.activeElement,ref.current);
      }
      await act(async()=>refs.team.current.click());
      await act(async()=>refs.team.current.closest('.custom-select').querySelectorAll('[role="option"]')[1].click());
      async function edit(ref,value) {
        await act(async()=>{
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(ref.current,value);
          ref.current.dispatchEvent(new Event('input',{bubbles:true}));
        });
        await act(async()=>ref.current.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));
      }
      await edit(refs.number,'12');
      await edit(refs.rangeEnd,'2026-11-06');
      await edit(refs.time,'0945');
      await edit(refs.datetime,'2026-11-03 09:45');
      const changed=new Map(formData());
      assert.equal(changed.get('team'),'development');
      assert.equal(changed.get('quantity'),'12');
      assert.equal(changed.get('period-end'),'2026-11-06');
      assert.equal(changed.get('time'),'09:45');
      assert.equal(changed.get('appointment'),'2026-11-03T09:45');
      await edit(refs.number,'invalid');
      assert.equal(refs.number.current.getAttribute('aria-invalid'),'true');
      assert.equal(refs.number.current.validity.valid,false);
      assert.ok(refs.number.current.getAttribute('aria-describedby').split(' ').some(id=>id.endsWith('-error')));
      await act(async()=>form.reset());
      assert.deepEqual(formData(),initial);
      assert.equal(refs.number.current.getAttribute('aria-invalid'),'false');
      assert.equal(refs.number.current.validity.valid,true);
      assert.equal(refs.rangeStart.current,serverRangeStart);
      await act(async()=>root.unmount()); root=null;
      assert.ok(Object.values(refs).every(ref=>ref.current===null),'unmount clears every public ref');
      assert.equal(headerRef.current,null,'unmount clears the page header ref');
    }
    assert.deepEqual(errors,[],'hydration has no recoverable errors');
    assert.deepEqual(warnings,[],'SSR/hydration has no console warnings');
  } finally {
    console.error=originals.error;console.warn=originals.warn;
    if(root) {
      const act=React.act??require('react-dom/test-utils').act;
      await act(async()=>root.unmount());
    }
    dom?.window.close();
  }
  console.log(`${React.version} ${options.format} ${options.mode}: 통과`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
