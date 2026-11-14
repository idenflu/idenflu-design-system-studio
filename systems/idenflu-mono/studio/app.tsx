import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Dialog, Icon, Segmented, Tabs, TextField, type IconName } from '@idenflu/mono-react';
import * as generatedIcons from '@idenflu/mono-react/icons';
import { Section } from './demo-layout';
import { ColorDemos } from './color-demos';
import { TextFields, SelectDemos, NumberDemos, DateDemos } from './form-demos';
import { DateTimeDemos } from './datetime-demos';
import { TimePickerDemos, timePickerUsage } from './time-picker-demos';
import { DateTimeUsageExamples } from './datetime-usage-examples';
import { IconDemos, TypographyDemos, SizeDemos, StateDemos } from './foundation-demos';
import { TabsDemos, FeedbackDemos, AccordionDemos, OverlayDemos, TooltipDemos, CardDemos } from './content-demos';
import { ButtonDemos } from './buttons/button-demos';
import { buttonUsage } from './buttons/button-usage';
import { SelectionDemos, TreeDemos, ChipDemos, TableDemos, ListDemos, StepperDemos, MenuDemos, PopoverDemos, DrawerDemos } from './structure-demos';
import { SliderDemos, ProgressDemos, LoadingDemos, AvatarDemos, FileDemos } from './media-demos';
import { DocumentShell, Overview, notFoundRouteId, useDocumentRoute } from './shell';
import { DocumentNotFound, LayoutNotFound } from './not-found';
import { DividerDemos } from './divider-demos';
import { GridDemos, gridUsage } from './grid-demos';
import { patternPages, patternSnippets } from './patterns';
import { componentUsage } from './component-usage';
import completeExamples from './dist/complete-examples.json';
import { DataGridDemos, dataGridUsage } from './data-grid-demos';
import { SidebarLayoutSample } from './layout-samples';
import spriteIcons from './dist/sprite-icons.json';

const componentIcons = spriteIcons.map(name => {
  const component = name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('') + 'Icon';
  return { name, component, IconComponent: generatedIcons[component as keyof typeof generatedIcons] };
});
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
    <Button variant="outline"><Icon name="excel" />Excel 내보내기</Button>
    <IconButton label="알림"><Icon name="bell" /></IconButton>
    <IconButton label={pinned ? '고정 해제' : '상단에 고정'}
      aria-pressed={pinned} onClick={() => setPinned(value => !value)}>
      <Icon name={pinned ? 'pin-off' : 'pin'} />
    </IconButton>
    <Button variant="outline"><Icon name="user-plus" />멤버 초대</Button>
    <Badge><Icon name="star" />소유자</Badge>
    <Badge variant="success"><Icon name="shield-check" />접근 허용</Badge>
    <Badge variant="danger"><Icon name="shield-off" />접근 거부</Badge>
    <Badge variant="primary"><Icon name="circle-dot" />진행 중</Badge>
    <Badge variant="danger" appearance="solid"><Icon name="x-circle" />오류</Badge>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name="columns" style={{ '--icon-size': '20px' } as CSSProperties} />
      <span>표시 열</span>
    </div>
    <Button variant="outline" aria-pressed="true"><Icon name="bookmark" />북마크됨</Button>
    <TextField label="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative />
  </>;
}`,
  'components/buttons': buttonUsage,
  'components/text-fields':`import { Icon, TextField } from '@idenflu/mono-react';

