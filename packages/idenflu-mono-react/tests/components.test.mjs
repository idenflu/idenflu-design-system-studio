import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { act } = React;
const { TextField, Checkbox, Switch, Select, SearchSelect, MultiSelect, Tabs, Tree, Segmented, Spinner, NovaSpinner, CircleProgress, SegmentedProgress, Toast, Divider, Tooltip, Chip, Table, Icon } = await import('../dist/index.js');
const h = React.createElement;

function fixture() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  return {
    container,
    async render(element) { await act(async () => root.render(element)); },
    async dispose() { await act(async () => root.unmount()); container.remove(); },
  };
}
async function click(element) { assert.ok(element, 'expected a clickable element'); await act(async () => element.click()); }
async function key(element, value) { await act(async () => element.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))); }
after(() => dom.window.close());

test('search TextField clears controlled values through onChange and preserves its ref and focus', async () => {
  const f=fixture(), ref=React.createRef(), changes=[];
  function Search() {
    const [value,setValue]=React.useState('디자인');
    return h(TextField,{label:'프로젝트 검색',type:'search',name:'query',ref,value,onChange:event=>{changes.push(event.target.value);setValue(event.target.value);}});
  }
  try {
    await f.render(h(Search));
    const input=f.container.querySelector('input'), clear=f.container.querySelector('.text-field-clear');
    assert.equal(ref.current,input);assert.equal(clear.hidden,false);
    await click(clear);
    assert.equal(input.value,'');assert.deepEqual(changes,['']);assert.equal(document.activeElement,input);assert.equal(clear.hidden,true);assert.equal(ref.current,input);
  } finally {await f.dispose();}
});

test('uncontrolled search TextField clears the real named input and follows permitted form resets', async () => {
  const f=fixture(), changes=[];let preventReset=false;
  try {
    await f.render(h('form',{onReset:event=>{if(preventReset)event.preventDefault();}},h(TextField,{label:'문서 검색',type:'search',name:'query',defaultValue:'원래 검색어',onChange:event=>changes.push(event.target.value)})));
    const input=f.container.querySelector('input'),clear=f.container.querySelector('.text-field-clear'),form=f.container.querySelector('form');
    await click(clear);assert.equal(input.value,'');assert.deepEqual(changes,['']);assert.equal(new dom.window.FormData(form).get('query'),'');
    preventReset=true;await act(async()=>form.reset());assert.equal(input.value,'');assert.equal(clear.hidden,true);
    preventReset=false;await act(async()=>form.reset());assert.equal(input.value,'원래 검색어');assert.equal(clear.hidden,false);
    assert.deepEqual(changes,['']);
  } finally {await f.dispose();}
});

test('search clear respects controlled rejection, readonly, disabled and custom actions', async () => {
  const f=fixture(), changes=[];
  try {
    await f.render(h(TextField,{label:'검색',type:'search',value:'유지',onChange:event=>changes.push(event.target.value)}));
    await click(f.container.querySelector('.text-field-clear'));assert.equal(f.container.querySelector('input').value,'유지');assert.equal(f.container.querySelector('.text-field-clear').hidden,false);assert.deepEqual(changes,['']);
    for(const state of [{readOnly:true},{disabled:true}]) {
      await f.render(h(TextField,{label:'검색',type:'search',value:'유지',...state,onChange:event=>changes.push(event.target.value)}));
      const clear=f.container.querySelector('.text-field-clear');assert.equal(clear.hidden,true);await click(clear);assert.equal(f.container.querySelector('input').value,'유지');
    }
    await f.render(h(TextField,{label:'검색',type:'search',defaultValue:'검색어',action:h('button',{type:'button'},'사용자 동작')}));
    assert.equal(f.container.querySelectorAll('button').length,1);assert.equal(f.container.querySelector('.text-field-clear'),null);
    await f.render(h(TextField,{label:'일반 입력',defaultValue:'텍스트'}));assert.equal(f.container.querySelector('.text-field-clear'),null);
  } finally {await f.dispose();}
});


