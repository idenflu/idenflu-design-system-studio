const {test,expect}=require('@playwright/test');
const url='/systems/idenflu-mono/index.html#/components/select';
function section(page,title) { return page.locator('.react-studio-section').filter({has:page.getByRole('heading',{name:title,exact:true})}); }
async function size(control) {return control.evaluate(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height}));}
async function noOverflow(control) {
  await expect.poll(()=>control.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
}

test('ten selected items keep plain and inline field dimensions and all options remain editable',{tag:['@mobile','@theme']},async({page})=>{
  await page.goto(url);
  const plain=section(page,'복수 선택'),inline=section(page,'태그형 복수 선택');
  const controls=[...await plain.locator('.select-trigger').all(),...await inline.locator('.multi-inline-control').all()];
  const initial=await Promise.all(controls.map(size));
  await plain.getByRole('button',{name:'복수 선택 10개 모두 선택',exact:true}).click();
  await inline.getByRole('button',{name:'태그형 복수 선택 10개 모두 선택',exact:true}).click();
  for(let i=0;i<controls.length;i++) {
    expect(await size(controls[i])).toEqual(initial[i]);
    await noOverflow(controls[i]);
  }
  for(const label of ['참여 팀','검색 없는 태그 선택']) {
    const trigger=inline.getByRole('combobox',{name:new RegExp(`^${label}:`)});
    const root=trigger.locator('../..'),control=trigger.locator('..');
    const tags=control.locator('.multi-inline-tags');
    const more=tags.getByRole('button',{name:/더 보기$/});
    await expect(more).toBeVisible();
    const count=await tags.locator('.multi-inline-chip').count();
    expect(count).toBeLessThan(10);
    await expect(more).toHaveText(`+${10-count}개`);
    expect(await root.locator('select').evaluate(node=>node.selectedOptions.length)).toBe(10);
    await noOverflow(tags);
    await more.click();
    const list=root.locator('.select-options');
    await expect(list.getByRole('option')).toHaveCount(10);
    await expect(list.locator('[aria-selected="true"]')).toHaveCount(10);
    await list.getByRole('option',{name:'고객 지원',exact:true}).click();
    await trigger.press('Escape');
    expect(await root.locator('select').evaluate(node=>node.selectedOptions.length)).toBe(9);
    await expect(trigger).not.toHaveAttribute('aria-label',/고객 지원/);
    await noOverflow(control);
  }
  await inline.getByRole('button',{name:'태그형 복수 선택 초기화',exact:true}).click();
  await expect(inline.locator('button.multi-inline-more')).toHaveCount(0);
  for(let i=2;i<controls.length;i++) expect(await size(controls[i])).toEqual(initial[i]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
});

test('responsive tags refit after resizing and move focus away from a tag that becomes hidden',{tag:['@mobile','@theme']},async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  await page.goto(url);
  const inline=section(page,'태그형 복수 선택');
  await inline.getByRole('button',{name:'태그형 복수 선택 10개 모두 선택',exact:true}).click();
  const trigger=inline.getByRole('combobox',{name:/^참여 팀:/});
  const control=trigger.locator('..'),tags=control.locator('.multi-inline-tags');
  await expect(tags.locator('button.multi-inline-more')).toBeVisible();
  const wideCount=await tags.locator('.multi-inline-chip').count();
  const original=await size(control);
  await tags.locator('.multi-inline-chip').last().focus();
  await page.setViewportSize({width:320,height:740});
  await expect.poll(()=>tags.locator('.multi-inline-chip').count()).toBeLessThan(wideCount);
  await expect(trigger).toBeFocused();
  expect((await size(control)).height).toBe(original.height);
  await noOverflow(tags);
  await page.setViewportSize({width:1280,height:900});
  await expect.poll(()=>tags.locator('.multi-inline-chip').count()).toBe(wideCount);
  expect(await size(control)).toEqual(original);
});

test('tag summary follows size tokens and larger type without a scrollbar',{tag:['@mobile','@theme']},async({page})=>{
  await page.goto(url);
  const inline=section(page,'태그형 복수 선택');
  const trigger=inline.getByRole('combobox',{name:/^참여 팀:/});
  const root=trigger.locator('../..'),control=trigger.locator('..');
  await inline.getByRole('button',{name:'태그형 복수 선택 10개 모두 선택',exact:true}).click();
  for(const token of ['sm','md','lg']) {
    await root.evaluate((node,value)=>node.setAttribute('data-size',value),token);
    const reference=page.getByRole('combobox',{name:new RegExp(`^${token.toUpperCase()} 선택:`)});
    await expect.poll(async()=>Math.abs((await size(control)).height-(await size(reference)).height)).toBeLessThan(1);
    await noOverflow(control.locator('.multi-inline-tags'));
    const chips=control.locator('.multi-inline-chip');
    await expect(control.locator('button.multi-inline-more')).toHaveText(`+${10-await chips.count()}개`);
  }
  await page.evaluate(()=>window.IdenfluPreferences.set({fontSize:18,controlHeight:48,spacing:150}));
  const reference=page.getByRole('combobox',{name:/^LG 선택:/});
  await expect.poll(async()=>Math.abs((await size(control)).height-(await size(reference)).height)).toBeLessThan(1);
  await noOverflow(control.locator('.multi-inline-tags'));
});
