from pathlib import Path
from html import escape
import re

p=Path('index.html'); s=p.read_text()
assert 'id="view-tree"' not in s
s=s.replace('<link rel="stylesheet" href="./components.css" />','<link rel="stylesheet" href="./components.css" />\n    <link rel="stylesheet" href="./extras.css" />')
s=s.replace('<script src="./components.js" defer></script>','<script src="./components.js" defer></script>\n    <script src="./extras.js" defer></script>')
groups=[('Foundations',[('colors','Colors'),('typography','Typography'),('sizes','Sizes'),('icons','Icons'),('states','Interaction states')]),('Components',[('buttons','Buttons'),('select','Select'),('selection','Selection controls'),('text-fields','Text fields'),('chips','Chips'),('slider','Slider & slide'),('date-picker','Date picker'),('tree','Tree'),('tabs','Tabs'),('accordion','Accordion'),('feedback','Badges & alerts'),('progress','Progress'),('overlays','Dialog & toast'),('list','List'),('table','Table & pagination')]),('Patterns',[('profile','Profile')])]
nav=['<a class="nav-overview" href="#/overview" aria-current="page">Overview</a>']
for title,items in groups:
 prefix=title.lower()
 links=''.join(f'<a href="#/{prefix}/{path}">{escape(name)}</a>' for path,name in items)
 nav.append(f'<details class="nav-group"><summary>{title}<img src="./assets/icons/idenflu/keyboard-arrow-down.svg" alt="" aria-hidden="true" /></summary><div class="nav-children">{links}</div></details>')
