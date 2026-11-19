const { test, expect } = require('@playwright/test');

test('React text field examples support search clearing and password visibility', async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/text-fields');
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

test('inline multi-select removes and clears selected values', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/select');
  const section = page.locator('.react-studio-section').filter({ has: page.getByRole('heading', { level: 2, name: '태그형 복수 선택', exact: true }) });
  await section.getByRole('button', { name: '디자인 제거' }).click();
  await expect(section.getByRole('button', { name: '디자인 제거' })).toHaveCount(0);
  const trigger = section.getByRole('combobox', { name: /참여 팀/ });
  await trigger.click();
  await section.getByRole('option', { name: '개발' }).click();
  await expect(section.getByRole('button', { name: '개발 제거' })).toBeVisible();
  await section.getByRole('button', { name: '참여 팀 모두 지우기' }).click();
  await expect(section.getByRole('button', { name: '개발 제거' })).toHaveCount(0);
});

test('theme toggle updates color codes and persists across reload', {tag:'@theme'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/foundations/colors');
  const initial = await page.locator('html').getAttribute('data-theme');
  const primary = page.locator('[data-color-token="--primary"] code');
  const control = page.locator('[data-color-token="--primary-control"] code');
  const danger = page.locator('[data-color-token="--danger"] code');
  await expect(primary).toHaveText(initial === 'dark' ? '#7FB3FD' : '#1062D3');
  for (const token of ['--surface-raised','--border-control']) await expect(page.locator(`[data-color-token="${token}"] code`)).toHaveText(/^#[0-9A-F]{6}$/);
  await page.getByRole('button', { name: initial === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환' }).click();
  const expected = initial === 'dark' ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveAttribute('data-theme', expected);
  await expect(primary).toHaveText(expected === 'dark' ? '#7FB3FD' : '#1062D3');
  await expect(control).toHaveText(expected === 'dark' ? '#3B6CAE' : '#2466C8');
  await expect(danger).toHaveText(expected === 'dark' ? '#F2A3A7' : '#C1332F');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', expected);
  await expect(primary).toHaveText(expected === 'dark' ? '#7FB3FD' : '#1062D3');
});

test('topbar tooltips support keyboard focus and stay within the viewport', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/tooltip');
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
  const themeTooltip = theme.locator('..').getByRole('tooltip', {includeHidden:true});
  await expect(themeTooltip).toHaveText(await theme.getAttribute('aria-label'));
  await expect(themeTooltip).toBeHidden();
  await settings.click();
  await expect(page.getByRole('dialog', { name: '화면 조정' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '화면 조정' })).toBeHidden();
});

test('Tooltip closes after pointer and keyboard activation while the trigger keeps focus', {tag:'@mobile'}, async ({ page, isMobile }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/tooltip');
  const button = page.getByRole('button',{name:'프로젝트 이름',exact:true});
  const tooltip = button.locator('..').getByRole('tooltip',{includeHidden:true});
  if (!isMobile) {
    await button.hover();
    await expect(tooltip).toBeVisible();
  }
  await button.click();
  await expect(button).toBeFocused();
  await expect(tooltip).toBeHidden();
  if (!isMobile) {
    await page.getByRole('heading',{level:1,name:'Tooltip',exact:true}).hover();
    await expect(button).toBeFocused();
    await expect(tooltip).toBeHidden();
    await button.hover();
    await expect(tooltip).toBeVisible();
  }
  await button.blur();
  await button.focus();
  await expect(tooltip).toBeVisible();
  await button.press('Enter');
  await expect(button).toBeFocused();
  await expect(tooltip).toBeHidden();
  await button.blur();
  await button.focus();
  await expect(tooltip).toBeVisible();
  await button.press('Space');
  await expect(button).toBeFocused();
  await expect(tooltip).toBeHidden();
});

test('basic React form validates, accepts corrected data and resets', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/patterns/form/basic');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  const name = page.getByRole('textbox', { name: /이름/ });
  const email = page.getByRole('textbox', { name: /이메일/ });
  await expect(name).toBeFocused();
  await expect(page.getByText('이름을 입력해주세요.', { exact: true })).toBeVisible();
  await name.fill('김민수');
  await email.fill('minsu@example.com');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(page.locator('form').getByRole('status')).toHaveText('기본 정보를 확인했습니다.');
  await page.getByRole('button', { name: '초기화' }).click();
  await expect(name).toHaveValue('');
  await expect(email).toHaveValue('');
});

test('chip selection and removal update the visible state', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/chips');
  const selected = page.getByRole('button', { name: '개발', exact: true });
  await selected.click();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '프로젝트 제거' }).click();
  await expect(page.getByRole('button', { name: '프로젝트 제거' })).toHaveCount(0);
  await page.getByRole('button', { name: '초기화' }).click();
  await expect(page.getByRole('button', { name: '프로젝트 제거' })).toBeVisible();
});

