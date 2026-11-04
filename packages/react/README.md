# @idenflu/mono-react

idenflu mono 디자인 시스템의 React 컴포넌트와 스타일입니다. React와 React DOM 18.3.1 또는 19가 필요합니다.

## 라이선스

이 패키지의 자체 제작 소프트웨어는 [MIT 라이선스](https://github.com/idenflu/idenflu-design-system-studio/blob/main/LICENSE)에 따라 상업적 용도를 포함해 사용할 수 있습니다. 소프트웨어의 복사본이나 상당 부분을 배포할 때 저작권 표시와 라이선스 문구를 포함해야 합니다. 함께 제공되는 서드파티 자료에는 각각의 라이선스가 적용됩니다.

## 설치

GitHub Packages에서 `@idenflu` 범위를 사용하도록 프로젝트의 `.npmrc`에 설정합니다.

```ini
@idenflu:registry=https://npm.pkg.github.com
```

공개 패키지도 GitHub Packages 인증이 필요합니다. 패키지 접근 권한이 있는 계정에서 **개인 액세스 토큰(classic)**을 만들고 설치에 필요한 최소 `read:packages` 권한을 지정합니다. Fine-grained 토큰은 이 npm 레지스트리 인증에 사용할 수 없습니다. [GitHub Packages 인증 안내](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)를 참고하세요.

```sh
npm login --scope=@idenflu --registry=https://npm.pkg.github.com --auth-type=legacy
npm install @idenflu/mono-react
```

로그인할 때 Username에는 GitHub 계정명, Password에는 위 토큰을 입력합니다. 인증정보는 개인 `~/.npmrc`에서 관리하고, 프로젝트에 공유하는 `.npmrc`에는 위 레지스트리 범위 설정만 넣습니다. CI에서는 토큰을 저장소 시크릿에 보관하고 환경변수로 전달합니다.

## 사용

앱의 진입점에서 스타일을 한 번 불러옵니다. `styles.css`는 디자인 토큰·폰트·컴포넌트 클래스만 포함하며 기존 페이지의 본문·제목·링크·일반 폼 요소는 바꾸지 않습니다. 함께 배포되는 글꼴과 아이콘을 상대 경로로 참조합니다.

```tsx
import '@idenflu/mono-react/styles.css';
import { Button, TextField } from '@idenflu/mono-react';

export function Example() {
  return (
    <div>
      <TextField label="프로젝트 이름" defaultValue="idenflu" />
      <Button>저장</Button>
    </div>
  );
}
```

앱 전체에 mono의 전역 기본 스타일을 적용하려면 `reset.css`를 **먼저** 선택적으로 불러옵니다. 이 파일은 본문 글꼴·배경, 요소 여백과 링크 스타일을 초기화합니다. 기존 앱에 컴포넌트만 추가할 때는 생략합니다.

```tsx
import '@idenflu/mono-react/reset.css'; // 선택 사항: 앱 전체에 적용
import '@idenflu/mono-react/styles.css';
```

CSS 변수만 필요한 경우에는 `@idenflu/mono-react/tokens.css`를 사용합니다. 문서 스튜디오의 레이아웃과 예시 CSS는 패키지에 포함하지 않습니다.

스타일의 색상·크기는 `--font-size-base`, `--line-height-base`, `--space-unit`, `--control-base-height`, `--radius-control` CSS 변수로 조정할 수 있습니다. 다크 테마는 문서 루트에 `data-theme="dark"`를 설정합니다.

## 아이콘

`Icon`은 현재 글자색을 따르는 SVG 마스크를 사용하며 전체 100종을 SVG 파일명 그대로 지원합니다. `name`의 타입은 `IconName`으로 내보냅니다. 기존 `plus`, `trash`, `list`, `email`, `eye`, `eye-slash`, `caret` 별칭도 유지합니다. 크기는 `--icon-size`로 조정합니다.

이번 추가는 탐색·편집·협업·차트·커머스에 쓰는 Outline 32종과 Filled 20종입니다. Outline은 기존의 24×24 기준, 1.5px 선과 각진 선 끝을 유지합니다. Filled는 `-fill` 접미사로 선택하며 모든 아이콘에 Filled가 있는 것은 아닙니다.

```tsx
import { useState } from 'react';
import { Button, Icon, IconButton } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function IconActions() {
  const [bookmarked, setBookmarked] = useState(false);
  return <div>
    <Button><Icon name="save" />저장</Button>
    <IconButton label="북마크" variant="outline" aria-pressed={bookmarked}
      onClick={() => setBookmarked(value => !value)}>
      <Icon name={bookmarked ? 'bookmark-fill' : 'bookmark'} />
    </IconButton>
  </div>;
}
```

일반 동작은 Outline, 선택·저장 상태나 강한 시각적 강조는 Filled를 우선 고려합니다. 상태를 전환할 때는 형태와 함께 `aria-pressed`나 텍스트도 갱신합니다. `Icon`은 장식으로 처리되므로 의미는 함께 표시하는 텍스트로 전달하고, 아이콘만 있는 버튼에는 `IconButton`의 `label`을 지정합니다.

문서의 파운데이션 → Icons에서 전체 목록을 이름으로 검색하고 Outline/Filled로 필터링할 수 있습니다. 선정 근거와 공식 자료는 [아이콘 리서치](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/icon-research.md)에 정리했습니다.

## 컴포넌트

- 버튼: `Button`, `IconButton`
- 입력: `TextField`, `TextArea`, `NumberField`, `DatePicker`, `DateRangePicker`, `TimePicker`, `DateTimePicker`, `DateTimeRangePicker`, `Slider`, `FileUpload`
- 선택: `Select`, `SearchSelect`, `MultiSelect`, `NativeSelect`, `Checkbox`, `Radio`, `Switch`, `Segmented`, `Chip`
- 탐색과 정보: `Tabs`, `Tree`, `Accordion`, `List`, `Table`, `DataGrid`, `Pagination`, `Stepper`, `Card`, `Avatar`, `Icon`, `Divider`
- 피드백과 오버레이: `Badge`, `Alert`, `Progress`, `Spinner`, `NovaSpinner`, `Skeleton`, `Dialog`, `Drawer`, `Toast`, `Tooltip`, `Popover`, `DropdownMenu`, `Slides`
- 데이터 상태: `DataState`, `useDataState` (로딩·실패·빈 목록·검색 결과 없음·정상 목록)

입력과 선택 컴포넌트는 React의 `value`/`onValueChange` 또는 `defaultValue`를 사용합니다. `TextField` 등 네이티브 입력 래퍼는 일반적인 `onChange`를 사용합니다. 날짜와 숫자의 `onValueChange`는 값을 확정하거나 증감할 때 호출하며 숫자는 정밀도를 유지하는 문자열을 전달합니다. `DateRangePicker`의 값은 `[시작일, 종료일]`이며 값은 `YYYY-MM-DD` 또는 `null`입니다.

### 숨김 라벨

`TextField type="search"`는 값이 있을 때 공통 `.input-action` 스타일의
지우기 버튼을 표시합니다. 클릭하면 일반 `onChange`에 빈 문자열을 전달하고
입력에 포커스합니다. `readOnly`·`disabled`에서는 숨기며, `action`을 지정하면
사용자가 전달한 동작을 우선합니다.

`TextField`, `Select`, `SearchSelect`, `MultiSelect`는 `hideLabel`로 화면의 라벨과 라벨 여백을 숨깁니다. `label`은 계속 필수이며 스크린 리더에 연결됩니다. 제목이나 플레이스홀더로 입력 목적이 드러나는 검색·필터 툴바에 사용합니다. `TextField`의 `labelPosition="left"`와 함께 사용하면 좌측 라벨 공간도 제거합니다.

| 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `label` | `ReactNode` | 필수 | 화면에서 숨겨도 접근 가능한 이름을 제공합니다. |
| `hideLabel` | `boolean` | `false` | 라벨 표시와 라벨 여백을 제거합니다. |

```tsx
import { useState } from 'react';
import { Icon, MultiSelect, SearchSelect, Select, TextField } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

const teams = [
  { value: 'design', label: '디자인' },
  { value: 'development', label: '개발' },
];

export function ProjectFilters() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [ownerTeam, setOwnerTeam] = useState('');

  return <div style={{ display: 'grid', gap: 16 }}>
    <div role="group" aria-label="프로젝트 필터"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <TextField label="프로젝트 검색" hideLabel type="search"
        placeholder="프로젝트 검색" value={query}
        onChange={event => setQuery(event.target.value)}
        prefix={<Icon name="search" />} prefixDecorative />
      <Select label="프로젝트 상태" hideLabel value={status}
        onValueChange={setStatus} options={[
          { value: 'all', label: '전체 상태' },
          { value: 'active', label: '진행 중' },
        ]} />
      <MultiSelect label="참여 팀" hideLabel options={teams}
        placeholder="참여 팀" value={selectedTeams}
        onValueChange={setSelectedTeams} clearable />
    </div>
    <SearchSelect label="담당 팀 검색" hideLabel options={teams}
      placeholder="담당 팀 검색" value={ownerTeam} onValueChange={setOwnerTeam} />
  </div>;
}
```

### Button 비활성 상태

기존 `disabled` 속성을 사용합니다. 비활성 상태에서도 `variant`의 형태를 유지하며 `Button`과 `IconButton`에 같은 규칙을 적용합니다.

| variant | 비활성 표시 |
| --- | --- |
| `primary` | 차분한 프라이머리 채움과 텍스트 |
| `secondary` | 중립 회색 채움과 텍스트 |
| `outline` | 투명 배경과 옅은 회색 테두리 |
| `ghost` | 배경·테두리 없는 회색 텍스트 |
| `danger` | 차분한 위험 색상 채움과 텍스트 |

색상은 라이트·다크 테마와 사용자 색상 설정을 따릅니다. 전체 요소의 opacity를 낮추지 않으며 SM·MD·LG 크기를 유지합니다. 비활성 버튼은 클릭·Tab 포커스에서 제외하고 hover·눌림 색상도 바뀌지 않습니다. 강제 색상 모드에서는 시스템의 ButtonFace·GrayText를 사용합니다.

필요하면 버튼 범위에서 `--button-disabled-bg`, `--button-disabled-text`, `--button-disabled-shadow`를 재정의할 수 있습니다.

### IconButton

`IconButton`은 아이콘 전용 `Button`이며 기본 스타일은 `ghost`입니다. 필수 `label`을 접근 가능한 이름과 기본 툴팁에 함께 사용합니다. `tooltip`을 전달하면 안내 내용만 바꾸고, `tooltip={false}`로 툴팁을 제거해도 버튼 이름은 유지합니다. `Button`의 `variant`, `size`, `disabled`, 네이티브 이벤트와 실제 버튼을 가리키는 `ref`를 지원합니다.

| 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `label` | `string` | 필수 | 접근 가능한 이름과 기본 툴팁입니다. |
| `children` | `ReactNode` | 필수 | 표시할 아이콘입니다. |
| `tooltip` | `ReactNode \| false` | `label` | 툴팁 내용을 바꾸거나 제거합니다. |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'ghost'` | `Button`과 같은 스타일입니다. |
| `size` | `'sm' \| 'md' \| 'lg'` | 기본 컨트롤 크기 | `Button`과 같은 크기입니다. |

```tsx
import { useState } from 'react';
import { Icon, IconButton } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function BookmarkButton() {
  const [bookmarked, setBookmarked] = useState(false);
  return <IconButton label="북마크" variant="outline" size="md"
    aria-pressed={bookmarked} onClick={() => setBookmarked(value => !value)}>
    <Icon name={bookmarked ? 'bookmark-fill' : 'bookmark'} />
  </IconButton>;
}
```

### Popover·DropdownMenu 정렬

`align`은 팝업 패널을 트리거의 시작점·가운데·끝점에 맞춥니다. `start`와 `end`는 글의 방향을 따라 RTL에서 반대로 배치됩니다. 패널이 화면의 가로 경계를 벗어나면 위치를 자동 보정합니다.

| 속성 | 타입 | 기본값 | 적용 컴포넌트 |
| --- | --- | --- | --- |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | `Popover`, `DropdownMenu` |

```tsx
import { useState } from 'react';
import { DropdownMenu, Popover } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function ToolbarPopups() {
  const [view, setView] = useState('list');
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    <Popover trigger="표시 설정" label="표시 설정" align="end">
      <strong>표시 설정</strong>
      <p>목록의 추가 정보를 확인합니다.</p>
    </Popover>
    <DropdownMenu trigger="보기 방식" label="보기 방식" align="center"
      items={[
        { value: 'list', label: '목록 보기' },
        { value: 'grid', label: '격자 보기' },
      ]} onSelect={setView} />
    <p role="status">선택한 보기: {view}</p>
  </div>;
}
```

### TimePicker

`TimePicker`는 날짜나 시간대가 없는 24시간제 시간을 입력합니다. `value`·`defaultValue`·`onValueChange`는 `HH:mm` 문자열 또는 빈 값 `null`을 사용하며, `value`가 `undefined`일 때만 비제어 방식으로 동작합니다. 직접 입력한 `HHmm`은 Enter나 포커스 이동으로 확정할 때 `HH:mm`으로 정규화합니다. 형식·범위가 잘못된 입력은 오류를 표시하고 이전 확정값을 유지합니다.

| 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `label` | `ReactNode` | 필수 | 입력 라벨이며 문자열이면 시간 선택 패널의 이름에도 사용합니다. |
| `value` / `defaultValue` | `string \| null` | `defaultValue: null` | 확정된 시간 또는 비제어 초기값입니다. |
| `onValueChange` | `(value: TimeValue) => void` | — | 확정값이 바뀔 때 호출합니다. 제어형에서는 부모 상태를 갱신합니다. |
| `min` / `max` | `string` | 제한 없음 | `00:00`~`23:59`의 `HH:mm` 형식이며 양 끝을 포함합니다. `min <= max`로 지정합니다. |
| `minuteStep` | `number` | `1` | 60을 나누어떨어지게 하는 1~60 사이의 정수입니다. 목록과 직접 입력 모두 적용합니다. |
| `name` | `string` | — | 폼에 확정된 `HH:mm`을 제출하며 빈 값은 빈 문자열로 제출합니다. |

패널에서 고른 시·분은 `확인`을 누르기 전까지 임시값입니다. `취소`·Escape·바깥 클릭으로 닫으면 기존 확정값을 유지합니다. `required`, `readOnly`, `disabled`, `size="sm | md | lg"`, `helperText`, `error`도 지원합니다. 필수가 아닌 입력을 비우고 확정하면 `null`을 전달합니다.

```tsx
import { useState } from 'react';
import { TimePicker, type TimeValue } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function ReminderTime() {
  const [time, setTime] = useState<TimeValue>('09:00');
  return <TimePicker label="알림 시간" name="reminderTime"
    value={time} onValueChange={setTime}
    min="09:00" max="18:00" minuteStep={15} required
    helperText="09:00부터 18:00까지 15분 단위로 선택합니다." />;
}
```

### Tabs

`Tabs`는 기본 가로형이며 `orientation="vertical"`을 지정하면 왼쪽 탭 목록과 오른쪽 내용으로 배치합니다. 가로형은 ←·→, 세로형은 ↑·↓로 이동하고 Home·End로 처음과 마지막 탭을 선택합니다. 비활성 탭은 건너뛰며 탭 전환 시 입력값을 유지합니다. `value`·`onValueChange`로 선택 상태를 제어할 수 있습니다.

```tsx
import { Tabs } from '@idenflu/mono-react';

<Tabs label="설정 분류" orientation="vertical" items={[
  { value: 'general', label: '기본 정보', content: <p>워크스페이스 기본 정보</p> },
  { value: 'notifications', label: '알림', content: <p>이메일과 활동 알림</p> },
  { value: 'security', label: '보안', disabled: true, content: <p>관리자 전용</p> },
]} />
```

### DataGrid

`Table`은 읽기 중심의 표를 구성하는 기본 요소입니다. `DataGrid<T>`는 전달한 `rows`를 검색·필터·정렬하고 선택·페이지 이동·열 조작·편집을 조합하는 목록입니다. 기본 본문은 14px이며 기존 테이블의 회색 경계, 상태 색상과 다크 모드 토큰을 사용합니다.

밀도·표시 열·CSV와 선택 관련 작업은 상단 툴바의 아이콘 버튼으로 제공합니다. 선택하면 제목 옆에 선택 건수를 표시하고, 같은 툴바에서 선택 내보내기·해제와 `selectionActions`를 사용합니다. 각 아이콘은 접근 가능한 이름과 툴팁을 제공합니다. 밀도는 `defaultDensity` 또는 `density`·`onDensityChange`로 관리하며 `showDensityToggle={false}`로 버튼을 숨깁니다. 기존처럼 `density`만 전달하면 읽기 전용 설정으로 유지합니다.


```tsx
import { useState } from 'react';
import { DataGrid, type DataGridColumn, type DataGridSort } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

type Project = { id: string; name: string; hours: number };
const columns: DataGridColumn<Project>[] = [
  { id: 'name', header: '프로젝트', accessor: row => row.name,
    width: 260, pinned: 'start', filter: 'text', editable: true,
    validate: value => value.trim() ? undefined : '이름을 입력해주세요.' },
  { id: 'hours', header: '시간', accessor: row => row.hours,
    align: 'end', filter: 'number', editable: true, editor: 'number',
    validate: value => value.trim() && Number(value) >= 0
      ? undefined : '0 이상 입력해주세요.' },
];

export function ProjectGrid() {
  const [rows, setRows] = useState<Project[]>([
    { id: 'p1', name: '디자인 시스템', hours: 24 },
    { id: 'p2', name: '브랜드 가이드', hours: 16 },
  ]);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortModel, setSortModel] = useState<DataGridSort[]>([]);
  return <DataGrid label="프로젝트 목록" rows={rows} columns={columns}
    getRowId={row => row.id} getRowLabel={row => row.name}
    selectable selectedRowIds={selected} onSelectedRowIdsChange={setSelected}
    sortModel={sortModel} onSortModelChange={setSortModel}
    defaultPageSize={5} pageSizeOptions={[5, 10, 20]}
    exportable exportFileName="projects.csv" maxHeight={400}
    onCellEdit={({ rowId, columnId, value }) => {
      setRows(current => current.map(row => row.id === rowId
        ? { ...row, [columnId]: columnId === 'hours'
          ? Number(value) : value.trim() }
        : row));
    }} />;
}
```

| 영역 | 동작과 옵션 |
| --- | --- |
| 열 정의 | `id`·`header`·`accessor`가 필수입니다. `cell`로 표시를 바꿔도 검색·정렬·CSV는 accessor의 원본 값을 사용합니다. |
| 검색 | 기본 제공. `searchable={false}`로 숨기고 `searchLabel`로 이름을 지정합니다. `query`·`defaultQuery`·`onQueryChange`로 상태를 연결합니다. |
| 필터 | 열에 `filter="text | number | select | multi-select"`를 지정합니다. 텍스트 포함·숫자 최솟값/최댓값·선택값 일치를 지원합니다. select·multi-select의 `filterOptions`는 `{value,label}[]`입니다. multi-select는 같은 열의 선택값을 OR로, 전체 검색과 다른 열의 필터는 AND로 적용합니다. 복수 필터에는 팝업 검색과 첫 항목·나머지 개수 요약을 제공합니다. |
| 필터 상태 | `filters`·`defaultFilters`·`onFiltersChange`를 사용합니다. `DataGridFilters`는 열 ID를 키로 text/select의 문자열, multi-select의 `string[]` 또는 number의 `{min?:string,max?:string}`를 저장합니다. 빈 배열·키 생략은 전체 조회이며 마지막 항목 해제 시 빈 배열을 전달합니다. |
| 컬럼 필터 토글 | `showColumnFilterToggle`은 기본 `false`이며 이때 필터 가능한 열의 필터 행과 조건을 항상 적용합니다. `true`이면 상단 `columnFilters` 토글을 표시하고 닫은 상태로 시작합니다. 켜면 필터 행과 조건을 적용하며, 끄면 숨기고 `onFiltersChange({})`로 초기화를 요청합니다. 비제어 필터는 비우고 제어 필터는 부모 상태에서 갱신합니다. |
| 정렬 | 클릭은 단일 정렬, Shift+클릭은 기존 조건을 유지하는 다중 정렬입니다. 오름차순 → 내림차순 → 해제 순서이며 빈 값은 각 조건에서 마지막입니다. 열의 `sortable={false}`로 해제합니다. 화살표 옆 숫자는 정렬 우선순위입니다. |
| 정렬 상태 | `sortModel`·`defaultSortModel`·`onSortModelChange`는 우선순위 순서의 `{columnId,direction:'asc'|'desc'}[]`를 사용합니다. 모든 조건이 같은 행은 원래 순서를 유지합니다. 기존 `sort`·`defaultSort`·`onSortChange`는 첫 정렬 조건과 호환되며, 제어형 다중 정렬은 `sortModel`로 연결하세요. 두 제어형 값을 함께 주면 `sortModel`이 우선합니다. |
| 행 선택 | `selectable`로 켭니다. 행의 일반 영역 클릭으로 선택/해제하고 체크박스로 키보드 조작할 수 있습니다. `selectOnRowClick={false}`는 체크박스로만 선택합니다. 버튼·링크·입력·텍스트 드래그는 행 선택을 변경하지 않습니다. 사용자 정의 영역은 `data-grid-ignore-row-click`로 제외할 수 있습니다. `getRowId`는 중복되지 않는 안정적인 ID를 반환해야 합니다. `getRowLabel`은 체크박스 이름에 사용합니다. `isRowSelectable`로 행별 선택을 제한합니다. |
| 선택 상태 | `selectedRowIds`·`defaultSelectedRowIds`·`onSelectedRowIdsChange`를 사용합니다. 검색·정렬·페이지 이동 후에도 선택을 유지합니다. 전체 선택은 **현재 페이지의 선택 가능한 행**에만 적용합니다. |
| 선택 작업 | 선택 가능한 행을 선택하면 상단 `selection` 묶음에 내장 선택 해제가 표시됩니다. `exportable`이면 선택 행 CSV도 함께 표시합니다. `selectionActions`는 호출 측에서 직접 구현한 선택 작업의 UI를 추가하는 확장 슬롯입니다. 선택 삭제 등 업무 동작과 선택 상태는 호출 측에서 구현합니다. |
| 상시 도구 | `toolbarActions`는 호출 측에서 직접 구현한 상시 작업의 UI를 추가하는 확장 슬롯입니다. `Button`·`IconButton` 등을 전달하면 선택 여부와 무관하게 표시합니다. 기본 위치는 내장 도구 뒤이며 `toolbarOrder`의 `actions`로 묶음을 이동합니다. 새로고침·추가 등 업무 동작과 `disabled`·오류 처리는 호출 측에서 구현합니다. |
| 상단 도구·컬럼 필터 크기 | `toolbarSize`는 `'sm' \| 'md' \| 'lg'`이며 기본값은 `'sm'`입니다. 상단 도구와 컬럼 필터(text·number·select·multi-select)의 공통 크기이며, 기본 토큰 높이는 sm 30px·md 36px·lg 42px입니다. 화면 조정의 컨트롤 높이에 따라 변하며 검색·내장 도구·크기를 생략한 자식 도구에 적용합니다. 자식에 명시한 `size`가 우선합니다. 본문 행 밀도·푸터는 유지하고 표시 열 팝업 안의 도구는 md를 사용합니다. |
| 상단 도구 순서 | `toolbarOrder?: readonly DataGridToolbarItem[]`로 배치와 Tab 순서를 함께 바꿉니다. 키와 기본 순서는 `search` → `selection` → `columnFilters` → `density` → `columns` → `export` → `resetFilters` → `actions`입니다. 지정한 키를 먼저 배치하고 누락한 키는 기본 순서로 뒤에 붙이며 중복·알 수 없는 키는 무시합니다. `toolbarOrder={['actions', 'export']}`처럼 일부만 지정할 수 있고 표시 조건은 각 속성을 따릅니다. `selection`·`actions`는 묶음 전체를 이동하며 추가 버튼 각각은 전달한 JSX 순서를 따릅니다. |
| 필터 초기화 도구 | 적용 중인 열별 필터 값이 있으면 상단 `resetFilters` 위치에 필터 초기화를 표시합니다. 클릭하면 필터를 비우고 `onFiltersChange({})`를 호출합니다. |
| 페이지 | `page`·`defaultPage`·`onPageChange`, `pageSize`·`defaultPageSize`·`onPageSizeChange`, `pageSizeOptions`를 지원합니다. 검색·필터·정렬·페이지 크기 변경 시 첫 페이지로 이동합니다. 외부 데이터가 줄면 표시 페이지를 유효 범위로 제한합니다. |
| 열 조작 | 표시 열을 숨길 수 있으며 최소 1개는 유지합니다. `showColumnVisibility={false}`로 UI를 숨기고 `defaultHiddenColumnIds`로 초기 표시를 지정합니다. |
| 열 너비 | `width`는 기본 160px이며 `180`, `"180px"`, `"25%"`를 지원합니다. 백분율은 선택 체크박스 열(52px)을 제외한 표 영역 너비를 기준으로 계산합니다. `minWidth`·`maxWidth`는 px 단위이며 기본 96·600입니다. |
| 유연한 너비 | 양수인 `flex`로 고정·백분율 열을 배치한 뒤 남은 공간을 비율대로 나눕니다. `flex: 2`는 `flex: 1`의 두 배를 배정받으며 최소·최대 너비를 우선합니다. 같은 열에 `width`가 있으면 `flex`가 우선합니다. |
| 너비 조절 | 드래그 또는 열 경계에서 ←/→ 10px, Shift와 함께 1px, Home/End 최소/최대로 조절합니다. 조절한 열은 px 너비로 유지하며 경계 더블클릭 또는 Enter로 원래 `width`·`flex` 설정을 복구합니다. `resizable={false}`로 조절을 끕니다. |
| 열 고정 | `pinned="start"`로 왼쪽 식별 열을 고정합니다. 선택 열도 함께 고정되며 작은 화면에서는 본문을 가리지 않도록 고정을 해제합니다. `maxHeight`를 지정하면 그리드 내부 세로 스크롤과 고정 헤더를 사용할 수 있습니다. |
| 편집 | 열의 `editable`은 boolean 또는 행별 판별 함수입니다. `editor="text | number"`, `validate(value,row)`로 검증합니다. `onCellEdit({row,rowId,columnId,value})`에서 부모 `rows`를 갱신해야 합니다. 전달하는 값은 문자열입니다. |
| 확정·취소 | 셀의 편집 버튼으로 진입하고 Enter/저장으로 확정, Escape/취소로 원본을 유지합니다. 오류는 셀 안에 표시하며 종료 후 편집 버튼으로 포커스를 복원합니다. blur로 저장하지 않습니다. |
| 상태 | `loading`·`error`·`onRetry`·`emptyMessage`를 지정합니다. 로딩·오류에서는 이전 행을 정상 데이터처럼 노출하지 않습니다. 데이터 없음과 검색 결과 없음을 구분합니다. |
| 내보내기 | `exportable`로 다운로드를 켜고 `exportFormats`로 형식을 지정합니다. 기본은 `['csv']`이며 `['csv', 'xlsx']`이면 CSV·Excel 버튼을 함께 표시합니다. `exportFileName`은 형식별 확장자로 제안 파일명을 만듭니다. 표시 중인 열만 출력합니다. 전체 다운로드는 검색·필터·정렬된 **모든 페이지**, 선택 다운로드는 원본 rows 중 **선택한 행**이 대상입니다. |
| 저장 위치 | 내보내기를 누르면 지원 브라우저에서 파일명과 저장 위치를 지정하는 시스템 저장 창을 엽니다. 취소하면 저장하지 않습니다. 미지원 브라우저에서는 파일명을 확인한 뒤 브라우저 다운로드 설정에 따라 저장합니다. |
| CSV 형식 | 한글 BOM, 쉼표·따옴표·개행 이스케이프와 문자열 수식 보호를 적용합니다. `createDataGridCsv`·`downloadDataGridCsv`로 동일한 규칙을 직접 사용할 수 있습니다. `downloadDataGridCsv`는 사용자 클릭에서 호출하고 반환하는 Promise의 저장 오류를 처리하세요. |
| Excel 형식 | `createDataGridXlsx`는 실제 XLSX 바이트를 만들고 `downloadDataGridXlsx`는 저장 창 또는 다운로드로 저장합니다. 숫자는 숫자 셀, 문자열은 텍스트 셀로 내보내며 수식으로 실행하지 않습니다. `sheetName`으로 시트명을 지정합니다. |
| 밀도 | `density="default | compact"`로 기존 테이블과 동일한 행 간격을 사용합니다. |
| 가상 스크롤 | `virtualized` 또는 `virtualized={{estimateRowHeight:56,overscan:6}}`으로 켭니다. 화면 근처 행과 편집·포커스 유지에 필요한 행만 렌더링합니다. `estimateRowHeight`는 초기 추정 높이(px)이며 실제 높이는 자동 측정합니다. 실제 콘텐츠에 가까운 값이면 위치 보정이 줄어듭니다. `overscan`은 앞뒤 버퍼를 만들 행 수이며, 화면이 버퍼 경계에 가까워지면 렌더링 범위를 갱신합니다. 스크롤 중에는 행 hover 강조를 잠시 멈춥니다. 세로 스크롤바는 헤더 아래 본문 영역에 배치하며 브라우저 기본 형태를 사용합니다. 드래그할 때 목적지 행을 먼저 렌더링한 뒤 이동합니다. 방향키·PageUp·PageDown·Home·End로도 조작할 수 있습니다. |
| 페이지와 가상화 | `pagination` 기본값은 일반 모드에서 `true`, 가상 모드에서 `false`입니다. `virtualized pagination defaultPageSize={100}`은 현재 페이지 내부를 가상화합니다. `pagination={false}`에서는 검색 결과 전체가 선택·스크롤 대상입니다. |

```tsx
type Project = {
  id: string; name: string; team: string; owner: string; budget: number;
};

