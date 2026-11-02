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

앱의 진입점에서 스타일을 한 번 불러옵니다. `styles.css`는 디자인 토큰·폰트·컴포넌트 클래스만 포함하며 기존 페이지의 본문·제목·링크·일반 폼 요소는 바꾸지 않습니다. 함께 배포되는 글꼴과 아이콘을 상대 경로로 참조합니다.

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

앱 전체에 mono의 전역 기본 스타일을 적용하려면 `reset.css`를 **먼저** 선택적으로 불러옵니다. 이 파일은 본문 글꼴·배경, 요소 여백과 링크 스타일을 초기화합니다. 기존 앱에 컴포넌트만 추가할 때는 생략합니다.

```tsx
import '@idenflu/mono-react/reset.css'; // 선택 사항: 앱 전체에 적용
import '@idenflu/mono-react/styles.css';
```

CSS 변수만 필요한 경우에는 `@idenflu/mono-react/tokens.css`를 사용합니다. 문서 스튜디오의 레이아웃과 예시 CSS는 패키지에 포함하지 않습니다.

스타일의 색상·크기는 `--font-size-base`, `--line-height-base`, `--space-unit`, `--control-base-height`, `--radius-control` CSS 변수로 조정할 수 있습니다. 다크 테마는 문서 루트에 `data-theme="dark"`를 설정합니다.

## 컴포넌트

- 입력: `TextField`, `TextArea`, `NumberField`, `DatePicker`, `DateRangePicker`, `Slider`, `FileUpload`
- 선택: `Select`, `SearchSelect`, `MultiSelect`, `NativeSelect`, `Checkbox`, `Radio`, `Switch`, `Segmented`, `Chip`
- 탐색과 정보: `Tabs`, `Tree`, `Accordion`, `List`, `Table`, `Pagination`, `Stepper`, `Card`, `Avatar`, `Icon`, `Divider`
- 피드백과 오버레이: `Badge`, `Alert`, `Progress`, `Spinner`, `NovaSpinner`, `Skeleton`, `Dialog`, `Drawer`, `Toast`, `Tooltip`, `Popover`, `DropdownMenu`, `Slides`
- 데이터 상태: `DataState`, `useDataState` (로딩·실패·빈 목록·검색 결과 없음·정상 목록)

입력과 선택 컴포넌트는 React의 `value`/`onValueChange` 또는 `defaultValue`를 사용합니다. `TextField` 등 네이티브 입력 래퍼는 일반적인 `onChange`를 사용합니다. 날짜와 숫자의 `onValueChange`는 값을 확정하거나 증감할 때 호출하며 숫자는 정밀도를 유지하는 문자열을 전달합니다. `DateRangePicker`의 값은 `[시작일, 종료일]`이며 값은 `YYYY-MM-DD` 또는 `null`입니다.

`NumberField`, `DatePicker`, `DateRangePicker`에서 `value`가 `undefined`일 때만 `defaultValue`를 사용합니다. Controlled `null`은 빈 값입니다. 숫자의 `grouping`·`decimals`를 변경하면 현재 입력을 새 형식으로 표시하며, 정밀도를 줄여도 임의로 반올림하지 않고 기존 값을 보존해 검증합니다.

`NumberField`, `DatePicker`, `DateRangePicker`의 `error`로 부모 폼의 검증 메시지를 전달할 수 있습니다. 메시지는 입력의 오류 상태, 접근 가능한 설명과 네이티브 유효성 검사에 함께 반영됩니다.

중첩된 `Dialog`·`Drawer`·`Popover`·`DropdownMenu`·`Select`·날짜 팝업에서는 Escape가 가장 위의 팝업부터 한 단계씩 닫고 해당 트리거로 포커스를 돌려줍니다. 내부 입력이 Escape의 기본 동작을 취소하면 팝업은 유지됩니다.

`NovaSpinner`는 NOVA Studio 로고를 사용한 로딩 표시입니다. `size`는 픽셀 단위이며 기본값은 48입니다. `appearance="orbit"`은 궤도 회전, `appearance="mark"`는 로고의 밝기 변화만 표시합니다. `variant`는 원본 색상의 `brand`와 `neutral`·`inverse`를 지원하며, 움직임 줄이기 설정에서는 애니메이션을 멈춥니다. `label`로 현재 작업을 설명하고, 버튼에 같은 설명이 있으면 `aria-hidden`으로 중복 안내를 피합니다.

```tsx
import { NovaSpinner, Spinner } from '@idenflu/mono-react';

<NovaSpinner size={64} label="프로젝트를 준비하는 중" />
<NovaSpinner size={24} appearance="mark" variant="neutral" />
<Spinner kind="nova" size="small" />
```

기존 `Spinner`의 `kind="nova"`도 같은 컴포넌트를 사용하며 기존 크기 규칙인 16·24·32px을 따릅니다. `inverse`는 밝은 단색이므로 진한 배경에 사용합니다.

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

`Select`, `SearchSelect`, `MultiSelect`에 `prefixIcon`을 지정하면 선택값 앞에 고정 아이콘을 표시합니다. 옵션에는 `description`과 `icon`을 지정할 수 있고, `DropdownMenu` 항목에도 `icon`을 지정할 수 있습니다. 아이콘은 장식으로 처리하므로 의미는 `label`로 전달합니다.

`NumberField`도 `prefixIcon`을 지원합니다. 아이콘은 입력값 앞에 표시되고, `unit`은 오른쪽에 표시됩니다. 아이콘을 눌러 입력에 포커스할 수 있으며 아이콘은 제출 값과 읽기 설명에서 제외됩니다.

```tsx
<NumberField label="참여 인원" prefixIcon={<Icon name="person" />}
  defaultValue="8" min="0" unit="명" />
```

