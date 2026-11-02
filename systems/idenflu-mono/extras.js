(() => {
  "use strict";
  const runtime = window.IdenfluMono;
  if (!runtime) return;
  // Native details/summary supplies disclosure keys; this is not an ARIA tree widget.
  runtime.register("disclosure-tree", { selector: "[data-disclosure-tree], .demo-tree", init(tree) {
    const scope = runtime.cleanup();
    const items = () => [...tree.querySelectorAll(".tree-item, [data-tree-item]")].filter((item) => item.closest("[data-disclosure-tree], .demo-tree") === tree);
    const enabled = () => items().filter((item) => !item.disabled && item.getAttribute("aria-disabled") !== "true");
    const initial = items().find((item) => item.classList.contains("is-selected") || item.getAttribute("aria-current") === "true") || null;
    const disclosures = [...tree.querySelectorAll("details")].map((element) => ({ element, open: element.open }));
    const valueOf = (item) => item ? item.dataset.value ?? (item.id || item.textContent.trim()) : null;
    function choose(item, { emit = true } = {}) {
      if (item && !enabled().includes(item)) return;
      items().forEach((node) => {
        node.classList.toggle("is-selected", node === item);
        if (node === item) node.setAttribute("aria-current", "true");
        else node.removeAttribute("aria-current");
      });
      if (emit) tree.dispatchEvent(new CustomEvent("treechange", { bubbles: true, detail: { value: valueOf(item), label: item?.textContent.trim() || "", item } }));
    }
    scope.listen(tree, "click", (event) => {
      const item = event.target.closest(".tree-item, [data-tree-item]");
      if (items().includes(item)) choose(item);
    });
    const reset = () => { disclosures.forEach(({ element, open }) => { element.open = open; }); choose(initial, { emit: false }); };
    function setValue(value, options) {
      const item = value == null ? null : enabled().find((node) => valueOf(node) === String(value));
      if (value != null && !item) throw new RangeError("Unknown or disabled disclosure item.");
      choose(item, options);
    }
    scope.listen(tree.closest("form"), "reset", reset);
    return { getValue: () => valueOf(items().find((item) => item.getAttribute("aria-current") === "true")), setValue, reset, destroy: scope.destroy };
  } });
  runtime.register("tooltip", { selector: ".tooltip-wrap, [data-tooltip]", init(wrap) {
    const scope = runtime.cleanup();
    const doc = wrap.ownerDocument;
    scope.listen(doc, "keydown", (event) => {
      if (event.key !== "Escape" || wrap.classList.contains("tooltip-dismissed")) return;
      if (!wrap.matches(":hover") && !wrap.contains(doc.activeElement)) return;
      const content = wrap.querySelector('.tooltip-content, [role="tooltip"]');
      if (!content || !content.getClientRects().length) return;
      const style = doc.defaultView.getComputedStyle(content);
      if (style.visibility !== "visible" || style.display === "none" || Number(style.opacity) === 0) return;
      wrap.classList.add("tooltip-dismissed");
      event.preventDefault();
      event.stopPropagation();
    }, true);
    scope.listen(wrap, "mouseleave", () => wrap.classList.remove("tooltip-dismissed"));
    scope.listen(wrap, "focusout", (event) => { if (!wrap.contains(event.relatedTarget)) wrap.classList.remove("tooltip-dismissed"); });
    const reset = () => wrap.classList.remove("tooltip-dismissed");
    return { getValue: () => !wrap.classList.contains("tooltip-dismissed"), setValue(value) { wrap.classList.toggle("tooltip-dismissed", !value); }, reset, destroy() { reset(); scope.destroy(); } };
  } });
  runtime.init();
})();
