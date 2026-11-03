import * as React from 'react';
import { Badge, DataGrid, Progress, Segmented, Select, type DataGridCellEdit, type DataGridColumn, type DataGridSort } from '../src';
import { Section } from './demo-layout';

type Project = {
  id:string; name:string; team:string; owner:string | null;
  status:'준비 중'|'진행 중'|'검토 중'|'완료'|'보류'; progress:number; budget:number; due:string;
};
const names = [
  '디자인 시스템 v2', '모바일 앱 온보딩', '관리자 대시보드', '브랜드 가이드 개편',
  '결제 경험 개선', '글로벌 서비스 — 다국어 콘텐츠와 지역별 접근성 가이드',
  '고객 피드백 분석', '파트너 포털', '알림 센터', '권한과 역할 관리',
  '프로젝트 아카이브', '컴포넌트 문서화', '검색 품질 개선', '파일 공유',
  '멤버 초대 흐름', '워크스페이스 설정', '고객 지원 센터', '리포트 자동화',
  '데이터 마이그레이션', '보안 설정', '접근성 점검', '사용량 분석',
  '연간 캠페인 운영', '팀 협업 도구',
];
const projectAreas = ['계정','주문','배송','정산','청구','인증','예약','구독','콘텐츠','활동 피드','파트너 지원','사용자 프로필'];
const projectWork = ['흐름 개선','기능 확장','운영 정비','품질 점검','접근성 개선','성능 최적화','화면 개편','운영 자동화'];
const projectNames = [...names, ...Array.from({length:projectAreas.length * projectWork.length}, (_,index) =>
  `${projectAreas[index % projectAreas.length]} ${projectWork[Math.floor(index / projectAreas.length)]}`)];
const statuses:Project['status'][] = ['진행 중','준비 중','검토 중','완료','보류'];
const teams = ['프로덕트 디자인','플랫폼 개발','서비스 기획','브랜드 디자인'];
const owners = ['김민수','이서연','박지훈','정수빈',null];
const projects:Project[] = projectNames.map((name,index) => ({
  id:`PRJ-${String(index + 1).padStart(3,'0')}`, name,
  team:teams[index % teams.length], owner:owners[index % owners.length],
  status:statuses[index % statuses.length], progress:index % 5 === 3 ? 100 : (index * 13) % 100,
  budget:index === 0 ? 0 : (index + 1) * 175000,
  due:`2026-${index % 2 ? '12' : '11'}-${String(index % 26 + 3).padStart(2,'0')}`,
}));
const money = new Intl.NumberFormat('ko-KR');
const projectColumns:DataGridColumn<Project>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,width:260,minWidth:160,pinned:'start',filter:'text',cell:row=><div className="studio-grid-project"><strong>{row.name}</strong><small>{row.id}</small></div>},
  {id:'team',header:'담당 팀',accessor:row=>row.team,width:170,filter:'select',filterOptions:teams.map(value=>({value,label:value}))},
  {id:'owner',header:'담당자',accessor:row=>row.owner,width:130,filter:'text',cell:row=>row.owner ?? <span className="table-muted">미지정</span>},
  {id:'status',header:'상태',accessor:row=>row.status,width:130,filter:'select',filterOptions:statuses.map(value=>({value,label:value})),cell:row=><Badge variant={row.status === '완료' ? 'success' : row.status === '검토 중' ? 'warning' : row.status === '진행 중' ? 'primary' : 'neutral'}>{row.status}</Badge>},
  {id:'progress',header:'진행률',accessor:row=>row.progress,width:150,align:'end',filter:'number',cell:row=><div className="studio-grid-progress"><span>{row.progress}%</span><Progress value={row.progress} max={100} aria-label={`${row.name} 진행률`} /></div>},
  {id:'budget',header:'예산',accessor:row=>row.budget,width:170,align:'end',filter:'number',cell:row=>`${money.format(row.budget)}원`},
  {id:'due',header:'마감일',accessor:row=>row.due,width:150,filter:'text'},
];
const responsiveColumns:DataGridColumn<Project>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,flex:2,minWidth:180,pinned:'start'},
  {id:'team',header:'담당 팀',accessor:row=>row.team,flex:1,minWidth:120,maxWidth:260},
  {id:'owner',header:'담당자',accessor:row=>row.owner,width:'25%',minWidth:110,maxWidth:300,cell:row=>row.owner ?? <span className="table-muted">미지정</span>},
  {id:'status',header:'상태',accessor:row=>row.status,width:120,minWidth:120,maxWidth:120,resizable:false,cell:row=><Badge>{row.status}</Badge>},
];

