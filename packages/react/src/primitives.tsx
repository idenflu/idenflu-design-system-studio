import * as React from 'react';
import { NovaSpinner } from './nova-spinner';

const classes = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');
type Size = 'sm' | 'md' | 'lg';
type Alignment = 'start' | 'center' | 'end';

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
    <span className="ui-icon icon-close" aria-hidden="true" />
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

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Inherit the surrounding size when omitted; otherwise use sm, md or lg. */
  size?: Size;
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  /** Fill the background with the status color and use contrasting text. */
  appearance?: 'default' | 'solid';
}
export function Badge({ size, variant = 'neutral', appearance = 'default', className, ...props }: BadgeProps) { return <span {...props} {...(size ? {'data-size':size} : {})} className={classes('badge', variant !== 'neutral' && `badge--${variant}`, appearance === 'solid' && 'badge--solid', className)} />; }
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> { variant?: 'info' | 'success' | 'warning' | 'danger' }
export function Alert({ variant = 'info', className, ...props }: AlertProps) { return <div {...props} className={classes('inline-alert', variant !== 'info' && `inline-alert--${variant}`, className)} />; }
export { Chip } from './chip';
export type { ChipProps, InteractiveChipProps, StaticChipProps } from './chip';
export interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> { thickness?: 'thin' | 'normal' | 'thick'; variant?: 'primary' | 'success' | 'warning' | 'danger' }
export const Progress = React.forwardRef<HTMLProgressElement, ProgressProps>(function Progress({ thickness = 'normal', variant = 'primary', className, ...props }, ref) { return <progress {...props} ref={ref} className={classes('progress-bar', thickness !== 'normal' && `progress-bar--${thickness}`, variant !== 'primary' && `progress-bar--${variant}`, className)} />; });
export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> { size?: 'small' | 'medium' | 'large'; variant?: 'primary' | 'neutral' | 'inverse'; kind?: 'ring' | 'dual' | 'dots' | 'bars' | 'nova'; label?: string }
export function Spinner({ size = 'medium', variant = 'primary', kind = 'ring', label = '로딩 중', className, ...props }: SpinnerProps) {
  if (kind === 'nova') return <NovaSpinner {...props} size={{small:16,medium:24,large:32}[size]} variant={variant === 'primary' ? 'brand' : variant} label={label} className={className} />;
  const marks = kind === 'dots' || kind === 'bars';
  return <span {...props} role="status" aria-label={label} className={classes(marks ? `spinner-${kind}` : 'spinner', kind === 'dual' && 'spinner--dual', !marks && size !== 'medium' && `spinner--${size}`, variant !== 'primary' && `spinner--${variant}`, className)}>{marks && <><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></>}</span>;
}
export interface CircleProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> { value: number; max?: number; label: string; variant?: 'primary' | 'success' }
export function CircleProgress({ value, max = 100, label, variant = 'primary', className, ...props }: CircleProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  const percent = Math.round(safeValue / safeMax * 100);
  return <div {...props} className={classes('progress-circle', variant === 'success' && 'progress-circle--success', className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={safeValue}><svg viewBox="0 0 36 36" aria-hidden="true"><circle className="progress-circle-track" cx="18" cy="18" r="15.9155" /><circle className="progress-circle-value" cx="18" cy="18" r="15.9155" strokeDasharray={`${percent} ${100 - percent}`} /></svg><span aria-hidden="true">{percent}%</span></div>;
}
export interface SegmentedProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> { value: number; total: number; label: string }
export function SegmentedProgress({ value, total, label, className, ...props }: SegmentedProgressProps) {
  const count = Number.isFinite(total) ? Math.max(1, Math.floor(total)) : 1;
  const current = Number.isFinite(value) ? Math.min(count, Math.max(0, Math.floor(value))) : 0;
  return <div {...props} className={classes('progress-segments', className)} style={{ ...props.style, gridTemplateColumns:`repeat(${count}, minmax(0, 1fr))` }} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={count} aria-valuenow={current}>{Array.from({length:count}, (_, index) => <span key={index} aria-hidden="true" className={index < current ? 'is-complete' : undefined} />)}</div>;
}
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) { return <span {...props} aria-hidden="true" className={classes('skeleton', className)} />; }
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> { size?: Size; shape?: 'square' | 'circle'; variant?: 'primary' | 'neutral' }
export function Avatar({ size = 'md', shape = 'square', variant = 'primary', className, ...props }: AvatarProps) { return <span {...props} className={classes('avatar', `avatar--${size}`, shape === 'circle' && 'avatar--circle', variant === 'neutral' && 'avatar--neutral', className)} />; }
export function Card({ className, ...props }: React.HTMLAttributes<HTMLElement>) { return <article {...props} className={classes('demo-card', className)} />; }
/** interactive shows row hover for rows that respond to the pointer. Mark selected rows with data-selected="true". */
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> { density?: 'default' | 'compact'; interactive?: boolean }
export const Table = React.forwardRef<HTMLTableElement, TableProps>(function Table({ density = 'default', interactive = false, className, ...props }, ref) { return <table {...props} ref={ref} data-density={density} data-interactive={interactive || undefined} className={classes('data-table', className)} />; });
export function Accordion({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} className={classes('accordion', className)} />; }
export interface AccordionItemProps extends Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> { title: React.ReactNode }
export function AccordionItem({ title, children, ...props }: AccordionItemProps) { return <details {...props}><summary>{title}<span className="ui-icon icon-caret" aria-hidden="true" /></summary>{children}</details>; }

export function List({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) { return <ul {...props} className={classes('simple-list', className)} />; }
export function ListItem(props: React.LiHTMLAttributes<HTMLLIElement>) { return <li {...props} />; }
export function SelectableList({ className, role = 'group', ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} role={role} className={classes('selectable-list', className)} />; }
export const SelectableListItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function SelectableListItem({ type = 'button', ...props }, ref) { return <button {...props} ref={ref} type={type} />; });

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  pageLabel?: (page: number) => string;
}
export function Pagination({ page, pageCount, onPageChange, previousLabel = '이전', nextLabel = '다음', pageLabel = (number) => `${number}페이지`, className, 'aria-label': ariaLabel = '페이지 탐색', ...props }: PaginationProps) {
  const count = Math.max(1, Number.isFinite(pageCount) ? Math.floor(pageCount) : 1);
  const current = Math.min(count, Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1));
  const visible = Array.from(new Set([1, count, current - 1, current, current + 1].filter((number) => number >= 1 && number <= count))).sort((a, b) => a - b);
  return <nav {...props} aria-label={ariaLabel} className={classes('pagination', className)}>
    <button className="page-button" type="button" disabled={current === 1} onClick={() => onPageChange(current - 1)}>{previousLabel}</button>
    {visible.map((number, index) => <React.Fragment key={number}>
      {index > 0 && number - visible[index - 1] > 1 && <span aria-hidden="true">…</span>}
      <button className="page-button" type="button" aria-current={number === current ? 'page' : undefined} aria-label={pageLabel(number)} onClick={() => onPageChange(number)}>{number}</button>
    </React.Fragment>)}
    <button className="page-button" type="button" disabled={current === count} onClick={() => onPageChange(current + 1)}>{nextLabel}</button>
  </nav>;
}

