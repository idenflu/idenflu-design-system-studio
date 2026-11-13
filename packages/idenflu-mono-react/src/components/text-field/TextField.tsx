import * as React from 'react';
import { classes } from '../../shared/classes';
import { type Size, type Alignment } from '../../shared/types';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label: React.ReactNode;
  /** Keep the label accessible while hiding it visually. */
  hideLabel?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  /** Custom trailing action. Search fields otherwise provide a standard clear button. */
  action?: React.ReactNode;
  prefixDecorative?: boolean;
  suffixDecorative?: boolean;
  labelPosition?: 'top' | 'left';
  alignment?: Alignment;
  size?: Size;
  containerClassName?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, hideLabel = false, helperText, error, prefix, suffix, action, prefixDecorative = false, suffixDecorative = false, labelPosition = 'top', alignment, size, containerClassName, className, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid, ...props }, ref,
) {
  const generated = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current!);
  const automaticClear = props.type === 'search' && action == null;
  const [searchValue, setSearchValue] = React.useState(() => String(props.defaultValue ?? ''));
  const hasSearchValue = String(props.value === undefined ? searchValue : props.value ?? '').length > 0;
  React.useEffect(() => {
    if (!automaticClear) return;
    setSearchValue(inputRef.current?.value ?? '');
    const form = inputRef.current?.form;
    if (!form) return;
    let active = true;
    const reset = (event: Event) => queueMicrotask(() => {
      if (active && !event.defaultPrevented) setSearchValue(inputRef.current?.value ?? '');
    });
    form.addEventListener('reset', reset);
    return () => { active = false; form.removeEventListener('reset', reset); };
  }, [automaticClear, props.defaultValue, props.form]);
  const clearSearch = () => {
    const input = inputRef.current;
    if (!input || props.disabled || props.readOnly) return;
    const view = input.ownerDocument.defaultView!;
    // 네이티브 입력 이벤트를 전달해 제어·비제어 입력 모두 onChange를 유지합니다.
    Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value')!.set!.call(input, '');
    input.dispatchEvent(new view.Event('input', { bubbles: true }));
    setSearchValue(input.value);
    input.focus();
  };
  const fieldAction = automaticClear ? <button type="button" className="input-action text-field-clear"
    aria-label={typeof label === 'string' ? `${label} 지우기` : '검색어 지우기'}
    hidden={!hasSearchValue || props.disabled || props.readOnly}
    onMouseDown={event => event.preventDefault()} onClick={clearSearch}>
    <span className="ui-icon icon-x" aria-hidden="true" />
  </button> : action;
  const inputId = id || `field-${generated}`;
  const helperId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const prefixId = `${inputId}-prefix`;
  const suffixId = `${inputId}-suffix`;
  const effectiveLabelPosition = hideLabel ? 'top' : labelPosition;
  const described = [describedBy, prefix != null && !prefixDecorative && prefixId, suffix != null && !suffixDecorative && suffixId, helperText != null && helperId, error != null && errorId].filter(Boolean).join(' ') || undefined;
  const labelElement = <label className={classes('field-label', hideLabel && 'sr-only', effectiveLabelPosition === 'left' && 'field-horizontal__label')} htmlFor={inputId}>{label}</label>;
  const input = <input {...props} ref={inputRef} onChange={automaticClear ? event => { setSearchValue(event.target.value); props.onChange?.(event); } : props.onChange} id={inputId} aria-invalid={error != null ? true : ariaInvalid} aria-describedby={described} className={classes(alignment && `text-align-${alignment}`, className, props.type === 'search' && 'text-field-search', prefix == null && suffix == null && fieldAction == null && 'text-input')} />;
  const body = <div className={effectiveLabelPosition === 'left' ? 'field-horizontal__body' : undefined}>
    {prefix != null || suffix != null || fieldAction != null ? <div className="input-group" data-size={size}>
      {prefix != null && <span id={!prefixDecorative ? prefixId : undefined} aria-hidden={prefixDecorative || undefined} className={classes('input-prefix', prefixDecorative && 'input-prefix--icon')}>{prefix}</span>}
      {input}
      {suffix != null && <span id={!suffixDecorative ? suffixId : undefined} aria-hidden={suffixDecorative || undefined} className={classes('input-suffix', suffixDecorative && 'input-suffix--icon')}>{suffix}</span>}
      {fieldAction}
    </div> : <div data-size={size}>{input}</div>}
    {helperText != null && <p className="component-helper" id={helperId} style={{ marginTop: 'var(--space-1)' }}>{helperText}</p>}
    {error != null && <p className="field-error" id={errorId}>{error}</p>}
  </div>;
  return <div className={classes(effectiveLabelPosition === 'left' && 'field-horizontal', containerClassName)}>{labelElement}{body}</div>;
});
