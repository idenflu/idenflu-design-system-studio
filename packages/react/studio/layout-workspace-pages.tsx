import * as React from 'react';
import { Avatar, Badge, Button, DataGrid, DatePicker, Icon, NumberField, Progress, Segmented, Select, Switch, Table, TableContainer, TextArea, TextField, type DataGridColumn, type DateValue } from '../src';
import { badgeVariant, pageInfo, roles, statuses, teams, type Member, type Project, type ProjectDraft, type WorkspacePage, type WorkspaceSettings } from './layout-workspace-data';

export function WorkspacePageHeader({title,description,eyebrow,action}: {title:string;description:string;eyebrow?:string;action?:React.ReactNode}){
  return <header className="layout-page-heading"><div>{eyebrow&&<p className="layout-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

export function ProjectForm({onCreate,onCancel}: {onCreate:(draft:ProjectDraft)=>void;onCancel:()=>void}){
  const [name,setName]=React.useState(''),[team,setTeam]=React.useState(teams[0].value),[description,setDescription]=React.useState('');
  const [due,setDue]=React.useState<DateValue>('2026-11-20'),[error,setError]=React.useState('');
  const input=React.useRef<HTMLInputElement>(null);
  return <form className="layout-project-form" noValidate onSubmit={event=>{event.preventDefault();if(!name.trim()){setError('프로젝트 이름을 입력해주세요.');input.current?.focus();return;}if(!event.currentTarget.reportValidity())return;onCreate({name:name.trim(),team,description:description.trim(),due:due??'미정'});}}>
    <TextField ref={input} label="프로젝트 이름" value={name} onChange={event=>{setName(event.target.value);setError('');}} required error={error||undefined} placeholder="예: 고객 경험 개선" maxLength={60}/>
    <TextArea label="프로젝트 설명" rows={3} value={description} onChange={event=>setDescription(event.target.value)} placeholder="목표와 작업 범위를 간단히 적어주세요."/>
    <Select label="담당 팀" value={team} options={teams} onValueChange={setTeam}/><DatePicker label="목표 마감일" value={due} onValueChange={setDue}/>
    <div className="dialog-actions"><Button variant="outline" onClick={onCancel}>취소</Button><Button type="submit">프로젝트 만들기</Button></div>
  </form>;
}

export function InviteMemberForm({onInvite,onCancel,existingEmails}: {onInvite:(member:Omit<Member,'id'>)=>void;onCancel:()=>void;existingEmails:string[]}){
  const [name,setName]=React.useState(''),[email,setEmail]=React.useState(''),[team,setTeam]=React.useState(teams[0].value),[role,setRole]=React.useState('편집자');
  const [error,setError]=React.useState('');
  return <form className="layout-project-form" onSubmit={event=>{event.preventDefault();if(existingEmails.some(value=>value.toLowerCase()===email.trim().toLowerCase())){setError('이미 등록된 이메일입니다.');return;}onInvite({name:name.trim(),email:email.trim(),team,role});}}>
    <TextField label="이름" value={name} onChange={event=>setName(event.target.value)} required pattern=".*\S.*" autoFocus/>
    <TextField label="이메일" type="email" value={email} onChange={event=>{setEmail(event.target.value);setError('');}} error={error||undefined} required placeholder="name@example.com"/>
    <Select label="소속 팀" value={team} options={teams} onValueChange={setTeam}/><Select label="역할" value={role} options={roles} onValueChange={setRole}/>
    <p className="component-helper">샘플 멤버 목록에 추가하며 실제 초대 메일은 전송하지 않습니다.</p>
    <div className="dialog-actions"><Button variant="outline" onClick={onCancel}>취소</Button><Button type="submit">멤버 추가</Button></div>
  </form>;
}

export function ProjectsPage({page,projects,onOpen,onCreate,onComplete}: {page:'projects'|'active-projects'|'reviews'|'completed';projects:Project[];onOpen:(id:string)=>void;onCreate:()=>void;onComplete:(ids:string[])=>void}){
  const [team,setTeam]=React.useState('all'),[status,setStatus]=React.useState('all'),[query,setQuery]=React.useState('');
  const [density,setDensity]=React.useState('default'),[selected,setSelected]=React.useState<string[]>([]);
  const filterStatus=page==='active-projects'?'진행 중':page==='reviews'?'검토 중':page==='completed'?'완료':null;
  const rows=React.useMemo(()=>projects.filter(project=>(!filterStatus||project.status===filterStatus)&&(team==='all'||project.team===team)&&(status==='all'||project.status===status)),[projects,filterStatus,team,status]);
  const availableIds=React.useMemo(()=>new Set(rows.map(row=>row.id)),[rows]);
  const visibleSelected=selected.filter(id=>availableIds.has(id));
  React.useEffect(()=>{setSelected(current=>{const next=current.filter(id=>availableIds.has(id));return next.length===current.length?current:next;});},[availableIds]);
  const columns:DataGridColumn<Project>[]=[
    {id:'name',header:'프로젝트',accessor:row=>row.name,width:290,minWidth:200,cell:row=><button type="button" className="layout-project-link" onClick={()=>onOpen(row.id)}><strong>{row.name}</strong><small>{row.id}</small></button>},
    {id:'status',header:'상태',accessor:row=>row.status,width:120,cell:row=><Badge variant={badgeVariant(row.status)}>{row.status}</Badge>},
    {id:'team',header:'담당 팀',accessor:row=>row.team,width:165},
    {id:'owner',header:'담당자',accessor:row=>row.owner,width:130,cell:row=><span className="layout-person"><Avatar size="sm" shape="circle" variant="neutral">{row.owner.slice(0,1)}</Avatar>{row.owner}</span>},
    {id:'progress',header:'진행률',accessor:row=>row.progress,width:160,cell:row=><span className="layout-progress-cell"><Progress value={row.progress} max={100} aria-label={`${row.name} 진행률`}/><span>{row.progress}%</span></span>},
    {id:'due',header:'마감일',accessor:row=>row.due,width:135},
  ];
  return <><WorkspacePageHeader title={pageInfo[page].title} description={pageInfo[page].description} eyebrow="PROJECT MANAGEMENT" action={<Button onClick={onCreate}><Icon name="add"/>새 프로젝트</Button>}/>
    <div className="layout-filter-panel"><Select label="담당 팀 필터" value={team} onValueChange={setTeam} options={[{value:'all',label:'전체 팀'},...teams]}/><Select label="프로젝트 상태 필터" value={status} onValueChange={setStatus} options={[{value:'all',label:'전체 상태'},...statuses]}/><Button variant="ghost" onClick={()=>{setTeam('all');setStatus('all');setQuery('');}}>필터 초기화</Button><div className="layout-density"><Segmented label="표 밀도" value={density} onValueChange={setDensity} options={[{value:'default',label:'보통'},{value:'compact',label:'촘촘'}]}/></div></div>
    {visibleSelected.length>0&&<div className="layout-bulk-actions"><span>{visibleSelected.length}개 프로젝트 선택</span><Button variant="outline" size="sm" onClick={()=>{onComplete(visibleSelected);setSelected([]);}}><Icon name="check"/>선택 항목 완료</Button></div>}
    <DataGrid label={`${pageInfo[page].title} 목록`} rows={rows} columns={columns.map(column=>({...column,resizable:false}))} getRowId={row=>row.id} getRowLabel={row=>row.name} searchLabel="프로젝트 검색" query={query} onQueryChange={setQuery} defaultPageSize={10} pageSizeOptions={[10,20,50]} showColumnVisibility={false} density={density==='compact'?'compact':'default'} selectable selectedRowIds={visibleSelected} onSelectedRowIdsChange={setSelected} exportable exportFileName="workspace-projects.csv"/>
    <p className="layout-content-caption">프로젝트 이름을 선택하면 상세 화면이 새 콘텐츠 탭으로 열립니다.</p>
  </>;
}

export function HomePage({projects,members,onOpen,onPage}: {projects:Project[];members:Member[];onOpen:(id:string)=>void;onPage:(page:WorkspacePage)=>void}){
  const reviewing=projects.filter(project=>project.status==='검토 중');
  return <><WorkspacePageHeader title="팀 홈" description="팀의 주요 업무와 최근 활동을 한눈에 확인하세요." eyebrow="WORKSPACE OVERVIEW" action={<Button variant="outline" onClick={()=>onPage('projects')}>프로젝트 전체 보기<Icon name="arrow-right"/></Button>}/>
    <div className="layout-home-metrics">{[['전체 프로젝트',projects.length,'projects'],['진행 중',projects.filter(project=>project.status==='진행 중').length,'active-projects'],['검토 대기',reviewing.length,'reviews'],['팀 멤버',members.length,'members']].map(([label,value,page])=><button type="button" className="layout-panel layout-metric" key={label} onClick={()=>onPage(page as WorkspacePage)}><span>{label}</span><strong>{value}</strong><small>상세 보기 <Icon name="arrow-right"/></small></button>)}</div>
    <div className="layout-home-columns"><section className="layout-panel layout-recent"><header><div><h2>검토가 필요한 프로젝트</h2><p>작업을 확인하고 다음 단계를 진행해주세요.</p></div><Badge variant="warning">{reviewing.length}개</Badge></header>{reviewing.length?reviewing.slice(0,5).map(project=><button type="button" key={project.id} onClick={()=>onOpen(project.id)}><span><strong>{project.name}</strong><small>{project.owner} · {project.due}</small></span><Badge variant="warning">검토 중</Badge><Icon name="arrow-right"/></button>):<p className="layout-empty">모든 검토를 마쳤습니다.</p>}</section>
      <section className="layout-panel layout-team-card"><h2>함께하는 팀</h2><p>각자의 역할로 더 나은 제품을 만듭니다.</p><div>{members.slice(0,5).map(member=><Avatar key={member.id} shape="circle" variant="neutral" aria-label={member.name}>{member.name.slice(0,1)}</Avatar>)}</div><Button variant="outline" onClick={()=>onPage('members')}>멤버 관리<Icon name="arrow-right"/></Button></section></div>
    <section className="layout-panel layout-recent"><header><div><h2>최근 프로젝트</h2><p>작업 중인 프로젝트를 이어서 확인하세요.</p></div></header>{projects.slice(0,4).map(project=><button type="button" key={project.id} onClick={()=>onOpen(project.id)}><span className="layout-recent-icon"><Icon name="folder"/></span><span><strong>{project.name}</strong><small>{project.team} · {project.owner}</small></span><Badge variant={badgeVariant(project.status)}>{project.status}</Badge><Icon name="arrow-right"/></button>)}</section>
  </>;
}

export function ProjectDetailPage({project,members,onUpdate,onPage}: {project:Project;members:Member[];onUpdate:(id:string,patch:Partial<Project>)=>void;onPage:(page:WorkspacePage)=>void}){
  return <><WorkspacePageHeader title={project.name} description={project.id} eyebrow="PROJECT DETAIL" action={<Button variant="outline" onClick={()=>onPage('projects')}><Icon name="arrow-left"/>프로젝트 목록</Button>}/>
    <div className="layout-detail-columns"><section className="layout-panel layout-project-overview"><div className="layout-panel-title"><h2>프로젝트 개요</h2><Badge variant={badgeVariant(project.status)}>{project.status}</Badge></div><p>{project.description||'프로젝트 설명이 없습니다.'}</p><div className="layout-detail-progress"><div><span>전체 진행률</span><strong>{project.progress}%</strong></div><Progress value={project.progress} max={100} aria-label="프로젝트 전체 진행률"/></div><div className="layout-detail-note"><Icon name="info"/><p>속성을 변경하면 프로젝트 목록과 다른 열린 화면에 함께 반영됩니다.</p></div><Button disabled={project.status==='완료'} onClick={()=>onUpdate(project.id,{status:'완료',progress:100})}><Icon name="check"/>{project.status==='완료'?'완료된 프로젝트':'완료로 표시'}</Button></section>
      <aside className="layout-panel layout-project-properties" aria-label="프로젝트 속성"><h2>프로젝트 속성</h2><Select label="프로젝트 상태" value={project.status} options={statuses} onValueChange={status=>onUpdate(project.id,{status,...(status==='완료'?{progress:100}:{})})}/><Select label="담당 팀" value={project.team} options={teams} onValueChange={team=>onUpdate(project.id,{team})}/><Select label="담당자" value={project.owner} options={members.map(member=>({value:member.name,label:member.name}))} onValueChange={owner=>onUpdate(project.id,{owner})}/><DatePicker label="목표 마감일" value={project.due==='미정'?null:project.due} onValueChange={due=>onUpdate(project.id,{due:due??'미정'})}/><NumberField label="진행률" value={String(project.progress)} min="0" max="100" step="5" unit="%" required onValueChange={value=>onUpdate(project.id,{progress:Number(value)})}/></aside></div>
  </>;
}

export function MembersPage({members,onInvite,onRole}: {members:Member[];onInvite:()=>void;onRole:(id:string,role:string)=>void}){
  const [query,setQuery]=React.useState(''),[team,setTeam]=React.useState('all');
  const visible=members.filter(member=>`${member.name} ${member.email}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(team==='all'||member.team===team));
  return <><WorkspacePageHeader title="멤버 관리" description="함께 일하는 팀원을 찾고 역할을 관리하세요." eyebrow="TEAM MEMBERS" action={<Button onClick={onInvite}><Icon name="add"/>멤버 초대</Button>}/><div className="layout-member-filters"><TextField label="멤버 검색" type="search" value={query} onChange={event=>setQuery(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="이름 또는 이메일 검색"/><Select label="소속 팀 필터" value={team} options={[{value:'all',label:'전체 팀'},...teams]} onValueChange={setTeam}/></div>
    <TableContainer label="워크스페이스 멤버 목록" className="layout-members-table"><Table><thead><tr><th scope="col">멤버</th><th scope="col">소속 팀</th><th scope="col">역할</th><th scope="col">상태</th></tr></thead><tbody>{visible.map(member=><tr key={member.id}><td><span className="layout-person"><Avatar shape="circle" variant="neutral">{member.name.slice(0,1)}</Avatar><span><strong>{member.name}</strong><small>{member.email}</small></span></span></td><td>{member.team}</td><td><div className="layout-inline-select"><Select label={`${member.name} 역할`} value={member.role} options={roles} onValueChange={role=>onRole(member.id,role)}/></div></td><td><Badge variant="success">활성</Badge></td></tr>)}</tbody></Table></TableContainer>{!visible.length&&<p role="status" className="layout-empty">검색 결과가 없습니다.</p>}<p className="layout-content-caption">전체 {members.length}명 중 {visible.length}명을 표시합니다.</p>
  </>;
}

export function SettingsPage({settings,onSave}: {settings:WorkspaceSettings;onSave:(patch:Partial<WorkspaceSettings>)=>void}){
  const [name,setName]=React.useState(settings.name),[description,setDescription]=React.useState(settings.description),[timezone,setTimezone]=React.useState(settings.timezone),[error,setError]=React.useState(''),[saved,setSaved]=React.useState(false);
  return <><WorkspacePageHeader title="워크스페이스 설정" description="워크스페이스의 기본 정보와 표시 기준을 설정하세요." eyebrow="WORKSPACE SETTINGS"/><form className="layout-panel layout-settings" noValidate onChange={()=>setSaved(false)} onSubmit={event=>{event.preventDefault();if(!name.trim()){setError('워크스페이스 이름을 입력해주세요.');return;}onSave({name:name.trim(),description,timezone});setSaved(true);}}><div><h2>기본 정보</h2><p>이 정보는 사이드바와 탑바에 함께 표시됩니다.</p></div><TextField label="워크스페이스 이름" value={name} onChange={event=>{setName(event.target.value);setError('');}} required error={error||undefined}/><TextArea label="워크스페이스 소개" value={description} onChange={event=>setDescription(event.target.value)} rows={3}/><Select label="시간대" value={timezone} onValueChange={value=>{setTimezone(value);setSaved(false);}} options={[{value:'seoul',label:'서울 (UTC+09:00)'},{value:'tokyo',label:'도쿄 (UTC+09:00)'},{value:'utc',label:'UTC (UTC+00:00)'}]}/><div className="layout-settings-actions"><span role="status">{saved?'변경사항을 저장했습니다.':''}</span><Button type="submit"><Icon name="save"/>변경사항 저장</Button></div></form></>;
}

export function NotificationSettingsPage({settings,onChange}: {settings:WorkspaceSettings;onChange:(patch:Partial<WorkspaceSettings>)=>void}){
  return <><WorkspacePageHeader title="알림 설정" description="필요한 업무 알림을 선택하세요. 변경 즉시 적용됩니다." eyebrow="NOTIFICATION PREFERENCES"/><section className="layout-panel layout-notification-settings"><h2>업무 알림</h2>{[
    ['projectNotifications','프로젝트 변경 알림','담당 프로젝트의 상태와 일정이 변경되면 알려줍니다.'],['mentionNotifications','멘션과 검토 요청','나를 언급하거나 검토를 요청한 소식을 알려줍니다.'],['weeklySummary','주간 활동 요약','팀의 프로젝트 진행 현황을 주간 요약으로 받습니다.'],
  ].map(([key,label,description])=><div key={key}><div><h3>{label}</h3><p>{description}</p></div><Switch label={<span className="sr-only">{label}</span>} checked={settings[key as keyof WorkspaceSettings]===true} onChange={event=>onChange({[key]:event.target.checked})}/></div>)}</section></>;
}
