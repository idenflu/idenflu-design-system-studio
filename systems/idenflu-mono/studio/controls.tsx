import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button, Dialog, Icon, Segmented, Select, Slider, Tooltip } from '@idenflu/mono-react';

type PreferenceKey = 'fontSize' | 'lineHeight' | 'spacing' | 'controlHeight' | 'radius';
type PreferenceFont = 'pretendard' | 'wanted-sans';
type Theme = 'light' | 'dark';
type ColorToken = '--primary' | '--text' | '--text-secondary' | '--surface' | '--border' | '--primary-control' | '--canvas' | '--danger' | '--success' | '--warning' | '--info';
export type PreferenceValues = Record<PreferenceKey, number> & { fontFamily:PreferenceFont; colors?: Partial<Record<Theme, Partial<Record<ColorToken, string>>>> };
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
    const theme = root.dataset.theme === 'dark' ? 'dark' as const : 'light' as const;
    const checks = [
      ['본문 / 배경','--text','--canvas'], ['본문 / 표면','--text','--surface'],
      ['보조 글자 / 배경','--text-secondary','--canvas'], ['보조 글자 / 표면','--text-secondary','--surface'],
      ['링크 / 배경','--primary','--canvas'], ['Danger / 배경','--danger-text','--canvas'],
      ['Success / 배경','--success','--canvas'], ['Warning / 배경','--warning','--canvas'], ['Info / 배경','--info','--canvas'],
    ];
    const warnings = checks.flatMap(([label,foreground,background]) => {
      const ratio = window.IdenfluPreferences.contrastRatio(styles.getPropertyValue(foreground).trim(),styles.getPropertyValue(background).trim());
      return ratio !== null && ratio < 4.5 ? [{label,ratio}] : [];
    });
    return {warnings, forcedColors:window.matchMedia('(forced-colors: active)').matches, theme, colors:Object.fromEntries([...baseColors,...semanticColors].map(([token]) => [token,styles.getPropertyValue(token).trim().toLowerCase()])) as Record<ColorToken,string>};
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
      <input id={id} className="text-input" type="text" value={draft} maxLength={7} spellCheck={false} autoComplete="off" aria-label={`${label} HEX`} aria-invalid={!validColor(draft)} aria-describedby="studio-color-format studio-color-contrast" onChange={event => setDraft(event.target.value)} onBlur={() => { if (validColor(draft)) onChange(draft); else setDraft(value); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (validColor(draft)) onChange(draft); } else if (event.key === 'Escape' && draft !== value) { event.preventDefault(); event.stopPropagation(); setDraft(value); } }} />
      <button type="button" className="icon-button" aria-label={`${label} 색상 초기화`} disabled={!custom} onClick={onReset}><span aria-hidden="true">↺</span></button>
    </div>
  </div>;
}
declare global { interface Window { IdenfluTheme: { get():Theme; set(theme:Theme):void }; IdenfluPreferences: { get():PreferenceValues; set(value:PreferenceUpdate):PreferenceValues; reset():PreferenceValues; cssText():string; contrastRatio(foreground:string,background:string):number|null; ranges:Record<PreferenceKey, {min:number;max:number;step:number}>; fonts:readonly {value:PreferenceFont;label:string;family:string}[] } } }
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
  const trigger = React.useRef<HTMLButtonElement>(null);
  const body = React.useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus({preventScroll:true});
  };
  const palette = usePalette();
  React.useLayoutEffect(() => {
    if (!open) return;
    document.documentElement.setAttribute('data-studio-settings-open','');
    return () => document.documentElement.removeAttribute('data-studio-settings-open');
  }, [open]);
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
    body.current.querySelector<HTMLElement>('button:not(:disabled), input:not([type="hidden"]):not(:disabled)')?.focus({preventScroll:true});
  }, [open]);
  const fields: [PreferenceKey, string][] = [['fontSize','글자 크기'],['lineHeight','행간'],['spacing','여백'],['controlHeight','컨트롤 높이'],['radius','모서리']];
  return <>
    <Tooltip content="화면 조정"><button ref={trigger} type="button" className="icon-button studio-settings-open" aria-label="화면 조정" aria-haspopup="dialog" aria-expanded={open} aria-controls="studio-settings-dialog" onClick={() => open ? close() : setOpen(true)}><Icon name="settings" /></button></Tooltip>
    {createPortal(<Dialog id="studio-settings-dialog" open={open} modal={false} onOpenChange={next => next ? setOpen(true) : close()} aria-labelledby="react-settings-title" aria-describedby="react-settings-description">
      <header className="studio-preferences-header"><div><h2 id="react-settings-title">화면 조정</h2><p id="react-settings-description">변경사항은 이 브라우저에 자동 저장됩니다.</p></div><button type="button" id="studio-preferences-close" className="icon-button" aria-label="화면 조정 닫기" onClick={close}><Icon name="close" /></button></header>
      <div className="studio-preferences-body" ref={body}>
        <section aria-labelledby="studio-font-title">
          <h3 id="studio-font-title" className="studio-preferences-section-title">폰트</h3>
          <Select label="글꼴" value={values.fontFamily} options={window.IdenfluPreferences.fonts.map(({value,label}) => ({value,label}))} popupStrategy="fixed" onValueChange={value => window.IdenfluPreferences.set({fontFamily:value === 'wanted-sans' ? 'wanted-sans' : 'pretendard'})} />
          <p className="studio-preferences-hint">기본 글꼴은 Pretendard입니다. 선택한 글꼴을 문서와 예제 화면에 적용합니다.</p>
          <div className="studio-preferences-font-preview" role="group" aria-label="글꼴 미리보기"><p>생각을 또렷하게, 일상을 간결하게.</p><p lang="en">Design with clarity. 0123456789</p></div>
        </section>
        <section aria-labelledby="studio-layout-title">
          <h3 id="studio-layout-title" className="studio-preferences-section-title">크기·간격</h3>
          {fields.map(([key, label]) => {
          const range = window.IdenfluPreferences.ranges[key];
          const min = key === 'lineHeight' ? Math.max(range.min, values.fontSize + 4) : key === 'controlHeight' ? Math.max(range.min, Math.ceil((values.fontSize + 18) / 2) * 2) : range.min;
          const unit = `${values[key]}${key === 'spacing' ? '%' : 'px'}`;
          const id = `react-pref-${key}`;
          return <div className="studio-preferences-field" key={key}><div className="studio-preferences-label"><label htmlFor={id}>{label}</label><output htmlFor={id}>{unit}</output></div><Slider id={id} min={min} max={range.max} step={range.step} value={values[key]} aria-valuetext={unit} onValueChange={value => window.IdenfluPreferences.set({[key]:value})} /></div>;
        })}</section>
        <section aria-labelledby="studio-color-title" className="studio-preferences-colors">
          <div className="studio-preferences-theme-row">
            <h3 id="studio-color-title" className="studio-preferences-section-title">색상</h3>
            <Segmented label="색상을 조정할 테마" size="sm" value={palette.theme} options={[{value:'light',label:'라이트'},{value:'dark',label:'다크'}]} onValueChange={value => selectTheme(value === 'dark' ? 'dark' : 'light')} />
          </div>
          {palette.forcedColors ? <p className="studio-preferences-hint">고대비 모드에서는 시스템 색상을 사용합니다. 색상 조정은 고대비 모드를 해제한 뒤 사용할 수 있습니다.</p> : <>
          <p id="studio-color-format" className="studio-preferences-hint">기본색은 중립 회색, 주요 동작과 선택은 블루를 사용합니다. 버튼 글자의 대비는 자동 보정되며, 입력창도 Border 설정을 따릅니다.</p>
          <div id="studio-color-contrast" className="studio-preferences-contrast" role="status" aria-live="polite" aria-atomic="true">
            {palette.warnings.length > 0 && <><p>일부 글자색의 대비가 권장 기준 4.5:1보다 낮습니다.</p><ul>{palette.warnings.map(({label,ratio}) => <li key={label}>{label}: {ratio.toFixed(2)}:1</li>)}</ul><p>글자색이나 배경색을 조정해주세요.</p></>}
          </div>
          {[["기본 색상",baseColors],["의미 색상",semanticColors]].map(([title,items]) => <fieldset className="studio-preferences-color-group" key={title as string}><legend>{title as string}</legend>{(items as typeof baseColors).map(([token,label]) => <ColorField key={`${palette.theme}-${token}`} token={token} label={label} value={palette.colors[token]} custom={Boolean(values.colors?.[palette.theme]?.[token])} onChange={value => window.IdenfluPreferences.set({colors:{[palette.theme]:{[token]:value}}})} onReset={() => window.IdenfluPreferences.set({colors:{[palette.theme]:{[token]:null}}})} />)}</fieldset>)}
          </>}
        </section>
      </div>
      <footer className="studio-preferences-footer"><div className="studio-preferences-actions">
        <Button variant="outline" onClick={() => window.IdenfluPreferences.reset()}>초기화</Button>
        <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(window.IdenfluPreferences.cssText()); setMessage('CSS를 복사했습니다.'); } catch { setMessage('CSS를 복사하지 못했습니다.'); } }}>CSS 복사</Button>
        <Button onClick={close}>닫기</Button>
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
    <Icon name="moon" className="theme-icon-moon" />
    <Icon name="sun" className="theme-icon-sun" />
  </button></Tooltip>;
}
