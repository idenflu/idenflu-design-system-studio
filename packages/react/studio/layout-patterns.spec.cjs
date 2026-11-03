const {test,expect}=require('@playwright/test');
const overview='/systems/idenflu-mono/index.html#/patterns/layout';
const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
async function navigate(page,label,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:label,exact:true}).click();
  await expect(panel(page).getByRole('heading',{level:1,name:label,exact:true})).toBeVisible();
}

test('Layout introduces the sidebar workspace and opens the sample in a new tab',async({page})=>{
  await page.goto(overview);
  await expect(page.getByRole('heading',{level:1,name:'Layout',exact:true})).toBeVisible();
  await expect(page.locator('.layout-pattern-card')).toHaveCount(1);
  const opening=page.waitForEvent('popup');
  await page.getByRole('link',{name:'사이드바형 샘플 화면 열기 (새 탭)',exact:true}).click();
  const opened=await opening;
  await expect(opened).toHaveURL(/\?layout=sidebar$/);
  await expect(panel(opened).getByRole('heading',{name:'전체 프로젝트',exact:true})).toBeVisible();
  await expect(opened.locator('.docs-layout')).toHaveCount(0);
});

test('tree navigation opens unique tabs, preserves state, and closes to the adjacent screen',async({page,isMobile})=>{
  await page.goto(sample);
  await panel(page).getByRole('searchbox',{name:'프로젝트 검색',exact:true}).fill('디자인 시스템');
  await navigate(page,'워크스페이스 설정',isMobile);
  await panel(page).getByRole('textbox',{name:'워크스페이스 이름',exact:true}).fill('작성 중인 이름');
  await navigate(page,'멤버 관리',isMobile);
  await panel(page).getByRole('searchbox',{name:'멤버 검색',exact:true}).fill('박지훈');
  await navigate(page,'전체 프로젝트',isMobile);
  await expect(page.getByRole('tab',{name:'전체 프로젝트',exact:true})).toHaveCount(1);
  await expect(panel(page).getByRole('searchbox',{name:'프로젝트 검색',exact:true})).toHaveValue('디자인 시스템');
  await expect(panel(page).locator('tbody tr')).toHaveCount(1);
  await navigate(page,'워크스페이스 설정',isMobile);
  await expect(panel(page).getByRole('textbox',{name:'워크스페이스 이름',exact:true})).toHaveValue('작성 중인 이름');
  await page.getByRole('button',{name:'워크스페이스 설정 탭 닫기',exact:true}).click();
  await expect(page.getByRole('tab',{name:'전체 프로젝트',exact:true})).toBeFocused();
  await expect(page.getByRole('tab',{name:'전체 프로젝트',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('button',{name:'팀 홈 탭 닫기',exact:true})).toHaveCount(0);
});

test('project details open in a tab and update other open screens',async({page,isMobile})=>{
  await page.goto(sample);
  await panel(page).getByRole('button',{name:/디자인 시스템 v2/}).click();
  await expect(page.getByRole('tab',{name:'디자인 시스템 v2',exact:true})).toHaveAttribute('aria-selected','true');
  await panel(page).getByRole('button',{name:'완료로 표시',exact:true}).click();
  await expect(panel(page).getByRole('combobox',{name:'프로젝트 상태: 완료',exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'디자인 시스템 v2',exact:true}).focus();
  await page.keyboard.press('Delete');
  await expect(page.getByRole('tab',{name:'디자인 시스템 v2',exact:true})).toHaveCount(0);
  await expect(panel(page).locator('tbody tr').first()).toContainText('완료');
  await navigate(page,'완료된 프로젝트',isMobile);
  await expect(panel(page).locator('tbody tr')).toHaveCount(2);
});

test('project creation validates input and opens the newly created detail tab',async({page})=>{
  await page.goto(sample);
  await panel(page).getByRole('button',{name:'새 프로젝트',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'새 프로젝트',exact:true});
  await dialog.getByRole('button',{name:'프로젝트 만들기',exact:true}).click();
  await expect(dialog.getByRole('textbox',{name:'프로젝트 이름',exact:true})).toHaveAttribute('aria-invalid','true');
  await dialog.getByRole('textbox',{name:'프로젝트 이름',exact:true}).fill('레이아웃 검증');
  await dialog.getByRole('button',{name:'프로젝트 만들기',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('tab',{name:'레이아웃 검증',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(panel(page).getByRole('heading',{level:1,name:'레이아웃 검증',exact:true})).toBeVisible();
});

test('quick search opens a matching menu and tab management preserves pinned home',async({page})=>{
  await page.goto(sample);
  await page.keyboard.press('ControlOrMeta+k');
  const search=page.getByRole('dialog',{name:'빠른 검색',exact:true});
  await search.getByRole('searchbox').fill('검토');
  await search.getByRole('button',{name:/검토 요청/}).click();
  await expect(page.getByRole('tab',{name:'검토 요청',exact:true})).toHaveAttribute('aria-selected','true');
  await page.locator('.layout-tabs-toolbar').getByRole('button').click();
  await page.getByRole('menuitem',{name:'모든 탭 닫기',exact:true}).click();
  await expect(page.getByRole('tab')).toHaveCount(1);
  await expect(panel(page).getByRole('heading',{name:'팀 홈',exact:true})).toBeVisible();
});

test('mobile Drawer restores focus and active tabs stay visible after resizing',async({page})=>{
  await page.goto(sample);
  await page.setViewportSize({width:320,height:740});
  const menu=page.getByRole('button',{name:'메뉴 열기',exact:true});
  await menu.click();
  await expect(page.getByRole('dialog',{name:'워크스페이스 메뉴',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(menu).toBeFocused();
  await navigate(page,'워크스페이스 설정',true);
  const bounds=await page.getByRole('tab',{name:'워크스페이스 설정',exact:true}).boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(277);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
});
