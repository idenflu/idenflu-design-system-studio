"use strict";

const cases = [];
const test = (name, route, check) => cases.push({ name, route, check });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const equal = (actual, expected, message) => assert(actual === expected, `${message}: ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);

async function loadApp(route) {
  const frame = document.createElement("iframe");
  frame.id = "test-app";
  frame.title = `검증 중: ${route}`;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("문서 로드 시간 초과")), 10000);
    frame.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
    frame.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("문서 로드 실패")); }, { once: true });
    frame.src = './runtime-fixture.html';
    document.getElementById("test-app").replaceWith(frame);
  });
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  const get = (selector) => {
    const element = doc.querySelector(selector);
    assert(element, `요소 없음: ${selector}`);
    return element;
  };
  const edit = (selector, value) => {
    const input = get(selector);
    input.value = value;
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
    return input;
  };
  const blur = (selector) => get(selector).dispatchEvent(new win.FocusEvent("blur"));
  const click = (selector) => {
    const element = get(selector);
    assert(element.getClientRects().length > 0 && win.getComputedStyle(element).visibility !== "hidden", `숨겨진 요소 클릭: ${selector}`);
    element.click();
  };
  // reset/close handlers finish in later tasks; assertions run after those tasks and layout.
  const settle = () => new Promise((resolve) => win.setTimeout(() => win.requestAnimationFrame(resolve), 0));
  const key = (selector, keyName) => get(selector).dispatchEvent(new win.KeyboardEvent("keydown", { key: keyName, bubbles: true }));
  return { win, doc, get, edit, blur, click, settle, key };
}

test('독립 런타임: 데모 DOM 없이 초기화·동적 마운트·중복 방지', 'runtime-fixture', async (app) => {
  equal(app.win.fixtureErrors.length, 0, '독립 문서 런타임 오류');
  const runtime = app.win.IdenfluMono;
  const original = runtime.get(app.get('#fixture-select-a'));
  assert(original, 'select 컨트롤러 없음');
  runtime.init(app.doc); runtime.init(app.doc);
  equal(runtime.get(app.get('#fixture-select-a')), original, '중복 초기화로 인스턴스 변경');
  let events = 0;
  app.get('#fixture-select-a').addEventListener('selectchange', () => events++);
  original.setValue('b');
  equal(original.getValue(), 'b', '공개 값 API');
  equal(events, 1, '중복 이벤트');
  equal(runtime.get(app.get('#fixture-select-b')).getValue(), 'a', '다른 인스턴스 값 오염');
  let rejected = false;
  try { original.setValue('c'); } catch (error) { rejected = error.name === 'RangeError'; }
  assert(rejected, '비활성 옵션을 API로 선택할 수 있음');
  equal(original.getValue(), 'b', '잘못된 API 인수 이후 값 보존');
  const host = app.doc.createElement('div');
  host.innerHTML = '<div data-select><input type="hidden" value="a"><button type="button" class="select-trigger" role="combobox" aria-label="동적 선택" aria-expanded="false"><span data-select-label>A</span></button><div class="select-popup" hidden><ul role="listbox"><li role="option" data-value="a" aria-selected="true"><span class="option-label">A</span></li><li role="option" data-value="b" aria-selected="false"><span class="option-label">B</span></li></ul></div></div>';
  app.doc.body.append(host); runtime.init(host);
  const dynamic = runtime.get(host.firstElementChild);
  assert(dynamic, '동적 초기화 실패'); dynamic.setValue('b'); equal(dynamic.getValue(), 'b', '동적 값 변경');
  runtime.destroy(host); equal(runtime.get(host.firstElementChild), null, '동적 정리 실패'); host.remove();
});

test('독립 런타임: destroy 후 리스너 해제·재초기화·폼 reset', 'runtime-fixture', async (app) => {
  const runtime = app.win.IdenfluMono; const picker = app.get('#fixture-select-a');
  const previous = runtime.get(picker); previous.setValue('b'); runtime.destroy(picker);
  equal(runtime.get(picker), null, 'destroy 후 컨트롤러가 남음');
  picker.querySelector('.select-trigger').click();
  assert(picker.querySelector('.select-popup').hidden, 'destroy 후 클릭 리스너가 남음');
  runtime.init(picker); const next = runtime.get(picker); assert(next !== previous, '재초기화 실패');
  next.setValue('b'); picker.closest('form').reset(); await app.settle();
  // A new mount treats its current hidden value as its initial value.
  equal(next.getValue(), 'b', '재초기화된 초기값 복원');
  const other = runtime.get(app.get('#fixture-select-b')); other.setValue('b');
  app.get('#fixture-select-b').closest('form').reset(); await app.settle(); equal(other.getValue(), 'a', '폼 reset 초기값');
});

test('독립 탭: 그룹별 선택·disabled 건너뛰기·세로 방향키', 'runtime-fixture', async (app) => {
  const first = app.get('#fixture-tabs-a'); const second = app.get('#fixture-tabs-b');
  const enabled = [...first.querySelectorAll('[role=tab]')].filter((tab) => !tab.disabled);
  app.key(`#${enabled[0].id}`, 'ArrowRight');
  equal(enabled[1].getAttribute('aria-selected'), 'true', 'disabled 탭 건너뛰기');
  equal(second.querySelector('[aria-selected=true]').dataset.value, 'a', '다른 탭 그룹 선택 변경');
  second.setAttribute('aria-orientation', 'vertical');
  const tab = second.querySelector('[role=tab]'); app.key(`#${tab.id}`, 'ArrowDown');
  equal(app.win.IdenfluMono.get(second).getValue(), 'b', '세로 탭 방향키');
  equal([...first.querySelectorAll('[tabindex="0"]')].length, 1, '탭 단일 Tab 진입');
});

