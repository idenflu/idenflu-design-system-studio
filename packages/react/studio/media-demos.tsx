import * as React from 'react';
import { Avatar, Button, CircleProgress, FileUpload, Progress, SegmentedProgress, Skeleton, Slider, Slides, Spinner } from '../src';
import { Section } from './demo-layout';
import { NovaSpinnerDemos } from './nova-spinner-demos';

const sizes = ['sm', 'md', 'lg'] as const;

function SliderExample({id, label, initialValue = 50, step = 1, disabled = false, size}: {id:string; label:string; initialValue?:number; step?:number; disabled?:boolean; size?:typeof sizes[number]}) {
  const [value, setValue] = React.useState(initialValue);
  return <div className={`slider-field react-studio-stack${disabled ? ' is-disabled' : ''}`} data-size={size}>
    <div className="slider-label"><label htmlFor={id}>{label}</label><output htmlFor={id}>{value}%</output></div>
    <Slider id={id} min={0} max={100} step={step} value={value} onValueChange={setValue} disabled={disabled} />
    <div className="range-ends" aria-hidden="true"><span>0</span>{step > 1 && <span>50</span>}<span>100</span></div>
  </div>;
}

export function SliderDemos() {
  return <>
    <Section title="슬라이더" description="값과 범위를 함께 표시합니다. 방향키로도 값을 조절할 수 있습니다.">
      <div className="react-studio-field-grid">
        <div className="react-studio-example"><SliderExample id="studio-slider" label="진행률" /></div>
        <div className="react-studio-example"><SliderExample id="studio-slider-step" label="단계별 조절" initialValue={60} step={10} /><p className="react-studio-caption">10 단위로 조절합니다.</p></div>
        <div className="react-studio-example"><SliderExample id="studio-slider-disabled" label="비활성" initialValue={35} disabled /></div>
      </div>
    </Section>
    <Section title="사이즈" description="SM·MD·LG의 조작 영역과 손잡이 크기를 비교해보세요.">
      <div className="react-studio-size-grid">{sizes.map(size => <div key={size} className="react-studio-example"><SliderExample id={`studio-slider-${size}`} label={`${size.toUpperCase()} 슬라이더`} size={size} /></div>)}</div>
    </Section>
    <Section title="슬라이드" description="이전·다음 버튼으로 순서가 있는 콘텐츠를 확인합니다.">
      <Slides label="프로젝트 안내" slides={[
        <div key="start"><h3 className="react-studio-example-title">프로젝트 시작</h3><p>먼저 프로젝트 이름과 목적을 정합니다. 함께 작업할 대상을 짧고 명확하게 설명하세요.</p></div>,
        <div key="invite"><h3 className="react-studio-example-title">팀원 초대</h3><p>필요한 팀원을 초대하고 역할을 나눕니다. 작업에 필요한 권한만 부여하세요.</p></div>,
        <div key="review"><h3 className="react-studio-example-title">설정 확인</h3><p>입력한 정보와 참여자를 검토합니다. 준비가 끝나면 프로젝트를 시작하세요.</p></div>,
      ]} />
    </Section>
  </>;
}

function ProgressExample({label, value, thickness = 'normal', variant = 'primary'}: {label:string; value:number; thickness?:'thin'|'normal'|'thick'; variant?:'primary'|'success'|'warning'|'danger'}) {
  return <div className="react-studio-stack"><div className="slider-label"><span>{label}</span><strong>{value}%</strong></div><Progress value={value} max={100} thickness={thickness} variant={variant} aria-label={label} /></div>;
}

