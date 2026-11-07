import * as React from 'react';
import { Avatar, Badge, Button, DataGrid, DatePicker, Icon, MultiSelect, NumberField, Progress, Select, Switch, Table, TableContainer, Tabs, TextArea, TextField, type DataGridColumn, type DataGridFilters, type DateValue, type SelectOption } from '@idenflu/mono-react';
import { badgeVariant, pageInfo, statuses, teams, type Member, type Project, type ProjectDraft, type WorkspacePage, type WorkspaceSettings } from './layout-workspace-data';

export function WorkspacePageHeader({title,description,eyebrow,action}: {title:string;description:string;eyebrow?:string;action?:React.ReactNode}){
  return <header className="layout-page-heading"><div>{eyebrow&&<p className="layout-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

export function ProjectForm({id,onCreate}: {id:string;onCreate:(draft:ProjectDraft)=>void}){
  const [name,setName]=React.useState(''),[team,setTeam]=React.useState(teams[0].value),[description,setDescription]=React.useState('');
  const [due,setDue]=React.useState<DateValue>('2026-11-20'),[error,setError]=React.useState('');
  const input=React.useRef<HTMLInputElement>(null);
  return <form id={id} className="layout-project-form" noValidate onSubmit={event=>{event.preventDefault();if(!name.trim()){setError('프로젝트 이름을 입력해주세요.');input.current?.focus();return;}if(!event.currentTarget.reportValidity())return;onCreate({name:name.trim(),team,description:description.trim(),due:due??'미정'});}}>
    <TextField ref={input} label={<>프로젝트 이름 <span className="form-pattern-required" aria-hidden="true">필수</span></>} prefix={<Icon name="folder"/>} prefixDecorative value={name} onChange={event=>{setName(event.target.value);setError('');}} required error={error||undefined} placeholder="예: 고객 경험 개선" maxLength={60}/>
    <TextArea label="프로젝트 설명" rows={3} value={description} onChange={event=>setDescription(event.target.value)} placeholder="목표와 작업 범위를 간단히 적어주세요."/>
    <div className="layout-project-form-row"><Select label="담당 팀" prefixIcon={<Icon name="users"/>} value={team} options={teams} onValueChange={setTeam} popupStrategy="fixed"/><DatePicker label="목표 마감일" value={due} onValueChange={setDue}/></div>
  </form>;
}

export function InviteMemberForm({id,onInvite,existingEmails,roleOptions,defaultRole}: {id:string;onInvite:(member:Omit<Member,'id'>)=>void;existingEmails:string[];roleOptions:readonly SelectOption[];defaultRole:string}){
  const initialRole=roleOptions.some(option=>option.value===defaultRole)?defaultRole:'';
  const [name,setName]=React.useState(''),[email,setEmail]=React.useState(''),[team,setTeam]=React.useState(teams[0].value),[role,setRole]=React.useState(initialRole);
  const selectedRole=roleOptions.some(option=>option.value===role)?role:initialRole;
  const [error,setError]=React.useState('');
  return <form id={id} className="layout-project-form" onSubmit={event=>{event.preventDefault();if(!selectedRole)return;if(existingEmails.some(value=>value.toLowerCase()===email.trim().toLowerCase())){setError('이미 등록된 이메일입니다.');return;}onInvite({name:name.trim(),email:email.trim(),team,roles:[selectedRole]});}}>
    <TextField label="이름" prefix={<Icon name="person"/>} prefixDecorative value={name} onChange={event=>setName(event.target.value)} required pattern=".*\S.*" autoFocus/>
    <TextField label="이메일" type="email" prefix={<Icon name="mail"/>} prefixDecorative value={email} onChange={event=>{setEmail(event.target.value);setError('');}} error={error||undefined} required placeholder="name@example.com"/>
    <Select label="소속 팀" prefixIcon={<Icon name="users"/>} value={team} options={teams} onValueChange={setTeam} popupStrategy="fixed"/><Select label="역할" prefixIcon={<Icon name="shield-check"/>} value={selectedRole} options={roleOptions} onValueChange={setRole} popupStrategy="fixed" required disabled={!roleOptions.length}/>
    {!roleOptions.length&&<p className="component-helper">멤버를 초대하려면 역할을 먼저 추가하세요.</p>}
    <p className="component-helper">샘플 멤버 목록에 추가하며 실제 초대 메일은 전송하지 않습니다.</p>
  </form>;
}

export function ProfileForm({id,member,members,onSave,roleOptions}: {id:string;member:Member;members:Member[];onSave:(profile:Pick<Member,'name'|'email'>)=>void;roleOptions:readonly SelectOption[]}){
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
    <div><MultiSelect label="역할" value={member.roles} options={roleOptions} presentation="inline" disabled aria-describedby={`${id}-role-help`} placeholder="지정된 역할이 없습니다"/><p id={`${id}-role-help`} className="component-helper" style={{marginTop:'var(--space-1)'}}>역할은 멤버 관리에서 변경할 수 있습니다.</p></div>
  </form>;
}

const projectQueryDateTime=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});

