const {test,expect}=require('@playwright/test');

test('solid badges stay readable, distinct and unclipped across themes and mobile',{tag:['@theme','@mobile']},async({page})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/feedback');
  const soft=page.getByRole('group',{name:'상태별 배지',exact:true}).locator('.badge');
  const solid=page.getByRole('group',{name:'반전 상태별 배지',exact:true}).locator('.badge');
  await expect(solid).toHaveText(['대기','진행 중','완료','주의','오류']);
  const palettes=await solid.evaluateAll(elements=>elements.map(element=>{
    const style=getComputedStyle(element),bounds=element.getBoundingClientRect();
    const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(value=>{
      const channel=Number(value)/255;
      return channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;
    }).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
    const a=luminance(style.color),b=luminance(style.backgroundColor);
    return {background:style.backgroundColor,text:style.color,height:bounds.height,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),visible:bounds.left>=0&&bounds.right<=innerWidth};
  }));
  expect(new Set(palettes.map(item=>item.background)).size).toBe(5);
  expect(new Set(palettes.map(item=>item.text)).size).toBe(1);
  if(await page.locator('html').getAttribute('data-theme')!=='dark'){
    expect(palettes.every(item=>item.text==='rgb(255, 255, 255)')).toBe(true);
  }
  for(let index=0;index<palettes.length;index++){
    const palette=palettes[index];
    expect(palette.contrast).toBeGreaterThanOrEqual(4.5);
    expect(palette.visible).toBe(true);
    expect(palette.background).not.toBe(await soft.nth(index).evaluate(element=>getComputedStyle(element).backgroundColor));
    expect(palette.height).toBe((await soft.nth(index).boundingBox()).height);
  }
  const icons=page.getByRole('group',{name:'아이콘 반전 배지',exact:true}).locator('.badge');
  for(const badge of await icons.all()){
    expect(await badge.locator('.ui-icon').evaluate(element=>getComputedStyle(element).color)).toBe(await badge.evaluate(element=>getComputedStyle(element).color));
  }
});
