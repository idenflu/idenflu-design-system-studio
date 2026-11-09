// Executed from a temporary project's directory after npm installs the tarball.
const assert = require('node:assert/strict');
const { readFileSync, realpathSync } = require('node:fs');
const { createRequire } = require('node:module');
const { dirname, isAbsolute, relative, resolve } = require('node:path');
const format = process.argv.find(value => value.startsWith('--format='))?.slice('--format='.length);

async function main() {
  const React = require('react');
  const { renderToString } = require('react-dom/server');
  const components = format === 'esm' ? await import('@idenflu/mono-react') : require('@idenflu/mono-react');
  const icons = format === 'esm' ? await import('@idenflu/mono-react/icons') : require('@idenflu/mono-react/icons');
  const { Button, Select, Grid, GridItem, Dialog, DataGrid, NovaSpinner } = components;
  assert.ok([Button, Select, Grid, GridItem, Dialog, DataGrid, NovaSpinner, icons.SearchIcon].every(Boolean));
  const installedRoot = dirname(require.resolve('@idenflu/mono-react/package.json'));
  const fromInstalled = createRequire(require.resolve('@idenflu/mono-react'));
  assert.equal(fromInstalled('react'), React, 'the package shares the consumer React instance');
  assert.equal(require('react-dom/package.json').version, React.version);
  const markup = renderToString(React.createElement(Grid, { columns: { base: 1, sm: 2 } },
    React.createElement(GridItem, { colSpan: 'full' }, React.createElement(Button, null, React.createElement(icons.SearchIcon, { label: '검색' }), '검색')),
    React.createElement(Select, { label: '담당 팀', options: [{ value: 'design', label: '디자인' }], defaultValue: 'design', name: 'team' }),
    React.createElement(Dialog, { open: false, modal: false, onOpenChange() {}, 'aria-label': '설정' }, '설정')));
  assert.match(markup, /class="mono-grid/);
  assert.match(markup, /role="combobox"/);
  assert.match(markup, /aria-label="검색"/);
  assert.match(markup, /value="design"/);
  assert.match(markup, /aria-modal="false"/);
  let assetCount = 0;
  for (const entry of ['styles.css', 'tokens.css', 'reset.css']) {
    const filename = require.resolve(`@idenflu/mono-react/${entry}`);
    const css = readFileSync(filename, 'utf8');
    assert.ok(css.length > 0, `${entry} is published`);
    for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
      const url = match[1];
      if (/^(?:data:|https?:|#)/.test(url)) continue;
      const asset = realpathSync(resolve(dirname(filename), decodeURIComponent(url.split(/[?#]/)[0])));
      const path = relative(installedRoot, asset);
      assert.ok(!path.startsWith('..') && !isAbsolute(path), `CSS asset is inside the installed package: ${url}`);
      assert.ok(readFileSync(asset).length > 0, `CSS asset is not empty: ${url}`);
      assetCount++;
    }
  }
  assert.ok(assetCount > 0, 'checks the actual CSS font and SVG assets');
  assert.ok(readFileSync(require.resolve('@idenflu/mono-react/assets/icons/icons.svg')).length > 0, 'wildcard asset export resolves');
  const pkg = require('@idenflu/mono-react/package.json');
  assert.deepEqual(pkg.sideEffects, ['**/*.css'], 'CSS stays visible to consumer tree shaking');
  assert.deepEqual(Object.keys(pkg.exports).sort(), ['.', './icons', './styles.css', './tokens.css', './reset.css', './assets/*', './package.json'].sort());
  console.log(`${React.version} ${format}: 공개 import, SSR, CSS 자산 ${assetCount}개 통과`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
