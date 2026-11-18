const { test, expect } = require('@playwright/test');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');

const packageRoot = resolve(__dirname, '../../../packages/idenflu-mono-react');
const { build } = createRequire(resolve(packageRoot, 'package.json'))('esbuild');

let fixtureScript;
test.beforeAll(async () => {
  const fixture = await build({
    stdin: {
      resolveDir: packageRoot,
      loader: 'tsx',
      contents: `
        import * as React from 'react';
        import { createRoot } from 'react-dom/client';
        import { Dialog } from './src';

        function Fixture() {
          const [option, setOption] = React.useState(null);
          const options = [
            { label: 'Default' },
            { label: 'Small', size: 'sm' },
            { label: 'Medium', size: 'md' },
            { label: 'Large', size: 'lg' },
            { label: 'Custom', size: 720 },
            { label: 'Divided custom', size: 720, variant: 'divided' },
          ];
          return <>
            {options.map(item => <button key={item.label} onClick={() => setOption(item)}>{item.label}</button>)}
            <Dialog open={option !== null} onOpenChange={open => { if (!open) setOption(null); }}
              size={option?.size} variant={option?.variant} aria-label={option?.label}>Sample content</Dialog>
          </>;
        }

        createRoot(document.getElementById('fixture')).render(<Fixture />);
      `,
    },
    bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2020',
  });
  fixtureScript = fixture.outputFiles[0].text;
});

test('dialog presets and pixel widths fit the viewport with variant-specific margins', {tag:'@mobile'}, async ({page}) => {
  await page.goto('/');
  await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/packages/idenflu-mono-react/dist/styles.css">
    </head><body><div id="fixture"></div></body></html>`);
  await page.addScriptTag({ content: fixtureScript });

  const viewportWidth = page.viewportSize().width;
  for (const [label, size] of [['Default', 640], ['Small', 360], ['Medium', 640], ['Large', 800], ['Custom', 720], ['Divided custom', 720]]) {
    await page.getByRole('button', {name: label, exact: true}).click();
    const dialog = page.getByRole('dialog', {name: label, exact: true});
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    const mobileDivided = viewportWidth <= 600 && label === 'Divided custom';
    const gutter = mobileDivided ? 16 : 24;
    if (mobileDivided) {
      expect(bounds.width).toBeGreaterThan(viewportWidth - 48);
    } else {
      expect(bounds.width).toBeCloseTo(Math.min(size, viewportWidth - gutter * 2), 0);
    }
    expect(bounds.x).toBeGreaterThanOrEqual(gutter);
    expect(viewportWidth - bounds.x - bounds.width).toBeGreaterThanOrEqual(gutter);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('studio preview changes the open dialog width with each selection', {tag:'@mobile'}, async ({page}) => {
  await page.goto('/systems/idenflu-mono/index.html#/components/overlays');
  const opener = page.getByRole('button', {name: '너비 미리보기 열기'});
  await opener.click();
  const dialog = page.getByRole('dialog', {name: '다이얼로그 너비 비교'});
  await expect(dialog.getByRole('button', {name: 'MD · 640px', pressed: true})).toBeVisible();

  const viewportWidth = page.viewportSize().width;
  for (const [name, width, prop] of [
    ['MD · 640px', 640, 'size="md"'],
    ['SM · 360px', 360, 'size="sm"'],
    ['LG · 800px', 800, 'size="lg"'],
    ['직접 지정 · 720px', 720, 'size={720}'],
  ]) {
    const option = dialog.getByRole('button', {name});
    await option.click();
    await expect(option).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByText(prop, {exact: true})).toBeVisible();
    await expect(dialog).toHaveCSS('width', `${Math.min(width, viewportWidth - 48)}px`);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
