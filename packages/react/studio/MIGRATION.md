# React 문서 전환 현황

정식 모노 주소 `/systems/idenflu-mono/index.html`에서 React 문서를 제공합니다. 이전 `/packages/react/studio/index.html` 주소는 쿼리·해시를 유지해 정식 주소로 이동합니다.

## 이관 범위

- Overview와 Foundations 5개
- 컴포넌트 26개 분류: Divider와 NOVA 스피너 포함
- Patterns의 Form 8개, 데이터 상태와 빈 상태
- 사이드바·탑바·푸터·검색·목차·이전 다음 탐색
- 모바일 메뉴의 포커스 관리와 Escape·배경 클릭 닫기
- 테마와 화면 조정의 실시간 반영·저장·복원·CSS 복사

총 42개 문서이며 `routes.json`이 메타데이터와 메뉴 순서의 기준입니다. 문서 생성 시 원본 HTML이나 바닐라 문서 스크립트를 읽지 않습니다.

## 정리한 코드와 배포

기존 정적 문서 본문, 문서 내비게이션·데모·검색·설정 UI 스크립트, 제외된 Layout·Page 전용 스크립트와 스타일을 제거했습니다. 공유 CSS·폰트·아이콘과 초기 테마·설정 엔진은 React에서도 사용합니다.

기존 HTML 소비자를 위한 `IdenfluMono` 런타임과 어댑터는 별도 번들로 유지합니다. 정식 React 문서는 이 번들을 로드하지 않으며 React의 상태와 이벤트로 동작합니다.

- `npm run dev`: React 패키지와 정식 문서를 빌드한 뒤 개발 서버 실행
- `npm --prefix packages/react run studio:build`: 정식 주소의 로컬 번들 갱신
- `npm run build`: 갤러리·React 문서·리다이렉트·독립 런타임을 `dist/`에 생성
- 배포 번들과 공유 에셋은 정식 모노 폴더 안에서 상대 경로로 참조
- 기존 테마·화면 조정 저장 키를 유지해 동일 출처의 설정 복원

## 유지하는 범위

Patterns의 Layout과 Page는 사용자 요청에 따라 제외합니다. 폼 예시의 검증·초기화·파일 선택과 데이터 상태는 로컬 동작이며 서버 저장·파일 전송·실제 예약은 앱에서 연결합니다.

React 컴포넌트 회귀는 `*.spec.cjs`, 정식 주소·배포·리다이렉트·환경설정 회귀는 루트 `tests/*.spec.js`에서 검증합니다. 독립 HTML 런타임은 `tests/runtime-fixture.html`에서 검증합니다.
