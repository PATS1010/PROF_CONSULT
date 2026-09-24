// =========================================================
// FORGOT PASSWORD PAGE INTERACTIONS
// Shared by Student Login, Faculty Login, and Change Password.
//
// URL params:
//   from=student | from=faculty
//     -> which role this page belongs to
//   context=change-password (optional)
//     -> if present, this page was reached from Change Password,
//        not from a Login page's "Forgot Password?" link, so
//        Back must return to Change Password instead of Login.
//
// Examples:
//   forgot-password.html?from=student
//     -> came from Student Login, Back -> student-login.html
//   forgot-password.html?from=faculty&context=change-password
//     -> came from Faculty Change Password,
//        Back -> change-password.html?from=faculty
//
// Supports Email or Mobile Number as the reset identifier.
// Frontend-only: no backend call — validates, then goes straight
// to verification-code.html, carrying the origin and identifier.
//
// IMPORTANT: visibility of the email vs mobile input is controlled
// ONLY by setting element.style.display directly in this file.
// Do not reintroduce [hidden] or a CSS class for this.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";
  const cameFromChangePassword = params.get("context") === "change-password";

  const originLoginPage = origin === "faculty" ? "faculty-login.html" : "student-login.html";
  const originChangePasswordPage = `change-password.html?from=${origin}`;

  // Where the Back button (and any [data-nav="back"] element) should go.
  const backDestination = cameFromChangePassword
    ? originChangePasswordPage
    : originLoginPage;

  const backButton = document.getElementById("backButton");
  const loginLink = document.getElementById("loginLink");

  if (backButton) backButton.setAttribute("href", backDestination);

  // "Remember your password? Login" always goes to the role's Login page,
  // regardless of where Forgot Password was opened from.
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

  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("emailInput");
  const mobileInput = document.getElementById("mobileInput");
  const emailInputWrapper = document.getElementById("emailInputWrapper");
  const mobileInputWrapper = document.getElementById("mobileInputWrapper");
  const switchMethod = document.getElementById("switchMethod");
  const methodText = document.getElementById("methodText");
  const methodSuffix = document.getElementById("methodSuffix");
  const subtitle = document.getElementById("forgotPasswordSubtitle");
  const message = document.getElementById("forgotPasswordMessage");
  const sendCodeButton = document.getElementById("sendCodeButton");

  const requiredElements = {
    form, emailInput, mobileInput, emailInputWrapper,
    mobileInputWrapper, switchMethod, methodText, methodSuffix, message
  };
  for (const [name, el] of Object.entries(requiredElements)) {
    if (!el) {
      console.error(`Forgot Password page: missing element "${name}". Check that its id in the HTML matches exactly.`);
    }
  }

  let currentMode = "email";

  function showMessage(text) {
    if (!message) return;
    message.textContent = text;
    message.style.display = "block";
  }

  function hideMessage() {
    if (!message) return;
    message.textContent = "";
    message.style.display = "none";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function isValidMobile(mobile) {
    return /^9\d{9}$/.test(mobile);
  }

  function normalizeMobile(mobile) {
    return `+63${mobile}`;
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

  function setEmailMode() {
    currentMode = "email";

    emailInputWrapper.style.display = "block";
    mobileInputWrapper.style.display = "none";

    emailInput.required = true;
    mobileInput.required = false;

    emailInput.classList.remove("input-error");
    mobileInput.classList.remove("input-error");

    if (subtitle) {
      subtitle.textContent = "Don't worry! Enter your Email Address to receive a verification code.";
    }

    methodText.textContent = "Enter";
    switchMethod.textContent = "Mobile Number";
    methodSuffix.textContent = "instead";

    hideMessage();
    setTimeout(() => emailInput.focus(), 0);
  }

  function setMobileMode() {
    currentMode = "mobile";

    emailInputWrapper.style.display = "none";
    mobileInputWrapper.style.display = "flex";

    emailInput.required = false;
    mobileInput.required = true;

    emailInput.classList.remove("input-error");
    mobileInput.classList.remove("input-error");

    if (subtitle) {
      subtitle.textContent = "Don't worry! Enter your Mobile Number to receive a verification code.";
    }

    methodText.textContent = "Enter";
    switchMethod.textContent = "Email Address";
    methodSuffix.textContent = "instead";

    hideMessage();
    setTimeout(() => mobileInput.focus(), 0);
  }

  switchMethod.addEventListener("click", (event) => {
    event.preventDefault();
    currentMode === "email" ? setMobileMode() : setEmailMode();
  });

  mobileInput.addEventListener("input", () => {
    mobileInput.value = mobileInput.value.replace(/\D/g, "").substring(0, 10);
    mobileInput.classList.remove("input-error");
    hideMessage();
  });

  emailInput.addEventListener("input", () => {
    emailInput.classList.remove("input-error");
    hideMessage();
  });

  function validateInput() {
    if (currentMode === "email") {
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

      if (sendCodeButton) {
        sendCodeButton.disabled = true;
        sendCodeButton.textContent = "Sending...";
      }

      try {
        const response = await fetch("api/request-reset-code.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, role: origin })
        });

        const result = await parseJsonResponse(response);

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to send verification code.");
        }

        sessionStorage.setItem("resetIdentifier", identifier);
        sessionStorage.setItem("resetMethod", currentMode);

        window.location.href =
          `verification-code.html?from=${origin}&token=${encodeURIComponent(result.token)}`;
      } catch (error) {
        showMessage(error.message || "Unable to send verification code.");
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
