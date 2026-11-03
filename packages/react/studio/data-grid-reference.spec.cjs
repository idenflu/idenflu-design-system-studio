const { test, expect } = require('@playwright/test');

const route = '/systems/idenflu-mono/index.html#/components/data-grid';

test('API shortcuts keep the data-grid route and move keyboard focus to each section', async ({page}) => {
  await page.goto(route);
  for (const id of ['data-grid-props','data-grid-toolbar','data-grid-columns','data-grid-events','data-grid-styles','data-grid-behavior']) {
    await page.locator(`.studio-grid-reference-links a[href="#${id}"]`).click();
    await expect(page).toHaveURL(/#\/components\/data-grid$/);
    await expect(page.locator(`#${id}-title`)).toBeFocused();
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.getByRole('heading',{name:'Data grid',level:1})).toHaveCount(1);
});

test('toolbar settings control built-in buttons while custom and selection actions keep their own visibility', async ({page}) => {
  await page.goto(route);
  const example=page.locator('#data-grid-toolbar-demo');
  const grid=example.getByRole('group',{name:'상단 도구 모음 데이터그리드',exact:true});
  const add=grid.getByRole('button',{name:'프로젝트 추가',exact:true});
  const remove=grid.getByRole('button',{name:'선택 삭제',exact:true});
  const density=grid.getByRole('button',{name:'촘촘한 행 간격',exact:true});
  await expect(density).toHaveAttribute('aria-pressed','true');
  await density.click();
  await expect(density).toHaveAttribute('aria-pressed','false');
  for(const [checkbox,button] of [['행 밀도 버튼 표시','촘촘한 행 간격'],['표시 열 버튼 표시','표시 열'],['CSV 버튼 표시','CSV 내보내기']]) {
    await example.getByRole('checkbox',{name:checkbox,exact:true}).uncheck();
    await expect(grid.getByRole('button',{name:button,exact:true})).toHaveCount(0);
  }
  await expect(remove).toHaveCount(0);
  await add.click();
  await expect(grid.locator('tbody tr')).toHaveCount(4);
  await grid.locator('tbody tr').first().getByRole('checkbox').check();
  await expect(remove).toBeVisible();
  await expect(add).toBeVisible();
  await remove.click();
  await expect(grid.locator('tbody tr')).toHaveCount(3);
  await expect(remove).toHaveCount(0);
  await expect(add).toBeFocused();
  await grid.getByRole('button',{name:'예제 데이터 새로고침',exact:true}).click();
  await expect(grid.locator('tbody')).toContainText('디자인 시스템');
  await expect(grid.locator('tbody')).not.toContainText('새 프로젝트');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test('API tables and code samples stay inside the page at narrow widths', async ({page,isMobile}) => {
  await page.goto(route);
  const reference = page.locator('#data-grid-props');
  await reference.scrollIntoViewIfNeeded();
  const table = reference.locator('.studio-grid-reference-table').first();
  await expect(table).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  if (isMobile) {
    const dimensions = await table.evaluate(element => ({available:element.clientWidth,extent:element.scrollWidth}));
    expect(dimensions.extent).toBeGreaterThan(dimensions.available);
    await table.focus();
    await table.press('ArrowRight');
    await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
  const code = page.locator('#data-grid-events .studio-grid-reference-code').first();
  await code.scrollIntoViewIfNeeded();
  await expect(code).toBeVisible();
  await code.focus();
  await expect(code).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
