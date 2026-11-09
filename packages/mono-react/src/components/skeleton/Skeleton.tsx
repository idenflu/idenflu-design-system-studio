import * as React from 'react';
import { classes } from '../../shared/classes';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) { return <span {...props} aria-hidden="true" className={classes('skeleton', className)} />; }
