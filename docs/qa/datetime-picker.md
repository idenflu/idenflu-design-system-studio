# Datetime picker 검증 안내

기록된 자동 검증 기준은 **2026-11-04, `d5cc1fd`**입니다. 해당 커밋의 [품질 CI 결과](https://github.com/idenflu/idenflu-design-system-studio/actions/runs/41686480379)에서 단위·타입·빌드·브라우저 검사의 성공 여부와 실행 로그를 확인할 수 있습니다. 이 문서는 검사 범위와 재현 방법을 정리합니다.

## 검증 범위

- 직접 입력한 단일·범위 일시의 정규화, 잘못된 날짜·시간, 역전 범위, `min`·`max`·`minuteStep` 검증
- 달력·시간 목록의 임시 선택과 명시적 확인, 범위의 시작 → 다음 → 종료 → 확인 흐름
- 취소·외부 클릭·Escape 시 확정값 유지, 키보드 이동과 포커스 복원
- 폼 제출·초기화, controlled 값·빈 값과 외부 값 변경
- 좁은 화면의 팝업 위치·내부 스크롤·확인 버튼 접근, 마우스 스크롤바 조작 중 팝업 유지
- 문서 사용 예시의 값 바인딩·FormData·UTC 변환과 표시 코드의 타입 검사

단위 검사는 [일시 선택기 계약](../../packages/react/tests/datetime-picker.test.mjs)에 있습니다. 실제 브라우저의 팝업·포커스·스크롤 검사는 [일시 선택기](../../systems/idenflu-mono/studio/datetime-picker.spec.cjs), [스크롤바](../../systems/idenflu-mono/studio/datetime-scrollbar.spec.cjs), [사용 예시](../../systems/idenflu-mono/studio/datetime-usage.spec.cjs)에서 확인합니다.

## 재현 방법

[로컬 개발 안내](../development/local-development.md)에 따라 의존성을 설치한 뒤 저장소 루트에서 실행합니다.

```sh
npm --prefix packages/react run build
npm --prefix packages/react run studio:build
node --test packages/react/tests/datetime-picker.test.mjs
npx playwright install chromium
npx playwright test --config systems/idenflu-mono/studio/playwright.config.cjs datetime-picker.spec.cjs datetime-scrollbar.spec.cjs datetime-usage.spec.cjs --workers=2
```

브라우저 검사는 로컬 개발 서버를 자동으로 실행합니다. `@theme`·`@mobile` 태그에 따라 해당 환경이 필요한 회귀만 추가 실행하며, 마우스 스크롤바 검사는 데스크톱에서 실행합니다. 전체 검사 방법과 환경 선택 기준은 [검사 안내](../development/testing.md)를 따릅니다.

## 결과를 기록할 때

검증한 날짜·커밋·명령·환경과 CI 실행 링크를 함께 남깁니다. 시각 비교가 필요한 변경에는 저장소 또는 공개 CI artifact에서 열 수 있는 이미지를 첨부하고, 비교한 상태와 viewport를 명시합니다. 제공하지 않는 로컬 캡처를 검증 근거로 사용하지 않습니다.

## 검증의 한계

자동 브라우저 검사는 실제 스크린리더와 물리적 터치 기기 검수를 대체하지 않습니다. 최근 CI 결과를 전체 WCAG 적합성이나 새로운 시각 검수의 완료로 해석하지 않습니다. 문서 예시의 시간대 변환은 고정 UTC+09:00 예시이며 실제 서비스의 시간대·서버 저장 정책은 앱에서 결정합니다.
