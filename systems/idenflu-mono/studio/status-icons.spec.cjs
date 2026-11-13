const {test,expect}=require('@playwright/test');
const base='/systems/idenflu-mono/index.html#/';
const workflow=[['대기','circle-dashed'],['진행 중','circle-dot'],['완료','check-circle'],['주의','warning'],['오류','x-circle']];

test('status semantics stay consistent across badge, toast and data grid examples',{tag:['@mobile','@theme']},async({page})=>{
  await page.goto(base+'components/feedback');
  for(const [group,solid] of [['상태별 배지',false],['반전 상태별 배지',true]]) {
    const badges=page.getByRole('group',{name:group,exact:true}).locator('.badge');
    await expect(badges).toHaveText(workflow.map(([label])=>label));
    for(let i=0;i<workflow.length;i++) {
      const icon=workflow[i][1];
      await expect(badges.nth(i).locator(`.icon-${icon}`)).toBeVisible();
      await expect(badges.nth(i).locator('.ui-icon')).toHaveAttribute('aria-hidden','true');
    }
  }
  const work=page.getByRole('group',{name:'업무 상태별 배지',exact:true});
  await expect(work.locator('.icon-pause-circle')).toBeVisible();await expect(work.locator('.icon-minus-circle')).toBeVisible();await expect(work.locator('.icon-ban')).toBeVisible();
  await page.goto(base+'components/overlays');
  await page.getByRole('button',{name:'오류 알림 표시',exact:true}).click();
  await expect(page.locator('.toast[role="alert"] .icon-x-circle')).toBeVisible();
  await page.getByRole('button',{name:'주의 배경 토스트',exact:true}).click();
  await expect(page.locator('.toast .icon-warning')).toBeVisible();
  await page.getByRole('button',{name:'오류 배경 토스트',exact:true}).click();
  await expect(page.locator('.toast .icon-x-circle')).toBeVisible();
  await page.goto(base+'components/data-grid');
  const guide=page.locator('#data-grid-status-demo');
  const grid=guide.getByRole('group',{name:'상태 기준 데이터그리드',exact:true});
  for(const [state,icon] of [['대기','circle-dashed'],['진행 중','circle-dot'],['검토 중','circle-dot'],['보류','pause-circle'],['비활성','minus-circle'],['완료','check-circle'],['안내','info'],['주의','warning'],['오류','x-circle'],['차단','ban']]) {
    const badge=grid.locator('tbody .badge').filter({hasText:new RegExp(`^${state}$`)});
    await expect(badge.locator(`.icon-${icon}`)).toHaveCount(1);
  }
  await guide.getByRole('button',{name:'반전',exact:true}).click();
  await expect(grid.locator('.icon-x-circle')).toHaveCount(1);await expect(grid.locator('.icon-ban')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
});

test('access icons separate role labels from permission outcomes and fit all preview sizes',{tag:['@mobile','@theme']},async({page})=>{
  await page.goto(base+'foundations/icons');
  const section=page.locator('#access-role-icons');
  await expect(section.locator('.studio-icon-expansion-list li')).toHaveCount(10);
  for(const size of [14,16,18,20]) {
    await section.getByRole('button',{name:`${size}px`,exact:true}).click();
    const boxes=await section.locator('.studio-icon-expansion-list .ui-icon').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,mask:getComputedStyle(n).maskImage})));
    for(const box of boxes){expect(box.width).toBe(size);expect(box.height).toBe(size);expect(box.mask).not.toBe('none');}
  }
  await expect(section.getByRole('group',{name:'역할 표시 예시'}).locator('.badge')).toHaveText(['소유자','관리자','편집자','뷰어']);
  await expect(section.getByRole('group',{name:'접근 상태 예시'}).locator('.badge')).toHaveText(['허용','접근 거부','계정 잠금','권한 확인']);
  const statuses=page.locator('#status-icon-guide');
  await expect(statuses.locator('tbody tr')).toHaveCount(10);
  await statuses.getByRole('button',{name:'14px',exact:true}).click();
  const progress=statuses.locator('tr[data-status="progress"] .studio-status-icon-sample .ui-icon').first();
  await expect(progress).toHaveCSS('animation-name','none');
  expect(await progress.evaluate(n=>n.getBoundingClientRect().width)).toBe(14);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
});
