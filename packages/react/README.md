# @idenflu/mono-react

idenflu mono 디자인 시스템의 React 컴포넌트와 스타일입니다. React와 React DOM 18.3.1 또는 19가 필요합니다.

## 라이선스

이 패키지의 자체 제작 소프트웨어는 [MIT 라이선스](https://github.com/idenflu/idenflu-design-system-studio/blob/main/LICENSE)에 따라 상업적 용도를 포함해 사용할 수 있습니다. 소프트웨어의 복사본이나 상당 부분을 배포할 때 저작권 표시와 라이선스 문구를 포함해야 합니다. 함께 제공되는 서드파티 자료에는 각각의 라이선스가 적용됩니다.

## 설치

GitHub Packages에서 `@idenflu` 범위를 사용하도록 프로젝트의 `.npmrc`에 설정합니다.

```ini
@idenflu:registry=https://npm.pkg.github.com
```

공개 패키지도 GitHub Packages 인증이 필요합니다. 패키지 접근 권한이 있는 계정에서 **개인 액세스 토큰(classic)**을 만들고 설치에 필요한 최소 `read:packages` 권한을 지정합니다. Fine-grained 토큰은 이 npm 레지스트리 인증에 사용할 수 없습니다. [GitHub Packages 인증 안내](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)를 참고하세요.

```sh
npm login --scope=@idenflu --registry=https://npm.pkg.github.com --auth-type=legacy
npm install @idenflu/mono-react
```

로그인할 때 Username에는 GitHub 계정명, Password에는 위 토큰을 입력합니다. 인증정보는 개인 `~/.npmrc`에서 관리하고, 프로젝트에 공유하는 `.npmrc`에는 위 레지스트리 범위 설정만 넣습니다. CI에서는 토큰을 저장소 시크릿에 보관하고 환경변수로 전달합니다.

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

CSS 변수만 필요한 경우에는 `@idenflu/mono-react/tokens.css`를 사용합니다. 문서 스튜디오의 레이아웃과 예시 CSS, 워크스페이스 로고 등 샘플 에셋은 패키지에 포함하지 않습니다. 패키지 에셋은 `systems/idenflu-mono/core/assets/`의 폰트·아이콘과 해당 라이선스만 복사합니다.

스타일의 색상·크기는 `--font-size-base`, `--line-height-base`, `--space-unit`, `--control-base-height`, `--radius-control` CSS 변수로 조정할 수 있습니다. 다크 테마는 문서 루트에 `data-theme="dark"`를 설정합니다.

## 컴포넌트

- 버튼: `Button`, `IconButton`
- 입력: `TextField`, `TextArea`, `NumberField`, `DatePicker`, `DateRangePicker`, `TimePicker`, `DateTimePicker`, `DateTimeRangePicker`, `Slider`, `FileUpload`
- 선택: `Select`, `SearchSelect`, `MultiSelect`, `NativeSelect`, `Checkbox`, `Radio`, `Switch`, `Segmented`, `Chip`
- 탐색과 정보: `Tabs`, `Tree`, `Accordion`, `List`, `Table`, `DataGrid`, `Pagination`, `Stepper`, `Card`, `Avatar`, `Icon`, `Divider`
- 레이아웃: `Grid`, `GridItem`
- 피드백과 오버레이: `Badge`, `Alert`, `Progress`, `Spinner`, `NovaSpinner`, `Skeleton`, `Dialog`, `Drawer`, `Toast`, `Tooltip`, `Popover`, `DropdownMenu`, `Slides`
- 데이터 상태: `DataState`, `useDataState` (로딩·실패·빈 목록·검색 결과 없음·정상 목록)

입력과 선택 컴포넌트는 React의 `value`/`onValueChange` 또는 `defaultValue`를 사용합니다. `TextField` 등 네이티브 입력 래퍼는 일반적인 `onChange`를 사용합니다. 날짜와 숫자의 `onValueChange`는 값을 확정하거나 증감할 때 호출하며 숫자는 정밀도를 유지하는 문자열을 전달합니다. `DateRangePicker`의 값은 `[시작일, 종료일]`이며 값은 `YYYY-MM-DD` 또는 `null`입니다.

속성·값과 이벤트 계약·키보드 동작·전체 코드 예시는 [React 컴포넌트 참조](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/reference/react-components.md)를 확인합니다.

`Drawer`는 `side`로 네 방향, `size`로 SM·MD·LG·전체 화면 또는 픽셀 크기를 지정합니다. `variant="divided"`와 `DrawerHeader`·`DrawerBody`·`DrawerFooter`를 조합하면 본문만 스크롤하고 헤더와 하단 버튼은 유지됩니다. 기본 크기는 오른쪽 480px이며 배경 클릭으로 닫힙니다. [Drawer 사용 안내](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/reference/react-components.md#dialogdrawer)를 참고하세요.

`Grid`와 `GridItem`은 반응형 열 수·토큰 간격·정렬·열과 행 병합을 제공합니다. `columns={{base:1, sm:2, lg:3}}`처럼 구간별 값을 지정하고 `colSpan="full"`로 전체 너비 항목을 배치합니다. 기본 `gap={6}`은 여백 토큰 `--space-6`을 사용합니다. [Grid 사용 안내](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/reference/react-components.md#gridgriditem)를 참고하세요.

## 아이콘

`Icon`과 `IconButton`으로 아이콘을 표시합니다. 지원 이름·Outline/Filled 구분·상태별 사용·접근성 기준과 예시는 [React 아이콘 참조](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/reference/icons.md)에 정리했습니다.

## 문서와 개발

- [프로젝트 적용과 HTML 구현 마이그레이션](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/guides/consumer-guide.md)
- [문서 스튜디오와 실행 가능한 예제](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/guides/studio-guide.md)
- [로컬 개발과 예제 빌드](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/development/local-development.md)
- [검사 명령과 검증 기준](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/development/testing.md)
- [GitHub Pages 배포와 React 패키지 게시](https://github.com/idenflu/idenflu-design-system-studio/blob/main/docs/development/deployment.md)