const virtualProject = (index:number):Project => ({
  ...projects[index % names.length],
  id:`ROW-${String(index + 1).padStart(5,'0')}`,
  name:`가상 프로젝트 ${String(index + 1).padStart(5,'0')}`,
  progress:index % 101,
  budget:(index + 1) * 25000,
});
const virtualProjects:Project[] = Array.from({length:10000},(_,index)=>virtualProject(index));
const virtualColumns:DataGridColumn<Project>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,width:260,minWidth:160,pinned:'start',filter:'text',editable:true,validate:value=>value.trim().length >= 2 ? undefined : '프로젝트 이름은 2자 이상 입력해주세요.',cell:row=><div className="studio-grid-project"><strong>{row.name}</strong><small>{row.id}</small>{Number(row.id.slice(4)) % 37 === 0 && <small>여러 줄의 설명도 행 높이에 반영합니다. 열 너비를 조절해 줄바꿈을 확인하세요.</small>}</div>},
  ...projectColumns.slice(1),
];

type Task = {id:string; name:string; owner:string; hours:number; locked:boolean};
const initialTasks:Task[] = [
  {id:'TASK-01',name:'토큰 사용 기준 정리',owner:'김민수',hours:12,locked:false},
  {id:'TASK-02',name:'입력 컴포넌트 접근성 점검',owner:'이서연',hours:8,locked:false},
  {id:'TASK-03',name:'문서 예시 작성',owner:'박지훈',hours:16,locked:false},
  {id:'TASK-04',name:'배포된 가이드 보관',owner:'정수빈',hours:4,locked:true},
];
const taskColumns:DataGridColumn<Task>[] = [
  {id:'name',header:'작업 이름',accessor:row=>row.name,width:300,minWidth:200,editable:row=>!row.locked,validate:value=>value.trim().length >= 2 ? undefined : '작업 이름은 2자 이상 입력해주세요.'},
  {id:'owner',header:'담당자',accessor:row=>row.owner,width:160,editable:row=>!row.locked,validate:value=>value.trim() ? undefined : '담당자를 입력해주세요.'},
  {id:'hours',header:'예상 시간',accessor:row=>row.hours,width:190,align:'end',editable:row=>!row.locked,editor:'number',validate:value=>value.trim() && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 160 ? undefined : '0~160 사이의 시간을 입력해주세요.',cell:row=>`${row.hours}시간`},
  {id:'locked',header:'편집 권한',accessor:row=>row.locked ? '읽기 전용' : '편집 가능',width:150,resizable:false,cell:row=><Badge variant={row.locked ? 'neutral' : 'primary'}>{row.locked ? '읽기 전용' : '편집 가능'}</Badge>},
];

