const { test, expect } = require('@playwright/test');

const route = '/systems/idenflu-mono/index.html#/components/data-grid';
const filterControls = row => row.locator('input.text-input,button[role="combobox"]');

async function expectFilterSize(grid, size, count) {
  const row = grid.locator('.data-grid-filter-row');
  await expect(row).toHaveAttribute('data-size',size);
  const expected = await grid.evaluate((element,value) => {
    const probe = element.ownerDocument.createElement('span');
    Object.assign(probe.style, {position:'fixed',visibility:'hidden',width:'0',padding:'0',border:'0',height:`var(--size-${value}-height)`});
    element.append(probe);
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    return height;
  },size);
  expect(expected).toBeGreaterThan(0);
  const controls = filterControls(row);
  await expect(controls).toHaveCount(count);
  const heights = await controls.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
  for (const height of heights) expect(height).toBeCloseTo(expected,0);
  expect(await grid.locator('.data-grid-search .input-group').evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(expected,0);
}

async function openFilter(page, grid, label) {
  const trigger = grid.getByRole('combobox', {name:new RegExp(`^${label}:`)});
  await trigger.click();
  const listbox = grid.getByRole('listbox', {name:label,exact:true});
  await expect(listbox).toBeVisible();
  const popup = listbox.locator('..');
  await expect(popup).toHaveAttribute('data-popup-strategy','fixed');
  const bounds = await popup.boundingBox();
  const viewport = await page.evaluate(() => ({width:document.documentElement.clientWidth,height:document.documentElement.clientHeight}));
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  return {trigger,listbox};
}

async function expectVirtualCoverage(grid) {
  await expect.poll(() => grid.evaluate(element => {
    const scroll = element.querySelector('.data-grid-scroll');
    const viewport = scroll.getBoundingClientRect();
    const top = Math.max(viewport.top + scroll.clientTop,...[...element.querySelectorAll('thead th,thead td')].map(cell => cell.getBoundingClientRect().bottom));
    const bottom = viewport.top + scroll.clientTop + scroll.clientHeight;
    let covered = top, gap = 0;
    for (const row of element.querySelectorAll('tbody tr[data-grid-row-id]')) {
      const bounds = row.getBoundingClientRect();
      if (bounds.bottom <= top || bounds.top >= bottom) continue;
      gap = Math.max(gap,bounds.top - covered);
      covered = Math.max(covered,bounds.bottom);
    }
    return Math.max(gap,bottom - covered);
  })).toBeLessThan(2);
}

async function expectScrollbarFitsHeader(grid) {
  await expect.poll(() => grid.evaluate(element => {
    const scroll = element.querySelector('.data-grid-scroll');
    const scrollbar = element.querySelector('.data-grid-native-vertical');
    if (!scrollbar) return Number.MAX_VALUE;
    const viewport = scroll.getBoundingClientRect();
    const headerHeight = element.querySelector('thead').getBoundingClientRect().height;
    const bar = scrollbar.getBoundingClientRect();
    return Math.max(Math.abs(bar.height - (scroll.clientHeight - headerHeight)),Math.abs(bar.top - (viewport.top + scroll.clientTop + headerHeight)));
  })).toBeLessThan(2);
}

test('column filters follow toolbar size while retaining their conditions, sorting and row density', async ({page}) => {
  await page.goto(route);
  const example = page.locator('#data-grid-toolbar-demo');
  const grid = example.getByRole('group', {name:'상단 도구 모음 데이터그리드',exact:true});
  await grid.getByRole('button', {name:'컬럼 필터',exact:true}).click();
  const name = grid.getByRole('textbox', {name:'프로젝트 필터',exact:true});
  const sort = grid.getByRole('button', {name:'프로젝트',exact:true});
  await sort.click();
  await sort.click();
  const heading = sort.locator('..');
  await expect(heading).toHaveAttribute('aria-sort','descending');
  await name.fill('디');
  const owner = await openFilter(page,grid,'담당자 필터');
  await owner.listbox.getByRole('option', {name:'김민수',exact:true}).click();
  const status = await openFilter(page,grid,'상태 필터');
  await status.listbox.getByRole('option', {name:'진행 중',exact:true}).click();
  const rows = grid.locator('tbody tr[data-grid-row-id]');
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('디자인 시스템');
  const rowHeight = await rows.evaluate(element => element.getBoundingClientRect().height);
  for (const [size,option] of [['sm','SM (기본)'],['md','MD'],['lg','LG']]) {
    await example.getByRole('combobox', {name:/^상단 도구 크기:/}).click();
    await example.getByRole('listbox', {name:'상단 도구 크기',exact:true}).getByRole('option', {name:option,exact:true}).click();
    await expectFilterSize(grid,size,3);
    await expect(name).toHaveValue('디');
    await expect(grid.getByRole('combobox', {name:'담당자 필터: 김민수',exact:true})).toBeVisible();
    await expect(grid.getByRole('combobox', {name:'상태 필터: 진행 중',exact:true})).toBeVisible();
    await expect(heading).toHaveAttribute('aria-sort','descending');
    await expect(grid).toHaveAttribute('data-density','compact');
    await expect(grid.locator('table')).toHaveAttribute('data-density','compact');
    await expect(rows).toHaveAttribute('data-grid-row-id','toolbar-1');
    expect(await rows.evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(rowHeight,0);
    const menu = await openFilter(page,grid,'담당자 필터');
    await menu.trigger.press('Escape');
    await expect(menu.listbox).toBeHidden();
    await expect(menu.trigger).toBeFocused();
  }
  await grid.getByRole('button', {name:'촘촘한 행 간격',exact:true}).click();
  await expect(grid).toHaveAttribute('data-density','default');
  expect(await rows.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(rowHeight);
  await expectFilterSize(grid,'lg',3);
  await expect(name).toHaveValue('디');
  await expect(heading).toHaveAttribute('aria-sort','descending');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('virtual-grid text, select and number filters share small sizing without disrupting the scroll viewport', async ({page}) => {
  await page.goto(route);
  const grid = page.getByRole('group', {name:'대용량 데이터그리드',exact:true});
  await grid.scrollIntoViewIfNeeded();
  const filters = grid.locator('.data-grid-filter-row');
  await expect(filters.getByRole('textbox')).toHaveCount(3);
  await expect(filters.getByRole('combobox')).toHaveCount(2);
  await expect(filters.getByRole('spinbutton')).toHaveCount(4);
  await expectFilterSize(grid,'sm',9);
  const team = await openFilter(page,grid,'담당 팀 필터');
  await team.listbox.getByRole('option', {name:'프로덕트 디자인',exact:true}).click();
  await expect(team.trigger).toHaveAccessibleName('담당 팀 필터: 프로덕트 디자인');
  await expect(grid.locator('table')).toHaveAttribute('aria-rowcount','2502');
  await expect.poll(() => grid.locator('tbody tr[data-grid-row-id] td:nth-child(3)').evaluateAll(cells => cells.length > 0 && cells.every(cell => cell.textContent === '프로덕트 디자인'))).toBe(true);
  const reopened = await openFilter(page,grid,'담당 팀 필터');
  await reopened.trigger.press('Escape');
  await expect(reopened.listbox).toBeHidden();
  await expect(reopened.trigger).toBeFocused();
  await grid.locator('.data-grid-tools').getByRole('button', {name:'필터 초기화',exact:true}).click();
  await expect(team.trigger).toHaveAccessibleName('담당 팀 필터: 전체');
  await expect(grid.locator('table')).toHaveAttribute('aria-rowcount','10002');
  const scroll = grid.locator('.data-grid-scroll');
  await scroll.scrollIntoViewIfNeeded();
  await scroll.evaluate(element => {element.scrollTop = 0;element.scrollLeft = 0;});
  await expect(grid.locator('tbody tr[data-grid-row-id="ROW-00001"]')).toHaveCount(1);
  await expectVirtualCoverage(grid);
  await expectScrollbarFitsHeader(grid);
  const headerPositions = await grid.locator('thead tr').evaluateAll(rows => rows.map(row => row.firstElementChild.getBoundingClientRect().top));
  await scroll.evaluate(element => {element.scrollTop = (element.scrollHeight - element.clientHeight) / 2;});
  await expect.poll(() => scroll.evaluate(element => element.scrollTop / element.clientHeight)).toBeGreaterThan(1);
  await expect.poll(async () => Number((await grid.locator('tbody tr[data-grid-row-id]').first().getAttribute('data-grid-row-id')).slice(4))).toBeGreaterThan(1000);
  await expectVirtualCoverage(grid);
  await expectScrollbarFitsHeader(grid);
  await expect.poll(() => grid.locator('thead tr').evaluateAll((rows,initial) => Math.max(...rows.map((row,index) => Math.abs(row.firstElementChild.getBoundingClientRect().top - initial[index]))),headerPositions)).toBeLessThan(1);
  await expectFilterSize(grid,'sm',9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
