(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  function setError(input, message) {
    const errorId = `${input.id}-error`;
    const error = byId(errorId);
    const descriptions = (input.getAttribute("aria-describedby") || "")
      .split(/\s+/).filter((id) => id && id !== errorId);
    if (message) {
      input.setAttribute("aria-invalid", "true");
      descriptions.push(errorId);
    } else {
      input.removeAttribute("aria-invalid");
    }
    if (descriptions.length) input.setAttribute("aria-describedby", descriptions.join(" "));
    else input.removeAttribute("aria-describedby");
    error.textContent = message;
    error.hidden = !message;
  }

  function clearResult(result) {
    result.textContent = "";
    result.hidden = true;
  }

  function showResult(result) {
    result.textContent = "입력 내용을 확인했습니다.";
    result.hidden = false;
  }

  function setupList() {
    const search = byId("page-list-search");
    if (!search) return;
    const items = [...document.querySelectorAll("[data-page-list-item][data-search]")];
    const count = byId("page-list-count");
    const empty = byId("page-list-empty");
    function update() {
      const query = search.value.trim().toLocaleLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const matches = item.dataset.search.toLocaleLowerCase().includes(query);
        item.hidden = !matches;
        if (matches) visible += 1;
      });
      count.textContent = `프로젝트 ${visible}개`;
      empty.hidden = visible !== 0;
    }
    search.addEventListener("input", update);
    update();
  }

  function setupForm(formId, fields, resultId) {
    const form = byId(formId);
    if (!form) return;
    const result = byId(resultId);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearResult(result);
      let firstInvalid = null;
      fields.forEach(({ input, validate }) => {
        const message = validate(input);
        setError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) firstInvalid.focus();
      else showResult(result);
    });
    form.addEventListener("input", (event) => {
      clearResult(result);
      const field = fields.find(({ input }) => input === event.target);
      if (field && field.input.hasAttribute("aria-invalid")) setError(field.input, field.validate(field.input));
    });
    form.addEventListener("reset", () => {
      fields.forEach(({ input }) => setError(input, ""));
      clearResult(result);
    });
  }

  const settingsName = byId("page-settings-name");
  if (settingsName) setupForm("page-settings-form", [
    { input: settingsName, validate: (input) => input.value.trim() ? "" : "이름을 입력해주세요." },
  ], "page-settings-result");

  const loginEmail = byId("page-login-email");
  const loginPassword = byId("page-login-password");
  if (loginEmail && loginPassword) setupForm("page-login-form", [
    { input: loginEmail, validate: (input) => !input.value.trim() ? "이메일을 입력해주세요." : input.validity.typeMismatch ? "올바른 이메일 주소를 입력해주세요." : "" },
    { input: loginPassword, validate: (input) => !input.value ? "비밀번호를 입력해주세요." : input.value.length < 8 ? "비밀번호는 8자 이상 입력해주세요." : "" },
  ], "page-login-result");

  setupList();
})();
