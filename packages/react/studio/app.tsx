import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Icon, Segmented, TextField, type IconName } from '../src';
import { Section } from './demo-layout';
import { ColorDemos } from './color-demos';
import { TextFields, SelectDemos, NumberDemos, DateDemos } from './form-demos';
import { DateTimeDemos } from './datetime-demos';
import { DateTimeUsageExamples } from './datetime-usage-examples';
import { IconDemos, TypographyDemos, SizeDemos, StateDemos } from './foundation-demos';
import { TabsDemos, FeedbackDemos, AccordionDemos, OverlayDemos, TooltipDemos, CardDemos } from './content-demos';
import { ButtonDemos, SelectionDemos, TreeDemos, ChipDemos, TableDemos, ListDemos, StepperDemos, MenuDemos, PopoverDemos, DrawerDemos } from './structure-demos';
import { SliderDemos, ProgressDemos, LoadingDemos, AvatarDemos, FileDemos } from './media-demos';
import { DocumentShell, Overview, useDocumentRoute } from './shell';
import { DividerDemos } from './divider-demos';
import { patternPages, patternSnippets } from './patterns';
import { componentUsage } from './component-usage';
import icons from './dist/icons.json';

const snippets: Record<string, string> = {
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
  'foundations/colors': `import { Alert, Badge, Button } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function ColorExample() {
  return <>
    <Button>저장하기</Button>
    <Badge variant="success">완료</Badge>
    <Badge variant="warning">검토 필요</Badge>
    <Alert variant="success"><strong>저장 완료</strong><p>변경사항이 적용되었습니다.</p></Alert>
    <div style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
      프로젝트 설정
    </div>
  </>;
}`,
  'foundations/icons': `import { Button, Icon, TextField } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function IconExample() {
  return <>
    <Button><Icon name="save" />저장</Button>
    <Button iconOnly aria-label="알림"><Icon name="bell" /></Button>
    <Button variant="outline" aria-pressed="true"><Icon name="bookmark-fill" />북마크됨</Button>
    <TextField label="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative />
  </>;
}`,
  'components/buttons':`import { Button, Icon, Segmented } from '@idenflu/mono-react';

<Button variant="outline">저장</Button>
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
           prefix="https://" defaultValue="idenflu.app" />`,
  'components/selection':`import { Checkbox, Switch } from '@idenflu/mono-react';

<Checkbox label="이메일 알림" defaultChecked />
<Switch size="sm" label="이메일 알림" defaultChecked />
<Switch size="md" label="자동 저장" />
<Switch size="lg" label="활동 알림" defaultChecked />
<Switch label="비활성 설정" disabled />`,
  'components/number-fields':`import { Icon, NumberField } from '@idenflu/mono-react';

<NumberField label="참여 인원" prefixIcon={<Icon name="person" />}
             defaultValue="8" min="0" max="100" unit="명" />
<NumberField label="작업 기간" prefixIcon={<Icon name="calendar" />}
             defaultValue="3" min="0" decimals={1} step="0.5" unit="일" />`,
  'components/date-picker':'<DatePicker label="시작일" />\n<DateRangePicker label="기간" />',
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
  'components/overlays':`import { useState } from 'react';
import { Button, Dialog, DialogHeader, DialogBody, DialogFooter, Toast } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function OverlayExample() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)}>안내 열기</Button>
    <Dialog variant="divided" open={open} onOpenChange={setOpen} closeOnBackdrop
            aria-labelledby="notice-title" aria-describedby="notice-description">
      <DialogHeader><h2 id="notice-title">공유 범위 안내</h2></DialogHeader>
      <DialogBody>
        <p id="notice-description">초대한 팀원만 프로젝트를 볼 수 있습니다.</p>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => { setOpen(false); setNotice(true); }}>확인</Button>
      </DialogFooter>
    </Dialog>
    {notice && <Toast variant="success" onDismiss={() => setNotice(false)}>
      공유 범위를 확인했습니다.
    </Toast>}
  </>;
}`,
  'components/table':`import { Checkbox, Table, TableContainer } from '@idenflu/mono-react';

<TableContainer label="프로젝트 목록">
  <Table density="compact">
    <colgroup><col style={{ width: '44%' }} /><col /><col /><col /></colgroup>
    <thead><tr><th scope="col">프로젝트</th><th scope="col">담당 팀</th><th scope="col">담당자</th><th scope="col" className="table-numeric">진행률</th></tr></thead>
    <tbody><tr><td>디자인 시스템</td><td>프로덕트 디자인</td><td>김민수</td><td className="table-numeric">72%</td></tr></tbody>
  </Table>
</TableContainer>

<TableContainer label="공유 파일 목록">
  <Table interactive>
    <thead><tr><th scope="col"><Checkbox label={<span className="sr-only">모든 파일 선택</span>} checked={allSelected} onChange={toggleAll} /></th><th scope="col">파일</th></tr></thead>
    <tbody><tr data-selected={selected || undefined} onClick={toggleOnRowClick}><td><Checkbox label={<span className="sr-only">design-tokens.json 선택</span>} checked={selected} onChange={toggle} /></td><td>design-tokens.json</td></tr></tbody>
  </Table>
</TableContainer>

// density="default"는 기본 간격, "compact"는 조밀한 간격입니다.
// interactive는 행 hover를 표시하고, data-selected="true"는 선택한 행을 강조합니다.`,
  'components/chips':`import { Chip } from '@idenflu/mono-react';

<Chip interactive={false}>디자인</Chip>
<Chip interactive={false} variant="secondary">보조 정보</Chip>
<Chip interactive={false} rounded variant="success">완료</Chip>
<Chip rounded variant="primary" aria-pressed={selected} onClick={() => setSelected(!selected)}>프로젝트 필터</Chip>`,
  'components/list':'<List><ListItem>디자인 시스템</ListItem></List>',
  'components/slider':'<Slider aria-label="진행률" defaultValue={50} />',
  'components/tooltip':'<Tooltip content="도움말"><Button>정보</Button></Tooltip>',
  'components/popover':'<Popover trigger="표시 설정" label="표시 설정">내용</Popover>',
  'components/stepper':'<Stepper aria-label="프로젝트 생성" steps={["기본 정보", "확인"]} currentStep={0} />',
  'components/card':'<Card><h3>프로젝트</h3><p>상세 내용</p></Card>',
  'patterns/form/basic':'<TextField label="이름" name="name" required error={errors.name} />\n<TextField label="이메일" name="email" type="email" required error={errors.email} />',
  ...patternSnippets,
  ...componentUsage,
};
function CodeExample({ code }: { code:string }) {
  const [message, setMessage] = React.useState('');
  return <Section title="React 사용 예시" description="패키지에서 컴포넌트를 가져와 사용합니다."><div className="react-studio-code" role="region" aria-label="React 사용 예시 코드" tabIndex={0}><pre><code>{code}</code></pre></div><div className="react-studio-row"><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage('코드를 복사했습니다.'); } catch { setMessage('복사할 수 없습니다. 위 코드를 선택해 복사하세요.'); } }}>코드 복사</Button><span className="component-helper" role="status" hidden={!message}>{message}</span></div></Section>;
}
function FoundationIcons() {
  const [query, setQuery] = React.useState('');
  const [variant, setVariant] = React.useState('all');
  const visible = icons.filter(name => name.includes(query.trim().toLowerCase()) && (variant === 'all' || name.endsWith('-fill') === (variant === 'filled')));
  return <><div className="react-studio-stack"><Segmented label="아이콘 유형" value={variant} onValueChange={setVariant} options={[{value:'all', label:'전체'}, {value:'outline', label:'Outline'}, {value:'filled', label:'Filled'}]} /><div className="react-studio-search-field"><TextField type="search" label="아이콘 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="예: bookmark, cart, chart" /></div></div><p className="component-helper" role="status">{visible.length ? `${visible.length}개 아이콘` : '검색 결과가 없습니다. 이름이나 유형을 바꿔 검색해주세요.'}</p><ul className="react-studio-icons">{visible.map(name => <li key={name}><Icon name={name as IconName} /><span>{name}</span></li>)}</ul></>;
}
function ComponentPage({ route }: { route:string }) {
  const Pattern = patternPages[route as keyof typeof patternPages];
  if (Pattern) return <Pattern />;
  switch (route) {
    case 'overview': return <Overview />;
    case 'foundations/colors': return <ColorDemos />;
    case 'foundations/typography': return <TypographyDemos />;
    case 'foundations/sizes': return <SizeDemos />;
    case 'foundations/icons': return <><IconDemos /><Section title="아이콘 목록" description="유형별로 살펴보거나 이름으로 검색하세요. 표시된 이름을 React Icon의 name에 그대로 사용합니다. Filled 이름에는 -fill이 붙습니다."><FoundationIcons /></Section></>;
    case 'foundations/states': return <StateDemos />;
    case 'components/buttons': return <ButtonDemos />;
    case 'components/text-fields': return <TextFields />;
    case 'components/selection': return <SelectionDemos />;
    case 'components/select': return <SelectDemos />;
    case 'components/number-fields': return <NumberDemos />;
    case 'components/date-picker': return <DateDemos />;
    case 'components/datetime-picker': return <DateTimeDemos />;
    case 'components/tree': return <TreeDemos />;
    case 'components/tabs': return <TabsDemos />;
    case 'components/progress': return <ProgressDemos />;
    case 'components/loading': return <LoadingDemos />;
    case 'components/file-upload': return <FileDemos />;
    case 'components/feedback': return <FeedbackDemos />;
    case 'components/accordion': return <AccordionDemos />;
    case 'components/overlays': return <OverlayDemos />;
    case 'components/table': return <TableDemos />;
    case 'components/chips': return <ChipDemos />;
    case 'components/list': return <ListDemos />;
    case 'components/divider': return <DividerDemos />;
    case 'components/slider': return <SliderDemos />;
    case 'components/tooltip': return <TooltipDemos />;
    case 'components/dropdown-menu': return <MenuDemos />;
    case 'components/popover': return <PopoverDemos />;
    case 'components/drawer': return <DrawerDemos />;
    case 'components/avatar': return <AvatarDemos />;
    case 'components/stepper': return <StepperDemos />;
    case 'components/card': return <CardDemos />;
    default: return null;
  }
}
function App() {
  const current = useDocumentRoute();
  return <DocumentShell current={current}>
    <ComponentPage key={`page-${current.route}`} route={current.route} />
    {current.route === 'components/datetime-picker'
      ? <DateTimeUsageExamples />
      : snippets[current.route] && <CodeExample key={`code-${current.route}`} code={snippets[current.route]} />}
  </DocumentShell>;
}
createRoot(document.getElementById('root')!).render(<App />);
