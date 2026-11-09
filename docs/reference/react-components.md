# React 컴포넌트 참조

설치와 스타일 설정은 [React 패키지 README](../../packages/mono-react/README.md), 앱 적용과 HTML 마이그레이션은 [프로젝트 적용 가이드](../guides/consumer-guide.md)를 확인합니다.

## 목차

- [컴포넌트 범주](#컴포넌트-범주)
- [기본 색상과 경계](#기본-색상과-경계)
- [Badge](#badge)
- [숨김 라벨](#숨김-라벨)
- [Button 비활성 상태](#button-비활성-상태)
- [IconButton](#iconbutton)
- [Popover·DropdownMenu 정렬](#popoverdropdownmenu-정렬)
- [TimePicker](#timepicker)
- [Tabs](#tabs)
- [DataGrid](#datagrid)
- [NumberField·DatePicker·DateRangePicker](#numberfielddatepickerdaterangepicker)
- [DateTimePicker·DateTimeRangePicker](#datetimepickerdatetimerangepicker)
- [중첩 팝업](#중첩-팝업)
- [NovaSpinner](#novaspinner)
- [Select·SearchSelect·MultiSelect](#selectsearchselectmultiselect)
- [Tree](#tree)
- [FileUpload](#fileupload)
- [Dialog·Drawer](#dialogdrawer)
- [Alert](#alert)
- [Toast](#toast)
- [Chip](#chip)
- [Divider](#divider)
- [Grid·GridItem](#gridgriditem)
- [Table](#table)

## 기본 색상과 경계

텍스트·배경·일반 보더는 라이트·다크 모두 중립 회색을 사용합니다. 블루는 주요 동작·링크·선택·포커스·Info에 사용합니다.

아래 기본값은 `packages/mono-react/src/styles/tokens.css`에서 생성합니다. 토큰 변경 후 `npm run docs:tokens`로 갱신하며 `npm run check`가 최신 여부를 확인합니다.

<!-- generated:token-colors:start -->
| 토큰 | Light | Dark | 용도 |
| --- | --- | --- | --- |
| `--canvas` | `#FFFFFF` | `#161616` | 페이지 배경 |
| `--surface-raised` | `#FFFFFF` | `#222222` | 카드·패널·입력 배경 |
| `--surface` | `#F5F5F5` | `#262626` | 보조 영역 |
| `--surface-hover` | `#EDEDED` | `#2E2E2E` | 중립 영역 호버 |
| `--surface-pressed` | `#E4E4E4` | `#383838` | 중립 영역 눌림 |
| `--text` | `#1C1C1C` | `#EDEDED` | 본문·제목 |
| `--text-secondary` | `#606060` | `#A6A6A6` | 보조 문구 |
| `--text-muted` | `#6E6E6E` | `#949494` | 부가 문구 |
| `--border` | `#E0E0E0` | `#393939` | 카드·패널의 구조 경계 |
| `--border-subtle` | `#E6E6E6` | `#333333` | 약한 경계 |
| `--divider` | `#E6E6E6` | `#333333` | 내부 구분선 |
| `--border-control` | `#C6C6C6` | `#737373` | 입력창·체크박스·라디오 경계 |
| `--border-control-hover` | `#999999` | `#999999` | 입력 경계 호버 |
| `--primary` | `#1062D3` | `#7FB3FD` | 링크·선택·포커스 |
| `--primary-control` | `#2466C8` | `#3B6CAE` | 주요 버튼 배경 |
<!-- generated:token-colors:end -->

`--border`는 카드·패널의 구조 경계, `--border-subtle`·`--divider`는 약한 경계와 내부 구분선입니다. 입력창·체크박스·라디오는 더 선명한 `--border-control`을 사용하며 구조선과 독립적으로 조정합니다. 입력 경계 호버는 `--border-control-hover`를 사용하고 포커스·오류 표시는 유지합니다. 화면 조정의 Border 변경은 구조선에 적용되며 입력 경계는 코어 기본값을 유지합니다. 라이트에서는 캔버스와 카드가 흰색을 공유하고, 다크에서는 배경 명도 차이로 영역을 구분합니다.

## 컴포넌트 범주

- 버튼: `Button`, `IconButton`
- 입력: `TextField`, `TextArea`, `NumberField`, `DatePicker`, `DateRangePicker`, `TimePicker`, `DateTimePicker`, `DateTimeRangePicker`, `Slider`, `FileUpload`
- 선택: `Select`, `SearchSelect`, `MultiSelect`, `NativeSelect`, `Checkbox`, `Radio`, `Switch`, `Segmented`, `Chip`
- 탐색과 정보: `Tabs`, `Tree`, `Accordion`, `List`, `Table`, `DataGrid`, `Pagination`, `Stepper`, `Card`, `Avatar`, `Icon`, `Divider`
- 레이아웃: `Grid`, `GridItem`
- 피드백과 오버레이: `Badge`, `Alert`, `Progress`, `Spinner`, `NovaSpinner`, `Skeleton`, `Dialog`, `Drawer`, `Toast`, `Tooltip`, `Popover`, `DropdownMenu`, `Slides`
- 데이터 상태: `DataState`, `useDataState` (로딩·실패·빈 목록·검색 결과 없음·정상 목록)

입력과 선택 컴포넌트는 React의 `value`/`onValueChange` 또는 `defaultValue`를 사용합니다. `TextField` 등 네이티브 입력 래퍼는 일반적인 `onChange`를 사용합니다. 날짜와 숫자의 `onValueChange`는 값을 확정하거나 증감할 때 호출하며 숫자는 정밀도를 유지하는 문자열을 전달합니다. `DateRangePicker`의 값은 `[시작일, 종료일]`이며 값은 `YYYY-MM-DD` 또는 `null`입니다.

컴포넌트의 값 변경은 React 콜백으로 받고 폼 유효성 검사는 앱에서 관리합니다. 이전 HTML 런타임과 DOM 이벤트 API는 제거했으며, 전환 방법은 [프로젝트 적용 가이드](../guides/consumer-guide.md)를 참고하세요.

## Badge

`Badge`는 상태를 짧은 문구로 표시하는 `span`입니다. 선택하거나 필터링하는 분류에는 `Chip`을 사용합니다. `variant`로 상태색, `appearance="solid"`로 상태색 배경과 반전 텍스트를 지정합니다. 기본 `appearance="default"`는 연한 배경을 사용합니다.

| 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `size` | `'sm' \| 'md' \| 'lg'` | 상위 크기 또는 `md` | 상위 `data-size`를 따르며 명시하면 해당 배지의 크기를 우선합니다. |
| `variant` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | 상태의 의미에 맞는 색상입니다. |
| `appearance` | `'default' \| 'solid'` | `'default'` | 연한 배경 또는 상태색 배경입니다. |
| `children` | `ReactNode` | — | 상태 문구와 선택적인 장식 아이콘입니다. |
| `className` | `string` | — | 배지에 추가할 CSS 클래스입니다. |

`id`, `title`, `aria-*`, `data-*`, 이벤트 등 `span`의 일반 HTML 속성도 전달합니다. 크기를 생략하면 상위 `data-size`를 따르고 상위 설정이 없으면 `md`가 됩니다. Compact 표 안에서는 `sm`을 상속하며, `size="md"`나 `size="lg"`로 개별 크기를 지정할 수 있습니다.

문서와 설치한 패키지는 같은 크기 규칙을 사용합니다. 다음 수치는 기본 설정 기준이며 사용자 글자 크기·행간 설정에 따라 글자와 높이가 커질 수 있습니다. 높이는 내용이 잘리지 않도록 필요한 여유를 유지합니다.

| 크기 | 높이 | 글자 | 행간 | 아이콘 | 좌우 여백 |
| --- | --- | --- | --- | --- | --- |
| `sm` | 20px | 12px | 16px | 12px | 6px |
| `md` | 24px | 13px | 18px | 14px | 8px |
| `lg` | 28px | 14px | 20px | 16px | 10px |

크기는 `size`로 선택하고, 세부 조정은 `className` 범위에서 CSS 변수를 재정의합니다. `--badge-font-size`(글자), `--badge-line-height`(행간), `--badge-height`(높이), `--badge-icon-size`(아이콘), `--badge-padding-inline`(좌우 여백), `--badge-gap`(아이콘과 문구 간격)을 사용합니다. 글자나 행간을 직접 바꾸면 높이도 함께 조정하세요.

```tsx
import { Badge, Icon } from '@idenflu/mono-react';

export function StatusBadges() {
  return <>
    <Badge size="sm" variant="success">완료</Badge>
    <Badge size="md" variant="success"><Icon name="check-circle" />완료</Badge>
    <Badge size="lg" variant="success" appearance="solid">
      <Icon name="check-circle-fill" />완료
    </Badge>
    <div data-size="sm">
      <Badge>SM 상속</Badge>
      <Badge size="md">MD 지정</Badge>
    </div>
  </>;
}
```

## 숨김 라벨

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

## Button 비활성 상태

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

## IconButton

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

## Popover·DropdownMenu 정렬

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

## TimePicker

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

## Tabs

`Tabs`는 기본 가로형이며 `orientation="vertical"`을 지정하면 왼쪽 탭 목록과 오른쪽 내용으로 배치합니다. 가로형은 ←·→, 세로형은 ↑·↓로 이동하고 Home·End로 처음과 마지막 탭을 선택합니다. 비활성 탭은 건너뛰며 탭 전환 시 입력값을 유지합니다. `value`·`onValueChange`로 선택 상태를 제어할 수 있습니다.

```tsx
import { Tabs } from '@idenflu/mono-react';

<Tabs label="설정 분류" orientation="vertical" items={[
  { value: 'general', label: '기본 정보', content: <p>워크스페이스 기본 정보</p> },
  { value: 'notifications', label: '알림', content: <p>이메일과 활동 알림</p> },
  { value: 'security', label: '보안', disabled: true, content: <p>관리자 전용</p> },
]} />
```

## DataGrid

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
| 외부 스크롤 초기화 | `scrollResetKey?: string \| number` 값을 바꾸면 가로·세로 스크롤을 처음으로 돌립니다. 외부 검색 조건 초기화와 연결할 수 있으며 밀도·열 너비 등 그리드 상태는 유지합니다. |
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
| 하단 슬롯 | `footer`에 ReactNode 또는 `(context: DataGridFooterContext<T>) => ReactNode`를 전달하면 기본 하단 전체(페이지 이동 포함)를 교체합니다. 생략하면 기존 하단, `null`·`false` 또는 이를 반환하는 콜백이면 하단을 숨깁니다. 하단을 바꿔도 조회·선택 상태의 스크린 리더 안내는 유지합니다. |

`DataGridFooterContext<T>`는 `totalCount`(원본 건수), `filteredCount`·`filteredRows`(검색·필터·정렬 후 모든 페이지의 결과), `selectedCount`·`selectedRows`(전체 원본 중 유효한 선택), `pageRows`(현재 페이지의 전체 행), `page`·`pageCount`·`pageSize`·`pagination`, `loading`·`hasError`를 제공합니다. 로딩·오류 중에는 `filteredCount`가 0, `filteredRows`·`pageRows`가 빈 배열입니다. 선택은 검색·페이지 밖에서도 유지하며 삭제되거나 선택 불가능해진 행은 제외합니다. `selectable={false}`에서는 선택 건수와 행을 비웁니다. 페이지네이션을 끄면 `pageRows`는 조회 결과 전체이며 가상 스크롤의 렌더링 범위로 제한되지 않습니다.

마지막 조회 일시는 앱이 조회 성공 시 저장한 값을 하단에 표시합니다. 그리드는 실제 서버 조회 시점을 알 수 없으므로 검색·선택 때 시각을 자동 갱신하지 않습니다. 문서의 사용자 지정 하단 예시에서 조회·선택 예산 합계와 건수, 다시 조회 후 갱신되는 일시(KST)를 확인할 수 있습니다.

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

숨겨진 탭에서는 마지막으로 측정한 그리드 크기를 유지하고, 다시 표시할 때 현재 영역에 맞춰 스크롤바와 열 너비를 화면이 그려지기 전에 갱신합니다.

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

## NumberField·DatePicker·DateRangePicker

`NumberField`, `DatePicker`, `DateRangePicker`에서 `value`가 `undefined`일 때만 `defaultValue`를 사용합니다. Controlled `null`은 빈 값입니다. 숫자의 `grouping`·`decimals`를 변경하면 현재 입력을 새 형식으로 표시하며, 정밀도를 줄여도 임의로 반올림하지 않고 기존 값을 보존해 검증합니다.

`NumberField`, `DatePicker`, `DateRangePicker`의 `error`로 부모 폼의 검증 메시지를 전달할 수 있습니다. 메시지는 입력의 오류 상태, 접근 가능한 설명과 네이티브 유효성 검사에 함께 반영됩니다.

입력 문서는 공통 속성·이벤트·키보드·스타일 형식을 사용합니다. NumberField의 `onValueChange`는 쉼표 없는 확정 문자열이지만 FormData는 표시 문자열입니다. DateRangePicker의 `name="trip"`은 `trip-start`·`trip-end`로 제출합니다. 제어 상태 초기화는 부모 값을 복원하고, 아직 확정하지 않은 입력까지 되돌릴 때는 예제처럼 `key`도 갱신합니다.

`NumberField`도 `prefixIcon`을 지원합니다. 아이콘은 입력값 앞에 표시되고, `unit`은 오른쪽에 표시됩니다. 아이콘을 눌러 입력에 포커스할 수 있으며 아이콘은 제출 값과 읽기 설명에서 제외됩니다.

```tsx
<NumberField label="참여 인원" prefixIcon={<Icon name="person" />}
  defaultValue="8" min="0" unit="명" />
```

## DateTimePicker·DateTimeRangePicker

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

## 중첩 팝업

중첩된 `Dialog`·`Drawer`·`Popover`·`DropdownMenu`·`Select`·날짜 팝업에서는 Escape가 가장 위의 팝업부터 한 단계씩 닫고 해당 트리거로 포커스를 돌려줍니다. 내부 입력이 Escape의 기본 동작을 취소하면 팝업은 유지됩니다.

## NovaSpinner

`NovaSpinner`는 NOVA Studio 로고를 사용한 로딩 표시입니다. `size`는 픽셀 단위이며 기본값은 48입니다. `appearance="orbit"`은 궤도 회전, `appearance="mark"`는 로고의 밝기 변화만 표시합니다. `variant`는 원본 색상의 `brand`와 `neutral`·`inverse`를 지원하며, 움직임 줄이기 설정에서는 애니메이션을 멈춥니다. `label`로 현재 작업을 설명하고, 버튼에 같은 설명이 있으면 `aria-hidden`으로 중복 안내를 피합니다.

```tsx
import { NovaSpinner, Spinner } from '@idenflu/mono-react';

<NovaSpinner size={64} label="프로젝트를 준비하는 중" />
<NovaSpinner size={24} appearance="mark" variant="neutral" />
<Spinner kind="nova" size="small" />
```

기존 `Spinner`의 `kind="nova"`도 같은 컴포넌트를 사용하며 기존 크기 규칙인 16·24·32px을 따릅니다. `inverse`는 밝은 단색이므로 진한 배경에 사용합니다.

## Select·SearchSelect·MultiSelect

```tsx
import { Button, DatePicker, Select } from '@idenflu/mono-react';
import { useRef, useState } from 'react';

function ProjectForm() {
  const teamRef = useRef<HTMLButtonElement>(null);
  const [team, setTeam] = useState('');
  const [error, setError] = useState<string>();
  const [date, setDate] = useState<string | null>(null);
  return <form noValidate onSubmit={event => {
    event.preventDefault();
    setError(team ? undefined : '담당 팀을 선택해주세요.');
    if (!team) teamRef.current?.focus();
  }}>
    <Select ref={teamRef} label="담당 팀" name="team" required
      value={team} onValueChange={value => {
        setTeam(value);
        setError(undefined);
      }}
      helperText="프로젝트를 담당할 팀을 선택하세요."
      error={error} options={[{ value: 'design', label: '디자인' }]} />
    <DatePicker label="시작일" name="start" value={date} onValueChange={setDate} />
    <Button type="submit">입력 확인</Button>
  </form>;
}
```

`Select`, `SearchSelect`, `MultiSelect`는 `TextField`와 같은 `helperText`·`error` 계약을 사용합니다. 도움말과 오류 ID를 실제 컨트롤의 `aria-describedby`에 연결하며, 외부에서 전달한 설명 ID도 유지합니다. `error`가 `null`·`undefined`가 아니면 오류 경계와 `aria-invalid`를 적용하고, 외부 `aria-invalid={false}`보다 우선합니다. 외부 오류가 있으면 내부 필수 선택 오류 대신 해당 메시지만 표시합니다.

표준 `ref`는 `Select`·`MultiSelect`에서 `HTMLButtonElement`, `SearchSelect`에서 `HTMLInputElement`를 가리킵니다. 태그형 `MultiSelect`는 옵션 목록을 여는 버튼을 가리키며 팝업 검색창이나 숨겨진 네이티브 select를 가리키지 않습니다. `ref.current?.focus()`로 폼의 첫 오류 항목에 포커스를 옮길 수 있습니다.

외부 `error`는 부모가 관리하므로 값 변경·폼 초기화 시 부모 오류 상태도 함께 갱신합니다. `form.reset()`은 비제어 선택값과 내부 필수 선택 오류를 초기화합니다. 외부 오류 표시는 앱의 제출 검증과 함께 사용하며, 네이티브 `required` 검증은 기존대로 유지됩니다. 위 예제는 `noValidate`로 부모 검증과 포커스 이동을 직접 처리합니다.

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

```tsx
import { Icon, Select } from '@idenflu/mono-react';

<Select label="담당 팀" prefixIcon={<Icon name="person" />} options={[
  { value: 'design', label: '디자인', description: '제품 경험을 설계합니다.' },
  { value: 'development', label: '개발', description: '제품을 구현합니다.' },
]} />
```

## Tree

`Tree`는 사이드 메뉴와 같은 disclosure 목록으로, Tab과 Enter·Space를 사용합니다. 파일 탐색기 방식의 ARIA tree 키보드 모델은 제공하지 않습니다.

## FileUpload

`FileUpload`는 파일 선택과 드롭, 선택적 `accept`·`maxSizeBytes` 검증을 처리하며 실제 업로드는 애플리케이션에서 연결합니다. 컴포넌트 내부의 크기·타이포그래피·초기화 규칙은 해당 컴포넌트 범위에만 적용합니다.

## Dialog·Drawer

`Dialog`는 `open`과 `onOpenChange`로 제어하며, 제목과 설명을 `aria-labelledby`·`aria-describedby`로 연결합니다. `closeOnBackdrop`은 배경 클릭으로 닫을지 정하며 기본값은 `false`입니다. Escape는 취소로 처리합니다. `initialFocusRef`에 내부 요소의 ref를 전달하면 모달이 열린 직후 해당 요소에 포커스를 줍니다. 생략하면 브라우저의 기본 포커스를 사용하며, 이 속성은 Drawer에서도 사용할 수 있습니다.

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

`Drawer`는 `Dialog`의 모달 동작과 속성을 공유하며 배경 클릭 닫기의 기본값은 `true`입니다. 기존 기본형은 본문 전체를 스크롤합니다. 고정된 헤더·하단이 필요하면 `variant="divided"`와 `DrawerHeader`·`DrawerBody`·`DrawerFooter`를 직접 자식으로 배치합니다. 본문의 기본 `tabIndex`는 `0`이며 각 구성 요소는 HTML 속성과 ref를 전달합니다. 기존 `DialogHeader`·`DialogBody`·`DialogFooter`도 함께 사용할 수 있습니다.

| Drawer 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `side` | `'right' \| 'left' \| 'top' \| 'bottom'` | `'right'` | 패널이 열리는 물리적 화면 가장자리 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full' \| number` | `'md'` | 좌우는 너비, 위아래는 높이. SM 320px·MD 480px·LG 640px·full 전체 화면. 숫자는 px |
| `variant` | `'default' \| 'divided'` | `'default'` | 기본 본문 또는 고정 헤더·하단과 스크롤 본문 |
| `closeOnBackdrop` | `boolean` | `true` | 배경 클릭 닫기. `false`여도 Escape로 닫을 수 있음 |
| `initialFocusRef` | `React.RefObject<HTMLElement \| null>` | — | 열린 직후 포커스를 받을 내부 요소의 ref |

크기는 화면 안으로 제한하며 `className`·`style`로 조정할 수 있습니다. `--drawer-size`는 패널 크기를 지정하는 CSS 변수입니다. 등장 효과는 움직임 줄이기 설정에서 생략합니다. 배경 닫기를 막아야 하는 편집·확인 흐름에는 `closeOnBackdrop={false}`를 사용하고, 명시적인 닫기 버튼을 제공합니다. 닫기 요청을 보류하려면 앱의 `onOpenChange`에서 미저장 변경이나 처리 상태를 확인합니다.

```tsx
import { Button, Drawer, DrawerHeader, DrawerBody, DrawerFooter, Icon } from '@idenflu/mono-react';

<Drawer side="right" size="lg" variant="divided"
        open={open} onOpenChange={setOpen} aria-labelledby="settings-title">
  <DrawerHeader>
    <h2 id="settings-title">프로젝트 설정</h2>
    <Button variant="ghost" iconOnly aria-label="설정 닫기"
            onClick={() => setOpen(false)}><Icon name="close" /></Button>
  </DrawerHeader>
  <DrawerBody><p>스크롤할 상세 내용을 배치합니다.</p></DrawerBody>
  <DrawerFooter><Button onClick={() => setOpen(false)}>완료</Button></DrawerFooter>
</Drawer>
```

## Alert

`Alert`는 관련 입력이나 작업 영역에 표시하는 인라인 안내입니다. `variant="info | success | warning | danger"`로 의미에 맞는 색상을 사용합니다. 정적인 안내에는 알림 역할을 생략하고, 작업 후 나타나는 완료 안내에는 `role="status"`, 즉시 알려야 하는 오류에는 `role="alert"`를 지정합니다.

## Toast

`Toast`의 `variant`에는 `info`·`success`·`warning`·`danger`를 지정하고, `action`에 재시도·실행 취소 버튼을 넣을 수 있습니다. 기본 알림 역할은 `status`이며 `danger`는 `alert`입니다. 자동으로 닫히지 않으므로 표시 상태와 닫기 동작을 앱에서 연결합니다.

기본 `appearance="default"`는 왼쪽 표시선에 상태 색상을 사용합니다. `appearance="solid"`는 배경 전체에 상태 색상을 적용하며 글자·닫기 버튼·ghost 동작 버튼도 함께 맞춥니다. 직접 색상을 재정의할 때는 `--toast-on-info`·`--toast-on-success`·`--toast-on-warning`·`--toast-on-danger`로 배경 위 글자색을 지정할 수 있습니다. 스튜디오 화면 조정에서는 색상 변경 시 이 글자색을 자동으로 보정합니다.

상태에 따라 완료 `check-circle`·안내 `info`·주의 `warning`·오류 `error-circle`이 기본 표시됩니다. `appearance="solid"`에서는 대응하는 `-fill` 아이콘으로 강조합니다. `icon`에 다른 React 아이콘을 전달해 바꾸거나 `icon={null}`로 숨길 수 있습니다. 아이콘은 장식으로 처리하며 의미는 메시지와 알림 역할로 전달합니다.

```tsx
<Toast variant="danger" appearance="solid" onDismiss={dismissToast}
  action={<Button variant="ghost" onClick={retrySave}>다시 시도</Button>}>
  저장하지 못했습니다. 다시 시도해주세요.
</Toast>
```

## Chip

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

## Divider

`Divider`는 기본 가로 구분선이며, `orientation="vertical"`로 세로 구분선을 표시합니다. 세로 구분선은 flex 부모에서 높이에 맞춰 늘어나므로 블록 안에서 사용할 때는 부모 높이나 `style`을 지정합니다. 자식 텍스트는 `align="start | center | end"`로 정렬하고, `variant="dashed"`는 점선을 표시합니다. 의미 있는 구분선은 `separator`로 제공하며 장식용은 `decorative`로 숨깁니다.

```tsx
import { Divider } from '@idenflu/mono-react';

<Divider />
<Divider align="start">추가 정보</Divider>
<Divider variant="dashed" decorative />
```

## Grid·GridItem

`Grid`는 CSS Grid를 기반으로 카드·폼·대시보드의 열 수, 간격과 정렬을 지정합니다. `GridItem`은 직접 자식 항목의 열·행 병합과 개별 정렬을 지정합니다. 두 컴포넌트는 `div`의 일반 HTML 속성·이벤트·`className`·`style`·`ref`를 전달하며 별도의 ARIA 역할을 부여하지 않습니다. 데이터 표의 검색·정렬·선택 기능은 `DataGrid`에서 제공합니다.

| 컴포넌트 | 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| Grid | `columns` | `ResponsiveValue<number>` | `1` | 양의 정수 열 수. 각 열은 가용 공간을 균등하게 나눕니다. |
| Grid | `gap` | `ResponsiveValue<GridSpacing>` | `6` | 두 축의 기본 간격 토큰 |
| Grid | `rowGap`·`columnGap` | `ResponsiveValue<GridSpacing>` | — | 행·열 간격을 각각 재정의합니다. |
| Grid | `alignItems` | `ResponsiveValue<'start' \| 'center' \| 'end' \| 'stretch' \| 'baseline'>` | `'stretch'` | 모든 항목의 세로 정렬 |
| Grid | `justifyItems` | `ResponsiveValue<'start' \| 'center' \| 'end' \| 'stretch'>` | `'stretch'` | 모든 항목의 가로 정렬 |
| GridItem | `colSpan` | `ResponsiveValue<number \| 'full'>` | `1` | 양의 정수 열 병합 수 또는 전체 열 |
| GridItem | `rowSpan` | `ResponsiveValue<number>` | `1` | 양의 정수 행 병합 수 |
| GridItem | `alignSelf`·`justifySelf` | 반응형 정렬 값 또는 `'auto'` | `'auto'` | 항목 하나의 세로·가로 정렬을 재정의합니다. `alignSelf`는 baseline도 지원합니다. |

`GridSpacing`은 `0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12`입니다. 숫자는 픽셀이 아닌 디자인 토큰이며 `gap={6}`은 `--space-6`을 사용합니다. 기본 여백에서 24px이고 `--space-unit`이나 화면 조정의 여백 배율을 바꾸면 함께 바뀝니다. `rowGap`·`columnGap`을 명시한 구간부터 해당 축의 값이 유지되며, 축 값을 아직 지정하지 않은 구간은 `gap`을 따릅니다.

각 배치 속성은 단일 값 또는 `{ base, sm, md, lg, xl }` 객체를 받습니다. `sm`은 600px, `md`는 900px, `lg`는 1200px, `xl`은 1440px부터 적용하는 화면 너비 기준입니다. 생략한 구간은 앞 구간의 값을 이어받으며 `base`도 생략하면 해당 속성의 기본값을 사용합니다. 화면 크기에 따라 DOM을 교체하지 않아 입력값과 포커스를 유지합니다.

```tsx
import { Grid, GridItem, Select, TextArea, TextField, Button } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function ProjectForm() {
  return <form onSubmit={event => event.preventDefault()}>
    <Grid columns={{ base:1, sm:2, lg:3 }} gap={6} alignItems="start">
      <TextField label="프로젝트 이름" name="name" required />
      <Select label="담당 팀" name="team" defaultValue="design"
              options={[{ value:'design', label:'프로덕트 디자인' },
                        { value:'engineering', label:'플랫폼 개발' }]} />
      <TextField label="담당자" name="owner" />
      <GridItem colSpan={{ base:1, sm:2 }}>
        <TextArea label="프로젝트 설명" name="description" rows={3} />
      </GridItem>
      <GridItem colSpan="full"><Button type="submit">저장</Button></GridItem>
    </Grid>
  </form>;
}
```

숫자 `colSpan`은 현재 Grid의 열 수 안으로 제한합니다. 전체 너비에는 `colSpan="full"`을 사용하면 열 수가 바뀌어도 해당 행의 처음부터 끝까지 배치합니다. `GridItem`은 해당 `Grid`의 직접 자식으로 배치하고, 중첩 영역에는 새 `Grid`를 사용합니다. 내용이 길면 줄바꿈·말줄임 또는 해당 영역의 스크롤 정책을 함께 지정하세요.

시각적 배치와 읽기·키보드 탐색 순서를 일치시키도록 DOM 순서를 구성합니다. `Grid`에는 키보드 이동이나 `role="grid"`를 자동으로 추가하지 않습니다. `style`은 기본 배치보다 우선하므로 필요한 CSS Grid 설정을 직접 확장할 수 있습니다.

## Table

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
