import * as React from 'react';
import { useEscapeLayer } from './escape-layer';
const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export type TimeValue = string | null;
export interface TimePickerProps {
  label: React.ReactNode;
  id?: string;
  name?: string;
  value?: TimeValue;
  defaultValue?: TimeValue;
  onValueChange?: (value: TimeValue) => void;
  min?: string;
  max?: string;
  minuteStep?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
}

const pad = (value: number) => String(value).padStart(2, '0');
function parseTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/) || value.trim().match(/^(\d{2})(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]), minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return {hour, minute, key: `${pad(hour)}:${pad(minute)}`};
}
const normalized = (value: TimeValue) => parseTime(value ?? '')?.key ?? null;
const display = (value: TimeValue) => normalized(value) ?? value ?? '';

/** Local 24-hour time. Popup choices are pending until explicit confirmation. */
export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker({label, id, name, value, defaultValue = null, onValueChange, min, max, minuteStep = 1,
  size, disabled, readOnly, required, helperText, error: externalError, className, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid}, ref) {
  if (!Number.isInteger(minuteStep) || minuteStep < 1 || minuteStep > 60 || 60 % minuteStep !== 0) throw new RangeError('minuteStep은 60을 나누어떨어지게 하는 양의 정수여야 합니다.');
  if ((min !== undefined && parseTime(min)?.key !== min) || (max !== undefined && parseTime(max)?.key !== max) || (min && max && min > max)) throw new RangeError('유효한 시간 범위를 HH:mm 형식으로 지정해주세요.');
  const uid = React.useId(), base = id || `time-${uid}`;
  const initial = React.useRef(defaultValue);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(() => normalized(defaultValue));
  const current = controlled ? normalized(value) : internalValue;
  const [draft, setDraft] = React.useState(() => display(controlled ? value : defaultValue));
  const [internalError, setError] = React.useState('');
  const error = externalError || internalError;
  const invalid = !!error || ariaInvalid === true || ariaInvalid === 'true';
  const [open, setOpen] = React.useState(false);
  const [panel, setPanel] = React.useState<TimeValue>(null);
  const [position, setPosition] = React.useState<{ top:number; left:number; maxWidth:number; maxHeight:number } | null>(null);
  const root = React.useRef<HTMLDivElement>(null), popup = React.useRef<HTMLDivElement>(null);
  const input = React.useRef<HTMLInputElement>(null), trigger = React.useRef<HTMLButtonElement>(null);
  React.useImperativeHandle(ref, () => input.current!);
  const composing = React.useRef(false);
  const previous = React.useRef({value, controlled});
  const title = typeof label === 'string' ? `${label} 선택` : '시간 선택';
  const validate = (text: string) => {
    const parsed = parseTime(text);
    if (!text.trim()) return required ? '시간을 입력해주세요.' : '';
    if (!parsed) return '올바른 시간을 HH:mm 형식으로 입력해주세요.';
    if (parsed.minute % minuteStep !== 0) return `분은 ${minuteStep}분 단위로 입력해주세요.`;
    if ((min && parsed.key < min) || (max && parsed.key > max)) return '허용된 시간 범위를 확인해주세요.';
    return '';
  };
  const candidates = React.useMemo(() => Array.from({length:24}, (_, hour) =>
    Array.from({length:60 / minuteStep}, (_, index) => `${pad(hour)}:${pad(index * minuteStep)}`))
    .flat().filter(time => (!min || time >= min) && (!max || time <= max)), [min, max, minuteStep]);
  const close = (restore = false) => { setOpen(false); if (restore) trigger.current?.focus(); };
  useEscapeLayer(open, root, () => close(true));

  React.useEffect(() => {
    if (open) setPanel(current => current && candidates.includes(current) ? current : candidates[0] ?? null);
  }, [open, candidates]);
  React.useEffect(() => {
    if (controlled && (!previous.current.controlled || value !== previous.current.value)) {
      setDraft(display(value)); setError(''); setOpen(false);
    }
    previous.current = {value, controlled};
  }, [value, controlled]);
  React.useEffect(() => { if (disabled || readOnly) setOpen(false); }, [disabled, readOnly]);
  React.useEffect(() => { input.current?.setCustomValidity(externalError || validate(draft)); }, [draft, externalError, required, min, max, minuteStep]);
  React.useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    let mounted = true;
    const reset = (event: Event) => queueMicrotask(() => {
      if (!mounted || event.defaultPrevented) return;
      if (!controlled) setInternalValue(normalized(initial.current));
      setDraft(display(controlled ? value : initial.current)); setError(''); setOpen(false);
    });
    form.addEventListener('reset', reset);
    return () => { mounted = false; form.removeEventListener('reset', reset); };
  }, [controlled, value]);

  const publish = (text: string) => {
    if (disabled || readOnly || composing.current) return false;
    const issue = validate(text);
    if (issue) { setError(issue); return false; }
    const next = normalized(text);
    if (!controlled) setInternalValue(next);
    setDraft(controlled ? display(value) : next ?? ''); setError('');
    if (next !== current) onValueChange?.(next);
    return true;
  };
  const openPanel = () => {
    if (disabled || readOnly || composing.current) return;
    const preferred = normalized(draft) ?? current;
    setPanel(preferred && candidates.includes(preferred) ? preferred : candidates[0] ?? null);
    setOpen(true);
  };
  useClientLayoutEffect(() => {
    if (!open) { setPosition(null); return; }
    const layer = popup.current;
    let shownAsPopover = false;
    // Keep the layer inside its dialog and focus scope, while escaping the
    // clipping and transforms of scrollable ancestors.
    if (layer && typeof layer.showPopover === 'function') {
      try { layer.showPopover(); shownAsPopover = true; } catch { layer.removeAttribute('popover'); }
    }
    const update = () => {
      const picker = root.current, anchor = picker?.getBoundingClientRect(), element = popup.current;
      if (!picker || !anchor || !element) return;
      const edge = 12, gap = 6, width = document.documentElement.clientWidth, height = window.innerHeight;
      let leftEdge = edge, rightEdge = width - edge;
      for (let parent = picker.parentElement; parent; parent = parent.parentElement) {
        const style = window.getComputedStyle(parent);
        if (/(auto|scroll|hidden|clip)/.test(`${style.overflowX} ${style.overflowY}`)) {
          const rect = parent.getBoundingClientRect();
          if (anchor.bottom <= rect.top || anchor.top >= rect.bottom || anchor.right <= rect.left || anchor.left >= rect.right) { setOpen(false); return; }
          leftEdge = Math.max(leftEdge, rect.left + parent.clientLeft);
          rightEdge = Math.min(rightEdge, rect.left + parent.clientLeft + parent.clientWidth);
        }
        // A native modal is independent of a locked body's clipping bounds.
        if (parent.tagName === 'DIALOG' && parent.hasAttribute('open')) break;
      }
      if (anchor.bottom <= edge || anchor.top >= height - edge || anchor.right <= edge || anchor.left >= width - edge) { setOpen(false); return; }
      const below = Math.max(0, height - anchor.bottom - gap - edge), above = Math.max(0, anchor.top - gap - edge);
      // scrollHeight includes the heading and confirmation footer, so upward
      // placement reserves room for the whole panel rather than just its lists.
      const up = element.scrollHeight > below && above > below;
      const maxHeight = up ? above : below, maxWidth = Math.max(0, rightEdge - leftEdge);
      const popupWidth = Math.min(element.offsetWidth, maxWidth);
      const next = {top:up ? anchor.top - gap - Math.min(element.scrollHeight, maxHeight) : anchor.bottom + gap,
        left:Math.max(leftEdge, Math.min(anchor.left, rightEdge - popupWidth)), maxWidth, maxHeight};
      setPosition(previous => previous && previous.top === next.top && previous.left === next.left && previous.maxWidth === next.maxWidth && previous.maxHeight === next.maxHeight ? previous : next);
    };
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(); };
    update();
    window.addEventListener('resize', update); window.addEventListener('scroll', update, true);
    document.addEventListener('pointerdown', outside);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (popup.current) observer?.observe(popup.current);
    return () => {
      observer?.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true);
      document.removeEventListener('pointerdown', outside);
      if (shownAsPopover && layer?.isConnected && layer.matches(':popover-open')) layer.hidePopover();
    };
  }, [open]);
  const positioned = position !== null;
  useClientLayoutEffect(() => {
    if (open && positioned) (popup.current?.querySelector<HTMLButtonElement>('[role="option"][tabindex="0"]') ?? popup.current)?.focus();
  }, [open, positioned]);
  React.useEffect(() => {
    if (!open) return;
    popup.current?.querySelectorAll<HTMLElement>('[aria-selected="true"]').forEach(option => {
      const list = option.parentElement;
      if (list) list.scrollTop = option.offsetTop - list.offsetTop - Math.max(0, (list.clientHeight - option.offsetHeight) / 2);
    });
  }, [open, panel, minuteStep]);

  const selected = parseTime(panel ?? '');
  const hours = [...new Set(candidates.map(time => Number(time.slice(0,2))))];
  const minutes = Array.from({length:60 / minuteStep}, (_, index) => index * minuteStep);
  const availableMinutes = candidates.filter(time => Number(time.slice(0,2)) === selected?.hour).map(time => Number(time.slice(3)));
  const choose = (kind: 'hour' | 'minute', number: number) => {
    if (kind === 'minute' && selected) setPanel(`${pad(selected.hour)}:${pad(number)}`);
    else {
      const choices = candidates.filter(time => Number(time.slice(0,2)) === number);
      const preferred = `${pad(number)}:${pad(selected?.minute ?? 0)}`;
      setPanel(choices.find(time => time >= preferred) ?? choices[choices.length - 1] ?? null);
    }
  };
  const timeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, kind: 'hour' | 'minute', number: number) => {
    if (!['ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) return;
    const choices = kind === 'hour' ? hours : availableMinutes;
    if (!choices.length) return;
    event.preventDefault();
    const index = Math.max(0, choices.indexOf(number));
    const offset = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : event.key === 'PageUp' ? -5 : 5;
    const next = choices[event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : Math.max(0, Math.min(choices.length - 1, index + offset))];
    choose(kind, next);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-time-value="${next}"]`)?.focus();
  };
  const described = [describedBy, helperText != null && `${base}-help`, error && `${base}-error`].filter(Boolean).join(' ') || undefined;

  return <div className={className} data-size={size}>
    <label className="field-label" htmlFor={base}>{label}</label>
    <div className="date-picker time-picker" ref={root} onBlur={event => {
      if (open && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) close();
    }}>
      <div className={`date-field time-field${invalid ? ' has-error' : ''}`}>
        <input ref={input} id={base} className="date-text time-input" type="text" inputMode="numeric" autoComplete="off" placeholder="HH:mm"
          value={draft} disabled={disabled} readOnly={readOnly} required={required} aria-invalid={invalid || ariaInvalid} aria-describedby={described}
          onChange={event => { setDraft(event.target.value); setError(''); }}
          onBlur={event => { if (!open && event.relatedTarget !== trigger.current) publish(draft); }}
          onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
          onInvalid={() => setError(externalError || validate(draft))}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
            if (event.altKey && event.key === 'ArrowDown') { event.preventDefault(); openPanel(); }
            else if (event.key === 'Enter') { event.preventDefault(); publish(draft); }
          }} />
        <button ref={trigger} className="date-trigger" type="button" disabled={disabled || readOnly} aria-label={`${title} 열기`}
          aria-haspopup="dialog" aria-expanded={open} aria-controls={`${base}-popup`} onMouseDown={event => event.preventDefault()}
          onBlur={event => { if (!open && !root.current?.contains(event.relatedTarget as Node | null)) publish(draft); }}
          onClick={() => open ? close(true) : openPanel()}><span className="ui-icon icon-clock" aria-hidden="true" /></button>
      </div>
      {name && <input type="hidden" name={name} value={current ?? ''} disabled={disabled} />}
      {open && <div ref={popup} className="date-popup time-popup" id={`${base}-popup`} role="dialog" aria-label={title} tabIndex={-1} popover="manual"
        style={{position:'fixed',margin:0,top:position?.top??0,bottom:'auto',left:position?.left??0,right:'auto',maxWidth:position?.maxWidth,maxHeight:position?.maxHeight,visibility:position?'visible':'hidden'}}
        onMouseDownCapture={event => { if (!(event.target as Element).closest('button')) popup.current?.focus({preventScroll:true}); }}>
        <div className="time-popup-heading"><span>시간 선택</span><strong aria-live="polite">{panel ?? '--:--'}</strong></div>
        <div className="datetime-time-panel">
          {(['hour','minute'] as const).map(kind => {
            const label = kind === 'hour' ? '시' : '분';
            const choices = kind === 'hour' ? Array.from({length:24}, (_, index) => index) : minutes;
            const enabled = kind === 'hour' ? hours : availableMinutes;
            const current = kind === 'hour' ? selected?.hour : selected?.minute;
            const focusValue = current !== undefined && enabled.includes(current) ? current : enabled[0];
            return <div className="datetime-time-column" key={kind}><span className="datetime-time-label">{label}</span>
              <div className="datetime-time-list" role="listbox" aria-label={label}>{choices.map(number =>
                <button type="button" role="option" className="datetime-time-option" key={number} data-time-value={number}
                  aria-selected={number === current} disabled={!enabled.includes(number)} tabIndex={number === focusValue ? 0 : -1}
                  onClick={() => choose(kind, number)} onKeyDown={event => timeKeyDown(event, kind, number)}>{pad(number)}</button>)}</div>
            </div>;
          })}
        </div>
        {!candidates.length && <p className="time-empty" role="status">선택 가능한 시간이 없습니다.</p>}
        <div className="datetime-footer"><span className="component-helper">24시간 형식</span><div className="datetime-actions">
          <button type="button" className="button button--outline button-inline" onClick={() => close(true)}>취소</button>
          <button type="button" className="button button-inline" disabled={!panel || !!validate(panel)} onClick={() => { if (panel && publish(panel)) close(true); }}>확인</button>
        </div></div>
      </div>}
    </div>
    {helperText != null && <p className="component-helper" id={`${base}-help`}>{helperText}</p>}
    {error && <p className="field-error" id={`${base}-error`} role="status">{error}</p>}
  </div>;
});
