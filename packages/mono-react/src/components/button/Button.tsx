import * as React from 'react';
import { classes } from '../../shared/classes';
import { type Size } from '../../shared/types';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Keep the variant color while drawing an outline instead of a filled background. */
  appearance?: 'default' | 'outline';
  size?: Size;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', appearance = 'default', size, fullWidth = false, iconOnly = false, className, type = 'button', ...props }, ref,
) {
  return <button {...props} ref={ref} type={type} data-size={size} className={classes('button', variant !== 'primary' && `button--${variant}`, appearance === 'outline' && 'button--appearance-outline', !fullWidth && 'button-inline', iconOnly && 'button--icon', className)} />;
});
