import {readFile, writeFile} from 'node:fs/promises';
import {relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {packageRequire,packageRoot,publicTypePaths,repositoryRoot,studioRoot} from './runtime.mjs';

const ts=packageRequire('typescript');
export const apiMetadataPath = resolve(studioRoot, 'public-api.generated.json');
export const apiDocumentFiles = [
  'field-api-reference.tsx',
  'time-picker-demos.tsx',
  'datetime-api-reference.tsx',
  'data-grid-reference.tsx',
].map(file => resolve(studioRoot, file));

// ComponentProps includes the public ref as well as the exported Props interface.
// Generic aliases keep T visible in the grid reference instead of replacing it with unknown.
const contracts = {
  Select: 'ComponentProps<typeof Mono.Select>',
  SearchSelect: 'ComponentProps<typeof Mono.SearchSelect>',
  MultiSelect: 'ComponentProps<typeof Mono.MultiSelect>',
  SelectOption: 'Mono.SelectOption',
  NumberField: 'ComponentProps<typeof Mono.NumberField>',
  DatePicker: 'ComponentProps<typeof Mono.DatePicker>',
  DateRangePicker: 'ComponentProps<typeof Mono.DateRangePicker>',
  TimePicker: 'ComponentProps<typeof Mono.TimePicker>',
  DateTimePicker: 'ComponentProps<typeof Mono.DateTimePicker>',
  DateTimeRangePicker: 'ComponentProps<typeof Mono.DateTimeRangePicker>',
  'DataGrid<T>': 'Mono.DataGridProps<T>',
  'DataGridColumn<T>': 'Mono.DataGridColumn<T>',
  DataGridVirtualizationOptions: 'Mono.DataGridVirtualizationOptions',
  'DataGridFooterContext<T>': 'Mono.DataGridFooterContext<T>',
};

// The declaration bundler can reorder equivalent unions. Normalize the type AST
// so that harmless ordering differences do not hide a real source/declaration drift.
export function canonicalType(text) {
  const file = ts.createSourceFile('api-type.ts', `type API = ${text};`, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({removeComments: true});
  const transformed = ts.transform(file.statements[0].type, [context => root => {
    function visit(node) {
      if (ts.isUnionTypeNode(node)) {
        const types = node.types.map(type => ts.visitNode(type, visit));
        types.sort((left, right) => printer.printNode(ts.EmitHint.Unspecified, left, file).localeCompare(printer.printNode(ts.EmitHint.Unspecified, right, file), 'en'));
        return ts.factory.updateUnionTypeNode(node, types);
      }
      return ts.visitEachChild(node, visit, context);
    }
    return ts.visitNode(root, visit);
  }]);
  const result = printer.printNode(ts.EmitHint.Unspecified, transformed.transformed[0], file).replace(/\s*\n\s*/g, ' ');
  transformed.dispose();
  return result;
}

/** Extract the exported API, never the component's implementation parameter types. */
export function collectPublicAPI({entryPath = resolve(packageRoot, 'dist/index.d.ts'), definitions = contracts} = {}) {
  const probePath = resolve(studioRoot, 'dist/__api_docs_probe__.tsx');
  const names = Object.keys(definitions);
  const source = `import type { ComponentProps } from 'react';
import * as Mono from '@idenflu/mono-react';
${names.map((name, index) => `type Contract${index}${name.includes('<T>') ? '<T>' : ''} = ${definitions[name]};`).join('\n')}`;
  const options = {
    strict: true, noEmit: true, skipLibCheck: true,
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
    // Only types reached through the public imports belong to this probe.
    // Automatic @types discovery otherwise changes React aliases with the CWD.
    types: [], esModuleInterop: true, baseUrl: packageRoot,
    paths: {...publicTypePaths, '@idenflu/mono-react': [entryPath]},
  };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, languageVersion, ...args) => file === probePath
    ? ts.createSourceFile(file, source, languageVersion, true, ts.ScriptKind.TSX)
    : original(file, languageVersion, ...args);
  const program = ts.createProgram([probePath], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file, getCurrentDirectory: () => packageRoot, getNewLine: () => '\n',
  }));
  const checker = program.getTypeChecker();
  const probe = program.getSourceFile(probePath);
  const moduleImport = probe.statements.find(node => ts.isImportDeclaration(node) && node.moduleSpecifier.text === '@idenflu/mono-react');
  const moduleSymbol = checker.getSymbolAtLocation(moduleImport.moduleSpecifier);
  const exportedNames = new Set(checker.getExportsOfModule(moduleSymbol).map(symbol => symbol.name));
  const format = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
  const privateAliases = new Map();
  for (const file of program.getSourceFiles()) {
    if (file.fileName.includes('/node_modules/') || file === probe) continue;
    for (const declaration of file.statements) {
      if (!ts.isTypeAliasDeclaration(declaration) || exportedNames.has(declaration.name.text)) continue;
      const type = checker.getTypeFromTypeNode(declaration.type);
      privateAliases.set(declaration.name.text, checker.typeToString(type, probe, format | ts.TypeFormatFlags.InTypeAlias));
    }
  }
  function render(type) {
    let text = checker.typeToString(type, probe, format).replace(/\bMono\./g, '');
    // Bundlers rename private aliases (for example Size$1). Expand these so that
    // documentation exposes usable types rather than internal declaration names.
    for (let pass = 0; pass < privateAliases.size; pass++) {
      const previous = text;
      for (const [name, value] of privateAliases) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(`(?<![\\w.$])${escaped}(?![\\w$])`, 'g'), `(${value.replace(/\bMono\./g, '')})`);
      }
      if (text === previous) break;
    }
    return canonicalType(text);
  }
  const aliases = probe.statements.filter(ts.isTypeAliasDeclaration);
  return {
    schemaVersion: 1,
    source: '@idenflu/mono-react public declarations',
    contracts: Object.fromEntries(aliases.map((alias, index) => [names[index], Object.fromEntries(
      checker.getPropertiesOfType(checker.getTypeAtLocation(alias))
        .filter(symbol => symbol.name !== 'key')
        .sort((left, right) => left.name.localeCompare(right.name, 'en'))
        .map(symbol => [symbol.name, {
          type: render(checker.getTypeOfSymbolAtLocation(symbol, alias)),
          optional: Boolean(symbol.flags & ts.SymbolFlags.Optional),
        }]),
    )])),
  };
}

