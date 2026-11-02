import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { documentStyles } from '../../../scripts/styles.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const system = resolve(root, '../../systems/idenflu-mono');

export async function buildStudio(destination = resolve(system, 'docs-dist'), { hashed = false } = {}) {
  const metadata = resolve(root, 'studio/dist');
  const routes = JSON.parse(await readFile(resolve(root, 'studio/routes.json'), 'utf8'));
  if (routes[0]?.route !== 'overview' || new Set(routes.map(item => item.route)).size !== routes.length) throw new Error('문서 경로 목록을 확인해주세요.');
  await mkdir(metadata, { recursive: true });
  await writeFile(resolve(metadata, 'routes.json'), JSON.stringify(routes, null, 2));
  await writeFile(resolve(metadata, 'navigation.json'), JSON.stringify(routes.map(item => item.route), null, 2));
  const icons = (await readdir(resolve(system, 'assets/icons/idenflu'))).filter(name => name.endsWith('.svg')).map(name => name.slice(0, -4)).sort();
  await writeFile(resolve(metadata, 'icons.json'), JSON.stringify(icons, null, 2));
  const result = await build({ entryPoints: [resolve(root, 'studio/app.tsx')], outfile: 'app.js', bundle: true, write: false, format: 'esm', target: 'es2020', minify: hashed });
  const components = ((await readFile(resolve(system, 'reset.css'), 'utf8')) + '\n' + (await readFile(resolve(root, 'dist/styles.css'), 'utf8'))).replaceAll('./assets/', '../assets/');
  const docs = (await Promise.all(documentStyles.map(name => readFile(resolve(system, name), 'utf8')))).join('\n') + '\n' + await readFile(resolve(root, 'studio/studio.css'), 'utf8');
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  const files = {};
  for (const [name, extension, content] of [['app', 'js', result.outputFiles[0].text], ['components', 'css', components], ['docs', 'css', docs]]) {
    const hash = hashed ? '.' + createHash('sha256').update(content).digest('hex').slice(0, 12) : '';
    files[name] = `${name}${hash}.${extension}`;
    await writeFile(resolve(destination, files[name]), content);
  }
  for (const file of ['app.js', 'app.js.map']) await rm(resolve(metadata, file), { force: true });
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('React 모노 문서 빌드 완료', await buildStudio());
}
