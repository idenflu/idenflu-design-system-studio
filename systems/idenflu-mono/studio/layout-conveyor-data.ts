export type ConveyorStatus = 'running' | 'stopped' | 'maintenance';
export type ConveyorType = 'belt' | 'roller' | 'chain';
export type ConveyorUnitKind = 'straight' | 'curve' | 'transfer';
export type ConveyorDrive = 'motor' | 'gravity';
export type ConveyorUnit = {id:string;name:string;kind:ConveyorUnitKind;length:number;width:number;drive:ConveyorDrive};
export type Conveyor = {
  id:string;code:string;name:string;location:string;type:ConveyorType;status:ConveyorStatus;
  owner:string;installedAt:string;description:string;units:ConveyorUnit[];
  lastInspectedAt:string|null;nextInspectionAt:string|null;
};
export type ConveyorDraft = Omit<Conveyor,'id'|'lastInspectedAt'|'nextInspectionAt'>;

export const conveyorTypeLabels:Record<ConveyorType,string> = {belt:'벨트 컨베이어',roller:'롤러 컨베이어',chain:'체인 컨베이어'};
export const conveyorStatusLabels:Record<ConveyorStatus,string> = {running:'가동 중',stopped:'정지',maintenance:'점검 중'};
export const conveyorUnitKindLabels:Record<ConveyorUnitKind,string> = {straight:'직선',curve:'곡선',transfer:'이송·합류'};
export const conveyorDriveLabels:Record<ConveyorDrive,string> = {motor:'모터 구동',gravity:'무동력'};
export const conveyorTypeOptions = Object.entries(conveyorTypeLabels).map(([value,label])=>({value,label}));
export const conveyorStatusOptions = Object.entries(conveyorStatusLabels).map(([value,label])=>({value,label}));
export const conveyorUnitKindOptions = Object.entries(conveyorUnitKindLabels).map(([value,label])=>({value,label}));
export const conveyorDriveOptions = Object.entries(conveyorDriveLabels).map(([value,label])=>({value,label}));
export const conveyorLocationOptions = ['물류 1동 · 입고 구역','물류 1동 · 분류 구역','물류 2동 · 포장 구역','물류 2동 · 출고 구역'].map(value=>({value,label:value}));
export const conveyorOwnerOptions = ['박지훈','김민수','이서연','정수빈'].map(value=>({value,label:value}));
export const conveyorStatusVariant = (status:ConveyorStatus) => status==='running'?'success' as const:status==='maintenance'?'warning' as const:'neutral' as const;

const units = (prefix:string,kind:ConveyorType,count:number):ConveyorUnit[] => Array.from({length:count},(_,index)=>({
  id:`${prefix}-unit-${index+1}`,name:`${index===count-1&&count>2?'합류':'직선'} 유닛 ${String(index+1).padStart(2,'0')}`,
  kind:index===count-1&&count>2?'transfer':'straight',length:index===count-1?1500:3000,width:kind==='chain'?1000:800,
  drive:kind==='roller'&&index===1?'gravity':'motor',
}));
export const initialConveyors:Conveyor[] = [
  {id:'conveyor-001',code:'CV-001',name:'입고 메인 컨베이어',location:conveyorLocationOptions[0].value,type:'belt',status:'running',owner:'박지훈',installedAt:'2024-03-15',description:'입고 도크에서 검수 구역으로 상품을 이송하는 메인 라인입니다.',units:units('cv001','belt',4),lastInspectedAt:'2026-11-02',nextInspectionAt:'2026-11-16'},
  {id:'conveyor-002',code:'CV-002',name:'입고 보조 롤러 라인',location:conveyorLocationOptions[0].value,type:'roller',status:'stopped',owner:'김민수',installedAt:'2024-03-15',description:'소형 화물과 비정형 상품을 검수대로 연결하는 보조 이송 라인입니다.',units:units('cv002','roller',3),lastInspectedAt:'2026-10-28',nextInspectionAt:'2026-11-11'},
  {id:'conveyor-003',code:'CV-003',name:'자동 분류 이송 라인',location:conveyorLocationOptions[1].value,type:'belt',status:'running',owner:'이서연',installedAt:'2025-01-20',description:'검수 완료 상품을 배송 권역별 분류 구간으로 이동합니다.',units:units('cv003','belt',5),lastInspectedAt:'2026-11-05',nextInspectionAt:'2026-11-19'},
  {id:'conveyor-004',code:'CV-004',name:'포장 구역 연결 컨베이어',location:conveyorLocationOptions[2].value,type:'roller',status:'maintenance',owner:'박지훈',installedAt:'2023-09-11',description:'포장 작업대 사이를 연결하며 현재 구동 롤러 정기 점검 중입니다.',units:units('cv004','roller',3),lastInspectedAt:'2026-10-25',nextInspectionAt:'2026-11-08'},
  {id:'conveyor-005',code:'CV-005',name:'중량물 출고 체인 라인',location:conveyorLocationOptions[3].value,type:'chain',status:'running',owner:'정수빈',installedAt:'2024-08-07',description:'중량 화물을 출고 대기 구역까지 운반하는 체인 구동 설비입니다.',units:units('cv005','chain',4),lastInspectedAt:'2026-11-01',nextInspectionAt:'2026-11-15'},
  {id:'conveyor-006',code:'CV-006',name:'출고 검수 보조 라인',location:conveyorLocationOptions[3].value,type:'belt',status:'stopped',owner:'김민수',installedAt:'2025-06-09',description:'출고 전 최종 검수가 필요한 상품을 별도 작업 구간으로 분기합니다.',units:units('cv006','belt',2),lastInspectedAt:'2026-11-03',nextInspectionAt:'2026-11-17'},
];