const serialize = metadata => `${JSON.stringify(metadata, null, 2)}\n`;

function firstMetadataDifference(expected, actual, path = 'metadata') {
  if (Object.is(expected, actual)) return null;
  if (expected && actual && typeof expected === 'object' && typeof actual === 'object') {
    const expectedKeys = Object.keys(expected), actualKeys = Object.keys(actual);
    for (const key of new Set([...expectedKeys, ...actualKeys])) {
      const difference = firstMetadataDifference(expected[key], actual[key], `${path}.${key}`);
      if (difference) return difference;
    }
    if (expectedKeys.join('\0') !== actualKeys.join('\0')) return `${path}: property order differs`;
    return null;
  }
  return `${path}: expected ${JSON.stringify(expected) ?? 'undefined'}; actual ${JSON.stringify(actual) ?? 'undefined'}`;
}

export function assertMetadataCurrent(expected, actual) {
  if (serialize(expected) !== serialize(actual)) {
    throw new Error(`Public API table metadata is stale. Build the React declarations, then run npm run docs:api and review the diff.\nFirst difference at ${firstMetadataDifference(expected, actual)}.`);
  }
}

export function assertDeclarationsCurrent(source, declarations) {
  if (serialize(source) !== serialize(declarations)) {
    throw new Error('Public declarations do not match the source exports. Build the React package before checking or generating API documentation.');
  }
}

export function validateAPICoverage(metadata, documented) {
  const missing = [];
  for (const [contract, properties] of Object.entries(metadata.contracts)) {
    for (const property of Object.keys(properties)) {
      if (!documented.get(contract)?.has(property)) missing.push(`${contract}.${property}`);
    }
  }
  if (missing.length) throw new Error(`Public API properties missing from the reference tables: ${missing.join(', ')}`);
}

