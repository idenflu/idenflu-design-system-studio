const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
const detail=page=>panel(page).getByRole('region',{name:'역할 상세',exact:true});
const list=page=>panel(page).getByRole('group',{name:'역할 목록',exact:true});

async function navigateToRoles(page,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  const navigation=page.locator('.layout-tree-navigation:visible');
  const organization=navigation.locator('details').filter({hasText:'조직 관리'});
  await expect(organization.getByRole('button',{name:'역할 관리',exact:true})).toBeVisible();
  await organization.getByRole('button',{name:'역할 관리',exact:true}).click();
  await expect(panel(page).getByRole('heading',{level:1,name:'역할 관리',exact:true})).toBeVisible();
}

async function openRoles(page,isMobile){
  await page.goto(sample);
  await navigateToRoles(page,isMobile);
}

async function selectRole(page,name){
  await list(page).getByRole('button',{name,exact:true}).click();
  await expect(detail(page).getByRole('heading',{level:2,name,exact:true})).toBeVisible();
}

async function openConnections(page,name){
  await detail(page).getByRole('tab',{name:new RegExp(`^${name}\\s*\\d*`)}).click();
}

test('organization role management opens one workspace tab and selects its master records',async({page,isMobile})=>{
  await openRoles(page,isMobile);
  for(const name of ['관리자','편집자','뷰어']){
    await expect(list(page).getByRole('button',{name,exact:true})).toBeVisible();
    await selectRole(page,name);
    await expect(detail(page).getByRole('tablist',{name:'역할 연결 정보',exact:true})).toBeVisible();
    await expect(detail(page).getByRole('tab',{name:/^권한/})).toBeVisible();
    await expect(detail(page).getByRole('tab',{name:/^알림/})).toBeVisible();
  }
  await navigateToRoles(page,isMobile);
  await expect(page.locator('.layout-workspace-tabs > .tab-list').getByRole('tab',{name:'역할 관리',exact:true})).toHaveCount(1);
  if(!isMobile){
    const master=await list(page).boundingBox(),selected=await detail(page).boundingBox();
    expect(master).not.toBeNull();expect(selected).not.toBeNull();
    expect(master.x+master.width).toBeLessThanOrEqual(selected.x);
  }
});

test('role permission and notification drafts survive selection changes and saved links survive reopening',async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await selectRole(page,'뷰어');
  await openConnections(page,'권한');
  const permission=detail(page).getByRole('checkbox',{name:'프로젝트 수정',exact:true});
  await expect(permission).not.toBeChecked();
  await permission.check();
  await openConnections(page,'알림');
  const appNotification=detail(page).getByRole('checkbox',{name:'마감일 알림 앱',exact:true});
  const emailNotification=detail(page).getByRole('checkbox',{name:'마감일 알림 이메일',exact:true});
  await expect(appNotification).not.toBeChecked();
  await expect(emailNotification).not.toBeChecked();
  await expect(emailNotification).toBeDisabled();
  await appNotification.check();
  await expect(emailNotification).not.toBeChecked();
  for(const name of ['프로젝트 상태 변경','마감일 알림','검토 요청','멤버 초대 알림','주간 활동 요약']){
    const app=detail(page).getByRole('checkbox',{name:`${name} 앱`,exact:true});
    const email=detail(page).getByRole('checkbox',{name:`${name} 이메일`,exact:true});
    await expect(app).toBeVisible();
    await expect(app).toBeEnabled();
    await expect(email).toBeVisible();
    await expect(email).toBeDisabled();
    await expect(email).not.toBeChecked();
  }
  await selectRole(page,'관리자');
  await openConnections(page,'알림');
  for(const name of ['프로젝트 상태 변경','마감일 알림','검토 요청','멤버 초대 알림','주간 활동 요약']){
    const email=detail(page).getByRole('checkbox',{name:`${name} 이메일`,exact:true});
    await expect(email).toBeDisabled();
    await expect(email).not.toBeChecked();
  }
  await selectRole(page,'뷰어');
  await openConnections(page,'권한');
  await expect(permission).toBeChecked();
  await openConnections(page,'알림');
  await expect(appNotification).toBeChecked();
  await expect(emailNotification).not.toBeChecked();
  const save=detail(page).getByRole('button',{name:'변경사항 저장',exact:true});
  await expect(save).toBeEnabled();
  await save.click();
  await expect(save).toBeDisabled();
  await page.getByRole('button',{name:'역할 관리 탭 닫기',exact:true}).click();
  await navigateToRoles(page,isMobile);
  await selectRole(page,'뷰어');
  await openConnections(page,'권한');
  await expect(permission).toBeChecked();
  await openConnections(page,'알림');
  await expect(appNotification).toBeChecked();
  await expect(emailNotification).not.toBeChecked();
  await expect(emailNotification).toBeDisabled();
  await expect(save).toBeDisabled();
  await appNotification.uncheck();
  await expect(appNotification).not.toBeChecked();
  await expect(emailNotification).not.toBeChecked();
  await detail(page).getByRole('button',{name:'변경 취소',exact:true}).click();
  await expect(appNotification).toBeChecked();
  await expect(emailNotification).not.toBeChecked();
  await expect(save).toBeDisabled();
});

test('role search and cancel recover the saved associations on a narrow screen',async({page})=>{
  await page.setViewportSize({width:320,height:740});
  await openRoles(page,true);
  const search=panel(page).getByRole('searchbox',{name:'역할 검색',exact:true});
  await search.fill('뷰어');
  await expect(list(page).getByRole('button')).toHaveCount(1);
  await selectRole(page,'뷰어');
  await openConnections(page,'권한');
  const permission=detail(page).getByRole('checkbox',{name:'프로젝트 삭제',exact:true});
  await expect(permission).not.toBeChecked();
  await permission.check();
  const cancel=detail(page).getByRole('button',{name:'변경 취소',exact:true});
  await expect(cancel).toBeEnabled();
  await cancel.click();
  await expect(permission).not.toBeChecked();
  await expect(detail(page).getByRole('button',{name:'변경사항 저장',exact:true})).toBeDisabled();
  await search.fill('없는 역할 xyz');
  await expect(list(page)).toContainText('검색 결과가 없습니다.');
  await expect(list(page).getByRole('button')).toHaveCount(0);
  await search.clear();
  await expect(list(page).getByRole('button')).toHaveCount(3);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});
