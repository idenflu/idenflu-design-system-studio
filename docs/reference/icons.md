# React 아이콘 참조

`icons.svg`의 141개 심볼이 아이콘의 단일 원본입니다. Foundations의 아이콘 목록에서 이름과 개별 컴포넌트 이름을 검색할 수 있습니다.

```tsx
import { Icon } from '@idenflu/mono-react';
import { SearchIcon } from '@idenflu/mono-react/icons';
import '@idenflu/mono-react/styles.css';

<Icon name="search" />
<SearchIcon size={20} label="검색" />
```

`Icon`은 장식용이며 현재 글자색과 `--icon-size`를 따릅니다. 개별 컴포넌트는 기본 16px이며 `size`로 크기를 지정합니다. 장식용이면 접근성 트리에서 숨겨지고, 의미를 전달하면 `label`을 지정합니다. 아이콘만 있는 버튼에는 버튼의 접근 가능한 이름을 지정하세요.

기존 이름과 Filled 아이콘은 최종 목록에서 제거되었습니다. 예를 들어 `add`, `close`, `person`, `microsoft-excel`은 각각 `plus`, `x`, `user`, `excel`로 변경합니다.

아이콘 원본을 수정한 후 패키지 디렉터리에서 `npm run generate:icons`를 실행하고 `npm run check:icons`로 생성 결과를 확인합니다. 생성된 컴포넌트와 마스크 CSS, 이름 타입은 직접 수정하지 않습니다. 형태 기준은 [아이콘 디자인 원칙](icon-design-principles.md)을 참고합니다.

## 탐색·작업 아이콘 추가

`history`, `bell-off`, `link-off`, `file-plus`, `folder-plus`, `panel-left`,
`chevrons-left`, `chevrons-right`를 제공합니다. 기존 파일·폴더·알림·링크의
외곽과 24×24·1.5px·square·miter 규칙을 유지합니다. 비활성 파생형은
빗금 주변을 마스크로 비워 작은 크기에서도 선이 뭉치지 않게 합니다.

## 편집·문서 작업 아이콘 추가

`clipboard`, `clipboard-check`, `zoom-in`, `zoom-out`, `list-checks`, `inbox`,
`message-square-plus`, `chart-pie`를 제공합니다. 확대·축소는 기존 검색 아이콘의
외곽을, 새 대화는 기존 채팅 아이콘의 외곽을 공유합니다. 클립보드 두 종류도
동일한 외곽을 사용하며, 모든 아이콘에 공통 Outline 규칙을 적용합니다.

## 일정·연동 아이콘 추가

`calendar-plus`, `calendar-check`, `file-check`, `archive-restore`, `database`,
`plug`, `wifi-off`, `scan-line`을 제공합니다. 일정·문서·보관의 파생형은 기존
외곽을 재사용하고, 연결 끊김의 빗금에는 공통 마스크 간격을 적용합니다.
