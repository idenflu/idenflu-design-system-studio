(() => {
  "use strict";

  // Keep previously shared documentation links working after the folder move.
  function redirectLegacyRoute() {
    const hash = window.location.hash;
    const aliases = new Set(["#overview", "#foundations", "#components", "#states", "#/overview", "#/foundations", "#/components", "#/states"]);
    const documentationRoute = /^#\/?(?:foundations|components|patterns)\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?$/;
    if (!aliases.has(hash) && !documentationRoute.test(hash)) return;
    const destination = new URL("./systems/idenflu-mono/index.html", window.location.href);
    destination.search = window.location.search;
    destination.hash = hash;
    window.location.replace(destination.href);
  }

  redirectLegacyRoute();
  window.addEventListener("hashchange", redirectLegacyRoute);
})();
