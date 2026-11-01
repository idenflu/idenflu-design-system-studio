"use strict";

const form = document.querySelector("#profile-form");
const nameInput = document.querySelector("#profile-name");
const emailInput = document.querySelector("#profile-email");
const feedback = document.querySelector("#save-feedback");

function setFieldError(input, message) {
  const error = document.getElementById(input.getAttribute("aria-describedby"));
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
  error.textContent = message;
  error.hidden = !message;
  input.closest('.input-group')?.classList.toggle('is-invalid', Boolean(message));
}

function validateProfile() {
  const nameError = nameInput.value.trim() ? "" : "이름을 입력해주세요.";
  const emailError = emailInput.value.trim() && emailInput.validity.valid
    ? "" : "올바른 이메일 주소를 입력해주세요.";
  setFieldError(nameInput, nameError);
  setFieldError(emailInput, emailError);
  return nameError ? nameInput : emailError ? emailInput : null;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const invalidField = validateProfile();
  if (invalidField) {
    feedback.textContent = "";
    invalidField.focus();
    return;
  }
  // This is a local interactive prototype; no data is transmitted or persisted.
  feedback.textContent = `${nameInput.value.trim()}님의 변경사항이 반영되었습니다.`;
});

[nameInput, emailInput].forEach((input) => {
  input.addEventListener("input", () => {
    feedback.textContent = "";
    if (input.hasAttribute("aria-invalid")) setFieldError(input, "");
  });
});
document.querySelector("#product-updates").addEventListener("change", () => {
  feedback.textContent = "";
});

document.querySelectorAll(".demo-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#demo-feedback").textContent = `${button.getAttribute("aria-label")}을 눌렀습니다.`;
  });
});

const errorExample = document.querySelector("#example-error");
errorExample.addEventListener("input", () => {
  const valid = errorExample.value.trim() !== "" && errorExample.validity.valid;
  errorExample.setAttribute("aria-invalid", String(!valid));
  document.querySelector("#example-error-message").hidden = valid;
});

// Shared, non-modal feedback for the component examples.
const toast = document.querySelector("#toast");
const toastMessage = document.querySelector("#toast-message");
let toastTrigger = null;

function showToast(message) {
  if (!toast.contains(document.activeElement)) toastTrigger = document.activeElement;
  toast.hidden = false;
  toastMessage.textContent = message;
}

document.querySelector("#close-toast").addEventListener("click", () => {
  const restoreFocus = toast.contains(document.activeElement);
  toast.hidden = true;
  if (restoreFocus && toastTrigger instanceof HTMLElement && toastTrigger.isConnected) {
    toastTrigger.focus({ preventScroll: true });
  }
});
document.querySelectorAll("[data-notice]").forEach((button) => {
  button.addEventListener("click", () => showToast(button.dataset.notice));
});
document.querySelector("#show-toast").addEventListener("click", () => {
  showToast("변경사항이 저장되었습니다.");
});

const loadingButton = document.querySelector("#loading-example");
loadingButton.addEventListener("click", () => {
  loadingButton.disabled = true;
  loadingButton.setAttribute("aria-busy", "true");
  loadingButton.textContent = "불러오는 중…";
  window.setTimeout(() => {
    loadingButton.disabled = false;
    loadingButton.removeAttribute("aria-busy");
    loadingButton.textContent = "새로고침";
    showToast("새로운 내용을 불러왔습니다.");
  }, 900);
});

const masterCheckbox = document.querySelector("#select-all");
const optionCheckboxes = [...document.querySelectorAll(".option-checkbox")];
function syncMasterCheckbox() {
  const checkedCount = optionCheckboxes.filter((input) => input.checked).length;
  masterCheckbox.checked = checkedCount === optionCheckboxes.length;
  masterCheckbox.indeterminate = checkedCount > 0 && checkedCount < optionCheckboxes.length;
}
masterCheckbox.addEventListener("change", () => {
  optionCheckboxes.forEach((input) => { input.checked = masterCheckbox.checked; });
  syncMasterCheckbox();
});
optionCheckboxes.forEach((input) => input.addEventListener("change", syncMasterCheckbox));
syncMasterCheckbox();

