import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createDataGridXlsx } from '../dist/index.js';

const spreadsheetNamespace='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const column={header:'값',accessor:row=>row};

function checksum(bytes){
  let result=0xffffffff;
  for(const byte of bytes){result^=byte;for(let bit=0;bit<8;bit++)result=result&1?0xedb88320^(result>>>1):result>>>1;}
  return (result^0xffffffff)>>>0;
}

function unpack(bytes){
  assert.ok(bytes instanceof Uint8Array);
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),decoder=new TextDecoder(),files=new Map(),locals=[];
  let offset=0;
  while(view.getUint32(offset,true)===0x04034b50){
    assert.equal(view.getUint16(offset+6,true),0x0800,'ZIP names use UTF-8');
    assert.equal(view.getUint16(offset+8,true),0,'the workbook uses stored ZIP entries');
    const crc=view.getUint32(offset+14,true),size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extraLength=view.getUint16(offset+28,true);
    assert.equal(size,view.getUint32(offset+22,true));
    const name=decoder.decode(bytes.subarray(offset+30,offset+30+nameLength)),start=offset+30+nameLength+extraLength;
    const content=bytes.subarray(start,start+size);
    assert.equal(checksum(content),crc,`${name} has a valid CRC32`);
    files.set(name,decoder.decode(content));
    locals.push({name,offset,size,crc});
    offset=start+size;
  }
  const centralStart=offset;
  for(const local of locals){
    assert.equal(view.getUint32(offset,true),0x02014b50);
    assert.equal(view.getUint32(offset+16,true),local.crc);
    assert.equal(view.getUint32(offset+20,true),local.size);
    assert.equal(view.getUint32(offset+42,true),local.offset);
    const length=view.getUint16(offset+28,true);
    assert.equal(decoder.decode(bytes.subarray(offset+46,offset+46+length)),local.name);
    offset+=46+length+view.getUint16(offset+30,true)+view.getUint16(offset+32,true);
  }
  assert.equal(view.getUint32(offset,true),0x06054b50);
  assert.equal(view.getUint16(offset+8,true),locals.length);
  assert.equal(view.getUint16(offset+10,true),locals.length);
  assert.equal(view.getUint32(offset+12,true),offset-centralStart);
  assert.equal(view.getUint32(offset+16,true),centralStart);
  assert.equal(offset+22,bytes.length);
  return files;
}

function document(xml){
  const dom=new JSDOM('');
  const parsed=new dom.window.DOMParser().parseFromString(xml,'application/xml');
  assert.equal(parsed.getElementsByTagName('parsererror').length,0);
  dom.window.close();
  return parsed;
}

test('XLSX is an independent OOXML ZIP package with valid relationships, XML and CRCs',()=>{
  const files=unpack(createDataGridXlsx({rows:['한글'],columns:[column]}));
  assert.deepEqual([...files.keys()],['[Content_Types].xml','_rels/.rels','xl/workbook.xml','xl/_rels/workbook.xml.rels','xl/styles.xml','xl/worksheets/sheet1.xml']);
  for(const xml of files.values())document(xml);
  assert.equal(document(files.get('xl/workbook.xml')).querySelector('sheet').getAttribute('name'),'데이터');
  assert.match(files.get('[Content_Types].xml'),/spreadsheetml\.sheet\.main\+xml/);
  assert.match(files.get('_rels/.rels'),/Target="xl\/workbook.xml"/);
  assert.match(files.get('xl/_rels/workbook.xml.rels'),/Target="worksheets\/sheet1.xml"/);
  assert.doesNotMatch([...files.values()].join(''),/macroEnabled|vbaProject|externalLink/);
});