export function ProjectsPage({page,projects,onOpen,onCreate,onDelete}: {page:'projects'|'active-projects'|'reviews'|'completed';projects:Project[];onOpen:(id:string)=>void;onCreate:()=>void;onDelete:(ids:string[])=>void}){
  const [keyword,setKeyword]=React.useState('');
  const [team,setTeam]=React.useState('all');
  const [selectedStatuses,setSelectedStatuses]=React.useState<string[]>([]);
  const [filters,setFilters]=React.useState<{keyword:string;team:string;statuses:string[]}|null>({keyword:'',team:'all',statuses:[]});
  const [columnFilters,setColumnFilters]=React.useState<DataGridFilters>({});
  const [selected,setSelected]=React.useState<string[]>([]);
  const [scrollResetKey,setScrollResetKey]=React.useState(0);
  const [lastQueriedAt,setLastQueriedAt]=React.useState(()=>new Date());
  const [loading,setLoading]=React.useState(false);
  const queryTimer=React.useRef<number|null>(null);
  React.useEffect(()=>()=>{if(queryTimer.current!==null)window.clearTimeout(queryTimer.current);},[]);
  const searchProjects=()=>{
    if(queryTimer.current!==null)return;
    const nextFilters={keyword:keyword.trim().toLocaleLowerCase(),team,statuses:[...selectedStatuses]};
    setLoading(true);
    setSelected([]);
    queryTimer.current=window.setTimeout(()=>{
      queryTimer.current=null;
      setFilters(nextFilters);
      setScrollResetKey(current=>current+1);
      setLastQueriedAt(new Date());
      setLoading(false);
    },1000+Math.floor(Math.random()*2001));
  };
  const resetProjects=()=>{
    if(queryTimer.current!==null){window.clearTimeout(queryTimer.current);queryTimer.current=null;}
    setLoading(false);
    setKeyword('');setTeam('all');setSelectedStatuses([]);setFilters(null);setColumnFilters({});setSelected([]);setScrollResetKey(current=>current+1);
  };
  const filterStatus=page==='active-projects'?'진행 중':page==='reviews'?'검토 중':page==='completed'?'완료':null;
  const rows=React.useMemo(()=>filters?projects.filter(project=>(!filterStatus||project.status===filterStatus)&&(!filters.keyword||`${project.name} ${project.id}`.toLocaleLowerCase().includes(filters.keyword))&&(filters.team==='all'||project.team===filters.team)&&(!filters.statuses.length||filters.statuses.includes(project.status))):[],[projects,filterStatus,filters]);
  const availableIds=React.useMemo(()=>new Set(rows.map(row=>row.id)),[rows]);
  const visibleSelected=selected.filter(id=>availableIds.has(id));
  React.useEffect(()=>{setSelected(current=>{const next=current.filter(id=>availableIds.has(id));return next.length===current.length?current:next;});},[availableIds]);
  const columns:DataGridColumn<Project>[]=[
    {id:'name',header:'프로젝트',accessor:row=>row.name,width:290,minWidth:200,filter:'text',cell:row=><button type="button" className="layout-project-link" onClick={()=>onOpen(row.id)}><span className="layout-project-link-title"><span>{row.name}</span><Icon name="arrow-up"/></span><small>{row.id}</small></button>},
    {id:'status',header:'상태',accessor:row=>row.status,width:120,filter:'select',filterOptions:statuses,cell:row=><Badge variant={badgeVariant(row.status)}>{row.status}</Badge>},
    {id:'team',header:'담당 팀',accessor:row=>row.team,width:165,filter:'select',filterOptions:teams},
    {id:'owner',header:'담당자',accessor:row=>row.owner,width:130,filter:'text',cell:row=><span className="layout-person"><Avatar size="sm" shape="circle" variant="neutral">{row.owner.slice(0,1)}</Avatar>{row.owner}</span>},
    {id:'progress',header:'진행률',accessor:row=>row.progress,width:160,filter:'number',cell:row=><span className="layout-progress-cell"><Progress value={row.progress} max={100} aria-label={`${row.name} 진행률`}/><span>{row.progress}%</span></span>},
    {id:'due',header:'마감일',accessor:row=>row.due,width:135,filter:'text'},
  ];
  return <><WorkspacePageHeader title={pageInfo[page].title} description={pageInfo[page].description}/>
    <form role="search" aria-label="프로젝트 필터 검색" className={`layout-filter-panel${page==='active-projects'?' layout-filter-panel--borderless':''}`} onSubmit={event=>{event.preventDefault();searchProjects();}}>
      <TextField className="layout-project-keyword" label="프로젝트명 / ID" type="search" value={keyword} onChange={event=>setKeyword(event.target.value)} placeholder="프로젝트명 또는 ID 입력" prefix={<Icon name="search"/>} prefixDecorative autoComplete="off"/>
      <Select label="담당 팀" value={team} onValueChange={setTeam} options={[{value:'all',label:'전체 팀'},...teams]} popupStrategy="fixed"/>
      <MultiSelect className="layout-inline-select layout-project-status-filter" label="프로젝트 상태" value={selectedStatuses} onValueChange={setSelectedStatuses} options={statuses} placeholder="전체 상태" presentation="inline" clearable={selectedStatuses.length>0} popupStrategy="fixed"/>
      <Button variant="outline" onClick={resetProjects}><Icon name="refresh"/>초기화</Button>
      <Button type="submit" disabled={loading} aria-busy={loading||undefined}><Icon name="search"/>검색</Button>
    </form>
    <DataGrid label={`${pageInfo[page].title} 목록`} rows={rows} columns={columns} getRowId={row=>row.id} getRowLabel={row=>row.name} searchable={false} showColumnFilterToggle filters={columnFilters} onFiltersChange={next=>{setColumnFilters(next);setSelected([]);}} scrollResetKey={scrollResetKey} pagination={false} defaultDensity="compact" showColumnVisibility={false} selectable selectedRowIds={visibleSelected} onSelectedRowIdsChange={setSelected}
      toolbarOrder={['selection','actions']} toolbarActions={<Button onClick={onCreate} disabled={loading}><Icon name="add"/>새 프로젝트</Button>} loading={loading}
      selectionActions={<><Button variant="outline" disabled={visibleSelected.length!==1} onClick={()=>{if(visibleSelected.length===1)onOpen(visibleSelected[0]);}}><Icon name="edit"/>수정</Button><Button variant="danger" appearance="outline" onClick={()=>onDelete(visibleSelected)}><Icon name="trash"/>선택 삭제</Button></>} exportable exportFormats={['csv','xlsx']} exportFileName="workspace-projects.csv"
      emptyMessage={filters?(filters.keyword||filters.team!=='all'||filters.statuses.length?'검색 조건에 맞는 프로젝트가 없습니다.':'등록된 데이터가 없습니다.'):'검색 버튼을 눌러 프로젝트 목록을 조회하세요.'}
      footer={({filteredCount,selectedCount,loading})=><div className="layout-grid-footer"><p className="component-helper">{loading?'조회 중…':`${filteredCount}개 항목${selectedCount>0?` · ${selectedCount}개 선택됨`:''}`}</p><p className="component-helper layout-grid-last-query">마지막 조회 <time dateTime={lastQueriedAt.toISOString()} title="한국 표준시 (KST)">{projectQueryDateTime.format(lastQueriedAt)}</time></p></div>}/>
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
  return <><WorkspacePageHeader title={pageInfo.home.title} description="팀의 주요 업무와 최근 활동을 한눈에 확인하세요." eyebrow="WORKSPACE OVERVIEW" action={<Button variant="outline" onClick={()=>onPage('projects')}>프로젝트 전체 보기<Icon name="arrow-right"/></Button>}/>
    <div className="layout-home-metrics">{[['전체 프로젝트',projects.length,'projects'],['진행 중',projects.filter(project=>project.status==='진행 중').length,'active-projects'],['검토 대기',reviewing.length,'reviews'],['팀 멤버',members.length,'members']].map(([label,value,page])=><button type="button" className="layout-panel layout-metric" key={label} onClick={()=>onPage(page as WorkspacePage)}><span>{label}</span><strong>{value}</strong><small>상세 보기 <Icon name="arrow-right"/></small></button>)}</div>
    <div className="layout-home-columns"><section className="layout-panel layout-recent"><header><div><h2>검토가 필요한 프로젝트</h2><p>작업을 확인하고 다음 단계를 진행해주세요.</p></div><Badge variant="warning">{reviewing.length}개</Badge></header>{reviewing.length?reviewing.slice(0,5).map(project=><button type="button" key={project.id} onClick={()=>onOpen(project.id)}><span><strong>{project.name}</strong><small>{project.owner} · {project.due}</small></span><Badge variant="warning">검토 중</Badge><Icon name="arrow-right"/></button>):<p className="layout-empty">모든 검토를 마쳤습니다.</p>}</section>
      <section className="layout-panel layout-team-card"><h2>함께하는 팀</h2><p>각자의 역할로 더 나은 제품을 만듭니다.</p><div>{members.slice(0,5).map(member=><Avatar key={member.id} shape="circle" variant="neutral" aria-label={member.name}>{member.name.slice(0,1)}</Avatar>)}</div><Button variant="outline" onClick={()=>onPage('members')}>멤버 관리<Icon name="arrow-right"/></Button></section></div>
    <section className="layout-panel layout-recent"><header><div><h2>최근 프로젝트</h2><p>작업 중인 프로젝트를 이어서 확인하세요.</p></div></header>{projects.slice(0,4).map(project=><button type="button" key={project.id} onClick={()=>onOpen(project.id)}><span className="layout-recent-icon"><Icon name="folder"/></span><span><strong>{project.name}</strong><small>{project.team} · {project.owner}</small></span><Badge variant={badgeVariant(project.status)}>{project.status}</Badge><Icon name="arrow-right"/></button>)}</section>
  </>;
}

