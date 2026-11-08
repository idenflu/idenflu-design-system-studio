import * as React from 'react';
import { Icon, type IconName, type TreeNode } from '@idenflu/mono-react';
import { initialWorkspaceRoles } from './layout-role-data';

export type Project = {id:string; name:string; team:string; owner:string; status:string; progress:number; due:string; description:string};
export type ProjectDraft = Pick<Project,'name'|'team'|'description'|'due'>;
export type Member = {id:string; name:string; email:string; team:string; roles:string[]};
export type WorkspaceSettings = {name:string; description:string; timezone:string; sideMenuStyle:'tree'|'category'; projectNotifications:boolean; weeklySummary:boolean; mentionNotifications:boolean};
export type WorkspacePage = 'home'|'projects'|'active-projects'|'reviews'|'completed'|'master-detail'|'members'|'role-management'|'settings'|'notifications'|'vertical-settings';
export type WorkspaceTab = {key:string; page:WorkspacePage|'project-detail'|'not-found'; projectId?:string; path?:string};
type WorkspaceMenuGroup='work'|'project-menu'|'team-menu'|'settings-menu';
type WorkspaceMenuGroupInfo={title:string;parent?:WorkspaceMenuGroup};
const workspaceGroups:Record<WorkspaceMenuGroup,WorkspaceMenuGroupInfo>={
  work:{title:'업무 공간'},
  'project-menu':{title:'프로젝트 관리',parent:'work'},
  'team-menu':{title:'조직 관리'},
  'settings-menu':{title:'환경 설정'},
};
export const pageInfo:Record<WorkspacePage,{title:string; group:string; parent:WorkspaceMenuGroup; icon:IconName; description:string}> = {
  home:{title:'대시보드',group:'업무 공간',parent:'work',icon:'home',description:'팀의 주요 업무와 최근 활동을 한눈에 확인하세요.'},
  projects:{title:'전체 프로젝트',group:'프로젝트 관리',parent:'project-menu',icon:'grid',description:'팀의 프로젝트를 검색하고 진행 상황을 관리하세요.'},
  'active-projects':{title:'진행 중 프로젝트',group:'프로젝트 관리',parent:'project-menu',icon:'clock',description:'현재 작업 중인 프로젝트와 마감 일정을 확인하세요.'},
  reviews:{title:'검토 요청',group:'프로젝트 관리',parent:'project-menu',icon:'check-circle',description:'검토가 필요한 프로젝트를 확인하고 다음 단계를 진행하세요.'},
  completed:{title:'완료된 프로젝트',group:'프로젝트 관리',parent:'project-menu',icon:'folder',description:'작업을 마친 프로젝트와 결과를 확인하세요.'},
  'master-detail':{title:'마스터-디테일',group:'프로젝트 관리',parent:'project-menu',icon:'grid',description:'프로젝트 목록과 선택한 항목의 상세 정보를 함께 확인하세요.'},
  members:{title:'멤버 관리',group:'조직 관리',parent:'team-menu',icon:'person',description:'함께 일하는 팀원을 찾고 역할을 관리하세요.'},
  'role-management':{title:'역할 관리',group:'조직 관리',parent:'team-menu',icon:'shield-check',description:'역할별 사용 권한과 수신할 알림을 설정하세요.'},
  settings:{title:'워크스페이스 설정',group:'환경 설정',parent:'settings-menu',icon:'settings',description:'워크스페이스의 기본 정보와 표시 기준을 설정하세요.'},
  notifications:{title:'알림 설정',group:'환경 설정',parent:'settings-menu',icon:'bell',description:'필요한 업무 알림을 선택하세요. 변경 즉시 적용됩니다.'},
  'vertical-settings':{title:'버티컬 탭 설정',group:'환경 설정',parent:'settings-menu',icon:'settings',description:'설정 항목을 세로 탭으로 나누어 관리하세요.'},
};
export function workspacePagePath(page:WorkspacePage):string[]{
  const path=[pageInfo[page].title];
  let parent:WorkspaceMenuGroup|undefined=pageInfo[page].parent;
  while(parent){const group:WorkspaceMenuGroupInfo=workspaceGroups[parent];path.unshift(group.title);parent=group.parent;}
  return path;
}
export const defaultExpanded=['work','project-menu','team-menu','settings-menu'];
export const statuses=['준비 중','진행 중','검토 중','완료'].map(value=>({value,label:value}));
export const teams=['프로덕트 디자인','플랫폼 개발','브랜드 디자인'].map(value=>({value,label:value}));
export const roles=initialWorkspaceRoles.map(role=>({value:role.name,label:role.name}));
const extraProjectAreas=[
  '계정 관리','결제 흐름','상품 탐색','주문 내역','고객 상담','알림 센터','문서 공유',
  '검색 경험','운영 대시보드','사용자 권한','파트너 정산','콘텐츠 관리','모바일 내비게이션','예약 관리',
  '데이터 분석','접근성 가이드','컴포넌트 문서','온보딩 여정','운영 리포트','캠페인 성과','브랜드 자산',
  'API 콘솔','파일 업로드','활동 피드','협업 보드','관리자 설정','보안 알림','성능 모니터링',
];
const extraProjectWork=['사용성 개선','기능 확장','운영 정비','품질 점검'];
const extraProjects:Project[]=Array.from({length:extraProjectAreas.length*extraProjectWork.length},(_,index)=>{
  const area=extraProjectAreas[index%extraProjectAreas.length];
  const work=extraProjectWork[Math.floor(index/extraProjectAreas.length)];
  const team=teams[index%teams.length].value;
  const status=statuses[index%statuses.length].value;
  const cycle=Math.floor(index/statuses.length);
  const progress=status==='완료'?100:status==='검토 중'?75+(cycle*7)%25:status==='진행 중'?25+(cycle*11)%60:(cycle*3)%25;
  const owner=team==='프로덕트 디자인'?(index%2===0?'김민수':'이서연'):team==='플랫폼 개발'?'박지훈':'정수빈';
  return {id:`PRJ-${String(index+9).padStart(3,'0')}`,name:`${area} ${work}`,team,owner,status,progress,due:new Date(Date.UTC(2026,10,10+index)).toISOString().slice(0,10),description:`${area} 영역의 ${work}을 진행하고 관련 화면과 운영 흐름을 정리합니다.`};
});
export const initialProjects:Project[]=[
  {id:'PRJ-001',name:'디자인 시스템 v2',team:'프로덕트 디자인',owner:'김민수',status:'진행 중',progress:72,due:'2026-11-12',description:'공통 컴포넌트의 사용 규칙을 정리하고 제품 화면에 일관된 경험을 적용합니다.'},
  {id:'PRJ-002',name:'모바일 앱 온보딩',team:'프로덕트 디자인',owner:'이서연',status:'검토 중',progress:90,due:'2026-11-16',description:'새 사용자가 주요 기능을 이해하고 첫 작업을 완료할 수 있도록 진입 과정을 개선합니다.'},
  {id:'PRJ-003',name:'파트너 포털',team:'플랫폼 개발',owner:'박지훈',status:'진행 중',progress:48,due:'2026-11-20',description:'파트너가 계약과 요청을 한곳에서 확인하고 필요한 자료를 공유하는 공간을 만듭니다.'},
  {id:'PRJ-004',name:'브랜드 가이드 개편',team:'브랜드 디자인',owner:'정수빈',status:'준비 중',progress:15,due:'2026-11-24',description:'다양한 매체에서 사용할 수 있도록 시각 원칙과 표현 예시를 정리합니다.'},
  {id:'PRJ-005',name:'고객 피드백 분석',team:'프로덕트 디자인',owner:'이서연',status:'완료',progress:100,due:'2026-11-05',description:'사용자 인터뷰와 문의를 분류하고 다음 분기의 개선 과제를 정리합니다.'},
  {id:'PRJ-006',name:'파일 공유 개선',team:'플랫폼 개발',owner:'박지훈',status:'진행 중',progress:36,due:'2026-11-25',description:'파일을 공유하고 변경 이력을 쉽게 확인할 수 있도록 개선합니다.'},
  {id:'PRJ-007',name:'접근성 점검',team:'프로덕트 디자인',owner:'김민수',status:'검토 중',progress:84,due:'2026-11-18',description:'키보드 탐색과 읽기 순서, 대비를 점검하고 공통 개선 사항을 반영합니다.'},
  {id:'PRJ-008',name:'연간 캠페인 준비',team:'브랜드 디자인',owner:'정수빈',status:'준비 중',progress:12,due:'2026-12-02',description:'제품의 주요 가치를 전달할 콘텐츠와 캠페인 일정을 준비합니다.'},
  ...extraProjects,
];
export const initialMembers:Member[]=[
  {id:'member-1',name:'김민수',email:'minsu@example.com',team:'프로덕트 디자인',roles:['관리자']},
  {id:'member-2',name:'이서연',email:'seoyeon@example.com',team:'프로덕트 디자인',roles:['편집자']},
  {id:'member-3',name:'박지훈',email:'jihoon@example.com',team:'플랫폼 개발',roles:['편집자']},
  {id:'member-4',name:'정수빈',email:'subin@example.com',team:'브랜드 디자인',roles:['뷰어']},
];
export const initialSettings:WorkspaceSettings={name:'제품팀',description:'함께 더 나은 제품 경험을 만드는 공간입니다.',timezone:'seoul',sideMenuStyle:'category',projectNotifications:true,weeklySummary:true,mentionNotifications:true};
export const badgeVariant=(status:string)=>status==='완료'?'success' as const:status==='검토 중'?'warning' as const:status==='진행 중'?'primary' as const:'neutral' as const;

