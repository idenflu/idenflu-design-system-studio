import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkReleaseChangelog } from '../scripts/check-release-changelog.mjs';

test('accepts the exact version with a dated or undated heading and a change item', () => {
  for (const heading of ['## 0.4.2', '## 0.4.2 — 2026-11-05', '## [0.4.2] - 미출시']) {
    assert.doesNotThrow(() => checkReleaseChangelog('0.4.2', `# 변경 이력\n${heading}\n\n### 추가\n- 사용자용 기능 추가\n\n## 0.4.1\n- 이전 변경\n`));
  }
  assert.doesNotThrow(() => checkReleaseChangelog('0.4.2-rc.1', '## 0.4.2-rc.1\n* 시험판 변경\n'));
});

test('rejects a missing or duplicate release heading without confusing similar versions', () => {
  assert.throws(() => checkReleaseChangelog('0.4.2', '## 0.4.20\n- 다른 버전\n'), /0\.4\.2 버전 제목이 없습니다/);
  assert.throws(() => checkReleaseChangelog('0.4.2', '## 0.4.2\n- 하나\n## [0.4.2]\n- 둘\n'), /중복/);
});

test('rejects an empty release even when another release contains changes', () => {
  assert.throws(() => checkReleaseChangelog('0.4.2', '## 0.4.2\n### 추가\n\n## 0.4.1\n- 이전 변경\n'), /항목이 비어/);
  assert.throws(() => checkReleaseChangelog('0.4.2', '## 0.4.2\n- [ ]\n- **\n'), /항목이 비어/);
});

test('ignores comments, fenced examples and indented code when checking headings and entries', () => {
  const sample = '<!--\n## 0.4.2\n- 주석\n-->\n```md\n## 0.4.2\n- 예시\n```\n## 0.4.2\n<!-- - 비공개 -->\n    - 코드\n~~~\n- 예시\n~~~\n## 0.4.1\n- 이전 변경\n';
  assert.throws(() => checkReleaseChangelog('0.4.2', sample), /항목이 비어/);
  assert.throws(() => checkReleaseChangelog('0.4.2', '<!-- ## 0.4.2 -->\n```\n## 0.4.2\n- 예시\n```'), /제목이 없습니다/);
});

test('rejects a missing or invalid package version', () => {
  for (const version of [undefined, '', 'v0.4.2', '0.4', '0.4.2\n## 0.4.3']) {
    assert.throws(() => checkReleaseChangelog(version, '## 0.4.2\n- 변경'), /버전이 올바르지/);
  }
});

test('the release command reads the package version and fails before publishing on a missing entry', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'idenflu-release-'));
  try {
    await mkdir(resolve(root, 'scripts'), { recursive: true });
    await mkdir(resolve(root, 'packages/react'), { recursive: true });
    await copyFile(new URL('../scripts/check-release-changelog.mjs', import.meta.url), resolve(root, 'scripts/check-release-changelog.mjs'));
    await writeFile(resolve(root, 'packages/react/package.json'), JSON.stringify({ version: '0.4.2' }));
    await writeFile(resolve(root, 'CHANGELOG.md'), '## 0.4.1\n- 이전 변경\n');
    const run = () => spawnSync(process.execPath, [resolve(root, 'scripts/check-release-changelog.mjs')], { encoding: 'utf8' });
    const missing = run();
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /0\.4\.2 버전 제목이 없습니다/);
    await writeFile(resolve(root, 'CHANGELOG.md'), '## 0.4.2\n- 새 기능\n');
    const valid = run();
    assert.equal(valid.status, 0);
    assert.match(valid.stdout, /0\.4\.2 버전 항목을 확인/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
