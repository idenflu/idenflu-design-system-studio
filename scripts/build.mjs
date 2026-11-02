import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildStudio } from '../packages/react/scripts/build-studio.mjs';

const execFileAsync = promisify(execFile);

export const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const componentStyles = ['styles.css', 'tokens.css', 'components.css', 'extras.css', 'additional.css', 'form-patterns.css', 'search-select.css', 'multi-select-search.css', 'theme.css', 'number-fields.css', 'data-state.css'];
const digest = (value) => createHash('sha256').update(value).digest('hex').slice(0, 12);

export async function build(destination = resolve(project, 'dist')) {
  const source = resolve(project, 'systems/idenflu-mono');
  const output = resolve(destination, 'systems/idenflu-mono');
  const pkg = JSON.parse(await readFile(resolve(project, 'package.json'), 'utf8'));
  const html = await readFile(resolve(source, 'index.html'), 'utf8');
  const reactRoot = resolve(project, 'packages/react');
  await execFileAsync(process.execPath, [resolve(reactRoot, 'scripts/build.mjs')], { cwd: reactRoot });
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
    theme: await bundle(['theme.js'], 'js', 'theme'),
    preferences: await bundle(['preferences.js'], 'js', 'preferences'),
  };
  const studio = await buildStudio(resolve(output, 'docs-dist'), { hashed: true });
  Object.assign(files, { docsStyles: `docs-dist/${studio.docs}`, docsComponents: `docs-dist/${studio.components}`, docs: `docs-dist/${studio.app}` });
  const document = html.replace('./theme.js', `./${files.theme}`)
    .replace('./preferences.js', `./${files.preferences}`)
    .replace('./docs-dist/components.css', `./${files.docsComponents}`)
    .replace('./docs-dist/docs.css', `./${files.docsStyles}`)
    .replace('./docs-dist/app.js', `./${files.docs}`);
  await writeFile(resolve(output, 'index.html'), document);
  await cp(resolve(source, 'assets'), resolve(output, 'assets'), { recursive: true });
  for (const file of ['index.html', 'gallery.css', 'gallery-entry.js', 'gallery-assets']) await cp(resolve(project, file), resolve(destination, file), { recursive: true });
  await mkdir(resolve(destination, 'packages/react/studio'), { recursive: true });
  await cp(resolve(project, 'packages/react/studio/index.html'), resolve(destination, 'packages/react/studio/index.html'));
  const manifest = { name: 'idenflu-mono', version: pkg.version, files };
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await build(), null, 2));
}
