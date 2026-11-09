import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkTokenDocumentation, renderTokenColorTable, syncTokenDocumentation } from '../scripts/sync-token-docs.mjs';

const css = await readFile(new URL('../packages/mono-react/src/styles/tokens.css', import.meta.url), 'utf8');
const markdown = await readFile(new URL('../docs/reference/react-components.md', import.meta.url), 'utf8');

test('published color defaults match the authoritative light and dark CSS aliases', () => {
  assert.doesNotThrow(() => checkTokenDocumentation(css, markdown));
});

test('changing a primitive invalidates the document until regeneration without changing API text', () => {
  const nextCss = `${css}\n:root[data-theme="dark"] {\n--canvas: var(--documentation-test-canvas);\n--documentation-test-canvas: var(--documentation-test-color);\n--documentation-test-color: #123456;\n}`;
  assert.throws(() => checkTokenDocumentation(nextCss, markdown), /npm run docs:tokens/);
  const generated = syncTokenDocumentation(nextCss, markdown);
  assert.match(generated, /\| `--canvas` \| `#[\dA-F]{6}` \| `#123456` \|/);
  assert.doesNotThrow(() => checkTokenDocumentation(nextCss, generated));
  const outside = value => value.replace(/<!-- generated:token-colors:start -->[\s\S]*?<!-- generated:token-colors:end -->/, 'TABLE');
  assert.equal(outside(generated), outside(markdown));
});

test('invalid aliases and absent or duplicate ownership markers fail explicitly', () => {
  assert.throws(() => renderTokenColorTable(`${css}\n:root {--canvas: var(--missing);}`), /문서 색상 토큰이 없습니다/);
  assert.throws(() => renderTokenColorTable(`${css}\n:root {--canvas: var(--canvas);}`), /순환 토큰 참조/);
  assert.throws(() => renderTokenColorTable(`${css}\n:root {--canvas: color-mix(in srgb, white 50%, black);}`), /토큰 형식/);
  assert.throws(() => syncTokenDocumentation(css, '# API'), /마커/);
  assert.throws(() => syncTokenDocumentation(css, `${markdown}\n<!-- generated:token-colors:start -->`), /마커/);
});
