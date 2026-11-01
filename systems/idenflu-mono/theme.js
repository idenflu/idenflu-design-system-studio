(() => {
  "use strict";

  const key = "idenflu-mono-theme";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = null;
  try {
    const stored = localStorage.getItem(key);
    if (stored === "light" || stored === "dark") preference = stored;
  } catch { /* The system preference still works when storage is unavailable. */ }

  function updateUI(announce = false) {
    const dark = root.dataset.theme === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const label = `${dark ? "라이트" : "다크"} 모드로 전환`;
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(dark));
      button.title = label;
    });
    const styles = getComputedStyle(root);
    const canvas = styles.getPropertyValue("--canvas").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", canvas || (dark ? "#111318" : "#ffffff"));
    document.querySelectorAll("[data-theme-token]").forEach((element) => {
      const value = styles.getPropertyValue(element.dataset.themeToken).trim();
      if (value) element.textContent = value.startsWith("#") ? value.toUpperCase() : value;
    });
    document.querySelectorAll("[data-theme-label]").forEach((element) => { element.textContent = dark ? "Dark" : "Light"; });
    if (announce) {
      const status = document.getElementById("theme-status");
      if (status) status.textContent = `${dark ? "다크" : "라이트"} 모드가 적용되었습니다.`;
    }
  }

  function apply(theme, announce = false) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (document.readyState !== "loading") updateUI(announce);
  }

  apply(preference || (system.matches ? "dark" : "light"));
  system.addEventListener("change", () => {
    if (!preference) apply(system.matches ? "dark" : "light");
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = event.newValue === "dark" || event.newValue === "light" ? event.newValue : null;
    apply(preference || (system.matches ? "dark" : "light"));
  });
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        preference = root.dataset.theme === "dark" ? "light" : "dark";
        try { localStorage.setItem(key, preference); } catch { /* Keep the selection for this page. */ }
        apply(preference, true);
      });
    });
    updateUI();
  });
})();