test('table density preserves data while pagination changes rows and stepper moves between steps', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/table');
  const projects = page.getByRole('region', { name: '프로젝트 목록', exact: true });
  const projectSection = page.locator('.react-studio-section').filter({ has: projects });
  const firstRow = projects.locator('tbody tr').first();
  await expect(firstRow).toContainText('디자인 시스템');
  const defaultHeight = (await firstRow.boundingBox()).height;
  await projectSection.getByRole('button', { name: 'Compact', exact: true }).click();
  await expect(firstRow).toContainText('디자인 시스템');
  expect((await firstRow.boundingBox()).height).toBeLessThan(defaultHeight);
  await projectSection.getByRole('button', { name: '2페이지' }).click();
  await expect(firstRow).toContainText('고객 지원 워크스페이스');
  await expect(projectSection.getByRole('status')).toContainText('5–8 / 16');
  await projectSection.getByRole('button', { name: '4페이지' }).click();
  await expect(projectSection.getByRole('status')).toContainText('13–16 / 16');
  await expect(projectSection.getByRole('button', { name: '다음', exact: true })).toBeDisabled();
  await projectSection.getByRole('button', { name: 'Default', exact: true }).click();
  await expect(projectSection.getByRole('status')).toContainText('13–16 / 16');
  await page.goto('/systems/idenflu-mono/index.html#/components/stepper');
  await page.getByRole('button', { name: '다음', exact: true }).click();
  await expect(page.getByRole('list', { name: '프로젝트 생성 단계' }).locator('[aria-current="step"]')).toContainText('팀원 초대');
});

test('table sections retain their rules and the scroll region is keyboard focusable', {tag:['@theme','@mobile']}, async ({ page, isMobile }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/table');
  const billing = page.getByRole('region', { name: '11월 청구 내역' });
  const header = billing.locator('.table-header .table-header-cell').first();
  const bodyRows = billing.locator('.table-body .table-row');
  const footer = billing.locator('.table-footer .table-header-cell');
  await expect(header).toHaveCSS('border-top-width', '1px');
  await expect(footer).toHaveText('합계');
  await expect(footer).toHaveCSS('border-top-width', '1px');
  const sectionRule = await header.evaluate(cell => getComputedStyle(cell).borderBottomColor);
  await expect(bodyRows.last().locator('.table-cell').first()).toHaveCSS('border-bottom-color', sectionRule);
  await expect(bodyRows.first().locator('.table-cell').first()).not.toHaveCSS('border-bottom-color', sectionRule);
  await expect(footer).toHaveCSS('border-top-color', sectionRule);
  const bodyText = await bodyRows.first().locator('.table-cell').first().evaluate(cell => ({
    color: getComputedStyle(cell).color, weight: getComputedStyle(cell).fontWeight,
  }));
  for (const cell of await billing.locator('.table-footer .table-cell').all()) {
    await expect(cell).toHaveCSS('color', bodyText.color);
    await expect(cell).toHaveCSS('font-weight', bodyText.weight);
  }

  await billing.focus();
  await expect(billing).toBeFocused();
  await expect(billing).not.toHaveCSS('box-shadow', 'none');
  if (isMobile) {
    expect(await billing.evaluate(region => region.scrollWidth)).toBeGreaterThan(await billing.evaluate(region => region.clientWidth));
    await billing.evaluate(region => { region.scrollLeft = 40; });
    expect(await billing.evaluate(region => region.scrollLeft)).toBeGreaterThan(0);
  }
});

