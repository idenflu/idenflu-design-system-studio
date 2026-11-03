const { test, expect } = require('@playwright/test');

const route = name => `/systems/idenflu-mono/index.html#/components/${name}`;
const alignments = ['start', 'center', 'end'];
const legacyPopupStyles = '.studio-convenience-align-example .popover-content,.studio-convenience-align-example .action-options { left:auto; right:0; }';

async function expectVisuallyHiddenLabel(control) {
  const label = await control.evaluate(element => {
    const label = element.labels?.[0];
    if (!label) return null;
    const style = getComputedStyle(label), box = label.getBoundingClientRect();
    return {
      connected: label.control === element, text: label.textContent,
      position: style.position, width: box.width, height: box.height,
      clipPath: style.clipPath, overflow: style.overflow,
      display: style.display, visibility: style.visibility,
      hidden: label.hidden || label.getAttribute('aria-hidden') === 'true',
    };
  });
  expect(label).not.toBeNull();
  expect(label.connected).toBe(true);
  expect(label.text.length).toBeGreaterThan(0);
  expect(label.position).toBe('absolute');
  expect(label.width).toBeLessThanOrEqual(1);
  expect(label.height).toBeLessThanOrEqual(1);
  expect(label.clipPath).toBe('inset(50%)');
  expect(label.overflow).toBe('hidden');
  expect(label.display).not.toBe('none');
  expect(label.visibility).toBe('visible');
  expect(label.hidden).toBe(false);
}

async function expectPopupAlignment(page, trigger, popup, align, rtl) {
  await expect(popup).toBeVisible();
  const bounds = await trigger.boundingBox(), panel = await popup.boundingBox();
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  const desired = align === 'center'
    ? bounds.x + (bounds.width - panel.width) / 2
    : (align === 'start') !== rtl ? bounds.x : bounds.x + bounds.width - panel.width;
  const expected = Math.max(12, Math.min(desired, Math.max(12, width - 12 - panel.width)));
  expect(Math.abs(panel.x - expected)).toBeLessThanOrEqual(1);
  expect(panel.x).toBeGreaterThanOrEqual(11);
  expect(panel.x + panel.width).toBeLessThanOrEqual(width - 11);
  await expect(popup).toHaveAttribute('data-align', align);
}

test('hidden toolbar labels stay accessible and all filters work with the keyboard', async ({ page }) => {
  await page.goto(route('text-fields'));
  const section = page.locator('#text-field-hide-label-toolbar');
  const filters = section.getByRole('group', { name: '프로젝트 필터', exact: true });
  const search = filters.getByRole('searchbox', { name: '프로젝트 검색', exact: true });
  const status = filters.getByRole('combobox', { name: /^프로젝트 상태:/ });
  const teams = filters.getByRole('combobox', { name: /^참여 팀:/ });
  for (const control of [search, status, teams]) await expectVisuallyHiddenLabel(control);

  await search.focus();
  await page.keyboard.press('Tab');
  await expect(status).toBeFocused();
  await status.press('ArrowDown');
  await status.press('ArrowDown');
  await status.press('Enter');
  await expect(status).toHaveAccessibleName('프로젝트 상태: 진행 중');
  await page.keyboard.press('Tab');
  await expect(teams).toBeFocused();
  await teams.press('ArrowDown');
  await teams.press('Enter');
  await expect(teams).toHaveAccessibleName('참여 팀: 디자인');
  await teams.press('Escape');
  await expect(teams).toBeFocused();
  await expect(section.getByRole('status')).toContainText('1개 프로젝트 · 디자인 시스템');
  await search.fill('없는 프로젝트');
  await expect(section.getByRole('status')).toContainText('0개 프로젝트');
});

test('Select, SearchSelect and MultiSelect compare visible labels with hidden labels without changing keyboard selection', async ({ page }) => {
  await page.goto(route('select'));
  const section = page.locator('#select-hide-label-compare');
  await expect(section.locator('label.field-label')).toHaveCount(6);
  await expect(section.locator('label.field-label.sr-only')).toHaveCount(3);
  const select = section.getByRole('combobox', { name: /^담당 팀:/ }).nth(1);
  const search = section.getByRole('combobox', { name: '팀 검색', exact: true }).nth(1);
  const multiple = section.getByRole('combobox', { name: /^참여 팀:/ }).nth(1);
  for (const control of [select, search, multiple]) await expectVisuallyHiddenLabel(control);
  await search.fill('개발');
  await search.press('Enter');
  await expect(search).toHaveValue('개발');
  await expect(search).toBeFocused();
  await multiple.focus();
  await multiple.press('ArrowDown');
  await multiple.press('ArrowDown');
  await multiple.press('Enter');
  await expect(multiple).toHaveAccessibleName('참여 팀: 디자인, 개발');
  await multiple.press('Escape');
  await expect(multiple).toBeFocused();
});

