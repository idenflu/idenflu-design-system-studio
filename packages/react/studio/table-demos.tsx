import * as React from 'react';
import { Badge, Pagination, Segmented, Table, TableContainer } from '../src';
import { Section } from './demo-layout';

type StatusVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
const projectStatus: Record<string, StatusVariant> = {
  '준비 중': 'neutral', '진행 중': 'primary', '검토 중': 'warning', '완료': 'success', '보류': 'neutral', '지연': 'danger',
};
const projects = [
  { name: '디자인 시스템', team: '프로덕트 디자인', owner: '김민수', status: '진행 중' },
  { name: '브랜드 가이드', team: '브랜드 디자인', owner: '이서연', status: '완료' },
  { name: '웹사이트 접근성 및 사용성 개선', team: '프론트엔드', owner: '박지훈', status: '검토 중' },
  { name: '모바일 앱 온보딩', team: '프로덕트 디자인', owner: '정수빈', status: '준비 중' },
  { name: '고객 지원 워크스페이스', team: '서비스 기획', owner: '최유진', status: '진행 중' },
  { name: '결제·정산 관리', team: '플랫폼 개발', owner: '한도윤', status: '지연' },
  { name: '글로벌 서비스 다국어 지원', team: '콘텐츠', owner: '윤서현', status: '검토 중' },
  { name: '사용자 리서치 저장소', team: 'UX 리서치', owner: null, status: '보류' },
  { name: '분석 대시보드', team: '데이터', owner: '김민수', status: '진행 중' },
  { name: '파트너 포털', team: '서비스 기획', owner: '최유진', status: '준비 중' },
  { name: '알림 센터', team: '프론트엔드', owner: '박지훈', status: '완료' },
  { name: '검색 경험 개선', team: '플랫폼 개발', owner: '한도윤', status: '검토 중' },
  { name: '2026 연간 브랜드 캠페인 운영 가이드', team: '브랜드 디자인', owner: '이서연', status: '진행 중' },
  { name: '문서·도움말 개편', team: '콘텐츠', owner: '윤서현', status: '완료' },
  { name: '관리자 권한 설정', team: '플랫폼 개발', owner: null, status: '준비 중' },
  { name: '프로젝트 아카이브', team: '프로덕트 디자인', owner: '정수빈', status: '보류' },
];

const members = [
  { name: '김민수', email: 'minsu.kim@idenflu.com', team: '프로덕트 디자인', joined: '2026-01-12', status: '활성', variant: 'success' },
  { name: 'Alexandra Lee', email: 'alexandra.lee@global-partner.example.com', team: '글로벌 서비스', joined: '2026-04-08', status: '활성', variant: 'success' },
  { name: '이서연', email: 'seoyeon@idenflu.com', team: '브랜드 디자인', joined: '2026-07-21', status: '활성', variant: 'success' },
  { name: '박지훈', email: 'jihoon.park@idenflu.com', team: '프론트엔드', joined: '2026-10-28', status: '초대 중', variant: 'warning' },
  { name: '윤서현', email: 'seohyun.yoon@idenflu.com', team: null, joined: null, status: '초대 중', variant: 'warning' },
  { name: '최유진', email: 'yujin.choi@idenflu.com', team: '서비스 기획', joined: '2026-03-16', status: '비활성', variant: 'neutral' },
] as const;

const invoices = [
  { id: 'INV-2026-1101', name: '워크스페이스 Pro · 11월', date: '2026-11-01', quantity: 24, amount: 720000, status: '결제 완료', variant: 'success' },
  { id: 'INV-2026-1102', name: '스토리지 추가 사용', date: '2026-11-01', quantity: 350, amount: 87500, status: '결제 예정', variant: 'primary' },
  { id: 'INV-2026-1103', name: '연간 플랜 전환 크레딧', date: '2026-11-02', quantity: 1, amount: -85000, status: '환불 완료', variant: 'neutral' },
  { id: 'INV-2026-1104', name: 'Enterprise · 조직 통합 이용료', date: '2026-11-02', quantity: 120, amount: 3600000, status: '미납', variant: 'danger' },
  { id: 'INV-2026-1105', name: '무료 체험 워크스페이스', date: '2026-11-03', quantity: 5, amount: 0, status: '무료', variant: 'neutral' },
] as const;

const formatNumber = new Intl.NumberFormat('ko-KR');
const formatDate = (date: string) => date.replace(/-/g, '.');

