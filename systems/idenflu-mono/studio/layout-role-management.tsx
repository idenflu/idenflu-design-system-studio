import { PageHeader } from './page-heading';
import * as React from 'react';
import { Avatar, Badge, Button, Checkbox, Dialog, DialogBody, DialogFooter, DialogHeader, Icon, Select, Tabs, TextArea, TextField } from '@idenflu/mono-react';
import { roleNotificationChannels, roleNotifications, rolePermissions, type RoleConnections, type RoleNotificationChannel, type WorkspaceRole } from './layout-role-data';
import { type Member } from './layout-workspace-data';

const permissionGroups = [...new Set(rolePermissions.map(item=>item.group))];
const sameConnections = (a:RoleConnections,b:RoleConnections) =>
  a.permissions.length===b.permissions.length && a.permissions.every(id=>b.permissions.includes(id)) &&
  roleNotifications.every(({id})=>roleNotificationChannels.every(channel=>!!a.notifications[id]?.includes(channel)===!!b.notifications[id]?.includes(channel)));
const notificationCount = (connections:RoleConnections) => roleNotifications.filter(({id})=>connections.notifications[id]?.length).length;
type RoleDetails = Pick<WorkspaceRole,'name'|'description'>;
const normalizedRoleName = (name:string) => name.trim().normalize('NFC').toLocaleLowerCase();

