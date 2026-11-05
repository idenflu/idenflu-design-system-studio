import * as React from 'react';
import {feedbackIconNames, emphasizedFeedbackIconNames} from './status-icons';
import { useEscapeLayer } from './escape-layer';
import { lockDialogScroll } from './dialog-scroll-lock';
import { Icon } from './primitives';
import { usePopupPosition, type PopupAlign } from './popup-position';
export type { PopupAlign } from './popup-position';
const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

type DismissibleProps = { open: boolean; onOpenChange: (open: boolean) => void };
export type DialogProps = DismissibleProps & {
  closeOnBackdrop?: boolean;
  variant?: 'default' | 'divided';
  /** Focus this descendant after the native modal opens. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
} & Omit<React.DialogHTMLAttributes<HTMLDialogElement>, 'open' | 'onClose'>;

/** Native modal dialog with keyboard focus wrapping and restoration. */
export function Dialog({ open, onOpenChange, children, className = '', closeOnBackdrop = false, variant = 'default', initialFocusRef, onClick, onKeyDown, onPointerDownCapture, onPointerCancelCapture, ...props }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const backdropPointerDown = React.useRef(false);
  useClientLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      const lock = lockDialogScroll(dialog.ownerDocument);
      try {
        if (!dialog.open) dialog.showModal();
        const target = initialFocusRef?.current;
        if (target && dialog.contains(target)) target.focus({preventScroll:true});
        lock.restorePosition();
      } catch (error) { lock.release(); throw error; }
      return lock.release;
    }
    else if (!open) { backdropPointerDown.current = false; if (dialog.open) dialog.close(); }
  }, [open, initialFocusRef]);
  const isTopLayer = useEscapeLayer(open, ref, () => onOpenChange(false));
  const isBackdrop = (event: React.MouseEvent<HTMLDialogElement> | React.PointerEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return false;
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  return <dialog {...props} ref={ref} className={`dialog${variant === 'divided' ? ' dialog--divided' : ''}${className ? ` ${className}` : ''}`} onPointerDownCapture={event => {
    backdropPointerDown.current = closeOnBackdrop && event.isPrimary && event.button === 0 && isBackdrop(event);
    onPointerDownCapture?.(event);
    if (event.defaultPrevented) backdropPointerDown.current = false;
  }} onPointerCancelCapture={event => { backdropPointerDown.current = false; onPointerCancelCapture?.(event); }} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Tab') return;
    const dialog = event.currentTarget;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(element => element.tabIndex >= 0 && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[inert]'));
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (!first) { event.preventDefault(); dialog.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
  }} onClick={event => { const beganOnBackdrop = backdropPointerDown.current; backdropPointerDown.current = false; onClick?.(event); if (!event.defaultPrevented && event.detail > 0 && closeOnBackdrop && beganOnBackdrop && isBackdrop(event)) onOpenChange(false); }} onCancel={(event) => { if (event.target !== event.currentTarget) return; event.preventDefault(); if (isTopLayer()) onOpenChange(false); }} onClose={event => { if (event.target === event.currentTarget && open) onOpenChange(false); }}>{children}</dialog>;
}

export const DialogHeader = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function DialogHeader({className = '', ...props}, ref) {
  return <header {...props} ref={ref} className={`dialog-header${className ? ` ${className}` : ''}`} />;
});
export const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function DialogBody({className = '', tabIndex = 0, ...props}, ref) {
  return <div {...props} ref={ref} tabIndex={tabIndex} className={`dialog-body${className ? ` ${className}` : ''}`} />;
});
export const DialogFooter = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function DialogFooter({className = '', ...props}, ref) {
  return <footer {...props} ref={ref} className={`dialog-footer${className ? ` ${className}` : ''}`} />;
});

export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';
export type DrawerProps = DialogProps & {
  /** Physical edge from which the panel opens. */
  side?: DrawerSide;
  /** Width for left/right, height for top/bottom. Numbers are pixels. */
  size?: DrawerSize | number;
};

/** Edge-aligned modal. Use divided sections to keep actions outside the scroll area. */
export function Drawer({ className = '', closeOnBackdrop = true, side = 'right', size = 'md', style, ...props }: DrawerProps) {
  const customSize = typeof size === 'number' ? { '--drawer-size': `${size}px` } : undefined;
  return <Dialog {...props} closeOnBackdrop={closeOnBackdrop} data-side={side} data-drawer-size={typeof size === 'number' ? undefined : size}
    style={{ ...customSize, ...style }} className={`demo-drawer drawer${className ? ` ${className}` : ''}`} />;
}