export interface StepperProps extends React.OlHTMLAttributes<HTMLOListElement> {
  steps: readonly React.ReactNode[];
  currentStep: number;
}
/** currentStep is zero-based. */
export function Stepper({ steps, currentStep, className, ...props }: StepperProps) {
  return <ol {...props} className={classes('stepper', className)}>{steps.map((step, index) => <li key={index} aria-current={index === currentStep ? 'step' : undefined} className={classes(index === currentStep && 'is-current', index < currentStep && 'is-complete')}><span className="step-number" aria-hidden="true">{index + 1}</span><span>{step}</span></li>)}</ol>;
}
export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> { label: string }
export function TableContainer({ label, className, tabIndex = 0, ...props }: TableContainerProps) { return <div {...props} role="region" aria-label={label} tabIndex={tabIndex} className={classes('table-scroll', className)} />; }
/** Canonical SVG filenames and the original public aliases. Filled variants use the -fill suffix. */
export type IconName =
  | 'add' | 'archive' | 'arrow-down' | 'arrow-left' | 'arrow-right' | 'arrow-up'
  | 'attachment' | 'ban' | 'ban-fill' | 'bell' | 'bell-fill' | 'bookmark'
  | 'bookmark-fill' | 'briefcase' | 'briefcase-fill' | 'calendar' | 'calendar-fill' | 'camera'
  | 'camera-fill' | 'caret' | 'cart' | 'cart-fill' | 'chart-bar' | 'chart-line'
  | 'chat' | 'chat-fill' | 'check' | 'check-circle' | 'check-circle-fill' | 'circle-dashed'
  | 'circle-dot' | 'clock' | 'clock-fill' | 'close' | 'columns' | 'copy'
  | 'credit-card' | 'credit-card-fill' | 'crown' | 'dashboard' | 'dashboard-fill' | 'download'
  | 'drag-handle' | 'edit' | 'email' | 'error-circle' | 'error-circle-fill' | 'external-link'
  | 'eye' | 'eye-off' | 'eye-slash' | 'file' | 'file-fill' | 'file-text'
  | 'filter' | 'filter-clear' | 'folder' | 'folder-fill' | 'folder-open' | 'globe'
  | 'grid' | 'grid-fill' | 'heart' | 'heart-fill' | 'help-circle' | 'help-circle-fill'
  | 'hierarchy' | 'home' | 'home-fill' | 'id-card' | 'image' | 'image-fill'
  | 'info' | 'info-fill' | 'key' | 'keyboard-arrow-down' | 'keyboard-arrow-left' | 'keyboard-arrow-right'
  | 'keyboard-arrow-up' | 'link' | 'list' | 'location' | 'location-fill' | 'lock'
  | 'lock-fill' | 'login' | 'logout' | 'mail' | 'mail-fill' | 'maximize'
  | 'menu' | 'microsoft-excel' | 'minimize' | 'minus-circle' | 'moon' | 'more-horizontal'
  | 'more-vertical' | 'pause-circle' | 'person' | 'person-fill' | 'pin' | 'pin-off'
  | 'play' | 'play-fill' | 'plus' | 'printer' | 'receipt' | 'receipt-fill'
  | 'redo' | 'refresh' | 'remove' | 'save' | 'search' | 'send'
  | 'send-fill' | 'settings' | 'share' | 'shield' | 'shield-alert' | 'shield-check'
  | 'shield-check-fill' | 'shield-off' | 'sliders' | 'sort' | 'sort-ascending' | 'sort-descending'
  | 'star' | 'star-fill' | 'sun' | 'tag' | 'tag-fill' | 'trash'
  | 'trash-2' | 'undo' | 'unlock' | 'upload' | 'user-check' | 'user-lock'
  | 'user-minus' | 'user-plus' | 'user-settings' | 'users' | 'users-fill' | 'visibility'
  | 'visibility-fill' | 'warning' | 'warning-fill';
export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> { name: IconName }
export function Icon({ name, className, ...props }: IconProps) { return <span {...props} aria-hidden="true" className={classes('ui-icon', `icon-${name}`, className)} />; }