const columns: DataGridColumn<Project>[] = [
  { id: 'name', header: '프로젝트', accessor: row => row.name,
    flex: 2, minWidth: 180, maxWidth: 600 },
  { id: 'team', header: '팀', accessor: row => row.team,
    width: '25%', minWidth: 120, maxWidth: 280 },
  { id: 'owner', header: '담당자', accessor: row => row.owner,
    flex: 1, minWidth: 120, maxWidth: 320 },
  { id: 'budget', header: '예산', accessor: row => row.budget,
    width: 160, align: 'end' },
];
```

화면 크기나 표시 열이 바뀌면 백분율·flex 너비를 다시 계산합니다. 최소 너비의 합이 표 영역보다 크면 가로 스크롤을 제공하고, 최대 너비에 도달한 뒤 남는 공간은 여백으로 유지합니다. 서버 렌더링처럼 영역 너비를 아직 측정하지 못한 경우에는 숫자·px `width` 또는 기본 160px로 표시한 뒤 측정값을 반영합니다.

제어형 속성은 부모 상태가 기준입니다. 콜백을 받은 뒤 해당 상태를 갱신하세요. 서버 저장이 필요하면 `onCellEdit`에서 저장 처리와 오류 안내를 연결하고, 성공한 값으로 `rows`를 갱신합니다. 내장 서버 저장·비동기 트랜잭션·재시도 큐는 제공하지 않습니다.

열의 선택형 필터는 `Select`의 `popupStrategy="fixed"`를 사용해 짧은 목록이나 스크롤 영역에서 옵션이 잘리지 않도록 합니다. 일반 `Select`의 기본값은 `absolute`이며 필요한 화면에서 이 옵션을 지정할 수 있습니다.

이 버전은 **전달한 rows 전체를 브라우저에서 처리하는 데이터그리드**입니다. 가상 스크롤은 세로 방향의 DOM 렌더링을 줄이며, 전체 rows의 메모리와 검색·정렬 계산을 줄이는 서버 처리 기능은 아닙니다. 서버 페이지 이동, 열 가상화, 행 그룹화·피벗, 스프레드시트식 셀 범위 선택은 포함하지 않습니다.

```tsx
// rows는 부모가 로드한 전체 데이터입니다.
<DataGrid label="프로젝트 전체 목록" rows={rows} columns={columns}
  getRowId={row => row.id}
  virtualized={{ estimateRowHeight: 68, overscan: 6 }}
  maxHeight={420} selectable exportable />
