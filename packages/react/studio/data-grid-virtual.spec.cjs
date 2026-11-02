const {test,expect}=require('@playwright/test');
const {readFile}=require('node:fs/promises');

const route='/systems/idenflu-mono/index.html#/components/data-grid';
const gridFor=page=>page.getByRole('group',{name:'대용량 데이터그리드',exact:true});
const records=grid=>grid.locator('tbody tr[data-grid-row-id]');
const rowFor=(grid,id)=>grid.locator(`tbody tr[data-grid-row-id="${id}"]`);
const nameFor=index=>`가상 프로젝트 ${String(index).padStart(5,'0')}`;
async function openGrid(page) {
  await page.goto(route);
  const grid=gridFor(page);
  await grid.scrollIntoViewIfNeeded();
  await expect.poll(()=>records(grid).count()).toBeGreaterThan(0);
  return grid;
}
async function jump(grid,fraction) {
  await grid.locator('.data-grid-scroll').evaluate((element,value)=>{element.scrollTop=(element.scrollHeight-element.clientHeight)*value;},fraction);
}
async function expectBounded(grid) {
  await expect.poll(()=>records(grid).count()).toBeGreaterThan(0);
  expect(await records(grid).count()).toBeLessThan(80);
}

test('10,000 virtual rows stay bounded while middle and final records remain reachable',async({page})=>{
  const grid=await openGrid(page);
  await expectBounded(grid);
  await expect(rowFor(grid,'ROW-00001')).toHaveCount(1);
  await expect(grid.locator('.pagination')).toHaveCount(0);
  await jump(grid,0.5);
  await expect.poll(async()=>Number((await records(grid).first().getAttribute('data-grid-row-id')).slice(4))).toBeGreaterThan(3000);
  expect(Number((await records(grid).first().getAttribute('data-grid-row-id')).slice(4))).toBeLessThan(7000);
  await expectBounded(grid);
  await jump(grid,1);
  const last=rowFor(grid,'ROW-10000');
  await expect(last).toHaveCount(1);
  await expect.poll(async()=>{
    const end=await last.boundingBox();
    const viewport=await grid.locator('.data-grid-scroll').boundingBox();
    return end&&viewport ? Math.abs(viewport.y+viewport.height-end.y-end.height) : 1000;
  }).toBeLessThan(18);
  await expectBounded(grid);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
});

test('search, sorting and data shrink reset the virtual scroll without losing the result model',async({page})=>{
  const grid=await openGrid(page),scroller=grid.locator('.data-grid-scroll');
  await jump(grid,0.8);
  const search=grid.getByRole('searchbox',{name:'대용량 데이터 검색',exact:true});
  await search.fill(nameFor(42));
  await expect(rowFor(grid,'ROW-00042')).toHaveCount(1);
  await expect(records(grid)).toHaveCount(1);
  await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBeLessThan(2);
  await grid.getByRole('button',{name:'검색 초기화',exact:true}).click();
  await expect(rowFor(grid,'ROW-00001')).toHaveCount(1);
  await jump(grid,0.7);
  await grid.getByRole('button',{name:'프로젝트',exact:true}).click();
  await expect(rowFor(grid,'ROW-00001')).toHaveCount(1);
  await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBeLessThan(2);
  await jump(grid,0.7);
  await grid.getByRole('button',{name:'프로젝트',exact:true}).click();
  await expect(rowFor(grid,'ROW-10000')).toHaveCount(1);
  await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBeLessThan(2);
  await page.getByRole('combobox',{name:/^가상 스크롤 데이터 수:/}).click();
  await page.getByRole('option',{name:'100개',exact:true}).click();
  await expect(grid.locator('table')).toHaveAttribute('aria-rowcount','102');
  await expect(rowFor(grid,'ROW-00100')).toHaveCount(1);
  await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBeLessThan(2);
  await expectBounded(grid);
});

