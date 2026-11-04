import * as React from 'react';
import { version as packageVersion } from '../package.json';
import { Avatar, Button, Dialog, DialogHeader, DialogBody, DialogFooter, Drawer, DropdownMenu, Icon, IconButton, Popover, Tabs, TextField, Tree, type TreeNode } from '../src';
import { StudioSettings, ThemeControl } from './controls';
import { initialWorkspaceRoles, type WorkspaceRole } from './layout-role-data';
import { RoleManagementPage } from './layout-role-management';
import { defaultExpanded, filterWorkspaceTree, initialMembers, initialProjects, initialSettings, pageInfo, workspacePagePath, workspaceTree, type Member, type Project, type ProjectDraft, type WorkspacePage, type WorkspaceSettings, type WorkspaceTab } from './layout-workspace-data';
import { HomePage, InviteMemberForm, MasterDetailPage, MembersPage, NotificationSettingsPage, ProfileForm, ProjectDetailContent, ProjectDetailPage, ProjectForm, ProjectsPage, SettingsPage, VerticalSettingsPage } from './layout-workspace-pages';

function notificationAge(timestamp:number,now:number){
  const minutes=Math.max(0,Math.floor((now-timestamp)/60_000));
  if(minutes<1)return '방금 전';
  if(minutes<60)return `${minutes}분 전`;
  const hours=Math.floor(minutes/60);
  return hours<24?`${hours}시간 전`:`${Math.floor(hours/24)}일 전`;
}

