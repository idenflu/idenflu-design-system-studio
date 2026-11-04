import { HiddenLabelDemos } from './convenience-api-demos';
import {SelectAPIReference, NumberFieldAPIReference, DatePickerAPIReference} from './field-api-reference';
import {SelectBindingExample, NumberBindingExample, DateBindingExample} from './field-binding-examples';
import * as React from 'react';
import { Button, DatePicker, DateRangePicker, Icon, MultiSelect, NumberField, SearchSelect, Select, Switch, TextArea, TextField } from '../src';
import { Section } from './demo-layout';
const sizes = ['sm','md','lg'] as const;
const options = [{value:'design',label:'디자인'}, {value:'development',label:'개발'}, {value:'marketing',label:'마케팅'}, {value:'operations',label:'운영',disabled:true}];
const multipleOptions = [
  {value:'design',label:'디자인'}, {value:'development',label:'개발'},
  {value:'marketing',label:'마케팅'}, {value:'operations',label:'운영'},
  {value:'product',label:'프로덕트 기획'}, {value:'research',label:'사용자 리서치'},
  {value:'sales',label:'영업'}, {value:'finance',label:'재무'},
  {value:'people',label:'인사'}, {value:'support',label:'고객 지원'},
];
const describedOptions = [
  {value:'product', label:'프로덕트 디자인', description:'제품과 사용 경험을 설계합니다.'},
  {value:'brand', label:'브랜드 디자인', description:'브랜드의 일관된 인상을 만듭니다.'},
  {value:'engineering', label:'개발', description:'아이디어를 실제 제품으로 구현합니다.'},
  {value:'operations', label:'운영', description:'현재 선택할 수 없는 팀입니다.', disabled:true},
];
const iconOptions = [
  {value:'list', label:'목록 보기', icon:<Icon name="list" />},
  {value:'grid', label:'격자 보기', icon:<Icon name="grid" />},
  {value:'calendar', label:'캘린더 보기', icon:<Icon name="calendar" />},
];

