import * as React from 'react';
import { Avatar, Button, Checkbox, Chip, CircleProgress, DatePicker, DateRangePicker, Drawer, DropdownMenu, FileUpload, Icon, MultiSelect, NumberField, Pagination, Popover, Progress, Radio, SearchSelect, Segmented, SegmentedProgress, Select, SelectableList, SelectableListItem, Slider, Slides, Spinner, Stepper, Switch, Table, TableContainer, TextArea, TextField, Tree } from '../src';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="react-studio-section"><h2>{title}</h2><div className="react-studio-demo">{children}</div></section>;
}
const options = [{value:'design',label:'디자인'}, {value:'development',label:'개발'}, {value:'marketing',label:'마케팅'}, {value:'operations',label:'운영',disabled:true}];
const sizes = ['sm', 'md', 'lg'] as const;

const baseColors = [['Primary','--primary'], ['Text Primary','--text'], ['Text Secondary','--text-secondary'], ['Surface','--surface'], ['Border','--border'], ['Control Primary','--primary-control'], ['Canvas','--canvas']];
const semanticColors = [['Danger','--danger'], ['Success','--success'], ['Warning','--warning'], ['Info','--info']];
export function ColorDemos() {
  const readColors = () => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return {theme:root.dataset.theme === 'dark' ? 'Dark' : 'Light', values:Object.fromEntries([...baseColors, ...semanticColors].map(([, token]) => [token, styles.getPropertyValue(token).trim().toUpperCase()]))};
  };
  const [colors, setColors] = React.useState(readColors);
  React.useEffect(() => {
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, {attributes:true, attributeFilter:['data-theme','style']});
    setColors(readColors());
    return () => observer.disconnect();
  }, []);
  const swatches = (items:string[][]) => <div className="react-studio-swatches">{items.map(([label, token]) => <div key={token} data-color-token={token}><span className="react-studio-swatch" style={{background:`var(${token})`}} aria-hidden="true" /><strong>{label}</strong><code className="token-value">{colors.values[token]}</code><small>{token}</small></div>)}</div>;
  return <><Section title="기본 색상"><p className="component-helper">현재 테마: {colors.theme} · 테마를 바꾸면 색상과 코드가 함께 변경됩니다.</p>{swatches(baseColors)}</Section><Section title="의미 색상">{swatches(semanticColors)}</Section></>;
}

export function StateDemos() {
  return <><Section title="버튼 상태"><div className="button-grid">{[['기본',''],['호버','is-hovered'],['눌림','is-pressed'],['포커스','is-focused']].map(([label, state]) => <div className="state-example" key={label}><span className="state-caption">{label}</span><Button className={`demo-button ${state}`} aria-label={`${label} 상태 저장 버튼`}>저장</Button></div>)}<div className="state-example"><span className="state-caption">비활성</span><Button disabled>저장</Button></div></div></Section>
    <Section title="입력 상태"><TextField label="기본" defaultValue="김민수" /><TextField label="포커스" defaultValue="김민수" className="is-focused" /><TextField label="비활성" placeholder="이메일 주소" disabled /><TextField label="오류" type="email" defaultValue="minsu@" error="올바른 이메일 주소를 입력해주세요." /><TextField label="읽기 전용" defaultValue="확인 가능" readOnly /></Section></>;
}

export function TypographyDemos() {
  return <><Section title="Typeface"><p className="type-specimen" aria-hidden="true">Aa</p><p className="type-name">Pretendard</p><p className="type-description">간결한 인터페이스의 기준</p><dl className="type-scale"><div><dt>본문</dt><dd>14 / 22</dd></div><div><dt>보조</dt><dd>12 / 18</dd></div><div><dt>제목</dt><dd>24 / 32</dd></div></dl></Section>
    <Section title="Type scale"><p className="component-helper">수치는 기본 설정 기준이며 화면 조정은 아래 미리보기에 즉시 반영됩니다.</p><div><span className="sample-label">Heading · 32 / 40 · Semibold</span><p className="sample-heading">Form follows function.</p></div><div><span className="sample-label">Section · 24 / 32 · Semibold</span><p className="sample-section">명확한 구조, 일관된 경험.</p></div><div><span className="sample-label">Body · 14 / 22 · Regular</span><p>필요한 정보가 자연스럽게 읽히도록 간결한 문장과 여유 있는 행간을 사용합니다.</p></div><div><span className="sample-label">Caption · 12 / 18 · Regular</span><p className="sample-caption">보조 설명과 상태 정보를 전달하는 작은 텍스트입니다.</p></div></Section></>;
}

