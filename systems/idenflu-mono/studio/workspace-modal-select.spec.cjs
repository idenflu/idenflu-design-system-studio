const {test,expect}=require('@playwright/test');

for (const height of [1000, 520]) {
  test(`workspace modal select options remain clickable at height ${height}`,async({page,isMobile})=>{
    test.skip(isMobile);
    await page.setViewportSize({width:1440,height});
    await page.goto('/systems/idenflu-mono/index.html?layout=sidebar');
    await page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])').getByRole('button',{name:'새 프로젝트',exact:true}).click();
    const project=page.getByRole('dialog',{name:'새 프로젝트',exact:true});
    const team=project.getByRole('combobox',{name:/담당 팀:/});
    await team.click();
    if (height === 520) {
      const body=project.locator('.dialog-body');
      await body.evaluate(element=>{element.scrollTop=element.scrollHeight;});
      await expect.poll(()=>body.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
      const previous=await body.evaluate(element=>element.scrollTop);
      await body.evaluate(element=>{element.scrollTop=Math.max(0,element.scrollTop-30);});
      await expect.poll(()=>body.evaluate(element=>element.scrollTop)).toBeLessThan(previous);
      await expect.poll(async()=>{
        const trigger=await team.boundingBox(), popup=await project.locator('.select-popup:not([hidden])').boundingBox();
        return Math.min(Math.abs(popup.y-(trigger.y+trigger.height)-6),Math.abs(trigger.y-(popup.y+popup.height)-6));
      }).toBeLessThan(2);
    }
    await project.getByRole('option',{name:'브랜드 디자인',exact:true}).click();
    await expect(project.getByRole('combobox',{name:'담당 팀: 브랜드 디자인'})).toBeVisible();
    await project.getByRole('combobox',{name:'담당 팀: 브랜드 디자인'}).click();
    await page.keyboard.press('Escape');
    await expect(project.getByRole('combobox',{name:'담당 팀: 브랜드 디자인'})).toBeFocused();
    await project.getByRole('button',{name:'취소',exact:true}).click();

    await page.locator('.layout-tree-navigation:visible').getByRole('button',{name:'멤버 관리',exact:true}).click();
    await page.locator('.layout-workspace-tabs > .tab-panel:not([hidden])').getByRole('button',{name:'멤버 초대',exact:true}).click();
    const invite=page.getByRole('dialog',{name:'멤버 초대',exact:true});
    await invite.getByRole('combobox',{name:/소속 팀:/}).click();
    await invite.getByRole('option',{name:'브랜드 디자인',exact:true}).click();
    await invite.getByRole('combobox',{name:/역할:/}).click();
    await invite.getByRole('option',{name:'뷰어',exact:true}).click();
    await expect(invite.getByRole('combobox',{name:'역할: 뷰어'})).toBeVisible();
  });
}
