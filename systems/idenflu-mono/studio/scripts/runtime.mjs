import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const studioRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const repositoryRoot = resolve(studioRoot, '../../..');
export const packageRoot = resolve(repositoryRoot, 'packages/idenflu-mono-react');
export const packageModules = resolve(packageRoot, 'node_modules');

// Documentation tools reuse the repository's installed development dependencies.
// The library build and tests never load this documentation-owned module.
export const packageRequire = createRequire(resolve(packageRoot, 'package.json'));
export const requirePackage = packageRequire;
export const publicAliases = {
  '@idenflu/mono-react': resolve(packageRoot, 'dist/index.js'),
  '@idenflu/mono-react/icons': resolve(packageRoot, 'dist/icons/index.js'),
  '@idenflu/mono-react/package.json': resolve(packageRoot, 'package.json'),
};
export const publicTypePaths = {
  '@idenflu/mono-react': [resolve(packageRoot, 'dist/index.d.ts')],
  '@idenflu/mono-react/icons': [resolve(packageRoot, 'dist/icons/index.d.ts')],
  '@idenflu/mono-react/package.json': [resolve(packageRoot, 'package.json')],
  react: [resolve(packageModules, '@types/react')],
  'react/*': [resolve(packageModules, '@types/react/*')],
  'react-dom': [resolve(packageModules, '@types/react-dom')],
  'react-dom/*': [resolve(packageModules, '@types/react-dom/*')],
};
