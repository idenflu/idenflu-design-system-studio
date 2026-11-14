const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
const detail=page=>panel(page).getByRole('region',{name:'역할 상세',exact:true});
const roleList=page=>panel(page).getByRole('group',{name:'역할 목록',exact:true});
const search=page=>detail(page).getByRole('searchbox',{name:'사용 권한 검색',exact:true});
const results=page=>detail(page).locator('.layout-role-permission-search').getByRole('status');
const save=page=>detail(page).getByRole('button',{name:'변경사항 저장',exact:true});

async function navigateToRoles(page,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'역할 관리',exact:true}).click();
  await expect(panel(page).getByRole('heading',{level:1,name:'역할 관리',exact:true})).toBeVisible();
}

async function selectViewer(page){
  await roleList(page).getByRole('button',{name:'뷰어',exact:true}).click();
  await expect(detail(page).getByRole('heading',{level:2,name:'뷰어',exact:true})).toBeVisible();
}

async function openRoles(page,isMobile){
  await page.goto(sample);
  await navigateToRoles(page,isMobile);
  await selectViewer(page);
}

test('permission search matches names, descriptions and groups without changing role totals or drafts',{tag:['@mobile','@theme']},async({page,isMobile})=>{
  await openRoles(page,isMobile);
  const rows=detail(page).locator('.layout-role-option');
  const groups=detail(page).locator('.layout-role-permission-group');
  const remove=detail(page).locator('.layout-role-header-actions').getByRole('button',{name:'역할 삭제',exact:true});
  await expect(remove).toHaveClass(/button--outline/);
  await expect(remove).toHaveClass(/button-color--danger/);
  await expect(rows).toHaveCount(9);
  await expect(results(page)).toHaveText('전체 9개');
  await search(page).fill('  초대  ');
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('멤버 초대');
  await expect(groups).toHaveCount(1);
  await expect(groups).toHaveAttribute('aria-label','조직 권한');
  await expect(results(page)).toHaveText('검색 결과 1개');

  await search(page).fill('  담당 팀  ');
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText('프로젝트 생성');
  await search(page).fill('조직');
  await expect(rows).toHaveCount(3);
  await expect(groups).toHaveCount(1);
  await expect(results(page)).toHaveText('검색 결과 3개');
  await expect(groups.getByRole('checkbox',{name:'조직 검색 결과 전체 선택',exact:true})).toBeVisible();
  await expect(detail(page).getByRole('tab',{name:'권한 2',exact:true})).toBeVisible();
  await expect(detail(page).locator('.layout-role-section-heading').first()).toContainText('2 / 9');
  await expect(roleList(page).getByRole('button',{name:'뷰어',exact:true})).toContainText('권한 2개 · 알림 1개');
  await expect(save(page)).toBeDisabled();
  await expect(detail(page).locator('.layout-role-footer .layout-role-change-summary')).toHaveCount(0);

  await search(page).fill('   ');
  await expect(rows).toHaveCount(9);
  await expect(groups).toHaveCount(3);
  await expect(results(page)).toHaveText('전체 9개');
  await expect(detail(page).getByRole('checkbox',{name:'프로젝트 전체 선택',exact:true})).toBeVisible();
  await expect(detail(page).getByRole('checkbox',{name:/검색 결과 전체 선택/})).toHaveCount(0);
  await expect(save(page)).toBeDisabled();
});

test('permission search offers focused empty-state reset and standard clear controls only in its tab',{tag:'@mobile'},async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await search(page).fill('없는 권한 xyz');
  await expect(results(page)).toHaveText('검색 결과 0개');
  await expect(detail(page).locator('.layout-role-permission-group')).toHaveCount(0);
  await expect(detail(page).locator('.layout-role-permission-empty')).toContainText('검색 결과가 없습니다.');
  await detail(page).getByRole('button',{name:'검색 초기화',exact:true}).click();
  await expect(search(page)).toHaveValue('');
  await expect(search(page)).toBeFocused();
  await expect(detail(page).locator('.layout-role-option')).toHaveCount(9);
  await expect(detail(page).locator('.layout-role-option input:checked')).toHaveCount(2);

  await search(page).fill('수정');
  await detail(page).getByRole('button',{name:'사용 권한 검색 지우기',exact:true}).click();
  await expect(search(page)).toHaveValue('');
  await expect(search(page)).toBeFocused();
  await expect(detail(page).locator('.layout-role-option')).toHaveCount(9);
  await expect(save(page)).toBeDisabled();
  await detail(page).getByRole('tab',{name:'알림 1',exact:true}).click();
  await expect(search(page)).toBeHidden();
  await expect(detail(page).locator('.layout-role-notification')).toHaveCount(5);
  await expect(save(page)).toBeDisabled();
});

test('filtered group selection preserves hidden permissions when clearing, saving and reopening',{tag:'@mobile'},async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await search(page).fill('생성');
  await detail(page).getByRole('checkbox',{name:'프로젝트 검색 결과 전체 선택',exact:true}).check();
  await expect(detail(page).getByRole('tab',{name:'권한 3',exact:true})).toBeVisible();
  await search(page).fill('조회');
  const project=detail(page).getByRole('region',{name:'프로젝트 권한',exact:true});
  await project.getByRole('checkbox',{name:'프로젝트 검색 결과 전체 선택',exact:true}).uncheck();
  await expect(detail(page).getByRole('checkbox',{name:'멤버 조회',exact:true})).toBeChecked();
  await expect(detail(page).locator('.layout-role-footer')).toContainText('변경된 권한 2개 · 알림 0개');
  await search(page).clear();
  await expect(detail(page).getByRole('checkbox',{name:'프로젝트 생성',exact:true})).toBeChecked();
  await expect(detail(page).getByRole('checkbox',{name:'프로젝트 조회',exact:true})).not.toBeChecked();
  await expect(detail(page).getByRole('checkbox',{name:'프로젝트 수정',exact:true})).not.toBeChecked();
  await expect(detail(page).getByRole('checkbox',{name:'프로젝트 삭제',exact:true})).not.toBeChecked();
  await expect(detail(page).getByRole('checkbox',{name:'멤버 조회',exact:true})).toBeChecked();
  await expect(detail(page).locator('.layout-role-option input:checked')).toHaveCount(2);

  await search(page).fill('없는 권한 xyz');
  await save(page).click();
  await expect(save(page)).toBeDisabled();
  await page.getByRole('button',{name:'역할 관리 탭 닫기',exact:true}).click();
  await navigateToRoles(page,isMobile);
  await selectViewer(page);
  await expect(search(page)).toHaveValue('');
  await expect(detail(page).getByRole('checkbox',{name:'프로젝트 생성',exact:true})).toBeChecked();
  await expect(detail(page).getByRole('checkbox',{name:'프로젝트 조회',exact:true})).not.toBeChecked();
  await expect(detail(page).getByRole('checkbox',{name:'멤버 조회',exact:true})).toBeChecked();
  await expect(detail(page).locator('.layout-role-option input:checked')).toHaveCount(2);
  await expect(save(page)).toBeDisabled();
});
