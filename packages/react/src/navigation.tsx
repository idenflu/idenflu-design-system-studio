import * as React from 'react';
import { useEscapeLayer } from './escape-layer';

/** Values must be unique and stable; option icons are decorative. */
export interface SelectOption { value: string; label: string; disabled?: boolean; description?: string; icon?: React.ReactNode }
type Size = 'sm' | 'md' | 'lg';

function useValue<T>(value: T | undefined, fallback: T, onChange?: (value: T) => void) {
  const initial = React.useRef(fallback);
  const [internal, setInternal] = React.useState(fallback);
  const current = value === undefined ? internal : value;
  const update = (next: T) => { if (value === undefined) setInternal(next); onChange?.(next); };
  const reset = () => { if (value === undefined) setInternal(initial.current); };
  return [current, update, reset] as const;
}

function useFormReset(ref: React.RefObject<HTMLElement | null>, reset: () => void) {
  const latest = React.useRef(reset);
  latest.current = reset;
  React.useEffect(() => {
    const form = ref.current?.closest('form');
    if (!form) return;
    let active = true;
    const handler = (event: Event) => { queueMicrotask(() => { if (active && !event.defaultPrevented) latest.current(); }); };
    form.addEventListener('reset', handler);
    return () => { active = false; form.removeEventListener('reset', handler); };
  }, [ref]);
}

interface SelectShared {
  options: readonly SelectOption[];
  label: string;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  size?: Size;
  required?: boolean;
  /** Decorative icon shown before the value or placeholder. */
  prefixIcon?: React.ReactNode;
  /** Use fixed positioning for option lists inside scrolling or clipped containers. */
  popupStrategy?: 'absolute' | 'fixed';
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
}
export interface SelectProps extends SelectShared { value?: string; defaultValue?: string; onValueChange?: (value: string) => void }
export interface MultiSelectProps extends SelectShared { value?: readonly string[]; defaultValue?: readonly string[]; onValueChange?: (value: string[]) => void; searchable?: boolean; presentation?: 'default' | 'inline'; clearable?: boolean }

interface SelectCoreProps extends SelectShared {
  selected: readonly string[];
  onSelect: (value: string) => void;
  onReset: () => void;
  multiple?: boolean;
  searchable?: boolean;
  presentation?: 'default' | 'inline';
  clearable?: boolean;
  onClear?: () => void;
}