test('IconButton sizes remain square and tooltips respond to hover, focus and Escape', {tag:'@mobile'}, async ({ page, isMobile }) => {
  await page.goto(route('buttons'));
  const section = page.locator('#icon-button-sizes');
  const dimensions = [];
  for (const size of ['SM', 'MD', 'LG']) {
    const button = section.getByRole('button', { name: `${size} 설정`, exact: true });
    const bounds = await button.boundingBox();
    expect(Math.abs(bounds.width - bounds.height)).toBeLessThanOrEqual(1);
    dimensions.push(bounds.height);
    await expect(button).toHaveAttribute('type', 'button');
    const tooltip = section.getByRole('tooltip', { name: `${size} 설정`, exact: true });
    if (!isMobile) {
      await button.hover();
      await expect(tooltip).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(tooltip).toBeHidden();
    }
    await button.focus();
    await expect(tooltip).toBeVisible();
    await button.press('Escape');
    await expect(tooltip).toBeHidden();
    await expect(button).toBeFocused();
  }
  expect(dimensions[0]).toBeLessThan(dimensions[1]);
  expect(dimensions[1]).toBeLessThan(dimensions[2]);

  const states = page.locator('#icon-button-states');
  const bookmark = states.getByRole('button', { name: '북마크', exact: true });
  await bookmark.focus();
  await bookmark.press('Space');
  await expect(bookmark).toHaveAttribute('aria-pressed', 'true');
  const reset = states.getByRole('button', { name: '북마크 초기화', exact: true });
  await reset.focus();
  await expect(states.getByRole('tooltip', { name: '저장한 북마크를 해제합니다.', exact: true })).toBeVisible();
  await reset.press('Enter');
  await expect(bookmark).toHaveAttribute('aria-pressed', 'false');
  const details = states.getByRole('button', { name: '자세히 보기', exact: true });
  await expect(details).not.toHaveAttribute('aria-describedby');
  await details.press('Enter');
  await expect(details).toHaveAttribute('aria-expanded', 'true');
  await details.press('Tab');
  await expect(states.getByRole('button', { name: '북마크로 포커스', exact: true })).toBeFocused();
  await expect(states.getByRole('button', { name: '삭제할 항목 없음', exact: true })).toBeDisabled();
  await states.getByRole('button', { name: '북마크로 포커스', exact: true }).press('Enter');
  await expect(bookmark).toBeFocused();
});

for (const kind of ['popover', 'menu']) {
  test(`${kind} aligns start, center and end over legacy right CSS in both text directions and restores focus on Escape`, {tag:'@mobile'}, async ({ page }) => {
    await page.goto(route(kind === 'popover' ? 'popover' : 'dropdown-menu'));
    await page.addStyleTag({ content: legacyPopupStyles });
    const section = page.locator(`#${kind}-align-demo`);
    const rtlToggle = section.getByRole('checkbox', { name: 'RTL 방향으로 확인', exact: true });
    for (const rtl of [false, true]) {
      await rtlToggle.setChecked(rtl);
      for (const align of alignments) {
        const trigger = section.getByRole('button', { name: align, exact: true });
        await trigger.focus();
        await trigger.press(kind === 'menu' ? 'ArrowDown' : 'Enter');
        const popup = section.getByRole(kind === 'menu' ? 'menu' : 'region', { name: `${align} ${kind === 'menu' ? '보기 방식' : '표시 설정'}`, exact: true });
        await expectPopupAlignment(page, trigger, popup, align, rtl);
        if (kind === 'menu') await expect(popup.getByRole('menuitem').first()).toBeFocused();
        else await popup.getByRole('checkbox', { name: '설명 표시', exact: true }).focus();
        await page.keyboard.press('Escape');
        await expect(popup).toBeHidden();
        await expect(trigger).toBeFocused();
      }
    }
    if (kind === 'menu') {
      const trigger = section.getByRole('button', { name: 'center', exact: true });
      await trigger.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(section.getByRole('status')).toContainText('선택한 보기: 격자 보기');
      await expect(trigger).toBeFocused();
    }
  });
}

test('aligned popup examples stay inside a narrow viewport at either edge', {tag:['@mobile','@mobile-only']}, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const kind of ['popover', 'menu']) {
    await page.goto(route(kind === 'popover' ? 'popover' : 'dropdown-menu'));
    await page.addStyleTag({ content: legacyPopupStyles });
    const section = page.locator(`#${kind}-align-demo`);
    for (const align of alignments) {
      const trigger = section.getByRole('button', { name: align, exact: true });
      await trigger.click();
      const popup = section.getByRole(kind === 'menu' ? 'menu' : 'region', { name: `${align} ${kind === 'menu' ? '보기 방식' : '표시 설정'}`, exact: true });
      await expectPopupAlignment(page, trigger, popup, align, false);
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
  }
});
