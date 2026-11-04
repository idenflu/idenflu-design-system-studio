import { BasicFormPattern, BookingPattern, FormStatesPattern, InquiryPattern, PasswordPattern, PreferencesPattern, ProfilePattern, ProjectPattern } from './pattern-forms';
import { DataStatesPattern, EmptyStatePattern } from './pattern-data';
import { LayoutPattern } from './pattern-layout';

export const patternPages = {
  'patterns/layout':LayoutPattern,
  'patterns/form/basic':BasicFormPattern,
  'patterns/form/preferences':PreferencesPattern,
  'patterns/form/password':PasswordPattern,
  'patterns/form/inquiry':InquiryPattern,
  'patterns/form/project':ProjectPattern,
  'patterns/form/booking':BookingPattern,
  'patterns/form/states':FormStatesPattern,
  'patterns/form/profile':ProfilePattern,
  'patterns/data-states':DataStatesPattern,
  'patterns/empty-state':EmptyStatePattern,
};
export const patternSnippets:Record<string,string> = {
  'patterns/data-states':`const state = useDataState({
  load: loadProjects, // AbortSignal을 전달받습니다.
  initialItems: [],
  matches: (item, query) => item.name.includes(query),
});

// state.status: loading | error | empty | no-results | success
// state.visibleItems로 현재 검색 결과를 표시합니다.
<Button onClick={() => void state.reload()}>다시 시도</Button>
<TextField label="프로젝트 검색" value={state.query}
           onChange={event => state.setQuery(event.target.value)} />`,
  'patterns/empty-state':'<div>\n  <h3>아직 프로젝트가 없어요</h3>\n  <p>첫 프로젝트를 만들고 작업을 시작해보세요.</p>\n  <Button onClick={openProjectForm}>프로젝트 만들기</Button>\n</div>',
};
