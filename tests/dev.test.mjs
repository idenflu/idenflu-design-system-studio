import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, relative, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { watchStudio } from '../scripts/dev.mjs';

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'idenflu-dev-'));
  for (const folder of ['packages/react/src', 'packages/react/studio/dist', 'packages/react/scripts', 'systems/idenflu-mono/docs-dist', 'systems/idenflu-mono/assets', 'scripts']) await mkdir(resolve(root, folder), {recursive:true});
  await writeFile(resolve(root, 'packages/react/src/example.tsx'), 'initial');
  await writeFile(resolve(root, 'systems/idenflu-mono/components.css'), 'initial css');
  return root;
}
async function until(check) {
  const deadline = Date.now() + 5000;
  while (!check()) { if (Date.now() > deadline) throw new Error('문서 자동 갱신 시간 초과'); await delay(10); }
}

function fakeWatch() {
  const listeners = new Map();
  return {
    watchFactory(path, {recursive}, callback) {
      const listener = {recursive, callback};
      listeners.set(path, listener);
      return {on() { return this; }, close() { listeners.delete(path); }};
    },
    change(root, path) {
      const file = resolve(root, path);
      for (const [directory, {recursive, callback}] of listeners) {
        const name = relative(directory, file);
        if (name && !name.startsWith('..') && (recursive || !name.includes(sep))) callback('change', name);
      }
    },
  };
}

test('development source edits rebuild the document without watching generated output', async () => {
  const root = await fixture(), builds = [], errors = [];
  const fake = fakeWatch();
  const watcher = watchStudio({root, debounce:20, watchFactory:fake.watchFactory, onError:error => errors.push(error), rebuild:async () => {
    const app = await readFile(resolve(root, 'packages/react/src/example.tsx'), 'utf8');
    const css = await readFile(resolve(root, 'systems/idenflu-mono/components.css'), 'utf8');
    const icon = await readFile(resolve(root, 'systems/idenflu-mono/assets/new.svg'), 'utf8').catch(() => '');
    await writeFile(resolve(root, 'packages/react/studio/dist/routes.json'), '{}');
    await writeFile(resolve(root, 'systems/idenflu-mono/docs-dist/app.js'), app);
    builds.push({app,css,icon});
  }});
  try {
    await watcher.build();
    await writeFile(resolve(root, 'packages/react/src/example.tsx'), 'updated');
    fake.change(root, 'packages/react/src/example.tsx');
    await until(() => builds.some(item => item.app === 'updated'));
    await writeFile(resolve(root, 'systems/idenflu-mono/components.css'), 'updated css');
    fake.change(root, 'systems/idenflu-mono/components.css');
    await until(() => builds.some(item => item.css === 'updated css'));
    await writeFile(resolve(root, 'systems/idenflu-mono/assets/new.svg'), '<svg/>');
    fake.change(root, 'systems/idenflu-mono/assets/new.svg');
    await until(() => builds.some(item => item.icon === '<svg/>'));
    const count = builds.length;
    await writeFile(resolve(root, 'packages/react/studio/example.spec.cjs'), 'test only');
    fake.change(root, 'packages/react/studio/example.spec.cjs');
    fake.change(root, 'packages/react/studio/dist/routes.json');
    fake.change(root, 'systems/idenflu-mono/docs-dist/app.js');
    await delay(100);
    assert.equal(builds.length, count, 'generated assets and test files must not cause rebuild loops');
    assert.equal(await readFile(resolve(root, 'systems/idenflu-mono/docs-dist/app.js'), 'utf8'), 'updated');
    assert.deepEqual(errors, []);
  } finally { watcher.close(); await rm(root, {recursive:true, force:true}); }
});

test('a failed development build reports its error and recovers on the next source edit', async () => {
  const root = await fixture(), errors = [], builds = [];
  let active = 0, maximum = 0;
  const fake = fakeWatch();
  const watcher = watchStudio({root, debounce:20, watchFactory:fake.watchFactory, onError:error => errors.push(error.message), rebuild:async () => {
    active++; maximum = Math.max(maximum, active);
    try {
      await delay(30);
      const source = await readFile(resolve(root, 'packages/react/src/example.tsx'), 'utf8');
      if (source === 'invalid') throw new Error('invalid source');
      builds.push(source);
    } finally { active--; }
  }});
  try {
    await watcher.build();
    await writeFile(resolve(root, 'packages/react/src/example.tsx'), 'invalid');
    fake.change(root, 'packages/react/src/example.tsx');
    await until(() => errors.includes('invalid source'));
    await writeFile(resolve(root, 'packages/react/src/example.tsx'), 'fixed');
    fake.change(root, 'packages/react/src/example.tsx');
    await until(() => builds.includes('fixed'));
    assert.equal(maximum, 1, 'document builds must run sequentially');
  } finally { watcher.close(); await rm(root, {recursive:true, force:true}); }
});
