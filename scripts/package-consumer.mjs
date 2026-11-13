import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = join(root, 'packages/idenflu-mono-react');
const packageRequire = createRequire(join(packageRoot, 'package.json'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export async function verifyInstalledPackage({ reactVersion, build = false } = {}) {
  const metadata = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  const version = reactVersion ?? metadata.devDependencies.react;
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('React 버전은 18.3.1처럼 지정하세요.');
  const temporary = await realpath(await mkdtemp(join(tmpdir(), 'mono-react-package-')));
  const consumer = join(temporary, 'consumer');
  await mkdir(consumer);
  const env = { ...process.env, NODE_ENV: 'development', npm_config_cache: join(temporary, '.npm-cache'), npm_config_registry: 'https://registry.npmjs.org' };
  // Do not let an inherited NODE_PATH resolve the workspace's React or runtime dependencies.
  delete env.NODE_PATH;
  const run = (command, args, { cwd = consumer, capture = false } = {}) => {
    const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 300_000 });
    if (!capture && result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${command} 검증 실패 (${result.status})`);
    return result.stdout;
  };
  try {
    if (build) run(process.execPath, [join(packageRoot, 'scripts/build.mjs')], { cwd: packageRoot });
    const [packed] = JSON.parse(run(npm, ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], { cwd: packageRoot, capture: true }));
    assert.ok(packed.files.some(file => file.path === 'dist/styles.css'), 'tarball includes the public stylesheet');
    assert.ok(packed.files.every(file => !/^(?:src|studio|node_modules)\//.test(file.path)), 'tarball excludes implementation and Studio sources');
    const typeMajor = version.split('.')[0];
    await writeFile(join(consumer, 'package.json'), JSON.stringify({
      private: true,
      type: 'module',
      dependencies: { '@idenflu/mono-react': `file:${join(temporary, packed.filename)}`, react: version, 'react-dom': version },
      devDependencies: { '@types/react': `^${typeMajor}.0.0`, '@types/react-dom': `^${typeMajor}.0.0` },
    }, null, 2));
    // npm installs the actual release tarball and all runtime dependencies. Nothing
    // is copied into node_modules or resolved through a workspace alias.
    run(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false']);
    run(npm, ['ls', '--all']);
    const installed = join(consumer, 'node_modules/@idenflu/mono-react');
    assert.equal((await lstat(installed)).isSymbolicLink(), false, 'package installation is not a workspace symlink');
    assert.equal(await realpath(installed), installed);

    const fixture = join(consumer, 'package-consumer.fixture.cjs');
    await cp(join(packageRoot, 'tests/package-consumer.fixture.cjs'), fixture);
    for (const format of ['esm', 'cjs']) run(process.execPath, [fixture, `--format=${format}`]);
    await verifyConsumerTypes(consumer, run);
    await verifyConsumerBundle(consumer);

    const hydrationFixture = join(consumer, 'ssr-hydration.fixture.cjs');
    await cp(join(packageRoot, 'tests/ssr-hydration.fixture.cjs'), hydrationFixture);
    for (const format of ['esm', 'cjs']) {
      const shared = [`--format=${format}`, `--markup=${join(consumer, `${format}-ssr.html`)}`, `--jsdom-from=${join(packageRoot, 'package.json')}`];
      // Server and hydration run in independent processes so browser feature
      // detection and useLayoutEffect decisions cannot leak between modes.
      run(process.execPath, [hydrationFixture, '--mode=ssr', ...shared]);
      run(process.execPath, [hydrationFixture, '--mode=hydrate', ...shared]);
    }
    console.log(`React ${version}: 실제 tarball 설치, ESM/CJS, 타입, CSS·자산 번들, SSR/hydration 통과`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

async function verifyConsumerTypes(consumer, run) {
  const source = `import * as React from 'react';
import { Select, Grid, GridItem, Dialog, type SelectProps, type GridProps } from '@idenflu/mono-react';
import { SearchIcon, type SvgIconProps } from '@idenflu/mono-react/icons';
import '@idenflu/mono-react/styles.css';
import '@idenflu/mono-react/tokens.css';
import '@idenflu/mono-react/reset.css';
const options: SelectProps['options'] = [{value: 'design', label: '디자인'}];
const select: React.ComponentProps<typeof Select> = { label: '담당 팀', options, ref: React.createRef<HTMLButtonElement>() };
const grid: GridProps = { columns: {base: 1, sm: 2, lg: 3}, gap: 4 };
const icon: SvgIconProps = {size: 20, label: '검색'};
React.createElement(Select, select);
React.createElement(Grid, grid, React.createElement(GridItem, {colSpan: 'full'}));
React.createElement(SearchIcon, icon);
React.createElement(Dialog, {open: false, modal: false, onOpenChange: () => {}});
// @ts-expect-error Select forwards its button, not an input element.
const invalid: React.ComponentProps<typeof Select> = {label: '오류', options: [], ref: React.createRef<HTMLInputElement>()};
// @ts-expect-error Grid accepts only named breakpoints.
const invalidGrid: GridProps = {columns: {tablet: 2}};
`;
  // NodeNext selects the ESM declarations for .mts and CJS declarations for .cts.
  for (const extension of ['mts', 'cts']) await writeFile(join(consumer, `consumer.${extension}`), source);
  const tsc = packageRequire.resolve('typescript/lib/tsc.js');
  run(process.execPath, [tsc, '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2020', '--lib', 'ES2020,DOM,DOM.Iterable', '--types', 'react,react-dom', 'consumer.mts', 'consumer.cts']);
}

async function verifyConsumerBundle(consumer) {
  const { build } = packageRequire('esbuild');
  await writeFile(join(consumer, 'app.tsx'), `import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {Button, Select, Grid} from '@idenflu/mono-react';
import {SearchIcon} from '@idenflu/mono-react/icons';
import '@idenflu/mono-react/styles.css';
import '@idenflu/mono-react/tokens.css';
import '@idenflu/mono-react/reset.css';
createRoot(document.getElementById('root')!).render(<Grid columns={{base:1,sm:2}}><Button><SearchIcon />검색</Button><Select label="팀" options={[{value:'design',label:'디자인'}]} /></Grid>);
`);
  const result = await build({ absWorkingDir: consumer, entryPoints: ['app.tsx'], bundle: true, format: 'esm', platform: 'browser', outdir: join(consumer, 'out'), metafile: true, loader: { '.woff2': 'file' }, assetNames: 'assets/[name]-[hash]', logLevel: 'silent' });
  const inputs = Object.keys(result.metafile.inputs);
  assert.ok(inputs.some(file => file.endsWith('@idenflu/mono-react/dist/styles.css')));
  assert.ok(inputs.some(file => file.endsWith('@idenflu/mono-react/dist/tokens.css')));
  assert.ok(inputs.some(file => file.endsWith('@idenflu/mono-react/dist/reset.css')));
  assert.ok(inputs.some(file => file.endsWith('.woff2')), 'published fonts resolve in a real CSS bundle');
  const stylesCss = inputs.find(file => file.endsWith('@idenflu/mono-react/dist/styles.css'));
  assert.ok((await readFile(resolve(consumer, stylesCss), 'utf8')).includes('data:image/svg+xml'), 'published CSS icons stay inlined as data URIs in a real CSS bundle');
  for (const file of inputs) {
    const path = relative(consumer, resolve(consumer, file));
    assert.ok(!path.startsWith('..') && !isAbsolute(path), `bundle input stays in the installed consumer: ${file}`);
  }
  console.log('독립 소비자: ESM/CJS 타입과 브라우저 JS/CSS·폰트·인라인 아이콘 번들 통과');
}
