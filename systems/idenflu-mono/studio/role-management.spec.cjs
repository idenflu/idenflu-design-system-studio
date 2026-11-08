const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
const detail=page=>panel(page).getByRole('region',{name:'역할 상세',exact:true});
const list=page=>panel(page).getByRole('group',{name:'역할 목록',exact:true});

async function navigateToRoles(page,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  const navigation=page.locator('.layout-tree-navigation:visible');
  await expect(navigation.getByRole('button',{name:'역할 관리',exact:true})).toBeVisible();
  await navigation.getByRole('button',{name:'역할 관리',exact:true}).click();
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

async function navigateToMembers(page,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'멤버 관리',exact:true}).click();
  await expect(panel(page).getByRole('heading',{level:1,name:'멤버 관리',exact:true})).toBeVisible();
}

async function openProfile(page){
  await page.getByRole('button',{name:/사용자 메뉴/}).click();
  await page.getByRole('menuitem',{name:'내 프로필',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'내 프로필',exact:true});
  await expect(dialog).toBeVisible();
  return dialog;
}

async function openDeleteRole(page,name){
  await selectRole(page,name);
  await detail(page).getByRole('button',{name:'역할 삭제',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'역할 삭제',exact:true});
  await expect(dialog).toBeVisible();
  return dialog;
}

