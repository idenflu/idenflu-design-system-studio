# @idenflu/mono-react

idenflu mono 디자인 시스템의 React 컴포넌트와 스타일입니다. React와 React DOM 18.3.1 또는 19가 필요합니다.

## 설치

GitHub Packages에서 `@idenflu` 범위를 사용하도록 프로젝트의 `.npmrc`에 설정합니다.

```ini
@idenflu:registry=https://npm.pkg.github.com
```

패키지 접근 권한이 있는 계정으로 GitHub Packages에 로그인한 후 설치합니다. 인증에는 패키지 읽기 권한이 있는 개인 액세스 토큰이 필요합니다.

```sh
npm login --scope=@idenflu --registry=https://npm.pkg.github.com --auth-type=legacy
npm install @idenflu/mono-react
```

## 사용

앱의 진입점에서 스타일을 한 번 불러옵니다. CSS에는 디자인 토큰과 기본 요소 스타일이 포함되며 함께 배포되는 글꼴과 아이콘을 참조합니다.

```tsx
import '@idenflu/mono-react/styles.css';
import { Button, TextField } from '@idenflu/mono-react';

export function Example() {
  return (
    <div>
      <TextField label="프로젝트 이름" defaultValue="idenflu" />
      <Button>저장</Button>
    </div>
  );
}
```

스타일의 색상·크기는 `--font-size-base`, `--line-height-base`, `--space-unit`, `--control-base-height`, `--radius-control` CSS 변수로 조정할 수 있습니다. 다크 테마는 문서 루트에 `data-theme="dark"`를 설정합니다.

## 컴포넌트

- 입력: `TextField`, `TextArea`, `NumberField`, `DatePicker`, `DateRangePicker`, `Slider`, `FileUpload`
- 선택: `Select`, `SearchSelect`, `MultiSelect`, `NativeSelect`, `Checkbox`, `Radio`, `Switch`, `Segmented`, `Chip`
- 탐색과 정보: `Tabs`, `Tree`, `Accordion`, `List`, `Table`, `Pagination`, `Stepper`, `Card`, `Avatar`, `Icon`
- 피드백과 오버레이: `Badge`, `Alert`, `Progress`, `Spinner`, `Skeleton`, `Dialog`, `Drawer`, `Toast`, `Tooltip`, `Popover`, `DropdownMenu`, `Slides`
- 데이터 상태: `DataState`, `useDataState` (로딩·실패·빈 목록·검색 결과 없음·정상 목록)

입력과 선택 컴포넌트는 React의 `value`/`onValueChange` 또는 `defaultValue`를 사용합니다. `TextField` 등 네이티브 입력 래퍼는 일반적인 `onChange`를 사용합니다. 날짜와 숫자의 `onValueChange`는 값을 확정하거나 증감할 때 호출하며 숫자는 정밀도를 유지하는 문자열을 전달합니다. `DateRangePicker`의 값은 `[시작일, 종료일]`이며 값은 `YYYY-MM-DD` 또는 `null`입니다.

```tsx
import { DatePicker, Select } from '@idenflu/mono-react';
import { useState } from 'react';

function ProjectForm() {
  const [date, setDate] = useState<string | null>(null);
  return <>
    <Select label="담당 팀" name="team" required options={[{ value: 'design', label: '디자인' }]} />
    <DatePicker label="시작일" name="start" value={date} onValueChange={setDate} />
  </>;
}
```

`Tree`는 사이드 메뉴와 같은 disclosure 목록으로, Tab과 Enter·Space를 사용합니다. 파일 탐색기 방식의 ARIA tree 키보드 모델은 제공하지 않습니다. `FileUpload`는 파일 선택과 드롭, 선택적 `accept`·`maxSizeBytes` 검증을 처리하며 실제 업로드는 애플리케이션에서 연결합니다. 제공된 CSS는 전역 기본 요소 스타일을 포함합니다.

기존 바닐라 런타임과 React API는 별개입니다. 특히 내부 `datevalidation` DOM 이벤트는 React 컴포넌트에서 제공하지 않으므로 React 콜백과 폼 유효성 검사를 사용하세요.

## 로컬 예제

저장소 루트에서 `npm run dev`로 서버를 시작하고, 별도 터미널에서 아래 명령을 실행한 뒤 `/packages/react/examples/index.html`을 엽니다.

```sh
cd packages/react
npm ci
npm run example:build
```

문서 전환 작업 화면은 `npm run studio:build` 후 `/packages/react/studio/index.html`에서 확인할 수 있습니다. Overview, Foundations, 25개 컴포넌트 분류와 기본 정보 폼·데이터 상태의 기본 예시를 React로 표시합니다. 기존 문서의 모든 변형·폼 패턴과 동작을 이관한 완성본은 아니며, 기존 모노 문서가 계속 기준입니다.

## 개발과 배포

저장소 루트에서 기본 검사를 실행하고, 이 디렉터리에서 패키지 의존성을 설치하고 빌드합니다.

```sh
npm ci
npm run typecheck
npm test
npm pack --dry-run
```

빌드 결과에 ESM·CommonJS, TypeScript 선언, `styles.css`와 참조하는 에셋 및 에셋 라이선스가 포함됩니다. 배포 전에 패키지 버전을 올리고 `Publish React package` GitHub Actions 워크플로를 수동 실행합니다. 해당 워크플로는 저장소의 `GITHUB_TOKEN`으로 GitHub Packages에 게시하며 저장소의 Packages 쓰기 권한이 필요합니다.
