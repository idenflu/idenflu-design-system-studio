const { test, expect } = require('@playwright/test');
const { build } = require('esbuild');

let fixtureScript;
test.beforeAll(async () => {
  const fixture = await build({
    stdin: {
      resolveDir: __dirname,
      loader: 'tsx',
      contents: `
        import * as React from 'react';
        import { createRoot } from 'react-dom/client';
        import { Button, Dialog, Popover, Select, DatePicker } from '../src';
        function Fixture() {
          const [open, setOpen] = React.useState(false);
          const [draft, setDraft] = React.useState('');
          return <main>
            <Button onClick={() => setOpen(true)}>모달 열기</Button>
            <Dialog open={open} onOpenChange={setOpen} aria-label="중첩 팝업 회귀">
              <h2>중첩 팝업</h2>
              <Button variant="outline" onClick={() => setOpen(false)}>모달 닫기</Button>
              <Popover trigger="설정 팝업" label="설정 메뉴">
                <label>임시 입력<input aria-label="임시 입력" className="text-input" value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Escape' && draft) {
                      event.preventDefault(); event.stopPropagation(); setDraft('');
                    }
                  }} /></label>
                <Select label="팀" options={[{label:'디자인',value:'design'},{label:'개발',value:'engineering'}]} />
                <DatePicker label="날짜" defaultValue="2026-11-02" />
                <Popover trigger="더보기" label="추가 설정"><Button>내부 동작</Button></Popover>
              </Popover>
            </Dialog>
          </main>;
        }
        createRoot(document.getElementById('fixture')).render(<Fixture />);
      `,
    },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
  });
  fixtureScript = fixture.outputFiles[0].text;
});

async function mountFixture(page) {
  // Keep the fixture on the test server's origin so local fonts and CSS load normally.
  await page.goto('/');
  await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/systems/idenflu-mono/docs-dist/components.css">
    <link rel="stylesheet" href="/systems/idenflu-mono/docs-dist/docs.css">
    </head><body><div id="fixture"></div></body></html>`);
  await page.addScriptTag({ content: fixtureScript });
  const opener = page.getByRole('button', { name:'모달 열기', exact:true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name:'중첩 팝업 회귀', exact:true });
  await expect(dialog).toBeVisible();
  const popoverTrigger = page.getByRole('button', { name:'설정 팝업', exact:true });
  await popoverTrigger.click();
  const popover = page.getByRole('region', { name:'설정 메뉴', exact:true });
  await expect(popover).toBeVisible();
  return { opener, dialog, popover, popoverTrigger };
}

test('native dialog, select, calendar and nested popovers dismiss one Escape layer and restore focus', {tag:'@mobile'}, async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const { opener, dialog, popover, popoverTrigger } = await mountFixture(page);

  const select = popover.getByRole('combobox', { name:/팀:/ });
  await select.click();
  await expect(select).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(select).toHaveAttribute('aria-expanded', 'false');
  await expect(select).toBeFocused();
  await expect(popover).toBeVisible();
  await expect(dialog).toBeVisible();

  const calendarTrigger = popover.getByRole('button', { name:'달력 열기', exact:true });
  await calendarTrigger.click();
  const calendar = page.getByRole('dialog', { name:'날짜 선택 달력', exact:true });
  await expect(calendar).toBeVisible();
  await expect(calendar.locator('.calendar-day[tabindex="0"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(calendar).toBeHidden();
  await expect(calendarTrigger).toBeFocused();
  await expect(popover).toBeVisible();
  await expect(dialog).toBeVisible();

  const nestedTrigger = popover.getByRole('button', { name:'더보기', exact:true });
  await nestedTrigger.click();
  const nested = page.getByRole('region', { name:'추가 설정', exact:true });
  await expect(nested).toBeVisible();
  await nested.getByRole('button', { name:'내부 동작', exact:true }).focus();
  await page.keyboard.press('Escape');
  await expect(nested).toBeHidden();
  await expect(nestedTrigger).toBeFocused();
  await expect(popover).toBeVisible();
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(popover).toBeHidden();
  await expect(popoverTrigger).toBeFocused();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
});

test('an input can consume Escape before the containing popup and native dialog dismiss', {tag:'@mobile'}, async ({ page }) => {
  const { opener, dialog, popover, popoverTrigger } = await mountFixture(page);
  const input = popover.getByRole('textbox', { name:'임시 입력', exact:true });
  await input.fill('편집 중');
  await input.press('Escape');
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(popover).toBeVisible();
  await expect(dialog).toBeVisible();
  await input.press('Escape');
  await expect(popover).toBeHidden();
  await expect(popoverTrigger).toBeFocused();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