```

가상 모드에서 `maxHeight`를 생략하면 480px로 제한합니다. `none` 같은 무제한 높이 키워드나 0 이하의 숫자는 기본값으로 되돌립니다. CSS 문자열을 지정할 때도 실제로 높이를 제한하는 유효한 값을 사용해야 가상화가 적용됩니다. 기본 가상 모드는 전체 검색 결과를 스크롤하며 페이지 크기 선택 UI를 표시하지 않습니다. 전체 선택은 현재 검색 결과 전체에 적용하고 CSV·Excel은 기존처럼 필터·정렬 결과 또는 선택한 행 전체를 내보냅니다. 일반 모드의 기본 페이지 이동 동작은 유지됩니다.

줄바꿈·열 너비·밀도·편집 오류로 달라지는 실제 행 높이를 측정하고 반영합니다. 데이터 조건이나 페이지를 바꾸면 세로 위치를 복구하며 가로 스크롤 위치는 유지합니다. 편집 중이거나 포커스를 가진 행은 화면 밖에서도 유지합니다. 이를 위해 떨어진 행 사이에 별도의 빈 공간을 두므로 중간의 모든 행을 렌더링하지 않습니다.

가상화는 [TanStack Virtual](https://tanstack.com/virtual/latest/docs/framework/react/react-virtual) 런타임 의존성을 사용합니다. 실제 데이터 행의 순서와 전체 행 수는 `aria-rowindex`·`aria-rowcount`에 헤더를 포함해 전달하고, 빈 공간용 행은 접근성 트리에서 제외합니다. 부분 렌더링된 표의 보조기기 동작은 사용 환경에서도 확인하세요. 관련 기준은 [WAI 행 수·행 인덱스](https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/)를 참고했습니다.

보조기기로 모든 행을 차례대로 탐색하는 것이 우선이면 `virtualized={false}`와 페이지 이동 방식을 사용하세요. 가상 모드의 행 수 정보가 DOM 밖의 모든 행을 즉시 탐색할 수 있다는 뜻은 아닙니다. [AG Grid 접근성 지침](https://www.ag-grid.com/react-data-grid/accessibility/)도 이 차이를 설명합니다.

구조는 native `table`이며 정렬 버튼·필터·체크박스·편집 컨트롤을 Tab으로 탐색합니다. 단일 진입점과 방향키 셀 이동을 전제하는 `role="grid"`를 불완전하게 붙이지 않습니다. 첫 정렬 조건은 `aria-sort`, 다중 정렬의 방향과 우선순위는 버튼 설명, 부분 선택은 네이티브 `indeterminate`, 조회 상태는 상태 메시지로 전달합니다.

기능 범위와 검증 항목은 다음 공식 문서를 비교해 선정했습니다. 구현의 우선순위와 위 API는 이 디자인 시스템에 맞춘 결정입니다.

- [MUI Data Grid 필터](https://mui.com/x/react-data-grid/filtering/): 열별 연산과 제어 상태 구분
- [AG Grid 열 크기](https://www.ag-grid.com/react-data-grid/column-sizing/): 드래그와 키보드 리사이즈
- [TanStack Table 열 고정](https://tanstack.com/table/v8/docs/guide/column-pinning): 고정 열의 너비와 순서 관리
- [MUI Data Grid 내보내기](https://mui.com/x/react-data-grid/export/): 표시 열·필터 결과·선택 행 구분과 수식 보호
- [AG Grid 편집 시작·종료](https://www.ag-grid.com/react-data-grid/cell-editing-start-stop/): 확정·취소 계약
- [WAI APG Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/): 실제 동작과 접근성 역할 일치

`NumberField`, `DatePicker`, `DateRangePicker`에서 `value`가 `undefined`일 때만 `defaultValue`를 사용합니다. Controlled `null`은 빈 값입니다. 숫자의 `grouping`·`decimals`를 변경하면 현재 입력을 새 형식으로 표시하며, 정밀도를 줄여도 임의로 반올림하지 않고 기존 값을 보존해 검증합니다.

`NumberField`, `DatePicker`, `DateRangePicker`의 `error`로 부모 폼의 검증 메시지를 전달할 수 있습니다. 메시지는 입력의 오류 상태, 접근 가능한 설명과 네이티브 유효성 검사에 함께 반영됩니다.

`DateTimePicker`와 `DateTimeRangePicker`는 하나의 패널에서 달력과 시·분을 선택합니다. 패널에서 고른 값은 `확인`을 눌렀을 때 반영되며 `취소`·Escape·바깥 클릭은 패널의 변경을 취소합니다. 직접 입력은 포커스를 옮기거나 Enter를 누르면 검증합니다. 단일·범위 입력 모두 `size="sm | md | lg"`, `required`, `readOnly`, `disabled`, `helperText`, `error`를 지원합니다.

`DateTimeRangePicker`의 패널은 시작 날짜·시간 선택 → `다음` → 종료 날짜·시간 선택 → `확인` 순서로 진행합니다. `다음`은 시작 일시를 임시로 유지하고 종료 선택 단계로 이동하며, `확인`을 누르기 전까지 범위 값은 변경되지 않습니다. `defaultValue`를 생략하면 빈 기간에서 시작할 수 있습니다.

`value`·`defaultValue`·`onValueChange`·`min`·`max`에는 시간대가 없는 로컬 일시 `YYYY-MM-DDTHH:mm`을 사용합니다. 화면에는 `YYYY-MM-DD HH:mm`으로 표시하며, 숫자 12자리 입력도 지원합니다. UTC 변환이나 시간대 변환은 수행하지 않으므로 서버에 절대 시각을 저장할 때 시간대 처리는 애플리케이션에서 결정합니다. 범위 값은 `[시작 일시, 종료 일시]`이며 빈 값은 `null`입니다. 종료 일시가 시작보다 빠른 값은 자동으로 순서를 바꾸지 않고 오류로 안내합니다.

`minuteStep`의 기본값은 1입니다. 60을 나누어떨어지게 하는 1~60 사이의 정수를 지정하며, 목록과 직접 입력 모두 이 분 간격을 따릅니다. `min`·`max`는 같은 날짜 안의 시간까지 제한합니다. `name="booking"`인 범위 입력은 `booking-start`와 `booking-end` 이름으로 확정된 로컬 일시를 제출합니다.

```tsx
import { DateTimePicker, DateTimeRangePicker } from '@idenflu/mono-react';