```tsx
import { Icon, Select } from '@idenflu/mono-react';

<Select label="담당 팀" prefixIcon={<Icon name="person" />} options={[
  { value: 'design', label: '디자인', description: '제품 경험을 설계합니다.' },
  { value: 'development', label: '개발', description: '제품을 구현합니다.' },
]} />
```

`Tree`는 사이드 메뉴와 같은 disclosure 목록으로, Tab과 Enter·Space를 사용합니다. 파일 탐색기 방식의 ARIA tree 키보드 모델은 제공하지 않습니다. `FileUpload`는 파일 선택과 드롭, 선택적 `accept`·`maxSizeBytes` 검증을 처리하며 실제 업로드는 애플리케이션에서 연결합니다. 컴포넌트 내부의 크기·타이포그래피·초기화 규칙은 해당 컴포넌트 범위에만 적용합니다.

`Dialog`는 `open`과 `onOpenChange`로 제어하며, 제목과 설명을 `aria-labelledby`·`aria-describedby`로 연결합니다. `closeOnBackdrop`은 배경 클릭으로 닫을지 정하며 기본값은 `false`입니다. Escape는 취소로 처리합니다.

`Toast`의 `variant`에는 `info`·`success`·`warning`·`danger`를 지정하고, `action`에 재시도·실행 취소 버튼을 넣을 수 있습니다. 기본 알림 역할은 `status`이며 `danger`는 `alert`입니다. 자동으로 닫히지 않으므로 표시 상태와 닫기 동작을 앱에서 연결합니다.

```tsx
<Toast variant="danger" onDismiss={dismissToast}
  action={<Button variant="ghost" onClick={retrySave}>다시 시도</Button>}>
  저장하지 못했습니다. 다시 시도해주세요.
</Toast>
```

`Chip`은 기본적으로 선택·삭제 동작에 사용하는 버튼입니다. `interactive={false}`는 표시 전용 `span`을 렌더링하며 클릭·호버·Tab 포커스가 없습니다. `rounded`로 알약 형태를 선택하고 `variant="neutral | primary | secondary | success | warning | danger"`로 색상을 지정합니다. 색상과 함께 텍스트로 의미를 설명합니다. 표시용 칩은 `HTMLSpanElement`, 기본 칩은 `HTMLButtonElement` ref를 받습니다.

```tsx
import { Chip } from '@idenflu/mono-react';

<Chip interactive={false}>프론트엔드</Chip>
<Chip interactive={false} variant="secondary">보조 정보</Chip>
<Chip interactive={false} rounded variant="success">완료</Chip>
<Chip rounded variant="primary" aria-pressed={selected}
  onClick={() => setSelected(!selected)}>프로젝트 필터</Chip>
```

컴포넌트의 값 변경은 React 콜백으로 받고 폼 유효성 검사는 앱에서 관리합니다. 이전 HTML 런타임과 DOM 이벤트 API는 제거했으며, 전환 방법은 [프로젝트 적용 가이드](../../docs/consumer-guide.md)를 참고하세요.

`Divider`는 기본 가로 구분선이며, `orientation="vertical"`로 세로 구분선을 표시합니다. 세로 구분선은 flex 부모에서 높이에 맞춰 늘어나므로 블록 안에서 사용할 때는 부모 높이나 `style`을 지정합니다. 자식 텍스트는 `align="start | center | end"`로 정렬하고, `variant="dashed"`는 점선을 표시합니다. 의미 있는 구분선은 `separator`로 제공하며 장식용은 `decorative`로 숨깁니다.

```tsx
import { Divider } from '@idenflu/mono-react';

<Divider />
<Divider align="start">추가 정보</Divider>
<Divider variant="dashed" decorative />
```

## 로컬 예제

저장소 루트와 이 디렉터리에서 `npm ci`를 실행하고 루트의 `npm run dev`로 서버를 시작합니다. 별도 패키지 예제는 아래 명령으로 빌드한 뒤 `/packages/react/examples/index.html`에서 엽니다.

```sh
cd packages/react
npm ci
npm run example:build
```

정식 모노 문서는 `/systems/idenflu-mono/index.html`에서 React로 동작합니다. `npm run studio:build`로 다시 빌드하며, 이전 `/packages/react/studio/index.html` 주소는 같은 문서로 이동합니다. Overview, Foundations, 26개 컴포넌트 분류와 Patterns의 Form 8개·데이터 상태·빈 상태를 React로 표시합니다. Patterns의 Layout과 Page는 메뉴·검색·이전 다음 문서에서 제외합니다. 폼의 검증·초기화·파일 선택과 데이터 상태 전환은 로컬 예시로 동작하며 실제 저장·전송·예약은 수행하지 않습니다. Divider는 React 문서에서 추가한 컴포넌트이며 `/components/divider`에서 예시를 확인할 수 있습니다.

## 개발과 배포

루트와 이 디렉터리의 의존성을 먼저 설치합니다. 루트에서 기본 검사를 실행하고, 이 디렉터리에서 아래 패키지 검사를 실행합니다. 문서를 포함한 정적 배포물은 루트의 `npm run build`로 생성합니다.

```sh
npm ci
npm run typecheck
npm test
npm pack --dry-run
```

빌드 결과에 ESM·CommonJS, TypeScript 선언, `styles.css`·`tokens.css`·`reset.css`와 참조하는 에셋 및 에셋 라이선스가 포함됩니다. 배포 전에 패키지 버전을 올리고 `Publish React package` GitHub Actions 워크플로를 수동 실행합니다. 해당 워크플로는 저장소의 `GITHUB_TOKEN`으로 GitHub Packages에 게시하며 저장소의 Packages 쓰기 권한이 필요합니다.
