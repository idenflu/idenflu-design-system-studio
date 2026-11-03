const {test,expect}=require('@playwright/test');
const sample='/systems/idenflu-mono/index.html?layout=sidebar';
const panel=page=>page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])');
const navigation=page=>page.locator('.layout-tree-navigation:visible');
async function openMenu(page,isMobile){
  if(isMobile)await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();
}
async function navigate(page,label,isMobile){
  await openMenu(page,isMobile);
  await navigation(page).getByRole('button',{name:label,exact:true}).click();
  await expect(panel(page).getByRole('heading',{level:1,name:label,exact:true})).toBeVisible();
}
async function chooseStyle(page,current,next){
  await panel(page).getByRole('combobox',{name:`사이드 메뉴 스타일: ${current}`,exact:true}).click();
  await page.getByRole('option',{name:next,exact:true}).click();
}

test('saved side menu styles keep one tree, category search and branch state',{tag:'@mobile'},async({page,isMobile})=>{
  await page.goto(sample);
  const desktopTree=page.locator('.layout-workspace-sidebar .demo-tree');
  await expect(desktopTree.locator(':scope > details')).toHaveCount(3);
  await navigate(page,'워크스페이스 설정',isMobile);
  await chooseStyle(page,'트리형 (기본)','카테고리형');
  await expect(desktopTree.locator('.tree-category')).toHaveCount(0);
  await panel(page).getByRole('button',{name:'변경사항 저장',exact:true}).click();
  await openMenu(page,isMobile);
  const tree=navigation(page).getByRole('group',{name:'워크스페이스 트리 메뉴',exact:true});
  await expect(tree).toHaveCount(1);
  await expect(tree.locator('.tree-category-label')).toHaveText(['업무 공간','조직 관리','환경 설정']);
  const branch=tree.locator('details');
  await expect(branch).toHaveCount(1);
  await branch.locator('summary').click();
  await expect(branch).not.toHaveAttribute('open','');
  const search=page.getByRole('searchbox',{name:'메뉴 검색',exact:true}).last();
  await search.fill('역할');
  await expect(tree.locator('.tree-category-label')).toHaveText(['조직 관리']);
  await expect(tree.getByRole('button',{name:'역할 관리',exact:true})).toBeVisible();
  await search.fill('');
  await expect(branch).not.toHaveAttribute('open','');
  await tree.getByRole('button',{name:'대시보드',exact:true}).click();
  await expect(panel(page).getByRole('heading',{level:1,name:'대시보드',exact:true})).toBeVisible();
  await navigate(page,'워크스페이스 설정',isMobile);
  await chooseStyle(page,'카테고리형','트리형 (기본)');
  await panel(page).getByRole('button',{name:'변경사항 저장',exact:true}).click();
  await openMenu(page,isMobile);
  await expect(tree.locator('.tree-category-label')).toHaveCount(0);
  await expect(tree.locator(':scope > details')).toHaveCount(3);
  await expect(tree.locator('details details')).not.toHaveAttribute('open','');
});