test('display Chip uses a span, forwards its ref and ignores activation props', async () => {
  const f = fixture(), ref = React.createRef(); let clicks = 0;
  try {
    await f.render(h(Chip,{interactive:false,ref,variant:'success',rounded:true,id:'saved-chip','data-project':'mono',onClick:() => clicks++,onClickCapture:() => clicks++,tabIndex:0,'aria-pressed':true},'완료'));
    const chip = f.container.querySelector('#saved-chip');
    assert.equal(chip.tagName,'SPAN');
    assert.equal(ref.current,chip);
    assert.equal(chip.getAttribute('data-project'),'mono');
    assert.equal(chip.hasAttribute('tabindex'),false);
    assert.equal(chip.hasAttribute('aria-pressed'),false);
    assert.equal(chip.tabIndex,-1);
    await click(chip);
    assert.equal(clicks,0);
    await act(async () => chip.focus());
    assert.notEqual(document.activeElement,chip);
  } finally { await f.dispose(); }
});

test('compact Chip keeps display semantics and forwards size and refs without leaking density to the DOM', async () => {
  const f = fixture(), ref = React.createRef();
  try {
    for (const size of ['sm', 'md', 'lg']) {
      await f.render(h(Chip,{interactive:false,density:'compact',size,ref,rounded:true,'data-density-example':size},'문서'));
      const chip = f.container.querySelector('.chip');
      assert.equal(chip.tagName,'SPAN');
      assert.equal(ref.current,chip);
      assert.equal(chip.getAttribute('data-size'),size);
      assert.equal(chip.getAttribute('data-density-example'),size);
      assert.equal(chip.classList.contains('chip--static'),true);
      assert.equal(chip.classList.contains('chip--compact'),true);
      assert.equal(chip.classList.contains('chip--rounded'),true);
      assert.equal(chip.hasAttribute('density'),false);
      assert.equal(chip.tabIndex,-1);
      assert.equal(chip.hasAttribute('aria-pressed'),false);
    }
    await f.render(h(Chip,{interactive:false,density:'comfortable',ref},'기본 표시'));
    assert.equal(ref.current.classList.contains('chip--comfortable'),true);
    await f.render(h(Chip,{interactive:false,ref},'기본 표시'));
    assert.equal(ref.current.classList.contains('chip--compact'),false);
    await f.render(h(Chip,{ref,'aria-pressed':true},'필터'));
    assert.equal(ref.current.tagName,'BUTTON');
    assert.equal(ref.current.classList.contains('chip--compact'),false);
    assert.equal(ref.current.getAttribute('aria-pressed'),'true');
  } finally { await f.dispose(); }
});

test('interactive Chip keeps button refs, pressed state and disabled behavior', async () => {
  const f = fixture(), ref = React.createRef(); let clicks = 0;
  try {
    const render = disabled => f.render(h(Chip,{ref,disabled,'aria-pressed':clicks > 0,onClick:() => clicks++},'필터'));
    await render(false);
    const chip = f.container.querySelector('button');
    assert.equal(ref.current,chip);
    assert.equal(chip.type,'button');
    assert.equal(chip.getAttribute('aria-pressed'),'false');
    await click(chip);
    await render(true);
    assert.equal(chip.getAttribute('aria-pressed'),'true');
    await click(chip);
    assert.equal(clicks,1);
  } finally { await f.dispose(); }
});

test('NovaSpinner provides a single accessible status and supports the existing Spinner API', async () => {
  const f = fixture();
  try {
    await f.render(h(NovaSpinner,{size:64,label:'프로젝트를 준비하는 중','data-operation':'prepare'}));
    const status = f.container.querySelector('[role="status"]');
    assert.equal(f.container.querySelectorAll('[role="status"]').length,1);
    assert.equal(status.getAttribute('aria-label'),'프로젝트를 준비하는 중');
    assert.equal(status.getAttribute('data-operation'),'prepare');
    assert.equal(status.querySelector('svg').getAttribute('aria-hidden'),'true');
    assert.equal(status.querySelector('svg').getAttribute('focusable'),'false');
    assert.equal(status.style.getPropertyValue('--nova-spinner-size'),'64px');
    await f.render(h(Spinner,{kind:'nova',size:'small',variant:'inverse','aria-hidden':true}));
    const compact = f.container.querySelector('.nova-spinner');
    assert.equal(compact.style.getPropertyValue('--nova-spinner-size'),'16px');
    assert.equal(compact.getAttribute('aria-hidden'),'true');
  } finally { await f.dispose(); }
});

