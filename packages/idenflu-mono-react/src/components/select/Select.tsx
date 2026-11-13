import * as React from 'react';
import { type Size } from '../../shared/types';
import { useClientLayoutEffect } from '../../shared/use-client-layout-effect';
import { useValue } from '../../shared/use-value';
import { useFormReset } from '../../shared/use-form-reset';
import { InlineSelectTags } from './InlineSelectTags';
import { useEscapeLayer } from '../../shared/escape-layer';

/** Values must be unique and stable; option icons are decorative. */
export interface SelectOption { value: string; label: string; disabled?: boolean; description?: string; icon?: React.ReactNode }

interface SelectShared {
  options: readonly SelectOption[];
  label: string;
  /** Keep the label accessible while hiding it visually. */
  hideLabel?: boolean;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  size?: Size;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  /** Decorative icon shown before the value or placeholder. */
  prefixIcon?: React.ReactNode;
  /** Use fixed positioning for option lists inside scrolling or clipped containers. */
  popupStrategy?: 'absolute' | 'fixed';
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
}

export interface SelectProps extends SelectShared { value?: string; defaultValue?: string; onValueChange?: (value: string) => void }

export interface MultiSelectProps extends SelectShared {
  value?: readonly string[]; defaultValue?: readonly string[]; onValueChange?: (value: string[]) => void;
  searchable?: boolean; presentation?: 'default' | 'inline'; clearable?: boolean;
  /** Summarize additional labels as a count. Positive integers only; ignored for inline tags. */
  maxVisibleLabels?: number;
  /** Fit inline tags to the available width, optionally limiting their number. Zero shows only the count. */
  maxVisibleTags?: number | 'responsive';
}

interface SelectCoreProps extends SelectShared {
  selected: readonly string[];
  onSelect: (value: string) => void;
  onReset: () => void;
  multiple?: boolean;
  searchable?: boolean;
  presentation?: 'default' | 'inline';
  clearable?: boolean;
  maxVisibleLabels?: number;
  maxVisibleTags?: number | 'responsive';
  onClear?: () => void;
  buttonRef?: React.ForwardedRef<HTMLButtonElement>;
  inputRef?: React.ForwardedRef<HTMLInputElement>;
}

