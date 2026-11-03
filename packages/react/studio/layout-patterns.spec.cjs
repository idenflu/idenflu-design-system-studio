const {test,expect}=require('@playwright/test');
const overview='/systems/idenflu-mono/index.html#/patterns/layout';
const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
async function navigate(page,label,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:label,exact:true}).click();
  await expect(panel(page).getByRole('heading',{level:1,name:label,exact:true})).toBeVisible();
}

test('floating screen settings update the workspace and persist after reload',async({page,isMobile})=>{
  test.skip(isMobile);
  await page.goto(sample);
  const trigger=page.getByRole('button',{name:'화면 조정',exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'화면 조정',exact:true});
  await dialog.getByRole('slider',{name:'글자 크기'}).fill('18');
  await dialog.getByRole('slider',{name:'컨트롤 높이'}).fill('48');
  await expect(page.locator('.layout-workspace-sidebar .tree-item').first()).toHaveCSS('font-size','18px');
  await expect(panel(page).locator('.layout-page-heading h1')).toHaveCSS('font-size','30px');
  await expect(panel(page).locator('.layout-filter-panel .select-trigger').first()).toHaveCSS('height','48px');
  await page.reload();
  await expect(panel(page).locator('.layout-filter-panel .select-trigger').first()).toHaveCSS('height','48px');
  await trigger.click();
  await expect(dialog.getByRole('slider',{name:'글자 크기'})).toHaveValue('18');
  await dialog.getByRole('button',{name:'화면 조정 닫기'}).click();
  await expect(trigger).toBeFocused();
});

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

test('tree groups can be collapsed while searching without changing the saved navigation state',async({page,isMobile})=>{
  await page.goto(sample);
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  const nav=page.locator('.layout-tree-navigation:visible');
  await page.getByRole('searchbox',{name:'메뉴 검색',exact:true}).last().fill('프로젝트');
  const group=nav.locator('details').filter({hasText:'프로젝트 관리'}).last();
  await expect(group).toHaveAttribute('open','');
  await group.locator('summary').click();
  await expect(group).not.toHaveAttribute('open','');
  await page.getByRole('searchbox',{name:'메뉴 검색',exact:true}).last().fill('');
  await expect(nav.locator('details').filter({hasText:'프로젝트 관리'}).last()).toHaveAttribute('open','');
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
  await expect(panel(page).getByRole('button',{name:/디자인 시스템 v2/})).toBeVisible();
});

test('bulk selection clears when a project leaves the current list',async({page,isMobile})=>{
  await page.goto(sample);
  await navigate(page,'진행 중 프로젝트',isMobile);
  const row=panel(page).locator('.data-grid-table tbody tr').first();
  await row.getByRole('checkbox').check();
  await expect(panel(page).locator('.data-grid-selection')).toContainText('1개 선택됨');
  await row.getByRole('button',{name:/디자인 시스템 v2/}).click();
  await panel(page).getByRole('button',{name:'완료로 표시',exact:true}).click();
  if(isMobile){
    await page.getByRole('button',{name:'열린 탭 메뉴',exact:true}).click();
    await page.getByRole('menuitem',{name:'진행 중 프로젝트',exact:true}).click();
  }else await page.getByRole('tab',{name:'진행 중 프로젝트',exact:true}).click();
  await expect(panel(page).locator('.data-grid-selection')).toHaveCount(0);
});

test('bulk completion uses the grid selection toolbar',async({page})=>{
  await page.goto(sample);
  const row=panel(page).locator('.data-grid-table tbody tr').first();
  await row.getByRole('checkbox').check();
  const selection=panel(page).locator('.data-grid-selection');
  await expect(selection).toContainText('1개 선택됨');
  await selection.getByRole('button',{name:'선택 항목 완료',exact:true}).click();
  await expect(row).toContainText('완료');
  await expect(selection).toHaveCount(0);
});

