const {test, expect} = require('@playwright/test');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const packageRoot = resolve(__dirname, '../../../packages/idenflu-mono-react');
const requireReact = createRequire(resolve(packageRoot, 'package.json'));
const { build } = requireReact('esbuild');
let fixtureScript;

test.beforeAll(async () => {
  const result = await build({stdin:{resolveDir:packageRoot, loader:'tsx', contents:`
    import * as React from 'react';
    import {createRoot} from 'react-dom/client';
    import {Button, Dialog, Drawer} from './src';
    function Fixture() {
      const [open,setOpen]=React.useState(false),[nested,setNested]=React.useState(false),[mounted,setMounted]=React.useState(true);
      return <main style={{minHeight:'2400px'}}><section style={{paddingTop:320}}>
        <div id="width-marker" style={{width:'60%',marginInline:'auto'}}>배경 정렬 기준</div>
        <Button onClick={()=>{setMounted(true);setNested(false);setOpen(true);}}>모달 열기</Button>
        {mounted&&<Dialog open={open} onOpenChange={setOpen} aria-label="스크롤 잠금 시험">
          <h2>스크롤 잠금 시험</h2>
          <Button onClick={()=>setNested(true)}>중첩 창 열기</Button>
          <Button onClick={()=>setOpen(false)}>닫기</Button>
          <Drawer open={nested} onOpenChange={setNested} aria-label="중첩 창">
            <h2>중첩 창</h2><Button onClick={()=>setNested(false)}>중첩 창 닫기</Button>
            <Button onClick={()=>setMounted(false)}>모달 모두 제거</Button>
          </Drawer>
        </Dialog>}
      </section></main>;
    }
    createRoot(document.getElementById('fixture')).render(<React.StrictMode><Fixture/></React.StrictMode>);
  `},bundle:true,write:false,format:'iife',platform:'browser',target:'es2020'});
  fixtureScript = result.outputFiles[0].text;
});

async function mount(page) {
  await page.goto('/');
  await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="/systems/idenflu-mono/docs-dist/components.css">
    <style>html {overflow-y:scroll} html::-webkit-scrollbar {width:18px} html::-webkit-scrollbar-thumb {background:#888}</style>
    </head><body><div id="fixture"></div></body></html>`);
  await page.addScriptTag({content:fixtureScript});
  return page.getByRole('button', {name:'모달 열기', exact:true});
}

const state = page => page.evaluate(() => {
  const bounds = document.getElementById('width-marker').getBoundingClientRect();
  return {x:bounds.x,width:bounds.width,y:scrollY,overflow:getComputedStyle(document.documentElement).overflowY,bodyOverflow:getComputedStyle(document.body).overflowY};
});

test('modal locks wheel scrolling without moving the page or its horizontal alignment', {tag:'@mobile'}, async ({page}) => {
  const opener = await mount(page);
  // Focus before measuring so activation does not scroll the opener into view.
  await opener.focus();
  await page.evaluate(() => scrollTo(0, 150));
  const before = await state(page);
  await page.keyboard.press('Enter');
  const during = await state(page);
  expect(during.overflow).toBe('hidden');
  expect(during.bodyOverflow).toBe('hidden');
  expect(during.y).toBe(before.y);
  expect(during.x).toBeCloseTo(before.x, 1);
  expect(during.width).toBeCloseTo(before.width, 1);
  await page.mouse.move(4, 120);
  await page.mouse.wheel(0, 600);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect((await state(page)).y).toBe(before.y);
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  const after = await state(page);
  expect(after.overflow).toBe('scroll');
  expect(after.y).toBe(before.y);
  expect(after.x).toBeCloseTo(before.x, 1);
  expect(after.width).toBeCloseTo(before.width, 1);
});

test('nested modal closing keeps the page locked and unmounting both restores it', {tag:'@mobile'}, async ({page}) => {
  const opener = await mount(page);
  await opener.click();
  const outer = page.getByRole('dialog', {name:'스크롤 잠금 시험', exact:true});
  const innerTrigger = outer.getByRole('button', {name:'중첩 창 열기', exact:true});
  await innerTrigger.click();
  const inner = page.getByRole('dialog', {name:'중첩 창', exact:true});
  await expect(inner).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(inner).toBeHidden();
  await expect(innerTrigger).toBeFocused();
  expect((await state(page)).overflow).toBe('hidden');
  await innerTrigger.click();
  await inner.getByRole('button', {name:'모달 모두 제거', exact:true}).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  expect((await state(page)).overflow).toBe('scroll');
  expect((await state(page)).bodyOverflow).toBe('visible');
});

test('short pages do not gain an empty scrollbar gutter when a modal opens', {tag:'@mobile'}, async ({page}) => {
  const opener = await mount(page);
  await page.evaluate(() => {
    document.documentElement.style.overflowY='auto';
    document.querySelector('main').style.minHeight='0';
    document.querySelector('main > section').style.paddingTop='24px';
  });
  const before = await state(page);
  await opener.click();
  const during = await state(page);
  expect(during.width).toBeCloseTo(before.width, 1);
  expect(during.x).toBeCloseTo(before.x, 1);
  await page.keyboard.press('Escape');
  expect((await state(page)).overflow).toBe('auto');
});
