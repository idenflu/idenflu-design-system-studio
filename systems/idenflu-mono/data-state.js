(() => {
  "use strict";

  const runtime = window.IdenfluMono;
  if (!runtime) return;
  const samples = [
    { name: "디자인 시스템", team: "프로덕트 디자인", status: "진행 중" },
    { name: "브랜드 가이드", team: "브랜드", status: "검토 중" },
    { name: "웹사이트 개선", team: "프로덕트 디자인", status: "완료" },
  ];
  const states = ["loading", "error", "empty", "no-results", "success"];

  function createDataState(element) {
    const scope = runtime.cleanup();
    const queryInput = element.querySelector("[data-data-query]");
    const statusText = element.querySelector("[data-data-status]");
    const rows = element.querySelector("[data-data-rows]");
    const panels = new Map(states.map((state) => [state, element.querySelector(`[data-data-${state}]`)]));
    const initialItems = element.hasAttribute("data-mock-data") ? samples.map((item) => ({ ...item })) : [];
    let items = initialItems;
    let query = queryInput?.value || "";
    let status = "success";
    let error = "목록을 불러오지 못했습니다. 다시 시도해주세요.";
    let timer = null;
    let pendingResolve = null;
    let retryItems = initialItems;
    if (statusText && !statusText.hasAttribute("tabindex")) statusText.tabIndex = -1;

    function visibleItems() {
      const text = query.trim().toLocaleLowerCase();
      return items.filter((item) => !text || Object.values(item).join(" ").toLocaleLowerCase().includes(text));
    }
    function getValue() {
      return { status, items: items.map((item) => ({ ...item })), query, count: visibleItems().length, error: status === "error" ? error : null };
    }
    function render(emit = true) {
      const visible = visibleItems();
      if (status !== "loading" && status !== "error") status = !items.length ? "empty" : !visible.length ? "no-results" : "success";
      element.dataset.state = status;
      element.setAttribute("aria-busy", String(status === "loading"));
      panels.forEach((panel, name) => { if (panel) panel.hidden = status !== name; });
      if (queryInput && queryInput.value !== query) queryInput.value = query;
      if (statusText) statusText.textContent = {
        loading: "목록을 불러오는 중입니다.",
        error: "목록을 불러오지 못했습니다. 다시 시도할 수 있습니다.",
        empty: "등록된 프로젝트가 없습니다.",
        "no-results": "검색 결과가 없습니다.",
        success: `프로젝트 ${visible.length}개를 표시합니다.`,
      }[status];
      const errorText = element.querySelector("[data-data-error-message]");
      if (errorText) errorText.textContent = error;
      if (rows) rows.replaceChildren(...visible.map((item) => {
        const row = document.createElement("tr");
        [item.name, item.team, item.status].forEach((text) => {
          const cell = document.createElement("td");
          cell.textContent = text ?? "";
          row.append(cell);
        });
        return row;
      }));
      if (emit) element.dispatchEvent(new CustomEvent("datastatechange", { bubbles: true, detail: getValue() }));
      return getValue();
    }
    function cancelLoad() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      if (pendingResolve) pendingResolve(null);
      pendingResolve = null;
    }
    function setValue(value, { emit = true } = {}) {
      if (!value || typeof value !== "object" || (value.status && !states.includes(value.status))) throw new TypeError("유효한 데이터 상태를 지정해주세요.");
      if (value.items !== undefined && (!Array.isArray(value.items) || value.items.some((item) => !item || typeof item !== "object" || Array.isArray(item)))) throw new TypeError("items는 객체 배열이어야 합니다.");
      cancelLoad();
      if (value.items !== undefined) {
        items = value.items.map((item) => ({ ...item }));
        retryItems = items;
      }
      if (value.query !== undefined) query = String(value.query);
      if (value.error !== undefined) error = String(value.error);
      status = value.status || "success";
      return render(emit);
    }
    function setQuery(value, { emit = true } = {}) {
      query = String(value ?? "");
      return render(emit);
    }
    // Deterministic local mock: no request is sent. A retry deliberately succeeds.
    function load({ outcome = "success", items: nextItems, delay = 300 } = {}) {
      if (!["success", "empty", "error"].includes(outcome)) throw new RangeError("success, empty 또는 error를 지정해주세요.");
      if (nextItems !== undefined && (!Array.isArray(nextItems) || nextItems.some((item) => !item || typeof item !== "object" || Array.isArray(item)))) throw new TypeError("items는 객체 배열이어야 합니다.");
      cancelLoad();
      const source = (nextItems || (element.hasAttribute("data-mock-data") ? samples : retryItems)).map((item) => ({ ...item }));
      retryItems = source;
      status = "loading";
      render();
      return new Promise((resolve) => {
        pendingResolve = resolve;
        timer = setTimeout(() => {
          timer = null;
          pendingResolve = null;
          if (!scope.active) { resolve(null); return; }
          if (outcome === "error") status = "error";
          else {
            items = outcome === "empty" ? [] : source;
            status = "success";
          }
          resolve(render());
        }, Math.max(0, Math.min(10000, Number(delay) || 0)));
      });
    }
    scope.listen(queryInput, "input", () => setQuery(queryInput.value));
    scope.listen(element, "click", (event) => {
      const control = event.target.closest("[data-data-load], [data-data-retry], [data-data-clear]");
      if (!control || !element.contains(control)) return;
      if (control.hasAttribute("data-data-clear")) {
        setQuery("");
        queryInput?.focus();
      } else {
        if (control.hasAttribute("data-data-retry")) statusText?.focus({ preventScroll: true });
        load({ outcome: control.dataset.dataLoad || "success", items: control.hasAttribute("data-data-retry") ? retryItems : undefined });
      }
    });
    scope.onCleanup(cancelLoad);
    render(false);
    return { getValue, setValue, setQuery, load, reset: () => setValue({ items: initialItems, query: "" }), destroy: scope.destroy };
  }

  runtime.register("data-state", { selector: "[data-data-state]", init: createDataState });
  runtime.init(document);
})();