test('Tooltip activation dismisses without stealing focus or replacing the child click handler', async () => {
  const f = fixture(); let activations = 0;
  try {
    await f.render(h(Tooltip, {content:'버튼 설명'}, h('button', {type:'button', onClick:event => { event.stopPropagation(); activations++; }}, '실행')));
    const button = f.container.querySelector('button'), wrapper = f.container.querySelector('.tooltip-wrap');
    await act(async () => button.focus());
    await click(button);
    assert.equal(activations,1);
    assert.equal(document.activeElement,button);
    assert.equal(wrapper.classList.contains('tooltip-dismissed'),true);
    await act(async () => button.dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body})));
    assert.equal(wrapper.classList.contains('tooltip-dismissed'),true);
    await act(async () => button.blur());
    await act(async () => button.focus());
    assert.equal(wrapper.classList.contains('tooltip-dismissed'),false);
    assert.equal(document.getElementById(button.getAttribute('aria-describedby')).textContent,'버튼 설명');
  } finally { await f.dispose(); }
});

test('Divider exposes its orientation and label while decorative lines stay hidden', async () => {
  const f = fixture(); const ref = React.createRef();
  try {
    await f.render(h(Divider, {ref, 'data-example':'divider'}, '추가 정보'));
    const divider = f.container.querySelector('[role="separator"]');
    assert.equal(ref.current, divider);
    assert.equal(divider.getAttribute('data-example'), 'divider');
    assert.equal(divider.getAttribute('aria-orientation'), 'horizontal');
    assert.equal(document.getElementById(divider.getAttribute('aria-labelledby')).textContent, '추가 정보');
    assert.equal(divider.tabIndex, -1);
    await f.render(h(Divider, {orientation:'vertical', 'aria-label':'도구 그룹 구분'}));
    assert.equal(divider.getAttribute('aria-orientation'), 'vertical');
    assert.equal(divider.getAttribute('aria-label'), '도구 그룹 구분');
    assert.equal(divider.hasAttribute('aria-labelledby'), false);
    await f.render(h(Divider, {decorative:true}, '장식'));
    assert.equal(divider.getAttribute('role'), 'presentation');
    assert.equal(divider.getAttribute('aria-hidden'), 'true');
    assert.equal(divider.hasAttribute('aria-orientation'), false);
    assert.equal(divider.hasAttribute('aria-labelledby'), false);
  } finally { await f.dispose(); }
});

test('Toast exposes urgency and keeps its action separate from dismissing the notice', async () => {
  const f = fixture(); let retries = 0, dismissals = 0;
  try {
    await f.render(h(Toast, {variant:'danger', onDismiss:() => dismissals++, action:h('button', {type:'button', onClick:() => retries++}, '다시 시도')}, '저장 실패'));
    const toast = f.container.querySelector('.toast');
    assert.equal(toast.getAttribute('role'), 'alert');
    assert.equal(toast.getAttribute('aria-atomic'), 'true');
    assert.equal(toast.querySelector('p').textContent, '저장 실패');
    await click(toast.querySelector('.toast-action button'));
    assert.equal(retries, 1);
    assert.equal(dismissals, 0);
    await click(toast.querySelector('[aria-label="알림 닫기"]'));
    assert.equal(dismissals, 1);
    await f.render(h(Toast, {variant:'danger', role:'status'}, '우선순위 조정'));
    assert.equal(f.container.querySelector('.toast').getAttribute('role'), 'status');
    await f.render(h(Toast, {variant:'success'}, '저장 완료'));
    assert.equal(f.container.querySelector('.toast').getAttribute('role'), 'status');
  } finally { await f.dispose(); }
});