function TextFieldHelpers() {
  const [search, setSearch] = React.useState('');
  const [email, setEmail] = React.useState('minsu@idenflu.com');
  const [emailValid, setEmailValid] = React.useState(true), [emailTouched, setEmailTouched] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const validEmail = Boolean(email.trim()) && emailValid;
  const invalidEmail = emailTouched && Boolean(email.trim()) && !emailValid;
  return <div className="react-studio-field-grid">
    <TextField ref={searchRef} label="검색" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="컴포넌트 검색" prefixDecorative prefix={<span className="ui-icon icon-search" />} helperText={search ? `입력한 검색어: ${search}` : '검색 아이콘과 지우기 버튼을 함께 사용합니다.'} action={<button className="input-action" type="button" aria-label="검색어 지우기" disabled={!search} onClick={() => { setSearch(''); searchRef.current?.focus(); }}><span className="ui-icon icon-close" aria-hidden="true" /></button>} />
    <TextField label="이메일" type="email" value={email} onChange={event => { setEmail(event.target.value); setEmailValid(event.target.validity.valid); setEmailTouched(false); }} onBlur={() => setEmailTouched(true)} prefixDecorative prefix={<span className="ui-icon icon-email" />} helperText={!invalidEmail ? validEmail ? '올바른 이메일 형식입니다.' : '이메일 주소를 입력해주세요.' : undefined} error={invalidEmail ? '올바른 이메일 주소를 입력해주세요.' : undefined} action={validEmail && <span className="input-status" aria-hidden="true"><span className="ui-icon icon-check" /></span>} />
    <div className="react-studio-field-wide"><TextField label="비밀번호" type={visible ? 'text' : 'password'} defaultValue="idenflu-mono" prefixDecorative prefix={<span className="ui-icon icon-lock" />} action={<button className="input-action" type="button" aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'} aria-pressed={visible} onClick={() => setVisible(!visible)}><span className={`ui-icon ${visible ? 'icon-eye-slash' : 'icon-eye'}`} aria-hidden="true" /></button>} /></div>
    <div className="react-studio-field-wide"><TextArea label="설명" rows={3} maxLength={160} value={description} onChange={event => setDescription(event.target.value)} placeholder="프로젝트에 대해 간단히 적어주세요." helperText={<span className="react-studio-field-meta"><span>최대 160자</span><span>{description.length} / 160</span></span>} /></div>
  </div>;
}
function RequiredTextFields() {
  const [name, setName] = React.useState(''), [company, setCompany] = React.useState('');
  const [error, setError] = React.useState(''), [result, setResult] = React.useState('');
  const nameRef = React.useRef<HTMLInputElement>(null);
  return <form className="react-studio-stack" noValidate onSubmit={event => {
    event.preventDefault();
    if (!name.trim()) { setError('이름을 입력해주세요.'); setResult(''); nameRef.current?.focus(); return; }
    setError(''); setResult(`${name.trim()} · 회사명: ${company.trim() || '선택 안 함'}`);
  }} onReset={() => { setName(''); setCompany(''); setError(''); setResult(''); nameRef.current?.focus(); }}>
    <div className="react-studio-field-grid">
      <TextField ref={nameRef} label={<>이름 <span className="form-pattern-required">필수</span></>} name="required-name" required autoComplete="name" prefix={<Icon name="person" />} prefixDecorative value={name} onChange={event => { setName(event.target.value); setResult(''); if (event.target.value.trim()) setError(''); }} error={error || undefined} helperText={error ? undefined : '반드시 입력해야 하는 항목입니다.'} placeholder="이름을 입력해주세요" />
      <TextField label={<>회사명 <span className="form-pattern-optional">선택</span></>} name="optional-company" autoComplete="organization" value={company} onChange={event => { setCompany(event.target.value); setResult(''); }} helperText="입력하지 않아도 확인할 수 있습니다." placeholder="회사명을 입력해주세요" />
    </div>
    <div className="react-studio-row"><Button type="submit">입력 확인</Button><Button type="reset" variant="outline">입력 초기화</Button></div>
    <p className="component-helper" role="status">{result}</p>
  </form>;
}

export function TextFields() { return <>
  <Section title="기본 입력" description="라벨로 입력 목적을 설명하고, 필요한 형식은 도움말로 안내합니다."><div className="react-studio-field-grid"><TextField label="프로젝트 이름" defaultValue="디자인 시스템" helperText="목록에서 쉽게 구분할 이름을 입력해주세요." /><TextField label="담당자" placeholder="이름을 입력해주세요" autoComplete="name" /></div></Section>
  <Section title="필수와 선택" description="필수·선택 여부를 라벨에 표시합니다. 이름을 비운 채 확인하면 오류를 안내하고, 회사명은 생략할 수 있습니다."><RequiredTextFields /></Section>
  <Section title="좌측 라벨" description="설정처럼 관련 항목을 연속해서 입력할 때 라벨의 시작점을 맞춥니다."><div className="react-studio-stack react-studio-horizontal-fields"><TextField label="웹사이트" labelPosition="left" prefix="https://" defaultValue="idenflu.app" helperText="프로토콜을 제외한 주소를 입력해주세요." /><TextField label="이메일 계정" labelPosition="left" suffix="@idenflu.com" defaultValue="minsu" /></div></Section>
  <Section title="텍스트 정렬" description="일반 문장은 왼쪽, 코드와 숫자는 내용의 성격에 맞춰 정렬합니다."><div className="react-studio-size-grid"><TextField label="왼쪽 정렬" alignment="start" defaultValue="프로젝트 이름" /><TextField label="가운데 정렬" alignment="center" defaultValue="A-1024" /><TextField label="오른쪽 정렬" alignment="end" defaultValue="12,500" /></div></Section>
  <Section title="프리픽스와 서픽스" description="고정된 주소나 단위는 입력값과 구분하며 제출할 값에는 포함하지 않습니다."><div className="react-studio-field-grid"><TextField label="프로젝트 주소" prefix="idenflu.app /" defaultValue="mono" helperText="프로젝트의 짧은 주소를 입력해주세요." /><TextField label="너비" inputMode="numeric" suffix="px" defaultValue="100" helperText="값의 단위를 오른쪽에 표시합니다." /></div></Section>
  <Section title="아이콘과 입력 보조" description="검색 초기화, 이메일 검증, 비밀번호 표시와 글자 수를 직접 확인할 수 있습니다."><TextFieldHelpers /></Section>
  <Section title="입력 상태"><div className="react-studio-field-grid"><TextField label="기본 상태" placeholder="내용을 입력해주세요" helperText="입력 전의 기본 상태입니다." /><TextField label="오류 상태" defaultValue="잘못된 값" error="입력한 내용을 확인해주세요." /><TextField label="읽기 전용" readOnly defaultValue="IDN-1024" helperText="값을 읽고 복사할 수 있습니다." /><TextField label="비활성" disabled defaultValue="수정할 수 없음" helperText="현재 사용할 수 없는 항목입니다." /></div></Section>
  <Section title="사이즈"><div className="react-studio-size-grid">{sizes.map(size => <TextField key={size} size={size} label={`${size.toUpperCase()} 텍스트 입력`} defaultValue="idenflu mono" />)}</div></Section>
<HiddenLabelDemos /></>; }

export function SelectDemos() {
  const [result, setResult] = React.useState('');
  const [multiple, setMultiple] = React.useState<string[]>(['development']);
  const [simpleMultiple, setSimpleMultiple] = React.useState<string[]>(['design']);
  const [tags, setTags] = React.useState<string[]>(['design']);
  const [simpleTags, setSimpleTags] = React.useState<string[]>([]);
  return <><Section title="기본 선택" description="정해진 목록에서 한 항목을 선택합니다. 운영 팀은 비활성 옵션입니다."><div className="react-studio-field-grid"><Select label="담당 팀" options={options} defaultValue="design" /><Select label="비활성" options={options} disabled /></div></Section>
    <Section title="보조 설명이 있는 옵션" description="옵션마다 선택에 필요한 맥락을 간결하게 덧붙입니다. 선택 후 입력창에는 옵션 이름만 표시합니다."><div className="react-studio-field-grid"><Select label="담당 팀 · 설명" options={describedOptions} defaultValue="product" prefixIcon={<Icon name="person" />} /><SearchSelect label="팀 검색 · 설명" options={describedOptions} placeholder="팀 검색" /></div></Section>
    <Section title="아이콘이 있는 옵션" description="아이콘은 옵션 이름을 보조하고, 선택한 값과 태그에도 함께 표시됩니다."><div className="react-studio-field-grid"><Select label="보기 방식 · 아이콘" options={iconOptions} defaultValue="list" /><MultiSelect label="표시 방식 · 아이콘" options={iconOptions} defaultValue={['grid']} presentation="inline" clearable /></div></Section>
    <Section title="검색 선택" description="검색 결과가 없으면 안내를 표시하고, 방향키와 Enter로 선택할 수 있습니다."><div className="react-studio-field-grid"><SearchSelect label="팀 검색" options={options} placeholder="팀 검색" /><SearchSelect label="선택된 팀 검색" options={options} defaultValue="design" /></div></Section>
    <Section title="복수 선택" description="10개 팀을 검색하거나 목록에서 선택합니다. 모두 선택해도 입력 영역의 크기를 유지합니다."><div className="react-studio-field-grid"><MultiSelect label="여러 팀" options={multipleOptions} value={multiple} onValueChange={setMultiple} searchable clearable /><MultiSelect label="검색 없는 복수 선택" options={multipleOptions} value={simpleMultiple} onValueChange={setSimpleMultiple} clearable /></div><div className="react-studio-row"><Button variant="outline" aria-label="복수 선택 10개 모두 선택" onClick={() => {const all=multipleOptions.map(item=>item.value); setMultiple(all); setSimpleMultiple(all);}}>10개 모두 선택</Button><Button variant="ghost" aria-label="복수 선택 초기화" onClick={() => {setMultiple([]); setSimpleMultiple([]);}}>선택 초기화</Button></div></Section>
    <Section title="태그형 복수 선택" description="10개 팀을 태그로 선택합니다. 너비를 넘는 태그는 +N개로 축약하며, 눌러 전체 옵션을 확인할 수 있습니다. 입력 크기는 유지됩니다."><div className="react-studio-field-grid"><MultiSelect label="참여 팀" options={multipleOptions} value={tags} onValueChange={setTags} searchable presentation="inline" clearable /><MultiSelect label="검색 없는 태그 선택" options={multipleOptions} value={simpleTags} onValueChange={setSimpleTags} presentation="inline" clearable /></div><div className="react-studio-row"><Button variant="outline" aria-label="태그형 복수 선택 10개 모두 선택" onClick={() => {const all=multipleOptions.map(item=>item.value); setTags(all); setSimpleTags(all);}}>10개 모두 선택</Button><Button variant="ghost" aria-label="태그형 복수 선택 초기화" onClick={() => {setTags([]); setSimpleTags([]);}}>선택 초기화</Button></div></Section>
    <Section title="필수 선택"><form className="react-studio-stack" onSubmit={event => { event.preventDefault(); setResult('담당 팀을 확인했습니다.'); }} onReset={() => setResult('')}><div className="react-studio-field-grid"><Select label="필수 담당 팀" name="team" options={options} required /><div><Select label="오류 상태" options={options} aria-invalid="true" aria-describedby="select-demo-error" /><p id="select-demo-error" className="field-error">담당 팀 선택을 확인해주세요.</p></div></div><div className="react-studio-row"><Button type="submit">선택 확인</Button><Button type="reset" variant="outline">선택 초기화</Button></div><p role="status" className="component-helper">{result}</p></form></Section>
    <Section title="사이즈"><div className="react-studio-size-grid">{sizes.map(size => <Select key={size} size={size} label={`${size.toUpperCase()} 선택`} options={options} defaultValue="design" />)}</div></Section><HiddenLabelDemos kind="select" /><Section id="select-binding" title="값 바인딩과 폼 제출" description="부모 상태로 선택값을 관리하고, 단일 값과 같은 이름의 복수 값을 FormData에서 읽습니다. 초기값 복원도 함께 확인하세요."><SelectBindingExample /></Section><SelectAPIReference /></>;
}

export function NumberDemos() {
  const [selectAll, setSelectAll] = React.useState(true);
  return <><Section title="입력 형식" description="정수와 소수의 허용 자릿수를 구분합니다. 입력 후 포커스를 옮기면 형식을 확인합니다."><div className="react-studio-field-grid"><NumberField label="정수만 입력" defaultValue="12" min="0" max="100" unit="개" helperText="0부터 100까지 정수로 입력합니다." /><NumberField label="소수 입력" defaultValue="12.5" decimals={2} step="0.01" unit="시간" helperText="소수점 두 자리까지 입력할 수 있습니다." /></div></Section>
    <Section title="천 단위 구분"><div className="react-studio-field-grid"><NumberField label="금액" defaultValue="12500" grouping step="1000" unit="원" /><NumberField label="소수 금액" defaultValue="12500.5" grouping decimals={2} step="0.5" unit="원" /></div></Section>
    <Section title="프리픽스 아이콘" description="입력값 앞의 아이콘으로 의미를 보조하고, 단위는 오른쪽에 표시합니다. 아이콘은 제출 값에 포함하지 않습니다."><div className="react-studio-field-grid"><NumberField label="참여 인원" prefixIcon={<Icon name="person" />} defaultValue="8" min="0" max="100" unit="명" helperText="참여할 인원을 입력해주세요." /><NumberField label="작업 기간" prefixIcon={<Icon name="calendar" />} defaultValue="3" min="0" step="0.5" decimals={1} unit="일" helperText="0.5일 단위로 조정할 수 있습니다." /></div></Section>
    <Section title="증감 단위"><div className="react-studio-field-grid"><NumberField label="1 단위" defaultValue="8" step="1" /><NumberField label="10 단위" defaultValue="20" step="10" /><NumberField label="0.1 단위" defaultValue="1.2" decimals={1} step="0.1" /><NumberField label="0.5 단위" defaultValue="2.5" decimals={1} step="0.5" /></div></Section>
    <Section title="포커스 동작" description="기본 커서 이동과 첫 포커스에서 값 전체를 선택하는 동작을 비교합니다."><div className="react-studio-field-grid"><NumberField label="기본 동작" defaultValue="12500" grouping /><NumberField label="전체 선택 옵션" defaultValue="12500" grouping selectOnFocus={selectAll} /></div><Switch label="포커스 시 전체 선택" checked={selectAll} onChange={event => setSelectAll(event.target.checked)} /></Section>
    <Section title="범위와 상태"><div className="react-studio-field-grid"><NumberField label="최소·최대 범위" defaultValue="5" min="0" max="5" unit="명" helperText="0~5명, 최댓값에서 증가 버튼이 비활성화됩니다." /><NumberField label="필수 수량" required helperText="값을 비운 뒤 포커스를 옮겨 검증을 확인하세요." /><NumberField label="읽기 전용" defaultValue="12.5" decimals={1} readOnly /><NumberField label="비활성" defaultValue="0" disabled /></div></Section>
    <Section title="사이즈"><div className="react-studio-size-grid">{sizes.map(size => <NumberField key={size} size={size} label={`${size.toUpperCase()} 숫자 입력`} defaultValue="10" unit="개" />)}</div></Section><Section id="number-binding" title="값 바인딩과 폼 제출" description="쉼표가 있는 표시값, 확정된 문자열, 실제 제출값을 비교합니다. 임시 입력까지 초기화하는 방법도 예제 코드에 포함합니다."><NumberBindingExample /></Section><NumberFieldAPIReference /></>;
}

export function DateDemos() {
  return <><Section title="날짜 선택" description="직접 입력하거나 달력에서 선택합니다. 숫자 8자리 입력도 날짜 형식으로 정리합니다."><div className="react-studio-field-grid"><DatePicker label="날짜" helperText="YYYY-MM-DD 또는 숫자 8자리로 입력해주세요." /><DatePicker label="범위 제한 날짜" min="2026-11-01" max="2026-11-30" defaultValue="2026-11-02" helperText="2026년 11월 안에서 선택합니다." /></div></Section>
    <Section title="기간 선택" description="달력에서 시작일과 종료일을 차례로 선택하고, 입력으로 수정할 수도 있습니다."><div className="react-studio-field-grid"><DateRangePicker label="기간" helperText="시작일과 종료일을 선택하세요." /><DateRangePicker label="선택된 기간" defaultValue={['2026-11-02','2026-11-06']} /></div></Section>
    <Section title="입력 상태"><div className="react-studio-field-grid"><DatePicker label="읽기 전용 날짜" defaultValue="2026-11-02" readOnly /><DatePicker label="비활성 날짜" disabled /><DateRangePicker label="읽기 전용 기간" defaultValue={['2026-11-02','2026-11-06']} readOnly /><DateRangePicker label="비활성 기간" disabled /></div></Section>
    <Section title="사이즈"><div className="react-studio-size-grid">{sizes.map(size => <DatePicker key={size} label={`${size.toUpperCase()} 날짜`} size={size} />)}</div><div className="react-studio-size-grid">{sizes.map(size => <DateRangePicker key={size} label={`${size.toUpperCase()} 기간`} size={size} />)}</div></Section><Section id="date-binding" title="값 바인딩과 폼 제출" description="날짜·기간의 확정값과 폼 제출 이름을 확인합니다. 기간은 시작·종료 이름으로 나뉘며 날짜 문자열에 시간대를 붙이지 않습니다."><DateBindingExample /></Section><DatePickerAPIReference /></>;
}

