const {test,expect}=require('@playwright/test');

for(const [route,kind,label] of [
  ['number-fields','number','외부 연결 수량'],
  ['date-picker','date','외부 연결 날짜'],
  ['time-picker','time','외부 연결 시간'],
  ['datetime-picker','datetime','외부 연결 일시'],
]) {
  test(`${kind} document demonstrates real input focus and external descriptions`, async({page})=>{
    await page.goto(`/systems/idenflu-mono/index.html#/components/${route}?section=${kind}-external-form-title`);
    const section=page.locator(`#${kind}-external-form`);
    await section.getByRole('button',{name:'입력으로 이동',exact:true}).click();
    const input=section.getByLabel(label,{exact:true});
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-describedby',new RegExp(`${kind}-external-description`));
    if(kind==='date'||kind==='datetime') {
      await section.getByRole('button',{name:'범위 종료로 이동',exact:true}).click();
      await expect(section.locator('input:not([type="hidden"])').last()).toBeFocused();
    }
    await section.getByRole('button',{name:'제출값 확인',exact:true}).click();
    await expect(section.locator('output')).toContainText('"value"');
    await section.getByRole('button',{name:'초기화',exact:true}).click();
    await expect(section.locator('output')).toContainText('FormData');
  });
}
