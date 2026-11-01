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
    let active = 0;
    let typed = '';
    let lastTyped = 0;

    function selectedOptions() { return enabled.filter((option) => option.getAttribute('aria-selected') === 'true'); }
    function labelOf(option) { return option.querySelector('.option-label').textContent.trim(); }
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
      active = (index + enabled.length) % enabled.length;
      options.forEach((option) => option.classList.toggle('is-active', option === enabled[active]));
      listbox.setAttribute('aria-activedescendant', enabled[active].id);
      if (scroll) enabled[active].scrollIntoView({ block: 'nearest' });
    }
    function close(restoreFocus = false) {
      if (popup.hidden) return;
      popup.hidden = true;
      picker.classList.remove('is-open', 'opens-up');
      trigger.setAttribute('aria-expanded', 'false');
      listbox.removeAttribute('aria-activedescendant');
      options.forEach((option) => option.classList.remove('is-active'));
      typed = '';
      if (restoreFocus) trigger.focus({ preventScroll: true });
    }
    function open(useLast = false) {
      document.dispatchEvent(new CustomEvent('select-open', { detail: picker }));
      popup.hidden = false;
      picker.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      const bounds = (control || trigger).getBoundingClientRect();
      const below = window.innerHeight - bounds.bottom - 12;
      picker.classList.toggle('opens-up', below < popup.offsetHeight && bounds.top > below);
      const selectedIndex = enabled.findIndex((option) => option.getAttribute('aria-selected') === 'true');
      setActive(useLast ? enabled.length - 1 : Math.max(0, selectedIndex), false);
      listbox.focus({ preventScroll: true });
      enabled[active].scrollIntoView({ block: 'nearest' });
    }
    function toggle(option) {
      if (option.getAttribute('aria-disabled') === 'true') return;
      const selected = option.getAttribute('aria-selected') !== 'true';
      option.setAttribute('aria-selected', String(selected));
      render();
      feedback.textContent = `${labelOf(option)} ${selected ? '선택됨' : '선택 해제됨'}.`;
      emit();
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
    listbox.addEventListener('keydown', (event) => {
      const { key } = event;
      if (key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
      else if (key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
      else if (key === 'Home') { event.preventDefault(); setActive(0); }
      else if (key === 'End') { event.preventDefault(); setActive(enabled.length - 1); }
      else if (key === 'Enter' || key === ' ') { event.preventDefault(); toggle(enabled[active]); }
      else if (key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
      else if (key === 'Tab') { setTimeout(() => close(), 0); }
      else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
        if (Date.now() - lastTyped > 600) typed = '';
        typed += key.toLocaleLowerCase();
        lastTyped = Date.now();
        const index = enabled.findIndex((option) => labelOf(option).toLocaleLowerCase().startsWith(typed));
        if (index >= 0) setActive(index);
      }
    });
    options.forEach((option) => {
      option.addEventListener('mousedown', (event) => event.preventDefault());
      option.addEventListener('mouseenter', () => {
        const index = enabled.indexOf(option);
        if (index >= 0 && !popup.hidden) setActive(index, false);
      });
      option.addEventListener('click', () => {
        const index = enabled.indexOf(option);
        if (index < 0) return;
        setActive(index, false);
        toggle(option);
        listbox.focus({ preventScroll: true });
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
      if (inline && !popup.hidden) listbox.focus({ preventScroll: true });
      else trigger.focus();
    });
    document.addEventListener('click', (event) => { if (!event.composedPath().includes(picker)) close(); });
    document.addEventListener('select-open', (event) => { if (event.detail !== picker) close(); });
    picker.addEventListener('focusout', () => { setTimeout(() => { if (!picker.contains(document.activeElement)) close(); }, 0); });
    window.addEventListener('hashchange', () => close());
    render();
  });
})();
