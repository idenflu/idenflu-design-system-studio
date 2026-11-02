(() => {
  'use strict';

  // Documentation metadata is separate from portable component behavior.
  const definitions = {
    buttons: ['버튼 저장 취소 액션 button', '한 번의 행동을 실행할 때 사용합니다.', '화면 이동은 링크를 사용하고, 한 영역의 주요 행동은 하나로 제한합니다.', '라벨 · 선택적 아이콘 · 로딩 표시', 'Tab 이동, Enter·Space 실행', '.button', null, 'disabled는 실제 속성으로, loading은 disabled와 aria-busy를 함께 제공합니다.'],
    select: ['선택 셀렉트 검색 복수 멀티 태그 combobox', '정해진 옵션 중 하나 또는 여러 항목을 선택할 때 사용합니다.', '자유 입력은 Text fields, 소수의 즉시 선택은 라디오를 사용합니다.', '라벨 · 트리거/검색창 · 옵션 목록 · 선택값', '기본형: 방향키·Home·End 탐색. 검색형: 방향키 탐색. Enter 선택, Escape 닫기, Tab 이동', '[data-select]', 'select / search-select / multiselect', 'disabled 옵션은 탐색에서 제외합니다. 빈 검색 결과와 aria-invalid 오류를 구분합니다.'],
    selection: ['체크박스 라디오 토글 스위치 checkbox radio switch', '복수 선택은 체크박스, 한 개 선택은 라디오, 즉시 반영 설정은 토글을 사용합니다.', '토글에 저장 버튼이 필요하면 반영 시점을 문구로 명확히 안내합니다.', '네이티브 input · 장식 요소 · 연결된 라벨', 'Space 선택, 라디오 방향키 이동', '.choice', null, 'disabled·checked는 input 속성입니다. 부분 선택은 input.indeterminate로 설정합니다.'],
    'text-fields': ['입력 필드 검색 비밀번호 이메일 textarea prefix suffix 프리픽스 서픽스 접두사 접미사 좌측 라벨 가로 텍스트 정렬 가운데 오른쪽', '자유 텍스트와 여러 줄 내용을 입력받습니다. 여러 항목의 라벨은 입력 왼쪽에 배치할 수도 있습니다.', 'placeholder를 라벨 대신 사용하지 않습니다. 일반 텍스트는 시작 정렬을 기본으로 사용합니다. 고정된 주소·단위는 입력값에 포함되지 않으므로 제출할 때 필요한 형식으로 조합합니다.', 'label · input/textarea · 선택적 prefix/suffix · 도움말/오류', 'Tab 이동, 네이티브 텍스트 편집 키. 보조 버튼은 Enter·Space 실행', '.input-group', null, '의미 있는 고정 텍스트는 aria-describedby로 연결하고 장식 아이콘은 숨깁니다. 오류는 색상과 문구로 표시하고 aria-invalid와 오류 참조를 함께 갱신합니다. readonly는 읽고 복사할 수 있으며 disabled는 제출 대상에서 제외됩니다.'],
    'number-fields': ['숫자 정수 소수 금액 수량 number', '범위·소수 자릿수·정확한 증감이 필요한 숫자를 입력받습니다.', '금액을 부동소수점 Number로 변환하지 않습니다. API에는 정확한 10진 문자열을 전달합니다.', '라벨 · spinbutton · 단위 · 증감 버튼 · 오류', '↑·↓ 단위 증감, PageUp·PageDown 10배 증감, Enter 값 확인, 직접 입력', '[data-number-field]', 'number-field', '최소·최대·자릿수 오류를 표시합니다. 빈 값은 null, 정상 값은 정확한 10진 문자열입니다.'],
    chips: ['칩 태그 필터 chip tag', '짧은 선택값·필터·분류를 표시합니다.', '한 개 칩에 선택과 삭제를 중첩 버튼으로 넣지 않습니다.', '라벨 · 선택적 삭제 버튼', 'Tab 이동, Enter·Space 실행', '.chip', null, '선택 상태는 aria-pressed, 삭제 버튼에는 제거할 대상 이름을 제공합니다.'],
    slider: ['슬라이더 범위 슬라이드 range', '연속 값이나 일정 간격의 범위를 빠르게 조절합니다.', '정확한 값 입력이 중요하면 숫자 입력을 함께 제공합니다.', 'label · 네이티브 range · 출력값', '방향키 조절, Home·End 경계', '.slider-field', null, 'min·max·step·disabled를 지정하고 단위가 있으면 aria-valuetext를 갱신합니다.'],
    'date-picker': ['날짜 달력 기간 예약 date calendar', '직접 입력과 달력 선택을 함께 제공할 때 사용합니다.', '날짜 형식 검증과 폼의 필수 검증을 구분하고 동일한 오류 표현 경로로 합칩니다.', '라벨 · 표시 입력 · ISO hidden 값 · 트리거 · 달력 · 도움말', 'Alt+↓ 열기, 방향키·Home·End·PageUp/Down 탐색, Enter 선택, Escape 닫기', '[data-date-picker]', 'date-picker', '날짜는 ISO 문자열 또는 null입니다. 기간은 두 값 배열이며 역전 오류를 양쪽 입력에 표시합니다.'],
    tree: ['트리 계층 폴더 탐색 tree disclosure', '단순한 계층을 접고 펼쳐 탐색할 때 사용합니다.', '현재 컴포넌트는 disclosure 목록입니다. 파일 탐색기형 ARIA tree의 방향키 모델을 가정하지 않습니다.', 'details/summary · 계층별 선택 버튼', 'Tab 이동, Enter·Space 확장/선택', '.demo-tree', 'disclosure-tree', '확장 상태는 네이티브 details, 선택 상태는 항목의 aria-current로 전달합니다.'],
    tabs: ['탭 패널 tab', '같은 맥락의 콘텐츠를 한 영역에서 전환합니다.', 'URL 이동이나 순서대로 완료할 단계에 탭을 사용하지 않습니다.', 'tablist · tab · 연결된 tabpanel', '가로/세로 방향키, Home·End, disabled 항목 제외', '[role="tablist"]', 'tabs', '한 그룹마다 선택된 탭 하나와 tabIndex=0 하나를 유지합니다. 그룹은 서로 독립입니다.'],
    accordion: ['아코디언 접기 펼치기 accordion details', '독립적인 보조 내용을 필요할 때 펼쳐 보여줍니다.', '중요한 오류나 필수 입력을 기본 접힌 영역에 숨기지 않습니다.', 'details · summary · 콘텐츠', 'Enter·Space 확장/축소', '.accordion', null, '네이티브 open 속성으로 제어합니다. 확장 상태를 별도의 ARIA로 중복 관리하지 않습니다.'],
    feedback: ['알림 상태 배지 badge alert', '상태는 배지, 맥락 안의 설명과 오류는 인라인 알림으로 표시합니다.', '성공·위험·주의를 색만으로 구별하지 않습니다.', '상태 문구 · 선택적 아이콘 · 설명', '정적 정보는 포커스하지 않습니다. 행동이 있으면 버튼을 사용합니다.', '.inline-alert', null, '비동기 상태 변경에는 role=status를 사용하고 긴급 오류에만 alert를 적용합니다.'],
    progress: ['진행률 진행바 원형 progress', '완료 비율을 아는 작업의 진행을 표시합니다.', '진행률을 모르면 임의의 백분율을 만들지 말고 로딩 패턴을 사용합니다.', '이름 · 현재값 · 최소/최대 · 표시 막대', '읽기 전용 상태 정보', 'progress.progress-bar', null, '네이티브 progress의 max·value와 접근 가능한 이름을 제공합니다. 별도 role=progressbar를 만들 때는 aria-valuemin/max/now를 지정합니다. 시각 표시와 실제 값은 함께 갱신합니다.'],
    overlays: ['다이얼로그 토스트 모달 dialog toast', '결정이 필요한 작업은 dialog, 짧은 결과 안내는 토스트로 제공합니다.', '모든 정보 메시지에 모달을 사용하거나 토스트만으로 중요한 오류를 전달하지 않습니다.', '이름 · 설명 · 콘텐츠 · 닫기/확인', 'dialog.showModal()의 포커스 관리와 Escape 취소를 사용합니다.', '#example-dialog', null, '네이티브 dialog의 showModal/close를 사용합니다. 예시 저장·토스트 호출은 애플리케이션 이벤트 코드입니다.'],
    list: ['목록 리스트 list', '반복되는 동등한 항목과 관련 정보를 표시합니다.', '서로 다른 열 비교가 중요하면 Table을 사용합니다.', 'ul/li · 항목 이름 · 선택적 설명/행동', '행동 요소만 Tab으로 이동합니다.', '.simple-list', null, '선택 목록은 버튼과 aria-pressed를 사용하고 클릭 가능한 div를 만들지 않습니다.'],
    table: ['표 테이블 페이지네이션 pagination', '같은 열 구조를 가진 데이터를 비교하고 탐색합니다.', '모바일에서 열을 숨겨 의미를 잃기보다 표 내부 스크롤을 제공합니다.', 'caption · thead/th · tbody · 페이지 이동', '페이지 버튼 Tab 이동. 표 자체는 네이티브 읽기 순서를 유지합니다.', '.data-table', null, '로딩·조회 실패·최초 빈 데이터·검색 0건을 분리합니다. 데이터 상태 패턴에서 실제 전환을 확인할 수 있습니다.'],
    tooltip: ['툴팁 도움말 tooltip', '짧고 선택적인 보충 설명을 제공합니다.', '필수 정보·오류·클릭할 링크는 툴팁에 넣지 않습니다.', '이름 있는 트리거 · role=tooltip 설명', '호버 또는 포커스로 표시, Escape로 해제', '.tooltip-wrap', 'tooltip', '트리거와 설명 사이를 이동하거나 설명에 호버해도 표시를 유지합니다. aria-describedby로 연결합니다.'],
    'dropdown-menu': ['메뉴 액션 드롭다운 menu', '관련된 여러 행동을 한 트리거에 모읍니다.', '값 선택은 Select, 화면 전환은 내비게이션을 사용합니다.', '트리거 · menu · menuitem', '방향키·Home·End 탐색, Escape 닫기', '#action-menu', null, '선택값 컴포넌트가 아닙니다. 문서 데모의 행동 핸들러는 소비 앱에서 구현합니다.'],
    popover: ['팝오버 설정 popover', '화면 맥락 안에서 가벼운 옵션과 보조 작업을 제공합니다.', '중요한 결정이나 긴 입력은 dialog 또는 Drawer를 사용합니다.', '이름 있는 트리거 · 옵션 영역 · 완료', 'Tab으로 내부 이동, Escape 닫기', '#demo-popover', null, '열림 상태는 aria-expanded와 실제 hidden을 맞춥니다. 앱에서 바깥 클릭·포커스 정책을 연결합니다.'],
    drawer: ['드로어 패널 상세 drawer', '현재 화면을 유지하며 상세 정보를 확인하거나 편집합니다.', '패널 내부 여백을 클릭했을 때 편집을 취소하지 않습니다.', 'dialog · 제목 · 설명 · 폼 · 취소/저장', '네이티브 modal 포커스, Escape 취소, 닫기 후 트리거 복귀', '#demo-drawer', null, '네이티브 dialog와 .demo-drawer를 조합합니다. 저장값·검증 초기화·실제 경계 밖 클릭 처리는 소비 앱이 관리합니다.'],
    loading: ['로딩 스켈레톤 스피너 skeleton spinner', '완료 비율을 모르는 작업의 대기를 안내합니다.', '화면 전체를 막기보다 영향을 받는 영역에 aria-busy를 적용합니다.', '로딩 표시 · 접근 가능한 상태 문구 · 대기 영역', '읽기 전용 표시. 완료 후 예상한 포커스를 유지합니다.', '.spinner-demo-visual', null, '장식 스피너는 aria-hidden, 별도 상태 문구는 role=status로 제공합니다. reduced-motion에서도 대기 상태를 알 수 있어야 합니다.'],
    'file-upload': ['파일 첨부 업로드 upload', '파일 선택과 형식·크기 제약을 함께 안내합니다.', '브라우저 MIME 검사만으로 서버 검증을 대체하지 않습니다.', 'label · 네이티브 file input · 제약 문구 · 선택 결과/삭제', 'Tab으로 파일 선택·삭제, 네이티브 파일 대화상자', '#upload-area', null, '예시는 PNG/JPG/PDF 5MB 이하이며 로컬 정보만 표시합니다. 전송·진행률·실패/재시도는 소비 앱의 책임입니다.'],
    avatar: ['아바타 프로필 avatar', '사람이나 팀을 짧은 공간에서 식별합니다.', '중요한 신원을 아바타 이미지에만 의존하지 않습니다.', '이미지/이니셜 · 인접한 사용자 이름', '정적 장식은 포커스하지 않습니다.', '.avatar', null, '인접한 이름과 중복되면 장식으로 처리하고, 이미지 단독이면 의미 있는 대체 텍스트를 제공합니다.'],
    stepper: ['단계 스텝 진행 stepper', '순서가 있는 여러 단계와 현재 위치를 안내합니다.', '자유롭게 전환하는 콘텐츠는 Tabs를 사용합니다.', '순서 목록 · 단계 이름 · 현재/완료 상태', '행동 가능한 단계만 Tab으로 이동합니다.', '.stepper', null, '현재 단계에 aria-current=step을 적용하고 완료 여부를 문구로도 전달합니다.'],
    card: ['카드 요약 card', '하나의 대상에 대한 관련 정보와 행동을 묶습니다.', '카드 전체 링크 안에 별도 버튼이나 링크를 중첩하지 않습니다.', '제목 · 요약 · 메타 정보 · 선택적 행동', '링크·버튼의 기본 키보드 모델을 사용합니다.', '.demo-card', null, '본문과 행동 영역을 구분하며 제목만으로 카드의 대상을 식별할 수 있어야 합니다.'],
  };
  window.IdenfluDocs = Object.freeze({ definitions, sourceFor });
  const views = [...document.querySelectorAll('.route-view')];
  const make = (tag, text, className) => { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; };

  function sourceFor(view, selector, key = view.dataset.route.replace('components/', '')) {
    const targets = [];
    const local = (query) => view.querySelector(query);
    if (key === 'select') {
      for (const query of ['[data-select]', '[data-search-select]', '[data-multiselect]:not([data-presentation="inline"])', '[data-multiselect][data-presentation="inline"]']) {
        const target = local(query); if (target) targets.push(target);
      }
    } else if (key === 'date-picker') {
      for (const query of ['[data-date-picker="single"]', '[data-date-picker="range"]']) {
        const target = local(query); if (target) targets.push(target);
      }
    } else if (key === 'text-fields') {
      const horizontal = local('.field-horizontal');
      const vertical = local('#project-slug')?.closest('.input-group');
      const alignment = local('.field-alignment-examples');
      if (horizontal) targets.push(horizontal);
      if (vertical) targets.push(vertical);
      if (alignment) targets.push(alignment);
    } else {
      const target = key === 'tabs' ? local('.tabs') || local(selector) : local(selector) || (key === 'overlays' ? document.querySelector(selector) : null);
      if (target) targets.push(target);
    }
    return targets.map((target) => {
      const roots = [target];
      const include = (node) => { if (node && !roots.some((root) => root === node || root.contains(node))) roots.push(node); };
      const processed = new Set();
      // Follow external dependencies recursively, including reverse label[for] links.
      for (let index = 0; index < roots.length; index++) {
        for (const node of [roots[index], ...roots[index].querySelectorAll('*')]) {
          if (processed.has(node)) continue;
          processed.add(node);
          if (node.id && node.matches('input, select, textarea')) {
            for (const label of document.querySelectorAll('label[for]')) if (label.htmlFor === node.id) include(label);
          }
          const references = ['aria-labelledby', 'aria-describedby', 'aria-errormessage', 'aria-controls', 'for']
            .map((attribute) => node.getAttribute(attribute)).filter(Boolean);
          references.push(...[node.dataset.selected, node.dataset.clear, node.dataset.feedback].filter(Boolean));
          for (const id of references.join(' ').split(/\s+/).filter(Boolean)) {
            const original = document.getElementById(id);
            if (original && !original.contains(target)) include(original);
          }
        }
      }
      const topLevel = roots.filter((root) => !roots.some((other) => other !== root && other.contains(root)));
      // External field labels precede the control; helper and result nodes follow it.
      topLevel.sort((left, right) => Number(right.matches('label, .field-label')) - Number(left.matches('label, .field-label')));
      const source = topLevel.map((original) => {
        const clone = original.cloneNode(true);
        for (const node of [clone, ...clone.querySelectorAll('*')]) {
          node.classList.remove('is-open', 'opens-up', 'align-right', 'is-active');
          node.removeAttribute('data-notice');
          node.removeAttribute('aria-activedescendant');
          if (node.hasAttribute('aria-expanded')) node.setAttribute('aria-expanded', 'false');
          if (node.matches('.select-popup, .date-popup')) node.hidden = true;
          if (node.matches('dialog')) node.removeAttribute('open');
          if (node.matches('[data-calendar-grid]')) node.replaceChildren();
        }
        return clone.outerHTML;
      }).join('\n');
      return targets.length > 1 ? `<div class="field-stack">\n${source}\n</div>` : source;
    }).join('\n\n').replace(/></g, '>\n<');
  }

  for (const view of views) {
    const key = view.dataset.route.replace('components/', '');
    const definition = definitions[key];
    if (!definition) continue;
    const [aliases, usage, avoid, anatomy, keyboard, selector, runtime, states] = definition;
    view.dataset.searchTerms = aliases;
    const guide = make('section', '', 'component-guide');
    guide.dataset.componentGuide = key;
    guide.append(make('h2', '적용 가이드'));
    const dl = make('dl', '', 'guide-facts');
    for (const [title, body] of [['사용 시점', usage], ['주의할 점', avoid], ['구조', anatomy], ['키보드', keyboard], ['상태와 오류', states]]) {
      const row = make('div'); row.append(make('dt', title), make('dd', body)); dl.append(row);
    }
    guide.append(dl);
    guide.append(make('h3', '값과 이벤트 계약'));
    const api = runtime ? `런타임: ${runtime}. IdenfluMono.init(root)로 초기화하고 get(element)로 컨트롤러를 가져옵니다. getValue(), setValue(value, { emit: true }), reset(), destroy()를 제공합니다. 같은 root를 반복 초기화해도 중복 등록하지 않습니다.` : '네이티브 HTML 속성과 CSS로 적용합니다. 화면에 표시된 저장·조회·알림 등의 데모 데이터와 행동은 애플리케이션에서 연결합니다.';
    guide.append(make('p', api));
    if (runtime) {
      const contracts = {
        select: '값: 기본·검색형은 문자열(빈 값은 빈 문자열), 복수형은 문자열 배열입니다. 이벤트: selectchange의 detail은 { value, label }, multiselectchange는 { values, labels }입니다. 기본형과 검색형은 open()/close()도 제공합니다.',
        'number-fields': '값: 정확한 10진 문자열 또는 null입니다. 이벤트: numberchange의 detail은 { value, numberValue }입니다. 안전하게 표현할 수 없는 숫자는 numberValue가 null이므로 value 문자열을 사용합니다.',
        'date-picker': '값: 단일 날짜는 YYYY-MM-DD 문자열 또는 null, 기간은 [시작일, 종료일] 배열입니다. 이벤트: datechange의 detail은 { value }입니다. setValue는 유효하지 않은 형식·역전 기간을 RangeError로 거부합니다. open()/close()도 제공합니다.',
        tabs: '값: 탭의 data-value, 없으면 id입니다. 이벤트: tabchange의 detail은 { value, previousValue, tab, panel }입니다. aria-orientation="vertical"이면 ↑·↓로 이동합니다.',
        tree: '값: 항목의 data-value, 없으면 id 또는 텍스트입니다. 이벤트: treechange의 detail은 { value, label, item }입니다. reset()은 처음 선택과 details 열림 상태를 복원합니다.',
        tooltip: '별도의 변경 이벤트가 없습니다. getValue()는 툴팁이 Escape로 해제되지 않은 상태인지 반환하며, 현재 화면에 보이는지와는 다릅니다. setValue(false)로 해제하고 reset()으로 다시 표시 가능한 상태로 만듭니다. 호버·포커스가 실제 표시를 결정합니다.',
      };
      guide.append(make('p', contracts[key]));
      if (key !== 'tooltip') guide.append(make('p', '이벤트는 DOM에서 버블링합니다. 프로그램 변경을 알리지 않으려면 setValue(value, { emit: false })를 사용합니다. reset() 또는 네이티브 form.reset()은 초기값을 복원하고 변경 이벤트를 보내지 않습니다.'));
    }
    guide.append(make('h3', 'HTML 예제'));
    guide.append(make('p', '배포 폴더의 CSS·런타임을 불러온 뒤 적용하세요. 여러 번 복사할 때 id와 ARIA 참조를 함께 고유하게 바꾸고, 아이콘 경로는 assets 위치에 맞춥니다.'));
    const code = sourceFor(view, selector);
    const toolbar = make('div', '', 'code-toolbar');
    const copy = make('button', '코드 복사', 'button button--outline button-inline'); copy.type = 'button';
    const status = make('span'); status.setAttribute('role', 'status');
    copy.disabled = !code;
    copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(code); status.textContent = '코드를 복사했습니다.'; }
      catch { status.textContent = '복사할 수 없습니다. 아래 코드를 선택해 복사하세요.'; }
    });
    toolbar.append(copy, status);
    const details = make('details', '', 'code-example'); details.append(make('summary', '구조와 코드 보기'));
    const pre = make('pre'); const text = make('code', code || '예제를 불러오지 못했습니다. 페이지를 새로고침해주세요.'); pre.append(text); details.append(pre);
    guide.append(toolbar, details);
    view.append(guide);
  }

  const search = document.querySelector('#docs-search');
  const searchStatus = document.querySelector('#docs-search-status');
  const links = [...document.querySelectorAll('.docs-navigation a:not(.nav-gallery)')];
  const groups = [...document.querySelectorAll('.docs-navigation details')];
  let previousGroups = null;
  const normalize = (value) => value.toLocaleLowerCase().replace(/[\s_-]+/g, '');
  function filter() {
    const query = normalize(search.value.trim());
    if (query && !previousGroups) previousGroups = groups.map((group) => group.open);
    let count = 0;
    for (const link of links) {
      const view = views.find((item) => `#/${item.dataset.route}` === link.hash);
      const text = `${link.textContent} ${view?.dataset.description || ''} ${view?.dataset.searchTerms || ''} ${view?.dataset.route || ''}`;
      link.hidden = Boolean(query && !normalize(text).includes(query));
      if (!link.hidden) count++;
    }
    groups.forEach((group, index) => {
      group.hidden = Boolean(query && ![...group.querySelectorAll('a')].some((link) => !link.hidden));
      group.open = query ? !group.hidden : previousGroups ? previousGroups[index] : group.open;
    });
    if (!query) {
      previousGroups = null;
      let current = links.find((link) => link.getAttribute('aria-current') === 'page')?.closest('details');
      while (current) { current.open = true; current = current.parentElement.closest('details'); }
    }
    searchStatus.textContent = count ? `${count}개 문서` : '검색 결과가 없습니다.';
  }
  search?.addEventListener('input', filter);
  search?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && search.value) { event.preventDefault(); event.stopPropagation(); search.value = ''; filter(); }
    else if (event.key === 'Enter') { event.preventDefault(); links.find((link) => !link.hidden)?.click(); }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    event.preventDefault();
    if (window.matchMedia('(max-width: 900px)').matches) document.querySelector('#open-menu').click();
    search?.focus();
  });
  if (search) filter();

  const toc = make('nav', '', 'docs-toc'); toc.id = 'docs-toc'; toc.setAttribute('aria-label', '이 페이지 목차');
  document.querySelector('#doc-heading').after(toc);
  function updateToc() {
    const active = views.find((view) => !view.hidden);
    toc.replaceChildren();
    const headings = [...active.querySelectorAll('h2')];
    toc.hidden = headings.length < 2;
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `${active.id}-section-${index + 1}`;
      const link = make('a', heading.textContent); link.href = `#/${active.dataset.route}`;
      link.addEventListener('click', (event) => { event.preventDefault(); heading.tabIndex = -1; heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: 'start' }); });
      toc.append(link);
    });
  }
  document.addEventListener('docsroutechange', updateToc);
  updateToc();
})();
