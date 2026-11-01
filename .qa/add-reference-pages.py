from pathlib import Path
from html import escape

root = Path(__file__).resolve().parent.parent
page = root / 'index.html'
source = page.read_text()
assert 'id="view-sizes"' not in source, 'Reference pages already exist.'
source = source.replace('<link rel="stylesheet" href="./styles.css" />', '<link rel="stylesheet" href="./styles.css" />\n    <link rel="stylesheet" href="./tokens.css" />')
source = source.replace('<a href="#/foundations/states">', '<a href="#/foundations/sizes">Sizes</a><a href="#/foundations/icons">Icons</a><a href="#/foundations/states">')

rows = []
for size, title, height, padding, icon in [('sm','Small',32,10,14),('md','Medium',38,12,16),('lg','Large',44,16,18)]:
    rows.append(f'''<section class="size-preview" data-size="{size}" aria-label="{title} 예시"><div class="size-preview-label"><strong>{title}</strong><span>{size} · {height}px height · {icon}px icon</span></div><div class="size-preview-controls">
      <button class="button button-inline" type="button" data-notice="{title} 버튼을 눌렀습니다."><span class="ui-icon icon-plus" aria-hidden="true"></span>새로 만들기</button>
      <button class="button button--outline button--icon" type="button" aria-label="{title} 추가" data-notice="{title} 아이콘 버튼입니다."><span class="ui-icon icon-plus" aria-hidden="true"></span></button>
      <input class="text-input" type="text" value="idenflu mono" aria-label="{title} 입력창" autocomplete="off" />
      <div class="custom-select" data-select><span class="sr-only" id="size-label-{size}">{title} 옵션</span><input type="hidden" name="size-option-{size}" value="default" /><button class="select-trigger" id="size-select-{size}" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="size-options-{size}" aria-labelledby="size-label-{size} size-value-{size}"><span id="size-value-{size}" data-select-label>기본 옵션</span><span class="ui-icon icon-caret" aria-hidden="true"></span></button><div class="select-popup" hidden><ul id="size-options-{size}" class="select-options" role="listbox" aria-labelledby="size-label-{size}"><li id="size-{size}-default" class="select-option" role="option" data-value="default" aria-selected="true"><span class="option-label">기본 옵션</span><span class="ui-icon icon-check option-check" aria-hidden="true"></span></li><li id="size-{size}-other" class="select-option" role="option" data-value="other" aria-selected="false"><span class="option-label">다른 옵션</span><span class="ui-icon icon-check option-check" aria-hidden="true"></span></li></ul></div></div>
      <label class="switch"><input type="checkbox" role="switch" checked aria-label="{title} 알림" /><span class="switch-track" aria-hidden="true"></span></label>
    </div></section>''')

sizes = '''<section class="route-view route-sizes" id="view-sizes" data-route="foundations/sizes" data-title="Sizes" data-group="Foundations" data-description="sm, md, lg 세 가지 크기로 높이와 패딩, 아이콘을 일관되게 관리합니다." aria-label="Sizes" hidden>
<div class="table-scroll" role="region" aria-label="사이즈 토큰" tabindex="0"><table class="size-token-table"><thead><tr><th scope="col">Size</th><th scope="col">Height</th><th scope="col">좌우 패딩</th><th scope="col">Icon</th></tr></thead><tbody><tr><td>sm</td><td>32px</td><td>10px</td><td>14px</td></tr><tr><td>md · 기본</td><td>38px</td><td>12px</td><td>16px</td></tr><tr><td>lg</td><td>44px</td><td>16px</td><td>18px</td></tr></tbody></table></div>
<p class="size-note">본문과 컨트롤 문구는 14px로 유지합니다. 버튼, 입력창, 셀렉트에 같은 사이즈를 적용해보세요.</p><div class="size-examples">''' + ''.join(rows) + '''</div></section>'''

icons = sorted((root / 'assets/icons/idenflu').glob('*.svg'))
items = ''.join(f'<li><span class="ui-icon" style="--icon: url(\'./assets/icons/idenflu/{escape(icon.name)}\')" aria-hidden="true"></span><span>{escape(icon.stem)}</span></li>' for icon in icons)
icons_view = '''<section class="route-view route-icons" id="view-icons" data-route="foundations/icons" data-title="Icons" data-group="Foundations" data-description="기존 idenflu 디자인 시스템의 아이콘을 같은 색상과 크기 규칙으로 사용합니다." aria-label="Icons" hidden>
<p class="icon-reference-note">24px 원본을 기준으로 sm 14px, md 16px, lg 18px로 사용합니다. 외곽선 아이콘은 1.5px 선과 각진 선끝을 유지하고, 색상은 버튼과 필드의 문맥을 따릅니다.</p><ul class="icon-catalog">''' + items + '</ul></section>'
marker = '<section class="route-view route-states"'
source = source.replace(marker, sizes + '\n' + icons_view + '\n' + marker, 1)
source = source.replace('값과 단위를 분리해 명확하게 표시합니다.', '너비를 px 단위로 입력합니다.')
page.write_text(source)
print({'new_pages':2,'imported_and_supplementary_icons':len(icons)})