test('Toast supplies status icons and supports replacing or hiding them', async () => {
  const f = fixture();
  try {
    for (const appearance of ['default','solid']) for (const [variant,base] of [['info','info'],['success','check-circle'],['warning','warning'],['danger','x-circle']]) {
      const icon=base;
      await f.render(h(Toast, {variant,appearance}, '상태 안내'));
      assert.ok(f.container.querySelector(`.toast-icon .icon-${icon}`));
      assert.equal(f.container.querySelector('.toast-icon').getAttribute('aria-hidden'), 'true');
      assert.equal(f.container.querySelector('.toast').getAttribute('appearance'), null);
      assert.equal(f.container.querySelector('.toast').getAttribute('role'),variant==='danger'?'alert':'status');
    }
    await f.render(h(Toast, {icon:h(Icon,{name:'download'})}, '다운로드 완료'));
    assert.ok(f.container.querySelector('.toast-icon .icon-download'));
    assert.equal(f.container.querySelector('.toast-icon .icon-info'), null);
    await f.render(h(Toast, {icon:null}, '텍스트 안내'));
    assert.equal(f.container.querySelector('.toast-icon'), null);
    assert.equal(f.container.querySelector('.toast').getAttribute('role'), 'status');
  } finally {await f.dispose();}
});

test('inline MultiSelect removes chips and clears the remaining values', async () => {
  const f = fixture();
  try {
    await f.render(h('form', null, h(MultiSelect, { label:'팀', name:'team', presentation:'inline', clearable:true, defaultValue:['a','b'], options:[{value:'a',label:'디자인'},{value:'b',label:'개발'}] })));
    const form = f.container.querySelector('form');
    await click(f.container.querySelector('[aria-label="디자인 제거"]'));
    assert.deepEqual(new dom.window.FormData(form).getAll('team'), ['b']);
    await click(f.container.querySelector('[aria-label="팀 모두 지우기"]'));
    assert.deepEqual(new dom.window.FormData(form).getAll('team'), []);
  } finally { await f.dispose(); }
});

test('loading and progress variants expose their status and actual value', async () => {
  const f = fixture();
  try {
    await f.render(h('div', null, h(Spinner, {kind:'dots',label:'동기화 중'}), h(Spinner, {kind:'bars',label:'처리 중'}), h(CircleProgress,{value:25,max:50,label:'업로드'}), h(SegmentedProgress,{value:3,total:5,label:'단계'})));
    assert.equal(f.container.querySelectorAll('.spinner-dots > span').length, 3);
    assert.equal(f.container.querySelectorAll('.spinner-bars > span').length, 3);
    const [circle, segmented] = f.container.querySelectorAll('[role=progressbar]');
    assert.equal(circle.getAttribute('aria-valuenow'), '25');
    assert.equal(circle.textContent, '50%');
    assert.equal(segmented.getAttribute('aria-valuenow'), '3');
    assert.equal(segmented.querySelectorAll('.is-complete').length, 3);
  } finally { await f.dispose(); }
});

test('TextField links its label and descriptions and reflects controlled value', async () => {
  const f = fixture();
  try {
    const render = (value) => h(TextField, { id: 'website', label: '웹사이트', value, onChange() {}, prefix: 'https://', helperText: '주소 입력', error: '주소 확인', labelPosition: 'left' });
    await f.render(render('one.test'));
    const input = f.container.querySelector('input');
    assert.equal(f.container.querySelector('label').control, input);
    assert.equal(input.value, 'one.test');
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    const descriptions = input.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id)?.textContent);
    assert.deepEqual(descriptions, ['https://', '주소 입력', '주소 확인']);
    await f.render(render('two.test'));
    assert.equal(input.value, 'two.test');
  } finally { await f.dispose(); }
});

test('TextField supports an accessible action without treating it as descriptive text', async () => {
  const f = fixture(); let called = 0;
  try {
    await f.render(h(TextField, {label:'검색', action:h('button', {type:'button', 'aria-label':'검색어 지우기', onClick:() => called++}, '지우기')}));
    assert.equal(f.container.querySelector('label').control, f.container.querySelector('input'));
    assert.equal(f.container.querySelector('input').getAttribute('aria-describedby'), null);
    await click(f.container.querySelector('button'));
    assert.equal(called, 1);
  } finally { await f.dispose(); }
});

