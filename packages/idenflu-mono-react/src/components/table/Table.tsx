import * as React from 'react';
import { classes } from '../../shared/classes';
import { TableScrollbars } from './TableScrollbars';

const TableContainerContext = React.createContext(false);

/** interactive shows row hover for rows that respond to the pointer. Mark selected rows with data-selected="true". */
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: 'default' | 'compact';
  interactive?: boolean;
  /** Fills the remaining height of a bounded column flex layout. */
  fillHeight?: boolean;
  /** Caps the table viewport height, including the pinned header and footer. Numbers are pixels. */
  maxHeight?: number | string;
  /** Accessible name of the built-in scroll region. */
  scrollLabel?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table({
  density = 'default', interactive = false, fillHeight = false, maxHeight, scrollLabel, className, ...props
}, ref) {
  const hasContainer = React.useContext(TableContainerContext);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const viewportId = React.useId();
  const scrollVertically = fillHeight || maxHeight !== undefined;

  const table = <table {...props} ref={ref} data-density={density} data-interactive={interactive || undefined} className={classes('data-table', className)} />;
  const contents = hasContainer ? <TableContainerContext.Provider value={false}>{table}</TableContainerContext.Provider> : table;

  if (hasContainer && !scrollVertically) return contents;

  const viewport = <div ref={viewportRef} id={scrollVertically ? viewportId : undefined} className="table-scroll"
    data-fill-height={fillHeight || undefined} data-scroll-vertically={scrollVertically || undefined} tabIndex={0}
    role={scrollLabel ? 'region' : undefined} aria-label={scrollLabel || undefined}>
    {contents}
  </div>;
  if (!scrollVertically) return viewport;

  return <div className="table-viewport" data-fill-height={fillHeight || undefined} style={{ maxHeight }}>
    {viewport}
    <TableScrollbars enabled scrollRef={viewportRef} controls={viewportId} label={scrollLabel || '테이블'} />
  </div>;
});

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

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(function TableContainer({
  label, className, tabIndex = 0, ...props
}, ref) {
  return <TableContainerContext.Provider value={true}>
    <div {...props} ref={ref} role="region" aria-label={label} tabIndex={tabIndex} className={classes('table-scroll', className)} />
  </TableContainerContext.Provider>;
});
