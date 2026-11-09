import * as React from 'react';
import { Icon } from '../icon/Icon';
import { feedbackIconNames, emphasizedFeedbackIconNames } from '../../shared/status-icons';

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  appearance?: 'default' | 'solid';
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

export function Toast({ children, variant = 'info', appearance = 'default', icon, action, onDismiss, className = '', role, ...props }: ToastProps) {
  const indicator = icon === undefined ? <Icon name={(appearance==='solid' ? emphasizedFeedbackIconNames : feedbackIconNames)[variant]} /> : icon;
  return <div aria-atomic="true" {...props} role={role || (variant === 'danger' ? 'alert' : 'status')} className={`toast toast--${variant}${appearance === 'solid' ? ' toast--solid' : ''} ${className}`}>
    {indicator != null && indicator !== false && <span className="toast-icon" aria-hidden="true">{indicator}</span>}
    <p>{children}</p>{action && <div className="toast-action">{action}</div>}{onDismiss && <button type="button" className="icon-button" aria-label="알림 닫기" onClick={onDismiss}><span className="ui-icon icon-close" aria-hidden="true" /></button>}</div>;
}
