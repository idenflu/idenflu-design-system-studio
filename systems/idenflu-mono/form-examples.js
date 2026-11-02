(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  function setError(input, errorId, message, preserveDescription = false) {
    const error = byId(errorId);
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
    if (input.closest('[data-date-picker]')) {
      // Internal contract: a picker that cancels owns the combined form/date error state.
      const validation = new CustomEvent('datevalidation', {
        bubbles: true,
        cancelable: true,
        detail: { message, errorId },
      });
      if (!input.dispatchEvent(validation)) return;
    }
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-errormessage", errorId);
    } else {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-errormessage");
    }
    if (!preserveDescription) {
      const descriptions = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter((id) => id && id !== errorId);
      if (message) descriptions.push(errorId);
      if (descriptions.length) input.setAttribute("aria-describedby", descriptions.join(" "));
      else input.removeAttribute("aria-describedby");
    }
    input.closest(".input-group")?.classList.toggle("is-invalid", Boolean(message));
    input.closest(".date-field")?.classList.toggle("has-error", Boolean(message));
  }

  function clearResult(result) {
    if (!result) return;
    result.textContent = "";
    result.hidden = true;
  }

  function connectForm(form, fields, result, extraValidation = () => null) {
    let submitted = false;
    function validateField(field) {
      const message = field.validate(field.input);
      setError(field.input, field.error || `${field.input.id}-error`, message, field.preserveDescription);
      return message;
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = true;
      clearResult(result);
      let firstInvalid = null;
      fields.forEach((field) => {
        if (validateField(field) && !firstInvalid) firstInvalid = field.input;
      });
      const groupInvalid = extraValidation();
      if (!firstInvalid) firstInvalid = groupInvalid;
      if (firstInvalid) firstInvalid.focus();
      else if (result) {
        result.textContent = "입력 내용을 확인했습니다.";
        result.hidden = false;
      }
    });
    function onEdit(event) {
      clearResult(result);
      const field = fields.find((item) => item.input === event.target || item.eventsFrom?.includes(event.target));
      if (field && (submitted || field.input.hasAttribute("aria-invalid"))) validateField(field);
      if (submitted) extraValidation();
    }
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);
    form.addEventListener("selectchange", () => clearResult(result));
    form.addEventListener("multiselectchange", () => clearResult(result));
    fields.forEach((field) => field.input.addEventListener("blur", () => {
      if (submitted || field.input.hasAttribute("aria-invalid")) validateField(field);
    }));
    form.addEventListener("reset", () => {
      submitted = false;
      fields.forEach((field) => setError(field.input, field.error || `${field.input.id}-error`, "", field.preserveDescription));
      clearResult(result);
    });
  }

  function setPasswordVisibility(button, input, visible) {
    input.type = visible ? "text" : "password";
    button.setAttribute("aria-pressed", String(visible));
    const name = button.dataset.passwordLabel || "비밀번호";
    button.setAttribute("aria-label", `${name} ${visible ? "숨기기" : "표시"}`);
    const icon = button.querySelector(".ui-icon");
    icon?.classList.toggle("icon-eye", !visible);
    icon?.classList.toggle("icon-eye-slash", visible);
  }

  document.querySelectorAll("[data-form-password-toggle]").forEach((button) => {
    const input = byId(button.getAttribute("aria-controls"));
    if (!input) return;
    setPasswordVisibility(button, input, false);
    button.addEventListener("click", () => setPasswordVisibility(button, input, input.type === "password"));
    button.closest("form")?.addEventListener("reset", () => setPasswordVisibility(button, input, false));
  });

  function numberMessage(input, label, minimum, maximum, required) {
    if (input.validity.badInput) return `${label} 숫자로 입력해주세요.`;
    const text = input.value.trim();
    if (!text) return required ? `${label} 입력해주세요.` : "";
    // Plain decimal integer text only. Never round a fractional or unsafe value through Number.
    if (!/^[+-]?\d+$/.test(text)) return `${label} 소수·지수 표기 없이 정수로 입력해주세요.`;
    const value = BigInt(text);
    const safeMaximum = BigInt(Number.MAX_SAFE_INTEGER);
    if (value > safeMaximum || value < -safeMaximum) return "안전한 정수 범위(-9,007,199,254,740,991~9,007,199,254,740,991)로 입력해주세요.";
    if (value < BigInt(minimum) || (Number.isFinite(maximum) && value > BigInt(maximum))) return Number.isFinite(maximum) ? `${minimum}~${maximum} 사이로 입력해주세요.` : `${minimum} 이상 입력해주세요.`;
    if (input.validity.stepMismatch) return `${label} 허용된 증감 단위로 입력해주세요.`;
    return "";
  }

  const project = byId("form-project");
  if (project) {
    const name = byId("form-project-name");
    const slug = byId("form-project-slug");
    const budget = byId("form-project-budget");
    connectForm(project, [
      { input: name, validate: (input) => input.value.trim() ? "" : "프로젝트 이름을 입력해주세요." },
      { input: slug, validate: (input) => !input.value.trim() ? "프로젝트 주소를 입력해주세요." : /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.value.trim()) ? "" : "영문 소문자, 숫자와 하이픈으로 입력해주세요." },
      { input: budget, validate: (input) => numberMessage(input, "예산을", 0, Infinity, false) },
    ], byId("form-project-result"));
    const description = byId("form-project-description");
    const count = byId("form-project-count");
    const progress = byId("form-project-progress");
    const output = byId("form-project-progress-value");
    function refreshDescription() { if (count && description) count.textContent = `${description.value.length} / 300자`; }
    function refreshProgress() {
      if (!progress) return;
      const minimum = Number(progress.min || 0);
      const maximum = Number(progress.max || 100);
      const percent = maximum > minimum ? (Number(progress.value) - minimum) / (maximum - minimum) * 100 : 0;
      const width = parseFloat(getComputedStyle(progress).getPropertyValue("--range-thumb-width")) || 12;
      progress.style.setProperty("--fill", `${percent}%`);
      progress.style.setProperty("--fill-position", `calc(${percent}% + ${width * (0.5 - percent / 100)}px)`);
      progress.setAttribute("aria-valuetext", `${progress.value}%`);
      if (output) output.textContent = `${progress.value}%`;
    }
    description?.addEventListener("input", refreshDescription);
    progress?.addEventListener("input", refreshProgress);
    project.addEventListener("reset", () => setTimeout(() => { refreshDescription(); refreshProgress(); }, 0));
    refreshDescription();
    refreshProgress();
  }

  function validDate(text) {
    const match = text.trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/) || text.trim().match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!match) return false;
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(2000, 0, 1, 12);
    date.setFullYear(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  const booking = byId("form-booking");
  if (booking) {
    const date = byId("form-booking-date");
    const dateValue = byId("form-booking-date-value");
    const initialDateValue = dateValue?.defaultValue || "";
    const attendees = byId("form-booking-attendees");
    const formats = [...booking.querySelectorAll('input[name="form-booking-format"]')];
    let groupSubmitted = false;
    function validateFormat() {
      const message = formats.some((input) => input.checked) ? "" : "진행 방식을 선택해주세요.";
      formats.forEach((input) => setError(input, "form-booking-format-error", message));
      return message ? formats[0] : null;
    }
    connectForm(booking, [
      { input: date, eventsFrom: [byId("form-booking-date-value")], preserveDescription: true, validate: (input) => !input.value.trim() ? "예약 날짜를 입력해주세요." : validDate(input.value) ? "" : "올바른 날짜를 입력해주세요." },
      { input: attendees, validate: (input) => numberMessage(input, "참석 인원을", 1, 20, true) },
    ], byId("form-booking-result"), validateFormat);
    booking.addEventListener("submit", () => { groupSubmitted = true; });
    formats.forEach((input) => input.addEventListener("change", () => { if (groupSubmitted) validateFormat(); }));
    booking.addEventListener("reset", () => {
      groupSubmitted = false;
      formats.forEach((input) => setError(input, "form-booking-format-error", ""));
      setTimeout(() => {
        date.value = date.defaultValue;
        if (dateValue) dateValue.value = initialDateValue;
        date.dispatchEvent(new Event("input", { bubbles: true }));
      }, 0);
    });
  }
})();
