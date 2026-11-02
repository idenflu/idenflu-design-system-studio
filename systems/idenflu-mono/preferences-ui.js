(() => {
  "use strict";
  const preferences = window.IdenfluPreferences;
  const dialog = document.getElementById("studio-settings-dialog");
  if (!preferences || !dialog || dialog.dataset.preferencesReady === "true") return;
  dialog.dataset.preferencesReady = "true";

  const fields = {
    fontSize: document.getElementById("studio-font-size"),
    lineHeight: document.getElementById("studio-line-height"),
    spacing: document.getElementById("studio-spacing"),
    controlHeight: document.getElementById("studio-control-height"),
    radius: document.getElementById("studio-radius"),
  };
  const status = document.getElementById("studio-preferences-status");
  const storageNote = document.getElementById("studio-preferences-storage-note");
  const preview = document.getElementById("studio-preferences-preview");
  const previewFeedback = document.getElementById("studio-preview-feedback");
  if (storageNote) storageNote.textContent = "다음 방문에도 유지하도록 이 브라우저에 저장합니다. 저장할 수 없으면 현재 화면에만 적용됩니다.";
  let opener = null;
  const previewTokens = [
    "--font-size-base", "--line-height-base", "--space-unit", "--control-base-height", "--radius-control",
    "--font-size-body", "--font-size-caption", "--font-size-title", "--font-size-heading",
    "--line-height-body", "--line-height-control", "--line-height-caption", "--line-height-title", "--line-height-heading",
    "--control-height", "--control-px", "--control-gap", "--icon-size",
    "--size-sm-height", "--size-md-height", "--size-lg-height",
    "--size-sm-padding", "--size-md-padding", "--size-lg-padding",
    "--size-sm-icon", "--size-md-icon", "--size-lg-icon",
    "--choice-size", "--switch-width", "--switch-height", "--switch-thumb", "--badge-height", "--multi-chip-height",
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((number) => `--space-${number}`),
  ];
  const say = (message) => { if (status) status.textContent = message; };
  const unit = (key, value) => `${value}${key === "spacing" ? "%" : "px"}`;

  function render(values) {
    for (const [key, input] of Object.entries(fields)) {
      if (!input) continue;
      const range = preferences.ranges[key];
      const minimum = key === "lineHeight" ? Math.max(range.min, values.fontSize + 4)
        : key === "controlHeight" ? Math.max(range.min, Math.ceil((values.fontSize + 18) / 2) * 2) : range.min;
      input.min = String(minimum);
      input.max = String(range.max);
      input.step = String(range.step);
      input.value = String(values[key]);
      input.setAttribute("aria-valuetext", unit(key, values[key]));
      const percent = (values[key] - minimum) / (range.max - minimum) * 100;
      input.style.setProperty("--fill", `${percent}%`);
      input.style.setProperty("--fill-position", `calc(${percent}% + ${12 * (0.5 - percent / 100)}px)`);
    }
    document.querySelectorAll("[data-preference-output]").forEach((output) => {
      const key = output.dataset.preferenceOutput;
      if (Object.prototype.hasOwnProperty.call(values, key)) output.textContent = unit(key, values[key]);
    });
    const spacing = Number((8 * values.spacing / 100).toFixed(1));
    const summaries = {
      typography: `${values.fontSize}px / ${values.lineHeight}px`,
      controlHeight: `${values.controlHeight}px`,
      radius: `${values.radius}px`,
      "type-controls": `${values.fontSize}px type · ${values.controlHeight}px controls`,
      "radius-spacing": `${values.radius}px radius · ${spacing}px spacing`,
      footer: `${values.controlHeight}px height / ${values.radius}px radius / ${spacing}px spacing`,
    };
    document.querySelectorAll("[data-preference-summary]").forEach((element) => {
      const text = summaries[element.dataset.preferenceSummary];
      if (text) element.textContent = text;
    });
    if (preview) {
      const styles = getComputedStyle(document.documentElement);
      previewTokens.forEach((token) => {
        const value = styles.getPropertyValue(token).trim();
        if (value) preview.style.setProperty(token, value);
        else preview.style.removeProperty(token);
      });
    }
  }

  for (const [key, input] of Object.entries(fields)) {
    input?.addEventListener("input", () => {
      const value = input.valueAsNumber;
      if (Number.isFinite(value)) preferences.set({ [key]: value });
    });
  }
  document.addEventListener("preferenceschange", (event) => {
    const { values, saved, reason } = event.detail;
    render(values);
    if (reason === "set" || reason === "reset") {
      const action = reason === "reset" ? "기본값으로 초기화했습니다." : "설정을 적용했습니다.";
      say(saved ? action : `${action} 저장할 수 없어 현재 화면에만 적용됩니다.`);
      if (storageNote) storageNote.textContent = saved
        ? reason === "reset" ? "저장한 설정을 지웠습니다. 다음 방문에는 기본값을 사용합니다." : "이 브라우저에 저장했습니다. 다음 방문에도 같은 설정을 사용합니다."
        : "이 브라우저에 저장할 수 없어 현재 화면에만 적용됩니다. 새로고침하면 저장된 설정이나 기본값으로 돌아갑니다.";
    } else if (reason === "storage") {
      say("다른 탭의 설정을 반영했습니다.");
      if (storageNote) storageNote.textContent = saved ? "다른 탭에서 저장한 설정을 함께 사용합니다." : "저장된 설정이 없어 기본값을 사용합니다.";
    }
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-studio-settings-open]");
    if (!button || button.disabled) return;
    opener = button;
    render(preferences.get());
    if (!dialog.open) dialog.showModal();
    const body = dialog.querySelector('.studio-preferences-body');
    if (body) body.scrollTop = 0;
    fields.fontSize?.focus({ preventScroll: true });
  });
  document.getElementById("studio-preferences-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    const available = (element) => element?.isConnected && !element.disabled && element.getClientRects().length && getComputedStyle(element).visibility !== "hidden";
    const target = available(opener) ? opener : [...document.querySelectorAll('[data-studio-settings-open]')].find(available);
    target?.focus({ preventScroll: true });
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.getElementById("studio-preferences-reset")?.addEventListener("click", () => {
    preferences.reset();
    if (previewFeedback) previewFeedback.textContent = "";
  });
  document.getElementById("studio-preferences-copy")?.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(preferences.cssText());
      say("현재 설정의 CSS를 복사했습니다.");
    } catch { say("CSS를 복사하지 못했습니다. 클립보드에 접근할 수 없습니다."); }
  });
  document.getElementById("studio-preview-button")?.addEventListener("click", () => {
    if (previewFeedback) previewFeedback.textContent = "현재 설정의 버튼을 확인했습니다.";
  });
  render(preferences.get());
})();