<TextField
  label={<>이름 <span className="form-pattern-required">필수</span></>}
  required prefix={<Icon name="user" />} prefixDecorative
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
  'components/popover':'<Popover trigger={<Button variant="outline">표시 설정</Button>} label="표시 설정" align="end">내용</Popover>',
  'components/stepper':'<Stepper aria-label="프로젝트 생성" steps={["기본 정보", "확인"]} currentStep={0} />',
  'components/card':'<Card radius={8}><CardTitle>프로젝트</CardTitle><CardDescription>상세 내용</CardDescription></Card>',
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
const iconCategories = [
  { label: '탐색·화살표', pattern: /^(arrow|keyboard|chevrons|home|menu|external-link|panel|search|zoom)/ },
  { label: '파일·편집', pattern: /^(file|folder|clipboard|copy|edit|pen|save|trash|archive|attachment|upload|download|printer|undo|redo|crop|text|line-height)/ },
  { label: '사용자·보안', pattern: /^(user|shield|lock|unlock|key$|login|logout|hierarchy)/ },
  { label: '데이터·화면', pattern: /^(chart|table|list|grid|columns|dashboard|database|sort|filter|sliders|settings|tree|maximize|minimize)/ },
  { label: '소통·미디어', pattern: /^(bell|chat|message|mail|inbox|send|image|camera|play|pause|heart|star|bookmark|share|link|plug|wifi|scan)/ },
];
function FoundationIcons() {
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('전체');
  const [size, setSize] = React.useState('24');
  const [selected, setSelected] = React.useState<string | null>(null);
  const term = query.trim().toLowerCase();
  const categoryOf = (name: string) => iconCategories.find(item => item.pattern.test(name))?.label ?? '상태·기타';
  const visible = componentIcons.filter(item => (category === '전체' || categoryOf(item.name) === category) &&
    `${item.name} ${item.component} ${categoryOf(item.name)}`.toLowerCase().includes(term));
  const chosen = componentIcons.find(item => item.name === selected);
  return <div className="studio-icon-browser">
    <div className="studio-icon-toolbar">
      <TextField type="search" label="아이콘 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="이름, 컴포넌트 또는 분류 검색" />
      <Segmented label="목록 아이콘 크기" value={size} onValueChange={setSize} options={[14, 16, 20, 24, 32].map(value => ({value: String(value), label: `${value}px`}))} />
    </div>
    <div className="studio-icon-filters" role="group" aria-label="아이콘 분류">{['전체', ...iconCategories.map(item => item.label), '상태·기타'].map(label => <Button key={label} size="sm" variant="outline" aria-pressed={category === label} onClick={() => setCategory(label)}>{label}</Button>)}</div>
    <p className="component-helper" role="status">전체 {componentIcons.length}개 중 {visible.length}개 · 아이콘을 선택하면 사용 코드를 확인할 수 있습니다.</p>
    <Dialog open={!!chosen} onOpenChange={open => { if (!open) setSelected(null); }} closeOnBackdrop aria-label="아이콘 사용 코드" className="studio-icon-dialog">{chosen && <div className="studio-icon-detail">
      <div className="react-studio-row"><Icon name={chosen.name as IconName} /><strong>{chosen.name}</strong><Button size="sm" variant="outline" onClick={() => setSelected(null)}>선택 닫기</Button></div>
      <CodeContent key={chosen.name} code={`import { Icon } from '@idenflu/mono-react';\nimport { ${chosen.component} } from '@idenflu/mono-react/icons';\n\n<${chosen.component} size={${size}} />\n// name으로 사용\n<Icon name="${chosen.name}" />`} />
    </div>}</Dialog>
    {visible.length ? <ul className="react-studio-icons" style={{'--catalog-icon-size': `${size}px`} as React.CSSProperties}>{visible.map(({name, component}) => <li key={name}>
      <button type="button" className="studio-icon-card" aria-label={`${name} 사용 코드`} aria-pressed={selected === name} onClick={() => setSelected(name)}>
        <Icon name={name as IconName} /><span>{name}</span><small>{component}</small>
      </button>
    </li>)}</ul> : <div className="studio-icon-empty"><strong>검색 결과가 없습니다.</strong><p>다른 이름이나 분류로 검색해 보세요.</p><Button variant="outline" onClick={() => {setQuery(''); setCategory('전체');}}>검색 초기화</Button></div>}
  </div>;
}
function IconsPage() {
  return <><Section title="아이콘 목록" description="이름 또는 컴포넌트 이름으로 아이콘을 찾아보세요."><FoundationIcons /></Section><IconDemos />
    <Section title="React 사용 예시" description="name 기반 Icon과 개별 아이콘 컴포넌트를 사용할 수 있습니다.">
      <h3>Icon</h3><CodeContent code={snippets['foundations/icons']} />
      <h3>개별 아이콘 컴포넌트</h3><CodeContent code={componentIconExample} />
    </Section></>;
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
