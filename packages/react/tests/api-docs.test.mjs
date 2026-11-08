import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm, readFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  apiMetadataPath, assertDeclarationsCurrent, assertMetadataCurrent,
  canonicalType, checkAPIDocuments, collectPublicAPI,
  validateAPICoverage, validateAPIDocument,
} from '../scripts/check-api-docs.mjs';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('Studio API tables cover the selected public contracts and use current declaration types', async () => {
  const result = await checkAPIDocuments();
  assert.ok(result.tables > 0);
  assert.ok(result.properties > 0);
  const {contracts} = JSON.parse(await readFile(apiMetadataPath, 'utf8'));
  assert.match(contracts.PageHeader.ref.type, /HTMLElement/);
  assert.match(contracts.PageHeader.headingLevel.type, /1/);
  assert.equal(contracts.PageHeader.title.optional, false);
  assert.equal(contracts.PageHeader.actions.optional, true);
  assert.equal(contracts.Select.label.type, 'string');
  assert.match(contracts.SearchSelect.ref.type, /HTMLInputElement/);
  assert.match(contracts.NumberField.ref.type, /HTMLInputElement/);
  assert.match(contracts.DateRangePicker.endInputRef.type, /HTMLInputElement/);
  assert.match(contracts.TimePicker['aria-invalid'].type, /"grammar"/);
  assert.match(contracts.DateTimeRangePicker.endInputRef.type, /HTMLInputElement/);
  assert.match(contracts['DataGrid<T>'].rows.type, /readonly T\[\]/);
  assert.doesNotMatch(JSON.stringify(contracts), /Size\$|import\("\/|__api_docs_probe__/);
});

test('an exported type or optionality change fails the metadata check and stale declarations are rejected', async () => {
  const temporary = await mkdtemp(join(packageRoot, 'dist/api-docs-test-'));
  try {
    const entryPath = join(temporary, 'index.d.ts');
    const definitions = {Widget: 'Mono.WidgetProps'};
    await writeFile(entryPath, 'export interface WidgetProps { value?: string; }');
    const original = collectPublicAPI({entryPath, definitions});
    assert.equal(original.contracts.Widget.value.type, 'string | undefined');
    assert.equal(original.contracts.Widget.value.optional, true);

    await writeFile(entryPath, 'export interface WidgetProps { value?: readonly string[]; }');
    const changedType = collectPublicAPI({entryPath, definitions});
    assert.match(changedType.contracts.Widget.value.type, /readonly string\[\]/);
    assert.throws(() => assertMetadataCurrent(original, changedType), /metadata is stale/);
    assert.throws(() => assertDeclarationsCurrent(changedType, original), /do not match the source exports/);

    await writeFile(entryPath, 'export interface WidgetProps { value: string; }');
    const changedOptionality = collectPublicAPI({entryPath, definitions});
    assert.equal(changedOptionality.contracts.Widget.value.optional, false);
    assert.throws(() => assertMetadataCurrent(original, changedOptionality), /metadata is stale/);
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test('table validation follows shared arrays and rejects a misspelled documented property', () => {
  const metadata = {contracts: {Widget: {
    label: {type: 'string', optional: false},
    value: {type: 'string | undefined', optional: true},
  }}};
  const source = `const common = [['label', '필수', '입력 이름']];
const rows = [...common, ['value', 'undefined', '입력 값']] as const;
export const reference = <ReferenceTable contracts="Widget" rows={rows} />;`;
  const result = validateAPIDocument(source, metadata);
  assert.equal(result.tables, 1);
  assert.equal(result.properties, 2);
  validateAPICoverage(metadata, result.documented);
  assert.throws(() => validateAPIDocument(source.replace("['value',", "['vaule',"), metadata), /Unknown property vaule/);
  assert.throws(() => validateAPIDocument(source.replace('contracts="Widget"', 'contracts="Missing"'), metadata), /Unknown public API contract/);
});

test('removing a documented row or adding an undocumented public property fails coverage', () => {
  const metadata = {contracts: {Widget: {
    label: {type: 'string', optional: false},
    value: {type: 'string | undefined', optional: true},
  }}};
  const result = validateAPIDocument('<ReferenceTable contracts="Widget" rows={[["label", "필수", "입력 이름"]]} />', metadata);
  assert.throws(() => validateAPICoverage(metadata, result.documented), /Widget\.value/);
  const documented = new Map([['Widget', new Set(['label', 'value'])]]);
  validateAPICoverage(metadata, documented);
  metadata.contracts.Widget.newOption = {type: 'boolean | undefined', optional: true};
  assert.throws(() => validateAPICoverage(metadata, documented), /Widget\.newOption/);
});

test('property tables cannot reintroduce handwritten types and editorial defaults are not treated as verified types', () => {
  const metadata = {contracts: {Widget: {value: {type: 'string', optional: false}}}};
  assert.throws(() => validateAPIDocument('<ReferenceTable contracts="Widget" rows={[["value", "string", "", "값"]]} />', metadata), /types come from public declarations/);
  const first = validateAPIDocument('<ReferenceTable contracts="Widget" rows={[["value", "서술 기본값", "설명"]]} />', metadata);
  const second = validateAPIDocument('<ReferenceTable contracts="Widget" rows={[["value", "다른 서술", "수정한 설명"]]} />', metadata);
  assert.deepEqual(first.documented, second.documented);
});

test('union normalization ignores order but preserves nullability and nested function types', () => {
  assert.equal(canonicalType('"absolute" | "fixed" | undefined'), canonicalType('undefined | "fixed" | "absolute"'));
  assert.equal(canonicalType('((value: string | null) => void) | undefined'), canonicalType('undefined | ((value: null | string) => void)'));
  assert.notEqual(canonicalType('string | null'), canonicalType('string | undefined'));
});
