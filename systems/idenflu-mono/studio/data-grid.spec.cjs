const { test, expect } = require('@playwright/test');
const { readFile } = require('node:fs/promises');

const route = '/systems/idenflu-mono/index.html#/components/data-grid';
const projectGrid = page => page.getByRole('group', {name:'프로젝트 데이터그리드',exact:true});

test('data grid supports search, current-page selection and page size without document overflow', async ({page}) => {
  await page.goto(route);
  const grid = projectGrid(page);
  await expect(page.getByRole('heading',{level:1})).toHaveText('Data grid');
  await grid.getByRole('checkbox',{name:'현재 페이지 전체 선택',exact:true}).check();
  await expect(grid.locator('.data-grid-selection-count')).toContainText('5개 선택됨');
  await grid.getByRole('button',{name:'2페이지',exact:true}).click();
  await expect(grid.getByRole('checkbox',{name:'현재 페이지 전체 선택',exact:true})).not.toBeChecked();
  await expect(grid.locator('.data-grid-selection-count')).toContainText('5개 선택됨');
  await grid.getByRole('searchbox',{name:'프로젝트 검색',exact:true}).fill('없는프로젝트XYZ');
  await expect(grid.locator('tbody')).toContainText('검색 결과가 없습니다.');
  await expect(grid.locator('.data-grid-selection-count')).toContainText('5개 선택됨');
  await grid.locator('.data-grid-state').getByRole('button',{name:'조건 초기화',exact:true}).click();
  await expect(grid.getByRole('button',{name:'1페이지',exact:true})).toHaveAttribute('aria-current','page');
  await grid.getByRole('combobox',{name:/^페이지당 행 수:/}).click();
  await page.getByRole('option',{name:'10개',exact:true}).click();
  await expect(grid.locator('tbody tr')).toHaveCount(10);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('density and selection actions share a stable, accessible top toolbar',{tag:'@mobile'}, async ({page}) => {
  await page.goto(route);
  const grid=projectGrid(page),toolbar=grid.locator('.data-grid-toolbar');
  await expect(page.getByRole('group',{name:'데이터그리드 밀도',exact:true})).toHaveCount(0);
  const density=toolbar.getByRole('button',{name:'촘촘한 행 간격',exact:true});
  const first=grid.locator('tbody tr[data-grid-row-id]').first();
  const beforeDensity=await first.evaluate(row=>row.getBoundingClientRect().height);
  await density.focus();await density.press('Space');
  await expect(density).toHaveAttribute('aria-pressed','true');
  await expect(grid).toHaveAttribute('data-density','compact');
  expect(await first.evaluate(row=>row.getBoundingClientRect().height)).toBeLessThan(beforeDensity);
  const ids=await grid.locator('tbody tr[data-grid-row-id]').evaluateAll(rows=>rows.map(row=>row.dataset.gridRowId));
  const height=await toolbar.evaluate(el=>el.getBoundingClientRect().height);
  await first.getByRole('checkbox').check();
  await expect(toolbar.locator('.data-grid-selection-count')).toHaveText('1개 선택됨');
  await expect(grid.locator(':scope > .data-grid-selection')).toHaveCount(0);
  expect(await toolbar.evaluate(el=>el.getBoundingClientRect().height)).toBeCloseTo(height,0);
  for(const name of ['표시 열','CSV 내보내기','선택한 행 내보내기','선택 해제']) {
    const button=toolbar.getByRole('button',{name,exact:true});
    await expect(button).toBeVisible();
    await expect(button).toHaveText('');
  }
  await density.press('Space');
  await expect(grid).toHaveAttribute('data-density','default');
  await expect(first.getByRole('checkbox')).toBeChecked();
  expect(await grid.locator('tbody tr[data-grid-row-id]').evaluateAll(rows=>rows.map(row=>row.dataset.gridRowId))).toEqual(ids);
  await toolbar.getByRole('button',{name:'선택 해제',exact:true}).focus();
  await toolbar.getByRole('button',{name:'선택 해제',exact:true}).press('Enter');
  await expect(toolbar.locator('.data-grid-selection-count')).toHaveCount(0);
  await expect(grid.getByRole('checkbox',{name:'현재 페이지 전체 선택',exact:true})).toBeFocused();
  expect(await toolbar.evaluate(el=>el.getBoundingClientRect().height)).toBeCloseTo(height,0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('icon column settings open from the keyboard and fit the viewport',{tag:'@mobile'}, async ({page}) => {
  await page.goto(route);
  const grid=projectGrid(page),button=grid.getByRole('button',{name:'표시 열',exact:true});
  await button.focus();
  await expect(grid.getByRole('tooltip',{name:'표시 열',exact:true})).toBeVisible();
  await button.press('Enter');
  const popup=grid.getByRole('region',{name:'프로젝트 데이터그리드 표시 열',exact:true});
  await expect(popup).toBeVisible();
  await expect(grid.getByRole('tooltip',{name:'표시 열',exact:true})).toBeHidden();
  const bounds=await popup.boundingBox(),width=page.viewportSize().width;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
  await page.keyboard.press('Escape');
  await expect(popup).toBeHidden();
  await expect(button).toBeFocused();
});

test('project examples include 120 records with a 100-row page and reachable final record', async ({page}) => {
  await page.goto(route);
  const grid = projectGrid(page);
  await expect(page.getByText('120개 프로젝트에서', {exact:false})).toBeVisible();
  await grid.getByRole('combobox',{name:/^페이지당 행 수:/}).click();
  await page.getByRole('option',{name:'100개',exact:true}).click();
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(100);
  await grid.getByRole('button',{name:'2페이지',exact:true}).click();
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(20);
  await grid.getByRole('searchbox',{name:'프로젝트 검색',exact:true}).fill('사용자 프로필 운영 자동화');
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(1);
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveAttribute('data-grid-row-id','PRJ-120');
});

test('Shift-click adds a secondary sort and ordinary click returns to single sorting', async ({page}) => {
  await page.goto(route);
  const grid=projectGrid(page),team=grid.getByRole('button',{name:'담당 팀',exact:true}),owner=grid.getByRole('button',{name:'담당자',exact:true});
  await team.click();
  await grid.getByRole('button',{name:'2페이지',exact:true}).click();
  await owner.click({modifiers:['Shift']});
  await expect(grid.getByRole('button',{name:'1페이지',exact:true})).toHaveAttribute('aria-current','page');
  await expect(team.locator('.data-grid-sort-priority')).toHaveText('1');
  await expect(owner.locator('.data-grid-sort-priority')).toHaveText('2');
  await expect(grid.locator('th[aria-sort="ascending"]')).toHaveCount(1);
  await expect(owner).toHaveAccessibleDescription(/2순위 오름차순/);
  // Node tests cover the direction/removal cycle; retain real modifier and plain clicks.
  await owner.click();
  await expect(grid.locator('.data-grid-sort-priority')).toHaveCount(0);
  await expect(owner.locator('..')).toHaveAttribute('aria-sort','descending');
  await expect(team.locator('..')).toHaveAttribute('aria-sort','none');
});

test('clicking row content selects once and the focused checkbox retains native keyboard behavior',{tag:'@mobile'}, async ({page}) => {
  await page.goto(route);
  const grid=projectGrid(page),row=grid.locator('tbody tr[data-grid-row-id]').first();
  const content=row.locator('td').nth(1).locator('strong'),checkbox=row.getByRole('checkbox');
  await content.click();
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeFocused();
  await expect(grid.locator('.data-grid-selection-count')).toContainText('1개 선택됨');
  await checkbox.press('Space');
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await content.click();
  await expect(checkbox).not.toBeChecked();
});

test('column filters combine, keep numeric zero, and reset empty results', async ({page}) => {
  await page.goto(route);
  const grid = projectGrid(page);
  await grid.getByRole('textbox',{name:'프로젝트 필터',exact:true}).fill('디자인 시스템');
  await grid.getByRole('spinbutton',{name:'예산 최솟값',exact:true}).fill('0');
  await grid.getByRole('spinbutton',{name:'예산 최댓값',exact:true}).fill('0');
  await expect(grid.locator('tbody tr')).toHaveCount(1);
  await expect(grid.locator('tbody')).toContainText('디자인 시스템 v2');
  await expect(grid.locator('tbody')).toContainText('0원');
  await grid.getByRole('spinbutton',{name:'예산 최솟값',exact:true}).fill('1');
  await expect(grid.locator('tbody')).toContainText('검색 결과가 없습니다.');
  await grid.getByRole('button',{name:'필터 초기화',exact:true}).click();
  await expect(grid.locator('tbody tr')).toHaveCount(5);
});

test('select filters escape a short scroll area and keep all options clickable',{tag:'@mobile'}, async ({page}) => {
  await page.goto(route);
  const grid = projectGrid(page);
  await grid.getByRole('textbox',{name:'프로젝트 필터',exact:true}).fill('디자인 시스템');
  await expect(grid.locator('tbody tr')).toHaveCount(1);
  await grid.getByRole('combobox',{name:'담당 팀 필터: 전체',exact:true}).click();
  const last = page.getByRole('option',{name:'브랜드 디자인',exact:true});
  await expect.poll(()=>last.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    return document.elementFromPoint(rect.x+10,rect.y+10)?.closest('[role="option"]') === element;
  })).toBe(true);
  await last.click();
  await expect(grid.locator('tbody')).toContainText('검색 결과가 없습니다.');
  await grid.getByRole('button',{name:'조건 초기화',exact:true}).click();
  await grid.getByRole('combobox',{name:'담당 팀 필터: 전체',exact:true}).click();
  await page.getByRole('option',{name:'브랜드 디자인',exact:true}).click();
  const team = grid.getByRole('combobox',{name:'담당 팀 필터: 브랜드 디자인',exact:true});
  await team.press('ArrowDown');
  await team.press('Home');
  await team.press('Enter');
  await expect(grid.getByRole('combobox',{name:'담당 팀 필터: 전체',exact:true})).toHaveAttribute('aria-expanded','false');
});

test('column widths are keyboard adjustable and headers stay pinned while scrolling',{tag:'@mobile'}, async ({page,isMobile}) => {
  await page.goto(route);
  const grid = projectGrid(page);
  const separator = grid.getByRole('separator',{name:'프로젝트 열 너비',exact:true});
  const initial = Number(await separator.getAttribute('aria-valuenow'));
  await separator.focus();
  await separator.press('ArrowRight');
  await expect(separator).toHaveAttribute('aria-valuenow',String(initial + 10));
  await separator.press('Shift+ArrowLeft');
  await expect(separator).toHaveAttribute('aria-valuenow',String(initial + 9));
  await separator.press('Home');
  await expect(separator).toHaveAttribute('aria-valuenow','160');
  if (!isMobile) {
    const bounds = await separator.boundingBox();
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await page.mouse.down();
    await page.mouse.move(bounds.x+bounds.width/2+40,bounds.y+bounds.height/2,{steps:4});
    await page.mouse.up();
    await expect(separator).toHaveAttribute('aria-valuenow','200');
  }
  const first = grid.locator('tbody tr').first().locator('td').nth(1);
  const before = await first.boundingBox();
  await grid.locator('.data-grid-scroll').evaluate(element=>{element.scrollLeft=300;});
  const after = await first.boundingBox();
  if (isMobile) expect(after.x).toBeLessThan(before.x);
  else expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  await grid.getByRole('combobox',{name:/^페이지당 행 수:/}).click();
  await page.getByRole('option',{name:'20개',exact:true}).click();
  const head=grid.locator('thead th').first();
  const beforeScroll=await head.boundingBox();
  const scroll=grid.locator('.data-grid-scroll');
  await scroll.evaluate(element=>{element.scrollTop=180;});
  await expect.poll(()=>scroll.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
  const afterScroll=await head.boundingBox();
  expect(Math.abs(afterScroll.y-beforeScroll.y)).toBeLessThan(1);
});

test('cell editing validates, binds saved values and cancels pending changes',{tag:'@mobile'}, async ({page}) => {
  await page.goto(route);
  const grid = page.getByRole('group',{name:'작업 편집 데이터그리드',exact:true});
  await grid.getByRole('button',{name:'토큰 사용 기준 정리 작업 이름 편집',exact:true}).click();
  const input = grid.getByRole('textbox',{name:'작업 이름',exact:true});
  await input.fill('X');
  await input.press('Enter');
  await expect(input).toHaveAttribute('aria-invalid','true');
  await expect(grid.getByRole('alert')).toHaveText('작업 이름은 2자 이상 입력해주세요.');
  await input.fill('토큰 문서 검토');
  await input.press('Enter');
  const edit = grid.getByRole('button',{name:'토큰 문서 검토 작업 이름 편집',exact:true});
  await expect(edit).toBeFocused();
  await expect(grid.locator('tbody')).toContainText('토큰 문서 검토');
  await edit.click();
  await input.fill('취소할 변경');
  await input.press('Escape');
  await expect(grid.locator('tbody')).not.toContainText('취소할 변경');
  await expect(edit).toBeFocused();
  await expect(grid.getByRole('button',{name:/배포된 가이드 보관.*편집/})).toHaveCount(0);
});

test('CSV uses visible columns and filtered rows across all pages', async ({page}) => {
  await page.goto(route);
  await page.evaluate(() => { window.showSaveFilePicker=undefined; });
  const grid = projectGrid(page);
  await grid.getByRole('searchbox',{name:'프로젝트 검색',exact:true}).fill('디자인');
  const count = await grid.locator('tbody tr').count();
  expect(count).toBeGreaterThan(0);
  await grid.getByRole('button',{name:'표시 열',exact:true}).click();
  await page.getByRole('checkbox',{name:'마감일',exact:true}).uncheck();
  await page.keyboard.press('Escape');
  const downloaded = page.waitForEvent('download');
  page.once('dialog',dialog => dialog.accept());
  await grid.getByRole('button',{name:'CSV 내보내기',exact:true}).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe('idenflu-projects.csv');
  const csv = await readFile(await file.path(),'utf8');
  expect(csv.charCodeAt(0)).toBe(0xFEFF);
  expect(csv.split('\r\n')[0]).not.toContain('마감일');
  expect(csv).toContain('디자인 시스템 v2');
  expect(csv.trimEnd().split('\r\n').length - 1).toBeGreaterThan(count);
});

test('selected CSV includes selected rows outside current filters', async ({page}) => {
  await page.goto(route);
  await page.evaluate(() => { window.showSaveFilePicker=undefined; });
  const grid=projectGrid(page);
  await grid.getByRole('checkbox',{name:'현재 페이지 전체 선택',exact:true}).check();
  await grid.getByRole('searchbox',{name:'프로젝트 검색',exact:true}).fill('없는프로젝트XYZ');
  const downloaded=page.waitForEvent('download');
  page.once('dialog',dialog => dialog.accept());
  await grid.getByRole('button',{name:'선택한 행 내보내기',exact:true}).click();
  const file=await downloaded;
  expect(file.suggestedFilename()).toBe('idenflu-projects-selected.csv');
  const csv=await readFile(await file.path(),'utf8');
  expect(csv.trimEnd().split('\r\n').length-1).toBe(5);
});

test('loading, empty, error and retry keep stale rows out of the state grid',{tag:'@mobile'}, async ({page}) => {
  await page.goto(route);
  const grid = page.getByRole('group',{name:'조회 상태 데이터그리드',exact:true});
  const controls = page.getByRole('group',{name:'데이터그리드 조회 상태',exact:true});
  await expect(grid.locator('tbody')).toContainText('데이터를 불러오는 중입니다.');
  await expect(grid.locator('tbody')).not.toContainText('디자인 시스템 v2');
  await controls.getByRole('button',{name:'빈 데이터',exact:true}).click();
  await expect(grid.locator('tbody')).toContainText('아직 등록한 프로젝트가 없습니다.');
  await controls.getByRole('button',{name:'오류',exact:true}).click();
  const retry=grid.getByRole('button',{name:'다시 시도',exact:true});
  const bounds=await retry.boundingBox();
  const viewport=await grid.locator('.data-grid-scroll').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(viewport.x);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.x+viewport.width);
  await retry.click();
  await expect(grid.locator('tbody')).toContainText('디자인 시스템 v2');
});

async function expectStateFillsViewport(grid) {
  await expect.poll(()=>grid.locator('.data-grid-state').evaluate(state=>{
    const scroller=state.closest('.data-grid-scroll');
    const head=scroller.querySelector('thead').getBoundingClientRect();
    const viewport=scroller.getBoundingClientRect();
    const bounds=state.getBoundingClientRect();
    const bottom=viewport.top+scroller.clientTop+scroller.clientHeight;
    return {
      startsBelowHeader:Math.abs(bounds.top-head.bottom)<3,
      reachesBottom:Math.abs(bounds.bottom-bottom)<3,
      verticallyCentered:Math.abs((bounds.top+bounds.bottom)/2-(head.bottom+bottom)/2)<3,
    };
  })).toEqual({startsBelowHeader:true,reachesBottom:true,verticallyCentered:true});
}

async function expandGrid(grid) {
  await grid.evaluate(element=>{
    Object.assign(element.style,{height:'800px',width:'min(100%, 360px)'});
  });
}

test('expanded loading, empty and error states fill the area below the headers without stretching data rows',{tag:'@mobile'},async({page})=>{
  await page.goto(route);
  const grid=page.getByRole('group',{name:'조회 상태 데이터그리드',exact:true});
  const controls=page.getByRole('group',{name:'데이터그리드 조회 상태',exact:true});
  await grid.evaluate(element=>{element.style.width='min(100%, 360px)';});
  await expect(grid.locator('.data-grid-state')).toContainText('데이터를 불러오는 중입니다.');
  const naturalStateHeight=await grid.locator('.data-grid-state').evaluate(element=>element.getBoundingClientRect().height);
  expect(naturalStateHeight).toBeGreaterThanOrEqual(220);
  expect(naturalStateHeight).toBeLessThan(400);
  await controls.getByRole('button',{name:'조회 완료',exact:true}).click();
  const row=grid.locator('tbody tr[data-grid-row-id]').first();
  await expect(row).toBeVisible();
  const naturalRowHeight=await row.evaluate(element=>element.getBoundingClientRect().height);
  await expandGrid(grid);
  for(const [name,message] of [['로딩','데이터를 불러오는 중입니다.'],['빈 데이터','아직 등록한 프로젝트가 없습니다.'],['오류','프로젝트를 불러오지 못했습니다.']]){
    await controls.getByRole('button',{name,exact:true}).click();
    await expect(grid.locator('.data-grid-state')).toContainText(message);
    await expectStateFillsViewport(grid);
  }
  await grid.getByRole('button',{name:'다시 시도',exact:true}).click();
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(3);
  expect(await row.evaluate(element=>element.getBoundingClientRect().height)).toBeCloseTo(naturalRowHeight,0);
  await controls.getByRole('button',{name:'로딩',exact:true}).click();
  await grid.evaluate(element=>{
    element.style.removeProperty('height');
  });
  expect(await grid.locator('.data-grid-state').evaluate(element=>element.getBoundingClientRect().height)).toBeCloseTo(naturalStateHeight,0);
});

test('expanded search-empty state remains centered across horizontal scrolling and resets normally',{tag:'@mobile'},async({page})=>{
  await page.goto(route);
  const grid=projectGrid(page);
  await grid.getByRole('searchbox',{name:'프로젝트 검색',exact:true}).fill('일치하지 않는 프로젝트 xyz');
  await expect(grid.locator('.data-grid-state')).toContainText('검색 결과가 없습니다.');
  // maxHeight limits content; it must not force a naturally sized empty grid to 480px.
  expect(await grid.locator('.data-grid-viewport').evaluate(element=>element.getBoundingClientRect().height)).toBeLessThan(480);
  await expandGrid(grid);
  await expectStateFillsViewport(grid);
  const scroller=grid.locator('.data-grid-scroll');
  await expect.poll(()=>scroller.evaluate(element=>element.scrollWidth-element.clientWidth)).toBeGreaterThan(100);
  await scroller.evaluate(element=>{element.scrollLeft=200;});
  await expect.poll(()=>scroller.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);
  const centers=await scroller.evaluate(element=>{
    const state=element.querySelector('.data-grid-state').getBoundingClientRect();
    const bounds=element.getBoundingClientRect();
    return {state:state.left+state.width/2,viewport:bounds.left+element.clientLeft+element.clientWidth/2};
  });
  expect(Math.abs(centers.state-centers.viewport)).toBeLessThan(3);
  await grid.getByRole('button',{name:'조건 초기화',exact:true}).click();
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(5);
});


test('virtualized search-empty state fills an expanded viewport and restores virtual rows',{tag:'@mobile'},async({page})=>{
  await page.goto(route);
  const grid=page.getByRole('group',{name:'대용량 데이터그리드',exact:true});
  await expandGrid(grid);
  const search=grid.getByRole('searchbox',{name:'대용량 데이터 검색',exact:true});
  await search.fill('일치하지 않는 가상 프로젝트 xyz');
  await expect(grid.locator('.data-grid-state')).toContainText('검색 결과가 없습니다.');
  await expectStateFillsViewport(grid);
  await grid.getByRole('button',{name:'조건 초기화',exact:true}).click();
  await expect(grid.locator('tbody tr[data-grid-row-id]').first()).toBeVisible();
  await expect(grid.locator('.data-grid-state')).toHaveCount(0);
});
