const { test, expect } = require('@playwright/test');

test('CodeBlock keeps its header visible while the body scrolls and copies the displayed code', { tag: ['@mobile', '@theme'] }, async ({ page, context, isMobile }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/systems/idenflu-mono/index.html#/components/code-block');

  const payload = page.getByRole('region', { name: '스케줄 Payload JSON' });
  const label = page.getByText('JSON', { exact: true });
  const copy = page.locator('.code-block').filter({ has: payload }).getByRole('button', { name: '코드 복사', exact: true });
  await expect(label).toBeVisible();
  await expect(copy).toBeVisible();
  expect(await payload.locator('code').textContent()).toContain('\n    "id": 9007199254740993');
  await expect(payload).toHaveCSS('white-space', 'pre');
  await expect(payload).toHaveCSS('max-height', '160px');

  await payload.scrollIntoViewIfNeeded();
  await payload.focus();
  await expect(payload).toBeFocused();
  await expect(payload).toHaveCSS('outline-style', 'solid');
  const before = await label.boundingBox();
  const copyBefore = await copy.boundingBox();
  const body = await payload.boundingBox();
  expect(copyBefore.x).toBeGreaterThan(before.x + before.width);
  expect(copyBefore.x + copyBefore.width).toBeLessThanOrEqual(body.x + body.width);
  expect(copyBefore.y + copyBefore.height).toBeLessThanOrEqual(body.y);
  await payload.evaluate(element => element.scrollBy(element.scrollWidth, element.scrollHeight));
  await expect.poll(() => payload.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  if (isMobile) {
    await expect.poll(() => payload.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
  expect(await label.boundingBox()).toEqual(before);
  expect(await copy.boundingBox()).toEqual(copyBefore);

  const xml = page.getByRole('region', { name: 'XML 코드' });
  await expect(xml.locator('code')).toHaveJSProperty('textContent', '<settings>\n  <audit>\n    <retentionDays>1</retentionDays>\n  </audit>\n</settings>');
  await expect(xml).toHaveCSS('white-space', 'pre-wrap');

  await page.keyboard.press('Shift+Tab');
  await expect(copy).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: '코드를 복사했습니다.' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await payload.locator('code').textContent());
});

test('CodeBlock reports a clipboard write failure', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: async () => { throw new DOMException('Clipboard permission denied', 'NotAllowedError'); },
    });
  });
  await page.goto('/systems/idenflu-mono/index.html#/components/code-block');

  await page.locator('.code-block').getByRole('button', { name: '코드 복사', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '코드를 복사하지 못했습니다.' })).toBeVisible();
});
