import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const completeExampleEntries = {
  'components/table':['table-demos.tsx','TableDemos','TableExample'],
  'components/chips':['structure-demos.tsx','ChipDemos','ChipsExample'],
  'patterns/form/basic':['pattern-forms.tsx','BasicFormPattern','BasicFormExample'],
  'patterns/form/preferences':['pattern-forms.tsx','PreferencesPattern','PreferencesExample'],
  'patterns/form/password':['pattern-forms.tsx','PasswordPattern','PasswordExample'],
  'patterns/form/inquiry':['pattern-forms.tsx','InquiryPattern','InquiryExample'],
  'patterns/form/project':['pattern-forms.tsx','ProjectPattern','ProjectExample'],
  'patterns/form/booking':['pattern-forms.tsx','BookingPattern','BookingExample'],
  'patterns/form/states':['pattern-forms.tsx','FormStatesPattern','FormStatesExample'],
  'patterns/form/profile':['pattern-forms.tsx','ProfilePattern','ProfileExample'],
  'components/select':['field-binding-examples.tsx','SelectBindingExample','SelectExample'],
  'components/number-fields':['field-binding-examples.tsx','NumberBindingExample','NumberFieldExample'],
  'components/date-picker':['field-binding-examples.tsx','DateBindingExample','DatePickerExample'],
};

// Only presentation styles used by copied examples; no documentation shell or app reset.
const exampleStyles = `
.mono-copy-example { font-family:var(--font-family-body); font-size:var(--font-size-body); line-height:var(--line-height-body); color:var(--text); }
.mono-copy-example .react-studio-section { margin:0 0 32px; }
.mono-copy-example .react-studio-section-heading { margin-bottom:20px; }
.mono-copy-example .react-studio-section-heading h2 { font-size:22px; margin:0 0 8px; }
.mono-copy-example .react-studio-section-heading p, .mono-copy-example .react-studio-caption { color:var(--text-secondary); }
.mono-copy-example .react-studio-demo, .mono-copy-example .react-studio-stack, .mono-copy-example .react-pattern-stack, .mono-copy-example .react-pattern-form { display:grid; gap:20px; min-width:0; }
.mono-copy-example .react-studio-row, .mono-copy-example .form-pattern-actions, .mono-copy-example .react-studio-table-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.mono-copy-example .form-pattern-required { color:var(--primary); font-size:var(--font-size-caption); margin-left:4px; }
.mono-copy-example .form-pattern-optional { color:var(--text-muted); font-size:var(--font-size-caption); margin-left:4px; }
.mono-copy-example fieldset { min-width:0; border:0; padding:0; margin:0; }
.mono-copy-example legend { padding:0; margin-bottom:16px; font-weight:600; }
.mono-copy-example .form-example-group { display:grid; gap:20px; }
.mono-copy-example .form-pattern-choices { display:grid; gap:12px; }
.mono-copy-example .react-studio-field-meta { display:flex; justify-content:space-between; gap:12px; }
.mono-copy-example .react-studio-table { min-width:640px; }
.mono-copy-example .react-studio-table-person { display:flex; align-items:center; gap:12px; }
.mono-copy-example .table-primary, .mono-copy-example .table-secondary { display:block; }
.mono-copy-example .table-secondary { color:var(--text-secondary); font-size:var(--font-size-caption); }
.mono-copy-example .table-numeric { text-align:right; font-variant-numeric:tabular-nums; }
.mono-copy-example .table-date { white-space:nowrap; }
.mono-copy-example .table-muted { color:var(--text-muted); }
.mono-copy-example pre { max-width:100%; overflow:auto; padding:16px; background:var(--surface); font-size:13px; }
`;

