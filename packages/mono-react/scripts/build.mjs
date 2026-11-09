import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { execFileSync } from 'node:child_process';
import { componentStyles } from './styles.mjs';
import { checkPackageStyles } from './check-styles.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = resolve(root, 'assets');
const output = resolve(root, 'dist');

execFileSync(process.execPath, [resolve(root, 'scripts/generate-icons.mjs'), '--check'], { stdio: 'inherit' });
await checkPackageStyles();
await build({
  entry: { index: resolve(root, 'src/index.ts'), 'icons/index': resolve(root, 'src/icons/index.ts') },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: output,
  external: ['react', 'react-dom'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
});
await mkdir(output, { recursive: true });
await cp(resolve(root, '../../LICENSE'), resolve(output, 'LICENSE'));
const styles = await Promise.all(componentStyles.map(async (name) =>
  `/* ${name} */\n${await readFile(resolve(root, name), 'utf8')}`));
await writeFile(resolve(output, 'styles.css'), styles.join('\n'));
const runtimeNotices = await Promise.all(['@tanstack/react-virtual', '@tanstack/virtual-core'].map(async name => {
  const folder = resolve(root, 'node_modules', name);
  const pkg = JSON.parse(await readFile(resolve(folder, 'package.json'), 'utf8'));
  return `${name} ${pkg.version}\n\n${await readFile(resolve(folder, 'LICENSE'), 'utf8')}`;
}));
await writeFile(resolve(output, 'THIRD_PARTY_NOTICES.txt'), runtimeNotices.join('\n\n-----\n\n'));
await cp(resolve(root, 'src/styles/tokens.css'), resolve(output, 'tokens.css'));
await cp(resolve(root, 'src/styles/reset.css'), resolve(output, 'reset.css'));
await cp(assets, resolve(output, 'assets'), { recursive: true });
