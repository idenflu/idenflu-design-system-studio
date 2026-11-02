(() => {
  "use strict";
  const runtime = window.IdenfluMono;
  if (!runtime) return;
  runtime.register("tabs", { selector: '[role="tablist"]:not([data-tabs-managed])', init(tablist) {
    const tabs = () => [...tablist.querySelectorAll('[role="tab"]')].filter((tab) => tab.closest('[role="tablist"]') === tablist);
    const enabled = () => tabs().filter((tab) => !tab.disabled && tab.getAttribute("aria-disabled") !== "true");
    const initial = enabled().find((tab) => tab.getAttribute("aria-selected") === "true") || enabled()[0];
    if (!initial) return null;
    const scope = runtime.cleanup();
    const doc = tablist.ownerDocument;
    const valueOf = (tab) => tab ? tab.dataset.value ?? tab.id : null;
    tabs().forEach((tab) => { if (!tab.id) tab.id = runtime.uid("tab"); });
    const panelOf = (tab) => doc.getElementById(tab.getAttribute("aria-controls"));
    function choose(tab, { emit = true, focus = false } = {}) {
      if (!enabled().includes(tab)) return;
      const previousValue = valueOf(tabs().find((item) => item.getAttribute("aria-selected") === "true"));
      tabs().forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = panelOf(item);
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
      if (emit) tablist.dispatchEvent(new CustomEvent("tabchange", { bubbles: true, detail: { value: valueOf(tab), previousValue, tab, panel: panelOf(tab) } }));
    }
    scope.listen(tablist, "click", (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (tab?.closest('[role="tablist"]') === tablist) choose(tab);
    });
    scope.listen(tablist, "keydown", (event) => {
      const tab = event.target.closest('[role="tab"]');
      const available = enabled();
      const index = available.indexOf(tab);
      if (index < 0 || event.isComposing) return;
      const vertical = tablist.getAttribute("aria-orientation") === "vertical";
      let next;
      if (event.key === (vertical ? "ArrowDown" : "ArrowRight")) next = (index + 1) % available.length;
      else if (event.key === (vertical ? "ArrowUp" : "ArrowLeft")) next = (index - 1 + available.length) % available.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = available.length - 1;
      else return;
      event.preventDefault(); choose(available[next], { focus: true });
    });
    choose(initial, { emit: false });
    function setValue(value, options) {
      const tab = enabled().find((item) => valueOf(item) === String(value));
      if (!tab) throw new RangeError("Unknown or disabled tab value.");
      choose(tab, options);
    }
    const reset = () => choose(enabled().includes(initial) ? initial : enabled()[0], { emit: false });
    scope.listen(tablist.closest("form"), "reset", reset);
    return { getValue: () => valueOf(tabs().find((tab) => tab.getAttribute("aria-selected") === "true")), setValue, reset, destroy: scope.destroy };
  } });
  runtime.init();
})();