export async function createCompleteExamples() {
  const modules=new Map();
  async function load(file) {
    if(modules.has(file)) return modules.get(file);
    const text=await readFile(file,'utf8');
    const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const declarations=new Map(),imports=new Map();
    for(const node of source.statements) {
      if(ts.isImportDeclaration(node)) {
        const from=node.moduleSpecifier.text, clause=node.importClause;
        if(clause?.name) imports.set(clause.name.text,{from,kind:'default',name:clause.name.text});
        const bindings=clause?.namedBindings;
        if(bindings && ts.isNamespaceImport(bindings)) imports.set(bindings.name.text,{from,kind:'namespace',name:bindings.name.text});
        if(bindings && ts.isNamedImports(bindings)) for(const item of bindings.elements) imports.set(item.name.text,{from,kind:'named',name:item.propertyName?.text || item.name.text,alias:item.name.text,typeOnly:item.isTypeOnly || clause.isTypeOnly});
      } else if(ts.isVariableStatement(node)) {
        for(const declaration of node.declarationList.declarations) if(ts.isIdentifier(declaration.name)) declarations.set(declaration.name.text,node);
      } else if(node.name && ts.isIdentifier(node.name)) declarations.set(node.name.text,node);
    }
    const module={source,declarations,imports};modules.set(file,module);return module;
  }
  const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
  const result={};
  for(const [route,[filename,target,exportName]] of Object.entries(completeExampleEntries)) {
    const nodes=[],seen=new Set(),imports=new Map(),names=new Map();
    async function collect(file,name) {
      const key=`${file}:${name}`;
      if(seen.has(key)) return; seen.add(key);
      const module=await load(file), imported=module.imports.get(name);
      if(imported) {
        if(imported.from.startsWith('.') && imported.from!=='../src') {
          if(imported.kind!=='named') throw new Error(`복사 예제에서 지원하지 않는 가져오기: ${name}`);
          await collect(resolve(dirname(file),`${imported.from}.tsx`),imported.name);
        } else {
          const from=imported.from==='../src'?'@idenflu/mono-react':imported.from;
          if(!imports.has(from)) imports.set(from,new Map());
          imports.get(from).set(name,{...imported,from});
        }
        return;
      }
      const node=module.declarations.get(name);
      if(!node) return;
      if(names.has(name) && names.get(name)!==file) throw new Error(`복사 예제 선언 이름 충돌: ${name}`);
      names.set(name,file);
      const refs=new Set();
      function visit(child) { if(ts.isIdentifier(child)) refs.add(child.text); ts.forEachChild(child,visit); }
      visit(node);
      for(const ref of refs) if(ref!==name && (module.declarations.has(ref)||module.imports.has(ref))) await collect(file,ref);
      if(!nodes.some(item=>item.node===node)) nodes.push({node,source:module.source});
    }
    await collect(resolve(root,'studio',filename),target);
    const lines=[];
    for(const [from,items] of imports) {
      const values=[...items.values()];
      for(const item of values.filter(item=>item.kind==='namespace')) lines.push(`import * as ${item.name} from '${from}';`);
      for(const item of values.filter(item=>item.kind==='default')) lines.push(`import ${item.name} from '${from}';`);
      const named=values.filter(item=>item.kind==='named').map(item=>`${item.typeOnly?'type ':''}${item.name}${item.alias!==item.name?` as ${item.alias}`:''}`);
      if(named.length) lines.push(`import { ${named.join(', ')} } from '${from}';`);
    }
    lines.push("import '@idenflu/mono-react/styles.css';",'');
    for(const {node,source} of nodes) {
      const code=printer.printNode(ts.EmitHint.Unspecified,node,source).replace(/^export\s+(?:default\s+)?/,'');
      lines.push(code,'');
    }
    lines.push('const exampleStyles = `'+exampleStyles.replaceAll('`','\\`').replaceAll('${','\\${')+'`;','',`export function ${exportName}() {\n  return <div className="mono-copy-example">\n    <style>{exampleStyles}</style>\n    <${target} />\n  </div>;\n}`);
    result[route]=lines.join('\n');
  }
  return result;
}
