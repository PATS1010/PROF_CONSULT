// SYSTEM NOTE: Controls client-side behavior for the create new password page, including UI events and API calls.
// =========================================================
// CREATE NEW PASSWORD PAGE INTERACTIONS
// - Back -> verification-code.html (preserving ?from= origin)
// - Show/Hide password toggle -- independent per field (New Password, Confirm Password)
// - Validates: 8+ characters, one uppercase letter, one number,
//   and that Confirm Password matches New Password
// - On success -> saves the new password through api/reset-password.php
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
  const token = params.get("token") || "";

  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.setAttribute("href", `verification-code.html${originQuery}&token=${encodeURIComponent(token)}`);
  }

  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = `verification-code.html${originQuery}&token=${encodeURIComponent(token)}`;
    });
  });

  // ---------------------------------------------------------
  // Show/Hide password toggle -- independent per field
  // ---------------------------------------------------------
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmNewPassword");

  document.querySelectorAll(".password-toggle").forEach((toggleButton) => {
    toggleButton.addEventListener("click", () => {
      const targetId = toggleButton.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);
      if (!targetInput) return;

      const isHidden = targetInput.type === "password";
      targetInput.type = isHidden ? "text" : "password";
      toggleButton.textContent = isHidden ? "Hide" : "Show";
      toggleButton.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  });

  // ---------------------------------------------------------
  // Form validation + submit
  // ---------------------------------------------------------
  const form = document.getElementById("createNewPasswordForm");
  const newPasswordError = document.getElementById("newPasswordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  if (form) {
    form.addEventListener("submit", async (event) => {
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

      if (!token) {
        newPasswordError.textContent = "Your reset session expired. Please request a new code.";
        newPasswordError.hidden = false;
        return;
      }

      if (!isValid) return;

      try {
        // Sends the verified reset token and new password to PHP for saving.
        const response = await fetch("api/reset-password.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password: newPasswordInput.value
          })
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          newPasswordError.textContent = result.message || "Unable to reset password.";
          newPasswordError.hidden = false;
          return;
        }

        window.location.href = `reset-successful.html${originQuery}`;
      } catch (error) {
        newPasswordError.textContent = "Unable to connect to the server. Please try again.";
        newPasswordError.hidden = false;
      }
    });
  }

});
