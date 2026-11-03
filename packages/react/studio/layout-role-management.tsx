import * as React from 'react';
import { Avatar, Badge, Button, Checkbox, Icon, Tabs, TextField } from '../src';
import { WorkspacePageHeader } from './layout-workspace-pages';
import { roleNotifications, rolePermissions, type RoleConnections, type WorkspaceRole } from './layout-role-data';
import { type Member } from './layout-workspace-data';

const permissionGroups = [...new Set(rolePermissions.map(item=>item.group))];
const sameConnections = (a:RoleConnections,b:RoleConnections) =>
  a.permissions.length===b.permissions.length && a.permissions.every(id=>b.permissions.includes(id)) &&
  a.notifications.length===b.notifications.length && a.notifications.every(id=>b.notifications.includes(id));

export function RoleManagementPage({roles,members,onSave}: {
  roles:WorkspaceRole[];
  members:Member[];
  onSave:(id:string,connections:RoleConnections)=>void;
}) {
  const [query,setQuery] = React.useState('');
  const [selectedId,setSelectedId] = React.useState(roles[0]?.id??'');
  const [drafts,setDrafts] = React.useState<Record<string,RoleConnections>>({});
  const [feedback,setFeedback] = React.useState('');
  const visible = roles.filter(role=>`${role.name} ${role.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const selected = visible.find(role=>role.id===selectedId)??visible[0];
  const draft = selected ? drafts[selected.id]??selected : null;
  const dirty = !!selected && !!draft && !sameConnections(draft,selected);
  const memberCount = (role:WorkspaceRole) => members.filter(member=>member.roles.includes(role.name)).length;
  React.useEffect(()=>{if(selected&&selected.id!==selectedId)setSelectedId(selected.id);},[selected?.id,selectedId]);
  React.useEffect(()=>setFeedback(''),[selected?.id]);

  const update = (field:keyof RoleConnections,ids:string[]) => {
    if(!selected || !draft)return;
    setDrafts(current=>({...current,[selected.id]:{...draft,[field]:ids}}));
    setFeedback('');
  };
  const toggle = (field:keyof RoleConnections,id:string,checked:boolean) => {
    if(!draft)return;
    update(field,checked?[...draft[field],id]:draft[field].filter(value=>value!==id));
  };
  const clearDraft = () => {
    if(!selected)return;
    setDrafts(current=>{const next={...current};delete next[selected.id];return next;});
  };
  const save = () => {
    if(!selected || !draft)return;
    onSave(selected.id,{permissions:[...draft.permissions],notifications:[...draft.notifications]});
    clearDraft();
    setFeedback(`${selected.name} 역할의 설정을 저장했습니다.`);
  };

  return <>
    <WorkspacePageHeader title="역할 관리" eyebrow="ORGANIZATION MANAGEMENT" description="역할별 사용 권한과 수신할 알림을 설정하세요."/>
    <div className="layout-master-detail layout-role-management">
      <section className="layout-master-panel" aria-label="역할 목록 영역">
        <div className="layout-master-toolbar">
          <div className="layout-role-list-title"><h2>역할 목록</h2><Badge variant="neutral">{roles.length}개</Badge></div>
          <TextField label="역할 검색" type="search" value={query} onChange={event=>setQuery(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="역할 이름 검색"/>
        </div>
        <div className="layout-master-list" role="group" aria-label="역할 목록">
          {visible.map(role=>{
            const connections=drafts[role.id]??role;
            return <button className="layout-master-item layout-role-item" type="button" key={role.id} aria-label={role.name} aria-pressed={selected?.id===role.id} onClick={()=>setSelectedId(role.id)}>
              <span><strong>{role.name}</strong><small>권한 {connections.permissions.length}개 · 알림 {connections.notifications.length}개</small></span>
              <Badge variant="neutral">{memberCount(role)}명</Badge>
            </button>;
          })}
          {!visible.length&&<p className="layout-empty" role="status">검색 결과가 없습니다.</p>}
        </div>
      </section>
      <section className="layout-master-detail-panel layout-role-detail" aria-label="역할 상세">
        {selected&&draft?<>
          <header className="layout-role-header">
            <Avatar variant="neutral"><Icon name="shield-check"/></Avatar>
            <div><div className="layout-role-title"><h2>{selected.name}</h2>{dirty&&<Badge variant="warning">변경 중</Badge>}</div><p>{selected.description}</p><span className="layout-role-members"><Icon name="users"/>이 역할을 사용하는 멤버 {memberCount(selected)}명</span></div>
          </header>
          <Tabs className="layout-role-tabs" label="역할 연결 정보" items={[
            {value:'permissions',label:`권한 ${draft.permissions.length}`,content:<>
              <div className="layout-role-section-heading"><div><h3>사용 권한</h3><p>이 역할에 허용할 작업을 선택하세요.</p></div><Badge variant="neutral">{draft.permissions.length} / {rolePermissions.length}</Badge></div>
              {permissionGroups.map(group=>{
                const items=rolePermissions.filter(item=>item.group===group);
                const count=items.filter(item=>draft.permissions.includes(item.id)).length;
                return <section className="layout-role-permission-group" key={group} aria-label={`${group} 권한`}>
                  <header><h4>{group}</h4><Checkbox label={`${group} 전체 선택`} checked={count===items.length} indeterminate={count>0&&count<items.length} onChange={event=>update('permissions',event.target.checked?[...new Set([...draft.permissions,...items.map(item=>item.id)])]:draft.permissions.filter(id=>!items.some(item=>item.id===id)))}/></header>
                  <div className="layout-role-options">{items.map(item=><div className="layout-role-option" key={item.id}>
                    <Checkbox label={item.name} checked={draft.permissions.includes(item.id)} aria-describedby={`${selected.id}-${item.id}-description`} onChange={event=>toggle('permissions',item.id,event.target.checked)}/>
                    <p id={`${selected.id}-${item.id}-description`}>{item.description}</p>
                  </div>)}</div>
                </section>;
              })}
            </>},
            {value:'notifications',label:`알림 ${draft.notifications.length}`,content:<>
              <div className="layout-role-section-heading"><div><h3>수신 알림</h3><p>이 역할을 가진 멤버에게 전달할 알림을 선택하세요.</p></div><Badge variant="neutral">{draft.notifications.length} / {roleNotifications.length}</Badge></div>
              <div className="layout-role-notifications">{roleNotifications.map(item=><div className="layout-role-notification" key={item.id}>
                <div className="layout-role-option"><Checkbox label={item.name} checked={draft.notifications.includes(item.id)} aria-describedby={`${selected.id}-${item.id}-description`} onChange={event=>toggle('notifications',item.id,event.target.checked)}/><p id={`${selected.id}-${item.id}-description`}>{item.description}</p></div>
                <Badge variant="neutral">{item.channel}</Badge>
              </div>)}</div>
            </>},
          ]}/>
          <footer className="layout-role-footer"><span role="status">{feedback}</span><div><Button variant="outline" disabled={!dirty} onClick={()=>{clearDraft();setFeedback('변경사항을 취소했습니다.');}}>변경 취소</Button><Button disabled={!dirty} onClick={save}><Icon name="save"/>변경사항 저장</Button></div></footer>
        </>:<div className="layout-empty">역할을 선택하면 권한과 알림을 확인할 수 있습니다.</div>}
      </section>
    </div>
  </>;
}
