import {resolve} from 'node:path';
import {packageModules,packageRequire,packageRoot,publicTypePaths,studioRoot} from './runtime.mjs';

const ts=packageRequire('typescript');
export function checkCompleteExamples(examples) {
  const sources=new Map(Object.entries(examples).map(([route,code])=>[resolve(studioRoot,'dist/checked-examples',`${route.replaceAll('/','-')}.tsx`),code]));
  const options={strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,lib:['lib.es2020.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],baseUrl:packageRoot,paths:publicTypePaths,typeRoots:[resolve(packageModules,'@types')]};
  const host=ts.createCompilerHost(options),original=host.getSourceFile.bind(host);
  host.getSourceFile=(file,languageVersion,...args)=>sources.has(file) ? ts.createSourceFile(file,sources.get(file),languageVersion,true,ts.ScriptKind.TSX) : original(file,languageVersion,...args);
  const program=ts.createProgram([...sources.keys()],options,host);
  const errors=ts.getPreEmitDiagnostics(program);
  if(errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:()=>studioRoot,getCanonicalFileName:file=>file,getNewLine:()=> '\n'}));
  return sources.size;
}