test('controlled TextField reports edits and updates through React state', async () => {
  const f = fixture(); const edits = [];
  function Form() {
    const [value, setValue] = React.useState('초기');
    return h(TextField, { label: '이름', value, onChange: event => { edits.push(event.target.value); setValue(event.target.value); } });
  }
  try {
    await f.render(h(Form));
    const input = f.container.querySelector('input');
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '변경');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert.deepEqual(edits, ['변경']);
    assert.equal(input.value, '변경');
  } finally { await f.dispose(); }
});

test('Checkbox and Switch expose native checked state and respond to their labels', async () => {
  const f = fixture(); const changes = [];
  try {
    await f.render(h('div', null, h(Checkbox, { label: '동의', indeterminate: true, onChange: event => changes.push(event.target.checked) }), h(Switch, { label: '알림' })));
    const [checkbox, toggle] = f.container.querySelectorAll('input');
    assert.equal(checkbox.indeterminate, true);
    assert.equal(toggle.getAttribute('role'), 'switch');
    await click(checkbox);
    assert.deepEqual(changes, [true]);
    assert.equal(checkbox.checked, true);
    assert.equal(checkbox.indeterminate, true);
    await click(toggle);
    assert.equal(toggle.checked, true);
  } finally { await f.dispose(); }
});

test('required Select validates, submits its selected value and restores default on reset', async () => {
  const f = fixture();
  try {
    const options = [{ value: 'a', label: '알파' }, { value: 'b', label: '베타' }];
    await f.render(h('form', null, h(Select, { label: '프로젝트', name: 'project', required: true, options })));
    const form = f.container.querySelector('form');
    let valid;
    await act(async () => { valid = form.checkValidity(); });
    assert.equal(valid, false);
    assert.equal(f.container.querySelector('[role=combobox]').getAttribute('aria-invalid'), 'true');
    assert.match(f.container.querySelector('[role=alert]').textContent, /선택/);
    await click(f.container.querySelector('[role=combobox]'));
    await click([...f.container.querySelectorAll('[role=option]')].find(option => option.textContent.includes('베타')));
    assert.equal(form.checkValidity(), true);
    assert.equal(new dom.window.FormData(form).get('project'), 'b');
    await act(async () => form.reset());
    assert.equal(new dom.window.FormData(form).get('project'), '');
    assert.notEqual(f.container.querySelector('[role=combobox]').getAttribute('aria-invalid'), 'true');
  } finally { await f.dispose(); }
});

test('Select option descriptions and decorative icons preserve keyboard selection and submitted values', async () => {
  const f = fixture();
  try {
    const options = [
      {value:'a', label:'디자인', description:'제품을 설계합니다.', icon:h('span', {'aria-label':'장식 이미지'}, '★')},
      {value:'b', label:'개발', description:'제품을 구현합니다.', icon:h('span', null, '◆')},
    ];
    await f.render(h('form', null, h(Select, {label:'팀', name:'team', options, defaultValue:'a'})));
    const form = f.container.querySelector('form'), trigger = form.querySelector('[role=combobox]');
    assert.equal(trigger.getAttribute('aria-label'), '팀: 디자인');
    assert.equal(trigger.querySelector('.select-option-icon').getAttribute('aria-hidden'), 'true');
    await click(trigger);
    const items = [...form.querySelectorAll('[role=option]')];
    assert.match(items[0].textContent, /제품을 설계합니다/);
    assert.equal(items[0].querySelector('.select-option-icon').getAttribute('aria-hidden'), 'true');
    await key(trigger, 'ArrowDown');
    await key(trigger, 'Enter');
    assert.equal(trigger.getAttribute('aria-label'), '팀: 개발');
    assert.equal(new dom.window.FormData(form).get('team'), 'b');
    assert.equal(trigger.querySelector('.select-option-icon').textContent, '◆');
  } finally { await f.dispose(); }
});

