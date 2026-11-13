import * as React from 'react';
import { Table, TableContainer } from '@idenflu/mono-react';
import { Section } from './demo-layout';

export type PropertyRow = readonly [name: string, type: string, initial: string, description: string];

export function ApiTable({ title, rows }: { title: string; rows: readonly PropertyRow[] }) {
  return <TableContainer label={title} className="studio-convenience-api-table">
    <Table density="compact">
      <caption className="sr-only">{title}: 속성, 타입, 기본값과 설명</caption>
      <thead><tr><th scope="col">속성</th><th scope="col">타입</th><th scope="col">기본값</th><th scope="col">설명</th></tr></thead>
      <tbody>{rows.map(([name, type, initial, description]) => <tr key={name}>
        <th scope="row"><code>{name}</code></th><td><code>{type}</code></td><td><code>{initial}</code></td><td>{description}</td>
      </tr>)}</tbody>
    </Table>
  </TableContainer>;
}

export function CodeExample({ title, children }: { title: string; children: string }) {
  return <div className="studio-convenience-reference-group">
    <h3 className="react-studio-example-title">{title}</h3>
    <div className="react-studio-code" role="region" aria-label={title} tabIndex={0}><pre><code>{children}</code></pre></div>
  </div>;
}

const hiddenLabelProps: readonly PropertyRow[] = [
  ['label', 'TextField: ReactNode / Select 계열: string', '필수', '입력의 이름입니다. hideLabel을 켜도 전달해야 하며 스크린 리더에 계속 연결됩니다.'],
  ['hideLabel', 'boolean', 'false', '화면에서 라벨과 라벨 여백을 숨깁니다. TextField, Select, SearchSelect, MultiSelect에서 지원합니다.'],
  ['labelPosition', "'top' | 'left'", "'top'", 'TextField의 보이는 라벨 위치입니다. hideLabel이 true이면 좌측 라벨 공간도 제거합니다.'],
];

const hiddenLabelCode = `import { useState } from 'react';
import {
  Icon, MultiSelect, SearchSelect, Select, TextField,
} from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

const teams = [
  { value: 'design', label: '디자인' },
  { value: 'development', label: '개발' },
];
const statuses = [
  { value: 'all', label: '전체 상태' },
  { value: 'active', label: '진행 중' },
  { value: 'done', label: '완료' },
];

export function ProjectFilters() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [ownerTeam, setOwnerTeam] = useState('');

  return <div style={{ display: 'grid', gap: 16 }}>
    <div role="group" aria-label="프로젝트 필터" style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: 8,
    }}>
      <TextField label="프로젝트 검색" hideLabel type="search"
        placeholder="프로젝트 검색" value={query}
        onChange={event => setQuery(event.target.value)}
        prefix={<Icon name="search" />} prefixDecorative />
      <Select label="프로젝트 상태" hideLabel options={statuses}
        value={status} onValueChange={setStatus} />
      <MultiSelect label="참여 팀" hideLabel options={teams}
        placeholder="참여 팀" value={selectedTeams}
        onValueChange={setSelectedTeams} />
    </div>
    <SearchSelect label="담당 팀 검색" hideLabel options={teams}
      placeholder="담당 팀 검색" value={ownerTeam}
      onValueChange={setOwnerTeam} />
    <p>검색어: {query || '없음'} · 상태: {status}
      · 참여 팀: {selectedTeams.length}개 · 담당 팀: {ownerTeam || '없음'}</p>
  </div>;
}`;

export function HiddenLabelReference({ kind = 'text-field' }: { kind?: 'text-field' | 'select' }) {
  return <Section id={`${kind}-hide-label-api`} title="숨김 라벨 API" description="주변 제목과 플레이스홀더로 입력 목적이 충분히 보이는 툴바에서 사용합니다. 플레이스홀더와 별개로 label은 항상 제공합니다.">
    <ApiTable title="숨김 라벨 속성" rows={hiddenLabelProps} />
    {kind === 'text-field' && <p className="component-helper">TextField의 type="search"는 검색어가 있을 때 공통 지우기 버튼을 표시합니다. 클릭하면 onChange로 빈 문자열을 전달하고 입력 포커스를 유지합니다. readOnly·disabled에서는 숨기며, action을 지정하면 사용자 버튼을 우선합니다.</p>}
    <CodeExample title="검색과 필터에 hideLabel 적용">{hiddenLabelCode}</CodeExample>
  </Section>;
}

