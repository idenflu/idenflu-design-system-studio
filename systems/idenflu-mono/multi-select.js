(() => {
  "use strict";

  const runtime = window.IdenfluMono;
  if (!runtime) return;
  runtime.register('multiselect', { selector: '[data-multiselect]', init(picker) {
    const doc = picker.ownerDocument;
    const win = doc.defaultView;
    const scope = runtime.cleanup();
    const on = scope.listen;
    const trigger = picker.querySelector('[data-multi-trigger], .select-trigger');
    const inline = picker.dataset.presentation === 'inline';
    const control = inline ? picker.querySelector('.multi-inline-control') : null;
    const popup = picker.querySelector('.select-popup');
    const listbox = picker.querySelector('[role="listbox"]');
    const display = picker.querySelector('[data-select-label]');
    if (!trigger || !popup || !listbox) return null;
    const valueContainer = picker.querySelector('[data-multi-values]') || picker.appendChild(doc.createElement('div'));
    valueContainer.setAttribute('data-multi-values', '');
    const options = [...listbox.querySelectorAll('[role="option"]')];
    const enabled = () => options.filter((option) => option.getAttribute('aria-disabled') !== 'true');
    const initialSelected = new Set(enabled().filter((option) => option.getAttribute('aria-selected') === 'true').map((option) => option.dataset.value));
    const selectedContainer = runtime.resolve(picker, picker.dataset.selected) || picker.querySelector('[data-multi-selected]');
    const clear = runtime.resolve(picker, picker.dataset.clear) || picker.querySelector('[data-multi-clear]');
    const feedback = runtime.resolve(picker, picker.dataset.feedback) || picker.querySelector('[data-multi-feedback]');
    const search = picker.querySelector('.multi-search-input');
    const empty = picker.querySelector('.multi-search-empty');
    options.forEach((option) => { if (!option.id) option.id = runtime.uid('option'); });
    if (!listbox.id) listbox.id = runtime.uid('listbox');
    if (!listbox.hasAttribute('tabindex')) listbox.tabIndex = 0;
    trigger.setAttribute('aria-controls', listbox.id);
    const locked = () => trigger.disabled || picker.getAttribute('aria-disabled') === 'true';
    if (search) {
      search.setAttribute('role', 'combobox');
      search.setAttribute('aria-autocomplete', 'list');
      search.setAttribute('aria-haspopup', 'listbox');
      search.setAttribute('aria-controls', listbox.id);
      search.setAttribute('aria-expanded', String(!popup.hidden));
    }
    function announce(message) { if (feedback) feedback.textContent = message; }
    let active = 0;
    let typed = '';
    let lastTyped = 0;
    let composing = false;

    function selectedOptions() { return enabled().filter((option) => option.getAttribute('aria-selected') === 'true'); }
    function labelOf(option) { return (option.querySelector('.option-label') || option).textContent.trim(); }
    function visibleEnabled() { return enabled().filter((option) => !option.hidden); }
    function render() {
      const selected = selectedOptions();
      if (display) display.textContent = selected.length === 0 ? picker.dataset.placeholder || '팀을 선택해주세요' : selected.length === 1 ? labelOf(selected[0]) : `${labelOf(selected[0])} 외 ${selected.length - 1}개`;
      valueContainer.replaceChildren();
      selectedContainer?.replaceChildren();
      if (inline && selectedContainer && selected.length === 0) {
        const placeholder = doc.createElement('span');
        placeholder.className = 'multi-inline-placeholder';
        placeholder.textContent = picker.dataset.placeholder || '팀을 선택해주세요';
        placeholder.setAttribute('aria-hidden', 'true');
        selectedContainer.append(placeholder);
      }
      selected.forEach((option) => {
        const value = doc.createElement('input');
        value.type = 'hidden';
        value.name = picker.dataset.name || '';
        value.value = option.dataset.value;
        valueContainer.append(value);
        if (!selectedContainer) return;
        const chip = doc.createElement('button');
        chip.type = 'button';
        chip.className = inline ? 'chip chip--removable multi-inline-chip' : 'chip chip--removable';
        chip.dataset.value = option.dataset.value;
        chip.setAttribute('aria-label', `${labelOf(option)} 선택 해제`);
        chip.append(doc.createTextNode(labelOf(option)));
        const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('width', '14'); icon.setAttribute('height', '14');
        icon.setAttribute('aria-hidden', 'true'); icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor'); icon.setAttribute('stroke-width', '1.5');
        const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M6 6l12 12M18 6L6 18'); icon.append(path);
        chip.append(icon);
        selectedContainer.append(chip);
      });
      if (clear) clear.hidden = selected.length === 0;
    }
    function emit() {
      const selected = selectedOptions();
      picker.dispatchEvent(new CustomEvent('multiselectchange', {
        bubbles: true,
        detail: { values: selected.map((option) => option.dataset.value), labels: selected.map(labelOf) },
      }));
    }
    function setActive(index, scroll = true) {
      const visible = visibleEnabled();
      active = visible.length ? (index + visible.length) % visible.length : -1;
      const current = visible[active];
      options.forEach((option) => option.classList.toggle('is-active', option === current));
      if (current) {
        listbox.setAttribute('aria-activedescendant', current.id);
        search?.setAttribute('aria-activedescendant', current.id);
        if (scroll) current.scrollIntoView({ block: 'nearest' });
      } else { listbox.removeAttribute('aria-activedescendant'); search?.removeAttribute('aria-activedescendant'); }
    }
    function positionPopup() {
      const bounds = (control || trigger).getBoundingClientRect();
      const below = win.innerHeight - bounds.bottom - 12;
      picker.classList.toggle('opens-up', below < popup.offsetHeight && bounds.top > below);
    }
    function filter(announce = false) {
      const query = (search?.value || '').trim().toLocaleLowerCase();
      options.forEach((option) => { option.hidden = !labelOf(option).toLocaleLowerCase().includes(query); });
      const matches = options.filter((option) => !option.hidden);
      if (empty) empty.hidden = matches.length > 0;
      setActive(0, false);
      if (announce && feedback) feedback.textContent = matches.length ? `검색 결과 ${matches.length}개. 선택한 항목 ${selectedOptions().length}개.` : '검색 결과가 없습니다.';
      if (!popup.hidden) positionPopup();
    }
    function close(restoreFocus = false) {
      if (popup.hidden) return;
      popup.hidden = true;
      picker.classList.remove('is-open', 'opens-up');
      trigger.setAttribute('aria-expanded', 'false');
      listbox.removeAttribute('aria-activedescendant');
      search?.removeAttribute('aria-activedescendant');
      search?.setAttribute('aria-expanded', 'false');
      options.forEach((option) => option.classList.remove('is-active'));
      typed = '';
      if (search) search.value = '';
      options.forEach((option) => { option.hidden = false; });
      if (empty) empty.hidden = true;
      if (restoreFocus) trigger.focus({ preventScroll: true });
    }
    function open(useLast = false) {
      if (locked()) return;
      doc.dispatchEvent(new CustomEvent('select-open', { detail: picker }));
      popup.hidden = false;
      picker.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      search?.setAttribute('aria-expanded', 'true');
      filter();
      const visible = visibleEnabled();
      const selectedIndex = visible.findIndex((option) => option.getAttribute('aria-selected') === 'true');
      setActive(useLast ? visible.length - 1 : Math.max(0, selectedIndex), false);
      positionPopup();
      (search || listbox).focus({ preventScroll: true });
      visible[active]?.scrollIntoView({ block: 'nearest' });
    }
    function toggle(option) {
      if (!option || locked() || option.getAttribute('aria-disabled') === 'true') return;
      const selected = option.getAttribute('aria-selected') !== 'true';
      option.setAttribute('aria-selected', String(selected));
      render();
      announce(`${labelOf(option)} ${selected ? '선택됨' : '선택 해제됨'}.`);
      emit();
      if (!popup.hidden) positionPopup();
    }

    on(control, 'click', (event) => {
      if (event.target.closest('button')) return;
      if (popup.hidden) open();
      else close(true);
    });
    on(trigger, 'click', () => popup.hidden ? open() : close());
    on(trigger, 'keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (popup.hidden) open(event.key === 'ArrowUp');
      }
    });
    on(search, 'compositionstart', () => { composing = true; });
    on(search, 'compositionend', () => { composing = false; filter(true); });
    on(search, 'input', () => filter(!composing));
    on(search, 'keydown', (event) => {
      if (composing || event.isComposing || event.keyCode === 229 || locked()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!visibleEnabled().length) return;
        setActive(event.key === 'ArrowUp' ? visibleEnabled().length - 1 : 0);
        listbox.focus({ preventScroll: true });
      } else if (event.key === 'Enter') {
        event.preventDefault();
        toggle(visibleEnabled()[active]);
      }
    });
    on(listbox, 'keydown', (event) => {
      if (composing || event.isComposing || event.keyCode === 229 || locked()) return;
      const { key } = event;
      if (key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
      else if (key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
      else if (key === 'Home') { event.preventDefault(); setActive(0); }
      else if (key === 'End') { event.preventDefault(); setActive(visibleEnabled().length - 1); }
      else if (key === 'Enter' || key === ' ') { event.preventDefault(); toggle(visibleEnabled()[active]); }
      else if (key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
      else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
        if (search) {
          event.preventDefault();
          search.value += key;
          search.focus({ preventScroll: true });
          filter(true);
          return;
        }
        if (Date.now() - lastTyped > 600) typed = '';
        typed += key.toLocaleLowerCase();
        lastTyped = Date.now();
        const index = visibleEnabled().findIndex((option) => labelOf(option).toLocaleLowerCase().startsWith(typed));
        if (index >= 0) setActive(index);
      }
    });
    options.forEach((option) => {
      on(option, 'mousedown', (event) => event.preventDefault());
      on(option, 'mouseenter', () => {
        const index = visibleEnabled().indexOf(option);
        if (index >= 0 && !popup.hidden) setActive(index, false);
      });
      on(option, 'click', () => {
        const index = visibleEnabled().indexOf(option);
        if (index < 0) return;
        setActive(index, false);
        toggle(option);
        (search || listbox).focus({ preventScroll: true });
      });
    });
    on(selectedContainer, 'click', (event) => {
      const chip = event.target.closest('button[data-value]');
      if (!chip) return;
      const chips = [...selectedContainer.querySelectorAll('button')];
      const index = chips.indexOf(chip);
      const option = enabled().find((item) => item.dataset.value === chip.dataset.value);
      if (!option) return;
      toggle(option);
      const remaining = selectedContainer.querySelectorAll('button');
      (remaining[Math.min(index, remaining.length - 1)] || trigger).focus();
    });
    on(clear, 'click', () => {
      if (locked()) return;
      enabled().forEach((option) => option.setAttribute('aria-selected', 'false'));
      render();
      announce('모든 선택을 해제했습니다.');
      emit();
      if (inline && !popup.hidden) (search || listbox).focus({ preventScroll: true });
      else trigger.focus();
    });
    on(doc, 'click', (event) => { if (!event.composedPath().includes(picker)) close(); });
    on(doc, 'select-open', (event) => { if (event.detail !== picker) close(); });
    on(picker, 'focusout', () => { setTimeout(() => { if (scope.active && !picker.contains(doc.activeElement)) close(); }, 0); });
    on(win, 'hashchange', () => close());
    function setValue(values, { emit: notify = true } = {}) {
      if (!Array.isArray(values)) throw new TypeError('Multiselect values must be an array.');
      const next = new Set(values.map(String));
      for (const value of next) if (!enabled().some((option) => option.dataset.value === value)) throw new RangeError('Unknown or disabled multiselect value.');
      options.forEach((option) => option.setAttribute('aria-selected', String(next.has(option.dataset.value))));
      render();
      if (notify) emit();
      return selectedOptions().map((option) => option.dataset.value);
    }
    function reset() {
      composing = false;
      setValue([...initialSelected], { emit: false });
      close(); announce('');
    }
    on(picker.closest('form'), 'reset', () => queueMicrotask(() => { if (scope.active) reset(); }));
    render();
    return { getValue: () => selectedOptions().map((option) => option.dataset.value), setValue, reset, open, close, destroy() { close(); scope.destroy(); } };
  } });
  runtime.init();
})();
