import * as React from 'react';
import { Button, Icon, Select, Spinner, Switch, Table, TableContainer, TextField } from '../src';
import { Section } from './demo-layout';

const sizes = [
  {value:'sm', name:'Small', height:32, padding:10, icon:14, switchTrack:'28 × 16'},
  {value:'md', name:'Medium', height:38, padding:12, icon:16, switchTrack:'36 × 20'},
  {value:'lg', name:'Large', height:44, padding:16, icon:18, switchTrack:'44 × 24'},
] as const;

export function IconDemos() {
  const [message, setMessage] = React.useState('');
  const [bookmarked, setBookmarked] = React.useState(false);
  const pairs = ['home', 'folder', 'bell', 'chat', 'heart', 'star', 'bookmark', 'image', 'users', 'shield-check', 'dashboard', 'cart', 'credit-card', 'receipt', 'tag', 'briefcase', 'camera', 'location', 'send', 'help-circle'] as const;
  return <><Section title="아이콘 사용 예시" description="아이콘은 텍스트의 의미를 보조하고, 아이콘만 있는 버튼에는 접근 가능한 이름을 제공합니다.">
    <div className="react-studio-field-grid">
      <div className="react-studio-example"><h3 className="react-studio-example-title">텍스트와 함께</h3><div className="react-studio-row"><Button onClick={() => setMessage('저장을 선택했습니다.')}><Icon name="save" />저장</Button><Button variant="outline" onClick={() => setMessage('다운로드를 선택했습니다.')}><Icon name="download" />다운로드</Button></div></div>
      <div className="react-studio-example"><h3 className="react-studio-example-title">아이콘 버튼</h3><div className="react-studio-row"><Button iconOnly variant="outline" aria-label="알림" onClick={() => setMessage('알림을 선택했습니다.')}><Icon name="bell" /></Button><Button iconOnly variant="outline" aria-label="설정" onClick={() => setMessage('설정을 선택했습니다.')}><Icon name="settings" /></Button></div></div>
      <div className="react-studio-example"><h3 className="react-studio-example-title">입력 필드</h3><TextField label="프로젝트 검색" type="search" placeholder="프로젝트 검색" prefix={<Icon name="search" />} prefixDecorative /></div>
      <div className="react-studio-example"><h3 className="react-studio-example-title">선택 상태</h3><Button variant="outline" aria-label="북마크" aria-pressed={bookmarked} onClick={() => setBookmarked(value => !value)}><Icon name={bookmarked ? 'bookmark-fill' : 'bookmark'} />{bookmarked ? '북마크됨' : '북마크 추가'}</Button></div>
    </div>
    <p role="status" className="component-helper">{message}</p>
  </Section>
  <Section title="Outline / Filled" description="기본 탐색·동작에는 Outline을, 선택·활성 강조에는 Filled를 사용할 수 있습니다. 상태는 색이나 모양만으로 전달하지 않고 텍스트와 함께 표시합니다. 두 유형 모두 24 × 24 그리드를 사용합니다.">
    <ul className="react-studio-icon-pairs">{pairs.map(name => <li key={name}><span className="react-studio-caption">{name}</span><div className="react-studio-icon-pair"><span><Icon name={name} /><small>Outline</small></span><span><Icon name={`${name}-fill`} /><small>Filled</small></span></div></li>)}</ul>
  </Section></>;
}

