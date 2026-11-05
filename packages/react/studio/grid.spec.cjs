const {test, expect} = require('@playwright/test');
const {build} = require('esbuild');
let fixtureScript;

test.beforeAll(async () => {
  const result = await build({stdin:{resolveDir:__dirname,loader:'tsx',contents:`
    import * as React from 'react';
    import {createRoot} from 'react-dom/client';
    import {Grid, GridItem} from '../src';
    function Fixture() {
      return <>
        <Grid id="responsive" columns={{base:1,sm:2,md:3,lg:4,xl:6}} gap={6}>
          {Array.from({length:6},(_,i)=><div key={i} style={{height:24}}>{i+1}</div>)}
        </Grid>
        <Grid id="spans" columns={{base:1,sm:2,md:3}} gap={4}>
          <GridItem id="numeric-span" colSpan={2}>너비 두 열</GridItem>
          <GridItem id="full-span" colSpan="full">전체 너비</GridItem>
          <GridItem id="clamped-span" colSpan={9}>가용 너비 안의 병합</GridItem>
        </Grid>
        <Grid id="outer" columns={4} gap={8} alignItems="end" justifyItems="center">
          <GridItem colSpan="full" style={{width:'100%'}}>
            <Grid id="nested">
              <GridItem id="nested-item">독립 기본값</GridItem>
              <GridItem id="nested-full" colSpan="full">전체 너비</GridItem>
            </Grid>
          </GridItem>
        </Grid>
        <Grid id="axis-gaps" columns={2} gap={{base:2,md:8}} rowGap={{sm:4,lg:6}} columnGap={10}>
          <div>첫째</div><div>둘째</div>
        </Grid>
      </>;
    }
    createRoot(document.getElementById('fixture')).render(<Fixture/>);
  `},bundle:true,write:false,format:'iife',platform:'browser',target:'es2020'});
  fixtureScript = result.outputFiles[0].text;
});

