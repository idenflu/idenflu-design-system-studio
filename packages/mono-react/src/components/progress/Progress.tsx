import * as React from 'react';
import { classes } from '../../shared/classes';

export interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> { thickness?: 'thin' | 'normal' | 'thick'; variant?: 'primary' | 'success' | 'warning' | 'danger' }

export const Progress = React.forwardRef<HTMLProgressElement, ProgressProps>(function Progress({ thickness = 'normal', variant = 'primary', className, ...props }, ref) { return <progress {...props} ref={ref} className={classes('progress-bar', thickness !== 'normal' && `progress-bar--${thickness}`, variant !== 'primary' && `progress-bar--${variant}`, className)} />; });

export interface CircleProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> { value: number; max?: number; label: string; variant?: 'primary' | 'success' }

export function CircleProgress({ value, max = 100, label, variant = 'primary', className, ...props }: CircleProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  const percent = Math.round(safeValue / safeMax * 100);
  return <div {...props} className={classes('progress-circle', variant === 'success' && 'progress-circle--success', className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={safeValue}><svg viewBox="0 0 36 36" aria-hidden="true"><circle className="progress-circle-track" cx="18" cy="18" r="15.9155" /><circle className="progress-circle-value" cx="18" cy="18" r="15.9155" strokeDasharray={`${percent} ${100 - percent}`} /></svg><span aria-hidden="true">{percent}%</span></div>;
}

export interface SegmentedProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> { value: number; total: number; label: string }

export function SegmentedProgress({ value, total, label, className, ...props }: SegmentedProgressProps) {
  const count = Number.isFinite(total) ? Math.max(1, Math.floor(total)) : 1;
  const current = Number.isFinite(value) ? Math.min(count, Math.max(0, Math.floor(value))) : 0;
  return <div {...props} className={classes('progress-segments', className)} style={{ ...props.style, gridTemplateColumns:`repeat(${count}, minmax(0, 1fr))` }} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={count} aria-valuenow={current}>{Array.from({length:count}, (_, index) => <span key={index} aria-hidden="true" className={index < current ? 'is-complete' : undefined} />)}</div>;
}
