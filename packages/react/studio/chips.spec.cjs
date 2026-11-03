const {test, expect} = require('@playwright/test');
const url = '/systems/idenflu-mono/index.html#/components/chips';
const section = (page, title) => page.locator('.react-studio-section').filter({has:page.getByRole('heading',{name:title,exact:true,level:2})});

test('display chips have no hover or focus behavior', async ({page}) => {
  await page.goto(url);
  const examples = section(page,'표시용 칩');
  const chips = examples.locator('.chip');
  await expect(chips).toHaveCount(3);
  await expect(examples.getByRole('button')).toHaveCount(0);
  const chip = chips.first();
  const appearance = () => chip.evaluate(el => { const style = getComputedStyle(el); return {tag:el.tagName,tabIndex:el.tabIndex,background:style.backgroundColor,border:style.borderColor,color:style.color,cursor:style.cursor}; });
  const before = await appearance();
  expect(before.tag).toBe('SPAN');
  expect(before.tabIndex).toBe(-1);
  expect(before.cursor).toBe('default');
  await chip.hover();
  expect(await appearance()).toEqual(before);
  await chip.click();
  await expect(chip).not.toHaveAttribute('aria-pressed');
  const firstFilter = page.getByRole('button',{name:'디자인',exact:true});
  await firstFilter.focus();
  await firstFilter.press('Shift+Tab');
  await expect(page.locator('.docs-toc a').last()).toBeFocused();
});

