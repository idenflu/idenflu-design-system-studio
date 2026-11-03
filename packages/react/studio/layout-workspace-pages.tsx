import * as React from 'react';
import { Avatar, Badge, Button, DataGrid, DatePicker, Icon, MultiSelect, NumberField, Progress, Select, Switch, Table, TableContainer, Tabs, TextArea, TextField, type DataGridColumn, type DateValue } from '../src';
import { badgeVariant, pageInfo, roles, statuses, teams, type Member, type Project, type ProjectDraft, type WorkspacePage, type WorkspaceSettings } from './layout-workspace-data';

export function WorkspacePageHeader({title,description,eyebrow,action}: {title:string;description:string;eyebrow?:string;action?:React.ReactNode}){
  return <header className="layout-page-heading"><div>{eyebrow&&<p className="layout-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

export function ProjectForm({id,onCreate}: {id:string;onCreate:(draft:ProjectDraft)=>void}){
  const [name,setName]=React.useState(''),[team,setTeam]=React.useState(teams[0].value),[description,setDescription]=React.useState('');
  const [due,setDue]=React.useState<DateValue>('2026-11-20'),[error,setError]=React.useState('');
  const input=React.useRef<HTMLInputElement>(null);
  return <form id={id} className="layout-project-form" noValidate onSubmit={event=>{event.preventDefault();if(!name.trim()){setError('프로젝트 이름을 입력해주세요.');input.current?.focus();return;}if(!event.currentTarget.reportValidity())return;onCreate({name:name.trim(),team,description:description.trim(),due:due??'미정'});}}>
    <TextField ref={input} label="프로젝트 이름" value={name} onChange={event=>{setName(event.target.value);setError('');}} required error={error||undefined} placeholder="예: 고객 경험 개선" maxLength={60}/>
    <TextArea label="프로젝트 설명" rows={3} value={description} onChange={event=>setDescription(event.target.value)} placeholder="목표와 작업 범위를 간단히 적어주세요."/>
    <div className="layout-project-form-row"><Select label="담당 팀" value={team} options={teams} onValueChange={setTeam} popupStrategy="fixed"/><DatePicker label="목표 마감일" value={due} onValueChange={setDue}/></div>
  </form>;
}

export function InviteMemberForm({id,onInvite,existingEmails}: {id:string;onInvite:(member:Omit<Member,'id'>)=>void;existingEmails:string[]}){
  const [name,setName]=React.useState(''),[email,setEmail]=React.useState(''),[team,setTeam]=React.useState(teams[0].value),[role,setRole]=React.useState('편집자');
  const [error,setError]=React.useState('');
  return <form id={id} className="layout-project-form" onSubmit={event=>{event.preventDefault();if(existingEmails.some(value=>value.toLowerCase()===email.trim().toLowerCase())){setError('이미 등록된 이메일입니다.');return;}onInvite({name:name.trim(),email:email.trim(),team,roles:[role]});}}>
    <TextField label="이름" value={name} onChange={event=>setName(event.target.value)} required pattern=".*\S.*" autoFocus/>
    <TextField label="이메일" type="email" value={email} onChange={event=>{setEmail(event.target.value);setError('');}} error={error||undefined} required placeholder="name@example.com"/>
    <Select label="소속 팀" value={team} options={teams} onValueChange={setTeam} popupStrategy="fixed"/><Select label="역할" value={role} options={roles} onValueChange={setRole} popupStrategy="fixed"/>
    <p className="component-helper">샘플 멤버 목록에 추가하며 실제 초대 메일은 전송하지 않습니다.</p>
  </form>;
}

export function ProfileForm({id,member,members,onSave}: {id:string;member:Member;members:Member[];onSave:(profile:Pick<Member,'name'|'email'>)=>void}){
  const [name,setName]=React.useState(member.name),[email,setEmail]=React.useState(member.email);
  const [nameError,setNameError]=React.useState(''),[emailError,setEmailError]=React.useState('');
  const nameInput=React.useRef<HTMLInputElement>(null),emailInput=React.useRef<HTMLInputElement>(null);
  return <form id={id} className="layout-project-form" noValidate onSubmit={event=>{
    event.preventDefault();
    const nextName=name.trim(),nextEmail=email.trim(),others=members.filter(item=>item.id!==member.id);
    if(!nextName){setNameError('이름을 입력해주세요.');nameInput.current?.focus();return;}
    if(nextName!==member.name && others.some(item=>item.name.toLocaleLowerCase()===member.name.toLocaleLowerCase())){setNameError('같은 이름의 멤버가 있어 이름을 변경할 수 없습니다.');nameInput.current?.focus();return;}
    if(nextName!==member.name && others.some(item=>item.name.toLocaleLowerCase()===nextName.toLocaleLowerCase())){setNameError('이미 사용 중인 이름입니다.');nameInput.current?.focus();return;}
    if(!emailInput.current?.checkValidity()){emailInput.current?.reportValidity();return;}
    if(others.some(item=>item.email.toLocaleLowerCase()===nextEmail.toLocaleLowerCase())){setEmailError('이미 등록된 이메일입니다.');emailInput.current?.focus();return;}
    onSave({name:nextName,email:nextEmail});
  }}>
    <TextField ref={nameInput} label="이름" value={name} onChange={event=>{setName(event.target.value);setNameError('');}} required maxLength={60} error={nameError||undefined} autoFocus/>
    <TextField ref={emailInput} label="이메일" type="email" value={email} onChange={event=>{setEmail(event.target.value);setEmailError('');}} required maxLength={254} error={emailError||undefined}/>
    <div><MultiSelect label="역할" value={member.roles} options={roles.map(role=>role.value==='관리자'?{...role,label:'워크스페이스 관리자'}:role)} presentation="inline" disabled aria-describedby={`${id}-role-help`} placeholder="지정된 역할이 없습니다"/><p id={`${id}-role-help`} className="component-helper" style={{marginTop:'var(--space-1)'}}>역할은 멤버 관리에서 변경할 수 있습니다.</p></div>
  </form>;
}

export function ProjectsPage({page,projects,onOpen,onCreate,onComplete}: {page:'projects'|'active-projects'|'reviews'|'completed';projects:Project[];onOpen:(id:string)=>void;onCreate:()=>void;onComplete:(ids:string[])=>void}){
  const [team,setTeam]=React.useState('all'),[status,setStatus]=React.useState('all'),[query,setQuery]=React.useState('');
  const [selected,setSelected]=React.useState<string[]>([]);
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
    <div className="layout-filter-panel"><Select label="담당 팀 필터" value={team} onValueChange={setTeam} options={[{value:'all',label:'전체 팀'},...teams]}/><Select label="프로젝트 상태 필터" value={status} onValueChange={setStatus} options={[{value:'all',label:'전체 상태'},...statuses]}/><Button variant="ghost" onClick={()=>{setTeam('all');setStatus('all');setQuery('');}}>필터 초기화</Button></div>
    <DataGrid label={`${pageInfo[page].title} 목록`} rows={rows} columns={columns.map(column=>({...column,resizable:false}))} getRowId={row=>row.id} getRowLabel={row=>row.name} searchLabel="프로젝트 검색" query={query} onQueryChange={setQuery} defaultPageSize={10} pageSizeOptions={[10,20,50]} defaultDensity="compact" showColumnVisibility={false} selectable selectedRowIds={visibleSelected} onSelectedRowIdsChange={setSelected} selectionActions={<Button variant="ghost" size="sm" onClick={()=>{onComplete(visibleSelected);setSelected([]);}}>선택 항목 완료</Button>} exportable exportFileName="workspace-projects.csv"/>
    <p className="layout-content-caption">프로젝트 이름을 선택하면 상세 화면이 새 콘텐츠 탭으로 열립니다.</p>
  </>;
}

export function MasterDetailPage({projects,members,onUpdate,onOpen}: {projects:Project[];members:Member[];onUpdate:(id:string,patch:Partial<Project>)=>void;onOpen:(id:string)=>void}){
  const [query,setQuery]=React.useState(''),[selectedId,setSelectedId]=React.useState(projects[0]?.id??'');
  const needle=query.trim().toLocaleLowerCase();
  const visible=React.useMemo(()=>projects.filter(project=>`${project.name} ${project.id} ${project.team} ${project.owner}`.toLocaleLowerCase().includes(needle)),[projects,needle]);
  const selected=visible.find(project=>project.id===selectedId)??visible[0];
  React.useEffect(()=>{const id=selected?.id??'';if(id!==selectedId)setSelectedId(id);},[selected?.id,selectedId]);
  return <><WorkspacePageHeader title="마스터-디테일" description="목록에서 프로젝트를 선택하고 상세 내용을 확인하세요." eyebrow="PROJECT MANAGEMENT"/>
    <div className="layout-master-detail">
      <section className="layout-master-panel" aria-label="프로젝트 목록">
        <div className="layout-master-toolbar"><h2>프로젝트 목록</h2><TextField label="프로젝트 검색" type="search" value={query} onChange={event=>setQuery(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="프로젝트 검색"/></div>
        <div className="layout-master-list" role="group" aria-label="프로젝트 목록">
          {visible.length?visible.map(project=><button key={project.id} type="button" className="layout-master-item" aria-label={`${project.name} ${project.id}`} aria-pressed={project.id===selected?.id} onClick={()=>setSelectedId(project.id)}><span><strong>{project.name}</strong><small>{project.id} · {project.team}</small></span><Badge variant={badgeVariant(project.status)}>{project.status}</Badge></button>):<p className="layout-empty" role="status">검색 결과가 없습니다.</p>}
        </div>
      </section>
      <section className="layout-master-detail-panel" aria-label="프로젝트 상세">
        {selected?<div key={selected.id} className="layout-master-content"><header className="layout-master-header"><div><span>{selected.id}</span><h2>{selected.name}</h2></div><Button variant="outline" onClick={()=>onOpen(selected.id)}>상세 화면 열기<Icon name="arrow-right"/></Button></header>
          <div className="layout-master-overview"><div className="layout-panel-title"><h3>프로젝트 개요</h3><Badge variant={badgeVariant(selected.status)}>{selected.status}</Badge></div><p>{selected.description||'프로젝트 설명이 없습니다.'}</p><div className="layout-detail-progress"><div><span>전체 진행률</span><strong>{selected.progress}%</strong></div><Progress value={selected.progress} max={100} aria-label="프로젝트 전체 진행률"/></div></div>
          <div className="layout-master-properties"><h3>프로젝트 속성</h3><div className="layout-master-fields"><Select label="프로젝트 상태" value={selected.status} options={statuses} popupStrategy="fixed" onValueChange={status=>onUpdate(selected.id,{status,...(status==='완료'?{progress:100}:{})})}/><Select label="담당 팀" value={selected.team} options={teams} popupStrategy="fixed" onValueChange={team=>onUpdate(selected.id,{team})}/><Select label="담당자" value={selected.owner} options={members.map(member=>({value:member.name,label:member.name}))} popupStrategy="fixed" onValueChange={owner=>onUpdate(selected.id,{owner})}/><DatePicker label="목표 마감일" value={selected.due==='미정'?null:selected.due} onValueChange={due=>onUpdate(selected.id,{due:due??'미정'})}/><NumberField label="진행률" value={String(selected.progress)} min="0" max="100" step="5" unit="%" required onValueChange={value=>onUpdate(selected.id,{progress:Number(value)})}/></div></div>
        </div>:<p className="layout-empty">프로젝트를 찾을 수 없습니다.</p>}
      </section>
    </div>
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

export function MembersPage({members,onInvite,onRole}: {members:Member[];onInvite:()=>void;onRole:(id:string,roles:string[])=>void}){
  const [query,setQuery]=React.useState(''),[team,setTeam]=React.useState('all');
  const visible=members.filter(member=>`${member.name} ${member.email}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(team==='all'||member.team===team));
  return <><WorkspacePageHeader title="멤버 관리" description="함께 일하는 팀원을 찾고 역할을 관리하세요." eyebrow="TEAM MEMBERS" action={<Button onClick={onInvite}><Icon name="add"/>멤버 초대</Button>}/><div className="layout-member-filters"><TextField label="멤버 검색" type="search" value={query} onChange={event=>setQuery(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="이름 또는 이메일 검색"/><Select label="소속 팀 필터" value={team} options={[{value:'all',label:'전체 팀'},...teams]} onValueChange={setTeam}/></div>
    <TableContainer label="워크스페이스 멤버 목록" className="layout-members-table"><Table><thead><tr><th scope="col">멤버</th><th scope="col">소속 팀</th><th scope="col">역할</th><th scope="col">상태</th></tr></thead><tbody>{visible.map(member=><tr key={member.id}><td><span className="layout-person"><Avatar shape="circle" variant="neutral">{member.name.slice(0,1)}</Avatar><span><strong>{member.name}</strong><small>{member.email}</small></span></span></td><td>{member.team}</td><td><div className="layout-inline-select"><MultiSelect label={`${member.name} 역할`} value={member.roles} options={roles} presentation="inline" popupStrategy="fixed" placeholder="역할 선택" onValueChange={selected=>onRole(member.id,selected)}/></div></td><td><Badge variant="success">활성</Badge></td></tr>)}</tbody></Table></TableContainer>{!visible.length&&<p role="status" className="layout-empty">검색 결과가 없습니다.</p>}<p className="layout-content-caption">전체 {members.length}명 중 {visible.length}명을 표시합니다.</p>
  </>;
}

type SettingsProps={settings:WorkspaceSettings;onSave:(patch:Partial<WorkspaceSettings>)=>void};
type NotificationSettingsProps={settings:WorkspaceSettings;onChange:(patch:Partial<WorkspaceSettings>)=>void};
type SettingsDraft=Partial<Pick<WorkspaceSettings,'name'|'description'|'timezone'>>;

function WorkspaceSettingsForm({settings,onSave}:SettingsProps){
  const [draft,setDraft]=React.useState<SettingsDraft>({}),[error,setError]=React.useState(''),[saved,setSaved]=React.useState(false);
  const name=draft.name??settings.name,description=draft.description??settings.description,timezone=draft.timezone??settings.timezone;
  const change=(key:keyof SettingsDraft,value:string)=>{setDraft(current=>{const next={...current};if(value===settings[key])delete next[key];else next[key]=value;return next;});setSaved(false);};
  return <form className="layout-panel layout-settings" noValidate onSubmit={event=>{event.preventDefault();if(!name.trim()){setError('워크스페이스 이름을 입력해주세요.');return;}onSave({...draft,...(draft.name!==undefined?{name:name.trim()}:{})});setDraft({});setSaved(true);}}><div><h2>기본 정보</h2><p>이 정보는 사이드바와 탑바에 함께 표시됩니다.</p></div><TextField label="워크스페이스 이름" value={name} onChange={event=>{change('name',event.target.value);setError('');}} required error={error||undefined}/><TextArea label="워크스페이스 소개" value={description} onChange={event=>change('description',event.target.value)} rows={3}/><Select label="시간대" value={timezone} onValueChange={value=>change('timezone',value)} options={[{value:'seoul',label:'서울 (UTC+09:00)'},{value:'tokyo',label:'도쿄 (UTC+09:00)'},{value:'utc',label:'UTC (UTC+00:00)'}]}/><div className="layout-settings-actions"><span role="status">{saved?'변경사항을 저장했습니다.':''}</span><Button type="submit"><Icon name="save"/>변경사항 저장</Button></div></form>;
}

function NotificationSettingsContent({settings,onChange}:NotificationSettingsProps){
  return <section className="layout-panel layout-notification-settings"><h2>업무 알림</h2>{[
    ['projectNotifications','프로젝트 변경 알림','담당 프로젝트의 상태와 일정이 변경되면 알려줍니다.'],['mentionNotifications','멘션과 검토 요청','나를 언급하거나 검토를 요청한 소식을 알려줍니다.'],['weeklySummary','주간 활동 요약','팀의 프로젝트 진행 현황을 주간 요약으로 받습니다.'],
  ].map(([key,label,description])=><div key={key}><div><h3>{label}</h3><p>{description}</p></div><Switch label={<span className="sr-only">{label}</span>} checked={settings[key as keyof WorkspaceSettings]===true} onChange={event=>onChange({[key]:event.target.checked})}/></div>)}</section>;
}

export function SettingsPage(props:SettingsProps){
  return <><WorkspacePageHeader title="워크스페이스 설정" description="워크스페이스의 기본 정보와 표시 기준을 설정하세요." eyebrow="WORKSPACE SETTINGS"/><WorkspaceSettingsForm {...props}/></>;
}

export function NotificationSettingsPage(props:NotificationSettingsProps){
  return <><WorkspacePageHeader title="알림 설정" description="필요한 업무 알림을 선택하세요. 변경 즉시 적용됩니다." eyebrow="NOTIFICATION PREFERENCES"/><NotificationSettingsContent {...props}/></>;
}

export function VerticalSettingsPage({settings,onSave,onChange}:SettingsProps&NotificationSettingsProps){
  return <><WorkspacePageHeader title="버티컬 탭 설정" description="워크스페이스의 기본 정보와 알림을 관리하세요." eyebrow="WORKSPACE SETTINGS"/><Tabs className="layout-settings-tabs" label="워크스페이스 설정 분류" orientation="vertical" items={[
    {value:'general',label:'기본 정보',content:<WorkspaceSettingsForm settings={settings} onSave={onSave}/>},
    {value:'notifications',label:'알림',content:<NotificationSettingsContent settings={settings} onChange={onChange}/>},
  ]}/></>;
}
