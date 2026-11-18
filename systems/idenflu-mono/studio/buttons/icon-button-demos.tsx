import * as React from 'react';
import { Button, Icon, IconButton } from '@idenflu/mono-react';
import { Section } from '../demo-layout';
import { IconButtonReference } from './icon-button-reference';

export function IconButtonDemos() {
  const [bookmarked, setBookmarked] = React.useState(false);
  const [details, setDetails] = React.useState(false);
  const [feedback, setFeedback] = React.useState('아이콘에 포인터를 올리거나 Tab으로 이동해 툴팁을 확인하세요.');
  const bookmarkRef = React.useRef<HTMLButtonElement>(null);
  const detailsId = React.useId();

  return <>
    <Section id="icon-button-sizes" title="아이콘 전용 버튼" description="label은 버튼의 접근 가능한 이름입니다. tooltip을 지정하면 안내를 표시하고, 위치와 표시·숨김 지연을 설정할 수 있습니다.">
      <div className="studio-convenience-icon-sizes">{(['sm', 'md', 'lg'] as const).map(size => <div key={size} className="studio-convenience-icon-sample">
        <IconButton label={`${size.toUpperCase()} 설정`} tooltip={`${size.toUpperCase()} 설정`} size={size} onClick={() => setFeedback(`${size.toUpperCase()} 설정 버튼을 눌렀습니다.`)}><Icon name="settings" /></IconButton>
        <span className="react-studio-caption">{size.toUpperCase()}</span>
      </div>)}</div>
      <div className="react-studio-row">{(['top', 'bottom', 'left', 'right'] as const).map(position => <IconButton key={position} tooltipPosition={position} label={`${position} 설정`} tooltip={`${position} 설정`}><Icon name="settings" /></IconButton>)}</div>
      <div className="react-studio-row">
        <IconButton label="지연 툴팁 설정" tooltip="표시 500ms, 숨김 300ms" tooltipPosition="bottom"
          tooltipEnterDelay={500} tooltipLeaveDelay={300}><Icon name="settings" /></IconButton>
      </div>
      <p role="status" className="component-helper">{feedback}</p>
    </Section>
    <Section id="icon-button-states" title="툴팁과 선택 상태" description="북마크를 전환하거나 자세히 보기를 펼칠 수 있습니다. 비활성 버튼과 ref로 포커스를 이동하는 동작도 확인할 수 있습니다.">
      <div className="react-studio-row">
        <IconButton ref={bookmarkRef} label="북마크" variant="outline" aria-pressed={bookmarked} onClick={() => setBookmarked(value => !value)}><Icon name="bookmark" /></IconButton>
        <IconButton label="북마크 초기화" tooltip={<span>저장한 북마크를 해제합니다.</span>} onClick={() => setBookmarked(false)}><Icon name="rotate" /></IconButton>
        <IconButton label="자세히 보기" aria-expanded={details} aria-controls={detailsId} onClick={() => setDetails(value => !value)}><Icon name="info" /></IconButton>
        <IconButton label="삭제할 항목 없음" disabled><Icon name="trash" /></IconButton>
        <Button variant="outline" onClick={() => bookmarkRef.current?.focus()}>북마크로 포커스</Button>
      </div>
      <p role="status" className="component-helper">{bookmarked ? '북마크 저장됨' : '북마크 해제됨'}</p>
      <p id={detailsId} hidden={!details} className="component-helper">북마크로 자주 찾는 항목을 저장합니다. 아이콘 모양과 aria-pressed를 함께 갱신합니다.</p>
    </Section>
    <IconButtonReference />
  </>;
}
