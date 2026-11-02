(() => {
  "use strict";
  if (window.IdenfluPreferences) return;

  const storageKey = "idenflu-mono-preferences-v1";
  const root = document.documentElement;
  const defaults = Object.freeze({ fontSize: 14, lineHeight: 22, spacing: 100, controlHeight: 38, radius: 0 });
  const ranges = Object.freeze({
    fontSize: Object.freeze({ min: 12, max: 18, step: 1 }),
    lineHeight: Object.freeze({ min: 18, max: 32, step: 1 }),
    spacing: Object.freeze({ min: 75, max: 150, step: 5 }),
    controlHeight: Object.freeze({ min: 32, max: 48, step: 2 }),
    radius: Object.freeze({ min: 0, max: 12, step: 1 }),
  });
  const properties = {
    fontSize: "--font-size-base",
    lineHeight: "--line-height-base",
    spacing: "--space-unit",
    controlHeight: "--control-base-height",
    radius: "--radius-control",
  };
  const keys = Object.keys(defaults);
  const colorTokens = Object.freeze(["--primary", "--text", "--text-secondary", "--surface", "--border", "--primary-control", "--canvas", "--danger", "--success", "--warning", "--info"]);
  const themes = ["light", "dark"];
  const appliedColors = new Set();
  const forcedColors = window.matchMedia?.("(forced-colors: active)");
  const color = (value) => typeof value === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  const expandColor = (value) => (value.length === 4 ? "#" + [...value.slice(1)].map(char => char + char).join("") : value).toLowerCase();
  const numeric = (value) => typeof value === "number" && Number.isFinite(value);
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  let values = { ...defaults };

  function normalize(partial, base = defaults) {
    const next = { ...base };
    const colors = {};
    themes.forEach((theme) => {
      const overrides = { ...base.colors?.[theme] };
      const incoming = object(partial) && own(partial, "colors") && object(partial.colors) && own(partial.colors, theme) ? partial.colors[theme] : null;
      if (object(incoming)) colorTokens.forEach((token) => {
        if (!own(incoming, token)) return;
        if (color(incoming[token])) overrides[token] = expandColor(incoming[token]);
        else if (incoming[token] === null) delete overrides[token];
      });
      if (Object.keys(overrides).length) colors[theme] = overrides;
    });
    if (Object.keys(colors).length) next.colors = colors;
    else delete next.colors;
    if (object(partial)) {
      keys.forEach((key) => {
        if (!own(partial, key) || !numeric(partial[key])) return;
        const { min, max, step } = ranges[key];
        const bounded = Math.max(min, Math.min(max, partial[key]));
        next[key] = min + Math.round((bounded - min) / step) * step;
      });
    }
    next.lineHeight = Math.max(next.lineHeight, next.fontSize + 4);
    next.controlHeight = Math.max(next.controlHeight, Math.ceil((next.fontSize + 18) / 2) * 2);
    return next;
  }

  function cssValues() {
    return keys.map((key) => [properties[key], `${key === "spacing" ? Number((4 * values.spacing / 100).toFixed(2)) : values[key]}px`]);
  }
  function colorValues(theme) {
    const overrides = values.colors?.[theme] || {};
    const result = new Map(Object.entries(overrides));
    const mix = (token, amount, target) => `color-mix(in srgb, var(${token}) ${amount}%, ${target})`;
    const put = (token, value) => result.set(token, value);
    if (overrides["--primary"]) {
      put("--primary-hover", mix("--primary", 85, "var(--text)"));
      put("--primary-pressed", mix("--primary", 70, "var(--text)"));
      put("--focus-on-light", "var(--primary)");
      put("--selection-background", mix("--primary", 20, "var(--canvas)"));
    }
    if (overrides["--primary-control"]) {
      put("--primary-control-hover", mix("--primary-control", 85, "var(--text)"));
      put("--primary-control-pressed", mix("--primary-control", 70, "var(--text)"));
    }
    if (overrides["--text-secondary"]) put("--text-muted", "var(--text-secondary)");
    if (overrides["--canvas"]) put("--surface-raised", "var(--canvas)");
    if (overrides["--surface"]) {
      put("--surface-hover", mix("--surface", 92, "var(--text)"));
      put("--surface-pressed", mix("--surface", 84, "var(--text)"));
    }
    if (overrides["--border"]) {
      put("--border-hover", mix("--border", 75, "var(--text)"));
      put("--border-subtle", "var(--border)");
      put("--divider", "var(--border)");
    }
    ["danger", "success", "warning", "info"].forEach((role) => {
      if (!overrides[`--${role}`]) return;
      put(`--${role}-surface`, mix(`--${role}`, 12, "var(--canvas)"));
      if (role === "danger") {
        put("--danger-text", "var(--danger)");
        put("--danger-control", "var(--danger)");
        put("--danger-control-hover", mix("--danger", 85, "var(--text)"));
        put("--danger-control-pressed", mix("--danger", 70, "var(--text)"));
        put("--focus-on-danger", "var(--danger)");
      }
    });
    return [...result];
  }
  function applyColors() {
    appliedColors.forEach(property => root.style.removeProperty(property));
    appliedColors.clear();
    if (forcedColors?.matches) return;
    colorValues(root.dataset.theme === "dark" ? "dark" : "light").forEach(([property, value]) => {
      root.style.setProperty(property, value);
      appliedColors.add(property);
    });
  }
  function apply() {
    cssValues().forEach(([property, value]) => root.style.setProperty(property, value));
    applyColors();
  }
  function clear() {
    Object.values(properties).forEach((property) => root.style.removeProperty(property));
    applyColors();
  }
  function get() { return normalize({}, values); }
  function valid(partial) {
    if (!object(partial)) return false;
    if (keys.some(key => own(partial, key) && numeric(partial[key]))) return true;
    return own(partial, "colors") && object(partial.colors) && themes.some(theme => own(partial.colors, theme) && object(partial.colors[theme]) && colorTokens.some(token => own(partial.colors[theme], token) && (color(partial.colors[theme][token]) || partial.colors[theme][token] === null)));
  }
  function announce(reason, saved) {
    document.dispatchEvent(new CustomEvent("preferenceschange", { detail: { values: get(), saved, reason } }));
  }
  function parse(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!valid(parsed)) return null;
      return normalize(parsed);
    } catch { return null; }
  }
  function set(partial) {
    if (!valid(partial)) return get();
    values = normalize(partial, values);
    apply();
    let saved = false;
    try { localStorage.setItem(storageKey, JSON.stringify(values)); saved = true; } catch { /* Keep this page usable without persistent storage. */ }
    announce("set", saved);
    return get();
  }
  function reset() {
    values = { ...defaults };
    clear();
    let saved = false;
    try { localStorage.removeItem(storageKey); saved = true; } catch { /* The current page still returns to the defaults. */ }
    announce("reset", saved);
    return get();
  }
  function cssText() {
    const block = (selector, entries) => `${selector} {\n${entries.map(([property, value]) => `  ${property}: ${value};`).join("\n")}\n}`;
    return [block(":root", cssValues()), ...themes.map(theme => {
      const entries = colorValues(theme);
      return entries.length ? block(theme === "light" ? ':root:not([data-theme]),\n:root[data-theme="light"]' : ':root[data-theme="dark"]', entries) : "";
    }).filter(Boolean)].join("\n\n");
  }

  window.IdenfluPreferences = Object.freeze({ get, set, reset, cssText, defaults, ranges });
  let stored = null;
  try { stored = parse(localStorage.getItem(storageKey)); } catch { /* Use defaults when reading storage is blocked. */ }
  if (stored) { values = stored; apply(); }
  announce("load", Boolean(stored));
  new MutationObserver(applyColors).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  forcedColors?.addEventListener("change", applyColors);

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    const storedValues = event.key === storageKey ? parse(event.newValue) : null;
    values = storedValues || { ...defaults };
    if (storedValues) apply(); else clear();
    announce("storage", Boolean(storedValues));
  });
})();
