const {test,expect}=require('@playwright/test');

test('search TextField uses the shared clear action, resets its filter and keeps focus',{tag:['@mobile','@theme']},async({page,isMobile})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/text-fields');
  const toolbar=page.locator('#text-field-hide-label-toolbar');
  const search=toolbar.getByRole('searchbox',{name:'프로젝트 검색',exact:true});
  const group=toolbar.locator('.input-group');
  const dimensions=()=>group.evaluate(element=>{const box=element.getBoundingClientRect();return {width:box.width,height:box.height};});
  const before=await dimensions();
  await search.fill('없는 프로젝트');
  const clear=toolbar.getByRole('button',{name:'프로젝트 검색 지우기',exact:true});
  await expect(clear).toBeVisible();
  await expect(clear).toHaveClass(/input-action/);
  expect(await dimensions()).toEqual(before);
  const comparison=page.getByRole('button',{name:'검색어 지우기',exact:true});
  await page.getByRole('searchbox',{name:'검색',exact:true}).fill('스타일 비교');
  const styles=locator=>locator.evaluate(element=>{
    const css=getComputedStyle(element),icon=getComputedStyle(element.querySelector('.ui-icon'));
    return {width:css.width,height:css.height,padding:css.padding,margin:css.margin,color:css.color,iconWidth:icon.width,iconHeight:icon.height};
  });
  expect(await styles(clear)).toEqual(await styles(comparison));
  if(!isMobile) {
    await clear.hover();const color=await clear.evaluate(e=>getComputedStyle(e).backgroundColor);
    await comparison.hover();expect(await comparison.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe(color);
  }
  if(isMobile) await clear.tap(); else await clear.click();
  await expect(search).toHaveValue('');await expect(search).toBeFocused();await expect(clear).toBeHidden();
  await expect(toolbar.getByRole('status')).toContainText('4개 프로젝트');
  await search.fill('브랜드');await search.press('Tab');await expect(clear).toBeFocused();await clear.press('Enter');
  await expect(search).toHaveValue('');await expect(search).toBeFocused();
  expect(await dimensions()).toEqual(before);
});
