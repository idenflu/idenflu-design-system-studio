# 검사와 CI

[로컬 개발 안내](local-development.md)에 따라 루트와 React 패키지 의존성을 설치합니다. 아래 명령은 저장소 루트에서 실행합니다.

## 전체 검사

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

패키지 배포 파일의 포함 여부는 `npm pack ./packages/react --dry-run`으로 확인합니다.

## 브라우저 환경 선택

브라우저 동작 검사는 기본적으로 데스크톱 라이트에서 한 번 실행합니다. 테스트 선언의 `tag`에 `@theme`을 지정하면 다크에서도, `@mobile`을 지정하면 320px 터치 환경에서도 실행합니다. 모바일 전용 검사는 `@mobile`과 `@mobile-only`를 함께 지정해 라이트 중복을 제외합니다. 새 색상·대비 회귀에는 `@theme`을, 반응형·팝업 위치·포커스·스크롤 회귀에는 필요한 환경 태그를 추가합니다. 테스트 안에서 두 테마를 직접 순회하는 검사는 라이트에서 한 번만 실행합니다.

전체 경로·제목·넘침 검사는 기본 브라우저 검사에, 설정 저장·초기화는 `preferences.spec.js`에 모읍니다. 입력 경계값과 정렬·필터의 조합은 단위 테스트에서 자세히 검사하고, 브라우저에서는 대표 사용자 흐름과 실제 레이아웃·키보드 동작을 확인합니다.

## 품질 CI

품질 CI는 기본 브라우저 검사와 Studio 검사를 독립 작업으로 실행합니다. Studio의 전체 테스트를 4개 shard로 나누어 동시에 검사하고 각 shard는 worker 2개를 사용합니다. CI에서는 문서를 미리 빌드한 뒤 파일 감시가 없는 정적 서버를 사용합니다. 같은 브랜치에 새 커밋을 푸시하면 이전 품질 검사를 취소합니다.

로컬에서 Studio 분할 실행을 확인하려면 아래 명령의 `1`을 `1`~`4`로 바꿔 각 shard를 실행합니다.

```sh
npx playwright test --config packages/react/studio/playwright.config.cjs --shard=1/4 --workers=2
```

[품질 워크플로](../../.github/workflows/quality.yml)는 `main` 푸시와 수동 실행을 지원하며 실제 작업은 `main`에서만 실행합니다. `dev` 푸시·PR에는 자동 Actions를 실행하지 않습니다.

검사 책임·변경별 확인 사항·검증 기록은 [QA 안내](../qa/overview.md), 일시 선택기 재현 명령은 [Datetime picker QA](../qa/datetime-picker.md)에서 관리합니다.
