import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, realpath, rm, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(repository, 'packages/idenflu-mono-react');
const temporary = await realpath(await mkdtemp(join(tmpdir(), 'mono-package-isolation-')));
const isolated = join(temporary, 'packages/idenflu-mono-react');
const ignored = new Set(['node_modules', 'dist', 'test-results']);

try {
  await mkdir(dirname(isolated), { recursive: true });
  await cp(source, isolated, {
    recursive: true,
    filter: path => !relative(source, path).split(/[\\/]/).some(part => ignored.has(part)),
  });
  // The repository-wide license is shared by all packages, not owned by Studio.
  await cp(join(repository, 'LICENSE'), join(temporary, 'LICENSE'));
  // Reuse installed development tools only; all source and tests run from the copy.
  // Package installation itself is verified separately through a real tarball.
  await symlink(join(source, 'node_modules'), join(isolated, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(existsSync(join(temporary, 'systems')), false);
  assert.equal(existsSync(join(temporary, 'docs')), false);
  const environment = { ...process.env, npm_config_cache: join(temporary, '.npm-cache') };
  delete environment.NODE_PATH;
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['test'], {
    cwd: isolated,
    stdio: 'inherit',
    timeout: 180_000,
    env: environment,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, 'the library builds and passes its own tests without Studio or documentation sources');
  assert.equal(existsSync(join(isolated, 'dist/styles.css')), true);
  console.log('문서·예제 없는 임시 소스 디렉터리: 패키지 빌드·단위 검사 통과');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
