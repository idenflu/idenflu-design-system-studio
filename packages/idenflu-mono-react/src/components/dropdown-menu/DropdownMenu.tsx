import * as React from 'react';
import { type PopupAlign, usePopupPosition } from '../../shared/popup-position';
import { useEscapeLayer } from '../../shared/escape-layer';

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
