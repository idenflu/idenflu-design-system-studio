import * as React from 'react';
import { Grid, Alert, Badge, Button, TextField } from '@idenflu/mono-react';
import { Section } from './demo-layout';

const baseColors = [['Primary','--primary'], ['Text Primary','--text'], ['Text Secondary','--text-secondary'], ['Surface','--surface'], ['Border','--border'], ['Control Primary','--primary-control'], ['Canvas','--canvas'], ['Surface Raised','--surface-raised'], ['Border Control','--border-control']];
const semanticColors = [['Danger','--danger'], ['Success','--success'], ['Warning','--warning'], ['Info','--info']];
const meanings:Record<string,string> = {'--danger':'삭제 · 오류 · 위험', '--success':'완료 · 성공 · 확인', '--warning':'주의 · 검토 · 보류', '--info':'안내 · 정보 · 진행'};
export function ColorDemos() {
  const [message, setMessage] = React.useState('');
  const readColors = () => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return {theme:root.dataset.theme === 'dark' ? 'Dark' : 'Light', values:Object.fromEntries([...baseColors, ...semanticColors].map(([, token]) => [token, styles.getPropertyValue(token).trim().toUpperCase()]))};
  };
  const [colors, setColors] = React.useState(readColors);
  React.useEffect(() => {
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, {attributes:true, attributeFilter:['data-theme','style']});
    setColors(readColors());
    return () => observer.disconnect();
  }, []);
  const swatches = (items:string[][]) => <div className="react-studio-swatches">{items.map(([label, token]) => <div key={token} data-color-token={token}><span className="react-studio-swatch" style={{background:`var(${token})`}} aria-hidden="true" /><strong>{label}</strong><code className="token-value">{colors.values[token]}</code><small>{token}</small>{meanings[token] && <p className="react-studio-caption">{meanings[token]}</p>}</div>)}</div>;
  return <>
    <Section title="기본 색상"><p className="component-helper">현재 테마: {colors.theme} · 기본색은 중립 회색, 주요 동작·선택·일반 포커스는 블루를 사용합니다.</p>{swatches(baseColors)}<p className="react-studio-caption">Canvas는 화면 바탕, Surface Raised는 카드와 패널의 배경입니다. 라이트는 흰색을 공통으로 사용하고 다크는 명도 차이로 영역을 구분합니다. Border는 영역을 나누는 약한 구조선, Border Control은 입력창과 선택 컨트롤을 식별하는 더 선명한 경계입니다. 입력창은 hover에서 한 단계 선명해지고, 일반 상태의 포커스는 블루로, 오류 상태의 경계와 포커스는 위험색으로 표시됩니다.</p></Section>
    <Section title="의미 색상">{swatches(semanticColors)}</Section>
    <Section title="색상 사용 예시" description="역할에 맞는 색상 토큰을 사용하면 라이트·다크 테마에 함께 적용됩니다.">
      <Grid columns={{base:1,sm:2}} rowGap={6} columnGap={8} alignItems="start" className="react-studio-field-grid">
        <div className="react-studio-example"><h3 className="react-studio-example-title">주요 동작과 링크</h3><p className="react-studio-caption">버튼에는 --primary-control, 링크에는 --primary를 사용합니다.</p><div className="react-studio-row"><Button onClick={() => setMessage('변경사항을 저장했습니다.')}>저장하기</Button><a className="react-studio-color-link" href="#/components/buttons">버튼 자세히 보기</a></div></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">배경과 텍스트</h3><p className="react-studio-caption">밝기가 다른 중립 배경으로 위계를 표현합니다. 카드 외곽선은 약하게, 입력창 경계는 더 선명하게 표시합니다.</p><div className="react-studio-color-surface"><strong>프로젝트 설정</strong><p>팀과 함께 사용할 기본 정보를 관리합니다.</p><div style={{marginTop:'var(--space-4)'}}><TextField label="프로젝트 이름" defaultValue="idenflu mono" /></div></div></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">상태 표시</h3><p className="react-studio-caption">색상과 문구를 함께 사용해 상태를 구분합니다.</p><div className="react-studio-row"><Badge variant="primary">진행 중</Badge><Badge variant="success">완료</Badge><Badge variant="warning">검토 필요</Badge><Badge variant="danger">오류</Badge></div></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">안내 메시지</h3><p className="react-studio-caption">의미 색상과 배경을 함께 사용해 정보를 전달합니다.</p><Alert variant="success"><strong>저장 완료</strong><p>변경사항이 적용되었습니다.</p></Alert></div>
      </Grid>
      <p className="component-helper" role="status">{message}</p>
    </Section>
  </>;
}

