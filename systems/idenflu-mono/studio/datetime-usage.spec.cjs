const { test, expect } = require('@playwright/test');
const { createRequire } = require('node:module');
const path = require('node:path');
const packageRoot = path.resolve(__dirname, '../../../packages/mono-react');
const requireReact = createRequire(path.join(packageRoot, 'package.json'));
const ts = requireReact('typescript');

const url = '/systems/idenflu-mono/index.html#/components/datetime-picker';
const preview = async (page, name) => JSON.parse(await page.getByRole('region', { name, exact: true }).locator('pre').innerText());

test('datetime usage binds single and range values to an object and accepts external empty values', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('tab', { name: '값 바인딩', exact: true }).click();
  await page.locator('#datetime-bind-single').fill('2026-11-13 16:45');
  await page.locator('#datetime-bind-single').press('Enter');
  await page.locator('#datetime-bind-range-start').fill('2026-11-13 09:15');
  await page.locator('#datetime-bind-range-end').fill('2026-11-13 18:00');
  await page.locator('#datetime-bind-range-end').press('Enter');
  expect(await preview(page, '바인딩된 상태')).toEqual({
    scheduledAt: '2026-11-13T16:45',
    reservation: { startsAt: '2026-11-13T09:15', endsAt: '2026-11-13T18:00' },
  });
  await page.getByRole('button', { name: '값 비우기', exact: true }).click();
  for (const id of ['datetime-bind-single', 'datetime-bind-range-start', 'datetime-bind-range-end']) await expect(page.locator('#' + id)).toHaveValue('');
  expect(await preview(page, '바인딩된 상태')).toEqual({ scheduledAt: null, reservation: { startsAt: null, endsAt: null } });
  await page.getByRole('button', { name: '예시 값 적용', exact: true }).click();
  await expect(page.locator('#datetime-bind-single')).toHaveValue('2026-11-12 14:30');
  await expect(page.locator('#datetime-bind-range-end')).toHaveValue('2026-11-12 17:30');
});

for (const timezoneId of ['America/New_York', 'Asia/Tokyo']) {
  test.describe('datetime usage conversion in ' + timezoneId, () => {
    test.use({ timezoneId });
    test('converts service time independently of browser timezone, including midnight and empty values', async ({ page }) => {
      await page.goto(url);
      await page.getByRole('tab', { name: '값 변환', exact: true }).click();
      const input = page.locator('#datetime-convert');
      await expect(input).toHaveValue('2026-11-12 14:30');
      expect(await preview(page, '변환된 값')).toEqual({
        pickerValue: '2026-11-12T14:30', displayValue: '2026-11-12 14:30', compactValue: '202611121430',
        utcIso: '2026-11-12T05:30:00.000Z', epochMilliseconds: Date.parse('2026-11-12T05:30:00.000Z'),
      });
      await input.fill('202611130015');
      await input.press('Enter');
      expect(await preview(page, '변환된 값')).toEqual({
        pickerValue: '2026-11-13T00:15', displayValue: '2026-11-13 00:15', compactValue: '202611130015',
        utcIso: '2026-11-12T15:15:00.000Z', epochMilliseconds: Date.parse('2026-11-12T15:15:00.000Z'),
      });
      await page.getByRole('button', { name: '변환 값 비우기', exact: true }).click();
      expect(await preview(page, '변환된 값')).toEqual({ pickerValue: null, displayValue: null, compactValue: null, utcIso: null, epochMilliseconds: null });
      await page.getByRole('button', { name: '서버 값 불러오기', exact: true }).click();
      await expect(input).toHaveValue('2026-11-12 14:30');
      expect((await preview(page, '변환된 값')).utcIso).toBe('2026-11-12T05:30:00.000Z');
    });
  });
}

test('datetime usage submits canonical FormData, maps UTC payload and validates and resets the form', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('tab', { name: '폼 제출', exact: true }).click();
  const submit = page.getByRole('button', { name: '제출 데이터 확인', exact: true });
  await submit.click();
  expect(await preview(page, '제출 결과')).toEqual({
    formData: { title: '디자인 시스템 리뷰', reminderAt: '2026-11-12T08:30', 'booking-start': '2026-11-12T09:00', 'booking-end': '2026-11-12T17:30' },
    apiPayload: { title: '디자인 시스템 리뷰', reminderAt: '2026-11-11T23:30:00.000Z', startsAt: '2026-11-12T00:00:00.000Z', endsAt: '2026-11-12T08:30:00.000Z' },
  });
  await page.locator('#datetime-form-reminder').fill('');
  await page.locator('#datetime-form-reminder').press('Enter');
  await expect(page.getByRole('region', { name: '제출 결과', exact: true })).toHaveCount(0);
  await submit.click();
  expect((await preview(page, '제출 결과')).apiPayload.reminderAt).toBeNull();
  const end = page.locator('#datetime-form-range-end');
  await end.fill('2026-11-12 08:00');
  await end.press('Enter');
  await submit.click();
  await expect(end).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('region', { name: '제출 결과', exact: true })).toHaveCount(0);
  await end.fill('2026-11-12 18:00');
  await end.press('Enter');
  await submit.click();
  expect((await preview(page, '제출 결과')).apiPayload.endsAt).toBe('2026-11-12T09:00:00.000Z');
  await page.getByRole('button', { name: '폼 초기화', exact: true }).click();
  await expect(page.locator('#datetime-form-reminder')).toHaveValue('2026-11-12 08:30');
  await expect(end).toHaveValue('2026-11-12 17:30');
  await expect(page.getByRole('region', { name: '제출 결과', exact: true })).toHaveCount(0);
});

test('datetime usage code examples typecheck as standalone components and stay within the viewport', {tag:'@mobile'}, async ({ page }) => {
  await page.goto(url);
  const sources = new Map();
  const root = packageRoot;
  for (const [index, label] of ['값 바인딩', '값 변환', '폼 제출'].entries()) {
    await page.getByRole('tab', { name: label, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: label, exact: true });
    await panel.locator('summary').click();
    sources.set(path.join(root, 'tests', `__datetime-usage-${index}.tsx`), await panel.locator('code').innerText());
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  Object.assign(options, { noEmit: true, baseUrl: root, paths: { '@idenflu/mono-react': ['dist/index.d.ts'] } });
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, language, ...rest) => sources.has(file) ? ts.createSourceFile(file, sources.get(file), language, true) : original(file, language, ...rest);
  const program = ts.createProgram([...sources.keys()], options, host);
  const errors = ts.getPreEmitDiagnostics(program).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
  expect(errors.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([]);
});