export function ProgressDemos() {
  const [value, setValue] = React.useState(60);
  return <>
    <Section title="진행 상태" description="전체 작업량을 알 수 있을 때 진행률을 숫자와 함께 표시합니다.">
      <ProgressExample label="프로젝트 준비 진행률" value={value} />
      <div className="react-studio-stack"><label htmlFor="progress-example">진행률 조정</label><Slider id="progress-example" value={value} onValueChange={setValue} aria-valuetext={`${value}%`} /></div>
    </Section>
    <Section title="완료 상태"><ProgressExample label="업로드 완료" value={100} variant="success" /></Section>
    <Section title="두께" description="표시 공간에 따라 4px·8px·12px 중 하나를 선택합니다.">
      <div className="react-studio-stack">{([{value:'thin', label:'얇게 · 4px'}, {value:'normal', label:'기본 · 8px'}, {value:'thick', label:'두껍게 · 12px'}] as const).map(item => <ProgressExample key={item.value} label={item.label} thickness={item.value} value={60} />)}</div>
    </Section>
    <Section title="색상과 상태" description="색상만으로 구분하지 않고 작업 상태를 문구로 함께 설명합니다.">
      <div className="react-studio-field-grid"><ProgressExample label="프로젝트 준비 중" value={60} /><ProgressExample label="업로드 완료" value={100} variant="success" /><ProgressExample label="저장 공간 주의" value={80} variant="warning" /><ProgressExample label="동기화 중단" value={35} variant="danger" /></div>
    </Section>
    <Section title="분할형" description="전체 단계 중 완료한 단계 수를 표시합니다.">
      <div className="slider-label"><span>프로젝트 설정</span><strong>3 / 5 단계</strong></div><SegmentedProgress value={3} total={5} label="단계 진행률" />
    </Section>
    <Section title="원형" description="제한된 공간에 진행 상태를 표시합니다.">
      <div className="react-studio-row"><div className="progress-circle-item"><CircleProgress value={60} label="진행률" /><span>진행 중</span></div><div className="progress-circle-item"><CircleProgress value={100} label="완료" variant="success" /><span>완료</span></div></div>
    </Section>
  </>;
}

export function LoadingDemos() {
  return <>
    <NovaSpinnerDemos />
    <Section title="스켈레톤" description="콘텐츠가 표시될 영역의 구조를 먼저 보여줍니다.">
      <div className="skeleton-card" role="status" aria-label="콘텐츠를 불러오는 중"><Skeleton className="skeleton-avatar" /><div><Skeleton className="skeleton-title" /><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line skeleton-line--short" /></div></div>
    </Section>
    <Section title="스피너" description="완료까지 걸리는 시간을 알 수 없는 작업에 사용합니다.">
      <div className="react-studio-sample-grid">{([
        {kind:'ring', title:'기본 링', description:'일반적인 로딩 상태'},
        {kind:'dual', title:'듀얼 링', description:'간결한 회전 표시'},
        {kind:'dots', title:'도트', description:'짧은 대기 상태'},
        {kind:'bars', title:'막대', description:'인라인 로딩 상태'},
      ] as const).map(item => <div className="react-studio-example react-studio-stack" key={item.kind}><div className="react-studio-row"><Spinner kind={item.kind} label={`${item.title} 로딩 중`} /></div><h3 className="react-studio-example-title">{item.title}</h3><p className="react-studio-caption">{item.description}</p></div>)}</div>
    </Section>
    <Section title="사이즈" description="주변 요소의 크기에 맞춰 선택합니다.">
      <div className="react-studio-size-grid">{([{size:'small', label:'SM', dimension:'16px'}, {size:'medium', label:'MD', dimension:'24px'}, {size:'large', label:'LG', dimension:'32px'}] as const).map(item => <div key={item.size} className="react-studio-example"><div className="react-studio-row"><Spinner size={item.size} label={`${item.label} 로딩 중`} /><strong>{item.label}</strong><span className="react-studio-caption">{item.dimension}</span></div></div>)}</div>
    </Section>
    <Section title="색상과 사용 예시" description="배경에 대비되는 색상을 사용하고 현재 작업을 짧은 문구로 설명합니다.">
      <div className="react-studio-sample-grid"><div className="react-studio-example react-studio-stack"><h3 className="react-studio-example-title">Primary</h3><div className="react-studio-row" role="status"><Spinner size="small" aria-hidden="true" />불러오는 중</div></div><div className="react-studio-example react-studio-stack"><h3 className="react-studio-example-title">Neutral</h3><div className="react-studio-row" role="status"><Spinner size="small" variant="neutral" aria-hidden="true" />동기화 중</div></div><div className="react-studio-example react-studio-stack react-studio-inverse spinner-usage--dark"><h3 className="react-studio-example-title">Inverse</h3><div className="react-studio-row" role="status"><Spinner size="small" variant="inverse" aria-hidden="true" />불러오는 중</div></div></div>
      <div className="spinner-button-examples"><Button variant="outline" disabled><Spinner size="small" aria-hidden="true" /> 불러오는 중</Button><Button className="spinner-button-primary" disabled><Spinner size="small" variant="inverse" aria-hidden="true" /> 저장 중</Button></div>
    </Section>
  </>;
}

