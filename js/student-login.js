// Student Login JS
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
      window.location.href = "forgot-password.html?from=student";
    });
  });

  document.querySelectorAll('[data-nav="create-account"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "create-student-account.html";
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

  const loginForm = document.getElementById("studentLoginForm");
  const emailInput = document.getElementById("studentEmail");
  const passwordInput = document.getElementById("studentPassword");
  const loginError = document.getElementById("loginError");

  const TEST_STUDENT_EMAIL = "student@test.com";
  const TEST_STUDENT_PASSWORD = "Student123";

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const enteredEmail = emailInput.value.trim();
      const enteredPassword = passwordInput.value;

      const isValid =
        enteredEmail === TEST_STUDENT_EMAIL &&
        enteredPassword === TEST_STUDENT_PASSWORD;

      if (isValid) {
        loginError.hidden = true;
        window.location.href = "student-dashboard.html";
      } else {
        loginError.hidden = false;
      }
    });
  }

});