test('project creation validates input and opens the newly created detail tab',async({page,isMobile})=>{
  await page.goto(sample);
  await panel(page).getByRole('button',{name:'새 프로젝트',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'새 프로젝트',exact:true});
  await expect(dialog.locator('.dialog-footer')).toHaveCSS('border-top-width','1px');
  await dialog.getByRole('button',{name:'프로젝트 만들기',exact:true}).click();
  await expect(dialog.getByRole('textbox',{name:'프로젝트 이름',exact:true})).toHaveAttribute('aria-invalid','true');
  await dialog.getByRole('textbox',{name:'프로젝트 이름',exact:true}).fill('레이아웃 검증');
  const fields=dialog.locator('.layout-project-form-row > div');
  const team=await fields.nth(0).boundingBox(), due=await fields.nth(1).boundingBox();
  expect(team).not.toBeNull();expect(due).not.toBeNull();
  if(isMobile) expect(due.y).toBeGreaterThan(team.y);
  else expect(Math.abs(team.y-due.y)).toBeLessThan(2);
  await dialog.getByRole('combobox',{name:'담당 팀: 프로덕트 디자인'}).click();
  await dialog.getByRole('option',{name:'플랫폼 개발',exact:true}).click();
  await dialog.getByRole('button',{name:'달력 열기'}).click();
  const popup=await dialog.locator('.date-popup').boundingBox(),body=await dialog.locator('.dialog-body').boundingBox();
  expect(popup).not.toBeNull();expect(body).not.toBeNull();
  expect(popup.x).toBeGreaterThanOrEqual(body.x);expect(popup.x+popup.width).toBeLessThanOrEqual(body.x+body.width);
  await dialog.getByRole('button',{name:'2026년 11월 21일',exact:true}).click();
  await expect(dialog.getByRole('textbox',{name:'목표 마감일'})).toHaveValue('2026-11-21');
  await dialog.getByRole('button',{name:'프로젝트 만들기',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('tab',{name:'레이아웃 검증',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(panel(page).getByRole('heading',{level:1,name:'레이아웃 검증',exact:true})).toBeVisible();
  await expect(panel(page).getByRole('combobox',{name:'담당 팀: 플랫폼 개발'})).toBeVisible();
  await expect(panel(page).getByRole('textbox',{name:'목표 마감일'})).toHaveValue('2026-11-21');
});

test('member invitation validates and submits through the modal footer',async({page,isMobile})=>{
  await page.goto(sample);
  await navigate(page,'멤버 관리',isMobile);
  await panel(page).getByRole('button',{name:'멤버 초대',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'멤버 초대',exact:true});
  await expect(dialog.locator('.dialog-footer')).toHaveCSS('border-top-width','1px');
  await dialog.getByRole('textbox',{name:'이름',exact:true}).fill('신규 멤버');
  const email=dialog.getByRole('textbox',{name:'이메일',exact:true});
  await email.fill('minsu@example.com');
  await dialog.getByRole('button',{name:'멤버 추가',exact:true}).click();
  await expect(dialog.getByText('이미 등록된 이메일입니다.')).toBeVisible();
  await email.fill('new-member@example.com');
  await email.press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(panel(page).getByText('new-member@example.com')).toBeVisible();
});

test('quick search opens a matching menu and tab management preserves pinned home',async({page})=>{
  await page.goto(sample);
  await page.keyboard.press('ControlOrMeta+k');
  const search=page.getByRole('dialog',{name:'빠른 검색',exact:true});
  await expect(search.getByRole('searchbox')).toBeFocused();
  await expect(search.locator('.dialog-header')).toHaveCSS('display','flex');
  await search.getByRole('searchbox').fill('검토');
  await search.getByRole('button',{name:/검토 요청/}).click();
  await expect(page.getByRole('tab',{name:'검토 요청',exact:true})).toHaveAttribute('aria-selected','true');
  await page.locator('.layout-tabs-toolbar').getByRole('button').click();
  await page.getByRole('menuitem',{name:'작업 탭 모두 닫기',exact:true}).click();
  await expect(page.getByRole('tab')).toHaveCount(1);
  await expect(panel(page).getByRole('heading',{name:'팀 홈',exact:true})).toBeVisible();
});

test('mobile tabs show the selected screen and allow switching from the open tabs menu',async({page})=>{
  await page.goto(sample);
  await page.setViewportSize({width:390,height:844});
  await navigate(page,'워크스페이스 설정',true);
  await navigate(page,'멤버 관리',true);
  await expect(page.locator('.layout-workspace-tabs > .tab-list [role="tab"]:visible')).toHaveCount(1);
  await expect(page.getByRole('tab',{name:'멤버 관리',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'열린 탭 메뉴',exact:true}).click();
  await page.getByRole('menuitem',{name:'전체 프로젝트',exact:true}).click();
  await expect(page.getByRole('tab',{name:'전체 프로젝트',exact:true})).toBeVisible();
  await expect(page.locator('.layout-workspace-tabs > .tab-list [role="tab"]:visible')).toHaveCount(1);
  await expect(panel(page).getByRole('heading',{level:1,name:'전체 프로젝트',exact:true})).toBeVisible();
});

test('project overview card keeps its content height beside taller properties',async({page,isMobile})=>{
  test.skip(isMobile);
  await page.goto(sample);
  await panel(page).getByRole('button',{name:/디자인 시스템 v2/}).click();
  const overview=await panel(page).locator('.layout-project-overview').boundingBox();
  const properties=await panel(page).locator('.layout-project-properties').boundingBox();
  expect(overview).not.toBeNull();
  expect(properties).not.toBeNull();
  expect(Math.abs(overview.y-properties.y)).toBeLessThan(2);
  expect(properties.height-overview.height).toBeGreaterThan(20);
});

test('opening one notification leaves the other unread',async({page})=>{
  await page.goto(sample);
  await page.getByRole('button',{name:'업무 알림 2개',exact:true}).click();
  await page.getByRole('region',{name:'업무 알림'}).getByRole('button',{name:/프로젝트 검토 요청/}).click();
  await expect(page.getByRole('button',{name:'업무 알림 1개',exact:true})).toBeVisible();
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
