import * as React from 'react';
import { Grid, Button, Checkbox, DropdownMenu, DropdownMenuItem, Icon, MultiSelect, Popover, SearchSelect, Select, TextField } from '@idenflu/mono-react';
import { Section } from './demo-layout';
import { HiddenLabelReference, PopupAlignReference } from './convenience-api-reference';

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
      {kind === 'text-field' ? <Grid columns={{base:1,sm:2}} rowGap={6} columnGap={8} alignItems="start" className="react-studio-field-grid">
        <div className="react-studio-stack"><h3 className="react-studio-example-title">기본 라벨</h3><TextField label="프로젝트 검색" type="search" placeholder="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative /></div>
        <div className="react-studio-stack"><h3 className="react-studio-example-title">hideLabel</h3><TextField label="프로젝트 검색" hideLabel type="search" placeholder="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative /></div>
      </Grid> : <Grid columns={{base:1,sm:2}} rowGap={6} columnGap={8} alignItems="start" className="react-studio-field-grid">
        <div className="react-studio-stack"><h3 className="react-studio-example-title">기본 라벨</h3><Select label="담당 팀" options={teams} defaultValue="design" /><SearchSelect label="팀 검색" options={teams} placeholder="팀 검색" /><MultiSelect label="참여 팀" options={teams} defaultValue={['design']} clearable /></div>
        <div className="react-studio-stack"><h3 className="react-studio-example-title">hideLabel</h3><Select label="담당 팀" hideLabel options={teams} defaultValue="design" /><SearchSelect label="팀 검색" hideLabel options={teams} placeholder="팀 검색" /><MultiSelect label="참여 팀" hideLabel options={teams} defaultValue={['design']} clearable /></div>
      </Grid>}
    </Section>
    <HiddenLabelReference kind={kind} />
  </>;
}

const alignments = ['start', 'center', 'end'] as const;
type PopupAlignment = typeof alignments[number];

function AlignedPopover({ align }: { align: PopupAlignment }) {
  const [open, setOpen] = React.useState(false);
  const [showDescription, setShowDescription] = React.useState(true);

  return <Popover trigger={<Button variant="outline">{align}</Button>} label={`${align} 표시 설정`} align={align} open={open} onOpenChange={setOpen}>
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
        {kind === 'popover' ? <AlignedPopover align={align} /> : <DropdownMenu trigger={<Button variant="outline">{align}</Button>} label={`${align} 보기 방식`} align={align} onSelect={setView}>{menuItems.map(item => <DropdownMenuItem key={item.value} value={item.value} icon={item.icon}>{item.label}</DropdownMenuItem>)}</DropdownMenu>}
      </div>)}</div>
      {kind === 'menu' && <p role="status" className="component-helper">선택한 보기: {view}</p>}
    </Section>
    <PopupAlignReference kind={kind} />
  </>;
}
