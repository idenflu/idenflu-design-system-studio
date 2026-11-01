(() => {
  "use strict";

  // Store decimal values as scaled integers so repeated steps stay exact.
  function parseNumber(text, decimals, grouping = false) {
    let raw = text.trim();
    if (!raw) return { empty: true };
    if (grouping && raw.includes(",")) {
      if (!/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(raw)) return { error: "천 단위 쉼표 위치를 확인해주세요." };
      raw = raw.replace(/,/g, "");
    }
    const match = raw.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/);
    if (!match) return { error: "숫자로 입력해주세요." };
    const fraction = match[3] ?? match[4] ?? "";
    if (fraction.length > decimals) {
      return { error: decimals === 0 ? "정수만 입력해주세요." : `소수점은 최대 ${decimals}자리까지 입력해주세요.` };
    }
    const scale = 10n ** BigInt(decimals);
    const magnitude = BigInt(match[2] || "0") * scale + BigInt(fraction.padEnd(decimals, "0") || "0");
    return { value: match[1] === "-" ? -magnitude : magnitude, fractionDigits: fraction.length };
  }

  function formatNumber(value, decimals) {
    const negative = value < 0n;
    const absolute = negative ? -value : value;
    const scale = 10n ** BigInt(decimals);
    const integer = absolute / scale;
    const fraction = decimals ? (absolute % scale).toString().padStart(decimals, "0").replace(/0+$/, "") : "";
    return `${negative ? "-" : ""}${integer}${fraction ? `.${fraction}` : ""}`;
  }

  function clamp(value, minimum, maximum) {
    if (minimum !== null && value < minimum) return minimum;
    if (maximum !== null && value > maximum) return maximum;
    return value;
  }

  document.querySelectorAll("[data-number-field]").forEach((field) => {
    const input = field.querySelector(".number-field-input");
    if (!input) return;
    const buttons = [...field.querySelectorAll("[data-number-step]")];
    const feedback = document.getElementById(field.dataset.feedback);
    const unit = field.querySelector(".number-field-unit")?.textContent.trim() || "";
    const grouping = field.dataset.grouping === "true";
    const requestedDecimals = Number(field.dataset.decimals || 0);
    const decimals = Number.isInteger(requestedDecimals) ? Math.max(0, Math.min(6, requestedDecimals)) : 0;
    const scale = 10n ** BigInt(decimals);
    const configuredStep = parseNumber(field.dataset.step || "1", decimals);
    const step = configuredStep.value > 0n ? configuredStep.value : scale;
    const configuredMin = parseNumber(field.dataset.min || "", decimals);
    const configuredMax = parseNumber(field.dataset.max || "", decimals);
    const minimum = configuredMin.value ?? null;
    const maximum = configuredMax.value !== undefined && (minimum === null || configuredMax.value >= minimum) ? configuredMax.value : null;
    let lastCommitted = null;
    let composing = false;
    let focusPointer = null;

    if (minimum !== null) input.setAttribute("aria-valuemin", formatNumber(minimum, decimals));
    if (maximum !== null) input.setAttribute("aria-valuemax", formatNumber(maximum, decimals));

    function displayNumber(value, fractionDigits = 0) {
      const plain = formatNumber(value, decimals);
      if (!grouping) return plain;
      const [integer, fraction = ""] = plain.split(".");
      const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const digits = fraction.padEnd(Math.min(fractionDigits, decimals), "0");
      return `${grouped}${digits ? `.${digits}` : ""}`;
    }

    function currentValue() {
      const result = parseNumber(input.value, decimals, grouping);
      if (result.error || result.empty) return result;
      if (minimum !== null && result.value < minimum) return { error: `${displayNumber(minimum)} 이상 입력해주세요.` };
      if (maximum !== null && result.value > maximum) return { error: `${displayNumber(maximum)} 이하로 입력해주세요.` };
      return result;
    }

    function setError(message) {
      field.classList.toggle("is-invalid", Boolean(message));
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      input.setCustomValidity(message);
      if (!feedback) return;
      feedback.textContent = message;
      feedback.hidden = !message;
      feedback.classList.toggle("is-error", Boolean(message));
      const ids = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter((id) => id && id !== feedback.id);
      if (message) ids.push(feedback.id);
      if (ids.length) input.setAttribute("aria-describedby", ids.join(" "));
      else input.removeAttribute("aria-describedby");
    }

    function sync(result = currentValue()) {
      const locked = input.disabled || input.readOnly;
      field.classList.toggle("is-disabled", input.disabled);
      field.classList.toggle("is-readonly", input.readOnly);
      const valid = result.value !== undefined && !result.error;
      if (valid) {
        const text = formatNumber(result.value, decimals);
        const display = displayNumber(result.value, result.fractionDigits);
        input.setAttribute("aria-valuenow", text);
        input.setAttribute("aria-valuetext", unit ? `${display} ${unit}` : display);
      } else {
        input.removeAttribute("aria-valuenow");
        input.removeAttribute("aria-valuetext");
      }
      let restoreInputFocus = false;
      buttons.forEach((button) => {
        const atLimit = valid && (button.dataset.numberStep === "up"
          ? maximum !== null && result.value >= maximum
          : minimum !== null && result.value <= minimum);
        if ((locked || atLimit) && button === document.activeElement) restoreInputFocus = true;
        button.disabled = locked || atLimit;
      });
      if (restoreInputFocus && !input.disabled) input.focus({ preventScroll: true });
    }

    function notify(result) {
      const value = result.value === undefined ? null : formatNumber(result.value, decimals);
      if (value === lastCommitted) return false;
      lastCommitted = value;
      field.dispatchEvent(new CustomEvent("numberchange", {
        bubbles: true,
        detail: { value, numberValue: value === null ? null : Number(value) },
      }));
      return true;
    }

    function commit(announceChange = true) {
      if (composing || input.disabled || input.readOnly) return false;
      const result = currentValue();
      const message = result.empty && input.required ? "값을 입력해주세요." : result.error || "";
      setError(message);
      if (message) { sync(result); return false; }
      input.value = result.empty ? "" : displayNumber(result.value, result.fractionDigits);
      sync(result);
      return announceChange ? notify(result) : false;
    }

    function onInput(event) {
      if (composing || event.isComposing) return;
      const result = currentValue();
      const hadError = input.getAttribute("aria-invalid") === "true";
      // Editing does not normalize the text or interrupt a sign / decimal point.
      const incomplete = /^[+-]?(?:\d+\.)?$/.test(input.value.trim()) || /^[+-]?\.$/.test(input.value.trim());
      if (hadError) setError(incomplete ? "" : result.error || "");
      else input.setCustomValidity(incomplete ? "" : result.error || "");
      sync(result);
    }

    function changeBy(direction, multiplier = 1) {
      if (input.disabled || input.readOnly || composing) return;
      const result = currentValue();
      if (result.error) {
        setError(result.error);
        sync(result);
        return;
      }
      const base = result.empty ? 0n : result.value;
      const next = clamp(base + BigInt(direction * multiplier) * step, minimum, maximum);
      const previousText = input.value;
      input.value = displayNumber(next, result.fractionDigits);
      setError("");
      sync({ value: next, fractionDigits: result.fractionDigits });
      if (previousText === input.value) return;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function selectOnFocus() {
      return !input.disabled && field.dataset.selectOnFocus === "true";
    }

    input.addEventListener("mousedown", (event) => {
      focusPointer = event.button === 0 && document.activeElement !== input && selectOnFocus()
        ? { x: event.clientX, y: event.clientY, dragged: false }
        : null;
    });
    input.addEventListener("mousemove", (event) => {
      if (focusPointer && Math.hypot(event.clientX - focusPointer.x, event.clientY - focusPointer.y) > 3) focusPointer.dragged = true;
    });
    input.addEventListener("focus", () => {
      if (selectOnFocus()) input.select();
    });
    input.addEventListener("mouseup", (event) => {
      const pointer = focusPointer;
      focusPointer = null;
      // The first mouse click normally collapses the selection made on focus.
      // Later clicks and deliberate drags keep the browser's normal caret behavior.
      if (pointer && !pointer.dragged && document.activeElement === input && selectOnFocus()) {
        event.preventDefault();
        input.select();
      }
    });
    input.addEventListener("compositionstart", () => { composing = true; });
    input.addEventListener("compositionend", () => { composing = false; onInput({}); });
    input.addEventListener("input", onInput);
    input.addEventListener("change", () => commit());
    input.addEventListener("blur", () => { focusPointer = null; commit(); });
    input.addEventListener("keydown", (event) => {
      if (composing || event.isComposing || event.keyCode === 229 || input.disabled || input.readOnly) return;
      const keys = { ArrowUp: [1, 1], ArrowDown: [-1, 1], PageUp: [1, 10], PageDown: [-1, 10] };
      if (keys[event.key]) {
        event.preventDefault();
        changeBy(...keys[event.key]);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (commit()) input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    buttons.forEach((button) => {
      // Keep the editing caret in place when a pointer adjusts the value.
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => changeBy(button.dataset.numberStep === "up" ? 1 : -1));
    });
    input.closest("form")?.addEventListener("reset", () => setTimeout(() => {
      composing = false;
      const result = currentValue();
      if (!result.error && !result.empty) {
        input.value = displayNumber(result.value, result.fractionDigits);
      }
      lastCommitted = result.value === undefined ? null : formatNumber(result.value, decimals);
      setError("");
      sync(result);
    }, 0));
    if (typeof MutationObserver !== "undefined") {
      new MutationObserver(() => sync()).observe(input, { attributes: true, attributeFilter: ["disabled", "readonly"] });
    }

    const initial = currentValue();
    if (!initial.error && !initial.empty) {
      input.value = displayNumber(initial.value, initial.fractionDigits);
      lastCommitted = formatNumber(initial.value, decimals);
    }
    setError(initial.error || "");
    sync(initial);
  });

  document.querySelectorAll("[data-number-focus-option]").forEach((option) => {
    const input = document.getElementById(option.getAttribute("aria-controls"));
    const field = input?.closest("[data-number-field]");
    if (!field) return;
    option.checked = field.dataset.selectOnFocus === "true";
    const update = () => { field.dataset.selectOnFocus = String(option.checked); };
    option.addEventListener("change", update);
    option.closest("form")?.addEventListener("reset", () => setTimeout(update, 0));
  });
})();
