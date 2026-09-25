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
  const mobileInput = document.getElementById("mobileInput");
  const emailInputWrapper = document.getElementById("emailInputWrapper");
  const mobileInputWrapper = document.getElementById("mobileInputWrapper");
  const switchMethod = document.getElementById("switchMethod");
  const methodText = document.getElementById("methodText");
  const methodSuffix = document.getElementById("methodSuffix");
  const subtitle = document.getElementById("verificationSubtitle");
  const message = document.getElementById("verificationMessage");
  const sendCodeButton = document.getElementById("sendCodeButton");

  let currentMode = "email";

  function getSavedStep2Data() {
    try {
      return JSON.parse(sessionStorage.getItem(step2StorageKey) || "{}");
    } catch {
      return {};
    }
  }

  const savedStep2Data = getSavedStep2Data();
  const savedEmail = (savedStep2Data.email || "").trim();
  const savedMobile = (
    savedStep2Data.mobile ||
    savedStep2Data.contactNumber ||
    ""
  ).replace(/\D/g, "").slice(0, 10);

  if (savedEmail && emailInput) emailInput.value = savedEmail;
  if (savedMobile && mobileInput) mobileInput.value = savedMobile;

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

  function isValidMobile(mobile) {
    return /^9\d{9}$/.test(mobile);
  }

  function normalizeMobile(mobile) {
    return mobile.replace(/\D/g, "").slice(0, 10);
  }

  function setEmailMode() {
    currentMode = "email";
    emailInputWrapper.hidden = false;
    mobileInputWrapper.hidden = true;
    emailInput.required = true;
    mobileInput.required = false;
    emailInput.classList.remove("input-error");
    mobileInput.classList.remove("input-error");
    subtitle.textContent = "Enter your Email Address to receive a verification code.";
    methodText.textContent = "Enter";
    switchMethod.textContent = "Mobile Number";
    methodSuffix.textContent = "instead";
    hideMessage();
    setTimeout(() => emailInput.focus(), 0);
  }

  function setMobileMode() {
    currentMode = "mobile";
    emailInputWrapper.hidden = true;
    mobileInputWrapper.hidden = false;
    emailInput.required = false;
    mobileInput.required = true;
    emailInput.classList.remove("input-error");
    mobileInput.classList.remove("input-error");
    subtitle.textContent = "Enter your Mobile Number to receive a verification code by SMS.";
    methodText.textContent = "Enter";
    switchMethod.textContent = "Email Address";
    methodSuffix.textContent = "instead";
    hideMessage();
    setTimeout(() => mobileInput.focus(), 0);
  }

  if (switchMethod) {
    switchMethod.addEventListener("click", (event) => {
      event.preventDefault();
      if (currentMode === "email") {
        setMobileMode();
      } else {
        setEmailMode();
      }
    });
  }

  if (mobileInput) {
    mobileInput.addEventListener("input", () => {
      mobileInput.value = mobileInput.value.replace(/\D/g, "").slice(0, 10);
      mobileInput.classList.remove("input-error");
      hideMessage();
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", () => {
      emailInput.classList.remove("input-error");
      hideMessage();
    });
  }

  function validateInput() {
    if (currentMode === "email") {
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

    const mobile = mobileInput.value.trim();
    if (!mobile) {
      mobileInput.classList.add("input-error");
      showMessage("Please enter your mobile number.");
      mobileInput.focus();
      return null;
    }
    if (!isValidMobile(mobile)) {
      mobileInput.classList.add("input-error");
      showMessage("Please enter a valid 10-digit Philippine mobile number starting with 9.");
      mobileInput.focus();
      return null;
    }
    mobileInput.classList.remove("input-error");
    return normalizeMobile(mobile);
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const identifier = validateInput();
      if (!identifier) return;

      const emailForVerification =
        currentMode === "email" ? identifier : savedEmail;

      if (!isValidEmail(emailForVerification)) {
        showMessage("Please enter and save your email address before verifying by contact number.");
        return;
      }

      if (sendCodeButton) {
        sendCodeButton.disabled = true;
        sendCodeButton.textContent = "Sending...";
      }

      try {
        const response = await fetch("api/request-account-verification-code.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailForVerification,
            identifier,
            method: currentMode,
            role: origin,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
          showMessage(result.message || "Unable to send verification code.");
          return;
        }

        sessionStorage.setItem("accountVerificationToken", result.token);
        sessionStorage.setItem("accountVerificationEmail", emailForVerification);
        sessionStorage.setItem("accountVerificationRole", origin);
        sessionStorage.setItem("verificationIdentifier", identifier);
        sessionStorage.setItem("verificationMethod", currentMode);
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

  if (savedMobile) {
    setMobileMode();
  } else {
    setEmailMode();
  }
});