export function TableDemos() {
  const [page, setPage] = React.useState(1);
  const [density, setDensity] = React.useState<'default' | 'compact'>('default');
  const pageSize = 4;
  const visible = projects.slice((page - 1) * pageSize, page * pageSize);
  const invoiceTotal = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return <>
    <Section title="테이블과 페이지" description="16개 프로젝트를 4개씩 표시합니다. 행 밀도를 전환하거나 페이지를 바꿔 다양한 길이와 상태의 데이터를 확인하세요.">
      <div className="react-studio-table-toolbar">
        <p className="react-studio-caption">기본은 여유 있게, compact는 더 많은 행을 한 화면에 표시합니다.</p>
        <Segmented label="프로젝트 테이블 밀도" size="sm" value={density} options={[{ value: 'default', label: 'Default' }, { value: 'compact', label: 'Compact' }]} onValueChange={value => setDensity(value === 'compact' ? 'compact' : 'default')} />
      </div>
      <TableContainer label="프로젝트 목록">
        <Table density={density} className="react-studio-table react-studio-table--projects">
          <caption className="sr-only">프로젝트별 담당 팀·담당자와 진행 상태</caption>
          <colgroup><col className="table-col-project" /><col className="table-col-team" /><col className="table-col-owner" /><col className="table-col-status" /></colgroup>
          <thead><tr><th scope="col">프로젝트</th><th scope="col">담당 팀</th><th scope="col">담당자</th><th scope="col">상태</th></tr></thead>
          <tbody>{visible.map(row => <tr key={row.name}><td>{row.name}</td><td>{row.team}</td><td>{row.owner ?? <span className="table-muted">미지정</span>}</td><td><Badge variant={projectStatus[row.status]}>{row.status}</Badge></td></tr>)}</tbody>
        </Table>
      </TableContainer>
      <div className="react-studio-table-footer">
        <p role="status" className="component-helper">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, projects.length)} / {projects.length}개 프로젝트</p>
        <Pagination page={page} pageCount={Math.ceil(projects.length / pageSize)} onPageChange={setPage} />
      </div>
    </Section>

    <Section title="멤버와 보조 정보" description="이름·이메일을 함께 표시하고, 긴 영문 주소와 미지정 항목을 처리합니다. 빈 값에는 의미가 분명한 문구를 사용합니다.">
      <TableContainer label="워크스페이스 멤버 목록">
        <Table className="react-studio-table react-studio-table--members">
          <caption className="sr-only">워크스페이스 멤버의 이메일·팀·가입일과 계정 상태</caption>
          <colgroup><col className="table-col-member" /><col className="table-col-team" /><col className="table-col-date" /><col className="table-col-status" /></colgroup>
          <thead><tr><th scope="col">멤버</th><th scope="col">소속 팀</th><th scope="col">가입일</th><th scope="col">상태</th></tr></thead>
          <tbody>{members.map(member => <tr key={member.email}><td><span className="table-primary">{member.name}</span><span className="table-secondary">{member.email}</span></td><td>{member.team ?? <span className="table-muted">미지정</span>}</td><td className="table-date">{member.joined ? <time dateTime={member.joined}>{formatDate(member.joined)}</time> : <span className="table-muted">가입 전</span>}</td><td><Badge variant={member.variant}>{member.status}</Badge></td></tr>)}</tbody>
        </Table>
      </TableContainer>
      <p className="react-studio-caption">전체 6명 · 활성 3명 · 초대 중 2명 · 비활성 1명</p>
    </Section>

    <Section title="금액과 날짜 · Compact" description="숫자는 오른쪽에 정렬하고, 날짜와 금액은 자릿수 폭을 맞춥니다. 0원·환불 금액과 합계 행을 포함한 정산 예시입니다.">
      <TableContainer label="11월 청구 내역">
        <Table density="compact" className="react-studio-table react-studio-table--billing">
          <caption className="sr-only">2026년 11월 이용 요금·수량·청구 금액과 결제 상태</caption>
          <colgroup><col className="table-col-invoice" /><col className="table-col-date" /><col className="table-col-quantity" /><col className="table-col-amount" /><col className="table-col-status" /></colgroup>
          <thead><tr><th scope="col">청구 항목</th><th scope="col">청구일</th><th scope="col" className="table-numeric">수량</th><th scope="col" className="table-numeric">금액</th><th scope="col">상태</th></tr></thead>
          <tbody>{invoices.map(invoice => <tr key={invoice.id}><td><span className="table-primary">{invoice.name}</span><span className="table-secondary">{invoice.id}</span></td><td className="table-date"><time dateTime={invoice.date}>{formatDate(invoice.date)}</time></td><td className="table-numeric">{formatNumber.format(invoice.quantity)}</td><td className="table-numeric">{formatNumber.format(invoice.amount)}원</td><td><Badge variant={invoice.variant}>{invoice.status}</Badge></td></tr>)}</tbody>
          <tfoot><tr><th scope="row" colSpan={3}>합계</th><td className="table-numeric">{formatNumber.format(invoiceTotal)}원</td><td>5건</td></tr></tfoot>
        </Table>
      </TableContainer>
      <p className="react-studio-caption">통화: KRW · 음수 금액은 환불 또는 크레딧을 의미합니다. 좁은 화면에서는 각 표를 가로로 스크롤하세요.</p>
    </Section>
  </>;
}
