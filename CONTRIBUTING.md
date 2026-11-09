# 변경과 릴리스 기준

## 변경 전

패키지는 `packages/mono-react/`처럼 디자인 시스템과 프레임워크를 함께 구분합니다. 다른 디자인 시스템은 별도 패키지로 추가하고, 공통 코드가 실제로 생기기 전에는 공유 패키지를 만들지 않습니다.

유사 컴포넌트와 `packages/mono-react/src/styles/tokens.css`의 의미 토큰을 먼저 확인합니다. 색·높이·간격을 신규 파일에 중복 정의하지 않습니다. primitive 색상 → semantic 역할 → component 변수 순서를 사용하고 기존 공개 변수명을 유지합니다.

React 컴포넌트는 `packages/mono-react/src/`, 문서 예시는 `systems/idenflu-mono/studio/`에서 변경합니다. 문서 경로·메뉴 순서는 같은 폴더의 `routes.json`에서 관리합니다. 컴포넌트 구현·CSS는 `packages/mono-react/src/components/`, 공통 토큰·폰트 선언·초기화는 `packages/mono-react/src/styles/`, 폰트·아이콘 에셋 원본은 `packages/mono-react/assets/`, 문서 전용 CSS·샘플 에셋은 스튜디오 폴더의 `styles/`·`assets/`에서 변경합니다. 생성된 `systems/idenflu-mono/docs-dist/`·`systems/idenflu-mono/assets/`는 직접 수정하지 않습니다.

스튜디오는 컴포넌트를 공개 `@idenflu/mono-react` 경로로 가져옵니다. 공개 API가 아닌 내부 공유 helper의 개발용 참조만 명시적 소스 경로를 사용합니다. 컴포넌트 동작은 React 상태와 콜백으로 구현합니다. 문서 id를 필수로 참조하거나 데모 데이터·서버 요청을 공통 컴포넌트에 넣지 않습니다. 이벤트·타이머·observer는 React effect의 cleanup에서 정리합니다.

## 리뷰와 검증

1. [로컬 개발 안내](docs/development/local-development.md)에 따라 의존성을 설치하고, [검사 안내](docs/development/testing.md)의 정적·단위·타입·빌드 검사를 통과시킵니다.
2. 기본·Studio 브라우저 회귀를 실행합니다. 환경 태그와 분할 실행은 [브라우저 검사 기준](docs/development/testing.md#브라우저-환경-선택), 검사 책임·변경별 확인 사항은 [QA 안내](docs/qa/overview.md)를 따릅니다.
3. 기능 변경에는 사용자 영향을 드러내는 회귀 시나리오를 추가합니다. `packages/mono-react/tests/`에서 단독 사용과 다중 인스턴스의 상태·이벤트·unmount 정리를 확인합니다.
4. 포커스·키보드·기본/hover/selected/disabled/readonly/error/loading/empty 중 해당 상태를 확인합니다. reduced-motion·forced-colors·긴 라벨·좁은 화면을 포함합니다.
5. 해당 컴포넌트의 적용 가이드·코드·값/이벤트 계약과 CHANGELOG를 갱신합니다.

브라우저 자동화는 전체 접근성 적합성을 증명하지 않습니다. 키보드 계약이 바뀌면 VoiceOver/NVDA 등 실제 보조기기로 별도 확인하고, 검증하지 못한 범위를 기록합니다. 기본 보더처럼 의미 없는 장식 선에 본문 대비 기준을 일괄 적용하지 않습니다. 구체 기준은 [텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [비텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [APG 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/)을 참고합니다.

## 배포와 호환성

- 배포 단위는 `dist/` 전체입니다. React 문서·CSS·테마·설정 파일은 `manifest.json`에서 확인합니다. 재사용 컴포넌트는 `@idenflu/mono-react` 패키지로 배포합니다.
- 동일 소스에서 동일 해시를 생성합니다. 빌드 결과 파일을 직접 수정하거나 `?v=`를 수작업으로 갱신해 릴리스하지 않습니다.
- 토큰·클래스·속성·값 타입·이벤트 이름/shape·키보드 동작은 소비 계약입니다. 삭제·의미 변경은 breaking change로 기록하고 마이그레이션 예제를 제공합니다.
- 기능 추가는 minor, 호환 가능한 오류 수정은 patch를 올립니다. 0.x 기간에도 기존 소비자를 임의로 깨지 않습니다.
- `packages/mono-react/package.json` 버전과 CHANGELOG를 맞추고 모든 검사를 통과한 뒤 `Publish React package` 워크플로를 `main`에서 수동 실행합니다. 패키지는 자동 게시하지 않으며, 문서 사이트는 `main` 푸시 시 GitHub Pages로 자동 배포합니다.
- 개발 브랜치는 `dev`, 검사·배포 브랜치는 `main`을 사용합니다. `dev` 푸시·PR에는 자동 Actions를 실행하지 않습니다. 배포할 변경을 `main`에 병합해 푸시합니다.
- 품질 워크플로는 `main` 푸시 시 검사·브라우저 검증·배포물 artifact를 생성하고, 별도 Pages 워크플로가 문서 사이트를 빌드·배포합니다. 수동 실행도 `main`을 선택합니다. [Playwright의 공식 CI 안내](https://playwright.dev/docs/ci-intro)를 따릅니다.

구체적인 Pages 설정·브랜치 반영·패키지 게시 절차는 [배포 안내](docs/development/deployment.md), 문서 위치와 작성 기준은 [문서 안내](docs/README.md)를 확인합니다.
