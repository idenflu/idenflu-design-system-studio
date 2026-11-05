import * as React from 'react';
import { Alert, Badge, Button, Card, Grid, GridItem, Icon, Progress, Select, TextArea, TextField } from '../src';
import { Section } from './demo-layout';

const projects = [
  {name:'디자인 시스템', team:'프로덕트 디자인', progress:72, status:'진행 중'},
  {name:'브랜드 가이드', team:'브랜드 디자인', progress:45, status:'검토 중'},
  {name:'서비스 운영', team:'서비스 기획', progress:100, status:'완료'},
] as const;

function ResponsiveCards() {
  return <Section id="grid-responsive" title="반응형 카드 배치" description="기본 1열에서 600px 이상 2열, 1200px 이상 3열로 바뀝니다. 각 항목의 순서는 화면 크기와 관계없이 유지됩니다.">
    <Grid id="grid-responsive-cards" columns={{base:1, sm:2, lg:3}} gap={4}>
      {projects.map(project => <Card key={project.name} className="react-studio-stack">
        <div className="react-studio-row"><Icon name="folder" /><Badge variant={project.progress === 100 ? 'success' : 'primary'}>{project.status}</Badge></div>
        <div><h3 style={{margin:0}}>{project.name}</h3><p className="react-studio-caption">{project.team}</p></div>
        <div className="react-studio-stack"><Progress value={project.progress} max={100} aria-label={`${project.name} 진행률`} /><span className="react-studio-caption">진행률 {project.progress}%</span></div>
      </Card>)}
    </Grid>
    <p className="react-studio-caption"><code>{'columns={{ base:1, sm:2, lg:3 }}'}</code> · <code>{'gap={4}'}</code>: 기본 간격 16px</p>
  </Section>;
}

function FormGrid() {
  const [result, setResult] = React.useState('');
  const [error, setError] = React.useState('');
  const nameRef = React.useRef<HTMLInputElement>(null);
  return <Section id="grid-spans" title="폼과 열 병합" description="설명은 넓은 화면에서 두 열을 사용하고, 안내와 동작 영역은 항상 전체 너비를 사용합니다. 작은 화면에서는 모든 항목이 한 열로 이어집니다.">
    <form onReset={() => {setResult(''); setError('');}} onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget), name = String(data.get('name') || '').trim();
      if (!name) {setError('프로젝트 이름을 입력해주세요.'); nameRef.current?.focus(); return;}
      setError(''); setResult(`프로젝트를 만들었습니다: ${name}`);
    }} noValidate>
      <Grid id="grid-form-layout" columns={{base:1, sm:2, lg:3}} gap={6} alignItems="start">
        <TextField ref={nameRef} label="프로젝트 이름" name="name" required defaultValue="디자인 시스템 개선" error={error || undefined} onChange={() => {setError('');setResult('');}} />
        <Select label="담당 팀" name="team" defaultValue="design" onValueChange={() => setResult('')} options={[{value:'design',label:'프로덕트 디자인'},{value:'engineering',label:'플랫폼 개발'},{value:'planning',label:'서비스 기획'}]} />
        <Select label="공유 범위" name="visibility" defaultValue="team" onValueChange={() => setResult('')} options={[{value:'team',label:'팀원에게 공개'},{value:'workspace',label:'워크스페이스에 공개'}]} />
        <GridItem id="grid-form-description" colSpan={{base:1, sm:2, lg:2}}><TextArea label="프로젝트 설명" name="description" rows={3} defaultValue="제품 전반에서 일관된 경험을 제공하기 위한 프로젝트입니다." onChange={() => setResult('')} /></GridItem>
        <TextField label="담당자" name="owner" defaultValue="김민수" onChange={() => setResult('')} />
        <GridItem id="grid-form-notice" colSpan="full"><Alert>전체 너비 항목은 <code>colSpan="full"</code>을 사용합니다. 열 수가 바뀌어도 가로 넘침이 생기지 않습니다.</Alert></GridItem>
        <GridItem colSpan="full"><div className="react-studio-row"><Button type="submit">프로젝트 만들기</Button><Button type="reset" variant="outline">입력 초기화</Button></div></GridItem>
      </Grid>
    </form>
    <p role="status" className="component-helper">{result || '폼을 제출하면 입력한 프로젝트 이름을 확인할 수 있습니다.'}</p>
  </Section>;
}

