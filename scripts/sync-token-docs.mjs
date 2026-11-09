import { readFile, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const start = '<!-- generated:token-colors:start -->';
const end = '<!-- generated:token-colors:end -->';
const roles = [
  ['--canvas', '페이지 배경'],
  ['--surface-raised', '카드·패널·입력 배경'],
  ['--surface', '보조 영역'],
  ['--surface-hover', '중립 영역 호버'],
  ['--surface-pressed', '중립 영역 눌림'],
  ['--text', '본문·제목'],
  ['--text-secondary', '보조 문구'],
  ['--text-muted', '부가 문구'],
  ['--border', '카드·패널의 구조 경계'],
  ['--border-subtle', '약한 경계'],
  ['--divider', '내부 구분선'],
  ['--border-control', '입력창·체크박스·라디오 경계'],
  ['--border-control-hover', '입력 경계 호버'],
  ['--primary', '링크·선택·포커스'],
  ['--primary-control', '주요 버튼 배경'],
];

/** Resolve the static color aliases owned by tokens.css, without duplicating HEX values. */
export function renderTokenColorTable(css) {
  const base = new Map(), dark = new Map();
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of source.matchAll(/^(:root(?:\[data-theme="dark"\])?)\s*\{([^}]*)\}/gm)) {
    const target = match[1] === ':root' ? base : dark;
    for (const declaration of match[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      target.set(declaration[1], declaration[2].trim());
    }
  }
  const themes = [base, new Map([...base, ...dark])];
  const color = (tokens, name, visited = new Set()) => {
    if (visited.has(name)) throw new Error(`순환 토큰 참조: ${name}`);
    const value = tokens.get(name);
    if (value === undefined) throw new Error(`문서 색상 토큰이 없습니다: ${name}`);
    const alias = value.match(/^var\((--[\w-]+)\)$/);
    if (alias) return color(tokens, alias[1], new Set([...visited, name]));
    if (!/^#[\da-f]{6}$/i.test(value)) throw new Error(`문서 색상 토큰 형식을 확인하세요: ${name} = ${value}`);
    return value.toUpperCase();
  };
  return [
    '| 토큰 | Light | Dark | 용도 |',
    '| --- | --- | --- | --- |',
    ...roles.map(([name, description]) => `| \`${name}\` | \`${color(themes[0], name)}\` | \`${color(themes[1], name)}\` | ${description} |`),
  ].join('\n');
}

/** Replace only the owned table so handwritten API examples remain untouched. */
export function syncTokenDocumentation(css, markdown) {
  const first = markdown.indexOf(start), last = markdown.indexOf(end);
  if (first < 0 || last < first || markdown.indexOf(start, first + start.length) >= 0 || markdown.indexOf(end, last + end.length) >= 0) {
    throw new Error('색상 문서의 생성 구간 마커를 확인하세요.');
  }
  return `${markdown.slice(0, first + start.length)}\n${renderTokenColorTable(css)}\n${markdown.slice(last)}`;
}

export function checkTokenDocumentation(css, markdown) {
  if (syncTokenDocumentation(css, markdown) !== markdown) {
    throw new Error('색상 문서가 코어 토큰과 다릅니다. npm run docs:tokens를 실행하세요.');
  }
}

async function main() {
  const css = await readFile(resolve(root, 'packages/idenflu-mono-react/src/styles/tokens.css'), 'utf8');
  const path = resolve(root, 'docs/reference/react-components.md');
  const markdown = await readFile(path, 'utf8');
  if (process.argv.includes('--check')) checkTokenDocumentation(css, markdown);
  else await writeFile(path, syncTokenDocumentation(css, markdown));
  console.log(`코어 토큰 색상 문서를 ${process.argv.includes('--check') ? '확인' : '갱신'}했습니다.`);
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
