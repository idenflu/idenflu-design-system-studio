import * as React from 'react';
import {Table,TableContainer} from '@idenflu/mono-react';
import {Section} from './demo-layout';
import {MultiSelectTagReference} from './convenience-api-reference';

type Row=readonly [name:string,type:string,initial:string,description:string];
function ReferenceTable({label,rows}:{label:string;rows:readonly Row[]}) {
  return <TableContainer label={label} className="studio-convenience-api-table"><Table density="compact">
    <caption className="sr-only">{label}: 항목, 타입, 기본값과 사용 방법</caption>
    <thead><tr><th scope="col">항목</th><th scope="col">타입</th><th scope="col">기본값</th><th scope="col">설명</th></tr></thead>
    <tbody>{rows.map(([name,type,initial,description])=><tr key={name}><th scope="row"><code>{name}</code></th><td><code>{type}</code></td><td><code>{initial}</code></td><td>{description}</td></tr>)}</tbody>
  </Table></TableContainer>;
}
const fieldProps:readonly Row[]=[
  ['label','ReactNode','필수','입력 이름입니다. 문자열이나 필수·선택 표시를 포함한 React 노드를 전달합니다.'],
  ['id / name','string','자동 ID / undefined','id는 입력·라벨 연결에 사용합니다. name을 지정해야 FormData에 포함됩니다. 범위 필드의 제출 이름은 아래 설명을 확인하세요.'],
  ['required / readOnly / disabled','boolean','false','필수값 검증, 읽기 전용, 비활성 상태입니다. 읽기 전용 값은 제출되며 비활성 값은 FormData에서 제외됩니다.'],
  ['size',"'sm' | 'md' | 'lg'",'기본 크기(md)','높이·여백·아이콘 크기를 같은 토큰으로 관리합니다.'],
  ['helperText / error','ReactNode / string','undefined','도움말과 외부 오류입니다. 내부 형식·범위 오류도 표시하며 외부 error가 우선합니다.'],
  ['className','string','undefined','최상위 래퍼에 클래스를 추가합니다. 내부 선택자는 이 클래스 아래에서 지정하세요.'],
];
const sharedStyles:readonly Row[]=[
  ['size / className','지원 속성','md / undefined','크기는 size, 배치와 필요한 스타일 조정은 className을 먼저 사용합니다.'],
  ['--control-height / --control-px / --icon-size','공유 크기 토큰','현재 크기 토큰','입력 높이·좌우 여백·아이콘 크기입니다. 개별 height를 덮어쓰기보다 sm·md·lg를 함께 맞추세요.'],
  ['--field-background / --surface / --info-surface','공유 색상 토큰','현재 테마','입력·보조 영역·선택 항목의 배경입니다. data-theme="dark"에서도 같은 토큰을 사용합니다.'],
  ['--border-control / --border-control-hover / --focus-on-light / --radius-control','입력 경계 토큰','현재 테마·크기','입력창의 기본·호버·포커스와 모서리를 표현합니다. 카드·구분선에는 --border / --divider를 사용합니다.'],
];