export function SelectionDemos() {
  const [selected, setSelected] = React.useState(['email']);
  const choices = [{value:'email', label:'이메일 알림'}, {value:'push', label:'푸시 알림'}];
  return <Section title="선택 컨트롤"><div className="selection-grid"><fieldset className="choice-group"><legend>체크박스</legend>
    <Checkbox label="전체 선택" checked={selected.length === choices.length} indeterminate={selected.length > 0 && selected.length < choices.length} onChange={event => setSelected(event.target.checked ? choices.map(item => item.value) : [])} />
    {choices.map(item => <Checkbox key={item.value} label={item.label} checked={selected.includes(item.value)} onChange={event => setSelected(current => event.target.checked ? [...current,item.value] : current.filter(value => value !== item.value))} />)}<Checkbox label="비활성 옵션" disabled />
    </fieldset><fieldset className="choice-group"><legend>라디오</legend><Radio label="개인" name="plan" defaultChecked /><Radio label="팀" name="plan" /><Radio label="조직" name="plan" /><Radio label="비활성" name="plan" disabled /></fieldset>
    <fieldset className="choice-group"><legend>스위치</legend><Switch label="알림" defaultChecked /><Switch label="비활성 스위치" disabled /></fieldset></div></Section>;
}

export function DrawerDemos() {
  const initial = {name:'디자인 시스템', note:'제품 전반의 일관된 경험을 위한 가이드입니다.'};
  const [saved, setSaved] = React.useState(initial), [draft, setDraft] = React.useState(initial);
  const [open, setOpen] = React.useState(false), [error, setError] = React.useState(''), [feedback, setFeedback] = React.useState('변경 사항이 없습니다.');
  const nameRef = React.useRef<HTMLInputElement>(null);
  return <Section title="사이드 패널"><p>확인하거나 수정할 내용이 많을 때 사용합니다.</p><Button variant="outline" onClick={() => { setDraft(saved); setError(''); setOpen(true); }}>상세 정보 열기</Button><p role="status" className="component-helper">{feedback}</p>
    <Drawer open={open} onOpenChange={setOpen} aria-labelledby="studio-drawer-title" aria-describedby="studio-drawer-description">
      <div className="drawer-head"><div><span className="drawer-kicker">PROJECT DETAILS</span><h2 id="studio-drawer-title">프로젝트 설정</h2></div><button className="icon-button" type="button" aria-label="패널 닫기" onClick={() => setOpen(false)}><Icon name="close" /></button></div>
      <p id="studio-drawer-description">프로젝트의 기본 정보를 확인하고 수정하세요.</p><form noValidate onSubmit={event => { event.preventDefault(); const name = draft.name.trim(); if (!name) { setError('프로젝트 이름을 입력해주세요.'); nameRef.current?.focus(); return; } setSaved({name, note:draft.note}); setFeedback(`${name} 설정을 저장했습니다.`); setOpen(false); }}>
        <TextField ref={nameRef} label="프로젝트 이름" required maxLength={60} value={draft.name} error={error || undefined} onChange={event => { setDraft({...draft,name:event.target.value}); setError(''); }} autoFocus />
        <TextArea label="설명" rows={4} value={draft.note} onChange={event => setDraft({...draft,note:event.target.value})} />
        <div className="drawer-actions"><Button variant="outline" onClick={() => setOpen(false)}>취소</Button><Button type="submit">저장</Button></div></form>
    </Drawer></Section>;
}

export function ButtonDemos() {
  const [feedback, setFeedback] = React.useState('');
  return <><Section title="기본 버튼"><div className="react-studio-row">{(['primary','secondary','outline','ghost','danger'] as const).map(variant => <Button key={variant} variant={variant} onClick={() => setFeedback(`${variant} 버튼을 눌렀습니다.`)}>{variant}</Button>)}<Button disabled>비활성</Button></div></Section>
    <Section title="With icons"><div className="react-studio-row"><Button onClick={() => setFeedback('새로 만들기를 선택했습니다.')}><Icon name="plus" /> 새로 만들기</Button><Button variant="outline" onClick={() => setFeedback('다운로드를 선택했습니다.')}><Icon name="download" /> 다운로드</Button></div></Section>
    <Section title="Icon only"><div className="react-studio-row"><Button variant="outline" iconOnly aria-label="추가" onClick={() => setFeedback('추가를 선택했습니다.')}><Icon name="plus" /></Button><Button variant="outline" iconOnly aria-label="삭제" onClick={() => setFeedback('삭제를 선택했습니다.')}><Icon name="trash" /></Button></div></Section>
    <Section title="Button groups"><Segmented label="보기 방식" options={[{value:'list',label:'목록'}, {value:'grid',label:'격자'}]} onValueChange={value => setFeedback(`${value === 'list' ? '목록' : '격자'} 보기를 선택했습니다.`)} /><div className="button-group"><Button variant="outline" onClick={() => setFeedback('이전 동작을 선택했습니다.')}>이전</Button><Button variant="outline" onClick={() => setFeedback('다음 동작을 선택했습니다.')}>다음</Button></div></Section><p role="status" className="component-helper">{feedback}</p></>;
}

