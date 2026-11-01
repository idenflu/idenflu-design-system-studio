(() => {
  "use strict";

  document.querySelectorAll("[data-search-select]").forEach((picker) => {
    const input = picker.querySelector('[role="combobox"]');
    const value = picker.querySelector('input[type="hidden"]');
    const control = picker.querySelector(".search-select-control");
    const popup = picker.querySelector(".select-popup");
    const options = [...picker.querySelectorAll('[role="option"]')];
    const empty = picker.querySelector(".search-select-empty");
    const clear = picker.querySelector(".search-select-clear");
    const toggle = picker.querySelector(".search-select-toggle");
    const feedback = document.getElementById("search-team-feedback");
    let active = null;
    let composing = false;

    const labelOf = (option) => option.querySelector(".option-label").textContent.trim();
    const selectedOption = () => options.find((option) => option.dataset.value === value.value && value.value !== "");
    const visibleOptions = () => options.filter((option) => !option.hidden && option.getAttribute("aria-disabled") !== "true");
    const isOpen = () => !popup.hidden;

    function announce(message) {
      if (feedback) feedback.textContent = message;
    }

    function updateClear() {
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
      empty.hidden = matches.length !== 0;
      setActive(visible.find((option) => option === selectedOption()) || visible[0], false);
      if (announceResults) announce(matches.length ? `검색 결과 ${matches.length}개` : "검색 결과가 없습니다.");
    }

    function positionPopup() {
      const bounds = control.getBoundingClientRect();
      const below = window.innerHeight - bounds.bottom - 12;
      picker.classList.toggle("opens-up", below < popup.offsetHeight && bounds.top > below);
    }

    function open() {
      if (!isOpen()) document.dispatchEvent(new CustomEvent("select-open", { detail: picker }));
      const selected = selectedOption();
      filter(selected && input.value === labelOf(selected) ? "" : input.value);
      popup.hidden = false;
      picker.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "옵션 목록 닫기");
      positionPopup();
    }

    function close() {
      popup.hidden = true;
      picker.classList.remove("is-open", "opens-up");
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      toggle.setAttribute("aria-label", "옵션 목록 열기");
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

    function choose(option) {
      if (!option || option.hidden || option.getAttribute("aria-disabled") === "true") return;
      value.value = option.dataset.value;
      input.value = labelOf(option);
      options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
      updateClear();
      announce(`${input.value}을 선택했습니다.`);
      emit(option);
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

    input.addEventListener("focus", () => open());
    input.addEventListener("click", () => { if (!isOpen()) open(); });
    input.addEventListener("compositionstart", () => { composing = true; });
    input.addEventListener("compositionend", () => {
      composing = false;
      filter(input.value, true);
      if (isOpen()) positionPopup();
    });
    input.addEventListener("input", () => {
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
    input.addEventListener("keydown", (event) => {
      if (composing || event.isComposing || event.keyCode === 229) return;
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
      option.addEventListener("mousedown", (event) => event.preventDefault());
      option.addEventListener("mouseenter", () => {
        if (isOpen() && !option.hidden && option.getAttribute("aria-disabled") !== "true") setActive(option);
      });
      option.addEventListener("click", () => choose(option));
    });
    toggle.addEventListener("mousedown", (event) => event.preventDefault());
    toggle.addEventListener("click", () => {
      if (isOpen()) { close(); normalize(); }
      else { input.focus({ preventScroll: true }); if (!isOpen()) open(); }
    });
    clear.addEventListener("click", () => {
      clearSelection();
      input.focus({ preventScroll: true });
      if (!isOpen()) open();
      else { filter(""); positionPopup(); }
    });
    picker.addEventListener("focusout", (event) => {
      if (!picker.contains(event.relatedTarget)) { close(); normalize(); }
    });
    document.addEventListener("click", (event) => {
      if (!picker.contains(event.target)) { close(); normalize(); }
    });
    document.addEventListener("select-open", (event) => {
      if (event.detail !== picker) { close(); normalize(); }
    });
    window.addEventListener("hashchange", () => { close(); normalize(); });
    updateClear();
  });
})();
