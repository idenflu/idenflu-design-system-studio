const {test,expect}=require('@playwright/test');

test('Select binding resets values and pending search without replacing controls', {tag:['@mobile','@theme']}, async({page})=>{
  await page.goto('/systems/idenflu-mono/index.html#/components/select');
  const form=page.locator('#select-binding form');
  const team=form.getByRole('combobox',{name:/^바인딩 담당 팀:/});
  const reviewer=form.getByRole('combobox',{name:'바인딩 검토 팀',exact:true});
  const teams=form.getByRole('combobox',{name:/^바인딩 참여 팀:/});
  const originalTeam=await team.elementHandle();
  const originalReviewer=await reviewer.elementHandle();
  const originalTeams=await teams.elementHandle();

  await team.click();
  await form.getByRole('listbox',{name:'바인딩 담당 팀',exact:true}).getByRole('option',{name:'개발',exact:true}).click();
  await reviewer.fill('마케팅');
  await reviewer.press('Enter');
  await teams.click();
  await form.getByRole('listbox',{name:'바인딩 참여 팀',exact:true}).getByRole('option',{name:'개발',exact:true}).click();
  await page.keyboard.press('Escape');
  await form.getByRole('button',{name:'선택값 확인',exact:true}).click();
  const output=form.getByRole('region',{name:'선택 제출 데이터',exact:true});
  expect(JSON.parse(await output.textContent())).toEqual({team:'development',reviewer:'marketing',teams:['design','development']});

  await reviewer.fill('없는 팀');
  await expect(form.getByText('검색 결과가 없습니다.',{exact:true})).toBeVisible();
  await form.getByRole('button',{name:'초기값 복원',exact:true}).click();
  await expect(team).toBeFocused();
  await expect(team).toHaveAccessibleName('바인딩 담당 팀: 디자인');
  await expect(form.locator('select[name="team"]')).toHaveValue('design');
  await expect(reviewer).toHaveValue('');
  await expect(teams).toHaveAccessibleName('바인딩 참여 팀: 디자인');
  await expect(output).toContainText('선택값 확인을 누르면');
  for(const original of [originalTeam,originalReviewer,originalTeams]) {
    expect(await original.evaluate(element=>element.isConnected)).toBe(true);
  }
  await expect(form.locator('.select-popup:visible')).toHaveCount(0);
  await reviewer.focus();
  await expect(form.getByRole('listbox',{name:'바인딩 검토 팀',exact:true}).getByRole('option')).toHaveCount(10);
  await reviewer.press('Escape');
  await form.getByRole('button',{name:'선택값 확인',exact:true}).click();
  expect(JSON.parse(await output.textContent())).toEqual({team:'design',reviewer:null,teams:['design']});
});
