# Datetime picker 검수

final result: passed

## 비교 기준과 증거

- 최초 선택 시안: `/Users/seunghyeonoh/.codex/generated_images/01a19779-8080-7b10-89b2-82fff98f48fa/exec-0ce88fb5-061c-4b33-89b7-985b38da4edd.png` (1456 × 1086px).
- 최종 기준: 선택 시안의 통합 입력·달력/시간 패널·확인/취소 구성. 이후 사용자 요청에 따라 캘린더는 기존 Date picker와 동일한 스타일로, 범위형은 시작 일시 → 다음 → 종료 일시 → 확인으로 변경했다.
- 기존 Date picker 캡처: `/private/tmp/mono-datepicker-calendar-reference.png` (1440 × 1000px).
- 구현 URL: `http://127.0.0.1:4173/systems/idenflu-mono/index.html#/components/datetime-picker`.
- 단일형: `/private/tmp/mono-datetime-single-light-final.png` (1440 × 1000px).
- 범위 시작/종료 단계: `/private/tmp/mono-datetime-range-start-final.png`, `/private/tmp/mono-datetime-range-end-final.png` (각 1440 × 1000px).
- 다크모드: `/private/tmp/mono-datetime-single-dark-final.png` (1440 × 1000px).
- 모바일: `/private/tmp/mono-datetime-range-mobile-final.png` (390 × 844px).
- 모든 구현 캡처는 CSS viewport와 동일한 픽셀 크기, deviceScaleFactor 1이다.

## 같은 입력에서의 시각 비교

- 전체 컴포넌트 비교: `/private/tmp/mono-datetime-comparison-final.png` (1192 × 486px). 원본의 (94,351), 956 × 666px 영역을 폭 560px로 정규화하고, 구현의 (304,454), 560 × 415px 영역과 한 캔버스에 배치해 확인했다.
- 캘린더 집중 비교: `/private/tmp/mono-datetime-calendar-comparison.png` (960 × 480px). 기존 Date picker와 최종 Datetime picker의 (304,498), 320 × 300px 영역을 각각 1.4배 확대하여 한 이미지에서 비교했다. 두 캘린더 모두 2026년 11월, 12일 선택, 2일 오늘 표시, light 상태다.
- 달력의 내용 폭은 286px로 같다. Datetime 패널의 달력 영역 318px와 바깥 팝업 테두리를 합쳐 기존 Date picker의 320px 외곽에 맞췄다.

## 비교 이력과 수정

1. 초기 시안 비교 (`/private/tmp/mono-datetime-comparison.png`): 선택된 시간의 색과 월 제목 위계가 달랐고, 시간 목록의 선택 항목 위치가 아래로 치우쳤다. 선택 배경·글자 토큰을 조정하고 목록 내부에서 행 단위로 정렬했다. 후속 증거: `/private/tmp/mono-datetime-comparison-v2.png`.
2. 모바일 검수 [P2]: 네이티브 세로 스크롤바가 있는 390px viewport에서 팝업이 문서 너비를 3px 넘었다. 실제 `documentElement.clientWidth`에서 좌우 여백을 뺀 값으로 `maxWidth`를 제한했다. 최종 캡처에서 문서 폭 375px, 팝업 x12/폭351px/오른쪽363px로 가로 넘침이 없다.
3. 사용자 후속 검토 [P2]: 독자적인 월 제목 크기와 달력 열 너비가 기존 Date picker와 달랐다. 관련 override를 제거해 공통 `.calendar-*` 스타일을 그대로 사용하고, 달력 내용 폭을 맞췄다. 위 집중 비교 및 세 가지 브라우저 구성의 computed-style 회귀 검사로 확인했다.
4. 사용자 후속 검토 [P1]: 범위형에 시작 날짜·시간 선택을 마치고 종료 단계로 이동하는 명시적인 흐름이 없었다. 시작 단계의 `다음`, 종료 단계의 `이전`/`확인`, 단계 번호와 `aria-current="step"`을 추가했다. 시작값 검증 후 종료 단계로 이동하며 최종 확인까지 폼 값·콜백은 유지된다. 시작 단계의 종료일 hover 미리보기도 제거했다. 최종 시작/종료 캡처와 빈 범위의 브라우저 테스트로 재검수했다.
5. 스크롤바 후속 검토 [P1]: 시·분 목록의 네이티브 스크롤바 클릭 시 포커스가 바깥 `main[tabindex="-1"]`으로 이동해 blur 처리에서 팝업이 닫혔다. 팝업에 `tabIndex={-1}`을 주어 스크롤바·패널 배경을 클릭해도 내부에 포커스가 머물도록 수정했다. 마우스 기본 스크롤 동작과 기존 외부 클릭/Tab/Escape 처리는 유지했다. 실제 스크롤바 트랙 클릭·손잡이 드래그 후 시 목록 scrollTop684, 분 목록 scrollTop2047에서도 팝업과 빈 입력값이 유지되었고, 22:58 선택 후 확인으로 정상 반영했다. 범위 시작·종료 단계에서도 스크롤바 클릭 후 값이 유지됐다. 증거: `/private/tmp/mono-datetime-scrollbar-fixed.png` (1440 × 1000px). 네이티브 스크롤바 브라우저 회귀 테스트는 실제 gutter를 검사하고 light/dark에서 클릭·드래그를 수행한다.

