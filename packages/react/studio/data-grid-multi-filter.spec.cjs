const {test,expect}=require('@playwright/test');
const route='/systems/idenflu-mono/index.html#/components/data-grid';
const exampleFor=page=>page.locator('#data-grid-multi-filter-demo');
const gridFor=page=>exampleFor(page).getByRole('group',{name:'복수 선택 필터 데이터그리드',exact:true});
const triggerFor=(grid,label)=>grid.getByRole('combobox',{name:new RegExp(`^${label}:`)});
async function open(grid,label){const trigger=triggerFor(grid,label);await trigger.click();const list=grid.getByRole('listbox',{name:label,exact:true});await expect(list).toBeVisible();return{trigger,list,search:grid.getByRole('combobox',{name:`${label} 검색`,exact:true})};}

test('searchable multi-filters combine OR and AND, keep choices and reset to all rows',async({page})=>{
  await page.goto(route);
  const example=exampleFor(page),grid=gridFor(page),rows=grid.locator('tbody tr[data-grid-row-id]');
  await page.locator('.studio-grid-reference-links a[href="#data-grid-multi-filter-demo"]').click();
  await expect(page).toHaveURL(/#\/components\/data-grid$/);
  await expect(example.getByRole('heading',{name:'복수 선택 컬럼 필터',exact:true})).toBeFocused();
  await expect(rows).toHaveCount(6);
  const height=await grid.locator('.data-grid-filter-row').evaluate(element=>element.getBoundingClientRect().height);
  const teamTrigger=triggerFor(grid,'담당 팀 필터');
  await teamTrigger.focus();await teamTrigger.press('ArrowDown');
  const teamSearch=grid.getByRole('combobox',{name:'담당 팀 필터 검색',exact:true});
  const teams=grid.getByRole('listbox',{name:'담당 팀 필터',exact:true});
  await expect(teamSearch).toBeFocused();await expect(teams).toHaveAttribute('aria-multiselectable','true');
  await teamSearch.fill('디자인');await teamSearch.press('Enter');
  await expect(rows).toHaveCount(2);await expect(teams).toBeVisible();
  await teamSearch.fill('개발');await teamSearch.press('Enter');await expect(rows).toHaveCount(4);
  await teamSearch.fill('없는 항목');await expect(grid.getByText('검색 결과가 없습니다.',{exact:true})).toBeVisible();
  await expect(rows).toHaveCount(4);
  await teamSearch.fill('');
  await expect(teams.getByRole('option',{name:'프로덕트 디자인',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(teams.getByRole('option',{name:'개발',exact:true})).toHaveAttribute('aria-selected','true');
  await teamSearch.press('Escape');await expect(teamTrigger).toBeFocused();
  await expect(teamTrigger.locator('.select-value-text')).toHaveText('프로덕트 디자인 외 1개');
  await expect(teamTrigger).toHaveAccessibleName('담당 팀 필터: 프로덕트 디자인, 개발');
  expect(await grid.locator('.data-grid-filter-row').evaluate(element=>element.getBoundingClientRect().height)).toBeCloseTo(height,0);
  const statuses=await open(grid,'상태 필터');
  await statuses.list.getByRole('option',{name:'진행 중',exact:true}).click();
  await statuses.list.getByRole('option',{name:'검토 중',exact:true}).click();
  await statuses.search.press('Escape');await expect(rows).toHaveCount(3);
  await expect(example.getByRole('region',{name:'복수 필터 상태',exact:true})).toContainText('"team": [');
  await grid.getByRole('spinbutton',{name:'예상 시간 최솟값',exact:true}).fill('15');await expect(rows).toHaveCount(2);
  await grid.getByRole('searchbox',{name:'복수 필터 전체 검색',exact:true}).fill('모바일');await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('모바일 앱');
  await grid.getByRole('button',{name:'필터 초기화',exact:true}).click();
  await expect(teamTrigger).toHaveAccessibleName('담당 팀 필터: 전체');
  await expect(example.getByRole('region',{name:'복수 필터 상태',exact:true})).toHaveText('{}');
  await grid.getByRole('button',{name:'검색 초기화',exact:true}).click();await expect(rows).toHaveCount(6);
  const again=await open(grid,'담당 팀 필터');await again.list.getByRole('option',{name:'프로덕트 디자인',exact:true}).click();await expect(rows).toHaveCount(2);
  await again.list.getByRole('option',{name:'프로덕트 디자인',exact:true}).click();await expect(rows).toHaveCount(6);
  await expect(teamTrigger).toHaveAccessibleName('담당 팀 필터: 전체');
  await expect(grid.getByRole('button',{name:'필터 초기화',exact:true})).toHaveCount(0);
  await again.search.press('Escape');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test('multi-filter summaries follow sm md lg sizing and fixed popups fit the viewport',{tag:'@mobile'},async({page})=>{
  await page.goto(route);const example=exampleFor(page),grid=gridFor(page);
  const menu=await open(grid,'담당 팀 필터');
  await menu.list.getByRole('option',{name:'프로덕트 디자인',exact:true}).click();await menu.list.getByRole('option',{name:'개발',exact:true}).click();
  await menu.search.press('Escape');
  const row=grid.locator('tbody tr[data-grid-row-id]').first();const bodyHeight=await row.evaluate(element=>element.getBoundingClientRect().height);
  for(const [size,label] of [['sm','SM (기본)'],['md','MD'],['lg','LG']]){
    await example.getByRole('combobox',{name:/^복수 필터 크기:/}).click();
    await example.getByRole('listbox',{name:'복수 필터 크기',exact:true}).getByRole('option',{name:label,exact:true}).click();
    await expect(grid.locator('.data-grid-filter-row')).toHaveAttribute('data-size',size);
    const expected=await grid.locator('.data-grid-search .input-group').evaluate(element=>element.getBoundingClientRect().height);
    const heights=await grid.locator('.data-grid-filter-row input.text-input,.data-grid-filter-row button[role="combobox"]').evaluateAll(elements=>elements.map(element=>element.getBoundingClientRect().height));
    expect(heights).toHaveLength(5);for(const height of heights)expect(height).toBeCloseTo(expected,0);
    expect(await row.evaluate(element=>element.getBoundingClientRect().height)).toBeCloseTo(bodyHeight,0);
    const opened=await open(grid,'담당 팀 필터');
    const popup=opened.list.locator('..');await expect(popup).toHaveAttribute('data-popup-strategy','fixed');
    const bounds=await popup.boundingBox(),viewport=await page.evaluate(()=>({width:document.documentElement.clientWidth,height:innerHeight}));
    expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width+1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height+1);
    await opened.search.press('Escape');
    await expect(triggerFor(grid,'담당 팀 필터').locator('.select-value-text')).toHaveText('프로덕트 디자인 외 1개');
    expect(await triggerFor(grid,'담당 팀 필터').locator('.select-summary-count').evaluate(element=>element.getBoundingClientRect().right <= element.closest('.select-value-text').getBoundingClientRect().right + 1)).toBe(true);
    await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(4);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});
