import * as React from 'react';
import { Badge, Button, Icon } from '@idenflu/mono-react';
import { PageHeader } from './page-heading';
import { Section } from './demo-layout';

/** A project-owned composition using public package components. */
export function PageHeaderExample({headingLevel = 1}: {headingLevel?: 1 | 2 | 3 | 4 | 5 | 6}) {
  const [message, setMessage] = React.useState('');
  return <div className="react-studio-stack">
    <PageHeader eyebrow="PROJECT MANAGEMENT" title="전체 프로젝트" headingLevel={headingLevel}
      description="팀의 프로젝트를 검색하고 진행 상황을 관리하세요."
      actions={<>
        <Button variant="outline" onClick={() => setMessage('프로젝트 내보내기를 선택했습니다.')}><Icon name="download" />내보내기</Button>
        <Button onClick={() => setMessage('새 프로젝트 만들기를 선택했습니다.')}><Icon name="add" />새 프로젝트</Button>
      </>} />
    <p className="component-helper" role="status">{message || '오른쪽 작업은 호출 화면에서 연결합니다.'}</p>
  </div>;
}

export function PageHeaderDemos() {
  return <>
    <Section id="page-header-basic" title="제목과 화면 작업" description="화면의 목적과 주요 작업을 한 영역에 모읍니다. 프로젝트 목록·조직 관리·설비 화면에서 같은 제목 위계와 작업 배치를 사용합니다.">
      <div className="react-studio-example"><PageHeaderExample headingLevel={3} /></div>
    </Section>
    <Section id="page-header-content" title="선택 영역과 긴 제목" description="설명·분류·작업은 필요한 영역만 지정합니다. 긴 제목과 설명은 줄바꿈하며, 작업은 제목의 가용 너비를 침범하지 않습니다.">
      <div className="react-studio-stack">
        <div className="react-studio-example"><PageHeader title="멤버 관리" headingLevel={3} description="워크스페이스에 참여한 멤버와 역할을 확인하세요." /></div>
        <div className="react-studio-example"><PageHeader eyebrow="EQUIPMENT MANAGEMENT" headingLevel={3}
          title={<>물류 1동 입고 구간 컨베이어와 하위 유닛 관리 <Badge variant="success">가동 중</Badge></>}
          description="여러 유닛으로 구성된 컨베이어의 기본 정보와 점검 상태를 확인하고, 선택한 설비의 관리 작업을 진행합니다."
          actions={<><Button variant="outline"><Icon name="download" />점검 이력 내보내기</Button><Button><Icon name="edit" />기본 정보 수정</Button></>} /></div>
        <div className="react-studio-example"><PageHeader title="워크스페이스 설정" headingLevel={3} /></div>
      </div>
    </Section>
    <Section id="page-header-composition" title="구성 방법" description="화면 제목 영역은 프로젝트에서 정의하고 패키지의 Button, Icon, Badge와 디자인 토큰을 조합합니다.">
      <p>제목은 필수로 두고 분류, 설명, 화면 작업은 필요한 경우에만 추가합니다. 검색 조건과 데이터 상태는 별도 영역에서 관리합니다.</p>
      <p>예제의 PageHeader와 CSS는 프로젝트에 맞춰 수정하는 구현 예시이며 패키지의 공개 API가 아닙니다.</p>
    </Section>
    <Section id="page-header-guide" title="사용 기준과 스타일" description="제목 수준은 정보 구조에 맞추고, 시각 크기는 디자인 토큰으로 일관되게 유지합니다.">
      <ul className="react-studio-stack">
        <li>업무 화면의 대표 제목에는 기본 h1을 사용합니다. 같은 페이지의 하위 영역에는 headingLevel을 지정해 제목 순서를 유지합니다.</li>
        <li>주요 작업은 짧은 문구의 버튼으로 제공하고, 필터·탭·목록은 제목 뒤의 별도 영역에 배치합니다.</li>
        <li>제목·분류·설명 다음에 작업이 오는 DOM 순서를 유지합니다. 좁은 화면에서 작업은 아래로 이동하며 텍스트를 생략하지 않습니다.</li>
        <li>자체 바깥 여백·패딩·배경·구분선을 추가하지 않습니다. 호출 화면의 Grid·간격 토큰·컨테이너로 배치하세요.</li>
      </ul>
      <p className="react-studio-caption"><code>.page-header-content</code>·<code>.page-header-title</code>·<code>.page-header-description</code>·<code>.page-header-eyebrow</code>·<code>.page-header-actions</code>는 예제에서 사용하는 프로젝트 전용 클래스입니다. 색상은 <code>--text</code>·<code>--text-secondary</code>, 간격과 글자 크기는 공유 토큰을 따릅니다.</p>
    </Section>
  </>;
}
