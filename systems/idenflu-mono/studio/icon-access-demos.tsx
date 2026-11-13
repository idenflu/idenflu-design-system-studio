import * as React from 'react';
import {Badge,Icon,Segmented,type IconName} from '@idenflu/mono-react';
import {Section} from './demo-layout';

const accessIcons:readonly {name:IconName;label:string}[]=[
  {name:'key',label:'접근 키·자격 증명'}, {name:'shield',label:'권한·정책'},
  {name:'shield-off',label:'접근 거부'}, {name:'shield-alert',label:'권한 확인 필요'},
  {name:'user-check',label:'승인된 사용자'}, {name:'user-lock',label:'계정 잠금'},
  {name:'user-settings',label:'역할 관리'}, {name:'user',label:'역할·멤버 정보'},
  {name:'hierarchy',label:'조직·권한 상속'}, {name:'star',label:'소유자'},
];
export function AccessIconDemos() {
  const [size,setSize]=React.useState('18');
  return <Section id="access-role-icons" title="권한과 역할 아이콘 10종" description="역할은 사용자의 책임을, 접근 상태는 허용·거부·잠금을 나타냅니다. 같은 아이콘에 두 의미를 섞지 않고 이름과 함께 표시합니다.">
    <Segmented label="권한 아이콘 크기" value={size} onValueChange={setSize} options={[14,16,18,20].map(value=>({value:String(value),label:`${value}px`}))} />
    <ul className="studio-icon-expansion-list" style={{'--preview-icon-size':`${size}px`} as React.CSSProperties}>{accessIcons.map(item=><li key={item.name}><Icon name={item.name} /><code>{item.name}</code><span className="react-studio-caption">{item.label}</span></li>)}</ul>
    <div className="react-studio-row" role="group" aria-label="역할 표시 예시">
      <Badge><Icon name="star" />소유자</Badge><Badge><Icon name="user-settings" />관리자</Badge><Badge><Icon name="edit" />편집자</Badge><Badge><Icon name="visibility" />뷰어</Badge>
    </div>
    <div className="react-studio-row" role="group" aria-label="접근 상태 예시">
      <Badge variant="success"><Icon name="shield-check" />허용</Badge><Badge variant="danger"><Icon name="shield-off" />접근 거부</Badge><Badge><Icon name="user-lock" />계정 잠금</Badge><Badge variant="warning"><Icon name="shield-alert" />권한 확인</Badge>
    </div>
    <p className="react-studio-caption">인물과 보조 기호가 함께 있는 아이콘은 16px 이상을 권장합니다. 상태와 역할 이름을 함께 표시하세요.</p>
  </Section>;
}
