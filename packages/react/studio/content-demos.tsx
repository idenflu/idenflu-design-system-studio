import * as React from 'react';
import { Accordion, AccordionItem, Alert, Badge, Button, Card, Dialog, DialogBody, DialogFooter, DialogHeader, Icon, Tabs, TextField, Toast, Tooltip } from '../src';
import { Section } from './demo-layout';

function DetailRows({items, style}: {items:readonly (readonly [string, string])[]; style?:React.CSSProperties}) {
  return <dl className="detail-list" style={style}>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function TabsDemos() {
  return <>
    <Section title="기본 탭" description="같은 맥락의 정보를 나눠 보고, 선택한 탭의 내용만 표시합니다.">
      <Tabs label="설정 분류" items={[
        {value:'general', label:'기본 정보', content:<><h3 className="react-studio-example-title">워크스페이스 정보</h3><p>함께 작업하는 공간의 기본 정보입니다.</p><DetailRows items={[["이름", "idenflu"], ["역할", "편집자"]]} /></>},
        {value:'notifications', label:'알림', content:<><h3 className="react-studio-example-title">알림 설정</h3><p>중요한 소식만 필요한 곳에서 받아보세요.</p><DetailRows items={[["이메일 알림", "수신 중"], ["활동 요약", "매주 월요일"]]} /></>},
        {value:'security', label:'보안', content:<><h3 className="react-studio-example-title">계정 보안</h3><p>계정의 로그인 방식을 확인할 수 있습니다.</p><DetailRows items={[["로그인 방식", "이메일"], ["2단계 인증", "사용 중"]]} /></>},
      ]} />
    </Section>
    <Section title="비활성 탭" description="사용할 수 없는 탭은 선택과 방향키 탐색에서 제외합니다. Home·End 키로 처음과 마지막 탭으로 이동할 수 있습니다.">
      <Tabs label="프로젝트 분류" items={[
        {value:'active', label:'진행 중 · 3', content:<><h3 className="react-studio-example-title">진행 중인 프로젝트</h3><p>디자인 시스템, 브랜드 가이드, 웹사이트 개선을 작업하고 있습니다.</p></>},
        {value:'archived', label:'보관됨', disabled:true, content:'보관된 프로젝트는 관리자만 확인할 수 있습니다.'},
        {value:'completed', label:'완료 · 2', content:<><h3 className="react-studio-example-title">완료한 프로젝트</h3><p>계정 설정과 알림 개선 작업을 완료했습니다.</p></>},
      ]} />
    </Section>
    <Section title="아이콘이 있는 탭" description="아이콘은 탭 이름을 보조하며 텍스트 라벨과 함께 사용합니다.">
      <Tabs label="보기 탭" items={[
        {value:'list',label:<span className="react-studio-icon-label"><Icon name="list" />목록</span>,content:<p>목록으로 프로젝트를 확인합니다.</p>},
        {value:'grid',label:<span className="react-studio-icon-label"><Icon name="grid" />격자</span>,content:<p>격자로 프로젝트를 확인합니다.</p>},
        {value:'calendar',label:<span className="react-studio-icon-label"><Icon name="calendar" />일정</span>,content:<p>일정별로 프로젝트를 확인합니다.</p>},
      ]} />
    </Section>
  </>;
}

export function FeedbackDemos() {
  return <>
    <Section title="상태 배지" description="작업 상태를 색상과 짧은 문구로 함께 전달합니다.">
      <div className="react-studio-row" role="group" aria-label="상태별 배지"><Badge>대기</Badge><Badge variant="primary">진행 중</Badge><Badge variant="success">완료</Badge><Badge variant="warning">주의</Badge><Badge variant="danger">오류</Badge></div>
      <p className="react-studio-caption">배지는 상태를 안내하는 표시입니다. 선택하거나 필터링할 때는 칩을 사용합니다.</p>
    </Section>
    <Section title="인라인 알림" description="관련된 입력이나 작업 영역 가까이에 안내와 결과를 표시합니다.">
      <div className="react-studio-field-grid"><Alert><strong>안내</strong><p>변경사항은 저장 후 적용됩니다.</p></Alert><Alert variant="success"><strong>완료</strong><p>모든 변경사항을 저장했습니다.</p></Alert></div>
    </Section>
    <Section title="아이콘이 있는 배지와 알림" description="상태를 아이콘과 문구로 함께 전달합니다."><div className="react-studio-row"><Badge variant="success"><Icon name="check" /> 완료</Badge><Badge variant="primary"><Icon name="calendar" /> 예약됨</Badge></div><Alert variant="success"><div className="react-studio-icon-alert"><Icon name="check" /><div><strong>저장 완료</strong><p>변경한 내용이 저장되었습니다.</p></div></div></Alert></Section>
  </>;
}

export function AccordionDemos() {
  return <Section title="자주 묻는 질문" description="각 항목을 독립적으로 열고 닫아 필요한 정보를 함께 비교할 수 있습니다.">
    <Accordion>
      <AccordionItem title="여러 항목을 동시에 열 수 있나요?"><p>각 항목은 독립적으로 열고 닫을 수 있습니다. 필요한 정보를 함께 펼쳐 비교해보세요.</p></AccordionItem>
      <AccordionItem title="키보드로도 사용할 수 있나요?"><p>Tab 키로 제목을 선택한 뒤 Enter 또는 Space 키로 펼칠 수 있습니다. 닫아도 제목에 포커스가 유지됩니다.</p></AccordionItem>
      <AccordionItem title="어떤 내용을 넣으면 좋을까요?"><p>짧은 설명, 사용 안내, 자주 묻는 질문처럼 필요할 때 확인할 내용을 담습니다. 반드시 읽어야 하는 오류와 핵심 정보는 펼치지 않아도 볼 수 있게 표시하세요.</p><p><a href="#/components/feedback">상태와 알림 예시 보기</a></p></AccordionItem>
      <AccordionItem title={<span className="react-studio-icon-label"><Icon name="settings" />알림 설정은 어디서 변경하나요?</span>}><p>설정 화면에서 이메일과 활동 알림을 변경할 수 있습니다.</p></AccordionItem>
    </Accordion>
  </Section>;
}

export function OverlayDemos() {
  const [dialog, setDialog] = React.useState<'info' | 'delete' | 'form' | 'divided' | 'divided-scroll' | null>(null);
  const [dividedFeedback, setDividedFeedback] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [deleted, setDeleted] = React.useState(false);
  const [archived, setArchived] = React.useState(false);
  const [toast, setToast] = React.useState<{message:string; variant:'info' | 'success' | 'danger'; action?:'retry' | 'undo'} | null>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const infoConfirm = React.useRef<HTMLButtonElement>(null);
  const deleteCancel = React.useRef<HTMLButtonElement>(null);
  const formTrigger = React.useRef<HTMLButtonElement>(null);
  const deleteReset = React.useRef<HTMLButtonElement>(null);
  const toastOrigin = React.useRef<HTMLButtonElement | null>(null);
  const restoreToastFocus = React.useRef(false);
  React.useEffect(() => {
    if (dialog === 'info') infoConfirm.current?.focus();
    else if (dialog === 'delete') deleteCancel.current?.focus();
    else if (dialog === 'form') nameRef.current?.focus();
  }, [dialog]);
  React.useEffect(() => {
    if (!toast && restoreToastFocus.current) { restoreToastFocus.current = false; toastOrigin.current?.focus(); }
  }, [toast]);
  React.useEffect(() => { if (deleted) deleteReset.current?.focus(); }, [deleted]);
  const dismissToast = () => { restoreToastFocus.current = true; setToast(null); };
  const closeDialog = (open:boolean) => { if (!open) setDialog(null); };

  return <>
    <Section title="다이얼로그" description="안내, 중요한 결정, 짧은 입력처럼 사용자의 집중이 필요한 상황을 비교합니다.">
      <div className="react-studio-sample-grid">
        <div className="react-studio-example"><h3 className="react-studio-example-title">안내</h3><p className="react-studio-caption">내용을 읽고 확인합니다. 배경을 누르거나 Escape로 닫을 수 있습니다.</p><div className="react-studio-row"><Button variant="outline" onClick={() => setDialog('info')}>안내 열기</Button></div></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">삭제 확인</h3><p className="react-studio-caption">삭제 대상을 확인하고 결정합니다. 처음에는 취소 버튼에 포커스합니다.</p><div className="react-studio-row"><Button variant="outline" disabled={deleted} onClick={() => setDialog('delete')}>삭제 확인</Button>{deleted && <Button ref={deleteReset} variant="ghost" onClick={() => { setDeleted(false); setFeedback('샘플 프로젝트를 다시 추가했습니다.'); }}>다시 추가</Button>}</div><p role="status" className="component-helper">{deleted ? '샘플 프로젝트 삭제됨' : '샘플 프로젝트 1개'}</p></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">입력과 검증</h3><p className="react-studio-caption">필수 값을 확인하고, 잘못 입력하면 오류 안내와 함께 입력란으로 이동합니다.</p><div className="react-studio-row"><Button ref={formTrigger} variant="outline" onClick={() => { setName(''); setError(''); setDialog('form'); }}>다이얼로그 열기</Button></div></div>
      </div>
      <p role="status" className="component-helper">{feedback}</p>
      <Dialog open={dialog === 'info'} onOpenChange={closeDialog} closeOnBackdrop aria-labelledby="studio-info-dialog-title" aria-describedby="studio-info-dialog-description">
        <button className="icon-button dialog-close" type="button" aria-label="안내 닫기" onClick={() => setDialog(null)}><Icon name="close" /></button>
        <h2 id="studio-info-dialog-title">공유 범위 안내</h2><p id="studio-info-dialog-description">초대한 팀원만 프로젝트를 볼 수 있습니다. 공유 범위는 프로젝트 설정에서 변경할 수 있습니다.</p>
        <div className="dialog-actions"><Button ref={infoConfirm} onClick={() => setDialog(null)}>확인</Button></div>
      </Dialog>
      <Dialog open={dialog === 'delete'} onOpenChange={closeDialog} aria-labelledby="studio-delete-dialog-title" aria-describedby="studio-delete-dialog-description">
        <h2 id="studio-delete-dialog-title">프로젝트를 삭제할까요?</h2><p id="studio-delete-dialog-description">샘플 프로젝트를 목록에서 삭제합니다. 이 예시에서는 삭제 후 다시 추가할 수 있습니다.</p>
        <div className="react-studio-dialog-detail"><strong>샘플 프로젝트</strong><span className="react-studio-caption">디자인 팀 · 문서 3개</span></div>
        <div className="dialog-actions"><Button ref={deleteCancel} variant="outline" onClick={() => setDialog(null)}>취소</Button><Button variant="danger" onClick={() => { setDeleted(true); setFeedback('샘플 프로젝트를 삭제했습니다.'); setDialog(null); }}>삭제</Button></div>
      </Dialog>
      <Dialog open={dialog === 'form'} onOpenChange={closeDialog} closeOnBackdrop aria-labelledby="studio-project-dialog-title" aria-describedby="studio-project-dialog-description">
        <button className="icon-button dialog-close" type="button" aria-label="다이얼로그 닫기" onClick={() => setDialog(null)}><Icon name="close" /></button>
        <h2 id="studio-project-dialog-title">새 프로젝트</h2><p id="studio-project-dialog-description">함께 시작할 프로젝트의 이름을 정해주세요.</p>
        <form noValidate onSubmit={event => {
          event.preventDefault();
          const value = name.trim();
          if (!value) { setError('프로젝트 이름을 입력해주세요.'); nameRef.current?.focus(); return; }
          setFeedback(`${value} 프로젝트를 만들었습니다.`);
          toastOrigin.current = formTrigger.current;
          setToast({message:`${value} 프로젝트가 생성되었습니다.`, variant:'success'});
          setDialog(null);
        }}>
          <TextField ref={nameRef} label="프로젝트 이름" name="project" value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="예: 앱 리디자인" maxLength={40} required error={error || undefined} />
          <div className="dialog-actions"><Button variant="outline" onClick={() => setDialog(null)}>취소</Button><Button type="submit">만들기</Button></div>
        </form>
      </Dialog>
      <p className="react-studio-caption">다이얼로그 안에서는 Tab으로 이동하고 Escape로 취소할 수 있습니다. 취소하면 실행 버튼으로 돌아갑니다.</p>
    </Section>
    <Section title="구분선이 있는 다이얼로그" description="헤더·본문·하단을 회색 구분선으로 나눕니다. 긴 내용은 본문 안에서만 스크롤되며, 제목과 하단 버튼은 계속 표시됩니다.">
      <div className="react-studio-field-grid">
        <div className="react-studio-example"><h3 className="react-studio-example-title">기본 구성</h3><p className="react-studio-caption">제목과 닫기, 상세 내용, 확인 버튼을 세 영역으로 구성합니다.</p><div className="react-studio-row"><Button variant="outline" onClick={() => setDialog('divided')}>구분선 타입 열기</Button></div></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">긴 본문</h3><p className="react-studio-caption">본문을 스크롤해도 헤더와 하단 버튼의 위치는 유지됩니다.</p><div className="react-studio-row"><Button variant="outline" onClick={() => setDialog('divided-scroll')}>스크롤 타입 열기</Button></div></div>
      </div>
      <p role="status" className="component-helper">{dividedFeedback}</p>
      <Dialog variant="divided" open={dialog === 'divided'} onOpenChange={closeDialog} closeOnBackdrop aria-labelledby="studio-divided-title" aria-describedby="studio-divided-description">
        <DialogHeader><div><h2 id="studio-divided-title">프로젝트 상세</h2><p id="studio-divided-description">프로젝트의 기본 정보와 공유 범위를 확인합니다.</p></div><button type="button" className="icon-button" aria-label="프로젝트 상세 닫기" onClick={() => setDialog(null)}><Icon name="close" /></button></DialogHeader>
        <DialogBody><div className="react-studio-stack"><div><Badge variant="primary">진행 중</Badge></div><DetailRows style={{margin:0}} items={[["프로젝트", "디자인 시스템 고도화"], ["담당 팀", "프로덕트 디자인"], ["공유 범위", "초대한 팀원만"], ["최근 수정", "2026-11-03"]]} /><p>공통 컴포넌트와 패턴을 정리하고, 제품 전반에 일관된 사용 경험을 적용합니다.</p></div></DialogBody>
        <DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>취소</Button><Button onClick={() => { setDialog(null); setDividedFeedback('프로젝트 상세를 확인했습니다.'); }}>확인</Button></DialogFooter>
      </Dialog>
      <Dialog variant="divided" style={{maxHeight:'min(640px, calc(100dvh - 32px))'}} open={dialog === 'divided-scroll'} onOpenChange={closeDialog} closeOnBackdrop aria-labelledby="studio-divided-scroll-title" aria-describedby="studio-divided-scroll-description">
        <DialogHeader><div><h2 id="studio-divided-scroll-title">프로젝트 운영 안내</h2><p id="studio-divided-scroll-description">본문을 스크롤해 항목별 안내를 확인하세요.</p></div><button type="button" className="icon-button" aria-label="운영 안내 닫기" onClick={() => setDialog(null)}><Icon name="close" /></button></DialogHeader>
        <DialogBody aria-label="운영 안내 본문"><div className="react-studio-stack">{[
          ['프로젝트 개요', '프로젝트의 목적과 작업 범위를 팀원에게 공유합니다. 목표와 완료 기준을 먼저 정리하면 작업 과정에서 같은 기준으로 의사결정할 수 있습니다.'],
          ['팀원과 역할', '프로젝트에 필요한 팀원을 초대하고 담당 역할을 정합니다. 새로운 팀원이 참여하면 진행 중인 작업과 필요한 자료를 함께 안내해주세요.'],
          ['공유 범위', '초대된 팀원만 프로젝트 내용을 확인할 수 있습니다. 외부에 자료를 전달하기 전에는 공유 대상과 공개할 정보의 범위를 확인해주세요.'],
          ['작업 상태', '시작 전, 진행 중, 검토 중, 완료 상태를 사용해 작업 흐름을 관리합니다. 상태를 변경할 때는 다음 작업자가 확인할 내용을 함께 남겨주세요.'],
          ['일정 관리', '시작일과 마감일을 등록하고 변경사항을 팀원과 공유합니다. 일정이 조정되면 연결된 작업의 마감일과 검토 시간도 함께 확인해주세요.'],
          ['검토와 피드백', '검토가 필요한 부분과 원하는 피드백을 구체적으로 적습니다. 결정을 마친 뒤에는 반영한 내용과 남은 작업을 기록해 다음 단계를 이어갑니다.'],
          ['파일과 문서', '최신 문서를 쉽게 찾을 수 있도록 파일명과 저장 위치를 정리합니다. 확정된 자료와 작업 중인 자료를 구분하고 관련 작업에 링크를 연결해주세요.'],
          ['변경 기록', '주요 결정과 변경 이유를 기록해 이후에 맥락을 확인할 수 있도록 합니다. 영향을 받는 화면이나 컴포넌트가 있다면 함께 기재해주세요.'],
          ['알림 설정', '필요한 채널에서 중요한 변경사항을 받아보세요. 담당자가 바뀌거나 검토 요청이 생겼을 때 필요한 사람이 안내를 받을 수 있도록 설정합니다.'],
          ['프로젝트 완료', '완료 기준을 확인하고 남아 있는 작업과 전달할 자료를 정리합니다. 운영 중 참고할 문서를 남기고 후속 작업의 담당자를 명확하게 안내해주세요.'],
        ].map(([title,description], index) => <section key={title}><h3 className="react-studio-example-title">{index + 1}. {title}</h3><p>{description}</p></section>)}</div></DialogBody>
        <DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>취소</Button><Button onClick={() => { setDialog(null); setDividedFeedback('프로젝트 운영 안내를 확인했습니다.'); }}>확인</Button></DialogFooter>
      </Dialog>
    </Section>
    <Section title="토스트" description="작업 결과를 짧게 알립니다. 아래 예시는 화면 오른쪽 아래에 하나씩 표시되며, 직접 닫을 때까지 유지됩니다.">
      <div className="react-studio-sample-grid">
        <div className="react-studio-example"><h3 className="react-studio-example-title">완료 안내</h3><p className="react-studio-caption">작업을 방해하거나 포커스를 이동하지 않고 결과를 알립니다.</p><div className="react-studio-row"><Button variant="secondary" onClick={event => { toastOrigin.current = event.currentTarget; setToast({message:'변경사항이 저장되었습니다.', variant:'success'}); }}>알림 표시</Button></div></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">오류와 재시도</h3><p className="react-studio-caption">저장 실패를 재현합니다. 다시 시도하면 완료 안내로 바뀝니다.</p><div className="react-studio-row"><Button variant="outline" onClick={event => { toastOrigin.current = event.currentTarget; setToast({message:'저장하지 못했습니다. 다시 시도해주세요.', variant:'danger', action:'retry'}); }}>오류 알림 표시</Button></div></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">실행 취소</h3><p className="react-studio-caption">초안 문서를 보관한 뒤 알림에서 실행 취소할 수 있습니다.</p><div className="react-studio-row"><Button variant="outline" onClick={event => { toastOrigin.current = event.currentTarget; setArchived(true); setToast({message:'초안 문서를 보관했습니다.', variant:'info', action:'undo'}); }}>항목 보관</Button></div><p role="status" className="component-helper">{archived ? '초안 문서 · 보관됨' : '초안 문서 · 목록에 표시 중'}</p></div>
      </div>
      <p className="react-studio-caption">새 알림은 이전 알림을 교체합니다. 필수 오류 안내는 해당 입력란에도 함께 표시합니다.</p>
      {toast && <Toast variant={toast.variant} onDismiss={dismissToast} action={toast.action && <Button variant="ghost" onClick={() => { if (toast.action === 'undo') { setArchived(false); dismissToast(); } else { setToast({message:'다시 시도해 변경사항을 저장했습니다.', variant:'success'}); toastOrigin.current?.focus(); } }}>{toast.action === 'undo' ? '실행 취소' : '다시 시도'}</Button>}>{toast.message}</Toast>}
    </Section>
  </>;
}

export function TooltipDemos() {
  return <Section title="기본 툴팁" description="버튼에 마우스를 올리거나 키보드로 포커스하면 보조 설명을 표시합니다. 버튼을 실행하거나 Escape 키를 누르면 닫힙니다.">
    <div className="react-studio-field-grid">
      <div className="react-studio-example"><h3 className="react-studio-example-title">텍스트 버튼</h3><div className="react-studio-row"><Tooltip content="프로젝트를 구분할 수 있는 이름입니다."><Button variant="outline">프로젝트 이름</Button></Tooltip></div></div>
      <div className="react-studio-example"><h3 className="react-studio-example-title">아이콘 버튼</h3><div className="react-studio-row"><Tooltip content="화면에 표시할 항목을 설정합니다."><button type="button" className="icon-button" aria-label="표시 설정 도움말"><Icon name="settings" /></button></Tooltip></div></div>
    </div>
    <p className="react-studio-caption">필수 설명과 오류 안내는 툴팁 안에만 넣지 않습니다.</p>
  </Section>;
}

export function CardDemos() {
  return <>
    <Section title="기본 카드" description="제목, 요약, 상태와 보조 정보를 같은 순서로 배치합니다.">
      <div className="react-studio-field-grid"><Card><span className="card-label">PROJECT</span><h3>디자인 시스템</h3><p>일관된 제품 경험을 위한 공통 기준을 만듭니다.</p><div className="card-footer"><Badge variant="primary">진행 중</Badge><span>최근 수정 · 오늘</span></div></Card><Card><span className="card-label">GUIDE</span><h3>브랜드 가이드</h3><p>브랜드의 시각 언어와 사용 원칙을 정리합니다.</p><div className="card-footer"><Badge>검토 중</Badge><span>최근 수정 · 어제</span></div></Card></div>
    </Section>
    <Section title="동작이 있는 카드" description="카드 전체를 누르게 만들기보다 이동할 곳을 설명하는 링크를 제공합니다.">
      <Card><span className="card-label">RESOURCE</span><h3>컴포넌트 살펴보기</h3><p>자주 쓰는 UI 요소와 사용 예시를 확인합니다.</p><div className="card-footer"><a className="button button--outline button-inline" href="#/components/buttons">컴포넌트 보기 <Icon name="arrow-right" /></a></div></Card>
    </Section>
    <Section title="아이콘이 있는 카드" description="아이콘으로 콘텐츠 종류를 보조하고 제목과 설명을 함께 표시합니다."><div className="react-studio-field-grid"><Card><h3 className="react-studio-icon-label"><Icon name="grid" />컴포넌트</h3><p>공통 요소와 사용 예시를 확인합니다.</p></Card><Card><h3 className="react-studio-icon-label"><Icon name="calendar" />일정</h3><p>프로젝트 일정을 확인합니다.</p></Card></div></Section>
  </>;
}
