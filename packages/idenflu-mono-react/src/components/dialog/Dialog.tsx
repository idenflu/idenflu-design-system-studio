import * as React from 'react';
import { useClientLayoutEffect } from '../../shared/use-client-layout-effect';
import { lockDialogScroll } from '../../shared/dialog-scroll-lock';
import { useEscapeLayer } from '../../shared/escape-layer';

type DismissibleProps = { open: boolean; onOpenChange: (open: boolean) => void };

export type DialogProps = DismissibleProps & {
  /** Use modal scroll locking and wrapped focus. Changes while open apply on the next opening. */
  modal?: boolean;
  closeOnBackdrop?: boolean;
  variant?: 'default' | 'divided';
  /** Focus this descendant after the native dialog opens. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
} & Omit<React.DialogHTMLAttributes<HTMLDialogElement>, 'open' | 'onClose'>;

/** Native dialog with modal focus wrapping and shared Escape-layer ordering. */
export function Dialog({ open, onOpenChange, children, className = '', modal = true, closeOnBackdrop = false, variant = 'default', initialFocusRef, onClick, onKeyDown, onPointerDownCapture, onPointerCancelCapture, ...props }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const openedAsModal = React.useRef<boolean | null>(null);
  const activeModal = openedAsModal.current ?? modal;
  const backdropPointerDown = React.useRef(false);
  useClientLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      const lock = activeModal ? lockDialogScroll(dialog.ownerDocument) : undefined;
      try {
        if (!dialog.open) {
          if (activeModal) dialog.showModal();
          else dialog.show();
        }
        openedAsModal.current = activeModal;
        const target = initialFocusRef?.current;
        if (target && dialog.contains(target)) target.focus({preventScroll:true});
        lock?.restorePosition();
      } catch (error) { lock?.release(); throw error; }
      return lock?.release;
    }
    else if (!open) { backdropPointerDown.current = false; openedAsModal.current = null; if (dialog.open) dialog.close(); }
  }, [open, activeModal, initialFocusRef]);
  const isTopLayer = useEscapeLayer(open, ref, () => onOpenChange(false));
  const isBackdrop = (event: React.MouseEvent<HTMLDialogElement> | React.PointerEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return false;
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  return <dialog {...props} aria-modal={props['aria-modal'] ?? (activeModal ? undefined : false)} ref={ref} className={`dialog${variant === 'divided' ? ' dialog--divided' : ''}${className ? ` ${className}` : ''}`} onPointerDownCapture={event => {
    backdropPointerDown.current = closeOnBackdrop && event.isPrimary && event.button === 0 && isBackdrop(event);
    onPointerDownCapture?.(event);
    if (event.defaultPrevented) backdropPointerDown.current = false;
  }} onPointerCancelCapture={event => { backdropPointerDown.current = false; onPointerCancelCapture?.(event); }} onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Tab' || !activeModal) return;
    const dialog = event.currentTarget;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(element => element.tabIndex >= 0 && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[inert]'));
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (!first) { event.preventDefault(); dialog.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
  }} onClick={event => { const beganOnBackdrop = backdropPointerDown.current; backdropPointerDown.current = false; onClick?.(event); if (!event.defaultPrevented && event.detail > 0 && closeOnBackdrop && beganOnBackdrop && isBackdrop(event)) onOpenChange(false); }} onCancel={(event) => { if (event.target !== event.currentTarget) return; event.preventDefault(); if (isTopLayer()) onOpenChange(false); }} onClose={event => { if (event.target === event.currentTarget && open && !event.currentTarget.open) onOpenChange(false); }}>{children}</dialog>;
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
