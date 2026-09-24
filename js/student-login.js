// SYSTEM NOTE: Controls client-side behavior for the student login page, including UI events and API calls.
// =========================================================
// STUDENT LOGIN PAGE INTERACTIONS
// - Back -> choose-account.html
// - Login form submit -> student-dashboard.html
// - Forgot Password -> forgot-password.html?from=student
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
      window.location.href = "forgot-password.html?from=student";
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

  const loginForm = document.getElementById("studentLoginForm");
  const emailInput = document.getElementById("studentEmail");
  const passwordInput = document.getElementById("studentPassword");
  const loginError = document.getElementById("loginError");
  const loginButton = document.getElementById("loginButton");

  function showLoginError(message) {
    if (!loginError) return;
    loginError.textContent = message;
    loginError.hidden = false;
  }

  async function parseJsonResponse(response) {
    const rawResponse = await response.text();

    if (!rawResponse) {
      return {
        ok: false,
        message: "The server returned an empty response."
      };
    }

    try {
      return JSON.parse(rawResponse);
    } catch {
      return {
        ok: false,
        message: "The server did not return JSON."
      };
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const enteredEmail = emailInput.value.trim();
      const enteredPassword = passwordInput.value;

      if (!enteredEmail || !enteredPassword) {
        showLoginError("Please enter your email/username and password.");
        return;
      }

      if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
      }

      try {
        const response = await fetch("api/login.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "student",
            identifier: enteredEmail,
            password: enteredPassword
          })
        });

        const result = await parseJsonResponse(response);

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Incorrect email/username or password.");
        }

        loginError.hidden = true;
        window.location.href = "student-dashboard.html";
      } catch (error) {
        showLoginError(error.message || "Unable to log in.");
      } finally {
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.textContent = "Login";
        }
      }
    });
  }

});
