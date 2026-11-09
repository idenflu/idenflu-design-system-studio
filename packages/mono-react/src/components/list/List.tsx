import * as React from 'react';
import { classes } from '../../shared/classes';

export function List({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) { return <ul {...props} className={classes('simple-list', className)} />; }

export function ListItem(props: React.LiHTMLAttributes<HTMLLIElement>) { return <li {...props} />; }

export function SelectableList({ className, role = 'group', ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} role={role} className={classes('selectable-list', className)} />; }

export const SelectableListItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function SelectableListItem({ type = 'button', ...props }, ref) { return <button {...props} ref={ref} type={type} />; });
