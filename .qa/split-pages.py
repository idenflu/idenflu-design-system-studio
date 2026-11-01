from pathlib import Path
from html import escape
import re

root = Path(__file__).resolve().parent.parent
source = (root / 'index.html').read_text()
assert '<div class="system-grid">' in source, 'This one-time migration has already run.'
(root / '.qa/index-before-sidebar.html').write_text(source)

def section(marker, tag='section'):
    start = source.index(marker)
    start = source.rfind('<' + tag, 0, start + 1)
    depth = 0
    for match in re.finditer(r'</?' + tag + r'\b[^>]*>', source[start:]):
        depth += -1 if match.group().startswith('</') else 1
        if depth == 0:
            return source[start:start + match.end()]
    raise ValueError(marker)

hero = section('class="hero"').replace('id="page-title"', 'id="page-title" tabindex="-1"')
palette = section('class="palette"')
typography = section('class="typography"').replace('>Typography</h3>', '>Typeface</h3>')
button_states = section('class="button-states"')
input_states = section('class="input-states"')
profile = section('id="profile-form"', 'form')
profile = re.sub(r'<div class="profile-heading">.*?</div>\s*', '', profile, count=1, flags=re.S)
dialog = section('class="dialog"', 'dialog')
toast = section('class="toast"', 'aside')

component_specs = [
    ('buttons', 'Buttons', '행동의 중요도에 따라 표현을 구분합니다.', 'variants-title'),
    ('select', 'Select', '여러 선택지 중 하나를 선택합니다.', 'select-title'),
    ('selection', 'Selection controls', '복수 선택, 단일 선택, 켜고 끄기를 명확하게 구분합니다.', 'selection-title'),
    ('tabs', 'Tabs', '같은 맥락의 정보를 나눠 탐색합니다.', 'tabs-title'),
    ('text-fields', 'Text fields', '짧은 입력부터 긴 설명까지 자연스럽게 확장합니다.', 'fields-title'),
    ('feedback', 'Badges & alerts', '상태와 피드백을 색상과 문구로 함께 전달합니다.', 'feedback-title'),
    ('accordion', 'Accordion', '필요한 정보를 펼쳐서 확인합니다.', 'accordion-title'),
    ('overlays', 'Dialog & toast', '집중이 필요한 작업과 짧은 피드백에 사용합니다.', 'overlays-title'),
    ('table', 'Table & pagination', '정보를 행 단위로 정리하고 페이지로 나눠 탐색합니다.', 'table-title'),
]

overview = hero + '''
<dl class="overview-facts">
  <div><dt>Primary</dt><dd><span class="inline-color" aria-hidden="true"></span>#4263CC</dd></div>
  <div><dt>Typography</dt><dd>14px / 22px</dd></div>
  <div><dt>Control height</dt><dd>38px</dd></div>
  <div><dt>Corner radius</dt><dd>0px</dd></div>
</dl>
<section class="overview-start" aria-labelledby="start-title">
  <h2 id="start-title">하나의 기준으로, 일관되게.</h2>
  <p>기초 스타일에서 실제 화면까지 필요한 항목을 찾아보세요.</p>
  <div class="overview-links">
    <a href="#/foundations/colors"><span>01 / Foundations</span><h3>기초 스타일</h3><p>색상, 타이포그래피와 인터랙션의 기본 규칙.</p></a>
    <a href="#/components/buttons"><span>02 / Components</span><h3>컴포넌트</h3><p>버튼부터 테이블까지, 직접 사용해보는 기본 요소.</p></a>
    <a href="#/patterns/profile"><span>03 / Patterns</span><h3>화면에 적용하기</h3><p>컴포넌트를 조합한 프로필 폼과 실제 동작.</p></a>
  </div>
</section>'''

type_samples = '''
<section class="type-samples" aria-labelledby="type-samples-title"><h2 id="type-samples-title">Type scale</h2>
  <div><span class="sample-label">Heading · 32 / 40 · Semibold</span><p class="sample-heading">Form follows function.</p></div>
  <div><span class="sample-label">Section · 24 / 32 · Semibold</span><p class="sample-section">명확한 구조, 일관된 경험.</p></div>
  <div><span class="sample-label">Body · 14 / 22 · Regular</span><p>필요한 정보가 자연스럽게 읽히도록 간결한 문장과 여유 있는 행간을 사용합니다.</p></div>
  <div><span class="sample-label">Caption · 12 / 18 · Regular</span><p class="sample-caption">보조 설명과 상태 정보를 전달하는 작은 텍스트입니다.</p></div>
</section>'''

