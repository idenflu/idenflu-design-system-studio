import * as React from 'react';
import { useClientLayoutEffect } from '../../shared/use-client-layout-effect';
import { useValue } from '../../shared/use-value';

export interface TabOption { value: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean; closable?: boolean; closeLabel?: string }

export interface TabsProps { items: readonly TabOption[]; label: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; onTabClose?: (value: string) => void; orientation?: 'horizontal' | 'vertical'; className?: string }

export function Tabs({items, label, value, defaultValue, onValueChange, onTabClose, orientation = 'horizontal', className}: TabsProps) {
  const first = items.find(item => !item.disabled)?.value ?? '';
  const [current, setCurrent] = useValue(value, defaultValue ?? first, onValueChange);
  const id = React.useId();
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const list = React.useRef<HTMLDivElement>(null);
  const pendingClose = React.useRef<string | null>(null);
  const pendingKeyboardFocus = React.useRef<string | null>(null);
  // Content updates alone should not undo a user's manual tab-list scroll.
  const itemStructure = JSON.stringify(items.map(item => [item.value, Boolean(item.disabled)]));
  const selected = items.some(item => item.value === current && !item.disabled) ? current : first;
  useClientLayoutEffect(() => {
    if (!pendingKeyboardFocus.current) return;
    if (pendingKeyboardFocus.current === selected) refs.current[items.findIndex(item => item.value === selected)]?.focus();
    pendingKeyboardFocus.current = null;
  }, [items, selected]);
  const closeTab = (index: number) => {
    const item = items[index];
    if (!item.closable || item.disabled || !onTabClose) return;
    pendingClose.current = item.value;
    if (item.value === selected) {
      const next = [...items.slice(0,index)].reverse().find(item => !item.disabled) ?? items.slice(index+1).find(item => !item.disabled);
      if (next) setCurrent(next.value);
    }
    onTabClose(item.value);
  };
  React.useEffect(() => {
    if (pendingClose.current && !items.some(item => item.value === pendingClose.current)) {
      refs.current[items.findIndex(item => item.value === selected)]?.focus();
      pendingClose.current = null;
    }
    const container = list.current;
    if (!container) return;
    const reveal = () => {
      const element = refs.current[items.findIndex(item => item.value === selected)];
      if (!element) return;
      const tab = element.getBoundingClientRect(), bounds = container.getBoundingClientRect();
      if (orientation === 'vertical') {
        if (tab.top < bounds.top) container.scrollTop -= bounds.top - tab.top;
        else if (tab.bottom > bounds.bottom) container.scrollTop += tab.bottom - bounds.bottom;
      } else {
        if (tab.left < bounds.left) container.scrollLeft -= bounds.left - tab.left;
        else if (tab.right > bounds.right) container.scrollLeft += tab.right - bounds.right;
      }
    };
    reveal();
    const win = container.ownerDocument.defaultView;
    const Observer = (win as Window & {ResizeObserver?: typeof ResizeObserver} | null)?.ResizeObserver;
    const observer = Observer ? new Observer(reveal) : null;
    observer?.observe(container);
    refs.current.forEach(element => { if (element) observer?.observe(element); });
    win?.addEventListener('resize', reveal);
    return () => { observer?.disconnect(); win?.removeEventListener('resize', reveal); };
  }, [itemStructure, selected, orientation]);
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Delete' && items[index].closable && onTabClose) { event.preventDefault(); closeTab(index); return; }
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    if (![nextKey, previousKey, 'Home', 'End'].includes(event.key)) return;
    const enabled = items.map((item, i) => item.disabled ? -1 : i).filter(i => i >= 0);
    if (!enabled.length) return;
    event.preventDefault();
    const position = enabled.indexOf(index);
    const target = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled[enabled.length - 1] : enabled[(position + (event.key === nextKey ? 1 : -1) + enabled.length) % enabled.length];
    if (items[target].value === selected) { refs.current[target]?.focus(); return; }
    pendingKeyboardFocus.current = items[target].value;
    setCurrent(items[target].value);
  };
  return <div className={`tabs${className ? ` ${className}` : ''}`} data-orientation={orientation}><div ref={list} className="tab-list" role="tablist" aria-label={label} aria-orientation={orientation}>
    {items.map((item, index) => {
      const closable = item.closable && !!onTabClose;
      const tab = <button ref={node => { refs.current[index] = node; }} type="button" role="tab" className="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={item.value === selected} aria-keyshortcuts={closable ? 'Delete' : undefined} tabIndex={item.value === selected ? 0 : -1} disabled={item.disabled} onClick={() => setCurrent(item.value)} onKeyDown={event => onKeyDown(event, index)}>{item.label}</button>;
      return closable ? <div className="tab-item" key={item.value}>{tab}<button type="button" className="tab-close" tabIndex={-1} disabled={item.disabled} aria-label={item.closeLabel || (typeof item.label === 'string' ? `${item.label} 탭 닫기` : '탭 닫기')} onMouseDown={event => event.preventDefault()} onClick={() => closeTab(index)}><span className="ui-icon icon-x" aria-hidden="true" /></button></div> : <React.Fragment key={item.value}>{tab}</React.Fragment>;
    })}
  </div>{items.map((item, index) => <div key={item.value} className="tab-panel" role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={item.value !== selected} tabIndex={0}>{item.content}</div>)}</div>;
}
