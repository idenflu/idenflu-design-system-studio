const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const tabList=page=>page.locator('.layout-workspace-tabs > .tab-list');
const activeTab=page=>tabList(page).getByRole('tab',{selected:true});
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
const hash=page=>page.evaluate(()=>location.hash);

async function openFromMenu(page,isMobile,name){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name,exact:true}).click();
  await expect(activeTab(page)).toHaveText(new RegExp(name));
}

test('the plain sample URL keeps its default tabs and opening a screen adds a history entry',async({page,isMobile})=>{
  await page.goto(sample);
  await expect(activeTab(page)).toHaveText(/전체 프로젝트/);
  expect(await hash(page)).toBe('');
  await openFromMenu(page,isMobile,'역할 관리');
  expect(await hash(page)).toBe('#/roles');
  await tabList(page).getByRole('tab',{name:/대시보드/}).click();
  await expect(activeTab(page)).toHaveText(/대시보드/);
  expect(await hash(page)).toBe('#/dashboard');
  await page.goBack();
  await expect(activeTab(page)).toHaveText(/전체 프로젝트/);
  expect(await hash(page)).toBe('');
  await expect(tabList(page).getByRole('tab')).toHaveCount(3);
  await page.goForward();
  await expect(activeTab(page)).toHaveText(/대시보드/);
});

test('deep links open the screen, reload restores the open tabs and invalid routes fall back to the project list',async({page})=>{
  await page.goto(`${sample}#/projects/PRJ-003`);
  await expect(activeTab(page)).toHaveText('파트너 포털');
  await expect(panel(page).getByRole('heading',{level:1,name:'파트너 포털',exact:true})).toBeVisible();
  await expect(tabList(page).getByRole('tab')).toHaveCount(3);
  await page.goto(`${sample}#/settings/notifications`);
  await expect(activeTab(page)).toHaveText(/알림 설정/);
  await expect(tabList(page).getByRole('tab')).toHaveCount(4);
  await page.reload();
  await expect(activeTab(page)).toHaveText(/알림 설정/);
  await expect(tabList(page).getByRole('tab')).toHaveCount(4);
  await page.getByRole('button',{name:'알림 설정 탭 닫기',exact:true}).click();
  await expect(activeTab(page)).toHaveText('파트너 포털');
  expect(await hash(page)).toBe('#/projects/PRJ-003');
  await page.goto(`${sample}#/projects/PRJ-999`);
  await expect(activeTab(page)).toHaveText('찾을 수 없음');
  expect(await hash(page)).toBe('#/projects/PRJ-999');
  await expect(panel(page).getByRole('heading',{level:1,name:'프로젝트를 찾을 수 없습니다',exact:true})).toBeVisible();
  await expect(panel(page)).toContainText('#/projects/PRJ-999');
  await expect(page.locator('.layout-workspace-sidebar .tree-item.is-selected')).toHaveCount(0);
  await panel(page).getByRole('button',{name:'전체 프로젝트',exact:true}).click();
  await expect(activeTab(page)).toHaveText(/전체 프로젝트/);
  expect(await hash(page)).toBe('#/projects');
  await page.goto(`${sample}#/nope/here`);
  await expect(activeTab(page)).toHaveText('찾을 수 없음');
  expect(await hash(page)).toBe('#/nope/here');
  await expect(panel(page).getByRole('heading',{level:1,name:'화면을 찾을 수 없습니다',exact:true})).toBeVisible();
  await expect(panel(page)).toContainText('#/nope/here');
  await page.reload();
  await expect(activeTab(page)).toHaveText('찾을 수 없음');
  await expect(panel(page)).toContainText('#/nope/here');
  // Closing the active not-found tab moves to the previous tab (the earlier not-found address) and then to the project.
  const closeActive=()=>tabList(page).locator('.tab-item').filter({has:page.getByRole('tab',{selected:true})}).getByRole('button',{name:/탭 닫기$/}).click();
  await closeActive();
  await expect(activeTab(page)).toHaveText('찾을 수 없음');
  expect(await hash(page)).toBe('#/projects/PRJ-999');
  await closeActive();
  await expect(activeTab(page)).toHaveText('파트너 포털');
  expect(await hash(page)).toBe('#/projects/PRJ-003');
});
