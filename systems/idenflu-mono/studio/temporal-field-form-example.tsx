import * as React from 'react';
import { Button, DatePicker, DateRangePicker, DateTimePicker, DateTimeRangePicker, NumberField, TimePicker } from '@idenflu/mono-react';
import { Section } from './demo-layout';

type Kind = 'number' | 'date' | 'time' | 'datetime';

export function TemporalFieldFormExample({kind}: {kind: Kind}) {
  const first = React.useRef<HTMLInputElement>(null);
  const last = React.useRef<HTMLInputElement>(null);
  const [result, setResult] = React.useState('');
  const helpId = `${kind}-external-description`;
  const shared = {ref:first, name:'value', 'aria-describedby':helpId, helperText:'필드 도움말과 외부 설명을 함께 읽습니다.'};
  return <Section id={`${kind}-external-form`} title="외부 설명과 입력 포커스" description="표준 ref는 실제 입력을 가리킵니다. 범위의 ref는 시작 입력, endInputRef는 종료 입력에 연결됩니다.">
    <form className="react-studio-stack" style={{maxWidth:720}} onSubmit={event => {
      event.preventDefault();
      setResult(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)), null, 2));
    }} onReset={() => setResult('')}>
      <p id={helpId} className="component-helper">폼에서 제공한 공통 설명입니다. 아래 버튼으로 입력에 직접 포커스를 이동해보세요.</p>
      {kind === 'number' && <NumberField {...shared} label="외부 연결 수량" defaultValue="12" min="0" unit="개" />}
      {kind === 'date' && <><DatePicker {...shared} label="외부 연결 날짜" defaultValue="2026-11-12" />
        <DateRangePicker label="외부 연결 기간" name="period" endInputRef={last} aria-describedby={helpId} defaultValue={['2026-11-12','2026-11-16']} helperText="종료 입력은 endInputRef로 접근합니다." /></>}
      {kind === 'time' && <TimePicker {...shared} label="외부 연결 시간" defaultValue="09:30" />}
      {kind === 'datetime' && <><DateTimePicker {...shared} label="외부 연결 일시" defaultValue="2026-11-12T09:30" />
        <DateTimeRangePicker label="외부 연결 일시 범위" name="period" endInputRef={last} aria-describedby={helpId} defaultValue={['2026-11-12T09:00','2026-11-12T18:00']} helperText="종료 입력은 endInputRef로 접근합니다." /></>}
      <div className="react-studio-row">
        <Button variant="outline" onClick={() => first.current?.focus()}>입력으로 이동</Button>
        {(kind === 'date' || kind === 'datetime') && <Button variant="outline" onClick={() => last.current?.focus()}>범위 종료로 이동</Button>}
        <Button type="submit">제출값 확인</Button><Button type="reset" variant="ghost">초기화</Button>
      </div>
      <output className="component-helper" aria-live="polite">{result || '확정된 값은 FormData로 확인할 수 있습니다.'}</output>
    </form>
  </Section>;
}
