import * as React from 'react';

export type GridBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';
export type ResponsiveValue<T> = T | Partial<Record<GridBreakpoint, T>>;
export type GridSpacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12;
export type GridAlignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type GridJustification = Exclude<GridAlignment, 'baseline'>;

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Equal-width columns. Responsive values carry forward to larger breakpoints. */
  columns?: ResponsiveValue<number>;
  /** Spacing token number, not pixels. 6 is 24px at the default space unit. */
  gap?: ResponsiveValue<GridSpacing>;
  rowGap?: ResponsiveValue<GridSpacing>;
  columnGap?: ResponsiveValue<GridSpacing>;
  alignItems?: ResponsiveValue<GridAlignment>;
  justifyItems?: ResponsiveValue<GridJustification>;
}

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Numeric spans fit the available columns; full spans the entire row. */
  colSpan?: ResponsiveValue<number | 'full'>;
  rowSpan?: ResponsiveValue<number>;
  alignSelf?: ResponsiveValue<GridAlignment | 'auto'>;
  justifySelf?: ResponsiveValue<GridJustification | 'auto'>;
}

const breakpoints: readonly GridBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl'];
type LayoutStyle = React.CSSProperties & Record<`--mono-grid-${string}`, string | number>;

function resolve<T>(value: ResponsiveValue<T> | undefined, fallback: T): T[] {
  let current = fallback;
  return breakpoints.map(breakpoint => {
    const next = value != null && typeof value === 'object'
      ? (value as Partial<Record<GridBreakpoint, T>>)[breakpoint]
      : breakpoint === 'base' ? value as T | undefined : undefined;
    if (next != null) current = next;
    return current;
  });
}

function variables<T>(name: string, values: T[], format: (value: T) => string | number): LayoutStyle {
  return Object.fromEntries(breakpoints.map((breakpoint, index) => [`--mono-grid-${name}-${breakpoint}`, format(values[index])])) as LayoutStyle;
}

const integer = (value: number) => Number.isFinite(value) && value > 0 ? Math.floor(value) || 1 : 1;
const spacing = (value: GridSpacing) => `var(--space-${value})`;

/** Layout only: preserves DOM reading order and adds no interactive grid role. */
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(function Grid({
  columns = 1, gap = 6, rowGap, columnGap, alignItems = 'stretch', justifyItems = 'stretch', className = '', style, ...props
}, ref) {
  const gaps = resolve<GridSpacing>(gap, 6);
  const rows = resolve<GridSpacing | undefined>(rowGap, undefined);
  const columnsGap = resolve<GridSpacing | undefined>(columnGap, undefined);
  return <div {...props} ref={ref} className={`mono-grid${className ? ` ${className}` : ''}`} style={{
    ...variables('columns', resolve(columns, 1), integer),
    ...variables('row-gap', rows.map((value, index) => value ?? gaps[index]), spacing),
    ...variables('column-gap', columnsGap.map((value, index) => value ?? gaps[index]), spacing),
    ...variables('align', resolve(alignItems, 'stretch'), value => value),
    ...variables('justify', resolve(justifyItems, 'stretch'), value => value),
    ...style,
  }} />;
});

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(function GridItem({
  colSpan = 1, rowSpan = 1, alignSelf = 'auto', justifySelf = 'auto', className = '', style, ...props
}, ref) {
  return <div {...props} ref={ref} className={`mono-grid-item${className ? ` ${className}` : ''}`} style={{
    ...variables<number | 'full'>('item-column', resolve(colSpan, 1), value => value === 'full' ? '1 / -1' : `span min(${integer(value)}, var(--mono-grid-columns, 1))`),
    ...variables('item-row', resolve(rowSpan, 1), value => `span ${integer(value)}`),
    ...variables('item-align', resolve(alignSelf, 'auto'), value => value),
    ...variables('item-justify', resolve(justifySelf, 'auto'), value => value),
    ...style,
  }} />;
});
