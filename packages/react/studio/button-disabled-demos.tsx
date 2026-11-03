import * as React from 'react';
import { Button, Icon, IconButton, type IconName } from '../src';
import { Section } from './demo-layout';

const variants = [
  {value:'primary',label:'Primary',icon:'save',description:'옅은 프라이머리 채움'},
  {value:'secondary',label:'Secondary',icon:'copy',description:'중립 회색 채움'},
  {value:'outline',label:'Outline',icon:'download',description:'투명 배경과 옅은 테두리'},
  {value:'ghost',label:'Ghost',icon:'settings',description:'배경·테두리 없는 텍스트'},
  {value:'danger',label:'Danger',icon:'trash',description:'옅은 위험 색상 채움'},
] as const satisfies readonly {value:'primary'|'secondary'|'outline'|'ghost'|'danger';label:string;icon:IconName;description:string}[];

export function ButtonDisabledDemos() {
  const [message,setMessage] = React.useState('활성 버튼을 눌러 동작을 확인하세요.');
  return <Section id="button-disabled-states" title="스타일별 비활성 상태"
    description="버튼 유형을 구분할 수 있도록 채움·테두리·텍스트의 형태를 유지합니다. 비활성 버튼은 클릭과 키보드 포커스에서 제외하며 hover·눌림 효과를 적용하지 않습니다.">
    <div className="react-studio-sample-grid">
      {variants.map(({value,label,icon,description})=><div key={value} className="react-studio-example" role="group" aria-label={`${label} 버튼 상태`} data-button-variant={value}>
        <h3 className="react-studio-example-title">{label}</h3>
        <div className="react-studio-row"><Button variant={value} onClick={()=>setMessage(`${label} 버튼을 실행했습니다.`)}>{label}</Button></div>
        <div className="react-studio-row">
          <Button variant={value} disabled onClick={()=>setMessage('비활성 버튼은 실행되지 않습니다.')}>{label}</Button>
          <IconButton variant={value} label={`${label} 아이콘 비활성`} disabled tooltip={false}
            onClick={()=>setMessage('비활성 버튼은 실행되지 않습니다.')}><Icon name={icon} /></IconButton>
        </div>
        <p className="react-studio-caption">{description}</p>
      </div>)}
    </div>
    <p className="component-helper" role="status">{message}</p>
  </Section>;
}
