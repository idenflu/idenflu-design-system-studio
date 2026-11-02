import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Accordion, AccordionItem, Alert, Badge, Button, Card, DataState, Dialog, Tabs, TextArea, TextField, Toast, Tooltip } from '../src';
import { Section, StateDemos, TypographyDemos, ColorDemos, ButtonDemos, SelectionDemos, DrawerDemos, SelectDemos, ChipDemos, TableDemos, StepperDemos, MenuDemos, PopoverDemos, TreeDemos, SliderDemos, NumberDemos, DateDemos, ProgressDemos, LoadingDemos, AvatarDemos, ListDemos, FileDemos } from './demos';
import { DocumentShell, Overview, useDocumentRoute } from './shell';
import icons from './dist/icons.json';

const prototyped = new Set(['components/buttons', 'components/text-fields', 'components/selection', 'components/select', 'components/number-fields', 'components/date-picker', 'components/tree', 'components/tabs', 'components/progress', 'components/loading', 'components/file-upload', 'components/feedback', 'components/accordion', 'components/overlays', 'components/table', 'components/chips', 'components/list', 'components/slider', 'components/tooltip', 'components/dropdown-menu', 'components/popover', 'components/drawer', 'components/avatar', 'components/stepper', 'components/card', 'patterns/data-states', 'patterns/form/basic']);
['overview', 'foundations/colors', 'foundations/typography', 'foundations/sizes', 'foundations/icons', 'foundations/states'].forEach(route => prototyped.add(route));
const snippets: Record<string, string> = {
  'components/buttons':'<Button variant="outline">저장</Button>',
  'components/text-fields':'<TextField label="웹사이트" labelPosition="left" prefix="https://" defaultValue="idenflu.app" />',
  'components/selection':'<Checkbox label="이메일 알림" defaultChecked />',
  'components/select':'<MultiSelect label="참여 팀" options={options} searchable presentation="inline" clearable />',
  'components/number-fields':'<NumberField label="금액" defaultValue="12.5" decimals={1} step="0.5" />',
  'components/date-picker':'<DatePicker label="시작일" />\n<DateRangePicker label="기간" />',
  'components/tree':'<Tree label="메뉴" items={items} />',
  'components/tabs':'<Tabs label="설정" items={items} />',
  'components/progress':'<Progress value={60} max={100} aria-label="진행률" />\n<CircleProgress value={60} label="진행률" />',
  'components/loading':'<Spinner kind="dots" label="불러오는 중" />',
  'components/file-upload':'<FileUpload accept="image/png,image/jpeg,application/pdf" maxSizeBytes={5 * 1024 * 1024} onFilesChange={setFiles} />',
  'components/feedback':'<Badge variant="success">완료</Badge>\n<Alert><strong>안내</strong><p>내용을 확인하세요.</p></Alert>',
  'components/accordion':'<Accordion><AccordionItem title="제목">내용</AccordionItem></Accordion>',
  'components/overlays':'<Dialog open={open} onOpenChange={setOpen} aria-label="확인">내용</Dialog>',
  'components/table':'<Table><thead><tr><th>이름</th></tr></thead><tbody><tr><td>프로젝트</td></tr></tbody></Table>',
  'components/chips':'<Chip aria-pressed={selected} onClick={() => setSelected(!selected)}>디자인</Chip>',
  'components/list':'<List><ListItem>디자인 시스템</ListItem></List>',
  'components/slider':'<Slider aria-label="진행률" defaultValue={50} />',
  'components/tooltip':'<Tooltip content="도움말"><Button>정보</Button></Tooltip>',
  'components/dropdown-menu':'<DropdownMenu trigger="더보기" items={items} onSelect={handleSelect} />',
  'components/popover':'<Popover trigger="표시 설정" label="표시 설정">내용</Popover>',
  'components/drawer':'<Drawer open={open} onOpenChange={setOpen} aria-label="상세 정보">내용</Drawer>',
  'components/avatar':'<Avatar size="md" shape="circle" aria-label="김민수">김</Avatar>',
  'components/stepper':'<Stepper aria-label="프로젝트 생성" steps={["기본 정보", "확인"]} currentStep={0} />',
  'components/card':'<Card><h3>프로젝트</h3><p>상세 내용</p></Card>',
  'patterns/data-states':'<DataState load={loadProjects} matches={(item, query) => item.name.includes(query)} getKey={item => item.id} renderItem={item => item.name} />',
  'patterns/form/basic':'<TextField label="이름" name="name" required error={errors.name} />\n<TextField label="이메일" name="email" type="email" required error={errors.email} />',
};
const legacy = (route: string) => `../../../systems/idenflu-mono/index.html#/${route}`;
function CodeExample({ code }: { code:string }) {
  const [message, setMessage] = React.useState('');
  return <section className="react-studio-section"><h2>React 사용 예시</h2><p className="react-studio-description">패키지에서 컴포넌트를 가져와 사용합니다.</p><div className="react-studio-code"><pre><code>{code}</code></pre></div><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage('코드를 복사했습니다.'); } catch { setMessage('복사할 수 없습니다. 위 코드를 선택해 복사하세요.'); } }}>코드 복사</Button><span role="status"> {message}</span></section>;
}
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
    <div className="react-studio-field-wide"><TextArea label="설명" rows={3} maxLength={160} value={description} onChange={event => setDescription(event.target.value)} placeholder="프로젝트에 대해 간단히 적어주세요." helperText={`${description.length} / 160`} /></div>
  </div>;
}
function TextFields() { return <>
  <Section title="좌측 라벨"><TextField label="웹사이트" labelPosition="left" prefix="https://" defaultValue="idenflu.app" helperText="프로토콜을 제외한 주소를 입력해주세요." /><TextField label="이메일 계정" labelPosition="left" suffix="@idenflu.com" defaultValue="minsu" /></Section>
  <Section title="텍스트 정렬"><TextField label="왼쪽 정렬" alignment="start" defaultValue="프로젝트 이름" /><TextField label="가운데 정렬" alignment="center" defaultValue="A-1024" /><TextField label="오른쪽 정렬" alignment="end" defaultValue="12,500" /></Section>
  <Section title="프리픽스와 서픽스"><TextField label="프로젝트 주소" prefix="idenflu.app /" defaultValue="mono" /><TextField label="너비" type="number" suffix="px" defaultValue="100" /></Section>
  <Section title="아이콘과 입력 보조"><TextFieldHelpers /></Section>
</>; }
function OverlayExample() {
  const [open, setOpen] = React.useState(false), [toast, setToast] = React.useState(false);
  return <><Button variant="outline" onClick={() => setOpen(true)}>다이얼로그 열기</Button><Dialog open={open} onOpenChange={setOpen} aria-label="변경 확인"><h2>변경사항을 저장할까요?</h2><p>내용을 확인하고 닫을 수 있습니다.</p><Button onClick={() => setOpen(false)}>닫기</Button></Dialog><Button variant="outline" onClick={() => setToast(true)}>알림 표시</Button>{toast && <Toast onDismiss={() => setToast(false)}>변경사항이 저장되었습니다.</Toast>}</>;
}
function DataStatesExample() { const attempts = React.useRef(0); const load = React.useCallback(async () => { if (attempts.current++ === 0) throw new Error('조회 실패'); return ['디자인 시스템', '브랜드 가이드', '웹사이트 개선']; }, []); return <DataState load={load} matches={(item, query) => item.includes(query)} getKey={item => item} renderItem={item => item} searchLabel="프로젝트 검색" />; }
function BasicForm() {
  const [errors, setErrors] = React.useState({ name:'', email:'' });
  const [result, setResult] = React.useState('');
  const nameRef = React.useRef<HTMLInputElement>(null), emailRef = React.useRef<HTMLInputElement>(null);
  const required = (label:string) => <>{label} <span className="form-pattern-required">필수</span></>;
  const optional = (label:string) => <>{label} <span className="form-pattern-optional">선택</span></>;
  return <form className="form-pattern-form" noValidate onInput={() => setResult('')} onSubmit={event => {
    event.preventDefault();
    const name = nameRef.current!, email = emailRef.current!;
    const next = {name: name.value.trim() ? '' : '이름을 입력해주세요.', email: !email.value.trim() ? '이메일을 입력해주세요.' : email.validity.typeMismatch ? '올바른 이메일 주소를 입력해주세요.' : ''};
    setErrors(next); setResult(next.name || next.email ? '' : '기본 정보를 확인했습니다.');
    if (next.name) name.focus(); else if (next.email) email.focus();
  }} onReset={() => {setErrors({name:'',email:''});setResult('');}}>
    <div className="form-pattern-grid">
      <TextField ref={nameRef} label={required('이름')} name="name" autoComplete="name" required placeholder="이름을 입력해주세요" error={errors.name || undefined} onChange={event => {if (errors.name) setErrors({...errors, name:event.currentTarget.value.trim() ? '' : '이름을 입력해주세요.'});}} />
      <TextField ref={emailRef} label={required('이메일')} name="email" type="email" autoComplete="email" required placeholder="name@example.com" error={errors.email || undefined} onChange={event => {if (errors.email) setErrors({...errors, email:!event.currentTarget.value.trim() ? '이메일을 입력해주세요.' : event.currentTarget.validity.typeMismatch ? '올바른 이메일 주소를 입력해주세요.' : ''});}} />
      <TextField label={optional('회사명')} name="company" autoComplete="organization" placeholder="회사명을 입력해주세요" />
      <TextField label={optional('연락처')} name="phone" type="tel" autoComplete="tel-national" prefix="+82" placeholder="10-1234-5678" />
      <div className="form-pattern-field--wide"><TextField label={optional('웹사이트')} name="website" inputMode="url" prefix="https://" placeholder="example.com" /></div>
    </div><div className="form-pattern-actions"><Button type="submit">확인</Button><Button variant="outline" type="reset">초기화</Button></div><p role="status" className="form-pattern-result">{result}</p>
  </form>;
}
function FoundationIcons() {
  const [query, setQuery] = React.useState('');
  const visible = icons.filter(name => name.includes(query.trim().toLowerCase()));
  return <><TextField type="search" label="아이콘 검색" value={query} onChange={event => setQuery(event.target.value)} /><p role="status">{visible.length}개 아이콘</p><ul className="react-studio-icons">{visible.map(name => <li key={name}><span className="ui-icon" aria-hidden="true" style={{'--icon':`url('../../../systems/idenflu-mono/assets/icons/idenflu/${name}.svg')`} as React.CSSProperties} /><span>{name}</span></li>)}</ul></>;
}
function ComponentPage({ route }: { route:string }) {
  switch (route) {
    case 'overview': return <Overview />;
    case 'foundations/colors': return <ColorDemos />;
    case 'foundations/typography': return <TypographyDemos />;
    case 'foundations/sizes': return <Section title="공통 사이즈">{(['sm','md','lg'] as const).map(size => <div key={size} className="react-studio-size"><strong>{size.toUpperCase()}</strong><Button size={size}>새로 만들기</Button><TextField size={size} label={`${size.toUpperCase()} 입력`} defaultValue="idenflu mono" /></div>)}</Section>;
    case 'foundations/icons': return <Section title="아이콘 목록"><FoundationIcons /></Section>;
    case 'foundations/states': return <StateDemos />;
    case 'components/buttons': return <ButtonDemos />;
    case 'components/text-fields': return <TextFields />;
    case 'components/selection': return <SelectionDemos />;
    case 'components/select': return <SelectDemos />;
    case 'components/number-fields': return <NumberDemos />;
    case 'components/date-picker': return <DateDemos />;
    case 'components/tree': return <TreeDemos />;
    case 'components/tabs': return <Section title="탭"><Tabs label="설정" items={[{value:'general',label:'기본 정보',content:'워크스페이스 정보를 확인합니다.'},{value:'notifications',label:'알림',content:'알림 설정을 확인합니다.'},{value:'security',label:'보안',content:'보안 설정을 확인합니다.'}]} /></Section>;
    case 'components/progress': return <ProgressDemos />;
    case 'components/loading': return <LoadingDemos />;
    case 'components/file-upload': return <FileDemos />;
    case 'components/feedback': return <Section title="상태와 알림"><div><Badge>기본</Badge> <Badge variant="primary">진행 중</Badge> <Badge variant="success">완료</Badge> <Badge variant="warning">검토</Badge> <Badge variant="danger">오류</Badge></div><Alert><strong>안내</strong><p>프로젝트 정보를 확인해주세요.</p></Alert><Alert variant="success"><strong>완료</strong><p>변경사항이 저장되었습니다.</p></Alert></Section>;
    case 'components/accordion': return <Section title="아코디언"><Accordion><AccordionItem title="디자인 시스템이란?">일관된 제품 경험을 위한 공통 기준입니다.</AccordionItem><AccordionItem title="어떻게 사용하나요?">컴포넌트와 토큰을 함께 사용합니다.</AccordionItem></Accordion></Section>;
    case 'components/overlays': return <Section title="다이얼로그와 알림"><OverlayExample /></Section>;
    case 'components/table': return <TableDemos />;
    case 'components/chips': return <ChipDemos />;
    case 'components/list': return <ListDemos />;
    case 'components/slider': return <SliderDemos />;
    case 'components/tooltip': return <Section title="툴팁"><Tooltip content="프로젝트를 구분할 이름입니다."><Button variant="outline">프로젝트 이름</Button></Tooltip></Section>;
    case 'components/dropdown-menu': return <MenuDemos />;
    case 'components/popover': return <PopoverDemos />;
    case 'components/drawer': return <DrawerDemos />;
    case 'components/avatar': return <AvatarDemos />;
    case 'components/stepper': return <StepperDemos />;
    case 'components/card': return <><Section title="기본 카드"><div className="card-grid"><Card><span className="card-label">PROJECT</span><h3>디자인 시스템</h3><p>일관된 제품 경험을 위한 공통 기준을 만듭니다.</p><div className="card-footer"><Badge variant="primary">진행 중</Badge><span>최근 수정 · 오늘</span></div></Card><Card><span className="card-label">GUIDE</span><h3>브랜드 가이드</h3><p>브랜드의 시각 언어와 사용 원칙을 정리합니다.</p><div className="card-footer"><Badge>검토 중</Badge><span>최근 수정 · 어제</span></div></Card></div></Section><Section title="동작이 있는 카드"><Card className="card-action"><div><span className="card-label">RESOURCE</span><h3>컴포넌트 살펴보기</h3><p>자주 쓰는 UI 요소와 사용 예시를 확인합니다.</p></div><a className="button button--outline button-inline" href="#/components/buttons">컴포넌트 보기</a></Card></Section></>;
    case 'patterns/data-states': return <Section title="목록 상태"><DataStatesExample /></Section>;
    case 'patterns/form/basic': return <Section title="기본 정보 입력"><BasicForm /></Section>;
    default: return null;
  }
}
function App() {
  const current = useDocumentRoute();
  return <DocumentShell current={current}>
    {prototyped.has(current.route) ? <><ComponentPage key={`page-${current.route}`} route={current.route} />{snippets[current.route] && <CodeExample key={`code-${current.route}`} code={snippets[current.route]} />}{current.route !== 'overview' && <p className="react-studio-note">React 패키지 컴포넌트로 구현한 예시입니다. 기존 문서의 모든 변형과 동작을 대조하는 중입니다. <a href={legacy(current.route)}>기존 문서 보기</a></p>}</> : <p className="react-studio-note">이 문서는 React 전환 전입니다. <a href={legacy(current.route)}>기존 문서에서 확인</a></p>}
  </DocumentShell>;
}
createRoot(document.getElementById('root')!).render(<App />);
