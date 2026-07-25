// =========================================================
// CREATE NEW PASSWORD PAGE INTERACTIONS
// - Back -> verification-code.html (preserving ?from= origin)
// - Show Password checkbox toggles both password fields at once
// - Validates: 8+ characters, one uppercase letter, one number,
//   and that Confirm Password matches New Password
// - On success -> reset-successful.html
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Preserve the ?from= origin param through Back and the
  // eventual success redirect, same pattern as the rest of
  // the forgot-password flow
  // ---------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";
  const originQuery = `?from=${origin}`;

  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.setAttribute("href", `verification-code.html${originQuery}`);
  }

  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = `verification-code.html${originQuery}`;
    });
  });

  // ---------------------------------------------------------
  // Show Password: one checkbox toggles both fields together
  // ---------------------------------------------------------
  const showPasswordCheckbox = document.getElementById("showPasswordCheckbox");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmNewPassword");

  if (showPasswordCheckbox) {
    showPasswordCheckbox.addEventListener("change", () => {
      const fieldType = showPasswordCheckbox.checked ? "text" : "password";
      newPasswordInput.type = fieldType;
      confirmPasswordInput.type = fieldType;
    });
  }

  // ---------------------------------------------------------
  // Form validation + submit
  // ---------------------------------------------------------
  const form = document.getElementById("createNewPasswordForm");
  const newPasswordError = document.getElementById("newPasswordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      let isValid = true;

      // New Password: length -> uppercase -> number, in that order.
      // Only the single most relevant message is shown at a time.
      let newPasswordOk = true;

      if (newPasswordInput.value.length < 8) {
        newPasswordError.textContent = "Password must contain at least 8 characters.";
        newPasswordError.hidden = false;
        newPasswordOk = false;
      } else if (!/[A-Z]/.test(newPasswordInput.value)) {
        newPasswordError.textContent = "Password must contain at least one uppercase letter.";
        newPasswordError.hidden = false;
        newPasswordOk = false;
      } else if (!/[0-9]/.test(newPasswordInput.value)) {
        newPasswordError.textContent = "Password must contain at least one number.";
        newPasswordError.hidden = false;
        newPasswordOk = false;
      } else {
        newPasswordError.hidden = true;
      }

      if (!newPasswordOk) {
        isValid = false;
      }

      // Confirm Password: only checked once New Password itself is valid
      if (newPasswordOk) {
        const passwordsMatch = newPasswordInput.value === confirmPasswordInput.value;
        confirmPasswordError.hidden = passwordsMatch;
        if (!passwordsMatch) isValid = false;
      } else {
        confirmPasswordError.hidden = true;
      }

      if (!isValid) return;

      // All checks passed
      window.location.href = `reset-successful.html${originQuery}`;
    });
  }

});