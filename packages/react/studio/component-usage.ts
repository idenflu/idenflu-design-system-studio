// 독립적으로 복사할 수 있도록 데이터와 상태를 함께 제공합니다.
export const componentUsage: Record<string, string> = {
  'components/tree': `import { useState } from 'react';
import { Tree, type TreeNode } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

const items: TreeNode[] = [{
  value: 'projects', label: '프로젝트', children: [
    { value: 'system', label: '디자인 시스템' },
    { value: 'brand', label: '브랜드 가이드' },
    { value: 'archived', label: '보관된 파일', disabled: true },
  ],
}];

export function TreeExample() {
  const [selected, setSelected] = useState('system');
  return <div style={{ maxWidth: 360 }}>
    <Tree label="프로젝트 탐색" items={items}
          defaultExpanded={['projects']}
          value={selected} onValueChange={setSelected} />
    <p role="status">선택한 값: {selected}</p>
  </div>;
}`,
  'components/tabs': `import { useState } from 'react';
import { Tabs, type TabOption } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

const items: TabOption[] = [
  { value: 'general', label: '기본 정보', content: <p>워크스페이스의 기본 정보입니다.</p> },
  { value: 'notifications', label: '알림', content: <p>이메일과 활동 알림을 설정합니다.</p> },
  { value: 'security', label: '보안', disabled: true, content: <p>관리자에게 문의하세요.</p> },
];

export function TabsExample() {
  const [tab, setTab] = useState('general');
  return <Tabs label="설정 분류" items={items}
               value={tab} onValueChange={setTab} />;
}

export function VerticalTabsExample() {
  return <Tabs label="세로 설정 분류" orientation="vertical" items={items} />;
}`,
  'components/dropdown-menu': `import { useState } from 'react';
import { DropdownMenu, Icon, type MenuItem } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

const items: MenuItem[] = [
  { value: 'edit', label: '수정', icon: <Icon name="settings" /> },
  { value: 'copy', label: '복사', icon: <Icon name="copy" /> },
  { value: 'share', label: '공유', disabled: true, icon: <Icon name="link" /> },
];

export function MenuExample() {
  const [action, setAction] = useState('');
  return <>
    <DropdownMenu trigger="더보기" label="프로젝트 작업" align="end"
                  items={items} onSelect={setAction} />
    <p role="status">{action === 'edit' ? '수정을 선택했습니다.' :
                      action === 'copy' ? '복사를 선택했습니다.' : ''}</p>
  </>;
}`,
  'components/drawer': `import { useId, useState } from 'react';
import { Button, Drawer, TextField } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function DrawerExample() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('디자인 시스템');
  const [draft, setDraft] = useState(name);
  return <>
    <Button variant="outline" onClick={() => {
      setDraft(name);
      setOpen(true);
    }}>상세 정보 열기</Button>
    <p role="status">저장한 이름: {name}</p>
    <Drawer open={open} onOpenChange={setOpen} aria-labelledby={titleId}>
      <h2 id={titleId}>프로젝트 설정</h2>
      <form onSubmit={event => {
        event.preventDefault();
        if (!draft.trim()) return;
        setName(draft.trim());
        setOpen(false);
      }} style={{ display: 'grid', gap: 24, marginTop: 24 }}>
        <TextField label="프로젝트 이름" required value={draft}
                   onChange={event => setDraft(event.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button type="submit" disabled={!draft.trim()}>저장</Button>
        </div>
      </form>
    </Drawer>
  </>;
}`,
  'components/file-upload': `import { useState } from 'react';
import { FileUpload } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function FileExample() {
  const [files, setFiles] = useState<File[]>([]);
  return <>
    <FileUpload accept="image/png,image/jpeg,application/pdf"
                maxSizeBytes={5 * 1024 * 1024} onFilesChange={setFiles} />
    <p role="status">{files.length ? files.map(file => file.name).join(', ') :
                     '선택한 파일이 없습니다.'}</p>
  </>;
}`,
  'components/feedback': `import { useState } from 'react';
import { Alert, Badge, Button } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function FeedbackExample() {
  const [failed, setFailed] = useState(false);
  return <div style={{ display: 'grid', gap: 16 }}>
    <div><Badge variant="warning">검토 필요</Badge></div>
    <Alert variant="info"><strong>안내</strong><p>변경사항은 저장 후 적용됩니다.</p></Alert>
    <Alert variant="success"><strong>완료</strong><p>모든 변경사항을 저장했습니다.</p></Alert>
    <Alert variant="warning"><strong>주의</strong><p>저장 공간을 확인해주세요.</p></Alert>
    <Button variant="outline" onClick={() => setFailed(true)}>오류 예시 표시</Button>
    {failed && <Alert variant="danger" role="alert">
      <strong>저장 실패</strong><p>연결을 확인한 뒤 다시 시도해주세요.</p>
      <Button variant="outline" onClick={() => setFailed(false)}>닫기</Button>
    </Alert>}
  </div>;
}`,
  'components/avatar': `import { Avatar } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function AvatarExample() {
  return <Avatar size="md" shape="circle" role="img" aria-label="김민수">김</Avatar>;
}`,
};