export const DrawerHeader = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function DrawerHeader({className = '', ...props}, ref) {
  return <DialogHeader {...props} ref={ref} className={`drawer-header${className ? ` ${className}` : ''}`} />;
});
export const DrawerBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function DrawerBody({className = '', ...props}, ref) {
  return <DialogBody {...props} ref={ref} className={`drawer-body${className ? ` ${className}` : ''}`} />;
});
export const DrawerFooter = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function DrawerFooter({className = '', ...props}, ref) {
  return <DialogFooter {...props} ref={ref} className={`drawer-footer${className ? ` ${className}` : ''}`} />;
});

/** Tooltip content is exposed as the trigger's accessible description. */
export function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactElement<{ 'aria-describedby'?: string }> }) {
  const id = React.useId();
  const [dismissed, setDismissed] = React.useState(false);
  const wrap = React.useRef<HTMLSpanElement>(null);
  const bubble = React.useRef<HTMLSpanElement>(null);
  const position = React.useCallback(() => {
    const element = bubble.current;
    if (!element?.getClientRects().length) return;
    element.style.transform = '';
    const bounds = element.getBoundingClientRect();
    const width = element.ownerDocument.documentElement.clientWidth;
    const shift = Math.max(12 - bounds.left, Math.min(0, width - 12 - bounds.right));
    element.style.transform = shift ? `translateX(${shift}px)` : '';
  }, []);
  useClientLayoutEffect(() => {
    position();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(position);
    if (wrap.current) observer?.observe(wrap.current);
    if (bubble.current) observer?.observe(bubble.current);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => { observer?.disconnect(); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
  }, [position, content]);
  React.useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || dismissed || !wrap.current || !(wrap.current.matches(':hover') || wrap.current.contains(document.activeElement))) return;
      const dialog = wrap.current.ownerDocument.querySelector('dialog[open]');
      if (dialog && !dialog.contains(wrap.current)) return;
      setDismissed(true); event.preventDefault(); event.stopPropagation();
    };
    document.addEventListener('keydown', escape, true);
    return () => document.removeEventListener('keydown', escape, true);
  }, [dismissed]);
  const existing = children.props['aria-describedby'];
  return <span ref={wrap} className={`tooltip-wrap${dismissed ? ' tooltip-dismissed' : ''}`}
    onMouseEnter={() => { position(); setDismissed(false); }}
    onFocus={event => { position(); if (!event.currentTarget.contains(event.relatedTarget)) setDismissed(false); }}
    onClickCapture={() => setDismissed(true)}>
    {React.cloneElement(children, { 'aria-describedby': [existing, id].filter(Boolean).join(' ') })}
    <span ref={bubble} id={id} role="tooltip" className="tooltip-content">{content}</span>
  </span>;
}

export type PopoverProps = { trigger: React.ReactNode; children: React.ReactNode; label?: string; triggerLabel?: string; iconOnly?: boolean; align?: PopupAlign; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void };
export function Popover({ trigger, children, label, triggerLabel, iconOnly = false, align = 'start', open: controlledOpen, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next: boolean) => { if (controlledOpen === undefined) setInternalOpen(next); onOpenChange?.(next); };
  const wrap = React.useRef<HTMLDivElement>(null);
  const button = React.useRef<HTMLButtonElement>(null);
  const content = React.useRef<HTMLDivElement>(null);
  usePopupPosition(open, align, button, content);
  const id = React.useId();
  useEscapeLayer(open, wrap, () => { setOpen(false); button.current?.focus(); });
  const previouslyOpen = React.useRef(open);
  useClientLayoutEffect(() => {
    if (previouslyOpen.current && !open && wrap.current?.contains(document.activeElement)) button.current?.focus();
    previouslyOpen.current = open;
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('pointerdown', outside); };
  }, [open, controlledOpen, onOpenChange]);
  const triggerButton = <button ref={button} type="button" className={`button button--outline button-inline${iconOnly ? ' button--icon' : ''}`} aria-label={triggerLabel} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{trigger}</button>;
  return <div className="popover-wrap" ref={wrap}>{iconOnly && triggerLabel ? <Tooltip content={triggerLabel}>{triggerButton}</Tooltip> : triggerButton}<div ref={content} id={id} className="popover-content" data-align={align} role="region" aria-label={label} hidden={!open}>{children}</div></div>;
}

