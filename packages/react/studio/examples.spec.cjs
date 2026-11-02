const { test, expect } = require('@playwright/test');

test('save example prevents duplicate clicks and reports completion', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/buttons');
  await page.getByRole('button', {name:'저장하기', exact:true}).click();
  const saving = page.getByRole('button', {name:'저장 중', exact:true});
  await expect(saving).toBeDisabled();
  await expect(saving).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByText('변경사항을 저장하는 중입니다.', {exact:true})).toBeVisible();
  await expect(page.getByText('변경사항을 저장했습니다.', {exact:true})).toBeVisible();
  await expect(page.getByRole('button', {name:'저장하기', exact:true})).toBeEnabled();
});

test('required team selection validates, submits and resets', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/select');
  const form = page.locator('form').filter({has:page.getByRole('button', {name:'선택 확인', exact:true})});
  const team = form.getByRole('combobox', {name:/^필수 담당 팀:/});
  await form.getByRole('button', {name:'선택 확인', exact:true}).click();
  await expect(team).toBeFocused();
  await expect(form.getByRole('alert')).toHaveText('항목을 선택해주세요.');
  await team.click();
  await form.getByRole('listbox', {name:'필수 담당 팀', exact:true}).getByRole('option', {name:'디자인', exact:true}).click();
  await form.getByRole('button', {name:'선택 확인', exact:true}).click();
  await expect(form.getByRole('status')).toHaveText('담당 팀을 확인했습니다.');
  await form.getByRole('button', {name:'선택 초기화', exact:true}).click();
  await expect(team).toContainText('선택하세요');
  await expect(team).not.toHaveAttribute('aria-invalid', 'true');
  await expect(form.getByRole('status')).toBeEmpty();
});

test('select examples show option descriptions and decorative icons while choosing values', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/select');
  const described = page.getByRole('combobox', {name:/^담당 팀 · 설명:/});
  await expect(described.locator('.select-prefix-icon')).toHaveAttribute('aria-hidden', 'true');
  await expect(described.locator('.icon-person')).toBeVisible();
  await described.click();
  const options = page.getByRole('listbox', {name:'담당 팀 · 설명'});
  await expect(options.getByRole('option', {name:/브랜드 디자인/})).toContainText('브랜드의 일관된 인상을 만듭니다.');
  await options.getByRole('option', {name:/브랜드 디자인/}).click();
  await expect(described).toContainText('브랜드 디자인');
  await expect(described.locator('.icon-person')).toBeVisible();
  const iconSelect = page.getByRole('combobox', {name:/^보기 방식 · 아이콘:/});
  await expect(iconSelect.locator('.select-option-icon')).toHaveAttribute('aria-hidden', 'true');
  await iconSelect.press('ArrowDown');
  await iconSelect.press('ArrowDown');
  await iconSelect.press('Enter');
  await expect(iconSelect).toContainText('격자 보기');
  const tag = page.getByRole('button', {name:'격자 보기 제거'});
  await expect(tag.locator('.select-option-icon')).toHaveAttribute('aria-hidden', 'true');
  await tag.click();
  await expect(tag).toHaveCount(0);
});

test('project dialog rejects whitespace and creates a named project with dismissible feedback', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/overlays');
  await page.getByRole('button', {name:'다이얼로그 열기', exact:true}).click();
  const dialog = page.getByRole('dialog', {name:'새 프로젝트', exact:true});
  const name = dialog.getByRole('textbox', {name:'프로젝트 이름', exact:true});
  await name.fill('   ');
  await dialog.getByRole('button', {name:'만들기', exact:true}).click();
  await expect(dialog.getByText('프로젝트 이름을 입력해주세요.', {exact:true})).toBeVisible();
  await expect(name).toBeFocused();
  await name.fill('  계정 개선  ');
  await dialog.getByRole('button', {name:'만들기', exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText('계정 개선 프로젝트를 만들었습니다.', {exact:true})).toBeVisible();
  const toast = page.locator('.toast');
  await expect(toast).toContainText('계정 개선 프로젝트가 생성되었습니다.');
  await toast.getByRole('button', {name:'알림 닫기', exact:true}).click();
  await expect(toast).toHaveCount(0);
});

test('project tabs skip unavailable categories during keyboard navigation', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/tabs');
  const tabs = page.getByRole('tablist', {name:'프로젝트 분류', exact:true});
  const active = tabs.getByRole('tab', {name:'진행 중 · 3', exact:true});
  const completed = tabs.getByRole('tab', {name:'완료 · 2', exact:true});
  await expect(tabs.getByRole('tab', {name:'보관됨', exact:true})).toBeDisabled();
  await active.focus();
  await active.press('ArrowRight');
  await expect(completed).toBeFocused();
  await expect(completed).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', {name:'완료 · 2', exact:true})).toContainText('계정 설정과 알림 개선 작업을 완료했습니다.');
  await completed.press('Home');
  await expect(active).toBeFocused();
  await expect(active).toHaveAttribute('aria-selected', 'true');
});

test('file example rejects unsupported types and displays removable PDF selection', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/file-upload');
  const upload = page.getByLabel('첨부 파일', {exact:true});
  await upload.setInputFiles({name:'notes.txt', mimeType:'text/plain', buffer:Buffer.from('unsupported')});
  await expect(page.getByRole('alert')).toHaveText('지원하지 않는 파일 형식입니다.');
  await expect(upload).toHaveValue('');
  await upload.setInputFiles({name:'guide.pdf', mimeType:'application/pdf', buffer:Buffer.alloc(2048)});
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('.upload-result')).toContainText('guide.pdf');
  const feedback = page.locator('.react-studio-section').filter({has:page.getByRole('heading', {name:'파일 선택', exact:true})}).getByRole('status');
  await expect(feedback).toContainText('크기: 2.0 KB');
  await page.locator('.upload-result').getByRole('button', {name:'제거', exact:true}).click();
  await expect(page.locator('.upload-result')).toHaveCount(0);
  await expect(feedback).toContainText('선택한 파일이 없습니다.');
  await expect(page.getByLabel('비활성 첨부 파일', {exact:true})).toBeDisabled();
});

test('document contents omit titles belonging to closed dialogs', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/drawer');
  const contents = page.getByRole('navigation', {name:'이 페이지 목차', exact:true});
  await expect(contents.getByRole('link', {name:'사이드 패널', exact:true})).toBeVisible();
  await expect(contents.getByRole('link', {name:'프로젝트 설정', exact:true})).toHaveCount(0);
  await page.goto('/packages/react/studio/index.html#/components/overlays');
  await expect(page.getByRole('heading', {level:1})).toHaveText('Dialog & toast');
  await expect(contents.getByRole('link', {name:'다이얼로그', exact:true})).toBeVisible();
  await expect(contents.getByRole('link', {name:'새 프로젝트', exact:true})).toHaveCount(0);
});
