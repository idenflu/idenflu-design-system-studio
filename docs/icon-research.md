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

최종 구성은 기존 47종에 Outline 32종·Filled 20종을 더한 **99종**이다. 전체 카탈로그에는 Outline 67종·Filled 32종이 있으며, 모두 공개 React `Icon`과 공통 CSS 마스크로 사용할 수 있다. 기존 `plus`·`email` 같은 별칭은 유지한다.

## 사용 기준

- 일반 동작·보조 정보는 Outline을 기본으로 고려한다. 선택·즐겨찾기·저장 상태나 강조가 필요한 곳은 대응 Filled를 사용할 수 있다. 이는 이 스튜디오의 적용 기준이다.
- 화살표·편집·정렬처럼 채워도 상태 구분의 이점이 적은 개념은 Outline으로 유지한다. 모든 아이콘의 Filled를 기계적으로 만들지 않는다.
- 상태는 아이콘 형태 외에 `aria-pressed`·선택 속성·텍스트로도 전달한다. 아이콘만 있는 버튼의 이름은 버튼에 지정한다. [Lucide 접근성 안내](https://lucide.dev/how-to/accessibility)와 [MUI 접근성 안내](https://mui.com/material-ui/icons/#accessibility)를 참고했다.
- 신규 도형은 기존의 24×24·1.5px·butt·miter 규칙에 맞춰 이 스튜디오용으로 작성했다. 외부 라이브러리를 런타임 의존성으로 추가하거나 원본 47종을 교체하지 않는다. 출처 구분은 [SOURCE.md](../systems/idenflu-mono/assets/icons/idenflu/SOURCE.md)에 기록한다.
