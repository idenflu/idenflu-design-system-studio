const {test,expect}=require('@playwright/test');

const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');

async function editProfile(page){
  await page.getByRole('button',{name:/사용자 메뉴/}).click();
  await page.getByRole('menuitem',{name:'내 프로필',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'내 프로필',exact:true});
  await expect(dialog.getByRole('textbox',{name:'이름',exact:true})).toBeVisible();
  await expect(dialog.getByRole('textbox',{name:'이메일',exact:true})).toBeVisible();
  return dialog;
}

test('editing profile updates the account, member and project owners',async({page,isMobile})=>{
  test.skip(isMobile);
  await page.goto(sample);
  const dialog=await editProfile(page);
  await dialog.getByRole('textbox',{name:'이름',exact:true}).fill('최지민');
  await dialog.getByRole('textbox',{name:'이메일',exact:true}).fill('jimin@example.com');
  await dialog.getByRole('button',{name:'저장',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button',{name:'최지민 사용자 메뉴',exact:true})).toBeVisible();

  const originalProject=panel(page).locator('.data-grid-table tbody tr').filter({hasText:'디자인 시스템 v2'});
  await expect(originalProject).toContainText('최지민');
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'멤버 관리',exact:true}).click();
  const member=panel(page).locator('tbody tr').filter({hasText:'jimin@example.com'});
  await expect(member).toContainText('최지민');

  await page.getByRole('tab',{name:'전체 프로젝트',exact:true}).click();
  await panel(page).getByRole('button',{name:'새 프로젝트',exact:true}).click();
  const project=page.getByRole('dialog',{name:'새 프로젝트',exact:true});
  await project.getByRole('textbox',{name:'프로젝트 이름',exact:true}).fill('프로필 변경 후 프로젝트');
  await project.getByRole('button',{name:'프로젝트 만들기',exact:true}).click();
  await expect(project).not.toBeVisible();
  await expect(panel(page).getByRole('combobox',{name:'담당자: 최지민',exact:true})).toBeVisible();
});

test('profile validation and cancellation leave saved information unchanged',async({page,isMobile})=>{
  test.skip(isMobile);
  await page.goto(sample);
  const dialog=await editProfile(page);
  const name=dialog.getByRole('textbox',{name:'이름',exact:true});
  const email=dialog.getByRole('textbox',{name:'이메일',exact:true});
  await name.fill('   ');
  await dialog.getByRole('button',{name:'저장',exact:true}).click();
  await expect(dialog.getByText('이름을 입력해주세요.')).toBeVisible();
  await name.fill('이서연');
  await dialog.getByRole('button',{name:'저장',exact:true}).click();
  await expect(dialog.getByText('이미 사용 중인 이름입니다.')).toBeVisible();
  await name.fill('최지민');
  await email.fill('invalid-email');
  await dialog.getByRole('button',{name:'저장',exact:true}).click();
  expect(await email.evaluate(element=>element.validity.valid)).toBe(false);
  await email.fill('SEOYEON@example.com');
  await dialog.getByRole('button',{name:'저장',exact:true}).click();
  await expect(dialog.getByText('이미 등록된 이메일입니다.')).toBeVisible();
  await dialog.getByRole('button',{name:'취소',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button',{name:'김민수 사용자 메뉴',exact:true})).toBeFocused();
  const reopened=await editProfile(page);
  await expect(reopened.getByRole('textbox',{name:'이름',exact:true})).toHaveValue('김민수');
  await expect(reopened.getByRole('textbox',{name:'이메일',exact:true})).toHaveValue('minsu@example.com');
});
