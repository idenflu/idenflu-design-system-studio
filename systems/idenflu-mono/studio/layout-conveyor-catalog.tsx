import * as React from 'react';
import { Avatar, Badge, Button, Card, Drawer, DrawerBody, DrawerFooter, DrawerHeader, Grid, Icon, IconButton, PageHeader, Select, TextField } from '@idenflu/mono-react';
import { conveyorStatusLabels as statusLabels, conveyorTypeLabels as typeLabels, conveyorUnitKindLabels as kindLabels, conveyorDriveLabels as driveLabels, conveyorStatusVariant as statusVariant, type Conveyor, type ConveyorStatus, type ConveyorType, type ConveyorUnit } from './layout-conveyor-data';
const totalLength = (conveyor:Conveyor) => conveyor.units.reduce((sum,unit)=>sum+unit.length,0);
const meters = (length:number) => (length/1000).toLocaleString('ko-KR',{maximumFractionDigits:1});
const displayDate = (value:string|null) => value ? value.replace(/-/g,'.') : '미정';

/** A small code-native equipment drawing; it represents the conveyor type, not a live signal. */
function ConveyorDrawing({type,status}: {type:ConveyorType;status:ConveyorStatus}) {
  return <svg className="cv-catalog-drawing" data-status={status} viewBox="0 0 360 140" aria-hidden="true" focusable="false">
    <path className="cv-art-ground" d="M22 119H338" />
    <path className="cv-art-frame" d="M55 76V113M75 78V113M260 76V113M280 78V113M55 108H75M260 108H280" />
    <path className="cv-art-belt" d="M42 56 74 34H304L274 56Z" />
    <path className="cv-art-side" d="M42 56H274V78H42ZM274 56 304 34V56L274 78Z" />
    <path className="cv-art-outline" d="M42 56 74 34H304V56L274 78H42V56ZM42 56H274L304 34M274 56V78" />
    {type === 'roller' ? Array.from({length:13},(_,index)=><path className="cv-art-roller" key={index} d={`M${57+index*17} 54l27-18`} />)
      : type === 'chain' ? <><path className="cv-art-chain" d="M56 49H280M64 42H290" /><path className="cv-art-guide" d="M75 36V54M103 36V54M131 36V54M159 36V54M187 36V54M215 36V54M243 36V54M271 36V54" /></>
      : <><path className="cv-art-guide" d="M83 39H267M67 50H282" /><path className="cv-art-flow" d="M145 44H206M198 39l8 5-8 5" /></>}
    <path className="cv-art-motor" d="M279 71h15v17h-15ZM294 75h10v9h-10ZM286 88v10" />
    <path className="cv-art-outline" d="M47 65H269M282 61l15-11" />
    <circle className="cv-art-status" cx="53" cy="66" r="2.5" />
  </svg>;
}

function ConveyorUnits({units}: {units:ConveyorUnit[]}) {
  return <ol className="cv-detail-units" aria-label="하위 유닛">
    {units.map((unit,index)=><li key={unit.id}>
      <span className="cv-detail-unit-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
      <div><div className="cv-detail-unit-title"><h4>{unit.name}</h4><Badge>{kindLabels[unit.kind]}</Badge></div>
        <p>길이 {unit.length.toLocaleString('ko-KR')} mm <span aria-hidden="true">·</span> 폭 {unit.width.toLocaleString('ko-KR')} mm</p>
        <small>{driveLabels[unit.drive]}</small>
      </div>
    </li>)}
  </ol>;
}

