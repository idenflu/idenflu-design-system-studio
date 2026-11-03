const { test, expect } = require('@playwright/test');

const route = '/systems/idenflu-mono/index.html#/components/data-grid';
const exampleFor = page => page.locator('#data-grid-toolbar-demo');
const gridFor = page => exampleFor(page).getByRole('group', {name:'상단 도구 모음 데이터그리드',exact:true});
const search = '상단 도구 예제 검색';
const builtins = ['컬럼 필터','촘촘한 행 간격','표시 열','CSV 내보내기'];
const selection = ['선택한 행 내보내기','선택 해제'];
const orders = [
  {label:'기본',idle:[search,...builtins],selected:[search,...selection,...builtins]},
  {label:'컬럼 필터 먼저',idle:['컬럼 필터',search,...builtins.slice(1)],selected:['컬럼 필터',search,...selection,...builtins.slice(1)]},
  {label:'내보내기 먼저',idle:['CSV 내보내기',search,...builtins.slice(0,-1)],selected:['CSV 내보내기',search,...selection,...builtins.slice(0,-1)]},
];
const toolbarControls = tools => tools.getByRole('searchbox').or(tools.getByRole('button'));
const controlFor = (tools,name) => tools.getByRole(name === search ? 'searchbox' : 'button', {name,exact:true});

async function choose(example, label, option) {
  await example.getByRole('combobox', {name:new RegExp(`^${label}:`)}).click();
  await example.getByRole('listbox', {name:label,exact:true}).getByRole('option', {name:option,exact:true}).click();
}

async function expectOrder(page, tools, names) {
  await expect.poll(() => toolbarControls(tools).evaluateAll(controls => controls.map(control => control.getAttribute('aria-label') || (control.labels?.[0]?.textContent || control.textContent).trim()))).toEqual(names);
  await controlFor(tools,names[0]).focus();
  for (const [index,name] of names.entries()) {
    if (index) await page.keyboard.press('Tab');
    await expect(controlFor(tools,name)).toBeFocused();
  }
}

async function expectControlSize(tools, size) {
  await expect(tools).toHaveAttribute('data-size',size);
  const expected = await tools.evaluate((element, value) => {
    const probe = element.ownerDocument.createElement('span');
    Object.assign(probe.style, {position:'fixed',visibility:'hidden',pointerEvents:'none',width:'0',padding:'0',border:'0',height:`var(--size-${value}-height)`});
    element.append(probe);
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    return height;
  },size);
  expect(expected).toBeGreaterThan(0);
  const controls = await toolbarControls(tools).evaluateAll(elements => elements.map(control => {
    const bounds = (control.closest('.input-group') || control).getBoundingClientRect();
    return {name:control.getAttribute('aria-label') || (control.labels?.[0]?.textContent || control.textContent).trim(),height:bounds.height,width:bounds.width,iconOnly:control.classList.contains('button--icon')};
  }));
  expect(controls.length).toBeGreaterThanOrEqual(5);
  for (const control of controls) {
    expect(control.height,`${control.name} ${size} height`).toBeCloseTo(expected,0);
    if (control.iconOnly) expect(control.width,`${control.name} stays square`).toBeCloseTo(control.height,0);
  }
  return expected;
}

async function expectNoOverflow(page, tools) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await tools.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
}

