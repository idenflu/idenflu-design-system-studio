import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {requirePackage} from '../scripts/runtime.mjs';
const ts=requirePackage('typescript');

const source=await readFile(new URL('../layout-conveyor-data.ts',import.meta.url),'utf8');
const javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {initialConveyors,createConveyorDraft,validateConveyorBasics,validateConveyorUnits}=await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
const completeDraft=()=>({...createConveyorDraft(),code:'CV-007',name:'새 컨베이어',location:'물류 1동 · 입고 구역',owner:'박지훈',installedAt:'2026-11-08'});

test('conveyor samples have distinct codes, valid base fields and consistent unit data',()=>{
  assert.equal(new Set(initialConveyors.map(item=>item.code)).size,initialConveyors.length);
  for(const item of initialConveyors){
    assert.deepEqual(validateConveyorBasics(item,initialConveyors.filter(other=>other.id!==item.id).map(other=>other.code)),{});
    assert.deepEqual(validateConveyorUnits(item.units),{});
    assert.ok(item.units.length>0);
    assert.equal(new Set(item.units.map(unit=>unit.id)).size,item.units.length);
  }
});

test('conveyor registration rejects normalized duplicate codes and invalid dates without changing a draft',()=>{
  const draft=completeDraft();
  const snapshot=structuredClone(draft);
  assert.deepEqual(validateConveyorBasics(draft,['CV-001']),{});
  assert.ok(validateConveyorBasics({...draft,code:' cv-001 '},['CV-001']).code);
  assert.ok(validateConveyorBasics({...draft,code:'CV 007'},[]).code);
  assert.ok(validateConveyorBasics({...draft,installedAt:'2026-02-29'},[]).installedAt);
  assert.equal(validateConveyorBasics({...draft,installedAt:'2024-02-29'},[]).installedAt,undefined);
  assert.ok(validateConveyorBasics({...draft,location:'없는 위치',type:'toString',owner:''},[]).location);
  assert.ok(validateConveyorBasics({...draft,location:'없는 위치',type:'toString',owner:''},[]).type);
  assert.ok(validateConveyorBasics({...draft,location:'없는 위치',type:'toString',owner:''},[]).owner);
  assert.deepEqual(draft,snapshot);
});

test('conveyor units require distinct names, supported kinds and integer dimensions in range',()=>{
  const unit=completeDraft().units[0];
  const items=[unit,{...unit,id:'other-unit',name:` ${unit.name} `,length:99,width:3001,kind:'toString',drive:'other'}];
  const snapshot=structuredClone(items);
  const errors=validateConveyorUnits(items);
  assert.ok(errors[unit.id].name);
  assert.ok(errors['other-unit'].name);
  for(const name of ['length','width','kind','drive'])assert.ok(errors['other-unit'][name]);
  assert.ok(validateConveyorUnits([{...unit,length:100.5}])[unit.id].length);
  assert.deepEqual(validateConveyorUnits([{...unit,length:20000,width:3000}]),{});
  assert.deepEqual(items,snapshot);
});
