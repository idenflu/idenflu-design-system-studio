import * as React from 'react';
import { Button, Checkbox, DropdownMenu, Icon, IconButton, MultiSelect, Popover, SearchSelect, Select, TextField } from '../src';
import { Section } from './demo-layout';
import { HiddenLabelReference, IconButtonReference, PopupAlignReference } from './convenience-api-reference';

const teams = [
  { value: 'design', label: '디자인' },
  { value: 'development', label: '개발' },
  { value: 'marketing', label: '마케팅' },
];
const statuses = [
  { value: 'all', label: '전체 상태' },
  { value: 'active', label: '진행 중' },
  { value: 'done', label: '완료' },
];
const projects = [
  { name: '디자인 시스템', status: 'active', team: 'design' },
  { name: '웹사이트 개편', status: 'active', team: 'development' },
  { name: '브랜드 가이드', status: 'done', team: 'design' },
  { name: '제품 소개', status: 'done', team: 'marketing' },
];

function HiddenLabelToolbar() {
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [selectedTeams, setSelectedTeams] = React.useState<string[]>([]);
  const filtered = projects.filter(project => project.name.includes(query.trim())
    && (status === 'all' || project.status === status)
    && (!selectedTeams.length || selectedTeams.includes(project.team)));

  return <div className="react-studio-stack">
    <div role="group" aria-label="프로젝트 필터" className="studio-convenience-toolbar">
      <TextField label="프로젝트 검색" hideLabel type="search" placeholder="프로젝트 검색" value={query} onChange={event => setQuery(event.target.value)} prefix={<Icon name="search" />} prefixDecorative />
      <Select label="프로젝트 상태" hideLabel options={statuses} value={status} onValueChange={setStatus} />
      <MultiSelect label="참여 팀" hideLabel options={teams} placeholder="참여 팀" value={selectedTeams} onValueChange={setSelectedTeams} />
    </div>
    <p role="status" className="component-helper">{filtered.length}개 프로젝트{filtered.length ? ` · ${filtered.map(project => project.name).join(', ')}` : ' · 조건에 맞는 프로젝트가 없습니다.'}</p>
  </div>;
}

export function HiddenLabelDemos({ kind = 'text-field' }: { kind?: 'text-field' | 'select' }) {
  return <>
    <Section id={`${kind}-hide-label-toolbar`} title="라벨을 숨긴 검색과 필터" description="검색과 필터를 한 줄에 배치합니다. 화면의 라벨 공간은 제거하고 입력의 접근 가능한 이름은 유지합니다.">
      <HiddenLabelToolbar />
    </Section>
    <Section id={`${kind}-hide-label-compare`} title="보이는 라벨과 숨김 라벨" description="같은 label을 유지한 채 hideLabel만 바꿉니다. Tab으로 이동해도 입력 이름과 선택 동작은 같습니다.">
      {kind === 'text-field' ? <div className="react-studio-field-grid">
        <div className="react-studio-stack"><h3 className="react-studio-example-title">기본 라벨</h3><TextField label="프로젝트 검색" type="search" placeholder="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative /></div>
        <div className="react-studio-stack"><h3 className="react-studio-example-title">hideLabel</h3><TextField label="프로젝트 검색" hideLabel type="search" placeholder="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative /></div>
      </div> : <div className="react-studio-field-grid">
        <div className="react-studio-stack"><h3 className="react-studio-example-title">기본 라벨</h3><Select label="담당 팀" options={teams} defaultValue="design" /><SearchSelect label="팀 검색" options={teams} placeholder="팀 검색" /><MultiSelect label="참여 팀" options={teams} defaultValue={['design']} clearable /></div>
        <div className="react-studio-stack"><h3 className="react-studio-example-title">hideLabel</h3><Select label="담당 팀" hideLabel options={teams} defaultValue="design" /><SearchSelect label="팀 검색" hideLabel options={teams} placeholder="팀 검색" /><MultiSelect label="참여 팀" hideLabel options={teams} defaultValue={['design']} clearable /></div>
      </div>}
    </Section>
    <HiddenLabelReference kind={kind} />
  </>;
}

