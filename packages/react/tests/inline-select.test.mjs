import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual:true });
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','Node','MouseEvent','KeyboardEvent']) {
  Object.defineProperty(globalThis,name,{ configurable:true,value:dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { MultiSelect } = await import('../dist/index.js');
const h = React.createElement;
const options = [{value:'design',label:'디자인'},{value:'development',label:'개발'}];
after(() => dom.window.close());

async function fixture(props) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => root.render(h(MultiSelect,{label:'참여 팀',options,presentation:'inline',clearable:true,...props})));
  return {container,async dispose() { await React.act(async () => root.unmount()); container.remove(); }};
}
async function click(element) { assert.ok(element); await React.act(async () => element.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))); }

for (const searchable of [false,true]) {
  test(`inline MultiSelect opens from empty space and keeps keyboard focus, searchable=${searchable}`,async () => {
    const f = await fixture({searchable});
    try {
      const trigger = f.container.querySelector('.multi-inline-trigger');
      const placeholder = f.container.querySelector('.multi-inline-placeholder');
      await click(placeholder);
      assert.equal(trigger.getAttribute('aria-expanded'),'true');
      const focused = searchable ? f.container.querySelector('.multi-search-input') : trigger;
      assert.equal(document.activeElement,focused);
      await React.act(async () => focused.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true})));
      const active = focused.getAttribute('aria-activedescendant');
      await click(f.container.querySelector('.multi-inline-tags'));
      assert.equal(trigger.getAttribute('aria-expanded'),'true');
      assert.equal(document.activeElement,focused);
      assert.equal(focused.getAttribute('aria-activedescendant'),active);
      await React.act(async () => focused.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));
      assert.ok(f.container.querySelector('[aria-label="개발 제거"]'));
      await React.act(async () => focused.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
      assert.equal(trigger.getAttribute('aria-expanded'),'false');
      assert.equal(document.activeElement,trigger);
    } finally { await f.dispose(); }
  });

  test(`inline MultiSelect keeps chip, clear and caret actions independent, searchable=${searchable}`,async () => {
    const f = await fixture({searchable,defaultValue:['design','development'],prefixIcon:h('svg',null,h('path',null))});
    try {
      const trigger = f.container.querySelector('.multi-inline-trigger');
      await click(f.container.querySelector('[aria-label="디자인 제거"] .icon-close'));
      assert.equal(trigger.getAttribute('aria-expanded'),'false');
      await click(f.container.querySelector('.multi-inline-clear .icon-close'));
      assert.equal(f.container.querySelectorAll('.multi-inline-chip').length,0);
      assert.equal(trigger.getAttribute('aria-expanded'),'false');
      await click(f.container.querySelector('.select-prefix-icon path'));
      assert.equal(trigger.getAttribute('aria-expanded'),'true');
      await click(f.container.querySelector('.select-prefix-icon path'));
      assert.equal(trigger.getAttribute('aria-expanded'),'true');
      await click(trigger.querySelector('.icon-caret'));
      assert.equal(trigger.getAttribute('aria-expanded'),'false');
      await click(trigger.querySelector('.icon-caret'));
      assert.equal(trigger.getAttribute('aria-expanded'),'true');
    } finally { await f.dispose(); }
  });
}

test('disabled inline MultiSelect ignores the empty area, placeholder and prefix',async () => {
  const f = await fixture({disabled:true,searchable:true,prefixIcon:h('span',null,'★')});
  try {
    for (const selector of ['.multi-inline-control','.multi-inline-tags','.multi-inline-placeholder','.select-prefix-icon']) {
      await click(f.container.querySelector(selector));
      assert.equal(f.container.querySelector('.multi-inline-trigger').getAttribute('aria-expanded'),'false');
      assert.equal(f.container.contains(document.activeElement),false);
    }
  } finally { await f.dispose(); }
});

for (const limit of [0,2]) {
  test(`inline tag limit ${limit} changes only the presentation and opens all selected options`,async () => {
    const many = Array.from({length:10},(_,index)=>({value:String(index),label:`팀 ${index+1}`}));
    const f = await fixture({options:many,defaultValue:many.map(item=>item.value),maxVisibleTags:limit,searchable:true});
    try {
      const trigger=f.container.querySelector('.multi-inline-trigger');
      assert.equal(f.container.querySelectorAll('.multi-inline-chip').length,limit);
      assert.equal(f.container.querySelector('button.multi-inline-more').textContent,`+${10-limit}개`);
      assert.equal(f.container.querySelector('select').selectedOptions.length,10);
      assert.equal(f.container.querySelector('[maxvisibletags]'),null);
      await click(f.container.querySelector('button.multi-inline-more'));
      assert.equal(trigger.getAttribute('aria-expanded'),'true');
      assert.equal(document.activeElement,f.container.querySelector('.multi-search-input'));
      assert.equal(f.container.querySelectorAll('[role="option"][aria-selected="true"]').length,10);
      await click(f.container.querySelectorAll('[role="option"]')[9]);
      assert.equal(f.container.querySelector('select').selectedOptions.length,9);
      assert.equal(f.container.querySelector('button.multi-inline-more').textContent,`+${9-limit}개`);
      await click(f.container.querySelector('.multi-inline-clear'));
      assert.equal(f.container.querySelector('select').selectedOptions.length,0);
      assert.equal(f.container.querySelector('button.multi-inline-more'),null);
      assert.ok(f.container.querySelector('.multi-inline-placeholder'));
    } finally { await f.dispose(); }
  });
}

test('disabled summary cannot open the list and keeps the selected values',async () => {
  const f=await fixture({defaultValue:['design','development'],maxVisibleTags:0,disabled:true});
  try {
    const more=f.container.querySelector('button.multi-inline-more');
    assert.equal(more.disabled,true);
    await click(more);
    assert.equal(f.container.querySelector('.multi-inline-trigger').getAttribute('aria-expanded'),'false');
    assert.equal(f.container.querySelector('select').selectedOptions.length,2);
  } finally { await f.dispose(); }
});
