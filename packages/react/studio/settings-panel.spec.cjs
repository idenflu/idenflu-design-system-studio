const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const settings=page=>page.getByRole('dialog',{name:'화면 조정',exact:true});
const trigger=page=>page.getByRole('button',{name:'화면 조정',exact:true});

test('screen settings stay open while the visible workspace remains usable',async({page,isMobile})=>{
  test.skip(isMobile);
  await page.goto(sample);
  await trigger(page).click();
  await expect(settings(page)).toHaveAttribute('aria-modal','false');
  await expect(trigger(page)).toHaveAttribute('aria-expanded','true');
  expect(await settings(page).evaluate(element=>element.matches(':modal'))).toBe(false);
  const surface=await page.locator('.layout-sample-app').boundingBox();
  const side=await settings(page).boundingBox();
  expect(surface.x+surface.width).toBeLessThanOrEqual(side.x+1);
  await page.locator('.layout-workspace-sidebar').getByRole('button',{name:'대시보드',exact:true}).click();
  await expect(page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])').getByRole('heading',{name:'대시보드',exact:true})).toBeVisible();
  await expect(settings(page)).toBeVisible();
  await settings(page).getByRole('button',{name:'화면 조정 닫기',exact:true}).click();
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAttribute('aria-expanded','false');
});

test('screen settings preview a color immediately and restore focus after Escape',async({page})=>{
  await page.goto(sample);
  await trigger(page).click();
  const primary=settings(page).getByRole('textbox',{name:'Primary HEX',exact:true});
  await primary.fill('#26734d');
  await primary.press('Enter');
  await expect(page.locator('.layout-project-link-title .ui-icon').first()).toHaveCSS('color','rgb(38, 115, 77)');
  await expect(settings(page)).toBeVisible();
  await primary.press('Escape');
  await expect(settings(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test('screen settings do not lock document scrolling or trap keyboard navigation',async({page})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/text-fields');
  const overflow=await page.evaluate(()=>({body:getComputedStyle(document.body).overflow,root:getComputedStyle(document.documentElement).overflow}));
  await trigger(page).click();
  expect(await page.evaluate(()=>({body:getComputedStyle(document.body).overflow,root:getComputedStyle(document.documentElement).overflow}))).toEqual(overflow);
  const close=settings(page).getByRole('button',{name:'닫기',exact:true});
  await close.focus();
  await page.keyboard.press('Tab');
  expect(await settings(page).evaluate(element=>element.contains(document.activeElement))).toBe(false);
  await trigger(page).focus();
  await trigger(page).press('Escape');
  await expect(settings(page)).toBeHidden();
});

test('screen settings fit a narrow viewport and keep their close control available',async({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.goto(sample);
  await trigger(page).click();
  const box=await settings(page).boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(320);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y+box.height).toBeLessThanOrEqual(740);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await settings(page).getByRole('button',{name:'화면 조정 닫기',exact:true}).click();
  await expect(settings(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});
