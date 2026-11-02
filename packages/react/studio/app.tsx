import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, TextField } from '../src';
import { Section } from './demo-layout';
import { ColorDemos } from './color-demos';
import { TextFields, SelectDemos, NumberDemos, DateDemos } from './form-demos';
import { IconDemos, TypographyDemos, SizeDemos, StateDemos } from './foundation-demos';
import { TabsDemos, FeedbackDemos, AccordionDemos, OverlayDemos, TooltipDemos, CardDemos } from './content-demos';
import { ButtonDemos, SelectionDemos, TreeDemos, ChipDemos, TableDemos, ListDemos, StepperDemos, MenuDemos, PopoverDemos, DrawerDemos } from './structure-demos';
import { SliderDemos, ProgressDemos, LoadingDemos, AvatarDemos, FileDemos } from './media-demos';
import { DocumentShell, Overview, useDocumentRoute } from './shell';
import { DividerDemos } from './divider-demos';
import { patternPages, patternSnippets } from './patterns';
import extraRoutes from './extra-routes.json';
import icons from './dist/icons.json';

const prototyped = new Set(['components/buttons', 'components/text-fields', 'components/selection', 'components/select', 'components/number-fields', 'components/date-picker', 'components/tree', 'components/tabs', 'components/progress', 'components/loading', 'components/file-upload', 'components/feedback', 'components/accordion', 'components/overlays', 'components/table', 'components/chips', 'components/list', 'components/slider', 'components/tooltip', 'components/dropdown-menu', 'components/popover', 'components/drawer', 'components/avatar', 'components/stepper', 'components/card']);
['overview', 'foundations/colors', 'foundations/typography', 'foundations/sizes', 'foundations/icons', 'foundations/states'].forEach(route => prototyped.add(route));
extraRoutes.forEach(item => prototyped.add(item.route));
Object.keys(patternPages).forEach(route => prototyped.add(route));
const reactOnly = new Set(extraRoutes.map(item => item.route));
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
    <Button><Icon name="plus" />새로 만들기</Button>
    <Button iconOnly aria-label="설정"><Icon name="settings" /></Button>
    <TextField label="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative />
  </>;
}`,
  'components/buttons':'<Button variant="outline">저장</Button>',
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
  'components/selection':'<Checkbox label="이메일 알림" defaultChecked />',
  'components/select':'<Select label="담당 팀" options={[{ value: "design", label: "디자인", description: "제품 경험을 설계합니다.", icon: <Icon name="grid" /> }]} />',
  'components/number-fields':`import { Icon, NumberField } from '@idenflu/mono-react';

<NumberField label="참여 인원" prefixIcon={<Icon name="person" />}
             defaultValue="8" min="0" max="100" unit="명" />
<NumberField label="작업 기간" prefixIcon={<Icon name="calendar" />}
             defaultValue="3" min="0" decimals={1} step="0.5" unit="일" />`,
  'components/date-picker':'<DatePicker label="시작일" />\n<DateRangePicker label="기간" />',
  'components/tree':'<Tree label="메뉴" items={items} />',
  'components/tabs':'<Tabs label="설정" items={items} />',
  'components/progress':'<Progress value={60} max={100} aria-label="진행률" />\n<CircleProgress value={60} label="진행률" />',
  'components/loading':`import { NovaSpinner, Spinner } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function LoadingExample() {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
    <NovaSpinner size={64} label="프로젝트를 준비하는 중" />
    <NovaSpinner size={40} appearance="mark" variant="neutral" />
    <Spinner kind="nova" size="small" />
  </div>;
}`,
  'components/file-upload':'<FileUpload accept="image/png,image/jpeg,application/pdf" maxSizeBytes={5 * 1024 * 1024} onFilesChange={setFiles} />',
  'components/feedback':'<Badge variant="success">완료</Badge>\n<Alert><strong>안내</strong><p>내용을 확인하세요.</p></Alert>',
  'components/accordion':'<Accordion><AccordionItem title="제목">내용</AccordionItem></Accordion>',
  'components/overlays':`import { useState } from 'react';
