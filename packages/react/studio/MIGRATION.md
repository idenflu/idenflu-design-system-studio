# React 문서 전환 현황

정식 모노 주소 `/systems/idenflu-mono/index.html`에서 React 문서를 제공합니다. 이전 `/packages/react/studio/index.html` 주소는 쿼리·해시를 유지해 정식 주소로 이동합니다.

## 현재 제공 범위

- Overview 1개와 Foundations 5개
- 컴포넌트 29개 분류: DataGrid·TimePicker·Divider와 NOVA 스피너 포함
- Patterns의 Layout 개요 1개, Form 8개, 데이터 상태와 빈 상태
- 사이드바·탑바·푸터·검색·목차·이전 다음 탐색
- 모바일 메뉴의 포커스 관리와 Escape·배경 클릭 닫기
- 테마와 화면 조정의 실시간 반영·저장·복원·CSS 복사
- 기본·의미 색상 11개 조정과 테마별 저장·개별 초기화

총 46개 문서이며 [routes.json](routes.json)이 메타데이터와 메뉴 순서의 기준입니다. 문서 생성 시 원본 HTML이나 바닐라 문서 스크립트를 읽지 않습니다.

Layout 개요의 링크는 `?layout=sidebar`의 별도 워크스페이스 샘플을 엽니다. 샘플에는 트리·카테고리 메뉴, 동적 탭, 프로젝트·멤버·역할 관리와 설정 화면이 있습니다. 독립된 Page 문서 분류는 제공하지 않습니다.

## 전환 과정에서 정리한 코드

기존 정적 문서 본문과 문서 전용 내비게이션·데모·검색·설정 UI 스크립트를 React 문서로 대체했습니다. 공유 CSS·폰트·아이콘과 초기 테마·설정 엔진은 계속 사용합니다. 초기 전환에서 제거한 Layout·Page 전용 구현과 현재 React 워크스페이스 샘플은 별개입니다.

기존 HTML 소비자용 `IdenfluMono` 런타임과 8개 바닐라 어댑터, 독립 HTML fixture·회귀 페이지·이전 HTML 생성 스크립트를 제거했습니다. 컴포넌트는 React의 상태와 콜백으로 동작하며, [적용 가이드](../../../docs/consumer-guide.md)에 전환 방법을 안내합니다. 최소 React 호스트 HTML과 이전 미리보기 주소의 리다이렉트는 유지합니다.

## 개발과 배포

- `npm run dev`: React 패키지와 정식 문서를 빌드한 뒤 변경을 감지하는 개발 서버 실행
- `npm --prefix packages/react run studio:build`: 정식 주소의 로컬 번들 갱신
- `npm run build`: 갤러리·React 문서·리다이렉트를 `dist/`에 생성
- 배포 번들과 공유 에셋은 정식 모노 폴더 안에서 상대 경로로 참조
- 기존 테마·화면 조정 저장 키를 유지해 동일 출처의 설정 복원

## 앱 연결과 검증 범위

폼 예시의 검증·초기화·파일 선택과 데이터 상태는 로컬 동작이며 서버 저장·파일 전송·실제 예약은 앱에서 연결합니다. 워크스페이스의 프로젝트·멤버·역할 예시도 로컬 샘플 데이터로 동작합니다.

React 문서 컴포넌트 회귀는 `*.spec.cjs`, 정식 주소·배포·리다이렉트·환경설정 회귀는 루트 `tests/*.spec.js`에서 검증합니다. 컴포넌트의 단독 사용과 정리는 `packages/react/tests/`에서 검증합니다. 환경별 실행 기준은 [저장소 README](../../../README.md#검사와-빌드)를 따릅니다.
