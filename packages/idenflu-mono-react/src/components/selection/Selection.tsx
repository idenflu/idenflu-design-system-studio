import * as React from 'react';
import { classes } from '../../shared/classes';
import { type Size } from '../../shared/types';

type ChoiceProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'children'> & { label: React.ReactNode; size?: Size; containerClassName?: string };

export interface CheckboxProps extends ChoiceProps { indeterminate?: boolean }

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, size, containerClassName, className, indeterminate = false, onChange, ...props }, ref,
) {
  const internal = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => internal.current as HTMLInputElement);
  React.useEffect(() => { if (internal.current) internal.current.indeterminate = indeterminate; });
  return <label className={classes('choice', containerClassName)} data-size={size}><input {...props} ref={internal} type="checkbox" className={classes('choice-input', className)} onChange={(event) => { onChange?.(event); event.currentTarget.indeterminate = indeterminate; }} /><span className="choice-mark" aria-hidden="true"><span className="ui-icon icon-check check-icon" /><span className="ui-icon minus-icon" /></span><span>{label}</span></label>;
});

export const Radio = React.forwardRef<HTMLInputElement, ChoiceProps>(function Radio({ label, size, containerClassName, className, ...props }, ref) {
  return <label className={classes('choice', containerClassName)} data-size={size}><input {...props} ref={ref} type="radio" className={classes('choice-input', className)} /><span className="radio-mark" aria-hidden="true" /><span>{label}</span></label>;
});

export const Switch = React.forwardRef<HTMLInputElement, ChoiceProps>(function Switch({ label, size, containerClassName, className, ...props }, ref) {
  return <label className={classes('switch-setting', containerClassName)} data-size={size}><span className="switch"><input {...props} ref={ref} type="checkbox" role="switch" className={className} /><span className="switch-track" aria-hidden="true" /></span><span>{label}</span></label>;
});
