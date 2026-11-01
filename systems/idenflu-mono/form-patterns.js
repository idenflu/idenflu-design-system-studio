(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  function setError(input, errorId, message) {
    const error = byId(errorId);
    const describedBy = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    const withoutError = describedBy.filter((id) => id !== errorId);
    if (message) {
      input.setAttribute("aria-invalid", "true");
      withoutError.push(errorId);
    } else {
      input.removeAttribute("aria-invalid");
    }
    if (withoutError.length) input.setAttribute("aria-describedby", withoutError.join(" "));
    else input.removeAttribute("aria-describedby");
    error.textContent = message;
    error.hidden = !message;
    input.closest('.input-group')?.classList.toggle('is-invalid', Boolean(message));
  }

  function setGroupError(inputs, errorId, message) {
    inputs.forEach((input) => setError(input, errorId, message));
  }

  function clearResult(result) {
    result.textContent = "";
    result.hidden = true;
  }

  function showResult(result, message) {
    result.textContent = message;
    result.hidden = false;
  }

  function setupBasic() {
    const form = byId("form-basic");
    if (!form) return;
    const name = byId("form-basic-name");
    const email = byId("form-basic-email");
    const result = byId("form-basic-result");
    const validateName = () => name.value.trim() ? "" : "이름을 입력해주세요.";
    const validateEmail = () => {
      if (!email.value.trim()) return "이메일을 입력해주세요.";
      return email.validity.typeMismatch ? "올바른 이메일 주소를 입력해주세요." : "";
    };
    const fields = [
      { input: name, error: "form-basic-name-error", validate: validateName },
      { input: email, error: "form-basic-email-error", validate: validateEmail },
    ];
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearResult(result);
      let firstInvalid = null;
      fields.forEach(({ input, error, validate }) => {
        const message = validate();
        setError(input, error, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) firstInvalid.focus();
      else showResult(result, "기본 정보를 확인했습니다.");
    });
    form.addEventListener("input", () => clearResult(result));
    fields.forEach(({ input, error, validate }) => {
      input.addEventListener("input", () => {
        if (input.hasAttribute("aria-invalid")) setError(input, error, validate());
      });
    });
    form.addEventListener("reset", () => {
      fields.forEach(({ input, error }) => setError(input, error, ""));
      clearResult(result);
    });
  }

  function setupPreferences() {
    const form = byId("form-preferences");
    if (!form) return;
    const channels = [...form.querySelectorAll('input[name="form-channels"]:not(:disabled)')];
    const contacts = [...form.querySelectorAll('input[name="form-contact"]:not(:disabled)')];
    const result = byId("form-preferences-result");
    const channelMessage = () => channels.some((input) => input.checked) ? "" : "알림 채널을 하나 이상 선택해주세요.";
    const contactMessage = () => contacts.some((input) => input.checked) ? "" : "연락 방법을 선택해주세요.";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearResult(result);
      const channelError = channelMessage();
      const contactError = contactMessage();
      setGroupError(channels, "form-channels-error", channelError);
      setGroupError(contacts, "form-contact-error", contactError);
      if (channelError) channels[0]?.focus();
      else if (contactError) contacts[0]?.focus();
      else showResult(result, "선택한 설정을 확인했습니다.");
    });
    form.addEventListener("input", () => clearResult(result));
    form.addEventListener("change", () => clearResult(result));
    form.addEventListener("selectchange", () => clearResult(result));
    channels.forEach((input) => input.addEventListener("change", () => {
      if (channels.some((item) => item.hasAttribute("aria-invalid"))) setGroupError(channels, "form-channels-error", channelMessage());
    }));
    contacts.forEach((input) => input.addEventListener("change", () => {
      if (contacts.some((item) => item.hasAttribute("aria-invalid"))) setGroupError(contacts, "form-contact-error", contactMessage());
    }));
    form.addEventListener("reset", () => {
      setGroupError(channels, "form-channels-error", "");
      setGroupError(contacts, "form-contact-error", "");
      clearResult(result);
    });
  }

  function setupPassword() {
    const form = byId("form-password");
    if (!form) return;
    const current = byId("form-password-current");
    const password = byId("form-password-new");
    const confirm = byId("form-password-confirm");
    const result = byId("form-password-result");
    let submitted = false;
    const validateCurrent = () => current.value ? "" : "현재 비밀번호를 입력해주세요.";
    const validatePassword = () => !password.value ? "새 비밀번호를 입력해주세요." : password.value.length < 8 ? "새 비밀번호는 8자 이상이어야 합니다." : "";
    const validateConfirm = () => !confirm.value ? "새 비밀번호를 다시 입력해주세요." : confirm.value !== password.value ? "새 비밀번호가 일치하지 않습니다." : "";
    const fields = [
      { input: current, error: "form-password-current-error", validate: validateCurrent },
      { input: password, error: "form-password-new-error", validate: validatePassword },
      { input: confirm, error: "form-password-confirm-error", validate: validateConfirm },
    ];
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitted = true;
      clearResult(result);
      let firstInvalid = null;
      fields.forEach(({ input, error, validate }) => {
        const message = validate();
        setError(input, error, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) firstInvalid.focus();
      else showResult(result, "비밀번호 입력을 확인했습니다.");
    });
    form.addEventListener("input", () => clearResult(result));
    fields.forEach(({ input, error, validate }) => {
      input.addEventListener("input", () => {
        if (input.hasAttribute("aria-invalid")) setError(input, error, validate());
      });
    });
    password.addEventListener("input", () => {
      if (submitted && confirm.value) setError(confirm, "form-password-confirm-error", validateConfirm());
    });
    form.addEventListener("reset", () => {
      submitted = false;
      fields.forEach(({ input, error }) => setError(input, error, ""));
      clearResult(result);
    });
  }

  function setupMessage() {
    const form = byId("form-form-wide");
    if (!form) return;
    const message = byId("form-message");
    const count = byId("form-message-count");
    const attachment = byId("form-attachment");
    const attachmentName = byId("form-attachment-name");
    const result = byId("form-form-wide-result");
    const validate = () => {
      if (!message.value.trim()) return "문의 내용을 입력해주세요.";
      if (message.value.trim().length < 10) return "문의 내용은 10자 이상 입력해주세요.";
      if (message.value.length > 500) return "문의 내용은 500자 이하로 입력해주세요.";
      return "";
    };
    function updateCount() { count.textContent = `${message.value.length} / 500자`; }
    function updateAttachment() {
      if (attachmentName) attachmentName.textContent = attachment.files[0]?.name || "선택된 파일이 없습니다.";
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearResult(result);
      const error = validate();
      setError(message, "form-message-error", error);
      if (error) message.focus();
      else showResult(result, "문의 내용을 확인했습니다.");
    });
    message.addEventListener("input", () => {
      clearResult(result);
      updateCount();
      if (message.hasAttribute("aria-invalid")) setError(message, "form-message-error", validate());
    });
    attachment.addEventListener("change", () => { clearResult(result); updateAttachment(); });
    form.addEventListener("input", () => clearResult(result));
    form.addEventListener("selectchange", () => clearResult(result));
    form.addEventListener("reset", () => {
      setError(message, "form-message-error", "");
      clearResult(result);
      setTimeout(() => { updateCount(); updateAttachment(); }, 0);
    });
    updateCount();
    updateAttachment();
  }

  setupBasic();
  setupPreferences();
  setupPassword();
  setupMessage();
})();
