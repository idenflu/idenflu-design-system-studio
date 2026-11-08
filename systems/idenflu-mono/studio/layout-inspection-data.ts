import { conveyorOwnerOptions, type Conveyor } from './layout-conveyor-data';

export type InspectionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type InspectionKind = 'routine' | 'safety' | 'repair';
export type Inspection = {
  id:string; conveyorId:string; title:string; date:string; startTime:string;
  durationMinutes:number; owner:string; kind:InspectionKind; status:InspectionStatus;
  notes:string; result:string;
};
export type InspectionDraft = Omit<Inspection,'id'>;
export type InspectionErrors = Partial<Record<keyof InspectionDraft,string>>;

export const inspectionStatusLabels:Record<InspectionStatus,string> = {
  scheduled:'예정', 'in-progress':'진행 중', completed:'완료', cancelled:'취소',
};
export const inspectionKindLabels:Record<InspectionKind,string> = {
  routine:'정기 점검', safety:'안전 점검', repair:'정비 후 점검',
};
export const inspectionStatusOptions = Object.entries(inspectionStatusLabels).map(([value,label])=>({value,label}));
export const inspectionKindOptions = Object.entries(inspectionKindLabels).map(([value,label])=>({value,label}));
export const inspectionDurationOptions = [
  {value:'30',label:'30분'}, {value:'60',label:'1시간'},
  {value:'90',label:'1시간 30분'}, {value:'120',label:'2시간'},
];
export const inspectionStatusVariant = (status:InspectionStatus) => status==='completed'?'success' as const:status==='in-progress'?'warning' as const:status==='scheduled'?'primary' as const:'neutral' as const;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
function dateValue(key:string):Date|null {
  if(!datePattern.test(key))return null;
  const date=new Date(`${key}T00:00:00Z`);
  return Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==key?null:date;
}
function requireDate(key:string):Date {
  const date=dateValue(key);
  if(!date)throw new RangeError('올바른 날짜가 필요합니다.');
  return date;
}
const utcKey=(date:Date)=>date.toISOString().slice(0,10);

