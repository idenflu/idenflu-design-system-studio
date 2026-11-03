import * as React from 'react';
import { Badge, DataGrid, Select, type DataGridColumn, type DataGridFilters } from '../src';
import { Section } from './demo-layout';

type Task = {id:string; name:string; team:string; status:string; hours:number};
const rows:Task[] = [
  {id:'multi-1',name:'디자인 시스템',team:'프로덕트 디자인',status:'진행 중',hours:10},
  {id:'multi-2',name:'모바일 앱',team:'개발',status:'진행 중',hours:20},
  {id:'multi-3',name:'브랜드 가이드',team:'프로덕트 디자인',status:'검토 중',hours:30},
  {id:'multi-4',name:'운영 정책',team:'기획',status:'준비 중',hours:40},
  {id:'multi-5',name:'접근성 점검',team:'개발',status:'완료',hours:50},
  {id:'multi-6',name:'콘텐츠 기획',team:'기획',status:'진행 중',hours:60},
];
const columns:DataGridColumn<Task>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,flex:1,minWidth:200,filter:'text'},
  {id:'team',header:'담당 팀',accessor:row=>row.team,width:160,filter:'multi-select',
    filterOptions:['프로덕트 디자인','개발','기획'].map(value=>({value,label:value}))},
  {id:'status',header:'상태',accessor:row=>row.status,width:160,filter:'multi-select',
    filterOptions:['진행 중','검토 중','준비 중','완료'].map(value=>({value,label:value})),
    cell:row=><Badge variant={row.status==='완료'?'success':'neutral'}>{row.status}</Badge>},
  {id:'hours',header:'예상 시간',accessor:row=>row.hours,width:160,filter:'number',align:'end'},
];

export function DataGridMultiFilterDemo() {
  const [filters,setFilters] = React.useState<DataGridFilters>({});
  const [size,setSize] = React.useState<'sm'|'md'|'lg'>('sm');
  return <Section id="data-grid-multi-filter-demo" title="복수 선택 컬럼 필터" className="studio-grid-reference"
    description="같은 열에서 선택한 값은 OR, 다른 열과 검색·숫자 조건은 AND로 적용합니다. 선택하지 않은 열은 전체를 조회합니다.">
    <div className="react-studio-row studio-grid-toolbar-controls">
      <Select label="복수 필터 크기" size="sm" value={size}
        onValueChange={value=>setSize(value==='md'||value==='lg'?value:'sm')}
        options={[{value:'sm',label:'SM (기본)'},{value:'md',label:'MD'},{value:'lg',label:'LG'}]} />
    </div>
    <DataGrid label="복수 선택 필터 데이터그리드" rows={rows} columns={columns}
      getRowId={row=>row.id} getRowLabel={row=>row.name} selectable
      filters={filters} onFiltersChange={setFilters} toolbarSize={size}
      searchLabel="복수 필터 전체 검색" defaultDensity="compact" pagination={false}
      exportable exportFileName="multi-filter-projects.csv" maxHeight={360} />
    <p className="react-studio-caption">담당 팀에서 프로덕트 디자인·개발을, 상태에서 진행 중·검토 중을 선택해보세요. 목록 안에서 검색해도 선택값은 유지됩니다. 여러 값은 첫 항목과 나머지 개수로 요약하며, 필터 초기화로 모든 조건을 해제합니다.</p>
    <div className="studio-grid-reference-group">
      <h3>연결된 필터 값</h3>
      <div className="react-studio-code studio-grid-reference-code" role="region" aria-label="복수 필터 상태" tabIndex={0}>
        <pre><code>{JSON.stringify(filters,null,2)}</code></pre>
      </div>
    </div>
  </Section>;
}
