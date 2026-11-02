import * as React from 'react';
import { Button, NovaSpinner } from '../src';
import { Section } from './demo-layout';

export function NovaSpinnerDemos() {
  const [pending,setPending] = React.useState(false), [message,setMessage] = React.useState('');
  React.useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => { setPending(false); setMessage('예제 작업을 완료했습니다.'); },1800);
    return () => clearTimeout(timer);
  },[pending]);
  return <>
    <Section title="NOVA 스피너" description="NOVA 로고의 세 면에 빛이 순서대로 흐릅니다. 궤도형과 로고형 중 화면의 성격에 맞게 선택합니다.">
      <div className="react-studio-field-grid">
        <div className="react-studio-example react-studio-nova-stage"><NovaSpinner size={96} label="NOVA 궤도 로딩 중" /><div><h3 className="react-studio-example-title">Orbit</h3><p className="react-studio-caption">로고를 중심으로 궤도가 회전합니다.</p></div></div>
        <div className="react-studio-example react-studio-nova-stage react-studio-nova-surface"><NovaSpinner size={96} appearance="mark" label="NOVA 로고 로딩 중" /><div><h3 className="react-studio-example-title">Mark</h3><p className="react-studio-caption">세 면의 밝기 변화만으로 로딩을 표현합니다.</p></div></div>
      </div>
      <div className="react-studio-size-grid">{[24,48,72].map(size => <div className="react-studio-example" key={size}><div className="react-studio-row"><NovaSpinner size={size} label={`NOVA ${size}px 로딩 중`} /><span className="react-studio-caption">{size}px</span></div></div>)}</div>
      <p className="react-studio-caption">움직임 줄이기 설정에서는 회전과 빛의 흐름을 멈추고 로고와 상태 설명을 유지합니다.</p>
    </Section>
    <Section title="NOVA 사용 예시" description="중립색·밝은 단색으로 배경에 맞추거나, 작은 로고형을 버튼 안에 사용할 수 있습니다.">
      <div className="react-studio-field-grid">
        <div className="react-studio-example"><h3 className="react-studio-example-title">Neutral</h3><div className="react-studio-row"><NovaSpinner size={40} variant="neutral" label="NOVA 파일 준비 중" /><span>파일을 준비하는 중</span></div></div>
        <div className="react-studio-example react-studio-nova-inverse"><h3 className="react-studio-example-title">Inverse</h3><div className="react-studio-row"><NovaSpinner size={40} variant="inverse" label="NOVA 동기화 중" /><span>동기화하는 중</span></div></div>
      </div>
      <div className="spinner-button-examples"><Button className="spinner-button-primary" disabled={pending} aria-busy={pending} onClick={() => { setMessage(''); setPending(true); }}>{pending && <NovaSpinner size={18} appearance="mark" variant="inverse" aria-hidden="true" />}{pending ? '처리 중' : '예제 작업 시작'}</Button></div>
      <p role="status" className="component-helper">{message}</p>
    </Section>
  </>;
}