const people = [{name:'김민수', initial:'김'}, {name:'이서연', initial:'이'}, {name:'박지훈', initial:'박'}];
const avatarDimensions = {sm:'32px', md:'38px', lg:'44px'};
function AvatarExamples({shape}: {shape:'square'|'circle'}) {
  return <div className="avatar-examples">{sizes.map((size, index) => <div className="avatar-example" key={size}><Avatar size={size} shape={shape} role="img" aria-label={people[index].name}>{people[index].initial}</Avatar><span>{size.toUpperCase()} · {avatarDimensions[size]}</span></div>)}<div className="avatar-example"><Avatar size="lg" shape={shape} variant="neutral" role="img" aria-label="사용자"><span className="ui-icon" style={{'--icon':"url('../../../systems/idenflu-mono/assets/icons/idenflu/person.svg')"} as React.CSSProperties} /></Avatar><span>기본 아이콘</span></div></div>;
}

export function AvatarDemos() {
  return <>
    <Section title="사각형 아바타" description="크기별 이니셜과 사용자를 지정하지 않은 기본 아이콘을 비교합니다."><AvatarExamples shape="square" /></Section>
    <Section title="원형 아바타" description="같은 크기와 색상을 원형으로 사용할 수 있습니다."><AvatarExamples shape="circle" /></Section>
    <Section title="아바타 그룹" description="참여자를 모아 표시하고, 남은 인원은 숫자로 안내합니다.">
      <div className="react-studio-field-grid">{(['square','circle'] as const).map(shape => <div className="react-studio-example" key={shape}><h3 className="react-studio-example-title">{shape === 'square' ? '사각형' : '원형'}</h3><div className="avatar-group" role="group" aria-label={`${shape === 'square' ? '사각형' : '원형'} 참여자 4명`}>{people.map((person, index) => <Avatar key={person.name} shape={shape} variant={index === 1 ? 'neutral' : 'primary'} role="img" aria-label={person.name}>{person.initial}</Avatar>)}<Avatar shape={shape} variant="neutral" role="img" aria-label="외 1명">+1</Avatar></div></div>)}</div>
    </Section>
  </>;
}

function formatFileSize(bytes:number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDemos() {
  const [files, setFiles] = React.useState<File[]>([]);
  return <>
    <Section title="파일 선택" description="파일을 끌어다 놓거나 파일 선택 버튼으로 첨부합니다.">
      <p id="studio-upload-help" className="component-helper">PNG, JPG 또는 PDF 파일을 최대 5MB까지 선택할 수 있습니다.</p>
      <FileUpload accept="image/png,image/jpeg,application/pdf" maxSizeBytes={5 * 1024 * 1024} aria-label="첨부 파일" aria-describedby="studio-upload-help" onFilesChange={setFiles} />
      <p className="component-helper" role="status">{files.length ? `파일을 선택했습니다. 크기: ${formatFileSize(files[0].size)}. 제거 버튼으로 선택을 취소할 수 있습니다.` : '선택한 파일이 없습니다. 이 예시는 파일을 전송하지 않습니다.'}</p>
    </Section>
    <Section title="비활성 상태" description="첨부할 수 없는 상태에서는 파일 선택과 드롭을 막습니다.">
      <FileUpload label="파일 선택 불가" aria-label="비활성 첨부 파일" accept="image/png,image/jpeg,application/pdf" disabled />
    </Section>
  </>;
}
