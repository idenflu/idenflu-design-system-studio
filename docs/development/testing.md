# 검사와 CI

[로컬 개발 안내](local-development.md)에 따라 루트와 React 패키지 의존성을 설치합니다. 아래 명령은 저장소 루트에서 실행합니다.

## 전체 검사

```sh
npm run check
npm --prefix packages/idenflu-mono-react run typecheck
npm --prefix packages/idenflu-mono-react test
npm run test:package-isolation
npm run test:package
npm test
npm run studio:build
npm run studio:check
npm run test:studio
npm run check:api
npm run build
npx playwright install chromium
npm run test:browser
npx playwright test --config systems/idenflu-mono/studio/playwright.config.cjs
npx playwright install firefox webkit
npm run test:compat
npm run test:react-compat -- --react=18.3.1
npm run test:react-compat -- --react=19.2.0
```

패키지의 `typecheck`·`test`는 라이브러리의 값·이벤트·폼·접근성·다중 인스턴스 계약을 검사합니다. 문서 전용 Node 검사는 `npm run test:studio`, 문서 타입 검사는 `npm run studio:check`로 나눕니다. 문서 경로·API 표·복사 예제와 컨베이어·점검 캘린더 샘플 검사는 `systems/idenflu-mono/studio/tests/`에 있습니다. 저장소 루트의 `npm test`는 설정·개발 서버·결정적 사이트 빌드 등 저장소 전체 도구를 검사하므로 문서 소스를 사용합니다.

`npm run test:package-isolation`은 `systems/`와 `docs/`가 없는 임시 폴더에 패키지 소스를 복사해 `npm test`를 실행합니다. 이미 설치한 개발 도구는 `node_modules` 심볼릭 링크로 재사용하며 새로 설치하지 않습니다. 문서 파일을 읽는 역방향 의존이 생기면 이 검사가 실패합니다. 실제 배포물 설치 검증은 아래 `test:package`에서 별도로 수행합니다.

`tests/css-isolation.spec.js`와 `tests/package-style-contracts.spec.js`는 문서 CSS와 선택적 `reset.css` 없이 공개 패키지 CSS만 불러옵니다. 외부 앱의 글꼴·기본 여백이 있는 환경에서 컴포넌트별 글꼴·크기, 도움말·오류·비활성 상태, Dialog·Drawer 영역, 팝업 안의 컨트롤과 Spinner 크기를 라이트·다크·모바일에서 검사합니다. 패키지 스타일 토큰 검사도 `reset.css`의 선언에 의존할 수 없도록 분리합니다.

정적 검사, 라이브러리·문서 검사와 라이트·다크·320px 브라우저 회귀를 각각 실행합니다.

`npm run test:package`는 패키지를 빌드하고 실제 `npm pack` 결과를 저장소 밖 임시 프로젝트에 설치합니다. 공개 ESM·CJS와 아이콘 import, TypeScript의 ESM·CJS 선언, CSS·폰트·SVG 번들, SSR·hydration을 검사합니다. 런타임 의존성은 npm으로 설치하며 워크스페이스 소스를 복사하거나 alias로 연결하지 않습니다. 임시 프로젝트는 종료 후 제거합니다. 이미 빌드했다면 `npm run test:package -- --skip-build`로 실행합니다. 최초 설치에는 npm 레지스트리 접근이 필요합니다.

패키지 배포 파일의 목록만 확인하려면 `npm pack ./packages/idenflu-mono-react --dry-run`을 사용합니다.

`npm run check`에는 패키지 CSS 입력 누락·중복, 스튜디오 없이 사용하는 토큰·에셋 경로 검사와 색상 토큰·참조 문서 기본값 표의 일치 검사가 포함됩니다. `packages/idenflu-mono-react/src/styles/tokens.css`의 기본 색상을 변경한 뒤에는 `npm run docs:tokens`로 문서 표를 갱신합니다. `npm run check:tokens`로 이 항목만 확인할 수 있습니다.

공개 API 문서는 빌드한 `packages/idenflu-mono-react/dist/index.d.ts`에서 추출한 타입과 실제 Studio 속성 표를 비교합니다. 현재 선택·숫자·날짜·시간·일시 입력과 DataGrid 관련 타입을 검사합니다. API 변경 후에는 React 패키지를 빌드하고 `npm run docs:api`로 생성 자료를 갱신한 뒤 문서 표의 설명·기본값과 변경 내용을 검토합니다. `npm run check:api`는 소스와 공개 선언의 일치, 생성 자료의 최신 여부와 문서 속성·타입·필수 여부·누락을 검사합니다. 기본값·동작 설명은 수기로 관리하며 자동 검증 대상이 아닙니다. 문서 전체 타입 검사는 루트의 `npm run studio:check`로 실행합니다. 문서 검사 도구와 복사 예제 생성기는 `systems/idenflu-mono/studio/scripts/`에서 관리합니다.

## 브라우저 환경 선택

브라우저 동작 검사는 기본적으로 데스크톱 라이트에서 한 번 실행합니다. 테스트 선언의 `tag`에 `@theme`을 지정하면 다크에서도, `@mobile`을 지정하면 320px 터치 환경에서도 실행합니다. 모바일 전용 검사는 `@mobile`과 `@mobile-only`를 함께 지정해 라이트 중복을 제외합니다. 새 색상·대비 회귀에는 `@theme`을, 반응형·팝업 위치·포커스·스크롤 회귀에는 필요한 환경 태그를 추가합니다. 테스트 안에서 두 테마를 직접 순회하는 검사는 라이트에서 한 번만 실행합니다.

