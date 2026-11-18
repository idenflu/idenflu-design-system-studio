import { Box } from '@idenflu/mono-react';
import { Section } from './demo-layout';

function ProjectInfoBox() {
  return <Box
    as="section"
    aria-label="프로젝트 정보"
    display="flex"
    flexDirection="column"
    gap="var(--space-2)"
    padding="var(--space-4)"
    backgroundColor="var(--surface-raised)"
    border="1px solid var(--border)"
  >
    <strong>프로젝트 설정</strong>
    <Box color="var(--text-secondary)">프로젝트 이름과 공유 설정을 관리합니다.</Box>
  </Box>;
}

export function BoxDemos() {
  return <Section title="스타일을 prop으로 지정" description="기본 태그는 div입니다. 의미가 필요한 영역은 as로 HTML 태그를 지정하고, 디자인 토큰은 CSS 변수로 사용합니다.">
    <ProjectInfoBox />
  </Section>;
}
