(() => {
  "use strict";

  document.querySelectorAll('[data-multiselect]').forEach((picker) => {
    const trigger = picker.querySelector('[data-multi-trigger], .select-trigger');
    const inline = picker.dataset.presentation === 'inline';
    const control = inline ? picker.querySelector('.multi-inline-control') : null;
    const popup = picker.querySelector('.select-popup');
    const listbox = picker.querySelector('[role="listbox"]');
    const display = picker.querySelector('[data-select-label]');
    const valueContainer = picker.querySelector('[data-multi-values]');
    const options = [...listbox.querySelectorAll('[role="option"]')];
    const enabled = options.filter((option) => option.getAttribute('aria-disabled') !== 'true');
    const selectedContainer = document.getElementById(picker.dataset.selected);
    const clear = document.getElementById(picker.dataset.clear);
    const feedback = document.getElementById(picker.dataset.feedback);
    const search = picker.querySelector('.multi-search-input');
    const empty = picker.querySelector('.multi-search-empty');
    let active = 0;
    let typed = '';
    let lastTyped = 0;
    let composing = false;

    function selectedOptions() { return enabled.filter((option) => option.getAttribute('aria-selected') === 'true'); }
    function labelOf(option) { return option.querySelector('.option-label').textContent.trim(); }
    function visibleEnabled() { return enabled.filter((option) => !option.hidden); }
    function render() {
      const selected = selectedOptions();
      display.textContent = selected.length === 0 ? '팀을 선택해주세요' : selected.length === 1 ? labelOf(selected[0]) : `${labelOf(selected[0])} 외 ${selected.length - 1}개`;
      valueContainer.replaceChildren();
      selectedContainer.replaceChildren();
      if (inline && selected.length === 0) {
        const placeholder = document.createElement('span');
        placeholder.className = 'multi-inline-placeholder';
        placeholder.textContent = '팀을 선택해주세요';
        placeholder.setAttribute('aria-hidden', 'true');
        selectedContainer.append(placeholder);
      }
      selected.forEach((option) => {
        const value = document.createElement('input');
        value.type = 'hidden';
        value.name = picker.dataset.name;
        value.value = option.dataset.value;
        valueContainer.append(value);
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = inline ? 'chip chip--removable multi-inline-chip' : 'chip chip--removable';
        chip.dataset.value = option.dataset.value;
        chip.setAttribute('aria-label', `${labelOf(option)} 선택 해제`);
        chip.append(document.createTextNode(labelOf(option)));
        const icon = document.createElement('img');
        icon.src = './assets/icons/idenflu/close.svg';
        icon.alt = '';
        chip.append(icon);
        selectedContainer.append(chip);
      });
      clear.hidden = selected.length === 0;
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
        if (scroll) current.scrollIntoView({ block: 'nearest' });
      } else listbox.removeAttribute('aria-activedescendant');
    }
    function positionPopup() {
      const bounds = (control || trigger).getBoundingClientRect();
      const below = window.innerHeight - bounds.bottom - 12;
      picker.classList.toggle('opens-up', below < popup.offsetHeight && bounds.top > below);
    }
    function filter(announce = false) {
      const query = (search?.value || '').trim().toLocaleLowerCase();
      options.forEach((option) => { option.hidden = !labelOf(option).toLocaleLowerCase().includes(query); });
      const matches = options.filter((option) => !option.hidden);
      if (empty) empty.hidden = matches.length > 0;
      setActive(0, false);
      if (announce) feedback.textContent = matches.length ? `검색 결과 ${matches.length}개. 선택한 항목 ${selectedOptions().length}개.` : '검색 결과가 없습니다.';
      if (!popup.hidden) positionPopup();
    }
    function close(restoreFocus = false) {
      if (popup.hidden) return;
      popup.hidden = true;
      picker.classList.remove('is-open', 'opens-up');
      trigger.setAttribute('aria-expanded', 'false');
      listbox.removeAttribute('aria-activedescendant');
      options.forEach((option) => option.classList.remove('is-active'));
      typed = '';
      if (search) search.value = '';
      options.forEach((option) => { option.hidden = false; });
      if (empty) empty.hidden = true;
      if (restoreFocus) trigger.focus({ preventScroll: true });
    }
    function open(useLast = false) {
      document.dispatchEvent(new CustomEvent('select-open', { detail: picker }));
      popup.hidden = false;
      picker.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      filter();
      const visible = visibleEnabled();
      const selectedIndex = visible.findIndex((option) => option.getAttribute('aria-selected') === 'true');
      setActive(useLast ? visible.length - 1 : Math.max(0, selectedIndex), false);
      positionPopup();
      (search || listbox).focus({ preventScroll: true });
      visible[active]?.scrollIntoView({ block: 'nearest' });
    }
    function toggle(option) {
      if (!option || option.getAttribute('aria-disabled') === 'true') return;
      const selected = option.getAttribute('aria-selected') !== 'true';
      option.setAttribute('aria-selected', String(selected));
      render();
      feedback.textContent = `${labelOf(option)} ${selected ? '선택됨' : '선택 해제됨'}.`;
      emit();
      if (!popup.hidden) positionPopup();
    }

    control?.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      if (popup.hidden) open();
      else close(true);
    });
    trigger.addEventListener('click', () => popup.hidden ? open() : close());
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (popup.hidden) open(event.key === 'ArrowUp');
      }
    });
    search?.addEventListener('compositionstart', () => { composing = true; });
    search?.addEventListener('compositionend', () => { composing = false; filter(true); });
    search?.addEventListener('input', () => filter(!composing));
    search?.addEventListener('keydown', (event) => {
      if (composing || event.isComposing || event.keyCode === 229) return;
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
    listbox.addEventListener('keydown', (event) => {
      if (composing || event.isComposing || event.keyCode === 229) return;
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
      option.addEventListener('mousedown', (event) => event.preventDefault());
      option.addEventListener('mouseenter', () => {
        const index = visibleEnabled().indexOf(option);
        if (index >= 0 && !popup.hidden) setActive(index, false);
      });
      option.addEventListener('click', () => {
        const index = visibleEnabled().indexOf(option);
        if (index < 0) return;
        setActive(index, false);
        toggle(option);
        (search || listbox).focus({ preventScroll: true });
      });
    });
    selectedContainer.addEventListener('click', (event) => {
      const chip = event.target.closest('button[data-value]');
      if (!chip) return;
      const chips = [...selectedContainer.querySelectorAll('button')];
      const index = chips.indexOf(chip);
      const option = enabled.find((item) => item.dataset.value === chip.dataset.value);
      if (!option) return;
      toggle(option);
      const remaining = selectedContainer.querySelectorAll('button');
      (remaining[Math.min(index, remaining.length - 1)] || trigger).focus();
    });
    clear.addEventListener('click', () => {
      enabled.forEach((option) => option.setAttribute('aria-selected', 'false'));
      render();
      feedback.textContent = '모든 선택을 해제했습니다.';
      emit();
      if (inline && !popup.hidden) (search || listbox).focus({ preventScroll: true });
      else trigger.focus();
    });
    document.addEventListener('click', (event) => { if (!event.composedPath().includes(picker)) close(); });
    document.addEventListener('select-open', (event) => { if (event.detail !== picker) close(); });
    picker.addEventListener('focusout', () => { setTimeout(() => { if (!picker.contains(document.activeElement)) close(); }, 0); });
    window.addEventListener('hashchange', () => close());
    render();
  });
})();
