import { readFile, readdir, mkdir, writeFile, rm, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentStyles } from './styles.mjs';
import { packageModules, packageRequire, packageRoot, publicAliases, studioRoot as studio } from './runtime.mjs';
import { createCompleteExamples } from './complete-examples.mjs';
import { checkCompleteExamples } from './check-complete-examples.mjs';
const { build } = packageRequire('esbuild');
const { JSDOM } = packageRequire('jsdom');
const system = resolve(studio, '..');
const packageAssets = resolve(packageRoot, 'dist/assets');

async function buildAssets(destination) {
  // Site URLs stay stable while package and documentation assets have separate owners.
  for (const source of [packageAssets, resolve(studio, 'assets')]) {
    const overlap = relative(source, destination);
    if (!overlap || (!overlap.startsWith('..') && !overlap.startsWith('/'))) throw new Error('Asset output overlaps source assets');
    const parentOverlap = relative(destination, source);
    if (!parentOverlap || (!parentOverlap.startsWith('..') && !parentOverlap.startsWith('/'))) throw new Error('Asset output contains source assets');
  }
  await rm(destination, { recursive: true, force: true });
  async function merge(source, output) {
    await mkdir(output, { recursive: true });
    for (const entry of await readdir(source, { withFileTypes: true })) {
      const from = resolve(source, entry.name), to = resolve(output, entry.name);
      if (entry.isDirectory()) await merge(from, to);
      else await cp(from, to, { force: false, errorOnExist: true });
    }
  }
  for (const source of [packageAssets, resolve(studio, 'assets')]) {
    await merge(source, destination);
  }
}

export async function buildStudio(destination = resolve(system, 'docs-dist'), { hashed = false } = {}) {
  const metadata = resolve(studio, 'dist');
  const routes = JSON.parse(await readFile(resolve(studio, 'routes.json'), 'utf8'));
  if (routes[0]?.route !== 'overview' || new Set(routes.map(item => item.route)).size !== routes.length) throw new Error('문서 경로 목록을 확인해주세요.');
  await mkdir(metadata, { recursive: true });
  await writeFile(resolve(metadata, 'routes.json'), JSON.stringify(routes, null, 2));
  await writeFile(resolve(metadata, 'navigation.json'), JSON.stringify(routes.map(item => item.route), null, 2));
  const sprite = new JSDOM(await readFile(resolve(packageAssets, 'icons/icons.svg'), 'utf8'), { contentType: 'image/svg+xml' });
  const spriteIcons = [...sprite.window.document.documentElement.children].map(symbol => symbol.getAttribute('id')).sort();
  sprite.window.close();
  await writeFile(resolve(metadata, 'sprite-icons.json'), JSON.stringify(spriteIcons, null, 2));
  const examples=await createCompleteExamples();
  checkCompleteExamples(examples);
  await writeFile(resolve(metadata, 'complete-examples.json'), JSON.stringify(examples, null, 2));
  const result = await build({
    entryPoints: [resolve(studio, 'app.tsx')], outfile: 'app.js', bundle: true, write: false,
    format: 'esm', target: 'es2020', minify: hashed,
    nodePaths: [packageModules],
    // Documentation consumes the same public build as an installed application.
    alias: publicAliases,
  });
  const components = ((await readFile(resolve(packageRoot, 'dist/reset.css'), 'utf8')) + '\n' + (await readFile(resolve(packageRoot, 'dist/styles.css'), 'utf8'))).replaceAll('./assets/', '../assets/');
  const docs = (await Promise.all(documentStyles.map(name => readFile(resolve(studio, 'styles', name), 'utf8')))).join('\n') + '\n' + await readFile(resolve(studio, 'styles/studio.css'), 'utf8');
  const packageNotices = await readFile(resolve(packageRoot, 'dist/THIRD_PARTY_NOTICES.txt'), 'utf8');
  // React is external in the npm package but bundled into the documentation app.
  const documentNotices = await Promise.all(['react', 'react-dom', 'scheduler'].map(async name => {
    const folder = resolve(packageModules, name);
    const pkg = JSON.parse(await readFile(resolve(folder, 'package.json'), 'utf8'));
    const license = await readFile(resolve(folder, 'LICENSE'), 'utf8');
    if (!license.trim()) throw new Error(`${name} LICENSE가 비어 있습니다.`);
    return `${name} ${pkg.version}\n\n${license}`;
  }));
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, 'THIRD_PARTY_NOTICES.txt'), [packageNotices, ...documentNotices].join('\n\n-----\n\n'));
  const files = {};
  for (const [name, extension, content] of [['app', 'js', result.outputFiles[0].text], ['components', 'css', components], ['docs', 'css', docs]]) {
    const hash = hashed ? '.' + createHash('sha256').update(content).digest('hex').slice(0, 12) : '';
    files[name] = `${name}${hash}.${extension}`;
    await writeFile(resolve(destination, files[name]), content);
  }
  for (const file of ['app.js', 'app.js.map']) await rm(resolve(metadata, file), { force: true });
  await buildAssets(resolve(destination, '../assets'));
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('React 모노 문서 빌드 완료', await buildStudio());
}