test('검색·멀티 선택: API 및 입력 포커스의 활성 옵션 ARIA', 'runtime-fixture', async (app) => {
  const runtime = app.win.IdenfluMono;
  const search = runtime.get(app.get('#fixture-search')); search.setValue('b'); equal(search.getValue(), 'b', '검색 선택 API');
  const picker = app.get('#fixture-multi'); const multi = runtime.get(picker); multi.open();
  const input = picker.querySelector('.multi-search-input');
  equal(app.doc.activeElement, input, '멀티 검색 입력 포커스');
  equal(input.getAttribute('role'), 'combobox', '검색 입력 역할');
  assert(input.getAttribute('aria-activedescendant'), '검색 입력 활성 옵션 없음');
  const active = app.doc.getElementById(input.getAttribute('aria-activedescendant'));
  assert(active && !active.hidden, '활성 옵션 참조 오류');
  const before = multi.getValue().includes(active.dataset.value);
  app.key(`#${input.id}`, 'Enter');
  equal(multi.getValue().includes(active.dataset.value), !before, 'Enter 복수 선택');
  multi.close(); equal(input.getAttribute('aria-activedescendant'), null, '닫힌 목록 활성 참조 제거');
});

test('날짜·숫자 공개 API: 정확한 값·잘못된 값 보존·emit:false', 'runtime-fixture', async (app) => {
  const runtime = app.win.IdenfluMono;
  const dateElement = app.get('#fixture-date'); const date = runtime.get(dateElement); let dateEvents = 0;
  dateElement.addEventListener('datechange', () => dateEvents++);
  date.setValue('2026-11-02', { emit: false }); equal(date.getValue(), '2026-11-02', '날짜 값'); equal(dateEvents, 0, '무음 날짜 변경');
  let rejected = false; try { date.setValue('2026-02-30'); } catch (error) { rejected = error.name === 'RangeError'; }
  assert(rejected, '유효하지 않은 날짜 API 허용'); equal(date.getValue(), '2026-11-02', '날짜 이전값 보존');
  const element = app.get('#fixture-number'); const number = runtime.get(element); number.setValue('0');
  const input = element.querySelector('.number-field-input');
  for (let i = 0; i < 3; i++) app.key(`#${input.id}`, 'ArrowUp');
  equal(number.getValue(), '0.3', '정확한 소수 증감');
  let detail; element.addEventListener('numberchange', (event) => { detail = event.detail; });
  number.setValue('9007199254740993.5'); equal(number.getValue(), '9007199254740993.5', '큰 소수 문자열 보존'); equal(detail.numberValue, null, '손실 가능한 Number 반환');
});

async function run() {
  const button = document.getElementById("run-tests");
  const results = document.getElementById("test-results");
  const summary = document.getElementById("test-summary");
  button.disabled = true;
  results.replaceChildren();
  document.documentElement.dataset.testState = "running";
  window.regressionResults = [];
  for (const { name, route, check } of cases) {
    summary.textContent = `검증 중: ${name}`;
    const item = document.createElement("li");
    try {
      await check(await loadApp(route));
      item.dataset.result = "passed";
      item.textContent = `PASS · ${name}`;
      window.regressionResults.push({ name, passed: true });
    } catch (error) {
      item.dataset.result = "failed";
      item.textContent = `FAIL · ${name}: ${error.message}`;
      window.regressionResults.push({ name, passed: false, error: error.message });
    }
    results.append(item);
  }
  const passed = window.regressionResults.filter((result) => result.passed).length;
  const failed = cases.length - passed;
  summary.textContent = `${cases.length}개 중 ${passed}개 통과 · ${failed}개 실패`;
  document.documentElement.dataset.testState = failed ? "failed" : "passed";
  button.disabled = false;
}

document.getElementById("run-tests").addEventListener("click", run);
run();
