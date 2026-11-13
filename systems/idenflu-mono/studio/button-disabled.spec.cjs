const {test,expect}=require('@playwright/test');
const route='/systems/idenflu-mono/index.html#/components/buttons';
const appearance=button=>button.evaluate(element=>{const s=getComputedStyle(element);return{background:s.backgroundColor,color:s.color,shadow:s.boxShadow};});

test('disabled buttons share styling across colors while retaining their shape',{tag:['@theme','@mobile']},async({page})=>{
  await page.goto(route);
  const states=[];
  for(const variant of ['default','outline','ghost']){
    const group=page.locator(`#button-disabled-states [data-button-variant="${variant}"]`);
    const disabled=group.locator('button:disabled');
    await expect(disabled).toHaveCount(4);
    const first=await appearance(disabled.first());
    for(let i=1;i<4;i++) expect(await appearance(disabled.nth(i))).toEqual(first);
    states.push(first);
    await expect(disabled.first()).toHaveCSS('cursor','not-allowed');
    await disabled.first().hover(); expect(await appearance(disabled.first())).toEqual(first);
  }
  expect(new Set(states.map(state=>JSON.stringify(state))).size).toBe(3);
});

test('loading replaces content without changing width and tooltip positions follow their triggers',{tag:'@mobile'},async({page})=>{
  await page.goto(route);
  const button=page.getByRole('button',{name:'저장하기',exact:true});
  const initial=await button.boundingBox();
  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute('aria-busy','true');
  await expect(button.locator('.button-loading-spinner')).toBeVisible();
  await expect(button.locator('.button-loading-content')).toHaveCSS('opacity','0');
  expect((await button.boundingBox()).width).toBeCloseTo(initial.width,0);
  await expect(button).toBeEnabled();
  for(const position of ['top','bottom','left','right']){
    const trigger=page.getByRole('button',{name:`${position} 설정`,exact:true});
    await trigger.focus();
    const tip=page.locator(`#${await trigger.getAttribute('aria-describedby')}`);
    await expect(tip).toBeVisible();
    const a=await trigger.boundingBox(),b=await tip.boundingBox();
    if(position==='top') expect(b.y+b.height).toBeLessThanOrEqual(a.y);
    if(position==='bottom') expect(b.y).toBeGreaterThanOrEqual(a.y+a.height);
    if(position==='left') expect(b.x+b.width).toBeLessThanOrEqual(a.x);
    if(position==='right') expect(b.x).toBeGreaterThanOrEqual(a.x+a.width);
  }
});
