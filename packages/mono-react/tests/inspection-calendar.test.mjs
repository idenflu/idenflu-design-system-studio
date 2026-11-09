import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled=await build({entryPoints:[new URL('../../../systems/idenflu-mono/studio/layout-inspection-data.ts',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node',target:'es2020'});
const data=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const conveyorBundle=await build({entryPoints:[new URL('../../../systems/idenflu-mono/studio/layout-conveyor-data.ts',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node',target:'es2020'});
const {initialConveyors}=await import(`data:text/javascript;base64,${Buffer.from(conveyorBundle.outputFiles[0].text).toString('base64')}`);
const {localDateKey,addDays,startOfWeek,shiftMonth,monthDays,weekDays,inspectionEndTime,createInspectionDraft,createInitialInspections,validateInspection,syncConveyorInspectionDates}=data;
const validDraft=()=>({...createInspectionDraft(initialConveyors,'2026-11-08'),title:'구동부 점검'});
const inspection=(patch={})=>({id:'appointment-1',...validDraft(),...patch});

test('calendar date arithmetic preserves dates over leap years, month ends and daylight-saving transitions',()=>{
  assert.equal(addDays('2024-02-28',1),'2024-02-29');
  assert.equal(addDays('2024-02-29',1),'2024-03-01');
  assert.equal(addDays('2026-12-31',1),'2027-01-01');
  assert.equal(addDays('2026-03-08',1),'2026-03-09');
  assert.equal(addDays('2026-11-01',-1),'2026-10-31');
  assert.equal(shiftMonth('2024-01-31',1),'2024-02-29');
  assert.equal(shiftMonth('2026-03-31',-1),'2026-02-28');
  assert.equal(shiftMonth('2026-12-31',1),'2027-01-31');
  assert.throws(()=>addDays('2026-02-29',1),RangeError);
  const local=new Date(2026,10,8,23,59);
  assert.equal(localDateKey(local),'2026-11-08');
});

test('month and week grids start on Monday and include adjacent month dates once',()=>{
  assert.equal(startOfWeek('2026-11-08'),'2026-11-02');
  assert.equal(startOfWeek('2026-11-02'),'2026-11-02');
  const month=monthDays('2026-11-08');
  assert.equal(month.length,42);
  assert.equal(month[0],'2026-10-26');
  assert.equal(month[41],'2026-12-06');
  assert.equal(new Set(month).size,42);
  assert.equal(month.filter(key=>key.startsWith('2026-11')).length,30);
  assert.deepEqual(weekDays('2027-01-01'),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
});

test('inspection validation rejects invalid fields and requires a result for completed work',()=>{
  assert.deepEqual(validateInspection(validDraft(),initialConveyors,[]),{});
  const invalid={...validDraft(),conveyorId:'missing',title:' ',date:'2026-02-29',startTime:'24:00',durationMinutes:45,owner:'없는 담당자',kind:'toString',status:'toString',notes:'a'.repeat(501),result:'a'.repeat(1001)};
  const snapshot=structuredClone(invalid),errors=validateInspection(invalid,initialConveyors,[]);
  for(const key of ['conveyorId','title','date','startTime','durationMinutes','owner','kind','status','notes','result'])assert.ok(errors[key],key);
  assert.deepEqual(invalid,snapshot);
  assert.ok(validateInspection({...validDraft(),status:'completed'},initialConveyors,[]).result);
  assert.deepEqual(validateInspection({...validDraft(),status:'completed',result:'정상'},initialConveyors,[]),{});
  assert.ok(validateInspection({...validDraft(),date:'2101-01-01'},initialConveyors,[]).date);
  assert.ok(validateInspection({...validDraft(),startTime:'09:7'},initialConveyors,[]).startTime);
});

test('inspection slots permit touching appointments, exclude edits and release cancelled time',()=>{
  const existing=inspection({startTime:'10:00',durationMinutes:60});
  assert.equal(validateInspection({...validDraft(),startTime:'09:00'},initialConveyors,[existing]).startTime,undefined);
  assert.equal(validateInspection({...validDraft(),startTime:'11:00'},initialConveyors,[existing]).startTime,undefined);
  assert.ok(validateInspection({...validDraft(),startTime:'09:30'},initialConveyors,[existing]).startTime);
  assert.ok(validateInspection({...validDraft(),startTime:'10:30'},initialConveyors,[existing]).startTime);
  assert.equal(validateInspection(existing,initialConveyors,[existing],existing.id).startTime,undefined);
  assert.equal(validateInspection({...validDraft(),startTime:'10:00'},initialConveyors,[{...existing,status:'cancelled'}]).startTime,undefined);
  assert.equal(validateInspection({...validDraft(),startTime:'10:00',status:'cancelled'},initialConveyors,[existing]).startTime,undefined);
  assert.equal(validateInspection({...validDraft(),date:'2026-11-09',startTime:'10:00'},initialConveyors,[existing]).startTime,undefined);
  assert.equal(validateInspection({...validDraft(),conveyorId:initialConveyors[1].id,startTime:'10:00'},initialConveyors,[existing]).startTime,undefined);
});

test('inspection duration cannot cross midnight and end time can display 24:00',()=>{
  const late={...validDraft(),startTime:'23:30',durationMinutes:30};
  assert.equal(inspectionEndTime(late),'24:00');
  assert.deepEqual(validateInspection(late,initialConveyors,[]),{});
  assert.ok(validateInspection({...late,durationMinutes:60},initialConveyors,[]).durationMinutes);
  assert.equal(inspectionEndTime({...late,durationMinutes:60}),'');
  assert.equal(inspectionEndTime({startTime:'bad',durationMinutes:30}),'');
});

test('initial inspection calendar has valid nonconflicting appointments and three examples today',()=>{
  const items=createInitialInspections(initialConveyors,'2026-11-08');
  assert.equal(items.length,12);
  assert.equal(items.filter(item=>item.date==='2026-11-08').length,3);
  assert.equal(new Set(items.map(item=>item.id)).size,items.length);
  assert.deepEqual(new Set(items.map(item=>item.status)),new Set(['scheduled','in-progress','completed','cancelled']));
  for(const item of items)assert.deepEqual(validateInspection(item,initialConveyors,items,item.id),{},item.id);
  assert.deepEqual(createInitialInspections([],'2026-11-08'),[]);
});

test('catalog dates derive from the latest completion and earliest active appointment without mutating equipment',()=>{
  const snapshot=structuredClone(initialConveyors);
  const items=[inspection({id:'old',status:'completed',date:'2026-10-01',result:'정상'}),inspection({id:'latest',status:'completed',date:'2026-11-01',result:'정상'}),inspection({id:'next',date:'2026-11-12'}),inspection({id:'active',status:'in-progress',date:'2026-11-08'}),inspection({id:'cancelled',status:'cancelled',date:'2026-11-02'})];
  const synced=syncConveyorInspectionDates(initialConveyors,items);
  assert.equal(synced[0].lastInspectedAt,'2026-11-01');
  assert.equal(synced[0].nextInspectionAt,'2026-11-08');
  assert.equal(synced[1].lastInspectedAt,null);
  assert.equal(synced[1].nextInspectionAt,null);
  assert.deepEqual(initialConveyors,snapshot);
  assert.equal(syncConveyorInspectionDates(initialConveyors,items.map(item=>item.id==='active'?{...item,status:'completed'}:item))[0].nextInspectionAt,'2026-11-12');
});
