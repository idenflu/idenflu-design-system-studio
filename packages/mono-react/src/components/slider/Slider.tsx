import * as React from 'react';

export function Slider({ value, defaultValue = 0, onValueChange, min = 0, max = 100, style, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> & { value?: number; defaultValue?: number; onValueChange?: (value: number) => void }) {
  const [internal, setInternal] = React.useState(defaultValue);
  const input = React.useRef<HTMLInputElement>(null);
  const initial = React.useRef(defaultValue);
  React.useEffect(() => {
    const form = input.current?.form;
    if (!form || value !== undefined) return;
    let active = true;
    const reset = (event: Event) => { queueMicrotask(() => { if (active && !event.defaultPrevented) setInternal(initial.current); }); };
    form.addEventListener('reset', reset);
    return () => { active = false; form.removeEventListener('reset', reset); };
  }, [value]);
  const current = value ?? internal;
  const low = Number(min), high = Number(max);
  const percent = high > low ? Math.max(0, Math.min(100, (current - low) / (high - low) * 100)) : 0;
  return <input {...props} ref={input} type="range" className={`range-input ${props.className || ''}`} min={min} max={max} value={current} style={{ ...style, '--fill': `${percent}%`, '--fill-position': `calc(${percent}% + ${12 * (0.5 - percent / 100)}px)` } as React.CSSProperties} onChange={(event) => { const next = event.currentTarget.valueAsNumber; if (value === undefined) setInternal(next); onValueChange?.(next); }} />;
}
