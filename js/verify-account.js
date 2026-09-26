// SYSTEM NOTE: Sends a real email OTP for account verification before registration.

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";

  const originCreateAccountPage =
    origin === "faculty"
      ? "create-faculty-account2.html"
      : "create-student-account2.html";

  const verificationCodePage = `verify-account-code.html?from=${origin}`;
  const step2StorageKey =
    origin === "faculty"
      ? "findprof_faculty_registration_step2"
      : "findprof_registration_step2_student";

  const backButton = document.getElementById("backButton");
  const form = document.getElementById("verificationForm");
  const emailInput = document.getElementById("emailInput");
  const subtitle = document.getElementById("verificationSubtitle");
  const message = document.getElementById("verificationMessage");
  const sendCodeButton = document.getElementById("sendCodeButton");

  function getSavedStep2Data() {
    try {
      return JSON.parse(sessionStorage.getItem(step2StorageKey) || "{}");
    } catch {
      return {};
    }
  }

  const savedStep2Data = getSavedStep2Data();
  const savedEmail = (savedStep2Data.email || "").trim();

  if (savedEmail && emailInput) emailInput.value = savedEmail;

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
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
  }

  function normalizeEmail(email) {
    const cleaned = String(email || "").trim().replace(/\s+/g, "");
    const parts = cleaned.split("@");
    if (parts.length !== 2) return cleaned.toLowerCase();

    const domain = parts[1].replace(/,/g, ".").replace(/\.+/g, ".");
    return `${parts[0]}@${domain}`.toLowerCase();
  }

  function setEmailMode() {
    emailInput.required = true;
    emailInput.classList.remove("input-error");
    subtitle.textContent = "Enter your Email Address to receive a verification code.";
    hideMessage();
    setTimeout(() => emailInput.focus(), 0);
  }

  if (emailInput) {
    emailInput.addEventListener("input", () => {
      emailInput.classList.remove("input-error");
      hideMessage();
    });
  }

  function validateInput() {
    const email = emailInput.value.trim();
    const normalizedEmail = normalizeEmail(email);
    if (emailInput.value !== normalizedEmail) {
      emailInput.value = normalizedEmail;
    }
    if (!email) {
      emailInput.classList.add("input-error");
      showMessage("Please enter your email address.");
      emailInput.focus();
      return null;
    }
    if (!isValidEmail(normalizedEmail)) {
      emailInput.classList.add("input-error");
      showMessage("Please enter a valid email address.");
      emailInput.focus();
      return null;
    }
    emailInput.classList.remove("input-error");
    return normalizedEmail;
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const identifier = validateInput();
      if (!identifier) return;

      if (sendCodeButton) {
        sendCodeButton.disabled = true;
        sendCodeButton.textContent = "Sending...";
      }

      try {
        const response = await fetch("api/request-account-verification-code.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: identifier,
            identifier,
            method: "email",
            role: origin,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          showMessage(result.message || "Unable to send verification code.");
          return;
        }

        sessionStorage.setItem("accountVerificationToken", result.token);
        sessionStorage.setItem("accountVerificationEmail", identifier);
        sessionStorage.setItem("accountVerificationRole", origin);
        sessionStorage.setItem("verificationIdentifier", identifier);
        sessionStorage.setItem("verificationMethod", "email");
        sessionStorage.setItem("verificationOrigin", origin);

        window.location.href = verificationCodePage;
      } catch (error) {
        console.error("Account verification request failed:", error);
        showMessage("Unable to connect to the server. Please try again.");
      } finally {
        if (sendCodeButton) {
          sendCodeButton.disabled = false;
          sendCodeButton.textContent = "Send Verification Code";
        }
      }
    });
  }

  setEmailMode();
});
