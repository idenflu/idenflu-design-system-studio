import * as React from 'react';
import { classes } from '../../shared/classes';

const TableContainerContext = React.createContext(false);

function keepStickySectionsClear(viewport: HTMLDivElement) {
  const table = viewport.firstElementChild as HTMLTableElement;
  const view = viewport.ownerDocument.defaultView;
  if (!view?.ResizeObserver) return;

  // Reserve the pinned sections in the browser's focus scroll calculations.
  const updatePadding = () => {
    viewport.style.scrollPaddingTop = `${table.tHead?.getBoundingClientRect().height ?? 0}px`;
    viewport.style.scrollPaddingBottom = `${table.tFoot?.getBoundingClientRect().height ?? 0}px`;
  };
  const resize = new view.ResizeObserver(updatePadding);
  const observeSections = () => {
    resize.disconnect();
    if (table.tHead) resize.observe(table.tHead);
    if (table.tFoot) resize.observe(table.tFoot);
    updatePadding();
  };
  const sections = new view.MutationObserver(observeSections);
  sections.observe(table, { childList: true });
  observeSections();

  return () => {
    sections.disconnect();
    resize.disconnect();
    viewport.style.removeProperty('scroll-padding-top');
    viewport.style.removeProperty('scroll-padding-bottom');
  };
}

/** interactive shows row hover for rows that respond to the pointer. Mark selected rows with data-selected="true". */
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: 'default' | 'compact';
  interactive?: boolean;
  /** Fills the remaining height of a bounded column flex layout. */
  fillHeight?: boolean;
  /** Accessible name of the built-in scroll region. */
  scrollLabel?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table({
  density = 'default', interactive = false, fillHeight = false, scrollLabel, className, ...props
}, ref) {
  const hasContainer = React.useContext(TableContainerContext);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (fillHeight && viewportRef.current) return keepStickySectionsClear(viewportRef.current);
  }, [fillHeight]);

  const table = <table {...props} ref={ref} data-density={density} data-interactive={interactive || undefined} className={classes('data-table', className)} />;
  const contents = hasContainer ? <TableContainerContext.Provider value={false}>{table}</TableContainerContext.Provider> : table;

  if (hasContainer && !fillHeight) return contents;

  return <div ref={viewportRef} className="table-scroll" data-fill-height={fillHeight || undefined} tabIndex={0}
    role={scrollLabel ? 'region' : undefined} aria-label={scrollLabel || undefined}>
    {contents}
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