export function SelectAPIReference() {return <>
  <Section id="select-props" title="속성 · Select / SearchSelect / MultiSelect" description="Select와 SearchSelect는 단일 문자열, MultiSelect는 문자열 배열을 사용합니다. 네이티브 select의 모든 속성을 자동으로 전달하는 컴포넌트는 아닙니다.">
    <ReferenceTable label="Select 공통 속성" rows={[
      ['label / hideLabel','string / boolean','필수 / false','label은 숨겨도 접근 가능한 이름으로 유지합니다. hideLabel은 화면의 라벨과 라벨 여백을 제거합니다.'],
      ['options','readonly SelectOption[]','필수','고유하고 안정적인 value를 가진 옵션 목록입니다. 옵션의 세부 구조는 다음 표를 확인하세요.'],
      ['value / defaultValue','string 또는 readonly string[]',"'' / []",'단일 선택은 문자열, 복수 선택은 배열입니다. value는 부모가 제어하고 defaultValue는 비제어 상태의 초기값입니다. 두 방식을 섞지 마세요.'],
      ['name','string','undefined','단일 선택은 하나의 값, 복수 선택은 같은 name의 반복 값으로 제출합니다. 선택하지 않은 복수 값은 제출 항목이 없습니다.'],
      ['placeholder','string',"'선택하세요'",'선택값이 없을 때 표시합니다. label을 대신하지 않습니다.'],
      ['disabled / required','boolean','false','컴포넌트 비활성화 또는 필수값 검증입니다. required는 비활성·빈 value를 제외한 선택이 있어야 통과합니다.'],
      ['size',"'sm' | 'md' | 'lg'",'기본 크기(md)','트리거와 옵션 목록의 높이·여백을 같은 크기 토큰으로 적용합니다.'],
      ['prefixIcon','ReactNode','undefined','값 앞의 장식 아이콘입니다. 입력값이나 제출값에 포함하지 않습니다.'],
      ['popupStrategy',"'absolute' | 'fixed'","'absolute'",'기본은 래퍼 기준 배치입니다. 스크롤·클리핑 컨테이너에서는 fixed로 화면 경계를 따라 배치할 수 있습니다.'],
      ['className','string','undefined','custom-select 래퍼에 추가합니다. 라벨은 이 래퍼 밖에 있습니다.'],
      ['aria-describedby / aria-invalid','string / boolean | "true" | "false"','undefined','외부 도움말·오류 설명과 연결합니다. 이 속성만으로 오류 문구를 만들지는 않으므로 별도 문구도 제공하세요.'],
    ]} />
    <ReferenceTable label="MultiSelect 추가 속성" rows={[
      ['searchable','boolean','false','MultiSelect 옵션 목록에 검색창을 표시합니다. 단일 검색은 SearchSelect를 사용합니다. 검색은 옵션 label의 대소문자를 구분하지 않는 부분 일치입니다.'],
      ['clearable','boolean','false','전체 지우기 버튼을 표시합니다. 태그형은 필드 안에, 기본형은 필드 아래에 표시합니다. 빈 값에서는 비활성화됩니다.'],
      ['presentation',"'default' | 'inline'","'default'",'기본은 선택 라벨 한 줄, inline은 제거 가능한 태그입니다. 표시 개수 옵션은 아래 축약 API를 참고하세요.'],
    ]} />
  </Section>
  <Section id="select-options" title="옵션 · SelectOption" description="표시 문구와 제출값을 분리합니다. 같은 value를 여러 옵션에 사용하지 마세요."><ReferenceTable label="SelectOption" rows={[
    ['value / label','string / string','필수','value는 상태·콜백·폼 제출값이고 label은 화면의 문구입니다. 빈 문자열은 단일 선택의 미선택 값이므로 실제 선택값에는 비어 있지 않은 value를 사용하세요.'],
    ['disabled','boolean','false','선택·키보드 이동에서 제외합니다. 비활성 옵션은 유효한 폼 선택값으로 취급하지 않습니다.'],
    ['description','string','undefined','옵션 목록에만 표시하는 보조 설명입니다. 트리거에는 label만 표시합니다.'],
    ['icon','ReactNode','undefined','장식 아이콘입니다. 목록·단일 선택값·태그형에서 표시하며 의미는 label로 전달합니다.'],
  ]} /></Section>
  <MultiSelectTagReference />
  <Section id="select-events" title="이벤트와 폼 연결" description="선택을 즉시 확정합니다. 별도 확인 버튼이나 onOpenChange 속성은 없습니다."><ReferenceTable label="Select 이벤트와 제출" rows={[
    ['onValueChange','(value: string) => void 또는 (value: string[]) => void','undefined','옵션 선택·해제와 전체 지우기에서 호출합니다. 단일은 선택 후 닫히고 복수는 목록을 유지합니다. 검색어 입력만으로 선택 콜백을 호출하지 않습니다.'],
    ['제어 상태','value + onValueChange','선택 사항','부모 상태를 갱신해야 화면과 선택값이 함께 바뀝니다. 초기화는 부모의 onReset에서도 value를 복원하세요.'],
    ['비제어 상태','defaultValue','선택 사항','컴포넌트가 상태를 관리합니다. form.reset()은 초기 선택을 복원하고 목록·검색어·내부 필수 오류를 초기화합니다.'],
    ['FormData','get(name) / getAll(name)','name 필요','단일은 get, 복수는 getAll로 읽습니다. disabled 필드는 제외됩니다. 태그 축약은 실제 선택 배열과 제출값을 줄이지 않습니다.'],
  ]} /></Section>
  <Section id="select-keyboard" title="키보드" description="검색형은 열리면 검색창에 포커스합니다. 태그·전체 지우기·더 보기 버튼도 Tab으로 조작합니다."><ReferenceTable label="Select 키보드" rows={[
    ['Enter / Space','트리거','열기·닫기','닫힌 트리거를 실행합니다. 목록이 열린 트리거에서 Enter·Space는 활성 옵션을 선택합니다. 검색창의 Space는 검색 문자를 입력합니다.'],
    ['↑ / ↓','트리거·검색창','열기·이동','목록을 열거나 비활성 항목을 건너뛰며 활성 옵션을 이동합니다.'],
    ['Home / End','열린 트리거','처음·마지막','처음 또는 마지막 유효 옵션으로 이동합니다. 검색창에서는 텍스트 커서의 기본 동작을 유지합니다.'],
    ['Escape / Tab','옵션 목록','취소·이동','Escape는 목록을 닫고 트리거로 포커스를 복원합니다. Tab은 목록을 닫고 다음 컨트롤로 이동합니다.'],
  ]} /></Section>
  <Section id="select-styles" title="스타일" description="입력과 팝업은 같은 테마·크기 토큰을 사용합니다."><ReferenceTable label="Select 스타일" rows={[
    ...sharedStyles,
    ['.custom-select / .select-trigger / .select-popup','CSS 선택자','컴포넌트 내부','전체 래퍼·기본 트리거·팝업입니다. className 아래에 범위를 제한해 조정하세요.'],
    ['.select-option / .multi-inline-tags / .multi-inline-more','CSS 선택자','컴포넌트 내부','옵션·태그 영역·축약 버튼입니다. 선택 배열은 CSS로 숨겨진 태그가 아니라 value에서 관리하세요.'],
  ]} /></Section>
</>;}

