const { test, expect } = require('@playwright/test');

const route = '/systems/idenflu-mono/index.html#/components/data-grid';
const sizingGrid = page => page.getByRole('group',{name:'반응형 열 너비 데이터그리드',exact:true});
const previewMode = (page,name) => page.getByRole('group',{name:'열 너비 예시 폭',exact:true}).getByRole('button',{name,exact:true});
const layout = grid => grid.evaluate(element => {
  const scroll = element.querySelector('.data-grid-scroll');
  const table = element.querySelector('.data-grid-table');
  const cells = [...element.querySelectorAll('thead tr:first-child > th')];
  return {
    available:scroll.clientWidth,
    extent:scroll.scrollWidth,
    table:table.getBoundingClientRect().width,
    widths:cells.map(cell => cell.getBoundingClientRect().width),
    pinnedOffset:cells[1].style.insetInlineStart,
  };
});

async function waitForResponsiveSizing(grid) {
  await expect.poll(async () => {
    const result = await layout(grid);
    const owner = Math.max(110,Math.min(300,Math.round((result.available - 52) * .25)));
    return Math.abs(result.widths[3] - owner) < 1;
  }).toBe(true);
}

test('percentage and flex columns respond to preview width while retaining pixel constraints',{tag:'@mobile'}, async ({page}) => {
  await page.goto(route);
  const grid = sizingGrid(page);
  await previewMode(page,'720px').click();
  await waitForResponsiveSizing(grid);
  const wide = await layout(grid);
  expect(wide.widths[0]).toBeCloseTo(52,0);
  expect(wide.widths[4]).toBeCloseTo(120,0);
  expect(wide.pinnedOffset).toBe('52px');
  expect(wide.table).toBeCloseTo(Math.max(wide.available,472 + wide.widths[3]),0);

  await previewMode(page,'480px').click();
  await expect.poll(async () => (await layout(grid)).widths.slice(1)).toEqual([180,120,110,120]);
  const narrow = await layout(grid);
  expect(narrow.extent).toBeGreaterThan(narrow.available);
  expect(narrow.table).toBeCloseTo(582,0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('manual column widths stay fixed across preview changes and reset with Enter or double click', async ({page}) => {
  await page.goto(route);
  const grid = sizingGrid(page);
  await previewMode(page,'720px').click();
  await waitForResponsiveSizing(grid);
  const separator = grid.getByRole('separator',{name:'프로젝트 열 너비',exact:true});
  await expect(separator).toBeVisible();
  const original = Number(await separator.getAttribute('aria-valuenow'));
  await separator.press('ArrowRight');
  await expect(separator).toHaveAttribute('aria-valuenow',String(original + 10));
  await previewMode(page,'480px').click();
  await expect(separator).toHaveAttribute('aria-valuenow',String(original + 10));
  await separator.press('Enter');
  await expect(separator).toHaveAttribute('aria-valuenow','180');
  await separator.press('ArrowRight');
  await expect(separator).toHaveAttribute('aria-valuenow','190');
  await separator.dblclick();
  await expect(separator).toHaveAttribute('aria-valuenow','180');
  await expect(separator).toHaveAccessibleDescription(/Enter 또는 더블클릭/);
});

test('hidden columns release flexible space and pinned offsets survive narrow horizontal scrolling',{tag:'@mobile'}, async ({page,isMobile}) => {
  await page.goto(route);
  const grid = sizingGrid(page);
  await previewMode(page,'720px').click();
  await waitForResponsiveSizing(grid);
  const before = await layout(grid);
  await grid.getByRole('button',{name:'표시 열',exact:true}).click();
  await grid.getByRole('region',{name:'반응형 열 너비 데이터그리드 표시 열',exact:true}).getByRole('checkbox',{name:'담당자',exact:true}).uncheck();
  await grid.getByRole('button',{name:'표시 열',exact:true}).click();
  await expect(grid.locator('colgroup col')).toHaveCount(4);
  await expect.poll(async () => {
    const after = await layout(grid);
    return Math.abs(after.table - Math.max(after.available,472)) < 1;
  }).toBe(true);
  const after = await layout(grid);
  if (after.available > 582) expect(after.widths[1]).toBeGreaterThan(before.widths[1]);

  await grid.getByRole('button',{name:'표시 열',exact:true}).click();
  await grid.getByRole('region',{name:'반응형 열 너비 데이터그리드 표시 열',exact:true}).getByRole('checkbox',{name:'담당자',exact:true}).check();
  await grid.getByRole('button',{name:'표시 열',exact:true}).click();
  await previewMode(page,'480px').click();
  await expect.poll(async () => (await layout(grid)).table).toBe(582);
  const first = grid.locator('tbody tr').first().locator('td').nth(1);
  const initial = await first.boundingBox();
  await grid.locator('.data-grid-scroll').evaluate(element => {element.scrollLeft=element.scrollWidth;});
  const scrolled = await first.boundingBox();
  if (isMobile) expect(scrolled.x).toBeLessThan(initial.x);
  else expect(scrolled.x).toBeCloseTo(initial.x,0);
  expect((await layout(grid)).pinnedOffset).toBe('52px');
});
