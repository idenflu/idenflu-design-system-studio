import * as React from 'react';
import { Grid, DateTimePicker, DateTimeRangePicker } from '@idenflu/mono-react';
import { Section } from './demo-layout';
import {DateTimeAPIReference} from './datetime-api-reference';
import {TemporalFieldFormExample} from './temporal-field-form-example';

const sizes = ['sm', 'md', 'lg'] as const;
const displayValue = (value: string | null) => value ? value.replace('T', ' ') : '선택하지 않음';

export function DateTimeDemos() {
  const [value, setValue] = React.useState<string | null>('2026-11-12T14:30');
  const [range, setRange] = React.useState<readonly [string | null, string | null]>(['2026-11-12T09:00', '2026-11-12T17:30']);

  return <>
    <Section title="날짜와 시간 선택" description="달력과 시·분 목록에서 값을 고른 뒤 확인합니다. 취소하면 확정된 값은 유지됩니다.">
      <div className="react-studio-stack" style={{ maxWidth: 560 }}>
        <DateTimePicker id="datetime-basic" name="eventAt" label="날짜 및 시간" value={value} onValueChange={setValue} minuteStep={15} helperText="15분 단위로 선택합니다. 날짜와 시간을 직접 수정할 수도 있습니다." />
        <DateTimePicker id="datetime-entry" label="직접 입력" helperText="YYYY-MM-DD HH:mm 또는 숫자 12자리로 입력한 뒤 Enter를 누르세요." />
      </div>
      <p role="status" className="react-studio-caption">확정된 일시: {displayValue(value)}</p>
    </Section>

    <Section title="초 선택" description="초 선택을 켜면 같은 너비의 패널에서 시·분·초를 선택합니다.">
      <DateTimePicker id="datetime-seconds" label="초 단위 일시" showSeconds secondStep={5} defaultValue="2026-11-12T14:30:15" helperText="5초 단위로 선택하거나 YYYY-MM-DD HH:mm:ss 형식으로 입력하세요." />
    </Section>

    <Section title="날짜·시간 범위" description="시작 날짜와 시간을 고른 뒤 다음을 눌러 종료 일시를 선택합니다. 확인하면 전체 기간이 반영됩니다.">
      <div className="react-studio-stack" style={{ maxWidth: 720 }}>
        <DateTimeRangePicker id="datetime-range" name="booking" label="이용 기간" startLabel="이용 시작 일시" endLabel="이용 종료 일시" value={range} onValueChange={setRange} minuteStep={15} helperText="시작 일시 선택 → 다음 → 종료 일시 선택 → 확인 순서로 진행하세요. 종료는 시작보다 빠를 수 없습니다." />
        <p role="status" className="react-studio-caption">확정된 기간: {displayValue(range[0])} – {displayValue(range[1])}</p>
        <DateTimeRangePicker id="datetime-range-empty" label="새 기간 선택" startLabel="새 기간 시작 일시" endLabel="새 기간 종료 일시" minuteStep={15} helperText="빈 상태에서 시작 날짜와 시간을 선택한 뒤 다음을 눌러 종료 일시를 지정해보세요." />
        <DateTimeRangePicker id="datetime-multiday" label="여러 날에 걸친 일정" startLabel="일정 시작 일시" endLabel="일정 종료 일시" defaultValue={['2026-11-12T14:30', '2026-11-16T18:00']} minuteStep={15} />
      </div>
    </Section>

    <Section title="선택 범위와 시간 단위" description="날짜뿐 아니라 같은 날의 시작·종료 시간까지 제한합니다. 허용되지 않는 값은 입력해도 확정되지 않습니다.">
      <Grid columns={{base:1,sm:2}} rowGap={6} columnGap={8} alignItems="start" className="react-studio-field-grid">
        <DateTimePicker id="datetime-bounded" label="예약 가능 시간" defaultValue="2026-11-12T10:30" min="2026-11-12T09:00" max="2026-11-12T18:00" minuteStep={30} helperText="2026년 11월 12일 09:00–18:00, 30분 단위로 선택합니다." />
      </Grid>
    </Section>

    <Section title="입력 상태" description="읽기 전용은 값을 확인할 수 있고, 비활성 상태는 입력과 팝업 조작을 막습니다.">
      <Grid columns={{base:1,sm:2}} rowGap={6} columnGap={8} alignItems="start" className="react-studio-field-grid">
        <DateTimePicker id="datetime-readonly" label="읽기 전용 일시" defaultValue="2026-11-12T14:30" readOnly />
        <DateTimePicker id="datetime-disabled" label="비활성 일시" defaultValue="2026-11-12T14:30" disabled />
      </Grid>
      <div className="react-studio-stack" style={{ maxWidth: 720 }}>
        <DateTimeRangePicker id="datetime-range-readonly" label="읽기 전용 기간" startLabel="읽기 전용 시작 일시" endLabel="읽기 전용 종료 일시" defaultValue={['2026-11-12T09:00', '2026-11-12T17:30']} readOnly />
        <DateTimeRangePicker id="datetime-range-disabled" label="비활성 기간" startLabel="비활성 시작 일시" endLabel="비활성 종료 일시" defaultValue={['2026-11-12T09:00', '2026-11-12T17:30']} disabled />
      </div>
    </Section>

    <Section title="사이즈" description="단일 선택과 범위 선택 모두 같은 SM·MD·LG 크기 기준을 사용합니다.">
      <div className="react-studio-stack" style={{ maxWidth: 720 }}>
        {sizes.map(size => <div className="react-studio-stack" key={size}>
          <h3 className="react-studio-example-title">{size.toUpperCase()}</h3>
          <DateTimePicker id={`datetime-size-${size}`} label={`${size.toUpperCase()} 날짜·시간`} size={size} defaultValue="2026-11-12T14:30" minuteStep={15} />
          <DateTimeRangePicker id={`datetime-range-size-${size}`} label={`${size.toUpperCase()} 날짜·시간 범위`} startLabel={`${size.toUpperCase()} 시작 일시`} endLabel={`${size.toUpperCase()} 종료 일시`} size={size} defaultValue={['2026-11-12T09:00', '2026-11-12T17:30']} minuteStep={15} />
        </div>)}
      </div>
    </Section>
    <TemporalFieldFormExample kind="datetime" />
    <DateTimeAPIReference />
  </>;
}
