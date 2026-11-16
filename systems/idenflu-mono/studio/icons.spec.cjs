const {test,expect}=require('@playwright/test');
const url='/systems/idenflu-mono/index.html#/foundations/icons';

test('workflow icons retain readable size previews and stay within narrow pages',{tag:['@mobile','@theme']},async({page})=>{
  await page.goto(url);
  const additions=page.locator('#icon-workflow-additions');
  const icons=additions.locator('.ui-icon');
  await expect(icons).toHaveCount(24);
  for(const size of [14,16,18,20]) {
    await additions.getByRole('button',{name:`${size}px`,exact:true}).click();
    const rendered=await icons.evaluateAll(nodes=>nodes.map(node=>{const box=node.getBoundingClientRect(),css=getComputedStyle(node);return {width:box.width,height:box.height,hasMask:css.maskImage!=='none',color:css.color,ink:css.backgroundColor};}));
    for(const icon of rendered) {expect(icon.width).toBe(size);expect(icon.height).toBe(size);expect(icon.hasMask).toBe(true);expect(icon.ink).toBe(icon.color);}
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  const search=page.getByRole('searchbox',{name:'아이콘 검색',exact:true});
  await search.fill('pin');await expect(page.locator('.react-studio-icons button > span:nth-child(2)')).toHaveText(['pin','pin-off']);
  await search.fill('sun');await expect(page.locator('.react-studio-icons .icon-sun')).toHaveCount(1);
});

test('workflow examples cycle sort directions and let keyboard users pin and reset',{tag:'@mobile'},async({page})=>{
  await page.goto(url);
  const example=page.locator('#icon-workflow-examples');
  const sort=example.getByRole('button',{name:'정렬 없음',exact:true});
  await expect(sort.locator('.ui-icon')).toHaveCount(0);
  await sort.click();await expect(example.getByRole('button',{name:'오름차순',exact:true}).locator('.icon-sort-ascending')).toHaveCount(1);
  await example.getByRole('button',{name:'오름차순',exact:true}).click();await expect(example.getByRole('button',{name:'내림차순',exact:true}).locator('.icon-sort-descending')).toHaveCount(1);
  const pin=example.getByRole('button',{name:'상단에 고정',exact:true});
  await pin.focus();await pin.press('Space');
  const unpin=example.getByRole('button',{name:'고정 해제',exact:true});
  await expect(unpin).toHaveAttribute('aria-pressed','true');await expect(unpin.locator('.icon-pin-off')).toHaveCount(1);
  await example.getByRole('button',{name:'정렬·고정 초기화',exact:true}).click();
  await expect(sort).toBeVisible();await expect(pin).toHaveAttribute('aria-pressed','false');
  await expect(example.getByRole('status')).toContainText('정렬과 고정을 초기화했습니다.');
});

test('theme controls use common sun and moon icons and preserve theme across reloads',{tag:['@mobile','@theme']},async({page})=>{
  await page.goto(url);
  const button=page.locator('.theme-toggle');
  await expect(button.locator('.ui-icon')).toHaveCount(2);
  await expect(button.locator('.ui-icon')).toHaveCount(2);
  const initial=await page.locator('html').getAttribute('data-theme');
  const verify=async theme=>{
    await expect(button.locator(theme==='dark'?'.icon-sun':'.icon-moon')).toBeVisible();
    await expect(button.locator(theme==='dark'?'.icon-moon':'.icon-sun')).toBeHidden();
    await expect(button).toHaveAccessibleName(`${theme==='dark'?'라이트':'다크'} 모드로 전환`);
    expect(await button.locator(theme==='dark'?'.icon-sun':'.icon-moon').evaluate(node=>node.getBoundingClientRect().width)).toBe(18);
  };
  await verify(initial);await button.click();
  const changed=initial==='dark'?'light':'dark';
  await expect(page.locator('html')).toHaveAttribute('data-theme',changed);await verify(changed);
  await page.reload();await verify(changed);
});

test('catalog searches names and both usage examples are available', {tag:['@mobile','@theme']}, async ({page}) => {
  await page.goto(url);
  const search = page.getByRole('searchbox', {name:'아이콘 검색'});
  await search.fill('CalendarClockIcon');
  await expect(page.locator('.react-studio-icons li')).toHaveCount(1);
  await expect(page.locator('.react-studio-icons li')).toContainText('calendar-clock');
  const examples = page.getByRole('region', {name:'React 사용 예시 코드'});
  await expect(examples.nth(0)).toContainText('<Icon name="save"');
  await expect(examples.nth(1)).toContainText('SaveIcon');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