function SelectCore({options, label, hideLabel = false, name, disabled, readOnly, placeholder = '선택하세요', className, size, required, helperText, error, prefixIcon, popupStrategy = 'absolute', selected, onSelect, onReset, multiple, searchable, presentation = 'default', clearable = false, maxVisibleLabels, maxVisibleTags = 'responsive', onClear, buttonRef, inputRef, ...aria}: SelectCoreProps) {
  const id = React.useId();
  const root = React.useRef<HTMLDivElement>(null);
  const native = React.useRef<HTMLSelectElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const search = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(buttonRef, () => trigger.current!, [presentation, searchable, multiple]);
  React.useImperativeHandle(inputRef, () => search.current!, [searchable, multiple]);
  const popupElement = React.useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = React.useState<{top:number; left:number; width:number; maxHeight:number} | null>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState<string | null>(null);
  const [attempted, setAttempted] = React.useState(false);
  const selectedOptions = options.filter(option => selected.includes(option.value));
  const selectedLabels = selectedOptions.map(option => option.label);
  const labelLimit = maxVisibleLabels !== undefined && Number.isInteger(maxVisibleLabels) && maxVisibleLabels > 0 ? maxVisibleLabels : Infinity;
  const displayValue = multiple && selectedLabels.length > labelLimit
    ? <span className="select-value-summary"><span className="select-summary-labels">{selectedLabels.slice(0, labelLimit).join(', ')}</span><span className="select-summary-count">{` 외 ${selectedLabels.length - labelLimit}개`}</span></span> : selectedLabels.join(', ');
  const validSelected = selected.filter(value => value !== '' && options.some(option => option.value === value && !option.disabled));
  useClientLayoutEffect(() => {
    // A user-triggered native reset can run after reset listeners and React updates.
    // Keep its defaults aligned with the committed selection so it cannot overwrite
    // React's value with a stale placeholder after those updates have finished.
    const values = new Set(multiple ? validSelected : [validSelected[0] ?? '']);
    for (const option of native.current?.options ?? []) {
      const isSelected = values.has(option.value);
      if (option.defaultSelected !== isSelected) option.defaultSelected = isSelected;
    }
  });
  const requiredInvalid = Boolean(attempted && required && !readOnly && !validSelected.length);
  const message = error != null ? error : requiredInvalid ? '항목을 선택해주세요.' : null;
  const invalid = message != null || aria['aria-invalid'] === true || aria['aria-invalid'] === 'true';
  const describedBy = [aria['aria-describedby'], helperText != null && `${id}-help`, message != null && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const visible = options.filter(option => !searchable || option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const enabled = visible.filter(option => !option.disabled);
  useFormReset(root, () => { onReset(); setOpen(false); setQuery(''); setActive(null); setAttempted(false); });

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
  React.useEffect(() => {
    if (disabled || readOnly) {
      if (readOnly && open && popupElement.current?.contains(popupElement.current.ownerDocument.activeElement)) trigger.current?.focus();
      setOpen(false); setQuery(''); setActive(null); setAttempted(false);
    }
  }, [disabled, readOnly]);
  const popupReady = popupStrategy !== 'fixed' || popupPosition !== null;
  React.useEffect(() => { if (open && multiple && searchable && popupReady) search.current?.focus(); }, [open, multiple, searchable, popupReady]);
  const openMenu = () => {
    if (disabled || readOnly) return;
    setOpen(true);
    setActive(enabled.find(option => selected.includes(option.value))?.value ?? enabled[0]?.value ?? null);
  };
  const closeMenu = (restoreFocus = false) => { setOpen(false); setQuery(''); if (restoreFocus) (searchable && !multiple ? search : trigger).current?.focus(); };
  const focusInlineControl = () => { if (open && searchable) search.current?.focus(); else trigger.current?.focus(); };
  const openInlineMenu = () => { if (disabled || readOnly) return; focusInlineControl(); if (!open) openMenu(); };
  useEscapeLayer(open, root, () => closeMenu(true));
  const move = (delta: number) => {
    if (!enabled.length) { setActive(null); return; }
    const index = enabled.findIndex(option => option.value === active);
    setActive(enabled[(index < 0 ? (delta > 0 ? 0 : enabled.length - 1) : (index + delta + enabled.length) % enabled.length)].value);
  };
  const selectOption = (value: string) => {
    const option = options.find(item => item.value === value);
    if (readOnly || !option || option.disabled) return;
    onSelect(value);
    if (!multiple) closeMenu(true);
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (readOnly) return;
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
    <label className={`field-label${hideLabel ? ' sr-only' : ''}`} htmlFor={`${id}-trigger`}>{label}</label>
    <div ref={root} className={`custom-select${searchable && !multiple ? ' search-select' : ''}${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}${className ? ` ${className}` : ''}`} data-size={size} data-multiselect={multiple ? '' : undefined} data-readonly={readOnly ? '' : undefined}>
    <select ref={native} className="sr-only" aria-hidden="true" tabIndex={-1} name={name} multiple={multiple} required={required && !readOnly} disabled={disabled} value={multiple ? validSelected : validSelected[0] ?? ''} onChange={() => {}} onInvalid={event => { event.preventDefault(); setAttempted(true); const control = event.currentTarget; const firstInvalid = control.form && Array.from(control.form.elements).find(element => { const candidate = element as HTMLInputElement; return candidate.willValidate && !candidate.validity.valid; }); if (!firstInvalid || firstInvalid === control) (searchable && !multiple ? search : trigger).current?.focus(); }}>
      {!multiple && <option value="">{placeholder}</option>}
      {options.filter(option => option.value !== '').map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
    {searchable && !multiple ? <div className="search-select-control">{prefix}<input id={`${id}-trigger`} ref={search} className="search-select-input" role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} aria-required={required && !readOnly || undefined} aria-readonly={readOnly || undefined} aria-describedby={describedBy} aria-invalid={invalid || aria['aria-invalid']} disabled={disabled} readOnly={readOnly} placeholder={placeholder} value={open ? query : selectedLabels[0] ?? ''} onFocus={() => { setQuery(''); openMenu(); }} onClick={() => { if (!open) openMenu(); }} onChange={event => { const next = event.target.value; setQuery(next); setOpen(true); setActive(options.find(option => !option.disabled && option.label.toLocaleLowerCase().includes(next.toLocaleLowerCase()))?.value ?? null); }} onKeyDown={onKeyDown} /></div>
      : multiple && presentation === 'inline' ? <div className="multi-inline-control" onMouseDown={event => {
          if (!disabled && event.button === 0 && !(event.target as Element).closest('button')) event.preventDefault();
        }} onClick={event => {
          if (disabled || readOnly || (event.target as Element).closest('button')) return;
          openInlineMenu();
        }}>{prefix}<InlineSelectTags label={label} placeholder={placeholder} options={selectedOptions} disabled={disabled} readOnly={readOnly} maxVisibleTags={maxVisibleTags} open={open} listId={listId} onRemove={value => {onSelect(value); focusInlineControl();}} onOpen={openInlineMenu} onFocusControl={focusInlineControl} />{clearable && <button type="button" className="input-action multi-inline-clear" aria-label={`${label} 모두 지우기`} disabled={disabled || readOnly || !selected.length} onClick={onClear}><span className="ui-icon icon-close" aria-hidden="true" /></button>}
        <button id={`${id}-trigger`} ref={trigger} type="button" className="input-action multi-inline-trigger" role="combobox" aria-label={`${label}: ${selectedLabels.join(', ') || placeholder}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} aria-required={required && !readOnly || undefined} aria-readonly={readOnly || undefined} aria-describedby={describedBy} aria-invalid={invalid || aria['aria-invalid']} disabled={disabled} onClick={() => open ? closeMenu() : openMenu()} onKeyDown={onKeyDown}><span className="ui-icon icon-caret" aria-hidden="true" /></button></div>
      : <button id={`${id}-trigger`} ref={trigger} type="button" className="select-trigger" role="combobox" aria-label={`${label}: ${selectedLabels.join(', ') || placeholder}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} aria-required={required && !readOnly || undefined} aria-readonly={readOnly || undefined} aria-describedby={describedBy} aria-invalid={invalid || aria['aria-invalid']} disabled={disabled} onClick={() => open ? closeMenu() : openMenu()} onKeyDown={onKeyDown}><span data-select-label className="select-value-content">{prefix}{!multiple && selectedOptions[0]?.icon && <span className="select-option-icon" aria-hidden="true">{selectedOptions[0].icon}</span>}<span className="select-value-text">{displayValue || placeholder}</span></span><span className="ui-icon icon-caret" aria-hidden="true" /></button>}
    {popup}
    {multiple && presentation !== 'inline' && clearable && <button type="button" className="button button--ghost button-inline multi-clear" disabled={disabled || readOnly || !selected.length} onClick={onClear}>모두 지우기</button>}
    </div>
    {helperText != null && <p id={`${id}-help`} className="component-helper" style={{marginTop:'var(--space-1)'}}>{helperText}</p>}
    {message != null && <p id={`${id}-error`} className="field-error" role={error == null && requiredInvalid ? 'alert' : undefined}>{message}</p>}
  </div>;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {value, defaultValue = '', onValueChange, ...props}, ref,
) {
  const [selected, setSelected, reset] = useValue(value, defaultValue, onValueChange);
  return <SelectCore {...props} buttonRef={ref} selected={selected ? [selected] : []} onSelect={setSelected} onReset={reset} />;
});

export const SearchSelect = React.forwardRef<HTMLInputElement, SelectProps>(function SearchSelect(
  {value, defaultValue = '', onValueChange, ...props}, ref,
) {
  const [selected, setSelected, reset] = useValue(value, defaultValue, onValueChange);
  return <SelectCore {...props} inputRef={ref} searchable selected={selected ? [selected] : []} onSelect={setSelected} onReset={reset} />;
});

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(function MultiSelect(
  {value, defaultValue = [], onValueChange, ...props}, ref,
) {
  const [selected, setSelected, reset] = useValue<readonly string[]>(value, defaultValue, next => onValueChange?.([...next]));
  return <SelectCore {...props} buttonRef={ref} multiple selected={selected} onClear={() => setSelected([])} onSelect={next => setSelected(selected.includes(next) ? selected.filter(item => item !== next) : [...selected, next])} onReset={reset} />;
});
