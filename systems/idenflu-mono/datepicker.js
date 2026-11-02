(() => {
  "use strict";

  const format = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const hint = "YYYY-MM-DD 또는 숫자 8자리로 입력해주세요.";
  function makeDate(year, month, day) {
    const result = new Date(2000, 0, 1, 12);
    result.setFullYear(year, month, day);
    return result;
  }
  function atNoon(date) { return makeDate(date.getFullYear(), date.getMonth(), date.getDate()); }
  function dateKey(date) {
    return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function parseDate(value) {
    const text = value.trim();
    if (!text) return null;
    const match = text.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/) || text.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!match) return null;
    const [, y, m, d] = match;
    const year = Number(y), month = Number(m), day = Number(d);
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = makeDate(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }
  function changeMonth(date, amount) {
    const first = makeDate(date.getFullYear(), date.getMonth() + amount, 1);
    if (first.getFullYear() < 1 || first.getFullYear() > 9999) return date;
    const last = makeDate(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    first.setDate(Math.min(date.getDate(), last));
    return first;
  }

  const runtime = window.IdenfluMono;
  if (!runtime) return;

  function createDatePicker(picker) {
    const scope = runtime.cleanup();
    const listen = scope.listen;
    const range = picker.dataset.datePicker === "range";
    const inputs = [...picker.querySelectorAll('.date-text')];
    const values = [...picker.querySelectorAll('input[type="hidden"]')];
    if (!inputs.length || !picker.querySelector('.date-trigger') || !picker.querySelector('.date-popup') || !picker.querySelector('[data-calendar-grid]')) return null;
    const help = (inputs[0].getAttribute('aria-describedby') || '').split(/\s+/)
      .map((id) => document.getElementById(id)).find(Boolean);
    const trigger = picker.querySelector('.date-trigger');
    const popup = picker.querySelector('.date-popup');
    const grid = picker.querySelector('[data-calendar-grid]');
    const monthLabel = picker.querySelector('[data-calendar-month]');
    const instruction = picker.querySelector('[data-calendar-instruction]');
    const summary = picker.querySelector('[data-calendar-summary]');
    const initialValues = inputs.map((input) => input.defaultValue);
    let lastCommitted = null;
    let cursor = atNoon(new Date());
    let dates = inputs.map(() => null);
    let dateErrors = inputs.map(() => false);
    const formErrors = inputs.map(() => null);
    let positionFrame = 0;

    function positionPopup() {
      if (popup.hidden) return;
      const anchor = picker.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const gap = 6;
      const edge = 12;
      if (anchor.bottom <= edge || anchor.top >= viewportHeight - edge || anchor.right <= edge || anchor.left >= viewportWidth - edge) {
        close();
        return;
      }
      const below = Math.max(0, viewportHeight - anchor.bottom - gap - edge);
      const above = Math.max(0, anchor.top - gap - edge);
      const styles = getComputedStyle(popup);
      const naturalHeight = popup.scrollHeight + parseFloat(styles.borderTopWidth || 0) + parseFloat(styles.borderBottomWidth || 0);
      const up = below < naturalHeight && above > below;
      picker.classList.toggle('opens-up', up);
      picker.classList.remove('align-right');
      popup.style.setProperty('--date-popup-available-height', `${up ? above : below}px`);
      const width = popup.getBoundingClientRect().width;
      const left = Math.max(edge, Math.min(anchor.left, viewportWidth - width - edge));
      popup.style.left = `${left - anchor.left}px`;
      popup.style.right = 'auto';
    }

    function schedulePosition() {
      if (popup.hidden || positionFrame) return;
      positionFrame = requestAnimationFrame(() => {
        positionFrame = 0;
        if (scope.active) positionPopup();
      });
    }

    function renderValidation() {
      const invalid = inputs.map((input, i) => dateErrors[i] || Boolean(formErrors[i]?.message));
      inputs.forEach((input, i) => {
        if (invalid[i]) {
          input.setAttribute('aria-invalid', 'true');
          const errorId = formErrors[i]?.message ? formErrors[i].errorId : help?.id;
          if (errorId) input.setAttribute('aria-errormessage', errorId);
          else input.removeAttribute('aria-errormessage');
        } else {
          input.removeAttribute('aria-invalid');
          input.removeAttribute('aria-errormessage');
        }
      });
      picker.querySelector('.date-field')?.classList.toggle('has-error', invalid[0]);
      picker.querySelector('.date-range-fields')?.classList.toggle('has-error', invalid.some(Boolean));
    }

    // Internal form contract: forms own error text; this picker owns combined ARIA and borders.
    // Canceling tells the form to skip its generic control-state updates.
    listen(picker, 'datevalidation', (event) => {
      const index = inputs.indexOf(event.target);
      if (index < 0) return;
      event.preventDefault();
      formErrors[index] = event.detail.message ? event.detail : null;
      renderValidation();
    });

    function sync(showErrors = false, normalize = false, emit = true) {
      const parsed = inputs.map((input) => parseDate(input.value));
      const invalid = inputs.map((input, i) => Boolean(input.value.trim() && !parsed[i]));
      const reversed = range && parsed[0] && parsed[1] && parsed[0] > parsed[1];
      dateErrors = inputs.map((input, i) => Boolean(showErrors && (invalid[i] || reversed)));
      inputs.forEach((input, i) => {
        if (normalize && parsed[i]) input.value = dateKey(parsed[i]);
      });
      renderValidation();
      if (help) {
        help.classList.toggle('is-error', showErrors && (invalid.some(Boolean) || Boolean(reversed)));
        if (showErrors && invalid.some(Boolean)) help.textContent = '올바른 날짜를 YYYY-MM-DD 형식으로 입력해주세요.';
        else if (showErrors && reversed) help.textContent = '종료일은 시작일보다 빠를 수 없습니다.';
        else help.textContent = hint;
      }
      dates = parsed;
      values.forEach((value, i) => {
        const next = parsed[i] && !reversed ? dateKey(parsed[i]) : '';
        if (value.value !== next) {
          value.value = next;
          if (emit) value.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      return !invalid.some(Boolean) && !reversed;
    }
    function commit(emit = true, normalize = false) {
      sync(true, normalize, emit);
      const value = getValue();
      const key = JSON.stringify(value);
      if (emit && key !== lastCommitted) {
        picker.dispatchEvent(new CustomEvent('datechange', { bubbles: true, detail: { value } }));
      }
      lastCommitted = key;
      // A calendar edit must also reach the form when its hidden value remains empty.
      if (emit) inputs.forEach((input) => input.dispatchEvent(new Event('change', { bubbles: true })));
    }
    function updateCalendarText() {
      if (!range) return;
      instruction.textContent = dates[0] && !dates[1] ? '종료일을 선택하세요.' : '시작일을 선택하세요.';
      summary.textContent = dates[0] && dates[1] && dates[0] <= dates[1] ? `${dateKey(dates[0])} – ${dateKey(dates[1])}` : dates[0] ? `${dateKey(dates[0])}부터` : '기간을 선택해주세요.';
    }
    function previewRange(endKey = null) {
      if (!range) return;
      grid.querySelectorAll('.calendar-day').forEach((button) => {
        button.classList.remove('is-preview-range', 'is-preview-end');
      });
      if (!dates[0] || dates[1] || !endKey) { updateCalendarText(); return; }
      const startKey = dateKey(dates[0]);
      if (startKey === endKey) { updateCalendarText(); return; }
      const first = startKey < endKey ? startKey : endKey;
      const last = startKey < endKey ? endKey : startKey;
      grid.querySelectorAll('.calendar-day').forEach((button) => {
        const key = button.dataset.date;
        if (key === endKey) button.classList.add('is-preview-end');
        else if (key > first && key < last) button.classList.add('is-preview-range');
      });
      summary.textContent = `${first} – ${last} (미리보기)`;
    }
    function renderCalendar(focus = false) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const offset = makeDate(year, month, 1).getDay();
      const days = makeDate(year, month + 1, 0).getDate();
      const today = dateKey(new Date());
      monthLabel.textContent = `${year}년 ${month + 1}월`;
      grid.replaceChildren();
      updateCalendarText();
      const count = Math.ceil((offset + days) / 7) * 7;
      for (let i = 0; i < count; i += 7) {
        const row = document.createElement('div');
        row.className = 'calendar-row';
        row.setAttribute('role', 'row');
        for (let j = 0; j < 7; j += 1) {
          const day = i + j - offset + 1;
          const cell = document.createElement('div');
          cell.setAttribute('role', 'gridcell');
          if (day < 1 || day > days) {
            cell.setAttribute('aria-hidden', 'true');
          } else {
            const date = makeDate(year, month, day);
            const key = dateKey(date);
            const isStart = Boolean(dates[0] && dateKey(dates[0]) === key);
            const isEnd = Boolean(range && dates[1] && dateKey(dates[1]) === key);
            const inRange = Boolean(range && dates[0] && dates[1] && dates[0] <= date && date <= dates[1]);
            const button = document.createElement('button');
            cell.setAttribute('aria-selected', String(isStart || isEnd || inRange));
            button.type = 'button';
            button.className = 'calendar-day';
            button.dataset.date = key;
            button.textContent = String(day);
            button.setAttribute('aria-label', `${format.format(date)}${range && isStart ? ', 시작일' : ''}${range && isEnd ? ', 종료일' : ''}`);
            button.setAttribute('aria-pressed', String(isStart || isEnd));
            button.tabIndex = dateKey(cursor) === key ? 0 : -1;
            if (inRange && !isStart && !isEnd) button.classList.add('is-in-range');
            if (key === today) { button.classList.add('is-today'); button.setAttribute('aria-current', 'date'); }
            cell.append(button);
          }
          row.append(cell);
        }
        grid.append(row);
      }
      positionPopup();
      if (focus) grid.querySelector('[tabindex="0"]').focus();
    }
    function close(restoreFocus = false) {
      if (popup.hidden) return;
      popup.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      picker.classList.remove('opens-up', 'align-right');
      if (positionFrame) cancelAnimationFrame(positionFrame);
      positionFrame = 0;
      popup.style.removeProperty('--date-popup-available-height');
      popup.style.removeProperty('left');
      popup.style.removeProperty('right');
      if (restoreFocus) trigger.focus();
    }
    function open() {
      sync(true, true);
      document.dispatchEvent(new CustomEvent('select-open', { detail: picker }));
      cursor = atNoon(dates[0] || dates[1] || new Date());
      popup.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      renderCalendar();
      grid.querySelector('[tabindex="0"]').focus();
    }
    function choose(date) {
      cursor = atNoon(date);
      if (!range) {
        inputs[0].value = dateKey(date);
        commit();
        close(true);
        return;
      }
      if (!dates[0] || dates[1]) {
        inputs[0].value = dateKey(date);
        inputs[1].value = '';
        commit();
        renderCalendar(true);
      } else {
        const start = dates[0];
        inputs[0].value = dateKey(date < start ? date : start);
        inputs[1].value = dateKey(date < start ? start : date);
        commit();
        close(true);
      }
    }
    listen(trigger, 'click', () => popup.hidden ? open() : close(true));
    inputs.forEach((input) => {
      listen(input, 'input', () => { sync(false); if (!popup.hidden) renderCalendar(); });
      listen(input, 'blur', () => commit(true, true));
      listen(input, 'keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); commit(true, true); }
        else if (event.key === 'ArrowDown' && event.altKey) { event.preventDefault(); open(); }
      });
    });
    listen(picker.querySelector('[data-calendar-prev]'), 'click', () => { cursor = changeMonth(cursor, -1); renderCalendar(); });
    listen(picker.querySelector('[data-calendar-next]'), 'click', () => { cursor = changeMonth(cursor, 1); renderCalendar(); });
    listen(grid, 'pointerover', (event) => {
      const button = event.target.closest('.calendar-day');
      if (button) previewRange(button.dataset.date);
    });
    listen(grid, 'pointerleave', () => previewRange());
    listen(grid, 'focusin', (event) => {
      if (event.target.matches('.calendar-day:focus-visible')) previewRange(event.target.dataset.date);
    });
    listen(grid, 'click', (event) => {
      const button = event.target.closest('.calendar-day');
      if (button) choose(parseDate(button.dataset.date));
    });
    listen(grid, 'keydown', (event) => {
      if (!event.target.matches('.calendar-day')) return;
      let date = atNoon(cursor);
      if (event.key === 'ArrowLeft') date.setDate(date.getDate() - 1);
      else if (event.key === 'ArrowRight') date.setDate(date.getDate() + 1);
      else if (event.key === 'ArrowUp') date.setDate(date.getDate() - 7);
      else if (event.key === 'ArrowDown') date.setDate(date.getDate() + 7);
      else if (event.key === 'Home') date.setDate(date.getDate() - date.getDay());
      else if (event.key === 'End') date.setDate(date.getDate() + 6 - date.getDay());
      else if (event.key === 'PageUp') date = changeMonth(date, -1);
      else if (event.key === 'PageDown') date = changeMonth(date, 1);
      else return;
      event.preventDefault();
      if (date.getFullYear() < 1 || date.getFullYear() > 9999) return;
      cursor = date;
      renderCalendar(true);
      previewRange(dateKey(cursor));
    });
    listen(picker.querySelector('[data-calendar-today]'), 'click', () => choose(new Date()));
    listen(picker.querySelector('[data-calendar-clear]'), 'click', () => {
      inputs.forEach((input) => { input.value = ''; });
      commit();
      close(true);
    });
    listen(popup, 'keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    });
    listen(picker, 'keydown', (event) => { if (event.key === 'Tab') setTimeout(() => { if (scope.active && !picker.contains(document.activeElement)) close(); }, 0); });
    listen(document, 'click', (event) => { if (!event.composedPath().includes(picker)) close(); });
    listen(document, 'select-open', (event) => { if (event.detail !== picker) close(); });
    listen(window, 'hashchange', () => close());
    listen(window, 'resize', schedulePosition);
    listen(window, 'scroll', schedulePosition, { capture: true, passive: true });
    listen(document, 'preferenceschange', schedulePosition);
    listen(picker.closest('form'), 'reset', () => setTimeout(() => {
      if (!scope.active) return;
      close();
      formErrors.fill(null);
      sync(false, true, false);
      lastCommitted = JSON.stringify(getValue());
    }, 0));

    function getValue() {
      const parsed = inputs.map((input) => parseDate(input.value));
      if (range && parsed[0] && parsed[1] && parsed[0] > parsed[1]) return [null, null];
      const result = parsed.map((date) => date ? dateKey(date) : null);
      return range ? result : result[0];
    }
    function setValue(value, { emit = true } = {}) {
      const next = range ? value : [value];
      if (!Array.isArray(next) || next.length !== inputs.length) throw new RangeError('날짜 값의 개수가 올바르지 않습니다.');
      const parsed = next.map((item) => {
        if (item === null || item === undefined || item === '') return null;
        const date = item instanceof Date && !Number.isNaN(item.getTime()) ? atNoon(item) : typeof item === 'string' ? parseDate(item) : null;
        if (!date || date.getFullYear() < 1 || date.getFullYear() > 9999) throw new RangeError('유효한 날짜를 지정해주세요.');
        return date;
      });
      if (range && parsed[0] && parsed[1] && parsed[0] > parsed[1]) throw new RangeError('종료일은 시작일보다 빠를 수 없습니다.');
      inputs.forEach((input, i) => { input.value = parsed[i] ? dateKey(parsed[i]) : ''; });
      commit(emit);
      if (!popup.hidden) renderCalendar();
      return getValue();
    }
    function reset() {
      inputs.forEach((input, i) => { input.value = initialValues[i]; });
      close();
      sync(false, true, false);
      lastCommitted = JSON.stringify(getValue());
      inputs.forEach((input) => input.dispatchEvent(new Event('change', { bubbles: true })));
      return getValue();
    }
    sync(false, true, false);
    lastCommitted = JSON.stringify(getValue());
    scope.onCleanup(() => close());
    return { getValue, setValue, reset, open, close, destroy: scope.destroy };
  }

  runtime.register('date-picker', { selector: '[data-date-picker]', init: createDatePicker });
  runtime.init(document);
})();
