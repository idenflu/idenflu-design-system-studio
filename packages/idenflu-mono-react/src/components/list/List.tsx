import * as React from 'react';
import { classes } from '../../shared/classes';

interface ListHeightProps {
  /** Caps the scrollable list height. Numbers are pixels. */
  maxHeight?: number | string;
  /** Fills the remaining height of a bounded column flex layout. */
  fillHeight?: boolean;
}

export interface ListProps extends React.HTMLAttributes<HTMLUListElement>, ListHeightProps {}

export function List({ className, maxHeight, fillHeight, style, tabIndex, ...props }: ListProps) {
  const scrollable = fillHeight || maxHeight !== undefined;
  return <ul {...props} className={classes('simple-list', className)}
    data-fill-height={fillHeight || undefined} data-scrollable={scrollable || undefined}
    style={maxHeight === undefined ? style : { ...style, maxHeight }}
    tabIndex={tabIndex ?? (scrollable ? 0 : undefined)} />;
}

export function ListItem(props: React.LiHTMLAttributes<HTMLLIElement>) { return <li {...props} />; }

export interface SelectableListProps extends React.HTMLAttributes<HTMLDivElement>, ListHeightProps {}

export function SelectableList({ className, role = 'group', maxHeight, fillHeight, style, ...props }: SelectableListProps) {
  const scrollable = fillHeight || maxHeight !== undefined;
  return <div {...props} role={role} className={classes('selectable-list', className)}
    data-fill-height={fillHeight || undefined} data-scrollable={scrollable || undefined}
    style={maxHeight === undefined ? style : { ...style, maxHeight }} />;
}

export const SelectableListItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function SelectableListItem({ type = 'button', ...props }, ref) { return <button {...props} ref={ref} type={type} />; });
