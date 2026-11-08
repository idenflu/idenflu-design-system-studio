import { pageInfo, type WorkspacePage, type WorkspaceTab } from './layout-workspace-data';

// The hash names only the active screen; the open tab set is per-browser-tab state kept in sessionStorage.
const pageSlugs:Record<WorkspacePage,string>={
  home:'dashboard',
  projects:'projects',
  'active-projects':'projects/active',
  reviews:'projects/reviews',
  completed:'projects/completed',
  'master-detail':'projects/browse',
  members:'members',
  'role-management':'roles',
  settings:'settings',
  notifications:'settings/notifications',
  'vertical-settings':'settings/tabs',
};
const storageKey='nova-workspace-tabs';

export const defaultWorkspaceTabs:WorkspaceTab[]=[{key:'home',page:'home'},{key:'projects',page:'projects'}];
export const defaultWorkspaceTabKey='projects';
export type WorkspaceRoute={kind:'default'}|{kind:'tab';tab:WorkspaceTab}|{kind:'unknown';path:string};

export function workspaceTabHash(tab:WorkspaceTab):string{
  if(tab.page==='not-found')return `#/${tab.path??''}`;
  return `#/${tab.page==='project-detail'?`projects/${encodeURIComponent(tab.projectId??'')}`:pageSlugs[tab.page]}`;
}

// A route that names nothing becomes a not-found tab that keeps the requested address visible for correction.
export function notFoundWorkspaceTab(path:string,projectId?:string):WorkspaceTab{
  return {key:`missing:${path}`,page:'not-found',path,...(projectId?{projectId}:{})};
}

export function parseWorkspaceHash(hash:string):WorkspaceRoute{
  const path=hash.replace(/^#\/?/,'').replace(/\/+$/,'');
  if(!path)return {kind:'default'};
  const page=(Object.keys(pageSlugs) as WorkspacePage[]).find(key=>pageSlugs[key]===path);
  if(page)return {kind:'tab',tab:{key:page,page}};
  const project=/^projects\/([^/]+)$/.exec(path);
  if(project){
    let id=project[1];
    try{id=decodeURIComponent(id);}catch{/* Keep the raw segment; the caller reports it as missing. */}
    return {kind:'tab',tab:{key:`project:${id}`,page:'project-detail',projectId:id}};
  }
  return {kind:'unknown',path};
}

const isWorkspaceTab=(value:unknown):value is WorkspaceTab=>{
  if(!value||typeof value!=='object')return false;
  const tab=value as Partial<WorkspaceTab>;
  if(typeof tab.key!=='string')return false;
  if(tab.page==='project-detail')return typeof tab.projectId==='string';
  if(tab.page==='not-found')return typeof tab.path==='string';
  return typeof tab.page==='string'&&tab.page in pageInfo;
};

export function readStoredWorkspaceTabs():{tabs:WorkspaceTab[];active:string}|null{
  try{
    const raw=sessionStorage.getItem(storageKey);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as {tabs?:unknown;active?:unknown};
    if(!Array.isArray(parsed.tabs)||typeof parsed.active!=='string')return null;
    const tabs=parsed.tabs.filter(isWorkspaceTab);
    if(!tabs.some(tab=>tab.page==='home'))tabs.unshift({key:'home',page:'home'});
    return {tabs,active:parsed.active};
  }catch{return null;}
}

export function storeWorkspaceTabs(tabs:readonly WorkspaceTab[],active:string){
  try{sessionStorage.setItem(storageKey,JSON.stringify({tabs,active}));}catch{/* Private mode or blocked storage keeps the in-memory tabs only. */}
}
