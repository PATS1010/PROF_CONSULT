// Create New Password JS
document.addEventListener("DOMContentLoaded", () => {

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

  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmNewPassword");

  const requirementItems = document.querySelectorAll(".password-requirements li");
  const requirementChecks = [
    (value) => value.length >= 8,
    (value) => /[A-Z]/.test(value),
    (value) => /[0-9]/.test(value)
  ];

  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", () => {
      requirementItems.forEach((item, index) => {
        const check = requirementChecks[index];
        item.classList.toggle("requirement-met", !!check && check(newPasswordInput.value));
      });
    });
  }

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

  const form = document.getElementById("createNewPasswordForm");
  const newPasswordError = document.getElementById("newPasswordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      let isValid = true;

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