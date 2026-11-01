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

document.querySelectorAll(".navigation a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".navigation a").forEach((item) => item.removeAttribute("aria-current"));
    link.setAttribute("aria-current", "page");
  });
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
