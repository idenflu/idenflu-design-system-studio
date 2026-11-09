import * as React from 'react';
import { classes } from '../../shared/classes';
import { type Size } from '../../shared/types';

export interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  size?: Size;
  containerClassName?: string;
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(function NativeSelect(
  { id, label, helperText, error, size, className, containerClassName, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid, ...props }, ref,
) {
  const generated = React.useId(); const inputId = id || `select-${generated}`;
  const helperId = `${inputId}-help`, errorId = `${inputId}-error`;
  const described = [describedBy, helperText != null && helperId, error != null && errorId].filter(Boolean).join(' ') || undefined;
  return <div className={containerClassName} data-size={size}><label className="field-label" htmlFor={inputId}>{label}</label><select {...props} ref={ref} id={inputId} className={classes('select-input', className)} aria-describedby={described} aria-invalid={error != null ? true : ariaInvalid} />{helperText != null && <p className="component-helper" id={helperId} style={{ marginTop: 'var(--space-1)' }}>{helperText}</p>}{error != null && <p className="field-error" id={errorId}>{error}</p>}</div>;
});
