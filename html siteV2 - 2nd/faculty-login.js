// =========================================================
// FACULTY LOGIN PAGE INTERACTIONS
// - Back -> choose-account.html
// - Login form submit -> faculty-dashboard.html
// - Forgot Password -> faculty-forgot-password.html
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
  // Forgot Password -> faculty-forgot-password.html
  // (page not built yet -- this link will 404 until it exists)
  // --------------------------------------------------------
  document.querySelectorAll('[data-nav="forgot-password"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "faculty-forgot-password.html";
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
  // Login form -> faculty-dashboard.html
  // (page not built yet -- this link will 404 until it exists)
  // No backend yet, so this just simulates a successful login.
  // ---------------------------------------------------------
  const loginForm = document.getElementById("facultyLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      window.location.href = "faculty-dashboard.html";
    });
  }

});