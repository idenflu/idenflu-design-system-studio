import * as React from 'react';
import { Section } from '../demo-layout';
import { ApiTable, CodeExample, type PropertyRow } from '../convenience-api-reference';

const iconButtonProps: readonly PropertyRow[] = [
  ['label', 'string', '필수', '버튼의 접근 가능한 이름이자 기본 툴팁입니다. 동작이 드러나는 짧은 이름을 지정합니다.'],
  ['children', 'ReactNode', '필수', '버튼 안에 표시할 아이콘입니다. Icon은 장식으로 처리하고 의미는 label로 전달합니다.'],
  ['tooltip', 'ReactNode | false', 'label', '기본 툴팁을 다른 내용으로 바꿉니다. false이면 툴팁을 제거하며 버튼 이름은 유지합니다.'],
  ['variant', "'default' | 'outline' | 'ghost'", "'ghost'", '버튼의 형태를 지정합니다.'],
  ['color', "'primary' | 'secondary' | 'danger'", "'secondary'", '버튼의 색상을 지정합니다.'],
  ['tooltipPosition', "'top' | 'bottom' | 'left' | 'right'", "'top'", '툴팁의 위치를 지정합니다.'],
  ['loading', 'boolean', 'false', '아이콘 대신 스피너를 표시하고 동작을 비활성화합니다.'],
  ['size', "'sm' | 'md' | 'lg'", '기본 컨트롤 크기', 'Button과 같은 크기 체계를 따릅니다.'],
  ['disabled', 'boolean', 'false', '동작을 비활성화하고 키보드 탐색에서 제외합니다.'],
  ['aria-pressed', 'boolean', 'undefined', '북마크처럼 두 상태를 전환할 때 현재 선택 상태를 전달합니다.'],
  ['onClick / ref', 'MouseEventHandler / Ref<HTMLButtonElement>', 'undefined', 'Button의 네이티브 이벤트와 ref를 지원합니다. ref는 실제 button 요소를 가리킵니다.'],
];

const iconButtonCode = `import { useRef, useState } from 'react';
import { Button, Icon, IconButton } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function BookmarkActions() {
  const [bookmarked, setBookmarked] = useState(false);
  const [details, setDetails] = useState(false);
  const bookmarkRef = useRef<HTMLButtonElement>(null);

  return <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <IconButton ref={bookmarkRef} label="북마크"
        variant="outline" size="md" aria-pressed={bookmarked}
        onClick={() => setBookmarked(value => !value)}>
        <Icon name={bookmarked ? 'bookmark-fill' : 'bookmark'} />
      </IconButton>
      <IconButton label="북마크 초기화" tooltip="저장한 북마크를 해제합니다."
        onClick={() => setBookmarked(false)}>
        <Icon name="refresh" />
      </IconButton>
      <IconButton label="자세히 보기" tooltip={false}
        aria-expanded={details} aria-controls="bookmark-details"
        onClick={() => setDetails(value => !value)}>
        <Icon name="info" />
      </IconButton>
      <IconButton label="삭제할 항목 없음" disabled>
        <Icon name="trash" />
      </IconButton>
      <Button variant="outline"
        onClick={() => bookmarkRef.current?.focus()}>북마크로 포커스</Button>
    </div>
    <p role="status">{bookmarked ? '북마크 저장됨' : '북마크 해제됨'}</p>
    <p id="bookmark-details" hidden={!details}>북마크로 자주 찾는 항목을 저장합니다.</p>
  </div>;
}`;

export function IconButtonReference() {
  return <Section id="icon-button-api" title="IconButton API" description="label 하나로 접근 가능한 이름과 기본 툴팁을 함께 제공합니다. 텍스트가 함께 보이는 버튼은 Button을 사용합니다.">
    <ApiTable title="아이콘 버튼 속성" rows={iconButtonProps} />
    <CodeExample title="접근 가능한 북마크와 도구 버튼">{iconButtonCode}</CodeExample>
  </Section>;
}