test('rounded chips and all six colors retain keyboard selection and readable contrast', async ({page}) => {
  await page.goto(url);
  const round = page.getByRole('button',{name:'라운드 선택',exact:true});
  await round.focus();
  await round.press('Space');
  await expect(round).toHaveAttribute('aria-pressed','true');
  const radius = await round.evaluate(el => ({radius:parseFloat(getComputedStyle(el).borderTopLeftRadius),height:el.getBoundingClientRect().height}));
  expect(radius.radius).toBeGreaterThanOrEqual(radius.height / 2);
  const palette = section(page,'색상');
  const colors = await palette.locator('.react-studio-example').evaluateAll(cards => {
    const luminance = rgb => {
      const channels = rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(c => { const v = c / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const contrast = el => { const style = getComputedStyle(el), fg = luminance(style.color), bg = luminance(style.backgroundColor); return (Math.max(fg,bg) + .05) / (Math.min(fg,bg) + .05); };
    return cards.map(card => ({background:getComputedStyle(card.querySelector('.chip--static')).backgroundColor,displayContrast:contrast(card.querySelector('.chip--static')),selectedContrast:contrast(card.querySelector('button'))}));
  });
  expect(colors).toHaveLength(6);
  expect(new Set(colors.map(item => item.background)).size).toBe(6);
  const secondary = palette.locator('.chip--secondary.chip--static').first();
  const secondaryStyle = await secondary.evaluate(el => ({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
  expect(secondaryStyle).toEqual(await page.locator('.topbar-gallery').evaluate(el => ({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})));
  const borders = await palette.evaluate(el => ({neutral:getComputedStyle(el.querySelector('.chip:not(.chip--colored)')).borderColor,colored:[...el.querySelectorAll('.chip--static.chip--colored:not(.chip--secondary):not(.chip--rounded)')].map(chip => getComputedStyle(chip).borderColor)}));
  expect(new Set(borders.colored).size).toBe(4);
  for (const border of borders.colored) expect(border).not.toBe(borders.neutral);
  for (const color of colors) { expect(color.displayContrast).toBeGreaterThanOrEqual(4.5); expect(color.selectedContrast).toBeGreaterThanOrEqual(4.5); }
  for (const button of await palette.getByRole('button').all()) {
    await expect(button).toHaveAttribute('aria-pressed','true');
    const before = await button.evaluate(el => ({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
    await button.hover();
    expect(await button.evaluate(el => ({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}))).toEqual(before);
    await button.focus();
    await button.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed','false');
  }
});

test('chip sizes and longest labels fit mobile at the largest preferences', async ({page}) => {
  await page.setViewportSize({width:320,height:740});
  await page.goto(url);
  const sizes = section(page,'사이즈');
  const heights = await sizes.locator('.react-studio-example').evaluateAll(cards => cards.map(card => card.querySelector('.chip').getBoundingClientRect().height));
  expect(heights[0]).toBeLessThan(heights[1]);
  expect(heights[1]).toBeLessThan(heights[2]);
  await page.evaluate(() => window.IdenfluPreferences.set({fontSize:18,lineHeight:32,spacing:150,controlHeight:48,radius:12}));
  const geometry = await page.locator('.route-chips .chip').evaluateAll(chips => chips.map(el => ({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,height:el.getBoundingClientRect().height,content:el.scrollWidth,width:el.clientWidth,compact:el.classList.contains('chip--compact')})));
  for (const chip of geometry) { expect(chip.left).toBeGreaterThanOrEqual(0); expect(chip.right).toBeLessThanOrEqual(320); expect(chip.content).toBeLessThanOrEqual(chip.width); expect(chip.height).toBeGreaterThanOrEqual(chip.compact ? 24 : 32); }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});


async function selectedChipAppearance(chip) {
  return chip.evaluate(element => {
    const styles = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {foreground:styles.color,background:styles.backgroundColor,outlineStyle:styles.outlineStyle,outlineColor:styles.outlineColor,outlineWidth:parseFloat(styles.outlineWidth),shadow:styles.boxShadow,width:bounds.width,height:bounds.height,label:element.textContent,children:element.childElementCount};
  });
}
function chipContrast(first, second) {
  const luminance = input => {
    const isSrgb = input.startsWith('color(srgb');
    const channels = input.match(/[\d.]+/g).slice(0,3).map(Number).map(value => isSrgb ? value : value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05);
}
function expectVisibleChipFocus(appearance, label) {
  const rings = [...appearance.shadow.matchAll(/rgba?\([^)]+\)|color\([^)]+\)/g)].map(match => match[0]);
  if (appearance.outlineStyle !== 'none' && appearance.outlineWidth > 0) rings.push(appearance.outlineColor);
  const colors = [...new Set(rings)];
  expect(colors.length, `${label}: dual focus ring`).toBeGreaterThanOrEqual(2);
  expect(Math.max(...colors.map(color => chipContrast(color,appearance.background))), `${label}: ring against chip`).toBeGreaterThanOrEqual(3);
  expect(Math.max(...colors.flatMap(first => colors.map(second => chipContrast(first,second)))), `${label}: ring separation`).toBeGreaterThanOrEqual(3);
}

test('selected chips keep readable text and distinct focus through default and custom theme colors', async ({page}) => {
  await page.goto(url);
  const palette = section(page,'색상');
  const chips = palette.getByRole('button');
  const overrides = [null, '#ffeb3b', '#ffffff', '#000000', '#777777'];
  for (const theme of ['light','dark']) {
    for (const color of overrides) {
      await page.evaluate(({theme,color}) => {
        window.IdenfluPreferences.reset();
        window.IdenfluTheme.set(theme);
        if (color) window.IdenfluPreferences.set({colors:{[theme]:{'--primary':color,'--success':color,'--warning':color,'--danger':color}}});
      }, {theme,color});
      for (const chip of await chips.all()) {
        await expect(chip).toHaveAttribute('aria-pressed','true');
        const label = `${theme} ${color || 'default'} ${await chip.getAttribute('aria-label')}`;
        const before = await selectedChipAppearance(chip);
        expect(chipContrast(before.foreground,before.background), label).toBeGreaterThanOrEqual(4.5);
        await chip.hover();
        const hovered = await selectedChipAppearance(chip);
        expect(hovered.foreground, label).toBe(before.foreground);
        expect(hovered.background, label).toBe(before.background);
        // Establish keyboard modality before focusing each selected chip.
        await page.keyboard.press('Shift');
        await chip.focus();
        const focused = await selectedChipAppearance(chip);
        expectVisibleChipFocus(focused,label);
        expect({foreground:focused.foreground,background:focused.background,width:focused.width,height:focused.height,label:focused.label,children:focused.children},label).toEqual({foreground:before.foreground,background:before.background,width:before.width,height:before.height,label:before.label,children:before.children});
      }
    }
  }
  await page.reload();
  await expect(palette).toBeVisible();
  for (const chip of await chips.all()) {
    const appearance = await selectedChipAppearance(chip);
    expect(chipContrast(appearance.foreground,appearance.background)).toBeGreaterThanOrEqual(4.5);
  }
});

test('chip focus and selected colors respect forced-color system settings', async ({page}) => {
  await page.goto(url);
  await page.evaluate(() => window.IdenfluPreferences.set({colors:{light:{'--primary':'#ffeb3b'}}}));
  await page.emulateMedia({forcedColors:'active'});
  const chip = section(page,'색상').getByRole('button',{name:'강조 색상 선택',exact:true});
  await page.keyboard.press('Tab');
  await chip.focus();
  const appearance = await selectedChipAppearance(chip);
  expect(appearance.outlineStyle).not.toBe('none');
  expect(appearance.outlineWidth).toBeGreaterThanOrEqual(2);
  expect(chipContrast(appearance.foreground,appearance.background)).toBeGreaterThanOrEqual(4.5);
  expect(await chip.evaluate(element => getComputedStyle(element).forcedColorAdjust)).toBe('none');
});


test('compact display chips preserve comfortable sizes and fit dense mobile content', async ({page}) => {
  await page.setViewportSize({width:320,height:740});
  await page.goto(url);
  const compact = section(page,'컴팩트 표시용 칩');
  const chips = compact.locator('.chip--compact');
  await expect(chips).toHaveCount(9);
  const comfortableHeights = await section(page,'사이즈').locator('.react-studio-example').evaluateAll(cards => cards.map(card => card.querySelector('.chip').getBoundingClientRect().height));
  expect(comfortableHeights).toEqual([30,36,42]);
  const groups = await compact.locator('.react-studio-example').evaluateAll(cards => cards.map(card => [...card.querySelectorAll('.chip')].map(element => ({height:element.getBoundingClientRect().height,font:parseFloat(getComputedStyle(element).fontSize),tag:element.tagName,tabIndex:element.tabIndex,cursor:getComputedStyle(element).cursor}))));
  for (const [index,group] of groups.entries()) {
    for (const chip of group) expect(chip).toEqual({height:[24,26,30][index],font:[12,13,14][index],tag:'SPAN',tabIndex:-1,cursor:'default'});
  }
  await chips.first().evaluate(element => { element.textContent = '아주 긴 프로젝트 분류와 상세 상태를 표시하는 칩'; });
  await page.evaluate(() => window.IdenfluPreferences.set({fontSize:18,lineHeight:32,spacing:150,controlHeight:48,radius:12}));
  for (const chip of await chips.all()) {
    const geometry = await chip.evaluate(element => ({left:element.getBoundingClientRect().left,right:element.getBoundingClientRect().right,contentWidth:element.scrollWidth,width:element.clientWidth,contentHeight:element.scrollHeight,height:element.clientHeight}));
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(320);
    expect(geometry.contentWidth).toBeLessThanOrEqual(geometry.width);
    expect(geometry.contentHeight).toBeLessThanOrEqual(geometry.height);
    await expect(chip).not.toHaveAttribute('aria-pressed');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
