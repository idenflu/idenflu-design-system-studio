import * as React from 'react';
import { Alert, Button, DatePicker, Dialog, DialogHeader, DialogBody, DialogFooter, Drawer, DrawerHeader, DrawerBody, DrawerFooter, Icon, NativeSelect, Select, Switch, TextArea, TextField, type DrawerSide, type DrawerSize } from '../src';
import { Section } from './demo-layout';

const sides = [{value:'right', label:'오른쪽'}, {value:'left', label:'왼쪽'}, {value:'top', label:'위쪽'}, {value:'bottom', label:'아래쪽'}] as const;
const sizes = [{value:'sm', label:'SM · 320px'}, {value:'md', label:'MD · 480px'}, {value:'lg', label:'LG · 640px'}, {value:560, label:'사용자 지정 · 560px'}, {value:'full', label:'전체 화면'}] as const;

function CloseButton({onClick}: {onClick: () => void}) {
  return <Button variant="ghost" iconOnly aria-label="패널 닫기" onClick={onClick}><Icon name="close" /></Button>;
}

function SettingsDrawer() {
  const initial = {name:'디자인 시스템', note:'제품 전반의 일관된 경험을 위한 가이드입니다.', team:'design'};
  const [saved, setSaved] = React.useState(initial), [draft, setDraft] = React.useState(initial);
  const [open, setOpen] = React.useState(false), [error, setError] = React.useState(''), [feedback, setFeedback] = React.useState('변경 사항이 없습니다.');
  const nameRef = React.useRef<HTMLInputElement>(null);
  const formId = React.useId(), titleId = React.useId(), descriptionId = React.useId();
  return <Section title="설정 편집" description="헤더와 하단 버튼은 고정하고 본문만 스크롤합니다. 취소하거나 닫으면 마지막으로 저장한 값이 유지됩니다.">
    <Button variant="outline" onClick={() => { setDraft(saved); setError(''); setOpen(true); }}><Icon name="settings" />상세 정보 열기</Button>
    <p role="status" className="component-helper">{feedback}</p>
    <Drawer variant="divided" open={open} onOpenChange={setOpen} initialFocusRef={nameRef} aria-labelledby={titleId} aria-describedby={descriptionId}>
      <DrawerHeader><div><h2 id={titleId}>프로젝트 설정</h2><p id={descriptionId}>프로젝트의 기본 정보를 확인하고 수정하세요.</p></div><CloseButton onClick={() => setOpen(false)} /></DrawerHeader>
      <DrawerBody>
        <form id={formId} className="studio-drawer-form" noValidate onSubmit={event => {
          event.preventDefault(); const name = draft.name.trim();
          if (!name) { setError('프로젝트 이름을 입력해주세요.'); nameRef.current?.focus(); return; }
          setSaved({...draft, name}); setFeedback(`${name} 설정을 저장했습니다.`); setOpen(false);
        }}>
          <TextField ref={nameRef} label="프로젝트 이름" required maxLength={60} value={draft.name} error={error || undefined} onChange={event => { setDraft({...draft,name:event.target.value}); setError(''); }} />
          <Select label="담당 팀" value={draft.team} onValueChange={team => setDraft({...draft, team})} options={[{value:'design',label:'프로덕트 디자인'},{value:'development',label:'플랫폼 개발'},{value:'planning',label:'서비스 기획'}]} />
          <TextArea label="설명" rows={5} value={draft.note} onChange={event => setDraft({...draft,note:event.target.value})} helperText="팀원들이 프로젝트의 목적을 이해할 수 있도록 작성합니다." />
        </form>
      </DrawerBody>
      <DrawerFooter><Button variant="outline" onClick={() => setOpen(false)}>취소</Button><Button type="submit" form={formId}>저장</Button></DrawerFooter>
    </Drawer>
  </Section>;
}