function SpacingGrid() {
  const [gap, setGap] = React.useState<2 | 4 | 6 | 8>(4);
  const [alignment, setAlignment] = React.useState<'start' | 'center' | 'end' | 'stretch'>('stretch');
  return <Section id="grid-spacing" title="간격과 정렬" description="간격은 디자인 토큰으로 지정합니다. 서로 다른 높이의 항목을 시작·가운데·끝에 맞추거나 같은 높이로 늘릴 수 있습니다.">
    <Grid columns={{base:1, sm:2}} gap={4} alignItems="end" style={{maxWidth:520}}>
      <Select label="Grid 간격" value={String(gap)} onValueChange={value => setGap(Number(value) as 2 | 4 | 6 | 8)} options={[2,4,6,8].map(value => ({value:String(value),label:`${value} · 기본 ${value * 4}px`}))} />
      <Select label="Grid 세로 정렬" value={alignment} onValueChange={value => setAlignment(value as typeof alignment)} options={[{value:'stretch',label:'늘이기 · stretch'},{value:'start',label:'시작 · start'},{value:'center',label:'가운데 · center'},{value:'end',label:'끝 · end'}]} />
    </Grid>
    <Grid id="grid-spacing-preview" columns={{base:1, sm:3}} gap={gap} alignItems={alignment} style={{minHeight:240, padding:'var(--space-4)', background:'var(--surface)', border:'1px solid var(--divider)'}}>
      <div className="react-studio-example" style={{background:'var(--field-background)'}}><h3 className="react-studio-example-title">간단한 정보</h3><p>프로젝트 12개</p></div>
      <div className="react-studio-example" style={{background:'var(--field-background)'}}><h3 className="react-studio-example-title">요약과 상태</h3><p>이번 주에 4개 프로젝트를 진행하고 있습니다.</p><div><Badge variant="primary">진행 중</Badge></div></div>
      <div className="react-studio-example" style={{background:'var(--field-background)'}}><h3 className="react-studio-example-title">다음 일정</h3><p>팀 리뷰</p><p className="react-studio-caption">목요일 오후 2시<br />완료한 작업과 다음 계획을 공유합니다.</p><div><Badge variant="warning">검토 필요</Badge></div></div>
    </Grid>
    <p className="react-studio-caption"><code>gap</code>은 두 축에 적용합니다. <code>rowGap</code>·<code>columnGap</code>으로 각 축의 간격을 따로 지정할 수 있습니다. 화면 조정의 여백 배율을 바꾸면 토큰 간격도 함께 바뀝니다.</p>
  </Section>;
}

function DashboardGrid() {
  return <Section id="grid-dashboard" title="중첩 그리드와 행 병합" description="프로젝트 영역은 넓은 화면에서 두 열과 두 행을 사용합니다. 영역 내부에는 별도의 Grid를 배치하고, 모바일에서는 문서 순서대로 한 열에 표시합니다.">
    <Grid id="grid-dashboard-layout" columns={{base:1, sm:2, lg:3}} gap={4}>
      <GridItem colSpan={{base:1, sm:2}} rowSpan={{base:1, lg:2}}><Card className="react-studio-stack" style={{height:'100%'}}>
        <div><h3 style={{margin:0}}>프로젝트 현황</h3><p className="react-studio-caption">이번 주 작업 진행 상황</p></div>
        <Grid columns={{base:1, sm:2}} gap={4}>
          <div className="react-studio-example"><span className="react-studio-caption">전체 작업</span><strong style={{fontSize:'var(--font-size-heading)'}}>48</strong></div>
          <div className="react-studio-example"><span className="react-studio-caption">완료한 작업</span><strong style={{fontSize:'var(--font-size-heading)'}}>32</strong></div>
        </Grid>
        {projects.map(project => <div key={project.name} className="react-studio-stack"><div className="react-studio-row" style={{justifyContent:'space-between'}}><span>{project.name}</span><span className="react-studio-caption">{project.progress}%</span></div><Progress value={project.progress} max={100} aria-label={`대시보드 ${project.name} 진행률`} /></div>)}
      </Card></GridItem>
      <Card className="react-studio-stack"><h3 style={{margin:0}}>팀원</h3><strong style={{fontSize:'var(--font-size-heading)'}}>8명</strong><p className="react-studio-caption">디자인·개발·기획이 함께 참여합니다.</p></Card>
      <Card className="react-studio-stack"><h3 style={{margin:0}}>다음 리뷰</h3><p>11월 12일 · 오후 2시</p><div><Badge variant="primary">예정됨</Badge></div></Card>
    </Grid>
  </Section>;
}