const tabs = [...document.querySelectorAll('#view-tabs [role="tab"]')];
function activateTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !selected;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    activateTab(tabs[next]);
    tabs[next].focus();
  });
});

const descriptionInput = document.querySelector("#project-description");
descriptionInput.addEventListener("input", () => {
  document.querySelector("#description-count").textContent = `${descriptionInput.value.length} / 160`;
});

const dialog = document.querySelector("#example-dialog");
const dialogOpener = document.querySelector("#open-dialog");
const dialogForm = document.querySelector("#dialog-form");
const dialogName = document.querySelector("#dialog-name");
const dialogError = document.querySelector("#dialog-error");

dialogOpener.addEventListener("click", () => dialog.showModal());
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => dialog.close());
});
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
    dialog.close();
  }
});
dialog.addEventListener("close", () => {
  dialogForm.reset();
  dialogError.hidden = true;
  dialogName.removeAttribute("aria-invalid");
  dialogOpener.focus({ preventScroll: true });
});
dialogName.addEventListener("input", () => {
  dialogError.hidden = true;
  dialogName.removeAttribute("aria-invalid");
});
dialogForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const projectName = dialogName.value.trim();
  if (!projectName) {
    dialogName.setAttribute("aria-invalid", "true");
    dialogError.hidden = false;
    dialogName.focus();
    return;
  }
  document.querySelector("#dialog-result").textContent = `최근 생성: ${projectName}`;
  dialog.close();
  showToast(`‘${projectName}’ 프로젝트를 만들었습니다.`);
});

const projects = [
  ["디자인 시스템", "진행 중", "primary", "김민수"],
  ["브랜드 가이드", "완료", "success", "이서연"],
  ["웹사이트 리뉴얼", "검토 중", "warning", "박지훈"],
  ["온보딩 개선", "대기", "", "최유진"],
  ["아이콘 라이브러리", "진행 중", "primary", "이서연"],
  ["모바일 내비게이션", "검토 중", "warning", "김민수"],
  ["접근성 가이드", "완료", "success", "최유진"],
  ["결제 화면", "대기", "", "박지훈"],
  ["설정 페이지", "진행 중", "primary", "최유진"],
  ["검색 경험", "검토 중", "warning", "이서연"],
  ["이메일 템플릿", "완료", "success", "박지훈"],
  ["컴포넌트 문서", "대기", "", "김민수"],
];
const pageSize = 4;
const pageCount = Math.ceil(projects.length / pageSize);
let currentPage = 1;

function renderProjects(page) {
  currentPage = Math.max(1, Math.min(pageCount, page));
  const start = (currentPage - 1) * pageSize;
  const rows = projects.slice(start, start + pageSize).map(([name, status, tone, owner]) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = name;
    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = tone ? `badge badge--${tone}` : "badge";
    badge.textContent = status;
    statusCell.append(badge);
    const ownerCell = document.createElement("td");
    ownerCell.textContent = owner;
    row.append(nameCell, statusCell, ownerCell);
    return row;
  });
  document.querySelector("#project-rows").replaceChildren(...rows);
  document.querySelector("#pagination-summary").textContent = `${start + 1}–${Math.min(start + pageSize, projects.length)} / ${projects.length}개 프로젝트`;
  document.querySelectorAll("[data-page]").forEach((button) => {
    const value = button.dataset.page;
    button.disabled = (value === "previous" && currentPage === 1) || (value === "next" && currentPage === pageCount);
    if (Number(value) === currentPage) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}
document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.page;
    renderProjects(value === "previous" ? currentPage - 1 : value === "next" ? currentPage + 1 : Number(value));
  });
});
