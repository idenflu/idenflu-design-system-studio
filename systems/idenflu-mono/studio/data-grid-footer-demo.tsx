import * as React from 'react';
import { Button, DataGrid, Icon, type DataGridColumn } from '@idenflu/mono-react';
import { Section } from './demo-layout';

type Project = { id:string; name:string; team:string; budget:number };
const rows:Project[] = [
  {id:'summary-1',name:'디자인 시스템',team:'디자인',budget:1500000},
  {id:'summary-2',name:'관리자 대시보드',team:'개발',budget:2400000},
  {id:'summary-3',name:'브랜드 가이드',team:'디자인',budget:800000},
  {id:'summary-4',name:'파트너 포털',team:'개발',budget:1200000},
  {id:'summary-5',name:'아이콘 정리',team:'디자인',budget:600000},
  {id:'summary-6',name:'알림 센터',team:'개발',budget:900000},
];
const money = new Intl.NumberFormat('ko-KR');
const dateTime = new Intl.DateTimeFormat('ko-KR', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const columns:DataGridColumn<Project>[] = [
  {id:'name',header:'프로젝트',accessor:row=>row.name,flex:2,minWidth:180,filter:'text'},
  {id:'team',header:'담당 팀',accessor:row=>row.team,flex:1,minWidth:120,filter:'select',filterOptions:[{value:'디자인',label:'디자인'},{value:'개발',label:'개발'}]},
  {id:'budget',header:'예산',accessor:row=>row.budget,width:160,align:'end',filter:'number',cell:row=>`${money.format(row.budget)}원`},
];
const budget = (items:readonly Project[]) => `${money.format(items.reduce((sum,row)=>sum+row.budget,0))}원`;

export function DataGridFooterDemo() {
  const [loading,setLoading] = React.useState(false);
  const [lastQueriedAt,setLastQueriedAt] = React.useState(()=>new Date());
  React.useEffect(()=>{
    if (!loading) return;
    const timer=window.setTimeout(()=>{setLastQueriedAt(new Date());setLoading(false);},700);
    return ()=>window.clearTimeout(timer);
  },[loading]);

  return <Section id="data-grid-footer-demo" title="사용자 지정 하단" description="페이지네이션 없이 합계·선택 건수·마지막 조회 일시를 표시합니다. 검색·필터를 바꾸거나 행을 선택해 하단 값이 갱신되는지 확인하세요.">
    <DataGrid label="하단 요약 데이터그리드" rows={rows} columns={columns} getRowId={row=>row.id} getRowLabel={row=>row.name}
      selectable pagination={false} searchLabel="하단 요약 검색" maxHeight={360} loading={loading}
      toolbarActions={<Button variant="outline" disabled={loading} onClick={()=>setLoading(true)}><Icon name="rotate"/>{loading ? '조회 중' : '다시 조회'}</Button>}
      footer={({totalCount,filteredCount,filteredRows,selectedCount,selectedRows,loading})=><div className="studio-grid-footer-summary">
        {loading ? <span>데이터를 조회하는 중입니다.</span> : <dl className="studio-grid-footer-metrics">
          <div><dt>조회</dt><dd>{filteredCount} / {totalCount}건</dd></div>
          <div><dt>조회 예산 합계</dt><dd>{budget(filteredRows)}</dd></div>
          <div><dt>선택</dt><dd>{selectedCount}건</dd></div>
          <div><dt>선택 예산 합계</dt><dd>{budget(selectedRows)}</dd></div>
        </dl>}
        <span className="studio-grid-footer-updated">마지막 조회 <time dateTime={lastQueriedAt.toISOString()}>{dateTime.format(lastQueriedAt)}</time></span>
      </div>} />
    <p className="react-studio-caption">조회 합계는 검색·필터 결과 전체, 선택 합계는 필터로 숨겨진 행을 포함한 전체 선택 기준입니다. 마지막 조회 시각(KST)은 다시 조회가 완료될 때만 갱신하며 검색·선택으로 바뀌지 않습니다.</p>
  </Section>;
}
