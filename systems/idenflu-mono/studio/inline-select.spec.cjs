const { test, expect } = require('@playwright/test');

function taggedSection(page) {
  return page.locator('.react-studio-section').filter({has:page.getByRole('heading',{name:'태그형 복수 선택',exact:true})});
}

test('inline MultiSelect opens from the full empty area and preserves search and keyboard selection', {tag:['@mobile','@theme']}, async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/select');
  const section = taggedSection(page);
  for (const searchable of [true,false]) {
    const label = searchable ? '참여 팀' : '검색 없는 태그 선택';
    const trigger = section.getByRole('combobox',{name:new RegExp(`^${label}:`)});
    const control = trigger.locator('..');
    const tags = control.locator('.multi-inline-tags');
    const popup = control.locator('..').locator('.select-popup');
    const box = await tags.boundingBox();
    await tags.click({position:{x:box.width-8,y:box.height/2}});
    await expect(trigger).toHaveAttribute('aria-expanded','true');
    const focused = searchable ? popup.getByRole('combobox',{name:`${label} 검색`,exact:true}) : trigger;
    await expect(focused).toBeFocused();
    if (searchable) await focused.fill('개');
    const active = await focused.getAttribute('aria-activedescendant');
    await tags.click({position:{x:box.width-8,y:box.height/2}});
    await expect(trigger).toHaveAttribute('aria-expanded','true');
    await expect(focused).toBeFocused();
    await expect(focused).toHaveAttribute('aria-activedescendant',active);
    if (searchable) await expect(focused).toHaveValue('개');
    else await focused.press('ArrowDown');
    await focused.press('Enter');
    await expect(control.getByRole('button',{name:'개발 제거',exact:true})).toBeVisible();
    await focused.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded','false');
    await expect(trigger).toBeFocused();
    await tags.click({position:{x:box.width-8,y:box.height/2}});
    await expect(trigger).toHaveAttribute('aria-expanded','true');
    if (searchable) await expect(focused).toHaveValue('');
    await page.getByRole('heading',{name:'태그형 복수 선택',exact:true}).click();
    await expect(trigger).toHaveAttribute('aria-expanded','false');
    expect(await control.evaluate(node => getComputedStyle(node).cursor)).toBe('pointer');
  }
});

test('inline MultiSelect removal, reset and caret clicks do not also activate the empty area', {tag:['@mobile','@theme']}, async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/select');
  const section = taggedSection(page);
  const trigger = section.getByRole('combobox',{name:/^참여 팀:/});
  const control = trigger.locator('..');
  await control.getByRole('button',{name:'디자인 제거',exact:true}).locator('.icon-x').click();
  await expect(control.locator('.multi-inline-chip')).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await control.locator('.multi-inline-placeholder').click();
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  await control.locator('..').getByRole('option',{name:'개발',exact:true}).click();
  await control.locator('..').getByRole('combobox',{name:'참여 팀 검색',exact:true}).press('Escape');
  await control.getByRole('button',{name:'참여 팀 모두 지우기',exact:true}).locator('.icon-x').click();
  await expect(control.locator('.multi-inline-chip')).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-expanded','false');
  await trigger.locator('.icon-keyboard-arrow-down').click();
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  await trigger.locator('.icon-keyboard-arrow-down').click();
  await expect(trigger).toHaveAttribute('aria-expanded','false');
});
