# 아이콘 확장 근거

조사일: 2026-11-02. MUI·Material Symbols·Ant Design·Heroicons·Lucide의 공식 문서와 카탈로그를 비교했다. 아래 선정은 여러 라이브러리에 반복해서 등장하는 개념과 이 스튜디오의 탐색·폼·데이터·커머스 용도를 기준으로 한다. 다운로드 수나 실제 제품 사용 빈도의 순위를 측정한 결과는 아니다.

## 공식 자료에서 확인한 내용

| 자료 | 확인한 내용 | 이번 확장에 적용한 판단 |
| --- | --- | --- |
| [MUI Icons](https://mui.com/material-ui/icons/), [Material Icons 카탈로그](https://mui.com/material-ui/material-icons/) | Filled가 기본이며 Outlined·Rounded·Two-tone·Sharp 테마를 제공한다. 컴포넌트 이름에 테마 접미사를 붙여 구분한다. | 기존 파일명 규칙을 유지하면서 같은 개념의 Outline/Filled를 명시적으로 구분한다. |
| [Google Material Symbols 가이드](https://developers.google.com/fonts/docs/material_symbols) | FILL 축은 기본 0과 완전히 채운 1을 제공하며 상태 전환·상호작용을 표현하는 데 사용할 수 있다. | 북마크의 기본/선택 상태에 Outline/Filled 쌍을 사용한다. 가변 폰트 자체는 도입하지 않는다. |
| [Ant Design Icon 공식 문서 소스](https://github.com/ant-design/ant-design/blob/master/components/icon/index.en-US.md), [공식 SVG 목록](https://github.com/ant-design/ant-design-icons/tree/master/packages/icons-svg/svg) | `StarOutlined`·`StarFilled`·`StarTwoTone`처럼 테마를 구분한다. SVG의 크기와 색상을 조정할 수 있다. | 선호·저장·알림 등 구분이 유용한 개념에 Filled 짝을 제공한다. |
| [Heroicons 공식 README](https://github.com/tailwindlabs/heroicons#react), [24px Outline 목록](https://github.com/tailwindlabs/heroicons/tree/master/optimized/24/outline) | 24×24 Outline과 Solid를 별도 제공하며 20×20·16×16 Solid도 제공한다. | 24px 기준의 두 형태를 비교하되, 기존 스튜디오의 각진 선 끝과 1.5px 선 두께를 유지한다. |
| [Lucide 아이콘 목록](https://lucide.dev/icons/), [Filled 아이콘 안내](https://lucide.dev/guide/react/advanced/filled-icons) | 광범위한 Outline 개념을 제공한다. Filled는 공식 지원하지 않으며 일부 아이콘에서만 `fill`이 동작할 수 있다고 설명한다. | 모든 Outline에 단순히 `fill`을 적용하지 않고 Filled 도형을 따로 작성한다. |

Ant Design과 Heroicons의 웹 카탈로그는 조사 시 HTTP 403을 반환해 공개 공식 GitHub 문서·목록으로 확인했다.

## 선정 범위

| 제품 용도 | 신규 Outline | 카탈로그에서 확인한 대응 개념의 예 |
| --- | --- | --- |
| 탐색·콘텐츠 | `home`, `folder`, `external-link`, `image`, `globe` | MUI Home·Folder·OpenInNew·Image·Public, Heroicons home·folder·arrow-top-right-on-square·photo·globe-alt |
| 편집·작업 | `edit`, `save`, `refresh`, `attachment`, `undo`, `redo`, `sort` | MUI Edit·Save·Refresh·AttachFile·Undo·Redo·Sort, Ant Design edit·save·reload·paper-clip·undo·redo·sort-ascending |
| 협업·선호·계정 | `bell`, `chat`, `heart`, `star`, `bookmark`, `users`, `shield-check`, `logout` | MUI Notifications·Chat·Favorite·Star·Bookmark·Group·VerifiedUser·Logout, Heroicons bell·chat-bubble-left·heart·star·bookmark·users·shield-check |
| 데이터·대시보드 | `dashboard`, `chart-bar`, `chart-line` | MUI Dashboard·BarChart·ShowChart, Ant Design dashboard·bar-chart·line-chart |
| 커머스·업무 | `cart`, `credit-card`, `receipt`, `tag`, `briefcase` | MUI ShoppingCart·CreditCard·Receipt·Label·Work, Heroicons shopping-cart·credit-card·receipt-percent·tag·briefcase |
| 입력·위치·도움 | `camera`, `location`, `send`, `help-circle` | MUI CameraAlt·LocationOn·Send·Help, Heroicons camera·map-pin·paper-airplane·question-mark-circle |

동일한 의미도 라이브러리마다 이름과 도형이 다르다. 대응 예는 개념 선정의 근거이며 파일명·경로·도형을 그대로 가져왔다는 의미는 아니다.

신규 Filled는 `home`, `folder`, `bell`, `chat`, `heart`, `star`, `bookmark`, `image`, `users`, `shield-check`, `dashboard`, `cart`, `credit-card`, `receipt`, `tag`, `briefcase`, `camera`, `location`, `send`, `help-circle`의 20종이다. 파일과 React 이름에는 `-fill`을 붙인다.

2026-11-02 확장 당시에는 기존 47종에 Outline 32종·Filled 20종을 더한 **99종**이었다. 이후 애플리케이션 1종, 업무 24종, 상태 6종, 권한·역할 10종을 더해 현재는 **140종(Outline 106종·Filled 34종)**이다. 모두 공개 React `Icon`과 공통 CSS 마스크로 사용할 수 있다. 기존 `plus`·`email` 같은 별칭은 유지한다.

## 업무·데이터 확장 · 2026-11-04

현재 폼·데이터그리드·워크스페이스의 동작을 기준으로 선정했다. 아래 이름은
idenflu mono의 공개 이름이며 외부 라이브러리의 이름과 일치할 필요는 없다.
외부 라이브러리를 런타임 의존성으로 추가하지 않고 기존 톤에 맞춰 작성했다.

| 용도 | 추가 이름 | 선택 이유 |
| --- | --- | --- |
| 정렬·필터 | `sort-ascending`, `sort-descending`, `filter-clear` | 기존 `sort`만으로 구분하기 어려운 방향·초기화 동작을 표현한다. |
| 그리드·목록 | `columns`, `pin`, `pin-off`, `drag-handle`, `more-vertical` | 표시 열, 고정 상태, 순서 변경과 행 메뉴를 구분한다. |
| 문서·파일 | `file-text`, `folder-open`, `archive`, `share`, `printer` | 문서 종류, 폴더 상태와 문서 작업에 사용한다. |
| 계정·권한 | `user-plus`, `user-minus`, `login`, `unlock` | 멤버 초대·제외, 로그인과 잠금 해제에 사용한다. |
| 상태 | `error-circle`, `ban` | 오류와 사용 제한을 분리한다. 오류는 메시지, 제한은 사유와 함께 표시한다. |
| 설정·화면 | `sliders`, `maximize`, `minimize`, `sun`, `moon` | 상세 설정과 화면·테마 전환에 사용한다. 해·달은 기존 화면의 도형을 공통 자산으로 옮긴다. |

공식 개념 참고: Lucide의 [정렬](https://lucide.dev/icons/arrow-up-narrow-wide),
[열](https://lucide.dev/icons/columns-3), [필터 초기화](https://lucide.dev/icons/funnel-x),
[드래그 핸들](https://lucide.dev/icons/grip-vertical),
[고정 해제](https://lucide.dev/icons/pin-off), [오류](https://lucide.dev/icons/circle-x),
[Heroicons 카탈로그](https://heroicons.com/),
[Carbon 아이콘 목록](https://www.carbondesignsystem.com/building-blocks/foundations/icons/library).

24종 모두 24×24·1.5px·butt·miter 규칙을 사용한다. 선 끝을 둥글게 바꾸거나
전체에 Filled를 일괄 적용하지 않는다. 문서에서는 14·16·18·20px에서 비교하며,
정렬 전에는 아이콘을 숨기고 정렬 후에만 방향을 표시하는 예시를 제공한다.

## 상태·권한과 도형 보정 · 2026-11-04

실제 14·16px 표시와 SVG 원본을 함께 검토해 원형 프레임·파생형 비율·내부 밀도를 보정했다.
원형 오류·차단의 반지름은 10으로 맞추고, 잠금·파일·필터의 파생형은 원본 외곽을 재사용한다.
인물 계열의 머리와 어깨 곡선을 맞추고, 복잡한 빗금의 간격과 Filled 내부 여백을 확보했다.

상태 신규 6종은 `circle-dashed`, `circle-dot`, `pause-circle`, `minus-circle`,
`error-circle-fill`, `ban-fill`이다. 대기·진행·보류·비활성을 구분하며 완료는 체크,
주의는 삼각형, 오류는 원형 X, 차단은 원형 빗금을 사용한다. 검토 중은 진행 상태이고
검토가 필요한 조건은 주의 상태로 구분한다. 기본은 Outline, 반전 피드백은 대응 Filled를 사용한다.
진행 상태의 정지형 아이콘과 요청 처리 중의 Spinner는 역할을 나눈다.

권한·역할 신규 10종은 `key`, `shield`, `shield-off`, `shield-alert`, `user-check`,
`user-lock`, `user-settings`, `id-card`, `hierarchy`, `crown`이다. 역할 이름과 접근 결과를
구분해 표시하며 인물 복합 도형은 16px 이상을 권장한다. 소유자는 crown, 역할 관리는
user-settings, 접근 허용은 기존 shield-check, 거부는 shield-off로 표현한다.

상태 4종과 권한 6종의 원본은 [Lucide 0.468.0](https://github.com/lucide-icons/lucide/tree/0.468.0/icons)이다.
선 두께·끝·연결을 조정하고 인물·프레임·점의 크기는 기존 시스템에 맞췄다.
나머지는 기존 도형의 조합·반전이며 출처와 변경 내역은 자산의 [SOURCE.md](../../packages/idenflu-mono-react/assets/icons/idenflu/SOURCE.md)에 기록한다.

## 사용 기준

- 일반 동작·보조 정보는 Outline을 기본으로 고려한다. 선택·즐겨찾기·저장 상태나 강조가 필요한 곳은 대응 Filled를 사용할 수 있다. 이는 이 스튜디오의 적용 기준이다.
- 화살표·편집·정렬처럼 채워도 상태 구분의 이점이 적은 개념은 Outline으로 유지한다. 모든 아이콘의 Filled를 기계적으로 만들지 않는다.
- 상태는 아이콘 형태 외에 `aria-pressed`·선택 속성·텍스트로도 전달한다. 아이콘만 있는 버튼의 이름은 버튼에 지정한다. [Lucide 접근성 안내](https://lucide.dev/how-to/accessibility)와 [MUI 접근성 안내](https://mui.com/material-ui/icons/#accessibility)를 참고했다.
- 신규 도형은 기존의 24×24·1.5px·butt·miter 규칙에 맞춰 이 스튜디오용으로 작성했다. 외부 라이브러리를 런타임 의존성으로 추가하거나 원본 47종을 교체하지 않는다. 출처 구분은 [SOURCE.md](../../packages/idenflu-mono-react/assets/icons/idenflu/SOURCE.md)에 기록한다.
