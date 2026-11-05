# 로컬 개발

명령은 별도 표시가 없으면 저장소 루트에서 실행합니다.

## 의존성과 개발 서버

Node.js 20 이상에서 루트와 React 패키지의 의존성을 설치합니다.

```sh
npm ci
npm --prefix packages/react ci
npm run dev
```

- 갤러리: `http://127.0.0.1:4173/`
- 모노 문서: `http://127.0.0.1:4173/systems/idenflu-mono/index.html#/overview`
- 이전 `/packages/react/studio/index.html` 주소는 쿼리와 문서 해시를 유지해 모노 문서로 이동합니다.

`npm run dev`는 React 패키지와 문서를 먼저 빌드한 뒤, 컴포넌트·문서·CSS·아이콘 변경을 감지해 자동으로 다시 빌드합니다. 갱신 완료 후 브라우저를 새로고침합니다. WebStorm 미리보기도 같은 문서 번들을 사용하므로 개발 중에는 이 명령을 실행해 둡니다.

의존성이 변경된 브랜치를 받았다면 `npm --prefix packages/react ci`를 먼저 실행합니다. 별도 서버로 미리보기만 열 때는 `npm --prefix packages/react run studio:build`로 문서를 직접 갱신합니다. 배포 폴더 `dist/`는 `npm run build`로 별도 갱신합니다.

## 로컬 React 예제

문서 스튜디오의 Table·Chips·폼 8종과 Select·Number fields·Date picker에는 데이터·상태·이벤트·배치 스타일을 포함한 전체 TSX 예제를 제공합니다. 화면에서 사용하는 구현을 기반으로 코드를 만들고, 문서 빌드 시 공개 패키지 타입으로 검사합니다. 폼은 검증·초기화와 FormData 미리보기를 포함하며 비밀번호·파일 내용은 미리보기에 노출하지 않습니다.

저장소 루트와 `packages/react/`에서 `npm ci`를 실행하고 루트의 `npm run dev`로 서버를 시작합니다. 별도 패키지 예제는 아래 명령으로 빌드한 뒤 `/packages/react/examples/index.html`에서 엽니다.

```sh
cd packages/react
npm ci
npm run example:build
```

문서 사용법은 [스튜디오 가이드](../guides/studio-guide.md), 입력의 값·폼 제출 계약은 [컴포넌트 참조](../reference/react-components.md#numberfielddatepickerdaterangepicker), 검사 명령은 [검사 안내](testing.md)를 확인합니다.

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
