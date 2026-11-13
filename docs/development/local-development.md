# 로컬 개발

명령은 별도 표시가 없으면 저장소 루트에서 실행합니다.

## 의존성과 개발 서버

Node.js 20 이상에서 루트와 React 패키지의 의존성을 설치합니다.

```sh
npm ci
npm --prefix packages/idenflu-mono-react ci
npm run dev
```

- 갤러리: `http://127.0.0.1:4173/`
- 모노 문서: `http://127.0.0.1:4173/systems/idenflu-mono/index.html#/overview`

`npm run dev`는 React 패키지와 문서를 먼저 빌드한 뒤, 컴포넌트·문서·CSS·아이콘 변경을 감지해 자동으로 다시 빌드합니다. 갱신 완료 후 브라우저를 새로고침합니다. WebStorm 미리보기도 같은 문서 번들을 사용하므로 개발 중에는 이 명령을 실행해 둡니다.

의존성이 변경된 브랜치를 받았다면 `npm --prefix packages/idenflu-mono-react ci`를 먼저 실행합니다. 별도 서버로 미리보기만 열 때는 `npm run studio:build`로 문서를 직접 갱신합니다. 배포 폴더 `dist/`는 `npm run build`로 별도 갱신합니다.

## 로컬 React 예제

문서 스튜디오의 Page header 패턴·Table·Chips·폼 8종과 Select·Number fields·Date picker에는 데이터·상태·이벤트·배치 스타일을 포함한 전체 TSX 예제를 제공합니다. 화면에서 사용하는 구현을 기반으로 코드를 만들고, 문서 빌드 시 공개 패키지 타입으로 검사합니다. 폼은 검증·초기화와 FormData 미리보기를 포함하며 비밀번호·파일 내용은 미리보기에 노출하지 않습니다.

저장소 루트와 `packages/idenflu-mono-react/`에서 `npm ci`를 실행하고 루트의 `npm run dev`로 서버를 시작합니다. 독립 React 예제도 스튜디오의 `examples/`에서 관리합니다. 아래 루트 명령으로 빌드한 뒤 `/systems/idenflu-mono/studio/examples/index.html`에서 엽니다.

```sh
npm run example:build
```

문서 사용법은 [스튜디오 가이드](../guides/studio-guide.md), 입력의 값·폼 제출 계약은 [컴포넌트 참조](../reference/react-components.md#numberfielddatepickerdaterangepicker), 검사 명령은 [검사 안내](testing.md)를 확인합니다.

## 파일 구성

- `systems/idenflu-mono/index.html`: 정식 React 진입점
- `packages/idenflu-mono-react/src/components/`: 컴포넌트별 React 구현과 CSS
- `packages/idenflu-mono-react/src/styles/`: 공통 토큰·폰트·기본 스타일과 선택적 `reset.css`
- `packages/idenflu-mono-react/src/shared/`: 내부 공통 타입·훅·유틸리티
- `packages/idenflu-mono-react/assets/`: 공유 폰트·아이콘·출처·라이선스 원본
- `systems/idenflu-mono/studio/`: 문서 셸, 페이지 샘플·화면 조정 UI·브라우저 검사
- `systems/idenflu-mono/studio/scripts/`: 문서 빌드·예제 추출·API 문서 검사·타입 검사
- `systems/idenflu-mono/studio/tests/`: 문서 경로·API 표·복사 예제·업무 예제의 Node 검사
- `systems/idenflu-mono/studio/examples/`: 공개 패키지를 사용하는 독립 React 예제
- `systems/idenflu-mono/studio/routes.json`: 문서 메타데이터와 메뉴 순서
- `systems/idenflu-mono/studio/styles/`: 문서 전용 레이아웃·예시 CSS
- `systems/idenflu-mono/studio/assets/`: 워크스페이스 로고 등 문서 샘플 에셋 원본
- `systems/idenflu-mono/studio/theme.js`, `preferences.js`: 초기 테마·설정 적용
- `systems/idenflu-mono/studio/tsconfig.json`, `playwright.config.cjs`: 문서 타입·브라우저 검사 설정
- `systems/idenflu-mono/studio/scripts/build-studio.mjs`: 문서와 공유 스타일 번들
- `systems/idenflu-mono/docs-dist/`: 생성되는 로컬 문서 번들, Git 제외
- `systems/idenflu-mono/assets/`: 패키지의 `dist/assets/`와 `studio/assets/`를 합친 공개 에셋, 빌드 생성·Git 제외
- `packages/idenflu-mono-react/scripts/styles.mjs`: 패키지 스타일 입력과 결합 순서
- `systems/idenflu-mono/studio/scripts/styles.mjs`: 문서 스타일 입력 목록
- `scripts/styles.mjs`: 패키지·문서 스타일 목록을 연결하는 저장소 도구
- `scripts/`: 개발 서버·검사·배포 빌드

원본은 `packages/idenflu-mono-react/src/`, `packages/idenflu-mono-react/assets/`, `studio/`에서 수정하고 생성된 `docs-dist/`·`assets/`는 직접 수정하지 않습니다. 패키지 빌드는 `packages/idenflu-mono-react/assets/`만 복사하므로 스튜디오 샘플 에셋이 소비 앱에 포함되지 않습니다. 공개 문서 주소와 `/systems/idenflu-mono/assets/` 경로는 유지합니다.

스튜디오의 컴포넌트 import는 공개 `@idenflu/mono-react` 경로를 사용합니다. 화면과 예제는 빌드한 공개 JS·타입·에셋을 사용하며 컴포넌트 내부 helper를 직접 가져오지 않습니다. 문서 빌드·타입 검사·Node 검사는 루트의 `npm run studio:build`, `npm run studio:check`, `npm run test:studio`로 실행합니다. 패키지 폴더의 `build`·`typecheck`·`test`는 라이브러리만 검사합니다.

기존 HTML 문서와 독립 바닐라 런타임·어댑터는 제거했습니다. React 진입점의 최소 HTML과 React에서 사용하는 공유 스타일·에셋·초기 설정 엔진을 유지합니다.
