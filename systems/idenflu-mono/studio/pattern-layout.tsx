import * as React from 'react';
import { Card, CardTitle, CardDescription, Grid, Icon, Table, TableContainer } from '@idenflu/mono-react';
import { Section } from './demo-layout';
import { LayoutReuseCandidates } from './layout-reuse-candidates';

export function LayoutPattern() {
  return <>
    <Section title="사이드바형 개요" description="여러 업무 영역을 오가면서 현재 위치를 유지하는 레이아웃입니다. 관리 도구나 프로젝트 관리처럼 메뉴와 작업이 많은 화면에 사용합니다.">
      <article className="layout-pattern-card">
        <div className="layout-diagram" aria-hidden="true"><div className="layout-diagram-nav"><b>사이드바</b><i /><i className="is-active" /><i /><i /></div><div className="layout-diagram-header"><b>탑바</b><span /><span /></div><div className="layout-diagram-content"><div className="layout-diagram-tabs"><i/><i/></div><b>콘텐츠 영역</b><div className="layout-diagram-title" /><div className="layout-diagram-tiles"><i /><i /><i /></div><div className="layout-diagram-lines"><i /><i /><i /></div></div></div>
        <div className="layout-pattern-card-body"><p className="layout-pattern-index">SIDEBAR WORKSPACE</p><h3>사이드바형</h3><p>사이드바의 트리 메뉴로 업무를 탐색하고, 탑바에서 검색·알림·계정을 관리합니다. 선택한 화면은 콘텐츠 영역에 탭으로 쌓여 여러 업무를 이어서 처리할 수 있습니다.</p>
          <dl><div><dt>구성</dt><dd>사이드바 · 탑바 · 콘텐츠 탭과 작업 영역</dd></div><div><dt>추천 화면</dt><dd>관리자 도구, 프로젝트 관리, 사내 업무 시스템</dd></div><div><dt>선택 기준</dt><dd>계층형 메뉴가 많고 여러 작업을 번갈아 처리할 때</dd></div></dl>
          <a className="button button-inline" href="?layout=sidebar" target="_blank" rel="noopener noreferrer" aria-label="사이드바형 샘플 화면 열기 (새 탭)">샘플 화면 열기 <span aria-hidden="true">↗</span></a><small>새 탭에서 실제 화면이 열립니다.</small>
        </div>
      </article>
    </Section>
    <Section id="layout-equipment-examples" title="설비 관리 예시" description="카드로 설비를 탐색하고, 단계별로 등록하고, 캘린더에서 점검 일정을 관리합니다. 아래 링크로 실제 업무 화면을 열어보세요.">
      <Grid columns={{base:1,md:2,xl:3}} gap={6}>
        <Card className="layout-pattern-example"><Icon name="grid"/><CardTitle>카드형 설비 목록</CardTitle><CardDescription>컨베이어의 상태·위치·유닛 수를 비교하고 검색·상태 필터로 대상을 찾습니다. 상세 Drawer에서 기본 정보와 하위 유닛을 확인합니다.</CardDescription><a className="button button--outline button-inline" href="?layout=sidebar#/equipment/conveyors" target="_blank" rel="noopener noreferrer" aria-label="컨베이어 카드형 목록 샘플 열기 (새 탭)">카드형 목록 열기 <span aria-hidden="true">↗</span></a></Card>
        <Card className="layout-pattern-example"><Icon name="list"/><CardTitle>단계형 설비 등록</CardTitle><CardDescription>기본 정보 → 하위 유닛 → 최종 검토의 순서로 등록합니다. 이전 단계의 값을 유지하며 유닛을 추가·삭제하고 등록 결과를 목록에서 확인합니다.</CardDescription><a className="button button--outline button-inline" href="?layout=sidebar#/equipment/conveyors/new" target="_blank" rel="noopener noreferrer" aria-label="컨베이어 단계형 등록 샘플 열기 (새 탭)">단계형 등록 열기 <span aria-hidden="true">↗</span></a></Card>
        <Card className="layout-pattern-example"><Icon name="calendar"/><CardTitle>점검 일정 캘린더</CardTitle><CardDescription>월·주별 일정과 선택한 날짜의 점검을 확인합니다. 설비·상태 필터, 일정 등록·변경, 완료 결과 기록과 설비 상세 연결을 사용해보세요.</CardDescription><a className="button button--outline button-inline" href="?layout=sidebar#/equipment/inspections" target="_blank" rel="noopener noreferrer" aria-label="점검 일정 캘린더 샘플 열기 (새 탭)">점검 캘린더 열기 <span aria-hidden="true">↗</span></a></Card>
      </Grid>
    </Section>
    <Section title="샘플에서 확인할 동작" description="기존 컴포넌트를 조합한 프로젝트·설비 관리 화면에서 레이아웃을 살펴보세요.">
      <div className="layout-pattern-features">{[
        ['트리 탐색과 동적 탭','하위 메뉴를 선택하면 탭이 열립니다. 이미 열린 화면은 해당 탭으로 이동하며 메뉴의 선택 표시도 함께 바뀝니다.'],
        ['여러 업무 이어가기','목록의 검색 조건과 설정 입력값은 탭을 전환해도 유지됩니다. 프로젝트 상세에서 바꾼 상태는 목록에도 반영됩니다.'],
        ['실제 업무 흐름','프로젝트 생성·수정·선택 삭제·멤버 초대·빠른 검색·알림을 사용해보세요. 공통 Tree, Tabs, DataGrid, Dialog 등을 조합했습니다.'],
      ].map(([title,description])=><div key={title}><Icon name="check" /><h3>{title}</h3><p>{description}</p></div>)}</div>
    </Section>
    <Section title="반응형 구성" description="탐색과 주요 작업을 화면 크기에 맞춰 유지합니다.">
      <TableContainer label="사이드바형 반응형 구성"><Table><thead><tr><th scope="col">화면</th><th scope="col">구성</th></tr></thead><tbody><tr><th scope="row">넓은 화면</th><td>사이드바와 탑바를 고정하고 활성 콘텐츠 영역 안에서 스크롤합니다.</td></tr><tr><th scope="row">데이터그리드 화면</th><td>제목과 필터 아래 남은 높이를 그리드가 채웁니다. 검색 도구와 페이지 영역은 유지하고 행 목록만 그리드 내부에서 세로 스크롤합니다.</td></tr><tr><th scope="row">900px 이하</th><td>메뉴 버튼으로 Drawer를 엽니다. 메뉴를 고르면 닫히고 해당 콘텐츠 탭이 활성화됩니다.</td></tr><tr><th scope="row">작은 화면의 탭과 표</th><td>각 영역 안에서 가로 스크롤하며, 활성 탭은 보이는 위치로 이동합니다.</td></tr></tbody></Table></TableContainer>
      <p className="react-studio-caption">탭은 닫기 버튼 또는 Delete 키로 닫습니다. 대시보드는 고정되며 방향키로 탭을 전환할 수 있습니다. 빠른 검색 단축키는 ⌘/Ctrl + K입니다.</p>
      <p className="react-studio-caption">샘플의 변경 사항은 현재 화면에서만 유지되며 새로고침하면 초기화됩니다.</p>
    </Section>
    <LayoutReuseCandidates />
  </>;
}
