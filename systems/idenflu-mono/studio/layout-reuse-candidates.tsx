import * as React from 'react';
import { Table, TableContainer } from '@idenflu/mono-react';
import { Section } from './demo-layout';

const candidates = [
  ['제공', 'PageHeader', '@idenflu/mono-react', '제목·설명·보조 제목·주요 작업 슬롯', '프로젝트·멤버·역할 등 목록과 상세의 제목 영역'],
  ['1차', 'FilterBar', 'ProjectsPage / MembersPage', '검색 조건·조회·초기화·추가 작업의 배치', '필터 값·조회 시점·삭제 권한은 호출 화면에서 관리'],
  ['1차', 'MasterDetail', 'MasterDetailPage / RoleManagementPage', '목록·상세 슬롯, 남은 높이 채움과 각 영역 스크롤', '항목 데이터·선택·미저장 변경 정책은 호출 화면에서 관리'],
  ['2차', 'WorkspaceShell', 'SidebarLayoutSample / SidebarNavigation', '사이드바·탑바·콘텐츠 슬롯과 모바일 탐색 전환', '메뉴 정의·인증·브라우저 라우팅과 분리'],
  ['2차', 'WorkspaceTabs', 'WorkspaceTabsToolbar / Tabs 조합', '열린 탭 탐색·스크롤·닫기·목록 메뉴', '탭 저장·URL·닫기 전 확인은 호출 앱과 연결'],
  ['2차', 'CommandPalette', '빠른 검색 Dialog', '검색 입력·그룹별 결과·선택·빈 결과 표시', '메뉴·프로젝트 검색 데이터와 이동 동작은 외부에서 제공'],
  ['2차', 'NotificationList', '업무 알림 Popover', '아이콘·제목·본문·시간·읽음 표시의 행 구성', '알림 조회·읽음 저장·시간 계산과 이동은 외부에서 제공'],
  ['3차', 'SaveBar / FormActions', '역할 상세 하단 / 폼 패턴', '변경 요약·취소·저장·처리 중 상태의 배치', '검증·저장·실패·미저장 변경 상태는 호출 화면에서 관리'],
] as const;

export function LayoutReuseCandidates() {
  return <Section id="layout-reuse-candidates" title="재사용 후보" description="PageHeader는 공개 컴포넌트로 제공하며 제목 영역에 공통 적용합니다. 나머지는 현재 업무 샘플에서 추출을 검토할 후보입니다.">
    <TableContainer label="업무 화면 재사용 후보">
      <Table density="compact">
        <thead><tr><th scope="col" style={{whiteSpace:'nowrap'}}>우선</th><th scope="col">후보</th><th scope="col">현재 구현</th><th scope="col">추출 범위</th><th scope="col">적용·분리 기준</th></tr></thead>
        <tbody>{candidates.map(([priority, name, current, scope, boundary]) => <tr key={name}><td>{priority}</td><th scope="row">{name === 'PageHeader' ? <a href="#/components/page-header">{name}</a> : name}</th><td>{current}</td><td>{scope}</td><td>{boundary}</td></tr>)}</tbody>
      </Table>
    </TableContainer>
    <p className="component-helper">PageHeader 다음 후보는 FilterBar·MasterDetail입니다. 권한 편집·프로젝트 상태 전환·초대 같은 업무 규칙은 화면별로 유지합니다.</p>
  </Section>;
}
