import * as React from 'react';
import { Button, Grid, MultiSelect, SearchSelect, Select } from '@idenflu/mono-react';
import { Section } from './demo-layout';

const teams = [
  { value: 'design', label: '디자인' },
  { value: 'development', label: '개발' },
  { value: 'marketing', label: '마케팅' },
];
type Errors = Partial<Record<'team' | 'approvalTeam' | 'teams', string>>;

const example = `import { useRef, useState } from 'react';
import { Button, MultiSelect, SearchSelect, Select } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

const options = [
  { value: 'design', label: '디자인' },
  { value: 'development', label: '개발' },
];

export function SelectFieldExample() {
  const [team, setTeam] = useState('');
  const [error, setError] = useState<string>();
  const teamRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const teamsRef = useRef<HTMLButtonElement>(null);

  return <form noValidate onSubmit={event => {
    event.preventDefault();
    if (!team) {
      setError('담당 팀을 선택해주세요.');
      teamRef.current?.focus();
      return;
    }
    setError(undefined);
    const data = new FormData(event.currentTarget);
    // data.get('team'), data.get('approvalTeam'), data.getAll('teams')
  }} onReset={() => { setTeam(''); setError(undefined); }}>
    <Select ref={teamRef} label="담당 팀" name="team" required
      options={options} value={team} helperText="프로젝트를 담당할 팀입니다."
      error={error} onValueChange={value => {
        setTeam(value); setError(undefined);
      }} />
    <SearchSelect ref={searchRef} label="승인 팀" name="approvalTeam"
      options={options} helperText="팀 이름으로 검색할 수 있습니다." />
    <MultiSelect ref={teamsRef} label="참여 팀" name="teams"
      options={options} presentation="inline"
      helperText="여러 팀을 선택할 수 있습니다." />
    <Button type="submit">검증 확인</Button>
    <Button type="reset" variant="outline">초기화</Button>
    <Button variant="outline" onClick={() => searchRef.current?.focus()}>
      승인 팀으로 이동
    </Button>
    <Button variant="outline" onClick={() => teamsRef.current?.focus()}>
      참여 팀으로 이동
    </Button>
  </form>;
}`;

export function SelectFieldDemo() {
  const [team, setTeam] = React.useState('');
  const [approvalTeam, setApprovalTeam] = React.useState('');
  const [selectedTeams, setSelectedTeams] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Errors>({});
  const [result, setResult] = React.useState('');
  const teamRef = React.useRef<HTMLButtonElement>(null);
  const approvalRef = React.useRef<HTMLInputElement>(null);
  const teamsRef = React.useRef<HTMLButtonElement>(null);
  const noteId = `${React.useId()}-note`;
  const clearError = (key: keyof Errors) => {
    setErrors(current => ({ ...current, [key]: undefined }));
    setResult('');
  };
  return <Section id="select-field-feedback" title="도움말과 오류 연결" description="도움말과 외부 오류를 세 가지 선택 컴포넌트에 같은 방식으로 연결합니다. 값을 비운 채 검증하면 첫 오류로 이동합니다.">
    <form className="react-studio-stack" noValidate onSubmit={event => {
      event.preventDefault();
      const nextErrors: Errors = {
        team: team ? undefined : '담당 팀을 선택해주세요.',
        approvalTeam: approvalTeam ? undefined : '승인 팀을 선택해주세요.',
        teams: selectedTeams.length ? undefined : '참여 팀을 하나 이상 선택해주세요.',
      };
      setErrors(nextErrors);
      if (nextErrors.team || nextErrors.approvalTeam || nextErrors.teams) {
        setResult('');
        (nextErrors.team ? teamRef : nextErrors.approvalTeam ? approvalRef : teamsRef).current?.focus();
        return;
      }
      const data = new FormData(event.currentTarget);
      setResult(JSON.stringify({ team: data.get('team'), approvalTeam: data.get('approvalTeam'), teams: data.getAll('teams') }, null, 2));
    }} onReset={() => {
      setTeam(''); setApprovalTeam(''); setSelectedTeams([]); setErrors({}); setResult('');
      teamRef.current?.focus();
    }}>
      <Grid columns={{base:1,sm:3}} gap={6} alignItems="start" className="react-studio-field-grid">
        <Select ref={teamRef} label="검증 담당 팀" name="team" required options={teams} value={team} onValueChange={value => { setTeam(value); clearError('team'); }} helperText="프로젝트를 담당할 팀입니다." error={errors.team} aria-describedby={noteId} />
        <SearchSelect ref={approvalRef} label="검증 승인 팀" name="approvalTeam" required options={teams} value={approvalTeam} onValueChange={value => { setApprovalTeam(value); clearError('approvalTeam'); }} helperText="팀 이름으로 검색할 수 있습니다." error={errors.approvalTeam} aria-describedby={noteId} />
        <MultiSelect ref={teamsRef} label="검증 참여 팀" name="teams" required options={teams} value={selectedTeams} onValueChange={value => { setSelectedTeams(value); clearError('teams'); }} presentation="inline" clearable helperText="참여할 팀을 하나 이상 선택하세요." error={errors.teams} aria-describedby={noteId} />
      </Grid>
      <p id={noteId} className="component-helper">이 예제는 선택값과 오류를 부모 상태로 관리합니다. 초기화하면 선택값과 외부 오류를 함께 지웁니다.</p>
      <div className="react-studio-row"><Button type="submit">검증 확인</Button><Button type="reset" variant="outline">검증 초기화</Button></div>
      <div className="react-studio-row" role="group" aria-label="선택 필드 포커스 이동">
        <Button variant="outline" onClick={() => teamRef.current?.focus()}>담당 팀으로 이동</Button>
        <Button variant="outline" onClick={() => approvalRef.current?.focus()}>승인 팀으로 이동</Button>
        <Button variant="outline" onClick={() => teamsRef.current?.focus()}>참여 팀으로 이동</Button>
      </div>
      <div role="status" className="component-helper">{result ? '선택값을 확인했습니다.' : ''}</div>
      {result && <div className="react-studio-code" role="region" aria-label="검증 선택 제출 데이터" tabIndex={0}><pre>{result}</pre></div>}
    </form>
    <details><summary>오류 안내와 ref 사용 코드</summary><div className="react-studio-code" role="region" aria-label="Select 도움말 오류 ref 코드" tabIndex={0}><pre><code>{example}</code></pre></div></details>
  </Section>;
}
