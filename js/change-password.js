// SYSTEM NOTE: Handles the shared logged-in Change Password page for students and faculty.

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";
  const settingsPage = origin === "faculty" ? "faculty-settings.html" : "settings.html";
  const loginPage = origin === "faculty" ? "faculty-login.html" : "student-login.html";

  const form = document.getElementById("changePasswordForm");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const message = document.getElementById("changePasswordMessage");
  const saveButton = document.getElementById("saveButton");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const requirementItems = Array.from(document.querySelectorAll("#passwordRequirements [data-rule]"));
  let isSubmitting = false;

  function setBackLinks() {
    document.querySelectorAll('[data-nav="back"]').forEach((element) => {
      if (element.tagName === "A") {
        element.setAttribute("href", settingsPage);
      }

      element.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = settingsPage;
      });
    });

    if (forgotPasswordLink) {
      forgotPasswordLink.setAttribute("href", `forgot-password.html?from=${origin}`);
    }
  }

  function showMessage(text, type = "error") {
    if (!message) return;
    message.textContent = text;
    message.hidden = false;
    message.classList.toggle("field-message-success", type === "success");
    message.classList.toggle("field-message-error", type !== "success");
  }

  function hideMessage() {
    if (!message) return;
    message.textContent = "";
    message.hidden = true;
  }

  function setInputError(input, hasError) {
    if (input) input.classList.toggle("input-error", hasError);
  }

  function passwordRules(value) {
    return {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      number: /[0-9]/.test(value),
    };
  }

  function updateRequirements() {
    const rules = passwordRules(newPasswordInput ? newPasswordInput.value : "");
    requirementItems.forEach((item) => {
      item.classList.toggle("is-met", Boolean(rules[item.dataset.rule]));
    });
  }

  function validateForm() {
    const currentPassword = currentPasswordInput ? currentPasswordInput.value : "";
    const newPassword = newPasswordInput ? newPasswordInput.value : "";
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
    const rules = passwordRules(newPassword);

    setInputError(currentPasswordInput, false);
    setInputError(newPasswordInput, false);
    setInputError(confirmPasswordInput, false);

    if (currentPassword.trim() === "") {
      setInputError(currentPasswordInput, true);
      showMessage("Current password is required.");
      return null;
    }

    if (!rules.length || !rules.uppercase || !rules.number) {
      setInputError(newPasswordInput, true);
      showMessage("New password must have at least 8 characters, one uppercase letter, and one number.");
      return null;
    }

    if (newPassword === currentPassword) {
      setInputError(newPasswordInput, true);
      showMessage("New password must be different from your current password.");
      return null;
    }

    if (confirmPassword !== newPassword) {
      setInputError(confirmPasswordInput, true);
      showMessage("New Password and Confirm Password do not match.");
      return null;
    }

    hideMessage();
    return { currentPassword, newPassword };
  }

  async function submitPasswordChange(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const values = validateForm();
    if (!values) return;

    isSubmitting = true;
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
    }

    try {
      const response = await fetch("api/change-password.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          current_password: values.currentPassword,
          new_password: values.newPassword,
        }),
      });
      const result = await response.json();

      const authMessage = String(result.message || "").toLowerCase();
      if (
        response.status === 403 ||
        (response.status === 401 && (authMessage.includes("log in") || authMessage.includes("not allowed")))
      ) {
        showMessage(result.message || "Please log in again before changing your password.");
        window.setTimeout(() => {
          window.location.href = loginPage;
        }, 1200);
        return;
      }

      if (!response.ok || !result.ok) {
        showMessage(result.message || "Unable to change password.");
        return;
      }

      form.reset();
      updateRequirements();
      document.querySelectorAll(".password-input").forEach((input) => {
        input.type = "password";
      });
      document.querySelectorAll(".password-toggle").forEach((button) => {
        button.setAttribute("aria-label", "Show password");
      });
      showMessage(result.message || "Password changed.", "success");
    } catch (error) {
      showMessage("Unable to connect to the server. Please try again.");
    } finally {
      isSubmitting = false;
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "Save";
      }
    }
  }

  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      if (!target) return;

      const showPassword = target.type === "password";
      target.type = showPassword ? "text" : "password";
      button.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    });
  });

  [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      setInputError(input, false);
      hideMessage();
      updateRequirements();
    });
  });

  setBackLinks();
  updateRequirements();

  if (form) {
    form.addEventListener("submit", submitPasswordChange);
  }
});