s=re.sub(r'<nav class="docs-navigation" aria-label="문서 탐색">.*?</nav>', '<nav class="docs-navigation" aria-label="문서 탐색">'+''.join(nav)+'</nav>',s,count=1,flags=re.S)
pages='''
<section class="route-view route-tree" id="view-tree" data-route="components/tree" data-title="Tree" data-group="Components" data-description="계층으로 묶인 항목을 펼치고 선택합니다." aria-label="Tree" hidden>
 <div class="demo-tree" aria-label="프로젝트 파일">
  <details open><summary><span>프로젝트</span></summary><div class="tree-children">
   <details open><summary><span>디자인</span></summary><div class="tree-children"><button type="button" class="tree-item is-selected" aria-current="true">디자인 시스템</button><button type="button" class="tree-item">브랜드 가이드</button></div></details>
   <details><summary><span>개발</span></summary><div class="tree-children"><button type="button" class="tree-item">컴포넌트</button><button type="button" class="tree-item">문서</button></div></details>
   <button type="button" class="tree-item">프로젝트 소개</button>
  </div></details>
 </div><p class="component-helper tree-feedback" id="tree-feedback" role="status">선택: 디자인 시스템</p>
</section>
<section class="route-view route-chips" id="view-chips" data-route="components/chips" data-title="Chips" data-group="Components" data-description="선택한 항목과 필터를 간결하게 표시합니다." aria-label="Chips" hidden>
 <section class="extra-section"><h2>선택 칩</h2><p>관심 있는 주제를 선택해보세요.</p><div class="chip-row" role="group" aria-label="관심 주제"><button class="chip" type="button" aria-pressed="true">디자인</button><button class="chip" type="button" aria-pressed="false">개발</button><button class="chip" type="button" aria-pressed="false">브랜드</button><button class="chip" type="button" disabled>비활성</button></div></section>
 <section class="extra-section"><h2>삭제 가능한 칩</h2><p>선택한 항목을 개별적으로 제거할 수 있습니다.</p><div class="chip-row" id="removable-chips"><button class="chip chip--removable" type="button" aria-label="디자인 제거">디자인<img src="./assets/icons/idenflu/close.svg" alt="" /></button><button class="chip chip--removable" type="button" aria-label="프로덕트 제거">프로덕트<img src="./assets/icons/idenflu/close.svg" alt="" /></button><button class="chip chip--removable" type="button" aria-label="리서치 제거">리서치<img src="./assets/icons/idenflu/close.svg" alt="" /></button></div><button class="button button--ghost button-inline reset-chips" id="reset-chips" type="button">초기화</button><span class="sr-only" id="chip-feedback" role="status"></span></section>
</section>
<section class="route-view route-list" id="view-list" data-route="components/list" data-title="List" data-group="Components" data-description="관련 항목을 읽고 선택할 수 있도록 정렬합니다." aria-label="List" hidden>
 <section class="extra-section"><h2>기본 목록</h2><ul class="simple-list"><li><span>디자인 시스템</span><span>진행 중</span></li><li><span>브랜드 가이드</span><span>완료</span></li><li><span>컴포넌트 문서</span><span>검토 중</span></li></ul></section>
 <section class="extra-section"><h2>선택 목록</h2><p>항목을 선택해 내용을 확인하세요.</p><div class="selectable-list" role="group" aria-label="워크스페이스 선택"><button type="button" aria-pressed="true"><span><strong>프로덕트 디자인</strong><small>제품과 사용 경험을 설계합니다.</small></span><span class="list-state">선택됨</span></button><button type="button" aria-pressed="false"><span><strong>브랜드 디자인</strong><small>브랜드의 일관된 인상을 만듭니다.</small></span><span class="list-state">선택</span></button><button type="button" disabled><span><strong>운영</strong><small>현재 사용할 수 없습니다.</small></span><span class="list-state">사용 불가</span></button></div></section>
</section>
<section class="route-view route-progress" id="view-progress" data-route="components/progress" data-title="Progress" data-group="Components" data-description="작업의 진행 상황을 숫자와 함께 표시합니다." aria-label="Progress" hidden>
 <section class="extra-section"><h2>진행 상태</h2><div class="progress-label"><span>프로젝트 준비</span><strong id="progress-value">60%</strong></div><progress class="progress-bar" id="demo-progress" max="100" value="60" aria-label="프로젝트 준비 진행률">60%</progress><label class="field-label progress-control" for="progress-slider">진행률 조정</label><input class="range-input" id="progress-slider" type="range" min="0" max="100" value="60" style="--fill:60%" /></section>
 <section class="extra-section"><h2>완료 상태</h2><div class="progress-label"><span>업로드</span><strong>100%</strong></div><progress class="progress-bar" max="100" value="100" aria-label="업로드 진행률">100%</progress></section>
</section>
<section class="route-view route-slider" id="view-slider" data-route="components/slider" data-title="Slider &amp; slide" data-group="Components" data-description="범위에서 값을 조절하거나 콘텐츠를 순서대로 살펴봅니다." aria-label="Slider &amp; slide" hidden>
 <section class="extra-section"><h2>슬라이더</h2><div class="progress-label"><label for="volume-slider">화면 밝기</label><output id="volume-value" for="volume-slider">40%</output></div><input class="range-input" id="volume-slider" type="range" min="0" max="100" value="40" style="--fill:40%" /><div class="range-ends"><span>0</span><span>100</span></div><label class="field-label disabled-label" for="disabled-slider">비활성</label><input class="range-input" id="disabled-slider" type="range" min="0" max="100" value="35" disabled style="--fill:35%" /></section>
 <section class="extra-section"><h2>슬라이드</h2><div class="slide-example" aria-roledescription="캐러셀" aria-label="디자인 원칙"><div class="slide-content" aria-live="polite"><span class="slide-index" id="slide-index">01 / 03</span><h3 id="slide-title">명확한 위계</h3><p id="slide-description">중요한 정보를 먼저 보여주고, 나머지는 자연스럽게 이어갑니다.</p></div><div class="slide-actions"><button class="button button--outline button-inline" id="slide-prev" type="button" disabled>이전</button><button class="button button--outline button-inline" id="slide-next" type="button">다음</button></div></div></section>
</section>
<section class="route-view route-date-picker" id="view-date-picker" data-route="components/date-picker" data-title="Date picker" data-group="Components" data-description="달력에서 날짜를 선택하고 확인합니다." aria-label="Date picker" hidden>
 <div class="date-example"><span class="field-label" id="date-label">날짜</span><div class="date-picker" id="date-picker"><button class="date-trigger" id="date-trigger" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="date-popup" aria-labelledby="date-label date-value"><span id="date-value">날짜 선택</span><span class="ui-icon" style="--icon:url('./assets/icons/idenflu/calendar.svg')" aria-hidden="true"></span></button><input type="hidden" id="date-input" name="date" /><div class="date-popup" id="date-popup" role="dialog" aria-label="날짜 선택" hidden><div class="calendar-header"><button type="button" class="calendar-nav" id="calendar-prev" aria-label="이전 달"><img src="./assets/icons/idenflu/keyboard-arrow-left.svg" alt="" /></button><strong id="calendar-month" aria-live="polite"></strong><button type="button" class="calendar-nav" id="calendar-next" aria-label="다음 달"><img src="./assets/icons/idenflu/keyboard-arrow-right.svg" alt="" /></button></div><div class="calendar-weekdays" aria-hidden="true"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="calendar-grid" id="calendar-grid" role="grid" aria-labelledby="calendar-month"></div><div class="calendar-footer"><button class="button button--ghost button-inline" id="calendar-today" type="button">오늘</button><button class="button button--ghost button-inline" id="calendar-clear" type="button">지우기</button></div></div></div><p class="component-helper date-help" id="date-help" role="status">날짜를 선택해주세요.</p></div>
</section>
'''
marker='<section class="route-view route-profile"'
assert marker in s
s=s.replace(marker,pages+'\n'+marker,1)
p.write_text(s)
print('Added six component views and nested disclosure navigation.')
