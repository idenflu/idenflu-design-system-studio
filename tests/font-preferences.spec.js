const {test,expect} = require('@playwright/test');
const storageKey = 'idenflu-mono-preferences-v1';

for (const prefix of ['', '/dist']) {
  test(`font selection uses bundled Wanted Sans, persists and resets to Pretendard (${prefix || 'dev'})`, {tag:['@mobile','@theme']}, async ({page}) => {
    const failedFonts = [];
    page.on('response', response => { if (response.status() >= 400 && /\.woff2(?:$|\?)/.test(response.url())) failedFonts.push(response.url()); });
    await page.goto(`${prefix}/systems/idenflu-mono/index.html#/foundations/typography`);
    await expect(page.locator('.type-name')).toHaveText('Pretendard');
    await expect(page.locator('body')).toHaveCSS('font-family', /^Pretendard,/);
    await page.getByRole('button',{name:'화면 조정',exact:true}).click();
    const picker = page.getByRole('combobox',{name:/^글꼴:/});
    await expect(picker).toBeFocused();
    await expect(picker).toHaveAccessibleName('글꼴: Pretendard');
    await picker.press('ArrowDown');
    await page.getByRole('option',{name:'Wanted Sans',exact:true}).click();
    await expect(picker).toHaveAccessibleName('글꼴: Wanted Sans');
    await expect(page.locator('.type-name')).toHaveText('Wanted Sans');
    for (const selector of ['body','#studio-settings-dialog','.studio-preferences-font-preview']) {
      await expect(page.locator(selector)).toHaveCSS('font-family', /Wanted Sans Variable/);
    }
    const loaded = await page.evaluate(async () => {
      const faces = await document.fonts.load('400 14px "Wanted Sans Variable"','한글 ABC 0123');
      return faces.map(face=>({family:face.family.replaceAll('"',''),status:face.status}));
    });
    expect(loaded.length).toBeGreaterThan(0);
    expect(loaded.every(face=>face.family==='Wanted Sans Variable'&&face.status==='loaded')).toBe(true);
    expect(await page.evaluate(()=>window.IdenfluPreferences.cssText())).toContain('--font-family-body: "Wanted Sans Variable", Pretendard,');
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).fontFamily,storageKey)).toBe('wanted-sans');
    await page.reload();
    await expect(page.locator('.type-name')).toHaveText('Wanted Sans');
    await expect(page.locator('body')).toHaveCSS('font-family', /Wanted Sans Variable/);
    await page.goto(`${prefix}/systems/idenflu-mono/index.html?layout=sidebar`);
    await expect(page.locator('body')).toHaveCSS('font-family', /Wanted Sans Variable/);
    await page.getByRole('button',{name:'화면 조정',exact:true}).click();
    await expect(picker).toHaveAccessibleName('글꼴: Wanted Sans');
    await page.locator('#studio-settings-dialog').getByRole('button',{name:'초기화',exact:true}).click();
    await expect(picker).toHaveAccessibleName('글꼴: Pretendard');
    await expect(page.locator('body')).toHaveCSS('font-family', /^Pretendard,/);
    expect(await page.evaluate(key=>localStorage.getItem(key),storageKey)).toBeNull();
    expect(failedFonts).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth)).toBe(false);
  });
}

test('font selection and reset synchronize to another open document without losing numeric preferences', async ({page,context}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/buttons');
  await page.evaluate(()=>window.IdenfluPreferences.set({fontSize:16,lineHeight:26}));
  const other = await context.newPage();
  try {
    await other.goto('/systems/idenflu-mono/index.html#/components/text-fields');
    await page.getByRole('button',{name:'화면 조정',exact:true}).click();
    await page.getByRole('combobox',{name:/^글꼴:/}).click();
    await page.getByRole('option',{name:'Wanted Sans',exact:true}).click();
    await expect(other.locator('.route-text-fields .text-input').first()).toHaveCSS('font-family', /Wanted Sans Variable/);
    expect(await other.evaluate(()=>window.IdenfluPreferences.get())).toMatchObject({fontFamily:'wanted-sans',fontSize:16,lineHeight:26});
    await other.evaluate(()=>window.IdenfluPreferences.reset());
    await expect(page.getByRole('combobox',{name:/^글꼴:/})).toHaveAccessibleName('글꼴: Pretendard');
    await expect(page.locator('body')).toHaveCSS('font-family', /^Pretendard,/);
    expect(await page.evaluate(()=>window.IdenfluPreferences.get())).toMatchObject({fontFamily:'pretendard',fontSize:14,lineHeight:22});
  } finally { await other.close(); }
});