import { Button, Dialog, Toast } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function OverlayExample() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)}>안내 열기</Button>
    <Dialog open={open} onOpenChange={setOpen} closeOnBackdrop
            aria-labelledby="notice-title" aria-describedby="notice-description">
      <h2 id="notice-title">공유 범위 안내</h2>
      <p id="notice-description">초대한 팀원만 프로젝트를 볼 수 있습니다.</p>
      <div className="dialog-actions">
        <Button onClick={() => { setOpen(false); setNotice(true); }}>확인</Button>
      </div>
    </Dialog>
    {notice && <Toast variant="success" onDismiss={() => setNotice(false)}>
      공유 범위를 확인했습니다.
    </Toast>}
  </>;
}`,
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
  'patterns/form/basic':'<TextField label="이름" name="name" required error={errors.name} />\n<TextField label="이메일" name="email" type="email" required error={errors.email} />',
  ...patternSnippets,
};
const legacy = (route: string) => `../../../systems/idenflu-mono/index.html#/${route}`;
function CodeExample({ code }: { code:string }) {
  const [message, setMessage] = React.useState('');
  return <Section title="React 사용 예시" description="패키지에서 컴포넌트를 가져와 사용합니다."><div className="react-studio-code"><pre><code>{code}</code></pre></div><div className="react-studio-row"><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(code); setMessage('코드를 복사했습니다.'); } catch { setMessage('복사할 수 없습니다. 위 코드를 선택해 복사하세요.'); } }}>코드 복사</Button><span className="component-helper" role="status" hidden={!message}>{message}</span></div></Section>;
}
function FoundationIcons() {
  const [query, setQuery] = React.useState('');
  const visible = icons.filter(name => name.includes(query.trim().toLowerCase()));
  return <><div className="react-studio-search-field"><TextField type="search" label="아이콘 검색" value={query} onChange={event => setQuery(event.target.value)} placeholder="예: search, calendar, close" /></div><p className="component-helper" role="status">{visible.length ? `${visible.length}개 아이콘` : '검색 결과가 없습니다. 다른 이름으로 검색해주세요.'}</p><ul className="react-studio-icons">{visible.map(name => <li key={name}><span className="ui-icon" aria-hidden="true" style={{'--icon':`url('../../../systems/idenflu-mono/assets/icons/idenflu/${name}.svg')`} as React.CSSProperties} /><span>{name}</span></li>)}</ul></>;
}
function ComponentPage({ route }: { route:string }) {
  const Pattern = patternPages[route as keyof typeof patternPages];
  if (Pattern) return <Pattern />;
  switch (route) {
    case 'overview': return <Overview />;
    case 'foundations/colors': return <ColorDemos />;
    case 'foundations/typography': return <TypographyDemos />;
    case 'foundations/sizes': return <SizeDemos />;
    case 'foundations/icons': return <><IconDemos /><Section title="아이콘 목록" description="목록은 SVG 파일명 기준입니다. React Icon에서 지원하는 이름은 컴포넌트 타입을 확인해주세요."><FoundationIcons /></Section></>;
    case 'foundations/states': return <StateDemos />;
    case 'components/buttons': return <ButtonDemos />;
    case 'components/text-fields': return <TextFields />;
    case 'components/selection': return <SelectionDemos />;
    case 'components/select': return <SelectDemos />;
    case 'components/number-fields': return <NumberDemos />;
    case 'components/date-picker': return <DateDemos />;
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
    {prototyped.has(current.route) ? <><ComponentPage key={`page-${current.route}`} route={current.route} />{snippets[current.route] && <CodeExample key={`code-${current.route}`} code={snippets[current.route]} />}{current.route !== 'overview' && !reactOnly.has(current.route) && <p className="react-studio-note">React 패키지 컴포넌트로 구현한 예시입니다. 기존 문서의 모든 변형과 동작을 대조하는 중입니다. <a href={legacy(current.route)}>기존 문서 보기</a></p>}</> : <p className="react-studio-note">이 문서는 React 전환 전입니다. <a href={legacy(current.route)}>기존 문서에서 확인</a></p>}
  </DocumentShell>;
}
createRoot(document.getElementById('root')!).render(<App />);