export function ConveyorCatalogPage({conveyors,onCreate,selectedId,onSelect,resetKey=0,onInspections}: {
  conveyors:Conveyor[];
  onCreate:()=>void;
  selectedId:string|null;
  onSelect:(id:string|null)=>void;
  resetKey?:number;
  onInspections?:(id:string)=>void;
}) {
  const [query,setQuery]=React.useState('');
  const [status,setStatus]=React.useState('all');
  const selected=conveyors.find(item=>item.id===selectedId)??null;
  const closeButton=React.useRef<HTMLButtonElement>(null);
  const detailButtons=React.useRef(new Map<string,HTMLButtonElement>());
  const previousSelectedId=React.useRef(selectedId);
  React.useLayoutEffect(()=>{setQuery('');setStatus('all');},[resetKey]);
  React.useLayoutEffect(()=>{
    const previous=previousSelectedId.current;
    previousSelectedId.current=selectedId;
    if(previous&&!selectedId){const trigger=detailButtons.current.get(previous);if(trigger?.getClientRects().length)trigger.focus({preventScroll:true});}
  },[selectedId]);
  const needle=query.trim().toLocaleLowerCase();
  const visible=conveyors.filter(item=>(status==='all'||item.status===status)&&(!needle||`${item.code} ${item.name} ${item.location}`.toLocaleLowerCase().includes(needle)));
  const hasFilters=!!needle||status!=='all';
  return <>
    <PageHeader className="layout-page-heading" title="컨베이어" eyebrow="EQUIPMENT MANAGEMENT" description="설비의 가동 상태와 구성을 확인하고 새로운 컨베이어를 등록하세요."
      actions={<Button onClick={onCreate}><Icon name="add" />새 컨베이어</Button>} />
    <section className="cv-catalog-summary" aria-label="컨베이어 현황">
      <span>전체 <strong>{conveyors.length}</strong></span>
      {(['running','stopped','maintenance'] as const).map(value=><span key={value}><i className="cv-catalog-state-dot" data-status={value} aria-hidden="true" />{statusLabels[value]} <strong>{conveyors.filter(item=>item.status===value).length}</strong></span>)}
    </section>
    <div className="cv-catalog-toolbar">
      <TextField label="컨베이어 검색" hideLabel type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="이름, 코드 또는 위치 검색" prefix={<Icon name="search" />} prefixDecorative />
      <Select label="가동 상태" hideLabel value={status} onValueChange={setStatus} popupStrategy="fixed" options={[{value:'all',label:'전체 상태'},...Object.entries(statusLabels).map(([value,label])=>({value,label}))]} />
      <p role="status">{hasFilters?`검색 결과 ${visible.length}개`:`${visible.length}개 설비`}</p>
    </div>
    {visible.length ? <Grid columns={{base:1,sm:2,xl:3}} gap={5} className="cv-catalog-grid">
      {visible.map(conveyor=><Card key={conveyor.id} className="cv-catalog-card" data-conveyor-id={conveyor.id} aria-labelledby={`cv-title-${conveyor.id}`}>
        <div className="cv-catalog-card-top"><span>{conveyor.code}</span><Badge variant={statusVariant(conveyor.status)}>{statusLabels[conveyor.status]}</Badge></div>
        <div className="cv-catalog-art"><span>{typeLabels[conveyor.type]}</span><ConveyorDrawing type={conveyor.type} status={conveyor.status} /></div>
        <div className="cv-catalog-card-body"><h2 id={`cv-title-${conveyor.id}`}>{conveyor.name}</h2><p className="cv-catalog-location"><Icon name="location" />{conveyor.location}</p>
          <dl className="cv-catalog-metrics"><div><dt>구성 유닛</dt><dd>{conveyor.units.length}<small>개</small></dd></div><div><dt>전체 길이</dt><dd>{meters(totalLength(conveyor))}<small>m</small></dd></div></dl>
        </div>
        <footer className="cv-catalog-card-footer"><span><Avatar size="sm" shape="circle" variant="neutral">{conveyor.owner.slice(0,1)}</Avatar>{conveyor.owner}</span><Button ref={node=>{if(node)detailButtons.current.set(conveyor.id,node);else detailButtons.current.delete(conveyor.id);}} variant="ghost" size="sm" aria-label={`${conveyor.name} 상세 보기`} onClick={()=>onSelect(conveyor.id)}>상세 보기<Icon name="arrow-right" /></Button></footer>
      </Card>)}
    </Grid> : <div className="cv-catalog-empty"><Icon name="search" /><h2>{hasFilters?'검색 결과가 없습니다':'등록된 컨베이어가 없습니다'}</h2><p>{hasFilters?'다른 검색어나 가동 상태로 다시 찾아보세요.':'컨베이어를 등록하고 하위 유닛을 구성해보세요.'}</p><Button variant="outline" onClick={hasFilters?()=>{setQuery('');setStatus('all');}:onCreate}>{hasFilters?'검색 초기화':'새 컨베이어'}</Button></div>}
    <Drawer open={selected!==null} onOpenChange={open=>{if(!open)onSelect(null);}} variant="divided" size="lg" aria-label="컨베이어 상세" className="cv-detail-drawer" initialFocusRef={closeButton}>
      <DrawerHeader><div><span className="cv-detail-code">{selected?.code}</span><h2>{selected?.name??'컨베이어 상세'}</h2></div><IconButton ref={closeButton} variant="ghost" label="컨베이어 상세 닫기" tooltip={false} onClick={()=>onSelect(null)}><Icon name="close" /></IconButton></DrawerHeader>
      <DrawerBody>{selected&&<div className="cv-detail-content">
        <div className="cv-detail-status"><Badge variant={statusVariant(selected.status)}>{statusLabels[selected.status]}</Badge><span>{typeLabels[selected.type]}</span></div>
        <div className="cv-detail-art"><ConveyorDrawing type={selected.type} status={selected.status} /></div>
        <section><h3>기본 정보</h3><dl className="cv-detail-properties"><div><dt>설비 코드</dt><dd>{selected.code}</dd></div><div><dt>설치 위치</dt><dd>{selected.location}</dd></div><div><dt>관리 담당</dt><dd>{selected.owner}</dd></div><div><dt>설치일</dt><dd>{displayDate(selected.installedAt)}</dd></div><div><dt>전체 길이</dt><dd>{meters(totalLength(selected))} m</dd></div><div><dt>구성 유닛</dt><dd>{selected.units.length}개</dd></div></dl>{selected.description&&<p className="cv-detail-description">{selected.description}</p>}</section>
        <section><div className="cv-detail-section-title"><h3>하위 유닛</h3><span>{selected.units.length}개</span></div><p className="cv-detail-help">컨베이어를 구성하는 순서대로 표시합니다.</p><div className="cv-detail-flow" aria-hidden="true">{selected.units.map((unit,index)=><React.Fragment key={unit.id}>{index>0&&<Icon name="arrow-right" />}<span>{String(index+1).padStart(2,'0')}<small>{kindLabels[unit.kind]}</small></span></React.Fragment>)}</div><ConveyorUnits units={selected.units} /></section>
        <section><div className="cv-detail-section-title"><h3>점검 일정</h3>{onInspections&&<Button variant="ghost" size="sm" onClick={()=>onInspections(selected.id)}>점검 일정 보기<Icon name="arrow-right"/></Button>}</div><dl className="cv-detail-properties"><div><dt>최근 점검</dt><dd>{displayDate(selected.lastInspectedAt)}</dd></div><div><dt>다음 점검</dt><dd>{displayDate(selected.nextInspectionAt)}</dd></div></dl></section>
      </div>}</DrawerBody>
      <DrawerFooter><Button variant="outline" onClick={()=>onSelect(null)}>닫기</Button></DrawerFooter>
    </Drawer>
  </>;
}
