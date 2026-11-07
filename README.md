[![Deploy GitHub Pages](https://github.com/idenflu/idenflu-design-system-studio/actions/workflows/pages.yml/badge.svg)](https://github.com/idenflu/idenflu-design-system-studio/actions/workflows/pages.yml)
[![Design system quality](https://github.com/idenflu/idenflu-design-system-studio/actions/workflows/quality.yml/badge.svg)](https://github.com/idenflu/idenflu-design-system-studio/actions/workflows/quality.yml)
[![Publish React package](https://github.com/idenflu/idenflu-design-system-studio/actions/workflows/publish-react.yml/badge.svg)](https://github.com/idenflu/idenflu-design-system-studio/actions/workflows/publish-react.yml)

# idenflu mono

React 기반 디자인 시스템과 문서 스튜디오입니다. 컴포넌트는 `@idenflu/mono-react` 패키지로 제공합니다.

## 실행

Node.js 20 이상에서 저장소 루트의 명령을 실행합니다.

```sh
npm ci
npm --prefix packages/react ci
npm run dev
```

- 갤러리: `http://127.0.0.1:4173/`
- 모노 문서: `http://127.0.0.1:4173/systems/idenflu-mono/index.html#/overview`

개발 서버는 컴포넌트·문서·CSS·아이콘 변경을 감지해 다시 빌드합니다. 갱신 후 브라우저를 새로고침합니다. 자세한 실행·예제·파일 구성은 [로컬 개발 안내](docs/development/local-development.md)를 확인합니다.

## 문서와 사용

전체 목록과 문서 작성 기준은 [문서 안내](docs/README.md)에서 확인합니다.

| 목적 | 문서 |
| --- | --- |
| React 패키지 설치와 빠른 사용 | [패키지 README](packages/react/README.md) |
| 앱에 적용·테마 설정·이전 HTML API 전환 | [프로젝트 적용 가이드](docs/guides/consumer-guide.md) |
| 검색·테마·화면 조정 사용 | [스튜디오 가이드](docs/guides/studio-guide.md) |
| 컴포넌트 속성·값·이벤트·예제 | [컴포넌트 참조](docs/reference/react-components.md) |
| 변경·검증·릴리스 기준 | [기여 안내](CONTRIBUTING.md) |
| 변경 내역 | [변경 이력](CHANGELOG.md) |

## 검사와 빌드

검사 명령·브라우저 환경·품질 CI는 [검사 안내](docs/development/testing.md), 검사 책임과 기록은 [QA 안내](docs/qa/overview.md)에 정리합니다.

`npm run build`로 `dist/`에 갤러리와 React 문서를 생성합니다. 번들 구성과 패키지 게시는 [배포 안내](docs/development/deployment.md)를 확인합니다.

## GitHub Pages 배포

`dev`에서 개발하고 배포할 변경을 `main`에 병합하면 문서 사이트를 자동 배포합니다. Pages 설정·브랜치 반영·수동 실행 절차는 [GitHub Pages 배포 안내](docs/development/deployment.md#github-pages-배포)를 따릅니다.

- [디자인 시스템 갤러리](https://idenflu.github.io/idenflu-design-system-studio/)
- [idenflu mono 문서](https://idenflu.github.io/idenflu-design-system-studio/systems/idenflu-mono/index.html#/overview)
- [Datetime picker](https://idenflu.github.io/idenflu-design-system-studio/systems/idenflu-mono/index.html#/components/datetime-picker)

## 파일 구성

- `packages/react/src/`: 재사용 React 컴포넌트와 스타일
- `systems/idenflu-mono/core/`: 공유 CSS·선택적 초기화·폰트·아이콘 원본
- `systems/idenflu-mono/studio/`: 문서 셸·샘플·화면 조정 UI·문서 스타일·브라우저 검사
- `systems/idenflu-mono/index.html`: 정식 React 문서 진입점
- `systems/idenflu-mono/docs-dist/`, `systems/idenflu-mono/assets/`: 빌드로 생성하는 문서 번들과 공개 에셋
- `packages/react/studio/index.html`: 이전 주소의 리다이렉트
- `scripts/`, `tests/`: 개발·검사·빌드 도구와 회귀 검사
- `docs/`: 사용·참조·개발·QA·리서치·전환 문서

## 라이선스

이 프로젝트의 자체 제작 소프트웨어는 [MIT 라이선스](LICENSE)에 따라 상업적 용도를 포함해 사용할 수 있습니다. 소프트웨어의 복사본이나 상당 부분을 배포할 때 저작권 표시와 라이선스 문구를 포함해야 합니다. 폰트, 아이콘 등 서드파티 자료에는 각각의 라이선스가 적용됩니다.

번들에 포함된 라이브러리의 고지는 React 패키지의 `dist/THIRD_PARTY_NOTICES.txt`와 문서 사이트 배포물의 `systems/idenflu-mono/docs-dist/THIRD_PARTY_NOTICES.txt`에 제공합니다. 폰트·아이콘의 라이선스와 출처 문서는 해당 에셋 폴더에 함께 배포합니다.