function PlacementDrawer() {
  const [side, setSide] = React.useState<DrawerSide>('right'), [size, setSize] = React.useState<DrawerSize | number>('md'), [open, setOpen] = React.useState(false);
  const titleId = React.useId(), descriptionId = React.useId();
  const sideLabel = sides.find(item => item.value === side)!.label;
  return <Section title="위치와 크기" description="좌우 패널은 너비, 위아래 패널은 높이에 크기 옵션이 적용됩니다. 화면보다 크면 화면 안에 맞춥니다.">
    <div className="studio-drawer-controls">
      <NativeSelect label="패널 위치" value={side} onChange={event => setSide(event.target.value as DrawerSide)}>{sides.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</NativeSelect>
      <NativeSelect label="패널 크기" value={size} onChange={event => setSize(event.target.value === '560' ? 560 : event.target.value as DrawerSize)}>{sizes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</NativeSelect>
      <Button variant="outline" onClick={() => setOpen(true)}>패널 미리보기</Button>
    </div>
    <p className="react-studio-caption"><code>{'size={560}'}</code>처럼 픽셀 값을 직접 지정할 수도 있습니다.</p>
    <Drawer side={side} size={size} variant="divided" open={open} onOpenChange={setOpen} aria-labelledby={titleId} aria-describedby={descriptionId}>
      <DrawerHeader><div><h2 id={titleId}>{sideLabel} 패널</h2><p id={descriptionId}>{sizes.find(item => item.value === size)!.label} 크기의 패널입니다.</p></div><CloseButton onClick={() => setOpen(false)} /></DrawerHeader>
      <DrawerBody><div className="studio-drawer-form"><Alert>목록의 맥락을 유지하면서 상세 정보나 보조 작업을 제공합니다.</Alert><p>간단한 필터는 작은 패널에, 상세 편집은 넓은 패널에 배치하세요. 전체 화면에서도 닫기 버튼과 하단 동작은 계속 사용할 수 있습니다.</p></div></DrawerBody>
      <DrawerFooter><Button onClick={() => setOpen(false)}>확인</Button></DrawerFooter>
    </Drawer>
  </Section>;
}

function LongContentDrawer() {
  const [open, setOpen] = React.useState(false), [confirmOpen, setConfirmOpen] = React.useState(false), [date, setDate] = React.useState<string | null>('2026-11-16');
  const [message, setMessage] = React.useState('알림을 적용하기 전에 수신 범위를 확인하세요.');
  const titleId = React.useId(), descriptionId = React.useId(), confirmId = React.useId();
  const options = ['프로젝트 변경 알림','댓글과 멘션 알림','작업 배정 알림','일정 변경 알림','승인 요청 알림','주간 요약','완료된 작업 요약','보안과 접근 알림'];
  return <Section title="긴 본문과 중첩 확인" description="긴 설정 목록은 본문 안에서 스크롤합니다. 달력과 확인 창을 닫아도 패널의 입력값과 스크롤 위치를 유지합니다.">
    <Button variant="outline" onClick={() => setOpen(true)}>알림 설정 열기</Button>
    <p role="status" className="component-helper">{message}</p>
    <Drawer size="lg" variant="divided" closeOnBackdrop={false} open={open} onOpenChange={setOpen} aria-labelledby={titleId} aria-describedby={descriptionId}>
      <DrawerHeader><div><h2 id={titleId}>알림 설정</h2><p id={descriptionId}>프로젝트에서 받을 알림을 선택하세요.</p></div><CloseButton onClick={() => setOpen(false)} /></DrawerHeader>
      <DrawerBody><div className="studio-drawer-form">
        <DatePicker label="적용 시작일" value={date} onValueChange={setDate} />
        <div className="studio-drawer-options">{options.map((label, index) => <div key={label}><Switch label={label} defaultChecked={index < 4} /><p>참여한 프로젝트의 {label.replace(' 알림','')} 정보를 받습니다.</p></div>)}</div>
        <Alert>이 패널은 배경을 눌러도 닫히지 않습니다. 닫기 버튼이나 Escape 키를 사용하세요.</Alert>
      </div></DrawerBody>
      <DrawerFooter><Button variant="outline" onClick={() => setOpen(false)}>닫기</Button><Button onClick={() => setConfirmOpen(true)}>설정 적용</Button></DrawerFooter>
      <Dialog variant="divided" open={confirmOpen} onOpenChange={setConfirmOpen} aria-labelledby={confirmId}>
        <DialogHeader><h2 id={confirmId}>알림 설정 적용</h2></DialogHeader>
        <DialogBody><p>{date ? `${date}부터 선택한` : '선택한'} 알림 설정을 적용할까요?</p></DialogBody>
        <DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)}>돌아가기</Button><Button onClick={() => { setConfirmOpen(false); setMessage('알림 설정을 적용했습니다.'); }}>적용</Button></DialogFooter>
      </Dialog>
    </Drawer>
  </Section>;
}

export function DrawerDemos() {
  return <><SettingsDrawer /><PlacementDrawer /><LongContentDrawer />
    <Section title="사용 기준" description="열기·닫기는 open과 onOpenChange로 제어합니다. 제목과 설명을 접근성 속성으로 연결하고, 본문 폼과 하단 제출 버튼은 form 속성으로 연결합니다.">
      <div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">속성</th><th scope="col">기본값</th><th scope="col">설명</th></tr></thead><tbody>
        <tr><th scope="row"><code>side</code></th><td>right</td><td>right · left · top · bottom</td></tr>
        <tr><th scope="row"><code>size</code></th><td>md · 480px</td><td>sm · md · lg · full 또는 픽셀 숫자</td></tr>
        <tr><th scope="row"><code>variant</code></th><td>default</td><td>divided: DrawerHeader · DrawerBody · DrawerFooter를 직접 자식으로 배치합니다.</td></tr>
        <tr><th scope="row"><code>closeOnBackdrop</code></th><td>true</td><td>배경 클릭으로 닫기. false여도 Escape와 닫기 버튼은 사용할 수 있습니다.</td></tr>
        <tr><th scope="row"><code>initialFocusRef</code></th><td>자동</td><td>열린 직후 포커스를 받을 패널 내부 요소의 ref입니다.</td></tr>
      </tbody></table></div>
      <p className="react-studio-caption">열린 동안 배경 스크롤과 포커스 이동을 제한하고 닫으면 실행 버튼으로 돌아갑니다. Escape는 가장 위의 팝업부터 닫습니다. 움직임 줄이기 설정에서는 등장 애니메이션을 생략합니다.</p>
    </Section>
  </>;
}
