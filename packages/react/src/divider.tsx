import * as React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed';
  align?: 'start' | 'center' | 'end';
  decorative?: boolean;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', variant = 'solid', align = 'center', decorative = false, children, className = '', 'aria-label': ariaLabel, 'aria-labelledby': labelledBy, ...props }, ref,
) {
  const labelId = React.useId();
  const hasLabel = children != null && children !== false && children !== '';
  return <div {...props} ref={ref}
    role={decorative ? 'presentation' : 'separator'}
    aria-hidden={decorative || props['aria-hidden']}
    aria-orientation={decorative ? undefined : orientation}
    aria-label={decorative ? undefined : ariaLabel}
    aria-labelledby={decorative ? undefined : labelledBy || (!ariaLabel && hasLabel ? labelId : undefined)}
    className={`divider divider--${orientation} divider--${variant} divider--${align}${hasLabel ? ' divider--labeled' : ''} ${className}`}>
    {hasLabel && <span id={labelId} className="divider-label">{children}</span>}
  </div>;
});
