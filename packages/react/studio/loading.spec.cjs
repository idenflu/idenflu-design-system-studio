const { test, expect } = require('@playwright/test');

test('NOVA spinners animate at the requested sizes and remain within the viewport', async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/loading');
  const orbit = page.getByRole('status',{name:'NOVA 궤도 로딩 중',exact:true});
  const mark = page.getByRole('status',{name:'NOVA 로고 로딩 중',exact:true});
  await expect(orbit).toBeVisible(); await expect(mark).toBeVisible();
  expect((await orbit.boundingBox()).width).toBe(96);
  await expect(orbit.locator('.nova-spinner__orbit')).not.toHaveCSS('animation-name','none');
  await expect(mark.locator('svg')).toHaveAttribute('aria-hidden','true');
  for (const size of [24,48,72]) {
    const loader = page.getByRole('status',{name:`NOVA ${size}px 로딩 중`,exact:true});
    const bounds = await loader.boundingBox();
    expect(bounds.width).toBe(size); expect(bounds.height).toBe(size);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test('NOVA spinners honor reduced motion while keeping their loading description', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/systems/idenflu-mono/index.html#/components/loading');
  const orbit = page.getByRole('status',{name:'NOVA 궤도 로딩 중',exact:true});
  await expect(orbit).toBeVisible();
  await expect(orbit.locator('.nova-spinner__orbit')).toHaveCSS('animation-name','none');
  for (const facet of await orbit.locator('.nova-spinner__facet').all()) {
    await expect(facet).toHaveCSS('animation-name','none');
    await expect(facet).toHaveCSS('opacity','1');
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(orbit.locator('.nova-spinner__orbit')).not.toHaveCSS('animation-name','none');
});

test('NOVA button loading prevents duplicate activation and reports completion', async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/loading');
  await page.getByRole('button',{name:'예제 작업 시작',exact:true}).click();
  const pending = page.getByRole('button',{name:'처리 중',exact:true});
  await expect(pending).toBeDisabled(); await expect(pending).toHaveAttribute('aria-busy','true');
  await expect(pending.locator('.nova-spinner')).toHaveAttribute('aria-hidden','true');
  await expect(page.getByText('예제 작업을 완료했습니다.',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'예제 작업 시작',exact:true})).toBeEnabled();
});