export function SelectDemos() {
  return <><Section title="기본 선택"><Select label="담당 팀" options={options} defaultValue="design" /><Select label="비활성" options={options} disabled /></Section>
    <Section title="검색 선택"><SearchSelect label="팀 검색" options={options} placeholder="팀 검색" /></Section>
    <Section title="복수 선택"><MultiSelect label="여러 팀" options={options} defaultValue={['development']} searchable clearable /><MultiSelect label="참여 팀" options={options} defaultValue={['design']} searchable presentation="inline" clearable /></Section>
    <Section title="사이즈"><div className="react-studio-size-grid">{sizes.map(size => <Select key={size} size={size} label={`${size.toUpperCase()} 선택`} options={options} defaultValue="design" />)}</div></Section></>;
}

export function ChipDemos() {
  const [selected, setSelected] = React.useState<string[]>(['디자인']);
  const [removable, setRemovable] = React.useState(['프로젝트', '브랜드', '문서']);
  return <><Section title="사이즈"><div className="react-studio-row">{sizes.map(size => <Chip key={size} size={size}>{size.toUpperCase()}</Chip>)}</div></Section>
    <Section title="선택 칩"><div className="react-studio-row">{['디자인','개발','마케팅'].map(name => <Chip key={name} aria-pressed={selected.includes(name)} onClick={() => setSelected(current => current.includes(name) ? current.filter(item => item !== name) : [...current,name])}>{name}</Chip>)}</div><p role="status" className="component-helper">{selected.length ? `선택: ${selected.join(', ')}` : '선택한 항목이 없습니다.'}</p></Section>
    <Section title="삭제 가능한 칩"><div className="react-studio-row">{removable.map(name => <Chip key={name} aria-label={`${name} 제거`} onClick={() => setRemovable(current => current.filter(item => item !== name))}>{name} <Icon name="close" /></Chip>)}</div><Button variant="outline" onClick={() => setRemovable(['프로젝트','브랜드','문서'])}>초기화</Button></Section></>;
}

const projects = Array.from({length:12}, (_, index) => ({name:['디자인 시스템','브랜드 가이드','웹사이트 개선','모바일 앱'][index % 4] + (index >= 4 ? ` ${Math.floor(index / 4) + 1}` : ''), team:index % 2 ? '개발' : '디자인', status:index % 3 ? '검토 중' : '진행 중'}));
export function TableDemos() {
  const [page, setPage] = React.useState(1); const pageSize = 4;
  const visible = projects.slice((page - 1) * pageSize, page * pageSize);
  return <Section title="테이블과 페이지"><TableContainer label="프로젝트 목록"><Table><thead><tr><th scope="col">프로젝트</th><th scope="col">담당 팀</th><th scope="col">상태</th></tr></thead><tbody>{visible.map(row => <tr key={row.name}><td>{row.name}</td><td>{row.team}</td><td>{row.status}</td></tr>)}</tbody></Table></TableContainer><p role="status" className="component-helper">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, projects.length)} / {projects.length}개 프로젝트</p><Pagination page={page} pageCount={Math.ceil(projects.length / pageSize)} onPageChange={setPage} /></Section>;
}

export function StepperDemos() {
  const [current, setCurrent] = React.useState(0); const steps = ['기본 정보','팀원 초대','확인'];
  return <Section title="단계 진행"><Stepper aria-label="프로젝트 생성 단계" steps={steps} currentStep={current} /><div className="step-panel"><strong>{steps[current]}</strong><p>{current === 0 ? '프로젝트 정보를 입력합니다.' : current === 1 ? '함께 작업할 팀원을 초대합니다.' : '입력한 내용을 확인합니다.'}</p></div><div className="react-studio-row"><Button variant="outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>이전</Button><Button disabled={current === steps.length - 1} onClick={() => setCurrent(current + 1)}>다음</Button></div></Section>;
}

