import * as React from 'react';
import { useEscapeLayer } from '../../shared/escape-layer';

export type DateTimeValue = string | null;
export type DateTimeRangeValue = readonly [DateTimeValue, DateTimeValue];
type Pair = [string, string];
type Endpoint = 0 | 1;
type BaseProps = {
  label: React.ReactNode; id?: string; name?: string; size?: 'sm' | 'md' | 'lg';
  disabled?: boolean; readOnly?: boolean; required?: boolean; helperText?: React.ReactNode;
  error?: string; className?: string; min?: string; max?: string; minuteStep?: number; showSeconds?: boolean; secondStep?: number;
  'aria-describedby'?: string; 'aria-invalid'?: React.AriaAttributes['aria-invalid'];
};
export interface DateTimePickerProps extends BaseProps {
  value?: DateTimeValue; defaultValue?: DateTimeValue; onValueChange?: (value: DateTimeValue) => void;
}
export interface DateTimeRangePickerProps extends BaseProps {
  value?: DateTimeRangeValue; defaultValue?: DateTimeRangeValue; onValueChange?: (value: DateTimeRangeValue) => void;
  startLabel?: string; endLabel?: string;
  /** Ref to the end input; the standard ref points to the start input. */
  endInputRef?: React.Ref<HTMLInputElement>;
}