<DateTimePicker label="날짜 및 시간" name="eventAt"
  defaultValue="2026-11-12T14:30" minuteStep={15} />
<DateTimeRangePicker label="이용 기간" name="booking"
  defaultValue={['2026-11-12T09:00', '2026-11-12T17:30']}
  min="2026-11-12T09:00" max="2026-11-12T18:00" minuteStep={30} />
```

Datetime picker 문서의 **React 사용 예시**에는 실행 가능한 값 바인딩·값 변환·폼 제출과 복사 가능한 전체 코드가 있습니다. `value`/`onValueChange`로 부모 상태를 연결하고, 범위의 `[startsAt, endsAt]`을 애플리케이션의 객체 속성에 매핑합니다. 외부에서 `null` 또는 `[null, null]`을 넣으면 입력값도 비워집니다.

UTC+09:00을 기준으로 동작하는 서비스의 변환 예시는 다음과 같습니다. 브라우저의 로컬 시간대와 관계없이 같은 결과를 사용하며, 빈 값은 `null`, 초·밀리초는 분 정밀도로 처리합니다.

| 용도 | 예시 값 |
| --- | --- |
| 서버 UTC ISO | `2026-11-12T05:30:00.000Z` |
| 컴포넌트 바인딩 | `2026-11-12T14:30` |
| 화면 표시 | `2026-11-12 14:30` |
| 숫자 문자열 | `202611121430` |

```tsx
// 형식이 검증된 UTC ISO와 컴포넌트 값을 변환합니다.
function utcToPicker(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000)
    .toISOString().slice(0, 16);
}
function pickerToUtc(value: string | null): string | null {
  return value ? new Date(value + ':00+09:00').toISOString() : null;
}
```

이 변환 함수는 고정 UTC+09:00 예시입니다. 다른 서비스 시간대에는 해당 시간대 규칙을 적용해야 합니다. 시간대가 없는 컴포넌트 값에 단순히 `Z`를 붙이면 UTC로 해석되므로 사용하지 않습니다. `FormData`에는 확정된 로컬 일시가 들어가며, 예시에서는 `booking-start`/`booking-end`를 읽어 API의 `startsAt`/`endsAt` UTC 값으로 변환합니다. `defaultValue`를 사용하는 폼은 reset 시 초기값으로 돌아가고, 제출 결과도 함께 지웁니다.

중첩된 `Dialog`·`Drawer`·`Popover`·`DropdownMenu`·`Select`·날짜 팝업에서는 Escape가 가장 위의 팝업부터 한 단계씩 닫고 해당 트리거로 포커스를 돌려줍니다. 내부 입력이 Escape의 기본 동작을 취소하면 팝업은 유지됩니다.

`NovaSpinner`는 NOVA Studio 로고를 사용한 로딩 표시입니다. `size`는 픽셀 단위이며 기본값은 48입니다. `appearance="orbit"`은 궤도 회전, `appearance="mark"`는 로고의 밝기 변화만 표시합니다. `variant`는 원본 색상의 `brand`와 `neutral`·`inverse`를 지원하며, 움직임 줄이기 설정에서는 애니메이션을 멈춥니다. `label`로 현재 작업을 설명하고, 버튼에 같은 설명이 있으면 `aria-hidden`으로 중복 안내를 피합니다.

```tsx
import { NovaSpinner, Spinner } from '@idenflu/mono-react';

