import * as React from 'react';
import { Button, DataGrid, Icon, IconButton, type DataGridColumn } from '../src';
import { Section } from './demo-layout';
import {ProjectStatusBadge} from './status-definitions';

type Project = {id:string; name:string; owner:string; status:'진행 중'|'검토 중'|'준비 중'|'완료'};
const initialRows:Project[] = [
  {id:'extension-1',name:'디자인 시스템',owner:'김민수',status:'진행 중'},
  {id:'extension-2',name:'컴포넌트 가이드',owner:'이서연',status:'검토 중'},
  {id:'extension-3',name:'접근성 점검',owner:'박지훈',status:'준비 중'},
];
const columns:DataGridColumn<Project>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,flex:1,minWidth:200,maxWidth:1200},
  {id:'owner',header:'담당자',accessor:row=>row.owner,width:120},
  {id:'status',header:'상태',accessor:row=>row.status,width:120,
    cell:row=><ProjectStatusBadge value={row.status} />},
];

// loading은 실제 앱의 조회·저장 상태를 연결합니다.
export function ToolbarExtensionGrid({loading=false}:{loading?:boolean}) {
  const [rows,setRows] = React.useState(initialRows);
  const [selectedRowIds,setSelectedRowIds] = React.useState<string[]>([]);
  const [query,setQuery] = React.useState('');
  const [message,setMessage] = React.useState('확장 버튼은 예제에서 직접 구현합니다. 행을 선택해 완료 처리를 실행해보세요.');
  const serial = React.useRef(4);
  const addButton = React.useRef<HTMLButtonElement>(null);
  const reset = () => {
    // 샘플 복원입니다. 실제 앱에서는 조회 함수를 실행하고 결과를 rows에 반영하세요.
    setRows(initialRows);
    setSelectedRowIds([]);
    setQuery('');
    setMessage('샘플 데이터 3개를 복원했습니다.');
  };
  const add = () => {
    const number=serial.current++;
    setRows(current=>[...current,{id:`extension-${number}`,name:`새 프로젝트 ${number}`,owner:'김민수',status:'준비 중'}]);
    setMessage(`새 프로젝트 ${number}를 추가했습니다.`);
  };
  const completeSelected = () => {
    const selected=new Set(selectedRowIds);
    setRows(current=>current.map(row=>selected.has(row.id)?{...row,status:'완료'}:row));
    setMessage(`${selectedRowIds.length}개 프로젝트를 완료 처리했습니다.`);
    setSelectedRowIds([]);
    // 선택 작업 버튼이 사라지므로 상시 작업 버튼으로 포커스를 돌립니다.
    addButton.current?.focus();
  };
  return <>
    <DataGrid label="사용자 정의 도구 데이터그리드" rows={rows} columns={columns}
      getRowId={row=>row.id} getRowLabel={row=>row.name}
      loading={loading} searchable searchLabel="확장 예제 검색"
      query={query} onQueryChange={setQuery}
      selectable selectedRowIds={selectedRowIds} onSelectedRowIdsChange={setSelectedRowIds}
      defaultDensity="compact" toolbarSize="sm" toolbarOrder={['actions','search','selection']}
      exportable exportFileName="extension-projects.csv" pagination={false} maxHeight={320}
      toolbarActions={<>
        <IconButton label="확장 예제 데이터 초기화" variant="outline" disabled={loading}
          onClick={reset}><Icon name="refresh" /></IconButton>
        <Button ref={addButton} disabled={loading} onClick={add}><Icon name="plus" />프로젝트 추가</Button>
      </>}
      selectionActions={<Button variant="outline" disabled={loading} onClick={completeSelected}>
        <Icon name="check" />선택 완료 처리
      </Button>} />
    <p role="status" className="component-helper">{message}</p>
  </>;
}

export function DataGridExtensionsDemo() {
  return <Section id="data-grid-extensions" title="상단 도구 확장" className="studio-grid-reference"
    description="확장 슬롯에 앱에서 직접 구현한 버튼을 연결합니다. 아래 초기화·프로젝트 추가·선택 완료 처리는 DataGrid 내장 기능이 아닌 사용자 정의 동작입니다.">
    <dl className="studio-grid-reference-notes">
      <div><dt><code>toolbarActions</code> · 상시 작업</dt><dd>선택 여부와 무관하게 표시할 UI를 전달합니다. 예제의 초기화는 샘플을 복원하고, 프로젝트 추가는 부모의 rows 상태에 새 행을 넣습니다.</dd></div>
      <div><dt><code>selectionActions</code> · 선택 작업</dt><dd>행을 선택했을 때만 표시합니다. selectedRowIds와 onSelectedRowIdsChange를 연결하고, 선택 완료 처리는 해당 ID의 상태를 변경한 뒤 선택을 해제합니다. 검색 결과 밖에서 선택한 행도 처리합니다.</dd></div>
      <div><dt><code>toolbarSize</code> · <code>toolbarOrder</code></dt><dd>크기를 생략한 추가 버튼은 상단 도구 크기를 따릅니다. 이 예제는 actions → search → selection 순서를 먼저 지정합니다. actions는 상시 작업 묶음, selection은 선택 작업·선택 내보내기·해제 묶음입니다. 나머지 내장 도구는 기본 순서로 이어집니다.</dd></div>
      <div><dt>상태와 이벤트 연결</dt><dd>조회·등록·일괄 변경과 오류 처리는 앱이 담당합니다. 실제 API 호출 결과를 rows에 반영하고, 조회·저장 중에는 각 추가 버튼에 disabled를 지정하세요. DataGrid의 loading이 사용자 정의 버튼을 자동으로 비활성화하지는 않습니다.</dd></div>
      <div><dt><code>columns[].cell</code> · 표시 확장</dt><dd>상태 열은 Badge로 렌더링합니다. 검색·정렬·내보내기에 쓰는 원시 값은 accessor가 반환하고, cell은 화면에 보일 UI만 구성합니다.</dd></div>
    </dl>
    <ToolbarExtensionGrid />
    <p className="react-studio-caption">프로젝트를 추가하고 행을 선택해 완료 처리해보세요. 초기화 버튼은 샘플 데이터와 검색·선택을 복원합니다. 실제 서버 요청이나 저장은 수행하지 않습니다.</p>
    <div className="studio-grid-reference-group">
      <h3>확장 슬롯과 상태 연결 예제</h3>
      <div className="react-studio-code studio-grid-reference-code" role="region" aria-label="확장 슬롯과 상태 연결 예제" tabIndex={0}>
        <pre><code>{extensionExample}</code></pre>
      </div>
    </div>
  </Section>;
}

