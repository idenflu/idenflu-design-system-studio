import * as React from 'react';
import { Table, TableContainer } from '../src';
import { Section } from './demo-layout';

type PropertyRow = readonly [name: string, type: string, initial: string, description: string];
type DetailRow = readonly [name: string, description: string];
type EventRow = readonly [signature: string, timing: string, connection: string];

function PropertyTable({ title, rows }: { title: string; rows: readonly PropertyRow[] }) {
  return <div className="studio-grid-reference-group">
    <h3>{title}</h3>
    <TableContainer label={title} className="studio-grid-reference-table">
      <Table density="compact" className="studio-grid-property-table">
        <colgroup><col style={{width:'23%'}} /><col style={{width:'27%'}} /><col style={{width:'15%'}} /><col style={{width:'35%'}} /></colgroup>
        <caption className="sr-only">{title}의 타입, 기본값과 사용 방법</caption>
        <thead><tr><th scope="col">속성</th><th scope="col">타입</th><th scope="col">기본값</th><th scope="col">설명</th></tr></thead>
        <tbody>{rows.map(([name, type, initial, description]) => <tr key={name}>
          <th scope="row"><code>{name}</code></th><td><code>{type}</code></td><td><code>{initial}</code></td><td>{description}</td>
        </tr>)}</tbody>
      </Table>
    </TableContainer>
  </div>;
}

function DetailTable({ title, rows }: { title: string; rows: readonly DetailRow[] }) {
  return <TableContainer label={title} className="studio-grid-reference-table">
    <Table density="compact">
      <caption className="sr-only">{title}</caption>
      <thead><tr><th scope="col">항목</th><th scope="col">설명</th></tr></thead>
      <tbody>{rows.map(([name, description]) => <tr key={name}><th scope="row"><code>{name}</code></th><td>{description}</td></tr>)}</tbody>
    </Table>
  </TableContainer>;
}

function CodeExample({ title, children }: { title: string; children: string }) {
  return <div className="studio-grid-reference-group"><h3>{title}</h3>
    <div className="react-studio-code studio-grid-reference-code" role="region" aria-label={title} tabIndex={0}><pre><code>{children}</code></pre></div>
  </div>;
}

const dataProps: readonly PropertyRow[] = [
  ['label', 'string', '필수', '툴바 제목, 그리드 그룹, 표와 페이지 탐색의 접근 가능한 이름입니다.'],
  ['rows', 'readonly T[]', '필수', '검색·필터·정렬·페이지 이동을 처리할 전체 데이터입니다. 그리드는 원본 배열을 수정하지 않습니다.'],
  ['columns', 'readonly DataGridColumn<T>[]', '필수', '열의 값, 표시, 정렬, 필터, 너비와 편집 규칙을 정의합니다.'],
  ['getRowId', '(row: T) => string', '필수', '고유하고 안정적인 행 ID입니다. 선택·편집·가상 행 추적에 사용하므로 배열 인덱스 대신 데이터의 ID를 반환하세요.'],
  ['getRowLabel', '(row: T) => string', 'undefined', '행 선택과 편집 버튼에 읽어 줄 이름입니다. 생략하면 getRowId의 값을 사용합니다.'],
  ['loading', 'boolean', 'false', '로딩 안내를 표시합니다. 데이터 행과 페이지 버튼을 숨기고 정렬·기본 CSV·밀도 변경 등을 비활성화합니다.'],
  ['error', 'ReactNode', 'undefined', '오류 안내 내용입니다. undefined·null·false는 오류가 없는 상태이며, loading과 함께 지정하면 로딩이 먼저 표시됩니다.'],
  ['emptyMessage', 'ReactNode', "'등록된 데이터가 없습니다.'", '데이터가 비었을 때의 내용입니다. 검색·필터 결과가 없을 때는 별도의 결과 없음 안내와 조건 초기화 버튼이 표시됩니다.'],
];

