// Login JS
document.addEventListener("DOMContentLoaded", () => {

  const NAV_TARGETS = {
    "back": "landingpage.html",
    "forgot-password": "forgot-password.html",
    "create-student-account": "create-student-account.html",
    "create-faculty-account": "create-faculty-account.html",
  };

  Object.entries(NAV_TARGETS).forEach(([navKey, targetPage]) => {
    document.querySelectorAll(`[data-nav="${navKey}"]`).forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = targetPage;
      });
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

  const loginForm = document.getElementById("loginForm");
  const identifierInput = document.getElementById("loginIdentifier");
  const passwordInput = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");
  const identifierFormatError = document.getElementById("identifierFormatError");

  const ID_NUMBER_PATTERN = /^\d{2}-\d{5}$/;
  const ID_DIGIT_COUNT = 7;
  const EMAIL_MAX_LENGTH = 254;
  const EMAIL_LOCAL_MAX_LENGTH = 64;

  const MESSAGES = {
    identifierEmpty: "Please enter your email or ID Number.",
    idFormat: "ID Number must be in the format XX-XXXXX (e.g. 24-00000).",
    emailFormat: "Please enter a valid email address (e.g. name@example.com).",
    passwordEmpty: "Please enter your password.",
    invalidCredentials: "Incorrect email/ID Number or password.",
  };

  function looksLikeEmail(value) {
    return value.includes("@");
  }

  function isValidEmail(value) {
    if (value.length > EMAIL_MAX_LENGTH) return false;
    if (/\s/.test(value)) return false;

    const parts = value.split("@");
    if (parts.length !== 2) return false;

    const [localPart, domain] = parts;

    if (localPart.length < 1 || localPart.length > EMAIL_LOCAL_MAX_LENGTH) return false;
    if (!/^[A-Za-z0-9._%+-]+$/.test(localPart)) return false;
    if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
    if (localPart.includes("..")) return false;

    const labels = domain.split(".");
    if (labels.length < 2) return false;

    const labelPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
    if (!labels.every((label) => labelPattern.test(label))) return false;

    const topLevelDomain = labels[labels.length - 1];
    return /^[A-Za-z]{2,}$/.test(topLevelDomain);
  }

  function correctedCommonEmailDomain(value) {
    const atIndex = value.lastIndexOf("@");
    if (atIndex <= 0) return value;

    const localPart = value.slice(0, atIndex);
    const domain = value.slice(atIndex + 1).toLowerCase();
    const domainCorrections = {
      "gamial.com": "gmail.com",
      "gamil.com": "gmail.com",
      "gmial.com": "gmail.com",
      "gmai.com": "gmail.com",
    };
    const correctedDomain = domainCorrections[domain];

    return correctedDomain ? `${localPart}@${correctedDomain}` : value;
  }

  function validateIdentifier(value) {
    if (!value) return MESSAGES.identifierEmpty;

    if (looksLikeEmail(value)) {
      return isValidEmail(value) ? "" : MESSAGES.emailFormat;
    }

    return ID_NUMBER_PATTERN.test(value) ? "" : MESSAGES.idFormat;
  }

  function showIdentifierError(message) {
    identifierFormatError.textContent = message;
    identifierFormatError.hidden = false;
  }

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
  }

  function clearMessages() {
    identifierFormatError.hidden = true;
    loginError.hidden = true;
  }

  identifierInput.maxLength = EMAIL_MAX_LENGTH;

  function formatIdNumber(value) {
    const digits = value.replace(/\D/g, "").slice(0, ID_DIGIT_COUNT);
    return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
  }

  identifierInput.addEventListener("input", () => {
    if (/^[\d-]*$/.test(identifierInput.value)) {
      identifierInput.value = formatIdNumber(identifierInput.value);
    }
    clearMessages();
  });

  passwordInput.addEventListener("input", clearMessages);

  async function logIn(identifier, password) {
    const response = await fetch("api/authenticate-user.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || MESSAGES.invalidCredentials);
    }
    return result;
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const enteredIdentifier = identifierInput.value.trim();
      const enteredPassword = passwordInput.value;

      clearMessages();

      const identifierError = validateIdentifier(enteredIdentifier);
      if (identifierError) {
        showIdentifierError(identifierError);
        identifierInput.focus();
        return;
      }

      if (!enteredPassword) {
        showLoginError(MESSAGES.passwordEmpty);
        passwordInput.focus();
        return;
      }

      try {
        let result = null;
        try {
          result = await logIn(enteredIdentifier, enteredPassword);
        } catch (loginError) {
          const correctedIdentifier = correctedCommonEmailDomain(enteredIdentifier);
          if (correctedIdentifier === enteredIdentifier) {
            throw loginError;
          }
          result = await logIn(correctedIdentifier, enteredPassword);
        }
        const role = result && result.user ? result.user.role : "";
        if (!result.tab_token || !["student", "faculty"].includes(role)) throw new Error(MESSAGES.invalidCredentials);
        sessionStorage.setItem(`profconsult_tab_token_${role}`, result.tab_token);
        sessionStorage.setItem("profconsult_tab_role", role);
        if (window.ProfConsultTheme && window.ProfConsultTheme.setUser) {
          window.ProfConsultTheme.setUser(result.user);
        }

        if (role === "faculty") {
          sessionStorage.removeItem("profconsult_faculty_auto_checkin_shown");
          sessionStorage.setItem("profConsultFacultyJustLoggedIn", "1");
          window.location.href = "faculty-dashboard.html";
          return;
        }

        if (role === "student") {
          sessionStorage.removeItem("profconsult_student_quick_action_shown");
          sessionStorage.setItem("profConsultStudentJustLoggedIn", "1");
          window.location.href = "student-dashboard.html";
          return;
        }

        throw new Error(MESSAGES.invalidCredentials);
      } catch (error) {
        showLoginError(error.message || MESSAGES.invalidCredentials);
      }
    });
  }

});
