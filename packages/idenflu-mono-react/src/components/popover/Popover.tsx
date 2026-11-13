import * as React from 'react';
import { useClientLayoutEffect } from '../../shared/use-client-layout-effect';
import { type PopupAlign, usePopupPosition } from '../../shared/popup-position';
import { useEscapeLayer } from '../../shared/escape-layer';

type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>;
export type PopoverProps = { trigger: React.ReactElement<TriggerProps>; children: React.ReactNode; label?: string; align?: PopupAlign; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void };

export function Popover({ trigger, children, label, align = 'start', open: controlledOpen, defaultOpen = false, onOpenChange }: PopoverProps) {
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
  // React 18 stores ref on the element; React 19 exposes it as a prop.
  const triggerRef = Number.parseInt(React.version, 10) >= 19 ? trigger.props.ref : (trigger as unknown as { ref?: React.Ref<HTMLButtonElement> }).ref;
  const refCleanup = React.useRef<(() => void) | void>(undefined);
  const setTriggerRef = React.useCallback((node: HTMLButtonElement | null) => {
    (button as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    if (typeof triggerRef === 'function') {
      if (node) refCleanup.current = triggerRef(node);
      else if (refCleanup.current) { refCleanup.current(); refCleanup.current = undefined; }
      else triggerRef(null);
    } else if (triggerRef) (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  }, [triggerRef]);
  const triggerElement = React.cloneElement(trigger, {
    ref: setTriggerRef, 'aria-expanded': open, 'aria-controls': id,
    onClick: event => { trigger.props.onClick?.(event); if (!event.defaultPrevented) setOpen(!open); },
  });
  return <div className="popover-wrap" ref={wrap}>{triggerElement}<div ref={content} id={id} className="popover-content" data-align={align} role="region" aria-label={label} hidden={!open}>{children}</div></div>;
}
