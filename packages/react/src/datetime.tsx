import * as React from 'react';
import { useEscapeLayer } from './escape-layer';

const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

type Size = 'sm' | 'md' | 'lg';
type BaseField = { label: React.ReactNode; id?: string; name?: string; disabled?: boolean; readOnly?: boolean; required?: boolean; size?: Size; helperText?: React.ReactNode; error?: string; className?: string };

type Parsed = { value?: bigint; error?: string; empty?: boolean; digits?: number };
function parseNumber(text: string, decimals: number, grouping: boolean): Parsed {
  let raw = text.trim();
  if (!raw) return { empty: true };
  if (grouping && raw.includes(',')) {
    if (!/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(raw)) return { error: '천 단위 쉼표 위치를 확인해주세요.' };
    raw = raw.replace(/,/g, '');
  }
  const match = raw.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/);
  if (!match) return { error: '숫자로 입력해주세요.' };
  const fraction = match[3] ?? match[4] ?? '';
  if (fraction.length > decimals) return { error: decimals ? `소수점은 최대 ${decimals}자리까지 입력해주세요.` : '정수만 입력해주세요.' };
  const magnitude = BigInt(match[2] || '0') * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
  return { value: match[1] === '-' ? -magnitude : magnitude, digits: fraction.length };
}
function formatNumber(value: bigint, decimals: number, grouping = false, digits = 0) {
  const absolute = value < 0n ? -value : value;
  const scale = 10n ** BigInt(decimals);
  let integer = String(absolute / scale);
  if (grouping) integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let fraction = decimals ? String(absolute % scale).padStart(decimals, '0').replace(/0+$/, '') : '';
  fraction = fraction.padEnd(Math.min(digits, decimals), '0');
  return `${value < 0n ? '-' : ''}${integer}${fraction ? `.${fraction}` : ''}`;
}
function formatNumberDraft(text: string, decimals: number, grouping: boolean) {
  if (!grouping) return text;
  const parsed = parseNumber(text, decimals, true);
  return parsed.value == null || parsed.error ? text : formatNumber(parsed.value, decimals, true, parsed.digits);
}
// ARIA attributes accept decimal text in the DOM; React's TypeScript types only allow number.
// The type assertion does not convert the string or lose precision at runtime.
function ariaNumber(value: bigint, decimals: number): number { return formatNumber(value, decimals) as unknown as number; }

export interface NumberFieldProps extends BaseField {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  min?: string;
  max?: string;
  step?: string;
  decimals?: number;
  grouping?: boolean;
  unit?: string;
  prefixIcon?: React.ReactNode;
  selectOnFocus?: boolean;
}

