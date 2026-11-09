import ts from 'typescript';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function checkCompleteExamples(examples) {
  const sources=new Map(Object.entries(examples).map(([route,code])=>[resolve(root,'dist/checked-examples',`${route.replaceAll('/','-')}.tsx`),code]));
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,lib:['lib.es2020.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],baseUrl:root,paths:{'@idenflu/mono-react':['dist/index.d.ts']}};
  const host=ts.createCompilerHost(options),original=host.getSourceFile.bind(host);
  host.getSourceFile=(file,languageVersion,...args)=>sources.has(file) ? ts.createSourceFile(file,sources.get(file),languageVersion,true,ts.ScriptKind.TSX) : original(file,languageVersion,...args);
  const program=ts.createProgram([...sources.keys()],options,host);
  const errors=ts.getPreEmitDiagnostics(program);
  if(errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:()=>root,getCanonicalFileName:file=>file,getNewLine:()=> '\n'}));
  return sources.size;
}