const extensionExample = `import * as React from 'react';
import { Badge, Button, DataGrid, Icon, IconButton, type DataGridColumn } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

type Project = {id:string; name:string; owner:string; status:'진행 중'|'검토 중'|'준비 중'|'완료'};
const initialRows:Project[] = [
  {id:'extension-1',name:'디자인 시스템',owner:'김민수',status:'진행 중'},
  {id:'extension-2',name:'컴포넌트 가이드',owner:'이서연',status:'검토 중'},
  {id:'extension-3',name:'접근성 점검',owner:'박지훈',status:'준비 중'},
];
const statusAppearance = {
  '준비 중':{variant:'neutral',icon:'circle-dashed'},
  '진행 중':{variant:'primary',icon:'circle-dot'},
  '검토 중':{variant:'primary',icon:'circle-dot'},
  '완료':{variant:'success',icon:'check-circle'},
} as const;
const columns:DataGridColumn<Project>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,flex:1,minWidth:200,maxWidth:1200},
  {id:'owner',header:'담당자',accessor:row=>row.owner,width:120},
  {id:'status',header:'상태',accessor:row=>row.status,width:120,
    cell:row=><Badge variant={statusAppearance[row.status].variant}><Icon name={statusAppearance[row.status].icon} />{row.status}</Badge>},
];

// loading은 실제 앱의 조회·저장 상태를 연결합니다.
export function ToolbarExtensionGrid({loading=false}:{loading?:boolean}) {
  const [rows,setRows] = React.useState(initialRows);
  const [selectedRowIds,setSelectedRowIds] = React.useState<string[]>([]);
  const [query,setQuery] = React.useState('');
  const [message,setMessage] = React.useState('확장 버튼은 예제에서 직접 구현합니다. 행을 선택해 완료 처리를 실행해보세요.');
  const serial = React.useRef(4);
  const addButton = React.useRef<HTMLButtonElement>(null);
  const reset = () => {
    // 샘플 복원입니다. 실제 앱에서는 조회 함수를 실행하고 결과를 rows에 반영하세요.
    setRows(initialRows);
    setSelectedRowIds([]);
    setQuery('');
    setMessage('샘플 데이터 3개를 복원했습니다.');
  };
  const add = () => {
    const number=serial.current++;
    setRows(current=>[...current,{id:\`extension-\${number}\`,name:\`새 프로젝트 \${number}\`,owner:'김민수',status:'준비 중'}]);
    setMessage(\`새 프로젝트 \${number}를 추가했습니다.\`);
  };
  const completeSelected = () => {
    const selected=new Set(selectedRowIds);
    setRows(current=>current.map(row=>selected.has(row.id)?{...row,status:'완료'}:row));
    setMessage(\`\${selectedRowIds.length}개 프로젝트를 완료 처리했습니다.\`);
    setSelectedRowIds([]);
    // 선택 작업 버튼이 사라지므로 상시 작업 버튼으로 포커스를 돌립니다.
    addButton.current?.focus();
  };
  return <>
    <DataGrid label="사용자 정의 도구 데이터그리드" rows={rows} columns={columns}
      getRowId={row=>row.id} getRowLabel={row=>row.name}
      loading={loading} searchable searchLabel="확장 예제 검색"
      query={query} onQueryChange={setQuery}
      selectable selectedRowIds={selectedRowIds} onSelectedRowIdsChange={setSelectedRowIds}
      defaultDensity="compact" toolbarSize="sm" toolbarOrder={['actions','search','selection']}
      exportable exportFileName="extension-projects.csv" pagination={false} maxHeight={320}
      toolbarActions={<>
        <IconButton label="확장 예제 데이터 초기화" variant="outline" disabled={loading}
          onClick={reset}><Icon name="refresh" /></IconButton>
        <Button ref={addButton} disabled={loading} onClick={add}><Icon name="plus" />프로젝트 추가</Button>
      </>}
      selectionActions={<Button variant="outline" disabled={loading} onClick={completeSelected}>
        <Icon name="check" />선택 완료 처리
      </Button>} />
    <p role="status" className="component-helper">{message}</p>
  </>;
}`;
