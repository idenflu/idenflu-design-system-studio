(() => {
  "use strict";
  if (window.IdenfluPreferences) return;

  const storageKey = "idenflu-mono-preferences-v1";
  const defaultsVersion = 2;
  const root = document.documentElement;
  const defaults = Object.freeze({ fontSize: 14, lineHeight: 22, spacing: 100, controlHeight: 36, radius: 0, fontFamily: "pretendard" });
  const fonts = Object.freeze([
    Object.freeze({ value: "pretendard", label: "Pretendard", family: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }),
    Object.freeze({ value: "wanted-sans", label: "Wanted Sans", family: '"Wanted Sans Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }),
  ]);
  const font = (value) => fonts.find(item => item.value === value);
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
    fontFamily: "--font-family-body",
  };
  const keys = Object.keys(ranges);
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
      if (own(partial, "fontFamily") && font(partial.fontFamily)) next.fontFamily = partial.fontFamily;
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
    return [
      ...keys.map((key) => [properties[key], `${key === "spacing" ? Number((4 * values.spacing / 100).toFixed(2)) : values[key]}px`]),
      [properties.fontFamily, font(values.fontFamily).family],
    ];
  }
  const channels = (hex) => expandColor(hex).slice(1).match(/../g).map(value => parseInt(value, 16));
  function contrastRatio(foreground, background) {
    if (!color(foreground) || !color(background)) return null;
    const luminance = (hex) => channels(hex).map(channel => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const first = luminance(foreground), second = luminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  }
  function blendColor(from, to, amount) {
    const target = channels(to);
    return "#" + channels(from).map((channel, index) => Math.round(channel + (target[index] - channel) * amount).toString(16).padStart(2, "0")).join("");
  }
  function readableColor(preferred, backgrounds) {
    if (backgrounds.every(background => contrastRatio(preferred, background) >= 4.5)) return preferred;
    const target = ["#000000", "#ffffff"].sort((a, b) => Math.min(...backgrounds.map(background => contrastRatio(b, background))) - Math.min(...backgrounds.map(background => contrastRatio(a, background))))[0];
    for (let step = 1; step <= 100; step++) {
      const candidate = blendColor(preferred, target, step / 100);
      if (backgrounds.every(background => contrastRatio(candidate, background) >= 4.5)) return candidate;
    }
    return target;
  }
  function colorValues(theme) {
    const overrides = values.colors?.[theme] || {};
    const defaultCanvas = theme === "dark" ? "#161616" : "#ffffff";
    const result = new Map(Object.entries(overrides));
    const mix = (token, amount, target) => `color-mix(in srgb, var(${token}) ${amount}%, ${target})`;
    const put = (token, value) => result.set(token, value);
    if (overrides["--primary"]) {
      put("--primary-hover", mix("--primary", 85, "var(--text)"));
      put("--primary-pressed", mix("--primary", 70, "var(--text)"));
      put("--focus-on-light", "var(--primary)");
      put("--selection-background", mix("--primary", 20, "var(--canvas)"));
      put("--selected-surface", mix("--primary", 14, "var(--canvas)"));
    }
    const buttonColors = (token, background, foregroundToken, focusToken) => {
      const foreground = contrastRatio("#ffffff", background) >= contrastRatio("#000000", background) ? "#ffffff" : "#000000";
      // Move interaction backgrounds away from their text color to retain contrast in every state.
      const target = foreground === "#ffffff" ? "#000000" : "#ffffff";
      put(`${token}-hover`, blendColor(background, target, 0.12));
      put(`${token}-pressed`, blendColor(background, target, 0.24));
      put(foregroundToken, foreground);
      put(focusToken, foreground);
      return foreground;
    };
    if (overrides["--primary-control"]) {
      const foreground = buttonColors("--primary-control", overrides["--primary-control"], "--text-on-primary", "--focus-on-primary");
      put("--icon-on-primary-filter", foreground === "#ffffff" ? "brightness(0) invert(1)" : "brightness(0)");
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
      if (role === "info") {
        put("--badge-primary-background", mix("--info", 22, "var(--canvas)"));
        put("--badge-primary-text", "var(--info)");
      }
      put(`--toast-on-${role}`, readableColor(theme === "dark" ? "#141414" : "#ffffff", [overrides[`--${role}`]]));
      if (role === "danger") {
        const canvas = overrides["--canvas"] || defaultCanvas;
        const surface = blendColor(canvas, overrides["--danger"], 0.12);
        put("--danger-text", readableColor(overrides["--danger"], [canvas, surface]));
        // A filled danger button has its own background and text contract, independent of status text.
        const background = readableColor(overrides["--danger"], ["#ffffff"]);
        put("--danger-control", background);
        buttonColors("--danger-control", background, "--text-on-danger", "--focus-on-danger-control");
        put("--focus-on-danger", "var(--danger-text)");
      }
    });
    if (Object.keys(overrides).length) {
      const palette = theme === "dark"
        ? { primary: "#7fb3fd", success: "#9acba6", warning: "#e2c27f", danger: "#f2a3a7", text: "#ededed", infoSurface: "#22334b", secondarySurface: "#383838" }
        : { primary: "#1062d3", success: "#2a783c", warning: "#955e02", danger: "#aa2724", text: "#1c1c1c", infoSurface: "#eaf1fc", secondarySurface: "#e4e4e4" };
      const canvas = overrides["--canvas"] || defaultCanvas;
      const text = overrides["--text"] || palette.text;
      // Selected chips use status/link accents, independently of filled button colors.
      ["primary", "success", "warning", "danger"].forEach(role => {
        const background = role === "danger" ? result.get("--danger-text") || palette.danger : overrides[`--${role}`] || palette[role];
        put(`--chip-${role}-selected-text`, readableColor(canvas, [background]));
      });
      const infoSurface = overrides["--info"] ? blendColor(canvas, overrides["--info"], 0.12) : palette.infoSurface;
      put("--chip-neutral-selected-text", readableColor(overrides["--primary"] || palette.primary, [infoSurface]));
      const secondarySurface = overrides["--surface"] ? blendColor(overrides["--surface"], text, 0.16) : palette.secondarySurface;
      put("--chip-secondary-selected-text", readableColor(text, [secondarySurface]));
    }
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
    if (own(partial, "fontFamily") && font(partial.fontFamily)) return true;
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
      // Older snapshots stored the complete default size even when only colors changed.
      const previousDefaults = keys.every(key => !own(parsed, key) || parsed[key] === (key === 'controlHeight' ? 38 : defaults[key]));
      if (parsed.defaultsVersion === undefined && parsed.controlHeight === 38 && previousDefaults) parsed.controlHeight = defaults.controlHeight;
      return normalize(parsed);
    } catch { return null; }
  }
  function set(partial) {
    if (!valid(partial)) return get();
    values = normalize(partial, values);
    apply();
    let saved = false;
    try { localStorage.setItem(storageKey, JSON.stringify({ ...values, defaultsVersion })); saved = true; } catch { /* Keep this page usable without persistent storage. */ }
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

  window.IdenfluPreferences = Object.freeze({ get, set, reset, cssText, defaults, ranges, fonts, contrastRatio });
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
