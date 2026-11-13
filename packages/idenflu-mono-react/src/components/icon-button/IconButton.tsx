import * as React from 'react';
import { Button, type ButtonProps } from '../button/Button';
import { Tooltip } from '../tooltip/Tooltip';

export interface IconButtonProps extends Omit<ButtonProps, 'iconOnly' | 'fullWidth' | 'aria-label' | 'aria-labelledby' | 'children'> {
  /** Accessible name and the default tooltip. */
  label: string;
  children: React.ReactNode;
  /** Override the tooltip content, or pass false to omit it. */
  tooltip?: React.ReactNode | false;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/** Square Button with a required name and a tooltip for pointer and keyboard users. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tooltip = label, tooltipPosition = 'top', variant = 'ghost', color = 'secondary', children, className, ...props }, ref,
) {
  const button = <Button {...props} ref={ref} variant={variant} color={color} iconOnly fullWidth={false}
    className={`icon-button-control${className ? ` ${className}` : ''}`} aria-label={label} aria-labelledby={undefined}>
    <span className="icon-button-content" aria-hidden="true">{children}</span>
  </Button>;
  return tooltip === false || tooltip == null ? button : <Tooltip content={tooltip} position={tooltipPosition}>{button}</Tooltip>;
});
