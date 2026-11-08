const { test, expect } = require('@playwright/test');

test('Select field feedback connects descriptions, focuses each invalid control and submits repeated values', {tag:'@mobile'}, async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/select');
  const section = page.locator('#select-field-feedback');
  const form = section.locator('form');
  const team = form.getByRole('combobox', {name:/^검증 담당 팀:/});
  const approval = form.getByRole('combobox', {name:'검증 승인 팀',exact:true});
  const teams = form.getByRole('combobox', {name:/^검증 참여 팀:/});
  await expect(team).toHaveAccessibleDescription(/프로젝트를 담당할 팀입니다/);
  await expect(team).toHaveAccessibleDescription(/선택값과 오류를 부모 상태로 관리/);

  await form.getByRole('button', {name:'검증 확인',exact:true}).click();
  await expect(team).toBeFocused();
  await expect(team).toHaveAttribute('aria-invalid','true');
  await expect(team).toHaveAccessibleDescription(/담당 팀을 선택해주세요/);
  await expect(form.getByText('담당 팀을 선택해주세요.', {exact:true})).toHaveCount(1);
  await team.press('ArrowDown');
  await team.press('Enter');
  await expect(team).not.toHaveAttribute('aria-invalid','true');

  await form.getByRole('button', {name:'검증 확인',exact:true}).click();
  await expect(approval).toBeFocused();
  await expect(approval).toHaveAccessibleDescription(/승인 팀을 선택해주세요/);
  await approval.fill('개발');
  await approval.press('Enter');

  await form.getByRole('button', {name:'검증 확인',exact:true}).click();
  await expect(teams).toBeFocused();
  await expect(teams).toHaveAccessibleDescription(/참여 팀을 하나 이상 선택해주세요/);
  await teams.press('ArrowDown');
  await teams.press('Enter');
  await teams.press('Escape');
  await form.getByRole('button', {name:'검증 확인',exact:true}).click();
  const payload = form.getByRole('region', {name:'검증 선택 제출 데이터',exact:true});
  expect(JSON.parse(await payload.textContent())).toEqual({team:'design',approvalTeam:'development',teams:['design']});

  for (const [label,control] of [['담당 팀으로 이동',team],['승인 팀으로 이동',approval],['참여 팀으로 이동',teams]]) {
    await form.getByRole('button',{name:label,exact:true}).click();
    await expect(control).toBeFocused();
    await control.press('Escape');
  }
  await form.getByRole('button',{name:'검증 초기화',exact:true}).click();
  await expect(team).toBeFocused();
  await expect(team).toHaveAccessibleName('검증 담당 팀: 선택하세요');
  await expect(approval).toHaveValue('');
  await expect(teams).toHaveAccessibleName('검증 참여 팀: 선택하세요');
  await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
  await expect(payload).toHaveCount(0);
});
