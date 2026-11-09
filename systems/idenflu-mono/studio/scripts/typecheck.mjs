import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { packageRequire, studioRoot } from './runtime.mjs';

execFileSync(process.execPath, [
  packageRequire.resolve('typescript/bin/tsc'),
  '-p', resolve(studioRoot, 'tsconfig.json'), '--noEmit',
], { stdio: 'inherit' });
