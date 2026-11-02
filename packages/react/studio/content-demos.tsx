import * as React from 'react';
import { Accordion, AccordionItem, Alert, Badge, Button, Card, Dialog, Icon, Tabs, TextField, Toast, Tooltip } from '../src';
import { Section } from './demo-layout';

function DetailRows({items}: {items:readonly (readonly [string, string])[]}) {
  return <dl className="detail-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
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
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [feedback, setFeedback] = React.useState('새 프로젝트의 이름을 입력해보세요.');
  const [toast, setToast] = React.useState('');
  const nameRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (open) nameRef.current?.focus(); }, [open]);

  return <>
    <Section title="다이얼로그" description="이름 입력처럼 집중이 필요한 짧은 작업을 별도 창에서 진행합니다.">
      <div className="react-studio-row"><Button variant="outline" onClick={() => { setName(''); setError(''); setOpen(true); }}>다이얼로그 열기</Button></div>
      <p role="status" className="component-helper">{feedback}</p>
      <Dialog open={open} onOpenChange={setOpen} closeOnBackdrop aria-labelledby="studio-project-dialog-title" aria-describedby="studio-project-dialog-description">
        <button className="icon-button dialog-close" type="button" aria-label="다이얼로그 닫기" onClick={() => setOpen(false)}><Icon name="close" /></button>
        <h2 id="studio-project-dialog-title">새 프로젝트</h2><p id="studio-project-dialog-description">함께 시작할 프로젝트의 이름을 정해주세요.</p>
        <form noValidate onSubmit={event => {
          event.preventDefault();
          const value = name.trim();
          if (!value) { setError('프로젝트 이름을 입력해주세요.'); nameRef.current?.focus(); return; }
          setFeedback(`${value} 프로젝트를 만들었습니다.`);
          setToast(`${value} 프로젝트가 생성되었습니다.`);
          setOpen(false);
        }}>
          <TextField ref={nameRef} label="프로젝트 이름" name="project" value={name} onChange={event => { setName(event.target.value); setError(''); }} placeholder="예: 앱 리디자인" maxLength={40} required error={error || undefined} />
          <div className="dialog-actions"><Button variant="outline" onClick={() => setOpen(false)}>취소</Button><Button type="submit">만들기</Button></div>
        </form>
      </Dialog>
    </Section>
    <Section title="토스트" description="작업을 중단시키지 않고 짧은 완료 메시지를 표시합니다. 닫기 버튼으로 알림을 지울 수 있습니다.">
      <div className="react-studio-row"><Button variant="secondary" onClick={() => setToast('변경사항이 저장되었습니다.')}>알림 표시</Button></div>
      {toast && <Toast onDismiss={() => setToast('')}>{toast}</Toast>}
    </Section>
  </>;
}

export function TooltipDemos() {
  return <Section title="기본 툴팁" description="버튼에 마우스를 올리거나 키보드로 포커스하면 보조 설명을 표시합니다. Escape 키로 닫을 수 있습니다.">
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
