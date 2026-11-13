const {test,expect}=require('@playwright/test');
const route='/systems/idenflu-mono/index.html#/components/time-picker';

test('time picker confirms hours and minutes explicitly and cancellation preserves the value',{tag:'@mobile'},async({page})=>{
  await page.goto(route);
  await page.getByRole('button',{name:'시작 시간 선택 열기',exact:true}).click();
  const popup=page.getByRole('dialog',{name:'시작 시간 선택',exact:true});
  await popup.getByRole('listbox',{name:'시',exact:true}).getByRole('option',{name:'14',exact:true}).click();
  await popup.getByRole('listbox',{name:'분',exact:true}).getByRole('option',{name:'45',exact:true}).click();
  await expect(page.locator('#time-basic')).toHaveValue('09:30');
  await popup.getByRole('button',{name:'확인',exact:true}).click();
  await expect(page.locator('#time-basic')).toHaveValue('14:45');
  await expect(page.getByRole('status').filter({hasText:'확정된 시간:'})).toContainText('14:45');
  await page.getByRole('button',{name:'시작 시간 선택 열기',exact:true}).click();
  await popup.getByRole('listbox',{name:'시',exact:true}).getByRole('option',{name:'15',exact:true}).click();
  await popup.getByRole('button',{name:'취소',exact:true}).click();
  await expect(page.locator('#time-basic')).toHaveValue('14:45');
  await expect(page.getByRole('button',{name:'시작 시간 선택 열기',exact:true})).toBeFocused();
});

test('time input submits canonical minutes through the required form and resets',async({page})=>{
  await page.goto(route);
  // Normalization variants and time bounds are covered by TimePicker unit tests.
  await page.getByRole('button',{name:'예약하기',exact:true}).click();
  await expect(page.locator('#time-required')).toHaveAttribute('aria-invalid','true');
  await page.locator('#time-required').fill('0915');await page.locator('#time-required').press('Enter');
  await expect(page.locator('#time-required')).toHaveValue('09:15');
  await page.getByRole('button',{name:'예약하기',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'알림을 예약했습니다.'})).toHaveText('09:15에 알림을 예약했습니다.');
  await page.locator('form').filter({has:page.locator('#time-required')}).getByRole('button',{name:'초기화',exact:true}).click();
  await expect(page.locator('#time-required')).toHaveValue('');
});

test('time picker is keyboard operable and its popup fits the viewport',{tag:'@mobile'},async({page})=>{
  await page.goto(route);
  await page.locator('#time-basic').focus();await page.locator('#time-basic').press('Alt+ArrowDown');
  const popup=page.getByRole('dialog',{name:'시작 시간 선택',exact:true});
  await expect(popup.getByRole('listbox',{name:'시',exact:true}).getByRole('option',{name:'09',exact:true})).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(popup.getByRole('listbox',{name:'시',exact:true}).getByRole('option',{name:'10',exact:true})).toBeFocused();
  const bounds=await popup.boundingBox(),viewport=page.viewportSize();
  expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width+1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height+1);
  const confirm=await popup.getByRole('button',{name:'확인',exact:true}).boundingBox();
  expect(confirm.y+confirm.height).toBeLessThanOrEqual(bounds.y+bounds.height);
  await page.keyboard.press('Escape');await expect(popup).toHaveCount(0);
  await expect(page.locator('#time-basic')).toHaveValue('09:30');
  await expect(page.getByRole('button',{name:'시작 시간 선택 열기',exact:true})).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
});

test('seconds fit in the unchanged panel width and support keyboard selection',{tag:'@mobile'},async({page})=>{
  await page.goto(route);
  await page.getByRole('button',{name:'시작 시간 선택 열기',exact:true}).click();
  const basic=page.getByRole('dialog',{name:'시작 시간 선택',exact:true});
  const basicWidth=(await basic.boundingBox()).width;
  await basic.getByRole('button',{name:'취소'}).click();
  await page.locator('#time-seconds').focus();await page.locator('#time-seconds').press('Alt+ArrowDown');
  const popup=page.getByRole('dialog',{name:'초 단위 시간 선택',exact:true});
  const bounds=await popup.boundingBox();expect(bounds.width).toBeCloseTo(basicWidth,1);expect(bounds.width).toBeLessThanOrEqual(280);
  await expect(popup.locator('.time-popup-heading, .component-helper')).toHaveCount(0);
  for (const label of await popup.locator('.datetime-time-label').all()) expect((await label.boundingBox()).height).toBe(24);
  const seconds=popup.getByRole('listbox',{name:'초',exact:true});
  await seconds.getByRole('option',{name:'15',exact:true}).focus();await page.keyboard.press('ArrowDown');
  await expect(seconds.getByRole('option',{name:'20',exact:true})).toBeFocused();
  await popup.getByRole('button',{name:'확인'}).click();await expect(page.locator('#time-seconds')).toHaveValue('09:30:20');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
});