async function mount(page) {
  await page.goto('/');
  await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="/packages/react/dist/styles.css">
    <style>body{margin:0}#fixture{padding:16px}#fixture>div+div{margin-top:24px}</style>
    </head><body><div id="fixture"></div></body></html>`);
  await page.addScriptTag({content:fixtureScript});
  await expect(page.locator('#responsive')).toHaveCSS('display','grid');
}
const columnCount = locator => locator.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);

test('published Grid CSS handles every breakpoint and numeric spans without implicit overflow', async ({page}) => {
  await mount(page);
  expect(await page.evaluate(() => CSS.supports('grid-column', 'span min(2, 3)'))).toBe(true);
  for (const [width, columns] of [[320,1],[599,1],[600,2],[899,2],[900,3],[1199,3],[1200,4],[1439,4],[1440,6]]) {
    await page.setViewportSize({width,height:800});
    await expect.poll(() => columnCount(page.locator('#responsive'))).toBe(columns);
    await expect(page.locator('#responsive')).toHaveCSS('row-gap','24px');
    const grid = await page.locator('#spans').boundingBox();
    const span = await page.locator('#numeric-span').boundingBox();
    const availableColumns = width < 600 ? 1 : width < 900 ? 2 : 3;
    const cellWidth = (grid.width - (availableColumns - 1) * 16) / availableColumns;
    expect(span.width).toBeCloseTo(Math.min(2, availableColumns) * cellWidth + (Math.min(2, availableColumns) - 1) * 16, 0);
    expect((await page.locator('#full-span').boundingBox()).width).toBeCloseTo(grid.width, 0);
    expect((await page.locator('#clamped-span').boundingBox()).width).toBeCloseTo(grid.width, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});

test('nested grids and axis overrides stay independent and follow spacing tokens', async ({page}) => {
  await mount(page);
  await expect(page.locator('#outer')).toHaveCSS('align-items','end');
  await expect.poll(() => columnCount(page.locator('#nested'))).toBe(1);
  await expect(page.locator('#nested')).toHaveCSS('row-gap','24px');
  await expect(page.locator('#nested')).toHaveCSS('align-items','stretch');
  await expect(page.locator('#nested')).toHaveCSS('justify-items','stretch');
  await expect(page.locator('#nested-item')).toHaveCSS('align-self','auto');
  const nested = await page.locator('#nested').boundingBox();
  expect((await page.locator('#nested-item').boundingBox()).width).toBeCloseTo(nested.width, 0);
  for (const [width, rowGap] of [[320,8],[600,16],[900,16],[1200,24]]) {
    await page.setViewportSize({width,height:800});
    await expect(page.locator('#axis-gaps')).toHaveCSS('row-gap',`${rowGap}px`);
    await expect(page.locator('#axis-gaps')).toHaveCSS('column-gap','40px');
  }
  await page.evaluate(() => document.documentElement.style.setProperty('--space-unit','8px'));
  await expect(page.locator('#axis-gaps')).toHaveCSS('row-gap','48px');
  await expect(page.locator('#axis-gaps')).toHaveCSS('column-gap','80px');
});

test('Grid demos preserve form behavior, respond to controls and avoid horizontal overflow', {tag:'@mobile'}, async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/grid');
  const section = page.locator('#grid-spans');
  const name = section.getByRole('textbox',{name:'프로젝트 이름',exact:true});
  const team = section.getByRole('combobox',{name:/^담당 팀:/});
  await team.click();
  await page.getByRole('option',{name:'플랫폼 개발',exact:true}).click();
  const visibility = section.getByRole('combobox',{name:/^공유 범위:/});
  await visibility.focus();
  await visibility.press('ArrowDown');
  await page.getByRole('option',{name:'워크스페이스에 공개',exact:true}).click();
  expect(await section.locator('form').evaluate(form => Object.fromEntries(new FormData(form)))).toMatchObject({team:'engineering',visibility:'workspace'});
  await name.fill('');
  await section.getByRole('button',{name:'프로젝트 만들기',exact:true}).click();
  await expect(name).toBeFocused();
  await expect(section.getByText('프로젝트 이름을 입력해주세요.',{exact:true})).toBeVisible();
  await name.fill('Grid 예제 프로젝트');
  await section.getByRole('button',{name:'프로젝트 만들기',exact:true}).click();
  await expect(section.getByRole('status')).toHaveText('프로젝트를 만들었습니다: Grid 예제 프로젝트');
  await section.getByRole('button',{name:'입력 초기화',exact:true}).click();
  await expect(name).toHaveValue('디자인 시스템 개선');
  await expect(team).toContainText('프로덕트 디자인');
  await expect(visibility).toContainText('팀원에게 공개');
  await page.getByRole('combobox',{name:/^Grid 간격:/}).click();
  await page.getByRole('option',{name:'8 · 기본 32px',exact:true}).click();
  await expect(page.locator('#grid-spacing-preview')).toHaveCSS('column-gap','32px');
  await page.getByRole('combobox',{name:/^Grid 세로 정렬:/}).click();
  await page.getByRole('option',{name:'가운데 · center',exact:true}).click();
  await expect(page.locator('#grid-spacing-preview')).toHaveCSS('align-items','center');
  const cards = page.locator('#grid-responsive-cards');
  await expect.poll(() => columnCount(cards)).toBe(page.viewportSize().width < 600 ? 1 : page.viewportSize().width < 1200 ? 2 : 3);
  const grid = await page.locator('#grid-form-layout').boundingBox();
  expect((await page.locator('#grid-form-notice').boundingBox()).width).toBeCloseTo(grid.width, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('migrated field, size and form layouts preserve their spacing and full-width rows', {tag:'@mobile'}, async ({page}) => {
  const mobile = page.viewportSize().width < 600;
  for (const [route, selector, count, rowGap, columnGap] of [
    ['components/text-fields','.react-studio-field-grid',2,24,32],
    ['components/number-fields','.react-studio-size-grid',3,24,24],
    ['patterns/form/basic','.form-pattern-grid',2,20,24],
  ]) {
    await page.goto(`/systems/idenflu-mono/index.html#/${route}`);
    const grid = page.locator(selector).first();
    await expect(grid).toHaveClass(/\bmono-grid\b/);
    await expect.poll(() => columnCount(grid)).toBe(mobile ? 1 : count);
    await expect(grid).toHaveCSS('row-gap',`${rowGap}px`);
    await expect(grid).toHaveCSS('column-gap',`${columnGap}px`);
    for (const item of await grid.locator(':scope > .mono-grid-item').all()) {
      expect((await item.boundingBox()).width).toBeCloseTo((await grid.boundingBox()).width, 0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});
