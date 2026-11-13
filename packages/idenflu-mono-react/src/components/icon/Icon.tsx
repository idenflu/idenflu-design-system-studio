import * as React from 'react';
import { classes } from '../../shared/classes';

import type { IconName } from '../../icons/icon-names';
export type { IconName } from '../../icons/icon-names';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> { name: IconName }

export function Icon({ name, className, ...props }: IconProps) { return <span {...props} aria-hidden="true" className={classes('ui-icon', `icon-${name}`, className)} />; }