test('virtual rows remeasure after density and viewport changes without overlapping or dropping the tail',async({page,isMobile})=>{
  const grid=await openGrid(page);
  await jump(grid,0.5);
  await page.getByRole('group',{name:'가상 스크롤 밀도',exact:true}).getByRole('button',{name:'Compact',exact:true}).click();
  await page.setViewportSize({width:isMobile?320:1080,height:isMobile?860:760});
  await expectBounded(grid);
  const bounds=await records(grid).evaluateAll(elements=>elements.map(element=>{
    const rect=element.getBoundingClientRect();return {top:rect.top,bottom:rect.bottom};
  }));
  for(let index=1;index<bounds.length;index++) expect(bounds[index].top).toBeGreaterThanOrEqual(bounds[index-1].bottom-1);
  await jump(grid,1);
  await expect(rowFor(grid,'ROW-10000')).toHaveCount(1);
  await expectBounded(grid);
  await page.getByRole('group',{name:'가상 스크롤 밀도',exact:true}).getByRole('button',{name:'Default',exact:true}).click();
  await jump(grid,1);
  await expect(rowFor(grid,'ROW-10000')).toHaveCount(1);
  await expectBounded(grid);
});

test('selection survives virtual unmounting and CSV exports offscreen selected records',async({page})=>{
  const grid=await openGrid(page);
  await page.evaluate(() => { window.showSaveFilePicker=undefined; });
  await rowFor(grid,'ROW-00001').getByRole('checkbox',{name:`${nameFor(1)} 선택`,exact:true}).check();
  await grid.getByRole('searchbox',{name:'대용량 데이터 검색',exact:true}).focus();
  await jump(grid,1);
  await expect(rowFor(grid,'ROW-10000')).toHaveCount(1);
  await rowFor(grid,'ROW-10000').getByRole('checkbox',{name:`${nameFor(10000)} 선택`,exact:true}).check();
  await grid.getByRole('searchbox',{name:'대용량 데이터 검색',exact:true}).fill(nameFor(42));
  await expect(grid.locator('.data-grid-selection')).toContainText('2개 선택됨');
  const downloading=page.waitForEvent('download');
  page.once('dialog',dialog => dialog.accept());
  await grid.getByRole('button',{name:'선택한 행 내보내기',exact:true}).click();
  const downloaded=await downloading;
  const csv=await readFile(await downloaded.path(),'utf8');
  expect(csv).toContain(nameFor(1));expect(csv).toContain(nameFor(10000));expect(csv).not.toContain(nameFor(42));
  expect(csv.trimEnd().split('\r\n').length-1).toBe(2);
  await grid.getByRole('button',{name:'검색 초기화',exact:true}).click();
  await grid.getByRole('checkbox',{name:'검색 결과 전체 선택',exact:true}).check();
  await expect(grid.locator('.data-grid-selection')).toContainText('10000개 선택됨');
  await expectBounded(grid);
  const allDownloading=page.waitForEvent('download');
  page.once('dialog',dialog => dialog.accept());
  await grid.getByRole('button',{name:'CSV 내보내기',exact:true}).click();
  const all=await allDownloading;
  const allCsv=await readFile(await all.path(),'utf8');
  expect(allCsv.trimEnd().split('\r\n').length-1).toBe(10000);
});

test('an offscreen editor remains mounted without rendering the intervening thousands of rows',async({page})=>{
  const grid=await openGrid(page);
  const original=`${nameFor(1)} 프로젝트 편집`;
  await grid.getByRole('button',{name:original,exact:true}).click();
  const editor=grid.getByRole('textbox',{name:'프로젝트',exact:true});
  await editor.fill('스크롤 중인 초안');
  await jump(grid,1);
  await expect(rowFor(grid,'ROW-10000')).toHaveCount(1);
  await expect(rowFor(grid,'ROW-00001')).toHaveCount(1);
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('스크롤 중인 초안');
  await expectBounded(grid);
  await editor.press('Escape');
  const origin=grid.getByRole('button',{name:original,exact:true});
  await expect(origin).toBeFocused();
  await origin.click();
  await editor.fill('확정한 가상 프로젝트');
  await editor.press('Enter');
  await expect(rowFor(grid,'ROW-00001')).toContainText('확정한 가상 프로젝트');
  await expect(grid.getByRole('button',{name:'확정한 가상 프로젝트 프로젝트 편집',exact:true})).toBeFocused();
});

