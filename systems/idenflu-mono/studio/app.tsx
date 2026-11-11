import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Icon, Segmented, Tabs, TextField, type IconName } from '@idenflu/mono-react';
import * as generatedIcons from '@idenflu/mono-react/icons';
import { Section } from './demo-layout';
import { ColorDemos } from './color-demos';
import { TextFields, SelectDemos, NumberDemos, DateDemos } from './form-demos';
import { DateTimeDemos } from './datetime-demos';
import { TimePickerDemos, timePickerUsage } from './time-picker-demos';
import { DateTimeUsageExamples } from './datetime-usage-examples';
import { IconDemos, TypographyDemos, SizeDemos, StateDemos } from './foundation-demos';
import { TabsDemos, FeedbackDemos, AccordionDemos, OverlayDemos, TooltipDemos, CardDemos } from './content-demos';
import { ButtonDemos, SelectionDemos, TreeDemos, ChipDemos, TableDemos, ListDemos, StepperDemos, MenuDemos, PopoverDemos, DrawerDemos } from './structure-demos';
import { SliderDemos, ProgressDemos, LoadingDemos, AvatarDemos, FileDemos } from './media-demos';
import { DocumentShell, Overview, notFoundRouteId, useDocumentRoute } from './shell';
import { DocumentNotFound, LayoutNotFound } from './not-found';
import { DividerDemos } from './divider-demos';
import { GridDemos, gridUsage } from './grid-demos';
import { PageHeaderDemos } from './page-header-demos';
import { patternPages, patternSnippets } from './patterns';
import { componentUsage } from './component-usage';
import completeExamples from './dist/complete-examples.json';
import { DataGridDemos, dataGridUsage } from './data-grid-demos';
import { SidebarLayoutSample } from './layout-samples';
import releasedIcons from './icon-names-0.4.1.json';
import spriteIcons from './dist/sprite-icons.json';

const componentIcons = spriteIcons.map(name => {
  const component = name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('') + 'Icon';
  return { name, component, IconComponent: generatedIcons[component as keyof typeof generatedIcons] };
});
type IconVersion = '0.4.1' | '0.5.0';
const iconVersionLabels = { '0.4.1': '0.4.1', '0.5.0': '0.5.0 예정' } as const;
const componentIconExample = `import { Button, IconButton } from '@idenflu/mono-react';
import { SaveIcon, BellIcon, BookmarkIcon } from '@idenflu/mono-react/icons';
import '@idenflu/mono-react/styles.css';

export function IconExample() {
  return <>
    <Button><SaveIcon />저장</Button>
    <IconButton label="알림"><BellIcon /></IconButton>
    <BookmarkIcon size={20} label="저장됨" />
  </>;
}`;

