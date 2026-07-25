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
  // TEMPORARY FRONTEND-ONLY LOGIN VALIDATION
  // No backend yet -- checks against hardcoded test credentials.
  // Replace this entire block with a real API call once the
  // backend exists; everything else on the page stays the same.
  // ---------------------------------------------------------
  const TEST_CREDENTIALS = {
    email: "faculty@test.com",
    username: "faculty01",
    password: "Faculty123",
  };

  const loginForm = document.getElementById("facultyLoginForm");
  const emailInput = document.getElementById("facultyEmail");
  const passwordInput = document.getElementById("facultyPassword");
  const loginError = document.getElementById("loginError");

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const enteredIdentifier = emailInput.value.trim().toLowerCase();
      const enteredPassword = passwordInput.value;

      const identifierMatches =
        enteredIdentifier === TEST_CREDENTIALS.email ||
        enteredIdentifier === TEST_CREDENTIALS.username;
      const passwordMatches = enteredPassword === TEST_CREDENTIALS.password;

      if (identifierMatches && passwordMatches) {
        loginError.hidden = true;
        window.location.href = "faculty-dashboard.html";
      } else {
        loginError.hidden = false;
      }
    });
  }

});