const { test, expect } = require('@playwright/test');

const route = '/systems/idenflu-mono/index.html#/components/data-grid';
const sectionFor = page => page.locator('#data-grid-extensions');
const gridFor = page => sectionFor(page).getByRole('group', {name:'사용자 정의 도구 데이터그리드',exact:true});
const builtInGridFor = page => page.locator('#data-grid-toolbar-demo').getByRole('group', {name:'상단 도구 모음 데이터그리드',exact:true});
const searchName = '확장 예제 검색';
const idleOrder = ['확장 예제 데이터 초기화','프로젝트 추가',searchName,'촘촘한 행 간격','표시 열','CSV 내보내기'];
const selectedOrder = [...idleOrder.slice(0,3),'선택 완료 처리','선택한 행 내보내기','선택 해제',...idleOrder.slice(3)];
const toolbarControls = tools => tools.getByRole('button').or(tools.getByRole('searchbox'));

async function expectToolbarOrder(page, grid, names) {
  const tools = grid.locator('.data-grid-tools');
  const control = name => tools.getByRole(name === searchName ? 'searchbox' : 'button', {name,exact:true});
  await expect.poll(() => toolbarControls(tools).evaluateAll(elements => elements.map(element => element.getAttribute('aria-label') || (element.labels?.[0]?.textContent || element.textContent).trim()))).toEqual(names);
  await control(names[0]).focus();
  for (const [index,name] of names.entries()) {
    if (index) await page.keyboard.press('Tab');
    await expect(control(name)).toBeFocused();
  }
}

async function expectNoOverflow(page, grid) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await grid.locator('.data-grid-tools').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
}

