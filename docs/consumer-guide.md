# 프로젝트에 적용하기

## 배포 폴더와 로드 순서

`npm run build`를 실행하고 `dist/systems/idenflu-mono/`를 에셋과 함께 복사합니다. `manifest.json`의 `files.styles`, `files.runtime`, `files.theme`가 실제 해시 파일명입니다. 아래 경로를 manifest 값으로 바꾸세요.

```html
<script src="/design-system/theme.HASH.js"></script>
<link rel="stylesheet" href="/design-system/idenflu-mono.HASH.css" />
<script src="/design-system/idenflu-mono.HASH.js" defer></script>
```

폰트·아이콘은 CSS 파일 기준 `./assets/`에 있어야 합니다. 테마 스크립트는 시스템 색상 설정과 저장된 모드 선택을 적용합니다. 호스트 앱이 테마를 직접 관리한다면 생략하고 `<html data-theme="light|dark">`를 설정할 수 있습니다.

소스 파일을 직접 사용할 때는 `runtime.js`를 어댑터들보다 먼저 읽습니다. 실제 최소 구성은 [독립 소비 예제](../tests/runtime-fixture.html)를 참고하세요. `component-demos.js`, `additional.js`, 폼·페이지 예제, 문서 내비게이션은 소비 런타임에 포함되지 않습니다.

## 초기화와 해제

```js
const root = document.querySelector('#settings');
IdenfluMono.init(root); // root 자신과 하위 요소, 반복 호출 가능
const select = IdenfluMono.get(root.querySelector('[data-select]'));
select.setValue('design');
select.setValue('engineering', { emit: false });
console.log(select.getValue());
select.reset(); // 최초 마운트 값으로 복원, 이벤트 미발행
IdenfluMono.destroy(root); // DOM 제거 전에 리스너·타이머·observer 정리
root.remove();
```

마크업이 최초 파싱될 때 어댑터가 자동 초기화합니다. 이후 추가한 DOM은 `init(root)`를 호출합니다. `get()`은 대상이나 가장 가까운 상위 컴포넌트의 컨트롤러를 반환하며 없으면 `null`입니다. `destroy()` 후 다시 `init()`할 수 있고 재마운트 당시 값이 새 초기값이 됩니다. 같은 인스턴스 안에서 옵션을 교체할 때도 먼저 해제한 후 초기화합니다. 런타임은 제거된 DOM을 자동 탐지하지 않습니다.

`setValue`는 기본적으로 이벤트를 발행합니다. 존재하지 않거나 비활성인 옵션, 잘못된 날짜·숫자는 거부하고 이전값을 보존합니다. 네이티브 폼의 `reset`은 입력 어댑터의 초기 상태를 복원합니다. 데이터 상태·툴팁처럼 폼 값이 아닌 컨트롤은 컨트롤러 `reset()`을 직접 호출합니다.

## 값과 이벤트

모든 사용자 이벤트는 컴포넌트 루트에서 버블링합니다. DOM의 `input.value`를 직접 바꾸는 것만으로 컨트롤러 상태가 갱신되지는 않습니다. 앱 코드는 공개 API를 사용하세요.

| 타입 / 마크업 | 값 | 이벤트와 detail |
| --- | --- | --- |
| `select` / `[data-select]` | 문자열, 미선택 `''` | `selectchange`: `{value, label}` |
| `search-select` / `[data-search-select]` | 문자열, 미선택 `''` | `selectchange`: `{value, label}` |
| `multiselect` / `[data-multiselect]` | 문자열 배열 | `multiselectchange`: `{values, labels}` |
| `segmented` / `.segmented-control` | `data-value`, value 또는 라벨 문자열 | `segmentedchange`: `{value, label}` |
| `tabs` / `[role=tablist]` | `data-value` 또는 탭 id | `tabchange`: `{value, previousValue, tab, panel}` |
| `disclosure-tree` / `[data-disclosure-tree]` | 선택 항목 값 또는 null | `treechange`: `{value, label, item}` |
| `date-picker` / `[data-date-picker]` | 단일 ISO 날짜 또는 null, 기간은 두 값 배열 | `datechange`: `{value}` |
| `number-field` / `[data-number-field]` | 정확한 10진 문자열 또는 null | `numberchange`: `{value, numberValue}` |
| `data-state` / `[data-data-state]` | `{status, items, query, count, error}` | `datastatechange`: 같은 스냅숏 |
| `tooltip` / `.tooltip-wrap` | 표시 가능 여부(boolean) | 값 변경 이벤트 없음 |

Select·검색·멀티 선택기는 `open()` / `close()`도 제공합니다. Date는 `setValue`에 ISO 문자열이나 유효한 Date를 받습니다. 숫자 API는 정확한 문자열을 권장하며 안전하지 않은 Number 인수를 거부합니다. `numberValue`는 안전하게 표현할 수 있을 때만 Number이고 나머지는 null입니다. 저장·금액 계산에는 문자열 `value`를 사용하세요.

