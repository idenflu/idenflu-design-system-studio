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
        import { Button, Dialog, TextField } from '../src';
        function Fixture() {
          const [open, setOpen] = React.useState(false);
          const [closeOnBackdrop, setCloseOnBackdrop] = React.useState(true);
          const [preventClick, setPreventClick] = React.useState(false);
          const [counts, setCounts] = React.useState({ down: 0, up: 0, click: 0 });
          return <main>
            <Button onClick={() => setOpen(true)}>모달 열기</Button>
            <Dialog open={open} onOpenChange={setOpen} closeOnBackdrop={closeOnBackdrop} aria-label="배경 클릭 시험"
              onPointerDown={() => setCounts(c => ({ ...c, down: c.down + 1 }))}
              onPointerUp={() => setCounts(c => ({ ...c, up: c.up + 1 }))}
              onClick={event => { setCounts(c => ({ ...c, click: c.click + 1 })); if (preventClick && event.target === event.currentTarget) event.preventDefault(); }}>
              <TextField label="이름" defaultValue="드래그할 텍스트" />
              <label><input type="checkbox" checked={closeOnBackdrop} onChange={e => setCloseOnBackdrop(e.target.checked)} />배경 닫기</label>
              <label><input type="checkbox" checked={preventClick} onChange={e => setPreventClick(e.target.checked)} />클릭 취소</label>
              <output aria-label="이벤트 횟수">{counts.down}:{counts.up}:{counts.click}</output>
            </Dialog>
          </main>;
        }
        createRoot(document.getElementById('fixture')).render(<Fixture />);
      `,
    },
    bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2020',
  });
  fixtureScript = fixture.outputFiles[0].text;
});

async function openDialog(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/systems/idenflu-mono/docs-dist/components.css">
    </head><body><div id="fixture"></div></body></html>`);
  await page.addScriptTag({ content: fixtureScript });
  const opener = page.getByRole('button', { name: '모달 열기', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: '배경 클릭 시험', exact: true });
  await expect(dialog).toBeVisible();
  return { dialog, opener };
}

test('dialog closes only when pointer press and release both occur on backdrop', async ({ page }) => {
  const { dialog, opener } = await openDialog(page);
  const field = dialog.getByRole('textbox', { name: '이름', exact: true });
  const input = await field.boundingBox();
  const bounds = await dialog.boundingBox();
  const inside = { x: input.x + input.width / 2, y: input.y + input.height / 2 };
  const outside = { x: bounds.x - 30, y: inside.y };
  expect(outside.x).toBeGreaterThan(0);

  await page.mouse.move(inside.x, inside.y);
  await page.mouse.down();
  await page.mouse.move(outside.x, outside.y, { steps: 10 });
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await expect(field).toHaveValue('드래그할 텍스트');

  await page.mouse.move(outside.x, outside.y);
  await page.mouse.down();
  await page.mouse.move(inside.x, inside.y, { steps: 10 });
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  const counts = await dialog.getByLabel('이벤트 횟수').textContent();
  const [downs, ups, clicks] = counts.split(':').map(Number);
  expect(downs).toBeGreaterThanOrEqual(2);
  expect(ups).toBeGreaterThanOrEqual(2);
  expect(clicks).toBeGreaterThan(0);

  await page.mouse.click(outside.x, outside.y);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('dialog preserves caller cancellation and supports Escape when backdrop closing is disabled', async ({ page }) => {
  const { dialog, opener } = await openDialog(page);
  const bounds = await dialog.boundingBox();
  const outside = { x: bounds.x - 30, y: bounds.y + bounds.height / 2 };
  await dialog.getByRole('checkbox', { name: '클릭 취소' }).check();
  await page.mouse.click(outside.x, outside.y);
  await expect(dialog).toBeVisible();
  await dialog.getByRole('checkbox', { name: '클릭 취소' }).uncheck();
  await dialog.getByRole('checkbox', { name: '배경 닫기' }).uncheck();
  await page.mouse.click(outside.x, outside.y);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('a touch on the backdrop closes the dialog', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 1280, height: 800 } });
  try {
    const page = await context.newPage();
    const { dialog } = await openDialog(page);
    const bounds = await dialog.boundingBox();
    await page.touchscreen.tap(bounds.x - 30, bounds.y + bounds.height / 2);
    await expect(dialog).toBeHidden();
  } finally {
    await context.close();
  }
});