export function MenuDemos() {
  const [feedback, setFeedback] = React.useState('');
  return <Section title="작업 메뉴"><DropdownMenu trigger="더보기" label="작업 메뉴" items={[{value:'수정',label:'수정'},{value:'복사',label:'복사'},{value:'삭제',label:'삭제'}]} onSelect={value => setFeedback(`${value} 동작을 선택했습니다.`)} /><p role="status" className="component-helper">{feedback}</p></Section>;
}
export function PopoverDemos() {
  const [open, setOpen] = React.useState(false), [description, setDescription] = React.useState(true), [status, setStatus] = React.useState(true), [message, setMessage] = React.useState('설명과 상태 표시 중');
  return <Section title="설정 팝오버"><Popover trigger="표시 설정" label="표시 설정" open={open} onOpenChange={setOpen}><strong>표시 설정</strong><p>목록에서 볼 정보를 선택하세요.</p><Checkbox label="설명" checked={description} onChange={event => setDescription(event.target.checked)} /><Checkbox label="상태" checked={status} onChange={event => setStatus(event.target.checked)} /><Button onClick={() => { const labels = [description && '설명', status && '상태'].filter(Boolean); setMessage(labels.length ? `${labels.join('과 ')} 표시 중` : '표시할 추가 정보가 없습니다.'); setOpen(false); }}>적용</Button></Popover><p role="status" className="component-helper">{message}</p></Section>;
}

export function TreeDemos() {
  const [value, setValue] = React.useState('디자인 시스템');
  return <Section title="계층 탐색"><Tree label="프로젝트 파일" defaultExpanded={['project','design']} defaultValue="system" onValueChange={value => setValue(({system:'디자인 시스템',brand:'브랜드 가이드',components:'컴포넌트',docs:'문서',about:'프로젝트 소개'} as Record<string,string>)[value] || value)} items={[{value:'project',label:'프로젝트',children:[{value:'design',label:'디자인',children:[{value:'system',label:'디자인 시스템'},{value:'brand',label:'브랜드 가이드'}]},{value:'development',label:'개발',children:[{value:'components',label:'컴포넌트'},{value:'docs',label:'문서'}]},{value:'about',label:'프로젝트 소개'}]}]} /><p role="status" className="component-helper">선택: {value}</p></Section>;
}

export function SliderDemos() {
  const [value, setValue] = React.useState(50);
  return <><Section title="슬라이더"><label htmlFor="studio-slider">진행률 <output>{value}%</output></label><Slider id="studio-slider" value={value} onValueChange={setValue} /></Section><Section title="사이즈">{sizes.map(size => <div key={size} data-size={size}><label htmlFor={`studio-slider-${size}`}>{size.toUpperCase()}</label><Slider id={`studio-slider-${size}`} defaultValue={50} /></div>)}</Section><Section title="슬라이드"><Slides label="프로젝트 안내" slides={[<p>프로젝트를 시작합니다.</p>,<p>팀원을 초대합니다.</p>,<p>설정을 확인합니다.</p>]} /></Section></>;
}

export function NumberDemos() {
  const [selectAll, setSelectAll] = React.useState(true);
  return <><Section title="입력 형식"><div className="react-studio-field-grid"><NumberField label="정수만 입력" defaultValue="12" min="0" max="100" unit="개" /><NumberField label="소수 입력" defaultValue="12.5" decimals={2} step="0.01" unit="시간" /></div></Section>
    <Section title="천 단위 구분"><NumberField label="금액" defaultValue="12500" grouping step="1000" unit="원" /></Section>
    <Section title="증감 단위"><div className="react-studio-field-grid"><NumberField label="1 단위" defaultValue="8" step="1" /><NumberField label="10 단위" defaultValue="20" step="10" /><NumberField label="0.1 단위" defaultValue="1.2" decimals={1} step="0.1" /><NumberField label="0.5 단위" defaultValue="2.5" decimals={1} step="0.5" /></div></Section>
    <Section title="포커스 동작"><NumberField label="기본 동작" defaultValue="12500" grouping /><NumberField label="전체 선택 옵션" defaultValue="12500" grouping selectOnFocus={selectAll} /><Switch label="포커스 시 전체 선택" checked={selectAll} onChange={event => setSelectAll(event.target.checked)} /></Section>
    <Section title="범위와 상태"><div className="react-studio-field-grid"><NumberField label="최소·최대 범위" defaultValue="5" min="0" max="5" unit="명" /><NumberField label="읽기 전용" defaultValue="12.5" decimals={1} readOnly /><NumberField label="비활성" defaultValue="0" disabled /></div></Section>
    <Section title="사이즈"><div className="react-studio-size-grid">{sizes.map(size => <NumberField key={size} size={size} label={`${size.toUpperCase()} 숫자 입력`} defaultValue="10" unit="개" />)}</div></Section></>;
}

