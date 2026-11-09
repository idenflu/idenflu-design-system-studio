import * as React from 'react';
import { classes } from '../../shared/classes';
import { type Size } from '../../shared/types';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> { size?: Size; shape?: 'square' | 'circle'; variant?: 'primary' | 'neutral' }

export function Avatar({ size = 'md', shape = 'square', variant = 'primary', className, ...props }: AvatarProps) { return <span {...props} className={classes('avatar', `avatar--${size}`, shape === 'circle' && 'avatar--circle', variant === 'neutral' && 'avatar--neutral', className)} />; }