export function GridDemos() {
  return <><ResponsiveCards /><FormGrid /><SpacingGrid /><DashboardGrid />
    <Section id="grid-reference" title="사용 기준" description="Grid는 콘텐츠 배치, GridItem은 개별 항목의 병합과 정렬을 담당합니다. div의 일반 HTML 속성·className·style·ref를 전달하며 별도 ARIA 역할을 부여하지 않습니다.">
      <div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">컴포넌트</th><th scope="col">속성</th><th scope="col">기본값과 용도</th></tr></thead><tbody>
        <tr><th scope="row">Grid</th><td><code>columns</code></td><td>기본 1열. 양의 정수로 열 수를 지정합니다.</td></tr>
        <tr><th scope="row">Grid</th><td><code>gap / rowGap / columnGap</code></td><td>gap 기본 6. 토큰 0~8·10·12를 사용하며 기본 여백에서 6은 24px입니다.</td></tr>
        <tr><th scope="row">Grid</th><td><code>alignItems / justifyItems</code></td><td>기본 stretch. 세로·가로 방향의 항목 정렬입니다.</td></tr>
        <tr><th scope="row">GridItem</th><td><code>colSpan / rowSpan</code></td><td>기본 1. colSpan="full"은 현재 Grid의 전체 열을 사용합니다.</td></tr>
        <tr><th scope="row">GridItem</th><td><code>alignSelf / justifySelf</code></td><td>개별 항목의 세로·가로 정렬을 지정합니다.</td></tr>
      </tbody></table></div>
      <p className="react-studio-caption">배치 속성은 단일 값 또는 <code>{'{ base, sm, md, lg, xl }'}</code> 객체를 받습니다. sm 600px·md 900px·lg 1200px·xl 1440px부터 적용하며 생략한 구간은 앞 구간의 값을 이어받습니다. 숫자 열 병합은 현재 Grid의 열 수 안으로 제한합니다.</p>
      <p className="react-studio-caption">문서 순서와 키보드 탐색 순서를 같은 흐름으로 유지하세요. 시각적 배치를 위해 항목의 순서를 바꾸지 않습니다. 검색·정렬·선택 등 표 기능이 필요한 경우 DataGrid를 사용합니다.</p>
    </Section>
  </>;
}

export const gridUsage = `import { useState } from 'react';
import { Grid, GridItem, Select, TextArea, TextField, Button } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function ProjectGridExample() {
  const [result, setResult] = useState('');
  return <form onReset={() => setResult('')} onSubmit={event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get('name') || '').trim();
    setResult(name ? '프로젝트를 만들었습니다: ' + name : '이름을 입력해주세요.');
  }}>
    <Grid columns={{ base:1, sm:2, lg:3 }} gap={6} alignItems="start">
      <TextField label="프로젝트 이름" name="name" required />
      <Select label="담당 팀" name="team" defaultValue="design"
              options={[{ value:'design', label:'프로덕트 디자인' },
                        { value:'engineering', label:'플랫폼 개발' }]} />
      <TextField label="담당자" name="owner" />
      <GridItem colSpan="full">
        <TextArea label="설명" name="description" rows={4} />
      </GridItem>
      <GridItem colSpan="full">
        <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)' }}>
          <Button type="submit">저장</Button>
          <Button type="reset" variant="outline">초기화</Button>
        </div>
      </GridItem>
      <GridItem colSpan="full"><p role="status">{result}</p></GridItem>
    </Grid>
  </form>;
}`;
