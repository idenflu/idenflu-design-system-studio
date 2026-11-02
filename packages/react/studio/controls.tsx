import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button, Dialog, Icon, Slider, Tooltip } from '../src';

type PreferenceKey = 'fontSize' | 'lineHeight' | 'spacing' | 'controlHeight' | 'radius';
type Theme = 'light' | 'dark';
type ColorToken = '--primary' | '--text' | '--text-secondary' | '--surface' | '--border' | '--primary-control' | '--canvas' | '--danger' | '--success' | '--warning' | '--info';
export type PreferenceValues = Record<PreferenceKey, number> & { colors?: Partial<Record<Theme, Partial<Record<ColorToken, string>>>> };
type PreferenceUpdate = Partial<Omit<PreferenceValues, 'colors'>> & { colors?: Partial<Record<Theme, Partial<Record<ColorToken, string | null>>>> };
const baseColors: [ColorToken, string][] = [['--primary','Primary'],['--text','Text Primary'],['--text-secondary','Text Secondary'],['--surface','Surface'],['--border','Border'],['--primary-control','Control Primary'],['--canvas','Canvas']];
const semanticColors: [ColorToken, string][] = [['--danger','Danger'],['--success','Success'],['--warning','Warning'],['--info','Info']];
const validColor = (value:string) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
function selectTheme(theme:Theme) {
  window.IdenfluTheme.set(theme);
}
function usePalette() {
  const read = () => {
    const root = document.documentElement, styles = getComputedStyle(root);
    return {forcedColors:window.matchMedia('(forced-colors: active)').matches, theme:root.dataset.theme === 'dark' ? 'dark' as const : 'light' as const, colors:Object.fromEntries([...baseColors,...semanticColors].map(([token]) => [token,styles.getPropertyValue(token).trim().toLowerCase()])) as Record<ColorToken,string>};
  };
  const [palette,setPalette] = React.useState(read);
  React.useEffect(() => {
    const update = () => setPalette(read());
    const observer = new MutationObserver(update);
    const forcedColors = window.matchMedia('(forced-colors: active)');
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','style']});
    forcedColors.addEventListener('change', update);
    return () => { observer.disconnect(); forcedColors.removeEventListener('change', update); };
  },[]);
  return palette;
}
function ColorField({token,label,value,custom,onChange,onReset}:{token:ColorToken;label:string;value:string;custom:boolean;onChange:(value:string)=>void;onReset:()=>void}) {
  const [draft,setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value),[value]);
  const id = `react-pref-color-${token.slice(2)}`;
  return <div className="studio-preferences-color-field">
    <label htmlFor={id}>{label}<small>{token}</small></label>
    <div className="studio-preferences-color-inputs">
      <input type="color" aria-label={`${label} 색상 선택`} value={value} onChange={event => onChange(event.target.value)} />
      <input id={id} className="text-input" type="text" value={draft} maxLength={7} spellCheck={false} autoComplete="off" aria-label={`${label} HEX`} aria-invalid={!validColor(draft)} aria-describedby="studio-color-format" onChange={event => setDraft(event.target.value)} onBlur={() => { if (validColor(draft)) onChange(draft); else setDraft(value); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (validColor(draft)) onChange(draft); } else if (event.key === 'Escape' && draft !== value) { event.preventDefault(); event.stopPropagation(); setDraft(value); } }} />
      <button type="button" className="icon-button" aria-label={`${label} 색상 초기화`} disabled={!custom} onClick={onReset}><span aria-hidden="true">↺</span></button>
    </div>
  </div>;
}
declare global { interface Window { IdenfluTheme: { get():Theme; set(theme:Theme):void }; IdenfluPreferences: { get():PreferenceValues; set(value:PreferenceUpdate):PreferenceValues; reset():PreferenceValues; cssText():string; ranges:Record<PreferenceKey, {min:number;max:number;step:number}> } } }
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
  const palette = usePalette();
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
    <Tooltip content="화면 조정"><button type="button" className="icon-button studio-settings-open" aria-label="화면 조정" aria-haspopup="dialog" aria-controls="studio-settings-dialog" onClick={() => setOpen(true)}><Icon name="settings" /></button></Tooltip>
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
        <section aria-labelledby="studio-color-title" className="studio-preferences-colors">
          <h3 id="studio-color-title">색상</h3>
          <div className="studio-preferences-themes" role="group" aria-label="색상을 조정할 테마">
            <Button variant="outline" aria-pressed={palette.theme === 'light'} onClick={() => selectTheme('light')}>라이트</Button>
            <Button variant="outline" aria-pressed={palette.theme === 'dark'} onClick={() => selectTheme('dark')}>다크</Button>
          </div>
          <p className="studio-preferences-hint">선택한 테마에만 적용됩니다.</p>
          {palette.forcedColors ? <p className="studio-preferences-hint">고대비 모드에서는 시스템 색상을 사용합니다. 색상 조정은 고대비 모드를 해제한 뒤 사용할 수 있습니다.</p> : <>
          <p id="studio-color-format" className="studio-preferences-hint">색상 선택기를 열거나 HEX 코드(#RRGGBB)를 입력하세요.</p>
          {[["기본 색상",baseColors],["의미 색상",semanticColors]].map(([title,items]) => <fieldset className="studio-preferences-color-group" key={title as string}><legend>{title as string}</legend>{(items as typeof baseColors).map(([token,label]) => <ColorField key={`${palette.theme}-${token}`} token={token} label={label} value={palette.colors[token]} custom={Boolean(values.colors?.[palette.theme]?.[token])} onChange={value => window.IdenfluPreferences.set({colors:{[palette.theme]:{[token]:value}}})} onReset={() => window.IdenfluPreferences.set({colors:{[palette.theme]:{[token]:null}}})} />)}</fieldset>)}
          </>}
        </section>
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
    const observer = new MutationObserver(() => setTheme(window.IdenfluTheme.get()));
    observer.observe(document.documentElement, {attributes:true,attributeFilter:['data-theme']});
    return () => observer.disconnect();
  }, []);
  const label = `${theme === 'dark' ? '라이트' : '다크'} 모드로 전환`;
  return <Tooltip content={label}><button type="button" className="icon-button theme-toggle" aria-label={label} aria-pressed={theme === 'dark'} onClick={() => selectTheme(theme === 'dark' ? 'light' : 'dark')}>
    <svg className="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20.3 15.2A8.5 8.5 0 0 1 8.8 3.7 8.5 8.5 0 1 0 20.3 15.2Z" /></svg>
    <svg className="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  </button></Tooltip>;
}