export function RoleManagementPage({roles,members,onSave,onCreate,onUpdate,onDelete}: {
  roles:WorkspaceRole[];
  members:Member[];
  onSave:(id:string,connections:RoleConnections)=>void;
  onCreate:(details:RoleDetails)=>string;
  onUpdate:(id:string,details:RoleDetails)=>void;
  onDelete:(id:string,replacementId?:string)=>void;
}) {
  const [query,setQuery] = React.useState('');
  const [permissionQuery,setPermissionQuery] = React.useState('');
  const [selectedId,setSelectedId] = React.useState(roles[0]?.id??'');
  const [drafts,setDrafts] = React.useState<Record<string,RoleConnections>>({});
  const [feedback,setFeedback] = React.useState('');
  const [editor,setEditor] = React.useState<(RoleDetails&{id:string|null})|null>(null);
  const [nameError,setNameError] = React.useState('');
  const [deleteId,setDeleteId] = React.useState<string|null>(null);
  const [replacementId,setReplacementId] = React.useState('');
  const dialogId = React.useId(), formId = `${dialogId}-form`;
  const nameInput = React.useRef<HTMLInputElement>(null), deleteCancel = React.useRef<HTMLButtonElement>(null);
  const permissionInput = React.useRef<HTMLInputElement>(null);
  const addButton = React.useRef<HTMLButtonElement>(null), roleList = React.useRef<HTMLDivElement>(null);
  const focusAfterDelete = React.useRef(false);
  const visible = roles.filter(role=>`${role.name} ${role.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const selected = visible.find(role=>role.id===selectedId)??visible[0];
  const draft = selected ? drafts[selected.id]??selected : null;
  const normalizedPermissionQuery = permissionQuery.trim().toLocaleLowerCase();
  const visiblePermissions = rolePermissions.filter(item=>`${item.name} ${item.description} ${item.group}`.toLocaleLowerCase().includes(normalizedPermissionQuery));
  const visiblePermissionGroups = permissionGroups.map(group=>({group,items:visiblePermissions.filter(item=>item.group===group)})).filter(({items})=>items.length);
  const dirty = !!selected && !!draft && !sameConnections(draft,selected);
  const changedPermissions = selected&&draft?rolePermissions.filter(({id})=>draft.permissions.includes(id)!==selected.permissions.includes(id)).length:0;
  const changedNotifications = selected&&draft?roleNotifications.filter(({id})=>roleNotificationChannels.some(channel=>!!draft.notifications[id]?.includes(channel)!==!!selected.notifications[id]?.includes(channel))).length:0;
  const memberCount = (role:WorkspaceRole) => members.filter(member=>member.roles.includes(role.name)).length;
  const deleting = roles.find(role=>role.id===deleteId);
  const deletingMemberCount = deleting?memberCount(deleting):0;
  const replacements = roles.filter(role=>role.id!==deleteId);
  const canDelete = !!deleting && (!deletingMemberCount || replacements.some(role=>role.id===replacementId));
  React.useEffect(()=>{if(selected&&selected.id!==selectedId)setSelectedId(selected.id);},[selected?.id,selectedId]);
  React.useEffect(()=>setFeedback(''),[selected?.id]);
  React.useEffect(()=>{if(editor)nameInput.current?.focus();},[!!editor]);
  React.useEffect(()=>{if(deleteId)deleteCancel.current?.focus();},[deleteId]);
  React.useEffect(()=>{
    if(!focusAfterDelete.current)return;
    focusAfterDelete.current=false;
    const next=roleList.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    (next??addButton.current)?.focus();
  },[roles]);

  const updatePermissions = (ids:string[]) => {
    if(!selected || !draft)return;
    setDrafts(current=>({...current,[selected.id]:{...draft,permissions:ids}}));
    setFeedback('');
  };
  const togglePermission = (id:string,checked:boolean) => {
    if(!draft)return;
    updatePermissions(checked?[...draft.permissions,id]:draft.permissions.filter(value=>value!==id));
  };
  const toggleNotification = (id:string,channel:RoleNotificationChannel,checked:boolean) => {
    if(!selected || !draft)return;
    const channels=draft.notifications[id]??[];
    const next=checked?[...channels,channel]:channels.filter(value=>value!==channel);
    const notifications={...draft.notifications};
    if(next.length)notifications[id]=next;else delete notifications[id];
    setDrafts(current=>({...current,[selected.id]:{...draft,notifications}}));
    setFeedback('');
  };
  const clearDraft = () => {
    if(!selected)return;
    setDrafts(current=>{const next={...current};delete next[selected.id];return next;});
  };
  const save = () => {
    if(!selected || !draft)return;
    onSave(selected.id,{permissions:[...draft.permissions],notifications:Object.fromEntries(Object.entries(draft.notifications).map(([id,channels])=>[id,[...channels]]))});
    clearDraft();
    setFeedback(`${selected.name} 역할의 설정을 저장했습니다.`);
  };
  const openEditor = (role?:WorkspaceRole) => {
    setNameError('');
    setEditor(role?{id:role.id,name:role.name,description:role.description}:{id:null,name:'',description:''});
  };
  const saveDetails = (event:React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(!editor)return;
    const details={name:editor.name.trim(),description:editor.description.trim()};
    if(!details.name){setNameError('역할 이름을 입력해주세요.');nameInput.current?.focus();return;}
    if(roles.some(role=>role.id!==editor.id&&normalizedRoleName(role.name)===normalizedRoleName(details.name))){setNameError('이미 사용 중인 역할 이름입니다.');nameInput.current?.focus();return;}
    const id=editor.id??onCreate(details);
    if(!id){setNameError('역할 정보를 저장하지 못했습니다. 이름을 다시 확인해주세요.');nameInput.current?.focus();return;}
    if(editor.id)onUpdate(editor.id,details);
    setQuery('');setSelectedId(id);setEditor(null);
    setFeedback(`${details.name} 역할의 기본 정보를 저장했습니다.`);
  };
  const deleteRole = () => {
    if(!deleting||!canDelete)return;
    const id=deleting.id;
    const next=roles.find(role=>role.id!==id);
    focusAfterDelete.current=true;
    onDelete(id,deletingMemberCount?replacementId:undefined);
    setDrafts(current=>{const nextDrafts={...current};delete nextDrafts[id];return nextDrafts;});
    setDeleteId(null);setReplacementId('');setQuery('');setSelectedId(next?.id??'');
  };

  return <>
    <PageHeader className="layout-page-heading" title="역할 관리" eyebrow="ORGANIZATION MANAGEMENT" description="역할별 사용 권한과 수신할 알림을 설정하세요."/>
    <div className="layout-master-detail layout-role-management">
      <section className="layout-master-panel" aria-label="역할 목록 영역">
        <div className="layout-master-toolbar">
          <div className="layout-role-list-title"><h2>역할 목록 <span className="layout-role-list-count">{roles.length}개</span></h2><Button ref={addButton} size="sm" onClick={()=>openEditor()}><Icon name="plus"/>역할 추가</Button></div>
          <TextField label="역할 검색" type="search" value={query} onChange={event=>setQuery(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="역할 이름 검색"/>
        </div>
        <div ref={roleList} className="layout-master-list" role="group" aria-label="역할 목록">
          {visible.map(role=>{
            const connections=drafts[role.id]??role;
            return <button className="layout-master-item layout-role-item" type="button" key={role.id} aria-label={role.name} aria-pressed={selected?.id===role.id} onClick={()=>setSelectedId(role.id)}>
              <span><strong>{role.name}</strong><small>권한 {connections.permissions.length}개 · 알림 {notificationCount(connections)}개</small></span>
              <Badge variant="neutral">{memberCount(role)}명</Badge>
            </button>;
          })}
          {!visible.length&&<p className="layout-empty" role="status">{roles.length?'검색 결과가 없습니다.':'등록된 역할이 없습니다. 역할을 추가해주세요.'}</p>}
        </div>
      </section>
      <section className="layout-master-detail-panel layout-role-detail" aria-label="역할 상세">
        {selected&&draft?<>
          <header className="layout-role-header">
            <Avatar variant="neutral"><Icon name="shield-check"/></Avatar>
            <div><div className="layout-role-title"><h2>{selected.name}</h2><Badge variant="warning" style={{visibility:dirty?'visible':'hidden'}} aria-hidden={!dirty}>변경 중</Badge></div><p>{selected.description||'역할 설명이 없습니다.'}</p><span className="layout-role-members"><Icon name="users"/>이 역할을 사용하는 멤버 {memberCount(selected)}명</span></div>
            <div className="layout-role-header-actions"><Button variant="outline" size="sm" onClick={()=>openEditor(selected)}><Icon name="edit"/>역할 수정</Button><Button variant="outline" color="danger" size="sm" className="layout-role-delete" onClick={()=>{setReplacementId('');setDeleteId(selected.id);}}><Icon name="trash"/>역할 삭제</Button></div>
          </header>
          <Tabs className="layout-role-tabs" label="역할 연결 정보" items={[
            {value:'permissions',label:`권한 ${draft.permissions.length}`,content:<>
              <div className="layout-role-section-heading"><div><h3>사용 권한</h3><p>이 역할에 허용할 작업을 선택하세요.</p></div><Badge variant="neutral">{draft.permissions.length} / {rolePermissions.length}</Badge></div>
              <div className="layout-role-permission-search">
                <TextField ref={permissionInput} label="사용 권한 검색" type="search" value={permissionQuery} onChange={event=>setPermissionQuery(event.target.value)} prefix={<Icon name="search"/>} prefixDecorative placeholder="권한 이름, 설명 또는 그룹 검색" aria-describedby={`${dialogId}-permission-results`}/>
                <p id={`${dialogId}-permission-results`} role="status">{normalizedPermissionQuery?`검색 결과 ${visiblePermissions.length}개`:`전체 ${rolePermissions.length}개`}</p>
              </div>
              {visiblePermissionGroups.map(({group,items})=>{
                const count=items.filter(item=>draft.permissions.includes(item.id)).length;
                const selectAllLabel=normalizedPermissionQuery?'검색 결과 전체 선택':'전체 선택';
                return <section className="layout-role-permission-group" key={group} aria-label={`${group} 권한`}>
                  <header><Checkbox containerClassName="layout-role-group-check" label={<span className="layout-role-group-title"><strong>{group}</strong><span className="layout-role-group-count">{count} / {items.length} 허용</span></span>} aria-label={`${group} ${selectAllLabel}`} checked={count===items.length} indeterminate={count>0&&count<items.length} onChange={event=>updatePermissions(event.target.checked?[...new Set([...draft.permissions,...items.map(item=>item.id)])]:draft.permissions.filter(id=>!items.some(item=>item.id===id)))}/></header>
                  <div className="layout-role-options">{items.map(item=>{
                    const changed=draft.permissions.includes(item.id)!==selected.permissions.includes(item.id);
                    const descriptionId=`${selected.id}-${item.id}-description`;
                    return <div className="layout-role-option" key={item.id} data-changed={changed||undefined}>
                      <Checkbox containerClassName="layout-role-option-check" label={<span className="layout-role-option-label"><strong>{item.name}</strong>{changed&&<span className="layout-role-change-mark">변경</span>}</span>} aria-label={item.name} checked={draft.permissions.includes(item.id)} aria-describedby={descriptionId} onChange={event=>togglePermission(item.id,event.target.checked)}/>
                      <p id={descriptionId} className="layout-role-option-description">{item.description}</p>
                    </div>;
                  })}</div>
                </section>;
              })}
              {!visiblePermissions.length&&<div className="layout-empty layout-role-permission-empty"><p>검색 결과가 없습니다.</p><Button variant="outline" size="sm" onClick={()=>{setPermissionQuery('');permissionInput.current?.focus();}}>검색 초기화</Button></div>}
            </>},
            {value:'notifications',label:`알림 ${notificationCount(draft)}`,content:<>
              <div className="layout-role-section-heading"><div><h3>수신 알림</h3><p>이 역할을 가진 멤버에게 전달할 알림과 수신 방법을 선택하세요.</p></div><Badge variant="neutral">{notificationCount(draft)} / {roleNotifications.length}</Badge></div>
              <div className="layout-role-notifications">
                <div className="layout-role-notification-head" aria-hidden="true"><span>알림</span><span>앱</span><span>이메일</span></div>
                {roleNotifications.map(item=>{
                  const changed=roleNotificationChannels.some(channel=>!!draft.notifications[item.id]?.includes(channel)!==!!selected.notifications[item.id]?.includes(channel));
                  const descriptionId=`${selected.id}-${item.id}-description`;
                  return <div className="layout-role-notification" key={item.id} data-changed={changed||undefined}>
                    <div className="layout-role-notification-info"><strong>{item.name}</strong>{changed&&<span className="layout-role-change-mark">변경</span>}<p id={descriptionId}>{item.description}</p></div>
                    {roleNotificationChannels.map(channel=>{const label=channel==='app'?'앱':'이메일';return <Checkbox key={channel} label={<span className="sr-only">{label}</span>} containerClassName={`layout-role-channel layout-role-channel--${channel}`} aria-label={`${item.name} ${label}`} aria-describedby={descriptionId} checked={channel==='app'&&(draft.notifications[item.id]?.includes(channel)??false)} disabled={channel==='email'} onChange={event=>toggleNotification(item.id,channel,event.target.checked)}/>;})}
                  </div>;
                })}
              </div>
              <p className="component-helper layout-role-channel-note">이메일 채널은 준비 중이라 이 샘플에서는 선택할 수 없습니다.</p>
            </>},
          ]}/>
          <footer className="layout-role-footer"><span role="status" className={dirty?'layout-role-change-summary':undefined}>{dirty?`변경된 권한 ${changedPermissions}개 · 알림 ${changedNotifications}개`:feedback}</span><div><Button variant="outline" disabled={!dirty} onClick={()=>{clearDraft();setFeedback('변경사항을 취소했습니다.');}}>변경 취소</Button><Button disabled={!dirty} onClick={save}><Icon name="save"/>변경사항 저장</Button></div></footer>
        </>:<div className="layout-empty">역할을 선택하면 권한과 알림을 확인할 수 있습니다.</div>}
      </section>
    </div>
    <Dialog open={editor!==null} onOpenChange={open=>{if(!open)setEditor(null);}} variant="divided" className="layout-role-dialog" aria-labelledby={`${dialogId}-edit-title`} aria-describedby={`${dialogId}-edit-description`} closeOnBackdrop>
      <DialogHeader><div><h2 id={`${dialogId}-edit-title`}>{editor?.id?'역할 수정':'역할 추가'}</h2><p id={`${dialogId}-edit-description`}>{editor?.id?'이름과 설명을 수정합니다. 멤버의 역할 이름도 함께 반영됩니다.':'역할을 만든 뒤 사용 권한과 수신 알림을 설정하세요.'}</p></div><Button variant="ghost" size="sm" aria-label="닫기" onClick={()=>setEditor(null)}><Icon name="x"/></Button></DialogHeader>
      <DialogBody>{editor&&<form id={formId} className="layout-role-form" noValidate onSubmit={saveDetails}><TextField ref={nameInput} label="역할 이름" prefix={<Icon name="shield-check"/>} prefixDecorative value={editor.name} onChange={event=>{setEditor({...editor,name:event.target.value});setNameError('');}} required maxLength={40} error={nameError||undefined} placeholder="예: 프로젝트 검토자"/><TextArea label="역할 설명" value={editor.description} onChange={event=>setEditor({...editor,description:event.target.value})} maxLength={240} rows={3} placeholder="역할의 목적과 담당 업무를 적어주세요."/></form>}</DialogBody>
      <DialogFooter><Button variant="outline" onClick={()=>setEditor(null)}>취소</Button><Button type="submit" form={formId}>{editor?.id?'저장':'역할 추가'}</Button></DialogFooter>
    </Dialog>
    <Dialog open={deleteId!==null} onOpenChange={open=>{if(!open)setDeleteId(null);}} variant="divided" className="layout-role-dialog" aria-labelledby={`${dialogId}-delete-title`} aria-describedby={`${dialogId}-delete-description`}>
      <DialogHeader><h2 id={`${dialogId}-delete-title`}>역할 삭제</h2><Button variant="ghost" size="sm" aria-label="닫기" onClick={()=>setDeleteId(null)}><Icon name="x"/></Button></DialogHeader>
      <DialogBody><div className="layout-role-form"><p id={`${dialogId}-delete-description`}><strong>{deleting?.name}</strong> 역할을 삭제할까요? 연결된 권한과 알림 설정도 함께 삭제됩니다.</p>{deletingMemberCount>0?<>{replacements.length?<Select label="대체 역할" value={replacementId} onValueChange={setReplacementId} options={replacements.map(role=>({value:role.id,label:role.name}))} placeholder="대체 역할 선택" required popupStrategy="fixed" helperText={`이 역할을 사용하는 멤버 ${deletingMemberCount}명에게 적용할 대체 역할을 선택하세요.`}/>:<p className="field-error">사용 중인 마지막 역할은 삭제할 수 없습니다. 다른 역할을 먼저 추가해주세요.</p>}</>:<p className="component-helper">현재 이 역할을 사용하는 멤버가 없습니다.</p>}</div></DialogBody>
      <DialogFooter><Button ref={deleteCancel} variant="outline" onClick={()=>setDeleteId(null)}>취소</Button><Button color="danger" disabled={!canDelete} onClick={deleteRole}><Icon name="trash"/>삭제</Button></DialogFooter>
    </Dialog>
  </>;
}
