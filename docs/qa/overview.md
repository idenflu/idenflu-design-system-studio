# idenflu mono 검증 안내

마지막으로 링크를 남긴 공개 자동 검증 기록은 **2026-11-04, `d5cc1fd`**입니다. [해당 품질 CI](https://github.com/idenflu/idenflu-design-system-studio/actions/runs/41686480379)의 작업별 로그와 보고서에서 당시 결과를 확인할 수 있습니다. 아래 표는 현재 검사 구성이며, 이후 추가한 검사의 결과까지 이 과거 실행 기록이 증명하지는 않습니다. 전체 검사 명령은 [검사 안내](../development/testing.md)에 있습니다.

## 검사 책임

| 범위 | 검사 위치 |
| --- | --- |
| 설정 값·저장·복원·색상 파생과 결정적 빌드 | [루트 Node 검사](../../tests/) |
| 컴포넌트 값·이벤트·폼 초기화·다중 인스턴스·정리 | [React 단위 검사](../../packages/mono-react/tests/) |
| 전체 경로·제목·넘침·배포본·리다이렉트·소비 앱 CSS 격리 | [기본 브라우저 검사](../../tests/browser.spec.js), [CSS 격리 검사](../../tests/css-isolation.spec.js) |
| 실제 포커스·키보드·팝업 배치·네이티브 모달·스크롤·반응형 | [Studio 브라우저 검사](../../systems/idenflu-mono/studio/) |
| 공개 선언과 문서 속성·타입·필수 여부의 일치 | [API 문서 검사](../../packages/mono-react/scripts/check-api-docs.mjs), `npm run check:api` |
| Chromium·Firefox·WebKit 핵심 입력·팝업 계약 | [브라우저 엔진 구성](../../playwright.compat.config.cjs), `npm run test:compat` |
| React 18.3.1·19.2.0, 공개 ESM·CJS SSR와 hydration | [React 호환성 검사](../../scripts/test-react-compat.mjs), `npm run test:react-compat -- --react=버전` |
| 대표 컴포넌트의 라이트·다크 이미지 비교 | [시각 회귀](../../tests/visual/components.spec.cjs), `npm run test:visual` |
| 일시 입력·범위 단계·시간 목록·시간대 사용 예시 | [Datetime picker 검증 안내](datetime-picker.md) |

동작 검사는 기본 라이트 환경에서 실행하고 색상·대비 회귀는 `@theme`, 반응형·터치·팝업·포커스·스크롤 회귀는 `@mobile`로 추가 환경을 선택합니다. 모바일 전용 회귀에는 `@mobile-only`를 함께 지정합니다. 테스트 안에서 양쪽 테마를 직접 확인하는 경우 같은 검사를 다크 환경에서 반복하지 않습니다.

## 변경별 확인 사항

- 입력은 라벨·오류 연결, 필수·비활성·읽기 전용, 제어형·비제어형 값과 폼 초기화를 확인합니다.
- 숫자·날짜·시간·일시 입력의 표준 ref는 실제 입력을 가리켜야 합니다. 범위 입력은 시작 ref와 `endInputRef`, 외부 `aria-describedby`·도움말·오류 연결을 함께 확인합니다.
- 팝업은 키보드 진입·Escape·외부 클릭·중첩 닫기 순서와 트리거 포커스 복원을 확인합니다.
- 레이아웃은 좁은 화면과 큰 글자에서 내용·조작 영역의 잘림, 가로 넘침과 내부 스크롤을 확인합니다.
- 색상은 라이트·다크, 선택·hover·pressed·disabled 상태, 대비 보정과 forced-colors를 확인합니다.
- 모션은 reduced-motion에서 상태 설명이 유지되는지 확인합니다.
- 패키지는 스타일 적용 범위, 모듈·타입·에셋·라이선스의 포함 여부와 예제 코드를 확인합니다.
- 문서는 섹션 주소의 직접 열기·새 탭·새로고침·뒤로/앞으로 이동, 잘못된 문서·섹션, 모바일 목차와 제목 포커스를 확인합니다.

브라우저 엔진 검사는 핵심 시나리오 4개를 각 엔진에서 실행하는 범위이며 전체 Studio 검사는 Chromium을 기준으로 합니다. React 호환성은 두 지원 버전의 서버 렌더링·hydration과 대표 폼 계약을 확인합니다.

시각 기준은 현재 macOS(`darwin`) 라이트·다크 2개로 로컬에서 비교합니다. 같은 OS와 고정된 Playwright·브라우저 버전을 사용하며, Linux CI 기준은 아직 없습니다. 의도한 변경이라도 이미지를 먼저 검토하고 명시적으로 갱신합니다. 기준이 없는 환경의 결과를 자동 승인하지 않습니다.

## 공개 검증 기록

검증 결과에는 날짜·커밋·실행 명령·환경과 CI 링크를 남깁니다. 이미지 증거가 필요하면 공개 CI artifact 또는 저장소에서 접근할 수 있는 파일을 사용합니다. 이 문서는 제공되지 않는 로컬 시안·임시 캡처에 의존한 과거 작업 메모를 대신합니다.

실제 스크린리더·물리적 터치 기기의 검수는 별도로 수행하고 대상과 결과를 기록해야 합니다. 자동 검사 통과는 전체 접근성 적합성이나 모든 브라우저·기기의 검증 완료를 의미하지 않습니다. 서버 저장·권한·네트워크·업로드·예약 연결 범위는 [소비자 가이드](../guides/consumer-guide.md)를 확인합니다.