test('Select prefix icon remains decorative across selection and form reset', async () => {
  const f = fixture();
  try {
    const options = [{value:'a',label:'디자인'}, {value:'b',label:'개발'}];
    await f.render(h('form', null, h(Select, {label:'팀', name:'team', options, prefixIcon:h('span', {'aria-label':'장식'}, '★')})));
    const form = f.container.querySelector('form'), trigger = form.querySelector('[role=combobox]');
    assert.equal(trigger.getAttribute('aria-label'), '팀: 선택하세요');
    assert.equal(trigger.querySelector('.select-prefix-icon').getAttribute('aria-hidden'), 'true');
    await click(trigger);
    await click([...form.querySelectorAll('[role=option]')].find(option => option.textContent.includes('개발')));
    assert.equal(trigger.getAttribute('aria-label'), '팀: 개발');
    assert.equal(new dom.window.FormData(form).get('team'), 'b');
    assert.equal(trigger.querySelector('.select-prefix-icon').textContent, '★');
    await act(async () => form.reset());
    assert.equal(trigger.getAttribute('aria-label'), '팀: 선택하세요');
    assert.equal(trigger.querySelector('.select-prefix-icon').textContent, '★');
  } finally { await f.dispose(); }
});

test('prefix icons activate search and inline multi-select without enabling disabled controls', async () => {
  const f = fixture();
  try {
    const options = [{value:'a',label:'디자인'}, {value:'b',label:'개발'}];
    const prefixIcon = h('span', null, '★');
    await f.render(h('div', null,
      h(SearchSelect, {label:'검색', options, prefixIcon}),
      h(MultiSelect, {label:'팀', options, prefixIcon, presentation:'inline'}),
      h(SearchSelect, {label:'비활성', options, prefixIcon, disabled:true}),
    ));
    const [search, multi, disabled] = f.container.querySelectorAll('.custom-select');
    await click(search.querySelector('.select-prefix-icon'));
    assert.equal(document.activeElement, search.querySelector('[role=combobox]'));
    assert.equal(search.querySelector('[role=combobox]').getAttribute('aria-expanded'), 'true');
    await click(multi.querySelector('.select-prefix-icon'));
    assert.equal(multi.querySelector('[role=combobox]').getAttribute('aria-expanded'), 'true');
    await click(multi.querySelector('[role=option]'));
    assert.ok(multi.querySelector('[aria-label="디자인 제거"]'));
    assert.equal(multi.querySelector('.select-prefix-icon').getAttribute('aria-hidden'), 'true');
    await click(disabled.querySelector('.select-prefix-icon'));
    assert.equal(disabled.querySelector('[role=combobox]').getAttribute('aria-expanded'), 'false');
  } finally { await f.dispose(); }
});

test('MultiSelect submits repeated values and reset restores its initial selection', async () => {
  const f = fixture();
  try {
    const options = [{ value: 'a', label: '알파' }, { value: 'b', label: '베타' }];
    await f.render(h('form', null, h(MultiSelect, { label: '태그', name: 'tags', options, defaultValue: ['a'] })));
    const form = f.container.querySelector('form');
    assert.deepEqual(new dom.window.FormData(form).getAll('tags'), ['a']);
    await click(f.container.querySelector('[role=combobox]'));
    await click([...f.container.querySelectorAll('[role=option]')].find(option => option.textContent.includes('베타')));
    assert.deepEqual(new dom.window.FormData(form).getAll('tags'), ['a', 'b']);
    await act(async () => form.reset());
    assert.deepEqual(new dom.window.FormData(form).getAll('tags'), ['a']);
  } finally { await f.dispose(); }
});

