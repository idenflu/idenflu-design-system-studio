import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const requirePackage = createRequire(resolve(root, 'packages/idenflu-mono-react/package.json'));
const ts = requirePackage('typescript');

test('development studio typecheck resolves the package source and detects invalid public props', () => {
  const configFile = resolve(root, 'systems/idenflu-mono/studio/tsconfig.dev.json');
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, resolve(root, 'systems/idenflu-mono/studio'));
  assert.deepEqual(parsed.errors, []);
  const fixture = resolve(root, 'systems/idenflu-mono/studio/__dev_typecheck_fixture__.tsx');
  const source = `import * as React from 'react';\nimport { Button } from '@idenflu/mono-react';\nconst valid = <Button size="sm" />;\nconst invalid = <Button size="not-a-size" />;\n`;
  const host = ts.createCompilerHost(parsed.options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, languageVersion, ...args) => file === fixture
    ? ts.createSourceFile(file, source, languageVersion, true, ts.ScriptKind.TSX)
    : original(file, languageVersion, ...args);
  const program = ts.createProgram([fixture], parsed.options, host);
  assert.ok(program.getSourceFile(resolve(root, 'packages/idenflu-mono-react/src/index.ts')), 'package import must resolve to source');
  const errors = ts.getPreEmitDiagnostics(program);
  assert.equal(errors.length, 1, ts.formatDiagnostics(errors, { getCanonicalFileName: x => x, getCurrentDirectory: () => root, getNewLine: () => '\n' }));
  assert.equal(errors[0].code, 2322);
  assert.equal(errors[0].file?.fileName, fixture);
});
