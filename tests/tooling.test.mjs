import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { build } from '../scripts/build.mjs';

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
    const redirect = await readFile(resolve(folder, 'first/packages/react/studio/index.html'), 'utf8');
    assert(redirect.includes('location.replace(target.href)'));
    assert(redirect.includes('target.hash = location.hash'));
    assert((await readFile(resolve(target, 'assets/fonts/LICENSE.txt'), 'utf8')).length > 0);
    assert((await readFile(resolve(target, 'assets/icons/idenflu/SOURCE.md'), 'utf8')).length > 0);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
