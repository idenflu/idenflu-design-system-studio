const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const activePanel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');

test('workspace screens share PageHeader and keep one visible page title',{tag:'@mobile'},async({page})=>{
  for(const [route,title] of [
    ['projects','전체 프로젝트'],
    ['roles','역할 관리'],
    ['settings','워크스페이스 설정'],
    ['dashboard','대시보드'],
  ]) {
    await page.goto(`${sample}#/${route}`);
    const panel=activePanel(page);
    const header=panel.locator('.page-header.layout-page-heading');
    await expect(header).toHaveCount(1);
    await expect(header.getByRole('heading',{level:1,name:title,exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
    await expect(header.locator('.page-header-description')).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test('PageHeader actions keep dashboard navigation and member invitation working',{tag:'@mobile'},async({page})=>{
  await page.goto(`${sample}#/dashboard`);
  await activePanel(page).locator('.page-header-actions').getByRole('button',{name:'프로젝트 전체 보기',exact:true}).click();
  await expect(activePanel(page).getByRole('heading',{level:1,name:'전체 프로젝트',exact:true})).toBeVisible();

  await page.goto(`${sample}#/members`);
  const invite=activePanel(page).locator('.page-header-actions').getByRole('button',{name:'멤버 초대',exact:true});
  await invite.click();
  const dialog=page.getByRole('dialog',{name:'멤버 초대',exact:true});
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(invite).toBeFocused();
});

test('shared PageHeader leaves grid scrolling inside the remaining workspace height',{tag:'@mobile'},async({page})=>{
  await page.goto(`${sample}#/projects`);
  const panel=activePanel(page);
  const header=panel.locator('.page-header.layout-page-heading');
  const scroll=panel.locator('.data-grid-scroll');
  await expect(header).toBeVisible();
  await expect.poll(()=>scroll.evaluate(element=>element.scrollHeight-element.clientHeight)).toBeGreaterThan(0);
  await expect.poll(()=>panel.evaluate(element=>element.scrollHeight-element.clientHeight)).toBeLessThanOrEqual(1);
  await expect.poll(()=>panel.evaluate(element=>{
    const content=element.querySelector('.layout-page-content');
    const grid=content.querySelector('.data-grid');
    const padding=parseFloat(getComputedStyle(content).paddingBottom);
    return Math.abs(content.getBoundingClientRect().bottom-padding-grid.getBoundingClientRect().bottom);
  })).toBeLessThanOrEqual(2);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight-window.innerHeight)).toBeLessThanOrEqual(1);
  await scroll.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  await expect.poll(()=>scroll.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
  await expect(header).toBeVisible();
  await expect(header.getByRole('heading',{level:1,name:'전체 프로젝트',exact:true})).toBeVisible();
});
