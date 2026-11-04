import * as React from 'react';
import {Button, DatePicker, DateRangePicker, Icon, MultiSelect, NumberField, SearchSelect, Select, type DateValue, type DateRangeValue} from '../src';

const bindingTeams = [
  {value:'design',label:'디자인'}, {value:'development',label:'개발'},
  {value:'marketing',label:'마케팅'}, {value:'operations',label:'운영'},
  {value:'product',label:'프로덕트 기획'}, {value:'research',label:'사용자 리서치'},
  {value:'sales',label:'영업'}, {value:'finance',label:'재무'},
  {value:'people',label:'인사'}, {value:'support',label:'고객 지원'},
];

export function SelectBindingExample() {
  const [team,setTeam]=React.useState('design');
  const [reviewer,setReviewer]=React.useState('');
  const [teams,setTeams]=React.useState<string[]>(['design']);
  const [result,setResult]=React.useState<Record<string,unknown>|null>(null);
  const [revision,setRevision]=React.useState(0);
  return <form className="react-pattern-form" onSubmit={event=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    // 같은 name의 복수 선택은 getAll로 읽습니다. 단일 값은 get으로 읽습니다.
    setResult({team:data.get('team'),reviewer:data.get('reviewer')||null,teams:data.getAll('teams')});
  }} onReset={()=>{setTeam('design');setReviewer('');setTeams(['design']);setResult(null);setRevision(value=>value+1);}}>
    <div className="form-pattern-grid" key={revision}>
      <Select label="바인딩 담당 팀" name="team" required options={bindingTeams} value={team} onValueChange={value=>{setTeam(value);setResult(null);}} />
      <SearchSelect label="바인딩 검토 팀" name="reviewer" options={bindingTeams} value={reviewer} onValueChange={value=>{setReviewer(value);setResult(null);}} />
      <div className="form-pattern-field--wide"><MultiSelect label="바인딩 참여 팀" name="teams" options={bindingTeams} value={teams} onValueChange={value=>{setTeams(value);setResult(null);}} searchable presentation="inline" clearable maxVisibleTags={2} /></div>
    </div>
    <div className="form-pattern-actions"><Button type="submit">선택값 확인</Button><Button type="reset" variant="outline" onPointerDown={event=>event.preventDefault()}>초기값 복원</Button></div>
    <pre className="field-binding-output" role="region" aria-label="선택 제출 데이터" tabIndex={0}>{result ? JSON.stringify(result,null,2) : '선택값 확인을 누르면 제출할 객체를 표시합니다.'}</pre>
  </form>;
}

export function NumberBindingExample() {
  const initial='12500.5';
  const [amount,setAmount]=React.useState<string|null>(initial);
  const [result,setResult]=React.useState<Record<string,unknown>|null>(null);
  const [revision,setRevision]=React.useState(0);
  return <form className="react-pattern-form" onSubmit={event=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    // FormData에는 표시 문자열이 들어갑니다. 요청 금액은 확정된 문자열 상태를 사용합니다.
    setResult({formValue:data.get('amount'),request:{amount}});
  }} onReset={()=>{setAmount(initial);setResult(null);setRevision(value=>value+1);}}>
    <NumberField key={revision} label="바인딩 금액" name="amount" value={amount} onValueChange={value=>{setAmount(value);setResult(null);}}
      decimals={2} step="0.5" min="0" grouping selectOnFocus prefixIcon={<Icon name="credit-card" />} unit="원"
      helperText="표시는 12,500.5원, 확정값은 쉼표 없는 문자열입니다. 비우면 null입니다." />
    <p className="component-helper" role="status">확정값: {amount===null ? 'null' : JSON.stringify(amount)}</p>
    <div className="form-pattern-actions"><Button type="submit">금액값 확인</Button><Button type="reset" variant="outline" onPointerDown={event=>event.preventDefault()}>금액 초기화</Button></div>
    <pre className="field-binding-output" role="region" aria-label="금액 제출 데이터" tabIndex={0}>{result ? JSON.stringify(result,null,2) : '금액값 확인을 누르면 표시값과 요청 값을 비교합니다.'}</pre>
  </form>;
}

export function DateBindingExample() {
  const [date,setDate]=React.useState<DateValue>('2026-11-12');
  const [range,setRange]=React.useState<DateRangeValue>(['2026-11-12','2026-11-19']);
  const [result,setResult]=React.useState<Record<string,unknown>|null>(null);
  const [revision,setRevision]=React.useState(0);
  return <form className="react-pattern-form" onSubmit={event=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    // 날짜는 시간대 없는 YYYY-MM-DD 문자열로 전달합니다.
    // name="trip" 범위는 trip-start와 trip-end라는 두 필드로 제출됩니다.
    setResult({request:{date,startsOn:range[0],endsOn:range[1]},formValues:{date:data.get('meetingDate'),start:data.get('trip-start'),end:data.get('trip-end')}});
  }} onReset={()=>{setDate('2026-11-12');setRange(['2026-11-12','2026-11-19']);setResult(null);setRevision(value=>value+1);}}>
    <div key={revision} className="react-studio-stack">
      <DatePicker label="바인딩 날짜" name="meetingDate" value={date} onValueChange={value=>{setDate(value);setResult(null);}} min="2026-11-01" max="2026-11-30" />
      <DateRangePicker label="바인딩 기간" name="trip" value={range} onValueChange={value=>{setRange(value);setResult(null);}} required startLabel="바인딩 시작일" endLabel="바인딩 종료일" />
    </div>
    <p className="component-helper" role="status">확정값: {JSON.stringify({date,range})}</p>
    <div className="form-pattern-actions"><Button type="submit">날짜값 확인</Button><Button type="reset" variant="outline" onPointerDown={event=>event.preventDefault()}>날짜 초기화</Button></div>
    <pre className="field-binding-output" role="region" aria-label="날짜 제출 데이터" tabIndex={0}>{result ? JSON.stringify(result,null,2) : '날짜값 확인을 누르면 날짜·기간의 제출 이름과 요청 객체를 표시합니다.'}</pre>
  </form>;
}
