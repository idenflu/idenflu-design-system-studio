import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const version=process.argv.find(value=>value.startsWith('--react='))?.slice('--react='.length);
if(!version || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('사용법: node scripts/test-react-compat.mjs --react=18.3.1');
const packageRoot=join(root,'packages/react');
const consumer=await mkdtemp(join(tmpdir(),'mono-react-compat-'));
const copiedDependencies=new Set(['react','react-dom']);
async function copyRuntimeDependencies(folder) {
  const metadata=JSON.parse(await readFile(join(folder,'package.json'),'utf8'));
  const requireFromPackage=createRequire(join(folder,'package.json'));
  for(const name of Object.keys(metadata.dependencies??{})) {
    if(copiedDependencies.has(name)) continue;
    copiedDependencies.add(name);
    const source=dirname(requireFromPackage.resolve(`${name}/package.json`));
    const destination=join(consumer,'node_modules',name);
    await mkdir(dirname(destination),{recursive:true});
    await cp(source,destination,{recursive:true,filter:path=>!path.slice(source.length).split(/[\\/]/).includes('node_modules')});
    await copyRuntimeDependencies(source);
  }
}
function run(command,args) {
  const result=spawnSync(command,args,{cwd:consumer,encoding:'utf8',env:{...process.env,NODE_ENV:'development',npm_config_cache:join(consumer,'.npm-cache')},maxBuffer:10*1024*1024});
  if(result.stdout) process.stdout.write(result.stdout);
  if(result.stderr) process.stderr.write(result.stderr);
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error(`${command} 검증 실패 (${result.status})`);
}
try {
  await writeFile(join(consumer,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{react:version,'react-dom':version}},null,2));
  run(process.platform==='win32'?'npm.cmd':'npm',['install','--ignore-scripts','--no-audit','--no-fund','--package-lock=false']);
  const installed=join(consumer,'node_modules/@idenflu/mono-react');
  await mkdir(installed,{recursive:true});
  await cp(join(packageRoot,'dist'),join(installed,'dist'),{recursive:true});
  await writeFile(join(installed,'package.json'),await readFile(join(packageRoot,'package.json')));
  // Reuse the locked runtime dependencies while resolving React from this
  // consumer, so the workspace's own React installation is never replaced.
  await copyRuntimeDependencies(packageRoot);
  const fixture=join(consumer,'ssr-hydration.fixture.cjs');
  await cp(join(packageRoot,'tests/ssr-hydration.fixture.cjs'),fixture);
  for(const format of ['esm','cjs']) {
    const markup=join(consumer,`${format}-ssr.html`);
    const shared=[`--format=${format}`,`--markup=${markup}`,`--jsdom-from=${join(packageRoot,'package.json')}`];
    // Loading the package in separate processes keeps its canUseDOM/layout-effect
    // decision independent between server rendering and client hydration.
    run(process.execPath,[fixture,'--mode=ssr',...shared]);
    run(process.execPath,[fixture,'--mode=hydrate',...shared]);
  }
  console.log(`React ${version}: ESM/CJS SSR → hydration, refs, ARIA, FormData, reset 통과`);
} finally {
  await rm(consumer,{recursive:true,force:true});
}