test('controlled Select reports selection and follows the parent value on form reset', async () => {
  const f = fixture(); const changes = [];
  function Form() {
    const [value, setValue] = React.useState('a');
    return h('form', null, h(Select, { label: '선택', name: 'choice', value, onValueChange: next => { changes.push(next); setValue(next); }, options: [{ value: 'a', label: '알파' }, { value: 'b', label: '베타' }] }));
  }
  try {
    await f.render(h(Form));
    const form = f.container.querySelector('form');
    await click(f.container.querySelector('[role=combobox]'));
    await click([...f.container.querySelectorAll('[role=option]')].find(option => option.textContent.includes('베타')));
    assert.deepEqual(changes, ['b']);
    assert.equal(new dom.window.FormData(form).get('choice'), 'b');
    await act(async () => form.reset());
    assert.equal(new dom.window.FormData(form).get('choice'), 'b');
  } finally { await f.dispose(); }
});

test('canceled form reset preserves selection and tree expansion', async () => {
  const f = fixture();
  const options = [{ value: 'a', label: '알파' }, { value: 'b', label: '베타' }];
  try {
    await f.render(h('form', { onReset: event => event.preventDefault() },
      h(Select, { label: '선택', name: 'select', options, defaultValue: 'a' }),
      h(Segmented, { label: '구분', name: 'segment', options, defaultValue: 'a' }),
      h(Tree, { label: '트리', name: 'tree', items: [{ value: 'root', label: '폴더', children: [{ value: 'leaf', label: '파일' }] }] }),
    ));
    await click(f.container.querySelector('[role=combobox]'));
    await click([...f.container.querySelectorAll('[role=option]')][1]);
    await click(f.container.querySelectorAll('.segmented-control button')[1]);
    await click(f.container.querySelector('summary'));
    await click(f.container.querySelector('.tree-item'));
    const form = f.container.querySelector('form');
    await act(async () => form.reset());
    assert.deepEqual([...new dom.window.FormData(form).entries()], [['select', 'b'], ['segment', 'b'], ['tree', 'leaf']]);
    assert.equal(f.container.querySelector('details').open, true);
  } finally { await f.dispose(); }
});

test('Tabs keyboard navigation skips disabled tabs and activates the matching panel', async () => {
  const f = fixture(); const changes = [];
  try {
    await f.render(h(Tabs, { label: '설정', items: [{ value: 'a', label: '일반', content: '일반 내용' }, { value: 'b', label: '비활성', content: '비활성 내용', disabled: true }, { value: 'c', label: '보안', content: '보안 내용' }], onValueChange: value => changes.push(value) }));
    const tabs = [...f.container.querySelectorAll('[role=tab]')];
    tabs[0].focus();
    await key(tabs[0], 'ArrowRight');
    assert.equal(document.activeElement, tabs[2]);
    assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
    assert.deepEqual(changes, ['c']);
    const panel = document.getElementById(tabs[2].getAttribute('aria-controls'));
    assert.equal(panel.hidden, false);
    assert.equal(panel.textContent, '보안 내용');
  } finally { await f.dispose(); }
});

test('Select scrolls keyboard-active options into view', async () => {
  const f = fixture(); const calls = [];
  const previous = dom.window.HTMLElement.prototype.scrollIntoView;
  dom.window.HTMLElement.prototype.scrollIntoView = function (options) { calls.push([this.textContent, options]); };
  try {
    const options = Array.from({ length: 30 }, (_, index) => ({ value: String(index), label: `옵션 ${index}` }));
    await f.render(h(Select, { label: '목록', options }));
    const trigger = f.container.querySelector('[role=combobox]');
    await click(trigger);
    await key(trigger, 'End');
    assert.equal(calls.at(-1)[0], '옵션 29');
    assert.equal(calls.at(-1)[1].block, 'nearest');
    assert.equal(trigger.getAttribute('aria-activedescendant'), f.container.querySelectorAll('[role=option]')[29].id);
  } finally {
    if (previous) dom.window.HTMLElement.prototype.scrollIntoView = previous;
    else delete dom.window.HTMLElement.prototype.scrollIntoView;
    await f.dispose();
  }
});

