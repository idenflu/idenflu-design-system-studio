const {test,expect} = require('@playwright/test');

function contrast(first,second) {
  const luminance = color => color.match(/[\d.]+/g).slice(0,3).map(value => {
    const channel=Number(value)/255;
    return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;
  }).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
  const a=luminance(first),b=luminance(second);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}

async function colors(toast) {
  return toast.evaluate(element=>{
    const style=getComputedStyle(element);
    return {background:style.backgroundColor,text:style.color,icon:getComputedStyle(element.querySelector('.toast-icon')).color,
      close:getComputedStyle(element.querySelector('.icon-button')).color};
  });
}

test('solid toast variants color the whole background and provide matching status icons', {tag:['@theme','@mobile']}, async ({page})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/overlays');
  const backgrounds=new Set();
  for(const [name,variant,icon] of [['성공','success','check-circle'],['안내','info','info'],['주의','warning','warning'],['오류','danger','warning-fill']]) {
    const trigger=page.getByRole('button',{name:`${name} 배경 토스트`,exact:true});
    await trigger.click();
    const toast=page.locator('.toast');
    await expect(toast).toHaveClass(new RegExp(`toast--${variant}`));
    await expect(toast).toHaveClass(/toast--solid/);
    await expect(toast).toHaveAttribute('role',variant==='danger'?'alert':'status');
    await expect(toast.locator(`.toast-icon .icon-${icon}`)).toBeVisible();
    await expect(toast.locator('.toast-icon')).toHaveAttribute('aria-hidden','true');
    const palette=await colors(toast);
    backgrounds.add(palette.background);
    expect(contrast(palette.text,palette.background)).toBeGreaterThanOrEqual(4.5);
    expect(palette.icon).toBe(palette.text);
    expect(palette.close).toBe(palette.text);
    const bounds=await toast.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(await toast.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await toast.getByRole('button',{name:'알림 닫기',exact:true}).click();
    await expect(trigger).toBeFocused();
  }
  expect(backgrounds.size).toBe(4);
});

test('solid retry retains the appearance and undo restores the archived example', {tag:['@theme','@mobile']},async({page,isMobile})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/overlays');
  const error=page.getByRole('button',{name:'오류 배경 토스트',exact:true});
  await error.click();
  const toast=page.locator('.toast');
  const retry=toast.getByRole('button',{name:'다시 시도',exact:true});
  if(isMobile) {
    const message=await toast.locator('p').boundingBox(),action=await retry.boundingBox();
    expect(message.width).toBeGreaterThan(120);
    expect(action.y).toBeGreaterThanOrEqual(message.y+message.height);
  }
  if(!isMobile) await retry.hover();
  const background=(await colors(toast)).background;
  expect(contrast(await retry.evaluate(element=>getComputedStyle(element).color),background)).toBeGreaterThanOrEqual(4.5);
  await retry.focus();
  await retry.press('Enter');
  await expect(toast).toHaveClass(/toast--solid/);
  await expect(toast).toHaveClass(/toast--success/);
  await expect(toast.locator('.icon-check-circle')).toBeVisible();
  await expect(toast).toHaveAttribute('role','status');
  await expect(error).toBeFocused();
  expect((await colors(toast)).background).not.toBe(background);
  await toast.getByRole('button',{name:'알림 닫기',exact:true}).click();
  const info=page.getByRole('button',{name:'안내 배경 토스트',exact:true});
  await info.click();
  await toast.getByRole('button',{name:'실행 취소',exact:true}).click();
  await expect(toast).toHaveCount(0);
  await expect(info).toBeFocused();
  await expect(page.getByText('초안 문서 · 목록에 표시 중',{exact:true})).toBeVisible();
});

test('solid toast text and controls remain readable with custom status colors and forced colors', {tag:'@theme'},async({page})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/overlays');
  await page.evaluate(()=>{
    const theme=document.documentElement.dataset.theme;
    window.IdenfluPreferences.set({colors:{[theme]:{'--success':'#000000','--info':'#ffffff','--warning':'#777777','--danger':'#ffeb3b'}}});
  });
  for(const name of ['성공','안내','주의','오류']) {
    await page.getByRole('button',{name:`${name} 배경 토스트`,exact:true}).click();
    const toast=page.locator('.toast'),palette=await colors(toast);
    expect(contrast(palette.text,palette.background)).toBeGreaterThanOrEqual(4.5);
    expect(palette.close).toBe(palette.text);
    expect(palette.icon).toBe(palette.text);
    await toast.getByRole('button',{name:'알림 닫기',exact:true}).click();
  }
  await page.emulateMedia({forcedColors:'active'});
  await page.getByRole('button',{name:'오류 배경 토스트',exact:true}).click();
  const toast=page.locator('.toast'),palette=await colors(toast);
  expect(contrast(palette.text,palette.background)).toBeGreaterThanOrEqual(4.5);
  const close=toast.getByRole('button',{name:'알림 닫기',exact:true});
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await expect(close).toHaveCSS('outline-style','solid');
});
