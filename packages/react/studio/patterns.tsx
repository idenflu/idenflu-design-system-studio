import { BasicFormPattern, BookingPattern, FormStatesPattern, InquiryPattern, PasswordPattern, PreferencesPattern, ProfilePattern, ProjectPattern } from './pattern-forms';
import { DataStatesPattern, EmptyStatePattern } from './pattern-data';

export const patternPages = {
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
  'patterns/form/preferences':'<Checkbox label="이메일" name="channels" value="email" />\n<Radio label="이메일" name="contact" value="email" />\n<Select label="시간대" options={timezones} defaultValue="seoul" />\n<Switch label="주간 요약 받기" defaultChecked />',
  'patterns/form/password':'<TextField label="현재 비밀번호" type="password" autoComplete="current-password" required />\n<TextField label="새 비밀번호" type="password" autoComplete="new-password" minLength={8} required />\n<TextField label="새 비밀번호 확인" type="password" autoComplete="new-password" required error={errors.confirm} />',
  'patterns/form/inquiry':'<TextArea label="문의 내용" minLength={10} maxLength={500} required error={errors.message} />\n<FileUpload label="파일 선택" name="attachment" onFilesChange={handleFiles} />',
  'patterns/form/project':'<TextField label="프로젝트 주소" prefix="idenflu.app /" required error={errors.slug} />\n<MultiSelect label="참여 팀" options={teams} presentation="inline" searchable clearable />\n<NumberField label="예산" unit="만원" min="0" error={errors.budget} />\n<Slider aria-label="진행률" defaultValue={35} step={5} />',
  'patterns/form/booking':'<DatePicker label="날짜" name="date" required error={errors.date} />\n<NumberField label="참석 인원" name="attendees" required min="1" max="20" unit="명" error={errors.attendees} />\n<Radio label="온라인" name="format" value="online" required />',
  'patterns/form/states':'<TextField label="계정 ID" defaultValue="idenflu-user" readOnly />\n<TextField label="팀" defaultValue="지정되지 않음" disabled />\n<Switch label="알림" defaultChecked disabled />',
  'patterns/form/profile':'<TextField label="이름" defaultValue="김민수" required error={errors.name} />\n<TextField label="이메일" type="email" defaultValue="minsu@example.com" required error={errors.email} />\n<Switch label="제품 소식 받기" defaultChecked />',
  'patterns/empty-state':'<div>\n  <h3>아직 프로젝트가 없어요</h3>\n  <p>첫 프로젝트를 만들고 작업을 시작해보세요.</p>\n  <Button onClick={openProjectForm}>프로젝트 만들기</Button>\n</div>',
};
