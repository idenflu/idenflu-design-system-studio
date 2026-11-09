# 문서 사이트 배포와 React 패키지 게시

문서 사이트와 재사용 React 패키지는 각각 배포합니다. 변경·버전·호환성 기준은 [CONTRIBUTING.md](../../CONTRIBUTING.md), 검사 명령은 [검사 안내](testing.md)를 따릅니다.

## 정적 문서 빌드

[로컬 개발 안내](local-development.md)에 따라 의존성을 설치한 뒤 저장소 루트에서 실행합니다.

```sh
npm run build
```

`npm run build`는 React 패키지를 빌드한 뒤 `dist/`에 갤러리와 정식 모노 문서를 생성합니다. 폴더 전체를 정적 호스팅에 배포합니다. React 문서·CSS·테마·설정은 내용 기반 해시를 사용하며 `dist/systems/idenflu-mono/manifest.json`에서 파일명을 확인합니다. 폰트·아이콘과 라이선스도 함께 복사합니다.

컴포넌트 구현·스타일은 `packages/mono-react/src/components/`와 `src/styles/`, 공유 에셋 원본은 `packages/mono-react/assets/`, 문서 코드·스타일·샘플 에셋 원본은 `systems/idenflu-mono/studio/`에 있습니다. 문서 빌드는 `packages/mono-react/assets/`와 `studio/assets/`를 합쳐 생성된 공개 `systems/idenflu-mono/assets/` 경로로 제공합니다. 로컬 `docs-dist/`와 공개 `assets/`는 Git에서 제외하며 원본을 수정한 뒤 다시 빌드합니다.

이전 manifest의 `files.runtime`과 `files.styles`는 제거했으며, 문서용 스타일은 `files.docsComponents`와 `files.docsStyles`를 사용합니다. 앱에서 재사용할 때는 React 패키지를 설치합니다.

## GitHub Pages 배포

저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다. `Deploy from a branch` 방식은 빌드되지 않은 소스만 올리므로 Git에서 제외한 `docs-dist` 파일이 없어 모노 문서가 표시되지 않습니다.

[Pages 워크플로](../../.github/workflows/pages.yml)는 `main`에 푸시하거나 **Actions → Deploy GitHub Pages → Run workflow**에서 `main`을 선택하면 실행됩니다. 루트와 React 의존성을 설치하고, 검사·`npm run build`·타입 검사를 통과한 `dist/` 전체를 배포합니다. 생성된 JS·CSS를 직접 커밋할 필요는 없습니다.

`dev` 푸시·PR에는 자동 Actions를 실행하지 않습니다. 품질 검사와 Pages 배포는 `main`에 푸시할 때 실행합니다. 수동 품질 검사·Pages 배포·React 패키지 게시도 `main`에서만 작업을 실행합니다.

**Settings → Environments → github-pages → Deployment branches and tags**에서도 `main`만 허용합니다. Pages의 Source는 계속 **GitHub Actions**를 사용합니다.

배포할 변경을 개발 브랜치 `dev`에 커밋·푸시한 뒤 다음과 같이 반영합니다.

```sh
git fetch origin
git switch dev
git pull --ff-only
git switch main
git pull --ff-only
git merge dev
git push origin main
git switch dev
```

`dev`에서 개발하고 배포할 변경을 `main`에 병합합니다. 별도 배포 브랜치는 사용하지 않습니다.

- [디자인 시스템 갤러리](https://idenflu.github.io/idenflu-design-system-studio/)
- [idenflu mono 문서](https://idenflu.github.io/idenflu-design-system-studio/systems/idenflu-mono/index.html#/overview)
- [Datetime picker](https://idenflu.github.io/idenflu-design-system-studio/systems/idenflu-mono/index.html#/components/datetime-picker)

설정을 바꾸고 `main`을 푸시한 뒤, Actions에서 build와 deploy가 모두 성공했는지 확인합니다. 문서는 저장소 하위 경로에서도 동작하도록 상대 경로와 해시 라우팅을 사용합니다.

## React 패키지 게시

루트와 `packages/mono-react/`의 의존성을 설치하고 [전체 검사](testing.md)를 통과한 뒤 패키지 구성을 확인합니다.

```sh
npm pack ./packages/mono-react --dry-run
npm run test:package
```

빌드 결과에 ESM·CommonJS, TypeScript 선언, `styles.css`·`tokens.css`·`reset.css`, 개별 React 아이콘과 참조하는 에셋 및 에셋 라이선스가 포함됩니다. 공개 `@idenflu/mono-react`와 이 패키지의 `styles.css`·`tokens.css`·`reset.css`·`icons`·`assets/*` 하위 경로는 유지합니다. 에셋은 `packages/mono-react/assets/`만 복사하며 스튜디오 전용 CSS·워크스페이스 로고 등 샘플 에셋은 포함하지 않습니다.

배포 전에 개발 브랜치에서 패키지 버전을 올리고 변경을 `main`에 반영한 뒤, [Publish React package 워크플로](../../.github/workflows/publish-react.yml)에서 `main`을 선택해 수동 실행합니다. `dev`에서는 게시 작업을 실행하지 않습니다. 해당 워크플로는 저장소의 `GITHUB_TOKEN`으로 GitHub Packages에 게시하며 저장소의 Packages 쓰기 권한이 필요합니다.

게시 워크플로는 실제 tarball을 임시 앱에 설치해 공개 JS·타입·CSS·에셋과 SSR·hydration을 확인한 뒤 게시합니다.

게시 워크플로는 `packages/mono-react/package.json`의 버전에 해당하는 `## 0.5.0` 형식의 제목이 CHANGELOG에 정확히 하나 있고, 그 아래에 실제 목록 항목이 하나 이상 있는지 게시 전에 검사합니다. 날짜는 게시 후 실제 KST 날짜로 기록하므로 검사에서 필수로 요구하지 않습니다. 로컬에서는 `npm run check:changelog`로 같은 검사를 실행할 수 있습니다. 이 검사는 항목의 유무만 확인하므로 내용의 정확성과 충분성은 별도로 검토해야 합니다.

설치·레지스트리 인증은 [패키지 README](../../packages/mono-react/README.md)를 확인합니다.
