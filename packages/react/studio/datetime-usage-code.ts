export const bindingCode = `import { useState } from 'react';
import { Button, DateTimePicker, DateTimeRangePicker } from '@idenflu/mono-react';
import type { DateTimeValue } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

type Model = {
  scheduledAt: DateTimeValue;
  reservation: { startsAt: DateTimeValue; endsAt: DateTimeValue };
};
const initial: Model = {
  scheduledAt: '2026-11-12T14:30',
  reservation: { startsAt: '2026-11-12T09:00', endsAt: '2026-11-12T17:30' },
};

export function BindingExample() {
  const [model, setModel] = useState<Model>(initial);
  return <>
    <DateTimePicker label="발행 일시" value={model.scheduledAt} minuteStep={15}
      onValueChange={scheduledAt => setModel(current => ({ ...current, scheduledAt }))} />
    <DateTimeRangePicker label="이용 기간" minuteStep={15}
      value={[model.reservation.startsAt, model.reservation.endsAt]}
      onValueChange={([startsAt, endsAt]) => setModel(current => ({
        ...current, reservation: { startsAt, endsAt },
      }))} />
    <Button onClick={() => setModel(initial)}>예시 값 적용</Button>
    <Button variant="outline" onClick={() => setModel({
      scheduledAt: null, reservation: { startsAt: null, endsAt: null },
    })}>값 비우기</Button>
    <pre>{JSON.stringify(model, null, 2)}</pre>
  </>;
}`;

const toUtcHelper = `function pickerToUtc(value: string | null): string | null {
  return value ? new Date(value + ':00+09:00').toISOString() : null;
}`;
const conversionHelpers = `// UTC+09:00을 사용하는 서비스의 예시입니다.
// 브라우저의 로컬 시간대를 사용하지 않습니다.
function utcToPicker(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000)
    .toISOString().slice(0, 16);
}
${toUtcHelper}`;

export const conversionCode = `import { useState } from 'react';
import { Button, DateTimePicker } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

${conversionHelpers}

export function ConversionExample() {
  const serverValue = '2026-11-12T05:30:00.000Z';
  const [value, setValue] = useState<string | null>(() => utcToPicker(serverValue));
  const utcIso = pickerToUtc(value);
  const converted = {
    pickerValue: value,                         // '2026-11-12T14:30'
    displayValue: value?.replace('T', ' ') ?? null,
    compactValue: value?.replace(/[-T:]/g, '') ?? null,
    utcIso,                                     // '2026-11-12T05:30:00.000Z'
    epochMilliseconds: utcIso ? new Date(utcIso).getTime() : null,
  };
  return <>
    <DateTimePicker label="서비스 기준 일시 · UTC+09:00"
      value={value} onValueChange={setValue} />
    <Button onClick={() => setValue(utcToPicker(serverValue))}>서버 값 불러오기</Button>
    <Button variant="outline" onClick={() => setValue(null)}>변환 값 비우기</Button>
    <pre>{JSON.stringify(converted, null, 2)}</pre>
  </>;
}
// 빈 값은 null, 초·밀리초는 분 정밀도로 처리합니다.
// YYYY-MM-DDTHH:mm에 Z를 붙이거나 toISOString().slice(0, 16)으로
// 로컬 표시값을 만들면 서비스 시간대가 반영되지 않습니다.`;

export const formCode = `import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, DateTimePicker, DateTimeRangePicker, TextField } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

// UTC+09:00을 사용하는 서비스의 제출 예시입니다.
${toUtcHelper}

export function BookingForm() {
  const [result, setResult] = useState<object | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // required / 날짜 검증 통과 후 실행됩니다.
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
  }
  return <form onSubmit={submit} onReset={() => setResult(null)}
    onChange={() => setResult(null)}>
    <TextField label="일정명" name="title" required defaultValue="디자인 시스템 리뷰" />
    <DateTimePicker label="알림 일시" name="reminderAt" minuteStep={15}
      defaultValue="2026-11-12T08:30" onValueChange={() => setResult(null)} />
    <DateTimeRangePicker label="예약 기간" name="booking" required minuteStep={15}
      defaultValue={['2026-11-12T09:00', '2026-11-12T17:30']}
      onValueChange={() => setResult(null)} />
    <Button type="submit">제출 데이터 확인</Button>
    <Button variant="outline" type="reset">폼 초기화</Button>
    {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
  </form>;
}
// name="booking"은 booking-start, booking-end로 제출됩니다.
// defaultValue는 초기값이고, reset은 그 초기값을 복원합니다.
// 이 예시는 payload 확인까지만 수행하며 실제 요청은 보내지 않습니다.`;
