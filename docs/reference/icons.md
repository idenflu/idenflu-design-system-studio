# React 아이콘 참조

설치와 스타일 설정은 [React 패키지 README](../../packages/react/README.md)를 확인합니다.

## 목차

- [지원 이름과 스타일](#지원-이름과-스타일)
- [업무·데이터 아이콘](#업무데이터-아이콘)
- [상태·권한 아이콘](#상태권한-아이콘)
- [사용 예시](#사용-예시)
- [접근성과 문서](#접근성과-문서)

## 지원 이름과 스타일

`Icon`은 현재 글자색을 따르는 SVG 마스크를 사용하며 전체 140종(Outline 106종·Filled 34종)을 SVG 파일명 그대로 지원합니다. `name`의 타입은 `IconName`으로 내보냅니다. 기존 `plus`, `trash`, `list`, `email`, `eye`, `eye-slash`, `caret` 별칭도 유지합니다. 크기는 `--icon-size`로 조정합니다.

Outline은 기존의 24×24 기준, 1.5px 선과 각진 선 끝을 유지합니다. Filled는 `-fill` 접미사로 선택하며 모든 아이콘에 Filled가 있는 것은 아닙니다.

Outline 아이콘을 설계할 때의 형태·그리드·공간 기준은 [아이콘 디자인 원칙](icon-design-principles.md)을 참고합니다. Filled 아이콘은 이 문서의 기존 사용 정책을 따릅니다.

## 개별 React 아이콘

`icons.svg`의 심볼을 독립 React 컴포넌트로 생성합니다. 스프라이트 설치 없이 사용할 수 있습니다.

```tsx
import { PlusIcon, BookmarkIcon } from '@idenflu/mono-react/icons';

<PlusIcon size={20} />
<BookmarkIcon size={20} label="저장됨" />
```

0.5.0 예정 컴포넌트는 Outline만 제공합니다. 기본 크기는 16px이며, `label`이 없으면 장식으로 숨깁니다. 아이콘 자체가 의미를 전달할 때는 `label`을 지정합니다. 원본은 `systems/idenflu-mono/assets/icons/icons.svg`이며 React 패키지 폴더에서 `npm run generate:icons`로 생성하고 `npm run check:icons`로 최신 상태를 확인합니다. 생성 파일은 직접 수정하지 않습니다.

기존 `<Icon name="…">`과 CSS 마스크는 보존된 개별 SVG를 계속 사용하며 Filled도 유지합니다. 스프라이트 수정은 이 기존 자산에 자동 반영되지 않으므로 버전별 도형이 다를 수 있습니다. 새 아이콘을 기존 API에서도 제공하려면 개별 자산과 CSS·이름 등록을 별도로 갱신해야 합니다.

## 업무·데이터 아이콘

업무·데이터 아이콘 24종을 추가했습니다. `sun`·`moon`은 기존 테마 버튼의 도형을 공통 자산으로 옮겼습니다.

| 용도 | `name` |
| --- | --- |
| 정렬·필터 | `sort-ascending`, `sort-descending`, `filter-clear` |
| 그리드·목록 | `columns`, `pin`, `pin-off`, `drag-handle`, `more-vertical` |
| 문서·파일 | `file-text`, `folder-open`, `archive`, `share`, `printer` |
| 계정·권한 | `user-plus`, `user-minus`, `login`, `unlock` |
| 상태 | `error-circle`, `ban` |
| 설정·화면 | `sliders`, `maximize`, `minimize`, `sun`, `moon` |

## 상태·권한 아이콘

상태 아이콘 6종과 권한·역할 아이콘 10종도 제공합니다.

| 구분 | 추가 이름 |
| --- | --- |
| 업무 상태 | `circle-dashed`(대기), `circle-dot`(진행), `pause-circle`(보류), `minus-circle`(비활성) |
| 상태 강조 | `error-circle-fill`(오류), `ban-fill`(차단) |
| 권한·정책 | `key`, `shield`, `shield-off`, `shield-alert` |
| 계정·역할 | `user-check`, `user-lock`, `user-settings`, `id-card`, `hierarchy`, `crown` |

동일한 상태는 토스트·배지·데이터그리드에서 같은 도형을 사용합니다. 완료는
`check-circle`, 오류는 `error-circle`, 주의는 `warning`으로 구분합니다.
검토 중은 진행 상태로 표시하고, 확인이 필요한 조건은 주의로 표시합니다.
반전 스타일에서는 피드백 상태의 Filled를 사용하며 업무 상태 4종은 기본 도형을
유지합니다. 진행 상태의 `circle-dot`은 정지형이며 요청 로딩에는 `Spinner`를 씁니다.
권한·역할의 인물 복합 도형은 16px 이상을 권장하며 이름을 함께 표시합니다.

## 사용 예시

```tsx
import { useState } from 'react';
import { Button, Icon, IconButton } from '@idenflu/mono-react';
import '@idenflu/mono-react/styles.css';

export function IconActions() {
  const [bookmarked, setBookmarked] = useState(false);
  return <div>
    <Button><Icon name="save" />저장</Button>
    <IconButton label="북마크" variant="outline" aria-pressed={bookmarked}
      onClick={() => setBookmarked(value => !value)}>
      <Icon name={bookmarked ? 'bookmark-fill' : 'bookmark'} />
    </IconButton>
  </div>;
}
```

## 접근성과 문서

일반 동작은 Outline, 선택·저장 상태나 강한 시각적 강조는 Filled를 우선 고려합니다. 상태를 전환할 때는 형태와 함께 `aria-pressed`나 텍스트도 갱신합니다. `Icon`은 장식으로 처리되므로 의미는 함께 표시하는 텍스트로 전달하고, 아이콘만 있는 버튼에는 `IconButton`의 `label`을 지정합니다.

문서의 파운데이션 → Icons에서 전체 목록을 이름으로 검색하고 Outline/Filled로 필터링할 수 있습니다. 업무 아이콘은 14·16·18·20px 크기를 비교하고 정렬·고정 동작도 확인할 수 있습니다. 선정 근거와 공식 자료는 [아이콘 리서치](../research/icon-research.md)에 정리했습니다.
