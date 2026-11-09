import * as React from 'react';
import { Tooltip } from '../tooltip/Tooltip';
import { useClientLayoutEffect } from '../../shared/use-client-layout-effect';
import { type PopupAlign, usePopupPosition } from '../../shared/popup-position';
import { useEscapeLayer } from '../../shared/escape-layer';

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
