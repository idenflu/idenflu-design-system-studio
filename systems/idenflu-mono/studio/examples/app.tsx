import * as React from 'react';
import '@idenflu/mono-react/reset.css';
import '@idenflu/mono-react/styles.css';
import { createRoot } from 'react-dom/client';
import { Button, Card, Checkbox, DatePicker, DateRangePicker, Grid, MultiSelect, NumberField, Select, Tabs, TextField, Tree } from '@idenflu/mono-react';

const options = [{ value: 'design', label: '디자인' }, { value: 'development', label: '개발' }, { value: 'operations', label: '운영' }];
function App() {
  const [date, setDate] = React.useState<string | null>('2026-11-02');
  return <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
    <p style={{ color: 'var(--text-secondary)' }}>IDENFLU MONO</p>
    <h1 style={{ fontSize: 32, margin: '8px 0 12px' }}>React 컴포넌트</h1>
    <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>패키지에서 불러온 컴포넌트를 직접 조작해 볼 수 있습니다.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24 }}>
      <Card><h2>입력</h2><Grid gap={5} style={{ marginTop: 20 }}>
        <TextField label="프로젝트 주소" prefix="idenflu.app /" defaultValue="mono" helperText="프로젝트의 짧은 이름을 입력하세요." />
        <NumberField label="예산" defaultValue="12.5" decimals={1} step="0.5" unit="만원" />
        <DatePicker label="시작일" value={date} onValueChange={setDate} />
        <DateRangePicker label="기간" />
      </Grid></Card>
      <Card><h2>선택과 탐색</h2><Grid gap={5} style={{ marginTop: 20 }}>
        <Select label="담당 팀" options={options} defaultValue="design" />
        <MultiSelect label="참여 팀" options={options} defaultValue={['design']} searchable />
        <Checkbox label="업데이트 알림" defaultChecked />
        <Tree label="프로젝트 메뉴" defaultExpanded={['project']} defaultValue="overview" items={[{ value: 'project', label: '프로젝트', children: [{ value: 'overview', label: '개요' }, { value: 'settings', label: '설정' }] }]} />
      </Grid></Card>
    </div>
    <div style={{ marginTop: 32 }}><Tabs label="예제 탭" items={[{ value: 'info', label: '기본 정보', content: '프로젝트의 기본 정보를 확인합니다.' }, { value: 'history', label: '활동', content: '최근 활동을 확인합니다.' }]} /></div>
    <Button style={{ marginTop: 24 }}>저장</Button>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
