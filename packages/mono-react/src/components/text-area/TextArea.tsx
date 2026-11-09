import * as React from 'react';
import { classes } from '../../shared/classes';
import { type Alignment } from '../../shared/types';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  alignment?: Alignment;
  containerClassName?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { id, label, helperText, error, alignment, containerClassName, className, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid, ...props }, ref,
) {
  const generated = React.useId(); const inputId = id || `textarea-${generated}`;
  const helperId = `${inputId}-help`, errorId = `${inputId}-error`;
  const described = [describedBy, helperText != null && helperId, error != null && errorId].filter(Boolean).join(' ') || undefined;
  return <div className={containerClassName}><label className="field-label" htmlFor={inputId}>{label}</label><textarea {...props} ref={ref} id={inputId} aria-describedby={described} aria-invalid={error != null ? true : ariaInvalid} className={classes('text-area', alignment && `text-align-${alignment}`, className)} />{helperText != null && <p className="component-helper" id={helperId} style={{ marginTop: 'var(--space-1)' }}>{helperText}</p>}{error != null && <p className="field-error" id={errorId}>{error}</p>}</div>;
});
