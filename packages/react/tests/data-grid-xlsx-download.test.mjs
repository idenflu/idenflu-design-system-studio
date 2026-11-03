import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/'});
for(const name of ['window','document','navigator'])Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]});
const {createDataGridXlsx,downloadDataGridXlsx}=await import('../dist/index.js');
const mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const columns=[{header:'이름',accessor:row=>row.name},{header:'진행률',accessor:row=>row.progress}];
const rows=[{name:'디자인 시스템',progress:72}];
after(()=>dom.window.close());

test('XLSX save picker opens before serialization with the Excel file type and normalized extension',async()=>{
  const originalPicker=window.showSaveFilePicker,calls=[];
  let blob;
  try{
    window.showSaveFilePicker=async options=>{
      calls.push('picker');
      assert.equal(options.id,'idenflu-data-grid-xlsx');
      assert.equal(options.suggestedName,'프로젝트_목록.xlsx');
      assert.equal(options.types.length,1);
      assert.deepEqual(options.types[0].accept,{[mime]:['.xlsx']});
      return{createWritable:async()=>({
        write:async value=>{calls.push('write');blob=value;},
        close:async()=>{calls.push('close');},
      })};
    };
    await downloadDataGridXlsx({rows,columns:[{header:'이름',accessor:row=>{calls.push('serialize');return row.name;}}],fileName:' 프로젝트/목록.csv '});
    assert.deepEqual(calls,['picker','serialize','write','close']);
    assert.equal(blob.type,mime);
    assert.deepEqual([...new Uint8Array(await blob.arrayBuffer()).slice(0,4)],[0x50,0x4b,0x03,0x04]);
    assert.equal(document.querySelector('a[download]'),null);
  }finally{window.showSaveFilePicker=originalPicker;}
});

test('XLSX save picker cancellation does not serialize or start a fallback download',async()=>{
  const originalPicker=window.showSaveFilePicker,originalPrompt=window.prompt,originalCreate=URL.createObjectURL;
  const unwanted=()=>assert.fail('cancelled Excel export must not generate or download');
  try{
    window.showSaveFilePicker=async()=>{throw new dom.window.DOMException('Cancelled','AbortError');};
    window.prompt=URL.createObjectURL=unwanted;
    await downloadDataGridXlsx({rows,columns:[{header:'이름',accessor:unwanted}]});
  }finally{window.showSaveFilePicker=originalPicker;window.prompt=originalPrompt;URL.createObjectURL=originalCreate;}
});

test('XLSX permission and write errors propagate and incomplete writes abort without a fallback',async()=>{
  const originalPicker=window.showSaveFilePicker,originalPrompt=window.prompt,originalCreate=URL.createObjectURL;
  const denied=new dom.window.DOMException('Denied','NotAllowedError'),failed=new Error('Disk full');
  let aborted=false;
  try{
    window.prompt=URL.createObjectURL=()=>assert.fail('failed Excel export must not download elsewhere');
    window.showSaveFilePicker=async()=>{throw denied;};
    await assert.rejects(downloadDataGridXlsx({rows,columns}),error=>error===denied);
    window.showSaveFilePicker=async()=>({createWritable:async()=>({
      write:async()=>{throw failed;},
      close:async()=>assert.fail('a failed write cannot complete'),
      abort:async()=>{aborted=true;},
    })});
    await assert.rejects(downloadDataGridXlsx({rows,columns}),error=>error===failed);
    assert.equal(aborted,true);
  }finally{window.showSaveFilePicker=originalPicker;window.prompt=originalPrompt;URL.createObjectURL=originalCreate;}
});

test('XLSX fallback confirms its filename, downloads an OOXML Blob, and releases its object URL',async()=>{
  const originalPicker=window.showSaveFilePicker,originalPrompt=window.prompt,originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
  const originalClick=dom.window.HTMLAnchorElement.prototype.click,originalTimer=globalThis.setTimeout;
  const timers=[];
  let blob,download,attached,revoked;
  try{
    delete window.showSaveFilePicker;
    window.prompt=(message,suggestedName)=>{
      assert.match(message,/Excel|엑셀|XLSX/i);
      assert.equal(suggestedName,'프로젝트 목록.xlsx');
      return '확정한/프로젝트';
    };
    URL.createObjectURL=value=>{blob=value;return 'blob:local-xlsx';};
    URL.revokeObjectURL=value=>{revoked=value;};
    globalThis.setTimeout=callback=>{timers.push(callback);return 1;};
    dom.window.HTMLAnchorElement.prototype.click=function(){download=this.download;attached=document.body.contains(this);assert.equal(this.href,'blob:local-xlsx');};
    await downloadDataGridXlsx({rows,columns,fileName:'프로젝트 목록'});
    assert.equal(download,'확정한_프로젝트.xlsx');
    assert.equal(attached,true);
    assert.equal(blob.type,mime);
    assert.deepEqual([...new Uint8Array(await blob.arrayBuffer()).slice(0,4)],[0x50,0x4b,0x03,0x04]);
    assert.equal(document.querySelector('a[download]'),null);
    assert.equal(revoked,undefined);
    timers.forEach(callback=>callback());
    assert.equal(revoked,'blob:local-xlsx');
  }finally{
    window.showSaveFilePicker=originalPicker;window.prompt=originalPrompt;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
    dom.window.HTMLAnchorElement.prototype.click=originalClick;globalThis.setTimeout=originalTimer;
  }
});

test('XLSX fallback cancellation does not serialize or create a download',async()=>{
  const originalPicker=window.showSaveFilePicker,originalPrompt=window.prompt,originalCreate=URL.createObjectURL;
  try{
    delete window.showSaveFilePicker;window.prompt=()=>null;
    URL.createObjectURL=()=>assert.fail('cancelled Excel export must not create a Blob URL');
    await downloadDataGridXlsx({rows,columns:[{header:'이름',accessor:()=>assert.fail('cancelled Excel export must not serialize')}]});
  }finally{window.showSaveFilePicker=originalPicker;window.prompt=originalPrompt;URL.createObjectURL=originalCreate;}
});

test('XLSX bytes can be created without a document while the download helper explains browser requirements',async()=>{
  const original=globalThis.document;
  try{
    delete globalThis.document;
    const bytes=createDataGridXlsx({rows,columns});
    assert.ok(bytes instanceof Uint8Array);
    assert.deepEqual([...bytes.slice(0,4)],[0x50,0x4b,0x03,0x04]);
    await assert.rejects(downloadDataGridXlsx({rows,columns}),/브라우저.*createDataGridXlsx/);
  }finally{Object.defineProperty(globalThis,'document',{configurable:true,value:original});}
});
