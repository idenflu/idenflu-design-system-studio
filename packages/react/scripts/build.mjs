import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { componentStyles } from '../../../scripts/build.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '../../systems/idenflu-mono');
const output = resolve(root, 'dist');

await build({
  entry: [resolve(root, 'src/index.ts')],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: output,
  external: ['react', 'react-dom'],
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
});
await mkdir(output, { recursive: true });
const styles = await Promise.all(componentStyles.map(async (name) =>
  `/* ${name} */\n${await readFile(resolve(source, name), 'utf8')}`));
styles.push(`/* react.css */\n${await readFile(resolve(root, 'src/react.css'), 'utf8')}`);
await writeFile(resolve(output, 'styles.css'), styles.join('\n'));
await cp(resolve(source, 'assets'), resolve(output, 'assets'), { recursive: true });
