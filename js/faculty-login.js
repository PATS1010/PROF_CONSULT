// Faculty Login JS
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "choose-account.html";
    });
  });

  document.querySelectorAll('[data-nav="forgot-password"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "forgot-password.html?from=faculty";
    });
  });

  document.querySelectorAll('[data-nav="create-account"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "create-faculty-account.html";
    });
  });

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