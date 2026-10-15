// Verify Account JS
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";
  const originCreateAccountPage =
    origin === "faculty"
      ? "create-faculty-account2.html"
      : "create-student-account2.html";
  const verificationCodePage = `verify-account-code.html?from=${origin}`;

  const backButton = document.getElementById("backButton");
  const form = document.getElementById("verificationForm");
  const emailInput = document.getElementById("emailInput");
  const message = document.getElementById("verificationMessage");

  if (backButton) {
    backButton.setAttribute("href", originCreateAccountPage);
    backButton.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = originCreateAccountPage;
    });
  }

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

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function validateEmail() {
    const email = emailInput.value.trim();

    if (!email) {
      emailInput.classList.add("input-error");
      showMessage("Please enter your email address.");
      emailInput.focus();
      return null;
    }

    if (!isValidEmail(email)) {
      emailInput.classList.add("input-error");
      showMessage("Please enter a valid email address.");
      emailInput.focus();
      return null;
    }

    emailInput.classList.remove("input-error");
    return email;
  }

  if (emailInput) {
    emailInput.required = true;
    emailInput.addEventListener("input", () => {
      emailInput.classList.remove("input-error");
      hideMessage();
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = validateEmail();
      if (!email) return;

      try {
        const response = await fetch("api/send-account-verification-code.php", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            role: origin,
            method: "email",
            identifier: email,
            email,
          }),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to request a verification code.");
        }

        sessionStorage.setItem("verificationIdentifier", email);
        sessionStorage.setItem("verificationMethod", "email");
        sessionStorage.setItem("verificationOrigin", origin);
        sessionStorage.setItem("verificationToken", result.token || "");

        window.location.href = verificationCodePage;
      } catch (error) {
        showMessage(error.message || "Unable to request a verification code.");
      }
    });
  }

  if (emailInput) {
    emailInput.focus();
  }
});