export function NumberFieldAPIReference() {return <>
  <Section id="number-props" title="속성 · NumberField" description="정밀도 보존을 위해 숫자 값을 number가 아닌 문자열 또는 null로 다룹니다."><ReferenceTable label="NumberField 공통 속성" rows={fieldProps} /><ReferenceTable label="NumberField 숫자 속성" rows={[
    ['value / defaultValue','string | null','null','쉼표·단위가 없는 10진 문자열 또는 빈 값 null입니다. value는 제어 상태, defaultValue는 비제어 초기값입니다.'],
    ['decimals','number','0','허용 소수 자릿수입니다. 정수값은 0~6으로 제한하며 비정수는 0으로 처리합니다. 초과 자릿수는 반올림하지 않고 오류로 표시합니다.'],
    ['min / max','string','제한 없음','경계를 포함하는 허용 범위입니다. 부호와 소수는 가능하며 쉼표·지수 표기는 지원하지 않습니다.'],
    ['step','string',"'1'",'증감 단위입니다. 양수이며 decimals 안에서 표현할 수 있어야 합니다. min·max·step의 잘못된 설정은 RangeError를 발생시킵니다.'],
    ['grouping','boolean','false','표시값에 천 단위 쉼표를 사용합니다. onValueChange의 값에는 쉼표가 없습니다. FormData에는 입력창의 표시 문자열이 들어갑니다.'],
    ['unit / prefixIcon','string / ReactNode','undefined','오른쪽 단위와 왼쪽 장식 아이콘입니다. 단위는 읽기 설명에 연결되며 두 항목 모두 입력값에 합쳐지지 않습니다.'],
    ['selectOnFocus','boolean','false','포커스를 처음 받으면 전체 값을 선택합니다. 이미 포커스된 상태의 커서 이동과 텍스트 드래그 선택은 유지합니다.'],
  ]} /></Section>
  <Section id="number-events" title="이벤트와 값 확정" description="키를 입력할 때의 임시 문자열과 검증을 통과한 확정값을 구분합니다."><ReferenceTable label="NumberField 이벤트" rows={[
    ['onValueChange','(value: string | null) => void','undefined','포커스 이탈·Enter·증감 동작에서 유효한 값을 확정해 전달합니다. 빈 값은 null이며 형식·범위 오류가 있으면 확정하지 않습니다. 입력할 때마다 호출하는 onChange 속성은 제공하지 않습니다.'],
    ['제어 / 비제어','value 또는 defaultValue','선택 사항','value 사용 시 부모 상태를 갱신하세요. 비제어 form.reset()은 초기 표시값을 복원합니다. 제어 초기화는 부모 값과 필요할 경우 예제의 revision key로 임시 입력까지 복원합니다.'],
    ['FormData와 요청 값','표시 문자열 / 확정 문자열','name 필요','grouping일 때 FormData는 12,500.5 같은 문자열입니다. 정확한 금액 요청에는 onValueChange로 보관한 12500.5 문자열을 사용하세요. 큰 정수·금액을 무조건 Number로 변환하지 마세요.'],
    ['증감과 범위','step 단위·경계 포함','—','증감 결과는 min·max 안으로 제한합니다. 직접 입력한 범위 초과값은 자동 보정하지 않고 오류로 표시합니다.'],
  ]} /></Section>
  <Section id="number-keyboard" title="키보드" description="IME 조합 중에는 값 확정과 증감을 실행하지 않습니다."><ReferenceTable label="NumberField 키보드" rows={[
    ['↑ / ↓','입력 필드','step 증감','1 step씩 증감하며 범위 안으로 제한합니다.'],
    ['PageUp / PageDown','입력 필드','10 × step','10 step씩 증감합니다.'],
    ['Enter / 포커스 이탈','입력 필드','검증·확정','형식과 범위를 검증하고 값을 확정합니다. Enter는 폼의 암묵적 제출을 막습니다.'],
    ['Tab / Shift+Tab','입력·증감 버튼','기본 탐색','입력과 사용 가능한 증감 버튼을 이동합니다. readOnly와 disabled는 증감할 수 없습니다.'],
  ]} /></Section>
  <Section id="number-styles" title="스타일" description="텍스트 필드와 동일한 테두리·호버·포커스 토큰을 사용합니다."><ReferenceTable label="NumberField 스타일" rows={[
    ...sharedStyles,
    ['.number-field / .number-field-input / .number-field-stepper','CSS 선택자','컴포넌트 내부','필드·입력·증감 버튼 영역입니다. className이 붙은 외부 래퍼 아래에서 조정하세요.'],
    ['.number-field-prefix / .number-field-unit / .number-field-feedback','CSS 선택자','컴포넌트 내부','아이콘·단위·오류 문구입니다. 값의 단위와 오류 설명 연결을 유지하세요.'],
  ]} /></Section>
</>;}