function SelectCore({options, label, name, disabled, placeholder = '선택하세요', className, size, required, prefixIcon, popupStrategy = 'absolute', selected, onSelect, onReset, multiple, searchable, presentation = 'default', clearable = false, onClear, ...aria}: SelectCoreProps) {
  const id = React.useId();
  const root = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const search = React.useRef<HTMLInputElement>(null);
  const popupElement = React.useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = React.useState<{top:number; left:number; width:number; maxHeight:number} | null>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<string | null>(null);
  const [attempted, setAttempted] = React.useState(false);
  const [, setResetRevision] = React.useState(0);
  const selectedOptions = options.filter(option => selected.includes(option.value));
  const selectedLabels = selectedOptions.map(option => option.label);
  const validSelected = selected.filter(value => value !== '' && options.some(option => option.value === value && !option.disabled));
  const invalid = Boolean(attempted && required && !validSelected.length);
  const describedBy = [aria['aria-describedby'], invalid ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  const visible = options.filter(option => !searchable || option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const enabled = visible.filter(option => !option.disabled);
  useFormReset(root, () => { onReset(); setOpen(false); setQuery(''); setActive(null); setAttempted(false); queueMicrotask(() => setResetRevision(revision => revision + 1)); });

  React.useEffect(() => {
    if (!open || popupStrategy !== 'fixed') { setPopupPosition(null); return; }
    const control = root.current?.querySelector<HTMLElement>('.search-select-control,.multi-inline-control') || trigger.current;
    const popup = popupElement.current;
    const win = root.current?.ownerDocument.defaultView;
    if (!control || !popup || !win) return;
    const update = () => {
      const rect = control.getBoundingClientRect();
      const viewportWidth = win.document.documentElement.clientWidth || win.innerWidth;
      const viewportHeight = win.innerHeight;
      if (rect.bottom < 0 || rect.top > viewportHeight || rect.right < 0 || rect.left > viewportWidth) { setOpen(false); return; }
      const list = popup.querySelector<HTMLElement>('.select-options');
      const searchHeight = popup.querySelector<HTMLElement>('.multi-search-field')?.getBoundingClientRect().height || 0;
      const style = win.getComputedStyle(popup);
      const chromeHeight = ['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((sum, key) => sum + (Number.parseFloat(style[key as 'paddingTop']) || 0), 0);
      const desiredHeight = Math.min(list?.scrollHeight || popup.scrollHeight, 256) + searchHeight + chromeHeight;
      const below = Math.max(0, viewportHeight - rect.bottom - 14), above = Math.max(0, rect.top - 14);
      const opensAbove = below < desiredHeight && above > below;
      const maxHeight = Math.max(0, opensAbove ? above : below);
      const width = Math.min(Math.max(1, rect.width), Math.max(1, viewportWidth - 16));
      const next = {top:opensAbove ? Math.max(8, rect.top - 6 - Math.min(desiredHeight, maxHeight)) : rect.bottom + 6, left:Math.max(8, Math.min(rect.left, viewportWidth - width - 8)), width, maxHeight};
      setPopupPosition(previous => previous && previous.top === next.top && previous.left === next.left && previous.width === next.width && previous.maxHeight === next.maxHeight ? previous : next);
    };
    update();
    win.addEventListener('resize', update);
    win.addEventListener('scroll', update, true);
    const Observer = (win as Window & {ResizeObserver?: typeof ResizeObserver}).ResizeObserver;
    const observer = Observer ? new Observer(update) : null;
    observer?.observe(control);
    return () => { win.removeEventListener('resize', update); win.removeEventListener('scroll', update, true); observer?.disconnect(); };
  }, [open, popupStrategy, searchable, multiple, presentation, query, visible.length]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('pointerdown', handlePointer);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, [open]);
  React.useEffect(() => { if (disabled) { setOpen(false); setQuery(''); } }, [disabled]);
  React.useEffect(() => { if (open && multiple && searchable) search.current?.focus(); }, [open, multiple, searchable]);
  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    setActive(enabled.find(option => selected.includes(option.value))?.value ?? enabled[0]?.value ?? null);
  };
  const closeMenu = (restoreFocus = false) => { setOpen(false); setQuery(''); if (restoreFocus) (searchable && !multiple ? search : trigger).current?.focus(); };
  useEscapeLayer(open, root, () => closeMenu(true));
  const move = (delta: number) => {
    if (!enabled.length) { setActive(null); return; }
    const index = enabled.findIndex(option => option.value === active);
    setActive(enabled[(index < 0 ? (delta > 0 ? 0 : enabled.length - 1) : (index + delta + enabled.length) % enabled.length)].value);
  };
  const selectOption = (value: string) => {
    const option = options.find(item => item.value === value);
    if (!option || option.disabled) return;
    onSelect(value);
    if (!multiple) closeMenu(true);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') { setOpen(false); setQuery(''); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu(); else move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (open && (event.key === 'Home' || event.key === 'End') && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault(); setActive((event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1])?.value ?? null);
    } else if (open && (event.key === 'Enter' || (event.key === ' ' && !(event.target instanceof HTMLInputElement)))) {
      event.preventDefault(); if (active) selectOption(active);
    }
  };
  const activeIndex = options.findIndex(option => option.value === active && visible.includes(option));
  const listId = `${id}-list`;
  const prefix = prefixIcon != null ? <span className="select-prefix-icon" aria-hidden="true" onClick={() => {
    if (disabled) return;
    if (searchable && !multiple) search.current?.focus();
    else if (multiple && presentation === 'inline') { if (open) closeMenu(true); else { openMenu(); trigger.current?.focus(); } }
  }}>{prefixIcon}</span> : null;
  React.useEffect(() => {
    if (open && activeIndex >= 0) root.current?.ownerDocument.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex, id]);
  const popup = <div ref={popupElement} className="select-popup" data-popup-strategy={popupStrategy === 'fixed' ? 'fixed' : undefined} hidden={!open} style={popupStrategy === 'fixed' ? {position:'fixed', top:popupPosition?.top ?? 0, left:popupPosition?.left ?? 0, right:'auto', bottom:'auto', width:popupPosition?.width, maxHeight:popupPosition?.maxHeight, visibility:popupPosition ? 'visible' : 'hidden'} : undefined}>
    {multiple && searchable && <div className="multi-search-field"><input ref={search} className="multi-search-input" type="search" role="combobox" aria-label={`${label} 검색`} aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} value={query} onChange={event => { const next = event.target.value; setQuery(next); setActive(options.find(option => !option.disabled && option.label.toLocaleLowerCase().includes(next.toLocaleLowerCase()))?.value ?? null); }} onKeyDown={onKeyDown} />{query && <button type="button" className="input-action" aria-label="검색어 지우기" onClick={() => { setQuery(''); setActive(options.find(option => !option.disabled)?.value ?? null); search.current?.focus(); }}><span className="ui-icon icon-close" aria-hidden="true" /></button>}</div>}
    <ul id={listId} className="select-options" role="listbox" aria-label={label} aria-multiselectable={multiple || undefined}>
      {visible.map(option => {
        const index = options.indexOf(option);
        return <li key={option.value} id={`${id}-option-${index}`} className={`select-option${active === option.value ? ' is-active' : ''}`} role="option" aria-selected={selected.includes(option.value)} aria-disabled={option.disabled || undefined} onMouseDown={event => event.preventDefault()} onMouseMove={() => { if (!option.disabled) setActive(option.value); }} onClick={() => selectOption(option.value)}><span className="select-option-content">{option.icon && <span className="select-option-icon" aria-hidden="true">{option.icon}</span>}<span className="select-option-copy"><span className="option-label">{option.label}</span>{option.description && <span className="option-description">{option.description}</span>}</span></span><span className="ui-icon icon-check option-check" aria-hidden="true" /></li>;
      })}
    </ul>
    {!visible.length && <p className="search-select-empty" role="status">검색 결과가 없습니다.</p>}
  </div>;
  return <div>
    <label className="field-label" htmlFor={`${id}-trigger`}>{label}</label>
    <div ref={root} className={`custom-select${searchable && !multiple ? ' search-select' : ''}${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`} data-size={size} data-multiselect={multiple ? '' : undefined}>
    <select className="sr-only" aria-hidden="true" tabIndex={-1} name={name} multiple={multiple} required={required} disabled={disabled} value={multiple ? validSelected : validSelected[0] ?? ''} onChange={() => {}} onInvalid={event => { event.preventDefault(); setAttempted(true); const control = event.currentTarget; const firstInvalid = control.form && Array.from(control.form.elements).find(element => { const candidate = element as HTMLInputElement; return candidate.willValidate && !candidate.validity.valid; }); if (!firstInvalid || firstInvalid === control) (searchable && !multiple ? search : trigger).current?.focus(); }}>
      {!multiple && <option value="">{placeholder}</option>}
      {options.filter(option => option.value !== '').map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
    {searchable && !multiple ? <div className="search-select-control">{prefix}<input id={`${id}-trigger`} ref={search} className="search-select-input" role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} aria-required={required || undefined} aria-describedby={describedBy} aria-invalid={invalid || aria['aria-invalid']} disabled={disabled} placeholder={placeholder} value={open ? query : selectedLabels[0] ?? ''} onFocus={() => { setQuery(''); openMenu(); }} onClick={() => { if (!open) openMenu(); }} onChange={event => { const next = event.target.value; setQuery(next); setOpen(true); setActive(options.find(option => !option.disabled && option.label.toLocaleLowerCase().includes(next.toLocaleLowerCase()))?.value ?? null); }} onKeyDown={onKeyDown} /></div>
      : multiple && presentation === 'inline' ? <div className="multi-inline-control">{prefix}<div className="multi-inline-tags" role="group" aria-label={`${label} 선택 항목`}>
          {selectedLabels.length ? selectedOptions.map(option => <button key={option.value} type="button" className="chip multi-inline-chip" aria-label={`${option.label} 제거`} disabled={disabled || option.disabled} onClick={() => onSelect(option.value)}>{option.icon && <span className="select-option-icon" aria-hidden="true">{option.icon}</span>}{option.label}<span className="ui-icon icon-close" aria-hidden="true" /></button>) : <span className="multi-inline-placeholder">{placeholder}</span>}
        </div>{clearable && <button type="button" className="input-action multi-inline-clear" aria-label={`${label} 모두 지우기`} disabled={disabled || !selected.length} onClick={onClear}><span className="ui-icon icon-close" aria-hidden="true" /></button>}
        <button id={`${id}-trigger`} ref={trigger} type="button" className="input-action multi-inline-trigger" role="combobox" aria-label={`${label}: ${selectedLabels.join(', ') || placeholder}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} aria-required={required || undefined} aria-describedby={describedBy} aria-invalid={invalid || aria['aria-invalid']} disabled={disabled} onClick={() => open ? closeMenu() : openMenu()} onKeyDown={onKeyDown}><span className="ui-icon icon-caret" aria-hidden="true" /></button></div>
      : <button id={`${id}-trigger`} ref={trigger} type="button" className="select-trigger" role="combobox" aria-label={`${label}: ${selectedLabels.join(', ') || placeholder}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} aria-required={required || undefined} aria-describedby={describedBy} aria-invalid={invalid || aria['aria-invalid']} disabled={disabled} onClick={() => open ? closeMenu() : openMenu()} onKeyDown={onKeyDown}><span data-select-label className="select-value-content">{prefix}{!multiple && selectedOptions[0]?.icon && <span className="select-option-icon" aria-hidden="true">{selectedOptions[0].icon}</span>}<span className="select-value-text">{selectedLabels.join(', ') || placeholder}</span></span><span className="ui-icon icon-caret" aria-hidden="true" /></button>}
    {popup}
    {multiple && presentation !== 'inline' && clearable && <button type="button" className="button button--ghost button-inline multi-clear" disabled={disabled || !selected.length} onClick={onClear}>모두 지우기</button>}
    {invalid && <p id={`${id}-error`} className="component-helper is-error" role="alert">항목을 선택해주세요.</p>}
    </div>
  </div>;
}