export function IconButtonDemos() {
  const [bookmarked, setBookmarked] = React.useState(false);
  const [details, setDetails] = React.useState(false);
  const [feedback, setFeedback] = React.useState('아이콘에 포인터를 올리거나 Tab으로 이동해 툴팁을 확인하세요.');
  const bookmarkRef = React.useRef<HTMLButtonElement>(null);
  const detailsId = React.useId();

  return <>
    <Section id="icon-button-sizes" title="아이콘 전용 버튼" description="기본 스타일은 ghost입니다. label은 버튼의 이름과 기본 툴팁으로 함께 사용합니다.">
      <div className="studio-convenience-icon-sizes">{(['sm', 'md', 'lg'] as const).map(size => <div key={size} className="studio-convenience-icon-sample">
        <IconButton label={`${size.toUpperCase()} 설정`} size={size} onClick={() => setFeedback(`${size.toUpperCase()} 설정 버튼을 눌렀습니다.`)}><Icon name="settings" /></IconButton>
        <span className="react-studio-caption">{size.toUpperCase()}</span>
      </div>)}</div>
      <div className="react-studio-row">{(['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map(variant => <IconButton key={variant} variant={variant} label={`${variant} 설정`} onClick={() => setFeedback(`${variant} 스타일 버튼을 눌렀습니다.`)}><Icon name="settings" /></IconButton>)}</div>
      <p role="status" className="component-helper">{feedback}</p>
    </Section>
    <Section id="icon-button-states" title="툴팁과 선택 상태" description="북마크를 전환하거나 툴팁을 바꾸고 제거합니다. 비활성 버튼과 ref로 포커스를 이동하는 동작도 확인할 수 있습니다.">
      <div className="react-studio-row">
        <IconButton ref={bookmarkRef} label="북마크" variant="outline" aria-pressed={bookmarked} onClick={() => setBookmarked(value => !value)}><Icon name={bookmarked ? 'bookmark-fill' : 'bookmark'} /></IconButton>
        <IconButton label="북마크 초기화" tooltip={<span>저장한 북마크를 해제합니다.</span>} onClick={() => setBookmarked(false)}><Icon name="refresh" /></IconButton>
        <IconButton label="자세히 보기" tooltip={false} aria-expanded={details} aria-controls={detailsId} onClick={() => setDetails(value => !value)}><Icon name="info" /></IconButton>
        <IconButton label="삭제할 항목 없음" disabled><Icon name="trash" /></IconButton>
        <Button variant="outline" onClick={() => bookmarkRef.current?.focus()}>북마크로 포커스</Button>
      </div>
      <p role="status" className="component-helper">{bookmarked ? '북마크 저장됨' : '북마크 해제됨'} · 자세히 보기 버튼은 tooltip=false입니다.</p>
      <p id={detailsId} hidden={!details} className="component-helper">북마크로 자주 찾는 항목을 저장합니다. 아이콘 모양과 aria-pressed를 함께 갱신합니다.</p>
    </Section>
    <IconButtonReference />
  </>;
}

const alignments = ['start', 'center', 'end'] as const;
type PopupAlignment = typeof alignments[number];

function AlignedPopover({ align }: { align: PopupAlignment }) {
  const [open, setOpen] = React.useState(false);
  const [showDescription, setShowDescription] = React.useState(true);

  return <Popover trigger={align} label={`${align} 표시 설정`} align={align} open={open} onOpenChange={setOpen}>
    <div className="react-studio-popover-body">
      <div className="react-studio-popover-heading"><strong>표시 설정</strong><p>트리거의 {align === 'start' ? '시작점' : align === 'center' ? '가운데' : '끝점'}에 맞춥니다.</p></div>
      <Checkbox label="설명 표시" checked={showDescription} onChange={event => setShowDescription(event.target.checked)} />
      <Button onClick={() => setOpen(false)}>적용</Button>
    </div>
  </Popover>;
}

export function PopupAlignDemos({ kind = 'popover' }: { kind?: 'popover' | 'menu' }) {
  const [rtl, setRtl] = React.useState(false);
  const [view, setView] = React.useState('목록 보기');
  const menuItems = [
    { value: '목록 보기', label: '목록 보기', icon: <Icon name="list" /> },
    { value: '격자 보기', label: '격자 보기', icon: <Icon name="grid" /> },
    { value: '캘린더 보기', label: '캘린더 보기', icon: <Icon name="calendar" /> },
  ];

  return <>
    <Section id={`${kind}-align-demo`} title="트리거 기준 정렬" description="세 버튼을 각각 열어 패널의 시작점·가운데·끝점을 비교합니다. RTL을 켜면 start와 end가 글의 방향에 맞춰 바뀝니다.">
      <Checkbox label="RTL 방향으로 확인" checked={rtl} onChange={event => setRtl(event.target.checked)} />
      <div className="studio-convenience-align-grid" dir={rtl ? 'rtl' : 'ltr'}>{alignments.map(align => <div key={align} className="studio-convenience-align-example">
        <h3 className="react-studio-example-title"><code>align="{align}"</code></h3>
        {kind === 'popover' ? <AlignedPopover align={align} /> : <DropdownMenu trigger={align} label={`${align} 보기 방식`} align={align} items={menuItems} onSelect={setView} />}
      </div>)}</div>
      {kind === 'menu' && <p role="status" className="component-helper">선택한 보기: {view}</p>}
    </Section>
    <PopupAlignReference kind={kind} />
  </>;
}
