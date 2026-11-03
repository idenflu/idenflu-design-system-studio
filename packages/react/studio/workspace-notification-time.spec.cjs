const { test, expect } = require('@playwright/test');

const sample = '/systems/idenflu-mono/index.html?layout=sidebar';

test('notification times update and clicking items only marks them as read', async ({ page }) => {
  const now = new Date('2026-11-03T06:00:00.000Z');
  await page.clock.install({ time: now });
  await page.goto(sample);
  const tabs = page.getByRole('tablist', { name: '열린 업무 화면', exact: true });
  const initialTabCount = await tabs.getByRole('tab').count();
  const selectedTab = tabs.getByRole('tab', { name: '전체 프로젝트', exact: true });
  await expect(selectedTab).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: '업무 알림 3개', exact: true }).click();
  const region = page.getByRole('region', { name: '업무 알림', exact: true });
  const review = region.getByRole('button', { name: /프로젝트 검토 요청/ });
  const project = region.getByRole('button', { name: /디자인 시스템 v2/ });
  const guide = region.getByRole('button', { name: /디자인 가이드 업데이트/ });
  const reviewTime = review.locator('time');
  const projectTime = project.locator('time');
  await expect(reviewTime).toHaveText('5분 전');
  await expect(projectTime).toHaveText('1시간 전');
  const reviewDate = await reviewTime.getAttribute('datetime');
  const projectDate = await projectTime.getAttribute('datetime');
  expect(Math.abs(Date.parse(reviewDate) - (now.getTime() - 5 * 60_000))).toBeLessThan(5_000);
  expect(Math.abs(Date.parse(projectDate) - (now.getTime() - 60 * 60_000))).toBeLessThan(5_000);

  await page.clock.fastForward(60_000);
  await expect(reviewTime).toHaveText('6분 전');
  await expect(projectTime).toHaveText('1시간 전');
  await expect(reviewTime).toHaveAttribute('datetime', reviewDate);
  await expect(projectTime).toHaveAttribute('datetime', projectDate);

  await page.keyboard.press('Escape');
  await expect(region).toBeHidden();
  await page.clock.fastForward(60 * 60_000);
  await page.getByRole('button', { name: '업무 알림 3개', exact: true }).click();
  await expect(reviewTime).toHaveText('1시간 전');
  await expect(projectTime).toHaveText('2시간 전');

  await review.click();
  await expect(region).toBeVisible();
  await expect(page.getByRole('button', { name: '업무 알림 2개', exact: true })).toBeVisible();
  await expect(selectedTab).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByRole('tab')).toHaveCount(initialTabCount);
  await expect(review.locator('.layout-notification-unread')).toHaveCount(0);
  await expect(project.locator('.layout-notification-unread')).toHaveCount(1);
  await review.click();
  await expect(region).toBeVisible();
  await expect(page.getByRole('button', { name: '업무 알림 2개', exact: true })).toBeVisible();
  await project.click();
  await expect(region).toBeVisible();
  await expect(page.getByRole('button', { name: '업무 알림 1개', exact: true })).toBeVisible();
  await expect(guide.locator('.layout-notification-unread')).toHaveCount(1);
  await guide.click();
  await expect(region).toBeVisible();
  await expect(page.getByRole('button', { name: '업무 알림', exact: true })).toBeVisible();
  await expect(region.locator('.layout-notification-unread')).toHaveCount(0);
  await expect(selectedTab).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByRole('tab')).toHaveCount(initialTabCount);
});

test('marking all notifications as read keeps the current page and menu open', async ({ page }) => {
  await page.goto(sample);
  const tabs = page.getByRole('tablist', { name: '열린 업무 화면', exact: true });
  const initialTabCount = await tabs.getByRole('tab').count();
  const selectedTab = tabs.getByRole('tab', { name: '전체 프로젝트', exact: true });
  await page.getByRole('button', { name: '업무 알림 3개', exact: true }).click();
  const region = page.getByRole('region', { name: '업무 알림', exact: true });
  await region.getByRole('button', { name: '모두 읽음', exact: true }).click();
  await expect(region).toBeVisible();
  await expect(region.getByRole('button', { name: '모두 읽음', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '업무 알림', exact: true })).toBeVisible();
  await expect(region.locator('.layout-notification-unread')).toHaveCount(0);
  await region.getByRole('button', { name: /디자인 시스템 v2/ }).click();
  await expect(region).toBeVisible();
  await expect(selectedTab).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByRole('tab')).toHaveCount(initialTabCount);
});