export function DateDemos() {
  return <><Section title="날짜 선택"><DatePicker label="날짜" helperText="YYYY-MM-DD 또는 숫자 8자리로 입력해주세요." /><DatePicker label="읽기 전용 날짜" defaultValue="2026-11-02" readOnly /><DatePicker label="비활성 날짜" disabled /></Section>
    <Section title="기간 선택"><DateRangePicker label="기간" helperText="시작일과 종료일을 선택하세요." /></Section>
    <Section title="사이즈"><div className="react-studio-size-grid">{sizes.map(size => <DatePicker key={size} label={`${size.toUpperCase()} 날짜`} size={size} />)}</div></Section></>;
}

export function ProgressDemos() {
  const [value, setValue] = React.useState(60);
  return <><Section title="진행 상태"><Progress value={value} max={100} aria-label="진행률" /><label htmlFor="progress-example">진행률 <output>{value}%</output></label><Slider id="progress-example" value={value} onValueChange={setValue} /></Section>
    <Section title="완료 상태"><Progress value={100} max={100} variant="success" aria-label="완료" /></Section>
    <Section title="두께">{(['thin','normal','thick'] as const).map(thickness => <Progress key={thickness} thickness={thickness} value={60} max={100} aria-label={`${thickness} 진행률`} />)}</Section>
    <Section title="색상과 상태">{(['primary','success','warning','danger'] as const).map(variant => <Progress key={variant} variant={variant} value={60} max={100} aria-label={`${variant} 진행률`} />)}</Section>
    <Section title="분할형"><SegmentedProgress value={3} total={5} label="단계 진행률" /></Section>
    <Section title="원형"><div className="react-studio-row"><CircleProgress value={60} label="진행률" /><CircleProgress value={100} label="완료" variant="success" /></div></Section></>;
}

export function LoadingDemos() {
  return <><Section title="스켈레톤"><div className="skeleton-card" role="status" aria-label="콘텐츠를 불러오는 중"><span className="skeleton skeleton-avatar" /><div><span className="skeleton skeleton-title" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line skeleton-line--short" /></div></div></Section>
    <Section title="스피너"><div className="react-studio-row">{(['ring','dual','dots','bars'] as const).map(kind => <div key={kind}><Spinner kind={kind} label={`${kind} 로딩 중`} /><p>{kind}</p></div>)}</div></Section>
    <Section title="사이즈"><div className="react-studio-row">{(['small','medium','large'] as const).map(size => <Spinner key={size} size={size} label={`${size} 로딩 중`} />)}</div></Section>
    <Section title="색상과 사용 예시"><div className="react-studio-row"><Spinner variant="primary" /><Spinner variant="neutral" /><Button disabled><Spinner size="small" variant="inverse" /> 불러오는 중</Button></div></Section></>;
}

export function AvatarDemos() {
  return <><Section title="사각형 아바타"><div className="react-studio-row">{sizes.map(size => <Avatar key={size} size={size} role="img" aria-label={`${size} 사용자`}>김</Avatar>)}</div></Section>
    <Section title="원형 아바타"><div className="react-studio-row">{sizes.map(size => <Avatar key={size} size={size} shape="circle" role="img" aria-label={`${size} 사용자`}>이</Avatar>)}</div></Section>
    <Section title="아바타 그룹"><div className="avatar-group" role="group" aria-label="참여자 3명">{['김','이','박'].map(name => <Avatar key={name} size="md" shape="circle" role="img" aria-label={`${name} 사용자`}>{name}</Avatar>)}</div></Section></>;
}

export function ListDemos() {
  const [selected, setSelected] = React.useState('디자인 시스템');
  return <><Section title="기본 목록"><ul className="simple-list"><li>디자인 시스템</li><li>브랜드 가이드</li><li>웹사이트 개선</li></ul></Section>
    <Section title="선택 목록"><SelectableList aria-label="프로젝트 선택">{['디자인 시스템','브랜드 가이드','웹사이트 개선'].map(name => <SelectableListItem key={name} aria-pressed={selected === name} onClick={() => setSelected(name)}>{name}</SelectableListItem>)}</SelectableList><p role="status" className="component-helper">선택: {selected}</p></Section></>;
}

export function FileDemos() {
  return <Section title="파일 선택"><p>PNG, JPG 또는 PDF 파일을 최대 5MB까지 선택할 수 있습니다.</p><FileUpload accept="image/png,image/jpeg,application/pdf" maxSizeBytes={5 * 1024 * 1024} aria-label="첨부 파일" /></Section>;
}