export function ProjectDetailPage({project,members,onUpdate,onPage}: {project:Project;members:Member[];onUpdate:(id:string,patch:Partial<Project>)=>void;onPage:(page:WorkspacePage)=>void}){
  return <><WorkspacePageHeader title={project.name} description={project.id} eyebrow="PROJECT DETAIL" action={<Button variant="outline" onClick={()=>onPage('projects')}><Icon name="arrow-left"/>프로젝트 목록</Button>}/>
    <ProjectDetailContent project={project} members={members} onUpdate={onUpdate}/>
  </>;
}

export function ProjectDetailContent({project,members,onUpdate}: {project:Project;members:Member[];onUpdate:(id:string,patch:Partial<Project>)=>void}){
  return <>
    <div className="layout-detail-columns"><section className="layout-panel layout-project-overview"><div className="layout-panel-title"><h2>프로젝트 개요</h2><Badge variant={badgeVariant(project.status)}>{project.status}</Badge></div><p>{project.description||'프로젝트 설명이 없습니다.'}</p><div className="layout-detail-progress"><div><span>전체 진행률</span><strong>{project.progress}%</strong></div><Progress value={project.progress} max={100} aria-label="프로젝트 전체 진행률"/></div><div className="layout-detail-note"><Icon name="info"/><p>속성을 변경하면 프로젝트 목록과 다른 열린 화면에 함께 반영됩니다.</p></div><Button disabled={project.status==='완료'} onClick={()=>onUpdate(project.id,{status:'완료',progress:100})}><Icon name="check"/>{project.status==='완료'?'완료된 프로젝트':'완료로 표시'}</Button></section>
      <aside className="layout-panel layout-project-properties" aria-label="프로젝트 속성"><h2>프로젝트 속성</h2><Select label="프로젝트 상태" value={project.status} options={statuses} popupStrategy="fixed" onValueChange={status=>onUpdate(project.id,{status,...(status==='완료'?{progress:100}:{})})}/><Select label="담당 팀" value={project.team} options={teams} popupStrategy="fixed" onValueChange={team=>onUpdate(project.id,{team})}/><Select label="담당자" value={project.owner} options={members.map(member=>({value:member.name,label:member.name}))} popupStrategy="fixed" onValueChange={owner=>onUpdate(project.id,{owner})}/><DatePicker label="목표 마감일" value={project.due==='미정'?null:project.due} onValueChange={due=>onUpdate(project.id,{due:due??'미정'})}/><NumberField label="진행률" value={String(project.progress)} min="0" max="100" step="5" unit="%" required onValueChange={value=>onUpdate(project.id,{progress:Number(value)})}/></aside></div>
  </>;
}

