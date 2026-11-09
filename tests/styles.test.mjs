import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPackageStyles, checkStyleTokens } from '../packages/idenflu-mono-react/scripts/check-styles.mjs';

test('the standalone package cannot rely on document-only tokens', () => {
  const component = { file: 'button.css', text: '.button { color: var(--studio-color); }' };
  const document = { file: 'studio.css', text: ':root { --studio-color: blue; }' };
  assert.doesNotThrow(() => checkStyleTokens([component, document]));
  assert.throws(() => checkStyleTokens([component]), /button.css: --studio-color/);
  assert.doesNotThrow(() => checkStyleTokens([{ file: 'button.css', text: '.button { color: var(--custom-color, blue); }' }]));
  assert.throws(() => checkStyleTokens([{ file: 'button.css', text: '/* --missing: blue; */ .button { color: var(--missing); }' }]), /--missing/);
});

test('unlisted component CSS and missing published assets fail before packaging', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'mono-styles-'));
  const styles = join(folder, 'src/styles');
  const component = join(folder, 'src/components/button');
  const inputs = ['src/styles/tokens.css', 'src/components/button/button.css'];
  const check = () => checkPackageStyles({ root: folder, assets: folder, inputs });
  try {
    await mkdir(styles, { recursive: true });
    await mkdir(component, { recursive: true });
    await writeFile(join(styles, 'tokens.css'), ':root { --primary: blue; }');
    await writeFile(join(styles, 'reset.css'), 'body { margin: 0; }');
    await writeFile(join(component, 'button.css'), '.button { color: var(--primary); }');
    assert.equal((await check()).length, 3);
    await writeFile(join(component, 'unlisted.css'), '.button { padding: 8px; }');
    await assert.rejects(check(), /CSS source missing from bundle inputs/);
    await rm(join(component, 'unlisted.css'));
    await writeFile(join(component, 'button.css'), '.button { background-image: url(./assets/missing.svg); }');
    await assert.rejects(check(), /Missing CSS asset.*missing.svg/);
    await mkdir(join(folder, 'assets'));
    await writeFile(join(folder, 'assets/missing.svg'), '<svg/>');
    assert.equal((await check()).length, 3);
  } finally { await rm(folder, { recursive: true, force: true }); }
});
