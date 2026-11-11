import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { componentStyles } from './styles.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = packageRoot;
// Slider and Slides set these values through React's inline style prop.
const dynamicTokens = new Set(['--fill', '--fill-position']);

export function checkStyleTokens(sheets) {
  const css = sheets.map(sheet => sheet.text.replace(/\/\*[\s\S]*?\*\//g, '')).join('\n');
  const declared = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
  for (const sheet of sheets) {
    const text = sheet.text.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of text.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
      if (match[2] !== ',' && !declared.has(match[1]) && !dynamicTokens.has(match[1])) {
        throw new Error(`Undefined token in ${sheet.file}: ${match[1]}`);
      }
    }
  }
}

export async function checkStyleAssets(sheets, baseDirectory) {
  for (const { file, text } of sheets) {
    for (const match of text.matchAll(/url\(\s*(['"]?)([^'"\)]+)\1\s*\)/g)) {
      const url = match[2].trim();
      if (!url || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(url)) continue;
      // Inputs use URLs relative to the published styles.css, not each source file.
      await access(resolve(baseDirectory, decodeURIComponent(url.split(/[?#]/)[0]))).catch(() => {
        throw new Error(`Missing CSS asset in ${file}: ${url}`);
      });
    }
  }
}

export async function checkPackageStyles({ root = packageRoot, assets = assetRoot, inputs = componentStyles } = {}) {
  const expected = new Set([...inputs, 'src/styles/reset.css']);
  if (expected.size !== inputs.length + 1) throw new Error('Duplicate style input or reset.css in the default stylesheet');
  const actual = new Set();
  async function walk(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = resolve(folder, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.css')) actual.add(relative(root, path).replaceAll('\\', '/'));
    }
  }
  await walk(resolve(root, 'src'));
  for (const path of actual) if (!expected.has(path)) throw new Error(`CSS source missing from bundle inputs: ${path}`);
  for (const path of expected) if (!actual.has(path)) throw new Error(`Missing CSS source: ${path}`);
  const sheets = await Promise.all([...expected].map(async path => ({ file: resolve(root, path), text: await readFile(resolve(root, path), 'utf8') })));
  // Neither Studio nor the optional document reset may supply default package tokens.
  checkStyleTokens(sheets.filter(sheet => sheet.file !== resolve(root, 'src/styles/reset.css')));
  await checkStyleAssets(sheets, assets);
  return sheets;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sheets = await checkPackageStyles();
  console.log(`${sheets.length} package CSS sources, standalone tokens and assets checked`);
}