export function DatePickerAPIReference() {return <>
  <Section id="date-props" title="속성 · DatePicker / DateRangePicker" description="시간대 없는 날짜 문자열을 사용합니다. Date 객체나 타임스탬프를 직접 전달하지 않습니다."><ReferenceTable label="Date picker 공통 속성" rows={fieldProps} /><ReferenceTable label="Date picker 날짜 속성" rows={[
    ['value / defaultValue','DateValue 또는 DateRangeValue','null / [null, null]','단일 DateValue는 YYYY-MM-DD 문자열 또는 null입니다. 범위 DateRangeValue는 readonly [DateValue, DateValue]입니다. value는 부모 제어, defaultValue는 비제어 초기값입니다.'],
    ['min / max','string','제한 없음','YYYY-MM-DD 형식의 포함 경계입니다. 잘못된 날짜·형식 또는 min > max는 RangeError를 발생시킵니다.'],
    ['startLabel / endLabel','string',"'시작일' / '종료일'",'DateRangePicker의 각 입력 이름입니다. 같은 페이지에 기간 선택이 여러 개라면 용도가 드러나는 라벨을 지정하세요.'],
    ['name','string','undefined','단일은 name으로, 범위는 name-start와 name-end 두 항목으로 제출됩니다. 예: name="trip" → trip-start / trip-end.'],
  ]} /></Section>
  <Section id="date-events" title="이벤트와 날짜 처리" description="직접 입력과 달력 선택 모두 같은 날짜·범위 검증을 사용합니다."><ReferenceTable label="Date picker 이벤트" rows={[
    ['onValueChange','(value: DateValue) => void 또는 (value: DateRangeValue) => void','undefined','직접 입력은 Enter·포커스 이탈 시 정규화해 확정합니다. 유효하지 않은 날짜·범위는 오류를 표시하고 확정하지 않습니다.'],
    ['기간의 중간 상태','[시작일, null]','첫 날짜 선택','달력에서 첫 날짜를 선택해도 콜백이 발생합니다. 종료일을 고르면 완성된 범위를 전달하며 먼저 고른 날짜보다 이르면 순서를 정리합니다. required 범위는 두 날짜가 있어야 제출할 수 있습니다.'],
    ['달력 선택·지우기','즉시 반영','—','단일 날짜와 완성된 범위는 선택 즉시 반영합니다. 별도 확인·취소 단계가 없으며, Escape·바깥 클릭은 이미 반영한 선택을 되돌리지 않습니다. 지우기는 null 또는 [null, null]을 전달합니다.'],
    ['입력 형식','날짜 문자열','—','YYYY-MM-DD 외에 8자리 숫자와 점·슬래시 구분 입력도 허용하며 확정값은 YYYY-MM-DD입니다. API의 min·max는 표준 형식만 사용합니다.'],
    ['FormData / 초기화','get(name) / form.reset()','name 필요','FormData는 현재 입력 문자열이며 빈 값은 빈 문자열입니다. 요청에서는 부모의 확정값을 사용해 null을 구분하세요. 비제어는 초기값으로 복원하고, 제어는 부모 상태와 필요시 revision key를 함께 초기화합니다.'],
    ['시간대 변환','YYYY-MM-DD','날짜 전용','날짜만 저장한다면 문자열을 유지하세요. UTC를 뜻하는 Z를 붙이거나 Date로 바꿔 날짜가 이동하지 않도록 합니다. 일시 입력이 필요하면 Datetime picker를 사용하세요.'],
  ]} /></Section>
  <Section id="date-keyboard" title="키보드" description="달력 버튼을 실행하면 선택 날짜 또는 현재 기준 날짜에 포커스합니다."><ReferenceTable label="Date picker 키보드" rows={[
    ['Enter','날짜 입력','정규화·확정','입력한 날짜를 검증·확정하고 폼의 암묵적 제출을 막습니다.'],
    ['Enter / Space','달력 버튼·날짜 버튼','열기·선택','달력을 열거나 포커스된 날짜를 선택합니다.'],
    ['← / → · ↑ / ↓','달력 날짜','하루·한 주','하루 또는 한 주 단위로 이동하며 허용 범위를 따릅니다.'],
    ['Home / End','달력 날짜','주 처음·끝','일요일 또는 토요일로 이동합니다.'],
    ['PageUp / PageDown · Shift','달력 날짜','월·연도 이동','한 달씩 이동하며 Shift와 함께 누르면 1년씩 이동합니다.'],
    ['Escape / Tab','달력','닫기·기본 탐색','Escape는 달력을 닫고 달력 열기 버튼으로 포커스를 복원합니다. Tab은 입력·달력 컨트롤의 기본 순서를 따릅니다.'],
  ]} /></Section>
  <Section id="date-styles" title="스타일" description="단일 선택과 범위 선택은 동일한 테마·크기 토큰을 공유합니다."><ReferenceTable label="Date picker 스타일" rows={[
    ...sharedStyles,
    ['.date-picker / .date-field / .date-range-fields','CSS 선택자','컴포넌트 내부','래퍼·단일 필드·통합 범위 필드입니다. className 아래에서 지정하세요.'],
    ['.date-popup / .calendar-day / .is-in-range / .is-preview-range','CSS 선택자','컴포넌트 내부','달력·날짜·확정 범위·마우스 또는 키보드 이동 중인 범위 미리보기입니다. 선택 상태와 포커스는 함께 구분되도록 유지하세요.'],
  ]} /></Section>
</>;}
