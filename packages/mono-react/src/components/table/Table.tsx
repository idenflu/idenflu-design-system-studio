import * as React from 'react';
import { classes } from '../../shared/classes';

/** interactive shows row hover for rows that respond to the pointer. Mark selected rows with data-selected="true". */
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> { density?: 'default' | 'compact'; interactive?: boolean }

export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table({ density = 'default', interactive = false, className, ...props }, ref) { return <table {...props} ref={ref} data-density={density} data-interactive={interactive || undefined} className={classes('data-table', className)} />; });

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> { label: string }

export function TableContainer({ label, className, tabIndex = 0, ...props }: TableContainerProps) { return <div {...props} role="region" aria-label={label} tabIndex={tabIndex} className={classes('table-scroll', className)} />; }
