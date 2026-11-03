const {test,expect}=require('@playwright/test');
const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
async function navigate(page,label,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
  await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:label,exact:true}).click();
}

test('workspace breadcrumbs follow the menu hierarchy in both styles and project details',async({page,isMobile})=>{
  await page.goto(sample);
  const breadcrumb=page.getByRole('navigation',{name:'현재 위치',exact:true});
  const paths=[
    ['전체 프로젝트',['업무 공간','프로젝트 관리','전체 프로젝트']],
    ['대시보드',['업무 공간','대시보드']],
    ['역할 관리',['조직 관리','역할 관리']],
    ['워크스페이스 설정',['환경 설정','워크스페이스 설정']],
  ];
  for(const style of ['tree','category']){
    if(style==='category'){
      await panel(page).getByRole('combobox',{name:'사이드 메뉴 스타일: 트리형 (기본)',exact:true}).click();
      await page.getByRole('option',{name:'카테고리형',exact:true}).click();
      await panel(page).getByRole('button',{name:'변경사항 저장',exact:true}).click();
    }
    for(const [title,path] of paths){
      await navigate(page,title,isMobile);
      await expect(breadcrumb.locator('span:not(.ui-icon),strong')).toHaveText(path);
      await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(title);
      await expect(breadcrumb).not.toContainText('제품팀');
    }
  }
  await navigate(page,'전체 프로젝트',isMobile);
  await panel(page).getByRole('button',{name:/디자인 시스템 v2/}).click();
  await page.getByRole('dialog',{name:'프로젝트 상세',exact:true}).getByRole('button',{name:'새 탭으로 열기',exact:true}).click();
  await expect(breadcrumb.locator('span:not(.ui-icon),strong')).toHaveText(['업무 공간','프로젝트 관리','전체 프로젝트','디자인 시스템 v2']);
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('디자인 시스템 v2');
});
