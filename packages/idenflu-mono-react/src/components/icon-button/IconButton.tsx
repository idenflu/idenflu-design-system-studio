import * as React from 'react';
import { Button, type ButtonProps } from '../button/Button';
import { Tooltip } from '../tooltip/Tooltip';

export interface IconButtonProps extends Omit<ButtonProps, 'iconOnly' | 'fullWidth' | 'aria-label' | 'aria-labelledby' | 'children'> {
  /** Accessible name for the button. */
  label: string;
  children: React.ReactNode;
  /** Optional tooltip content. Pass false to omit it. */
  tooltip?: React.ReactNode | false;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in milliseconds before showing the tooltip on pointer enter. */
  tooltipEnterDelay?: number;
  /** Delay in milliseconds before hiding the tooltip on pointer leave. */
  tooltipLeaveDelay?: number;
}

/** Square Button with a required accessible name and an optional tooltip. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tooltip, tooltipPosition, tooltipEnterDelay, tooltipLeaveDelay, variant = 'ghost', color = 'secondary', children, className, ...props }, ref,
) {
  const button = <Button {...props} ref={ref} variant={variant} color={color} iconOnly fullWidth={false}
    className={`icon-button-control${className ? ` ${className}` : ''}`} aria-label={label} aria-labelledby={undefined}>
    <span className="icon-button-content" aria-hidden="true">{children}</span>
  </Button>;
  if (typeof tooltip === 'boolean' || tooltip == null) return button;
  return <Tooltip content={tooltip} position={tooltipPosition} enterDelay={tooltipEnterDelay} leaveDelay={tooltipLeaveDelay}>
    {button}
  </Tooltip>;
});
