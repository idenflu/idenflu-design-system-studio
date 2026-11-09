import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { documentStyles } from './styles.mjs';
import { checkTokenDocumentation } from './sync-token-docs.mjs';
import { checkPackageStyles, checkStyleAssets, checkStyleTokens } from '../packages/idenflu-mono-react/scripts/check-styles.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const system = resolve(root, 'systems/idenflu-mono');
const packageRoot = resolve(root, 'packages/idenflu-mono-react');
const studio = resolve(system, 'studio');
const html = await readFile(resolve(system, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const unique = new Set(ids);
if (unique.size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const match of html.matchAll(/\b(?:for|aria-controls|aria-labelledby|aria-describedby|aria-errormessage)="([^"]+)"/g)) {
  for (const id of match[1].split(/\s+/)) if (!unique.has(id)) throw new Error(`Missing ARIA/label target: ${id}`);
}
for (const match of html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)) {
  if (match[1].startsWith('docs-dist/')) continue;
  // Public site assets are generated; validate their authoritative sources on a clean checkout.
  if (match[1].startsWith('assets/')) {
    await access(resolve(packageRoot, match[1])).catch(() => access(resolve(studio, match[1])));
  } else await access(resolve(system, match[1]));
}
if (!html.includes('id="root"') || !html.includes('type="module" src="./docs-dist/app.js"')) throw new Error('Missing canonical React entry');
const packageSheets = await checkPackageStyles();
const cssPaths = documentStyles.map(file => resolve(studio, 'styles', file)).concat(resolve(studio, 'styles/studio.css'));
const documentSheets = await Promise.all(cssPaths.map(async file => ({ file, text: await readFile(file, 'utf8') })));
checkTokenDocumentation(
  packageSheets.find(sheet => sheet.file === resolve(root, 'packages/idenflu-mono-react/src/styles/tokens.css')).text,
  await readFile(resolve(root, 'docs/reference/react-components.md'), 'utf8'),
);
for (const sheet of documentSheets) await checkStyleAssets([sheet], dirname(sheet.file));
checkStyleTokens([...packageSheets, ...documentSheets, { file: 'index.html', text: html }]);
const routes = JSON.parse(await readFile(resolve(studio, 'routes.json'), 'utf8'));
if (routes[0]?.route !== 'overview' || new Set(routes.map(item => item.route)).size !== routes.length) throw new Error('Invalid document routes');
for (const item of routes) {
  if (!item.route || !item.title || !item.group || !item.description) throw new Error(`Incomplete route: ${item.route}`);
  if (/^patterns\/(layout|page)\//.test(item.route)) throw new Error(`Excluded pattern: ${item.route}`);
}
let scripts = 0;
for (const directory of [studio, resolve(studio, 'scripts'), resolve(studio, 'tests'), resolve(root, 'tests'), resolve(root, 'scripts')]) {
  for (const file of await readdir(directory)) if (/\.(?:m?js)$/.test(file)) { execFileSync(process.execPath, ['--check', resolve(directory, file)]); scripts++; }
}
for (const name of await readdir(studio)) {
  if (!/\.tsx?$/.test(name)) continue;
  const text = await readFile(resolve(studio, name), 'utf8');
  for (const match of text.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)) {
    if (match[1].startsWith('.') && resolve(studio, match[1]).startsWith(resolve(packageRoot, 'src') + '/')) {
      throw new Error(`Studio must use public package imports: ${name}: ${match[1]}`);
    }
  }
}
console.log(`${routes.length} routes, ${ids.length} unique IDs, CSS tokens/assets and ${scripts} scripts checked`);
