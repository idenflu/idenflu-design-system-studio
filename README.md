# idenflu mono

선택한 디자인 시안을 구현한 HTML·CSS·JavaScript 프로토타입입니다.

`index.html`을 브라우저로 열거나, 프로젝트 폴더에서 다음 명령으로 실행하세요.

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

미리보기: http://127.0.0.1:4173

기본 화면은 디자인 시스템 갤러리입니다. idenflu mono 문서는 `systems/idenflu-mono/index.html`에 있으며, 기존 루트 해시 주소도 해당 문서로 연결됩니다.

- 본문 Pretendard 14px / 행간 22px
- 기본 버튼·입력창·셀렉트 높이 38px
- Primary `#4263CC`, 기본 보더는 중성 회색 `#C6C6CC`
- 버튼·입력창·색상칩 radius 0px
- 토글은 둥근 트랙과 원형 손잡이 유지
- 포커스는 밝은 안쪽 2px 테두리
- 프로필 입력·검증·저장 피드백 및 토글 동작
- 모바일·태블릿 반응형 지원

## 문서 탐색

접고 펼칠 수 있는 고정 사이드 메뉴에서 각 페이지를 이동할 수 있습니다. 모바일에서는 메뉴 버튼으로 열고 닫습니다.
각 페이지는 고유 주소를 가지며 새로고침과 브라우저 뒤로·앞으로 가기를 지원합니다.

- 갤러리: `#/gallery`
- 개요: `#/overview`
- 기초: `#/foundations/colors`, `#/foundations/typography`, `#/foundations/sizes`, `#/foundations/icons`, `#/foundations/states`
- 컴포넌트: `#/components/buttons`, `select`, `selection`, `tabs`, `text-fields`, `feedback`, `accordion`, `overlays`, `table`, `tree`, `chips`, `list`, `progress`, `slider`, `date-picker`, `tooltip`, `dropdown-menu`, `popover`, `drawer`, `loading`, `file-upload`, `avatar`, `stepper`, `card`
- 패턴: `#/patterns/empty-state`, `#/patterns/form/profile`, `#/patterns/layout/app-shell`, `#/patterns/layout/dashboard`, `#/patterns/layout/list-detail`, `#/patterns/layout/tabs`, `#/patterns/layout/focused`, `#/patterns/page/list`, `#/patterns/page/detail`, `#/patterns/page/settings`, `#/patterns/page/login`

기존 `#overview`, `#foundations`, `#components`, `#states`, `#/components/empty-state` 주소도 해당 페이지로 연결됩니다.

## 일관된 사이즈

높이·좌우 패딩·아이콘 크기는 `systems/idenflu-mono/tokens.css`에서 함께 관리합니다. 기본은 md이며 본문과 컨트롤 문구는 모두 14px입니다.

| Size | 높이 | 좌우 패딩 | 아이콘 |
| --- | --- | --- | --- |
| sm | 32px | 10px | 14px |
| md | 38px | 12px | 16px |
| lg | 44px | 16px | 18px |

컴포넌트 하나 또는 컨테이너에 `data-size`를 적용하면 하위 버튼·입력창·셀렉트·날짜 선택기·아이콘이 같은 사이즈를 사용합니다.
체크박스·라디오·토글·배지는 각 컨트롤의 형태에 맞춰 함께 조정됩니다. 칩과 슬라이더는 sm/md/lg에서 각각 높이 32/38/44px로 적용됩니다.

```html
<button class="button" data-size="sm">저장</button>
<div data-size="lg">
  <input class="text-input" aria-label="이름" />
  <button class="button">저장</button>
</div>
```

## 컴포넌트

- 버튼: Primary, Secondary, Outline, Ghost, Danger, Loading, 버튼 그룹
- 커스텀 셀렉트: 설명·선택 표시·비활성 옵션, 방향키·Home·End·Enter·Escape·Tab, 바깥 클릭 닫기
- 멀티 셀렉트: 여러 항목 선택·해제, 입력 영역 안팎의 선택 칩과 전체 초기화, 키보드 목록 탐색
- 아이콘 포함 버튼, 아이콘 전용 버튼, 단일 선택 및 연관 행동 버튼 그룹
- 체크박스: 전체 선택과 부분 선택
- 라디오, 둥근 토글
- 탭: 클릭 및 방향키·Home·End 탐색
- 입력 그룹: 텍스트 프리픽스, 검색·이메일 아이콘, 단위 서픽스, 검색 지우기와 비밀번호 표시·숨기기
- 글자 수가 표시되는 텍스트 영역
- 배지, 인라인 알림
- 아코디언
- 다이얼로그: 입력 검증, Escape·취소·바깥 영역으로 닫기
- 닫을 수 있는 토스트 알림
- 테이블과 3페이지 페이지네이션
- 접고 펼치는 트리와 항목 선택, 선택 및 삭제 가능한 칩
- 기본·선택 목록, 진행률(두께·상태색·분할형·원형), 범위 슬라이더와 콘텐츠 슬라이드
- 슬라이더: 연속·10단계·비활성 예제, 방향키 및 Home/End 조작
- 날짜 선택: 직접 입력과 날짜 검증, 단일 날짜·기간 선택, 달력 월 이동과 초기화
- 달력 키보드 조작: Alt+방향키 아래로 열기, 방향키·Home·End·Page Up/Down 이동, Enter 선택, Esc 닫기
- 툴팁, 드롭다운 메뉴, 팝오버, 드로어
- 스켈레톤, 다양한 스피너(링·듀얼 링·도트·막대), 파일 선택, 사각형·원형 아바타, 스테퍼, 카드
- 파일 선택 예제는 로컬에서 파일 정보를 확인하며 서버로 전송하지 않습니다.

서버나 외부 서비스로 데이터를 보내지 않으며 새로고침하면 폼이 초기화됩니다.
폰트는 로컬 파일로 포함되어 있습니다. 라이선스: `systems/idenflu-mono/assets/fonts/LICENSE.txt`.
아이콘은 요청한 `idenflu-wes-intro/design-system/icons`의 원본 43개와 같은 Lucide 계열의 보완 4개입니다.
외곽선은 1.5px / butt / miter로 맞췄으며, 실제 경로는 유지했습니다.
출처와 라이선스: `systems/idenflu-mono/assets/icons/idenflu/SOURCE.md`, `LICENSE.txt`, `LICENSE-LUCIDE.txt`.

## 파일 구성

- `index.html`, `gallery.css`, `gallery-entry.js`: 디자인 시스템 갤러리와 기존 주소 연결
- `gallery-assets/`: 갤러리에서 사용하는 글꼴
- `systems/idenflu-mono/`: idenflu mono의 문서, 스타일, 스크립트와 에셋
- `systems/idenflu-mono/navigation.js`: 문서 페이지 전환과 모바일 메뉴 관리
- `systems/idenflu-mono/tokens.css`: sm/md/lg 사이즈 토큰

새 문서는 `systems/idenflu-mono/index.html`의 `.route-view`에 `data-route`, `data-title`, `data-group`, `data-description`을 지정하고 사이드 메뉴에 링크를 추가합니다.
페이지 제목·현재 위치·이전/다음 링크는 메타데이터와 페이지 순서에 따라 자동으로 갱신됩니다.
