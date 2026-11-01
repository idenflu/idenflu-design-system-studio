(() => {
  "use strict";

  const tree = document.getElementById("layout-example-tree");
  const tablist = document.getElementById("layout-example-tabs");
  const panels = document.getElementById("layout-example-panels");
  const closeButton = document.getElementById("layout-close-tab");
  const empty = document.getElementById("layout-tabs-empty");
  if (!tree || !tablist || !panels || !closeButton || !empty) return;

  const treeItems = [...tree.querySelectorAll("button[data-layout-page]")];
  const tabs = () => [...tablist.querySelectorAll('[role="tab"]')];

  function activate(tab, moveFocus = false) {
    const page = tab ? tab.dataset.layoutPage : null;
    tabs().forEach((item) => {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute("aria-controls"));
      if (panel) panel.hidden = !active;
    });
    treeItems.forEach((item) => {
      if (item.dataset.layoutPage === page) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    closeButton.disabled = !tab;
    closeButton.hidden = !tab;
    closeButton.setAttribute("aria-label", tab ? `${tab.textContent} 탭 닫기` : "현재 탭 닫기");
    tablist.hidden = !tab;
    empty.hidden = Boolean(tab);
    if (tab && moveFocus) tab.focus();
  }

  function openPage(item) {
    const page = item.dataset.layoutPage;
    let tab = tabs().find((candidate) => candidate.dataset.layoutPage === page);
    if (!tab) {
      const template = document.getElementById(`layout-template-${page}`);
      if (!template) return;
      const title = item.dataset.layoutTitle || item.textContent.trim();
      const tabId = `layout-tab-${page}`;
      const panelId = `layout-panel-${page}`;
      tab = document.createElement("button");
      tab.type = "button";
      tab.className = "layout-demo-tab";
      tab.id = tabId;
      tab.dataset.layoutPage = page;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panelId);
      tab.textContent = title;
      const panel = document.createElement("div");
      panel.id = panelId;
      panel.className = "layout-demo-tab-panel";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);
      panel.tabIndex = 0;
      panel.append(template.content.cloneNode(true));
      tablist.append(tab);
      panels.append(panel);
    }
    activate(tab);
  }

  function closeActive() {
    const currentTabs = tabs();
    const index = currentTabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
    if (index < 0) return;
    const tab = currentTabs[index];
    const page = tab.dataset.layoutPage;
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (panel) panel.remove();
    tab.remove();
    const remaining = tabs();
    if (remaining.length) {
      activate(remaining[Math.min(index, remaining.length - 1)], true);
    } else {
      activate(null);
      const item = treeItems.find((candidate) => candidate.dataset.layoutPage === page) || treeItems[0];
      if (item) {
        let ancestor = item.parentElement;
        while (ancestor && ancestor !== tree) {
          if (ancestor.tagName === "DETAILS") ancestor.open = true;
          ancestor = ancestor.parentElement;
        }
        item.focus();
      }
    }
  }

  treeItems.forEach((item) => item.addEventListener("click", () => openPage(item)));
  tablist.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab && tablist.contains(tab)) activate(tab);
  });
  tablist.addEventListener("keydown", (event) => {
    const current = event.target.closest('[role="tab"]');
    if (!current || !tablist.contains(current)) return;
    if (event.key === "Delete") {
      event.preventDefault();
      activate(current);
      closeActive();
      return;
    }
    const currentTabs = tabs();
    const index = currentTabs.indexOf(current);
    let next;
    switch (event.key) {
      case "ArrowRight": next = (index + 1) % currentTabs.length; break;
      case "ArrowLeft": next = (index - 1 + currentTabs.length) % currentTabs.length; break;
      case "Home": next = 0; break;
      case "End": next = currentTabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    activate(currentTabs[next], true);
  });
  closeButton.addEventListener("click", closeActive);

  const initial = treeItems.find((item) => item.dataset.layoutPage === "overview");
  if (initial) openPage(initial);
  else activate(null);
})();