<NovaSpinner size={64} label="프로젝트를 준비하는 중" />
<NovaSpinner size={24} appearance="mark" variant="neutral" />
<Spinner kind="nova" size="small" />
```

기존 `Spinner`의 `kind="nova"`도 같은 컴포넌트를 사용하며 기존 크기 규칙인 16·24·32px을 따릅니다. `inverse`는 밝은 단색이므로 진한 배경에 사용합니다.

```tsx
import { DatePicker, Select } from '@idenflu/mono-react';
import { useState } from 'react';

function ProjectForm() {
  const [date, setDate] = useState<string | null>(null);
  return <>
    <Select label="담당 팀" name="team" required options={[{ value: 'design', label: '디자인' }]} />
    <DatePicker label="시작일" name="start" value={date} onValueChange={setDate} />
  </>;
}
```

`Select`, `SearchSelect`, `MultiSelect`에 `prefixIcon`을 지정하면 선택값 앞에 고정 아이콘을 표시합니다. 옵션에는 `description`과 `icon`을 지정할 수 있고, `DropdownMenu` 항목에도 `icon`을 지정할 수 있습니다. 아이콘은 장식으로 처리하므로 의미는 `label`로 전달합니다.

`MultiSelect`의 `maxVisibleLabels`에 양의 정수를 지정하면 기본 표시에서 나머지 선택값을 `외 N개`로 요약합니다. 생략하면 모든 라벨을 표시하며, 접근 가능한 이름에는 항상 전체 선택값을 유지합니다. 태그형(`presentation="inline"`)에는 적용하지 않습니다. DataGrid 복수 필터는 `maxVisibleLabels={1}`을 사용해 높이를 유지합니다.

태그형은 기본적으로 가용 너비에 맞는 태그만 한 줄로 표시하고 나머지를 `+N개`로 축약합니다. 선택 수가 늘거나 화면·글자 크기가 바뀌어도 입력 높이와 너비를 유지하며 가로 스크롤바가 생기지 않습니다. `+N개`를 클릭하면 옵션 목록에서 전체 선택을 확인·해제할 수 있습니다. 숨겨진 태그도 실제 선택값과 폼 제출에는 유지됩니다.

| 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `maxVisibleTags` | `number \| 'responsive'` | `'responsive'` | 태그형 표시 개수입니다. 기본은 가용 너비에 맞춰 자동 축약합니다. 0 이상 정수는 최대 표시 개수를 제한하며, 너비가 부족하면 그보다 적게 표시합니다. `0`은 개수만 표시합니다. 기본 문자열 표시에는 적용하지 않습니다. |

```tsx
<MultiSelect label="참여 팀" options={options} presentation="inline"
  value={teams} onValueChange={setTeams} searchable clearable
  maxVisibleTags="responsive" />