/** Today follows the user's local clock; calendar arithmetic uses UTC dates only. */
export function localDateKey(date=new Date()):string {
  if(Number.isNaN(date.getTime()))throw new RangeError('올바른 날짜가 필요합니다.');
  return `${String(date.getFullYear()).padStart(4,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function addDays(key:string,delta:number):string {
  const date=requireDate(key);
  date.setUTCDate(date.getUTCDate()+delta);
  return utcKey(date);
}
export function startOfWeek(key:string):string {
  const date=requireDate(key);
  return addDays(key,-((date.getUTCDay()+6)%7));
}
export function shiftMonth(key:string,delta:number):string {
  const date=requireDate(key),day=date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth()+delta,1);
  const last=new Date(date.getTime());
  last.setUTCMonth(last.getUTCMonth()+1,0);
  date.setUTCDate(Math.min(day,last.getUTCDate()));
  return utcKey(date);
}
export function monthDays(key:string):string[] {
  const date=requireDate(key);
  date.setUTCDate(1);
  const first=startOfWeek(utcKey(date));
  return Array.from({length:42},(_,index)=>addDays(first,index));
}
export function weekDays(key:string):string[] {
  const first=startOfWeek(key);
  return Array.from({length:7},(_,index)=>addDays(first,index));
}

function timeMinutes(value:string):number|null {
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return null;
  const [hours,minutes]=value.split(':').map(Number);
  return hours*60+minutes;
}
export function inspectionEndTime(item:Pick<InspectionDraft,'startTime'|'durationMinutes'>):string {
  const start=timeMinutes(item.startTime);
  if(start===null||!Number.isInteger(item.durationMinutes)||item.durationMinutes<=0||start+item.durationMinutes>1440)return '';
  const end=start+item.durationMinutes;
  return `${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`;
}

export function createInspectionDraft(conveyors:readonly Conveyor[],date:string,conveyorId?:string):InspectionDraft {
  const conveyor=conveyors.find(item=>item.id===conveyorId)??conveyors[0];
  return {conveyorId:conveyor?.id??'',title:'',date,startTime:'09:00',durationMinutes:60,
    owner:conveyor?.owner??'',kind:'routine',status:'scheduled',notes:'',result:''};
}

/** Each equipment has a past result and a calendar appointment near today. */
export function createInitialInspections(conveyors:readonly Conveyor[],today=localDateKey()):Inspection[] {
  const offsets=[0,1,3,0,5,0];
  return conveyors.slice(0,6).flatMap((conveyor,index)=>{
    const past:Inspection={id:`inspection-${index+1}-completed`,conveyorId:conveyor.id,title:index%2?'비상 정지·가드 안전 점검':'구동부 정기 점검',
      date:addDays(today,-(6-index)),startTime:'09:00',durationMinutes:60,owner:conveyor.owner,
      kind:index%2?'safety':'routine',status:'completed',notes:'작업 전 전원을 차단하고 안전 표지를 설치하세요.',
      result:index%2?'비상 정지 버튼과 안전 가드가 정상 동작합니다.':'벨트 장력과 구동부 체결 상태가 정상입니다. 소모 부품 상태를 확인했습니다.'};
    const next:Inspection={id:`inspection-${index+1}-scheduled`,conveyorId:conveyor.id,title:index===3?'롤러 교체 후 시운전 점검':index===5?'출고 구역 안전 점검':'컨베이어 정기 점검',
      date:addDays(today,offsets[index]),startTime:index===3?'11:00':index===5?'15:30':'10:00',
      durationMinutes:index===3?90:60,owner:conveyor.owner,kind:index===3?'repair':index===5?'safety':'routine',
      status:index===3?'in-progress':index===5?'cancelled':'scheduled',
      notes:index===3?'교체한 구동 롤러의 진동과 이송 상태를 확인합니다.':index===5?'출고 물량 집중으로 일정을 취소했습니다. 다음 점검일을 다시 예약하세요.':'벨트 장력, 구동 모터, 센서 및 비상 정지 장치를 확인합니다.',result:''};
    return [past,next];
  }).sort((left,right)=>left.date.localeCompare(right.date)||left.startTime.localeCompare(right.startTime)||left.id.localeCompare(right.id));
}

export function validateInspection(draft:InspectionDraft,conveyors:readonly Conveyor[],inspections:readonly Inspection[],excludeId?:string):InspectionErrors {
  const errors:InspectionErrors={};
  if(!conveyors.some(item=>item.id===draft.conveyorId))errors.conveyorId='점검할 설비를 선택해주세요.';
  if(!draft.title.trim())errors.title='점검 제목을 입력해주세요.';
  else if(draft.title.trim().length>60)errors.title='점검 제목은 60자 이내로 입력해주세요.';
  if(!dateValue(draft.date)||draft.date<'2000-01-01'||draft.date>'2100-12-31')errors.date='2000~2100년의 올바른 날짜를 선택해주세요.';
  if(!conveyorOwnerOptions.some(option=>option.value===draft.owner))errors.owner='점검 담당자를 선택해주세요.';
  if(!Object.prototype.hasOwnProperty.call(inspectionKindLabels,draft.kind))errors.kind='점검 유형을 선택해주세요.';
  if(!Object.prototype.hasOwnProperty.call(inspectionStatusLabels,draft.status))errors.status='점검 상태를 선택해주세요.';
  const start=timeMinutes(draft.startTime);
  if(start===null)errors.startTime='올바른 시작 시간을 입력해주세요.';
  if(!inspectionDurationOptions.some(option=>Number(option.value)===draft.durationMinutes))errors.durationMinutes='점검 소요 시간을 선택해주세요.';
  else if(start!==null&&start+draft.durationMinutes>1440)errors.durationMinutes='점검은 시작일의 자정까지 완료되도록 설정해주세요.';
  if(draft.notes.length>500)errors.notes='점검 메모는 500자 이내로 입력해주세요.';
  if(draft.status==='completed'&&!draft.result.trim())errors.result='완료한 점검의 결과를 입력해주세요.';
  else if(draft.result.length>1000)errors.result='점검 결과는 1,000자 이내로 입력해주세요.';
  if(!errors.startTime&&!errors.durationMinutes&&!errors.date&&draft.status!=='cancelled'&&start!==null){
    const end=start+draft.durationMinutes;
    const conflict=inspections.some(item=>{
      if(item.id===excludeId||item.conveyorId!==draft.conveyorId||item.date!==draft.date||item.status==='cancelled')return false;
      const otherStart=timeMinutes(item.startTime);
      return otherStart!==null&&start<otherStart+item.durationMinutes&&otherStart<end;
    });
    if(conflict)errors.startTime='같은 설비의 다른 점검 일정과 시간이 겹칩니다.';
  }
  return errors;
}

/** Appointment edits and completion update the corresponding catalog dates. */
export function syncConveyorInspectionDates(conveyors:readonly Conveyor[],inspections:readonly Inspection[]):Conveyor[] {
  return conveyors.map(conveyor=>{
    const related=inspections.filter(item=>item.conveyorId===conveyor.id);
    const completed=related.filter(item=>item.status==='completed').map(item=>item.date).sort();
    const pending=related.filter(item=>item.status==='scheduled'||item.status==='in-progress').map(item=>item.date).sort();
    return {...conveyor,lastInspectedAt:completed[completed.length-1]??null,nextInspectionAt:pending[0]??null};
  });
}