const stateProps: readonly PropertyRow[] = [
  ['searchable', 'boolean', 'true', '검색 입력을 표시하고 전체 검색을 적용합니다. false이면 query를 보관하더라도 검색에는 적용하지 않으며 열별 필터는 계속 적용합니다.'],
  ['searchLabel', 'string', "'검색'", '검색 입력의 접근 가능한 이름입니다.'],
  ['query', 'string', 'undefined', '부모가 제어하는 검색어입니다. 입력을 반영하려면 onQueryChange에서 갱신하세요.'],
  ['defaultQuery', 'string', "''", '비제어 검색어의 최초 값입니다. query가 있으면 사용하지 않습니다.'],
  ['filters', 'DataGridFilters', 'undefined', '부모가 제어하는 열별 필터입니다. 열 ID를 키로 사용하며 해당 열에 filter가 설정되어야 적용됩니다.'],
  ['defaultFilters', 'DataGridFilters', '{}', '비제어 필터의 최초 값입니다.'],
  ['sort', 'DataGridSort | null', 'undefined', '단일 정렬을 제어하는 기존 API입니다. null은 정렬 해제이며 sortModel이 있으면 sortModel을 우선합니다.'],
  ['defaultSort', 'DataGridSort | null', 'null', '최초 단일 정렬입니다. defaultSortModel이 없을 때만 초기 정렬에 사용합니다.'],
  ['sortModel', 'DataGridSortModel', 'undefined', '배열 순서대로 다중 정렬을 제어합니다. 빈 배열은 정렬 해제입니다. onSortModelChange에서 다음 배열을 반영하세요.'],
  ['defaultSortModel', 'DataGridSortModel', 'undefined', '비제어 다중 정렬의 최초 값입니다. 생략하면 defaultSort 또는 정렬 없는 상태로 시작합니다.'],
  ['selectable', 'boolean', 'false', '선택 체크박스와 선택 도구를 표시합니다.'],
  ['selectOnRowClick', 'boolean', 'true', '선택 가능한 행의 일반 영역을 클릭하면 선택을 전환합니다. false여도 체크박스 선택은 유지합니다.'],
  ['isRowSelectable', '(row: T) => boolean', 'undefined', 'false를 반환한 행은 선택할 수 없으며 선택 개수·전체 선택에서도 제외합니다. 생략하면 모든 행을 선택할 수 있습니다.'],
  ['selectedRowIds', 'readonly string[]', 'undefined', '부모가 제어하는 선택 ID입니다. 현재 rows에 존재하고 선택 가능한 ID만 그리드의 유효 선택으로 계산합니다.'],
  ['defaultSelectedRowIds', 'readonly string[]', '[]', '비제어 선택의 최초 값입니다. 페이지나 검색 조건이 바뀌어도 유효한 ID의 선택을 유지합니다.'],
  ['selectionActions', 'ReactNode', 'undefined', 'selectable이며 유효한 선택이 있을 때 툴바에 표시할 추가 액션입니다. 선택 ID는 전달되지 않으므로 부모의 selectedRowIds 상태를 사용하세요.'],
];

const displayProps: readonly PropertyRow[] = [
  ['page', 'number', 'undefined', '부모가 제어하는 1부터 시작하는 페이지입니다. 표시 범위를 벗어나면 유효 범위로 표시하고 onPageChange로 보정을 요청합니다.'],
  ['defaultPage', 'number', '1', '비제어 페이지의 최초 값입니다. 유효하지 않은 값은 1로 처리합니다.'],
  ['pageSize', 'number', 'undefined', '부모가 제어하는 페이지당 행 수입니다. 1 이상의 유한한 수를 내림하며 유효하지 않으면 10을 사용합니다.'],
  ['defaultPageSize', 'number', '10', '비제어 페이지 크기의 최초 값입니다.'],
  ['pageSizeOptions', 'readonly number[]', '[5, 10, 20, 50]', '페이지 크기 선택지입니다. 양의 정수만 남기고 현재 크기를 포함한 뒤 중복 제거·오름차순으로 표시합니다.'],
  ['density', "'default' | 'compact'", 'undefined', '부모가 제어하는 행 밀도입니다. 변경 콜백이 없으면 이 값을 유지하며 내장 밀도 토글도 숨깁니다.'],
  ['defaultDensity', "'default' | 'compact'", "'default'", '비제어 밀도의 최초 값입니다. density가 있으면 사용하지 않습니다.'],
  ['showDensityToggle', 'boolean', 'true', '밀도 전환 아이콘의 표시 여부입니다. true여도 density만 제어하고 onDensityChange가 없으면 표시하지 않습니다.'],
  ['showColumnVisibility', 'boolean', 'true', '열이 둘 이상이면 표시 열 메뉴를 제공합니다. 마지막으로 보이는 열은 숨길 수 없습니다.'],
  ['defaultHiddenColumnIds', 'readonly string[]', '[]', '최초에 숨길 열 ID입니다. 모든 열을 숨기도록 설정해도 첫 열 하나는 표시합니다. 이후 표시 상태는 내부에서 관리합니다.'],
  ['maxHeight', 'number | string', 'undefined', '툴바·푸터를 제외한 표 뷰포트의 최대 높이입니다. 숫자는 px이며 문자열은 CSS 길이입니다. 가상화에서는 생략·유효하지 않은 숫자·none 등의 해제 값 대신 480px을 사용합니다.'],
  ['virtualized', 'boolean | DataGridVirtualizationOptions', 'false', 'true 또는 옵션 객체로 세로 행 가상화를 켭니다. 화면 근처 행을 렌더링하고 실제 행 높이를 측정합니다.'],
  ['pagination', 'boolean', '!virtualized', '일반 표는 기본 true, 가상화는 기본 false입니다. 가상화와 함께 true를 지정하면 현재 페이지 안에서 가상화합니다.'],
  ['className', 'string', 'undefined', '최상위 .data-grid에 추가할 클래스입니다. 스타일 범위를 이 클래스 아래로 제한할 수 있습니다.'],
];