function unwrap(node) {
  while (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
}

/** Validate the actual table rows consumed by Studio, including shared/spread rows. */
export function validateAPIDocument(source, metadata, fileName = 'api-reference.tsx') {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const variables = new Map();
  function visitVariables(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) variables.set(node.name.text, node.initializer);
    ts.forEachChild(node, visitVariables);
  }
  visitVariables(file);
  const fail = (node, message) => {
    const {line} = file.getLineAndCharacterOfPosition(node.getStart(file));
    throw new Error(`${fileName}:${line + 1}: ${message}`);
  };
  function array(node, resolving = new Set()) {
    node = unwrap(node);
    if (ts.isIdentifier(node)) {
      if (resolving.has(node.text) || !variables.has(node.text)) fail(node, `Cannot resolve API table rows: ${node.text}`);
      return array(variables.get(node.text), new Set([...resolving, node.text]));
    }
    if (!ts.isArrayLiteralExpression(node)) fail(node, 'API table rows must be a literal array or a local const array.');
    return node.elements.flatMap(element => ts.isSpreadElement(element) ? array(element.expression, resolving) : [element]);
  }
  let tables = 0;
  let properties = 0;
  const documented = new Map();
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
      const contract = attrs.find(attr => attr.name.getText(file) === 'contracts');
      if (contract) {
        const initializer = contract.initializer;
        const expression = ts.isJsxExpression(initializer) ? initializer.expression : initializer;
        const contractNames = ts.isStringLiteral(expression) ? [expression.text] : array(expression).map(item => {
          if (!ts.isStringLiteral(item)) fail(item, 'API contracts must use literal names.');
          return item.text;
        });
        for (const name of contractNames) if (!metadata.contracts[name]) fail(contract, `Unknown public API contract: ${name}`);
        const rows = attrs.find(attr => attr.name.getText(file) === 'rows');
        if (!rows?.initializer || !ts.isJsxExpression(rows.initializer)) fail(node, 'API tables must pass explicit rows.');
        for (const row of array(rows.initializer.expression)) {
          const cells = array(row);
          if (cells.length !== 3 || !ts.isStringLiteral(cells[0])) fail(row, 'API property rows must contain [name, default, description]; types come from public declarations.');
          for (const property of cells[0].text.split('/').map(name => name.trim())) {
            const matching = contractNames.filter(name => Object.hasOwn(metadata.contracts[name], property));
            if (!matching.length) fail(cells[0], `Unknown property ${property} in ${contractNames.join(' / ')}.`);
            for (const name of matching) {
              if (!documented.has(name)) documented.set(name, new Set());
              documented.get(name).add(property);
            }
            properties++;
          }
        }
        tables++;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return {tables, properties, documented};
}

export async function checkAPIDocuments({write = false} = {}) {
  const metadata = collectPublicAPI();
  assertDeclarationsCurrent(collectPublicAPI({entryPath: resolve(packageRoot, 'src/index.ts')}), metadata);
  if (!write) assertMetadataCurrent(metadata, JSON.parse(await readFile(apiMetadataPath, 'utf8')));
  let tables = 0;
  let properties = 0;
  const documented = new Map();
  for (const file of apiDocumentFiles) {
    const result = validateAPIDocument(await readFile(file, 'utf8'), metadata, relative(repositoryRoot, file));
    if (!result.tables) throw new Error(`${file} has no public API tables.`);
    tables += result.tables;
    properties += result.properties;
    for (const [name, properties] of result.documented) {
      if (!documented.has(name)) documented.set(name, new Set());
      for (const property of properties) documented.get(name).add(property);
    }
  }
  validateAPICoverage(metadata, documented);
  if (write) await writeFile(apiMetadataPath, serialize(metadata));
  return {tables, properties};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkAPIDocuments({write: process.argv.includes('--write')});
    console.log(`Public API documentation: ${result.tables} tables, ${result.properties} property references checked. Defaults and descriptions remain editorial content.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
