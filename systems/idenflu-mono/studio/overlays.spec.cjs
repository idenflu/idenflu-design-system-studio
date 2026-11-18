const { test, expect } = require('@playwright/test');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const packageRoot = resolve(__dirname, '../../../packages/idenflu-mono-react');
const requireReact = createRequire(resolve(packageRoot, 'package.json'));
const { build } = requireReact('esbuild');

let fixtureScript;
test.beforeAll(async () => {
  const fixture = await build({
    stdin: {
      resolveDir: packageRoot,
      loader: 'tsx',
      contents: `
        import * as React from 'react';
        import { createRoot } from 'react-dom/client';
        import { Button, Dialog, DropdownMenu, DropdownMenuItem, Popover, Select, DatePicker, TimePicker, Tooltip } from './src';
        function ClippedLayers() {
          const [selection, setSelection] = React.useState('');
          return <div style={{position:'relative', paddingBlock:40}}>
            <div data-scroll-frame style={{position:'relative', zIndex:0, overflow:'auto', height:44}}>
              <div style={{display:'flex', alignItems:'flex-start', gap:8, height:100, paddingTop:12}}>
                <Popover trigger={<button>팝오버</button>} label="팝오버 내용"><button onClick={() => setSelection('팝오버 선택')}>적용</button></Popover>
                <DropdownMenu trigger={<button>메뉴</button>} label="작업 메뉴" onSelect={setSelection}>
                  <DropdownMenuItem value="메뉴 선택">편집</DropdownMenuItem>
                </DropdownMenu>
                <Tooltip content="잘림 방지 도움말"><button>도움말</button></Tooltip>
              </div>
            </div>
            <div aria-hidden="true" style={{position:'absolute', zIndex:1, inset:'0 0 auto', height:40, background:'white'}} />
            <div aria-hidden="true" style={{position:'absolute', zIndex:1, inset:'84px 0 auto', height:40, background:'white'}} />
            <output>{selection}</output>
          </div>;
        }
        function Fixture({ clipped }) {
          const [open, setOpen] = React.useState(false);
          const [draft, setDraft] = React.useState('');
          if (clipped) return <main style={{padding:12}}>
            <Button onClick={() => setOpen(true)}>모달 열기</Button>
            <ClippedLayers />
            <Dialog open={open} onOpenChange={setOpen} aria-label="잘림 방지 모달" variant="divided">
              <ClippedLayers />
            </Dialog>
          </main>;
          return <main>
            <Button onClick={() => setOpen(true)}>모달 열기</Button>
            <Dialog open={open} onOpenChange={setOpen} aria-label="중첩 팝업 회귀">
              <h2>중첩 팝업</h2>
              <Button variant="outline" onClick={() => setOpen(false)}>모달 닫기</Button>
              <Popover trigger={<Button variant="outline">설정 팝업</Button>} label="설정 메뉴">
                <label>임시 입력<input aria-label="임시 입력" className="text-input" value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Escape' && draft) {
                      event.preventDefault(); event.stopPropagation(); setDraft('');
                    }
                  }} /></label>
                <Select label="팀" options={[{label:'디자인',value:'design'},{label:'개발',value:'engineering'}]} />
                <DatePicker label="날짜" defaultValue="2026-11-02" />
                <TimePicker label="시작 시간" />
                <Popover trigger={<Button variant="outline">더보기</Button>} label="추가 설정"><Button>내부 동작</Button></Popover>
              </Popover>
            </Dialog>
          </main>;
        }
        const root = document.getElementById('fixture');
        createRoot(root).render(<Fixture clipped={root.hasAttribute('data-clipped')} />);
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

async function renderFixture(page, clipped = false) {
  // Keep the fixture on the test server's origin so local fonts and CSS load normally.
  await page.goto('/');
  await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/systems/idenflu-mono/docs-dist/components.css">
    <link rel="stylesheet" href="/systems/idenflu-mono/docs-dist/docs.css">
    </head><body><div id="fixture"${clipped ? ' data-clipped' : ''}></div></body></html>`);
  await page.addScriptTag({ content: fixtureScript });
}

async function mountFixture(page) {
  await renderFixture(page);
  const opener = page.getByRole('button', { name:'모달 열기', exact:true });
  // Test keyboard focus restoration explicitly; Safari does not focus a button on pointer click.
  await opener.focus();
  await opener.press('Enter');
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

  const timeTrigger = popover.getByRole('button', { name:'시작 시간 선택 열기', exact:true });
  await timeTrigger.click();
  const time = popover.getByRole('dialog', { name:'시작 시간 선택', exact:true });
  await expect(time).toBeVisible();
  await expect(time.getByRole('listbox', {name:'시', exact:true}).locator('[role="option"][tabindex="0"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(time).toBeHidden();
  await expect(timeTrigger).toBeFocused();
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

test('anchored layers receive pointer events outside the scroll frame and above overlapping siblings', {tag:'@mobile'}, async ({ page }) => {
  await renderFixture(page, true);
  const opener = page.getByRole('button', {name:'모달 열기', exact:true});
  const dialog = page.getByRole('dialog', {name:'잘림 방지 모달'});

  for (const scope of [page.getByRole('main'), dialog]) {
    if (scope === dialog) await opener.click();
    const frame = scope.locator('[data-scroll-frame]:visible').first();
    const popoverTrigger = frame.getByRole('button', {name:'팝오버', exact:true});
    const popover = frame.getByRole('region', {name:'팝오버 내용'});
    await popoverTrigger.click();
    const scrollOffset = await popover.evaluate(element => {
      const frame = element.closest('[data-scroll-frame]');
      const previous = element.getBoundingClientRect().top;
      frame.scrollTop = 8;
      return {previous, scrollTop:frame.scrollTop};
    });
    expect(scrollOffset.scrollTop).toBe(8);
    await expect.poll(() => popover.evaluate(element => element.getBoundingClientRect().top))
      .toBeCloseTo(scrollOffset.previous - 8);
    const apply = popover.getByRole('button', {name:'적용'});
    await expect(apply).toBeVisible();
    await expect.poll(() => apply.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const frame = element.closest('[data-scroll-frame]').getBoundingClientRect();
      const y = bounds.top + bounds.height / 2;
      return y > frame.bottom && element.contains(document.elementFromPoint(bounds.left + bounds.width / 2, y));
    })).toBe(true);
    await apply.click();
    await expect(scope.getByText('팝오버 선택', {exact:true}).first()).toBeVisible();

    const menuTrigger = frame.getByRole('button', {name:'메뉴', exact:true});
    await menuTrigger.press('ArrowDown');
    const menu = frame.getByRole('menu', {name:'작업 메뉴'});
    const item = menu.getByRole('menuitem', {name:'편집'});
    await expect(item).toBeFocused();
    await item.click();
    await expect(scope.getByText('메뉴 선택', {exact:true}).first()).toBeVisible();
    await expect(menu).toBeHidden();
    await expect(menuTrigger).toBeFocused();

    const tooltipTrigger = frame.getByRole('button', {name:'도움말', exact:true});
    await tooltipTrigger.focus();
    const tooltip = frame.getByRole('tooltip');
    await expect(tooltip).toHaveText('잘림 방지 도움말');
    await expect.poll(() => tooltip.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const frame = element.closest('[data-scroll-frame]').getBoundingClientRect();
      const y = bounds.top + bounds.height / 2;
      const hit = document.elementFromPoint(bounds.left + bounds.width / 2, y);
      // The tooltip's transparent hover bridge can extend into the frame.
      return y < frame.top && element.contains(hit);
    })).toBe(true);
    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
    await expect(tooltipTrigger).toBeFocused();
    if (scope === dialog) await expect(dialog).toBeVisible();
  }
});
