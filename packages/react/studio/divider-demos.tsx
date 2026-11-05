import { Grid, Divider } from '../src';
import { Section } from './demo-layout';

export function DividerDemos() {
  return <>
    <Section title="기본 구분선" description="관련된 내용을 그룹으로 묶고, 다른 그룹 사이에 가로 구분선을 넣습니다.">
      <div className="react-studio-example">
        <div><h3 className="react-studio-example-title">프로젝트 정보</h3><p className="react-studio-caption">프로젝트 이름과 설명을 관리합니다.</p></div>
        <Divider aria-label="프로젝트 정보와 공유 설정 구분" />
        <div><h3 className="react-studio-example-title">공유 설정</h3><p className="react-studio-caption">프로젝트에 접근할 수 있는 팀원을 관리합니다.</p></div>
      </div>
    </Section>
    <Section title="텍스트 구분선" description="가운데 또는 시작·끝에 짧은 문구를 넣어 다음 영역의 의미를 설명합니다.">
      <div className="react-studio-stack">
        <div className="react-studio-example"><span className="react-studio-caption">가운데 정렬</span><Divider>또는</Divider></div>
        <div className="react-studio-example"><span className="react-studio-caption">시작 정렬</span><Divider align="start">기본 정보</Divider></div>
        <div className="react-studio-example"><span className="react-studio-caption">끝 정렬</span><Divider align="end">추가 설정</Divider></div>
      </div>
    </Section>
    <Section title="세로 구분선" description="한 줄에 배치된 정보나 도구 그룹을 구분합니다. 구분선 높이는 부모 영역에 맞춰 늘어납니다.">
      <div className="react-studio-example"><div className="react-studio-divider-inline"><span>디자인 팀</span><Divider orientation="vertical" aria-label="담당 팀과 문서 수 구분" /><span>문서 3개</span></div></div>
    </Section>
    <Section title="선 스타일" description="기본 실선과 점선을 비교합니다. 장식만 필요한 경우 decorative로 구분선의 의미를 숨깁니다.">
      <Grid columns={{base:1,sm:2}} rowGap={6} columnGap={8} alignItems="start" className="react-studio-field-grid">
        <div className="react-studio-example"><h3 className="react-studio-example-title">실선</h3><Divider decorative /><p className="react-studio-caption">관련 영역 사이의 기본 경계</p></div>
        <div className="react-studio-example"><h3 className="react-studio-example-title">점선</h3><Divider variant="dashed" decorative /><p className="react-studio-caption">보조 영역 사이의 가벼운 경계</p></div>
      </Grid>
    </Section>
  </>;
}
