const {test,expect}=require('@playwright/test');

test('outline buttons keep semantic colors, keyboard focus and disabled behavior',{tag:['@theme','@mobile']},async({page,isMobile})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/buttons');
  const group=page.getByRole('group',{name:'색상별 아웃라인 버튼',exact:true});
  const primary=group.getByRole('button',{name:'Primary 아웃라인',exact:true});
  const danger=group.getByRole('button',{name:'Danger 아웃라인',exact:true});
  const disabled=group.getByRole('button',{name:'Danger 아웃라인 비활성',exact:true});
  const colors=await page.evaluate(()=>{
    const probe=document.createElement('span');document.body.append(probe);
    const resolve=token=>{probe.style.color=`var(${token})`;return getComputedStyle(probe).color;};
    const values={canvas:resolve('--surface-raised'),primary:resolve('--primary'),danger:resolve('--danger-text'),dangerSurface:resolve('--danger-surface')};
    probe.remove();return values;
  });
  await expect(primary).toHaveCSS('color',colors.primary);
  await expect(danger).toHaveCSS('color',colors.danger);
  for(const button of [primary,danger]){
    await expect(button).toHaveCSS('background-color',colors.canvas);
    expect(await button.getAttribute('appearance')).toBeNull();
    expect(await button.evaluate(el=>getComputedStyle(el).boxShadow)).toContain('inset');
  }
  await expect(danger.locator('.ui-icon')).toHaveCSS('color',colors.danger);
  const idleShadow=await danger.evaluate(el=>getComputedStyle(el).boxShadow);
  await primary.focus();await page.keyboard.press('Tab');
  await expect(danger).toBeFocused();
  expect(await danger.evaluate(el=>getComputedStyle(el).boxShadow)).not.toBe(idleShadow);
  await page.keyboard.press('Enter');
  const notice=page.getByRole('status').filter({hasText:'Danger 아웃라인 버튼을 눌렀습니다.'});
  await expect(notice).toBeVisible();
  await page.keyboard.press('Tab');await expect(disabled).not.toBeFocused();
  await expect(disabled).toBeDisabled();
  if(!isMobile){
    await danger.hover();await expect(danger).toHaveCSS('background-color',colors.dangerSurface);
    const idle=await disabled.evaluate(el=>{const s=getComputedStyle(el);return[s.color,s.backgroundColor,s.boxShadow];});
    await disabled.hover();
    expect(await disabled.evaluate(el=>{const s=getComputedStyle(el);return[s.color,s.backgroundColor,s.boxShadow];})).toEqual(idle);
  }
  await disabled.click({force:true});await expect(notice).toBeVisible();
});
