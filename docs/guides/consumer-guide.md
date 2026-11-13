# React 프로젝트에 적용하기

컴포넌트는 `@idenflu/mono-react` 패키지로 제공합니다. [패키지 설치](../../packages/idenflu-mono-react/README.md)와 [컴포넌트 API](../reference/react-components.md)를 확인하고 앱 진입점에서 스타일을 한 번 불러옵니다.

```tsx
import { useState } from 'react';
import { Button, Select } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css'; // 기존 앱의 전역 스타일을 유지하는 컴포넌트 CSS

export function Settings() {
  const [team, setTeam] = useState('design');
  return <>
    <Select label="담당 팀" name="team" value={team} onValueChange={setTeam}
      options={[
        { value: 'design', label: '디자인' },
        { value: 'engineering', label: '개발' },
      ]} />
    <Button onClick={() => setTeam('design')}>선택 초기화</Button>
  </>;
}
```

## 이전 HTML 구현에서 전환하기

HTML 소비자용 `IdenfluMono` 런타임과 바닐라 어댑터는 제거했습니다. 기존 `<script>` 로드와 `IdenfluMono.init/get/destroy` 호출을 제거하고 React 컴포넌트를 렌더링합니다. 컴포넌트가 unmount될 때 내부 리스너와 타이머를 정리합니다.

| 이전 HTML API | React 적용 |
| --- | --- |
| `[data-select]`, `[data-search-select]`, `[data-multiselect]` | `Select`, `SearchSelect`, `MultiSelect` |
| `getValue()` / `setValue()` | 앱의 `value` 상태와 `onValueChange` |
| `selectchange`, `multiselectchange`, `datechange`, `numberchange` | 해당 컴포넌트의 `onValueChange` 콜백 |
| `[data-date-picker]`, `[data-number-field]` | `DatePicker`, `DateRangePicker`, `NumberField` |
| `datevalidation` DOM 이벤트 | 날짜 컴포넌트의 `error` prop과 폼 검증 |
| `[data-data-state]` | `DataState`, `useDataState` |
| `[role=tablist]`, `.segmented-control`, `[data-disclosure-tree]` | `Tabs`, `Segmented`, `Tree` |
| `reset()` / `destroy()` | 앱 상태 초기화 / React unmount |

선택 컴포넌트는 `defaultValue`로 비제어 방식으로 사용할 수도 있습니다. 날짜는 `YYYY-MM-DD` 또는 `null`, 기간은 두 날짜의 배열이며, 숫자는 정밀도를 보존하는 문자열을 사용합니다. `TimePicker`의 시간값은 날짜·시간대가 없는 `HH:mm` 또는 `null`이며 `showSeconds`를 켜면 `HH:mm:ss` 형식입니다. `TextField`와 같은 네이티브 입력 래퍼는 일반 React `onChange`를 받습니다. React 콜백의 값 형식과 지원 속성은 패키지 문서를 기준으로 확인합니다.

## 폼의 도움말·오류·포커스 연결

`TextField`, `Select`, `SearchSelect`, `MultiSelect`는 `helperText`로 도움말을, `error`로 부모 폼의 검증 메시지를 받습니다. 전달한 메시지는 컨트롤의 접근 가능한 설명에 연결되며, `error`가 있으면 오류 경계와 `aria-invalid`도 함께 적용합니다. 선택 컴포넌트의 기존 `aria-describedby`는 도움말·오류 ID와 함께 유지됩니다.

`ref`는 실제 조작 요소를 가리킵니다. `TextField`·`SearchSelect`는 `HTMLInputElement`, `Select`·`MultiSelect`는 `HTMLButtonElement`이므로 `ref.current?.focus()`로 첫 오류 항목에 포커스를 옮길 수 있습니다. 태그형 `MultiSelect`도 옵션을 여는 버튼을 가리킵니다.

외부 `error`는 부모가 관리합니다. 입력값을 수정하거나 폼을 초기화할 때 부모의 오류 상태도 함께 갱신하세요. 선택 컴포넌트는 외부 오류 메시지를 우선 표시하고, 외부 오류가 없으면 기존 `required` 검증 안내를 사용합니다. 제출 가능 여부는 앱의 검증 로직과 네이티브 `required` 조건이 결정합니다. 컴포넌트 화면의 **Select → 도움말과 오류 연결**에서 검증·초기화·포커스 이동 예제를 확인할 수 있습니다.

## 테마와 크기 조정

다크 테마는 문서 루트에 `data-theme="dark"`를 지정합니다. 앱이 테마 선택과 저장을 관리하며 CSS는 함께 배포하는 폰트·아이콘을 상대 경로로 참조합니다.

문서 상단 **화면 조정 → CSS 복사**로 현재 설정의 CSS 변수를 가져와 패키지 스타일 뒤에 적용할 수 있습니다.

```css
:root {
  --font-size-base: 16px;
  --line-height-base: 24px;
  --space-unit: 5px;
  --control-base-height: 42px;
  --radius-control: 4px;
}
```

문서의 화면 조정 UI와 개인 저장값은 재사용 React 컴포넌트 패키지에 포함되지 않습니다. 실제 데이터 조회·서버 저장·파일 전송·예약 동작은 앱에서 연결합니다.

## 스타일 적용 범위

- `styles.css`: 토큰·폰트·컴포넌트 스타일. 기존 본문·제목·링크·일반 입력의 스타일을 유지합니다.
- `tokens.css`: CSS 변수만 사용하려는 경우.
- `reset.css`: 앱 전체에 mono 기본 타이포그래피·배경·여백 초기화를 적용하는 선택 항목. 사용한다면 `styles.css`보다 먼저 가져옵니다.

문서 스튜디오는 전역 초기화와 문서 전용 레이아웃을 별도로 합칩니다. 패키지 소비 앱에는 스튜디오 CSS를 가져오지 않습니다.
