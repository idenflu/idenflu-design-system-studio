(() => {
  "use strict";

  document.querySelectorAll(".tooltip-wrap").forEach((wrap) => {
    wrap.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { wrap.classList.add("tooltip-dismissed"); event.stopPropagation(); }
    });
    wrap.addEventListener("mouseleave", () => wrap.classList.remove("tooltip-dismissed"));
    wrap.addEventListener("focusout", () => wrap.classList.remove("tooltip-dismissed"));
  });

  const menu = document.querySelector("#action-menu");
  const menuTrigger = document.querySelector("#action-trigger");
  const menuPanel = document.querySelector("#action-options");
  const menuItems = [...menuPanel.querySelectorAll('[role="menuitem"]')];
  function closeMenu(restore = false) {
    if (menuPanel.hidden) return;
    menuPanel.hidden = true;
    menuTrigger.setAttribute("aria-expanded", "false");
    if (restore) menuTrigger.focus();
  }
  function openMenu(last = false) {
    document.dispatchEvent(new CustomEvent("select-open", { detail: menu }));
    menuPanel.hidden = false;
    menuTrigger.setAttribute("aria-expanded", "true");
    (last ? menuItems[menuItems.length - 1] : menuItems[0]).focus();
  }
  menuTrigger.addEventListener("click", () => menuPanel.hidden ? openMenu() : closeMenu());
  menuTrigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); openMenu(event.key === "ArrowUp"); }
  });
  menuPanel.addEventListener("keydown", (event) => {
    const index = menuItems.indexOf(document.activeElement);
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % menuItems.length;
    else if (event.key === "ArrowUp") next = (index + menuItems.length - 1) % menuItems.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = menuItems.length - 1;
    else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeMenu(true); return; }
    else if (event.key === "Tab") { closeMenu(); return; }
    else return;
    event.preventDefault(); menuItems[next].focus();
  });
  menuPanel.addEventListener("click", (event) => {
    const item = event.target.closest('[role="menuitem"]');
    if (!item) return;
    document.querySelector("#action-feedback").textContent = `${item.dataset.action} 동작을 선택했습니다.`;
    closeMenu(true);
  });
  document.addEventListener("click", (event) => { if (!menu.contains(event.target)) closeMenu(); });
  document.addEventListener("select-open", (event) => { if (event.detail !== menu) closeMenu(); });

  const popover = document.querySelector("#demo-popover");
  const popoverTrigger = document.querySelector("#popover-trigger");
  const popoverContent = document.querySelector("#popover-content");
  function closePopover(restore = false) {
    if (popoverContent.hidden) return;
    popoverContent.hidden = true;
    popoverTrigger.setAttribute("aria-expanded", "false");
    if (restore) popoverTrigger.focus();
  }
  popoverTrigger.addEventListener("click", () => {
    if (!popoverContent.hidden) { closePopover(); return; }
    document.dispatchEvent(new CustomEvent("select-open", { detail: popover }));
    popoverContent.hidden = false;
    popoverTrigger.setAttribute("aria-expanded", "true");
  });
  document.querySelector("#popover-done").addEventListener("click", () => {
    const selected = [];
    if (document.querySelector("#popover-description").checked) selected.push("설명");
    if (document.querySelector("#popover-status").checked) selected.push("상태");
    document.querySelector("#popover-feedback").textContent = selected.length ? `${selected.join("과 ")} 표시 중` : "표시할 추가 정보가 없습니다.";
    closePopover(true);
  });
  popover.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popoverContent.hidden) { event.preventDefault(); event.stopPropagation(); closePopover(true); }
  });
  document.addEventListener("click", (event) => { if (!popover.contains(event.target)) closePopover(); });
  document.addEventListener("select-open", (event) => { if (event.detail !== popover) closePopover(); });

  const drawer = document.querySelector("#demo-drawer");
  const drawerName = document.querySelector("#drawer-name");
  const drawerNote = document.querySelector("#drawer-note");
  let savedDrawer = { name: drawerName.value, note: drawerNote.value };
  document.querySelector("#drawer-open").addEventListener("click", () => {
    drawerName.value = savedDrawer.name;
    drawerNote.value = savedDrawer.note;
    drawer.showModal();
    drawerName.focus();
  });
  document.querySelector("#drawer-close").addEventListener("click", () => drawer.close());
  document.querySelector("#drawer-cancel").addEventListener("click", () => drawer.close());
  drawer.addEventListener("click", (event) => { if (event.target === drawer) drawer.close(); });
  document.querySelector("#drawer-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!drawerName.value.trim()) { drawerName.setCustomValidity("프로젝트 이름을 입력해주세요."); drawerName.reportValidity(); return; }
    drawerName.setCustomValidity("");
    savedDrawer = { name: drawerName.value.trim(), note: drawerNote.value };
    document.querySelector("#drawer-feedback").textContent = `${savedDrawer.name} 설정을 저장했습니다.`;
    drawer.close();
  });
  drawerName.addEventListener("input", () => drawerName.setCustomValidity(""));

  document.querySelector("#empty-action").addEventListener("click", () => {
    document.querySelector("#empty-feedback").textContent = "프로젝트 만들기 동작을 선택했습니다.";
  });

  const uploadArea = document.querySelector("#upload-area");
  const uploadInput = document.querySelector("#upload-input");
  const uploadResult = document.querySelector("#upload-result");
  const uploadStatus = document.querySelector("#upload-status");
  function showFile(file) {
    if (!file) return;
    const validTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!validTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      uploadInput.value = "";
      uploadResult.hidden = true;
      uploadStatus.classList.add("is-error");
      uploadStatus.textContent = "PNG, JPG, PDF 파일을 5MB 이하로 선택해주세요.";
      return;
    }
    uploadStatus.classList.remove("is-error");
    document.querySelector("#upload-name").textContent = file.name;
    document.querySelector("#upload-size").textContent = file.size < 1024 ? `${file.size} B` : `${(file.size / 1024 / (file.size >= 1048576 ? 1024 : 1)).toFixed(1)} ${file.size >= 1048576 ? "MB" : "KB"}`;
    uploadResult.hidden = false;
    uploadStatus.textContent = "파일을 선택했습니다. 파일은 전송되지 않습니다.";
  }
  uploadInput.addEventListener("change", () => showFile(uploadInput.files[0]));
  document.querySelector("#upload-remove").addEventListener("click", () => {
    uploadInput.value = "";
    uploadResult.hidden = true;
    uploadStatus.classList.remove("is-error");
    uploadStatus.textContent = "선택한 파일을 제거했습니다.";
    uploadInput.focus();
  });
  ["dragenter", "dragover"].forEach((type) => uploadArea.addEventListener(type, (event) => { event.preventDefault(); uploadArea.classList.add("is-dragging"); }));
  uploadArea.addEventListener("dragleave", (event) => { if (!uploadArea.contains(event.relatedTarget)) uploadArea.classList.remove("is-dragging"); });
  uploadArea.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadArea.classList.remove("is-dragging");
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    uploadInput.files = transfer.files;
    showFile(file);
  });

  const steps = [
    ["기본 정보", "프로젝트 이름과 설명을 입력합니다."],
    ["팀원 초대", "함께 작업할 팀원을 초대합니다."],
    ["확인", "입력한 정보를 확인합니다."],
  ];
  const stepItems = [...document.querySelectorAll(".stepper li")];
  const stepPrev = document.querySelector("#step-prev");
  const stepNext = document.querySelector("#step-next");
  let currentStep = 0;
  function renderStep() {
    stepItems.forEach((item, index) => {
      item.classList.toggle("is-current", index === currentStep);
      item.classList.toggle("is-complete", index < currentStep);
      if (index === currentStep) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    document.querySelector("#step-title").textContent = steps[currentStep][0];
    document.querySelector("#step-description").textContent = steps[currentStep][1];
    stepPrev.disabled = currentStep === 0;
    stepNext.disabled = currentStep === steps.length - 1;
  }
  stepPrev.addEventListener("click", () => { currentStep -= 1; renderStep(); });
  stepNext.addEventListener("click", () => { currentStep += 1; renderStep(); });

  window.addEventListener("hashchange", () => {
    closeMenu(); closePopover();
    if (drawer.open) drawer.close();
  });
})();