function SidebarNavigation({items,query,onQuery,selected,expanded,onExpanded,onPage,sideMenuStyle,mobile,onClose}: {items:TreeNode[];query:string;onQuery:(value:string)=>void;selected:string;expanded:string[];onExpanded:(values:string[])=>void;onPage:(page:WorkspacePage)=>void;sideMenuStyle:WorkspaceSettings['sideMenuStyle'];mobile?:boolean;onClose?:()=>void}) {
  return <div className="layout-sidebar-inner">
    <div className="layout-sidebar-brand"><img className="layout-brand-mark" src="./assets/nova-workspace.svg" alt=""/><strong>NOVA Workspace</strong>{mobile&&<Button variant="ghost" size="sm" aria-label="메뉴 닫기" onClick={onClose}><Icon name="close"/></Button>}</div>
    <div className="layout-menu-search"><TextField hideLabel label="메뉴 검색" type="search" value={query} onChange={event=>onQuery(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="메뉴 검색"/></div>
    <nav className="layout-tree-navigation" aria-label="워크스페이스 메뉴"><Tree label="워크스페이스 트리 메뉴" rootStyle={sideMenuStyle} items={items} value={selected} onValueChange={value=>onPage(value as WorkspacePage)} expanded={expanded} onExpandedChange={onExpanded}/>{!items.length&&<p className="layout-empty">검색 결과가 없습니다.</p>}</nav>
    <footer className="layout-sidebar-footer"><span>버전</span><span>v{packageVersion}</span></footer>
  </div>;
}

function WorkspaceTabsToolbar({workspaceRef,items,onSelect}: {workspaceRef:React.RefObject<HTMLElement|null>;items:{value:string;label:string;disabled?:boolean}[];onSelect:(value:string)=>void}) {
  const toolbar=React.useRef<HTMLDivElement>(null);
  const [scroll,setScroll]=React.useState({overflow:false,previous:false,next:false});
  React.useEffect(()=>{
    const list=workspaceRef.current?.querySelector<HTMLElement>('.layout-workspace-tabs > .tab-list');
    if(!list)return;
    const update=()=>{
      const showingControls=toolbar.current?.dataset.overflow==='true';
      const overflow=!window.matchMedia('(max-width: 600px)').matches && list.scrollWidth>list.clientWidth+(showingControls?64:0)+1;
      const next={overflow,previous:overflow&&list.scrollLeft>1,next:overflow&&list.scrollLeft+list.clientWidth<list.scrollWidth-1};
      setScroll(current=>current.overflow===next.overflow&&current.previous===next.previous&&current.next===next.next?current:next);
    };
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(update);
    const observe=()=>{observer?.disconnect();observer?.observe(list);Array.from(list.children).forEach(child=>observer?.observe(child));update();};
    const mutations=new MutationObserver(observe);
    mutations.observe(list,{childList:true,subtree:true,characterData:true});
    list.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);observe();
    return ()=>{mutations.disconnect();observer?.disconnect();list.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
  },[workspaceRef]);
  const move=(direction:number)=>{const list=workspaceRef.current?.querySelector<HTMLElement>('.layout-workspace-tabs > .tab-list');if(list)list.scrollBy({left:direction*Math.max(160,list.clientWidth*.7),behavior:'auto'});};
  return <div ref={toolbar} className="layout-tabs-toolbar" data-overflow={scroll.overflow?'true':undefined}>
    {scroll.overflow&&<div className="layout-tabs-scroll-controls"><IconButton size="sm" className="layout-tabs-scroll-button" label="이전 탭 보기" disabled={!scroll.previous} onClick={()=>move(-1)}><Icon name="keyboard-arrow-left"/></IconButton><IconButton size="sm" className="layout-tabs-scroll-button" label="다음 탭 보기" disabled={!scroll.next} onClick={()=>move(1)}><Icon name="keyboard-arrow-right"/></IconButton></div>}
    <DropdownMenu align="end" label="열린 탭과 탭 관리" trigger={<><span className="layout-tabs-trigger-icon"><Icon name="keyboard-arrow-down"/></span><span className="layout-tabs-trigger-label" aria-hidden="true">열린 탭</span><span className="sr-only">열린 탭 메뉴</span></>} items={items} onSelect={onSelect}/>
  </div>;
}

export function SidebarLayoutSample() {
  const [projects,setProjects]=React.useState(initialProjects),[members,setMembers]=React.useState(initialMembers),[settings,setSettings]=React.useState(initialSettings);
  const [workspaceRoles,setWorkspaceRoles]=React.useState(initialWorkspaceRoles);
  const roleOptions=workspaceRoles.map(role=>({value:role.name,label:role.name}));
  const defaultInviteRole=workspaceRoles.find(role=>role.id==='role-editor')?.name??workspaceRoles.find(role=>role.id==='role-viewer')?.name??'';
  const profileRoleOptions=workspaceRoles.map(role=>({value:role.name,label:role.id==='role-admin'&&role.name==='관리자'?'워크스페이스 관리자':role.name}));
  const [tabs,setTabs]=React.useState<WorkspaceTab[]>([{key:'home',page:'home'},{key:'projects',page:'projects'}]);
  const [active,setActive]=React.useState('projects'),[expanded,setExpanded]=React.useState(defaultExpanded),[searchExpanded,setSearchExpanded]=React.useState(defaultExpanded),[menuQuery,setMenuQuery]=React.useState('');
  const [mobileOpen,setMobileOpen]=React.useState(false),[searchOpen,setSearchOpen]=React.useState(false),[search,setSearch]=React.useState('');
  const [createOpen,setCreateOpen]=React.useState(false),[inviteOpen,setInviteOpen]=React.useState(false),[accountOpen,setAccountOpen]=React.useState(false);
  const [detailProjectId,setDetailProjectId]=React.useState<string|null>(null);
  const [deleteProjectIds,setDeleteProjectIds]=React.useState<string[]|null>(null);
  const [notificationOpen,setNotificationOpen]=React.useState(false),[unread,setUnread]=React.useState(['reviews','project:PRJ-001','design-guide']),[notice,setNotice]=React.useState('');
  const [notificationTimes]=React.useState(()=>{const now=Date.now();return {reviews:now-5*60_000,project:now-60*60_000,guide:now-2*60*60_000};});
  const [notificationNow,setNotificationNow]=React.useState(Date.now);
  const createFormId=React.useId(),inviteFormId=React.useId(),profileFormId=React.useId();
  const searchInput=React.useRef<HTMLInputElement>(null);
  const deleteCancel=React.useRef<HTMLButtonElement>(null);
  const deleteConfirmed=React.useRef(false);
  const workspaceRef=React.useRef<HTMLElement>(null);
  const roleSequence=React.useRef(0);
  const activeTab=tabs.find(tab=>tab.key===active)??tabs[0];
  const currentMember=members.find(member=>member.id==='member-1')??initialMembers[0];
  const detailProject=projects.find(project=>project.id===detailProjectId);
  const deleteProjects=projects.filter(project=>deleteProjectIds?.includes(project.id));
  const selected=activeTab.page==='project-detail'?'projects':activeTab.page;
  const tabTitle=(tab:WorkspaceTab)=>tab.page==='project-detail'?projects.find(project=>project.id===tab.projectId)?.name??'프로젝트 상세':pageInfo[tab.page].title;
  const breadcrumbs=workspacePagePath(selected);
  if(activeTab.page==='project-detail')breadcrumbs.push(tabTitle(activeTab));
  const activate=(key:string)=>{setActive(key);const tab=tabs.find(item=>item.key===key);const page=tab?.page==='project-detail'?'projects':tab?.page;if(page)setExpanded(values=>Array.from(new Set([...values,'work',pageInfo[page].parent])));};
  const openTab=(tab:WorkspaceTab)=>{setTabs(values=>values.some(item=>item.key===tab.key)?values:[...values,tab]);setActive(tab.key);const page=tab.page==='project-detail'?'projects':tab.page;setExpanded(values=>Array.from(new Set([...values,'work',pageInfo[page].parent])));setMobileOpen(false);setSearchOpen(false);setMenuQuery('');};
  const openPage=(page:WorkspacePage)=>openTab({key:page,page});
  const openProject=(id:string)=>openTab({key:`project:${id}`,page:'project-detail',projectId:id});
  const closeTab=(key:string)=>setTabs(values=>values.filter(tab=>tab.key!==key||tab.page==='home'));
  const updateProject=(id:string,patch:Partial<Project>)=>{setProjects(values=>values.map(project=>project.id===id?{...project,...patch}:project));setNotice('프로젝트 변경사항을 적용했습니다.');};
  const confirmDelete=()=>{
    const ids=new Set(deleteProjects.map(project=>project.id));
    if(!ids.size){setDeleteProjectIds(null);return;}
    const remainingTabs=tabs.filter(tab=>tab.page!=='project-detail'||!ids.has(tab.projectId??''));
    setProjects(values=>values.filter(project=>!ids.has(project.id)));
    setTabs(remainingTabs);
    if(!remainingTabs.some(tab=>tab.key===active))setActive(remainingTabs[remainingTabs.length-1]?.key??'home');
    if(detailProjectId&&ids.has(detailProjectId))setDetailProjectId(null);
    deleteConfirmed.current=true;
    setDeleteProjectIds(null);
    setNotice(`${ids.size}개 프로젝트를 삭제했습니다.`);
  };
  React.useEffect(()=>{document.title=`${tabTitle(activeTab)} · ${settings.name} | NOVA Workspace`;},[activeTab,projects,settings.name]);
  React.useEffect(()=>{const shortcut=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'&&!document.querySelector('dialog[open]')){event.preventDefault();setSearch('');setSearchOpen(true);}};document.addEventListener('keydown',shortcut);return()=>document.removeEventListener('keydown',shortcut);},[]);
  React.useEffect(()=>{if(searchOpen)searchInput.current?.focus();},[searchOpen]);
  React.useEffect(()=>{if(deleteProjectIds)deleteCancel.current?.focus();else if(deleteConfirmed.current){deleteConfirmed.current=false;workspaceRef.current?.querySelector<HTMLElement>('.tab-panel:not([hidden]) .data-grid-scroll')?.focus();}},[deleteProjectIds]);
  React.useEffect(()=>{if(!notificationOpen)return;setNotificationNow(Date.now());const timer=window.setInterval(()=>setNotificationNow(Date.now()),60_000);return()=>window.clearInterval(timer);},[notificationOpen]);
  React.useEffect(()=>{const media=window.matchMedia('(min-width: 901px)');const change=()=>{if(media.matches)setMobileOpen(false);};media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
  const createProject=(draft:ProjectDraft)=>{const id=`PRJ-${String(Math.max(0,...projects.map(project=>Number(project.id.split('-')[1])))+1).padStart(3,'0')}`;setProjects(values=>[{...draft,id,owner:currentMember.name,status:'준비 중',progress:0},...values]);setCreateOpen(false);openProject(id);setNotice(`“${draft.name}” 프로젝트를 만들었습니다.`);};
  const saveProfile=(profile:Pick<Member,'name'|'email'>)=>{setMembers(values=>values.map(member=>member.id===currentMember.id?{...member,...profile}:member));if(profile.name!==currentMember.name)setProjects(values=>values.map(project=>project.owner===currentMember.name?{...project,owner:profile.name}:project));setAccountOpen(false);setNotice('프로필을 저장했습니다.');};
  const inviteMember=(member:Omit<Member,'id'>)=>{if(members.some(item=>item.email.toLowerCase()===member.email.toLowerCase())){setNotice('이미 등록된 이메일입니다.');return;}if(!member.roles.length||member.roles.some(name=>!workspaceRoles.some(role=>role.name===name))){setNotice('현재 사용할 수 있는 역할을 선택해주세요.');return;}setMembers(values=>[...values,{...member,roles:[...new Set(member.roles)],id:`member-${Date.now()}`}]);setInviteOpen(false);setNotice(`${member.name}님을 샘플 멤버 목록에 추가했습니다.`);};
  const createWorkspaceRole=(details:Pick<WorkspaceRole,'name'|'description'>)=>{
    const name=details.name.trim().normalize('NFC');
    if(!name||workspaceRoles.some(role=>role.name.normalize('NFC').toLocaleLowerCase()===name.toLocaleLowerCase())){setNotice('중복되지 않는 역할 이름을 입력해주세요.');return '';}
    const id=`role-${Date.now()}-${++roleSequence.current}`;
    setWorkspaceRoles(values=>[...values,{id,name,description:details.description.trim(),permissions:[],notifications:{}}]);
    setNotice(`“${name}” 역할을 추가했습니다. 권한과 알림을 설정해주세요.`);
    return id;
  };
  const updateWorkspaceRole=(id:string,details:Pick<WorkspaceRole,'name'|'description'>)=>{
    const current=workspaceRoles.find(role=>role.id===id),name=details.name.trim().normalize('NFC');
    if(!current)return;
    if(!name||workspaceRoles.some(role=>role.id!==id&&role.name.normalize('NFC').toLocaleLowerCase()===name.toLocaleLowerCase())){setNotice('중복되지 않는 역할 이름을 입력해주세요.');return;}
    setWorkspaceRoles(values=>values.map(role=>role.id===id?{...role,name,description:details.description.trim()}:role));
    if(name!==current.name)setMembers(values=>values.map(member=>member.roles.includes(current.name)?{...member,roles:[...new Set(member.roles.map(value=>value===current.name?name:value))]}:member));
    setNotice('역할 정보를 수정했습니다.');
  };
  const deleteWorkspaceRole=(id:string,replacementId?:string)=>{
    const current=workspaceRoles.find(role=>role.id===id);
    if(!current)return;
    const used=members.some(member=>member.roles.includes(current.name));
    const replacement=workspaceRoles.find(role=>role.id!==id&&role.id===replacementId);
    if(used&&!replacement){setNotice('사용 중인 역할은 대체 역할을 선택해야 삭제할 수 있습니다.');return;}
    if(used&&replacement)setMembers(values=>values.map(member=>member.roles.includes(current.name)?{...member,roles:[...new Set([...member.roles.filter(name=>name!==current.name),replacement.name])]}:member));
    setWorkspaceRoles(values=>values.filter(role=>role.id!==id));
    setNotice(`“${current.name}” 역할을 삭제했습니다.`);
  };
  const renderPage=(tab:WorkspaceTab)=>{
    if(tab.page==='project-detail'){const project=projects.find(item=>item.id===tab.projectId);return project?<ProjectDetailPage project={project} members={members} onUpdate={updateProject} onPage={openPage}/>:null;}
    if(tab.page==='home')return <HomePage projects={projects} members={members} onOpen={openProject} onPage={openPage}/>;
    if(tab.page==='master-detail')return <MasterDetailPage projects={projects} members={members} onUpdate={updateProject} onOpen={openProject}/>;
    if(tab.page==='members')return <MembersPage members={members} roleOptions={roleOptions} onInvite={()=>setInviteOpen(true)} onRole={(id,roles)=>{const assigned=[...new Set(roles.filter(name=>workspaceRoles.some(role=>role.name===name)))];setMembers(values=>values.map(member=>member.id===id?{...member,roles:assigned}:member));setNotice('멤버 역할을 변경했습니다.');}}/>;
    if(tab.page==='role-management')return <RoleManagementPage roles={workspaceRoles} members={members} onCreate={createWorkspaceRole} onUpdate={updateWorkspaceRole} onDelete={deleteWorkspaceRole} onSave={(id,connections)=>{setWorkspaceRoles(values=>values.map(role=>role.id===id?{...role,...connections}:role));setNotice('역할의 권한과 알림 설정을 저장했습니다.');}}/>;
    if(tab.page==='settings')return <SettingsPage settings={settings} onSave={patch=>{setSettings(values=>({...values,...patch}));setNotice('워크스페이스 설정을 저장했습니다.');}}/>;
    if(tab.page==='notifications')return <NotificationSettingsPage settings={settings} onChange={patch=>setSettings(values=>({...values,...patch}))}/>;
    if(tab.page==='vertical-settings')return <VerticalSettingsPage settings={settings} onSave={patch=>{setSettings(values=>({...values,...patch}));setNotice('워크스페이스 설정을 저장했습니다.');}} onChange={patch=>setSettings(values=>({...values,...patch}))}/>;
    return <ProjectsPage page={tab.page} projects={projects} onOpen={setDetailProjectId} onCreate={()=>setCreateOpen(true)} onDelete={setDeleteProjectIds}/>;
  };
  const tree=filterWorkspaceTree(workspaceTree(settings.sideMenuStyle),menuQuery);
  const sidebarProps={items:tree,query:menuQuery,onQuery:(value:string)=>{setMenuQuery(value);setSearchExpanded(defaultExpanded);},selected,expanded:menuQuery?searchExpanded:expanded,onExpanded:menuQuery?setSearchExpanded:setExpanded,onPage:openPage,sideMenuStyle:settings.sideMenuStyle};
  const needle=search.trim().toLocaleLowerCase();
  const menuResults=(Object.keys(pageInfo) as WorkspacePage[]).filter(page=>`${pageInfo[page].title} ${pageInfo[page].group}`.toLocaleLowerCase().includes(needle));
  const projectResults=projects.filter(project=>`${project.name} ${project.id}`.toLocaleLowerCase().includes(needle)).slice(0,5);
  const tabMenuItems=[...tabs.map(tab=>({value:`tab:${tab.key}`,label:`${tabTitle(tab)}${tab.key===active?' (현재)':''}`})),{value:'others',label:'다른 작업 탭 닫기',disabled:tabs.length<=(active==='home'?1:2)},{value:'all',label:'작업 탭 모두 닫기',disabled:tabs.length===1}];
  const workspaceTabItems=tabs.map(tab=>({value:tab.key,label:<><span>{tabTitle(tab)}</span>{tab.page==='home'&&<span className="sr-only"> (고정)</span>}</>,closable:tab.page!=='home',closeLabel:`${tabTitle(tab)} 탭 닫기`,content:<div className="layout-page-content">{renderPage(tab)}</div>}));
  return <div className="layout-sample-app">
    <a className="layout-sample-skip" href="#workspace-content" onClick={event=>{event.preventDefault();document.querySelector<HTMLElement>('.layout-workspace-tabs .tab-panel:not([hidden])')?.focus();}}>콘텐츠로 바로가기</a>
    <aside className="layout-workspace-sidebar" aria-label="사이드바"><SidebarNavigation {...sidebarProps}/></aside>
    <header className="layout-workspace-topbar" aria-label="탑바"><div className="layout-topbar-location"><Button variant="ghost" className="layout-mobile-menu" aria-label="메뉴 열기" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(true)}><Icon name="menu"/></Button><nav aria-label="현재 위치">{breadcrumbs.map((title,index)=><React.Fragment key={`${index}-${title}`}>{index>0&&<Icon name="keyboard-arrow-right"/>}{index===breadcrumbs.length-1?<strong aria-current="page">{title}</strong>:<span>{title}</span>}</React.Fragment>)}</nav></div>
      <div className="layout-topbar-tools"><Button variant="outline" className="layout-quick-search" onClick={()=>{setSearch('');setSearchOpen(true);}} aria-label="빠른 검색"><Icon name="search"/><span>메뉴 및 프로젝트 검색</span><kbd>⌘ K</kbd></Button><ThemeControl/>
        <div className="layout-notification-popover">
          <Popover align="end" iconOnly triggerLabel={`업무 알림${unread.length?` ${unread.length}개`:""}`} open={notificationOpen} onOpenChange={setNotificationOpen} label="업무 알림" trigger={<span className="layout-notification-trigger"><Icon name="bell"/>{unread.length>0&&<i/>}</span>}>
            <header><h2>알림</h2><Button size="sm" variant="ghost" disabled={!unread.length} onClick={()=>setUnread([])}>모두 읽음</Button></header>
            <button type="button" className={unread.includes('reviews')?'is-unread':undefined} onClick={()=>setUnread(values=>values.filter(value=>value!=='reviews'))}>
              <Icon name="check-circle"/>
              <span className="layout-notification-copy">
                <span className="layout-notification-title"><strong>프로젝트 검토 요청</strong>{unread.includes('reviews')&&<span className="layout-notification-unread"><span className="sr-only">안 읽음</span></span>}</span>
                <time dateTime={new Date(notificationTimes.reviews).toISOString()}>{notificationAge(notificationTimes.reviews,notificationNow)}</time>
                <small>팀의 검토 대기 프로젝트를 확인해주세요.</small>
              </span>
            </button>
            <button type="button" className={unread.includes('project:PRJ-001')?'is-unread':undefined} onClick={()=>setUnread(values=>values.filter(value=>value!=='project:PRJ-001'))}>
              <Icon name="folder"/>
              <span className="layout-notification-copy">
                <span className="layout-notification-title"><strong>디자인 시스템 v2</strong>{unread.includes('project:PRJ-001')&&<span className="layout-notification-unread"><span className="sr-only">안 읽음</span></span>}</span>
                <time dateTime={new Date(notificationTimes.project).toISOString()}>{notificationAge(notificationTimes.project,notificationNow)}</time>
                <small>프로젝트 진행 현황을 확인하세요.</small>
              </span>
            </button>
            <button type="button" className={unread.includes('design-guide')?'is-unread':undefined} onClick={()=>setUnread(values=>values.filter(value=>value!=='design-guide'))}>
              <Icon name="bell"/>
              <span className="layout-notification-copy">
                <span className="layout-notification-title"><strong>디자인 가이드 업데이트</strong>{unread.includes('design-guide')&&<span className="layout-notification-unread"><span className="sr-only">안 읽음</span></span>}</span>
                <time dateTime={new Date(notificationTimes.guide).toISOString()}>{notificationAge(notificationTimes.guide,notificationNow)}</time>
                <small>새 디자인 가이드가 등록되었습니다. 변경된 컴포넌트 사용법을 확인해주세요.</small>
              </span>
            </button>
          </Popover>
        </div>
        <div className="layout-account-menu"><DropdownMenu align="end" label="사용자 메뉴" trigger={<><Avatar size="sm" shape="circle" variant="neutral" aria-hidden="true">{Array.from(currentMember.name)[0]}</Avatar><span className="layout-account-name">{currentMember.name}</span><span className="sr-only"> 사용자 메뉴</span><Icon name="caret"/></>} items={[{value:'account',label:'내 프로필',icon:<Icon name="person"/>},{value:'settings',label:'워크스페이스 설정',icon:<Icon name="settings"/>},{value:'notifications',label:'알림 설정',icon:<Icon name="bell"/>}]} onSelect={value=>{if(value==='account')setAccountOpen(true);else openPage(value as WorkspacePage);}}/></div>
      </div>
    </header>
    <main ref={workspaceRef} className="layout-workspace-content" id="workspace-content" aria-label="콘텐츠 영역"><WorkspaceTabsToolbar workspaceRef={workspaceRef} items={tabMenuItems} onSelect={value=>{if(value.startsWith('tab:')){activate(value.slice(4));return;}if(value==='all'){setTabs([{key:'home',page:'home'}]);setActive('home');}else setTabs(values=>values.filter(tab=>tab.page==='home'||tab.key===active));}}/>
      <Tabs className="layout-workspace-tabs" label="열린 업무 화면" value={active} onValueChange={activate} onTabClose={closeTab} items={workspaceTabItems}/>
    </main>
    <span className="sr-only" role="status">{notice}</span>
    <div className="layout-floating-settings"><StudioSettings/></div>
    <Drawer open={mobileOpen} onOpenChange={setMobileOpen} className="layout-mobile-sidebar" aria-label="워크스페이스 메뉴"><SidebarNavigation {...sidebarProps} mobile onClose={()=>setMobileOpen(false)}/></Drawer>
    <Dialog open={deleteProjectIds!==null} onOpenChange={open=>{if(!open)setDeleteProjectIds(null);}} variant="divided" aria-labelledby="workspace-delete-title" aria-describedby="workspace-delete-description"><DialogHeader><h2 id="workspace-delete-title">프로젝트 삭제</h2><Button size="sm" variant="ghost" aria-label="닫기" onClick={()=>setDeleteProjectIds(null)}><Icon name="close"/></Button></DialogHeader><DialogBody><p id="workspace-delete-description">선택한 {deleteProjects.length}개 프로젝트를 삭제할까요?</p><ul className="layout-delete-project-list">{deleteProjects.slice(0,3).map(project=><li key={project.id}><strong>{project.name}</strong><span>{project.id}</span></li>)}{deleteProjects.length>3&&<li className="layout-delete-project-summary">외 {deleteProjects.length-3}개 프로젝트</li>}</ul><p className="component-helper">열려 있는 해당 프로젝트의 상세 탭도 함께 닫힙니다.</p></DialogBody><DialogFooter><Button ref={deleteCancel} variant="outline" onClick={()=>setDeleteProjectIds(null)}>취소</Button><Button variant="danger" disabled={!deleteProjects.length} onClick={confirmDelete}><Icon name="trash"/>삭제</Button></DialogFooter></Dialog>
    <Dialog open={searchOpen} onOpenChange={setSearchOpen} variant="divided" className="layout-command-dialog" aria-labelledby="workspace-search-title" aria-describedby="workspace-search-description" closeOnBackdrop><DialogHeader><div><h2 id="workspace-search-title">빠른 검색</h2><p id="workspace-search-description">메뉴나 프로젝트를 검색해 빠르게 이동하세요.</p></div><Button size="sm" variant="ghost" aria-label="검색 닫기" onClick={()=>setSearchOpen(false)}><Icon name="close"/></Button></DialogHeader><DialogBody><TextField hideLabel ref={searchInput} label="메뉴 및 프로젝트 검색" type="search" value={search} onChange={event=>setSearch(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="어떤 화면을 찾으세요?"/><div className="layout-command-results">{menuResults.length>0&&<section><h3>메뉴</h3>{menuResults.map(page=><button type="button" key={page} onClick={()=>openPage(page)}><Icon name={pageInfo[page].icon}/><span>{pageInfo[page].title}<small>{pageInfo[page].group}</small></span><Icon name="arrow-right"/></button>)}</section>}{projectResults.length>0&&<section><h3>프로젝트</h3>{projectResults.map(project=><button type="button" key={project.id} onClick={()=>openProject(project.id)}><Icon name="folder"/><span>{project.name}<small>{project.id}</small></span><Icon name="arrow-right"/></button>)}</section>}{!menuResults.length&&!projectResults.length&&<p className="layout-empty" role="status">검색 결과가 없습니다.</p>}</div></DialogBody></Dialog>
    <Dialog open={!!detailProject} onOpenChange={open=>{if(!open)setDetailProjectId(null);}} variant="divided" className="layout-project-detail-dialog" aria-labelledby="workspace-project-detail-title" closeOnBackdrop><DialogHeader><div><h2 id="workspace-project-detail-title">프로젝트 상세</h2>{detailProject&&<p>{detailProject.name} · {detailProject.id}</p>}</div><Button size="sm" variant="ghost" aria-label="닫기" onClick={()=>setDetailProjectId(null)}><Icon name="close"/></Button></DialogHeader><DialogBody>{detailProject&&<ProjectDetailContent project={detailProject} members={members} onUpdate={updateProject}/>}</DialogBody><DialogFooter><Button variant="outline" onClick={()=>setDetailProjectId(null)}>닫기</Button><Button onClick={()=>{if(detailProject){setDetailProjectId(null);openProject(detailProject.id);}}}>새 탭으로 열기<Icon name="arrow-right"/></Button></DialogFooter></Dialog>
    <Dialog open={createOpen} onOpenChange={setCreateOpen} variant="divided" className="layout-project-create-dialog" aria-labelledby="workspace-create-title" closeOnBackdrop><DialogHeader><h2 id="workspace-create-title">새 프로젝트</h2><Button size="sm" variant="ghost" aria-label="닫기" onClick={()=>setCreateOpen(false)}><Icon name="close"/></Button></DialogHeader><DialogBody>{createOpen&&<ProjectForm id={createFormId} onCreate={createProject}/>}</DialogBody><DialogFooter><Button variant="outline" onClick={()=>setCreateOpen(false)}>취소</Button><Button type="submit" form={createFormId}>프로젝트 만들기</Button></DialogFooter></Dialog>
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen} variant="divided" aria-labelledby="workspace-invite-title" closeOnBackdrop><DialogHeader><h2 id="workspace-invite-title">멤버 초대</h2><Button size="sm" variant="ghost" aria-label="닫기" onClick={()=>setInviteOpen(false)}><Icon name="close"/></Button></DialogHeader><DialogBody>{inviteOpen&&<InviteMemberForm id={inviteFormId} onInvite={inviteMember} existingEmails={members.map(member=>member.email)} roleOptions={roleOptions} defaultRole={defaultInviteRole}/>}</DialogBody><DialogFooter><Button variant="outline" onClick={()=>setInviteOpen(false)}>취소</Button><Button type="submit" form={inviteFormId} disabled={!roleOptions.length}>멤버 추가</Button></DialogFooter></Dialog>
    <Dialog open={accountOpen} onOpenChange={setAccountOpen} variant="divided" aria-labelledby="workspace-account-title" aria-describedby="workspace-account-description" closeOnBackdrop><DialogHeader><div><h2 id="workspace-account-title">내 프로필</h2><p id="workspace-account-description">이름과 이메일을 수정할 수 있습니다.</p></div><Button size="sm" variant="ghost" aria-label="닫기" onClick={()=>setAccountOpen(false)}><Icon name="close"/></Button></DialogHeader><DialogBody>{accountOpen&&<><div className="layout-profile"><Avatar size="lg" shape="circle" variant="neutral">{Array.from(currentMember.name)[0]}</Avatar></div><ProfileForm id={profileFormId} member={currentMember} members={members} onSave={saveProfile} roleOptions={profileRoleOptions}/><Button className="layout-profile-settings" variant="outline" onClick={()=>{setAccountOpen(false);openPage('settings');}}>워크스페이스 설정</Button></>}</DialogBody><DialogFooter><Button variant="outline" onClick={()=>setAccountOpen(false)}>취소</Button><Button type="submit" form={profileFormId}>저장</Button></DialogFooter></Dialog>
  </div>;
}