test('XLSX preserves text and Korean as strings, numeric cells as numbers and nulls as blank cells',()=>{
  const values=['한글 & <설명> "인용"',-3,0,2.5,null,undefined,'=SUM(A1:A2)','-3','  공백\n줄바꿈  ','😀',Infinity,NaN];
  const files=unpack(createDataGridXlsx({rows:values,columns:[{header:'=헤더',accessor:row=>row}]}));
  const sheet=document(files.get('xl/worksheets/sheet1.xml'));
  const cells=[...sheet.getElementsByTagNameNS(spreadsheetNamespace,'c')];
  assert.equal(cells[0].getAttribute('t'),'inlineStr');
  assert.equal(cells[0].textContent,'=헤더');
  assert.equal(cells[0].getAttribute('s'),'1');
  for(const [index,value] of values.entries()){
    const cell=cells[index+1];
    assert.equal(cell.getAttribute('r'),`A${index+2}`);
    if(value==null){assert.equal(cell.textContent,'');assert.equal(cell.hasAttribute('t'),false);}
    else if(typeof value==='number'&&Number.isFinite(value)){assert.equal(cell.getAttribute('t'),'n');assert.equal(Number(cell.textContent),value);}
    else {assert.equal(cell.getAttribute('t'),'inlineStr');assert.equal(cell.textContent,String(value));assert.equal(cell.querySelector('t').getAttribute('xml:space'),'preserve');}
  }
  assert.equal(sheet.getElementsByTagNameNS(spreadsheetNamespace,'f').length,0,'formula-like source text never becomes a formula');
});

test('XLSX encodes XML controls and literal OOXML escapes without corrupting valid Unicode',()=>{
  const source='시작\u0000\u0001\r끝 _x000D_ _X00aF_ 😀 \ud800';
  const files=unpack(createDataGridXlsx({rows:[source],columns:[column]}));
  const xml=files.get('xl/worksheets/sheet1.xml');
  document(xml);
  assert.match(xml,/_x0000__x0001__x000D_/);
  assert.match(xml,/_x005F_x000D_/);
  assert.match(xml,/_x005F_X00aF_/);
  assert.match(xml,/😀 _xD800_/);
  assert.doesNotMatch(xml,/\u0000|\u0001|\ufffd/);
});

test('XLSX maps columns beyond Z, escapes sheet names, bolds the header and freezes its first row',()=>{
  const columns=Array.from({length:28},(_,index)=>({header:`열 ${index+1}`,accessor:row=>row}));
  const files=unpack(createDataGridXlsx({rows:['값'],columns,sheetName:'협업 & 검토'}));
  const workbook=document(files.get('xl/workbook.xml')),sheet=document(files.get('xl/worksheets/sheet1.xml')),styles=document(files.get('xl/styles.xml'));
  assert.equal(workbook.querySelector('sheet').getAttribute('name'),'협업 & 검토');
  assert.equal(sheet.querySelector('dimension').getAttribute('ref'),'A1:AB2');
  assert.equal(sheet.querySelector('c[r="AA2"]').textContent,'값');
  assert.equal(sheet.querySelector('c[r="AB2"]').textContent,'값');
  assert.equal(sheet.querySelector('pane').getAttribute('topLeftCell'),'A2');
  assert.equal(sheet.querySelector('pane').getAttribute('state'),'frozen');
  assert.equal(styles.querySelectorAll('fonts > font').length,2);
  assert.ok(styles.querySelector('fonts > font:nth-child(2) > b'));
});

test('XLSX supports header-only exports and enforces worksheet and text limits before serialization',()=>{
  const empty=unpack(createDataGridXlsx({rows:[],columns:[column]}));
  assert.equal(document(empty.get('xl/worksheets/sheet1.xml')).querySelectorAll('row').length,1);
  const missingColumns=unpack(createDataGridXlsx({rows:[],columns:[]}));
  document(missingColumns.get('xl/worksheets/sheet1.xml'));
  const unwanted=()=>assert.fail('invalid worksheet dimensions must be rejected before reading rows');
  assert.throws(()=>createDataGridXlsx({rows:new Array(1_048_576),columns:[{header:'값',accessor:unwanted}]}),/1,048,576/);
  assert.throws(()=>createDataGridXlsx({rows:[1],columns:new Array(16_385).fill({header:'값',accessor:unwanted})}),/16,384/);
  assert.throws(()=>createDataGridXlsx({rows:['x'.repeat(32_768)],columns:[column]}),/32,767/);
  assert.throws(()=>createDataGridXlsx({rows:[],columns:[{header:'x'.repeat(32_768),accessor:row=>row}]}),/32,767/);
  for(const sheetName of ['', ' ', 'x'.repeat(32),'a/b','a\\b','a:b','a?b','a*b','a[b','a]b',"'start","end'",'a\u0000b','a\ud800b','a\udc00b']){
    assert.throws(()=>createDataGridXlsx({rows:[],columns:[column],sheetName}),/시트명/);
  }
});
