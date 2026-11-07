(() => {
  "use strict";
  if (window.IdenfluTheme) return;

  const key = "idenflu-mono-theme";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = null;
  try {
    const stored = localStorage.getItem(key);
    if (stored === "light" || stored === "dark") preference = stored;
  } catch { /* Use the system until the user selects a theme for this page. */ }

  function updateMeta() {
    const canvas = getComputedStyle(root).getPropertyValue("--canvas").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", canvas || (root.dataset.theme === "dark" ? "#141414" : "#ffffff"));
  }

  function apply() {
    const theme = preference || (system.matches ? "dark" : "light");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (document.readyState !== "loading") updateMeta();
    return theme;
  }

  window.IdenfluTheme = Object.freeze({
    get: () => root.dataset.theme,
    set(theme) {
      if (theme !== "light" && theme !== "dark") throw new RangeError("Theme must be light or dark");
      preference = theme;
      try { localStorage.setItem(key, preference); } catch { /* Keep the selection for this page. */ }
      return apply();
    },
  });

  apply();
  system.addEventListener("change", () => { if (!preference) apply(); });
  window.addEventListener("storage", (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = event.newValue === "dark" || event.newValue === "light" ? event.newValue : null;
    apply();
  });
  // Theme or custom canvas changes also update browser chrome without touching React UI.
  new MutationObserver(updateMeta).observe(root, { attributes: true, attributeFilter: ["data-theme", "style"] });
  document.addEventListener("DOMContentLoaded", updateMeta, { once: true });
})();
