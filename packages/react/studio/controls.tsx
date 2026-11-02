import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button, Dialog, Icon, Slider } from '../src';

type PreferenceKey = 'fontSize' | 'lineHeight' | 'spacing' | 'controlHeight' | 'radius';
export type PreferenceValues = Record<PreferenceKey, number>;
declare global { interface Window { IdenfluPreferences: { get():PreferenceValues; set(value:Partial<PreferenceValues>):PreferenceValues; reset():PreferenceValues; cssText():string; ranges:Record<PreferenceKey, {min:number;max:number;step:number}> } } }
export function usePreferences() {
  const [values, setValues] = React.useState(() => window.IdenfluPreferences.get());
  React.useEffect(() => {
    const update = (event: Event) => setValues((event as CustomEvent<{values:PreferenceValues}>).detail.values);
    document.addEventListener('preferenceschange', update);
    return () => document.removeEventListener('preferenceschange', update);
  }, []);
  return values;
}
export function StudioSettings() {
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState(() => window.IdenfluPreferences.get());
  const [message, setMessage] = React.useState('');
  const body = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const update = (event:Event) => {
      const detail = (event as CustomEvent<{values:PreferenceValues; saved:boolean; reason:string}>).detail;
      setValues(detail.values);
      if (detail.reason === 'set' || detail.reason === 'reset') setMessage(detail.saved ? '설정을 저장했습니다.' : '저장할 수 없어 현재 화면에만 적용됩니다.');
    };
    document.addEventListener('preferenceschange', update);
    return () => document.removeEventListener('preferenceschange', update);
  }, []);
  React.useEffect(() => {
    if (!open || !body.current) return;
    body.current.scrollTop = 0;
    body.current.querySelector<HTMLInputElement>('input')?.focus({preventScroll:true});
  }, [open]);
  const fields: [PreferenceKey, string][] = [['fontSize','글자 크기'],['lineHeight','행간'],['spacing','여백'],['controlHeight','컨트롤 높이'],['radius','모서리']];
  return <>
    <button type="button" className="icon-button studio-settings-open" aria-label="화면 조정" title="화면 조정" aria-haspopup="dialog" aria-controls="studio-settings-dialog" onClick={() => setOpen(true)}><Icon name="settings" /></button>
    {createPortal(<Dialog id="studio-settings-dialog" closeOnBackdrop open={open} onOpenChange={setOpen} aria-labelledby="react-settings-title" aria-describedby="react-settings-description">
      <header className="studio-preferences-header"><h2 id="react-settings-title">화면 조정</h2><button type="button" id="studio-preferences-close" className="icon-button" aria-label="화면 조정 닫기" onClick={() => setOpen(false)}><Icon name="close" /></button></header>
      <div className="studio-preferences-body" ref={body}>
        <p id="react-settings-description" className="component-helper">이 브라우저에 화면 설정을 저장합니다.</p>
        <section aria-label="조정 항목">{fields.map(([key, label]) => {
          const range = window.IdenfluPreferences.ranges[key];
          const min = key === 'lineHeight' ? Math.max(range.min, values.fontSize + 4) : key === 'controlHeight' ? Math.max(range.min, Math.ceil((values.fontSize + 18) / 2) * 2) : range.min;
          const unit = `${values[key]}${key === 'spacing' ? '%' : 'px'}`;
          const id = `react-pref-${key}`;
          return <div className="studio-preferences-field" key={key}><div className="studio-preferences-label"><label htmlFor={id}>{label}</label><output htmlFor={id}>{unit}</output></div><Slider id={id} min={min} max={range.max} step={range.step} value={values[key]} aria-valuetext={unit} onValueChange={value => window.IdenfluPreferences.set({[key]:value})} /></div>;
        })}</section>
      </div>
      <footer className="studio-preferences-footer"><div className="studio-preferences-actions">
        <Button variant="outline" onClick={() => window.IdenfluPreferences.reset()}>초기화</Button>
        <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(window.IdenfluPreferences.cssText()); setMessage('CSS를 복사했습니다.'); } catch { setMessage('CSS를 복사하지 못했습니다.'); } }}>CSS 복사</Button>
        <Button onClick={() => setOpen(false)}>닫기</Button>
      </div><p id="studio-preferences-status" role="status" aria-live="polite">{message}</p></footer>
    </Dialog>, document.body)}
  </>;
}
export function ThemeControl() {
  const [theme, setTheme] = React.useState(() => document.documentElement.dataset.theme || 'light');
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => { let stored:string | null = null; try { stored = localStorage.getItem('idenflu-mono-theme'); } catch { /* use system preference */ } const next = stored === 'dark' || stored === 'light' ? stored : media.matches ? 'dark' : 'light'; document.documentElement.dataset.theme = next; document.documentElement.style.colorScheme = next; setTheme(next); };
    window.addEventListener('storage', sync); media.addEventListener('change', sync);
    return () => { window.removeEventListener('storage', sync); media.removeEventListener('change', sync); };
  }, []);
  const label = `${theme === 'dark' ? '라이트' : '다크'} 모드로 전환`;
  return <button type="button" className="icon-button theme-toggle" aria-label={label} title={label} aria-pressed={theme === 'dark'} onClick={() => { const next = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('idenflu-mono-theme', next); } catch { /* keep the current screen usable */ } document.documentElement.dataset.theme = next; document.documentElement.style.colorScheme = next; setTheme(next); document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim()); }}>
    <svg className="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20.3 15.2A8.5 8.5 0 0 1 8.8 3.7 8.5 8.5 0 1 0 20.3 15.2Z" /></svg>
    <svg className="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  </button>;
}