<MultiSelect label="최대 두 개 태그" options={options} presentation="inline"
  value={teams} onValueChange={setTeams} maxVisibleTags={2} />
```

태그형 `MultiSelect`는 입력 영역의 빈 공간·플레이스홀더·프리픽스 아이콘을 클릭해도 옵션을 엽니다. `searchable`이면 팝업 검색창에, 검색이 없으면 콤보박스 버튼에 포커스합니다. 열린 상태에서 빈 공간을 다시 눌러도 검색어와 옵션 목록을 유지합니다. 태그 제거·전체 지우기는 선택값만 변경하며 닫힌 목록을 열지 않습니다. 화살표 버튼은 열기·닫기, 키보드는 방향키·Enter·Escape를 지원하며, `disabled`에서는 빈 공간도 반응하지 않습니다.

`NumberField`도 `prefixIcon`을 지원합니다. 아이콘은 입력값 앞에 표시되고, `unit`은 오른쪽에 표시됩니다. 아이콘을 눌러 입력에 포커스할 수 있으며 아이콘은 제출 값과 읽기 설명에서 제외됩니다.

```tsx
<NumberField label="참여 인원" prefixIcon={<Icon name="person" />}
  defaultValue="8" min="0" unit="명" />
```

```tsx
import { Icon, Select } from '@idenflu/mono-react';