export function Select({value, defaultValue = '', onValueChange, ...props}: SelectProps) {
  const [selected, setSelected, reset] = useValue(value, defaultValue, onValueChange);
  return <SelectCore {...props} selected={selected ? [selected] : []} onSelect={setSelected} onReset={reset} />;
}
export function SearchSelect({value, defaultValue = '', onValueChange, ...props}: SelectProps) {
  const [selected, setSelected, reset] = useValue(value, defaultValue, onValueChange);
  return <SelectCore {...props} searchable selected={selected ? [selected] : []} onSelect={setSelected} onReset={reset} />;
}
export function MultiSelect({value, defaultValue = [], onValueChange, ...props}: MultiSelectProps) {
  const [selected, setSelected, reset] = useValue<readonly string[]>(value, defaultValue, next => onValueChange?.([...next]));
  return <SelectCore {...props} multiple selected={selected} onClear={() => setSelected([])} onSelect={next => setSelected(selected.includes(next) ? selected.filter(item => item !== next) : [...selected, next])} onReset={reset} />;
}

export interface TabOption { value: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean }
export interface TabsProps { items: readonly TabOption[]; label: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; orientation?: 'horizontal' | 'vertical'; className?: string }
export function Tabs({items, label, value, defaultValue, onValueChange, orientation = 'horizontal', className}: TabsProps) {
  const first = items.find(item => !item.disabled)?.value ?? '';
  const [current, setCurrent] = useValue(value, defaultValue ?? first, onValueChange);
  const id = React.useId();
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const selected = items.some(item => item.value === current && !item.disabled) ? current : first;
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    if (![nextKey, previousKey, 'Home', 'End'].includes(event.key)) return;
    const enabled = items.map((item, i) => item.disabled ? -1 : i).filter(i => i >= 0);
    if (!enabled.length) return;
    event.preventDefault();
    const position = enabled.indexOf(index);
    const target = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled[enabled.length - 1] : enabled[(position + (event.key === nextKey ? 1 : -1) + enabled.length) % enabled.length];
    refs.current[target]?.focus(); setCurrent(items[target].value);
  };
  return <div className={`tabs${className ? ` ${className}` : ''}`}><div className="tab-list" role="tablist" aria-label={label} aria-orientation={orientation}>
    {items.map((item, index) => <button ref={node => { refs.current[index] = node; }} key={item.value} type="button" role="tab" className="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={item.value === selected} tabIndex={item.value === selected ? 0 : -1} disabled={item.disabled} onClick={() => setCurrent(item.value)} onKeyDown={event => onKeyDown(event, index)}>{item.label}</button>)}
  </div>{items.map((item, index) => <div key={item.value} className="tab-panel" role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={item.value !== selected} tabIndex={0}>{item.content}</div>)}</div>;
}

export interface SegmentedOption { value: string; label: React.ReactNode; disabled?: boolean }
export interface SegmentedProps { options: readonly SegmentedOption[]; label: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; name?: string; disabled?: boolean; size?: Size; className?: string }
export function Segmented({options, label, value, defaultValue, onValueChange, name, disabled, size, className}: SegmentedProps) {
  const initial = defaultValue ?? options.find(option => !option.disabled)?.value ?? '';
  const [current, setCurrent, reset] = useValue(value, initial, onValueChange);
  const root = React.useRef<HTMLDivElement>(null);
  useFormReset(root, reset);
  return <div ref={root} className={`segmented-control${className ? ` ${className}` : ''}`} role="group" aria-label={label} data-size={size}>
    {name && <input type="hidden" name={name} value={current} disabled={disabled} />}
    {options.map(option => <button key={option.value} type="button" aria-pressed={current === option.value} disabled={disabled || option.disabled} onClick={() => setCurrent(option.value)}>{option.label}</button>)}
  </div>;
}

export interface TreeNode { value: string; label: React.ReactNode; disabled?: boolean; children?: readonly TreeNode[] }
export interface TreeProps { items: readonly TreeNode[]; label: string; value?: string | null; defaultValue?: string | null; onValueChange?: (value: string) => void; expanded?: readonly string[]; defaultExpanded?: readonly string[]; onExpandedChange?: (values: string[]) => void; name?: string; className?: string }
export function Tree({items, label, value, defaultValue = null, onValueChange, expanded, defaultExpanded = [], onExpandedChange, name, className}: TreeProps) {
  const [current, setCurrent, reset] = useValue<string | null>(value, defaultValue, next => { if (next !== null) onValueChange?.(next); });
  const [opened, setOpened, resetOpened] = useValue<readonly string[]>(expanded, defaultExpanded, next => onExpandedChange?.([...next]));
  const root = React.useRef<HTMLDivElement>(null);
  useFormReset(root, () => { reset(); resetOpened(); });
  const nodes = (entries: readonly TreeNode[]): React.ReactNode => entries.map(item => item.children?.length ? <details key={item.value} open={opened.includes(item.value)}><summary aria-disabled={item.disabled || undefined} onClick={event => { event.preventDefault(); if (!item.disabled) setOpened(opened.includes(item.value) ? opened.filter(key => key !== item.value) : [...opened, item.value]); }}><span>{item.label}</span></summary><div className="tree-children">{nodes(item.children)}</div></details> : <button key={item.value} type="button" className={`tree-item${current === item.value ? ' is-selected' : ''}`} aria-current={current === item.value ? 'true' : undefined} disabled={item.disabled} onClick={() => setCurrent(item.value)}>{item.label}</button>);
  return <div ref={root} className={`demo-tree${className ? ` ${className}` : ''}`} role="group" aria-label={label}>{name && <input type="hidden" name={name} value={current ?? ''} />}{nodes(items)}</div>;
}
