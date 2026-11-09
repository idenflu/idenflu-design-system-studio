import * as React from 'react';
import { PageHeader, type PageHeaderProps } from '../dist/index.js';

const header = React.createRef<HTMLElement>();
const props: PageHeaderProps = {title:<>프로젝트 <strong>목록</strong></>, headingLevel:2, titleId:'projects-title'};
<PageHeader {...props} ref={header} id="projects" description={<p>프로젝트를 관리합니다.</p>} eyebrow={<span>업무 공간</span>}
  actions={<button type="button">생성</button>} aria-describedby="projects-help" data-purpose="list" onClick={event=>event.currentTarget.focus()} />;
// @ts-expect-error A page heading is required.
<PageHeader description="제목 없음" />;
// @ts-expect-error Only native heading levels are supported.
<PageHeader title="프로젝트" headingLevel={7} />;
// @ts-expect-error The forwarded ref points to an HTML header, not an SVG element.
<PageHeader title="프로젝트" ref={React.createRef<SVGSVGElement>()} />;
// @ts-expect-error Content belongs in the named slots.
<PageHeader title="프로젝트">추가 내용</PageHeader>;
