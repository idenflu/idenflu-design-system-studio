import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageRoot, publicAliases, requirePackage, studioRoot } from './runtime.mjs';

const { build } = requirePackage('esbuild');

export async function buildExamples(destination = resolve(studioRoot, 'examples/dist')) {
  await mkdir(destination, { recursive: true });
  await build({
    entryPoints: [resolve(studioRoot, 'examples/app.tsx')],
    outfile: resolve(destination, 'app.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    alias: {
      ...publicAliases,
      '@idenflu/mono-react/reset.css': resolve(packageRoot, 'dist/reset.css'),
      '@idenflu/mono-react/styles.css': resolve(packageRoot, 'dist/styles.css'),
    },
    nodePaths: [resolve(packageRoot, 'node_modules')],
    loader: { '.woff2': 'file', '.svg': 'file' },
    assetNames: 'assets/[name]-[hash]',
  });
  return destination;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('React 단독 예제 빌드 완료', await buildExamples());
}
