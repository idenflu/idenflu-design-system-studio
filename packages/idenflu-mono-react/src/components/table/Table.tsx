import * as React from 'react';
import { classes } from '../../shared/classes';

/** interactive shows row hover for rows that respond to the pointer. Mark selected rows with data-selected="true". */
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> { density?: 'default' | 'compact'; interactive?: boolean }

export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table({ density = 'default', interactive = false, className, ...props }, ref) { return <table {...props} ref={ref} data-density={density} data-interactive={interactive || undefined} className={classes('data-table', className)} />; });

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableHeader({ className, ...props }, ref) {
  return <thead {...props} ref={ref} className={classes('table-header', className)} />;
});

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableBody({ className, ...props }, ref) {
  return <tbody {...props} ref={ref} className={classes('table-body', className)} />;
});

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(function TableFooter({ className, ...props }, ref) {
  return <tfoot {...props} ref={ref} className={classes('table-footer', className)} />;
});

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(function TableRow({ className, ...props }, ref) {
  return <tr {...props} ref={ref} className={classes('table-row', className)} />;
});

export const TableHeaderCell = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(function TableHeaderCell({ className, ...props }, ref) {
  return <th {...props} ref={ref} className={classes('table-cell', 'table-header-cell', className)} />;
});

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(function TableCell({ className, ...props }, ref) {
  return <td {...props} ref={ref} className={classes('table-cell', className)} />;
});

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> { label: string }

export function TableContainer({ label, className, tabIndex = 0, ...props }: TableContainerProps) { return <div {...props} role="region" aria-label={label} tabIndex={tabIndex} className={classes('table-scroll', className)} />; }
