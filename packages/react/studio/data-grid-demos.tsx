import * as React from 'react';
import { Badge, DataGrid, Progress, Segmented, type DataGridCellEdit, type DataGridColumn } from '../src';
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
const statuses:Project['status'][] = ['진행 중','준비 중','검토 중','완료','보류'];
const teams = ['프로덕트 디자인','플랫폼 개발','서비스 기획','브랜드 디자인'];
const owners = ['김민수','이서연','박지훈','정수빈',null];
const projects:Project[] = names.map((name,index) => ({
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
  const [density,setDensity] = React.useState<'default'|'compact'>('default');
  const [selected,setSelected] = React.useState<string[]>([]);
  const [tasks,setTasks] = React.useState(initialTasks);
  const [notice,setNotice] = React.useState('셀의 편집 버튼으로 값을 수정할 수 있습니다.');
  const [state,setState] = React.useState('loading');
  const editTask = ({rowId,columnId,value}:DataGridCellEdit<Task>) => {
    setTasks(current=>current.map(row=>row.id === rowId ? {...row,[columnId]:columnId === 'hours' ? Number(value) : value.trim()} : row));
    setNotice(`${rowId}의 ${taskColumns.find(column=>column.id === columnId)?.header} 값을 변경했습니다.`);
  };
  return <>
    <Section title="프로젝트 데이터그리드" description="24개 프로젝트에서 검색·열별 필터·정렬·선택·페이지 이동을 함께 사용합니다. 프로젝트 이름은 가로 스크롤 중에도 고정됩니다.">
      <div className="studio-grid-demo-toolbar"><p className="react-studio-caption">열 경계는 드래그하거나 포커스 후 방향키로 조절하세요.</p><Segmented label="데이터그리드 밀도" size="sm" value={density} onValueChange={value=>setDensity(value === 'compact' ? 'compact' : 'default')} options={[{value:'default',label:'Default'},{value:'compact',label:'Compact'}]} /></div>
      <DataGrid label="프로젝트 데이터그리드" rows={projects} columns={projectColumns}
        getRowId={row=>row.id} getRowLabel={row=>row.name} selectable
        selectedRowIds={selected} onSelectedRowIdsChange={setSelected}
        searchLabel="프로젝트 검색" defaultPageSize={5} pageSizeOptions={[5,10,20]}
        defaultSort={{columnId:'name',direction:'asc'}} density={density}
        exportable exportFileName="idenflu-projects.csv" maxHeight={480} />
      <p className="react-studio-caption">전체 선택은 현재 페이지에 적용합니다. 다른 페이지와 검색 결과로 이동해도 선택한 행은 유지합니다. CSV는 표시 중인 열을 사용하며, 검색 결과 전체와 선택한 행을 구분해 내려받습니다.</p>
    </Section>
    <Section title="셀 편집과 값 바인딩" description="텍스트·숫자 편집, 입력 검증과 읽기 전용 행을 비교합니다. 저장한 값은 React 상태에 반영되어 다시 검색·정렬할 수 있습니다.">
      <DataGrid label="작업 편집 데이터그리드" rows={tasks} columns={taskColumns}
        className="studio-grid-edit-example"
        getRowId={row=>row.id} getRowLabel={row=>row.name} onCellEdit={editTask}
        searchable={false} showColumnVisibility={false} defaultPageSize={5} pageSizeOptions={[5,10]} />
      <p role="status" className="component-helper">{notice}</p>
      <p className="react-studio-caption">Enter 또는 저장 버튼으로 확정하고 Escape 또는 취소 버튼으로 되돌립니다. 검증 오류는 셀 안에 표시합니다. 마지막 행은 읽기 전용입니다.</p>
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
    <Section title="사용 기준" description="일반 테이블은 읽기 중심의 표에, 데이터그리드는 검색·열 조작·선택·편집이 결합된 목록에 사용합니다.">
      <dl className="detail-list studio-grid-guidelines">
        <div><dt>필터와 정렬</dt><dd>검색과 열별 필터는 AND로 적용합니다. 정렬은 오름차순 → 내림차순 → 해제 순서이며 빈 값은 마지막에 표시합니다.</dd></div>
        <div><dt>키보드</dt><dd>Tab으로 컨트롤을 탐색합니다. 열 경계에서 ←·→는 10px, Shift와 함께 누르면 1px씩 조절하며 Home·End는 최소·최대 너비로 이동합니다.</dd></div>
        <div><dt>데이터 연결</dt><dd>행은 고유하고 안정적인 ID가 필요합니다. 편집 결과는 onCellEdit에서 rows 상태를 갱신하세요. 서버 저장은 이 콜백에서 별도로 연결합니다.</dd></div>
        <div><dt>처리 범위</dt><dd>검색·정렬·페이지 이동은 전달한 rows 전체를 브라우저에서 처리합니다. 가상 스크롤·서버 페이지 이동·행 그룹화·다중 열 정렬은 포함하지 않습니다.</dd></div>
      </dl>
    </Section>
  </>;
}

export const dataGridUsage = `import { useState } from 'react';
import { DataGrid, type DataGridColumn } from '@idenflu/mono-react';
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
  return <DataGrid label="프로젝트 목록" rows={rows} columns={columns}
    getRowId={row => row.id} getRowLabel={row => row.name}
    selectable selectedRowIds={selected} onSelectedRowIdsChange={setSelected}
    defaultPageSize={5} pageSizeOptions={[5, 10, 20]} maxHeight={400}
    exportable exportFileName="projects.csv"
    onCellEdit={({ rowId, columnId, value }) => {
      setRows(current => current.map(row => row.id === rowId
        ? { ...row, [columnId]: columnId === 'hours' ? Number(value) : value.trim() }
        : row));
    }} />;
}`;
