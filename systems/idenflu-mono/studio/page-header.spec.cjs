const {test,expect}=require('@playwright/test');

test('PageHeader examples preserve heading order, actions and public usage code', {tag:['@mobile','@theme']}, async({page})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/page-header');
  const section=page.locator('#page-header-basic');
  await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  await expect(section.getByRole('heading',{name:'전체 프로젝트',level:3})).toBeVisible();
  await section.getByRole('button',{name:'새 프로젝트',exact:true}).click();
  await expect(section.getByRole('status')).toHaveText('새 프로젝트 만들기를 선택했습니다.');
  await section.getByRole('button',{name:'내보내기',exact:true}).click();
  await expect(section.getByRole('status')).toHaveText('프로젝트 내보내기를 선택했습니다.');
  await expect(page.getByRole('region',{name:'PageHeader 속성',exact:true})).toContainText('headingLevel');
  const code=await page.getByRole('region',{name:'React 사용 예시 코드',exact:true}).textContent();
  expect(code).toContain('PageHeader');
  expect(code).toContain("import '@idenflu/mono-react/styles.css'");
  expect(code).not.toMatch(/from ['"]\.\.?\//);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
});

test('PageHeader actions fit alongside desktop content and move below it on mobile', {tag:'@mobile'}, async({page,isMobile})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/page-header');
  const header=page.locator('#page-header-basic .page-header');
  const content=await header.locator('.page-header-content').boundingBox();
  const actions=await header.locator('.page-header-actions').boundingBox();
  if(isMobile) expect(actions.y).toBeGreaterThanOrEqual(content.y+content.height-1);
  else expect(actions.x).toBeGreaterThanOrEqual(content.x+content.width-1);
  const viewport=page.viewportSize();
  expect(actions.x+actions.width).toBeLessThanOrEqual(viewport.width);
  const headers=page.locator('#page-header-content .page-header');
  await expect(headers).toHaveCount(3);
  await expect(headers.last().locator('.page-header-actions')).toHaveCount(0);
  await expect(headers.last().locator('.page-header-description')).toHaveCount(0);
});
