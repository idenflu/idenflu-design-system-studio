import * as React from 'react';
import { Badge, Button, Icon, IconButton, PageHeader, Segmented, Select } from '@idenflu/mono-react';
import { type Conveyor } from './layout-conveyor-data';
import {
  addDays, createInspectionDraft, inspectionEndTime, inspectionStatusLabels,
  inspectionStatusVariant, localDateKey, monthDays, shiftMonth, startOfWeek, weekDays,
  type Inspection, type InspectionDraft,
} from './layout-inspection-data';
import { InspectionDetail, InspectionEditor } from './layout-inspection-dialogs';

const dateText = (key:string) => {
  const [year,month,day]=key.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
};
const shortDate = (key:string) => new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'long',timeZone:'UTC'}).format(new Date(`${key}T12:00:00Z`));
const sortInspections = (a:Inspection,b:Inspection) => a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime)||a.id.localeCompare(b.id);
type EditorState = {key:number;initial:InspectionDraft;id?:string};

export function InspectionCalendarPage({active=true,conveyors,inspections,request,onSave,onViewConveyor}: {
  active?:boolean;
  conveyors:Conveyor[];
  inspections:Inspection[];
  request?:{key:number;conveyorId:string};
  onSave:(draft:InspectionDraft,id?:string)=>Inspection;
  onViewConveyor:(id:string)=>void;
}) {
  const today=localDateKey();
  const [anchor,setAnchor]=React.useState(today);
  const [selectedDate,setSelectedDate]=React.useState(today);
  const [view,setView]=React.useState('month');
  const [conveyorFilter,setConveyorFilter]=React.useState('all');
  const [statusFilter,setStatusFilter]=React.useState('all');
  const [selectedId,setSelectedId]=React.useState<string|null>(null);
  const [editor,setEditor]=React.useState<EditorState|null>(null);
  const [announcement,setAnnouncement]=React.useState('');
  const sequence=React.useRef(0);
  const dayButtons=React.useRef(new Map<string,HTMLButtonElement>());
  const pendingDateFocus=React.useRef<string|null>(null);
  const eventTrigger=React.useRef<HTMLButtonElement|null>(null);
  const createButton=React.useRef<HTMLButtonElement>(null);
  const previousOverlay=React.useRef(false);
  const selected=inspections.find(item=>item.id===selectedId)??null;
  const days=view==='month'?monthDays(anchor):weekDays(anchor);
  const filtered=inspections.filter(item=>(conveyorFilter==='all'||item.conveyorId===conveyorFilter)&&(statusFilter==='all'||item.status===statusFilter)).sort(sortInspections);
  const dayItems=(date:string)=>filtered.filter(item=>item.date===date);
  const rangeItems=filtered.filter(item=>item.date>=days[0]&&item.date<=days[days.length-1]);
  const monthItems=filtered.filter(item=>item.date.slice(0,7)===anchor.slice(0,7));
  const countItems=view==='month'?monthItems:rangeItems;
  const [year,month]=anchor.split('-').map(Number);
  const periodLabel=view==='month'?`${year}년 ${month}월`:`${dateText(days[0])} – ${dateText(days[6])}`;
  const hasFilters=conveyorFilter!=='all'||statusFilter!=='all';

  React.useEffect(()=>{if(!active){setSelectedId(null);setEditor(null);}},[active]);
  React.useEffect(()=>{
    if(request){setConveyorFilter(request.conveyorId);setStatusFilter('all');setAnchor(today);setSelectedDate(today);}
  },[request]);
  React.useLayoutEffect(()=>{
    const date=pendingDateFocus.current;
    if(date){dayButtons.current.get(date)?.focus({preventScroll:true});pendingDateFocus.current=null;}
  },[selectedDate,anchor,view]);
  React.useLayoutEffect(()=>{
    const overlay=active&&Boolean(selected||editor);
    if(previousOverlay.current&&!overlay&&active){
      const trigger=eventTrigger.current;
      if(trigger?.isConnected&&trigger.getClientRects().length)trigger.focus({preventScroll:true});
      else (dayButtons.current.get(selectedDate)??createButton.current)?.focus({preventScroll:true});
    }
    previousOverlay.current=overlay;
  },[active,selected,editor,selectedDate]);

  const selectDate=(date:string,focus=false)=>{
    setSelectedDate(date);setAnchor(date);
    if(focus)pendingDateFocus.current=date;
  };
  const navigate=(direction:number)=>{
    const date=view==='month'?shiftMonth(anchor,direction):addDays(anchor,7*direction);
    setAnchor(date);setSelectedDate(date);
  };
  const onDayKey=(event:React.KeyboardEvent<HTMLButtonElement>,date:string)=>{
    let next:string|undefined;
    if(event.key==='ArrowLeft')next=addDays(date,-1);
    if(event.key==='ArrowRight')next=addDays(date,1);
    if(event.key==='ArrowUp')next=addDays(date,-7);
    if(event.key==='ArrowDown')next=addDays(date,7);
    if(event.key==='Home')next=startOfWeek(date);
    if(event.key==='End')next=addDays(startOfWeek(date),6);
    if(event.key==='PageUp')next=shiftMonth(date,-1);
    if(event.key==='PageDown')next=shiftMonth(date,1);
    if(next){event.preventDefault();selectDate(next,true);}
  };
  const openCreate=(date=selectedDate,trigger:HTMLButtonElement|null=createButton.current)=>{
    eventTrigger.current=trigger;
    setSelectedId(null);
    setEditor({key:++sequence.current,initial:createInspectionDraft(conveyors,date,conveyorFilter==='all'?undefined:conveyorFilter)});
  };
  const save=(draft:InspectionDraft)=>{
    const saved=onSave(draft,editor?.id);
    setEditor(null);setSelectedId(saved.id);setSelectedDate(saved.date);setAnchor(saved.date);
    setConveyorFilter('all');setStatusFilter('all');
    setAnnouncement(`${saved.title} 일정을 ${editor?.id?'변경':'등록'}했습니다.`);
  };
  const openDetail=(inspection:Inspection,trigger:HTMLButtonElement)=>{eventTrigger.current=trigger;setSelectedId(inspection.id);selectDate(inspection.date);};
  const eventButton=(item:Inspection,compact=false)=>{
    const conveyor=conveyors.find(value=>value.id===item.conveyorId);
    return <button key={item.id} type="button" className={`inspection-event${compact?' inspection-event--compact':''}`} data-status={item.status} data-inspection-id={item.id} data-date={item.date}
      aria-label={`${item.title}, ${dateText(item.date)} ${item.startTime}, ${conveyor?.name??'설비'}, ${inspectionStatusLabels[item.status]}`}
      onClick={event=>openDetail(item,event.currentTarget)}>
      <span className="inspection-event-time">{item.startTime}{!compact&&` – ${inspectionEndTime(item)}`}</span>
      <strong>{item.title}</strong><small>{conveyor?.code} {!compact&&conveyor?.name}</small>
    </button>;
  };
  const dayButton=(date:string,items:Inspection[])=>{
    const selected=selectedDate===date;
    return <button type="button" className="inspection-day-button" data-date={date} ref={node=>{if(node)dayButtons.current.set(date,node);else dayButtons.current.delete(date);}}
      aria-label={`${dateText(date)}, 일정 ${items.length}건`} aria-current={date===today?'date':undefined} aria-pressed={selected} tabIndex={selected?0:-1}
      onClick={()=>selectDate(date)} onKeyDown={event=>onDayKey(event,date)}>
      <span>{view==='week'?shortDate(date):Number(date.slice(-2))}</span>{date===today&&<small>오늘</small>}
      {view==='month'&&items.length>0&&<span className="inspection-mobile-count">{items.length}<span className="sr-only">건</span></span>}
    </button>;
  };

  return <>
    <PageHeader className="layout-page-heading" eyebrow="EQUIPMENT MANAGEMENT" title="점검 일정" description="설비의 점검 일정을 계획하고, 진행 상황과 완료 결과를 확인하세요."
      actions={<Button ref={createButton} onClick={()=>openCreate()} disabled={!conveyors.length}><Icon name="add"/>점검 일정 등록</Button>}/>
    <div className="inspection-calendar">
      <div className="inspection-toolbar">
        <div className="inspection-period-controls"><div><IconButton variant="outline" label="이전 기간" tooltip={false} onClick={()=>navigate(-1)}><Icon name="keyboard-arrow-left"/></IconButton><IconButton variant="outline" label="다음 기간" tooltip={false} onClick={()=>navigate(1)}><Icon name="keyboard-arrow-right"/></IconButton></div><h2 aria-live="polite">{periodLabel}</h2><Button variant="outline" onClick={()=>{setAnchor(today);setSelectedDate(today);}}>오늘</Button></div>
        <Segmented label="캘린더 보기" value={view} onValueChange={next=>{setView(next);setAnchor(selectedDate);}} options={[{value:'month',label:'월'},{value:'week',label:'주'}]}/>
      </div>
      <div className="inspection-filters">
        <Select label="대상 설비 필터" hideLabel value={conveyorFilter} onValueChange={setConveyorFilter} options={[{value:'all',label:'전체 설비'},...conveyors.map(item=>({value:item.id,label:`${item.code} · ${item.name}`}))]} popupStrategy="fixed"/>
        <Select label="진행 상태 필터" hideLabel value={statusFilter} onValueChange={setStatusFilter} options={[{value:'all',label:'전체 상태'},...Object.entries(inspectionStatusLabels).map(([value,label])=>({value,label}))]} popupStrategy="fixed"/>
        {hasFilters&&<Button variant="ghost" onClick={()=>{setConveyorFilter('all');setStatusFilter('all');}}><Icon name="refresh"/>필터 초기화</Button>}
        <p role="status">{view==='month'?'이번 달':'이번 주'} <strong>{countItems.length}</strong>건<span aria-hidden="true"> · </span>완료 <strong>{countItems.filter(item=>item.status==='completed').length}</strong>건</p>
      </div>
      <div className="inspection-layout" data-view={view}>
        <section className="inspection-calendar-panel" aria-label="점검 캘린더">
          <p className="sr-only">방향키로 날짜를 이동하고, Home·End로 한 주의 처음·끝, PageUp·PageDown으로 이전·다음 달을 선택합니다.</p>
          {view==='month'?<><div className="inspection-weekdays" aria-hidden="true">{['월','화','수','목','금','토','일'].map(day=><span key={day}>{day}</span>)}</div>
            <div className="inspection-month-grid">{days.map((date,index)=>{
              const items=dayItems(date);
              return <div key={date} className="inspection-month-day" data-selected={selectedDate===date?'true':undefined} data-outside={date.slice(0,7)!==anchor.slice(0,7)?'true':undefined} data-weekend={index%7>4?'true':undefined}>
                {dayButton(date,items)}<div className="inspection-day-events">{items.slice(0,3).map(item=>eventButton(item,true))}{items.length>3&&<button type="button" className="inspection-more" onClick={()=>selectDate(date)}>+{items.length-3}건 더 보기</button>}</div>
              </div>;
            })}</div></>:<div className="inspection-week-grid">{days.map(date=>{
              const items=dayItems(date);
              return <div key={date} className="inspection-week-day" data-selected={selectedDate===date?'true':undefined}>{dayButton(date,items)}<div className="inspection-day-events">{items.map(item=>eventButton(item))}{!items.length&&<p className="inspection-day-empty">일정 없음</p>}</div></div>;
            })}</div>}
          <footer className="inspection-legend" aria-label="일정 상태 안내">{Object.entries(inspectionStatusLabels).map(([value,label])=><span key={value}><i data-status={value} aria-hidden="true"/>{label}</span>)}<span className="inspection-calendar-help">날짜를 선택하면 전체 일정을 볼 수 있습니다.</span></footer>
        </section>
        <aside className="inspection-agenda" aria-label="선택한 날짜의 점검">
          <header><p>선택한 날짜</p><h2>{shortDate(selectedDate)}</h2><span>{dayItems(selectedDate).length}건의 점검</span></header>
          <div className="inspection-agenda-list">{dayItems(selectedDate).length?dayItems(selectedDate).map(item=>{
            const conveyor=conveyors.find(value=>value.id===item.conveyorId);
            return <button key={item.id} type="button" className="inspection-agenda-item" data-inspection-id={item.id} onClick={event=>openDetail(item,event.currentTarget)} aria-label={`${item.title} 상세 보기, ${item.startTime}, ${conveyor?.name??'설비'}, ${inspectionStatusLabels[item.status]}`}>
              <span className="inspection-agenda-item-top"><time>{item.startTime} – {inspectionEndTime(item)}</time><Badge variant={inspectionStatusVariant(item.status)}>{inspectionStatusLabels[item.status]}</Badge></span>
              <strong>{item.title}</strong><span>{conveyor?.name}</span><small>{conveyor?.code}<span aria-hidden="true"> · </span>{item.owner}</small>
            </button>;
          }):<div className="inspection-agenda-empty"><Icon name="calendar"/><h3>{hasFilters?'조건에 맞는 점검이 없습니다':'예정된 점검이 없습니다'}</h3><p>{hasFilters?'설비나 상태 필터를 변경해보세요.':'이 날짜에 새 점검을 등록해보세요.'}</p></div>}</div>
          <Button variant="outline" onClick={event=>openCreate(selectedDate,event.currentTarget)} disabled={!conveyors.length}><Icon name="add"/>이 날짜에 등록</Button>
        </aside>
      </div>
    </div>
    <span className="sr-only" role="status">{announcement}</span>
    <InspectionDetail inspection={active&&!editor?selected:null} conveyors={conveyors} onClose={()=>setSelectedId(null)} onEdit={()=>{if(selected)setEditor({key:++sequence.current,initial:{...selected},id:selected.id});}} onViewConveyor={id=>{setSelectedId(null);onViewConveyor(id);}}/>
    {editor&&active&&<InspectionEditor key={editor.key} open initial={editor.initial} editingId={editor.id} conveyors={conveyors} inspections={inspections} onSave={save} onClose={()=>setEditor(null)}/>}
  </>;
}
