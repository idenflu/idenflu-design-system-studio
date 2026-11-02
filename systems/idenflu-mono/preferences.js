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
  const numeric = (value) => typeof value === "number" && Number.isFinite(value);
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  let values = { ...defaults };

  function normalize(partial, base = defaults) {
    const next = { ...base };
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
  function apply() { cssValues().forEach(([property, value]) => root.style.setProperty(property, value)); }
  function clear() { Object.values(properties).forEach((property) => root.style.removeProperty(property)); }
  function get() { return { ...values }; }
  function announce(reason, saved) {
    document.dispatchEvent(new CustomEvent("preferenceschange", { detail: { values: get(), saved, reason } }));
  }
  function parse(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!object(parsed) || !keys.some((key) => own(parsed, key) && numeric(parsed[key]))) return null;
      return normalize(parsed);
    } catch { return null; }
  }
  function set(partial) {
    if (!object(partial) || !keys.some((key) => own(partial, key) && numeric(partial[key]))) return get();
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
  function cssText() { return `:root {\n${cssValues().map(([property, value]) => `  ${property}: ${value};`).join("\n")}\n}`; }

  window.IdenfluPreferences = Object.freeze({ get, set, reset, cssText, defaults, ranges });
  let stored = null;
  try { stored = parse(localStorage.getItem(storageKey)); } catch { /* Use defaults when reading storage is blocked. */ }
  if (stored) { values = stored; apply(); }
  announce("load", Boolean(stored));

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    const storedValues = event.key === storageKey ? parse(event.newValue) : null;
    values = storedValues || { ...defaults };
    if (storedValues) apply(); else clear();
    announce("storage", Boolean(storedValues));
  });
})();
