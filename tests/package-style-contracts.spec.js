const { test, expect } = require('@playwright/test');
const { React, C, h, renderToStaticMarkup, renderCases } = require('./fixtures/package-style-cases.cjs');
const { buildSync } = require('../packages/idenflu-mono-react/node_modules/esbuild');
const { resolve } = require('node:path');

async function mount(page, testInfo, content) {
  await page.goto('/');
  await page.setContent(`<!doctype html><html lang="ko"><head><style>
    body { font:18px/1.6 Georgia,serif; background:#fff4e5; color:#353535; }
    #cases { display:grid; gap:24px; width:min(760px, calc(100vw - 32px)); }
    [data-case] { min-width:0; }
  </style></head><body><p id="host">기존 앱 본문</p><main id="cases">${content}</main></body></html>`);
  await page.addStyleTag({url:'/packages/idenflu-mono-react/dist/styles.css'});
  await page.locator('html').evaluate((element, theme) => { element.dataset.theme = theme; }, testInfo.project.use.colorScheme);
}

test('public component families own their typography and geometry without document CSS', {tag:['@theme','@mobile']}, async ({page},testInfo) => {
  const fixture = renderCases();
  await mount(page,testInfo,fixture.markup);
  const font = await page.evaluate(() => {
    const probe=document.createElement('span');probe.style.fontFamily='var(--font-family-body)';document.body.append(probe);
    const font=getComputedStyle(probe).fontFamily;probe.remove();return font;
  });
  const broken = await page.evaluate(({cases,font}) => cases.flatMap(({name,selector}) => {
    const element = document.querySelector(`[data-case="${name}"] ${selector}`);
    if (!element) return [`${name}: missing root`];
    const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
    const errors = [];
    if (style.fontFamily !== font) errors.push(`${name}: inherits host font ${style.fontFamily}`);
    if (style.boxSizing !== 'border-box') errors.push(`${name}: missing component box sizing`);
    if (bounds.width <= 0 || bounds.height <= 0) errors.push(`${name}: empty geometry`);
    return errors;
  }), {cases:fixture.cases,font});
  expect(broken).toEqual([]);
  await expect(page.locator('#host')).toHaveCSS('font-family','Georgia, serif');
  await expect(page.locator('#host')).toHaveCSS('font-size','18px');
});

test('NumberField metadata and PageHeader content need no Studio typography or reset', {tag:['@theme','@mobile']}, async ({page},testInfo) => {
  await mount(page,testInfo,renderCases().markup);
  const number = page.locator('[data-case="number-field"]');
  await expect(number.locator('.number-field-meta')).toHaveCSS('font-size','12px');
  await expect(number.locator('.number-field-meta')).toHaveCSS('margin-bottom','0px');
  const error = number.locator('.number-field-feedback');
  await expect(error).toBeVisible();
  const expected = await page.evaluate(() => {
    const probe=document.createElement('span'); probe.style.color='var(--danger-text)'; document.body.append(probe);
    const color=getComputedStyle(probe).color; probe.remove(); return color;
  });
  await expect(error).toHaveCSS('color',expected);
  await expect(error).toHaveCSS('font-size','12px');
  await expect(page.locator('.page-header-description > p')).toHaveCSS('margin-top','0px');
  await expect(page.locator('.page-header-description > p')).toHaveCSS('margin-bottom','0px');
  await expect(page.locator('.data-state')).toHaveCSS('display','grid');
  await expect(page.locator('.data-state')).toHaveCSS('row-gap','16px');
});

test('default Drawer sections have their own spacing and aligned actions', {tag:['@theme','@mobile']}, async ({page},testInfo) => {
  const markup=renderToStaticMarkup(h(C.Drawer,{open:false,onOpenChange(){},'aria-label':'상세'},
    h(C.DrawerHeader,null,h('h2',null,'프로젝트 상세')),
    h(C.DrawerBody,null,h('p',null,'프로젝트의 공유 범위를 확인합니다.')),
    h(C.DrawerFooter,null,h(C.Button,{variant:'outline'},'취소'),h(C.Button,null,'확인')),
  ));
  await mount(page,testInfo,markup);
  await page.locator('dialog').evaluate(element=>element.showModal());
  await expect(page.locator('.drawer-footer')).toHaveCSS('display','flex');
  await expect(page.locator('.drawer-footer')).toHaveCSS('justify-content','flex-end');
  const spacing=await page.locator('dialog').evaluate(element=>{
    const header=element.querySelector('.drawer-header').getBoundingClientRect();
    const body=element.querySelector('.drawer-body').getBoundingClientRect();
    const footer=element.querySelector('.drawer-footer').getBoundingClientRect();
    return {body:body.top-header.bottom,footer:footer.top-body.bottom,overflow:element.scrollWidth>element.clientWidth};
  });
  expect(spacing.body).toBeGreaterThanOrEqual(8);
  expect(spacing.footer).toBeGreaterThanOrEqual(24);
  expect(spacing.overflow).toBe(false);
});