const exportProps: readonly PropertyRow[] = [
  ['exportable', 'boolean', 'false', '검색·필터·정렬 결과 전체 CSV 버튼을 표시합니다. 선택이 있으면 선택 행 CSV 버튼도 표시합니다. 현재 페이지나 렌더링된 가상 행만 내보내는 기능이 아닙니다.'],
  ['exportFileName', 'string', "'data-grid.csv'", 'CSV 저장 시 제안할 파일명입니다. 선택 행은 -selected.csv를 붙입니다. 최종 파일명과 저장 위치는 저장 대화상자 또는 브라우저 설정을 따릅니다.'],
];

const columnProps: readonly PropertyRow[] = [
  ['id', 'string', '필수', '열의 고유 ID입니다. 정렬·필터·숨김·편집·사용자 너비를 연결하는 키입니다.'],
  ['header', 'string', '필수', '헤더, 필터·편집 컨트롤의 이름과 CSV 제목으로 사용합니다.'],
  ['accessor', '(row: T) => string | number | null | undefined', '필수', '검색·필터·정렬·편집 초깃값·CSV에 사용하는 원시 값입니다. 숫자 정렬에는 number를 반환하세요.'],
  ['cell', '(row: T) => ReactNode', 'undefined', '화면에 표시할 셀만 바꿉니다. 생략하면 accessor의 값을 표시하고 null·undefined는 대시로 표시합니다.'],
  ['sortable', 'boolean', 'true', 'false이면 정렬 버튼을 표시하지 않고 이 열의 정렬 모델도 적용하지 않습니다.'],
  ['align', "'start' | 'center' | 'end'", "'start'", '헤더와 셀의 텍스트 정렬입니다. 금액·수량에는 end를 사용합니다.'],
  ['width', 'number | string', '160px', '숫자, 숫자 문자열, px, %를 지원합니다. 비율은 선택 열 52px을 제외한 뷰포트 폭 기준입니다. auto·fr·calc() 등은 160px로 대체하고 min/max 범위를 적용합니다.'],
  ['flex', 'number', 'undefined', '유한한 양수이면 width보다 우선하며 고정·비율 열을 제외한 남은 폭을 가중치로 나눕니다. 뷰포트 폭을 아직 측정하지 못한 때에는 width 또는 160px을 사용합니다.'],
  ['minWidth', 'number', '96', '열의 최소 px 너비입니다. 1 이상의 유한한 수를 내림하며 유효하지 않으면 96을 사용합니다.'],
  ['maxWidth', 'number', '600', '열의 최대 px 너비입니다. 1 이상의 유한한 수를 내림하며 최소 너비보다 작으면 최소 너비로 보정합니다.'],
  ['resizable', 'boolean', 'true', 'false이면 해당 열의 드래그·키보드 너비 조절 핸들을 숨깁니다. width와 flex 계산은 그대로 적용합니다.'],
  ['pinned', "'start'", 'undefined', '보이는 열의 시작 부분으로 이동해 가로 스크롤에서 고정합니다. 여러 고정 열은 입력 순서를 유지합니다. 600px 이하 화면에서는 고정을 해제합니다.'],
  ['filter', "'text' | 'number' | 'select'", 'undefined', '열별 필터를 표시합니다. text는 부분 일치, number는 최소·최대 포함 범위, select는 문자열 완전 일치입니다.'],
  ['filterOptions', 'readonly { value: string; label: string }[]', '[]', 'select 필터의 선택지입니다. value는 accessor 결과를 문자열로 바꾼 값과 비교하며 빈 값은 전체 선택으로 처리합니다.'],
  ['editable', 'boolean | ((row: T) => boolean)', 'false', 'true인 셀에서 편집 버튼을 표시합니다. 그리드의 onCellEdit도 함께 있어야 편집할 수 있습니다.'],
  ['editor', "'text' | 'number'", "'text'", '내장 입력의 타입입니다. number여도 저장 콜백의 value는 문자열입니다. 빈 값 허용 여부·범위는 validate로 정하세요.'],
  ['validate', '(value: string, row: T) => string | undefined', 'undefined', '저장 직전에 검사합니다. 오류 문자열을 반환하면 저장하지 않고 입력에 오류를 표시합니다. undefined 또는 빈 문자열이면 통과합니다.'],
];