export function DataGridDemos() {
  const [selected,setSelected] = React.useState<string[]>([]);
  const [sortModel,setSortModel] = React.useState<DataGridSort[]>([{columnId:'name',direction:'asc'}]);
  const [tasks,setTasks] = React.useState(initialTasks);
  const [notice,setNotice] = React.useState('셀의 편집 버튼으로 값을 수정할 수 있습니다.');
  const [state,setState] = React.useState('loading');
  const [previewWidth,setPreviewWidth] = React.useState('fluid');
  const [virtualRows,setVirtualRows] = React.useState(virtualProjects);
  const [virtualCount,setVirtualCount] = React.useState(10000);
  const [virtualDensity,setVirtualDensity] = React.useState<'default'|'compact'>('default');
  const [virtualSelected,setVirtualSelected] = React.useState<string[]>([]);
  const [virtualNotice,setVirtualNotice] = React.useState('프로젝트 이름을 편집하고 멀리 스크롤해도 입력 중인 값을 유지합니다.');
  const largeRows = React.useMemo(()=>virtualRows.slice(0,virtualCount),[virtualRows,virtualCount]);
  const editTask = ({rowId,columnId,value}:DataGridCellEdit<Task>) => {
    setTasks(current=>current.map(row=>row.id === rowId ? {...row,[columnId]:columnId === 'hours' ? Number(value) : value.trim()} : row));
    setNotice(`${rowId}의 ${taskColumns.find(column=>column.id === columnId)?.header} 값을 변경했습니다.`);
  };
  return <>
    <Section title="프로젝트 데이터그리드" description={`${projects.length}개 프로젝트에서 검색·열별 필터·정렬·선택·페이지 이동을 함께 사용합니다. 프로젝트 이름은 가로 스크롤 중에도 고정됩니다.`}>

      <DataGrid label="프로젝트 데이터그리드" rows={projects} columns={projectColumns}
        getRowId={row=>row.id} getRowLabel={row=>row.name} selectable
        selectedRowIds={selected} onSelectedRowIdsChange={setSelected}
        searchLabel="프로젝트 검색" defaultPageSize={5} pageSizeOptions={[5,10,20,50,100]}
        sortModel={sortModel} onSortModelChange={setSortModel}
        exportable exportFileName="idenflu-projects.csv" maxHeight={480} />
      <p className="react-studio-caption">상단의 행 간격 아이콘으로 밀도를 전환합니다. Shift+클릭으로 정렬 조건을 추가하고, 열 경계는 드래그하거나 방향키로 조절합니다.</p>
      <p role="status" className="component-helper">정렬: {sortModel.length ? sortModel.map((sort,index)=>`${index+1}. ${projectColumns.find(column=>column.id===sort.columnId)?.header} ${sort.direction === 'asc' ? '오름차순' : '내림차순'}`).join(' · ') : '원래 순서'}</p>
      <p className="react-studio-caption">행 또는 체크박스를 클릭해 선택합니다. 전체 선택은 현재 페이지에 적용하며 다른 페이지와 검색 결과에서도 선택을 유지합니다. CSV는 표시 중인 열을 사용하며 검색 결과 전체와 선택한 행을 구분해 내려받습니다.</p>
    </Section>
    <Section title="셀 편집과 값 바인딩" description="텍스트·숫자 편집, 입력 검증과 읽기 전용 행을 비교합니다. 저장한 값은 React 상태에 반영되어 다시 검색·정렬할 수 있습니다.">
      <DataGrid label="작업 편집 데이터그리드" rows={tasks} columns={taskColumns}
        className="studio-grid-edit-example"
        getRowId={row=>row.id} getRowLabel={row=>row.name} onCellEdit={editTask}
        searchable={false} showColumnVisibility={false} defaultPageSize={5} pageSizeOptions={[5,10]} />
      <p role="status" className="component-helper">{notice}</p>
      <p className="react-studio-caption">Enter 또는 저장 버튼으로 확정하고 Escape 또는 취소 버튼으로 되돌립니다. 검증 오류는 셀 안에 표시합니다. 마지막 행은 읽기 전용입니다.</p>
    </Section>
    <Section title="가상 스크롤" description="최대 50,000행 중 화면 근처의 행만 렌더링합니다. 데이터 수와 밀도를 바꾸고, 세로 스크롤바 드래그·검색·열 조절·선택·편집을 함께 확인하세요.">
      <div className="studio-grid-virtual-toolbar"><Select label="가상 스크롤 데이터 수" value={String(virtualCount)} onValueChange={value=>{
        const count=Number(value);setVirtualCount(count);
        setVirtualRows(current=>current.length >= count ? current : [...current,...Array.from({length:count-current.length},(_,index)=>virtualProject(current.length+index))]);
      }} options={[{value:'100',label:'100개'},{value:'1000',label:'1,000개'},{value:'10000',label:'10,000개'},{value:'50000',label:'50,000개'}]} /></div>
      <DataGrid label="대용량 데이터그리드" rows={largeRows} columns={virtualColumns}
        getRowId={row=>row.id} getRowLabel={row=>row.name}
        virtualized={{estimateRowHeight:virtualDensity === 'compact' ? 61 : 73,overscan:8}} maxHeight={420} density={virtualDensity} onDensityChange={setVirtualDensity}
        selectable selectedRowIds={virtualSelected} onSelectedRowIdsChange={setVirtualSelected}
        searchLabel="대용량 데이터 검색" exportable exportFileName="idenflu-virtual-projects.csv"
        onCellEdit={({rowId,value})=>{
          setVirtualRows(current=>current.map(row=>row.id === rowId ? {...row,name:value.trim()} : row));
          setVirtualNotice(`${rowId}의 프로젝트 이름을 변경했습니다.`);
        }} />
      <p role="status" className="component-helper">{virtualNotice}</p>
      <p className="react-studio-caption">가상 스크롤의 전체 선택은 검색 결과 전체에 적용합니다. CSV도 화면 밖의 결과를 포함합니다. 행의 높이는 실제 콘텐츠에 맞춰 측정하며 검색·정렬은 전달한 데이터 전체를 브라우저에서 처리합니다.</p>
    </Section>
    <Section title="로딩·빈 데이터·오류" description="조회 상태에 맞는 안내를 그리드 안에 표시합니다. 오류에서 다시 시도하면 샘플 데이터를 표시합니다.">
      <div className="react-studio-row"><Segmented label="데이터그리드 조회 상태" value={state} onValueChange={setState} options={[{value:'loading',label:'로딩'},{value:'empty',label:'빈 데이터'},{value:'error',label:'오류'},{value:'success',label:'조회 완료'}]} /></div>
      <DataGrid label="조회 상태 데이터그리드" rows={state === 'empty' ? [] : projects.slice(0,3)}
        className="studio-grid-state-example"
        columns={projectColumns.slice(0,3).map(column=>({...column,filter:undefined,pinned:undefined}))}
        getRowId={row=>row.id} searchable={false} showColumnVisibility={false}
        loading={state === 'loading'} error={state === 'error' ? '프로젝트를 불러오지 못했습니다. 연결을 확인해주세요.' : undefined}
        onRetry={()=>setState('success')} emptyMessage="아직 등록한 프로젝트가 없습니다." />
    </Section>
    <Section title="반응형 열 너비" description="상태는 120px, 담당자는 25%, 프로젝트와 담당 팀은 남은 공간을 2:1로 나눕니다. 화면이 좁아지면 최소 너비를 유지하고 표 안에서 가로로 스크롤합니다.">
      <div className="react-studio-row"><Segmented label="열 너비 예시 폭" size="sm" value={previewWidth} onValueChange={setPreviewWidth} options={[{value:'fluid',label:'화면에 맞춤'},{value:'720',label:'720px'},{value:'480',label:'480px'}]} /></div>
      <div role="group" aria-label="열 너비 미리보기" style={{inlineSize:'100%',maxInlineSize:previewWidth === 'fluid' ? '100%' : `${previewWidth}px`,minInlineSize:0}}>
        <DataGrid label="반응형 열 너비 데이터그리드" rows={projects.slice(0,5)} columns={responsiveColumns}
          getRowId={row=>row.id} getRowLabel={row=>row.name} selectable
          searchable={false} pagination={false} maxHeight={320} />
      </div>
      <p className="react-studio-caption">열을 숨기면 남은 공간을 다시 배분합니다. 직접 조절한 열은 px로 고정되며, 열 경계를 더블클릭하거나 Enter를 누르면 원래 비율로 돌아갑니다.</p>
    </Section>
    <Section title="사용 기준" description="일반 테이블은 읽기 중심의 표에, 데이터그리드는 검색·열 조작·선택·편집이 결합된 목록에 사용합니다.">
      <dl className="detail-list studio-grid-guidelines">
        <div><dt>필터와 정렬</dt><dd>검색과 열별 필터는 AND로 적용합니다. 클릭은 단일 정렬, Shift+클릭은 다중 정렬입니다. 오름차순 → 내림차순 → 해제 순서이며 숫자는 정렬 우선순위입니다. 빈 값은 각 조건에서 마지막에 표시합니다.</dd></div>
        <div><dt>행 선택</dt><dd>행의 일반 영역 또는 체크박스로 선택합니다. 편집 버튼·링크·입력 컨트롤과 텍스트 드래그는 선택을 변경하지 않습니다. selectOnRowClick을 false로 설정하면 체크박스로만 선택합니다.</dd></div>
        <div><dt>키보드</dt><dd>Tab으로 컨트롤을 탐색합니다. 열 경계에서 ←·→는 10px, Shift와 함께 누르면 1px씩 조절하며 Home·End는 최소·최대 너비로 이동합니다. Enter는 원래 너비 설정을 복구합니다.</dd></div>
        <div><dt>데이터 연결</dt><dd>행은 고유하고 안정적인 ID가 필요합니다. 편집 결과는 onCellEdit에서 rows 상태를 갱신하세요. 서버 저장은 이 콜백에서 별도로 연결합니다.</dd></div>
        <div><dt>가상 스크롤</dt><dd>virtualized를 켜면 화면 근처 행과 입력·포커스 유지에 필요한 행을 렌더링합니다. 기본은 페이지 이동 없이 전체 검색 결과를 스크롤하며, pagination을 지정하면 페이지 이동과 함께 사용할 수 있습니다.</dd></div>
        <div><dt>처리 범위</dt><dd>가상화는 세로 방향의 행 렌더링을 줄입니다. 전체 rows의 검색·정렬 계산과 데이터 메모리는 유지합니다. 서버 페이지 이동·열 가상화·행 그룹화는 포함하지 않습니다.</dd></div>
      </dl>
    </Section>
  </>;
}

