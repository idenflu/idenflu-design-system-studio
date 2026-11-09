import * as React from 'react';
import { classes } from '../../shared/classes';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> { variant?: 'info' | 'success' | 'warning' | 'danger' }

export function Alert({ variant = 'info', className, ...props }: AlertProps) { return <div {...props} className={classes('inline-alert', variant !== 'info' && `inline-alert--${variant}`, className)} />; }