async function replaceAndDeleteRole(page,name,replacement){
  const dialog=await openDeleteRole(page,name);
  const remove=dialog.getByRole('button',{name:'삭제',exact:true});
  await expect(remove).toBeDisabled();
  const replacementControl=dialog.getByRole('combobox',{name:/^대체 역할:/});
  await expect(replacementControl).toHaveAccessibleDescription(/이 역할을 사용하는 멤버 \d+명에게 적용할 대체 역할을 선택하세요/);
  await replacementControl.click();
  await dialog.getByRole('option',{name:replacement,exact:true}).click();
  await expect(remove).toBeEnabled();
  await remove.click();
  await expect(dialog).not.toBeVisible();
  await expect(list(page).getByRole('button',{name,exact:true})).toHaveCount(0);
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

test('role search and cancel recover the saved associations on a narrow screen',{tag:['@mobile','@mobile-only']},async({page})=>{
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

test('roles validate names and support creation, metadata editing and deleting an unused role',async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await panel(page).getByRole('button',{name:'역할 추가',exact:true}).click();
  const create=page.getByRole('dialog',{name:'역할 추가',exact:true});
  const name=create.getByRole('textbox',{name:'역할 이름',exact:true});
  const description=create.getByRole('textbox',{name:'역할 설명',exact:true});
  const submit=create.getByRole('button',{name:'역할 추가',exact:true});
  await expect(create).toBeVisible();
  await submit.click();
  await expect(name).toHaveAttribute('aria-invalid','true');
  await name.fill('  관리자  ');
  await submit.click();
  await expect(name).toHaveAttribute('aria-invalid','true');
  await name.fill('프로젝트 검토자');
  await description.fill('프로젝트의 검토를 담당합니다.');
  await submit.click();
  await expect(create).not.toBeVisible();
  await expect(list(page).getByRole('button')).toHaveCount(4);
  await expect(list(page).getByRole('button',{name:'프로젝트 검토자',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(detail(page).getByRole('heading',{level:2,name:'프로젝트 검토자',exact:true})).toBeVisible();
  await expect(detail(page)).toContainText('프로젝트의 검토를 담당합니다.');
  await expect(detail(page).locator('.layout-role-option input:checked')).toHaveCount(0);
  await detail(page).getByRole('checkbox',{name:'프로젝트 조회',exact:true}).check();
  await detail(page).getByRole('button',{name:'변경사항 저장',exact:true}).click();

  await panel(page).getByRole('searchbox',{name:'역할 검색',exact:true}).fill('프로젝트 검토자');
  await detail(page).getByRole('button',{name:'역할 수정',exact:true}).click();
  const edit=page.getByRole('dialog',{name:'역할 수정',exact:true});
  await expect(edit.getByRole('textbox',{name:'역할 이름',exact:true})).toHaveValue('프로젝트 검토자');
  await expect(edit.getByRole('textbox',{name:'역할 설명',exact:true})).toHaveValue('프로젝트의 검토를 담당합니다.');
  await edit.getByRole('textbox',{name:'역할 이름',exact:true}).fill('편집자');
  await edit.getByRole('button',{name:'저장',exact:true}).click();
  await expect(edit.getByRole('textbox',{name:'역할 이름',exact:true})).toHaveAttribute('aria-invalid','true');
  await edit.getByRole('textbox',{name:'역할 이름',exact:true}).fill('출시 검토자');
  await edit.getByRole('textbox',{name:'역할 설명',exact:true}).fill('출시 전 프로젝트를 최종 검토합니다.');
  await edit.getByRole('button',{name:'저장',exact:true}).click();
  await expect(edit).not.toBeVisible();
  await expect(detail(page).getByRole('heading',{level:2,name:'출시 검토자',exact:true})).toBeVisible();
  await expect(list(page).getByRole('button',{name:'출시 검토자',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(detail(page)).toContainText('출시 전 프로젝트를 최종 검토합니다.');
  await expect(detail(page).getByRole('checkbox',{name:'프로젝트 조회',exact:true})).toBeChecked();

  await navigateToMembers(page,isMobile);
  const member=panel(page).locator('tbody tr').filter({hasText:'minsu@example.com'});
  await member.getByRole('combobox',{name:/^김민수 역할:/}).click();
  await expect(member.getByRole('option',{name:'출시 검토자',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await navigateToRoles(page,isMobile);
  const remove=await openDeleteRole(page,'출시 검토자');
  await expect(remove.getByRole('button',{name:'삭제',exact:true})).toBeEnabled();
  await remove.getByRole('button',{name:'삭제',exact:true}).click();
  await expect(remove).not.toBeVisible();
  await expect(list(page).getByRole('button',{name:'출시 검토자',exact:true})).toHaveCount(0);
  await expect(list(page).getByRole('button')).toHaveCount(3);
});

test('role renaming and replacement deletion keep member, invite and profile role references consistent',async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await selectRole(page,'관리자');
  await detail(page).getByRole('button',{name:'역할 수정',exact:true}).click();
  const edit=page.getByRole('dialog',{name:'역할 수정',exact:true});
  await edit.getByRole('textbox',{name:'역할 이름',exact:true}).fill('운영 관리자');
  await edit.getByRole('button',{name:'저장',exact:true}).click();
  await expect(edit).not.toBeVisible();
  await expect(list(page).getByRole('button',{name:'관리자',exact:true})).toHaveCount(0);
  await expect(detail(page).getByRole('heading',{level:2,name:'운영 관리자',exact:true})).toBeVisible();
  await navigateToMembers(page,isMobile);
  const currentMember=panel(page).locator('tbody tr').filter({hasText:'minsu@example.com'});
  const currentRoles=currentMember.getByRole('combobox',{name:/^김민수 역할:/});
  await expect(currentRoles).toHaveAttribute('aria-label','김민수 역할: 운영 관리자');
  await currentRoles.click();
  await expect(currentMember.getByRole('option',{name:'운영 관리자',exact:true})).toBeVisible();
  await expect(currentMember.getByRole('option',{name:'관리자',exact:true})).toHaveCount(0);
  await currentMember.getByRole('option',{name:'편집자',exact:true}).click();
  await page.keyboard.press('Escape');
  let profile=await openProfile(page);
  await expect(profile.getByRole('combobox',{name:'역할: 운영 관리자, 편집자',exact:true})).toBeDisabled();
  await profile.getByRole('button',{name:'취소',exact:true}).click();

  await panel(page).getByRole('button',{name:'멤버 초대',exact:true}).click();
  const invite=page.getByRole('dialog',{name:'멤버 초대',exact:true});
  await invite.getByRole('textbox',{name:'이름',exact:true}).fill('운영 담당');
  await invite.getByRole('textbox',{name:'이메일',exact:true}).fill('operator@example.com');
  await invite.getByRole('combobox',{name:/^역할:/}).click();
  await expect(invite.getByRole('option',{name:'관리자',exact:true})).toHaveCount(0);
  await invite.getByRole('option',{name:'운영 관리자',exact:true}).click();
  await invite.getByRole('button',{name:'멤버 추가',exact:true}).click();
  await expect(invite).not.toBeVisible();
  await navigateToRoles(page,isMobile);
  let removal=await openDeleteRole(page,'운영 관리자');
  await expect(removal.getByRole('button',{name:'삭제',exact:true})).toBeDisabled();
  await removal.getByRole('button',{name:'취소',exact:true}).click();
  await expect(list(page).getByRole('button',{name:'운영 관리자',exact:true})).toBeVisible();
  await replaceAndDeleteRole(page,'운영 관리자','편집자');

  await navigateToMembers(page,isMobile);
  await expect(currentRoles).toHaveAttribute('aria-label','김민수 역할: 편집자');
  const invited=panel(page).locator('tbody tr').filter({hasText:'operator@example.com'});
  await expect(invited.getByRole('combobox',{name:'운영 담당 역할: 편집자',exact:true})).toBeVisible();
  profile=await openProfile(page);
  await expect(profile.getByRole('combobox',{name:'역할: 편집자',exact:true})).toBeDisabled();
  await profile.getByRole('button',{name:'취소',exact:true}).click();
  await currentRoles.click();
  await expect(currentMember.getByRole('option',{name:'운영 관리자',exact:true})).toHaveCount(0);
  await expect(currentMember.getByRole('option',{name:'편집자',exact:true})).toHaveAttribute('aria-selected','true');
});

test('renaming the editor role preserves its current name as the invitation default',async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await selectRole(page,'편집자');
  await detail(page).getByRole('button',{name:'역할 수정',exact:true}).click();
  const edit=page.getByRole('dialog',{name:'역할 수정',exact:true});
  await edit.getByRole('textbox',{name:'역할 이름',exact:true}).fill('콘텐츠 편집자');
  await edit.getByRole('button',{name:'저장',exact:true}).click();
  await expect(edit).not.toBeVisible();
  await navigateToMembers(page,isMobile);
  await panel(page).getByRole('button',{name:'멤버 초대',exact:true}).click();
  const invite=page.getByRole('dialog',{name:'멤버 초대',exact:true});
  await expect(invite.getByRole('combobox',{name:'역할: 콘텐츠 편집자',exact:true})).toBeVisible();
  await invite.getByRole('textbox',{name:'이름',exact:true}).fill('콘텐츠 담당');
  await invite.getByRole('textbox',{name:'이메일',exact:true}).fill('content@example.com');
  await invite.getByRole('button',{name:'멤버 추가',exact:true}).click();
  await expect(invite).not.toBeVisible();
  const invited=panel(page).locator('tbody tr').filter({hasText:'content@example.com'});
  await expect(invited.getByRole('combobox',{name:'콘텐츠 담당 역할: 콘텐츠 편집자',exact:true})).toBeVisible();
});

test('deleting the editor role uses the current viewer role as the invitation default',async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await replaceAndDeleteRole(page,'편집자','뷰어');
  await navigateToMembers(page,isMobile);
  await panel(page).getByRole('button',{name:'멤버 초대',exact:true}).click();
  const invite=page.getByRole('dialog',{name:'멤버 초대',exact:true});
  await invite.getByRole('textbox',{name:'이름',exact:true}).fill('새 협업자');
  await invite.getByRole('textbox',{name:'이메일',exact:true}).fill('collaborator@example.com');
  await invite.getByRole('combobox',{name:/^역할:/}).click();
  await expect(invite.getByRole('option',{name:'편집자',exact:true})).toHaveCount(0);
  const selected=invite.getByRole('option',{selected:true});
  await expect(selected).toHaveCount(1);
  const defaultRole=(await selected.innerText()).trim();
  expect(defaultRole).toBe('뷰어');
  await page.keyboard.press('Escape');
  await invite.getByRole('button',{name:'멤버 추가',exact:true}).click();
  await expect(invite).not.toBeVisible();
  const invited=panel(page).locator('tbody tr').filter({hasText:'collaborator@example.com'});
  await expect(invited.getByRole('combobox',{name:`새 협업자 역할: ${defaultRole}`,exact:true})).toBeVisible();
});

test('the last role used by members cannot be deleted without a replacement',async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await replaceAndDeleteRole(page,'관리자','편집자');
  await replaceAndDeleteRole(page,'뷰어','편집자');
  await expect(list(page).getByRole('button')).toHaveCount(1);
  const removal=await openDeleteRole(page,'편집자');
  await expect(removal.getByRole('button',{name:'삭제',exact:true})).toBeDisabled();
  await expect(removal).toContainText(/다른 역할|대체 역할/);
  await removal.getByRole('button',{name:'취소',exact:true}).click();
  await expect(list(page).getByRole('button',{name:'편집자',exact:true})).toBeVisible();
  await navigateToMembers(page,isMobile);
  await expect(panel(page).locator('tbody tr')).toHaveCount(4);
  for(const member of ['김민수','이서연','박지훈','정수빈']){
    await expect(panel(page).getByRole('combobox',{name:`${member} 역할: 편집자`,exact:true})).toBeVisible();
  }
});

test('permission rows align controls and show group selection and pending change summaries',async({page,isMobile})=>{
  await openRoles(page,isMobile);
  await selectRole(page,'뷰어');
  const group=detail(page).getByRole('region',{name:'프로젝트 권한',exact:true});
  const rows=group.locator('.layout-role-option');
  const all=group.getByRole('checkbox',{name:'프로젝트 전체 선택',exact:true});
  const footer=detail(page).locator('.layout-role-footer');
  await expect(rows).toHaveCount(4);
  await expect(group.locator('header')).toContainText(/1\s*\/\s*4/);
  expect(await all.evaluate(element=>element.indeterminate)).toBe(true);
  const positions=await rows.evaluateAll(elements=>elements.map(element=>({left:element.getBoundingClientRect().left,top:element.getBoundingClientRect().top,bottom:element.getBoundingClientRect().bottom})));
  expect(Math.max(...positions.map(position=>position.left))-Math.min(...positions.map(position=>position.left))).toBeLessThanOrEqual(1);
  for(let index=1;index<positions.length;index++)expect(positions[index].top).toBeGreaterThanOrEqual(positions[index-1].bottom-1);
  await group.getByRole('checkbox',{name:'프로젝트 수정',exact:true}).check();
  await expect(group.locator('.layout-role-option[data-changed="true"]')).toHaveCount(1);
  await expect(footer).toContainText('변경된 권한 1개');
  await expect(group.locator('header')).toContainText(/2\s*\/\s*4/);
  await all.check();
  await expect(group.locator('.layout-role-option input:checked')).toHaveCount(4);
  await expect(group.locator('.layout-role-option[data-changed="true"]')).toHaveCount(3);
  await expect(footer).toContainText('변경된 권한 3개');
  expect(await all.evaluate(element=>element.indeterminate)).toBe(false);
  await group.getByRole('checkbox',{name:'프로젝트 수정',exact:true}).uncheck();
  expect(await all.evaluate(element=>element.indeterminate)).toBe(true);
  await expect(footer).toContainText('변경된 권한 2개');
  await detail(page).getByRole('button',{name:'변경 취소',exact:true}).click();
  await expect(group.locator('.layout-role-option[data-changed="true"]')).toHaveCount(0);
  await expect(group.getByRole('checkbox',{name:'프로젝트 조회',exact:true})).toBeChecked();
  await expect(group.getByRole('checkbox',{name:'프로젝트 수정',exact:true})).not.toBeChecked();
  await expect(detail(page).getByRole('button',{name:'변경사항 저장',exact:true})).toBeDisabled();
  await openConnections(page,'알림');
  await detail(page).getByRole('checkbox',{name:'마감일 알림 앱',exact:true}).check();
  await expect(footer).toContainText(/알림\s*1개/);
  await detail(page).getByRole('button',{name:'변경 취소',exact:true}).click();
  await expect(detail(page).getByRole('checkbox',{name:'마감일 알림 앱',exact:true})).not.toBeChecked();
});
