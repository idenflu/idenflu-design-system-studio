(() => {
  "use strict";

  const views = [...document.querySelectorAll(".route-view")];
  const links = [...document.querySelectorAll(".docs-navigation a")];
  const sidebar = document.querySelector("#sidebar");
  const surface = document.querySelector("#docs-main");
  const menuButton = document.querySelector("#open-menu");
  const backdrop = document.querySelector("#sidebar-backdrop");
  const mobile = window.matchMedia("(max-width: 900px)");
  const heading = document.querySelector("#doc-heading");
  const title = document.querySelector("#doc-title");
  const aliases = {
    overview: "overview",
    foundations: "foundations/colors",
    states: "foundations/states",
    components: "components/buttons",
    "components/empty-state": "patterns/empty-state",
  };
  let menuOpen = false;

  function closeMenu(restoreFocus = true) {
    const wasOpen = menuOpen;
    menuOpen = false;
    document.body.classList.remove("sidebar-open");
    backdrop.hidden = true;
    surface.inert = false;
    sidebar.inert = mobile.matches;
    sidebar.removeAttribute("role");
    sidebar.removeAttribute("aria-modal");
    if (mobile.matches) sidebar.setAttribute("aria-hidden", "true");
    else sidebar.removeAttribute("aria-hidden");
    menuButton.setAttribute("aria-expanded", "false");
    if (wasOpen && restoreFocus) menuButton.focus();
  }

  function openMenu() {
    if (!mobile.matches) return;
    menuOpen = true;
    document.body.classList.add("sidebar-open");
    sidebar.inert = false;
    sidebar.removeAttribute("aria-hidden");
    sidebar.setAttribute("role", "dialog");
    sidebar.setAttribute("aria-modal", "true");
    surface.inert = true;
    backdrop.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    (sidebar.querySelector('[aria-current="page"]') || sidebar.querySelector("a")).focus();
  }

  menuButton.addEventListener("click", openMenu);
  document.querySelector("#close-menu").addEventListener("click", () => closeMenu());
  backdrop.addEventListener("click", () => closeMenu());
  mobile.addEventListener("change", () => closeMenu(false));
  document.addEventListener("keydown", (event) => {
    if (!menuOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    } else if (event.key === "Tab") {
      const focusable = [...sidebar.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), summary')]
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  function resolveView() {
    const raw = location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");
    const route = aliases[raw] || raw || "overview";
    return views.find((view) => view.dataset.route === route) || views[0];
  }

  function updatePageLink(element, view) {
    element.hidden = !view;
    if (!view) return;
    element.href = `#/${view.dataset.route}`;
    element.querySelector("strong").textContent = view.dataset.title;
  }

  function renderRoute(moveFocus = true) {
    const active = resolveView();
    const { route, title: name, group, description } = active.dataset;
    const canonical = `#/${route}`;
    if (location.hash !== canonical) history.replaceState(history.state, "", canonical);

    const activeDialog = document.querySelector("#example-dialog");
    if (activeDialog.open) activeDialog.close();
    document.querySelector("#toast").hidden = true;
    views.forEach((view) => { view.hidden = view !== active; });
    links.forEach((link) => {
      if (link.hash === canonical) {
        link.setAttribute("aria-current", "page");
        let group = link.closest("details");
        while (group) { group.open = true; group = group.parentElement.closest("details"); }
      }
      else link.removeAttribute("aria-current");
    });
    const currentLink = links.find((link) => link.getAttribute("aria-current") === "page");
    if (currentLink) {
      const nav = document.querySelector(".docs-navigation");
      const linkBounds = currentLink.getBoundingClientRect();
      const navBounds = nav.getBoundingClientRect();
      if (linkBounds.bottom > navBounds.bottom) nav.scrollTop += linkBounds.bottom - navBounds.bottom;
      else if (linkBounds.top < navBounds.top) nav.scrollTop -= navBounds.top - linkBounds.top;
    }
    document.title = `${name} — idenflu mono`;
    document.querySelector("#breadcrumb-group").textContent = group;
    document.querySelector("#breadcrumb-title").textContent = name;
    document.querySelector("#doc-kicker").textContent = group;
    title.textContent = name;
    document.querySelector("#doc-description").textContent = description;
    heading.hidden = route === "overview";
    const index = views.indexOf(active);
    updatePageLink(document.querySelector("#previous-doc"), views[index - 1]);
    updatePageLink(document.querySelector("#next-doc"), views[index + 1]);
    closeMenu(false);
    window.scrollTo(0, 0);
    if (moveFocus) (route === "overview" ? document.querySelector("#page-title") : title).focus({ preventScroll: true });
  }

  links.forEach((link) => {
    link.addEventListener("click", () => {
      if (link.hash === location.hash) renderRoute();
    });
  });
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#main").focus();
  });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("hashchange", () => renderRoute());
  closeMenu(false);
  renderRoute(false);
})();
