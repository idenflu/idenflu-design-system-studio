import * as React from 'react';
import { Avatar, Badge, Button, DatePicker, Dialog, DialogBody, DialogFooter, DialogHeader, Drawer, DrawerBody, DrawerFooter, DrawerHeader, Grid, Icon, IconButton, Select, TextArea, TextField, TimePicker } from '@idenflu/mono-react';
import { conveyorOwnerOptions, type Conveyor } from './layout-conveyor-data';
import { inspectionDurationOptions, inspectionEndTime, inspectionKindLabels, inspectionStatusLabels, inspectionStatusVariant, validateInspection, type Inspection, type InspectionDraft, type InspectionErrors } from './layout-inspection-data';

const fieldOrder: (keyof InspectionDraft)[] = ['title','conveyorId','kind','date','startTime','durationMinutes','owner','status','notes','result'];
const dateText = (date: string) => new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`));

export function InspectionEditor({open,initial,editingId,conveyors,inspections,onSave,onClose}: {
  open:boolean;
  initial:InspectionDraft;
  editingId?:string;
  conveyors:Conveyor[];
  inspections:Inspection[];
  onSave:(draft:InspectionDraft)=>void;
  onClose:()=>void;
}) {
  const [draft,setDraft]=React.useState<InspectionDraft>(initial);
  const [errors,setErrors]=React.useState<InspectionErrors>({});
  const [message,setMessage]=React.useState('');
  const [saving,setSaving]=React.useState(false);
  const savingRef=React.useRef(false);
  const form=React.useRef<HTMLFormElement>(null);
  const firstInput=React.useRef<HTMLInputElement>(null);
  const fields=React.useRef<Partial<Record<keyof InspectionDraft,HTMLElement|null>>>({});
  const id=React.useId();
  const title=editingId?'점검 일정 수정':'점검 일정 등록';
  const selectedConveyor=conveyors.find(item=>item.id===draft.conveyorId);
  const change=<K extends keyof InspectionDraft>(key:K,value:InspectionDraft[K])=>{
    setDraft(current=>({...current,[key]:value}));
    setErrors(current=>({...current,[key]:undefined}));
    setMessage('');
  };
  const submit=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(savingRef.current)return;
    const nextErrors=validateInspection(draft,conveyors,inspections,editingId);
    setErrors(nextErrors);
    const invalid=fieldOrder.find(key=>nextErrors[key]);
    if(invalid){
      setMessage('필수 정보와 입력한 점검 일정을 확인해주세요.');
      requestAnimationFrame(()=>fields.current[invalid]?.focus());
      return;
    }
    // A picker can hold invalid typed text while its last committed value stays valid.
    if(form.current?.checkValidity()===false){
      setMessage('날짜와 시간의 형식을 확인해주세요.');
      form.current.querySelector<HTMLElement>(':invalid')?.focus();
      return;
    }
    savingRef.current=true;
    setSaving(true);
    try{
      onSave({...draft,title:draft.title.trim(),notes:draft.notes.trim(),result:draft.result.trim()});
    }catch{
      savingRef.current=false;
      setSaving(false);
      setMessage('일정을 저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해주세요.');
    }
  };
  return <Dialog open={open} onOpenChange={value=>{if(!value)onClose();}} variant="divided" className="inspection-editor" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} initialFocusRef={firstInput} closeOnBackdrop>
    <DialogHeader><div><h2 id={`${id}-title`}>{title}</h2><p id={`${id}-description`}>점검할 설비와 시간을 정하고 담당자를 지정하세요.</p></div><IconButton label="점검 일정 편집 닫기" tooltip={false} onClick={onClose}><Icon name="close"/></IconButton></DialogHeader>
    <DialogBody>
      <form ref={form} id={`${id}-form`} className="inspection-editor-form" noValidate onSubmit={submit}>
        {message&&<p className="inspection-editor-error" role="alert"><Icon name="error-circle"/>{message}</p>}
        <TextField ref={node=>{firstInput.current=node;fields.current.title=node;}} label="점검 이름" name="inspection-title" value={draft.title} onChange={event=>change('title',event.target.value)} required maxLength={60} error={errors.title} placeholder="예: 구동부 정기 점검"/>
        <Select ref={node=>{fields.current.conveyorId=node;}} label="대상 설비" name="inspection-conveyor" value={draft.conveyorId} onValueChange={value=>{
          setDraft(current=>({...current,conveyorId:value,owner:conveyors.find(item=>item.id===value)?.owner??current.owner}));
          setErrors(current=>({...current,conveyorId:undefined,owner:undefined,startTime:undefined}));
          setMessage('');
        }} options={conveyors.map(item=>({value:item.id,label:`${item.code} · ${item.name}`}))} placeholder="컨베이어 선택" required error={errors.conveyorId} helperText={selectedConveyor?.location} popupStrategy="fixed"/>
        <Grid columns={{base:1,sm:2}} gap={5}>
          <Select ref={node=>{fields.current.kind=node;}} label="점검 유형" name="inspection-kind" value={draft.kind} onValueChange={value=>change('kind',value as InspectionDraft['kind'])} options={Object.entries(inspectionKindLabels).map(([value,label])=>({value,label}))} required error={errors.kind} popupStrategy="fixed"/>
          <DatePicker ref={node=>{fields.current.date=node;}} label="점검일" name="inspection-date" value={draft.date||null} onValueChange={value=>{change('date',value??'');setErrors(current=>({...current,startTime:undefined}));}} min="2000-01-01" max="2100-12-31" required error={errors.date}/>
          <TimePicker ref={node=>{fields.current.startTime=node;}} label="시작 시간" name="inspection-time" value={draft.startTime||null} onValueChange={value=>change('startTime',value??'')} minuteStep={1} required error={errors.startTime}/>
          <Select ref={node=>{fields.current.durationMinutes=node;}} label="소요 시간" name="inspection-duration" value={String(draft.durationMinutes)} onValueChange={value=>{change('durationMinutes',Number(value));setErrors(current=>({...current,startTime:undefined}));}} options={inspectionDurationOptions} required error={errors.durationMinutes} popupStrategy="fixed"/>
          <Select ref={node=>{fields.current.owner=node;}} label="담당자" name="inspection-owner" value={draft.owner} onValueChange={value=>change('owner',value)} options={conveyorOwnerOptions} placeholder="담당자 선택" required error={errors.owner} popupStrategy="fixed"/>
          <Select ref={node=>{fields.current.status=node;}} label="진행 상태" name="inspection-status" value={draft.status} onValueChange={value=>{change('status',value as InspectionDraft['status']);setErrors(current=>({...current,result:undefined,startTime:undefined}));}} options={Object.entries(inspectionStatusLabels).map(([value,label])=>({value,label}))} required error={errors.status} popupStrategy="fixed"/>
        </Grid>
        <p className="inspection-editor-help"><Icon name="clock"/>같은 설비의 점검 시간은 겹치지 않게 등록해주세요.</p>
        <TextArea ref={node=>{fields.current.notes=node;}} label="점검 메모" name="inspection-notes" rows={3} value={draft.notes} onChange={event=>change('notes',event.target.value)} maxLength={500} error={errors.notes} placeholder="점검할 부위나 작업 전 확인할 내용을 적어주세요." helperText="선택 입력 · 최대 500자"/>
        <TextArea ref={node=>{fields.current.result=node;}} label="점검 결과" name="inspection-result" rows={3} value={draft.result} onChange={event=>change('result',event.target.value)} required={draft.status==='completed'} maxLength={1000} error={errors.result} placeholder="점검 결과와 조치 내용을 적어주세요." helperText={draft.status==='completed'?'완료한 점검의 결과를 입력해주세요. · 최대 1,000자':'점검 완료 후 결과를 기록할 수 있습니다. · 최대 1,000자'}/>
      </form>
    </DialogBody>
    <DialogFooter><Button variant="outline" onClick={onClose} disabled={saving}>취소</Button><Button type="submit" form={`${id}-form`} disabled={saving}><Icon name="save"/>{editingId?'변경사항 저장':'일정 등록'}</Button></DialogFooter>
  </Dialog>;
}

export function InspectionDetail({inspection,conveyors,onClose,onEdit,onViewConveyor}: {
  inspection:Inspection|null;
  conveyors:Conveyor[];
  onClose:()=>void;
  onEdit:()=>void;
  onViewConveyor:(id:string)=>void;
}) {
  const closeButton=React.useRef<HTMLButtonElement>(null);
  const conveyor=conveyors.find(item=>item.id===inspection?.conveyorId);
  return <Drawer open={inspection!==null} onOpenChange={open=>{if(!open)onClose();}} variant="divided" size="lg" className="inspection-detail" aria-label="점검 일정 상세" initialFocusRef={closeButton}>
    <DrawerHeader><div><span className="inspection-detail-eyebrow">INSPECTION SCHEDULE</span><h2>{inspection?.title??'점검 일정 상세'}</h2></div><IconButton ref={closeButton} label="점검 일정 상세 닫기" tooltip={false} onClick={onClose}><Icon name="close"/></IconButton></DrawerHeader>
    <DrawerBody>{inspection&&<div className="inspection-detail-content">
      <div className="inspection-detail-status"><Badge variant={inspectionStatusVariant(inspection.status)}>{inspectionStatusLabels[inspection.status]}</Badge><span>{inspectionKindLabels[inspection.kind]}</span></div>
      <section className="inspection-detail-time" aria-label="점검 시간"><Icon name="calendar"/><div><strong>{dateText(inspection.date)}</strong><p>{inspection.startTime} – {inspectionEndTime(inspection)} <span>· {inspection.durationMinutes}분</span></p></div></section>
      <section><div className="inspection-detail-section-title"><h3>대상 설비</h3>{conveyor&&<Button variant="ghost" size="sm" onClick={()=>onViewConveyor(conveyor.id)}>설비 상세 보기<Icon name="arrow-right"/></Button>}</div>
        {conveyor?<div className="inspection-detail-equipment"><span>{conveyor.code}</span><h4>{conveyor.name}</h4><p><Icon name="location"/>{conveyor.location}</p><dl><div><dt>구성 유닛</dt><dd>{conveyor.units.length}개</dd></div><div><dt>점검 담당</dt><dd><Avatar size="sm" variant="neutral" shape="circle">{inspection.owner.slice(0,1)}</Avatar>{inspection.owner}</dd></div></dl></div>:<p className="inspection-detail-empty">대상 설비를 찾을 수 없습니다.</p>}
      </section>
      <section><h3>점검 메모</h3><p className={inspection.notes?'inspection-detail-notes':'inspection-detail-empty'}>{inspection.notes||'등록된 점검 메모가 없습니다.'}</p></section>
      <section><div className="inspection-detail-section-title"><h3>점검 결과</h3>{inspection.status==='completed'&&<Badge variant="success"><Icon name="check"/>점검 완료</Badge>}</div><p className={inspection.result?'inspection-detail-notes':'inspection-detail-empty'}>{inspection.result||(inspection.status==='cancelled'?'취소된 점검 일정입니다.':'점검을 완료한 뒤 일정 수정에서 결과를 기록해주세요.')}</p></section>
    </div>}</DrawerBody>
    <DrawerFooter><Button variant="outline" onClick={onClose}>닫기</Button><Button onClick={onEdit}><Icon name="edit"/>일정 수정</Button></DrawerFooter>
  </Drawer>;
}