전체 경로·제목·넘침 검사는 기본 브라우저 검사에, 설정 저장·초기화는 `preferences.spec.js`에 모읍니다. 입력 경계값과 정렬·필터의 조합은 단위 테스트에서 자세히 검사하고, 브라우저에서는 대표 사용자 흐름과 실제 레이아웃·키보드 동작을 확인합니다.

문서 탐색은 `#/components/data-grid?section=data-grid-props-title`처럼 문서와 섹션이 함께 있는 주소를 검사합니다. 목차 클릭·새 탭·직접 열기·새로고침·뒤로/앞으로 이동에서 제목 포커스와 문서 상태를 확인하고, 모바일에서는 기본 접힘과 키보드 탐색을 확인합니다. 없는 문서는 요청 주소에서 안내하고, 없는 섹션은 해당 문서를 계속 사용할 수 있어야 합니다.

## 브라우저 엔진과 React 호환성

`npm run test:compat`는 Chromium·Firefox·WebKit에서 핵심 시나리오 4개씩, 총 12개를 실행합니다. 범위는 네이티브 Dialog 안의 선택·달력·중첩 팝업 닫기와 포커스 복원, Select 폼 초기화, 일시 선택 확정·취소, 역전된 일시 범위 검증입니다. 전체 Studio 검사는 Chromium에서 계속 실행합니다.

macOS 27에서 번들 Firefox가 `Could not find profile folder`로 시작하지 못하면 [Playwright의 Firefox 앱 데이터 경로 이슈](https://github.com/microsoft/playwright/issues/42768)를 확인합니다. 로컬 재현 환경에서는 새 임시 디렉터리를 `CFFIXED_USER_HOME`으로 지정하는 우회를 검토할 수 있습니다. 기존 사용자 프로필을 변경하지 않고 실행 OS·Playwright 버전·우회 적용 여부를 검증 기록에 함께 남깁니다.

`npm run test:react-compat -- --react=18.3.1`과 `--react=19.2.0`은 실제 tarball과 해당 React·React DOM 버전을 임시 소비 앱에 설치하고, 위 패키지 검사도 함께 실행합니다. 공개 ESM·CJS 진입점으로 서버 렌더링한 뒤 별도 프로세스에서 hydration하고, 경고·입력 ref·ARIA 연결·FormData·폼 초기화를 확인합니다. 임시 앱은 종료 시 제거하며 최초 의존성 설치에는 npm 레지스트리 접근이 필요합니다.

## 시각 회귀

`npm run test:visual`은 공개 패키지의 버튼·반전 배지·입력·선택기·데이터그리드 대표 화면을 라이트와 다크에서 비교합니다. 실행 전 패키지와 문서를 빌드합니다. 현재 검토한 기준 이미지는 macOS(`darwin`)의 Chromium 2개이며, Linux CI 시각 검사는 아직 연결하지 않습니다.

```sh
npm run test:visual
# 의도한 스타일 변경을 검토한 뒤 기준 이미지를 갱신할 때만 실행
npm run test:visual -- --update-snapshots
```

기준 이미지 비교는 같은 OS와 저장소에 고정된 Playwright·브라우저 버전에서 실행합니다. 다른 환경에서 기준 이미지가 없으면 검사가 실패합니다. 자동으로 승인하거나 기존 기준을 덮어쓰지 않고, 새 이미지의 변경 이유와 라이트·다크 결과를 먼저 검토합니다. Linux 기준은 해당 환경에서 별도로 검토한 뒤 추가합니다.

## 품질 CI

품질 CI는 패키지·기본 브라우저·Studio·브라우저 엔진·React 호환성 검사를 독립 작업으로 실행합니다. 패키지 검사는 문서 없는 격리 실행과 실제 tarball 설치를 확인합니다. 문서 검사는 공개 API 표·복사 예제·문서 타입·업무 샘플을 별도로 확인합니다. Studio의 전체 테스트를 4개 shard로 나누어 동시에 검사하고 각 shard는 worker 2개를 사용합니다. 브라우저 엔진 작업은 3개 엔진의 핵심 계약을, React 작업은 18.3.1·19.2.0 matrix의 SSR·hydration을 확인합니다. CI에서는 문서를 미리 빌드한 뒤 파일 감시가 없는 정적 서버를 사용합니다. 같은 브랜치에 새 커밋을 푸시하면 이전 품질 검사를 취소합니다.

로컬에서 Studio 분할 실행을 확인하려면 아래 명령의 `1`을 `1`~`4`로 바꿔 각 shard를 실행합니다.

```sh
npx playwright test --config systems/idenflu-mono/studio/playwright.config.cjs --shard=1/4 --workers=2
```

[품질 워크플로](../../.github/workflows/quality.yml)는 `main` 푸시와 수동 실행을 지원하며 실제 작업은 `main`에서만 실행합니다. `dev` 푸시·PR에는 자동 Actions를 실행하지 않습니다.

검사 책임·변경별 확인 사항·검증 기록은 [QA 안내](../qa/overview.md), 일시 선택기 재현 명령은 [Datetime picker QA](../qa/datetime-picker.md)에서 관리합니다.
