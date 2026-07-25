// =========================================================
// FORGOT PASSWORD PAGE INTERACTIONS
// This page is shared by both Student Login and Faculty Login.
// A "?from=student" or "?from=faculty" query param on the URL
// (set by each login page's Forgot Password link) determines
// which login page Back/Login should return to.
// - Send Verification Code -> verification-code.html
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Determine the origin login page from the URL,
  // defaulting to student-login.html if missing/unrecognized
  // ---------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";
  const originLoginPage = origin === "faculty" ? "faculty-login.html" : "student-login.html";

  const backButton = document.getElementById("backButton");
  const loginLink = document.getElementById("loginLink");

  if (backButton) backButton.setAttribute("href", originLoginPage);
  if (loginLink) loginLink.setAttribute("href", originLoginPage);

  // ---------------------------------------------------------
  // Back -> whichever login page the user came from
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = originLoginPage;
    });
  });

  // ---------------------------------------------------------
  // Login link -> whichever login page the user came from
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="login"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = originLoginPage;
    });
  });

  // ---------------------------------------------------------
  // Send Verification Code -> verification-code.html
  // (page not built yet -- this link will 404 until it exists)
  // Carries the ?from= origin param forward so the rest of the
  // reset flow (verification code, new password, success page)
  // still knows whether this started from Student or Faculty Login.
  // ---------------------------------------------------------
  const form = document.getElementById("forgotPasswordForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      window.location.href = `verification-code.html?from=${origin}`;
    });
  }

});