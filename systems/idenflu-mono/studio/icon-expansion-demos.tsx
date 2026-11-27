import * as React from 'react';
import {Button, Icon, IconButton, Segmented, type IconName} from '@idenflu/mono-react';
import {Section} from './demo-layout';

const groups:readonly {label:string;description:string;names:readonly IconName[]}[]=[
  {label:'정렬·필터',description:'정렬 방향과 조건 초기화',names:['sort-ascending','sort-descending','filter-clear']},
  {label:'그리드·목록',description:'표시 열, 고정·해제, 순서 변경과 행 메뉴',names:['columns','pin','pin-off','drag-handle','more-vertical']},
  {label:'문서·파일',description:'문서 종류와 열기·보관·공유·인쇄',names:['file-text','folder-open','archive','share','printer']},
  {label:'계정·권한',description:'멤버 추가·제외, 로그인과 잠금 해제',names:['user-plus','user-minus','login','unlock']},
  {label:'상태',description:'오류와 사용 제한을 구분',names:['x-circle','ban']},
  {label:'설정·화면',description:'상세 설정, 화면 확대·복원과 테마 전환',names:['sliders','maximize','minimize','sun','moon']},
];
const previewSizes=[14,16,18,20] as const;
const deviceGroups:readonly {label:string;description:string;icons:readonly {name:IconName;label:string}[]}[]=[
  {label:'목록·표시',description:'목록 펼치기·접기와 상태 점',icons:[{name:'list-expand',label:'목록 펼치기'},{name:'list-fold',label:'목록 접기'},{name:'dot',label:'점·상태 표시'}]},
  {label:'설비·물류',description:'생산·운송·보관과 설비 계측',icons:[{name:'factory',label:'공장·생산 시설'},{name:'truck',label:'운송·배송'},{name:'package',label:'포장·화물'},{name:'warehouse',label:'창고·재고'},{name:'gauge',label:'계기·부하'},{name:'thermometer',label:'온도'},{name:'zap',label:'전력·에너지'},{name:'activity',label:'가동·신호'}]},
  {label:'상태·데이터 흐름',description:'추세, 클라우드 전송과 시스템 구성',icons:[{name:'trending-up',label:'증가 추세'},{name:'trending-down',label:'감소 추세'},{name:'cloud-upload',label:'클라우드 업로드'},{name:'cloud-download',label:'클라우드 다운로드'},{name:'server',label:'서버'},{name:'layers',label:'계층·레이어'},{name:'power',label:'전원'}]},
  {label:'커뮤니케이션·기기',description:'연락 수단, 기기와 식별 코드',icons:[{name:'phone',label:'전화'},{name:'smartphone',label:'모바일 기기'},{name:'monitor',label:'모니터·화면'},{name:'mic',label:'마이크·음성'},{name:'video',label:'영상·화상 회의'},{name:'at-sign',label:'멘션·이메일 주소'},{name:'qr-code',label:'QR 코드'},{name:'barcode',label:'바코드'}]},
];
const equipmentIcons:readonly {name:IconName;label:string}[]=[
  {name:'rows-compact',label:'촘촘한 행 간격'},
  {name:'rows-comfortable',label:'기본 행 간격'},
  {name:'conveyor',label:'컨베이어 설비'},
  {name:'wrench',label:'점검·정비'},
];

