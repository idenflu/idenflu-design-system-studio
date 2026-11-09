import * as React from 'react';
import { type BaseField } from '../../shared/field-types';

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

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField({ label, id, name, disabled, readOnly, required, size, helperText, error: externalError, className, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid, value, defaultValue = null, onValueChange, min, max, step = '1', decimals = 0, grouping = false, unit, prefixIcon, selectOnFocus = false }, ref) {
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
  const invalid = !!error || ariaInvalid === true || ariaInvalid === 'true';
  const composing = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current!);
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
  const described = [describedBy, helperText != null && `${inputId}-help`, unit && `${inputId}-unit`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;
  return <div className={className}>
    <label htmlFor={inputId} className="field-label">{label}</label>
    <div className={`number-field${invalid ? ' is-invalid' : ''}`} data-size={size}>
      {prefixIcon != null && <span className="number-field-prefix" aria-hidden="true" onClick={() => { if (!disabled) inputRef.current?.focus(); }}>{prefixIcon}</span>}
      <input ref={inputRef} id={inputId} name={name} type="text" role="spinbutton" inputMode={places ? 'decimal' : 'numeric'} className="number-field-input" value={draft} disabled={disabled} readOnly={readOnly} required={required}
        aria-invalid={invalid || ariaInvalid} aria-describedby={described} aria-valuemin={minParsed.value == null ? undefined : ariaNumber(minParsed.value, places)} aria-valuemax={maxParsed.value == null ? undefined : ariaNumber(maxParsed.value, places)} aria-valuenow={parsed.value == null || parsed.error || boundsError(parsed) ? undefined : ariaNumber(parsed.value, places)} aria-valuetext={parsed.value == null || parsed.error || boundsError(parsed) ? undefined : `${formatNumber(parsed.value, places, grouping, parsed.digits)}${unit ? ` ${unit}` : ''}`}
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
});
