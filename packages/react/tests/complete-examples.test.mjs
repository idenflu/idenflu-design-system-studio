import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {transform} from 'esbuild';
import {JSDOM} from 'jsdom';
import {createCompleteExamples,completeExampleEntries} from '../scripts/complete-examples.mjs';
import {checkCompleteExamples} from '../scripts/check-complete-examples.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',pretendToBeVisual:true});
for(const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLSelectElement','Node','Event','MouseEvent','KeyboardEvent','CustomEvent','FormData','File']) Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=await import('react');
const {createRoot}=await import('react-dom/client');
const examples=await createCompleteExamples();
await mkdir(join(root,'dist'),{recursive:true});
const temporary=await mkdtemp(join(root,'dist/copied-examples-test-'));
const components=new Map();
for(const [route,code] of Object.entries(examples)) {
  const filename=join(temporary,route.replaceAll('/','-')+'.mjs');
  const executable=code.replace("import '@idenflu/mono-react/styles.css';",'');
  const result=await transform(executable,{loader:'tsx',jsx:'automatic',format:'esm',target:'es2020'});
  await writeFile(filename,result.code);
  const module=await import(pathToFileURL(filename).href);
  components.set(route,module[completeExampleEntries[route][2]]);
}
after(async()=>{await rm(temporary,{recursive:true,force:true});dom.window.close();});

async function mount(route) {
  const container=document.createElement('div');document.body.append(container);
  const reactRoot=createRoot(container);
  await React.act(async()=>reactRoot.render(React.createElement(components.get(route))));
  return {container,async dispose(){await React.act(async()=>reactRoot.unmount());container.remove();}};
}
async function click(node) {assert.ok(node);await React.act(async()=>node.click());}
function button(node,text) {return [...node.querySelectorAll('button')].find(item=>item.textContent===text);}
async function submit(node) {await React.act(async()=>node.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}

test('all complete examples typecheck against public package declarations and have no private imports',()=>{
  assert.equal(checkCompleteExamples(examples),14);
  for(const code of Object.values(examples)) {
    assert.doesNotMatch(code,/from\s+['"]\./);
    assert.match(code,/import '@idenflu\/mono-react\/styles.css'/);
    assert.match(code,/const exampleStyles/);
  }
  assert.throws(()=>checkCompleteExamples({'broken':'export function Broken() { return <MissingComponent />; }'}),/MissingComponent/);
});

test('every copied example mounts using only the package and its included local styles',async()=>{
  for(const route of components.keys()) {const f=await mount(route);try {assert.ok(f.container.querySelector('.mono-copy-example style'),route);assert.ok(f.container.querySelector('input,button,table'),route);}finally{await f.dispose();}}
});

test('copied Table supports selection, all selection and pagination without missing handlers',async()=>{
  const f=await mount('components/table');try {
    const checkbox=f.container.querySelector('[aria-label="모든 파일 선택"]') || [...f.container.querySelectorAll('input[type="checkbox"]')].find(node=>node.closest('label')?.textContent==='모든 파일 선택');
    assert.ok(checkbox);
    await click(checkbox);
    assert.equal(f.container.querySelectorAll('tr[data-selected="true"]').length,5);
    await click(button(f.container,'선택 해제'));
    assert.equal(f.container.querySelectorAll('tr[data-selected="true"]').length,0);
    const next=button(f.container.querySelector('nav[aria-label="페이지 탐색"]'),'다음');
    await click(next);
    assert.match(f.container.textContent,/5–8 \/ 16개 프로젝트/);
  }finally{await f.dispose();}
});

test('copied Chips include working filter, removal and reset state',async()=>{
  const f=await mount('components/chips');try {
    await click(f.container.querySelector('[aria-label="프로젝트 제거"]'));
    assert.equal(f.container.querySelector('[aria-label="프로젝트 제거"]'),null);
    await click(button(f.container,'초기화'));
    assert.ok(f.container.querySelector('[aria-label="프로젝트 제거"]'));
    const filter=[...f.container.querySelectorAll('button')].find(node=>node.textContent==='개발');
    await click(filter);assert.equal(filter.getAttribute('aria-pressed'),'true');
  }finally{await f.dispose();}
});

test('copied basic form validates, previews its real values and resets them',async()=>{
  const f=await mount('patterns/form/basic');try {
    const form=f.container.querySelector('form');await submit(form);
    assert.equal(document.activeElement,form.querySelector('[name="name"]'));
    form.querySelector('[name="name"]').value='예제 사용자';form.querySelector('[name="email"]').value='sample@example.com';
    await submit(form);
    const values=JSON.parse(f.container.querySelector('[aria-label="폼 제출값"]').textContent);
    assert.equal(values.name,'예제 사용자');assert.equal(values.email,'sample@example.com');
    await React.act(async()=>form.reset());
    assert.equal(form.querySelector('[name="name"]').value,'');assert.equal(f.container.querySelector('[aria-label="폼 제출값"]'),null);
  }finally{await f.dispose();}
});

test('copied preference form preserves array values and password preview does not expose secrets',async()=>{
  const f=await mount('patterns/form/preferences');try {
    const form=f.container.querySelector('form');await click(form.querySelector('input[name="channels"][value="email"]'));await click(form.querySelector('input[name="contact"][value="email"]'));await submit(form);
    assert.deepEqual(JSON.parse(f.container.querySelector('[aria-label="폼 제출값"]').textContent).channels,['email']);
  }finally{await f.dispose();}
  const password=await mount('patterns/form/password');try {
    const form=password.container.querySelector('form');for(const name of ['current','password','confirm']) form.querySelector(`[name="${name}"]`).value='private-example-password';
    await submit(form);const preview=password.container.querySelector('[aria-label="폼 제출값"]').textContent;
    assert.doesNotMatch(preview,/private-example-password/);assert.match(preview,/표시하지 않음/);
  }finally{await password.dispose();}
});

test('copied readonly example submits readonly fields and excludes disabled fields',async()=>{
  const f=await mount('patterns/form/states');try {
    await submit(f.container.querySelector('form'));
    const values=JSON.parse(f.container.querySelector('[aria-label="폼 제출값"]').textContent);
    assert.equal(values.accountId,'idenflu-user');assert.ok(values.description);
    for(const key of ['team','project','notifications']) assert.equal(key in values,false);
  }finally{await f.dispose();}
});

for(const [route,label,expected] of [
  ['components/select','선택 제출 데이터',{team:'design',reviewer:null,teams:['design']}],
  ['components/number-fields','금액 제출 데이터',{formValue:'12,500.5',request:{amount:'12500.5'}}],
  ['components/date-picker','날짜 제출 데이터',{request:{date:'2026-11-12',startsOn:'2026-11-12',endsOn:'2026-11-19'},formValues:{date:'2026-11-12',start:'2026-11-12',end:'2026-11-19'}}],
]) test(`copied ${route} binding reads the documented form value shape`,async()=>{
  const f=await mount(route);try {await submit(f.container.querySelector('form'));assert.deepEqual(JSON.parse(f.container.querySelector(`[aria-label="${label}"]`).textContent),expected);}finally{await f.dispose();}
});