export function MultiSelectTagReference() {
  return <Section id="select-tag-summary-api" title="복수 선택 축약 API" description="표시만 축약하며 실제 선택값과 폼 제출값은 그대로 유지합니다. +N개 버튼으로 옵션을 열어 숨겨진 항목도 선택·해제할 수 있습니다.">
    <ApiTable title="복수 선택 표시 속성" rows={[
      ['presentation', "'default' | 'inline'", "'default'", '기본은 선택한 라벨을 한 줄로 표시하며, inline은 제거 가능한 태그를 표시합니다.'],
      ['maxVisibleTags', "number | 'responsive'", "'responsive'", '태그형은 가용 너비에 맞춰 자동으로 +N개를 표시합니다. 0 이상 정수는 최대 표시 개수를 제한합니다. 너비가 부족하면 더 적게 표시하며, 0은 개수만 표시합니다.'],
      ['maxVisibleLabels', 'number', 'undefined', '기본 문자열 표시에서 보이는 라벨 수를 제한하고 나머지는 외 N개로 요약합니다. 태그형에는 maxVisibleTags를 사용합니다.'],
    ]} />
    <p className="component-helper">입력 높이와 너비는 선택 수에 따라 바뀌지 않습니다. 창 너비·크기 토큰·글자 크기가 바뀌면 표시 태그 수를 다시 계산합니다. 남은 개수는 선택된 라벨의 원래 순서를 따릅니다.</p>
  </Section>;
}

const popupAlignProps: readonly PropertyRow[] = [
  ['align', "'start' | 'center' | 'end'", "'start'", '패널을 트리거의 시작점, 가운데, 끝점에 맞춥니다. Popover와 DropdownMenu에서 지원합니다.'],
];

const popoverAlignCode = `import { useState } from 'react';
import { Button, Checkbox, Popover } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function AlignedPopover() {
  const [open, setOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(true);

  return <Popover trigger={<Button variant="outline">표시 설정</Button>} label="목록 표시 설정"
    align="end" open={open} onOpenChange={setOpen}>
    <strong>표시 설정</strong>
    <Checkbox label="설명 표시" checked={showDescription}
      onChange={event => setShowDescription(event.target.checked)} />
    <Button onClick={() => setOpen(false)}>적용</Button>
  </Popover>;
}`;

const menuAlignCode = `import { useState } from 'react';
import { Button, DropdownMenu, DropdownMenuItem, Icon } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function AlignedMenu() {
  const [selected, setSelected] = useState('list');

  return <div>
    <DropdownMenu trigger={<Button variant="outline">보기 방식</Button>} label="보기 방식 선택" align="end" onSelect={setSelected}>
      <DropdownMenuItem value="list" icon={<Icon name="list" />}>목록 보기</DropdownMenuItem>
      <DropdownMenuItem value="grid" icon={<Icon name="grid" />}>격자 보기</DropdownMenuItem>
      <DropdownMenuItem value="calendar" icon={<Icon name="calendar" />}>캘린더 보기</DropdownMenuItem>
    </DropdownMenu>
    <p role="status">선택한 보기: {selected}</p>
  </div>;
}`;

export function PopupAlignReference({ kind = 'popover' }: { kind?: 'popover' | 'menu' }) {
  return <Section id={`${kind}-align-api`} title="팝업 정렬 API" description="start와 end는 글의 방향을 따릅니다. RTL에서는 시작과 끝이 바뀌며, 팝업이 화면의 가로 경계를 벗어나면 위치를 자동으로 보정합니다.">
    <ApiTable title={`${kind === 'popover' ? 'Popover' : 'DropdownMenu'} 정렬 속성`} rows={popupAlignProps} />
    <CodeExample title={kind === 'popover' ? '끝점에 맞춘 설정 팝오버' : '끝점에 맞춘 작업 메뉴'}>{kind === 'popover' ? popoverAlignCode : menuAlignCode}</CodeExample>
  </Section>;
}