export function NumberField({ label, id, name, disabled, readOnly, required, size, helperText, error: externalError, className, value, defaultValue = null, onValueChange, min, max, step = '1', decimals = 0, grouping = false, unit, prefixIcon, selectOnFocus = false }: NumberFieldProps) {
  const uid = React.useId();
  const inputId = id || `number-${uid}`;
  const places = Number.isInteger(decimals) ? Math.max(0, Math.min(6, decimals)) : 0;
  const minParsed = parseNumber(min ?? '', places, false);
  const maxParsed = parseNumber(max ?? '', places, false);
  const stepParsed = parseNumber(step, places, false);
  if (minParsed.error || maxParsed.error || stepParsed.error || !stepParsed.value || stepParsed.value <= 0n || (minParsed.value != null && maxParsed.value != null && minParsed.value > maxParsed.value)) throw new RangeError('유효한 숫자 범위와 step을 지정해주세요.');
  const initial = (value === undefined ? defaultValue : value) ?? '';
  const [draft, setDraft] = React.useState(() => formatNumberDraft(initial, places, grouping));
  const [internalError, setError] = React.useState('');
  const error = externalError || internalError;
  const composing = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const focusPointer = React.useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const previousFormat = React.useRef({ value, places, grouping });
  React.useEffect(() => {
    const previous = previousFormat.current;
    if (value !== undefined && value !== previous.value) {
      setDraft(formatNumberDraft(value ?? '', places, grouping));
      setError('');
    } else if (places !== previous.places || grouping !== previous.grouping) {
      // Preserve the current edit, including exact trailing decimals. A lower precision
      // validates the existing value instead of silently rounding or discarding it.
      setDraft(current => {
        const precision = Math.max(previous.places, places);
        const parsed = parseNumber(current, precision, previous.grouping);
        if (parsed.error || parsed.value == null) return current;
        const formatted = formatNumberDraft(formatNumber(parsed.value, precision, false, parsed.digits), places, grouping);
        return current.trim().endsWith('.') && !formatted.endsWith('.') ? `${formatted}.` : formatted;
      });
      setError('');
    }
    previousFormat.current = { value, places, grouping };
  }, [value, places, grouping]);
  React.useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    let active = true;
    const reset = (event: Event) => { queueMicrotask(() => { if (!active || event.defaultPrevented) return; if (value === undefined) setDraft(formatNumberDraft(defaultValue ?? '', places, grouping)); setError(''); }); };
    form.addEventListener('reset', reset); return () => { active = false; form.removeEventListener('reset', reset); };
  }, [defaultValue, value, places, grouping]);
  const parsed = parseNumber(draft, places, grouping);
  const boundsError = (number: Parsed) => number.value != null && minParsed.value != null && number.value < minParsed.value ? `${formatNumber(minParsed.value, places, grouping)} 이상 입력해주세요.` : number.value != null && maxParsed.value != null && number.value > maxParsed.value ? `${formatNumber(maxParsed.value, places, grouping)} 이하로 입력해주세요.` : '';
  const validate = (number: Parsed) => (required && number.empty ? '값을 입력해주세요.' : number.error || boundsError(number));
  React.useEffect(() => { inputRef.current?.setCustomValidity(externalError || validate(parseNumber(draft, places, grouping)) || ''); }, [draft, places, grouping, min, max, required, externalError]);
  const commit = () => {
    if (composing.current || disabled || readOnly) return;
    const result = parseNumber(draft, places, grouping);
    const message = validate(result) || '';
    setError(message);
    if (message) return;
    const next = result.value == null ? null : formatNumber(result.value, places);
    setDraft(value !== undefined ? formatNumberDraft(value ?? '', places, grouping) : result.value == null ? '' : formatNumber(result.value, places, grouping, result.digits));
    onValueChange?.(next);
  };
  const adjust = (direction: number, multiplier = 1) => {
    if (disabled || readOnly || composing.current) return;
    const result = parseNumber(draft, places, grouping);
    if (result.error) { setError(result.error); return; }
    let next = (result.value ?? 0n) + BigInt(direction * multiplier) * stepParsed.value!;
    if (minParsed.value != null && next < minParsed.value) next = minParsed.value;
    if (maxParsed.value != null && next > maxParsed.value) next = maxParsed.value;
    setDraft(value !== undefined ? formatNumberDraft(value ?? '', places, grouping) : formatNumber(next, places, grouping, result.digits)); setError(''); onValueChange?.(formatNumber(next, places));
  };
  const described = [helperText != null && `${inputId}-help`, unit && `${inputId}-unit`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;
  return <div className={className}>
    <label htmlFor={inputId} className="field-label">{label}</label>
    <div className={`number-field${error ? ' is-invalid' : ''}`} data-size={size}>
      {prefixIcon != null && <span className="number-field-prefix" aria-hidden="true" onClick={() => { if (!disabled) inputRef.current?.focus(); }}>{prefixIcon}</span>}
      <input ref={inputRef} id={inputId} name={name} type="text" role="spinbutton" inputMode={places ? 'decimal' : 'numeric'} className="number-field-input" value={draft} disabled={disabled} readOnly={readOnly} required={required}
        aria-invalid={error ? true : undefined} aria-describedby={described} aria-valuemin={minParsed.value == null ? undefined : ariaNumber(minParsed.value, places)} aria-valuemax={maxParsed.value == null ? undefined : ariaNumber(maxParsed.value, places)} aria-valuenow={parsed.value == null || parsed.error || boundsError(parsed) ? undefined : ariaNumber(parsed.value, places)} aria-valuetext={parsed.value == null || parsed.error || boundsError(parsed) ? undefined : `${formatNumber(parsed.value, places, grouping, parsed.digits)}${unit ? ` ${unit}` : ''}`}
        onChange={event => { setDraft(event.target.value); if (error) setError(''); }} onBlur={() => { focusPointer.current = null; commit(); }} onFocus={event => { if (selectOnFocus && !disabled) event.currentTarget.select(); }}
        onMouseDown={event => { focusPointer.current = event.button === 0 && document.activeElement !== event.currentTarget && selectOnFocus && !disabled ? { x: event.clientX, y: event.clientY, dragged: false } : null; }}
        onMouseMove={event => { const pointer = focusPointer.current; if (pointer && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 3) pointer.dragged = true; }}
        onMouseUp={event => { const pointer = focusPointer.current; focusPointer.current = null; if (pointer && !pointer.dragged && document.activeElement === event.currentTarget && selectOnFocus && !disabled) { event.preventDefault(); event.currentTarget.select(); } }}
        onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
        onKeyDown={event => { if (event.nativeEvent.isComposing) return; const keys: Record<string, [number, number]> = { ArrowUp: [1, 1], ArrowDown: [-1, 1], PageUp: [1, 10], PageDown: [-1, 10] }; if (keys[event.key]) { event.preventDefault(); adjust(...keys[event.key]); } else if (event.key === 'Enter') { event.preventDefault(); commit(); } }} />
      {unit && <span id={`${inputId}-unit`} className="number-field-unit">{unit}</span>}
      <div className="number-field-stepper">
        <button type="button" className="number-field-step" aria-label={`${typeof label === 'string' ? label : '값'} 증가`} aria-controls={inputId} disabled={disabled || readOnly || (parsed.value != null && maxParsed.value != null && parsed.value >= maxParsed.value)} onMouseDown={e => e.preventDefault()} onClick={() => adjust(1)}><span className="ui-icon icon-caret" style={{ transform: 'rotate(180deg)' }} aria-hidden="true" /></button>
        <button type="button" className="number-field-step" aria-label={`${typeof label === 'string' ? label : '값'} 감소`} aria-controls={inputId} disabled={disabled || readOnly || (parsed.value != null && minParsed.value != null && parsed.value <= minParsed.value)} onMouseDown={e => e.preventDefault()} onClick={() => adjust(-1)}><span className="ui-icon icon-caret" aria-hidden="true" /></button>
      </div>
    </div>
    {helperText != null && <p className="number-field-meta" id={`${inputId}-help`}>{helperText}</p>}
    <p className="number-field-feedback is-error" id={`${inputId}-error`} role="status" hidden={!error}>{error}</p>
  </div>;
}

