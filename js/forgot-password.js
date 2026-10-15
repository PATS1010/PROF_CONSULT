// Forgot Password page interactions.
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const requestedOrigin = params.get("from");
  const origin = requestedOrigin === "faculty" || requestedOrigin === "student"
    ? requestedOrigin
    : "";
  const context = params.get("context");

  const originLoginPage = "login.html";
  const originChangePasswordPage = `change-password.html?from=${origin || "student"}`;
  const originSettingsPage = origin === "faculty" ? "faculty-settings.html" : "settings.html";
  const backDestination =
    context === "change-password" ? originChangePasswordPage :
    context === "delete-account" ? originSettingsPage :
    originLoginPage;

  const backButton = document.getElementById("backButton");
  const loginLink = document.getElementById("loginLink");
  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("emailInput");
  const message = document.getElementById("forgotPasswordMessage");

  if (backButton) backButton.setAttribute("href", backDestination);
  if (loginLink) loginLink.setAttribute("href", originLoginPage);

  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = backDestination;
    });
  });

  document.querySelectorAll('[data-nav="login"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = originLoginPage;
    });
  });

  function showMessage(text) {
    if (!message) return;
    message.textContent = text;
    message.hidden = false;
  }

  function hideMessage() {
    if (!message) return;
    message.textContent = "";
    message.hidden = true;
  }

  function setSubmitLoading(isLoading) {
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;
    if (!submitButton) return;

    if (isLoading) {
      submitButton.dataset.originalText = submitButton.textContent;
      submitButton.textContent = "Sending...";
      submitButton.disabled = true;
    } else {
      submitButton.textContent = submitButton.dataset.originalText || "Send Verification Code";
      submitButton.disabled = false;
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function validateEmail() {
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
      if (emailInput) {
        emailInput.classList.add("input-error");
        emailInput.focus();
      }
      showMessage("Please enter your email address.");
      return "";
    }

    if (!isValidEmail(email)) {
      if (emailInput) {
        emailInput.classList.add("input-error");
        emailInput.focus();
      }
      showMessage("Please enter a valid email address.");
      return "";
    }

    if (emailInput) emailInput.classList.remove("input-error");
    return email;
  }

  if (emailInput) {
    emailInput.required = true;
    emailInput.addEventListener("input", () => {
      emailInput.classList.remove("input-error");
      hideMessage();
    });
    emailInput.focus();
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = validateEmail();
      if (!email) return;

      hideMessage();
      setSubmitLoading(true);

      try {
        const response = await fetch("api/send-password-reset-code.php", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: email,
            role: origin,
            method: "email",
          }),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok || !result.token) {
          showMessage(result.message || "Unable to send the verification code. Please try again.");
          return;
        }

        sessionStorage.setItem("resetIdentifier", email);
        sessionStorage.setItem("resetMethod", "email");

        window.location.href =
          `verification-code.html?from=${encodeURIComponent(result.role || origin || "student")}&token=${encodeURIComponent(result.token)}`;
      } catch (error) {
        showMessage("Unable to connect to the server. Please try again.");
      } finally {
        setSubmitLoading(false);
      }
    });
  }
});
