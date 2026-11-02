import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'studio/dist');
const html = await readFile(resolve(root, '../../systems/idenflu-mono/index.html'), 'utf8');
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const documentation = await readFile(resolve(root, '../../systems/idenflu-mono/documentation.js'), 'utf8');
const searchTerms = new Map([...documentation.matchAll(/^\s*(?:'([^']+)'|(\w+)):\s*\['([^']*)'/gm)].map(([, quoted, bare, terms]) => [quoted || bare, terms]));
const routes = [...html.matchAll(/<section\b[^>]*\bdata-route="([^"]+)"[^>]*>/g)].map(([tag, route]) => {
  const attr = name => decode(tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] || '');
  return { route, title: attr('data-title'), group: attr('data-group'), description: attr('data-description'), searchTerms: searchTerms.get(route.replace('components/', '')) || '' };
});
const extraRoutes = JSON.parse(await readFile(resolve(root, 'studio/extra-routes.json'), 'utf8'));
for (const {after, ...route} of extraRoutes) {
  const index = routes.findIndex(item => item.route === after);
  if (index < 0) throw new Error(`문서 위치를 확인해주세요: ${after}`);
  routes.splice(index + 1, 0, route);
}
if (!routes.length || new Set(routes.map(route => route.route)).size !== routes.length) throw new Error('문서 경로 목록을 확인해주세요.');
await mkdir(output, {recursive:true});
await writeFile(resolve(output, 'routes.json'), JSON.stringify(routes, null, 2));
const nav = html.match(/<nav class="docs-navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
const navigation = [...nav.matchAll(/href="#\/([^"]+)"/g)].map(([, route]) => route);
for (const {after, route} of extraRoutes) {
  const index = navigation.indexOf(after);
  if (index < 0) throw new Error(`메뉴 위치를 확인해주세요: ${after}`);
  navigation.splice(index + 1, 0, route);
}
await writeFile(resolve(output, 'navigation.json'), JSON.stringify(navigation, null, 2));
const icons = (await readdir(resolve(root, '../../systems/idenflu-mono/assets/icons/idenflu'))).filter(name => name.endsWith('.svg')).map(name => name.slice(0, -4)).sort();
await writeFile(resolve(output, 'icons.json'), JSON.stringify(icons, null, 2));
await build({entryPoints:[resolve(root, 'studio/app.tsx')], outfile:resolve(output, 'app.js'), bundle:true, format:'esm', target:'es2020', sourcemap:true});
console.log(`React 문서 경로 ${routes.length}개 준비`);
