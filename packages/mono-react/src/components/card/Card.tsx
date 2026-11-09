import * as React from 'react';
import { classes } from '../../shared/classes';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLElement>) { return <article {...props} className={classes('demo-card', className)} />; }
