import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { build, project } from '../scripts/build.mjs';

test('distribution is deterministic and contains React documentation and licenses', async () => {
  const folder = await mkdtemp(resolve(tmpdir(), 'idenflu-build-'));
  try {
    const first = await build(resolve(folder, 'first'));
    const second = await build(resolve(folder, 'second'));
    assert.deepEqual(first, second);
    const target = resolve(folder, 'first/systems/idenflu-mono');
    for (const file of Object.values(first.files)) await access(resolve(target, file));
    assert(!('runtime' in first.files), 'legacy runtime must not be distributed');
    assert(!('styles' in first.files), 'legacy standalone stylesheet must not be distributed');
    assert(!(await readdir(target)).some(file => /^idenflu-mono\./.test(file)), 'legacy bundles must not be distributed');
    const html = await readFile(resolve(target, 'index.html'), 'utf8');
    assert(html.includes(first.files.docs));
    assert(html.includes(first.files.preferences));
    assert(html.indexOf(first.files.preferences) < html.indexOf(first.files.docsStyles), 'preferences apply before styles');
    assert(!html.includes('?v='));
    assert(html.includes('<div id="root"></div>'));
    assert(html.includes('type="module"'));
    assert(!html.includes('data-route='), 'legacy documentation markup must be removed');
    const styles = await readFile(resolve(target, first.files.docsComponents), 'utf8');
    assert(styles.includes('../assets/fonts/'), 'bundled fonts resolve beside canonical documentation');
    await assert.rejects(access(resolve(folder, 'first/packages/react')), {code:'ENOENT'});
    await assert.rejects(access(resolve(folder, 'first/packages/idenflu-mono-react/studio')), {code:'ENOENT'});
    assert((await readFile(resolve(target, 'assets/fonts/LICENSE.txt'), 'utf8')).length > 0);
    assert((await readFile(resolve(target, 'assets/fonts/wanted-sans/OFL.txt'), 'utf8')).includes('SIL OPEN FONT LICENSE Version 1.1'));
    assert.equal((await readFile(resolve(target, 'assets/fonts/wanted-sans/WantedSansVariable.woff2'))).subarray(0, 4).toString(), 'wOF2');
    assert(styles.includes('Wanted Sans Variable') && styles.includes('../assets/fonts/wanted-sans/WantedSansVariable.woff2'));
    assert((await readFile(resolve(target, 'assets/icons/idenflu/SOURCE.md'), 'utf8')).length > 0);
    assert.equal(await readFile(resolve(target, 'assets/nova-workspace.svg'), 'utf8'), await readFile(resolve(project, 'systems/idenflu-mono/studio/assets/nova-workspace.svg'), 'utf8'));
    assert.equal(await readFile(resolve(target, 'assets/icons/icons.svg'), 'utf8'), await readFile(resolve(project, 'packages/idenflu-mono-react/assets/icons/icons.svg'), 'utf8'));
    await assert.rejects(access(resolve(project, 'packages/idenflu-mono-react/dist/assets/nova-workspace.svg')), {code:'ENOENT'});
    const notices = await readFile(resolve(target, 'docs-dist/THIRD_PARTY_NOTICES.txt'), 'utf8');
    assert(notices.includes('@tanstack/react-virtual') && notices.includes('@tanstack/virtual-core'));
    assert(notices.includes('MIT License') && notices.includes('Tanner Linsley'));
    for (const name of ['react', 'react-dom', 'scheduler']) {
      const folder = resolve(project, 'packages/idenflu-mono-react/node_modules', name);
      const pkg = JSON.parse(await readFile(resolve(folder, 'package.json'), 'utf8'));
      const license = await readFile(resolve(folder, 'LICENSE'), 'utf8');
      assert(notices.includes(`${name} ${pkg.version}\n\n${license}`), `${name} version and full license must be distributed`);
    }
    assert(notices.includes('Meta Platforms, Inc. and affiliates.'));
  } finally { await rm(folder, { recursive: true, force: true }); }
});