<Select label="담당 팀" prefixIcon={<Icon name="person" />} options={[
  { value: 'design', label: '디자인', description: '제품 경험을 설계합니다.' },
  { value: 'development', label: '개발', description: '제품을 구현합니다.' },
]} />
```

`Tree`는 사이드 메뉴와 같은 disclosure 목록으로, Tab과 Enter·Space를 사용합니다. 파일 탐색기 방식의 ARIA tree 키보드 모델은 제공하지 않습니다. `FileUpload`는 파일 선택과 드롭, 선택적 `accept`·`maxSizeBytes` 검증을 처리하며 실제 업로드는 애플리케이션에서 연결합니다. 컴포넌트 내부의 크기·타이포그래피·초기화 규칙은 해당 컴포넌트 범위에만 적용합니다.

`Dialog`는 `open`과 `onOpenChange`로 제어하며, 제목과 설명을 `aria-labelledby`·`aria-describedby`로 연결합니다. `closeOnBackdrop`은 배경 클릭으로 닫을지 정하며 기본값은 `false`입니다. Escape는 취소로 처리합니다.

열려 있는 동안 문서 루트와 본문의 배경 스크롤을 잠그고, 기존 스크롤바의 공간을 유지해 가로 밀림을 방지합니다. 중첩 모달은 마지막 창이 닫힐 때 해제하며 닫기·언마운트 시 기존 인라인 스크롤 스타일과 원래 스크롤 위치를 복원합니다. `Drawer`와 처리 중 다이얼로그에도 동일하게 적용하고 모달 내부 스크롤은 유지합니다.

처리 중인 작업은 `Dialog` 안에 `NovaSpinner` 또는 `Progress`를 조합합니다. 진행률을 모르면 스피너와 상태 메시지를, 알면 `value`·`max`가 있는 진행률과 처리 건수를 표시합니다. 메시지를 `role="status"`로 알릴 때 장식용 스피너는 `aria-hidden="true"`로 중복 안내를 피합니다. 문서의 처리 예시는 완료·취소·재시작을 지원하며, 취소하거나 화면을 벗어나면 타이머를 정리합니다. 실제 비동기 작업의 취소는 앱에서 연결해야 합니다.

버튼 없는 처리형은 취소·닫기 버튼을 생략하고 `onOpenChange`의 닫기 요청을 무시해 Escape·배경 클릭으로 닫히지 않게 합니다. 작업이 완료되면 앱에서 `open`을 `false`로 바꿔 자동으로 닫으며 완료 안내와 실행 버튼 포커스를 복원합니다. 문서의 React 예시는 `<ProcessingDialogExample blocking />`으로 이 유형을 재현합니다.

`variant="divided"`는 `DialogHeader`·`DialogBody`·`DialogFooter` 사이에 구분선을 표시합니다. 세 영역을 `Dialog`의 직접 자식으로 배치하면 긴 내용은 본문에서만 스크롤되고 헤더와 하단 버튼은 유지됩니다. `DialogBody`는 키보드 스크롤을 위해 기본 `tabIndex={0}`을 제공하며 필요한 경우 재정의할 수 있습니다. 하단에서 본문의 폼을 제출할 때는 버튼의 `form` 속성을 본문 폼의 `id`에 연결합니다.

```tsx
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button } from '@idenflu/mono-react';

<Dialog variant="divided" open={open} onOpenChange={setOpen}
        aria-labelledby="project-title">
  <DialogHeader><h2 id="project-title">프로젝트 안내</h2></DialogHeader>
  <DialogBody><p>프로젝트의 공유 범위를 확인해주세요.</p></DialogBody>
  <DialogFooter>
    <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
    <Button onClick={() => setOpen(false)}>확인</Button>
  </DialogFooter>
</Dialog>
```

`Alert`는 관련 입력이나 작업 영역에 표시하는 인라인 안내입니다. `variant="info | success | warning | danger"`로 의미에 맞는 색상을 사용합니다. 정적인 안내에는 알림 역할을 생략하고, 작업 후 나타나는 완료 안내에는 `role="status"`, 즉시 알려야 하는 오류에는 `role="alert"`를 지정합니다.

`Toast`의 `variant`에는 `info`·`success`·`warning`·`danger`를 지정하고, `action`에 재시도·실행 취소 버튼을 넣을 수 있습니다. 기본 알림 역할은 `status`이며 `danger`는 `alert`입니다. 자동으로 닫히지 않으므로 표시 상태와 닫기 동작을 앱에서 연결합니다.

기본 `appearance="default"`는 왼쪽 표시선에 상태 색상을 사용합니다. `appearance="solid"`는 배경 전체에 상태 색상을 적용하며 글자·닫기 버튼·ghost 동작 버튼도 함께 맞춥니다. 직접 색상을 재정의할 때는 `--toast-on-info`·`--toast-on-success`·`--toast-on-warning`·`--toast-on-danger`로 배경 위 글자색을 지정할 수 있습니다. 스튜디오 화면 조정에서는 색상 변경 시 이 글자색을 자동으로 보정합니다.

상태에 따라 체크·안내·주의·오류 아이콘이 기본 표시됩니다. `icon`에 다른 React 아이콘을 전달해 바꾸거나 `icon={null}`로 숨길 수 있습니다. 아이콘은 장식으로 처리하며 의미는 메시지와 알림 역할로 전달합니다.

```tsx
<Toast variant="danger" appearance="solid" onDismiss={dismissToast}
  action={<Button variant="ghost" onClick={retrySave}>다시 시도</Button>}>
  저장하지 못했습니다. 다시 시도해주세요.
</Toast>
```

`Chip`은 기본적으로 선택·삭제 동작에 사용하는 버튼입니다. `interactive={false}`는 표시 전용 `span`을 렌더링하며 클릭·호버·Tab 포커스가 없습니다. `rounded`로 알약 형태를 선택하고 `variant="neutral | primary | secondary | success | warning | danger"`로 색상을 지정합니다. 색상과 함께 텍스트로 의미를 설명합니다. 표시용 칩은 `HTMLSpanElement`, 기본 칩은 `HTMLButtonElement` ref를 받습니다. 표시용에서 `density="compact"`를 지정하면 SM·MD·LG의 기본 높이가 24·26·30px인 작은 칩을 사용합니다. 기본값 `density="comfortable"`는 기존 컨트롤 높이를 따릅니다.

```tsx
import { useState } from 'react';
import { Button, Chip, Icon } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function ChipExample() {
  const [selected, setSelected] = useState(false);
  const [tags, setTags] = useState(['프로젝트', '브랜드', '문서']);
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    <Chip interactive={false}>프론트엔드</Chip>
    <Chip interactive={false} density="compact" size="sm">목록 분류</Chip>
    <Chip interactive={false} rounded variant="success">완료</Chip>
    <Chip rounded variant="primary" aria-pressed={selected}
      onClick={() => setSelected(value => !value)}>프로젝트 필터</Chip>
    {tags.map(tag => <Chip key={tag} aria-label={`${tag} 제거`}
      onClick={() => setTags(current => current.filter(item => item !== tag))}>
      {tag}<Icon name="close" />
    </Chip>)}
    <Button variant="outline" onClick={() => {
      setSelected(false); setTags(['프로젝트', '브랜드', '문서']);
    }}>초기화</Button>
  </div>;
}
```

컴포넌트의 값 변경은 React 콜백으로 받고 폼 유효성 검사는 앱에서 관리합니다. 이전 HTML 런타임과 DOM 이벤트 API는 제거했으며, 전환 방법은 [프로젝트 적용 가이드](../../docs/consumer-guide.md)를 참고하세요.

`Divider`는 기본 가로 구분선이며, `orientation="vertical"`로 세로 구분선을 표시합니다. 세로 구분선은 flex 부모에서 높이에 맞춰 늘어나므로 블록 안에서 사용할 때는 부모 높이나 `style`을 지정합니다. 자식 텍스트는 `align="start | center | end"`로 정렬하고, `variant="dashed"`는 점선을 표시합니다. 의미 있는 구분선은 `separator`로 제공하며 장식용은 `decorative`로 숨깁니다.

```tsx
import { Divider } from '@idenflu/mono-react';

