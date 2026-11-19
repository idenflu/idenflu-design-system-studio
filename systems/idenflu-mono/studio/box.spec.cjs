const { test, expect } = require('@playwright/test');

test('Box renders the requested and default tags with token-based styles', { tag: ['@mobile', '@theme'] }, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/box');

  const box = page.getByRole('region', { name: '프로젝트 정보', exact: true });
  await expect(box).toHaveJSProperty('tagName', 'SECTION');
  await expect(box).toHaveCSS('display', 'flex');
  await expect(box).toHaveCSS('flex-direction', 'column');
  await expect(box).toHaveCSS('gap', '8px');
  await expect(box).toHaveCSS('padding', '8px 12px 12px 20px');
  await expect(box).toHaveCSS('margin', '8px 8px 16px 6px');
  await expect(box).toHaveCSS('border-top-width', '1px');
  const content = box.locator('div');
  await expect(content).toHaveText('프로젝트 이름과 공유 설정을 관리합니다.');
  await expect(content).toHaveCSS('padding-top', '0px');
  for (const name of ['as', 'display', 'gap', 'padding', 'margin', 'border', 'pt', 'pb', 'pr', 'pl', 'mt', 'mb', 'ml', 'mr']) {
    expect(await box.getAttribute(name)).toBeNull();
  }

  await expect(page.getByRole('region', { name: 'React 사용 예시 코드' })).toContainText("import { Box } from '@idenflu/mono-react'");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});
