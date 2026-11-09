import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {requirePackage} from '../scripts/runtime.mjs';
const ts=requirePackage('typescript');

const source = await readFile(new URL('../document-routes.ts', import.meta.url), 'utf8');
const {outputText} = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2020, module:ts.ModuleKind.ESNext}});
const {documentHref, parseDocumentHash, groupDocumentSections} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('document links round-trip the route and encoded section without losing either', () => {
  for (const section of ['data-grid-props-title', '한글 제목 / A&B?']) {
    const href = documentHref('components/data-grid', section);
    assert.deepEqual(parseDocumentHash(href), {path:'components/data-grid', section});
    assert.ok(href.startsWith('#/components/data-grid?section='));
  }
});

test('empty routes, trailing slashes and unknown addresses retain usable route data', () => {
  assert.deepEqual(parseDocumentHash(''), {path:'overview'});
  assert.deepEqual(parseDocumentHash('#/'), {path:'overview'});
  assert.deepEqual(parseDocumentHash('#components/text-fields///?section=examples'), {path:'components/text-fields', section:'examples'});
  assert.deepEqual(parseDocumentHash('#/no-such-document?section=unknown'), {path:'no-such-document', section:'unknown'});
  assert.deepEqual(parseDocumentHash('#/components/data-grid?section='), {path:'components/data-grid'});
  assert.equal(documentHref('overview'), '#/overview');
});

test('long document contents group examples, API, usage guidance and complete code in order', () => {
  const sections = [
    {id:'demo', title:'기본 데이터그리드'}, {id:'props', title:'속성 · DataGridProps<T>'},
    {id:'events', title:'이벤트·상태 연결'}, {id:'style', title:'스타일'},
    {id:'code', title:'React 사용 예시'},
  ];
  assert.deepEqual(groupDocumentSections(sections), [
    {title:'예제', sections:[sections[0]]}, {title:'API', sections:sections.slice(1, 3)},
    {title:'사용 기준', sections:[sections[3]]}, {title:'코드', sections:[sections[4]]},
  ]);
});
