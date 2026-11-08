import * as React from 'react';
import {Table, TableContainer} from '@idenflu/mono-react';
import {Section} from './demo-layout';
import {publicAPIType, publicAPINote, type APIContracts, type APIPropertyRow} from './public-api';

function ReferenceTable({label, contracts, rows}: {label:string; contracts:APIContracts; rows:readonly APIPropertyRow[]}) {
  return <TableContainer label={label} className="studio-time-reference-table"><Table>
    <caption className="sr-only">{label}: 타입, 기본값과 사용 방법</caption>
    <thead><tr><th scope="col">속성</th><th scope="col">타입</th><th scope="col">기본값</th><th scope="col">설명</th></tr></thead>
    <tbody>{rows.map(([name,initial,description])=><tr key={name}><th scope="row"><code>{name}</code></th><td><code>{publicAPIType(contracts,name)}</code></td><td><code>{initial}</code></td><td>{description}</td></tr>)}</tbody>
  </Table></TableContainer>;
}

export function DateTimeAPIReference() {
  return <Section id="datetime-props" title="속성 · DateTimePicker / DateTimeRangePicker" description="DateTimeValue는 시간대 없는 YYYY-MM-DDTHH:mm 문자열 또는 null입니다. DateTimeRangeValue는 readonly [DateTimeValue, DateTimeValue]입니다.">
    <p className="react-studio-caption">{publicAPINote}</p>
    <ReferenceTable label="Datetime picker 공통 속성" contracts={['DateTimePicker','DateTimeRangePicker']} rows={[
      ['label','필수','입력 이름입니다. 문자열이나 React 노드를 전달하며 입력·팝업의 접근 가능한 이름으로 사용합니다.'],
      ['value / defaultValue','null / [null, null]','단일 값 또는 시작·종료 배열입니다. value는 부모가 제어하고 defaultValue는 최초 비제어 값입니다.'],
      ['onValueChange','undefined','직접 입력의 Enter·포커스 이탈 또는 팝업 확인에서 검증을 통과한 값만 전달합니다. 범위는 두 값을 함께 전달합니다. 팝업에서 선택 중인 값과 취소한 값은 전달하지 않습니다.'],
      ['id / name','자동 ID / undefined','단일 입력의 폼 제출 키는 name입니다. 범위는 name-start와 name-end로 제출합니다. 입력 중인 문자열과 구분되는 확정 값을 제출합니다.'],
      ['min / max','제한 없음','YYYY-MM-DDTHH:mm 형식의 포함 경계입니다. 형식이 잘못되거나 min이 max보다 크면 RangeError가 발생합니다.'],
      ['minuteStep','1','1·5·10·15·20·30·60처럼 60을 나누어떨어지게 하는 양의 정수를 사용합니다. 직접 입력과 팝업 모두 같은 단위로 검증합니다.'],
      ['required / disabled / readOnly','false','필수값, 비활성, 읽기 전용 상태입니다. 비활성 값은 FormData에서 제외하며 읽기 전용 값은 포함합니다.'],
      ['size','md','텍스트 필드와 같은 높이·간격·아이콘 크기 토큰을 사용합니다.'],
      ['helperText / error','undefined','보조 설명과 외부 오류 메시지입니다. error는 문자열이며 내부 오류보다 우선합니다. 실제 입력의 설명과 네이티브 폼 검증에 연결됩니다.'],
      ['ref','undefined','실제 input을 가리킵니다. 범위의 표준 ref는 시작 input입니다. ref.current?.focus()로 오류 포커스를 이동합니다.'],
      ['aria-describedby / aria-invalid','undefined','외부 설명 ID와 도움말·오류 ID를 함께 연결하며 범위는 양쪽 입력에 적용합니다. 내부 오류가 있으면 aria-invalid=true가 우선하며 그 외에는 전달한 값을 유지합니다.'],
      ['className','undefined','최상위 래퍼에 추가할 클래스입니다. 입력·팝업의 스타일 범위를 이 클래스 아래에 제한하세요.'],
    ]} />
    <ReferenceTable label="Datetime range picker 추가 속성" contracts="DateTimeRangePicker" rows={[
      ['startLabel / endLabel',"'시작 일시' / '종료 일시'",'각 입력과 팝업의 시작·종료 단계 이름입니다. 같은 화면에 범위 입력이 여러 개라면 용도가 드러나도록 지정하세요.'],
      ['endInputRef','undefined','종료 input을 가리킵니다. 표준 ref로 시작 입력을, endInputRef로 종료 입력을 각각 제어할 수 있습니다.'],
    ]} />
    <p className="react-studio-caption">UTC 저장이 필요하면 서비스 기준 시간대를 명시해 변환하세요. 비제어 form.reset()은 최초 확정값을 복원하며, 제어형은 부모 값과 오류 상태를 함께 초기화합니다.</p>
  </Section>;
}
