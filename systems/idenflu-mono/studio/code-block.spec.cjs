const { test, expect } = require('@playwright/test');

test('CodeBlock keeps its format label visible while the body scrolls', { tag: ['@mobile', '@theme'] }, async ({ page, isMobile }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/code-block');

  const payload = page.getByRole('region', { name: '스케줄 Payload JSON' });
  const label = page.getByText('JSON', { exact: true });
  await expect(label).toBeVisible();
  expect(await payload.locator('code').textContent()).toContain('\n    "id": 9007199254740993');
  await expect(payload).toHaveCSS('white-space', 'pre');
  await expect(payload).toHaveCSS('max-height', '160px');

  await payload.scrollIntoViewIfNeeded();
  await payload.focus();
  await expect(payload).toBeFocused();
  await expect(payload).toHaveCSS('outline-style', 'solid');
  const before = await label.boundingBox();
  await payload.evaluate(element => element.scrollBy(element.scrollWidth, element.scrollHeight));
  await expect.poll(() => payload.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  if (isMobile) {
    await expect.poll(() => payload.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
  expect(await label.boundingBox()).toEqual(before);

  const xml = page.getByRole('region', { name: 'XML 코드' });
  await expect(xml.locator('code')).toHaveJSProperty('textContent', '<settings>\n  <audit>\n    <retentionDays>1</retentionDays>\n  </audit>\n</settings>');
  await expect(xml).toHaveCSS('white-space', 'pre-wrap');
});