const events: readonly EventRow[] = [
  ['onQueryChange(query: string): void', '검색 입력·검색 초기화·결과 없음의 조건 초기화 때 호출합니다.', 'query를 제어한다면 받은 문자열로 부모 상태를 갱신합니다.'],
  ['onFiltersChange(filters: DataGridFilters): void', '열별 필터 변경, 필터 초기화, 조건 초기화 때 다음 필터 객체를 전달합니다.', 'filters 상태를 받은 객체로 교체합니다. 초기화 시 {}를 받습니다.'],
  ['onSortModelChange(sortModel: DataGridSort[]): void', '헤더 클릭·Shift+클릭으로 정렬 조건을 바꿀 때 다음 전체 배열을 전달합니다.', 'sortModel 상태를 배열 전체로 교체합니다. 배열 순서가 정렬 우선순위입니다.'],
  ['onSortChange(sort: DataGridSort | null): void', '헤더 조작으로 첫 번째 정렬 조건이 바뀔 때만 호출합니다. 보조 조건만 바뀌면 호출하지 않습니다.', 'sort를 사용하는 경우 다음 첫 정렬을 반영합니다. 다중 정렬에는 onSortModelChange를 사용합니다.'],
  ['onSelectedRowIdsChange(ids: string[]): void', '행·체크박스·전체 선택·선택 해제 조작으로 선택을 바꿀 때 유효한 전체 ID 목록을 전달합니다.', 'selectedRowIds를 갱신합니다. rows 또는 isRowSelectable 변경만으로 선택 정리 콜백이 자동 발생하지는 않습니다.'],
  ['onPageChange(page: number): void', '페이지 탐색, 검색·필터·정렬·페이지 크기 변경에 따른 1페이지 요청, 범위를 벗어난 페이지 보정 때 호출합니다.', 'page를 제어한다면 요청한 페이지로 갱신합니다. pagination=false에서는 페이지 이동 UI와 조건 변경의 페이지 초기화가 없습니다.'],
  ['onPageSizeChange(pageSize: number): void', '페이지당 행 수 선택을 바꾸면 숫자로 전달합니다.', 'pageSize를 갱신합니다. 페이지 초기화 요청인 onPageChange(1)가 호출되면 함께 반영하세요.'],
  ["onDensityChange(density: 'default' | 'compact'): void", '내장 밀도 토글을 누르면 다음 밀도를 전달합니다.', 'density 상태를 갱신합니다. density 없이 콜백만 전달하면 내부 상태 변경을 알림으로 받을 수 있습니다.'],
  ['onCellEdit(change: DataGridCellEdit<T>): void', '편집 입력에서 Enter 또는 저장 버튼을 누르고 숫자 검사·validate를 통과했을 때 호출합니다.', 'rowId와 columnId로 rows를 갱신합니다. value는 항상 문자열이므로 숫자 필드는 부모에서 Number(value)로 변환합니다. 서버 저장도 이곳에서 연결합니다.'],
  ['onRetry(): void', 'error 안내의 다시 시도 버튼을 클릭할 때 호출합니다.', '부모의 데이터 조회 함수를 연결해 loading·error·rows를 갱신합니다. 생략하면 버튼을 표시하지 않습니다.'],
];

const controlledExample = `import { useState } from 'react';
import {
  DataGrid, type DataGridCellEdit, type DataGridColumn,
  type DataGridFilters, type DataGridSort,
} from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

type Task = { id: string; name: string; hours: number };
const columns: DataGridColumn<Task>[] = [
  { id: 'name', header: '작업', accessor: row => row.name,
    filter: 'text', editable: true,
    validate: value => value.trim() ? undefined : '이름을 입력해주세요.' },
  { id: 'hours', header: '시간', accessor: row => row.hours,
    align: 'end', filter: 'number', editable: true, editor: 'number',
    validate: value => value.trim() && Number(value) >= 0
      ? undefined : '0 이상 입력해주세요.' },
];

export function TaskGrid() {
  const [rows, setRows] = useState<Task[]>([
    { id: 't1', name: '문서 작성', hours: 8 },
    { id: 't2', name: '검토', hours: 4 },
  ]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DataGridFilters>({});
  const [sortModel, setSortModel] = useState<DataGridSort[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<'default' | 'compact'>('default');
  const edit = ({ rowId, columnId, value }: DataGridCellEdit<Task>) => {
    setRows(current => current.map(row => {
      if (row.id !== rowId) return row;
      if (columnId === 'hours') return { ...row, hours: Number(value) };
      if (columnId === 'name') return { ...row, name: value.trim() };
      return row;
    }));
  };

  return <DataGrid label="작업 목록" rows={rows} columns={columns}
    getRowId={row => row.id} getRowLabel={row => row.name}
    query={query} onQueryChange={setQuery}
    filters={filters} onFiltersChange={setFilters}
    sortModel={sortModel} onSortModelChange={setSortModel}
    selectable selectedRowIds={selected} onSelectedRowIdsChange={setSelected}
    selectionActions={<button type="button" onClick={() => {
      setRows(current => current.filter(row => !selected.includes(row.id)));
      setSelected([]);
    }}>선택 삭제</button>}
    page={page} onPageChange={setPage}
    pageSize={pageSize} onPageSizeChange={setPageSize}
    density={density} onDensityChange={setDensity}
    onCellEdit={edit} maxHeight={420} />;
}`;

