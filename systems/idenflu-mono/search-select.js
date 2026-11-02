(() => {
  "use strict";

  const runtime = window.IdenfluMono;
  if (!runtime) return;
  runtime.register("search-select", { selector: "[data-search-select]", init(picker) {
    const doc = picker.ownerDocument;
    const win = doc.defaultView;
    const scope = runtime.cleanup();
    const on = scope.listen;
    const input = picker.querySelector('[role="combobox"]');
    const value = picker.querySelector('input[type="hidden"]');
    const control = picker.querySelector(".search-select-control");
    const popup = picker.querySelector(".select-popup");
    if (!input || !value || !control || !popup) return null;
    const initialValue = value.value;
    const options = [...picker.querySelectorAll('[role="option"]')];
    const empty = picker.querySelector(".search-select-empty");
    const clear = picker.querySelector(".search-select-clear");
    const toggle = picker.querySelector(".search-select-toggle");
    const feedback = runtime.resolve(picker, picker.dataset.feedback);
    options.forEach((option) => { if (!option.id) option.id = runtime.uid("option"); });
    const listbox = picker.querySelector('[role="listbox"]');
    if (listbox) {
      if (!listbox.id) listbox.id = runtime.uid("listbox");
      input.setAttribute("aria-controls", listbox.id);
    }
    const locked = () => input.disabled || input.readOnly || picker.getAttribute("aria-disabled") === "true";
    let active = null;
    let composing = false;

    const labelOf = (option) => (option.querySelector(".option-label") || option).textContent.trim();
    const selectedOption = () => options.find((option) => option.dataset.value === value.value && value.value !== "");
    const visibleOptions = () => options.filter((option) => !option.hidden && option.getAttribute("aria-disabled") !== "true");
    const isOpen = () => !popup.hidden;

    function announce(message) {
      if (feedback) feedback.textContent = message;
    }

    function updateClear() {
      if (!clear) return;
      clear.hidden = !input.value;
      clear.setAttribute("aria-label", selectedOption() ? "선택 지우기" : "입력 지우기");
    }

    function emit(option) {
      picker.dispatchEvent(new CustomEvent("selectchange", {
        bubbles: true,
        detail: { value: option ? option.dataset.value : "", label: option ? labelOf(option) : "" },
      }));
    }

    function setActive(option, scroll = false) {
      active = option || null;
      options.forEach((item) => item.classList.toggle("is-active", item === active));
      if (active) {
        input.setAttribute("aria-activedescendant", active.id);
        if (scroll) active.scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    }

    function filter(query, announceResults = false) {
      const text = query.trim().toLocaleLowerCase();
      options.forEach((option) => { option.hidden = !labelOf(option).toLocaleLowerCase().includes(text); });
      const matches = options.filter((option) => !option.hidden);
      const visible = visibleOptions();
      if (empty) empty.hidden = matches.length !== 0;
      setActive(visible.find((option) => option === selectedOption()) || visible[0], false);
      if (announceResults) announce(matches.length ? `검색 결과 ${matches.length}개` : "검색 결과가 없습니다.");
    }

    function positionPopup() {
      const bounds = control.getBoundingClientRect();
      const below = win.innerHeight - bounds.bottom - 12;
      picker.classList.toggle("opens-up", below < popup.offsetHeight && bounds.top > below);
    }

    function open() {
      if (locked()) return;
      if (!isOpen()) doc.dispatchEvent(new CustomEvent("select-open", { detail: picker }));
      const selected = selectedOption();
      filter(selected && input.value === labelOf(selected) ? "" : input.value);
      popup.hidden = false;
      picker.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
      toggle?.setAttribute("aria-label", "옵션 목록 닫기");
      positionPopup();
    }

    function close() {
      popup.hidden = true;
      picker.classList.remove("is-open", "opens-up");
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      toggle?.setAttribute("aria-label", "옵션 목록 열기");
      setActive(null);
    }

    function normalize() {
      const selected = selectedOption();
      if (selected) input.value = labelOf(selected);
      else if (input.value) {
        input.value = "";
        announce("목록에서 항목을 선택해주세요.");
      }
      updateClear();
    }

    function setValue(nextValue, { emit: notify = true } = {}) {
      const next = String(nextValue ?? "");
      const option = options.find((item) => item.dataset.value === next && item.getAttribute("aria-disabled") !== "true");
      if (!option && next !== "") throw new RangeError("Unknown or disabled search select value.");
      value.value = option ? option.dataset.value : "";
      input.value = option ? labelOf(option) : "";
      options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
      updateClear();
      if (notify) { announce(option ? `${input.value}을 선택했습니다.` : "선택이 초기화되었습니다."); emit(option); }
      return value.value;
    }
    function choose(option) {
      if (!option || option.hidden || locked() || option.getAttribute("aria-disabled") === "true") return;
      setValue(option.dataset.value);
      close();
      input.focus({ preventScroll: true });
    }

    function clearSelection() {
      const hadSelection = Boolean(value.value);
      value.value = "";
      input.value = "";
      options.forEach((item) => item.setAttribute("aria-selected", "false"));
      updateClear();
      announce("선택이 초기화되었습니다.");
      if (hadSelection) emit(null);
    }

    on(input, "focus", () => open());
    on(input, "click", () => { if (!isOpen()) open(); });
    on(input, "compositionstart", () => { composing = true; });
    on(input, "compositionend", () => {
      composing = false;
      filter(input.value, true);
      if (isOpen()) positionPopup();
    });
    on(input, "input", () => {
      if (value.value) {
        value.value = "";
        options.forEach((item) => item.setAttribute("aria-selected", "false"));
        emit(null);
      }
      updateClear();
      if (!isOpen()) open();
      filter(input.value, !composing);
      positionPopup();
    });
    on(input, "keydown", (event) => {
      if (composing || event.isComposing || event.keyCode === 229 || locked()) return;
      const key = event.key;
      if (key === "Escape" && isOpen()) {
        event.preventDefault();
        event.stopPropagation();
        close();
        normalize();
        return;
      }
      if (key === "Tab") {
        close();
        normalize();
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Enter"].includes(key)) return;
      if (key === "Enter" && !isOpen()) return;
      event.preventDefault();
      if (!isOpen()) {
        open();
        if (key === "ArrowUp") setActive(visibleOptions().at(-1), true);
        return;
      }
      const visible = visibleOptions();
      if (!visible.length) return;
      const index = visible.indexOf(active);
      if (key === "Enter") choose(active);
      else if (key === "ArrowDown") setActive(visible[(index + 1) % visible.length], true);
      else if (key === "ArrowUp") setActive(visible[(index - 1 + visible.length) % visible.length], true);
    });

    options.forEach((option) => {
      on(option, "mousedown", (event) => event.preventDefault());
      on(option, "mouseenter", () => {
        if (isOpen() && !option.hidden && option.getAttribute("aria-disabled") !== "true") setActive(option);
      });
      on(option, "click", () => choose(option));
    });
    on(toggle, "mousedown", (event) => event.preventDefault());
    on(toggle, "click", () => {
      if (locked()) return;
      if (isOpen()) { close(); normalize(); }
      else { input.focus({ preventScroll: true }); if (!isOpen()) open(); }
    });
    on(clear, "click", () => {
      if (locked()) return;
      clearSelection();
      input.focus({ preventScroll: true });
      if (!isOpen()) open();
      else { filter(""); positionPopup(); }
    });
    on(picker, "focusout", (event) => {
      if (!picker.contains(event.relatedTarget)) { close(); normalize(); }
    });
    on(doc, "click", (event) => {
      if (!picker.contains(event.target)) { close(); normalize(); }
    });
    on(doc, "select-open", (event) => {
      if (event.detail !== picker) { close(); normalize(); }
    });
    on(win, "hashchange", () => { close(); normalize(); });
    function reset() { composing = false; setValue(initialValue, { emit: false }); close(); if (feedback) feedback.textContent = ""; }
    on(picker.closest("form"), "reset", () => queueMicrotask(() => { if (scope.active) reset(); }));
    setValue(initialValue, { emit: false });
    updateClear();
    return { getValue: () => value.value, setValue, reset, open, close, destroy() { close(); scope.destroy(); } };
  } });
  runtime.init();
})();