/** Menu item icons are decorative; label supplies the accessible name. */
export type MenuItem = { label: string; value: string; disabled?: boolean; icon?: React.ReactNode };
export type DropdownMenuProps = { trigger: React.ReactNode; items: MenuItem[]; onSelect: (value: string) => void; label?: string; align?: PopupAlign };
export function DropdownMenu({ trigger, items, onSelect, label, align = 'start' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef<HTMLDivElement>(null);
  const button = React.useRef<HTMLButtonElement>(null);
  const menu = React.useRef<HTMLDivElement>(null);
  usePopupPosition(open, align, button, menu);
  const initialFocus = React.useRef<'first' | 'last'>('first');
  useEscapeLayer(open, wrap, () => { setOpen(false); button.current?.focus(); });
  const id = React.useId();
  const focusItem = (index: number) => { const all = menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'); if (all?.length) all[(index + all.length) % all.length].focus(); };
  React.useEffect(() => {
    if (!open) return;
    focusItem(initialFocus.current === 'last' ? -1 : 0);
    const outside = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('pointerdown', outside); };
  }, [open]);
  return <div className="action-menu" ref={wrap} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}><button ref={button} type="button" className="button button--outline button-inline" aria-haspopup="menu" aria-expanded={open} aria-controls={id}
    onClick={() => { initialFocus.current = 'first'; setOpen(!open); }} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); initialFocus.current = event.key === 'ArrowDown' ? 'first' : 'last'; if (open) focusItem(initialFocus.current === 'first' ? 0 : -1); else setOpen(true); } }}>{trigger}</button>
    <div ref={menu} id={id} role="menu" aria-label={label} className="action-options" data-align={align} hidden={!open} onKeyDown={(event) => {
      const all = [...(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [])]; const index = all.indexOf(document.activeElement as HTMLButtonElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); focusItem(event.key === 'Home' ? 0 : event.key === 'End' ? -1 : index + (event.key === 'ArrowDown' ? 1 : -1)); }
    }}>{items.map((item) => <button key={item.value} type="button" role="menuitem" tabIndex={-1} className="action-option" disabled={item.disabled} onClick={() => { setOpen(false); onSelect(item.value); button.current?.focus(); }}>{item.icon && <span className="action-option-icon" aria-hidden="true">{item.icon}</span>}{item.label}</button>)}</div></div>;
}

