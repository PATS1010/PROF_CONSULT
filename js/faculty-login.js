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

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const response = await fetch("api/login.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "faculty", identifier: emailInput.value.trim(), password: passwordInput.value }) });
        if (!response.ok) throw new Error();
        loginError.hidden = true;
        window.location.href = "faculty-dashboard.html";
      } catch (error) {
        loginError.hidden = false;
      }
    });
  }

});
