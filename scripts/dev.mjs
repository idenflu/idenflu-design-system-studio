import { watch } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { buildStudio } from '../packages/react/scripts/build-studio.mjs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.css', '.json', '.html', '.svg', '.woff2']);

export function watchStudio({ root = project, rebuild, onError = console.error, onWatchError = onError, debounce = 150, watchFactory = watch }) {
  let timer, running, dirty = false, closed = false;
  const watchers = [];
  function flush() {
    if (closed || !dirty) return running || Promise.resolve();
    if (running) return running;
    running = (async () => {
      while (dirty && !closed) {
        clearTimeout(timer);
        timer = undefined;
        dirty = false;
        await rebuild();
      }
    })().finally(() => {
      running = undefined;
      if (dirty && !closed) schedule();
    });
    return running;
  }
  function schedule() {
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(() => { timer = undefined; flush().catch(onError); }, debounce);
  }
  function close() { closed = true; clearTimeout(timer); for (const watcher of watchers) watcher.close(); }
  const inputs = [
    ['packages/react/src', true],
    ['packages/react/studio', true],
    ['packages/react/scripts', true],
    ['systems/idenflu-mono', true],
    ['packages/react', false, new Set(['package.json', 'package-lock.json'])],
    ['scripts', false, new Set(['styles.mjs'])],
  ];
  try {
    for (const [path, recursive, allowed] of inputs) {
      const watcher = watchFactory(resolve(root, path), { recursive }, (_, filename) => {
        if (!filename) return;
        const name = filename.toString().replaceAll('\\', '/');
        if (allowed && !allowed.has(name)) return;
        if (name.split('/').some(part => ['dist', 'docs-dist', 'node_modules'].includes(part))) return;
        if (!extensions.has(extname(name)) || /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(name)) return;
        schedule();
      });
      watcher.on('error', error => { if (closed) return; close(); onWatchError(error); });
      watchers.push(watcher);
    }
  } catch (error) {
    close();
    throw error;
  }
  return {
    build() { dirty = true; return flush(); },
    close,
  };
}

async function dev() {
  const reactRoot = resolve(project, 'packages/react');
  const report = error => console.error('[dev] 문서 빌드 실패\n' + (error.stderr || error.stack || error));
  let watcher, server, watchFailed = false;
  const failWatch = error => {
    watchFailed = true;
    console.error('[dev] 파일 감시 실패\n' + (error.stack || error));
    watcher?.close();
    server?.kill('SIGTERM');
  };
  try {
    watcher = watchStudio({
      onError: report,
      onWatchError: failWatch,
      async rebuild() {
        console.log('[dev] 최신 모노 문서 빌드 중...');
        await execFileAsync(process.execPath, [resolve(reactRoot, 'scripts/build.mjs')], { cwd: reactRoot });
        await buildStudio();
        if (!watchFailed) console.log('[dev] 모노 문서 갱신 완료. 브라우저를 새로고침하세요.');
      },
    });
  } catch (error) { failWatch(error); process.exitCode = 1; return; }
  try { await watcher.build(); }
  catch (error) { watcher.close(); report(error); process.exitCode = 1; return; }
  if (watchFailed) { process.exitCode = 1; return; }
  server = spawn(process.execPath, [resolve(project, 'scripts/serve.mjs')], { cwd: project, stdio: 'inherit' });
  let stopping = false;
  const stop = () => { stopping = true; watcher.close(); server.kill('SIGTERM'); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  server.once('error', error => { watcher.close(); console.error(error); process.exitCode = 1; });
  server.once('exit', code => {
    watcher.close();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    process.exitCode = watchFailed ? 1 : stopping ? 0 : code ?? 1;
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await dev();