const snippets: Record<string, string> = {
  'components/grid': gridUsage,
  'components/time-picker': timePickerUsage,
  'components/data-grid': dataGridUsage,
  'components/divider':`import { Divider } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function DividerExample() {
  return <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <p>프로젝트 정보</p>
    <Divider />
    <p>공유 설정</p>
    <Divider align="start">추가 정보</Divider>
    <Divider variant="dashed" decorative />
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <span>디자인 팀</span>
      <Divider orientation="vertical" />
      <span>문서 3개</span>
    </div>
  </div>;
}`,
  'foundations/typography': `import { TextField } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function TypographyExample() {
  return <>
    <h2 style={{ fontSize: 'var(--font-size-heading)',
                 lineHeight: 'var(--line-height-heading)',
                 fontWeight: 'var(--font-weight-semibold)' }}>프로젝트 설정</h2>
    <p style={{ fontSize: 'var(--font-size-body)',
                lineHeight: 'var(--line-height-body)' }}>팀과 함께 작업할 프로젝트 정보를 관리합니다.</p>
    <p style={{ fontSize: 'var(--font-size-caption)',
                lineHeight: 'var(--line-height-caption)',
                color: 'var(--text-secondary)' }}>마지막 수정 · 2026.11.02</p>
    <TextField label="프로젝트 이름"
               helperText="팀원이 알아보기 쉬운 이름을 입력해주세요." />
  </>;
}`,
  'foundations/colors': `import { Alert, Badge, Button, TextField } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function ColorExample() {
  return <>
    <Button>저장하기</Button>
    <Badge variant="success">완료</Badge>
    <Badge variant="warning">검토 필요</Badge>
    <Alert variant="success"><strong>저장 완료</strong><p>변경사항이 적용되었습니다.</p></Alert>
    <div style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
      <h3>프로젝트 설정</h3>
      <TextField label="프로젝트 이름" defaultValue="idenflu mono" />
    </div>
  </>;
}`,
  'foundations/icons': `import { useState, type CSSProperties } from 'react';
import { Badge, Button, Icon, IconButton, TextField } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function IconExample() {
  const [pinned, setPinned] = useState(false);
  return <>
    <Button><Icon name="save" />저장</Button>
    <Button variant="outline"><Icon name="microsoft-excel" />Excel 내보내기</Button>
    <IconButton label="알림"><Icon name="bell" /></IconButton>
    <IconButton label={pinned ? '고정 해제' : '상단에 고정'}
      aria-pressed={pinned} onClick={() => setPinned(value => !value)}>
      <Icon name={pinned ? 'pin-off' : 'pin'} />
    </IconButton>
    <Button variant="outline"><Icon name="user-plus" />멤버 초대</Button>
    <Badge><Icon name="crown" />소유자</Badge>
    <Badge variant="success"><Icon name="shield-check" />접근 허용</Badge>
    <Badge variant="danger"><Icon name="shield-off" />접근 거부</Badge>
    <Badge variant="primary"><Icon name="circle-dot" />진행 중</Badge>
    <Badge variant="danger" appearance="solid"><Icon name="error-circle-fill" />오류</Badge>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name="columns" style={{ '--icon-size': '20px' } as CSSProperties} />
      <span>표시 열</span>
    </div>
    <Button variant="outline" aria-pressed="true"><Icon name="bookmark-fill" />북마크됨</Button>
    <TextField label="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative />
  </>;
}`,
  'components/buttons':`import { Button, Icon, IconButton, Segmented } from '@idenflu/mono-react';

<Button variant="outline">저장</Button>
<Button variant="danger" appearance="outline"><Icon name="trash" />선택 삭제</Button>
<IconButton label="설정 열기"><Icon name="settings" /></IconButton>
<Segmented label="보기 방식" size="md" defaultValue="list"
  options={[
    { value: 'list', label: <><Icon name="list" />목록</> },
    { value: 'grid', label: <><Icon name="grid" />격자</> },
    { value: 'calendar', label: <><Icon name="calendar" />캘린더</> },
  ]}
/>`,
  'components/text-fields':`import { Icon, TextField } from '@idenflu/mono-react';

<TextField
  label={<>이름 <span className="form-pattern-required">필수</span></>}
  required prefix={<Icon name="person" />} prefixDecorative
  placeholder="이름을 입력해주세요"
/>
<TextField
  label={<>회사명 <span className="form-pattern-optional">선택</span></>}
  placeholder="회사명을 입력해주세요"
/>
<TextField label="웹사이트" labelPosition="left"
           prefix="https://" defaultValue="idenflu.app" />
<TextField label="프로젝트 검색" hideLabel type="search"
           placeholder="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative />`,
  'components/selection':`import { Checkbox, Switch } from '@idenflu/mono-react';

<Checkbox label="이메일 알림" defaultChecked />
<Switch size="sm" label="이메일 알림" defaultChecked />
<Switch size="md" label="자동 저장" />
<Switch size="lg" label="활동 알림" defaultChecked />
<Switch label="비활성 설정" disabled />`,
  'components/progress':`import { Progress, SegmentedProgress, CircleProgress } from '@idenflu/mono-react';

<Progress value={60} max={100} aria-label="파일 업로드" />
<Progress value={100} max={100} variant="success" aria-label="업로드 완료" />
<Progress value={60} max={100} thickness="thin" aria-label="얇은 진행률" />
<SegmentedProgress value={3} total={5} label="프로젝트 설정 진행률" />
<CircleProgress value={60} label="진행률" />`,
  'components/loading':`import { NovaSpinner, Spinner } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function LoadingExample() {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
    <NovaSpinner size={64} label="프로젝트를 준비하는 중" />
    <NovaSpinner size={40} appearance="mark" variant="neutral" />
    <Spinner kind="nova" size="small" />
  </div>;
}`,
  'components/accordion':'<Accordion><AccordionItem title="제목">내용</AccordionItem></Accordion>',
  'components/overlays':`import { useEffect, useId, useRef, useState } from 'react';
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, NovaSpinner, Toast } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function OverlayExample() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)}>안내 열기</Button>
    <Dialog open={open} onOpenChange={setOpen} closeOnBackdrop
            aria-labelledby="notice-title" aria-describedby="notice-description">
      <DialogHeader><h2 id="notice-title">공유 범위 안내</h2></DialogHeader>
      <DialogBody>
        <p id="notice-description">초대한 팀원만 프로젝트를 볼 수 있습니다.</p>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => { setOpen(false); setNotice(true); }}>확인</Button>
      </DialogFooter>
    </Dialog>
    {notice && <Toast variant="success" appearance="solid" onDismiss={() => setNotice(false)}>
      공유 범위를 확인했습니다.
    </Toast>}
  </>;
}

// 버튼 없는 유형은 <ProcessingDialogExample blocking />으로 사용합니다.
export function ProcessingDialogExample({ blocking = false }: { blocking?: boolean }) {
  const titleId = useId();
  const action = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!open) return;
    // 실제 앱에서는 비동기 작업 결과에 맞춰 완료 상태를 갱신합니다.
    const timer = window.setTimeout(() => {
      setDone(true);
      if (blocking) setOpen(false);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [open, blocking]);
  useEffect(() => {
    if (open && done) action.current?.focus();
  }, [open, done]);
  return <>
    <Button onClick={() => { setDone(false); setOpen(true); }}>
      {blocking ? '버튼 없는 처리 시작' : '동기화 시작'}
    </Button>
    <Dialog open={open} onOpenChange={next => { if (!blocking) setOpen(next); }} aria-labelledby={titleId}>
      <h2 id={titleId}>데이터 동기화</h2>
      <div style={{ display: 'grid', justifyItems: 'center', gap: 16, marginTop: 24 }}>
        {!done && <NovaSpinner size={56} aria-hidden="true" />}
        <p role="status" aria-atomic="true">
          {done ? '동기화를 완료했습니다.' : '데이터를 동기화하고 있습니다.'}
        </p>
        {blocking && <p>완료되면 자동으로 닫힙니다.</p>}
      </div>
      {!blocking && <div className="dialog-actions">
        <Button ref={action} variant={done ? 'primary' : 'outline'} onClick={() => setOpen(false)}>
          {done ? '확인' : '작업 취소'}
        </Button>
      </div>}
    </Dialog>
  </>;
}`,
  'components/list':'<List><ListItem>디자인 시스템</ListItem></List>',
  'components/slider':'<Slider aria-label="진행률" defaultValue={50} />',
  'components/tooltip':'<Tooltip content="도움말"><Button>정보</Button></Tooltip>',
  'components/popover':'<Popover trigger="표시 설정" label="표시 설정" align="end">내용</Popover>',
  'components/stepper':'<Stepper aria-label="프로젝트 생성" steps={["기본 정보", "확인"]} currentStep={0} />',
  'components/card':'<Card><h3>프로젝트</h3><p>상세 내용</p></Card>',
  ...patternSnippets,
  ...componentUsage,
  ...completeExamples,
};
function CodeContent({ code }: { code:string }) {
  const [message, setMessage] = React.useState('');
  return <><div className="react-studio-code" role="region" aria-label="React 사용 예시 코드" tabIndex={0}><pre><code>{code}</code></pre></div><div className="react-studio-row"><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage('코드를 복사했습니다.'); } catch { setMessage('복사할 수 없습니다. 위 코드를 선택해 복사하세요.'); } }}>코드 복사</Button><span className="component-helper" role="status" hidden={!message}>{message}</span></div></>;
}
function CodeExample({ code, complete = false }: { code:string; complete?:boolean }) {
  return <Section title="React 사용 예시" description={complete ? "현재 화면의 데이터·상태·이벤트와 예제용 배치를 포함한 전체 TSX 코드입니다. 복사 후 내보낸 컴포넌트를 렌더링하세요." : "패키지에서 컴포넌트를 가져와 사용합니다."}><CodeContent code={code} /></Section>;
}
function FoundationIcons({ version }: { version: IconVersion }) {
  const [query, setQuery] = React.useState('');
  const [variant, setVariant] = React.useState('all');
  const options = version === '0.4.1' ? releasedIcons.map(name => ({ name, component: '', IconComponent: null })) : componentIcons;
  const term = query.trim().toLowerCase();
  const visible = options.filter(item => (item.name.includes(term) || item.component.toLowerCase().includes(term)) && (variant === 'all' || item.name.endsWith('-fill') === (variant === 'filled')));
  return <><div className="react-studio-stack">{version === '0.4.1' && <Segmented label="아이콘 유형" value={variant} onValueChange={setVariant} options={[{value:'all', label:'전체'}, {value:'outline', label:'Outline'}, {value:'filled', label:'Filled'}]} />}<div className="react-studio-search-field"><TextField type="search" label="아이콘 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="예: bookmark, cart, chart" /></div></div><p className="component-helper" role="status">{visible.length ? `${visible.length}개 아이콘` : '검색 결과가 없습니다. 이름이나 유형을 바꿔 검색해주세요.'}</p><ul className="react-studio-icons">{visible.map(({name, component, IconComponent}) => <li key={name}>{IconComponent ? <IconComponent size={24} /> : <Icon name={name as IconName} />}<span>{component || name}</span></li>)}</ul></>;
}
function IconsPage() {
  const [version, setVersion] = React.useState<IconVersion>('0.4.1');
  const versions: IconVersion[] = ['0.4.1', '0.5.0'];
  const updateVersion = (value: string) => setVersion(value as IconVersion);
  return <><IconDemos />
    <Section title="아이콘 목록" description="패키지 버전을 선택하고 유형이나 이름으로 아이콘을 찾아보세요. 0.5.0은 출시 예정입니다.">
      <Tabs label="아이콘 목록 패키지 버전" value={version} onValueChange={updateVersion} items={versions.map(value => ({ value, label: iconVersionLabels[value], content: value === version ? <><p className="react-studio-caption">{value === '0.4.1' ? '표시된 이름을 Icon의 name에 사용합니다.' : 'Outline 컴포넌트를 @idenflu/mono-react/icons에서 가져옵니다.'}</p><FoundationIcons version={value} /></> : null }))} />
    </Section>
    <Section title="React 사용 예시" description="선택한 패키지 버전의 사용 예시입니다.">
      <Tabs label="사용 예시 패키지 버전" value={version} onValueChange={updateVersion} items={versions.map(value => ({ value, label: iconVersionLabels[value], content: value === version ? <CodeContent key={value} code={value === '0.4.1' ? snippets['foundations/icons'] : componentIconExample} /> : null }))} />
    </Section>
  </>;
}
function ComponentPage({ route }: { route:string }) {
  const Pattern = patternPages[route as keyof typeof patternPages];
  if (Pattern) return <Pattern />;
  switch (route) {
    case 'overview': return <Overview />;
    case 'foundations/colors': return <ColorDemos />;
    case 'foundations/typography': return <TypographyDemos />;
    case 'foundations/sizes': return <SizeDemos />;
    case 'foundations/icons': return <IconsPage />;
    case 'foundations/states': return <StateDemos />;
    case 'components/buttons': return <ButtonDemos />;
    case 'components/text-fields': return <TextFields />;
    case 'components/selection': return <SelectionDemos />;
    case 'components/select': return <SelectDemos />;
    case 'components/number-fields': return <NumberDemos />;
    case 'components/date-picker': return <DateDemos />;
    case 'components/datetime-picker': return <DateTimeDemos />;
    case 'components/time-picker': return <TimePickerDemos />;
    case 'components/tree': return <TreeDemos />;
    case 'components/tabs': return <TabsDemos />;
    case 'components/progress': return <ProgressDemos />;
    case 'components/loading': return <LoadingDemos />;
    case 'components/file-upload': return <FileDemos />;
    case 'components/feedback': return <FeedbackDemos />;
    case 'components/accordion': return <AccordionDemos />;
    case 'components/overlays': return <OverlayDemos />;
    case 'components/table': return <TableDemos />;
    case 'components/data-grid': return <DataGridDemos />;
    case 'components/chips': return <ChipDemos />;
    case 'components/list': return <ListDemos />;
    case 'components/divider': return <DividerDemos />;
    case 'components/grid': return <GridDemos />;
    case 'components/page-header': return <PageHeaderDemos />;
    case 'components/slider': return <SliderDemos />;
    case 'components/tooltip': return <TooltipDemos />;
    case 'components/dropdown-menu': return <MenuDemos />;
    case 'components/popover': return <PopoverDemos />;
    case 'components/drawer': return <DrawerDemos />;
    case 'components/avatar': return <AvatarDemos />;
    case 'components/stepper': return <StepperDemos />;
    case 'components/card': return <CardDemos />;
    case notFoundRouteId: return <DocumentNotFound />;
    default: return null;
  }
}
function DocumentationApp() {
  const current = useDocumentRoute();
  return <DocumentShell current={current}>
    <ComponentPage key={`page-${current.route}`} route={current.route} />
    {current.route === 'components/datetime-picker'
      ? <DateTimeUsageExamples />
      : current.route !== 'foundations/icons' && snippets[current.route] && <CodeExample key={`code-${current.route}`} code={snippets[current.route]} complete={current.route in completeExamples} />}
  </DocumentShell>;
}
function App() {
  const layout = new URLSearchParams(location.search).get('layout');
  if (layout === 'sidebar') return <SidebarLayoutSample />;
  if (layout !== null) return <LayoutNotFound layout={layout} />;
  return <DocumentationApp />;
}
createRoot(document.getElementById('root')!).render(<App />);