const sizingExample = `import { type DataGridColumn } from '@idenflu/mono-react';

type Item = { id: string; name: string; owner: string; status: string };
const columns: DataGridColumn<Item>[] = [
  { id: 'name', header: '이름', accessor: row => row.name,
    flex: 2, minWidth: 180, pinned: 'start' },
  { id: 'id', header: 'ID', accessor: row => row.id,
    flex: 1, minWidth: 100, maxWidth: 220 },
  { id: 'owner', header: '담당자', accessor: row => row.owner,
    width: '25%', minWidth: 120, maxWidth: 300 },
  { id: 'status', header: '상태', accessor: row => row.status,
    width: 120, minWidth: 120, maxWidth: 120, resizable: false },
];
// 선택 열을 제외한 폭에서 25% 열과 120px 열을 먼저 계산합니다.
// 남은 폭은 name과 id가 2:1로 나누며 각 min/max를 지킵니다.`;

const stylingExample = `// JSX: className은 그리드 최상위 요소에 추가됩니다.
<DataGrid label="작업 목록" rows={rows} columns={columns}
  getRowId={row => row.id} className="team-grid"
  defaultDensity="compact" maxHeight={420} />

/* 기본 styles.css 다음에 불러올 CSS */
.data-grid.team-grid {
  border-radius: 0;
}
.data-grid.team-grid[data-density="compact"] {
  --data-grid-header-height: 44px;
}
.data-grid.team-grid .data-grid-search { width: 280px; }
.data-grid.team-grid .data-grid-table tbody tr[data-selected="true"] > td {
  background: var(--success-surface);
}
/* 필터 행의 sticky 위치도 --data-grid-header-height를 따라갑니다. */`;

const csvExample = `import {
  createDataGridCsv, downloadDataGridCsv,
  type DataGridCsvColumn,
} from '@idenflu/mono-react';

type Task = { id: string; name: string; hours: number };
const rows: Task[] = [{ id: 't1', name: '문서 작성', hours: 8 }];
const csvColumns: DataGridCsvColumn<Task>[] = [
  { header: '작업', accessor: row => row.name },
  { header: '시간', accessor: row => row.hours },
];

// 브라우저나 서버에서 CSV 문자열만 생성합니다.
const csv = createDataGridCsv({ rows, columns: csvColumns });

// 브라우저 버튼의 클릭 핸들러에서 직접 호출합니다.
const saveCsv = async () => {
  try {
    await downloadDataGridCsv({
      rows, columns: csvColumns, fileName: 'tasks.csv',
    });
  } catch {
    window.alert('CSV 저장에 실패했습니다. 다시 시도해주세요.');
  }
};
// <button type="button" onClick={saveCsv}>CSV 저장</button>`;

export function DataGridReferenceLinks() {
  const links = [
    ['data-grid-props', '속성'], ['data-grid-columns', '열·타입'],
    ['data-grid-events', '이벤트·상태 연결'], ['data-grid-styles', '스타일'],
    ['data-grid-behavior', '동작·CSV'],
  ] as const;
  return <nav className="studio-grid-reference-links" aria-label="데이터그리드 문서 바로가기">
    {links.map(([id, label]) => <a key={id} href={`#${id}`} onClick={event => {
      event.preventDefault();
      const section = document.getElementById(id);
      section?.scrollIntoView({ block: 'start' });
      section?.querySelector('h2')?.focus({ preventScroll: true });
    }}>{label}</a>)}
  </nav>;
}

