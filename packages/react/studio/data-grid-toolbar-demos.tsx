import * as React from 'react';
import { Checkbox, DataGrid, Select, type DataGridColumn, type DataGridToolbarItem } from '../src';
import { Section } from './demo-layout';

type Project = {id:string; name:string; owner:string; status:string};
const initialRows:Project[] = [
  {id:'toolbar-1',name:'디자인 시스템',owner:'김민수',status:'진행 중'},
  {id:'toolbar-2',name:'컴포넌트 가이드',owner:'이서연',status:'검토 중'},
  {id:'toolbar-3',name:'접근성 점검',owner:'박지훈',status:'준비 중'},
];
const ownerOptions=[...new Set(initialRows.map(row=>row.owner))].map(value=>({value,label:value}));
const statusOptions=[...new Set(initialRows.map(row=>row.status))].map(value=>({value,label:value}));
const columns:DataGridColumn<Project>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,flex:1,minWidth:200,maxWidth:1200,filter:'text'},
  {id:'owner',header:'담당자',accessor:row=>row.owner,width:120,filter:'select',filterOptions:ownerOptions},
  {id:'status',header:'상태',accessor:row=>row.status,width:120,filter:'select',filterOptions:statusOptions},
];
type ToolbarOrderPreset = 'default'|'filters'|'export';
const toolbarOrders:Record<ToolbarOrderPreset,readonly DataGridToolbarItem[]|undefined> = {
  default:undefined, filters:['columnFilters'], export:['export'],
};

export function DataGridToolbarDemos() {
  const [selected,setSelected] = React.useState<string[]>([]);
  const [density,setDensity] = React.useState<'default'|'compact'>('compact');
  const [showSearch,setShowSearch] = React.useState(true);
  const [useFilterToggle,setUseFilterToggle] = React.useState(true);
  const [showDensity,setShowDensity] = React.useState(true);
  const [showColumns,setShowColumns] = React.useState(true);
  const [showCsv,setShowCsv] = React.useState(true);
  const [toolbarSize,setToolbarSize] = React.useState<'sm'|'md'|'lg'>('sm');
  const [toolbarOrder,setToolbarOrder] = React.useState<ToolbarOrderPreset>('default');
  return <Section id="data-grid-toolbar-demo" title="상단 기능 버튼 구성" description="검색·컬럼 필터·행 밀도·표시 열·CSV 등 내장 도구의 크기와 순서를 바꿔보세요. 필터와 행 선택에 따라 추가 도구가 나타납니다.">
    <div role="group" aria-label="상단 도구 구성" className="react-studio-row">
      <Select label="상단 도구 크기" size="sm" value={toolbarSize}
        onValueChange={value=>setToolbarSize(value==='md'||value==='lg'?value:'sm')}
        options={[{value:'sm',label:'SM (기본)'},{value:'md',label:'MD'},{value:'lg',label:'LG'}]} />
      <Select label="도구 순서" size="sm" value={toolbarOrder}
        onValueChange={value=>setToolbarOrder(value==='filters'||value==='export'?value:'default')}
        options={[{value:'default',label:'기본'},{value:'filters',label:'컬럼 필터 먼저'},{value:'export',label:'내보내기 먼저'}]} />
    </div>
    <div role="group" aria-label="기본 도구 표시 설정" className="react-studio-row">
      <Checkbox label="검색 입력 표시" checked={showSearch} onChange={event=>setShowSearch(event.target.checked)} />
      <Checkbox label="컬럼 필터 토글 사용" checked={useFilterToggle} onChange={event=>setUseFilterToggle(event.target.checked)} />
      <Checkbox label="행 밀도 버튼 표시" checked={showDensity} onChange={event=>setShowDensity(event.target.checked)} />
      <Checkbox label="표시 열 버튼 표시" checked={showColumns} onChange={event=>setShowColumns(event.target.checked)} />
      <Checkbox label="CSV 버튼 표시" checked={showCsv} onChange={event=>setShowCsv(event.target.checked)} />
    </div>
    <DataGrid label="상단 도구 모음 데이터그리드" rows={initialRows} columns={columns}
      getRowId={row=>row.id} getRowLabel={row=>row.name} searchable={showSearch} searchLabel="상단 도구 예제 검색"
      showColumnFilterToggle={useFilterToggle}
      selectable selectedRowIds={selected} onSelectedRowIdsChange={setSelected}
      density={density} onDensityChange={setDensity} showDensityToggle={showDensity}
      toolbarSize={toolbarSize} toolbarOrder={toolbarOrders[toolbarOrder]}
      showColumnVisibility={showColumns} exportable={showCsv} exportFileName="toolbar-projects.csv"
      pagination={false} maxHeight={320} />
    <p className="component-helper">현재 밀도: {density === 'compact' ? 'Compact' : 'Default'}</p>
    <p className="react-studio-caption">이 예제는 DataGrid 내장 도구만 표시합니다. 컬럼 필터를 켜고 값을 입력하면 필터 초기화가, 행을 선택하면 선택 CSV·선택 해제가 나타납니다. 토글을 사용하지 않으면 필터 행을 항상 표시합니다. 업무 버튼을 직접 추가하는 방법은 아래 사용자 정의 도구 예제를 확인하세요.</p>
  </Section>;
}
