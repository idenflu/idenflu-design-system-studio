(() => {
  "use strict";
  if (window.IdenfluMono) return;

  const definitions = new Map();
  const records = new Map();
  let serial = 0;
  const includes = (root, element) => root === element || Boolean(root?.contains?.(element));

  function cleanup() {
    const callbacks = [];
    let active = true;
    return {
      get active() { return active; },
      listen(target, type, handler, options) {
        if (!target?.addEventListener || !active) return () => {};
        target.addEventListener(type, handler, options);
        const off = () => target.removeEventListener(type, handler, options);
        callbacks.push(off);
        return off;
      },
      onCleanup(callback) { if (active) callbacks.push(callback); else callback(); },
      destroy() {
        if (!active) return;
        active = false;
        callbacks.splice(0).reverse().forEach((callback) => callback());
      },
    };
  }

  const api = {
    register(type, definition) {
      if (!type || !definition?.selector || typeof definition.init !== "function") throw new TypeError("A component needs a type, selector and init function.");
      if (!definitions.has(type)) definitions.set(type, definition);
      return api;
    },
    init(root = document) {
      const initialized = [];
      definitions.forEach((definition, type) => {
        const elements = [...(root?.querySelectorAll?.(definition.selector) || [])];
        if (root?.matches?.(definition.selector)) elements.unshift(root);
        elements.forEach((element) => {
          const existing = records.get(element);
          if (existing) { initialized.push(existing.controller); return; }
          const controller = definition.init(element);
          if (!controller) return;
          const dispose = controller.destroy?.bind(controller);
          let active = true;
          controller.destroy = () => {
            if (!active) return;
            active = false;
            records.delete(element);
            dispose?.();
          };
          controller.element = element;
          controller.type = type;
          records.set(element, { controller });
          initialized.push(controller);
        });
      });
      return initialized;
    },
    get(element) {
      for (let current = element; current; current = current.parentElement) {
        const record = records.get(current);
        if (record) return record.controller;
      }
      return null;
    },
    destroy(root = document) {
      [...records].reverse().forEach(([element, record]) => {
        if (includes(root, element)) record.controller.destroy();
      });
    },
    cleanup,
    uid(prefix = "control") { serial += 1; return `idenflu-${prefix}-${serial}`; },
    resolve(element, reference) {
      if (!reference) return null;
      return element.ownerDocument.getElementById(reference) || (() => {
        try { return element.querySelector(reference); } catch { return null; }
      })();
    },
  };
  window.IdenfluMono = api;
})();
