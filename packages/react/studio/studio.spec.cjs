const { test, expect } = require('@playwright/test');
const routes = require('./dist/routes.json');

test('all original routes resolve and React demos stay within the viewport', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/text-fields');
  for (const route of routes) {
    await page.evaluate(path => { location.hash = '#/' + path; }, route.route);
    await expect(page.locator('.react-studio-content h1')).toHaveText(route.route === 'overview' ? /Form follows\s*function\./ : route.title);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, route.route).toBe(false);
  }
});

test('React text field examples support search clearing and password visibility', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/text-fields');
  const search = page.getByRole('searchbox', { name: '검색', exact: true });
  await search.fill('텍스트');
  await page.getByRole('button', { name: '검색어 지우기' }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  const email = page.getByRole('textbox', { name: '이메일', exact: true });
  await email.fill('minsu@');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await email.blur();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('올바른 이메일 주소를 입력해주세요.')).toBeVisible();
  await email.fill('minsu@example.com');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  const password = page.getByLabel('비밀번호', { exact: true });
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: '비밀번호 표시' }).click();
  await expect(password).toHaveAttribute('type', 'text');
});

test('inline multi-select removes and clears selected values', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/select');
  await page.getByRole('button', { name: '디자인 제거' }).click();
  await expect(page.getByRole('button', { name: '디자인 제거' })).toHaveCount(0);
  const trigger = page.getByRole('combobox', { name: /참여 팀/ });
  await trigger.click();
  await page.getByRole('option', { name: '개발' }).click();
  await expect(page.getByRole('button', { name: '개발 제거' })).toBeVisible();
  await page.getByRole('button', { name: '참여 팀 모두 지우기' }).click();
  await expect(page.getByRole('button', { name: '개발 제거' })).toHaveCount(0);
});

test('screen settings change and reset the document tokens', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/text-fields');
  await page.getByRole('button', { name: '화면 조정' }).click();
  const dialog = page.getByRole('dialog', { name: '화면 조정' });
  await dialog.getByRole('slider', { name: /글자 크기/ }).fill('18');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-size-base').trim())).toBe('18px');
  await page.reload();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-size-base').trim())).toBe('18px');
  await page.getByRole('button', { name: '화면 조정' }).click();
  await dialog.getByRole('button', { name: '초기화' }).click();
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-size-base').trim())).toBe('14px');
  await dialog.getByRole('button', { name: '화면 조정 닫기' }).click();
  await expect(dialog).not.toBeVisible();
});

test('theme toggle updates color codes and persists across reload', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/foundations/colors');
  const initial = await page.locator('html').getAttribute('data-theme');
  const primary = page.locator('[data-color-token="--primary"] code');
  const control = page.locator('[data-color-token="--primary-control"] code');
  const danger = page.locator('[data-color-token="--danger"] code');
  await expect(primary).toHaveText(initial === 'dark' ? '#9AAFFF' : '#4263CC');
  await expect(page.locator('.react-studio-swatches code')).toHaveCount(11);
  await page.getByRole('button', { name: initial === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환' }).click();
  const expected = initial === 'dark' ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveAttribute('data-theme', expected);
  await expect(primary).toHaveText(expected === 'dark' ? '#9AAFFF' : '#4263CC');
  await expect(control).toHaveText(expected === 'dark' ? '#4D64B8' : '#4263CC');
  await expect(danger).toHaveText(expected === 'dark' ? '#F2A3A7' : '#C43D3D');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', expected);
  await expect(primary).toHaveText(expected === 'dark' ? '#9AAFFF' : '#4263CC');
});

test('topbar tooltips support keyboard focus and stay within the viewport', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/tooltip');
  const settings = page.getByRole('button', { name: '화면 조정', exact: true });
  const theme = page.locator('.docs-topbar .theme-toggle');
  for (const button of [settings, theme]) {
    await button.focus();
    const tooltip = button.locator('..').getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    const bounds = await tooltip.boundingBox();
    const trigger = await button.boundingBox();
    expect(bounds.y).toBeGreaterThanOrEqual(trigger.y + trigger.height);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
    await button.blur();
  }
  await theme.focus();
  await theme.click();
  await expect(theme.locator('..').getByRole('tooltip')).toHaveText(await theme.getAttribute('aria-label'));
  await settings.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '화면 조정' })).toBeHidden();
});

