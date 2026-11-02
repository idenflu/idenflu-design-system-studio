# idenflu mono

React 기반 디자인 시스템과 문서 스튜디오입니다. 컴포넌트는 `@idenflu/mono-react` 패키지로 제공합니다.

## 실행

Node.js 20 이상에서 루트와 React 패키지의 의존성을 설치합니다.

```sh
npm ci
npm --prefix packages/react ci
npm run dev
```

- 갤러리: `http://127.0.0.1:4173/`
- 모노 문서: `http://127.0.0.1:4173/systems/idenflu-mono/index.html#/overview`
- 이전 `/packages/react/studio/index.html` 주소는 쿼리와 문서 해시를 유지해 모노 문서로 이동합니다.

`npm run dev`는 React 패키지와 문서를 먼저 빌드합니다. 소스를 수정한 뒤에는 `npm --prefix packages/react run studio:build`를 다시 실행하고 새로고침합니다.

## 문서와 사용

Overview, Foundations 5개, 컴포넌트 26개 분류, Form 8개와 데이터 상태·빈 상태까지 42개 문서를 제공합니다. Patterns의 Layout과 Page는 제외합니다. 폼 검증·초기화·파일 선택·로딩·재시도는 로컬 예시이며 서버 저장·전송·예약은 앱에서 연결합니다.

- [React 설치·사용·GitHub Packages 배포](packages/react/README.md)
- [프로젝트 적용과 HTML 구현 마이그레이션](docs/consumer-guide.md)
- [변경·검증·릴리스 기준](CONTRIBUTING.md)
- [문서 전환 현황](packages/react/studio/MIGRATION.md)
- [변경 이력](CHANGELOG.md)

문서 검색은 한글·영문 동의어를 지원합니다. `/`로 검색하고 Escape로 초기화하며 Enter로 첫 결과로 이동합니다. 테마 버튼은 라이트·다크 모드를 바꾸고 이 브라우저에 저장합니다.

상단 **화면 조정**에서 글자 크기·행간·여백·컨트롤 높이·모서리와 기본·의미 색상을 바꿀 수 있습니다. 설정은 경로 이동과 새로고침 후에도 유지하며, **초기화**는 작성 중인 폼과 테마를 유지합니다. **CSS 복사**로 현재 설정을 가져옵니다.

| 항목 | 기본값 | 범위 |
| --- | --- | --- |
| 글자 크기 | 14px | 12–18px |
| 행간 | 22px | 18–32px |
| 여백 배율 | 100% | 75–150% |
| 컨트롤 높이 | 38px | 32–48px |
| 모서리 | 0px | 0–12px |

색상은 선택기 또는 HEX 코드(`#RRGGBB`, `#RGB`)로 조정합니다. 기본 색상은 Primary, Text Primary, Text Secondary, Surface, Border, Control Primary, Canvas이고 의미 색상은 Danger, Success, Warning, Info입니다. 라이트·다크 테마별로 별도 저장하며, 색상 옆 초기화는 해당 항목만 복원합니다. 전체 **초기화**는 두 테마의 색상과 크기 설정을 복원합니다. **CSS 복사**에는 테마별 색상과 연결된 hover·pressed·상태 배경도 포함합니다.

버튼은 선택한 배경색에 맞춰 글자색과 hover·pressed 색상을 자동 보정합니다. 위험 상태의 텍스트와 버튼 색상은 별도로 파생하며, 본문·배경 등 직접 선택한 색상의 대비가 4.5:1보다 낮으면 화면 조정에서 안내합니다.

큰 글자가 잘리지 않도록 최소 행간과 컨트롤 높이를 함께 보정합니다. 기본 Primary는 `#4263CC`이고 글꼴은 Pretendard입니다. 크기 토큰과 컴포넌트의 상태·키보드 예시는 문서에서 확인합니다.

## 검사와 빌드

```sh
npm run check
npm test
npm --prefix packages/react run typecheck
npm --prefix packages/react test
npm --prefix packages/react run studio:check
npm run build
npx playwright install chromium
npm run test:browser
npx playwright test --config packages/react/studio/playwright.config.cjs
```

정적 검사, 설정 계약·결정적 빌드, React 단위 테스트와 라이트·다크·320px 브라우저 회귀를 실행합니다.

`npm run build`는 React 패키지를 빌드한 뒤 `dist/`에 갤러리와 정식 모노 문서를 생성합니다. 폴더 전체를 정적 호스팅에 배포합니다. React 문서·CSS·테마·설정은 내용 기반 해시를 사용하며 `dist/systems/idenflu-mono/manifest.json`에서 파일명을 확인합니다. 폰트·아이콘과 라이선스도 함께 복사합니다. 이전 React 미리보기 주소의 리다이렉트도 배포물에 포함합니다.

## 파일 구성

- `systems/idenflu-mono/index.html`: 정식 React 진입점
- `packages/react/src/`: 재사용 React 컴포넌트와 스타일
- `packages/react/studio/`: 문서 셸, 페이지 샘플과 화면 조정 UI
- `packages/react/studio/routes.json`: 문서 메타데이터와 메뉴 순서
- `packages/react/scripts/build-studio.mjs`: 문서와 공유 스타일 번들
- `systems/idenflu-mono/docs-dist/`: 생성되는 로컬 문서 번들, Git 제외
- `systems/idenflu-mono/*.css`, `assets/`: 공유 토큰·컴포넌트 스타일·폰트·아이콘
- `systems/idenflu-mono/reset.css`: 선택적 전역 초기화, `studio-layout.css`: 문서 전용 레이아웃
- `scripts/styles.mjs`: 패키지·문서 스타일 입력 목록
- `systems/idenflu-mono/theme.js`, `preferences.js`: 초기 테마·설정 적용
- `scripts/`: 개발 서버·검사·배포 빌드

기존 HTML 문서와 독립 바닐라 런타임·어댑터는 제거했습니다. React 진입점의 최소 HTML과 React에서 사용하는 공유 스타일·에셋·초기 설정 엔진을 유지합니다.