export function workspaceTree(style:WorkspaceSettings['sideMenuStyle']=initialSettings.sideMenuStyle):TreeNode[]{
  const category=style==='category';
  const label=(title:string,icon?:IconName)=><span className="layout-tree-label">{icon&&<Icon name={icon}/>}<span>{title}</span></span>;
  const leaf=(value:WorkspacePage,firstLevel=false):TreeNode=>({value,label:label(pageInfo[value].title,category&&firstLevel?pageInfo[value].icon:undefined)});
  const group=(value:WorkspaceMenuGroup,children:TreeNode[],icon?:IconName):TreeNode=>({value,label:label(workspaceGroups[value].title,icon),children});
  const rootIcon=category?undefined:'folder';
  return [
    group('work',[
      leaf('home',true),
      group('project-menu',[leaf('projects'),leaf('active-projects'),leaf('reviews'),leaf('completed'),leaf('master-detail')],category?'folder':undefined),
    ],rootIcon),
    group('team-menu',[leaf('members',true),leaf('role-management',true)],rootIcon),
    group('settings-menu',[leaf('settings',true),leaf('notifications',true),leaf('vertical-settings',true)],rootIcon),
  ];
}

export function filterWorkspaceTree(items:readonly TreeNode[],query:string):TreeNode[]{
  const needle=query.trim().toLocaleLowerCase().replace(/\s/g,'');
  if(!needle)return [...items];
  return items.flatMap(item=>{
    const info=pageInfo[item.value as WorkspacePage];
    if(info&&`${info.title}${info.group}`.toLocaleLowerCase().replace(/\s/g,'').includes(needle))return [item];
    if(item.children){const children=filterWorkspaceTree(item.children,query);if(children.length)return [{...item,children}];}
    return [];
  });
}