<Divider />
<Divider align="start">추가 정보</Divider>
<Divider variant="dashed" decorative />
```

`Table`은 기본 밀도인 `density="default"`와 행 간격을 줄인 `density="compact"`를 지원합니다. 글자 크기는 두 밀도 모두 본문 기준을 유지하며 첫·마지막 셀까지 같은 좌우 패딩을 적용합니다. 헤더는 배경 없이 위·아래 진한 구분선으로 표시하고, 행 사이는 연한 구분선, 마지막 행과 합계 행(`tfoot`)은 진한 구분선으로 마감합니다. 열 너비는 데이터에 맞게 `colgroup`으로 정의합니다. `TableContainer`는 좁은 화면에서 표 영역만 가로로 스크롤하도록 감쌉니다.

표 전체에 고정폭 숫자를 적용합니다. 숫자 열은 `table-numeric`(끝 정렬), 날짜는 `table-date`, 두 줄 셀은 `table-primary`·`table-secondary`, 빈 값 안내는 `table-muted` 클래스를 사용합니다. compact에서는 배지 높이를 20px로 맞추고, 표 안의 체크박스는 행 높이를 늘리지 않습니다.

행 hover 배경은 `interactive`를 지정한 표에만 표시합니다. 행 클릭으로 선택하거나 상세를 여는 표에 사용하며, 포인터 커서와 행 안의 키보드 포커스 표시도 함께 적용합니다. 선택한 행에는 `data-selected="true"`를 지정해 배경과 시작선으로 강조합니다. 선택 상태는 체크박스처럼 키보드로 조작할 수 있는 컨트롤로도 제공합니다.

```tsx
import { useState } from 'react';
import { Checkbox, Table, TableContainer } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

const files = [
  { id: 'tokens', name: 'design-tokens.json', size: 0.2 },
  { id: 'brand', name: '브랜드 가이드.pdf', size: 24.8 },
  { id: 'draft', name: '릴리스 노트.md', size: 0.1 },
];

export function FileTableExample() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(['tokens']));
  const allSelected = files.length > 0 && files.every(file => selected.has(file.id));
  const toggle = (id: string) => setSelected(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return <TableContainer label="공유 파일 목록">
    <Table interactive density="compact">
      <caption className="sr-only">공유 파일과 선택 상태</caption>
      <thead><tr>
        <th scope="col"><Checkbox label={<span className="sr-only">모든 파일 선택</span>}
          checked={allSelected} indeterminate={selected.size > 0 && !allSelected}
          onChange={() => setSelected(allSelected ? new Set() : new Set(files.map(file => file.id)))} /></th>
        <th scope="col">파일</th><th scope="col" className="table-numeric">크기</th>
      </tr></thead>
      <tbody>{files.map(file => <tr key={file.id}
        data-selected={selected.has(file.id) || undefined}
        onClick={event => { if (!(event.target as Element).closest('label, input, button, a')) toggle(file.id); }}>
        <td><Checkbox label={<span className="sr-only">{file.name} 선택</span>}
          checked={selected.has(file.id)} onChange={() => toggle(file.id)} /></td>
        <td>{file.name}</td><td className="table-numeric">{file.size}MB</td>
      </tr>)}</tbody>
    </Table>
  </TableContainer>;
}
```

## 로컬 예제

문서 스튜디오의 Table·Chips·폼 8종과 Select·Number fields·Date picker에는 데이터·상태·이벤트·배치 스타일을 포함한 전체 TSX 예제를 제공합니다. 화면에서 사용하는 구현을 기반으로 코드를 만들고, 문서 빌드 시 공개 패키지 타입으로 검사합니다. 폼은 검증·초기화와 FormData 미리보기를 포함하며 비밀번호·파일 내용은 미리보기에 노출하지 않습니다.

입력 문서는 공통 속성·이벤트·키보드·스타일 형식을 사용합니다. NumberField의 `onValueChange`는 쉼표 없는 확정 문자열이지만 FormData는 표시 문자열입니다. DateRangePicker의 `name="trip"`은 `trip-start`·`trip-end`로 제출합니다. 제어 상태 초기화는 부모 값을 복원하고, 아직 확정하지 않은 입력까지 되돌릴 때는 예제처럼 `key`도 갱신합니다.

저장소 루트와 이 디렉터리에서 `npm ci`를 실행하고 루트의 `npm run dev`로 서버를 시작합니다. 별도 패키지 예제는 아래 명령으로 빌드한 뒤 `/packages/react/examples/index.html`에서 엽니다.

```sh
cd packages/react
npm ci
npm run example:build
```

정식 모노 문서는 `/systems/idenflu-mono/index.html`에서 React로 동작합니다. `npm run studio:build`로 다시 빌드하며, 이전 `/packages/react/studio/index.html` 주소는 같은 문서로 이동합니다. Overview, Foundations, 29개 컴포넌트 분류와 Patterns의 Layout·Form 8개·데이터 상태·빈 상태를 포함한 46개 문서를 제공합니다. Layout 문서에서는 사이드바 워크스페이스 샘플을 별도 화면으로 열 수 있습니다. 독립 Page 예시는 제공하지 않습니다. 폼의 검증·초기화·파일 선택과 데이터 상태 전환은 로컬 예시로 동작하며 실제 저장·전송·예약은 수행하지 않습니다. Divider는 `/components/divider`에서 예시를 확인할 수 있습니다.

## 개발과 배포

루트와 이 디렉터리의 의존성을 먼저 설치합니다. 루트에서 기본 검사를 실행하고, 이 디렉터리에서 아래 패키지 검사를 실행합니다. 문서를 포함한 정적 배포물은 루트의 `npm run build`로 생성합니다.

```sh
npm ci
npm run typecheck
npm test
npm pack --dry-run
```

빌드 결과에 ESM·CommonJS, TypeScript 선언, `styles.css`·`tokens.css`·`reset.css`와 참조하는 에셋 및 에셋 라이선스가 포함됩니다. 배포 전에 개발 브랜치에서 패키지 버전을 올리고 변경을 `main`에 반영한 뒤, `Publish React package` GitHub Actions 워크플로에서 `main`을 선택해 수동 실행합니다. `dev`에서는 게시 작업을 실행하지 않습니다. 해당 워크플로는 저장소의 `GITHUB_TOKEN`으로 GitHub Packages에 게시하며 저장소의 Packages 쓰기 권한이 필요합니다.
