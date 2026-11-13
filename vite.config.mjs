import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { componentStyles } from './packages/idenflu-mono-react/scripts/styles.mjs';
import { documentStyles } from './systems/idenflu-mono/studio/scripts/styles.mjs';
import { createCompleteExamples } from './systems/idenflu-mono/studio/scripts/complete-examples.mjs';
import { packageRequire } from './systems/idenflu-mono/studio/scripts/runtime.mjs';

const root = process.cwd();
const pkg = resolve(root, 'packages/idenflu-mono-react');
const studio = resolve(root, 'systems/idenflu-mono/studio');
const generated = resolve(studio, 'dist');
const { JSDOM } = packageRequire('jsdom');

async function writeChanged(name, value) {
  const file = resolve(generated, name);
  const content = JSON.stringify(value, null, 2);
  if (await readFile(file, 'utf8').catch(() => '') !== content) await writeFile(file, content);
}
async function updateMetadata() {
  await mkdir(generated, { recursive: true });
  const routes = JSON.parse(await readFile(resolve(studio, 'routes.json'), 'utf8'));
  if (routes[0]?.route !== 'overview' || new Set(routes.map(item => item.route)).size !== routes.length) throw new Error('문서 경로 목록을 확인해주세요.');
  const dom = new JSDOM(await readFile(resolve(pkg, 'assets/icons/icons.svg'), 'utf8'), { contentType: 'image/svg+xml' });
  const icons = [...dom.window.document.documentElement.children].map(symbol => symbol.getAttribute('id')).sort();
  dom.window.close();
  await Promise.all([
    writeChanged('routes.json', routes), writeChanged('navigation.json', routes.map(item => item.route)),
    writeChanged('sprite-icons.json', icons), writeChanged('complete-examples.json', await createCompleteExamples()),
  ]);
}

function studioDevelopment() {
  let timer, running = Promise.resolve();
  return {
    name: 'studio-development',
    apply: 'serve',
    async buildStart() { await updateMetadata(); },
    configureServer(server) {
      const assetPrefix = '/systems/idenflu-mono/assets/';
      server.middlewares.use((req, _res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname.startsWith(assetPrefix)) {
          const name = decodeURIComponent(url.pathname.slice(assetPrefix.length));
          for (const dir of [resolve(pkg, 'assets'), resolve(studio, 'assets')]) {
            const file = resolve(dir, name);
            if (file.startsWith(dir + sep) && existsSync(file)) {
              req.url = '/' + file.slice(root.length + 1).split(sep).join('/') + url.search;
              break;
            }
          }
        }
        next();
      });
      const schedule = file => {
        if (!(file === resolve(studio, 'routes.json') || file === resolve(pkg, 'assets/icons/icons.svg') || (file.startsWith(studio + sep) && /\.[jt]sx?$/.test(file) && !/\.(spec|test)\./.test(file)))) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          running = running.catch(() => {}).then(updateMetadata).catch(error => server.config.logger.error(`[dev] 문서 데이터 갱신 실패: ${error.stack || error}`));
        }, 250);
      };
      server.watcher.on('change', schedule).on('add', schedule).on('unlink', schedule);
      server.httpServer?.once('close', () => clearTimeout(timer));
    },
    transformIndexHtml(html, context) {
      if (!context.path.startsWith('/systems/idenflu-mono/')) return html;
      return html.replace('    <link rel="stylesheet" href="./docs-dist/components.css" />\n    <link rel="stylesheet" href="./docs-dist/docs.css" />', '')
        .replace('./docs-dist/app.js', '/@id/virtual:studio-entry');
    },
    resolveId(id) { if (id === 'virtual:studio-entry') return '\0virtual:studio-entry'; },
    load(id) {
      if (id !== '\0virtual:studio-entry') return;
      const styles = [resolve(pkg, 'src/styles/reset.css'), ...componentStyles.map(name => resolve(pkg, name)), ...documentStyles.map(name => resolve(studio, 'styles', name)), resolve(studio, 'styles/studio.css')];
      return [...styles.map(file => `import ${JSON.stringify(file)};`), `import ${JSON.stringify(resolve(studio, 'app.tsx'))};`].join('\n');
    },
    transform(code, id) {
      if (id === resolve(pkg, 'src/styles/fonts.css')) return code.replaceAll('./assets/fonts/', '/packages/idenflu-mono-react/assets/fonts/');
    },
  };
}

function typecheckDevelopment() {
  const children = new Set();
  let stopping = false;
  return {
    name: 'development-typecheck',
    apply: 'serve',
    configureServer(server) {
      const http = server.httpServer;
      if (!http) return;
      http.once('listening', () => {
        const tsc = packageRequire.resolve('typescript/bin/tsc');
        for (const [name, config] of [
          ['패키지', resolve(pkg, 'tsconfig.json')],
          ['스튜디오', resolve(studio, 'tsconfig.dev.json')],
        ]) {
          const child = spawn(process.execPath, [tsc, '-p', config, '--noEmit', '--watch', '--preserveWatchOutput', '--pretty', 'false'], { stdio: ['ignore', 'pipe', 'pipe'] });
          children.add(child);
          for (const stream of [child.stdout, child.stderr]) {
            createInterface({ input: stream }).on('line', line => { if (line) console.log(`[타입 검사:${name}] ${line}`); });
          }
          child.on('error', error => server.config.logger.error(`[타입 검사:${name}] 실행 실패: ${error.message}`));
          child.on('exit', (code, signal) => {
            children.delete(child);
            if (!stopping) server.config.logger.error(`[타입 검사:${name}] 감시가 종료되었습니다 (${signal || code}). 개발 서버를 다시 시작하세요.`);
          });
        }
      });
      http.once('close', () => {
        stopping = true;
        for (const child of children) child.kill();
      });
    },
  };
}

export default defineConfig({
  plugins: [studioDevelopment(), typecheckDevelopment(), react()],
  resolve: {
    alias: [
      { find: '@idenflu/mono-react/icons', replacement: resolve(pkg, 'src/icons/index.ts') },
      { find: '@idenflu/mono-react/package.json', replacement: resolve(pkg, 'package.json') },
      { find: '@idenflu/mono-react', replacement: resolve(pkg, 'src/index.ts') },
      { find: /^react$/, replacement: resolve(pkg, 'node_modules/react/index.js') },
      { find: /^react\/(.*)$/, replacement: resolve(pkg, 'node_modules/react/$1') },
      { find: /^react-dom$/, replacement: resolve(pkg, 'node_modules/react-dom/index.js') },
      { find: /^react-dom\/(.*)$/, replacement: resolve(pkg, 'node_modules/react-dom/$1') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: { host: '127.0.0.1', port: Number(process.env.PORT || 4173), strictPort: true },
});
