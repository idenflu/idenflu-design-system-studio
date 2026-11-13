import * as React from 'react';
import { Badge, Button, DatePicker, Dialog, DialogBody, DialogFooter, DialogHeader, Grid, Icon, NumberField, PageHeader, Select, Stepper, TextArea, TextField } from '@idenflu/mono-react';
import {
  conveyorDriveLabels, conveyorDriveOptions, conveyorLocationOptions, conveyorOwnerOptions,
  conveyorStatusLabels, conveyorStatusVariant, conveyorTypeLabels, conveyorTypeOptions,
  conveyorUnitKindLabels, conveyorUnitKindOptions, createConveyorDraft,
  validateConveyorBasics, validateConveyorUnits,
  type ConveyorBasicErrors, type ConveyorDraft, type ConveyorUnit, type ConveyorUnitErrors,
} from './layout-conveyor-data';

const steps = ['기본정보','하위 유닛','최종 검토'];
const basicOrder = ['code','name','location','type','owner','installedAt'] as const;
const unitOrder = ['name','kind','length','width','drive'] as const;
const lengthText = (units:readonly ConveyorUnit[]) => `${(units.reduce((total,item)=>total+item.length,0)/1000).toLocaleString('ko-KR',{maximumFractionDigits:1})}m`;

export function ConveyorRegistrationPage({active=true,existingCodes,onCreate,onCancel}: {
  active?:boolean;existingCodes:readonly string[];onCreate:(draft:ConveyorDraft)=>void;onCancel:()=>void;
}) {
  const initial=React.useRef(createConveyorDraft());
  const [draft,setDraft]=React.useState<ConveyorDraft>(initial.current);
  const [step,setStep]=React.useState(0);
  const [basicErrors,setBasicErrors]=React.useState<ConveyorBasicErrors>({});
  const [unitErrors,setUnitErrors]=React.useState<ConveyorUnitErrors>({});
  const [message,setMessage]=React.useState('');
  const [cancelOpen,setCancelOpen]=React.useState(false);
  const [submitting,setSubmitting]=React.useState(false);
  const submittingRef=React.useRef(false),unitSequence=React.useRef(1),firstStep=React.useRef(true);
  const form=React.useRef<HTMLFormElement>(null),stepHeading=React.useRef<HTMLHeadingElement>(null);
  const basicRefs=React.useRef<Record<string,HTMLElement|null>>({});
  const unitRefs=React.useRef<Record<string,HTMLElement|null>>({});
  const id=React.useId();
  const dirty=JSON.stringify(draft)!==JSON.stringify(initial.current);
  React.useEffect(()=>{if(!active)setCancelOpen(false);},[active]);

  React.useEffect(()=>{
    if(firstStep.current){firstStep.current=false;return;}
    stepHeading.current?.focus({preventScroll:true});
    stepHeading.current?.scrollIntoView({block:'nearest'});
  },[step]);

  const changeBasic=<K extends keyof ConveyorDraft>(key:K,value:ConveyorDraft[K])=>{
    setDraft(current=>({...current,[key]:value}));
    setBasicErrors(current=>({...current,[key]:undefined}));
    setMessage('');
  };
  const changeUnit=<K extends keyof ConveyorUnit>(unitId:string,key:K,value:ConveyorUnit[K])=>{
    setDraft(current=>({...current,units:current.units.map(unit=>unit.id===unitId?{...unit,[key]:value}:unit)}));
    setUnitErrors(current=>({...current,[unitId]:{...current[unitId],[key]:undefined}}));
    setMessage('');
  };
  const requestCancel=()=>{
    if(submittingRef.current)return;
    const dateInput=basicRefs.current.installedAt as HTMLInputElement|null;
    const pendingDate=Boolean(dateInput&&dateInput.value.trim()!==draft.installedAt);
    if(dirty||pendingDate)setCancelOpen(true);else onCancel();
  };
  const changeStep=(next:number)=>{setMessage('');setStep(next);};
  const checkNative=()=>{
    if(form.current?.checkValidity()!==false)return true;
    const nativeInvalid=form.current?.querySelector<HTMLElement>(':invalid');
    if(!nativeInvalid)return true;
    setMessage('입력한 값의 형식과 허용 범위를 확인해주세요.');
    nativeInvalid.focus();
    return false;
  };
  const checkBasics=()=>{
    const errors=validateConveyorBasics(draft,existingCodes);
    setBasicErrors(errors);
    const key=basicOrder.find(field=>errors[field]);
    if(!key)return true;
    setMessage('필수 정보와 설비 코드를 확인해주세요.');
    if(step!==0)setStep(0);
    requestAnimationFrame(()=>basicRefs.current[key]?.focus());
    return false;
  };
  const checkUnits=()=>{
    if(!draft.units.length){setMessage('하위 유닛을 한 개 이상 추가해주세요.');setStep(1);return false;}
    const errors=validateConveyorUnits(draft.units);
    setUnitErrors(errors);
    for(const unit of draft.units){
      const key=unitOrder.find(field=>errors[unit.id]?.[field]);
      if(key){setMessage('하위 유닛의 이름과 규격을 확인해주세요.');if(step!==1)setStep(1);requestAnimationFrame(()=>unitRefs.current[`${unit.id}:${key}`]?.focus());return false;}
    }
    return true;
  };
  const next=()=>{
    if(step===0){if(checkBasics()&&checkNative())changeStep(1);}
    else if(step===1){if(checkUnits()&&checkNative())changeStep(2);}
    else {
      if(submittingRef.current||!checkBasics()||!checkUnits())return;
      submittingRef.current=true;setSubmitting(true);
      try{
        onCreate({...draft,code:draft.code.trim().toUpperCase(),name:draft.name.trim(),description:draft.description.trim(),units:draft.units.map(unit=>({...unit,name:unit.name.trim()}))});
      }catch{
        submittingRef.current=false;setSubmitting(false);setMessage('등록하지 못했습니다. 입력 내용을 확인하고 다시 시도해주세요.');
      }
    }
  };
  const addUnit=()=>{
    const number=++unitSequence.current;
    const unit:ConveyorUnit={id:`draft-unit-${number}`,name:`직선 유닛 ${String(number).padStart(2,'0')}`,kind:'straight',length:3000,width:800,drive:'motor'};
    setDraft(current=>({...current,units:[...current.units,unit]}));
    setMessage('');
    requestAnimationFrame(()=>unitRefs.current[`${unit.id}:name`]?.focus());
  };
  const removeUnit=(unitId:string,index:number)=>{
    if(draft.units.length<=1)return;
    const nextUnits=draft.units.filter(unit=>unit.id!==unitId);
    setDraft(current=>({...current,units:nextUnits}));
    setUnitErrors(current=>{const nextErrors={...current};delete nextErrors[unitId];return nextErrors;});
    const target=nextUnits[Math.min(index,nextUnits.length-1)];
    requestAnimationFrame(()=>unitRefs.current[`${target.id}:name`]?.focus());
  };

  return <>
    <PageHeader className="layout-page-heading" eyebrow="EQUIPMENT MANAGEMENT" title="컨베이어 등록" description="기본정보와 하위 유닛을 입력한 뒤 등록 내용을 확인하세요." actions={<Button variant="outline" onClick={requestCancel}><Icon name="arrow-left"/>목록으로</Button>}/>
    <div className="cv-registration">
      <Stepper className="cv-registration-stepper" steps={steps} currentStep={step} aria-label="컨베이어 등록 단계"/>
      <form ref={form} className="cv-registration-form" noValidate onSubmit={event=>{event.preventDefault();next();}}>
        <div className="cv-registration-main">
          <section className="cv-registration-panel" aria-labelledby={`${id}-step-heading`}>
            <header className="cv-registration-heading"><div><span>STEP {String(step+1).padStart(2,'0')} / 03</span><h2 id={`${id}-step-heading`} ref={stepHeading} tabIndex={-1}>{steps[step]}</h2><p>{step===0?'설비를 식별할 정보와 설치 위치를 입력하세요.':step===1?'실제 이송 구간을 구성하는 조각 단위로 유닛을 추가하세요.':'설비와 하위 유닛의 정보를 확인하고 등록하세요.'}</p></div>{step===1&&<Badge>{draft.units.length}개 유닛</Badge>}</header>
            {message&&<p role="alert" className="cv-registration-error"><Icon name="error-circle"/>{message}</p>}
            {step===0&&<div className="cv-registration-fields">
              <Grid columns={{base:1,sm:2}} gap={6}>
                <TextField ref={node=>{basicRefs.current.code=node;}} label="설비 코드" name="code" value={draft.code} onChange={event=>changeBasic('code',event.target.value)} error={basicErrors.code} required maxLength={24} placeholder="예: CV-007" helperText="영문·숫자·하이픈·밑줄, 3~24자" autoComplete="off"/>
                <TextField ref={node=>{basicRefs.current.name=node;}} label="설비 이름" name="name" value={draft.name} onChange={event=>changeBasic('name',event.target.value)} error={basicErrors.name} required maxLength={60} placeholder="예: 포장 구역 보조 컨베이어"/>
                <Select ref={node=>{basicRefs.current.location=node;}} label="설치 위치" name="location" options={conveyorLocationOptions} value={draft.location} onValueChange={value=>changeBasic('location',value)} error={basicErrors.location} required placeholder="설치 위치 선택" popupStrategy="fixed"/>
                <Select ref={node=>{basicRefs.current.type=node;}} label="설비 유형" name="type" options={conveyorTypeOptions} value={draft.type} onValueChange={value=>changeBasic('type',value as ConveyorDraft['type'])} error={basicErrors.type} required popupStrategy="fixed"/>
                <Select ref={node=>{basicRefs.current.owner=node;}} label="담당자" name="owner" options={conveyorOwnerOptions} value={draft.owner} onValueChange={value=>changeBasic('owner',value)} error={basicErrors.owner} required placeholder="담당자 선택" popupStrategy="fixed"/>
                <DatePicker ref={node=>{basicRefs.current.installedAt=node;}} label="설치일" name="installedAt" value={draft.installedAt||null} onValueChange={value=>changeBasic('installedAt',value??'')} min="2000-01-01" max="2100-12-31" error={basicErrors.installedAt} required/>
              </Grid>
              <TextArea label="설비 설명" name="description" rows={3} maxLength={500} value={draft.description} onChange={event=>changeBasic('description',event.target.value)} placeholder="설비의 용도와 관리 시 참고할 내용을 입력하세요." helperText="선택 입력 · 최대 500자"/>
              <div className="cv-registration-initial-status"><Icon name="info"/><p>새 설비는 <strong>정지</strong> 상태로 등록됩니다. 가동 전 유닛 구성과 설치 상태를 확인하세요.</p></div>
            </div>}
            {step===1&&<div className="cv-registration-unit-list">
              {draft.units.map((unit,index)=><section className="cv-registration-unit" key={unit.id} role="group" aria-label={`유닛 ${index+1}`}>
                <header><div><span className="cv-registration-unit-number">{String(index+1).padStart(2,'0')}</span><h3>{unit.name.trim()||`새 유닛 ${index+1}`}</h3></div><Button variant="ghost" size="sm" aria-label={`유닛 ${index+1} 삭제`} disabled={draft.units.length===1} onClick={()=>removeUnit(unit.id,index)}><Icon name="trash"/>삭제</Button></header>
                <Grid columns={{base:1,sm:2}} gap={5}>
                  <TextField ref={node=>{unitRefs.current[`${unit.id}:name`]=node;}} label="유닛 이름" name={`${unit.id}-name`} value={unit.name} onChange={event=>changeUnit(unit.id,'name',event.target.value)} maxLength={40} error={unitErrors[unit.id]?.name} required/>
                  <Select ref={node=>{unitRefs.current[`${unit.id}:kind`]=node;}} label="유닛 유형" name={`${unit.id}-kind`} value={unit.kind} options={conveyorUnitKindOptions} onValueChange={value=>changeUnit(unit.id,'kind',value as ConveyorUnit['kind'])} error={unitErrors[unit.id]?.kind} popupStrategy="fixed"/>
                  <NumberField ref={node=>{unitRefs.current[`${unit.id}:length`]=node;}} label="길이" name={`${unit.id}-length`} value={String(unit.length||'')} onValueChange={value=>changeUnit(unit.id,'length',Number(value)||0)} min="100" max="20000" step="100" unit="mm" error={unitErrors[unit.id]?.length} required/>
                  <NumberField ref={node=>{unitRefs.current[`${unit.id}:width`]=node;}} label="폭" name={`${unit.id}-width`} value={String(unit.width||'')} onValueChange={value=>changeUnit(unit.id,'width',Number(value)||0)} min="100" max="3000" step="100" unit="mm" error={unitErrors[unit.id]?.width} required/>
                  <Select ref={node=>{unitRefs.current[`${unit.id}:drive`]=node;}} label="구동 방식" name={`${unit.id}-drive`} value={unit.drive} options={conveyorDriveOptions} onValueChange={value=>changeUnit(unit.id,'drive',value as ConveyorUnit['drive'])} error={unitErrors[unit.id]?.drive} popupStrategy="fixed"/>
                </Grid>
              </section>)}
              <Button variant="outline" className="cv-registration-add" onClick={addUnit}><Icon name="add"/>유닛 추가</Button>
              <p className="component-helper">유닛은 한 개 이상 필요합니다. 길이와 폭은 mm 단위로 입력하세요.</p>
            </div>}
            {step===2&&<div className="cv-registration-review">
              <section><div className="cv-registration-review-title"><h3>설비 기본정보</h3><Button variant="ghost" size="sm" onClick={()=>changeStep(0)}>기본정보 수정<Icon name="edit"/></Button></div>
                <dl className="cv-registration-definition"><div><dt>설비 코드</dt><dd>{draft.code.trim().toUpperCase()}</dd></div><div><dt>설비 이름</dt><dd>{draft.name}</dd></div><div><dt>설치 위치</dt><dd>{draft.location}</dd></div><div><dt>설비 유형</dt><dd>{conveyorTypeLabels[draft.type]}</dd></div><div><dt>담당자</dt><dd>{draft.owner}</dd></div><div><dt>설치일</dt><dd>{draft.installedAt}</dd></div><div><dt>초기 상태</dt><dd><Badge variant={conveyorStatusVariant(draft.status)}>{conveyorStatusLabels[draft.status]}</Badge></dd></div></dl>
                {draft.description.trim()&&<div className="cv-registration-description"><h4>설비 설명</h4><p>{draft.description}</p></div>}
              </section>
              <section><div className="cv-registration-review-title"><h3>하위 유닛 <span>{draft.units.length}개</span></h3><Button variant="ghost" size="sm" onClick={()=>changeStep(1)}>하위 유닛 수정<Icon name="edit"/></Button></div>
                <ol className="cv-registration-review-units">{draft.units.map((unit,index)=><li key={unit.id}><span className="cv-registration-unit-number">{String(index+1).padStart(2,'0')}</span><div><strong>{unit.name}</strong><p>{conveyorUnitKindLabels[unit.kind]} · {unit.length.toLocaleString()} × {unit.width.toLocaleString()}mm · {conveyorDriveLabels[unit.drive]}</p></div></li>)}</ol>
              </section>
            </div>}
          </section>
          <aside className="cv-registration-summary" aria-label="등록 내용 요약">
            <div className="cv-registration-summary-icon"><Icon name="columns"/></div><span className="cv-registration-summary-kicker">NEW CONVEYOR</span><h2>{draft.name.trim()||'새 컨베이어'}</h2><p>{draft.code.trim().toUpperCase()||'설비 코드 입력 전'}</p>
            <dl><div><dt>설치 위치</dt><dd>{draft.location||'선택 전'}</dd></div><div><dt>설비 유형</dt><dd>{conveyorTypeLabels[draft.type]}</dd></div><div><dt>하위 유닛</dt><dd>{draft.units.length}개</dd></div><div><dt>총 이송 길이</dt><dd>{lengthText(draft.units)}</dd></div></dl>
            <div className="cv-registration-route" aria-hidden="true">{draft.units.map((unit,index)=><div key={unit.id}><span>{String(index+1).padStart(2,'0')}</span><div><i/>{conveyorUnitKindLabels[unit.kind]}</div></div>)}</div>
            <p className="component-helper">각 단계에서 입력한 내용을 확인하고, 마지막 단계에서 한 번에 등록합니다.</p>
          </aside>
        </div>
        <footer className="cv-registration-actions"><Button variant="ghost" onClick={requestCancel} disabled={submitting}>등록 취소</Button><div><span>{step+1} / 3 단계</span>{step>0&&<Button variant="outline" onClick={()=>changeStep(step-1)} disabled={submitting}><Icon name="arrow-left"/>이전 단계</Button>}<Button type="submit" disabled={submitting} aria-busy={submitting||undefined}>{step===2?<><Icon name="check"/>컨베이어 등록</>:<>다음 단계<Icon name="arrow-right"/></>}</Button></div></footer>
      </form>
    </div>
    <Dialog open={active&&cancelOpen} onOpenChange={setCancelOpen} variant="divided" aria-labelledby={`${id}-cancel-title`}>
      <DialogHeader><h2 id={`${id}-cancel-title`}>등록을 취소할까요?</h2><Button variant="ghost" iconOnly aria-label="확인 창 닫기" onClick={()=>setCancelOpen(false)}><Icon name="close"/></Button></DialogHeader>
      <DialogBody><p>입력한 기본정보와 유닛 구성이 저장되지 않습니다. 계속 작성하거나 등록을 취소할 수 있습니다.</p></DialogBody>
      <DialogFooter><Button variant="outline" onClick={()=>setCancelOpen(false)}>계속 작성</Button><Button variant="outline" color="danger" onClick={()=>{setCancelOpen(false);onCancel();}}>등록 취소</Button></DialogFooter>
    </Dialog>
  </>;
}
