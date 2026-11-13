import * as React from 'react';
import { classes } from '../../shared/classes';

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  /** Corner radius; numbers are interpreted as pixels. Defaults to the shared radius token. */
  radius?: React.CSSProperties['borderRadius'];
};

export function Card({ className, radius, style, ...props }: CardProps) {
  return <article {...props} className={classes('demo-card', className)} style={radius === undefined ? style : { borderRadius: radius, ...style }} />;
}

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

export function CardTitle({ as: Heading = 'h3', className, ...props }: CardTitleProps) {
  return <Heading {...props} className={classes('card-title', className)} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={classes('card-description', className)} />;
}

export function CardLabel({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={classes('card-label', className)} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={classes('card-footer', className)} />;
}
