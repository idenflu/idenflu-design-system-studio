import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const system = resolve(root, 'systems/idenflu-mono');
const html = await readFile(resolve(system, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const unique = new Set(ids);
if (unique.size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const match of html.matchAll(/\b(?:for|aria-controls|aria-labelledby|aria-describedby|aria-errormessage)="([^"]+)"/g)) {
  for (const id of match[1].split(/\s+/)) if (!unique.has(id)) throw new Error(`Missing ARIA/label target: ${id}`);
}
for (const match of html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)) await access(resolve(system, match[1]));
const cssFiles = (await readdir(system)).filter((file) => file.endsWith('.css'));
const css = (await Promise.all(cssFiles.map((file) => readFile(resolve(system, file), 'utf8')))).join('\n');
for (const match of (html + '\n' + css).matchAll(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/g)) {
  const url = match[2].trim();
  if (!url || /^(?:data:|https?:|#)/.test(url)) continue;
  await access(resolve(system, url.split(/[?#]/)[0]));
}
const declared = new Set([...(css + html).matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
const dynamic = new Set(['--fill', '--fill-position']);
for (const match of css.matchAll(/var\((--[\w-]+)\s*([,)])/g)) {
  if (match[2] !== ',' && !declared.has(match[1]) && !dynamic.has(match[1])) throw new Error(`Undefined token: ${match[1]}`);
}
const routes = [...html.matchAll(/data-route="([^"]+)"/g)].map((match) => match[1]);
if (new Set(routes).size !== routes.length) throw new Error('Duplicate routes');
const links = [...html.matchAll(/href="#\/([^"]+)"/g)].map((match) => match[1]);
for (const link of links) if (!routes.includes(link)) throw new Error(`Missing route: ${link}`);
let scripts = 0;
for (const directory of [system, resolve(root, 'tests'), resolve(root, 'scripts')]) {
  for (const file of await readdir(directory)) if (/\.(?:m?js)$/.test(file)) { execFileSync(process.execPath, ['--check', resolve(directory, file)]); scripts++; }
}
console.log(`${routes.length} routes, ${ids.length} unique IDs, CSS tokens/assets and ${scripts} scripts checked`);