test('fill-height table keeps its header and footer at the viewport edges as rows grow', {tag:['@theme','@mobile']}, async ({ page, isMobile }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/table');
  const region = page.getByRole('region', { name: '프로젝트 표 스크롤', exact: true });
  const addRow = page.getByRole('button', { name: '행 추가', exact: true });
  const rows = region.locator('.table-body .table-row');
  const layout = () => region.evaluate(viewport => {
    const top = viewport.getBoundingClientRect().top;
    const header = viewport.querySelector('.table-header').getBoundingClientRect();
    const footer = viewport.querySelector('.table-footer').getBoundingClientRect();
    const firstRow = viewport.querySelector('.table-body .table-row').getBoundingClientRect();
    const lastRow = viewport.querySelector('.table-body .table-row:last-child').getBoundingClientRect();
    return {
      headerOffset: header.top - top, footerGap: top + viewport.clientHeight - footer.bottom,
      gapAfterRows: footer.top - lastRow.bottom, firstRowHeight: firstRow.height,
      height: viewport.clientHeight, scrollTop: viewport.scrollTop, scrollHeight: viewport.scrollHeight,
    };
  });

  await expect(rows).toHaveCount(2);
  const initial = await layout();
  expect(initial.scrollHeight).toBe(initial.height);
  expect(initial.gapAfterRows).toBeGreaterThan(0);
  expect(initial.headerOffset).toBeCloseTo(0, 0);
  expect(initial.footerGap).toBeCloseTo(0, 0);

  for (let index = 0; index < 8; index++) await addRow.click();
  await expect(rows).toHaveCount(10);
  await expect(region.locator('.table-footer')).toContainText('10개');
  const filled = await layout();
  expect(filled.height).toBe(initial.height);
  expect(filled.scrollHeight).toBeGreaterThan(filled.height);
  expect(filled.firstRowHeight).toBeCloseTo(initial.firstRowHeight, 0);

  await addRow.press('Tab');
  await expect(region).toBeFocused();
  await page.keyboard.press('End');
  await expect.poll(async () => (await layout()).scrollTop).toBeGreaterThan(0);
  const scrolled = await layout();
  expect(scrolled.headerOffset).toBeCloseTo(0, 0);
  expect(scrolled.footerGap).toBeCloseTo(0, 0);
  await region.evaluate(viewport => { viewport.scrollTop = viewport.scrollHeight; });
  expect((await layout()).gapAfterRows).toBeCloseTo(0, 0);

  if (isMobile) {
    const alignment = await region.evaluate(viewport => {
      viewport.scrollLeft = 100;
      const columnRight = section => viewport.querySelector(`${section} .table-cell:last-child`).getBoundingClientRect().right;
      return { scrollLeft: viewport.scrollLeft, header: columnRight('.table-header'), body: columnRight('.table-body'), footer: columnRight('.table-footer') };
    });
    expect(alignment.scrollLeft).toBeGreaterThan(0);
    expect(alignment.header).toBeCloseTo(alignment.body, 0);
    expect(alignment.footer).toBeCloseTo(alignment.body, 0);
  }

  await page.setViewportSize({ width: page.viewportSize().width, height: 410 });
  await expect.poll(async () => (await layout()).height).toBeLessThan(initial.height);
  expect((await layout()).footerGap).toBeCloseTo(0, 0);

  const firstCell = rows.first().locator('.table-cell').first();
  await firstCell.evaluate(cell => {
    const button = document.createElement('button');
    button.textContent = '프로젝트 열기';
    cell.replaceChildren(button);
  });
  const bodyButton = firstCell.getByRole('button');
  await region.evaluate(viewport => { viewport.scrollTop = 35; viewport.scrollLeft = 0; });
  await bodyButton.focus();
  await expect(bodyButton).toBeFocused();
  await expect.poll(() => bodyButton.evaluate(button => {
    const header = button.closest('table').tHead;
    return header.getBoundingClientRect().bottom - button.getBoundingClientRect().top;
  })).toBeLessThan(1);
});

