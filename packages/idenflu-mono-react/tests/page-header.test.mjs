import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import * as React from 'react';
import {renderToString} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import ts from 'typescript';
import {PageHeader} from '../dist/index.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {url:'http://localhost/', pretendToBeVisual:true});
for (const name of ['window','document','navigator','HTMLElement','Node','Event','MouseEvent']) {
  Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const {createRoot} = await import('react-dom/client');
const {act,createElement:h} = React;
after(()=>dom.window.close());

function fixture() {
  const node=document.createElement('div'); document.body.append(node);
  const root=createRoot(node);
  return {node,render:element=>act(async()=>root.render(element)),dispose:async()=>{await act(async()=>root.unmount());node.remove();}};
}

test('PageHeader server headings keep unique label targets and respect native accessible names',()=>{
  const markup=new JSDOM(renderToString(h('main',null,
    h(PageHeader,{title:'전체 프로젝트',description:'목록을 관리합니다.'}),
    h(PageHeader,{title:'프로젝트 상세',headingLevel:2,titleId:'project-title','aria-describedby':'shared-help'}),
    h(PageHeader,{title:'검색 결과','aria-label':'현재 검색 화면'}),
    h(PageHeader,{title:'역할 관리','aria-label':'역할 화면','aria-labelledby':'external-label'}))));
  try {
    const headers=[...markup.window.document.querySelectorAll('header')];
    const headings=headers.map(header=>header.querySelector('.page-header-title'));
    assert.equal(new Set(headings.map(heading=>heading.id)).size,4);
    assert.equal(headings[0].tagName,'H1');
    assert.equal(headings[1].tagName,'H2');
    assert.equal(headers[0].getAttribute('aria-labelledby'),headings[0].id);
    assert.equal(headings[1].id,'project-title');
    assert.equal(headers[1].getAttribute('aria-describedby'),'shared-help');
    assert.equal(headers[2].getAttribute('aria-label'),'현재 검색 화면');
    assert.equal(headers[2].getAttribute('aria-labelledby'),null);
    assert.equal(headers[3].getAttribute('aria-labelledby'),'external-label');
  } finally {markup.window.close();}
});

test('PageHeader preserves action identity, event handlers and heading semantics when content changes',async()=>{
  const f=fixture(); const ref=React.createRef(); const clicks=[];
  const render=title=>h(PageHeader,{ref,id:'project-page',className:'project-heading',title,headingLevel:2,titleId:'project-name',
    description:h('p',null,'설명 ',h('a',{href:'#details'},'상세 정보')),eyebrow:h('span',null,'업무 공간'),
    actions:h('button',{type:'button',onClick:()=>clicks.push('create')},'새 프로젝트'),
    tabIndex:-1,'data-page':'projects',onClick:()=>clicks.push('header'),style:{padding:'8px'} });
  try {
    await f.render(render(h(React.Fragment,null,'프로젝트 ',h('strong',null,'목록'))));
    const header=f.node.firstElementChild,button=header.querySelector('button');
    assert.equal(ref.current,header);
    assert.equal(header.id,'project-page');
    assert.ok(header.classList.contains('project-heading'));
    assert.equal(header.dataset.page,'projects');
    assert.equal(header.style.padding,'8px');
    assert.equal(header.querySelectorAll('h1').length,0);
    assert.equal(header.querySelector('h2 strong').textContent,'목록');
    assert.equal(header.querySelector('.page-header-description > p > a').textContent,'상세 정보');
    assert.equal(header.lastElementChild.firstElementChild,button);
    for(const name of ['title','description','eyebrow','actions','headinglevel','titleid']) assert.equal(header.hasAttribute(name),false);
    await act(async()=>button.click());
    assert.deepEqual(clicks,['create','header']);
    await f.render(render('변경한 프로젝트'));
    assert.equal(header.querySelector('button'),button);
    assert.equal(header.querySelector('h2').textContent,'변경한 프로젝트');
    assert.equal(header.getAttribute('aria-labelledby'),'project-name');
    await f.render(null);
    assert.equal(ref.current,null);
  } finally {await f.dispose();}
});

test('PageHeader omits empty slots and does not hide meaningful zero-valued content',async()=>{
  const f=fixture();
  try {
    await f.render(h(PageHeader,{title:'기본 제목'}));
    const header=f.node.firstElementChild;
    assert.equal(header.children.length,1);
    assert.equal(header.querySelector('.page-header-content').children.length,1);
    await f.render(h(PageHeader,{title:'조건부 작업 없음',description:'',eyebrow:false,actions:false}));
    assert.equal(header.children.length,1);
    assert.equal(header.querySelector('.page-header-content').children.length,1);
    await f.render(h(PageHeader,{title:'결과',description:0,eyebrow:0,actions:0,headingLevel:3}));
    assert.equal(header.querySelector('h3').textContent,'결과');
    for(const name of ['description','eyebrow','actions']) assert.equal(header.querySelector(`.page-header-${name}`).textContent,'0');
  } finally {await f.dispose();}
});

test('PageHeader public props require a title and expose native heading levels, slots and a header ref',()=>{
  const program=ts.createProgram([fileURLToPath(new URL('./page-header.types.tsx',import.meta.url))],{
    target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,
    jsx:ts.JsxEmit.ReactJSX,lib:['lib.es2020.d.ts','lib.dom.d.ts'],strict:true,skipLibCheck:true,noEmit:true,
  });
  const diagnostics=ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{
    getCanonicalFileName:file=>file,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n',
  }));
});
