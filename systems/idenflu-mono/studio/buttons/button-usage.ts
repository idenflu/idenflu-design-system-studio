export const buttonUsage = `import { Button, Icon, IconButton, Segmented } from '@idenflu/mono-react';

<Button variant="outline">저장</Button>
<Button variant="outline" color="danger"><Icon name="trash" />선택 삭제</Button>
<IconButton label="설정 열기"><Icon name="settings" /></IconButton>
<Segmented label="보기 방식" size="md" defaultValue="list"
  options={[
    { value: 'list', label: <><Icon name="list" />목록</> },
    { value: 'grid', label: <><Icon name="grid" />격자</> },
    { value: 'calendar', label: <><Icon name="calendar" />캘린더</> },
  ]}
/>`;
