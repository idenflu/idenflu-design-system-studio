(() => {
  "use strict";

  const form = document.getElementById("page-multi-search-form");
  if (!form) return;

  const query = document.getElementById("page-multi-query");
  const pickers = [
    document.getElementById("page-multi-team-picker"),
    document.getElementById("page-multi-status-picker"),
  ];
  const items = [...document.querySelectorAll("[data-page-multi-item]")];
  const count = document.getElementById("page-multi-count");
  const empty = document.getElementById("page-multi-empty");

  function applyFilters() {
    const name = query.value.trim().toLocaleLowerCase();
    const team = pickers[0].querySelector('input[type="hidden"]').value;
    const status = pickers[1].querySelector('input[type="hidden"]').value;
    let visible = 0;
    items.forEach((item) => {
      const matches = item.dataset.name.toLocaleLowerCase().includes(name)
        && (!team || item.dataset.team === team)
        && (!status || item.dataset.status === status);
      item.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = `프로젝트 ${visible}개`;
    empty.hidden = visible !== 0;
  }

  function resetPicker(picker) {
    const control = window.IdenfluMono?.get(picker);
    control?.setValue("", { emit: false });
    control?.close();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
  });
  document.getElementById("page-multi-reset").addEventListener("click", (event) => {
    event.preventDefault();
    form.reset();
    pickers.forEach(resetPicker);
    applyFilters();
  });

  applyFilters();
})();