export function DataGridReference() {
  return <>
    <Section id="data-grid-props" title="속성 · DataGridProps<T>" className="studio-grid-reference" description="필수 데이터부터 상태·표시·내보내기까지 실제 지원하는 속성입니다. 이벤트 콜백의 타입과 연결 방법은 아래 이벤트 표에서 확인하세요.">
      <p className="studio-grid-reference-notes">기본값이 undefined인 선택 속성은 생략할 수 있습니다. 제어 속성은 부모 값이 우선하고, default 속성은 최초 비제어 상태에만 적용됩니다.</p>
      <PropertyTable title="데이터와 조회 상태" rows={dataProps} />
      <PropertyTable title="검색·정렬·선택 상태" rows={stateProps} />
      <PropertyTable title="페이지·밀도·가상화와 표시" rows={displayProps} />
      <PropertyTable title="CSV 내보내기" rows={exportProps} />
    </Section>

    <Section id="data-grid-columns" title="열과 관련 타입" className="studio-grid-reference" description="화면의 표현은 cell로, 검색·정렬·필터·편집·CSV의 원시 값은 accessor로 구분합니다.">
      <PropertyTable title="DataGridColumn<T>" rows={columnProps} />
      <CodeExample title="상태·편집 타입">{`type DataGridSort = { columnId: string; direction: 'asc' | 'desc' };
type DataGridSortModel = readonly DataGridSort[];
type DataGridFilters = Record<string, string | { min?: string; max?: string }>;
type DataGridCellEdit<T> = {
  row: T; rowId: string; columnId: string; value: string;
};

// text/select 필터는 문자열, number 필터는 min/max 문자열을 사용합니다.
const filters: DataGridFilters = {
  name: '문서', status: '진행 중', hours: { min: '0', max: '40' },
};`}</CodeExample>
      <PropertyTable title="DataGridVirtualizationOptions" rows={[
        ['estimateRowHeight', 'number', '56 / compact: 40', '최초 행 높이 추정치(px)입니다. 유한한 양수는 16~1000으로 제한하며 실제로 렌더링된 행은 측정한 높이를 사용합니다.'],
        ['overscan', 'number', '8', '뷰포트 앞뒤에 여유로 렌더링할 행 수입니다. 유한한 0 이상의 수를 내림해 0~100으로 제한합니다. 편집·포커스 유지용 행은 별도로 남을 수 있습니다.'],
      ]} />
      <CodeExample title="px·%·flex를 함께 사용하는 열 너비">{sizingExample}</CodeExample>
      <p className="studio-grid-reference-notes">최소 너비 합이 뷰포트보다 크면 가로로 스크롤합니다. 최대 너비 합이 작으면 빈 공간이 남을 수 있습니다. 사용자가 조절한 열은 px로 고정되고, 핸들의 더블클릭 또는 Enter로 width·flex의 원래 계산을 복구합니다.</p>
    </Section>

    <Section id="data-grid-events" title="이벤트와 부모 상태 연결" className="studio-grid-reference" description="콜백은 모두 선택 속성이며 기본값은 undefined입니다. 상태를 제어하면 콜백에서 다음 값을 부모 상태에 반영하세요.">
      <TableContainer label="데이터그리드 이벤트 콜백" className="studio-grid-reference-table">
        <Table density="compact">
          <caption className="sr-only">콜백 시그니처, 발생 시점과 부모 상태 연결 방법</caption>
          <thead><tr><th scope="col">시그니처</th><th scope="col">발생 시점</th><th scope="col">부모에서 연결할 동작</th></tr></thead>
          <tbody>{events.map(([signature, timing, connection]) => <tr key={signature}><th scope="row"><code>{signature}</code></th><td>{timing}</td><td>{connection}</td></tr>)}</tbody>
        </Table>
      </TableContainer>
      <p className="studio-grid-reference-notes">query·filters·선택·page·pageSize를 제어하면 콜백에서 부모 상태를 갱신해야 사용자 변경을 반영합니다. 밀도는 density만 넘겨도 읽기 전용 표시가 가능하며 토글을 숨깁니다. 정렬의 제어 우선순위는 sortModel → sort → 내부 상태입니다.</p>
      <CodeExample title="제어 상태와 숫자 셀 편집">{controlledExample}</CodeExample>
    </Section>

    <Section id="data-grid-styles" title="스타일과 표시 사용자화" className="studio-grid-reference" description="레이아웃은 지원 속성으로 지정하고, 세부 표현은 className으로 범위를 정한 CSS와 디자인 토큰을 사용합니다.">
      <DetailTable title="스타일을 지정하는 지원 API" rows={[
        ['className', '최상위 .data-grid에 클래스를 추가합니다. DataGridProps는 일반 div 속성을 상속하지 않으므로 style 대신 이 클래스에 CSS를 작성합니다.'],
        ['density / defaultDensity', '기본·compact의 행 간격을 선택합니다. 현재 밀도는 최상위 .data-grid와 내부 .data-grid-table의 data-density 속성에 표시됩니다.'],
        ['maxHeight', '표 뷰포트의 최대 높이입니다. 툴바와 푸터는 이 높이에 포함되지 않습니다.'],
        ['columns: width / flex / minWidth / maxWidth', '열 너비는 이 속성으로 계산합니다. 헤더·셀에 CSS width를 별도로 지정하기보다 열 정의를 변경하세요.'],
        ['columns: align / pinned / cell', '정렬·시작 고정·셀 표시를 설정합니다. cell에서 반환한 요소에는 자체 className을 지정할 수 있습니다.'],
      ]} />
      <div className="studio-grid-reference-group"><h3>사용하는 CSS 토큰</h3>
        <DetailTable title="데이터그리드 CSS 토큰" rows={[
          ['--data-grid-header-height', '헤더 높이와 필터 행의 sticky 시작 위치입니다. 기본 48px, compact 40px이며 실제 헤더 높이를 바꿀 때 이 값도 함께 맞춥니다.'],
          ['--field-background / --surface', '그리드·본문·고정 셀의 배경 / 헤더·필터 행의 배경입니다.'],
          ['--border / --divider / --radius-control', '바깥 테두리·행과 헤더 경계 / 고정 열과 선택 도구 구분선 / 모서리 반경입니다.'],
          ['--text / --text-secondary / --text-muted', '기본 글자 / 보조 안내와 편집 아이콘 / 숫자 필터 구분선 등의 색입니다.'],
          ['--info-surface / --surface-hover', '선택 행 / 선택하지 않은 행의 hover 배경입니다. 고정 셀까지 같은 배경을 적용합니다.'],
          ['--primary / --focus-on-light / --danger-text', '활성 정렬·너비 핸들 / 키보드 포커스 / 편집 검증 오류의 색입니다.'],
          ['--font-size-body / --line-height-body / --font-size-caption', '기본 글자 크기·줄 높이와 보조 안내·편집 오류의 글자 크기입니다.'],
          ['--space-1 ~ --space-4 / --space-8', '도구 간격, 툴바·푸터·필터·선택 셀의 여백, 빈 상태 안내의 여백에 사용합니다.'],
          ['--icon-size / --control-height', '밀도 아이콘 크기 / 편집 저장·취소 버튼의 높이입니다.'],
        ]} />
      </div>
      <div className="studio-grid-reference-group"><h3>선택자와 상태 속성</h3>
        <DetailTable title="데이터그리드 CSS 선택자" rows={[
          ['.data-grid-toolbar / .data-grid-tools / .data-grid-search', '상단 영역, 도구 묶음, 검색 입력의 컨테이너입니다.'],
          ['.data-grid-viewport / .data-grid-scroll / .data-grid-table', '최대 높이 적용 영역, 실제 스크롤 영역, 내부 표입니다.'],
          ['.data-grid-table tbody tr[data-selected="true"] > td', '선택 행의 일반·고정 셀 배경에 함께 적용하는 선택자입니다.'],
          ['.data-grid[data-density="compact"] / [data-virtualized]', '현재 밀도 / 가상화가 켜진 그리드를 구분합니다.'],
          ['.data-grid-pinned / .data-grid-select-cell / .data-grid-filter-row', '시작 고정 셀, 선택 체크박스 셀, 필터 행입니다. 고정 위치는 그리드가 계산합니다.'],
          ['.data-grid-cell-content / .data-grid-editor / .data-grid-editor-error', '읽기 상태의 셀 내용, 편집 입력·버튼 묶음, 편집 오류입니다.'],
          ['.data-grid-selection-actions / .data-grid-state / .data-grid-footer', '선택 액션 묶음, 로딩·오류·빈 상태 안내, 상태·페이지 영역입니다.'],
        ]} />
      </div>
      <CodeExample title="className으로 한 그리드에만 적용하기">{stylingExample}</CodeExample>
    </Section>

    <Section id="data-grid-behavior" title="동작 기준과 CSV 헬퍼" className="studio-grid-reference" description="데이터 처리 범위, 선택·편집·가상화의 차이와 파일 저장 방식을 확인하세요.">
      <dl className="studio-grid-reference-notes">
        <div><dt>검색과 필터</dt><dd>전체 검색은 모든 열의 accessor 값과 검색어의 앞뒤 공백을 제거하고 소문자로 바꿔 부분 일치로 찾습니다. 검색과 각 열 필터는 AND로 적용하며 숨긴 열도 처리에 포함합니다. 숫자 필터의 빈 경계는 제한하지 않고, 숫자로 해석되지 않는 경계도 적용하지 않습니다.</dd></div>
        <div><dt>정렬</dt><dd>일반 클릭은 단일 정렬, Shift+클릭은 조건 추가·변경입니다. 각 열은 오름차순 → 내림차순 → 해제 순환입니다. 숫자는 수치로, 나머지는 한국어 기반 문자열로 비교하며 null·undefined는 방향과 무관하게 뒤로 보냅니다. 동률이면 원래 행 순서를 유지합니다.</dd></div>
        <div><dt>페이지와 가상화</dt><dd>일반 모드는 기본 10행씩 페이지를 나눕니다. virtualized를 켜면 기본적으로 페이지 없이 결과 전체를 스크롤합니다. pagination=true를 함께 주면 먼저 페이지를 나눈 뒤 그 페이지를 가상화합니다. 가상화는 렌더링 행 수를 줄이며 검색·필터·정렬은 전달한 전체 rows에서 계속 실행합니다.</dd></div>
        <div><dt>선택 범위</dt><dd>헤더 체크박스는 페이지 이동이 켜져 있으면 현재 페이지의 선택 가능한 행, 꺼져 있으면 검색 결과 전체에 적용합니다. 선택은 안정적인 ID로 페이지와 검색 조건 사이에서 유지합니다. 링크·버튼·입력 조작과 텍스트 드래그는 행 클릭 선택을 바꾸지 않습니다. 사용자 요소에는 data-grid-ignore-row-click을 넣어 행 클릭 선택에서 제외할 수 있습니다.</dd></div>
        <div><dt>편집</dt><dd>onCellEdit와 열의 editable이 함께 있어야 편집할 수 있습니다. Enter·저장으로 확정하고 Escape·취소로 닫습니다. blur만으로는 저장하거나 취소하지 않습니다. 그리드는 rows를 수정하지 않으므로 부모가 저장 결과를 반영해야 합니다. 편집 중인 행이 현재 결과에서 사라지거나 열이 숨겨지거나 로딩·오류 상태가 되면 편집을 닫습니다.</dd></div>
        <div><dt>너비 조절</dt><dd>핸들 드래그 또는 ←·→로 10px씩, Shift와 함께 누르면 1px씩 조절합니다. Home·End는 최소·최대 너비로 이동합니다. 조절한 너비는 내부 px 값으로 유지하며 Enter·더블클릭으로 원래 width·flex를 복구합니다. 열 표시가 바뀌거나 뷰포트가 변하면 고정되지 않은 비율·flex 열은 다시 계산합니다.</dd></div>
        <div><dt>기본 CSV 범위</dt><dd>전체 내보내기는 검색·필터·정렬 결과 전체를 현재 보이는 열 순서로 저장합니다. 선택 행 내보내기는 현재 rows에서 선택된 행을 원래 입력 순서로 저장하므로 검색 결과 밖의 선택도 포함합니다. 두 방식 모두 cell의 JSX 대신 accessor 값과 header를 사용합니다.</dd></div>
        <div><dt>저장 위치 선택</dt><dd>showSaveFilePicker를 지원하면 파일명과 저장 위치를 선택하는 기본 저장 대화상자를 엽니다. 미지원 환경은 파일명 입력 prompt를 표시한 뒤 브라우저 다운로드 설정에 따라 저장합니다. 취소는 오류 없이 종료합니다. 저장 위치를 지정하는 prop은 없으며, 실패하면 그리드 툴바에 오류를 표시합니다.</dd></div>
      </dl>
      <div className="studio-grid-reference-group"><h3>독립 CSV API</h3>
        <DetailTable title="데이터그리드 CSV 함수와 타입" rows={[
          ['DataGridCsvColumn<T>', 'header: string과 accessor: (row: T) => string | number | null | undefined로 구성합니다. DataGridColumn<T>도 이 구조를 포함하므로 그대로 전달할 수 있습니다.'],
          ['DataGridCsvOptions<T>', 'rows: readonly T[]와 columns: readonly DataGridCsvColumn<T>[]입니다. 헬퍼는 받은 데이터 그대로 처리하므로 검색·정렬·선택 범위를 호출자가 준비합니다.'],
          ['createDataGridCsv<T>(options): string', '브라우저·서버에서 CSV 문자열을 반환합니다. UTF-8 BOM, CRLF 줄바꿈과 쉼표·따옴표·개행 이스케이프를 포함합니다. 수식처럼 시작하는 문자열에는 작은따옴표를 붙이며 실제 number 값은 그대로 유지합니다.'],
          ['DownloadDataGridCsvOptions<T>', 'DataGridCsvOptions<T>에 fileName?: string을 추가합니다. 기본 파일명은 data-grid.csv이며 사용할 수 없는 파일명 문자는 _로 바꾸고 .csv 확장자를 보완합니다.'],
          ['downloadDataGridCsv<T>(options): Promise<void>', '브라우저에서 저장 대화상자 또는 파일명 prompt와 다운로드를 실행합니다. 취소 시 resolve하고 실제 저장 오류는 reject합니다. 서버에서 호출하면 오류가 발생하므로 문자열 생성 API를 사용합니다.'],
        ]} />
      </div>
      <CodeExample title="CSV 문자열 생성과 저장">{csvExample}</CodeExample>
    </Section>
  </>;
}
