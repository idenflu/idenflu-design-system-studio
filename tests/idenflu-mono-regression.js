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
    frame.src = route === 'runtime-fixture' ? './runtime-fixture.html' : `../systems/idenflu-mono/index.html#/${route}`;
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

async function waitFor(check, message) {
  const deadline = Date.now() + 3000;
  while (!check()) {
    if (Date.now() >= deadline) throw new Error(message);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function submitDrawer(app) { app.click('#drawer-form button[type="submit"]'); }
function makeDrawerError(app) {
  app.click("#drawer-open");
  app.edit("#drawer-name", "   ");
  submitDrawer(app);
  assert(app.get("#drawer-name").validity.customError, "공백 이름이 customValidity 오류를 만들지 않음");
}
function clickDrawerSurface(app, outside) {
  const drawer = app.get("#demo-drawer");
  const bounds = drawer.getBoundingClientRect();
  // A bare .click() has (0, 0). Supply explicit coordinates for dialog padding/backdrop.
  drawer.dispatchEvent(new app.win.MouseEvent("click", {
    bubbles: true,
    clientX: outside ? bounds.left - 5 : bounds.right - 2,
    clientY: outside ? bounds.top + 20 : bounds.bottom - 2,
  }));
}

for (const close of ["cancel", "close", "escape", "backdrop"]) {
  test(`드로어 오류 → ${close} → 다시 열기 → 수정 없이 저장`, "components/drawer", async (app) => {
    makeDrawerError(app);
    if (close === "backdrop") clickDrawerSurface(app, true);
    else if (close === "escape") {
      // Synthetic key events do not run native dialog defaults; test its cancel event.
      const event = new app.win.Event("cancel", { cancelable: true });
      if (app.get("#demo-drawer").dispatchEvent(event)) app.get("#demo-drawer").close();
    } else app.click(close === "cancel" ? "#drawer-cancel" : "#drawer-close");
    await app.settle();
    assert(!app.get("#demo-drawer").open, "드로어가 닫히지 않음");
    app.click("#drawer-open");
    equal(app.get("#drawer-name").value, "디자인 시스템", "저장된 이름 복원");
    equal(app.get("#drawer-name").validationMessage, "", "재진입 시 오류 초기화");
    submitDrawer(app);
    assert(!app.get("#demo-drawer").open, "정상 이름 저장이 차단됨");
    assert(app.get("#drawer-feedback").textContent.includes("설정을 저장했습니다"), "저장 결과 없음");
  });
}

test("드로어 내부 여백은 편집 유지, 외부 배경은 닫기", "components/drawer", async (app) => {
  app.click("#drawer-open");
  app.edit("#drawer-name", "편집 중인 프로젝트");
  clickDrawerSurface(app, false);
  assert(app.get("#demo-drawer").open, "내부 여백 클릭으로 닫힘");
  equal(app.get("#drawer-name").value, "편집 중인 프로젝트", "편집 값 유지");
  clickDrawerSurface(app, true);
  assert(!app.get("#demo-drawer").open, "외부 배경 클릭으로 닫히지 않음");
  app.click("#drawer-open");
  equal(app.get("#drawer-name").value, "디자인 시스템", "취소 후 저장된 값 복원");
});

test("드로어 수정값 저장 후 재진입", "components/drawer", async (app) => {
  app.click("#drawer-open");
  app.edit("#drawer-name", "  새 프로젝트  ");
  app.edit("#drawer-note", "저장된 설명");
  submitDrawer(app);
  app.click("#drawer-open");
  equal(app.get("#drawer-name").value, "새 프로젝트", "정규화된 이름 저장");
  equal(app.get("#drawer-note").value, "저장된 설명", "설명 저장");
});

function submitBooking(app) { app.click('#form-booking button[type="submit"]'); }
function bookingError(app, expected) {
  const input = app.get("#form-booking-date");
  equal(input.getAttribute("aria-invalid"), expected ? "true" : null, "날짜 aria-invalid");
  equal(input.closest(".date-field").classList.contains("has-error"), expected, "날짜 오류 테두리");
  equal(app.get("#form-booking-date-error").hidden, !expected, "폼 오류 문구 노출");
  equal(input.getAttribute("aria-errormessage"), expected ? "form-booking-date-error" : null, "날짜 오류 참조");
}

test("빈 날짜 제출 → 달력 열기·Escape 후 필수 오류 유지", "patterns/form/booking", async (app) => {
  submitBooking(app);
  bookingError(app, true);
  app.click("#form-booking-date-trigger");
  bookingError(app, true);
  app.key("#form-booking-date-popup .calendar-day[tabindex='0']", "Escape");
  assert(app.get("#form-booking-date-popup").hidden, "Escape로 달력이 닫히지 않음");
  bookingError(app, true);
  equal(app.doc.activeElement, app.get("#form-booking-date-trigger"), "달력 닫기 후 포커스 복귀");
});

test("빈 날짜 제출 → 달력 외부 클릭 후 필수 오류 유지", "patterns/form/booking", async (app) => {
  submitBooking(app);
  app.click("#form-booking-date-trigger");
  app.click("#doc-title");
  assert(app.get("#form-booking-date-popup").hidden, "외부 클릭으로 달력이 닫히지 않음");
  bookingError(app, true);
});

test("필수 오류 → 직접 입력 → 정규화·오류 해제·제출", "patterns/form/booking", async (app) => {
  submitBooking(app);
  app.edit("#form-booking-date", "20261102");
  app.blur("#form-booking-date");
  equal(app.get("#form-booking-date").value, "2026-11-02", "날짜 정규화");
  equal(app.get("#form-booking-date-value").value, "2026-11-02", "숨김 값 동기화");
  bookingError(app, false);
  submitBooking(app);
  assert(!app.get("#form-booking-result").hidden, "정상 예약 입력 확인 실패");
});

test("필수 오류 → 달력 선택 → 지우기 시 필수 오류 복구", "patterns/form/booking", async (app) => {
  submitBooking(app);
  app.click("#form-booking-date-trigger");
  app.click("#form-booking-picker [data-calendar-today]");
  assert(app.get("#form-booking-date-value").value, "달력 선택값 없음");
  bookingError(app, false);
  submitBooking(app);
  app.click("#form-booking-date-trigger");
  app.click("#form-booking-picker [data-calendar-clear]");
  equal(app.get("#form-booking-date").value, "", "지운 날짜 입력");
  equal(app.get("#form-booking-date-value").value, "", "지운 숨김 값");
  bookingError(app, true);
  assert(app.get("#form-booking-result").hidden, "값 변경 후 이전 성공 결과가 남음");
});

test("형식 오류 → 달력 지우기 시 필수 오류 문구로 변경", "patterns/form/booking", async (app) => {
  app.edit("#form-booking-date", "2026-02-30");
  submitBooking(app);
  assert(app.get("#form-booking-date-error").textContent.includes("올바른 날짜"), "형식 오류 없음");
  app.click("#form-booking-date-trigger");
  app.click("#form-booking-picker [data-calendar-clear]");
  bookingError(app, true);
  equal(app.get("#form-booking-date-error").textContent, "예약 날짜를 입력해주세요.", "지우기 후 필수 오류 갱신");
});

test("날짜 오류 후 폼 초기화 → 오류·입력·결과 초기화", "patterns/form/booking", async (app) => {
  app.edit("#form-booking-date", "2026-02-30");
  submitBooking(app);
  app.click("#form-booking-date-trigger");
  app.click('#form-booking button[type="reset"]');
  await app.settle();
  equal(app.get("#form-booking-date").value, "", "초기 날짜");
  equal(app.get("#form-booking-date-value").value, "", "초기 숨김 값");
  bookingError(app, false);
  assert(app.get("#form-booking-date-popup").hidden, "초기화 후 달력이 열려 있음");
  assert(app.get("#form-booking-result").hidden, "초기화 후 결과가 남음");
  app.edit("#form-booking-date", "20261102");
  app.blur("#form-booking-date");
  bookingError(app, false);
});

test("정상 날짜 제출 후 초기화 → visible·hidden 값 모두 초기 상태", "patterns/form/booking", async (app) => {
  app.edit("#form-booking-date", "20261102");
  app.blur("#form-booking-date");
  submitBooking(app);
  assert(!app.get("#form-booking-result").hidden, "초기화 전 정상 제출 실패");
  app.click('#form-booking button[type="reset"]');
  await app.settle();
  equal(app.get("#form-booking-date").value, "", "정상값 이후 초기 날짜");
  equal(app.get("#form-booking-date-value").value, "", "정상값 이후 초기 숨김 값");
  bookingError(app, false);
  assert(app.get("#form-booking-result").hidden, "초기화 후 성공 결과가 남음");
});

test("독립 날짜 선택기: 형식 오류 → 윤년 날짜 → 지우기", "components/date-picker", async (app) => {
  const input = app.edit("#date-input", "2026-02-29");
  app.blur("#date-input");
  equal(input.getAttribute("aria-invalid"), "true", "유효하지 않은 날짜 오류");
  app.edit("#date-input", "20240229");
  app.blur("#date-input");
  equal(input.value, "2024-02-29", "윤년 날짜 정규화");
  equal(input.getAttribute("aria-invalid"), null, "수정 후 형식 오류 해제");
  app.click("#date-input + input + .date-trigger");
  assert(!input.closest("[data-date-picker]").querySelector(".date-popup").hidden, "독립 달력이 열리지 않음");
  app.get("#date-input").closest("[data-date-picker]").querySelector("[data-calendar-clear]").click();
  equal(input.value, "", "선택하지 않은 날짜 지우기");
  equal(input.getAttribute("aria-invalid"), null, "선택 날짜 없는 독립 입력은 오류 아님");
});

test("기간 선택기: 역전 오류 → 정상 범위 → 다른 인스턴스 독립", "components/date-picker", async (app) => {
  app.edit("#range-start", "2026-11-03");
  app.edit("#range-end", "2026-11-02");
  app.blur("#range-end");
  for (const id of ["#range-start", "#range-end"]) equal(app.get(id).getAttribute("aria-invalid"), "true", "역전 기간 오류");
  app.edit("#range-end", "2026-11-04");
  app.blur("#range-end");
  for (const id of ["#range-start", "#range-end"]) equal(app.get(id).getAttribute("aria-invalid"), null, "수정 후 기간 오류 해제");
  equal(app.get("#date-input").getAttribute("aria-invalid"), null, "다른 선택기로 오류 누수");
  equal(app.get("#form-booking-date").getAttribute("aria-invalid"), null, "예약 선택기로 오류 누수");
});

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

test('데이터 상태: loading→error→retry, empty와 검색 0건 구분', 'patterns/data-states', async (app) => {
  const element = app.get('#data-state-demo'); const state = app.win.IdenfluMono.get(element);
  const failed = state.load({ outcome: 'error', delay: 1 });
  equal(element.getAttribute('aria-busy'), 'true', '로딩 aria-busy'); await failed;
  equal(state.getValue().status, 'error', '조회 오류');
  app.click('[data-data-retry]'); await waitFor(() => state.getValue().status === 'success', '재시도 완료 시간 초과');
  equal(element.getAttribute('aria-busy'), 'false', '조회 완료 aria-busy');
  state.setQuery('없는 프로젝트'); equal(state.getValue().status, 'no-results', '검색 결과 없음');
  app.click('[data-data-clear]'); equal(state.getValue().status, 'success', '검색 초기화');
  await state.load({ outcome: 'empty', delay: 1 }); equal(state.getValue().status, 'empty', '최초 데이터 없음');
  const pending = state.load({ outcome: 'success', delay: 100 }); state.destroy();
  equal(await pending, null, 'destroy 중 조회 취소');
});

test('폼 숫자 검증: 반올림 소수·지수·안전범위 초과 거부', 'patterns/form/project', async (app) => {
  app.edit('#form-project-name', '검증 프로젝트'); app.edit('#form-project-slug', 'test-project');
  for (const value of ['1.0000000000000001', '9007199254740992.5', '1e3', '9007199254740992']) {
    app.edit('#form-project-budget', value); app.click('#form-project button[type=submit]');
    equal(app.get('#form-project-budget').getAttribute('aria-invalid'), 'true', `정수 검증 우회: ${value}`);
  }
  app.edit('#form-project-budget', '9007199254740991'); app.click('#form-project button[type=submit]');
  equal(app.get('#form-project-budget').getAttribute('aria-invalid'), null, '안전한 최댓값 거부');
});

test('문서 검색·컴포넌트 적용 가이드·복사 코드', 'components/buttons', async (app) => {
  const views = [...app.doc.querySelectorAll('[data-route^="components/"]')];
  for (const view of views) {
    assert(view.querySelector('[data-component-guide]'), `${view.dataset.route} 가이드 없음`);
    const code = view.querySelector('.code-example code'); assert(code?.textContent.trim() && !code.textContent.includes('이 패턴의 HTML'), `${view.dataset.route} 코드 예제 없음`);
  }
  let copied = '';
  Object.defineProperty(app.win.navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { copied = text; } } });
  app.click('#view-buttons .code-toolbar button'); await Promise.resolve();
  assert(copied.includes('<button'), '복사 버튼이 실제 HTML을 전달하지 않음');
  if (app.win.matchMedia('(max-width: 900px)').matches) app.click('#open-menu');
  app.edit('#docs-search', '입력');
  assert(!app.get('.docs-navigation a[href="#/components/text-fields"]').hidden, '한글 동의어 검색');
  app.edit('#docs-search', '존재하지않는문서');
  equal(app.get('#docs-search-status').textContent, '검색 결과가 없습니다.', '문서 검색 0건');
  app.key('#docs-search', 'Escape'); equal(app.get('#docs-search').value, '', 'Escape 검색 초기화');
  app.edit('#docs-search', '숫자'); app.key('#docs-search', 'Enter');
  await waitFor(() => !app.get('#view-number-fields').hidden, '검색 결과 Enter 이동 실패');
  if (app.win.matchMedia('(max-width: 900px)').matches) app.click('#open-menu');
  app.key('#docs-search', 'Escape');
  assert(app.get('.docs-navigation a[href="#/components/number-fields"]').closest('details').open, '검색 해제 후 현재 문서 그룹이 접힘');
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