test('the extension example follows built-in tools and has its own accessible shortcut and actions',{tag:'@mobile'}, async ({page}) => {
  await page.goto(route);
  const section = sectionFor(page), grid = gridFor(page), builtIn = builtInGridFor(page);
  await expect(section.getByRole('heading', {name:'상단 도구 확장',level:2,exact:true})).toBeVisible();
  expect(await section.evaluate(element => element.previousElementSibling?.id)).toBe('data-grid-toolbar-demo');
  await page.locator('.studio-grid-reference-links a[href="#data-grid-extensions"]').click();
  await expect(page).toHaveURL(/#\/components\/data-grid$/);
  await expect(section.getByRole('heading', {name:'상단 도구 확장',level:2,exact:true})).toBeFocused();
  for (const name of ['확장 예제 데이터 초기화','프로젝트 추가','선택 완료 처리']) {
    await expect(builtIn.getByRole('button', {name,exact:true})).toHaveCount(0);
  }
  await expect(grid.getByRole('button', {name:'확장 예제 데이터 초기화',exact:true})).toBeVisible();
  await expect(grid.getByRole('button', {name:'프로젝트 추가',exact:true})).toBeVisible();
  await expect(grid.getByRole('button', {name:'선택 완료 처리',exact:true})).toHaveCount(0);
  await expect(grid.locator('.data-grid-tools')).toHaveAttribute('data-size','sm');
  const smallHeight = await builtIn.getByRole('button', {name:'촘촘한 행 간격',exact:true}).evaluate(element => element.getBoundingClientRect().height);
  const dimensions = await toolbarControls(grid.locator('.data-grid-tools')).evaluateAll(elements => elements.map(element => {
    const bounds = (element.closest('.input-group') || element).getBoundingClientRect();
    return {height:bounds.height,width:bounds.width,iconOnly:element.classList.contains('button--icon')};
  }));
  expect(dimensions).toHaveLength(idleOrder.length);
  for (const bounds of dimensions) {
    expect(bounds.height).toBeCloseTo(smallHeight,0);
    if (bounds.iconOnly) expect(bounds.width).toBeCloseTo(bounds.height,0);
  }
  await expectToolbarOrder(page,grid,idleOrder);
  await expectNoOverflow(page,grid);
});

test('custom actions add projects, complete selected rows and reset local data, query and selection', async ({page}) => {
  await page.goto(route);
  const section = sectionFor(page), grid = gridFor(page), builtIn = builtInGridFor(page);
  const rows = grid.locator('tbody tr[data-grid-row-id]');
  const notice = section.locator(':scope > .react-studio-demo > p[role="status"]');
  const add = grid.getByRole('button', {name:'프로젝트 추가',exact:true});
  const complete = grid.getByRole('button', {name:'선택 완료 처리',exact:true});
  const search = grid.getByRole('searchbox', {name:searchName,exact:true});
  await expect(rows).toHaveCount(3);
  await expect(rows.locator('td:last-child')).toHaveText(['진행 중','검토 중','준비 중']);
  await expect(complete).toHaveCount(0);
  await add.click();
  await expect(rows).toHaveCount(4);
  await expect(notice).toHaveText('새 프로젝트 4를 추가했습니다.');
  const created = grid.locator('tbody tr[data-grid-row-id="extension-4"]');
  await expect(created).toContainText('새 프로젝트 4');
  await expect(created.locator('td').last()).toHaveText('준비 중');
  await created.getByRole('checkbox').check();
  await expect(complete).toBeVisible();
  await expectToolbarOrder(page,grid,selectedOrder);
  await complete.click();
  await expect(created.locator('td').last()).toHaveText('완료');
  await expect(created.getByRole('checkbox')).not.toBeChecked();
  await expect(complete).toHaveCount(0);
  await expect(grid.getByRole('button', {name:'선택한 행 내보내기',exact:true})).toHaveCount(0);
  await expect(grid.getByRole('button', {name:'선택 해제',exact:true})).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(notice).toHaveText('1개 프로젝트를 완료 처리했습니다.');
  await search.fill('새 프로젝트');
  await expect(rows).toHaveCount(1);
  await expect(created.locator('td').last()).toHaveText('완료');
  await created.getByRole('checkbox').check();
  await expect(complete).toBeVisible();
  await grid.getByRole('button', {name:'확장 예제 데이터 초기화',exact:true}).click();
  await expect(search).toHaveValue('');
  await expect(rows).toHaveCount(3);
  await expect(rows.locator('td:last-child')).toHaveText(['진행 중','검토 중','준비 중']);
  await expect(created).toHaveCount(0);
  await expect(complete).toHaveCount(0);
  await expect(grid.getByRole('button', {name:'선택 해제',exact:true})).toHaveCount(0);
  await expect(grid.locator('.data-grid-selection-count')).toHaveCount(0);
  await expect(notice).toHaveText('샘플 데이터 3개를 복원했습니다.');
  await expect(builtIn.locator('tbody tr[data-grid-row-id]')).toHaveCount(3);
  await expect(builtIn.locator('tbody tr[data-grid-row-id] td:last-child')).toHaveText(['진행 중','검토 중','준비 중']);
  await expectToolbarOrder(page,grid,idleOrder);
  await expectNoOverflow(page,grid);
});

test('the extension code is readable, keyboard reachable and scrolls inside a narrow page',{tag:'@mobile'}, async ({page,isMobile}) => {
  await page.goto(route);
  const section = sectionFor(page);
  const code = section.getByRole('region', {name:'확장 슬롯과 상태 연결 예제',exact:true});
  await code.scrollIntoViewIfNeeded();
  await expect(code).toBeVisible();
  const source = code.locator('pre > code');
  for (const text of ['export function ToolbarExtensionGrid','toolbarActions','selectionActions','onSelectedRowIdsChange','setRows','setSelectedRowIds','setQuery']) {
    await expect(source).toContainText(text);
  }
  await code.focus();
  await expect(code).toBeFocused();
  const dimensions = await code.evaluate(element => ({available:element.clientWidth,extent:element.scrollWidth}));
  if (isMobile) expect(dimensions.extent).toBeGreaterThan(dimensions.available);
  if (dimensions.extent > dimensions.available + 1) {
    await code.press('ArrowRight');
    await expect.poll(() => code.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
