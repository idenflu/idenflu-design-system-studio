import * as React from 'react';
import { Button, Checkbox, DataGrid, Icon, IconButton, type DataGridColumn } from '../src';
import { Section } from './demo-layout';

type Project = {id:string; name:string; owner:string; status:string};
const initialRows:Project[] = [
  {id:'toolbar-1',name:'디자인 시스템',owner:'김민수',status:'진행 중'},
  {id:'toolbar-2',name:'컴포넌트 가이드',owner:'이서연',status:'검토 중'},
  {id:'toolbar-3',name:'접근성 점검',owner:'박지훈',status:'준비 중'},
];
const columns:DataGridColumn<Project>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,flex:1,minWidth:200,maxWidth:1200},
  {id:'owner',header:'담당자',accessor:row=>row.owner,width:120},
  {id:'status',header:'상태',accessor:row=>row.status,width:120},
];

export function DataGridToolbarDemos() {
  const [rows,setRows] = React.useState(initialRows);
  const [selected,setSelected] = React.useState<string[]>([]);
  const [density,setDensity] = React.useState<'default'|'compact'>('compact');
  const [showDensity,setShowDensity] = React.useState(true);
  const [showColumns,setShowColumns] = React.useState(true);
  const [showCsv,setShowCsv] = React.useState(true);
  const [message,setMessage] = React.useState('새로고침과 프로젝트 추가는 항상 표시하고, 선택 삭제는 행을 선택하면 표시합니다.');
  const serial = React.useRef(4);
  const addButton = React.useRef<HTMLButtonElement>(null);
  return <Section id="data-grid-toolbar-demo" title="상단 기능 버튼 구성" description="행 밀도·표시 열·CSV 버튼을 켜고 끄고, 상시 도구와 선택 후 도구를 함께 사용해보세요.">
    <div role="group" aria-label="기본 도구 표시 설정" className="react-studio-row">
      <Checkbox label="행 밀도 버튼 표시" checked={showDensity} onChange={event=>setShowDensity(event.target.checked)} />
      <Checkbox label="표시 열 버튼 표시" checked={showColumns} onChange={event=>setShowColumns(event.target.checked)} />
      <Checkbox label="CSV 버튼 표시" checked={showCsv} onChange={event=>setShowCsv(event.target.checked)} />
    </div>
    <DataGrid label="상단 도구 모음 데이터그리드" rows={rows} columns={columns}
      getRowId={row=>row.id} getRowLabel={row=>row.name} searchable={false}
      selectable selectedRowIds={selected} onSelectedRowIdsChange={setSelected}
      density={density} onDensityChange={setDensity} showDensityToggle={showDensity}
      showColumnVisibility={showColumns} exportable={showCsv} exportFileName="toolbar-projects.csv"
      pagination={false} maxHeight={320}
      toolbarActions={<>
        <IconButton label="예제 데이터 새로고침" variant="outline" onClick={()=>{
          setRows(initialRows);setSelected([]);setMessage('샘플 데이터를 처음 상태로 복원했습니다.');
        }}><Icon name="refresh" /></IconButton>
        <Button ref={addButton} onClick={()=>{
          const number=serial.current++;
          setRows(current=>[...current,{id:`toolbar-${number}`,name:`새 프로젝트 ${number}`,owner:'김민수',status:'준비 중'}]);
          setMessage('새 프로젝트를 추가했습니다.');
        }}><Icon name="plus" />프로젝트 추가</Button>
      </>}
      selectionActions={<Button variant="danger" size="sm" onClick={()=>{
        setRows(current=>current.filter(row=>!selected.includes(row.id)));
        setMessage(`${selected.length}개 프로젝트를 삭제했습니다.`);setSelected([]);addButton.current?.focus();
      }}><Icon name="trash" />선택 삭제</Button>} />
    <p role="status" className="component-helper">{message} · 현재 밀도: {density === 'compact' ? 'Compact' : 'Default'}</p>
    <p className="react-studio-caption">이 예제의 새로고침은 샘플 데이터를 복원합니다. 실제 앱에서는 조회 함수를 연결하세요. 기본 버튼 설정과 추가 버튼 코드는 아래 상단 도구 모음 문서에서 확인할 수 있습니다.</p>
  </Section>;
}
