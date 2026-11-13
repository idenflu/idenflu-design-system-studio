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

export function IconExpansionDemos() {
  const [size,setSize]=React.useState('18');
  const [sort,setSort]=React.useState<'none'|'ascending'|'descending'>('none');
  const [pinned,setPinned]=React.useState(false);
  const [message,setMessage]=React.useState('');
  return <>
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
