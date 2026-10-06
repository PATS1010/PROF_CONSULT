// Change Password JS
document.addEventListener("DOMContentLoaded", () => {

  const params =
    new URLSearchParams(window.location.search);

  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";

  const originSettingsPage =
    origin === "faculty"
      ? "faculty-settings.html"
      : "settings.html";

  const forgotPasswordPage =
    `forgot-password.html?from=${origin}&context=change-password`;

  const backButton =
    document.getElementById("backButton");

  if (backButton) {

    backButton.setAttribute(
      "href",
      originSettingsPage
    );

  }

  const forgotPasswordLink =
    document.getElementById("forgotPasswordLink");

  if (forgotPasswordLink) {

    forgotPasswordLink.setAttribute(
      "href",
      forgotPasswordPage
    );

  }

  document
    .querySelectorAll('[data-nav="back"]')
    .forEach((element) => {

      element.addEventListener("click", (event) => {

        event.preventDefault();

        window.location.href =
          originSettingsPage;

      });

    });

  const form =
    document.getElementById(
      "changePasswordForm"
    );

  const currentPassword =
    document.getElementById(
      "currentPassword"
    );

  const newPassword =
    document.getElementById(
      "newPassword"
    );

  const confirmPassword =
    document.getElementById(
      "confirmPassword"
    );

  const saveButton =
    document.getElementById(
      "saveButton"
    );

  const requirements =
    document.getElementById(
      "passwordRequirements"
    );

  const message =
    document.getElementById(
      "changePasswordMessage"
    );

  function showMessage(text, isSuccess) {

    if (!message) {
      return;
    }

    message.textContent = text;

    message.classList.toggle(
      "field-message-error",
      !isSuccess
    );

    message.classList.toggle(
      "field-message-success",
      Boolean(isSuccess)
    );

    message.hidden = false;

  }

  function hideMessage() {

    if (!message) {
      return;
    }

    message.textContent = "";

    message.hidden = true;

  }

  document
    .querySelectorAll(".password-toggle")
    .forEach((toggle) => {

      toggle.addEventListener("click", () => {

        const targetId =
          toggle.getAttribute("data-target");

        const targetInput =
          document.getElementById(targetId);

        if (!targetInput) {
          return;
        }

        const isHidden =
          targetInput.type === "password";

        targetInput.type =
          isHidden
            ? "text"
            : "password";

        toggle.classList.toggle(
          "is-visible",
          isHidden
        );

        toggle.setAttribute(
          "aria-label",
          isHidden
            ? "Hide password"
            : "Show password"
        );

      });

    });

  function checkRules(value) {

    return {

      length:
        value.length >= 8,

      uppercase:
        /[A-Z]/.test(value),

      number:
        /\d/.test(value)

    };

  }

  function updateRequirements() {

    if (!requirements) {
      return;
    }

    const results =
      checkRules(newPassword.value);

    requirements
      .querySelectorAll("li")
      .forEach((item) => {

        const rule =
          item.getAttribute("data-rule");

        item.classList.toggle(
          "is-met",
          Boolean(results[rule])
        );

      });

  }

  [
    currentPassword,
    newPassword,
    confirmPassword
  ].forEach((input) => {

    if (!input) {
      return;
    }

    input.addEventListener("input", () => {

      input.classList.remove(
        "input-error"
      );

      hideMessage();

      if (input === newPassword) {

        updateRequirements();

      }

    });

  });

  function validateForm() {

    if (!currentPassword.value.trim()) {

      currentPassword.classList.add(
        "input-error"
      );

      showMessage(
        "Please enter your current password."
      );

      currentPassword.focus();

      return false;

    }

    const results =
      checkRules(newPassword.value);

    if (
      !results.length ||
      !results.uppercase ||
      !results.number
    ) {

      newPassword.classList.add(
        "input-error"
      );

      showMessage(
        "New password must be at least 8 characters and include one uppercase letter and one number."
      );

      newPassword.focus();

      return false;

    }

    if (
      confirmPassword.value !==
      newPassword.value
    ) {

      confirmPassword.classList.add(
        "input-error"
      );

      showMessage(
        "Passwords do not match."
      );

      confirmPassword.focus();

      return false;

    }

    return true;

  }

  if (form) {

    form.addEventListener("submit", (event) => {

      event.preventDefault();

      if (!validateForm()) {

        return;

      }

      saveButton.disabled = true;

      showMessage(
        "Password changed successfully.",
        true
      );

      setTimeout(() => {

        window.location.href =
          originSettingsPage;

      }, 1200);

    });

  }

  updateRequirements();

});