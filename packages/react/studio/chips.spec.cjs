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
  const geometry = await page.locator('.route-chips .chip').evaluateAll(chips => chips.map(el => ({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,height:el.getBoundingClientRect().height,content:el.scrollWidth,width:el.clientWidth})));
  for (const chip of geometry) { expect(chip.left).toBeGreaterThanOrEqual(0); expect(chip.right).toBeLessThanOrEqual(320); expect(chip.content).toBeLessThanOrEqual(chip.width); expect(chip.height).toBeGreaterThanOrEqual(32); }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
