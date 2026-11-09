import { readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Check that the package version has one release heading with a real list item. */
export function checkReleaseChangelog(version, changelog) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('패키지 버전이 올바르지 않습니다.');
  }
  // Comments and fenced examples cannot supply a release heading or entry.
  const uncommented = changelog.replace(/<!--[\s\S]*?-->/g, comment => comment.replace(/[^\r\n]/g, ''));
  const headings = [];
  let fence = null;
  for (const line of uncommented.split(/\r?\n/)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (marker) {
      const markerText = marker[1];
      if (!fence) fence = { char: markerText[0], length: markerText.length };
      else if (markerText[0] === fence.char && markerText.length >= fence.length && /^ {0,3}(?:`+|~+)\s*$/.test(line)) fence = null;
      continue;
    }
    if (fence) continue;
    const heading = line.match(/^ {0,3}##[ \t]+(?:\[([^\]]+)\]|([^\s]+))(?=\s|$)/);
    if (heading) {
      headings.push({ version: heading[1] ?? heading[2], entries: [] });
      continue;
    }
    const item = line.match(/^ {0,3}[-*+][ \t]+(.+)$/);
    if (item && headings.length && /[\p{L}\p{N}]/u.test(item[1].replace(/^\[[ xX]\]\s*/, ''))) {
      headings.at(-1).entries.push(item[1]);
    }
  }
  const releases = headings.filter(heading => heading.version === version);
  if (releases.length !== 1) throw new Error(`CHANGELOG.md에 ${version} 버전 제목이 ${releases.length === 0 ? '없습니다' : '중복되어 있습니다'}.`);
  if (!releases[0].entries.length) throw new Error(`CHANGELOG.md의 ${version} 버전 항목이 비어 있습니다.`);
}

async function main() {
  const pkg = JSON.parse(await readFile(resolve(root, 'packages/idenflu-mono-react/package.json'), 'utf8'));
  const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8');
  checkReleaseChangelog(pkg.version, changelog);
  console.log(`CHANGELOG.md의 ${pkg.version} 버전 항목을 확인했습니다.`);
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
