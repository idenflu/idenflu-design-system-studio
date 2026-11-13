import * as React from 'react';
import { Grid, Button, Table, TableContainer, TimePicker, type TimeValue } from '@idenflu/mono-react';
import { Section } from './demo-layout';
import {publicAPIType, publicAPINote, type APIContracts} from './public-api';
import {TemporalFieldFormExample} from './temporal-field-form-example';

const props = [
  ['label', '필수', '입력 필드의 라벨입니다. 팝업과 선택 버튼의 접근 가능한 이름에도 사용합니다.'],
  ['value / defaultValue', 'null', 'TimeValue는 24시간 형식의 HH:mm 문자열 또는 null이며 초 선택 시 HH:mm:ss입니다. value가 있으면 부모가 상태를 관리하고 defaultValue는 처음에만 적용합니다.'],
  ['onValueChange', 'undefined', '직접 입력의 Enter·포커스 이탈 또는 팝업 확인에서 검증을 통과한 시간 문자열이나 null을 전달합니다.'],
  ['min / max', '제한 없음', 'HH:mm 형식의 시작·종료 시각입니다. 초 선택 시 HH:mm:ss도 지원하며 HH:mm은 초를 00으로 보완합니다. 경계를 포함하고 같은 날의 범위만 지원합니다.'],
  ['showSeconds', 'false', '초 선택을 켜면 HH:mm:ss 형식으로 표시하고 제출합니다. HH:mm 입력은 초를 00으로 보완합니다.'],
  ['secondStep', '1', '초 선택과 직접 입력의 단위입니다. 60을 나누어떨어지게 하는 양의 정수를 지정합니다.'],
  ['minuteStep', '1', '분 선택과 직접 입력의 단위입니다. 1·5·10·15·20·30·60처럼 60을 나누어떨어지게 하는 양의 정수를 지정합니다.'],
  ['id / name', '자동 ID / undefined', '입력 ID와 폼 제출 키입니다. 폼에는 확정된 시간 값을 제출하며 빈 값은 빈 문자열입니다.'],
  ['required', 'false', '빈 값의 확정을 막고 폼 검증에서 입력을 요구합니다.'],
  ['disabled / readOnly', 'false', '입력과 팝업 조작을 막습니다. disabled 값은 폼 제출에서도 제외합니다.'],
  ['size', 'md', '기존 텍스트필드와 같은 높이·간격 기준을 적용합니다.'],
  ['helperText / error', 'undefined', '보조 설명 또는 부모 폼의 오류 메시지입니다. 오류는 입력 설명과 네이티브 폼 검증에 연결합니다.'],
  ['ref', 'undefined', '실제 input을 가리킵니다. ref.current?.focus()로 오류가 있는 입력이나 원하는 필드로 이동할 수 있습니다.'],
  ['aria-describedby / aria-invalid', 'undefined', '외부 설명 ID와 도움말·오류 ID를 함께 연결합니다. 내부 오류가 있으면 aria-invalid=true가 우선하며 오류가 없을 때는 외부 값을 유지합니다.'],
  ['className', 'undefined', '외곽 래퍼에 추가할 CSS 클래스입니다. 공유 토큰이나 하위 요소 스타일을 이 클래스 아래에서 조정합니다.'],
] as const;

function ReferenceTable({label, rows, contracts}: {label:string; rows:readonly (readonly [string,string,string])[]; contracts?:APIContracts}) {
  return <TableContainer label={label} className="studio-time-reference-table"><Table>
    <caption className="sr-only">{label}</caption>
    <thead><tr><th scope="col">항목</th><th scope="col">{contracts ? '타입' : '타입 · 기본값'}</th>{contracts && <th scope="col">기본값</th>}<th scope="col">설명</th></tr></thead>
    <tbody>{rows.map(([name,typeOrInitial,description])=><tr key={name}><th scope="row"><code>{name}</code></th><td><code>{contracts ? publicAPIType(contracts,name) : typeOrInitial}</code></td>{contracts && <td><code>{typeOrInitial}</code></td>}<td>{description}</td></tr>)}</tbody>
  </Table></TableContainer>;
}