export function TypographyDemos() {
  const scale = [
    {name:'Heading', metrics:'32 / 40 · Semibold', className:'sample-heading', text:'Form follows function.'},
    {name:'Section', metrics:'24 / 32 · Semibold', className:'sample-section', text:'명확한 구조, 일관된 경험.'},
    {name:'Body', metrics:'14 / 22 · Regular', className:'', text:'필요한 정보가 자연스럽게 읽히도록 간결한 문장과 여유 있는 행간을 사용합니다.'},
    {name:'Caption', metrics:'12 / 18 · Regular', className:'sample-caption', text:'보조 설명과 상태 정보를 전달하는 작은 텍스트입니다.'},
  ];
  return <>
    <Section title="Typeface" description="Pretendard를 사용해 한글·영문·숫자의 위계를 일관되게 표현합니다.">
      <div className="react-studio-field-grid">
        <div className="react-studio-example react-studio-stack">
          <p className="type-specimen" aria-hidden="true">Aa</p>
          <strong className="type-name">Pretendard</strong>
          <p className="react-studio-caption">간결한 인터페이스의 기준</p>
        </div>
        <div className="react-studio-example react-studio-stack">
          <h3 className="react-studio-example-title">한글·영문·숫자</h3>
          <p>일관된 경험을 만드는 디자인 시스템</p>
          <p lang="en">A precise foundation for everyday interfaces.</p>
          <p>프로젝트 Mono · 2026.11.02 · 12,500원</p>
          <p className="react-studio-caption">문자 종류가 섞인 문장에서도 같은 서체와 행간을 유지합니다.</p>
        </div>
      </div>
    </Section>
    <Section title="Type scale" description="수치는 기본 설정 기준입니다. 화면 조정에서 글자 크기와 행간을 바꾸면 아래 예시에도 반영됩니다.">
      <div className="react-studio-stack">
        {scale.map(item => <div className="react-studio-example react-studio-stack" key={item.name}>
          <span className="react-studio-caption">{item.name} · {item.metrics}</span>
          <p className={item.className || undefined}>{item.text}</p>
        </div>)}
      </div>
    </Section>
    <Section title="굵기" description="본문은 Regular, 강조는 Medium, 제목은 Semibold를 기본으로 사용합니다.">
      <div className="react-studio-field-grid">
        {([{name:'Regular', weight:400}, {name:'Medium', weight:500}, {name:'Semibold', weight:600}, {name:'Bold', weight:700}] as const).map(item => <div key={item.name} className="react-studio-example react-studio-stack">
          <span className="react-studio-caption">{item.name} · {item.weight}</span>
          <p style={{fontWeight:item.weight}}>디자인 시스템 · Design system</p>
        </div>)}
      </div>
    </Section>
    <Section title="타이포그래피 사용 예시" description="제목, 본문과 보조 설명에 역할에 맞는 크기와 굵기를 적용합니다. 화면 조정 값도 예시에 반영됩니다.">
      <div className="react-studio-field-grid">
        <div className="react-studio-example">
          <h3 className="react-studio-example-title">페이지 제목과 설명</h3>
          <p className="react-studio-caption">제목은 Heading, 설명은 Body, 부가 정보는 Caption을 사용합니다.</p>
          <div className="react-studio-type-example">
            <h4>프로젝트 설정</h4>
            <p>팀과 함께 작업할 프로젝트 정보를 관리합니다.</p>
            <p className="react-studio-type-meta">마지막 수정 · 2026.11.02</p>
          </div>
        </div>
        <div className="react-studio-example">
          <h3 className="react-studio-example-title">입력 라벨과 보조 설명</h3>
          <p className="react-studio-caption">입력 라벨은 Medium으로 구분하고, 보조 설명은 Caption으로 표시합니다.</p>
          <TextField label="프로젝트 이름" defaultValue="디자인 시스템" helperText="팀원이 알아보기 쉬운 이름을 입력해주세요." />
        </div>
      </div>
    </Section>
  </>;
}

