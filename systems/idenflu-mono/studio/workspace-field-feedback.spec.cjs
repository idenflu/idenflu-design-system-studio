const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');

async function navigate(page,label,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:label,exact:true}).click();
}

test('workspace settings connect select help and focus the field that needs correction',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(sample);
  await navigate(page,'워크스페이스 설정',isMobile);
  const name=panel(page).getByRole('textbox',{name:'워크스페이스 이름',exact:true});
  const menuStyle=panel(page).getByRole('combobox',{name:/^사이드 메뉴 스타일:/});
  await expect(menuStyle).toHaveAccessibleDescription('카테고리형은 업무 공간·조직 관리·환경 설정을 제목으로 구분합니다.');
  const initialName=await name.inputValue();
  await name.fill('   ');
  await panel(page).getByRole('button',{name:'변경사항 저장',exact:true}).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid','true');
  await expect(name).toHaveAccessibleDescription('워크스페이스 이름을 입력해주세요.');
  await name.fill(initialName);
  await expect(name).not.toHaveAttribute('aria-invalid','true');
  await panel(page).getByRole('button',{name:'변경사항 저장',exact:true}).click();
  await expect(panel(page).getByRole('status')).toContainText('변경사항을 저장했습니다.');
});

test('profile role help stays attached and invitation errors return focus to email',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(sample);
  await page.getByRole('button',{name:/사용자 메뉴/}).click();
  await page.getByRole('menuitem',{name:'내 프로필',exact:true}).click();
  const profile=page.getByRole('dialog',{name:'내 프로필',exact:true});
  const roles=profile.getByRole('combobox',{name:/^역할:/});
  await expect(roles).toBeDisabled();
  await expect(roles).toHaveAccessibleDescription('역할은 멤버 관리에서 변경할 수 있습니다.');
  await profile.getByRole('button',{name:'취소',exact:true}).click();

  await navigate(page,'멤버 관리',isMobile);
  await panel(page).getByRole('button',{name:'멤버 초대',exact:true}).click();
  const invite=page.getByRole('dialog',{name:'멤버 초대',exact:true});
  const email=invite.getByRole('textbox',{name:'이메일',exact:true});
  await invite.getByRole('textbox',{name:'이름',exact:true}).fill('새 협업자');
  await email.fill('MINSU@example.com');
  await invite.getByRole('button',{name:'멤버 추가',exact:true}).click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid','true');
  await expect(email).toHaveAccessibleDescription(/이미 등록된 이메일입니다/);
  await email.fill('new-collaborator@example.com');
  await expect(email).not.toHaveAttribute('aria-invalid','true');
  await invite.getByRole('button',{name:'멤버 추가',exact:true}).click();
  await expect(invite).not.toBeVisible();
  await expect(panel(page).locator('tbody tr').filter({hasText:'new-collaborator@example.com'})).toContainText('새 협업자');
});
