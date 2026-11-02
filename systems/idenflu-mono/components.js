(() => {
  "use strict";
  const runtime = window.IdenfluMono;
  if (!runtime) return;

  runtime.register("select", { selector: "[data-select]", init(picker) {
    const trigger = picker.querySelector(".select-trigger");
    const popup = picker.querySelector(".select-popup");
    const display = picker.querySelector("[data-select-label]");
    const valueInput = picker.querySelector('input[type="hidden"]');
    if (!trigger || !popup || !display || !valueInput) return null;
    const doc = picker.ownerDocument;
    const win = doc.defaultView;
    const scope = runtime.cleanup();
    const on = scope.listen;
    const options = [...picker.querySelectorAll('[role="option"]')];
    const enabled = () => options.filter((option) => option.getAttribute("aria-disabled") !== "true" && !option.hidden);
    const labelOf = (option) => (option.querySelector(".option-label") || option).textContent.trim();
    const initialValue = valueInput.value;
    const initialLabel = display.textContent;
    const placeholder = picker.dataset.placeholder || (initialValue === "" ? initialLabel : "선택해주세요");
    let active = null;
    let typed = "";
    let lastTyped = 0;
    options.forEach((option) => { if (!option.id) option.id = runtime.uid("option"); });
    const listbox = popup.querySelector('[role="listbox"]');
    if (listbox) {
      if (!listbox.id) listbox.id = runtime.uid("listbox");
      trigger.setAttribute("role", "combobox");
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-controls", listbox.id);
    }
    const isOpen = () => !popup.hidden;
    const locked = () => trigger.disabled || picker.getAttribute("aria-disabled") === "true";

    function setActive(index, scroll = true) {
      const available = enabled();
      active = available.length ? available[(index + available.length) % available.length] : null;
      options.forEach((option) => option.classList.toggle("is-active", option === active));
      if (active) {
        trigger.setAttribute("aria-activedescendant", active.id);
        if (scroll) active.scrollIntoView({ block: "nearest" });
      } else trigger.removeAttribute("aria-activedescendant");
    }
    function close() {
      popup.hidden = true;
      picker.classList.remove("is-open", "opens-up");
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("aria-activedescendant");
      options.forEach((option) => option.classList.remove("is-active"));
      active = null;
      typed = "";
    }
    function open() {
      if (locked()) return;
      doc.dispatchEvent(new CustomEvent("select-open", { detail: picker }));
      popup.hidden = false;
      picker.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      const bounds = trigger.getBoundingClientRect();
      const below = win.innerHeight - bounds.bottom - 12;
      picker.classList.toggle("opens-up", below < popup.offsetHeight && bounds.top > below);
      setActive(Math.max(0, enabled().findIndex((option) => option.dataset.value === valueInput.value)));
    }
    function setValue(value, { emit = true } = {}) {
      const next = String(value ?? "");
      const option = options.find((item) => item.dataset.value === next && item.getAttribute("aria-disabled") !== "true");
      if (!option && next !== "") throw new RangeError("Unknown or disabled select value.");
      valueInput.value = next;
      trigger.value = next;
      const label = option ? labelOf(option) : placeholder;
      display.textContent = label;
      options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
      const feedback = runtime.resolve(picker, picker.dataset.feedback);
      if (feedback) feedback.textContent = option ? `${label}을 선택했습니다.` : "선택이 초기화되었습니다.";
      if (emit) picker.dispatchEvent(new CustomEvent("selectchange", { bubbles: true, detail: { value: next, label } }));
      return next;
    }
    function choose(option) {
      if (!option || locked() || option.getAttribute("aria-disabled") === "true") return;
      setValue(option.dataset.value);
      close();
      trigger.focus({ preventScroll: true });
    }
    on(trigger, "click", () => isOpen() ? close() : open());
    on(trigger, "keydown", (event) => {
      if (event.isComposing || locked()) return;
      const { key } = event;
      if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
        event.preventDefault();
        const wasOpen = isOpen();
        if (!wasOpen) open();
        const index = enabled().indexOf(active);
        if (key === "Home") setActive(0);
        else if (key === "End") setActive(enabled().length - 1);
        else if (wasOpen && key === "ArrowDown") setActive(index + 1);
        else if (wasOpen && key === "ArrowUp") setActive(index - 1);
        else if (wasOpen && (key === "Enter" || key === " ")) choose(active);
      } else if (key === "Escape" && isOpen()) {
        event.preventDefault(); event.stopPropagation(); close();
      } else if (key === "Tab") close();
      else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (Date.now() - lastTyped > 600) typed = "";
        typed += key.toLocaleLowerCase(); lastTyped = Date.now();
        if (!isOpen()) open();
        const index = enabled().findIndex((option) => labelOf(option).toLocaleLowerCase().startsWith(typed));
        if (index >= 0) setActive(index);
      }
    });
    options.forEach((option) => {
      on(option, "mousedown", (event) => event.preventDefault());
      on(option, "mouseenter", () => { const index = enabled().indexOf(option); if (index >= 0 && isOpen()) setActive(index, false); });
      on(option, "click", () => choose(option));
    });
    on(doc, "click", (event) => { if (!picker.contains(event.target)) close(); });
    on(doc, "select-open", (event) => { if (event.detail !== picker) close(); });
    on(picker, "focusout", (event) => { if (!picker.contains(event.relatedTarget)) close(); });
    on(win, "hashchange", close);
    function reset() { setValue(initialValue, { emit: false }); close(); }
    on(picker.closest("form"), "reset", () => queueMicrotask(() => { if (scope.active) reset(); }));
    return { getValue: () => valueInput.value, setValue, reset, open, close, destroy() { close(); scope.destroy(); } };
  } });

  runtime.register("segmented", { selector: ".segmented-control, [data-segmented]", init(group) {
    const scope = runtime.cleanup();
    const buttons = [...group.querySelectorAll("button")];
    const enabled = () => buttons.filter((button) => !button.disabled && button.getAttribute("aria-disabled") !== "true");
    const valueOf = (button) => button ? button.dataset.value ?? (button.value || button.textContent.trim()) : null;
    const initial = enabled().find((button) => button.getAttribute("aria-pressed") === "true") || enabled()[0];
    if (!initial) return null;
    function choose(button, { emit = true, focus = false } = {}) {
      if (!button || !enabled().includes(button)) return;
      buttons.forEach((item) => { item.setAttribute("aria-pressed", String(item === button)); item.tabIndex = item === button ? 0 : -1; });
      if (focus) button.focus();
      if (emit) group.dispatchEvent(new CustomEvent("segmentedchange", { bubbles: true, detail: { value: valueOf(button), label: button.textContent.trim() } }));
    }
    buttons.forEach((button) => {
      scope.listen(button, "click", () => choose(button));
      scope.listen(button, "keydown", (event) => {
        const available = enabled(); const index = available.indexOf(button);
        if (index < 0) return;
        const vertical = group.getAttribute("aria-orientation") === "vertical";
        let next;
        if (event.key === (vertical ? "ArrowDown" : "ArrowRight")) next = (index + 1) % available.length;
        else if (event.key === (vertical ? "ArrowUp" : "ArrowLeft")) next = (index - 1 + available.length) % available.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = available.length - 1;
        else return;
        event.preventDefault(); choose(available[next], { focus: true });
      });
    });
    choose(initial, { emit: false });
    const setValue = (value, options) => { const button = enabled().find((item) => valueOf(item) === String(value)); if (!button) throw new RangeError("Unknown or disabled segmented value."); choose(button, options); };
    const reset = () => choose(initial, { emit: false });
    scope.listen(group.closest("form"), "reset", reset);
    return { getValue: () => valueOf(buttons.find((button) => button.getAttribute("aria-pressed") === "true")), setValue, reset, destroy: scope.destroy };
  } });
  runtime.init();
})();
