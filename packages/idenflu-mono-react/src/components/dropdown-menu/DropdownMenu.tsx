import * as React from 'react';
import { type PopupAlign, usePopupPosition } from '../../shared/popup-position';
import { useEscapeLayer } from '../../shared/escape-layer';

type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>;
export type DropdownMenuProps = { trigger: React.ReactElement<TriggerProps>; children: React.ReactNode; onSelect: (value: string) => void; label?: string; align?: PopupAlign };
export type DropdownMenuItemProps = { value: string; children: React.ReactNode; disabled?: boolean; icon?: React.ReactNode };

const MenuContext = React.createContext<((value: string) => void) | null>(null);

/** Item icons are decorative; children provide the accessible name. */
export function DropdownMenuItem({ value, children, disabled, icon }: DropdownMenuItemProps) {
  const select = React.useContext(MenuContext);
  return <button type="button" role="menuitem" tabIndex={-1} className="action-option" disabled={disabled} onClick={() => select?.(value)}>{icon && <span className="action-option-icon" aria-hidden="true">{icon}</span>}{children}</button>;
}

export function DropdownMenu({ trigger, children, onSelect, label, align = 'start' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef<HTMLDivElement>(null);
  const button = React.useRef<HTMLButtonElement>(null);
  const menu = React.useRef<HTMLDivElement>(null);
  usePopupPosition(open, align, button, menu);
  const initialFocus = React.useRef<'first' | 'last'>('first');
  useEscapeLayer(open, wrap, () => { setOpen(false); button.current?.focus(); });
  const id = React.useId();
  const focusItem = (index: number) => { const all = menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'); if (all?.length) all[(index + all.length) % all.length].focus(); };
  React.useEffect(() => {
    if (!open) return;
    focusItem(initialFocus.current === 'last' ? -1 : 0);
    const outside = (event: PointerEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('pointerdown', outside); };
  }, [open]);
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
    ref: setTriggerRef, 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': id,
    onClick: event => { trigger.props.onClick?.(event); if (!event.defaultPrevented) { initialFocus.current = 'first'; setOpen(value => !value); } },
    onKeyDown: event => { trigger.props.onKeyDown?.(event); if (!event.defaultPrevented && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) { event.preventDefault(); initialFocus.current = event.key === 'ArrowDown' ? 'first' : 'last'; if (open) focusItem(initialFocus.current === 'first' ? 0 : -1); else setOpen(true); } },
  });
  return <div className="action-menu" ref={wrap} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>{triggerElement}
    <div ref={menu} id={id} role="menu" aria-label={label} className="action-options" data-align={align} hidden={!open} onKeyDown={(event) => {
      const all = [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') || [])]; const index = all.indexOf(document.activeElement as HTMLButtonElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); focusItem(event.key === 'Home' ? 0 : event.key === 'End' ? -1 : index + (event.key === 'ArrowDown' ? 1 : -1)); }
    }}><MenuContext.Provider value={value => { setOpen(false); onSelect(value); button.current?.focus(); }}>{children}</MenuContext.Provider></div></div>;
}
