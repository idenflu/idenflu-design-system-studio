# 문서 안내

프로젝트 시작은 [저장소 README](../README.md), 패키지 설치는 [React 패키지 README](../packages/react/README.md)를 확인합니다. 이 폴더는 상세 문서를 용도별로 모읍니다.

## 사용 가이드 · `guides/`

| 문서 | 용도 |
| --- | --- |
| [프로젝트 적용](guides/consumer-guide.md) | 소비 앱 연결, 스타일·테마 설정, 이전 HTML API에서 전환 |
| [문서 스튜디오](guides/studio-guide.md) | 문서 탐색·검색, 테마와 화면 조정 사용 |

## API 참조 · `reference/`

| 문서 | 용도 |
| --- | --- |
| [React 컴포넌트](reference/react-components.md) | 속성·값·이벤트·키보드 계약과 코드 예제 |
| [아이콘](reference/icons.md) | 공개 이름·분류·표현·접근성·사용 예제 |

## 개발과 운영 · `development/`

| 문서 | 용도 |
| --- | --- |
| [로컬 개발](development/local-development.md) | 의존성·개발 서버·로컬 예제·소스 파일 구성 |
| [검사와 CI](development/testing.md) | 검사 명령·브라우저 환경 태그·CI 분할 실행 |
| [배포와 패키지 게시](development/deployment.md) | 정적 빌드·GitHub Pages·React 패키지 게시 |

## QA · `qa/`

| 문서 | 용도 |
| --- | --- |
| [전체 검증](qa/overview.md) | 검사 책임·변경별 확인 사항·공개 검증 기록 |
| [Datetime picker](qa/datetime-picker.md) | 일시 선택기의 검사 범위·재현 명령·검증 한계 |

## 조사와 전환 기록

| 문서 | 용도 |
| --- | --- |
| [아이콘 확장 근거](research/icon-research.md) | 공식 자료·선정 판단·도형 변경의 근거 |
| [React 문서 전환](migrations/react-studio.md) | 이전 구현 제거·주소 호환·전환 범위 |
| [변경 이력](../CHANGELOG.md) | 버전별 사용자 영향과 호환성 변경 |

## 문서를 추가하거나 수정할 때

- 루트 `README.md`는 프로젝트 소개·빠른 시작·문서 진입점으로 유지합니다.
- `CONTRIBUTING.md`에는 변경·리뷰·호환성·릴리스 기준을, 상세 명령과 절차는 `development/`에 기록합니다.
- 패키지 `README.md`는 설치·빠른 사용 안내로 유지합니다. 패키지는 `dist/`만 배포하므로 상세 문서 링크는 GitHub 절대 주소를 사용합니다.
- 가이드는 작업 방법, 참조는 공개 API 계약, QA는 검사 범위와 근거, 리서치는 선정 이유, 전환 기록은 이전 구현과 호환 관계를 다룹니다.
- 같은 절차를 여러 문서에 복사하지 않고 담당 문서를 링크합니다. 파일을 옮기면 상대 링크·목차 앵커와 GitHub 절대 링크를 함께 갱신합니다.
- 에셋 출처·라이선스는 에셋 폴더에 유지합니다. [아이콘 SOURCE.md](../systems/idenflu-mono/assets/icons/idenflu/SOURCE.md)는 에셋과 함께 배포됩니다.
- 문서 사이트의 실제 페이지·제목·메뉴 순서는 [routes.json](../packages/react/studio/routes.json)을 기준으로 합니다.
