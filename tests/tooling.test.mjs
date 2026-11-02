import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { build } from '../scripts/build.mjs';

test('distribution is deterministic and contains portable runtime, documentation and licenses', async () => {
  const folder = await mkdtemp(resolve(tmpdir(), 'idenflu-build-'));
  try {
    const first = await build(resolve(folder, 'first'));
    const second = await build(resolve(folder, 'second'));
    assert.deepEqual(first, second);
    const target = resolve(folder, 'first/systems/idenflu-mono');
    const files = await readdir(target);
    for (const file of Object.values(first.files)) assert(files.includes(file), file);
    const runtime = await readFile(resolve(target, first.files.runtime), 'utf8');
    assert(!runtime.includes('#profile-form'), 'portable runtime must not require demo DOM');
    assert(!runtime.includes('#component-search'), 'portable runtime must not require demo fields');
    const html = await readFile(resolve(target, 'index.html'), 'utf8');
    assert(html.includes(first.files.docs));
    assert(!html.includes('?v='));
    assert((await readFile(resolve(target, 'assets/fonts/LICENSE.txt'), 'utf8')).length > 0);
    assert((await readFile(resolve(target, 'assets/icons/idenflu/SOURCE.md'), 'utf8')).length > 0);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
