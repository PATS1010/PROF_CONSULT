// =========================================================
// STUDENT LOGIN PAGE INTERACTIONS
// - Back -> choose-account.html
// - Login form submit -> student-dashboard.html
// - Forgot Password -> forgot-password.html
// - Create Student Account -> create-student-account.html
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
  // Forgot Password -> forgot-password.html
  // (page not built yet -- this link will 404 until it exists)
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="forgot-password"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "forgot-password.html";
    });
  });

  // ---------------------------------------------------------
  // Create Student Account -> create-student-account.html
  // (page not built yet -- this link will 404 until it exists)
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="create-account"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "create-student-account.html";
    });
  });

  // ---------------------------------------------------------
  // Login form -> student-dashboard.html
  // (page not built yet -- this link will 404 until it exists)
  // No backend yet, so this just simulates a successful login.
  // ---------------------------------------------------------
  const loginForm = document.getElementById("studentLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      window.location.href = "student-dashboard.html";
    });
  }

});