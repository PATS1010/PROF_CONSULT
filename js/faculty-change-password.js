// Faculty Change Password JS
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("changePasswordForm");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");

  const currentPasswordError = document.getElementById("currentPasswordError");
  const newPasswordError = document.getElementById("newPasswordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  const saveSuccessMessage = document.getElementById("passwordSaveSuccess");

  const toggleButtons = Array.from(document.querySelectorAll(".faculty-password-toggle"));
  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetInput = document.getElementById(button.dataset.target);
      if (!targetInput) return;

      const isHidden = targetInput.type === "password";
      targetInput.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "Hide" : "Show";
      button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  });

  function showFieldError(inputEl, errorEl, message) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
    if (inputEl) inputEl.classList.add("has-error");
  }

  function clearFieldError(inputEl, errorEl) {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
    if (inputEl) inputEl.classList.remove("has-error");
  }

  function validateForm() {
    let isValid = true;

    const currentValue = currentPasswordInput.value;
    const newValue = newPasswordInput.value;
    const confirmValue = confirmPasswordInput.value;

    if (currentValue.trim() === "") {
      showFieldError(currentPasswordInput, currentPasswordError, "Current password is required.");
      isValid = false;
    } else {
      clearFieldError(currentPasswordInput, currentPasswordError);
    }

    if (newValue.trim() === "") {
      showFieldError(newPasswordInput, newPasswordError, "New password is required.");
      isValid = false;
    } else if (newValue.length < 8) {
      showFieldError(newPasswordInput, newPasswordError, "New password must be at least 8 characters.");
      isValid = false;
    } else if (!/[A-Z]/.test(newValue)) {
      showFieldError(newPasswordInput, newPasswordError, "New password must include at least one uppercase letter.");
      isValid = false;
    } else if (!/[0-9]/.test(newValue)) {
      showFieldError(newPasswordInput, newPasswordError, "New password must include at least one number.");
      isValid = false;
    } else {
      clearFieldError(newPasswordInput, newPasswordError);
    }

    if (confirmValue.trim() === "") {
      showFieldError(confirmPasswordInput, confirmPasswordError, "Please confirm your new password.");
      isValid = false;
    } else if (newValue !== "" && confirmValue !== newValue) {
      showFieldError(confirmPasswordInput, confirmPasswordError, "New Password and Confirm New Password do not match.");
      isValid = false;
    } else {
      clearFieldError(confirmPasswordInput, confirmPasswordError);
    }

    return isValid;
  }

  function handleSave(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    form.reset();
    toggleButtons.forEach((button) => {
      const targetInput = document.getElementById(button.dataset.target);
      if (targetInput) targetInput.type = "password";
      button.textContent = "Show";
    });

    if (saveSuccessMessage) {
      saveSuccessMessage.hidden = false;
      requestAnimationFrame(() => saveSuccessMessage.classList.add("is-visible"));
      window.setTimeout(() => {
        saveSuccessMessage.classList.remove("is-visible");
        window.setTimeout(() => {
          saveSuccessMessage.hidden = true;
        }, 250);
      }, 2500);
    }
  }

  if (form) {
    form.addEventListener("submit", handleSave);
  }

});