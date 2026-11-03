const {test,expect}=require('@playwright/test');
const overview='/systems/idenflu-mono/index.html#/patterns/layout';
const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
async function navigate(page,label,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:label,exact:true}).click();
  await expect(panel(page).getByRole('heading',{level:1,name:label,exact:true})).toBeVisible();
}
async function enableColumnFilters(container){
  const toggle=container.getByRole('button',{name:'컬럼 필터',exact:true});
  if(await toggle.getAttribute('aria-pressed')==='false')await toggle.click();
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
  await enableColumnFilters(panel(page));
  await panel(page).getByRole('textbox',{name:'프로젝트 필터',exact:true}).fill('디자인 시스템');
  await navigate(page,'워크스페이스 설정',isMobile);
  await panel(page).getByRole('textbox',{name:'워크스페이스 이름',exact:true}).fill('작성 중인 이름');
  await navigate(page,'멤버 관리',isMobile);
  await panel(page).getByRole('searchbox',{name:'멤버 검색',exact:true}).fill('박지훈');
  await navigate(page,'전체 프로젝트',isMobile);
  await expect(page.getByRole('tab',{name:'전체 프로젝트',exact:true})).toHaveCount(1);
  await expect(panel(page).getByRole('textbox',{name:'프로젝트 필터',exact:true})).toHaveValue('디자인 시스템');
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

test('project detail opens in a dialog, preserves the list, and reuses its tab',async({page,isMobile})=>{
  await page.goto(sample);
  await enableColumnFilters(panel(page));
  await panel(page).getByRole('textbox',{name:'프로젝트 필터',exact:true}).fill('디자인 시스템');
  await panel(page).getByRole('button',{name:/디자인 시스템 v2/}).click();
  const dialog=page.getByRole('dialog',{name:'프로젝트 상세',exact:true});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('디자인 시스템 v2');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(panel(page).getByRole('textbox',{name:'프로젝트 필터',exact:true})).toHaveValue('디자인 시스템');
  await expect(page.getByRole('tab',{name:'디자인 시스템 v2',exact:true})).toHaveCount(0);
  await panel(page).getByRole('button',{name:/디자인 시스템 v2/}).click();
  await dialog.getByRole('button',{name:'새 탭으로 열기',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('tab',{name:'디자인 시스템 v2',exact:true})).toHaveAttribute('aria-selected','true');
  await panel(page).getByRole('button',{name:'완료로 표시',exact:true}).click();
  await expect(panel(page).getByRole('combobox',{name:'프로젝트 상태: 완료',exact:true})).toBeVisible();
  await navigate(page,'전체 프로젝트',isMobile);
  await panel(page).getByRole('button',{name:/디자인 시스템 v2/}).click();
  await dialog.getByRole('button',{name:'새 탭으로 열기',exact:true}).click();
  await expect(page.getByRole('tab',{name:'디자인 시스템 v2',exact:true})).toHaveCount(1);
  await expect(page.getByRole('tab',{name:'디자인 시스템 v2',exact:true})).toHaveAttribute('aria-selected','true');
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
  await expect(panel(page).locator('.data-grid-selection-count')).toContainText('1개 선택됨');
  await row.getByRole('button',{name:/디자인 시스템 v2/}).click();
  const dialog=page.getByRole('dialog',{name:'프로젝트 상세',exact:true});
  await dialog.getByRole('button',{name:'완료로 표시',exact:true}).click();
  await page.keyboard.press('Escape');
  await expect(panel(page).locator('.data-grid-selection')).toHaveCount(0);
});

test('project filters own deletion while the selection toolbar keeps exports and clearing',async({page,isMobile})=>{
  await page.goto(sample);
  for(const title of ['전체 프로젝트','진행 중 프로젝트','검토 요청','완료된 프로젝트']){
    if(title!=='전체 프로젝트')await navigate(page,title,isMobile);
    const filters=panel(page).getByRole('search',{name:'프로젝트 필터 검색',exact:true});
    const remove=filters.getByRole('button',{name:'삭제',exact:true});
    const grid=panel(page).getByRole('group',{name:`${title} 목록`,exact:true});
    await expect(remove).toBeDisabled();
    await expect(grid.getByRole('button',{name:'삭제',exact:true})).toHaveCount(0);
    await expect(panel(page).getByRole('button',{name:'선택 항목 완료',exact:true})).toHaveCount(0);
    const first=grid.locator('tbody tr[data-grid-row-id]').first();
    const checkbox=first.getByRole('checkbox');
    await checkbox.check();
    await expect(remove).toBeEnabled();
    const selection=grid.locator('.data-grid-selection');
    await expect(grid.locator('.data-grid-selection-count')).toContainText('1개 선택됨');
    await expect(selection.getByRole('button',{name:'선택한 행 내보내기',exact:true})).toBeEnabled();
    const excel=selection.getByRole('button',{name:'선택한 행 Excel 내보내기',exact:true});
    await expect(excel).toBeEnabled();
    await expect(excel.locator('.icon-microsoft-excel')).toHaveCount(1);
    await selection.getByRole('button',{name:'선택 해제',exact:true}).click();
    await expect(checkbox).not.toBeChecked();
    await expect(selection).toHaveCount(0);
    await expect(remove).toBeDisabled();
    await expect(grid.getByRole('button',{name:'CSV 내보내기',exact:true})).toBeEnabled();
    await expect(grid.getByRole('button',{name:'Excel 내보내기',exact:true})).toBeEnabled();
  }
});

test('project deletion can be cancelled and removes only confirmed projects and their tabs',async({page,isMobile})=>{
  await page.goto(sample);
  const detail=page.getByRole('dialog',{name:'프로젝트 상세',exact:true});
  // Mobile hides inactive tabs; their presence still represents an open screen.
  const tabs=page.locator('.layout-workspace-tabs > .tab-list');
  const deletedTab=tabs.getByRole('tab',{name:'디자인 시스템 v2',exact:true,includeHidden:true});
  const retainedTab=tabs.getByRole('tab',{name:'파트너 포털',exact:true,includeHidden:true});
  for(const name of ['디자인 시스템 v2','파트너 포털']){
    await panel(page).getByRole('button',{name:new RegExp(name)}).click();
    await detail.getByRole('button',{name:'새 탭으로 열기',exact:true}).click();
    await navigate(page,'전체 프로젝트',isMobile);
  }
  await expect(deletedTab).toHaveCount(1);
  await expect(retainedTab).toHaveCount(1);
  const grid=panel(page).getByRole('group',{name:'전체 프로젝트 목록',exact:true});
  const first=grid.locator('tr[data-grid-row-id="PRJ-001"]');
  const second=grid.locator('tr[data-grid-row-id="PRJ-002"]');
  await first.getByRole('checkbox').check();
  await second.getByRole('checkbox').check();
  const remove=panel(page).getByRole('search',{name:'프로젝트 필터 검색',exact:true}).getByRole('button',{name:'삭제',exact:true});
  const confirmation=page.getByRole('dialog',{name:'프로젝트 삭제',exact:true});
  await remove.click();
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByRole('button',{name:'취소',exact:true})).toBeFocused();
  await expect(confirmation).toContainText('선택한 2개 프로젝트를 삭제할까요?');
  await expect(confirmation.locator('.layout-delete-project-list > li')).toHaveCount(2);
  await confirmation.getByRole('button',{name:'취소',exact:true}).click();
  await expect(confirmation).not.toBeVisible();
  await expect(first.getByRole('checkbox')).toBeChecked();
  await expect(second.getByRole('checkbox')).toBeChecked();
  await expect(grid.locator('.data-grid-selection-count')).toContainText('2개 선택됨');
  await expect(deletedTab).toHaveCount(1);
  await expect(retainedTab).toHaveCount(1);
  await remove.click();
  await confirmation.getByRole('button',{name:'삭제',exact:true}).click();
  await expect(confirmation).not.toBeVisible();
  await expect(first).toHaveCount(0);
  await expect(second).toHaveCount(0);
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(118);
  await expect(grid.locator('.data-grid-selection')).toHaveCount(0);
  await expect(remove).toBeDisabled();
  await expect(grid.locator('.data-grid-scroll')).toBeFocused();
  await expect(deletedTab).toHaveCount(0);
  await expect(retainedTab).toHaveCount(1);
  await expect(detail).not.toBeVisible();
  await navigate(page,'진행 중 프로젝트',isMobile);
  await expect(panel(page).locator('tr[data-grid-row-id="PRJ-001"]')).toHaveCount(0);
  await navigate(page,'검토 요청',isMobile);
  await expect(panel(page).locator('tr[data-grid-row-id="PRJ-002"]')).toHaveCount(0);
});

test('project deletion previews three items and deletes the full selection',async({page})=>{
  await page.goto(sample);
  const grid=panel(page).getByRole('group',{name:'전체 프로젝트 목록',exact:true});
  await grid.getByRole('checkbox',{name:'검색 결과 전체 선택',exact:true}).check();
  await panel(page).getByRole('search',{name:'프로젝트 필터 검색',exact:true}).getByRole('button',{name:'삭제',exact:true}).click();
  const confirmation=page.getByRole('dialog',{name:'프로젝트 삭제',exact:true});
  await expect(confirmation.getByRole('button',{name:'취소',exact:true})).toBeFocused();
  await expect(confirmation).toContainText('선택한 120개 프로젝트를 삭제할까요?');
  const preview=confirmation.locator('.layout-delete-project-list');
  await expect(preview.locator('li')).toHaveCount(4);
  await expect(preview.locator('li strong')).toHaveText(['디자인 시스템 v2','모바일 앱 온보딩','파트너 포털']);
  await expect(preview.locator('.layout-delete-project-summary')).toHaveText('외 117개 프로젝트');
  await confirmation.getByRole('button',{name:'삭제',exact:true}).click();
  await expect(confirmation).not.toBeVisible();
  await expect(grid.locator('tbody tr[data-grid-row-id]')).toHaveCount(0);
  await expect(grid.locator('.data-grid-selection')).toHaveCount(0);
  await expect(grid.locator('.data-grid-state')).toContainText('등록된 데이터가 없습니다.');
  await expect(grid.locator('.data-grid-scroll')).toBeFocused();
  await expect(panel(page).getByRole('search',{name:'프로젝트 필터 검색',exact:true}).getByRole('button',{name:'삭제',exact:true})).toBeDisabled();
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
  await page.getByRole('dialog',{name:'프로젝트 상세',exact:true}).getByRole('button',{name:'새 탭으로 열기',exact:true}).click();
  const overview=await panel(page).locator('.layout-project-overview').boundingBox();
  const properties=await panel(page).locator('.layout-project-properties').boundingBox();
  expect(overview).not.toBeNull();
  expect(properties).not.toBeNull();
  expect(Math.abs(overview.y-properties.y)).toBeLessThan(2);
  expect(properties.height-overview.height).toBeGreaterThan(20);
});

test('opening one notification leaves the others unread',async({page})=>{
  await page.goto(sample);
  await page.getByRole('button',{name:'업무 알림 3개',exact:true}).click();
  await page.getByRole('region',{name:'업무 알림'}).getByRole('button',{name:/프로젝트 검토 요청/}).click();
  await expect(page.getByRole('button',{name:'업무 알림 2개',exact:true})).toBeVisible();
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

test('project grids fill the content height and keep scrolling inside the rows',async({page,isMobile})=>{
  await page.goto(sample);
  const assertGridFit=async()=>{
    await expect.poll(()=>panel(page).evaluate(element=>{
      const content=element.querySelector('.layout-page-content');
      const grid=content.querySelector('.data-grid');
      const viewport=grid.querySelector('.data-grid-scroll');
      const caption=content.querySelector('.layout-content-caption');
      const contentRect=content.getBoundingClientRect(),gridRect=grid.getBoundingClientRect();
      const panelRect=element.getBoundingClientRect(),footerRect=grid.querySelector('.data-grid-footer').getBoundingClientRect();
      const captionHeight=caption?.getClientRects().length?caption.getBoundingClientRect().height+parseFloat(getComputedStyle(caption).marginTop):0;
      const bottomPadding=parseFloat(getComputedStyle(content).paddingBottom);
      return {
        pageFits:document.documentElement.scrollHeight<=window.innerHeight+1,
        panelFits:element.scrollHeight<=element.clientHeight+1,
        gridFills:Math.abs(contentRect.bottom-bottomPadding-gridRect.bottom-captionHeight)<=2,
        rowAreaVisible:viewport.clientHeight>grid.querySelector('thead').getBoundingClientRect().height+20,
        footerFits:footerRect.top>=panelRect.top&&footerRect.bottom<=panelRect.bottom+1,
      };
    })).toEqual({pageFits:true,panelFits:true,gridFills:true,rowAreaVisible:true,footerFits:true});
  };
  await assertGridFit();
  await navigate(page,'진행 중 프로젝트',isMobile);
  await assertGridFit();
  await navigate(page,'전체 프로젝트',isMobile);
  const grid=panel(page).getByRole('group',{name:'전체 프로젝트 목록',exact:true});
  await expect(grid.locator('tbody tr')).toHaveCount(120);
  await expect(grid.getByRole('combobox',{name:/^페이지당 행 수:/})).toHaveCount(0);
  await expect(grid.locator('[aria-label="전체 프로젝트 목록 페이지 탐색"]')).toHaveCount(0);
  await assertGridFit();
  const scrollbar=grid.getByRole('scrollbar',{name:'전체 프로젝트 목록 세로 스크롤',exact:true});
  await scrollbar.focus();
  await scrollbar.press('End');
  await expect.poll(()=>grid.locator('.data-grid-scroll').evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
  await expect.poll(()=>panel(page).evaluate(element=>element.scrollTop)).toBe(0);
  await grid.getByRole('button',{name:'촘촘한 행 간격',exact:true}).click();
  await expect(grid.getByRole('button',{name:'촘촘한 행 간격',exact:true})).toHaveAttribute('aria-pressed','false');
  await assertGridFit();
  await grid.locator('tbody tr').first().getByRole('checkbox').check();
  await expect(grid.getByRole('button',{name:'선택 해제',exact:true})).toBeVisible();
  await assertGridFit();
  await enableColumnFilters(grid);
  await grid.getByRole('textbox',{name:'프로젝트 필터',exact:true}).fill('일치하지않는프로젝트xyz');
  await expect(grid.locator('.data-grid-state').getByText('검색 결과가 없습니다.',{exact:true})).toBeVisible();
  await assertGridFit();
});

test('project filter popups escape clipping and stay within the viewport',async({page})=>{
  await page.goto(sample);
  const assertFixedPopup=async trigger=>{
    await trigger.click();
    const popup=panel(page).locator('.select-popup[data-popup-strategy="fixed"]:visible');
    await expect(popup).toHaveCSS('position','fixed');
    await expect.poll(()=>popup.evaluate(element=>{
      const bounds=element.getBoundingClientRect();
      const option=element.querySelector('[role="option"]');
      const optionBounds=option.getBoundingClientRect();
      const hit=document.elementFromPoint(optionBounds.left+optionBounds.width/2,optionBounds.top+optionBounds.height/2);
      return {
        insideViewport:bounds.width>0&&bounds.height>0&&bounds.left>=0&&bounds.top>=0&&bounds.right<=window.innerWidth+1&&bounds.bottom<=window.innerHeight+1,
        optionUnclipped:hit?.closest('[role="option"]')===option,
      };
    })).toEqual({insideViewport:true,optionUnclipped:true});
    return popup;
  };
  for(const name of ['담당 팀 필터: 전체 팀','프로젝트 상태 필터: 전체 상태']){
    const trigger=panel(page).getByRole('combobox',{name,exact:true});
    await assertFixedPopup(trigger);
    await trigger.press('Escape');
    await expect(trigger).toBeFocused();
  }
  await expect(panel(page).locator('.select-popup:visible')).toHaveCount(0);
});

test('project management lists apply draft filters on search and reset immediately',async({page,isMobile})=>{
  await page.goto(sample);
  for(const title of ['전체 프로젝트','진행 중 프로젝트','검토 요청','완료된 프로젝트']){
    if(title!=='전체 프로젝트')await navigate(page,title,isMobile);
    const search=panel(page).getByRole('search',{name:'프로젝트 필터 검색',exact:true});
    const grid=panel(page).getByRole('group',{name:`${title} 목록`,exact:true});
    await expect(grid.locator('.data-grid-page-tools')).toHaveCount(0);
    const firstRow=grid.locator('tbody tr').first();
    const originalId=await firstRow.getAttribute('data-grid-row-id');
    await expect(search.getByRole('button',{name:'검색',exact:true})).toBeVisible();
    await search.getByRole('combobox',{name:'담당 팀 필터: 전체 팀',exact:true}).click();
    await search.getByRole('option',{name:'플랫폼 개발',exact:true}).click();
    await expect(firstRow).toHaveAttribute('data-grid-row-id',originalId);
    await search.getByRole('button',{name:'검색',exact:true}).click();
    await expect.poll(()=>grid.locator('tbody tr').evaluateAll(rows=>rows.length>0&&rows.every(row=>row.children[3]?.textContent==='플랫폼 개발'))).toBe(true);
    if(title==='전체 프로젝트'){
      const appliedId=await firstRow.getAttribute('data-grid-row-id');
      await search.getByRole('combobox',{name:'프로젝트 상태 필터: 전체 상태',exact:true}).click();
      await search.getByRole('option',{name:'완료',exact:true}).click();
      await expect(firstRow).toHaveAttribute('data-grid-row-id',appliedId);
      await search.getByRole('button',{name:'검색',exact:true}).press('Enter');
      await expect.poll(()=>grid.locator('tbody tr').evaluateAll(rows=>rows.length>0&&rows.every(row=>row.children[2]?.textContent==='완료'&&row.children[3]?.textContent==='플랫폼 개발'))).toBe(true);
    }
    await enableColumnFilters(grid);
    await grid.getByRole('textbox',{name:'프로젝트 필터',exact:true}).fill('일치하지않는프로젝트xyz');
    await expect(grid.locator('.data-grid-state').getByText('검색 결과가 없습니다.',{exact:true})).toBeVisible();
    await search.getByRole('button',{name:'필터 초기화',exact:true}).click();
    await expect(search.getByRole('combobox',{name:'담당 팀 필터: 전체 팀',exact:true})).toBeVisible();
    await expect(search.getByRole('combobox',{name:'프로젝트 상태 필터: 전체 상태',exact:true})).toBeVisible();
    await expect(grid.getByRole('textbox',{name:'프로젝트 필터',exact:true})).toHaveValue('');
    await expect(firstRow).toHaveAttribute('data-grid-row-id',originalId);
  }
});

test('project column filters combine criteria, clear selections, and reset within the applied search',async({page})=>{
  await page.goto(sample);
  const search=panel(page).getByRole('search',{name:'프로젝트 필터 검색',exact:true});
  const grid=panel(page).getByRole('group',{name:'전체 프로젝트 목록',exact:true});
  await enableColumnFilters(grid);
  const rows=grid.locator('tr[data-grid-row-id]');
  const name=grid.getByRole('textbox',{name:'프로젝트 필터',exact:true});
  const owner=grid.getByRole('textbox',{name:'담당자 필터',exact:true});
  const due=grid.getByRole('textbox',{name:'마감일 필터',exact:true});
  const min=grid.getByRole('spinbutton',{name:'진행률 최솟값',exact:true});
  const max=grid.getByRole('spinbutton',{name:'진행률 최댓값',exact:true});
  const choose=async(label,value)=>{
    await grid.getByRole('combobox',{name:new RegExp(`^${label}:`)}).click();
    await grid.getByRole('option',{name:value,exact:true}).click();
  };
  await expect(grid.getByRole('searchbox')).toHaveCount(0);
  await expect(rows).toHaveCount(120);
  await grid.locator('tr[data-grid-row-id="PRJ-001"]').getByRole('checkbox').check();
  await expect(grid.locator('.data-grid-selection-count')).toContainText('1개 선택됨');
  await name.fill('디자인');
  await expect(grid.locator('.data-grid-selection')).toHaveCount(0);
  await owner.fill('김민수');
  await min.fill('70');
  await max.fill('80');
  await due.fill('2026-11-12');
  await choose('상태 필터','진행 중');
  await choose('담당 팀 필터','프로덕트 디자인');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute('data-grid-row-id','PRJ-001');
  await choose('상태 필터','완료');
  await expect(rows).toHaveCount(0);
  await grid.getByRole('button',{name:'조건 초기화',exact:true}).click();
  await expect(rows).toHaveCount(120);
  for(const input of [name,owner,due,min,max])await expect(input).toHaveValue('');
  await expect(grid.getByRole('combobox',{name:'상태 필터: 전체',exact:true})).toBeVisible();
  await expect(grid.getByRole('combobox',{name:'담당 팀 필터: 전체',exact:true})).toBeVisible();

  await search.getByRole('combobox',{name:'담당 팀 필터: 전체 팀',exact:true}).click();
  await search.getByRole('option',{name:'플랫폼 개발',exact:true}).click();
  await search.getByRole('button',{name:'검색',exact:true}).click();
  await name.fill('포털');
  await owner.fill('박지훈');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute('data-grid-row-id','PRJ-003');
  await choose('담당 팀 필터','브랜드 디자인');
  await expect(rows).toHaveCount(0);
  await grid.getByRole('button',{name:'조건 초기화',exact:true}).click();
  await expect.poll(()=>rows.evaluateAll(items=>items.length>0&&items.every(row=>row.children[3]?.textContent==='플랫폼 개발'))).toBe(true);
  await expect(search.getByRole('combobox',{name:'담당 팀 필터: 플랫폼 개발',exact:true})).toBeVisible();
  await name.fill('포털');
  await search.getByRole('button',{name:'필터 초기화',exact:true}).click();
  await expect(name).toHaveValue('');
  await expect(rows).toHaveCount(120);
});

test('project column filter toggle clears hidden criteria and restores an empty filter row',async({page})=>{
  await page.goto(sample);
  const grid=panel(page).getByRole('group',{name:'전체 프로젝트 목록',exact:true});
  const toggle=grid.getByRole('button',{name:'컬럼 필터',exact:true});
  const filter=grid.getByRole('textbox',{name:'프로젝트 필터',exact:true});
  const rows=grid.locator('tr[data-grid-row-id]');
  const initial=await grid.boundingBox();
  const expectContentFit=async()=>{
    await expect.poll(async()=>{
      const bounds=await grid.boundingBox();
      return Math.abs(bounds.height-initial.height)<=2;
    }).toBe(true);
    expect(await panel(page).evaluate(element=>element.scrollHeight<=element.clientHeight+1)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight+1)).toBe(true);
  };
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await expect(grid.locator('.data-grid-filter-row')).toHaveCount(0);
  await expect(filter).toHaveCount(0);
  await expect(rows).toHaveCount(120);
  await expectContentFit();
  await toggle.focus();
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(grid.locator('.data-grid-filter-row')).toHaveCount(1);
  await filter.fill('일치하지않는프로젝트xyz');
  await expect(rows).toHaveCount(0);
  await expect(grid.locator('.data-grid-state')).toContainText('검색 결과가 없습니다.');
  await toggle.focus();
  await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await expect(grid.locator('.data-grid-filter-row')).toHaveCount(0);
  await expect(filter).toHaveCount(0);
  await expect(rows).toHaveCount(120);
  await expectContentFit();
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(grid.locator('.data-grid-filter-row')).toHaveCount(1);
  await expect(filter).toHaveValue('');
  await expect(rows).toHaveCount(120);
  await expectContentFit();
});

test('master detail filters immediately without a search button',async({page,isMobile})=>{
  await page.goto(sample);
  await navigate(page,'마스터-디테일',isMobile);
  const input=panel(page).getByRole('searchbox',{name:'프로젝트 검색',exact:true});
  const list=panel(page).locator('.layout-master-list');
  const originalCount=await list.getByRole('button').count();
  expect(originalCount).toBeGreaterThan(1);
  await expect(panel(page).getByRole('button',{name:'검색',exact:true})).toHaveCount(0);
  await input.fill('PRJ-003');
  await expect(list.getByRole('button')).toHaveCount(1);
  await expect(list.getByRole('button',{name:'파트너 포털 PRJ-003',exact:true})).toBeVisible();
  await input.fill('PRJ-001');
  await expect(list.getByRole('button',{name:'디자인 시스템 v2 PRJ-001',exact:true})).toBeVisible();
  await expect(list.getByRole('button')).toHaveCount(1);
  await input.fill('일치하지않는프로젝트xyz');
  await expect(list.getByRole('status')).toHaveText('검색 결과가 없습니다.');
  await input.fill('');
  await expect(list.getByRole('button')).toHaveCount(originalCount);
});

test('project filter actions place the reset icon before search and keep reset behaviour',async({page,isMobile})=>{
  await page.goto(sample);
  for(const title of ['전체 프로젝트','진행 중 프로젝트','검토 요청','완료된 프로젝트']){
    if(title!=='전체 프로젝트')await navigate(page,title,isMobile);
    const search=panel(page).getByRole('search',{name:'프로젝트 필터 검색',exact:true});
    const reset=search.getByRole('button',{name:'필터 초기화',exact:true});
    await expect(search.locator(':scope > button')).toHaveText(['필터 초기화','검색','삭제']);
    await expect(reset.locator('.icon-refresh')).toHaveAttribute('aria-hidden','true');
    const grid=panel(page).getByRole('group',{name:`${title} 목록`,exact:true});
    await search.getByRole('combobox',{name:'담당 팀 필터: 전체 팀',exact:true}).click();
    await search.getByRole('option',{name:'플랫폼 개발',exact:true}).click();
    await search.getByRole('button',{name:'검색',exact:true}).click();
    await enableColumnFilters(grid);
    await grid.getByRole('textbox',{name:'프로젝트 필터',exact:true}).fill('일치하지않는프로젝트xyz');
    await expect(grid.locator('.data-grid-state').getByText('검색 결과가 없습니다.',{exact:true})).toBeVisible();
    await reset.click();
    await expect(search.getByRole('combobox',{name:'담당 팀 필터: 전체 팀',exact:true})).toBeVisible();
    await expect(search.getByRole('combobox',{name:'프로젝트 상태 필터: 전체 상태',exact:true})).toBeVisible();
    await expect(grid.getByRole('textbox',{name:'프로젝트 필터',exact:true})).toHaveValue('');
    await expect.poll(()=>grid.locator('tr[data-grid-row-id]').count()).toBeGreaterThan(0);
  }
});
