// SYSTEM NOTE: Controls client-side behavior for the faculty login page, including UI events and API calls.
// =========================================================
// FACULTY LOGIN PAGE INTERACTIONS
// - Back -> choose-account.html
// - Login form submit -> faculty-dashboard.html
// - Forgot Password -> forgot-password.html?from=faculty
// - Create Faculty Account -> create-faculty-account.html
// - Remember Me custom circular checkbox toggle
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Back -> choose-account.html
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "choose-account.html";
    });
  });

  // ---------------------------------------------------------
  // Forgot Password -> forgot-password.html?from=faculty
  // (page not built yet -- this link will 404 until it exists)
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="forgot-password"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "forgot-password.html?from=faculty";
    });
  });

  // ---------------------------------------------------------
  // Create Faculty Account -> create-faculty-account.html
  // (page not built yet -- this link will 404 until it exists)
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="create-account"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "create-faculty-account.html";
    });
  });

  // ---------------------------------------------------------
  // Show/Hide password toggle
  // ---------------------------------------------------------
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

  const loginForm = document.getElementById("facultyLoginForm");
  const emailInput = document.getElementById("facultyEmail");
  const passwordInput = document.getElementById("facultyPassword");
  const loginError = document.getElementById("loginError");

  // ---------------------------------------------------------
  // TEST ACCOUNT CREDENTIALS (frontend-only, no backend yet)
  // ---------------------------------------------------------
  const TEST_FACULTY_EMAIL = "faculty@test.com";
  const TEST_FACULTY_PASSWORD = "Faculty123";

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const enteredEmail = emailInput.value.trim();
      const enteredPassword = passwordInput.value;

      const isValid =
        enteredEmail === TEST_FACULTY_EMAIL &&
        enteredPassword === TEST_FACULTY_PASSWORD;

      if (isValid) {
        loginError.hidden = true;
        window.location.href = "faculty-dashboard.html";
      } else {
        loginError.hidden = false;
      }
    });
  }

});