test('toolbar sizes apply to built-in controls independently of row density', async ({page}) => {
  await page.goto(route);
  const example = exampleFor(page), grid = gridFor(page), tools = grid.locator('.data-grid-tools');
  const row = grid.locator('tbody tr[data-grid-row-id]').first();
  await expect(grid).toHaveAttribute('data-density','compact');
  await expect(grid.locator('table')).toHaveAttribute('data-density','compact');
  const rowHeight = await row.evaluate(element => element.getBoundingClientRect().height);
  const small = await expectControlSize(tools,'sm');
  await row.getByRole('checkbox').check();
  await expect(grid.getByRole('button', {name:'선택한 행 내보내기',exact:true})).toBeVisible();
  await expectControlSize(tools,'sm');
  const heights = [small];
  for (const [size,label] of [['md','MD'],['lg','LG']]) {
    await choose(example,'상단 도구 크기',label);
    heights.push(await expectControlSize(tools,size));
    await expect(grid).toHaveAttribute('data-density','compact');
    await expect(grid.locator('table')).toHaveAttribute('data-density','compact');
    expect(await row.evaluate(element => element.getBoundingClientRect().height)).toBeCloseTo(rowHeight,0);
    await expect(row.getByRole('checkbox')).toBeChecked();
  }
  expect(heights[0]).toBeLessThan(heights[1]);
  expect(heights[1]).toBeLessThan(heights[2]);
  await grid.getByRole('button', {name:'촘촘한 행 간격',exact:true}).click();
  await expect(grid).toHaveAttribute('data-density','default');
  await expect(grid.locator('table')).toHaveAttribute('data-density','default');
  expect(await row.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(rowHeight);
  await expectControlSize(tools,'lg');
  await choose(example,'상단 도구 크기','SM (기본)');
  await expectControlSize(tools,'sm');
  await expect(grid).toHaveAttribute('data-density','default');
  await expectNoOverflow(page,tools);
});

test('toolbar presets change DOM and Tab order while selection groups appear and disappear', async ({page}) => {
  await page.goto(route);
  const example = exampleFor(page), grid = gridFor(page), tools = grid.locator('.data-grid-tools');
  for (const order of orders) {
    await choose(example,'도구 순서',order.label);
    await expectOrder(page,tools,order.idle);
    await grid.locator('tbody tr[data-grid-row-id]').first().getByRole('checkbox').check();
    await expectOrder(page,tools,order.selected);
    await grid.getByRole('button', {name:'선택 해제',exact:true}).click();
    await expectOrder(page,tools,order.idle);
    await expectNoOverflow(page,tools);
  }
  const density = grid.getByRole('button', {name:'촘촘한 행 간격',exact:true});
  await density.click();
  await expect(density).toHaveAttribute('aria-pressed','false');
  await expect(grid).toHaveAttribute('data-density','default');
  await grid.locator('tbody tr[data-grid-row-id]').last().getByRole('checkbox').check();
  await expectOrder(page,tools,orders[2].selected);
  await grid.getByRole('button', {name:'선택 해제',exact:true}).click();
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(3);
  await expect(grid.locator('thead').getByRole('checkbox')).toBeFocused();
  await expectOrder(page,tools,orders[2].idle);
});

test('hidden built-in controls stay absent after reordering and large tools fit narrow layouts', async ({page}) => {
  await page.goto(route);
  const example = exampleFor(page), grid = gridFor(page), tools = grid.locator('.data-grid-tools');
  await choose(example,'상단 도구 크기','LG');
  await grid.locator('tbody tr[data-grid-row-id]').first().getByRole('checkbox').check();
  const visibilitySettings = ['검색 입력 표시','컬럼 필터 토글 사용','행 밀도 버튼 표시','표시 열 버튼 표시','CSV 버튼 표시'];
  const hiddenControls = [search,...builtins,'선택한 행 내보내기'];
  for (const name of visibilitySettings) {
    await example.getByRole('checkbox', {name,exact:true}).uncheck();
  }
  for (const order of orders) {
    await choose(example,'도구 순서',order.label);
    for (const name of hiddenControls) {
      await expect(controlFor(tools,name)).toHaveCount(0);
    }
    await expectOrder(page,tools,order.selected.filter(name => !hiddenControls.includes(name)));
    await expectNoOverflow(page,tools);
  }
  for (const name of visibilitySettings) {
    await example.getByRole('checkbox', {name,exact:true}).check();
  }
  await expectOrder(page,tools,orders[2].selected);
  await expectControlSize(tools,'lg');
  await expectNoOverflow(page,tools);
});

test('column filters and selection controls can be revealed and cleared from the toolbar', async ({page}) => {
  await page.goto(route);
  const grid = gridFor(page), tools = grid.locator('.data-grid-tools');
  const filterToggle = tools.getByRole('button', {name:'컬럼 필터',exact:true});
  const nameFilter = grid.getByRole('textbox', {name:'프로젝트 필터',exact:true});
  await expect(filterToggle).toHaveAttribute('aria-pressed','false');
  await expect(nameFilter).toHaveCount(0);
  await expect(tools.getByRole('button', {name:'필터 초기화',exact:true})).toHaveCount(0);
  await filterToggle.focus();
  await filterToggle.press('Space');
  await expect(filterToggle).toHaveAttribute('aria-pressed','true');
  await expect(nameFilter).toBeVisible();
  await nameFilter.fill('디자인');
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(1);
  await expect(grid.locator('tbody')).toContainText('디자인 시스템');
  const reset = tools.getByRole('button', {name:'필터 초기화',exact:true});
  await expect(reset).toBeVisible();
  await expectOrder(page,tools,[search,...builtins,'필터 초기화']);
  await expectControlSize(tools,'sm');
  await reset.click();
  await expect(reset).toHaveCount(0);
  await expect(nameFilter).toHaveValue('');
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(3);
  const row = grid.locator('tbody tr[data-grid-row-id]').first();
  await row.getByRole('checkbox').check();
  for (const name of selection) await expect(controlFor(tools,name)).toBeVisible();
  await expectOrder(page,tools,orders[0].selected);
  const clear = tools.getByRole('button', {name:'선택 해제',exact:true});
  await clear.focus();
  await clear.press('Enter');
  for (const name of selection) await expect(controlFor(tools,name)).toHaveCount(0);
  await expect(row.getByRole('checkbox')).not.toBeChecked();
  await expect(grid.locator('thead').getByRole('checkbox')).toBeFocused();
  await expectOrder(page,tools,orders[0].idle);
  await expectNoOverflow(page,tools);
});