export function Slider({ value, defaultValue = 0, onValueChange, min = 0, max = 100, style, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> & { value?: number; defaultValue?: number; onValueChange?: (value: number) => void }) {
  const [internal, setInternal] = React.useState(defaultValue);
  const input = React.useRef<HTMLInputElement>(null);
  const initial = React.useRef(defaultValue);
  React.useEffect(() => {
    const form = input.current?.form;
    if (!form || value !== undefined) return;
    let active = true;
    const reset = (event: Event) => { queueMicrotask(() => { if (active && !event.defaultPrevented) setInternal(initial.current); }); };
    form.addEventListener('reset', reset);
    return () => { active = false; form.removeEventListener('reset', reset); };
  }, [value]);
  const current = value ?? internal;
  const low = Number(min), high = Number(max);
  const percent = high > low ? Math.max(0, Math.min(100, (current - low) / (high - low) * 100)) : 0;
  return <input {...props} ref={input} type="range" className={`range-input ${props.className || ''}`} min={min} max={max} value={current} style={{ ...style, '--fill': `${percent}%`, '--fill-position': `calc(${percent}% + ${12 * (0.5 - percent / 100)}px)` } as React.CSSProperties} onChange={(event) => { const next = event.currentTarget.valueAsNumber; if (value === undefined) setInternal(next); onValueChange?.(next); }} />;
}

export function FileUpload({ label = '파일 선택', onFilesChange, onInvalidFiles, maxSizeBytes, disabled, id: providedId, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & { label?: string; onFilesChange?: (files: File[]) => void; onInvalidFiles?: (message: string) => void; maxSizeBytes?: number }) {
  const generated = React.useId();
  const id = providedId || generated;
  const input = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    let active = true;
    const reset = (event: Event) => { queueMicrotask(() => { if (active && !event.defaultPrevented) { input.current?.setCustomValidity(''); setFiles([]); setError(''); } }); };
    form.addEventListener('reset', reset);
    return () => { active = false; form.removeEventListener('reset', reset); };
  }, []);
  const validate = (next: File[]) => {
    const accept = (props.accept || '').split(',').map(token => token.trim().toLowerCase()).filter(Boolean);
    const matches = (file: File) => !accept.length || accept.some(token => token.startsWith('.') ? file.name.toLowerCase().endsWith(token) : token.endsWith('/*') ? file.type.toLowerCase().startsWith(token.slice(0, -1)) : file.type.toLowerCase() === token);
    const message = next.some(file => !matches(file)) ? '지원하지 않는 파일 형식입니다.' : maxSizeBytes != null && next.some(file => file.size > maxSizeBytes) ? '파일 크기가 허용 범위를 초과합니다.' : '';
    setError(message);
    input.current?.setCustomValidity(message);
    if (message) { if (input.current) input.current.value = ''; setFiles([]); onInvalidFiles?.(message); onFilesChange?.([]); return false; }
    setFiles(next); onFilesChange?.(next); return true;
  };
  return <div className={`upload-area${dragging ? ' is-dragging' : ''}`} onDragOver={(event) => { if (!disabled) { event.preventDefault(); setDragging(true); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => {
    event.preventDefault(); setDragging(false);
    if (disabled || !input.current) return;
    const dropped = Array.from(event.dataTransfer.files);
    const next = props.multiple ? dropped : dropped.slice(0, 1);
    if (!validate(next)) return;
    const transfer = new DataTransfer(); next.forEach(file => transfer.items.add(file)); input.current.files = transfer.files;
  }}><label className="button button--outline button-inline upload-button" htmlFor={id}>{label}</label><input {...props} ref={input} id={id} type="file" disabled={disabled} className="upload-input" aria-describedby={[props['aria-describedby'], error && `${id}-error`].filter(Boolean).join(' ') || undefined} aria-invalid={error ? true : props['aria-invalid']} onChange={(event) => validate(Array.from(event.currentTarget.files || []))} />
    {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    {files.length > 0 && <div className="upload-result"><div>{files.map((file, index) => <strong key={`${file.name}-${index}`}>{file.name}</strong>)}</div><button type="button" className="button button--ghost button-inline" disabled={disabled} onClick={() => { if (input.current) { input.current.value = ''; input.current.setCustomValidity(''); } setFiles([]); setError(''); onFilesChange?.([]); }}>제거</button></div>}
  </div>;
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  appearance?: 'default' | 'solid';
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}
export function Toast({ children, variant = 'info', appearance = 'default', icon, action, onDismiss, className = '', role, ...props }: ToastProps) {
  const indicator = icon === undefined ? <Icon name={(appearance==='solid' ? emphasizedFeedbackIconNames : feedbackIconNames)[variant]} /> : icon;
  return <div aria-atomic="true" {...props} role={role || (variant === 'danger' ? 'alert' : 'status')} className={`toast toast--${variant}${appearance === 'solid' ? ' toast--solid' : ''} ${className}`}>
    {indicator != null && indicator !== false && <span className="toast-icon" aria-hidden="true">{indicator}</span>}
    <p>{children}</p>{action && <div className="toast-action">{action}</div>}{onDismiss && <button type="button" className="icon-button" aria-label="알림 닫기" onClick={onDismiss}><span className="ui-icon icon-close" aria-hidden="true" /></button>}</div>;
}

export function Slides({ slides, label = '슬라이드', initialIndex = 0 }: { slides: React.ReactNode[]; label?: string; initialIndex?: number }) {
  const [index, setIndex] = React.useState(initialIndex);
  const safe = Math.max(0, Math.min(index, slides.length - 1));
  if (!slides.length) return null;
  return <section className="slide-example" aria-label={label} aria-roledescription="슬라이드 모음"><div className="slide-index" aria-live="polite">{safe + 1} / {slides.length}</div><div className="slide-content">{slides[safe]}</div><div className="slide-actions"><button type="button" className="button button--outline button-inline" disabled={safe === 0} onClick={() => setIndex(safe - 1)}>이전</button><button type="button" className="button button--outline button-inline" disabled={safe === slides.length - 1} onClick={() => setIndex(safe + 1)}>다음</button></div></section>;
}
