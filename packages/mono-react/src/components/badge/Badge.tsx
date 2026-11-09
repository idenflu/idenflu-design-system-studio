import * as React from 'react';
import { classes } from '../../shared/classes';
import { type Size } from '../../shared/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Inherit the surrounding size when omitted; otherwise use sm, md or lg. */
  size?: Size;
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  /** Fill the background with the status color and use contrasting text. */
  appearance?: 'default' | 'solid';
}

export function Badge({ size, variant = 'neutral', appearance = 'default', className, ...props }: BadgeProps) { return <span {...props} {...(size ? {'data-size':size} : {})} className={classes('badge', variant !== 'neutral' && `badge--${variant}`, appearance === 'solid' && 'badge--solid', className)} />; }
