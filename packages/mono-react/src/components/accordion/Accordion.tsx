import * as React from 'react';
import { classes } from '../../shared/classes';

export function Accordion({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={classes('accordion', className)} />; }

export interface AccordionItemProps extends Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> { title: React.ReactNode }

export function AccordionItem({ title, children, ...props }: AccordionItemProps) { return <details {...props}><summary>{title}<span className="ui-icon icon-caret" aria-hidden="true" /></summary>{children}</details>; }
