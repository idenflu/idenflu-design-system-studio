const {test,expect}=require('@playwright/test');
const route='/systems/idenflu-mono/index.html#/components/buttons';
const variants=['primary','secondary','outline','ghost','danger'];
const label=value=>value[0].toUpperCase()+value.slice(1);
const exampleFor=page=>page.locator('#button-disabled-states');
const groupFor=(page,value)=>exampleFor(page).locator(`[data-button-variant="${value}"]`);
const appearance=button=>button.evaluate(element=>{const s=getComputedStyle(element);return{background:s.backgroundColor,color:s.color,shadow:s.boxShadow};});

test('each button variant has a distinct disabled treatment shared with its icon button', {tag:['@theme','@mobile']},async({page})=>{
  await page.goto(route);
  const states=[];
  for(const variant of variants){
    const group=groupFor(page,variant),enabled=group.locator('button:not(:disabled)'),disabled=group.locator('button:disabled').first(),icon=group.getByRole('button',{name:`${label(variant)} 아이콘 비활성`,exact:true});
    await expect(group.locator('button:disabled')).toHaveCount(2);
    await expect(disabled).toBeDisabled();await expect(icon).toBeDisabled();
    const idle=await appearance(disabled);states.push(idle);
    expect(idle).not.toEqual(await appearance(enabled));expect(await appearance(icon)).toEqual(idle);
    await expect(disabled).toHaveCSS('opacity','1');await expect(disabled).toHaveCSS('cursor','not-allowed');
    const a=await enabled.boundingBox(),b=await disabled.boundingBox(),c=await icon.boundingBox();
    expect(b.height).toBeCloseTo(a.height,0);expect(b.width).toBeCloseTo(a.width,0);
    expect(c.width).toBeCloseTo(c.height,0);expect(c.height).toBeCloseTo(b.height,0);
    if(variant==='outline'){expect(idle.background).toBe('rgba(0, 0, 0, 0)');expect(idle.shadow).toContain('inset');}
    else if(variant==='ghost'){expect(idle.background).toBe('rgba(0, 0, 0, 0)');expect(idle.shadow).toBe('none');}
    else{expect(idle.background).not.toBe('rgba(0, 0, 0, 0)');expect(idle.shadow).toBe('none');}
  }
  expect(new Set(states.map(state=>JSON.stringify(state))).size).toBe(5);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test('disabled variants ignore hover, press and clicks and are skipped during keyboard navigation', {tag:'@theme'},async({page})=>{
  await page.goto(route);const example=exampleFor(page),notice=example.getByRole('status');
  await groupFor(page,'primary').locator('button:not(:disabled)').click();
  await expect(notice).toHaveText('Primary 버튼을 실행했습니다.');
  for(const variant of variants){
    const disabled=groupFor(page,variant).locator('button:disabled').first(),initial=await appearance(disabled);
    await disabled.hover();expect(await appearance(disabled)).toEqual(initial);
    const box=await disabled.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.mouse.down();expect(await appearance(disabled)).toEqual(initial);await page.mouse.up();
    await disabled.click({force:true});await expect(notice).toHaveText('Primary 버튼을 실행했습니다.');
  }
  await groupFor(page,'primary').locator('button:not(:disabled)').focus();
  for(const variant of variants.slice(1)){
    await page.keyboard.press('Tab');await expect(groupFor(page,variant).locator('button:not(:disabled)')).toBeFocused();
  }
});

test('forced colors use the system disabled palette while retaining disabled behavior',async({page})=>{
  await page.emulateMedia({forcedColors:'active'});await page.goto(route);
  const expected=await page.evaluate(()=>{const probe=document.createElement('span');probe.style.cssText='color:GrayText;background:ButtonFace;forced-color-adjust:none';document.body.append(probe);const s=getComputedStyle(probe),value={color:s.color,background:s.backgroundColor};probe.remove();return value;});
  for(const variant of variants){
    const button=groupFor(page,variant).locator('button:disabled').first();
    await expect(button).toHaveCSS('color',expected.color);await expect(button).toHaveCSS('background-color',expected.background);
    await expect(button).toHaveCSS('outline-color',expected.color);await expect(button).toHaveCSS('box-shadow','none');
    await expect(button).toBeDisabled();
  }
});