현재 남은 P0/P1/P2 항목은 없다.

## 필수 표면 검수

- **폰트/타이포그래피:** 기존 Pretendard 및 시스템 fallback 사용. 월 제목은 Date picker와 같은 14px/22px, weight 600. 요일·날짜·내비게이션의 폰트, 행간, 색, 높이, 패딩을 기존 컴포넌트와 비교했다. 날짜와 시간은 tabular numerals를 사용한다.
- **간격/레이아웃:** 기존 sm32/md38/lg44 높이, 0px radius, 16px 달력 패딩, 회색 테두리 유지. 데스크톱은 달력/시간 좌우 배치, 좁은 화면은 세로 배치 및 내부 스크롤로 확인 버튼까지 접근할 수 있다.
- **색/토큰:** primary·info-surface·field-background·border·focus 토큰을 사용한다. 선택·hover·focus·비활성·오류 상태와 light/dark 색상을 확인했다. 다크 취소 버튼은 배경 rgb(29,32,36), 글자 rgb(236,238,242)로 정상 표시된다.
- **이미지/아이콘:** 새 래스터 장식 없이 기존 시스템의 calendar/caret SVG 아이콘을 재사용했다. 아이콘의 선명도, 크기와 입력 버튼 정렬을 확인했다.
- **문구/내용:** 시안의 일시, 한국어 날짜 요약, 취소/확인 문구를 유지했다. 범위형에는 순차 선택 안내와 빈 기간 예시를 추가했다. 최종 사용자 요청에 따른 변경을 시안과의 의도적인 차이로 인정한다.

## 동작과 접근성 확인

- 단일 및 범위 직접 입력 정규화, 윤년/잘못된 날짜·시간, 역전 범위, min/max와 minuteStep 검증.
- 달력·시간의 임시 선택, 최종 확인, 이전 단계 수정, 취소/Escape/외부 클릭 시 원래 값 유지.
- 키보드 달력 열기, 날짜/월 이동, 시간 목록 이동, 단계별 포커스, 레이블·오류 연결, 폼 제출·초기화 및 controlled null.
- 빈 범위에서 시작 → 날짜·시·분 → 다음 → 종료 날짜·시·분 → 이전/다음 → 확인을 실제 Chromium에서 실행했다.
- 1440 × 1000 light/dark, 320 × 740 모바일 브라우저 테스트. 390 × 844 네이티브 스크롤바 환경에서도 팝업 containment와 확인 버튼 접근을 확인했다.
- 최종 브라우저 로드 및 단일/범위 조작 중 console.error, error, unhandledrejection 수집 결과: 0건.
- React 단위 테스트 69개, 관련 브라우저 및 전체 문서 경로 검사 18개 통과. 타입·studio 타입·저장소 검사 통과.
- 스크롤바 수정 후: 관련 단위 테스트 12개와 브라우저 20개 통과. 모바일에는 마우스 스크롤바 gutter가 없어 네이티브 클릭·드래그 1개만 제외했고, 모바일 키보드/외부 클릭/Escape 검사는 통과했다. 타입 및 diff 검사도 통과했다.
- 실제 스크린리더와 물리적 터치 기기 검수는 수행하지 않았다.

## 구현 체크리스트

- [x] 단일/범위 컴포넌트 및 공개 API export
- [x] 공통 캘린더 스타일과 순차 범위 선택
- [x] 빈 값·제한·비활성·읽기 전용·사이즈별 문서 예시
- [x] 재캡처·같은 캔버스 비교·기능/회귀 검사

## 사용 예시 보완

- React 사용 예시를 값 바인딩·값 변환·폼 제출의 세 탭으로 구성했다. 단일/범위 객체 매핑, 외부 값 적용/비우기, UTC 서버 값 불러오기, FormData/API payload와 초기화 동작을 직접 실행할 수 있다.
- 변환은 고정 UTC+09:00 예시이며 브라우저 시간대에 의존하지 않는다. ISO·표시 문자열·숫자 문자열·밀리초 타임스탬프, 빈 값 null, 자정을 넘는 변환을 확인했다. 뉴욕과 도쿄 시간대의 브라우저에서 결과가 같았다.
- 각 탭에서 전체 React 코드를 열고 복사할 수 있다. 표시된 세 코드 예시를 독립적인 컴포넌트로 TypeScript semantic 검사했다.
- 관련 브라우저/전체 문서 경로 검사 18개, studio 타입 검사, 저장소 및 diff 검사 통과. 데스크톱 다크와 모바일 라이트 화면에서 가로 넘침이 없고 코드 영역만 내부 스크롤되는 것을 확인했다.
- 증거: `/private/tmp/mono-datetime-usage-binding.png`, `/private/tmp/mono-datetime-usage-conversion.png` (1440 × 1000px), `/private/tmp/mono-datetime-usage-form-mobile.png`, `/private/tmp/mono-datetime-usage-code-mobile.png` (390 × 844px).