pages = [
    ('overview', 'Overview', 'Getting started', 'idenflu mono의 기본 원칙과 구성 요소를 살펴보세요.', overview),
    ('foundations/colors', 'Colors', 'Foundations', '차분한 블루와 중성 회색으로 명확한 위계를 만듭니다.', palette),
    ('foundations/typography', 'Typography', 'Foundations', 'Pretendard와 본문 14px을 기준으로 읽기 편한 위계를 만듭니다.', '<div class="typography-layout">' + typography + type_samples + '</div>'),
    ('foundations/states', 'Interaction states', 'Foundations', '기본, 호버, 눌림, 포커스와 오류 상태를 한 가지 규칙으로 표현합니다.', '<div class="states-layout">' + button_states + input_states + '</div>'),
]
for slug, title, description, label in component_specs:
    payload = section('aria-labelledby="' + label + '"')
    payload = payload.replace(' aria-labelledby="' + label + '"', '', 1)
    payload = re.sub(r'<div class="component-heading">.*?</div>\s*', '', payload, count=1, flags=re.S)
    payload = re.sub(r'<p class="component-description">.*?</p>\s*', '', payload, count=1, flags=re.S)
    pages.append(('components/' + slug, title, 'Components', description, payload))
pages.append(('patterns/profile', 'Profile', 'Patterns', '기본 정보를 확인하고 수정하는 프로필 폼입니다.', profile))

nav = []
for group in ['Getting started', 'Foundations', 'Components', 'Patterns']:
    links = []
    for path, title, page_group, description, content in pages:
        if page_group != group:
            continue
        current = ' aria-current="page"' if path == 'overview' else ''
        links.append(f'<a href="#/{path}"{current}>{escape(title)}</a>')
    nav.append(f'<div class="nav-group"><h2>{group}</h2>{"".join(links)}</div>')

views = []
for path, title, group, description, content in pages:
    slug = path.split('/')[-1]
    hidden = '' if path == 'overview' else ' hidden'
    views.append(f'<section class="route-view route-{slug}" id="view-{slug}" data-route="{path}" data-title="{escape(title, quote=True)}" data-group="{group}" data-description="{escape(description, quote=True)}" aria-label="{escape(title, quote=True)}"{hidden}>\n{content}\n</section>')

head = source[:source.index('</head>') + len('</head>')]
head = head.replace('<link rel="stylesheet" href="./styles.css" />', '<link rel="stylesheet" href="./styles.css" />\n    <link rel="stylesheet" href="./docs.css" />')
head = head.replace('<script src="./script.js" defer></script>', '<script src="./navigation.js" defer></script>\n    <script src="./script.js" defer></script>')

output = head + '''
  <body class="docs-app">
    <a class="skip-link" href="#main">본문 바로가기</a>
    <div class="docs-layout">
      <aside class="sidebar" id="sidebar" aria-label="문서 메뉴">
        <div class="sidebar-brand"><a class="wordmark" href="#/overview" aria-label="idenflu mono 홈">idenflu mono</a><button class="icon-button sidebar-close" id="close-menu" type="button" aria-label="메뉴 닫기"><img src="./assets/icons/x.svg" alt="" /></button><p>Design system</p></div>
        <nav class="docs-navigation" aria-label="문서 탐색">''' + ''.join(nav) + '''</nav>
        <div class="sidebar-footer"><p>14px type · 38px controls</p><p>0px radius · 8px spacing</p></div>
      </aside>
      <button class="sidebar-backdrop" id="sidebar-backdrop" type="button" aria-label="메뉴 닫기" tabindex="-1" hidden></button>
      <div class="docs-main" id="docs-main">
        <header class="docs-topbar">
          <div class="mobile-brand"><a href="#/overview">idenflu mono</a><button class="button button--outline button-inline" id="open-menu" type="button" aria-controls="sidebar" aria-expanded="false">메뉴</button></div>
          <nav class="breadcrumb" aria-label="현재 위치"><span id="breadcrumb-group">Getting started</span><span aria-hidden="true">/</span><span id="breadcrumb-title" aria-current="page">Overview</span></nav>
          <span class="topbar-caption">Design system</span>
        </header>
        <main class="docs-content" id="main" tabindex="-1">
          <header class="doc-heading" id="doc-heading" hidden><p class="doc-kicker" id="doc-kicker">Components</p><h1 id="doc-title" tabindex="-1">Overview</h1><p class="doc-description" id="doc-description"></p></header>
          <div class="route-views">''' + '\n'.join(views) + '''</div>
          <nav class="page-pagination" aria-label="이전 다음 문서"><a id="previous-doc" href="#/overview"><span>이전</span><strong></strong></a><a id="next-doc" href="#/foundations/colors"><span>다음</span><strong></strong></a></nav>
        </main>
        <footer class="docs-footer"><span>idenflu mono</span><span>38px height / 0px radius / 8px spacing</span></footer>
      </div>
    </div>
    ''' + dialog + '\n' + toast + '''
    <div class="sr-only" id="demo-feedback" role="status" aria-live="polite"></div>
  </body>
</html>
'''
(root / 'index.html').write_text(output)
print(f'Created {len(pages)} document views with shared navigation.')
