import * as React from 'react';
import { Badge, Button, Icon, PageHeader, Table, TableContainer, type PageHeaderProps } from '@idenflu/mono-react';
import { Section } from './demo-layout';
import { publicAPINote, publicAPIType, type APIContracts, type APIPropertyRow } from './public-api';

/** Kept independent so the copied example works with only the public package. */
export function PageHeaderExample({headingLevel = 1}: Pick<PageHeaderProps, 'headingLevel'>) {
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

const props: readonly APIPropertyRow[] = [
  ['title', '필수', '화면 제목입니다. 문자열이나 Badge 같은 짧은 보조 표시를 포함한 React 노드를 전달합니다.'],
  ['description', 'undefined', '제목 아래의 설명입니다. 생략하면 설명 영역을 만들지 않습니다.'],
  ['eyebrow', 'undefined', '제목 위의 짧은 분류·맥락입니다. 긴 설명은 description에 넣습니다.'],
  ['actions', 'undefined', '버튼·링크 등 화면 단위 작업입니다. 넓은 화면은 제목 오른쪽, 좁은 화면은 아래에 배치하고 작업끼리도 줄바꿈합니다.'],
  ['headingLevel', '1', '제목의 HTML 수준 h1–h6입니다. 화면 대표 제목은 기본 h1, 하위 영역이나 이 문서의 예제는 문서 구조에 맞춰 조정합니다. 글자 크기는 수준과 관계없이 같습니다.'],
  ['titleId', '자동 ID', '제목 요소의 ID입니다. 외부 aria-labelledby 등에서 제목을 참조할 때 지정합니다.'],
  ['id / className / style', 'undefined', '최상위 header에 전달합니다. 화면과의 간격·폭·배경은 외부 레이아웃에서 지정합니다.'],
  ['aria-label / aria-labelledby', '제목 ID 연결', '최상위 header의 접근 가능한 이름을 지정합니다. 별도 이름을 지정하지 않으면 표시한 제목과 연결됩니다.'],
  ['ref', 'undefined', '최상위 실제 header 요소를 가리킵니다. 제목 요소나 별도 명령 객체를 반환하지 않습니다.'],
];

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
    <Section id="page-header-props" title="속성 · PageHeader" description="PageHeader는 제목과 작업의 배치를 담당하며, 검색 조건이나 데이터 조회·저장 상태를 자체 관리하지 않습니다.">
      <p className="react-studio-caption">{publicAPINote}</p>
      <PageHeaderReference contracts="PageHeader" rows={props} />
      <p className="react-studio-caption">header의 표준 HTML 속성·이벤트·ARIA 속성도 전달할 수 있습니다. 표와 자동 검사는 컴포넌트 전용 속성 및 대표 공통 속성을 다룹니다. Button의 클릭·비활성·처리 중 상태는 actions에 전달한 컴포넌트에서 제어합니다.</p>
    </Section>
    <Section id="page-header-guide" title="사용 기준과 스타일" description="제목 수준은 정보 구조에 맞추고, 시각 크기는 디자인 토큰으로 일관되게 유지합니다.">
      <ul className="react-studio-stack">
        <li>업무 화면의 대표 제목에는 기본 h1을 사용합니다. 같은 페이지의 하위 영역에는 headingLevel을 지정해 제목 순서를 유지합니다.</li>
        <li>주요 작업은 짧은 문구의 버튼으로 제공하고, 필터·탭·목록은 PageHeader 뒤의 별도 영역에 배치합니다.</li>
        <li>제목·분류·설명 다음에 작업이 오는 DOM 순서를 유지합니다. 좁은 화면에서 작업은 아래로 이동하며 텍스트를 생략하지 않습니다.</li>
        <li>자체 바깥 여백·패딩·배경·구분선을 추가하지 않습니다. 호출 화면의 Grid·간격 토큰·컨테이너로 배치하세요.</li>
      </ul>
      <p className="react-studio-caption"><code>.page-header-content</code>·<code>.page-header-title</code>·<code>.page-header-description</code>·<code>.page-header-eyebrow</code>·<code>.page-header-actions</code>를 className 아래에서 조정할 수 있습니다. 색상은 <code>--text</code>·<code>--text-secondary</code>, 간격과 글자 크기는 공유 토큰을 따릅니다.</p>
    </Section>
  </>;
}

function PageHeaderReference({rows, contracts}: {rows: readonly APIPropertyRow[]; contracts: APIContracts}) {
  return <TableContainer label="PageHeader 속성" className="studio-convenience-api-table"><Table density="compact">
    <caption className="sr-only">PageHeader 속성: 타입, 기본값과 사용 방법</caption>
    <thead><tr><th scope="col">속성</th><th scope="col">타입</th><th scope="col">기본값</th><th scope="col">설명</th></tr></thead>
    <tbody>{rows.map(([name, initial, description]) => <tr key={name}><th scope="row"><code>{name}</code></th><td><code>{publicAPIType(contracts, name)}</code></td><td><code>{initial}</code></td><td>{description}</td></tr>)}</tbody>
  </Table></TableContainer>;
}