export function MembersPage({members,onInvite,onRole,roleOptions}: {members:Member[];onInvite:()=>void;onRole:(id:string,roles:string[])=>void;roleOptions:readonly SelectOption[]}){
  const [query,setQuery]=React.useState(''),[team,setTeam]=React.useState('all');
  const visible=members.filter(member=>`${member.name} ${member.email}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(team==='all'||member.team===team));
  return <><WorkspacePageHeader title="멤버 관리" description="함께 일하는 팀원을 찾고 역할을 관리하세요." eyebrow="TEAM MEMBERS" action={<Button onClick={onInvite} disabled={!roleOptions.length}><Icon name="add"/>멤버 초대</Button>}/>{!roleOptions.length&&<p className="component-helper">멤버를 초대하려면 역할을 먼저 추가하세요.</p>}<div className="layout-member-filters"><TextField label="멤버 검색" type="search" value={query} onChange={event=>setQuery(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="이름 또는 이메일 검색"/><Select label="소속 팀 필터" value={team} options={[{value:'all',label:'전체 팀'},...teams]} onValueChange={setTeam}/></div>
    <TableContainer label="워크스페이스 멤버 목록" className="layout-members-table"><Table><thead><tr><th scope="col">멤버</th><th scope="col">소속 팀</th><th scope="col">역할</th><th scope="col">상태</th></tr></thead><tbody>{visible.map(member=><tr key={member.id}><td><span className="layout-person"><Avatar shape="circle" variant="neutral">{member.name.slice(0,1)}</Avatar><span><strong>{member.name}</strong><small>{member.email}</small></span></span></td><td>{member.team}</td><td><div className="layout-inline-select"><MultiSelect hideLabel label={`${member.name} 역할`} value={member.roles} options={roleOptions} presentation="inline" popupStrategy="fixed" placeholder="역할 선택" onValueChange={selected=>onRole(member.id,selected)}/></div></td><td><Badge variant="success">활성</Badge></td></tr>)}</tbody></Table></TableContainer>{!visible.length&&<p role="status" className="layout-empty">검색 결과가 없습니다.</p>}<p className="layout-content-caption">전체 {members.length}명 중 {visible.length}명을 표시합니다.</p>
  </>;
}

type SettingsProps={settings:WorkspaceSettings;onSave:(patch:Partial<WorkspaceSettings>)=>void};
type NotificationSettingsProps={settings:WorkspaceSettings;onChange:(patch:Partial<WorkspaceSettings>)=>void};
type SettingsDraft=Partial<Pick<WorkspaceSettings,'name'|'description'|'timezone'|'sideMenuStyle'>>;

function WorkspaceSettingsForm({settings,onSave}:SettingsProps){
  const [draft,setDraft]=React.useState<SettingsDraft>({}),[error,setError]=React.useState(''),[saved,setSaved]=React.useState(false);
  const menuStyleDescriptionId=React.useId();
  const name=draft.name??settings.name,description=draft.description??settings.description,timezone=draft.timezone??settings.timezone,sideMenuStyle=draft.sideMenuStyle??settings.sideMenuStyle;
  const change=<K extends keyof SettingsDraft,>(key:K,value:WorkspaceSettings[K])=>{setDraft(current=>{const next={...current};if(value===settings[key])delete next[key];else next[key]=value;return next;});setSaved(false);};
  return <form className="layout-panel layout-settings" noValidate onSubmit={event=>{event.preventDefault();if(!name.trim()){setError('워크스페이스 이름을 입력해주세요.');return;}onSave({...draft,...(draft.name!==undefined?{name:name.trim()}:{})});setDraft({});setSaved(true);}}>
    <div><h2>기본 정보</h2><p>이 정보는 사이드바와 탑바에 함께 표시됩니다.</p></div>
    <TextField label="워크스페이스 이름" value={name} onChange={event=>{change('name',event.target.value);setError('');}} required error={error||undefined}/>
    <TextArea label="워크스페이스 소개" value={description} onChange={event=>change('description',event.target.value)} rows={3}/>
    <Select label="시간대" value={timezone} onValueChange={value=>change('timezone',value)} options={[{value:'seoul',label:'서울 (UTC+09:00)'},{value:'tokyo',label:'도쿄 (UTC+09:00)'},{value:'utc',label:'UTC (UTC+00:00)'}]}/>
    <div>
      <Select label="사이드 메뉴 스타일" value={sideMenuStyle} onValueChange={value=>change('sideMenuStyle',value as WorkspaceSettings['sideMenuStyle'])} options={[{value:'category',label:'카테고리형 (기본)'},{value:'tree',label:'트리형'}]} aria-describedby={menuStyleDescriptionId}/>
      <p id={menuStyleDescriptionId} className="component-helper">카테고리형은 업무 공간·조직 관리·환경 설정을 제목으로 구분합니다.</p>
    </div>
    <div className="layout-settings-actions"><span role="status">{saved?'변경사항을 저장했습니다.':''}</span><Button type="submit"><Icon name="save"/>변경사항 저장</Button></div>
  </form>;
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
