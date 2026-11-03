const {test,expect}=require('@playwright/test');
const {readFile}=require('node:fs/promises');

test.use({launchOptions:{
  ...(process.env.IDENFLU_TEST_CHROMIUM ? {executablePath:process.env.IDENFLU_TEST_CHROMIUM} : {}),
  ignoreDefaultArgs:['--hide-scrollbars'],
}});

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

async function startCoverage(grid) {
  await grid.evaluate(element=>{
    const sc=element.querySelector('.data-grid-scroll');
    window.__gridScrollCoverage={frames:0,maxGap:0,running:true};
    const sample=()=>{
      const state=window.__gridScrollCoverage;
      if(!state.running)return;
      const viewport=sc.getBoundingClientRect();
      const top=Math.max(viewport.top+sc.clientTop,...[...element.querySelectorAll('thead th,thead td')].map(cell=>cell.getBoundingClientRect().bottom));
      const bottom=viewport.top+sc.clientTop+sc.clientHeight;
      let covered=top,gap=0;
      for(const row of element.querySelectorAll('tbody tr[data-grid-row-id]')){
        const bounds=row.getBoundingClientRect();
        if(bounds.bottom<=top||bounds.top>=bottom)continue;
        gap=Math.max(gap,bounds.top-covered);covered=Math.max(covered,bounds.bottom);
      }
      state.frames++;state.maxGap=Math.max(state.maxGap,gap,bottom-covered);
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}
async function stopCoverage(page) {
  return page.evaluate(()=>{window.__gridScrollCoverage.running=false;return window.__gridScrollCoverage;});
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

test('buffered virtual rows keep their DOM across small scrolls and cover rapid wheel scrolling in both directions',async({page})=>{
  const grid=await openGrid(page),scroller=grid.locator('.data-grid-scroll');
  await scroller.scrollIntoViewIfNeeded();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const initial=await records(grid).evaluateAll(elements=>elements.map(element=>element.dataset.gridRowId));
  await scroller.evaluate(element=>{element.scrollTop=100;});
  await expect(scroller).toHaveAttribute('data-scrolling','');
  expect(await records(grid).evaluateAll(elements=>elements.map(element=>element.dataset.gridRowId))).toEqual(initial);
  await startCoverage(grid);
  const bounds=await scroller.boundingBox();
  await page.mouse.move(bounds.x+Math.min(bounds.width/2,120),bounds.y+bounds.height/2);
  for(const delta of [...Array(8).fill(900),...Array(6).fill(-900)]){
    await page.mouse.wheel(0,delta);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  }
  await expect(scroller).not.toHaveAttribute('data-scrolling','');
  const coverage=await stopCoverage(page);
  expect(coverage.frames).toBeGreaterThan(20);
  expect(coverage.maxGap).toBeLessThan(2);
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

test.describe('vertical scrollbar dragging',()=>{
  test('the scrollbar supports track clicks, wheel and keys and disappears for short results',async({page,isMobile},testInfo)=>{
    test.skip(isMobile,'This test exercises desktop mouse scrollbars.');
    const grid=await openGrid(page),scroller=grid.locator('.data-grid-scroll');
    const scrollbar=grid.getByRole('scrollbar',{name:'대용량 데이터그리드 세로 스크롤',exact:true});
    await scrollbar.scrollIntoViewIfNeeded();
    const bounds=await scrollbar.boundingBox();
    const headerHeight=await grid.locator('thead').evaluate(element=>element.getBoundingClientRect().height);
    const viewport=await scroller.boundingBox();
    expect(bounds.y-viewport.y).toBeGreaterThanOrEqual(headerHeight);
    expect(bounds.y-viewport.y).toBeLessThan(headerHeight+3);
    await page.screenshot({path:testInfo.outputPath('native-grid-scrollbars.png')});
    await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height*.7);
    await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
    await scrollbar.focus();
    await scrollbar.press('End');
    await expect(rowFor(grid,'ROW-10000')).toHaveCount(1);
    const current=await scroller.evaluate(element=>element.scrollTop);
    await scrollbar.press('PageUp');
    await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBeLessThan(current-100);
    const beforeWheel=await scroller.evaluate(element=>element.scrollTop);
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await page.mouse.wheel(0,120);
    await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBeGreaterThan(beforeWheel);
    await expect(scrollbar).toHaveAttribute('aria-controls',await scroller.getAttribute('id'));
    const horizontalBar=grid.getByRole('scrollbar',{name:'대용량 데이터그리드 가로 스크롤',exact:true});
    const horizontal=await horizontalBar.evaluate(element=>{
      const rect=element.getBoundingClientRect();
      return {x:rect.x+element.clientWidth*element.clientWidth/element.scrollWidth/2,y:rect.bottom-8,gutter:element.offsetHeight-element.clientHeight};
    });
    expect(horizontal.gutter).toBeGreaterThan(0);
    await page.mouse.move(horizontal.x,horizontal.y);await page.mouse.down();
    await page.mouse.move(horizontal.x+80,horizontal.y,{steps:3});await page.mouse.up();
    await expect.poll(()=>scroller.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);
    await grid.getByRole('searchbox',{name:'대용량 데이터 검색',exact:true}).fill(nameFor(42));
    await expect(records(grid)).toHaveCount(1);
    await expect(scrollbar).toHaveCount(0);
    await expect(grid.locator('.data-grid-scrollbar-thumb')).toHaveCount(0);
    await grid.getByRole('button',{name:'검색 초기화',exact:true}).click();
    await expect(scrollbar).toBeVisible();
    await expectBounded(grid);
  });
  test('10,000 and 50,000 records remain covered while the mouse drags the thumb rapidly',async({page,isMobile})=>{
    test.skip(isMobile,'This regression exercises a desktop mouse scrollbar.');
    const grid=await openGrid(page),scroller=grid.locator('.data-grid-scroll');
    for(const count of [10000,50000]){
      if(count===50000){
        await page.getByRole('combobox',{name:/^가상 스크롤 데이터 수:/}).click();
        await page.getByRole('option',{name:'50,000개',exact:true}).click();
      }
      await expect(grid.locator('table')).toHaveAttribute('aria-rowcount',String(count+2));
      await scroller.scrollIntoViewIfNeeded();
      await scroller.evaluate(async element=>{element.scrollTop=0;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      const scrollbar=grid.getByRole('scrollbar',{name:'대용량 데이터그리드 세로 스크롤',exact:true});
      await expect(scrollbar).toBeVisible();
      await expect.poll(async()=>{
        const native=await scrollbar.evaluate(element=>element.scrollHeight-element.clientHeight);
        const content=await scroller.evaluate(element=>element.scrollHeight-element.clientHeight);
        return Math.abs(native-content);
      }).toBeLessThan(2);
      await expect.poll(()=>scrollbar.evaluate(element=>element.scrollTop)).toBeLessThan(2);
      const rect=await scrollbar.boundingBox();
      const thumbInset=await scrollbar.evaluate(element=>/Mac/.test(navigator.platform) ? 9 : element.offsetWidth-element.clientWidth+9);
      const geometry={x:rect.x+rect.width/2,top:rect.y,height:rect.height,thumbInset};
      await startCoverage(grid);
      await page.mouse.move(geometry.x,geometry.top+geometry.thumbInset);
      await page.mouse.down();
      const reached=[];
      try {
        for(const fraction of [.2,.5,.9,.3,.8,.1,.95,.4]){
          await page.mouse.move(geometry.x,geometry.top+geometry.thumbInset+(geometry.height-geometry.thumbInset*2)*fraction,{steps:2});
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
          reached.push(await scroller.evaluate(element=>element.scrollTop/(element.scrollHeight-element.clientHeight)));
        }
        await page.mouse.move(geometry.x,geometry.top+geometry.height-geometry.thumbInset,{steps:4});
      } finally {await page.mouse.up();}
      // Native thumb travel and snap-back rules vary by OS. The grid must
      // follow the native offset, cover the viewport and keep distant rows reachable.
      await expect.poll(async()=>Math.abs(await scrollbar.evaluate(element=>element.scrollTop)-await scroller.evaluate(element=>element.scrollTop))).toBeLessThan(2);
      reached.push(await scroller.evaluate(element=>element.scrollTop/(element.scrollHeight-element.clientHeight)));
      expect(Math.max(...reached)-Math.min(...reached)).toBeGreaterThan(.3);
      await expect(scroller).not.toHaveAttribute('data-scrolling','');
      const coverage=await stopCoverage(page);
      expect(coverage.frames).toBeGreaterThan(8);
      expect(coverage.maxGap).toBeLessThan(2);
      await expectBounded(grid);
      await scrollbar.focus();
      await scrollbar.press('End');
      await expect(rowFor(grid,`ROW-${String(count).padStart(5,'0')}`)).toHaveCount(1);
      await scrollbar.press('Home');
      await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBeLessThan(2);
      await scrollbar.press('ArrowDown');
      await expect.poll(()=>scroller.evaluate(element=>element.scrollTop)).toBe(40);
    }
  });
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
  await expect(grid.locator('.data-grid-selection')).toHaveCount(0);
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
