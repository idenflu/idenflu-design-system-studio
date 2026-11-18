const { test, expect } = require('@playwright/test');

test('Box renders the requested and default tags with token-based styles', { tag: ['@mobile', '@theme'] }, async ({ page }) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/box');

  const box = page.getByRole('region', { name: '프로젝트 정보', exact: true });
  await expect(box).toHaveJSProperty('tagName', 'SECTION');
  await expect(box).toHaveCSS('display', 'flex');
  await expect(box).toHaveCSS('flex-direction', 'column');
  await expect(box).toHaveCSS('gap', '8px');
  await expect(box).toHaveCSS('padding', '16px');
  await expect(box).toHaveCSS('border-top-width', '1px');
  await expect(box.locator('div')).toHaveText('프로젝트 이름과 공유 설정을 관리합니다.');
  for (const name of ['as', 'display', 'gap', 'padding', 'border']) {
    expect(await box.getAttribute(name)).toBeNull();
  }

  await expect(page.getByRole('region', { name: 'React 사용 예시 코드' })).toContainText("import { Box } from '@idenflu/mono-react'");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});
