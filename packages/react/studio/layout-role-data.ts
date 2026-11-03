export interface RolePermission {
  id: string;
  name: string;
  group: string;
  description: string;
}
export const roleNotificationChannels = ['app','email'] as const;
export type RoleNotificationChannel = typeof roleNotificationChannels[number];
export interface RoleNotification {
  id: string;
  name: string;
  description: string;
}
export interface WorkspaceRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  notifications: Record<string, RoleNotificationChannel[]>;
}
export type RoleConnections = Pick<WorkspaceRole, 'permissions' | 'notifications'>;

export const rolePermissions: RolePermission[] = [
  {id:'project.view',name:'프로젝트 조회',group:'프로젝트',description:'프로젝트 목록과 상세 정보를 확인합니다.'},
  {id:'project.create',name:'프로젝트 생성',group:'프로젝트',description:'새 프로젝트를 만들고 담당 팀을 지정합니다.'},
  {id:'project.edit',name:'프로젝트 수정',group:'프로젝트',description:'프로젝트의 상태, 일정과 담당자를 변경합니다.'},
  {id:'project.delete',name:'프로젝트 삭제',group:'프로젝트',description:'선택한 프로젝트를 삭제합니다.'},
  {id:'member.view',name:'멤버 조회',group:'조직',description:'멤버 목록과 소속 팀을 확인합니다.'},
  {id:'member.invite',name:'멤버 초대',group:'조직',description:'워크스페이스에 새로운 멤버를 초대합니다.'},
  {id:'member.role',name:'멤버 역할 변경',group:'조직',description:'멤버에게 역할을 부여하거나 해제합니다.'},
  {id:'workspace.settings',name:'워크스페이스 설정',group:'관리',description:'워크스페이스의 기본 정보를 변경합니다.'},
  {id:'role.manage',name:'역할 설정',group:'관리',description:'역할에 연결된 권한과 알림을 관리합니다.'},
];
export const roleNotifications: RoleNotification[] = [
  {id:'project.updated',name:'프로젝트 상태 변경',description:'프로젝트의 상태나 담당자가 변경되면 알려줍니다.'},
  {id:'project.due',name:'마감일 알림',description:'진행 중인 프로젝트의 마감일이 다가오면 알려줍니다.'},
  {id:'project.review',name:'검토 요청',description:'프로젝트 검토가 요청되면 알려줍니다.'},
  {id:'member.invited',name:'멤버 초대 알림',description:'새로운 멤버가 워크스페이스에 합류하면 알려줍니다.'},
  {id:'activity.weekly',name:'주간 활동 요약',description:'한 주 동안의 프로젝트 진행 현황을 모아 받습니다.'},
];
const initialNotifications = (ids:string[]):Record<string,RoleNotificationChannel[]> => Object.fromEntries(ids.map(id=>[id,['app']]));
export const initialWorkspaceRoles: WorkspaceRole[] = [
  {id:'role-admin',name:'관리자',description:'워크스페이스와 팀의 모든 업무를 관리하는 역할입니다.',permissions:rolePermissions.map(item=>item.id),notifications:initialNotifications(roleNotifications.map(item=>item.id))},
  {id:'role-editor',name:'편집자',description:'프로젝트를 만들고 내용을 수정하며 팀과 협업하는 역할입니다.',permissions:['project.view','project.create','project.edit','member.view'],notifications:initialNotifications(['project.updated','project.due','project.review','activity.weekly'])},
  {id:'role-viewer',name:'뷰어',description:'프로젝트와 멤버 정보를 확인하는 읽기 중심의 역할입니다.',permissions:['project.view','member.view'],notifications:initialNotifications(['activity.weekly'])},
];