test('validation may expand an edited virtual row without overlap or lost focus',async({page})=>{
  const grid=await openGrid(page),first=rowFor(grid,'ROW-00001'),second=rowFor(grid,'ROW-00002');
  const before=await first.boundingBox();
  await first.getByRole('button',{name:`${nameFor(1)} 프로젝트 편집`,exact:true}).click();
  const editor=grid.getByRole('textbox',{name:'프로젝트',exact:true});
  await editor.fill('X');await editor.press('Enter');
  await expect(editor).toHaveAttribute('aria-invalid','true');
  await expect(grid.getByRole('alert')).toHaveText('프로젝트 이름은 2자 이상 입력해주세요.');
  await expect.poll(async()=>{
    const one=await first.boundingBox(),two=await second.boundingBox();
    return one&&two ? two.y-(one.y+one.height) : -100;
  }).toBeGreaterThanOrEqual(-1);
  const expanded=await first.boundingBox();
  expect(expanded.height).toBeGreaterThanOrEqual(before.height);
  await expect(editor).toBeFocused();
  await jump(grid,1);
  await expect(rowFor(grid,'ROW-10000')).toHaveCount(1);
  await expect(editor).toHaveAttribute('aria-invalid','true');
  await expectBounded(grid);
  await editor.press('Escape');
});

test('focused row controls stay mounted until focus moves outside that row',async({page})=>{
  const grid=await openGrid(page);
  const check=rowFor(grid,'ROW-00001').getByRole('checkbox',{name:`${nameFor(1)} 선택`,exact:true});
  await check.focus();await jump(grid,1);
  await expect(rowFor(grid,'ROW-10000')).toHaveCount(1);
  await expect(check).toBeFocused();await expectBounded(grid);
  await grid.getByRole('searchbox',{name:'대용량 데이터 검색',exact:true}).focus();
  await expect(rowFor(grid,'ROW-00001')).toHaveCount(0);
  await expectBounded(grid);
});

test('virtual table metadata uses full logical row counts and excludes spacers',async({page})=>{
  const grid=await openGrid(page),table=grid.locator('table');
  const headerRows=await table.locator('thead tr').count();
  await expect(table).not.toHaveAttribute('role','grid');
  await expect(table).toHaveAttribute('aria-rowcount',String(10000+headerRows));
  const headers=await table.locator('thead tr').evaluateAll(elements=>elements.map(element=>element.getAttribute('aria-rowindex')));
  expect(headers).toEqual(Array.from({length:headerRows},(_,index)=>String(index+1)));
  await jump(grid,0.5);
  await expect.poll(async()=>Number((await records(grid).first().getAttribute('data-grid-row-id')).slice(4))).toBeGreaterThan(3000);
  const logical=await records(grid).evaluateAll(elements=>elements.map(element=>({id:element.dataset.gridRowId,index:Number(element.getAttribute('aria-rowindex'))})));
  for(const record of logical) expect(record.index).toBe(Number(record.id.slice(4))+headerRows);
  for(let index=1;index<logical.length;index++) expect(logical[index].index).toBeGreaterThan(logical[index-1].index);
  const spacers=table.locator('tbody tr[aria-hidden="true"]');
  expect(await spacers.count()).toBeGreaterThan(0);
  expect(await spacers.evaluateAll(elements=>elements.every(element=>!element.hasAttribute('aria-rowindex')))).toBe(true);
});
