import * as React from 'react';
import {DataGrid,Icon,Segmented,Table,TableContainer,type DataGridColumn} from '../src';
import {Section} from './demo-layout';
import {StatusBadge,statusDefinitions,type DemoStatus} from './status-definitions';

const statuses=Object.keys(statusDefinitions) as DemoStatus[];
const rows=statuses.map(status=>({id:status,status,label:statusDefinitions[status].label,description:statusDefinitions[status].description}));

export function StatusIconDemos() {
  const [size,setSize]=React.useState('16');
  return <Section id="status-icon-guide" title="상태 아이콘과 사용 기준" description="대기·진행·보류·비활성 4종과 오류·차단의 Filled 2종을 추가했습니다. 상태는 도형과 문구로 함께 전달하며, 강조할 때만 같은 의미의 Filled를 사용합니다.">
    <Segmented label="상태 아이콘 크기" value={size} onValueChange={setSize} options={[14,16,18,20].map(value=>({value:String(value),label:`${value}px`}))} />
    <TableContainer label="상태 아이콘 사용 기준" className="studio-status-table"><Table density="compact">
      <caption className="sr-only">상태별 기본·강조 아이콘과 배지, 사용 기준</caption>
      <thead><tr><th scope="col">상태</th><th scope="col">기본</th><th scope="col">강조</th><th scope="col">배지</th><th scope="col">사용 기준</th></tr></thead>
      <tbody>{statuses.map(status=>{const item=statusDefinitions[status];return <tr key={status} data-status={status}>
        <th scope="row">{item.label}</th>
        <td><div className="studio-status-icon-sample"><Icon name={item.icon} style={{'--icon-size':`${size}px`} as React.CSSProperties} /><code>{item.icon}</code></div></td>
        <td><div className="studio-status-icon-sample"><Icon name={item.solidIcon} style={{'--icon-size':`${size}px`} as React.CSSProperties} /><code>{item.solidIcon===item.icon?'기본형 유지':item.solidIcon}</code></div></td>
        <td><StatusBadge status={status} /></td><td>{item.description}</td>
      </tr>;})}</tbody>
    </Table></TableContainer>
    <p className="react-studio-caption">진행 상태의 점은 정지형입니다. 처리 중인 요청에는 Spinner를 사용하고, 취소·차단·오류는 상태 문구와 사유를 함께 표시하세요.</p>
  </Section>;
}

export function DataGridStatusDemos() {
  const [appearance,setAppearance]=React.useState<'default'|'solid'>('default');
  const columns:DataGridColumn<typeof rows[number]>[]=[
    {id:'status',header:'상태',accessor:row=>row.label,width:130,minWidth:120,filter:'select',filterOptions:rows.map(row=>({value:row.label,label:row.label})),cell:row=><StatusBadge status={row.status} appearance={appearance} />},
    {id:'description',header:'사용 기준',accessor:row=>row.description,flex:1,minWidth:300,maxWidth:1600},
  ];
  return <Section id="data-grid-status-demo" title="상태 표시" description="배지·토스트와 같은 상태 도형을 셀에서 사용합니다. accessor는 문자열을 반환해 검색·정렬·내보내기의 원시 값을 유지합니다.">
    <Segmented label="그리드 상태 배지 스타일" value={appearance} onValueChange={value=>setAppearance(value==='solid'?'solid':'default')} options={[{value:'default',label:'기본'},{value:'solid',label:'반전'}]} />
    <DataGrid label="상태 기준 데이터그리드" rows={rows} columns={columns} getRowId={row=>row.id} getRowLabel={row=>row.label} searchable={false} pagination={false} defaultDensity="compact" showColumnVisibility={false} maxHeight={440} />
  </Section>;
}