export const dataGridUsage = `import { useState } from 'react';
import { DataGrid, type DataGridColumn, type DataGridSort } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

type Project = { id: string; name: string; hours: number };
const columns: DataGridColumn<Project>[] = [
  { id: 'name', header: '프로젝트', accessor: row => row.name,
    width: 260, pinned: 'start', filter: 'text', editable: true,
    validate: value => value.trim() ? undefined : '이름을 입력해주세요.' },
  { id: 'hours', header: '예상 시간', accessor: row => row.hours,
    width: 180, align: 'end', filter: 'number', editable: true, editor: 'number',
    validate: value => value.trim() && Number(value) >= 0 ? undefined : '0 이상 입력해주세요.' },
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
    defaultPageSize={5} pageSizeOptions={[5, 10, 20]} maxHeight={400}
    exportable exportFileName="projects.csv"
    onCellEdit={({ rowId, columnId, value }) => {
      setRows(current => current.map(row => row.id === rowId
        ? { ...row, [columnId]: columnId === 'hours' ? Number(value) : value.trim() }
        : row));
    }} />;
}

// 페이지 이동 없이 전체 결과를 가상 스크롤합니다.
export function VirtualProjectGrid({ rows }: { rows: Project[] }) {
  return <DataGrid label="프로젝트 전체 목록" rows={rows} columns={columns}
    getRowId={row => row.id} maxHeight={420}
    virtualized={{ estimateRowHeight: 56, overscan: 6 }} />;
}
// pagination을 명시하면 현재 페이지 안에서만 가상화합니다.
// <DataGrid ... virtualized pagination defaultPageSize={100} />
`;