export function SizeDemos() {
  const [message, setMessage] = React.useState('');
  return <>
    <Section title="사이즈 토큰" description="sm·md·lg에 같은 크기 규칙을 적용합니다. 표의 수치는 기본 설정 기준이며 화면 조정 값에 따라 실제 크기가 달라집니다.">
      <TableContainer label="사이즈 토큰">
        <Table>
          <thead><tr><th scope="col">Size</th><th scope="col">높이</th><th scope="col">좌우 패딩</th><th scope="col">아이콘</th><th scope="col">스위치 트랙</th></tr></thead>
          <tbody>{sizes.map(size => <tr key={size.value}><td>{size.value}{size.value === 'md' ? ' · 기본' : ''}</td><td>{size.height}px</td><td>{size.padding}px</td><td>{size.icon}px</td><td>{size.switchTrack}px</td></tr>)}</tbody>
        </Table>
      </TableContainer>
    </Section>
    <Section title="같은 크기로 조합" description="버튼·입력·선택 컨트롤의 크기를 함께 맞춰 비교해보세요.">
      <div className="react-studio-size-grid">
        {sizes.map(size => <section className="react-studio-example react-studio-stack" key={size.value} aria-label={`${size.name} 예시`}>
          <div><h3 className="react-studio-example-title">{size.name}</h3><p className="react-studio-caption">{size.value} · {size.height}px height</p></div>
          <div className="react-studio-row" style={{minHeight:'var(--size-lg-height)'}}>
            <Button size={size.value} onClick={() => setMessage(`${size.name} 버튼을 눌렀습니다.`)}><Icon name="plus" />새로 만들기</Button>
            <Button size={size.value} variant="outline" iconOnly aria-label={`${size.name} 추가`} onClick={() => setMessage(`${size.name} 아이콘 버튼을 눌렀습니다.`)}><Icon name="plus" /></Button>
          </div>
          <div style={{minHeight:'calc(var(--size-lg-height) + var(--line-height-control) + var(--space-2))'}}><TextField label={`${size.value.toUpperCase()} 입력`} size={size.value} defaultValue="idenflu mono" /></div>
          <div style={{minHeight:'calc(var(--size-lg-height) + var(--line-height-control) + var(--space-2))'}}><Select label={`${size.value.toUpperCase()} 옵션`} size={size.value} defaultValue="default" options={[{value:'default',label:'기본 옵션'},{value:'other',label:'다른 옵션'}]} /></div>
          <Switch label={`${size.name} 알림`} size={size.value} defaultChecked />
        </section>)}
      </div>
      <p className="component-helper" role="status">{message}</p>
    </Section>
  </>;
}

export function StateDemos() {
  const [feedback, setFeedback] = React.useState('');
  const [email, setEmail] = React.useState('minsu@');
  const [emailError, setEmailError] = React.useState('올바른 이메일 주소를 입력해주세요.');
  return <>
    <Section title="버튼 상태" description="기본·호버·눌림·포커스 모양을 나란히 비교합니다. 비활성과 처리 중 상태에서는 실행을 막습니다.">
      <div className="react-studio-size-grid">
        {[{label:'기본', state:''}, {label:'호버', state:'is-hovered'}, {label:'눌림', state:'is-pressed'}, {label:'포커스', state:'is-focused'}].map(item => <div className="react-studio-example react-studio-stack" key={item.label}>
          <span className="react-studio-caption">{item.label}</span>
          <div><Button className={item.state || undefined} aria-label={`${item.label} 상태 저장 버튼`} onClick={() => setFeedback(`${item.label} 상태 버튼을 눌렀습니다.`)}>저장</Button></div>
        </div>)}
        <div className="react-studio-example react-studio-stack"><span className="react-studio-caption">비활성</span><div><Button disabled>저장</Button></div></div>
        <div className="react-studio-example react-studio-stack"><span className="react-studio-caption">처리 중</span><div><Button disabled aria-busy="true"><Spinner size="small" variant="neutral" label="저장 중" />저장 중</Button></div></div>
      </div>
      <p className="component-helper" role="status">{feedback}</p>
    </Section>
    <Section title="입력 상태" description="오류는 색상과 문구로 전달합니다. 오류 예시는 이메일을 올바르게 입력하면 정상 상태로 돌아옵니다.">
      <div className="react-studio-field-grid">
        <TextField label="기본" placeholder="이름을 입력해주세요" helperText="입력하기 전의 기본 상태입니다." />
        <TextField label="입력값 있음" defaultValue="김민수" helperText="값을 자유롭게 수정할 수 있습니다." />
        <TextField label="포커스" defaultValue="김민수" className="is-focused" helperText="키보드 포커스의 외곽선을 미리 보여줍니다." />
        <TextField label="오류와 복구" type="email" value={email} error={emailError || undefined} helperText={emailError ? undefined : '올바른 이메일 형식입니다.'} onChange={event => { setEmail(event.currentTarget.value); setEmailError(!event.currentTarget.value.trim() ? '이메일 주소를 입력해주세요.' : event.currentTarget.validity.valid ? '' : '올바른 이메일 주소를 입력해주세요.'); }} />
        <TextField label="읽기 전용" defaultValue="디자인 시스템" readOnly helperText="값을 선택하거나 복사할 수 있습니다." />
        <TextField label="비활성" defaultValue="사용 불가" disabled helperText="조작과 폼 제출에서 제외됩니다." />
      </div>
    </Section>
  </>;
}
