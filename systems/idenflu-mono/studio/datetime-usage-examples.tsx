import * as React from 'react';
import { Button, DateTimePicker, DateTimeRangePicker, Tabs, TextField } from '@idenflu/mono-react';
import type { DateTimeValue } from '@idenflu/mono-react';
import { Section } from './demo-layout';
import { bindingCode, conversionCode, formCode } from './datetime-usage-code';

type Model = {
  scheduledAt: DateTimeValue;
  reservation: { startsAt: DateTimeValue; endsAt: DateTimeValue };
};
const initial: Model = {
  scheduledAt: '2026-11-12T14:30',
  reservation: { startsAt: '2026-11-12T09:00', endsAt: '2026-11-12T17:30' },
};
const serverValue = '2026-11-12T05:30:00.000Z';

// These adapters illustrate a service with a fixed UTC+09:00 offset.
function utcToPicker(iso: string | null): DateTimeValue {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
function pickerToUtc(value: DateTimeValue) {
  return value ? new Date(value + ':00+09:00').toISOString() : null;
}

function ValuePreview({ label, value }: { label: string; value: unknown }) {
  return <div className="react-studio-stack" role="region" aria-label={label}>
    <h4 className="react-studio-example-title">{label}</h4>
    <div className="react-studio-code react-datetime-value"><pre>{JSON.stringify(value, null, 2)}</pre></div>
  </div>;
}

function ExampleCode({ code }: { code: string }) {
  const [message, setMessage] = React.useState('');
  return <details className="react-datetime-source">
    <summary>React 코드 보기</summary>
    <div className="react-studio-stack">
      <div className="react-studio-code"><pre><code>{code}</code></pre></div>
      <div className="react-studio-row">
        <Button variant="outline" onClick={async () => {
          try { await navigator.clipboard.writeText(code); setMessage('코드를 복사했습니다.'); }
          catch { setMessage('위 코드를 선택해 복사하세요.'); }
        }}>코드 복사</Button>
        <span className="component-helper" role="status" hidden={!message}>{message}</span>
      </div>
    </div>
  </details>;
}

function BindingExample() {
  const [model, setModel] = React.useState<Model>(initial);
  return <div className="react-studio-stack">
    <p className="react-studio-caption">value와 onValueChange로 부모 상태를 연결합니다. 범위의 배열 값은 예약 객체의 시작·종료 속성에 매핑합니다.</p>
    <div className="react-studio-stack" style={{ maxWidth: 720 }}>
      <DateTimePicker id="datetime-bind-single" label="발행 일시" value={model.scheduledAt} minuteStep={15}
        onValueChange={scheduledAt => setModel(current => ({ ...current, scheduledAt }))} />
      <DateTimeRangePicker id="datetime-bind-range" label="바인딩할 이용 기간" startLabel="바인딩 시작 일시" endLabel="바인딩 종료 일시" minuteStep={15}
        value={[model.reservation.startsAt, model.reservation.endsAt]}
        onValueChange={([startsAt, endsAt]) => setModel(current => ({ ...current, reservation: { startsAt, endsAt } }))} />
    </div>
    <div className="react-studio-row">
      <Button variant="outline" onClick={() => setModel(initial)}>예시 값 적용</Button>
      <Button variant="ghost" onClick={() => setModel({ scheduledAt: null, reservation: { startsAt: null, endsAt: null } })}>값 비우기</Button>
    </div>
    <ValuePreview label="바인딩된 상태" value={model} />
    <ExampleCode code={bindingCode} />
  </div>;
}

function ConversionExample() {
  const [value, setValue] = React.useState<DateTimeValue>(() => utcToPicker(serverValue));
  const utcIso = pickerToUtc(value);
  return <div className="react-studio-stack">
    <p className="react-studio-caption">이 예시는 서비스 시간대를 UTC+09:00으로 고정합니다. 서버의 UTC 값을 불러와 표시하고, 선택한 일시를 UTC·숫자 문자열·타임스탬프로 변환합니다.</p>
    <ValuePreview label="서버 응답 예시" value={{ scheduledAt: serverValue }} />
    <div style={{ maxWidth: 560 }}>
      <DateTimePicker id="datetime-convert" label="서비스 기준 일시 · UTC+09:00" value={value} onValueChange={setValue}
        helperText="컴포넌트 값에는 시간대가 없으며, 이 예시의 변환 함수가 UTC+09:00을 적용합니다. 초·밀리초는 분 정밀도로 처리합니다." />
    </div>
    <div className="react-studio-row">
      <Button variant="outline" onClick={() => setValue(utcToPicker(serverValue))}>서버 값 불러오기</Button>
      <Button variant="ghost" onClick={() => setValue(null)}>변환 값 비우기</Button>
    </div>
    <ValuePreview label="변환된 값" value={{
      pickerValue: value,
      displayValue: value?.replace('T', ' ') ?? null,
      compactValue: value?.replace(/[-T:]/g, '') ?? null,
      utcIso,
      epochMilliseconds: utcIso ? new Date(utcIso).getTime() : null,
    }} />
    <ExampleCode code={conversionCode} />
  </div>;
}

function FormExample() {
  const [result, setResult] = React.useState<object | null>(null);
  const clearResult = () => setResult(null);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (name: string) => String(data.get(name) ?? '') || null;
    setResult({
      formData: Object.fromEntries(data),
      apiPayload: {
        title: read('title'),
        reminderAt: pickerToUtc(read('reminderAt')),
        startsAt: pickerToUtc(read('booking-start')),
        endsAt: pickerToUtc(read('booking-end')),
      },
    });
  };
  return <div className="react-studio-stack">
    <p className="react-studio-caption">name으로 FormData에 연결합니다. 필수값과 날짜 검증을 통과하면 제출값과 API용 UTC 데이터를 보여줍니다. 실제 요청은 보내지 않습니다.</p>
    <form className="react-studio-stack" onSubmit={submit} onReset={clearResult} onChange={clearResult}>
      <div className="react-studio-stack" style={{ maxWidth: 720 }}>
        <TextField label={<>일정명 <span className="form-pattern-required">필수</span></>} name="title" required defaultValue="디자인 시스템 리뷰" />
        <DateTimePicker id="datetime-form-reminder" name="reminderAt" label="알림 일시" defaultValue="2026-11-12T08:30" minuteStep={15} onValueChange={clearResult} />
        <DateTimeRangePicker id="datetime-form-range" name="booking" label={<>예약 기간 <span className="form-pattern-required">필수</span></>}
          startLabel="예약 시작 일시" endLabel="예약 종료 일시" required minuteStep={15}
          defaultValue={['2026-11-12T09:00', '2026-11-12T17:30']} onValueChange={clearResult} />
      </div>
      <div className="react-studio-row">
        <Button type="submit">제출 데이터 확인</Button>
        <Button variant="outline" type="reset">폼 초기화</Button>
      </div>
      {result ? <ValuePreview label="제출 결과" value={result} /> : <p role="status" className="react-studio-caption">값을 입력하고 제출 데이터 확인을 누르세요.</p>}
    </form>
    <ExampleCode code={formCode} />
  </div>;
}

export function DateTimeUsageExamples() {
  return <Section title="React 사용 예시" description="바인딩, 값 변환, 폼 제출을 직접 실행하고 각 예시의 코드를 확인하세요.">
    <Tabs className="react-datetime-usage" label="Datetime picker 사용 예시" items={[
      { value: 'binding', label: '값 바인딩', content: <BindingExample /> },
      { value: 'conversion', label: '값 변환', content: <ConversionExample /> },
      { value: 'form', label: '폼 제출', content: <FormExample /> },
    ]} />
  </Section>;
}
