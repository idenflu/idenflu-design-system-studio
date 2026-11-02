import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const componentScripts = ['runtime.js', 'components.js', 'script.js', 'search-select.js', 'multi-select.js', 'extras.js', 'datepicker.js', 'number-fields.js', 'data-state.js'];
export const componentStyles = ['styles.css', 'tokens.css', 'components.css', 'extras.css', 'additional.css', 'form-patterns.css', 'search-select.css', 'multi-select-search.css', 'theme.css', 'theme-components.css', 'number-fields.css', 'data-state.css'];
const digest = (value) => createHash('sha256').update(value).digest('hex').slice(0, 12);

export async function build(destination = resolve(project, 'dist')) {
  const source = resolve(project, 'systems/idenflu-mono');
  const output = resolve(destination, 'systems/idenflu-mono');
  const pkg = JSON.parse(await readFile(resolve(project, 'package.json'), 'utf8'));
  const html = await readFile(resolve(source, 'index.html'), 'utf8');
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="\.\/([^"?]+)(?:\?[^\"]*)?"[^>]*>/g)].map((match) => match[1]);
  const scripts = [...html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^\"]*)?"([^>]*)><\/script>/g)];
  await rm(destination, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  async function bundle(names, extension, prefix) {
    const chunks = await Promise.all(names.map(async (name) => `/* ${name} */\n${await readFile(resolve(source, name), 'utf8')}`));
    const text = chunks.join(extension === 'js' ? '\n;\n' : '\n');
    const file = `${prefix}.${digest(text)}.${extension}`;
    await writeFile(resolve(output, file), text);
    return file;
  }
  const files = {
    styles: await bundle(componentStyles, 'css', 'idenflu-mono'),
    runtime: await bundle(componentScripts, 'js', 'idenflu-mono'),
    theme: await bundle(['theme.js'], 'js', 'theme'),
    docsStyles: await bundle(styles, 'css', 'docs'),
    docs: await bundle(scripts.filter((match) => match[2].includes('defer')).map((match) => match[1]), 'js', 'docs'),
  };
  let document = html.replace(/\s*<link\b[^>]*rel="stylesheet"[^>]*>/g, '')
    .replace(/\s*<script src="\.\/[^\"]+"[^>]*><\/script>/g, '');
  document = document.replace('</head>', `  <script src="./${files.theme}"></script>\n    <link rel="stylesheet" href="./${files.docsStyles}" />\n    <script src="./${files.docs}" defer></script>\n  </head>`);
  await writeFile(resolve(output, 'index.html'), document);
  await cp(resolve(source, 'assets'), resolve(output, 'assets'), { recursive: true });
  for (const file of ['index.html', 'gallery.css', 'gallery-entry.js', 'gallery-assets']) await cp(resolve(project, file), resolve(destination, file), { recursive: true });
  const manifest = { name: 'idenflu-mono', version: pkg.version, files };
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await build(), null, 2));
}
