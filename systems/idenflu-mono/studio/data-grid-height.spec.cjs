const {test, expect} = require('@playwright/test');

test('height examples leave space below short results and scroll long results', {tag:'@mobile'}, async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/data-grid?section=data-grid-height-demo-title');
  const section = page.locator('#data-grid-height-demo');
  for (const name of ['고정 높이 데이터그리드', 'Flex 높이 데이터그리드']) {
    const grid = section.getByRole('group', {name, exact:true});
    const scroll = grid.locator('.data-grid-scroll');
    await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(3);
    const short = await scroll.evaluate(element => ({
      bottom:element.getBoundingClientRect().top + element.clientTop + element.clientHeight,
      rowBottom:element.querySelector('tbody tr:last-child').getBoundingClientRect().bottom,
    }));
    expect(short.bottom - short.rowBottom).toBeGreaterThan(20);
    const geometry = await grid.evaluate(element => {
      const footer = element.querySelector('.data-grid-footer');
      const lastCell = element.querySelector('tbody tr[data-grid-row-id]:last-child td');
      return {gap:element.getBoundingClientRect().bottom-footer.getBoundingClientRect().bottom,
        border:getComputedStyle(lastCell).borderBottomWidth};
    });
    expect(geometry.gap).toBeLessThan(3);
    expect(geometry.border).toBe('1px');
  }
  await section.getByRole('button', {name:'20개'}).click();
  for (const name of ['고정 높이 데이터그리드', 'Flex 높이 데이터그리드']) {
    const scroll = section.getByRole('group', {name, exact:true}).locator('.data-grid-scroll');
    await expect.poll(() => scroll.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await scroll.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await scroll.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  }
});
