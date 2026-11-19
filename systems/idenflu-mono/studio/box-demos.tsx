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
    pt="var(--space-2)"
    pb={12}
    pr="var(--space-3)"
    pl={20}
    margin={4}
    mt={8}
    mb={16}
    ml={6}
    mr="var(--space-2)"
    backgroundColor="var(--surface-raised)"
    border="1px solid var(--border)"
  >
    <strong>프로젝트 설정</strong>
    <Box color="var(--text-secondary)" pt={8} style={{ paddingTop: 0 }}>프로젝트 이름과 공유 설정을 관리합니다.</Box>
  </Box>;
}

export function BoxDemos() {
  return <Section title="스타일을 prop으로 지정" description="기본 태그는 div이며 as로 HTML 태그를 바꿀 수 있습니다. pt, pb, pr, pl로 방향별 안쪽 여백을, mt, mb, ml, mr로 방향별 바깥 여백을 지정합니다. 숫자는 px로 적용되며 디자인 토큰은 CSS 변수로 사용할 수 있습니다.">
    <ProjectInfoBox />
  </Section>;
}