export type DateValue = string | null;
export type DateRangeValue = readonly [DateValue, DateValue];
export interface DatePickerProps extends BaseField { value?: DateValue; defaultValue?: DateValue; onValueChange?: (value: DateValue) => void; min?: string; max?: string }
export interface DateRangePickerProps extends BaseField { value?: DateRangeValue; defaultValue?: DateRangeValue; onValueChange?: (value: DateRangeValue) => void; min?: string; max?: string; startLabel?: string; endLabel?: string }

function makeDate(year: number, month: number, day: number) { const d = new Date(2000, 0, 1, 12); d.setFullYear(year, month, day); return d; }
function dateKey(date: Date) { return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseDate(text: string) {
  const match = text.trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/) || text.trim().match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = makeDate(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
function moveMonth(date: Date, offset: number) {
  const first = makeDate(date.getFullYear(), date.getMonth() + offset, 1);
  if (first.getFullYear() < 1 || first.getFullYear() > 9999) return date;
  return makeDate(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), makeDate(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
}
type DateWidgetProps = BaseField & { range: boolean; values?: DateRangeValue; initial: DateRangeValue; onValuesChange?: (value: DateRangeValue) => void; min?: string; max?: string; startLabel?: string; endLabel?: string };
function DateWidget({ label, id, name, disabled, readOnly, required, size, helperText, error: externalError, className, range, values, initial, onValuesChange, min, max, startLabel = '시작일', endLabel = '종료일' }: DateWidgetProps) {
  const uid = React.useId(), base = id || `date-${uid}`;
  if ((min && (!parseDate(min) || dateKey(parseDate(min)!) !== min)) || (max && (!parseDate(max) || dateKey(parseDate(max)!) !== max)) || (min && max && min > max)) throw new RangeError('유효한 날짜 범위를 YYYY-MM-DD 형식으로 지정해주세요.');
  const clampCursor = (date: Date) => {
    const key = dateKey(date);
    if (min && key < min) return parseDate(min) || date;
    if (max && key > max) return parseDate(max) || date;
    return date;
  };
  const startingValues = values === undefined ? initial : values;
  const [draft, setDraft] = React.useState<[string, string]>([startingValues[0] ?? '', startingValues[1] ?? '']);
  const [internalError, setError] = React.useState('');
  const error = externalError || internalError;
  const [open, setOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState(() => clampCursor(parseDate(startingValues[0] ?? '') || new Date()));
  const [position, setPosition] = React.useState<{ top: number; left: number; maxWidth: number; maxHeight: number } | null>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null), popupRef = React.useRef<HTMLDivElement>(null), triggerRef = React.useRef<HTMLButtonElement>(null);
  const startRef = React.useRef<HTMLInputElement>(null), endRef = React.useRef<HTMLInputElement>(null);
  const previous = React.useRef<DateRangeValue | undefined>(values);
  React.useEffect(() => { setCursor(previousCursor => clampCursor(previousCursor)); }, [min, max]);
  React.useEffect(() => {
    if (values && (values[0] !== previous.current?.[0] || values[1] !== previous.current?.[1])) { setDraft([values[0] ?? '', values[1] ?? '']); setError(''); }
    previous.current = values;
  }, [values?.[0], values?.[1]]);
  React.useEffect(() => { if (disabled || readOnly) setOpen(false); }, [disabled, readOnly]);
  React.useEffect(() => { const form = startRef.current?.form; if (!form) return; let active = true; const reset = (event: Event) => { queueMicrotask(() => { if (!active || event.defaultPrevented) return; if (!values) setDraft([initial[0] ?? '', initial[1] ?? '']); setError(''); setOpen(false); }); }; form.addEventListener('reset', reset); return () => { active = false; form.removeEventListener('reset', reset); }; }, [values?.[0], values?.[1], initial[0], initial[1]]);
  const parsed = draft.map(parseDate);
  const validPair = (pair: [string, string]) => {
    const a = parseDate(pair[0]), b = parseDate(pair[1]);
    if ((pair[0].trim() && !a) || (range && pair[1].trim() && !b)) return '올바른 날짜를 YYYY-MM-DD 형식으로 입력해주세요.';
    if (required && (!a || (range && !b))) return '날짜를 입력해주세요.';
    if (a && b && a > b) return '종료일은 시작일보다 빠를 수 없습니다.';
    if ([a, b].some(d => d && ((min && dateKey(d) < min) || (max && dateKey(d) > max)))) return '허용된 날짜 범위를 확인해주세요.';
    return '';
  };
  React.useEffect(() => { const message = externalError || validPair(draft); startRef.current?.setCustomValidity(message); if (range) endRef.current?.setCustomValidity(message); }, [draft[0], draft[1], range, required, min, max, externalError]);
  const normalized = (pair: [string, string]): DateRangeValue => [parseDate(pair[0]) ? dateKey(parseDate(pair[0])!) : null, range && parseDate(pair[1]) ? dateKey(parseDate(pair[1])!) : null];
  const publish = (pair: [string, string], allowIncomplete = false) => {
    const problem = validPair(pair);
    if (problem && !(allowIncomplete && problem === '날짜를 입력해주세요.')) { setError(problem); return false; }
    const next = normalized(pair); setError('');
    setDraft(values ? [values[0] ?? '', values[1] ?? ''] : [next[0] ?? '', next[1] ?? '']);
    onValuesChange?.(next); return true;
  };
  const close = (restore = false) => { setOpen(false); setPreview(null); if (restore) triggerRef.current?.focus(); };
  useEscapeLayer(open, pickerRef, () => close(true));
  useClientLayoutEffect(() => {
    if (!open) { setPosition(null); return; }
    const layer = popupRef.current;
    let shownAsPopover = false;
    // A manual popover stays in the existing DOM tree (including inside a
    // native dialog) while escaping overflow and transformed ancestors.
    if (layer && typeof layer.showPopover === 'function') {
      try { layer.showPopover(); shownAsPopover = true; } catch { layer.removeAttribute('popover'); }
    }
    const update = () => {
      const picker = pickerRef.current, anchor = picker?.getBoundingClientRect(), popup = popupRef.current;
      if (!picker || !anchor || !popup) return;
      const edge = 12, gap = 6, width = document.documentElement.clientWidth, height = window.innerHeight;
      let leftEdge = edge, rightEdge = width - edge;
      // Keep the popup within the available width of a scroll container, while
      // positioning it outside that container's vertical clipping area.
      for (let parent = picker.parentElement; parent; parent = parent.parentElement) {
        const style = window.getComputedStyle(parent);
        if (!/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) continue;
        const rect = parent.getBoundingClientRect();
        if (anchor.bottom <= rect.top || anchor.top >= rect.bottom || anchor.right <= rect.left || anchor.left >= rect.right) { setOpen(false); return; }
        leftEdge = Math.max(leftEdge, rect.left + parent.clientLeft);
        rightEdge = Math.min(rightEdge, rect.left + parent.clientLeft + parent.clientWidth);
      }
      if (anchor.bottom <= edge || anchor.top >= height - edge || anchor.right <= edge || anchor.left >= width - edge) { setOpen(false); return; }
      const below = Math.max(0, height - anchor.bottom - gap - edge), above = Math.max(0, anchor.top - gap - edge);
      const up = popup.scrollHeight > below && above > below;
      const maxHeight = up ? above : below, maxWidth = Math.max(0, rightEdge - leftEdge);
      const popupWidth = Math.min(popup.offsetWidth, maxWidth);
      const next = { top: up ? anchor.top - gap - Math.min(popup.scrollHeight, maxHeight) : anchor.bottom + gap, left: Math.max(leftEdge, Math.min(anchor.left, rightEdge - popupWidth)), maxHeight, maxWidth };
      setPosition(previous => previous && previous.top === next.top && previous.left === next.left && previous.maxHeight === next.maxHeight && previous.maxWidth === next.maxWidth ? previous : next);
    };
    const outside = (event: MouseEvent) => { if (!pickerRef.current?.contains(event.target as Node)) setOpen(false); };
    update(); window.addEventListener('resize', update); window.addEventListener('scroll', update, true); document.addEventListener('mousedown', outside);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (popupRef.current) observer?.observe(popupRef.current);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); document.removeEventListener('mousedown', outside); observer?.disconnect(); if (shownAsPopover && layer?.isConnected && layer.matches(':popover-open')) layer.hidePopover(); };
  }, [open, cursor.getFullYear(), cursor.getMonth()]);
  const positioned = position !== null;
  useClientLayoutEffect(() => { if (open && positioned) popupRef.current?.querySelector<HTMLButtonElement>('.calendar-day[tabindex="0"]')?.focus(); }, [open, cursor, positioned]);
  const choose = (date: Date) => {
    const key = dateKey(date); if ((min && key < min) || (max && key > max)) return;
    if (!range) { publish([key, '']); close(true); return; }
    const start = parseDate(draft[0]);
    if (!start || parsed[1]) { publish([key, ''], true); setCursor(date); }
    else { const old = dateKey(start); publish(key < old ? [key, old] : [old, key]); close(true); }
  };
  const dayKey = (event: React.KeyboardEvent, day: Date) => {
    let next: Date | null = null;
    if (event.key === 'ArrowLeft') next = makeDate(day.getFullYear(), day.getMonth(), day.getDate() - 1);
    if (event.key === 'ArrowRight') next = makeDate(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    if (event.key === 'ArrowUp') next = makeDate(day.getFullYear(), day.getMonth(), day.getDate() - 7);
    if (event.key === 'ArrowDown') next = makeDate(day.getFullYear(), day.getMonth(), day.getDate() + 7);
    if (event.key === 'Home') next = makeDate(day.getFullYear(), day.getMonth(), day.getDate() - day.getDay());
    if (event.key === 'End') next = makeDate(day.getFullYear(), day.getMonth(), day.getDate() + 6 - day.getDay());
    if (event.key === 'PageUp') next = moveMonth(day, event.shiftKey ? -12 : -1);
    if (event.key === 'PageDown') next = moveMonth(day, event.shiftKey ? 12 : 1);
    if (next && next.getFullYear() >= 1 && next.getFullYear() <= 9999) { event.preventDefault(); setCursor(clampCursor(next)); }
  };
  const year = cursor.getFullYear(), month = cursor.getMonth(), offset = makeDate(year, month, 1).getDay(), days = makeDate(year, month + 1, 0).getDate();
  const cells = Math.ceil((offset + days) / 7) * 7;
  const previewStart = range && parsed[0] && !parsed[1] && preview && preview !== dateKey(parsed[0]) ? dateKey(parsed[0]) : null;
  const previewFirst = previewStart && preview ? [previewStart, preview].sort()[0] : null;
  const previewLast = previewStart && preview ? [previewStart, preview].sort()[1] : null;
  const described = [helperText != null && `${base}-help`, error && `${base}-error`].filter(Boolean).join(' ') || undefined;
  const input = (index: 0 | 1) => <input ref={index ? endRef : startRef} id={range ? `${base}-${index ? 'end' : 'start'}` : base} className={`date-text${range ? ' date-range-input' : ''}`} type="text" inputMode="numeric" placeholder="YYYY-MM-DD" name={name ? range ? `${name}-${index ? 'end' : 'start'}` : name : undefined} value={draft[index]} disabled={disabled} readOnly={readOnly} required={required} aria-invalid={!!error || undefined} aria-describedby={described} onChange={event => { const next: [string, string] = [...draft]; next[index] = event.target.value; setDraft(next); if (error) setError(''); }} onBlur={() => publish(draft)} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); publish(draft); } }} />;
  const trigger = <button ref={triggerRef} className="date-trigger" type="button" disabled={disabled || readOnly} aria-label="달력 열기" aria-haspopup="dialog" aria-expanded={open} aria-controls={`${base}-calendar`} onClick={() => { if (open) close(true); else { setCursor(clampCursor(parsed[0] || parsed[1] || new Date())); setOpen(true); } }}><span className="ui-icon icon-calendar" aria-hidden="true" /></button>;
  return <div className={className} data-size={size}>
    {range ? <span className="field-label" id={`${base}-label`}>{label}</span> : <label className="field-label" htmlFor={base}>{label}</label>}
    <div className="date-picker" ref={pickerRef}>
      {range ? <div className={`date-range-fields${error ? ' has-error' : ''}`} role="group" aria-labelledby={`${base}-label`}><label className="sr-only" htmlFor={`${base}-start`}>{startLabel}</label>{input(0)}<span className="date-range-separator" aria-hidden="true">–</span><label className="sr-only" htmlFor={`${base}-end`}>{endLabel}</label>{input(1)}{trigger}</div> : <div className={`date-field${error ? ' has-error' : ''}`}>{input(0)}{trigger}</div>}
      {open && <div className="date-popup" ref={popupRef} id={`${base}-calendar`} role="dialog" popover="manual" aria-label={range ? '기간 선택 달력' : '날짜 선택 달력'} style={{ position: 'fixed', margin: 0, top: position?.top ?? 0, bottom: 'auto', left: position?.left ?? 0, right: 'auto', maxWidth: position?.maxWidth, maxHeight: position?.maxHeight, visibility: position ? 'visible' : 'hidden' }}>
        {range && <p className="calendar-instruction">{parsed[0] && !parsed[1] ? '종료일을 선택하세요.' : '시작일을 선택하세요.'}</p>}
        <div className="calendar-header"><button type="button" className="calendar-nav" aria-label="이전 달" onClick={() => setCursor(clampCursor(moveMonth(cursor, -1)))}><span className="ui-icon icon-caret" style={{ transform: 'rotate(90deg)' }} aria-hidden="true" /></button><strong id={`${base}-month`} aria-live="polite">{year}년 {month + 1}월</strong><button type="button" className="calendar-nav" aria-label="다음 달" onClick={() => setCursor(clampCursor(moveMonth(cursor, 1)))}><span className="ui-icon icon-caret" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true" /></button></div>
        <div className="calendar-weekdays" aria-hidden="true">{'일월화수목금토'.split('').map(day => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid" role="grid" aria-labelledby={`${base}-month`} aria-multiselectable={range || undefined} onPointerLeave={() => setPreview(null)}>
          {Array.from({ length: cells / 7 }, (_, row) => <div className="calendar-row" role="row" key={row}>
            {Array.from({ length: 7 }, (_, col) => {
              const n = row * 7 + col - offset + 1;
              if (n < 1 || n > days) return <div role="gridcell" aria-hidden="true" key={col} />;
              const d = makeDate(year, month, n), key = dateKey(d);
              const selected = !!parsed[0] && dateKey(parsed[0]) === key || !!parsed[1] && dateKey(parsed[1]) === key;
              const within = !!parsed[0] && !!parsed[1] && dateKey(parsed[0]) < key && key < dateKey(parsed[1]);
              const previewWithin = !!previewFirst && !!previewLast && key > previewFirst && key < previewLast;
              const previewEnd = !!previewStart && key === preview;
              const today = key === dateKey(new Date());
              return <div role="gridcell" aria-selected={selected || within} key={col}><button type="button"
                className={`calendar-day${within ? ' is-in-range' : ''}${previewWithin ? ' is-preview-range' : ''}${previewEnd ? ' is-preview-end' : ''}${today ? ' is-today' : ''}`}
                aria-label={`${year}년 ${month + 1}월 ${n}일`} aria-current={today ? 'date' : undefined} aria-pressed={selected}
                tabIndex={key === dateKey(cursor) ? 0 : -1} disabled={!!((min && key < min) || (max && key > max))}
                onPointerEnter={() => setPreview(key)} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setPreview(key); }}
                onClick={() => choose(d)} onKeyDown={event => dayKey(event, d)}>{n}</button></div>;
            })}
          </div>)}
        </div>
        <div className="calendar-footer">{range && <span className="calendar-range-summary">{previewFirst && previewLast ? `${previewFirst} – ${previewLast} (미리보기)` : draft[0] && draft[1] ? `${draft[0]} – ${draft[1]}` : draft[0] ? `${draft[0]}부터` : '기간을 선택해주세요.'}</span>}<button type="button" className="button button--ghost button-inline" onClick={() => { publish(['', ''], true); close(true); }}>지우기</button>{!range && <button type="button" className="button button--ghost button-inline" onClick={() => choose(new Date())}>오늘</button>}</div>
      </div>}
    </div>
    {helperText != null && <p className="component-helper date-help" id={`${base}-help`}>{helperText}</p>}
    <p className="field-error date-field-error" id={`${base}-error`} role="status" hidden={!error}>{error}</p>
  </div>;
}
export function DatePicker({ value, defaultValue = null, onValueChange, ...props }: DatePickerProps) {
  return <DateWidget {...props} range={false} values={value === undefined ? undefined : [value, null]} initial={[defaultValue, null]} onValuesChange={pair => onValueChange?.(pair[0])} />;
}
export function DateRangePicker({ value, defaultValue = [null, null], onValueChange, ...props }: DateRangePickerProps) {
  return <DateWidget {...props} range values={value} initial={defaultValue} onValuesChange={onValueChange} />;
}
