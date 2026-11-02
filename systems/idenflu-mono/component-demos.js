(() => {
  "use strict";
  // These examples belong to the documentation, not the reusable component runtime.
  if (!document.body.classList.contains("docs-app")) return;
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

window.showToast = function showToast(message) {
  if (!toast.contains(document.activeElement)) toastTrigger = document.activeElement;
  toast.hidden = false;
  toastMessage.textContent = message;
};

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

  const search = document.querySelector("#component-search");
  const clearSearch = document.querySelector("#clear-search");
  search.addEventListener("input", () => {
    clearSearch.disabled = !search.value;
    document.querySelector("#search-help").textContent = search.value ? `입력한 검색어: ${search.value}` : "검색 아이콘과 지우기 버튼을 함께 사용합니다.";
  });
  clearSearch.addEventListener("click", () => {
    search.value = "";
    search.dispatchEvent(new Event("input"));
    search.focus();
  });

  const email = document.querySelector("#affix-email");
  function updateEmail(showError = false) {
    const valid = Boolean(email.value.trim()) && email.validity.valid;
    const invalid = showError && Boolean(email.value.trim()) && !valid;
    document.querySelector("#email-valid-icon").hidden = !valid;
    document.querySelector("#email-group").classList.toggle("is-invalid", invalid);
    const message = document.querySelector("#affix-email-help");
    message.classList.toggle("is-error", invalid);
    message.textContent = invalid ? "올바른 이메일 주소를 입력해주세요." : valid ? "올바른 이메일 형식입니다." : "이메일 주소를 입력해주세요.";
    if (invalid) email.setAttribute("aria-invalid", "true");
    else email.removeAttribute("aria-invalid");
  }
  email.addEventListener("input", () => updateEmail());
  email.addEventListener("blur", () => updateEmail(true));

  const password = document.querySelector("#example-password");
  const passwordButton = document.querySelector("#toggle-password");
  passwordButton.addEventListener("click", () => {
    const visible = password.type === "password";
    password.type = visible ? "text" : "password";
    passwordButton.setAttribute("aria-pressed", String(visible));
    passwordButton.setAttribute("aria-label", visible ? "비밀번호 숨기기" : "비밀번호 표시");
    const icon = passwordButton.querySelector(".ui-icon");
    icon.classList.toggle("icon-eye", !visible);
    icon.classList.toggle("icon-eye-slash", visible);
    document.querySelector("#password-status").textContent = visible ? "비밀번호를 표시합니다." : "비밀번호를 숨깁니다.";
  });

  document.querySelector("#view-chips").addEventListener("click", (event) => {
    const chip = event.target.closest('.chip[aria-pressed]');
    if (chip) chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
  });
  const sizeExamples = document.querySelector("#chip-size-examples");
  const initialSizeExamples = sizeExamples.innerHTML;
  const sizeFeedback = document.querySelector("#chip-size-feedback");
  const resetSizes = document.querySelector("#reset-size-chips");
  sizeExamples.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-size-chip]");
    if (!chip) return;
    const next = chip.previousElementSibling || resetSizes;
    sizeFeedback.textContent = `${chip.getAttribute("aria-label")}했습니다.`;
    chip.remove();
    next.focus();
  });
  resetSizes.addEventListener("click", () => {
    sizeExamples.innerHTML = initialSizeExamples;
    sizeFeedback.textContent = "사이즈 예시를 초기화했습니다.";
  });
  const removable = document.querySelector("#removable-chips");
  const initialChips = removable.innerHTML;
  const chipFeedback = document.querySelector("#chip-feedback");
  removable.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip--removable");
    if (!chip) return;
    const next = chip.nextElementSibling || chip.previousElementSibling || document.querySelector("#reset-chips");
    chipFeedback.textContent = `${chip.textContent.trim()} 항목을 제거했습니다.`;
    chip.remove();
    next.focus();
  });
  document.querySelector("#reset-chips").addEventListener("click", () => {
    removable.innerHTML = initialChips;
    chipFeedback.textContent = "항목을 초기화했습니다.";
  });

  document.querySelector(".selectable-list").addEventListener("click", (event) => {
    const selected = event.target.closest("button[aria-pressed]");
    if (!selected) return;
    document.querySelectorAll(".selectable-list button[aria-pressed]").forEach((button) => {
      const active = button === selected;
      button.setAttribute("aria-pressed", String(active));
      button.querySelector(".list-state").textContent = active ? "선택됨" : "선택";
    });
  });

  function connectRange(id, update) {
    const range = document.querySelector(id);
    const refresh = () => {
      const percent = (Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min)) * 100;
      range.style.setProperty("--fill", `${percent}%`);
      const thumbWidth = parseFloat(getComputedStyle(range).getPropertyValue("--range-thumb-width")) || 12;
      const offset = thumbWidth * (0.5 - percent / 100);
      range.style.setProperty("--fill-position", `calc(${percent}% + ${offset}px)`);
      update(range.value);
    };
    range.addEventListener("input", refresh);
    refresh();
  }
  connectRange("#progress-slider", (value) => {
    document.querySelector("#demo-progress").value = value;
    document.querySelector("#progress-value").textContent = `${value}%`;
  });
  connectRange("#volume-slider", (value) => {
    document.querySelector("#volume-value").textContent = `${value}%`;
    document.querySelector("#volume-slider").setAttribute("aria-valuetext", `${value}%`);
  });
  connectRange("#step-slider", (value) => {
    document.querySelector("#step-value").textContent = `${value}%`;
    document.querySelector("#step-slider").setAttribute("aria-valuetext", `${value}%`);
  });
  connectRange("#disabled-slider", () => {});
  ["sm", "md", "lg"].forEach((size) => {
    connectRange(`#slider-size-${size}`, (value) => {
      document.querySelector(`#slider-size-${size}-value`).textContent = `${value}%`;
      document.querySelector(`#slider-size-${size}`).setAttribute("aria-valuetext", `${value}%`);
    });
  });

  const slides = [
    ["명확한 위계", "중요한 정보를 먼저 보여주고, 나머지는 자연스럽게 이어갑니다."],
    ["일관된 구성", "같은 역할을 하는 요소는 같은 규칙과 표현을 사용합니다."],
    ["편안한 사용", "필요한 동작을 쉽게 찾고 키보드로도 사용할 수 있게 합니다."],
  ];
  let slideIndex = 0;
  const previousSlide = document.querySelector("#slide-prev");
  const nextSlide = document.querySelector("#slide-next");
  function renderSlide() {
    document.querySelector("#slide-index").textContent = `${String(slideIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    document.querySelector("#slide-title").textContent = slides[slideIndex][0];
    document.querySelector("#slide-description").textContent = slides[slideIndex][1];
    previousSlide.disabled = slideIndex === 0;
    nextSlide.disabled = slideIndex === slides.length - 1;
  }
  previousSlide.addEventListener("click", () => { slideIndex -= 1; renderSlide(); });
  nextSlide.addEventListener("click", () => { slideIndex += 1; renderSlide(); });


  document.querySelectorAll(".segmented-control").forEach((group) => group.addEventListener("segmentedchange", (event) => {
    document.querySelector("#demo-feedback").textContent = `${event.detail.label} 보기를 선택했습니다.`;
  }));
  document.querySelectorAll(".demo-tree").forEach((tree) => tree.addEventListener("treechange", (event) => {
    document.querySelector("#tree-feedback").textContent = `선택: ${event.detail.label}`;
  }));
})();