한 동작에서 표시 input의 `change`, hidden 값의 `change`, 의미 이벤트가 함께 발생할 수 있습니다. 서버 저장·분석 이벤트는 이 표의 의미 이벤트 하나를 구독하고 중복 구독하지 않습니다. 프로그램으로 조용히 갱신할 때는 `{emit:false}`를 사용합니다.

## 크기와 상태

문서 상단의 **화면 조정 → CSS 복사**로 0.3.0 이상의 컴포넌트 CSS에 적용할 기본 변수를 가져올 수 있습니다. 스타일시트 뒤에 다음과 같이 덮어씁니다.

```css
:root {
  --font-size-base: 16px;
  --line-height-base: 24px;
  --space-unit: 5px; /* 기본 4px의 125% */
  --control-base-height: 42px;
  --radius-control: 4px;
}
```

캡션·제목과 sm/md/lg, 컨트롤 패딩·간격은 이 값에서 계산합니다. 단일 행 컨트롤의 행간은 본문과 분리해 잘림을 방지합니다. 원형 라디오·스위치·아바타는 형태를 유지합니다. 문서용 조정 UI와 개인 저장값은 portable runtime에 포함되지 않습니다. `manifest.files.preferences`는 문서가 사용하는 별도 초기 설정 스크립트입니다.

`data-size="sm|md|lg"`를 컴포넌트나 컨테이너에 지정합니다. 기본 높이는 32/38/44px이고 기본 크기는 md입니다. 태그 선택기가 여러 줄로 줄바꿈하면 높이가 늘어납니다. 기본 본문은 14/22px, 보더는 `#C6C6CC`, 모서리는 0px입니다.

- `disabled`: 네이티브 속성 또는 선택 옵션 `aria-disabled=true`. 사용자 입력과 API 선택에서 제외됩니다.
- `readonly`: 텍스트·숫자 입력을 읽고 복사할 수 있게 합니다. 값 선택 컨트롤에 지원되지 않는 readonly 속성을 붙이지 마세요.
- 오류: 텍스트와 `aria-invalid`, 오류 id 참조, 보더를 함께 갱신합니다. disabled·readonly와 오류는 서로 다른 상태입니다.
- loading: 영향을 받는 영역에 `aria-busy`, 상태 문구를 제공합니다. 장식 스피너는 `aria-hidden=true`를 사용합니다.

폼 날짜 오류는 input에 `datevalidation` 이벤트로 전달할 수 있습니다. `detail`은 `{message, errorId}`이며 `bubbles:true`, `cancelable:true`로 생성합니다. 컴포넌트가 이벤트를 취소하면 날짜 자체 오류와 폼 오류를 합쳐 ARIA·보더를 관리한 것이므로 앱은 같은 속성을 덮어쓰지 않습니다. 오류를 해제할 때도 빈 message를 전달하세요. 날짜 선택·지우기 이벤트를 구독해 폼의 required 검증을 다시 실행합니다.

폼 예제의 예산·참석 인원 검증은 소수·지수 표기 없이 안전정수 범위의 10진 정수만 허용합니다. Number field 자체는 소수 최대 6자리와 큰 정확한 문자열을 지원합니다. 둘의 용도와 허용 범위를 구별하세요.

## 데이터 상태와 실제 서비스 연결

```js
const list = IdenfluMono.get(document.querySelector('[data-data-state]'));
list.setValue({ status: 'loading' });
// 성공: list.setValue({ status: 'success', items: serverItems, query: '' });
// 실패: list.setValue({ status: 'error', error: '조회하지 못했습니다.' });
list.setQuery('디자인');
```

`load({outcome:'success|empty|error', delay:300})`는 네트워크 없이 동작하는 로컬 mock입니다. 실제 요청·취소·권한·페이지네이션은 앱에서 연결합니다. 오류/대기 중 기존 데이터와 필터를 보존하고, 최초 빈 목록과 검색 0건의 행동을 구분하세요. `destroy()`는 진행 중인 mock 조회를 취소합니다.

## 지원 범위

버튼·기본 입력·체크박스·라디오·스위치·badge·progress·card는 네이티브 HTML/CSS 조합입니다. Dialog·Drawer는 네이티브 `dialog.showModal()/close()`와 앱 이벤트를 조합합니다. 문서의 저장 결과·드롭다운 행동·파일 업로드·토스트·페이지 예제 데이터가 자동으로 서비스 기능이 되지는 않습니다. 각 컴포넌트 문서의 구조·키보드·상태·HTML 예제를 함께 확인하세요.

Tree는 네이티브 details/summary 기반 disclosure 목록입니다. ARIA treeview의 단일 Tab 진입과 방향키 모델을 제공한다고 가정하지 않습니다. 동적 작업 탭처럼 앱이 별도 관리하는 tablist에는 `data-tabs-managed`를 지정해 일반 Tabs 초기화에서 제외할 수 있습니다.