test('basic React form validates, accepts corrected data and resets', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/patterns/form/basic');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  const name = page.getByRole('textbox', { name: /이름/ });
  const email = page.getByRole('textbox', { name: /이메일/ });
  await expect(name).toBeFocused();
  await expect(page.getByText('이름을 입력해주세요.')).toBeVisible();
  await name.fill('김민수');
  await email.fill('minsu@example.com');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.locator('form').getByRole('status')).toHaveText('기본 정보를 확인했습니다.');
  await page.getByRole('button', { name: '초기화' }).click();
  await expect(name).toHaveValue('');
  await expect(email).toHaveValue('');
});

test('Patterns are excluded from the navigation', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/buttons');
  await expect(page.locator('#react-studio-nav').getByText('Patterns', { exact: false })).toHaveCount(0);
});

test('chip selection and removal update the visible state', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/chips');
  const selected = page.getByRole('button', { name: '개발', exact: true });
  await selected.click();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '프로젝트 제거' }).click();
  await expect(page.getByRole('button', { name: '프로젝트 제거' })).toHaveCount(0);
  await page.getByRole('button', { name: '초기화' }).click();
  await expect(page.getByRole('button', { name: '프로젝트 제거' })).toBeVisible();
});

test('pagination changes the displayed rows and stepper moves between steps', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/table');
  await expect(page.locator('tbody tr').first()).toContainText('디자인 시스템');
  await page.getByRole('button', { name: '2페이지' }).click();
  await expect(page.locator('tbody tr').first()).toContainText('디자인 시스템 2');
  await expect(page.locator('.react-studio-demo').getByRole('status')).toContainText('5–8 / 12');
  await page.goto('/packages/react/studio/index.html#/components/stepper');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByRole('list', { name: '프로젝트 생성 단계' }).locator('[aria-current="step"]')).toContainText('팀원 초대');
});

test('menu and popover apply actions report their result', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/dropdown-menu');
  await page.getByRole('button', { name: '더보기' }).click();
  await page.getByRole('menuitem', { name: '수정' }).click();
  await expect(page.locator('.react-studio-demo').getByRole('status')).toHaveText('수정 동작을 선택했습니다.');
  await page.goto('/packages/react/studio/index.html#/components/popover');
  const trigger = page.getByRole('button', { name: '표시 설정' });
  await trigger.click();
  await page.getByRole('checkbox', { name: '상태' }).uncheck();
  await page.getByRole('button', { name: '적용' }).click();
  await expect(page.locator('.react-studio-demo').getByRole('status')).toHaveText('설명 표시 중');
  await expect(trigger).toBeFocused();
});

test('number examples support keyboard stepping and documented sizes', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/number-fields');
  const input = page.getByRole('spinbutton', { name: '정수만 입력' });
  await input.press('ArrowUp');
  await expect(input).toHaveValue('13');
  await expect(page.getByRole('spinbutton', { name: '금액', exact: true })).toHaveValue('12,500');
  await expect(page.getByRole('spinbutton', { name: '소수 금액', exact: true })).toHaveValue('12,500.5');
  for (const size of ['SM', 'MD', 'LG']) await expect(page.getByRole('spinbutton', { name: `${size} 숫자 입력` })).toBeVisible();
});

test('selection controls synchronize the mixed and all-selected states', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/selection');
  const all = page.getByRole('checkbox', { name: '전체 선택' });
  await expect(all).toHaveJSProperty('indeterminate', true);
  await all.check();
  await expect(page.getByRole('checkbox', { name: '푸시 알림' })).toBeChecked();
  await expect(all).toHaveJSProperty('indeterminate', false);
  await page.getByRole('checkbox', { name: '이메일 알림' }).uncheck();
  await expect(all).toHaveJSProperty('indeterminate', true);
  await expect(page.getByRole('checkbox', { name: '비활성 옵션' })).toBeDisabled();
});

test('drawer validates, discards canceled changes, and restores saved settings', async ({ page }) => {
  await page.goto('/packages/react/studio/index.html#/components/drawer');
  const trigger = page.getByRole('button', { name: '상세 정보 열기' });
  const dialog = page.getByRole('dialog', { name: '프로젝트 설정' });
  await trigger.click();
  const name = dialog.getByRole('textbox', { name: '프로젝트 이름' });
  await name.fill('   ');
  await dialog.getByRole('button', { name: '저장' }).click();
  await expect(dialog.getByText('프로젝트 이름을 입력해주세요.')).toBeVisible();
  await expect(name).toBeFocused();
  await name.fill('취소할 이름');
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(name).toHaveValue('디자인 시스템');
  await name.fill('  새 프로젝트  ');
  await dialog.getByRole('button', { name: '저장' }).click();
  await expect(page.locator('.react-studio-demo').getByRole('status')).toHaveText('새 프로젝트 설정을 저장했습니다.');
  await trigger.click();
  await expect(name).toHaveValue('새 프로젝트');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