test('Tree expands branches, selects a leaf and resets the initial state', async () => {
  const f = fixture(); const changes = [];
  try {
    const items = [{ value: 'design', label: '디자인', children: [{ value: 'system', label: '시스템' }, { value: 'brand', label: '브랜드' }] }];
    await f.render(h('form', null, h(Tree, { label: '프로젝트', items, name: 'item', onValueChange: value => changes.push(value) })));
    const form = f.container.querySelector('form'), branch = f.container.querySelector('details');
    assert.equal(f.container.querySelector('.demo-tree').dataset.variant, 'tree');
    assert.equal(branch.open, false);
    await click(branch.querySelector('summary'));
    assert.equal(branch.open, true);
    await click([...branch.querySelectorAll('button')].find(button => button.textContent === '브랜드'));
    assert.deepEqual(changes, ['brand']);
    assert.equal(new dom.window.FormData(form).get('item'), 'brand');
    assert.equal(branch.querySelector('[aria-current=true]').textContent, '브랜드');
    await act(async () => form.reset());
    assert.equal(branch.open, false);
    assert.equal(new dom.window.FormData(form).get('item'), '');
  } finally { await f.dispose(); }
});

test('Tree category roots share selection and expansion with the default tree style', async () => {
  const f = fixture(), changes = [], expansion = [];
  const items = [{ value: 'root', label: '업무 공간', children: [
    { value: 'branch', label: '프로젝트 관리', children: [{ value: 'first', label: '전체 프로젝트' }, { value: 'second', label: '진행 중 프로젝트' }] },
    { value: 'disabled', label: '준비 중', disabled: true },
  ] }];
  const render = variant => h('form', null, h(Tree, { items, variant, label: '업무 메뉴', name: 'page', defaultValue: 'first', defaultExpanded: ['root', 'branch'], onValueChange: value => changes.push(value), onExpandedChange: values => expansion.push(values) }));
  try {
    await f.render(render('category'));
    const group = f.container.querySelector('.demo-tree');
    assert.equal(group.dataset.variant, 'category');
    assert.equal(f.container.querySelectorAll('.demo-tree').length, 1);
    assert.equal(group.querySelectorAll('details').length, 1);
    const category = group.querySelector('.tree-category'), heading = category.querySelector('h3');
    assert.equal(heading.textContent, '업무 공간');
    assert.equal(category.getAttribute('aria-labelledby'), heading.id);
    assert.equal(group.querySelector('button:disabled').textContent, '준비 중');
    await click([...group.querySelectorAll('button')].find(button => button.textContent === '진행 중 프로젝트'));
    assert.deepEqual(changes, ['second']);
    await click(group.querySelector('summary'));
    assert.deepEqual(expansion, [['root']]);
    await f.render(render('tree'));
    assert.equal(group.dataset.variant, 'tree');
    const rootBranch = group.querySelector('details');
    assert.equal(group.querySelector('.tree-category'), null);
    assert.equal(rootBranch.open, true);
    assert.equal(rootBranch.querySelector('details').open, false);
    assert.equal(group.querySelector('[aria-current=true]').textContent, '진행 중 프로젝트');
    await f.render(render('category'));
    await act(async () => f.container.querySelector('form').reset());
    assert.equal(group.querySelector('details').open, true);
    assert.equal(new dom.window.FormData(f.container.querySelector('form')).get('page'), 'first');
  } finally { await f.dispose(); }
});

test('Table enables row hover only when interactive and keeps selected rows marked', async () => {
  const f = fixture(), ref = React.createRef();
  const body = h('tbody', null, h('tr', { 'data-selected': true }, h('td', null, '디자인 시스템')));
  try {
    await f.render(h(Table, { ref, className: 'project-table' }, body));
    const table = f.container.querySelector('table');
    assert.equal(ref.current, table);
    assert.equal(table.className, 'data-table project-table');
    assert.equal(table.dataset.density, 'default');
    assert.equal(table.hasAttribute('data-interactive'), false);
    await f.render(h(Table, { ref, density: 'compact', interactive: true }, body));
    assert.equal(table.dataset.density, 'compact');
    assert.equal(table.getAttribute('data-interactive'), 'true');
    assert.equal(table.querySelector('tr').getAttribute('data-selected'), 'true');
    await f.render(h(Table, { ref, interactive: false }, body));
    assert.equal(table.hasAttribute('data-interactive'), false);
  } finally { await f.dispose(); }
});
