import * as React from 'react';
import {Badge,Icon,type BadgeProps} from '@idenflu/mono-react';
import {feedbackIconNames,emphasizedFeedbackIconNames} from '../../../packages/react/src/status-icons';

export const statusDefinitions = {
  pending:{label:'대기',icon:'circle-dashed',solidIcon:'circle-dashed',variant:'neutral',description:'시작하지 않은 작업이나 준비 중인 상태'},
  progress:{label:'진행 중',icon:'circle-dot',solidIcon:'circle-dot',variant:'primary',description:'작업이 진행 중인 상태. 요청의 로딩 애니메이션은 Spinner로 표시'},
  review:{label:'검토 중',icon:'circle-dot',solidIcon:'circle-dot',variant:'primary',description:'검토가 진행 중인 상태. 검토가 필요한 주의 상태와 구분'},
  paused:{label:'보류',icon:'pause-circle',solidIcon:'pause-circle',variant:'neutral',description:'일시중지하거나 재개를 기다리는 상태'},
  inactive:{label:'비활성',icon:'minus-circle',solidIcon:'minus-circle',variant:'neutral',description:'적용하지 않거나 현재 사용하지 않는 상태'},
  success:{label:'완료',icon:feedbackIconNames.success,solidIcon:emphasizedFeedbackIconNames.success,variant:'success',description:'작업을 완료하거나 성공한 결과'},
  info:{label:'안내',icon:feedbackIconNames.info,solidIcon:emphasizedFeedbackIconNames.info,variant:'primary',description:'사용자에게 전달하는 부가 정보'},
  warning:{label:'주의',icon:feedbackIconNames.warning,solidIcon:emphasizedFeedbackIconNames.warning,variant:'warning',description:'검토·확인 등 주의가 필요한 조건'},
  error:{label:'오류',icon:feedbackIconNames.danger,solidIcon:emphasizedFeedbackIconNames.danger,variant:'danger',description:'작업 실패나 해결이 필요한 오류'},
  blocked:{label:'차단',icon:'ban',solidIcon:'ban-fill',variant:'danger',description:'허용되지 않은 접근이나 실행을 차단한 상태'},
} as const;
export type DemoStatus = keyof typeof statusDefinitions;

export function StatusBadge({status,appearance='default',children,...props}:Omit<BadgeProps,'variant'> & {status:DemoStatus}) {
  const definition=statusDefinitions[status];
  return <Badge {...props} appearance={appearance} variant={definition.variant}>
    <Icon name={appearance==='solid'?definition.solidIcon:definition.icon} />{children??definition.label}
  </Badge>;
}

export const projectStatusDefinitions = {
  '준비 중':'pending','진행 중':'progress','검토 중':'review','완료':'success','보류':'paused','지연':'warning',
} as const;
export function ProjectStatusBadge({value}:{value:string}) {
  const status=projectStatusDefinitions[value as keyof typeof projectStatusDefinitions];
  return status ? <StatusBadge status={status}>{value}</StatusBadge> : <Badge>{value}</Badge>;
}
