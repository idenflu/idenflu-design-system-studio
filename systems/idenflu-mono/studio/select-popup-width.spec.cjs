const {test,expect}=require('@playwright/test');
const url='/systems/idenflu-mono/index.html#/components/select';
const labels=['전체','SI 구축','솔루션 납품'];

// Narrow the first single Select like a content-sized filter row and use the labels from the reported case.
async function openSelect(page,wrapperStyle) {
  await page.goto(url);
  const trigger=page.locator('.custom-select:not([data-multiselect]):not(.search-select) > .select-trigger').first();
  await trigger.evaluate((node,[labels,style])=>{
    const root=node.closest('.custom-select');
    root.parentElement.setAttribute('style',style);
    root.querySelectorAll('.option-label').forEach((label,index)=>{ label.textContent=labels[index%labels.length]; });
  },[labels,wrapperStyle]);
  await trigger.click();
  const popup=trigger.locator('..').locator('.select-popup');
  await expect(popup).toBeVisible();
  return {trigger,popup};
}

function measure(popup) {
  return popup.evaluate(node=>{
    const box=element=>element.getBoundingClientRect();
    return {
      trigger:box(node.parentElement.querySelector('.select-trigger')).width,
      popup:{left:box(node).left,right:box(node).right,width:box(node).width},
      viewport:document.documentElement.clientWidth,
      options:[...node.querySelectorAll('.select-option')].slice(0,3).map(option=>{
        const label=option.querySelector('.option-label');
        return {
          lines:Math.round(box(label).height/parseFloat(getComputedStyle(label).lineHeight)),
          checkInset:Math.round(box(option).right-box(option.querySelector('.option-check')).right),
        };
      }),
    };
  });
}

test('a narrow Select widens its list so each option reads on one line without resizing the trigger',async({page})=>{
  const {popup}=await openSelect(page,'width:72px');
  const result=await measure(popup);
  expect(result.trigger).toBeCloseTo(72,0);
  expect(result.popup.width).toBeGreaterThan(result.trigger);
  for(const option of result.options) expect(option.lines).toBe(1);
});

test('a wide Select keeps the list at the trigger width with checks aligned to the end',async({page})=>{
  const {popup}=await openSelect(page,'width:480px');
  const result=await measure(popup);
  expect(result.popup.width).toBeCloseTo(result.trigger,0);
  expect(new Set(result.options.map(option=>option.checkInset)).size).toBe(1);
});

test('a widened list near the viewport edge stays visible and keyboard selectable',{tag:'@mobile'},async({page})=>{
  const {trigger,popup}=await openSelect(page,'position:fixed;top:160px;right:4px;width:72px;z-index:1000');
  const result=await measure(popup);
  expect(result.popup.left).toBeGreaterThanOrEqual(11.5);
  expect(result.popup.right).toBeLessThanOrEqual(result.viewport-11.5);
  for(const option of result.options) expect(option.lines).toBe(1);
  await trigger.press('Home');
  await trigger.press('ArrowDown');
  await trigger.press('Enter');
  await expect(popup).toBeHidden();
  await expect(popup.locator('.select-option').nth(1)).toHaveAttribute('aria-selected','true');
});
