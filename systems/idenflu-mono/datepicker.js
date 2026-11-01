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

  document.querySelectorAll('[data-date-picker]').forEach((picker) => {
    const range = picker.dataset.datePicker === "range";
    const inputs = [...picker.querySelectorAll('.date-text')];
    const values = [...picker.querySelectorAll('input[type="hidden"]')];
    const help = document.getElementById(inputs[0].getAttribute('aria-describedby'));
    const trigger = picker.querySelector('.date-trigger');
    const popup = picker.querySelector('.date-popup');
    const grid = picker.querySelector('[data-calendar-grid]');
    const monthLabel = picker.querySelector('[data-calendar-month]');
    const instruction = picker.querySelector('[data-calendar-instruction]');
    const summary = picker.querySelector('[data-calendar-summary]');
    let cursor = atNoon(new Date());
    let dates = inputs.map(() => null);

    function sync(showErrors = false, normalize = false) {
      const parsed = inputs.map((input) => parseDate(input.value));
      const invalid = inputs.map((input, i) => Boolean(input.value.trim() && !parsed[i]));
      const reversed = range && parsed[0] && parsed[1] && parsed[0] > parsed[1];
      inputs.forEach((input, i) => {
        const isInvalid = Boolean(showErrors && (invalid[i] || reversed));
        if (isInvalid) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
        if (normalize && parsed[i]) input.value = dateKey(parsed[i]);
      });
      picker.querySelector('.date-field')?.classList.toggle('has-error', showErrors && invalid[0]);
      picker.querySelector('.date-range-fields')?.classList.toggle('has-error', Boolean(showErrors && (invalid.some(Boolean) || reversed))); 
      help.classList.toggle('is-error', showErrors && (invalid.some(Boolean) || Boolean(reversed)));
      if (showErrors && invalid.some(Boolean)) help.textContent = '올바른 날짜를 YYYY-MM-DD 형식으로 입력해주세요.';
      else if (showErrors && reversed) help.textContent = '종료일은 시작일보다 빠를 수 없습니다.';
      else help.textContent = hint;
      dates = parsed;
      values.forEach((value, i) => {
        const next = parsed[i] && !reversed ? dateKey(parsed[i]) : '';
        if (value.value !== next) {
          value.value = next;
          value.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      return !invalid.some(Boolean) && !reversed;
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
      if (focus) grid.querySelector('[tabindex="0"]').focus();
    }
    function close(restoreFocus = false) {
      if (popup.hidden) return;
      popup.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      picker.classList.remove('opens-up', 'align-right');
      if (restoreFocus) trigger.focus();
    }
    function open() {
      sync(true, true);
      document.dispatchEvent(new CustomEvent('select-open', { detail: picker }));
      cursor = atNoon(dates[0] || dates[1] || new Date());
      popup.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      renderCalendar();
      const rect = popup.getBoundingClientRect();
      if (rect.bottom > window.innerHeight && picker.getBoundingClientRect().top > rect.height) picker.classList.add('opens-up');
      if (rect.right > window.innerWidth - 12) picker.classList.add('align-right');
      grid.querySelector('[tabindex="0"]').focus();
    }
    function choose(date) {
      cursor = atNoon(date);
      if (!range) {
        inputs[0].value = dateKey(date);
        sync(true);
        close(true);
        return;
      }
      if (!dates[0] || dates[1]) {
        inputs[0].value = dateKey(date);
        inputs[1].value = '';
        sync(true);
        renderCalendar(true);
      } else {
        const start = dates[0];
        inputs[0].value = dateKey(date < start ? date : start);
        inputs[1].value = dateKey(date < start ? start : date);
        sync(true);
        close(true);
      }
    }
    trigger.addEventListener('click', () => popup.hidden ? open() : close(true));
    inputs.forEach((input) => {
      input.addEventListener('input', () => { sync(false); if (!popup.hidden) renderCalendar(); });
      input.addEventListener('blur', () => sync(true, true));
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); sync(true, true); }
        else if (event.key === 'ArrowDown' && event.altKey) { event.preventDefault(); open(); }
      });
    });
    picker.querySelector('[data-calendar-prev]').addEventListener('click', () => { cursor = changeMonth(cursor, -1); renderCalendar(); });
    picker.querySelector('[data-calendar-next]').addEventListener('click', () => { cursor = changeMonth(cursor, 1); renderCalendar(); });
    grid.addEventListener('pointerover', (event) => {
      const button = event.target.closest('.calendar-day');
      if (button) previewRange(button.dataset.date);
    });
    grid.addEventListener('pointerleave', () => previewRange());
    grid.addEventListener('focusin', (event) => {
      if (event.target.matches('.calendar-day:focus-visible')) previewRange(event.target.dataset.date);
    });
    grid.addEventListener('click', (event) => {
      const button = event.target.closest('.calendar-day');
      if (button) choose(parseDate(button.dataset.date));
    });
    grid.addEventListener('keydown', (event) => {
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
    picker.querySelector('[data-calendar-today]')?.addEventListener('click', () => choose(new Date()));
    picker.querySelector('[data-calendar-clear]').addEventListener('click', () => {
      inputs.forEach((input) => { input.value = ''; });
      sync(true);
      close(true);
    });
    popup.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    });
    picker.addEventListener('keydown', (event) => { if (event.key === 'Tab') setTimeout(() => { if (!picker.contains(document.activeElement)) close(); }, 0); });
    document.addEventListener('click', (event) => { if (!event.composedPath().includes(picker)) close(); });
    document.addEventListener('select-open', (event) => { if (event.detail !== picker) close(); });
    window.addEventListener('hashchange', () => close());
  });
})();
