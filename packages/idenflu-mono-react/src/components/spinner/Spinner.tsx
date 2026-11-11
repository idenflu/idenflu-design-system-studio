import * as React from 'react';
import { classes } from '../../shared/classes';
import { NovaSpinner } from '../nova-spinner/NovaSpinner';

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> { size?: 'small' | 'medium' | 'large'; variant?: 'primary' | 'neutral' | 'inverse'; kind?: 'ring' | 'dual' | 'dots' | 'bars' | 'nova'; label?: string }

export function Spinner({ size = 'medium', variant = 'primary', kind = 'ring', label = '로딩 중', className, ...props }: SpinnerProps) {
  if (kind === 'nova') return <NovaSpinner {...props} size={{small:16,medium:24,large:32}[size]} variant={variant === 'primary' ? 'brand' : variant} label={label} className={className} />;
  const marks = kind === 'dots' || kind === 'bars';
  return <span {...props} role="status" aria-label={label} className={classes(marks ? `spinner-${kind}` : 'spinner', kind === 'dual' && 'spinner--dual', size !== 'medium' && `spinner--${size}`, variant !== 'primary' && `spinner--${variant}`, className)}>{marks && <><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></>}</span>;
}
