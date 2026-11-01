(() => {
  "use strict";

  document.querySelectorAll("[data-select]").forEach((picker) => {
    const trigger = picker.querySelector(".select-trigger");
    const popup = picker.querySelector(".select-popup");
    const display = picker.querySelector("[data-select-label]");
    const valueInput = picker.querySelector('input[type="hidden"]');
    const initialValue = valueInput.value;
    const options = [...picker.querySelectorAll('[role="option"]')];
    const enabled = options.filter((option) => option.getAttribute("aria-disabled") !== "true");
    let active = enabled.findIndex((option) => option.dataset.value === valueInput.value);
    let typed = "";
    let lastTyped = 0;

    function isOpen() { return trigger.getAttribute("aria-expanded") === "true"; }
    function setActive(index, scroll = true) {
      active = (index + enabled.length) % enabled.length;
      options.forEach((option) => option.classList.toggle("is-active", option === enabled[active]));
      trigger.setAttribute("aria-activedescendant", enabled[active].id);
      if (scroll) enabled[active].scrollIntoView({ block: "nearest" });
    }
    function close() {
      popup.hidden = true;
      picker.classList.remove("is-open");
      picker.classList.remove("opens-up");
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("aria-activedescendant");
      options.forEach((option) => option.classList.remove("is-active"));
      typed = "";
    }
    function open() {
      document.dispatchEvent(new CustomEvent("select-open", { detail: picker }));
      popup.hidden = false;
      picker.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      const bounds = trigger.getBoundingClientRect();
      const below = window.innerHeight - bounds.bottom - 12;
      picker.classList.toggle("opens-up", below < popup.offsetHeight && bounds.top > below);
      setActive(Math.max(0, enabled.findIndex((option) => option.dataset.value === valueInput.value)));
    }
    function choose(option) {
      if (option.getAttribute("aria-disabled") === "true") return;
      const label = option.querySelector(".option-label").textContent.trim();
      valueInput.value = option.dataset.value;
      trigger.value = option.dataset.value;
      display.textContent = label;
      options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
      if (picker.dataset.feedback) {
        document.getElementById(picker.dataset.feedback).textContent = `${label}을 선택했습니다.`;
      }
      picker.dispatchEvent(new CustomEvent("selectchange", { bubbles: true, detail: { value: option.dataset.value, label } }));
      close();
      trigger.focus({ preventScroll: true });
    }
    trigger.addEventListener("click", () => { if (isOpen()) close(); else open(); });
    trigger.addEventListener("keydown", (event) => {
      const { key } = event;
      if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
        event.preventDefault();
        const wasOpen = isOpen();
        if (!wasOpen) open();
        if (key === "Home") setActive(0);
        else if (key === "End") setActive(enabled.length - 1);
        else if (wasOpen && key === "ArrowDown") setActive(active + 1);
        else if (wasOpen && key === "ArrowUp") setActive(active - 1);
        else if (wasOpen && (key === "Enter" || key === " ")) choose(enabled[active]);
      } else if (key === "Escape" && isOpen()) {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (key === "Tab") {
        close();
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
        event.preventDefault();
        if (Date.now() - lastTyped > 600) typed = "";
        typed += key.toLocaleLowerCase();
        lastTyped = Date.now();
        if (!isOpen()) open();
        const index = enabled.findIndex((option) => option.querySelector(".option-label").textContent.trim().toLocaleLowerCase().startsWith(typed));
        if (index >= 0) setActive(index);
      }
    });
    options.forEach((option) => {
      option.addEventListener("mousedown", (event) => event.preventDefault());
      option.addEventListener("mouseenter", () => {
        const index = enabled.indexOf(option);
        if (index >= 0 && isOpen()) setActive(index, false);
      });
      option.addEventListener("click", () => choose(option));
    });
    document.addEventListener("click", (event) => { if (!picker.contains(event.target)) close(); });
    document.addEventListener("select-open", (event) => { if (event.detail !== picker) close(); });
    picker.addEventListener("focusout", (event) => { if (!picker.contains(event.relatedTarget)) close(); });
    window.addEventListener("hashchange", close);
    picker.closest('form')?.addEventListener('reset', () => queueMicrotask(() => {
      const option = options.find((item) => item.dataset.value === initialValue);
      if (!option) return;
      valueInput.value = initialValue;
      trigger.value = initialValue;
      display.textContent = option.querySelector('.option-label').textContent.trim();
      options.forEach((item) => item.setAttribute('aria-selected', String(item === option)));
      close();
    }));
  });

  document.querySelectorAll(".segmented-control").forEach((group) => {
    const buttons = [...group.querySelectorAll("button")].filter((button) => !button.disabled);
    function choose(button, focus = false) {
      buttons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
        item.tabIndex = item === button ? 0 : -1;
      });
      if (focus) button.focus();
      document.querySelector("#demo-feedback").textContent = `${button.textContent.trim()} 보기를 선택했습니다.`;
    }
    const selected = buttons.find((button) => button.getAttribute("aria-pressed") === "true") || buttons[0];
    buttons.forEach((button) => { button.tabIndex = button === selected ? 0 : -1; });
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => choose(button));
      button.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault();
        choose(buttons[next], true);
      });
    });
  });

  const search = document.querySelector("#component-search");
  const clearSearch = document.querySelector("#clear-search");
  search.addEventListener("input", () => {
    clearSearch.disabled = !search.value;
    document.querySelector("#search-help").textContent = search.value ? `입력한 검색어: ${search.value}` : "검색 아이콘과 지우기 버튼을 함께 사용합니다.";
  });
  clearSearch.addEventListener("click", () => {
    search.value = "";
    search.dispatchEvent(new Event("input"));
    search.focus();
  });

  const email = document.querySelector("#affix-email");
  function updateEmail(showError = false) {
    const valid = Boolean(email.value.trim()) && email.validity.valid;
    const invalid = showError && Boolean(email.value.trim()) && !valid;
    document.querySelector("#email-valid-icon").hidden = !valid;
    document.querySelector("#email-group").classList.toggle("is-invalid", invalid);
    const message = document.querySelector("#affix-email-help");
    message.classList.toggle("is-error", invalid);
    message.textContent = invalid ? "올바른 이메일 주소를 입력해주세요." : valid ? "올바른 이메일 형식입니다." : "이메일 주소를 입력해주세요.";
    if (invalid) email.setAttribute("aria-invalid", "true");
    else email.removeAttribute("aria-invalid");
  }
  email.addEventListener("input", () => updateEmail());
  email.addEventListener("blur", () => updateEmail(true));

  const password = document.querySelector("#example-password");
  const passwordButton = document.querySelector("#toggle-password");
  passwordButton.addEventListener("click", () => {
    const visible = password.type === "password";
    password.type = visible ? "text" : "password";
    passwordButton.setAttribute("aria-pressed", String(visible));
    passwordButton.setAttribute("aria-label", visible ? "비밀번호 숨기기" : "비밀번호 표시");
    const icon = passwordButton.querySelector(".ui-icon");
    icon.classList.toggle("icon-eye", !visible);
    icon.classList.toggle("icon-eye-slash", visible);
    document.querySelector("#password-status").textContent = visible ? "비밀번호를 표시합니다." : "비밀번호를 숨깁니다.";
  });
})();