export function createConveyorDraft():ConveyorDraft {
  return {code:'',name:'',location:'',type:'belt',status:'stopped',owner:'',installedAt:'',description:'',
    units:[{id:'draft-unit-1',name:'직선 유닛 01',kind:'straight',length:3000,width:800,drive:'motor'}]};
}
export type ConveyorBasicErrors = Partial<Record<'code'|'name'|'location'|'type'|'owner'|'installedAt',string>>;
export function validateConveyorBasics(draft:ConveyorDraft,existingCodes:readonly string[]):ConveyorBasicErrors {
  const errors:ConveyorBasicErrors = {};
  const code=draft.code.trim().toUpperCase();
  if(!code)errors.code='설비 코드를 입력해주세요.';
  else if(!/^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(code))errors.code='영문·숫자·하이픈·밑줄로 3~24자 입력해주세요.';
  else if(existingCodes.some(value=>value.trim().toUpperCase()===code))errors.code='이미 사용 중인 설비 코드입니다.';
  if(!draft.name.trim())errors.name='설비 이름을 입력해주세요.';
  else if(draft.name.trim().length>60)errors.name='설비 이름은 60자 이내로 입력해주세요.';
  if(!conveyorLocationOptions.some(option=>option.value===draft.location))errors.location='설치 위치를 선택해주세요.';
  if(!Object.prototype.hasOwnProperty.call(conveyorTypeLabels,draft.type))errors.type='설비 유형을 선택해주세요.';
  if(!conveyorOwnerOptions.some(option=>option.value===draft.owner))errors.owner='담당자를 선택해주세요.';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(draft.installedAt)?new Date(`${draft.installedAt}T00:00:00Z`):null;
  if(!date||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==draft.installedAt||draft.installedAt<'2000-01-01'||draft.installedAt>'2100-12-31')errors.installedAt='올바른 설치일을 선택해주세요.';
  return errors;
}
export type ConveyorUnitErrors = Record<string,Partial<Record<'name'|'kind'|'length'|'width'|'drive',string>>>;
export function validateConveyorUnits(items:readonly ConveyorUnit[]):ConveyorUnitErrors {
  const errors:ConveyorUnitErrors = {};
  for(const item of items){
    const invalid:ConveyorUnitErrors[string]={};
    const name=item.name.trim();
    if(!name)invalid.name='유닛 이름을 입력해주세요.';
    else if(items.some(other=>other.id!==item.id&&other.name.trim().normalize('NFC').toLocaleLowerCase()===name.normalize('NFC').toLocaleLowerCase()))invalid.name='유닛 이름은 서로 다르게 입력해주세요.';
    if(!Object.prototype.hasOwnProperty.call(conveyorUnitKindLabels,item.kind))invalid.kind='유닛 유형을 선택해주세요.';
    if(!Number.isInteger(item.length)||item.length<100||item.length>20000)invalid.length='길이는 100~20,000mm의 정수로 입력해주세요.';
    if(!Number.isInteger(item.width)||item.width<100||item.width>3000)invalid.width='폭은 100~3,000mm의 정수로 입력해주세요.';
    if(!Object.prototype.hasOwnProperty.call(conveyorDriveLabels,item.drive))invalid.drive='구동 방식을 선택해주세요.';
    if(Object.keys(invalid).length)errors[item.id]=invalid;
  }
  return errors;
}