export function TimePickerDemos() {
  const [time,setTime] = React.useState<TimeValue>('09:30');
  const [message,setMessage] = React.useState('');
  return <>
    <Section title="시간 선택" description="날짜 없이 시·분만 선택합니다. 패널에서 고른 시간은 확인을 눌러야 반영되고 취소하면 확정된 값은 유지됩니다.">
      <div className="react-studio-stack" style={{maxWidth:360}}>
        <TimePicker id="time-basic" label="시작 시간" name="startTime" value={time} onValueChange={setTime} minuteStep={15} helperText="15분 단위로 선택하거나 HH:mm 형식으로 직접 입력하세요." />
        <TimePicker id="time-entry" label="직접 입력" helperText="9:05 또는 0905를 입력한 뒤 Enter를 누르면 09:05로 정리합니다." />
      </div>
      <p role="status" className="component-helper">확정된 시간: {time ?? '선택하지 않음'}</p>
    </Section>
    <Section title="범위와 분 단위" description="선택 목록과 직접 입력에 같은 범위·분 단위 검증을 적용합니다. 허용되지 않는 시간은 비활성으로 표시합니다.">
      <Grid columns={{base:1,sm:2}} rowGap={6} columnGap={8} alignItems="start" className="react-studio-field-grid">
        <TimePicker id="time-bounded" label="예약 가능 시간" min="09:00" max="18:00" defaultValue="10:30" minuteStep={30} helperText="09:00–18:00 사이에서 30분 단위로 선택합니다." />
        <TimePicker id="time-hourly" label="정각 시간" defaultValue="14:00" minuteStep={60} helperText="분은 00만 선택할 수 있습니다." />
      </Grid>
    </Section>
    <Section title="초 선택" description="초 선택을 켜면 시·분·초를 같은 너비의 패널에서 선택합니다.">
      <div className="react-studio-stack" style={{maxWidth:360}}>
        <TimePicker id="time-seconds" label="초 단위 시간" name="preciseTime" showSeconds secondStep={5} defaultValue="09:30:15" min="09:00:10" max="18:00:50" helperText="5초 단위로 선택하거나 HH:mm:ss 형식으로 입력하세요." />
      </div>
    </Section>
    <Section title="입력 상태" description="읽기 전용·비활성·부모 오류 메시지를 기존 필드와 같은 방식으로 표시합니다.">
      <Grid columns={{base:1,sm:2}} rowGap={6} columnGap={8} alignItems="start" className="react-studio-field-grid">
        <TimePicker label="읽기 전용 시간" defaultValue="09:30" readOnly />
        <TimePicker label="비활성 시간" defaultValue="09:30" disabled />
        <TimePicker label="오류 상태" defaultValue="08:30" error="운영 시간 안에서 선택해주세요." />
      </Grid>
    </Section>
    <Section title="폼 입력과 초기화" description="필수 입력을 검증하고 확정된 시간만 폼에 제출합니다. 초기화하면 최초 기본값으로 돌아갑니다.">
      <form className="react-studio-stack" style={{maxWidth:360}} onReset={()=>setMessage('')} onSubmit={event=>{
        event.preventDefault();
        setMessage(`${new FormData(event.currentTarget).get('notificationTime')}에 알림을 예약했습니다.`);
      }}>
        <TimePicker id="time-required" label="알림 시간" name="notificationTime" required minuteStep={15} helperText="시간을 선택하거나 0915처럼 입력해주세요." />
        <div className="react-studio-row"><Button type="submit">예약하기</Button><Button type="reset" variant="outline">초기화</Button></div>
        <p role="status" className="component-helper">{message}</p>
      </form>
    </Section>
    <Section title="사이즈" description="SM·MD·LG 필드에 같은 시간 선택 동작을 제공합니다.">
      <Grid columns={{base:1,sm:3}} gap={6} alignItems="start" className="react-studio-size-grid">{(['sm','md','lg'] as const).map(size=><TimePicker key={size} label={`${size.toUpperCase()} 시간`} size={size} defaultValue="14:30" minuteStep={15} />)}</Grid>
    </Section>
    <TemporalFieldFormExample kind="time" />
    <Section title="속성" description="시간은 날짜·시간대 변환 없이 HH:mm 또는 초 선택 시 HH:mm:ss 문자열로 주고받습니다. 빈 값은 null입니다.">
      <p className="react-studio-caption">{publicAPINote}</p>
      <ReferenceTable label="Time picker 속성" contracts="TimePicker" rows={props} />
      <p className="react-studio-caption">min은 max보다 늦을 수 없습니다. 자정을 넘는 기간은 날짜를 포함하는 Datetime picker를 사용하세요. minuteStep이 범위와 맞지 않아 선택할 시간이 없으면 확인을 비활성으로 표시합니다.</p>
    </Section>
    <Section title="이벤트와 키보드" description="제어형 value를 사용하면 onValueChange에서 부모 상태를 갱신하세요.">
      <ReferenceTable label="Time picker 이벤트" rows={[
        ['onValueChange','(value: TimeValue) => void','직접 입력의 Enter·포커스 이동 또는 패널 확인에서 검증을 통과한 변경값을 전달합니다. 필수 입력이 아닐 때 비우면 null을 전달합니다.'],
        ['확인 / 취소','패널 동작','확인 전에는 값과 폼 제출값이 바뀌지 않습니다. 취소·Escape·바깥 클릭은 선택 중인 변경을 버립니다.'],
        ['Alt + ↓','입력 필드','시간 선택 패널을 열고 현재 시각의 시 옵션으로 포커스를 옮깁니다.'],
        ['↑ / ↓ · Home / End · PageUp / PageDown','시·분·초 목록','허용된 항목 사이를 이동합니다. Home·End는 처음·끝, PageUp·PageDown은 5개 항목씩 이동합니다.'],
        ['Tab / Escape','시간 선택 패널','Tab으로 시·분·초·취소·확인을 탐색합니다. Escape로 취소하면 선택 버튼으로 돌아갑니다.'],
      ]} />
    </Section>
    <Section title="스타일" description="size와 className으로 크기와 배치를 정하고, 기존 입력·팝업·목록의 디자인 토큰을 공유합니다.">
      <ReferenceTable label="Time picker 스타일" rows={[
        ['.time-picker / .time-field / .time-popup','className 아래에서 지정','입력 래퍼·필드·시간 패널을 조정합니다. 팝업의 기본 너비는 280px이며 화면 안으로 제한합니다.'],
        ['--control-height / --control-px','공유 크기 토큰','입력 높이와 좌우 여백입니다. SM·MD·LG를 먼저 적용하세요.'],
        ['--field-background / --surface / --info-surface','공유 색상 토큰','기본 배경·보조 배경·선택된 시간의 배경입니다. 라이트·다크 테마를 함께 따릅니다.'],
        ['--border / --radius-control / --focus-on-light','공유 테두리·포커스 토큰','필드·팝업의 테두리, 모서리, 키보드 포커스 표시입니다.'],
      ]} />
      <div className="react-studio-code" role="region" aria-label="Time picker 스타일 코드" tabIndex={0}><pre><code>{`.schedule-time { max-width: 320px; }
.schedule-time .time-popup { --radius-control: 8px; }`}</code></pre></div>
    </Section>
  </>;
}

export const timePickerUsage = `import { useState } from 'react';
import { TimePicker, type TimeValue } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function ScheduleTime() {
  const [time, setTime] = useState<TimeValue>('09:30');

  return <TimePicker label="시작 시간" name="startTime"
    value={time} onValueChange={setTime}
    min="09:00" max="18:00" minuteStep={15}
    className="schedule-time" size="md" required
    helperText="09:00–18:00, 15분 단위로 선택해주세요." />;
}`;