const pad = (number: number) => String(number).padStart(2, '0');
function makeDay(year: number, month: number, day: number) {
  const result = new Date(2000, 0, 1, 12);
  result.setFullYear(year, month, day);
  return result;
}
const dayKey = (date: Date) => `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const makeTimeKey = (date: Date, hour: number, minute: number, second: number, showSeconds: boolean) => `${dayKey(date)}T${pad(hour)}:${pad(minute)}${showSeconds ? `:${pad(second)}` : ''}`;
const comparable = (key: string) => key.length === 16 ? `${key}:00` : key;
function parseDateTime(text: string, showSeconds: boolean) {
  const value = text.trim();
  const match = value.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    || value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/);
  if (!match || (!showSeconds && match[6] !== undefined)) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]), hour = Number(match[4]), minute = Number(match[5]), second = Number(match[6] ?? 0);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const date = makeDay(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { date, hour, minute, second, day: dayKey(date), key: makeTimeKey(date, hour, minute, second, showSeconds) };
}
function moveMonth(date: Date, offset: number) {
  const first = makeDay(date.getFullYear(), date.getMonth() + offset, 1);
  if (first.getFullYear() < 1 || first.getFullYear() > 9999) return date;
  return makeDay(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), makeDay(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
}

type WidgetProps = BaseProps & {
  range: boolean; values?: DateTimeRangeValue; initial: DateTimeRangeValue;
  onValuesChange?: (values: DateTimeRangeValue) => void; startLabel?: string; endLabel?: string;
  inputRef?: React.Ref<HTMLInputElement>; endInputRef?: React.Ref<HTMLInputElement>;
};

function DateTimeWidget({ label, id, name, size, disabled, readOnly, required, helperText, error: externalError, className, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid,
  min, max, minuteStep = 1, showSeconds = false, secondStep = 1, range, values, initial, onValuesChange, startLabel = '시작 일시', endLabel = '종료 일시', inputRef, endInputRef }: WidgetProps) {
  if (!Number.isInteger(minuteStep) || minuteStep < 1 || minuteStep > 60 || 60 % minuteStep !== 0) throw new RangeError('minuteStep은 60을 나누어떨어지게 하는 양의 정수여야 합니다.');
  if (!Number.isInteger(secondStep) || secondStep < 1 || secondStep > 60 || 60 % secondStep !== 0) throw new RangeError('secondStep은 60을 나누어떨어지게 하는 양의 정수여야 합니다.');
  const timeKey = (date: Date, hour: number, minute: number, second = 0) => makeTimeKey(date, hour, minute, second, showSeconds);
  const parse = (text: string) => parseDateTime(text, showSeconds);
  const display = (value: DateTimeValue) => value ? parse(value)?.key.replace('T', ' ') ?? value : '';
  const toDraft = (values: DateTimeRangeValue): Pair => [display(values[0]), display(values[1])];
  const toSelection = (values: Pair): Pair => [parse(values[0])?.key ?? '', parse(values[1])?.key ?? ''];
  const summary = (value: string, empty: string) => {
    const parsed = parse(value);
    return parsed ? `${parsed.day.replace(/-/g, '.')} (${'일월화수목금토'[parsed.date.getDay()]}) ${pad(parsed.hour)}:${pad(parsed.minute)}${showSeconds ? `:${pad(parsed.second)}` : ''}` : empty;
  };
  const minimum = min ? parse(min) : null, maximum = max ? parse(max) : null;
  if ((min && (!minimum || comparable(minimum.key) !== comparable(min))) || (max && (!maximum || comparable(maximum.key) !== comparable(max))) || (min && max && comparable(min) > comparable(max))) throw new RangeError('유효한 날짜·시간 범위를 YYYY-MM-DDTHH:mm[:ss] 형식으로 지정해주세요.');

  const uid = React.useId(), base = id || `datetime-${uid}`;
  const controlled = values !== undefined;
  const [draft, setDraft] = React.useState<Pair>(() => toDraft(values ?? initial));
  const canonical = (pair: DateTimeRangeValue | Pair): DateTimeRangeValue => [parse(pair[0] ?? '')?.key ?? null, range ? parse(pair[1] ?? '')?.key ?? null : null];
  const [submitted, setSubmitted] = React.useState<DateTimeRangeValue>(() => canonical(values ?? initial));
  const [panel, setPanel] = React.useState<Pair>(() => toSelection(toDraft(values ?? initial)));
  const [internalError, setError] = React.useState('');
  const [selectionError, setSelectionError] = React.useState('');
  const error = externalError || internalError;
  const invalid = !!error || ariaInvalid === true || ariaInvalid === 'true';
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Endpoint>(0);
  const [preview, setPreview] = React.useState<string | null>(null);
  const clampDay = (date: Date) => {
    const key = dayKey(date);
    if (minimum && key < minimum.day) return minimum.date;
    if (maximum && key > maximum.day) return maximum.date;
    return date;
  };
  const [cursor, setCursor] = React.useState(() => clampDay(parse((values ?? initial)[0] ?? '')?.date ?? new Date()));
  const [position, setPosition] = React.useState({ top: 'calc(100% + 6px)', bottom: 'auto', left: 0, maxHeight: 600, maxWidth: 560 });
  const pickerRef = React.useRef<HTMLDivElement>(null), popupRef = React.useRef<HTMLDivElement>(null), triggerRef = React.useRef<HTMLButtonElement>(null);
  const startRef = React.useRef<HTMLInputElement>(null), endRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(inputRef, () => startRef.current!);
  React.useImperativeHandle(endInputRef, () => endRef.current!);
  const composing = React.useRef(false);
  const previous = React.useRef(values);
  const previousControlled = React.useRef(controlled);

  const validateEndpoint = (value: string, mustSelect = false) => {
    const parsed = parse(value);
    if (value.trim() && !parsed) return `올바른 날짜와 시간을 ${showSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm'} 형식으로 입력해주세요.`;
    if (mustSelect && !parsed) return '날짜와 시간을 입력해주세요.';
    if (parsed && parsed.minute % minuteStep !== 0) return `분은 ${minuteStep}분 단위로 입력해주세요.`;
    if (parsed && showSeconds && parsed.second % secondStep !== 0) return `초는 ${secondStep}초 단위로 입력해주세요.`;
    if (parsed && ((min && comparable(parsed.key) < comparable(min)) || (max && comparable(parsed.key) > comparable(max)))) return '허용된 날짜와 시간 범위를 확인해주세요.';
    return '';
  };
  const validate = (pair: Pair, mustSelect = false) => {
    const parsed = [parse(pair[0]), range ? parse(pair[1]) : null];
    if ((pair[0].trim() && !parsed[0]) || (range && pair[1].trim() && !parsed[1])) return `올바른 날짜와 시간을 ${showSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm'} 형식으로 입력해주세요.`;
    if ((required || mustSelect) && (!parsed[0] || (range && !parsed[1]))) return '날짜와 시간을 입력해주세요.';
    if (range && Boolean(parsed[0]) !== Boolean(parsed[1])) return '시작 일시와 종료 일시를 모두 입력해주세요.';
    if (parsed.some(value => value && value.minute % minuteStep !== 0)) return `분은 ${minuteStep}분 단위로 입력해주세요.`;
    if (showSeconds && parsed.some(value => value && value.second % secondStep !== 0)) return `초는 ${secondStep}초 단위로 입력해주세요.`;
    if (parsed.some(value => value && ((min && comparable(value.key) < comparable(min)) || (max && comparable(value.key) > comparable(max))))) return '허용된 날짜와 시간 범위를 확인해주세요.';
    if (range && parsed[0] && parsed[1] && comparable(parsed[0].key) > comparable(parsed[1].key)) return '종료 일시는 시작 일시보다 빠를 수 없습니다.';
    return '';
  };
  const close = (restore = false) => {
    setOpen(false); setSelectionError(''); setPreview(null);
    if (restore) triggerRef.current?.focus();
  };
  useEscapeLayer(open, pickerRef, () => close(true));

  React.useEffect(() => {
    if (controlled && (!previousControlled.current || values?.[0] !== previous.current?.[0] || values?.[1] !== previous.current?.[1])) {
      setDraft(toDraft(values!)); setSubmitted(canonical(values!)); setError(''); setSelectionError(''); setOpen(false);
    }
    previous.current = values; previousControlled.current = controlled;
  }, [controlled, values?.[0], values?.[1]]);
  React.useEffect(() => { setCursor(date => clampDay(date)); }, [min, max]);
  React.useEffect(() => { if (disabled || readOnly) close(); }, [disabled, readOnly]);
  React.useEffect(() => {
    const message = externalError || validate(draft);
    startRef.current?.setCustomValidity(message); endRef.current?.setCustomValidity(message);
  }, [draft[0], draft[1], required, range, minuteStep, showSeconds, secondStep, min, max, externalError]);
  React.useEffect(() => {
    const form = startRef.current?.form;
    if (!form) return;
    let mounted = true;
    const reset = (event: Event) => queueMicrotask(() => {
      if (!mounted || event.defaultPrevented) return;
      setDraft(toDraft(values ?? initial)); setSubmitted(canonical(values ?? initial)); setError(''); setSelectionError(''); setOpen(false); setPreview(null);
    });
    form.addEventListener('reset', reset);
    return () => { mounted = false; form.removeEventListener('reset', reset); };
  }, [controlled, values?.[0], values?.[1], initial[0], initial[1]]);

  const publish = (pair: Pair) => {
    if (disabled || readOnly || composing.current) return false;
    const message = validate(pair);
    if (message) { setError(message); return false; }
    const next: DateTimeRangeValue = [parse(pair[0])?.key ?? null, range ? parse(pair[1])?.key ?? null : null];
    setDraft(toDraft(values ?? next)); setSubmitted(canonical(values ?? next)); setError('');
    if (next[0] !== submitted[0] || next[1] !== submitted[1]) onValuesChange?.(next);
    return true;
  };
  const openPanel = (endpoint: Endpoint = 0) => {
    if (disabled || readOnly || composing.current) return;
    const next = toSelection(draft);
    const startIssue = range && endpoint === 1 ? validateEndpoint(draft[0], true) : '';
    const step: Endpoint = range && endpoint === 1 && !startIssue ? 1 : 0;
    setPanel(next); setActive(step); setSelectionError(startIssue); setPreview(null);
    const issue = validate(draft);
    if (issue && draft.some(value => value.trim())) setError(issue);
    setCursor(clampDay(parse(next[step])?.date ?? parse(next[step ? 0 : 1])?.date ?? new Date()));
    setOpen(true);
  };
  React.useEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = pickerRef.current?.getBoundingClientRect(), popup = popupRef.current;
      if (!anchor || !popup) return;
      const edge = 12, gap = 6, width = document.documentElement.clientWidth, height = window.innerHeight;
      if (anchor.bottom <= edge || anchor.top >= height - edge || anchor.right <= edge || anchor.left >= width - edge) { close(); return; }
      const below = Math.max(0, height - anchor.bottom - gap - edge), above = Math.max(0, anchor.top - gap - edge);
      const up = popup.scrollHeight > below && above > below;
      setPosition({ top: up ? 'auto' : 'calc(100% + 6px)', bottom: up ? 'calc(100% + 6px)' : 'auto', left: Math.max(edge, Math.min(anchor.left, width - popup.offsetWidth - edge)) - anchor.left, maxHeight: up ? above : below, maxWidth: Math.max(0, width - edge * 2) });
    };
    const outside = (event: MouseEvent) => { if (!pickerRef.current?.contains(event.target as Node)) close(); };
    update(); window.addEventListener('resize', update); window.addEventListener('scroll', update, true); document.addEventListener('mousedown', outside);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (popupRef.current) observer?.observe(popupRef.current);
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); document.removeEventListener('mousedown', outside); };
  }, [open, cursor.getFullYear(), cursor.getMonth(), range]);
  const cursorKey = dayKey(cursor);
  React.useEffect(() => { if (open) popupRef.current?.querySelector<HTMLButtonElement>('.calendar-day[tabindex="0"]:not(:disabled)')?.focus(); }, [open, cursorKey, active]);

  const minutes = Array.from({ length: 60 / minuteStep }, (_, index) => index * minuteStep);
  const seconds = Array.from({ length: 60 / secondStep }, (_, index) => index * secondStep);
  const allowed = (key: string) => !((min && comparable(key) < comparable(min)) || (max && comparable(key) > comparable(max)));
  const selected = parse(panel[active]);
  const startSelection = range && active === 1 ? parse(panel[0]) : null;
  const selectionDay = selected?.date ?? cursor;
  const preferredHour = selected?.hour ?? startSelection?.hour ?? 0, preferredMinute = selected?.minute ?? startSelection?.minute ?? 0, preferredSecond = selected?.second ?? startSelection?.second ?? 0;
  // Each minute contributes at most one candidate, avoiding 86,400 entries per day.
  const minuteCandidate = (day: Date, hour: number, minute: number, preferred: number) => {
    const base = `${dayKey(day)}T${pad(hour)}:${pad(minute)}`;
    const low = min && comparable(min).slice(0, 16) === base ? Number(comparable(min).slice(17, 19)) : 0;
    const high = max && comparable(max).slice(0, 16) === base ? Number(comparable(max).slice(17, 19)) : 59;
    const first = showSeconds ? Math.ceil(low / secondStep) * secondStep : 0;
    const last = showSeconds ? Math.floor(high / secondStep) * secondStep : 0;
    const second = Math.max(first, Math.min(last, Math.ceil(preferred / secondStep) * secondStep));
    const key = timeKey(day, hour, minute, second);
    return first <= last && allowed(key) ? key : null;
  };
  const dayTimes = (day: Date) => {
    const date = dayKey(day);
    if ((minimum && date < minimum.day) || (maximum && date > maximum.day)) return [];
    return Array.from({ length: 24 }, (_, hour) => minutes.map(minute => minuteCandidate(day, hour, minute, preferredSecond))).flat().filter((key): key is string => key !== null);
  };
  const available = dayTimes(selectionDay);
  const availableHours = Array.from({ length: 24 }, (_, index) => index).filter(hour => available.some(value => Number(value.slice(11, 13)) === hour));
  const availableMinutes = minutes.filter(minute => minuteCandidate(selectionDay, preferredHour, minute, preferredSecond) !== null);
  const availableSeconds = seconds.filter(second => allowed(timeKey(selectionDay, preferredHour, preferredMinute, second)));
  const updatePanel = (key: string) => {
    const next: Pair = [...panel]; next[active] = key; setPanel(next); setPreview(null);
    if (selectionError) setSelectionError(range && active === 0 ? validateEndpoint(next[0], true) : validate(next, true));
  };
  const chooseDay = (day: Date) => {
    const candidates = dayTimes(day);
    if (!candidates.length) return;
    const preferred = comparable(timeKey(day, preferredHour, preferredMinute, preferredSecond));
    updatePanel(candidates.find(key => comparable(key) >= preferred) ?? candidates[candidates.length - 1]);
    setCursor(day);
  };
  const chooseTime = (kind: 'hour' | 'minute' | 'second', number: number) => {
    if (kind === 'second') {
      const key = timeKey(selectionDay, preferredHour, preferredMinute, number);
      if (allowed(key)) updatePanel(key);
    } else if (kind === 'minute') {
      const key = minuteCandidate(selectionDay, preferredHour, number, preferredSecond);
      if (key) updatePanel(key);
    } else {
      const candidates = available.filter(key => Number(key.slice(11, 13)) === number);
      if (candidates.length) {
        const preferred = comparable(timeKey(selectionDay, number, preferredMinute, preferredSecond));
        updatePanel(candidates.find(key => comparable(key) >= preferred) ?? candidates[candidates.length - 1]);
      }
    }
  };
  React.useEffect(() => {
    if (!open) return;
    popupRef.current?.querySelectorAll<HTMLButtonElement>('.datetime-time-option[aria-selected="true"]').forEach(option => {
      const list = option.parentElement;
      if (!list) return;
      const rowHeight = option.offsetHeight;
      const rowsBefore = rowHeight ? Math.max(0, Math.floor((list.clientHeight / rowHeight - 1) / 2)) : 0;
      list.scrollTop += option.getBoundingClientRect().top - list.getBoundingClientRect().top - rowHeight * rowsBefore;
    });
  }, [open, active, panel[active], minuteStep, showSeconds, secondStep]);

  const dayKeyboard = (event: React.KeyboardEvent, date: Date) => {
    let next: Date | null = null;
    if (event.key === 'ArrowLeft') next = makeDay(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    if (event.key === 'ArrowRight') next = makeDay(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    if (event.key === 'ArrowUp') next = makeDay(date.getFullYear(), date.getMonth(), date.getDate() - 7);
    if (event.key === 'ArrowDown') next = makeDay(date.getFullYear(), date.getMonth(), date.getDate() + 7);
    if (event.key === 'Home') next = makeDay(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    if (event.key === 'End') next = makeDay(date.getFullYear(), date.getMonth(), date.getDate() + 6 - date.getDay());
    if (event.key === 'PageUp') next = moveMonth(date, event.shiftKey ? -12 : -1);
    if (event.key === 'PageDown') next = moveMonth(date, event.shiftKey ? 12 : 1);
    if (next && next.getFullYear() >= 1 && next.getFullYear() <= 9999) { event.preventDefault(); setCursor(clampDay(next)); }
  };
  const timeKeyboard = (event: React.KeyboardEvent, kind: 'hour' | 'minute' | 'second', current: number) => {
    const choices = kind === 'hour' ? availableHours : kind === 'minute' ? availableMinutes : availableSeconds;
    if (!choices.length || !['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return;
    event.preventDefault();
    const index = Math.max(0, choices.indexOf(current));
    const offset = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : event.key === 'PageUp' ? -5 : 5;
    const next = choices[event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : Math.max(0, Math.min(choices.length - 1, index + offset))];
    chooseTime(kind, next);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-time-value="${next}"]`)?.focus();
  };
  const switchEndpoint = (endpoint: Endpoint) => {
    if (range && endpoint === 1) {
      const issue = validateEndpoint(panel[0], true);
      if (issue) { setSelectionError(issue); return; }
    }
    setActive(endpoint); setPreview(null);
    setSelectionError('');
    setCursor(clampDay(parse(panel[endpoint])?.date ?? cursor));
  };
  const confirm = () => {
    const message = validate(panel, true);
    if (message) { setSelectionError(message); return; }
    if (publish(panel)) close(true);
  };

  const described = [describedBy, helperText != null && `${base}-help`, error && `${base}-error`].filter(Boolean).join(' ') || undefined;
  const input = (endpoint: Endpoint) => <input ref={endpoint ? endRef : startRef} id={range ? `${base}-${endpoint ? 'end' : 'start'}` : base}
    className={`date-text datetime-input${range ? ' date-range-input datetime-range-input' : ''}`} type="text" inputMode="numeric" autoComplete="off" placeholder={showSeconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm'}
    value={draft[endpoint]} disabled={disabled} readOnly={readOnly} required={required} aria-invalid={invalid || ariaInvalid} aria-describedby={described}
    onChange={event => { const next: Pair = [...draft]; next[endpoint] = event.target.value; setDraft(next); if (internalError) setError(''); }}
    onFocus={() => { if (open) close(); setActive(endpoint); }} onBlur={event => { const target = event.relatedTarget; if (!open && !(target && (target === startRef.current || target === endRef.current))) publish(draft); }}
    onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
    onInvalid={() => setError(externalError || validate(draft))}
    onKeyDown={event => { if (event.nativeEvent.isComposing) return; if (event.altKey && event.key === 'ArrowDown') { event.preventDefault(); openPanel(endpoint); } else if (event.key === 'Enter') { event.preventDefault(); if (!open) publish(draft); } }} />;
  const trigger = <button ref={triggerRef} className="date-trigger" type="button" disabled={disabled || readOnly} aria-label={range ? '기간 및 시간 선택 열기' : '날짜 및 시간 선택 열기'} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${base}-popup`} onClick={() => open ? close(true) : openPanel()}><span className="ui-icon icon-calendar" aria-hidden="true" /></button>;
  const year = cursor.getFullYear(), month = cursor.getMonth(), offset = makeDay(year, month, 1).getDay(), count = makeDay(year, month + 1, 0).getDate();
  const rows = Math.ceil((offset + count) / 7);
  const first = parse(panel[0])?.day, last = range ? parse(panel[1])?.day : undefined;
  const previewAnchor = range && active === 1 ? first : undefined;
  const previewBounds = preview && previewAnchor ? [previewAnchor, preview].sort() : null;

  return <div className={className} data-size={size}>
    {range ? <span className="field-label" id={`${base}-label`}>{label}</span> : <label className="field-label" htmlFor={base}>{label}</label>}
    <div className="date-picker datetime-picker" ref={pickerRef} onBlur={event => { if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) queueMicrotask(() => { const picker = pickerRef.current; if (picker && !picker.contains(picker.ownerDocument.activeElement)) close(); }); }}>
      {range ? <div className={`date-range-fields datetime-range-fields${invalid ? ' has-error' : ''}`} role="group" aria-labelledby={`${base}-label`}>
        <label className="sr-only" htmlFor={`${base}-start`}>{startLabel}</label>{input(0)}<span className="date-range-separator" aria-hidden="true">–</span><label className="sr-only" htmlFor={`${base}-end`}>{endLabel}</label>{input(1)}{trigger}
      </div> : <div className={`date-field datetime-field${invalid ? ' has-error' : ''}`}>{input(0)}{trigger}</div>}
      {name && <input type="hidden" name={range ? `${name}-start` : name} value={submitted[0] ?? ''} disabled={disabled} />}
      {name && range && <input type="hidden" name={`${name}-end`} value={submitted[1] ?? ''} disabled={disabled} />}
      {/* Keep native scrollbar and panel-background clicks focused inside the popup. */}
      {open && <div className="date-popup datetime-popup" ref={popupRef} id={`${base}-popup`} role="dialog" tabIndex={-1} aria-label={range ? '기간 및 시간 선택' : '날짜 및 시간 선택'} style={position}>
        {range && <div className="datetime-range-tabs" role="group" aria-label="수정할 일시">
          {([0, 1] as const).map(endpoint => <button key={endpoint} type="button" className="datetime-range-tab" aria-label={endpoint ? endLabel : startLabel} aria-current={active === endpoint ? 'step' : undefined} aria-pressed={active === endpoint} onClick={() => switchEndpoint(endpoint)}><span><span aria-hidden="true">{endpoint + 1}. </span>{endpoint ? endLabel : startLabel}</span><strong>{panel[endpoint] ? display(panel[endpoint]) : '날짜와 시간 선택'}</strong></button>)}
        </div>}
        <div className="datetime-panel">
          <div className="datetime-calendar">
            <div className="calendar-header"><button type="button" className="calendar-nav" aria-label="이전 달" onClick={() => setCursor(clampDay(moveMonth(cursor, -1)))}><span className="ui-icon icon-keyboard-arrow-down" style={{ transform: 'rotate(90deg)' }} aria-hidden="true" /></button><strong id={`${base}-month`} aria-live="polite">{year}년 {month + 1}월</strong><button type="button" className="calendar-nav" aria-label="다음 달" onClick={() => setCursor(clampDay(moveMonth(cursor, 1)))}><span className="ui-icon icon-keyboard-arrow-down" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true" /></button></div>
            <div className="calendar-weekdays" aria-hidden="true">{'일월화수목금토'.split('').map(day => <span key={day}>{day}</span>)}</div>
            <div className="calendar-grid" role="grid" aria-labelledby={`${base}-month`} aria-multiselectable={range || undefined} onPointerLeave={() => setPreview(null)}>
              {Array.from({ length: rows }, (_, row) => <div className="calendar-row" role="row" key={row}>{Array.from({ length: 7 }, (_, column) => {
                const number = row * 7 + column - offset + 1;
                if (number < 1 || number > count) return <div role="gridcell" aria-hidden="true" key={column} />;
                const date = makeDay(year, month, number), key = dayKey(date), isSelected = key === first || key === last;
                const within = !!first && !!last && first < key && key < last;
                const previewWithin = !!previewBounds && previewBounds[0] < key && key < previewBounds[1];
                const today = key === dayKey(new Date());
                return <div role="gridcell" key={column} aria-selected={isSelected || within}><button type="button" className={`calendar-day${isSelected && range ? key === first ? ' is-range-start' : ' is-range-end' : ''}${within ? ' is-in-range' : ''}${previewWithin ? ' is-preview-range' : ''}${preview && previewAnchor && key === preview ? ' is-preview-end' : ''}${today ? ' is-today' : ''}`}
                  aria-label={`${year}년 ${month + 1}월 ${number}일`} aria-current={today ? 'date' : undefined} aria-pressed={isSelected} tabIndex={key === cursorKey ? 0 : -1} disabled={!dayTimes(date).length}
                  onPointerEnter={() => { if (range && active === 1) setPreview(key); }} onClick={() => chooseDay(date)} onKeyDown={event => dayKeyboard(event, date)}>{number}</button></div>;
              })}</div>)}
            </div>
          </div>
          <div className={`datetime-time-panel${showSeconds ? ' datetime-time-panel-seconds' : ''}`}>
            {(showSeconds ? ['hour', 'minute', 'second'] as const : ['hour', 'minute'] as const).map(kind => {
              const label = kind === 'hour' ? '시' : kind === 'minute' ? '분' : '초', choices = kind === 'hour' ? Array.from({ length: 24 }, (_, hour) => hour) : kind === 'minute' ? minutes : seconds;
              const enabled = kind === 'hour' ? availableHours : kind === 'minute' ? availableMinutes : availableSeconds, current = kind === 'hour' ? preferredHour : kind === 'minute' ? preferredMinute : preferredSecond;
              const focusValue = enabled.includes(current) ? current : enabled[0];
              return <div className="datetime-time-column" key={kind}><span className="datetime-time-label" id={`${base}-${kind}-label`}>{label}</span><div className="datetime-time-list" role="listbox" aria-label={label}>
                {choices.map(number => <button type="button" role="option" className="datetime-time-option" key={number} data-time-value={number} aria-selected={number === current} disabled={!enabled.includes(number)} tabIndex={number === focusValue ? 0 : -1} onClick={() => chooseTime(kind, number)} onKeyDown={event => timeKeyboard(event, kind, number)}>{pad(number)}</button>)}
              </div></div>;
            })}
          </div>
        </div>
        {selectionError && <p className="datetime-selection-error" role="alert">{selectionError}</p>}
        <div className="datetime-footer"><div className="datetime-summary" aria-live="polite">{range ? <><span>{summary(panel[0], '시작 일시 선택')}</span><span> – {summary(panel[1], '종료 일시 선택')}</span></> : summary(panel[0], '날짜와 시간을 선택하세요.')}</div><div className="datetime-actions">{range && active === 1 && <button className="button button--ghost button-inline" type="button" onClick={() => switchEndpoint(0)}>이전</button>}<button className="button button--outline button-inline" type="button" onClick={() => close(true)}>취소</button><button className="button button-inline" type="button" onClick={() => range && active === 0 ? switchEndpoint(1) : confirm()}>{range && active === 0 ? '다음' : '확인'}</button></div></div>
      </div>}
    </div>
    {helperText != null && <p className="component-helper date-help" id={`${base}-help`}>{helperText}</p>}
    <p className="field-error date-field-error" role="status" id={`${base}-error`} hidden={!error}>{error}</p>
  </div>;
}

export const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(function DateTimePicker({ value, defaultValue = null, onValueChange, ...props }, ref) {
  return <DateTimeWidget {...props} inputRef={ref} range={false} values={value === undefined ? undefined : [value, null]} initial={[defaultValue, null]} onValuesChange={pair => onValueChange?.(pair[0])} />;
});
export const DateTimeRangePicker = React.forwardRef<HTMLInputElement, DateTimeRangePickerProps>(function DateTimeRangePicker({ value, defaultValue = [null, null], onValueChange, ...props }, ref) {
  return <DateTimeWidget {...props} inputRef={ref} range values={value} initial={defaultValue} onValuesChange={onValueChange} />;
});