test('table rows highlight only in interactive tables and selection marks the chosen rows', {tag:['@theme','@mobile']}, async ({ page, isMobile }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/table');
  const transparent = 'rgba(0, 0, 0, 0)';
  const projects = page.getByRole('region', { name: '프로젝트 목록', exact: true });
  await expect(projects.locator('thead th').first()).toHaveCSS('background-color', transparent);
  const files = page.getByRole('region', { name: '공유 파일 목록', exact: true });
  const section = page.locator('.react-studio-section').filter({ has: files });
  const rows = files.locator('tbody tr');
  await expect(rows.nth(1)).toHaveAttribute('data-selected', 'true');
  await expect(section.getByRole('status')).toHaveText('1개 파일 선택');
  if (!isMobile) {
    const staticRow = projects.locator('tbody tr').first();
    await staticRow.hover();
    await expect(staticRow).toHaveCSS('background-color', transparent);
    await rows.nth(0).hover();
    await expect(rows.nth(0)).not.toHaveCSS('background-color', transparent);
  }
  await rows.nth(0).getByText('브랜드 가이드 v3.pdf', { exact: true }).click();
  await expect(rows.nth(0)).toHaveAttribute('data-selected', 'true');
  await expect(section.getByRole('status')).toHaveText('2개 파일 선택');
  await section.getByRole('checkbox', { name: '브랜드 가이드 v3.pdf 선택' }).uncheck();
  await expect(rows.nth(0)).not.toHaveAttribute('data-selected');
  const all = section.getByRole('checkbox', { name: '모든 파일 선택' });
  await expect.poll(() => all.evaluate(input => input.indeterminate)).toBe(true);
  await all.check();
  await expect(files.locator('tbody tr[data-selected="true"]')).toHaveCount(5);
  await all.focus();
  await page.keyboard.press('Tab');
  await expect(section.getByRole('checkbox', { name: '브랜드 가이드 v3.pdf 선택' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(rows.nth(0)).not.toHaveAttribute('data-selected');
  await expect(rows.nth(0)).not.toHaveCSS('background-color', transparent);
  await section.getByRole('button', { name: '선택 해제' }).click();
  await expect(files.locator('tbody tr[data-selected="true"]')).toHaveCount(0);
  await expect(section.getByRole('status')).toHaveText('선택한 파일 없음');
});

test('menu and popover apply actions report their result', {tag:['@mobile', '@theme']}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/dropdown-menu');
  const menu = page.locator('.react-studio-section').filter({ has: page.getByRole('heading', { level: 2, name: '작업 메뉴', exact: true }) });
  const menuTrigger = menu.getByRole('button', { name: '더보기' });
  const actions = menu.getByRole('menu', { name: '작업 메뉴' });
  const editItem = actions.getByRole('menuitem', { name: '수정' });
  await menuTrigger.click();
  await expect(actions).toBeVisible();
  await expect(menuTrigger).toBeFocused();
  const idleBackground = await editItem.evaluate(element => getComputedStyle(element).backgroundColor);
  await page.keyboard.press('ArrowDown');
  await expect(editItem).toBeFocused();
  await expect(editItem).toHaveCSS('outline-style', 'none');
  await expect(editItem).toHaveCSS('box-shadow', 'none');
  await expect(editItem).not.toHaveCSS('background-color', idleBackground);
  await editItem.click();
  await expect(menu.getByRole('status')).toHaveText('수정 동작을 선택했습니다.');
  await page.keyboard.press('Enter');
  await expect(actions).toBeVisible();
  await expect(menuTrigger).toBeFocused();
  await page.keyboard.press('ArrowUp');
  const divider = actions.getByRole('separator');
  const deleteItem = actions.getByRole('menuitem', { name: '삭제' });
  const copyItem = actions.getByRole('menuitem', { name: '복사' });
  const shareItem = actions.getByRole('menuitem', { name: '공유' });
  await expect(divider).toBeVisible();
  expect(await divider.evaluate(element => getComputedStyle(element, '::before').borderTopWidth)).toBe('1px');
  await expect(shareItem).toBeDisabled();
  await expect(deleteItem).toBeFocused();
  const resolveTextColor = (item, token) => item.evaluate((element, token) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    element.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
  const disabledColor = await resolveTextColor(shareItem, '--disabled-text');
  await expect(shareItem).toHaveCSS('color', disabledColor);
  await expect(shareItem.locator('.icon-link')).toHaveCSS('background-color', disabledColor);
  const dangerColor = await resolveTextColor(deleteItem, '--danger-text');
  await expect(deleteItem).toHaveCSS('color', dangerColor);
  await expect(deleteItem.locator('.icon-trash')).toHaveCSS('background-color', dangerColor);
  await expect(copyItem).not.toHaveCSS('color', dangerColor);
  await page.keyboard.press('ArrowUp');
  await expect(copyItem).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(deleteItem).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu.getByRole('status')).toHaveText('삭제 동작을 선택했습니다.');
  await expect(menuTrigger).toBeFocused();
  await page.keyboard.press('Space');
  await expect(actions).toBeVisible();
  await expect(menuTrigger).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(actions).toBeHidden();
  await expect(menuTrigger).toBeFocused();
  await page.keyboard.press('Space');
  await expect(actions).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(actions).toBeHidden();
  await expect(menuTrigger).not.toBeFocused();
  await page.goto('/systems/idenflu-mono/index.html#/components/popover');
  const popover = page.locator('.react-studio-section').filter({ has: page.getByRole('heading', { level: 2, name: '설정 팝오버', exact: true }) });
  const trigger = popover.getByRole('button', { name: '표시 설정', exact: true });
  await trigger.click();
  await popover.getByRole('checkbox', { name: '상태' }).uncheck();
  await popover.getByRole('button', { name: '적용' }).click();
  await expect(popover.getByRole('status')).toHaveText('설명 표시 중');
  await expect(trigger).toBeFocused();
});

test('number examples support keyboard stepping and documented sizes', async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/number-fields');
  const input = page.getByRole('spinbutton', { name: '정수만 입력' });
  await input.press('ArrowUp');
  await expect(input).toHaveValue('13');
  await expect(page.getByRole('spinbutton', { name: '금액', exact: true })).toHaveValue('12,500');
  await expect(page.getByRole('spinbutton', { name: '소수 금액', exact: true })).toHaveValue('12,500.5');
  for (const size of ['SM', 'MD', 'LG']) await expect(page.getByRole('spinbutton', { name: `${size} 숫자 입력` })).toBeVisible();
});

test('selection controls synchronize the mixed and all-selected states', async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/selection');
  const all = page.getByRole('checkbox', { name: '전체 선택' });
  await expect(all).toHaveJSProperty('indeterminate', true);
  await all.check();
  await expect(page.getByRole('checkbox', { name: '푸시 알림' })).toBeChecked();
  await expect(all).toHaveJSProperty('indeterminate', false);
  await page.getByRole('checkbox', { name: '이메일 알림' }).uncheck();
  await expect(all).toHaveJSProperty('indeterminate', true);
  await expect(page.getByRole('checkbox', { name: '비활성 옵션' })).toBeDisabled();
});

test('drawer validates, discards canceled changes, and restores saved settings', {tag:'@mobile'}, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/drawer');
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
  await expect(page.locator('.react-studio-section').first().getByRole('status')).toHaveText('새 프로젝트 설정을 저장했습니다.');
  await trigger.click();
  await expect(name).toHaveValue('새 프로젝트');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
