import * as React from 'react';

export type SvgIconProps = Omit<React.SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML' | 'name'> & {
  size?: number;
  label?: string;
};

type InternalProps = SvgIconProps & { children?: React.ReactNode };

export const SvgIcon = React.forwardRef<SVGSVGElement, InternalProps>(function SvgIcon(
  { size = 16, label, style, children, ...props }, ref,
) {
  return <svg {...props} ref={ref} width={size} height={size}
    {...(label ? { role: 'img', 'aria-label': label, 'aria-hidden': undefined } : { 'aria-hidden': true, focusable: false })}
    style={{ display: 'inline-block', flex: '0 0 auto', verticalAlign: 'middle', ...style }}>
    {children}
  </svg>;
});