export function IconExpansionDemos() {
  const [size,setSize]=React.useState('18');
  const [sort,setSort]=React.useState<'none'|'ascending'|'descending'>('none');
  const [pinned,setPinned]=React.useState(false);
  const [message,setMessage]=React.useState('');
  return <>
    <Section id="icon-device-additions" title="목록·설비·데이터·기기 아이콘 26종" description="목록 접기·펼치기, 설비·물류, 데이터 흐름과 기기를 나타냅니다. line-height는 가운데 줄을 없애 줄 간격만 표현합니다.">
      <Segmented label="목록·설비·데이터·기기 아이콘 미리보기 크기" value={size} onValueChange={setSize} options={previewSizes.map(value=>({value:String(value),label:`${value}px`}))} />
      <div className="studio-icon-expansion-groups" style={{'--preview-icon-size':`${size}px`} as React.CSSProperties}>
        {deviceGroups.map(group=><section className="studio-icon-expansion-group" key={group.label} aria-label={group.label}>
          <header><h3 className="react-studio-example-title">{group.label}</h3><p className="react-studio-caption">{group.description}</p></header>
          <ul className="studio-icon-expansion-list">{group.icons.map(item=><li key={item.name}><Icon name={item.name} /><code>{item.name}</code><span className="react-studio-caption">{item.label}</span></li>)}</ul>
        </section>)}
      </div>
    </Section>
    <Section id="icon-equipment-additions" title="행 간격·설비 아이콘 4종" description="데이터그리드의 행 간격과 컨베이어·점검 작업을 구분합니다.">
      <Segmented label="행 간격·설비 아이콘 미리보기 크기" value={size} onValueChange={setSize} options={previewSizes.map(value=>({value:String(value),label:`${value}px`}))} />
      <ul className="studio-icon-expansion-list" style={{'--preview-icon-size':`${size}px`} as React.CSSProperties}>{equipmentIcons.map(item=><li key={item.name}><Icon name={item.name} /><code>{item.name}</code><span className="react-studio-caption">{item.label}</span></li>)}</ul>
    </Section>
    <Section id="icon-workflow-additions" title="업무·데이터 아이콘 24종" description="정렬·열 관리·문서·권한에 필요한 아이콘입니다. 작은 크기에서도 의미를 구분할 수 있도록 같은 그리드와 선 두께로 구성했습니다.">
      <Segmented label="아이콘 미리보기 크기" value={size} onValueChange={setSize} options={previewSizes.map(value=>({value:String(value),label:`${value}px`}))} />
      <div className="studio-icon-expansion-groups" style={{'--preview-icon-size':`${size}px`} as React.CSSProperties}>
        {groups.map(group=><section className="studio-icon-expansion-group" key={group.label} aria-label={group.label}>
          <header><h3 className="react-studio-example-title">{group.label}</h3><p className="react-studio-caption">{group.description}</p></header>
          <ul className="studio-icon-expansion-list">{group.names.map(name=><li key={name}><Icon name={name} /><code>{name}</code></li>)}</ul>
        </section>)}
      </div>
    </Section>
    <Section id="icon-workflow-examples" title="정렬과 고정" description="동작을 나타내는 아이콘을 버튼의 이름과 함께 사용합니다. 정렬 전에는 아이콘을 숨기고, 고정 버튼은 실행할 동작과 현재 상태를 함께 전달합니다.">
      <div className="react-studio-row">
        <Button variant="outline" onClick={()=>setSort(value=>value==='none'?'ascending':value==='ascending'?'descending':'none')}>
          {sort!=='none' && <Icon name={sort==='ascending'?'sort-ascending':'sort-descending'} />}
          {sort==='none'?'정렬 없음':sort==='ascending'?'오름차순':'내림차순'}
        </Button>
        <IconButton variant="outline" label={pinned?'고정 해제':'상단에 고정'} aria-pressed={pinned} onClick={()=>setPinned(value=>!value)}><Icon name={pinned?'pin-off':'pin'} /></IconButton>
        <IconButton variant="outline" label="정렬·고정 초기화" onClick={()=>{setSort('none');setPinned(false);setMessage('정렬과 고정을 초기화했습니다.');}}><Icon name="filter-clear" /></IconButton>
        <Button variant="outline" onClick={()=>setMessage('멤버 초대 동작을 연결하는 버튼 예시입니다.')}><Icon name="user-plus" />멤버 초대</Button>
      </div>
      <p role="status" className="component-helper">{sort==='none'?'정렬 없음':sort==='ascending'?'오름차순':'내림차순'} · {pinned?'상단 고정':'고정 안 함'}{message?` · ${message}`:''}</p>
    </Section>
  </>;
}