test('native and searchable fields keep disabled and error appearances outside form patterns', {tag:['@theme','@mobile']}, async ({page},testInfo) => {
  const options=[{value:'one',label:'디자인'}];
  const markup=renderToStaticMarkup(h(React.Fragment,null,
    h(C.TextArea,{label:'오류 설명',error:'설명을 확인해주세요.'}),
    h(C.NativeSelect,{label:'오류 분류',error:'분류를 확인해주세요.'},h('option',null,'선택')),
    h(C.TextArea,{label:'비활성 설명',disabled:true,defaultValue:'입력 불가'}),
    h(C.SearchSelect,{label:'비활성 검색',disabled:true,options,defaultValue:'one'}),
    h(C.MultiSelect,{label:'비활성 태그',disabled:true,presentation:'inline',options,defaultValue:['one']}),
    h(C.DatePicker,{label:'비활성 일자',disabled:true,defaultValue:'2026-11-12'}),
  ));
  await mount(page,testInfo,markup);
  const tokens=await page.evaluate(()=>{
    const probe=document.createElement('div'); document.body.append(probe);
    const resolve=(prop,value)=>{probe.style[prop]=`var(${value})`;return getComputedStyle(probe)[prop];};
    const values={danger:resolve('borderColor','--danger'),disabled:resolve('color','--disabled-text'),surface:resolve('backgroundColor','--surface')};
    probe.remove();return values;
  });
  for(const name of ['오류 설명','오류 분류']) {
    const input=page.getByLabel(name,{exact:true});
    await expect(input).toHaveCSS('border-top-color',tokens.danger);
    await input.focus();
    const shadow=await input.evaluate(element=>getComputedStyle(element).boxShadow);
    expect(shadow).not.toBe('none');
    await input.blur();
  }
  for(const name of ['비활성 설명','비활성 검색','비활성 일자']) {
    const input=name==='비활성 검색' ? page.getByRole('combobox',{name,exact:true}) : page.getByLabel(name,{exact:true});
    await expect(input).toBeDisabled();
    await expect(input).toHaveCSS('color',tokens.disabled);
  }
  for(const selector of ['.text-area:disabled','.search-select-control','.multi-inline-control','.date-field']) {
    await expect(page.locator(selector)).toHaveCSS('background-color',tokens.surface);
  }
});

test('all Spinner kinds respect small, medium and large sizes', {tag:['@theme','@mobile']}, async ({page},testInfo) => {
  const kinds=['ring','dual','dots','bars','nova'];
  const markup=renderToStaticMarkup(h(React.Fragment,null,...kinds.flatMap(kind=>['small','medium','large'].map(size=>
    h('div',{'data-kind':kind,'data-spinner-size':size,key:`${kind}-${size}`},h(C.Spinner,{kind,size}))
  ))));
  await mount(page,testInfo,markup);
  for(const kind of kinds) {
    const sizes=await page.locator(`[data-kind="${kind}"] > span`).evaluateAll(elements=>elements.map(element=>({width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height,overflow:element.scrollWidth>element.clientWidth})));
    expect(sizes[0].width,kind).toBeLessThan(sizes[1].width);
    expect(sizes[1].width,kind).toBeLessThan(sizes[2].width);
    expect(sizes.every(size=>!size.overflow),kind).toBe(true);
  }
});

test('standalone calendar disabled days and controls inside Popover retain their styles', {tag:['@theme','@mobile']}, async ({page},testInfo) => {
  await mount(page,testInfo,'<div id="interactive"></div>');
  const bundle=buildSync({
    stdin:{contents:`import * as React from 'react';
      import {createRoot} from 'react-dom/client';
      import {DatePicker,Popover,TextField,Button,Grid,GridItem,Icon} from '@idenflu/mono-react';
      const h=React.createElement;
      createRoot(document.getElementById('interactive')).render(h(React.Fragment,null,
        h(DatePicker,{label:'선택 가능 일자',defaultValue:'2026-11-12',min:'2026-11-12',max:'2026-11-20'}),
        h(Popover,{trigger:'검색 설정',label:'검색 설정',defaultOpen:true},
          h(TextField,{label:'프로젝트 검색',action:h(Button,{iconOnly:true,'aria-label':'검색 실행'},h(Icon,{name:'search'}))})),
        h(Grid,{columns:2,gap:4},h(GridItem,null,'첫 열'),h(GridItem,null,'둘째 열'))
      ));`,resolveDir:resolve(__dirname,'..'),loader:'js'},
    bundle:true,write:false,platform:'browser',format:'iife',logLevel:'silent',
    alias:{'@idenflu/mono-react':resolve(__dirname,'../packages/idenflu-mono-react/dist/index.js')},
    nodePaths:[resolve(__dirname,'../packages/idenflu-mono-react/node_modules')],
  });
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  const search=page.getByRole('button',{name:'검색 실행',exact:true});
  await expect(search).toBeVisible();
  await expect(search).toHaveCSS('margin-top','0px');
  const grid=page.locator('.mono-grid');
  await expect(grid).toHaveCSS('display','grid');
  const columns=await grid.evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' '));
  expect(columns).toHaveLength(2);
  await page.getByRole('button',{name:'달력 열기',exact:true}).click();
  const blocked=page.getByRole('button',{name:'2026년 11월 11일',exact:true});
  const allowed=page.getByRole('button',{name:'2026년 11월 13일',exact:true});
  await expect(blocked).toBeDisabled();
  const disabledColor=await page.evaluate(()=>{
    const probe=document.createElement('span');probe.style.color='var(--disabled-text)';document.body.append(probe);
    const color=getComputedStyle(probe).color;probe.remove();return color;
  });
  await expect(blocked).toHaveCSS('color',disabledColor);
  await blocked.hover({force:true});
  await expect(blocked).toHaveCSS('color',disabledColor);
  await allowed.click();
  await expect(page.getByLabel('선택 가능 일자',{exact:true})).toHaveValue('2026-11-13');
});
