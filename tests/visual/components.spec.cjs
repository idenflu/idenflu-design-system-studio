const { test, expect } = require('@playwright/test');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const requirePackage = createRequire(resolve(__dirname, '../../packages/idenflu-mono-react/package.json'));
let script;

test.beforeAll(async () => {
  ({ outputFiles: [{ text: script }] } = await requirePackage('esbuild').build({
    stdin: { loader: 'tsx', resolveDir: resolve(__dirname, '../../packages/idenflu-mono-react'), contents: `
      import * as React from 'react';
      import { createRoot } from 'react-dom/client';
      import { Button, Badge, PageHeader, TextField, Select, NumberField, DatePicker, TimePicker, DataGrid } from './dist/index.js';
      const columns = [
        {id:'name',header:'프로젝트',width:472,accessor:row=>row.name},
        {id:'status',header:'상태',width:236,accessor:row=>row.status,cell:row=><Badge variant="primary">{row.status}</Badge>},
        {id:'owner',header:'담당자',width:236,accessor:row=>row.owner},
      ];
      const rows=[{id:'1',name:'디자인 시스템',status:'진행 중',owner:'김민수'},{id:'2',name:'컴포넌트 가이드',status:'검토 중',owner:'이서연'}];
      createRoot(document.getElementById('fixture')).render(<main id="sheet">
        <PageHeader title="컴포넌트 시각 기준" description="제목과 작업, 입력과 목록을 함께 확인합니다." actions={<Button variant="outline">보조 작업</Button>} style={{marginBottom:24}} />
        <section><h2>작업과 상태</h2><div className="row">
          <Button>저장</Button><Button variant="outline">취소</Button><Button variant="danger" appearance="outline">삭제</Button><Button disabled>처리 불가</Button>
        </div><div className="row">{['neutral','primary','success','warning','danger'].map(variant=><Badge key={variant} variant={variant} appearance="solid">{variant}</Badge>)}</div></section>
        <section><h2>입력과 선택</h2><div className="fields">
          <TextField label="프로젝트명" defaultValue="디자인 시스템" helperText="이름을 입력하세요." />
          <TextField label="검증 오류" defaultValue="" error="필수 입력입니다." />
          <Select label="담당 팀" defaultValue="design" options={[{value:'design',label:'프로덕트 디자인'},{value:'dev',label:'플랫폼 개발'}]} />
          <NumberField label="진행률" defaultValue="72" min="0" max="100" unit="%" />
          <DatePicker label="마감일" defaultValue="2026-11-12" />
          <TimePicker label="알림 시간" defaultValue="09:30" disabled />
        </div></section>
        <section><h2>목록</h2><DataGrid label="프로젝트 목록" columns={columns} rows={rows} getRowId={row=>row.id} pagination={false} searchable={false} /></section>
      </main>);
    ` }, bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2020',
  }));
});

test('representative components retain their reviewed appearance', async ({ page }, testInfo) => {
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.setContent(`<!doctype html><html lang="ko" data-theme="${testInfo.project.name}"><head><meta charset="utf-8">
    <link rel="stylesheet" href="/systems/idenflu-mono/docs-dist/components.css">
    <style>
      @font-face {font-family:VisualPretendard;src:url('/packages/idenflu-mono-react/assets/fonts/Pretendard-Regular.woff2')}
      @font-face {font-family:VisualPretendard;src:url('/packages/idenflu-mono-react/assets/fonts/Pretendard-SemiBold.woff2');font-weight:600}
      :root {--font-family-body:VisualPretendard,sans-serif}
      #sheet {width:1000px;padding:28px;background:var(--canvas);color:var(--text)}
      h1 {font-size:24px;line-height:32px;margin:0 0 24px} h2 {font-size:16px;line-height:24px;margin:0 0 16px}
      section+section {margin-top:28px} .row {display:flex;gap:12px;align-items:center;margin-bottom:12px}
      .fields {display:grid;grid-template-columns:1fr 1fr;gap:20px 24px}
    </style></head><body><div id="fixture"></div></body></html>`);
  await page.addScriptTag({ content: script });
  await expect(page.getByRole('heading', {name:'컴포넌트 시각 기준'})).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(errors).toEqual([]);
  await expect(page.locator('#sheet')).toHaveScreenshot('components.png');
});
