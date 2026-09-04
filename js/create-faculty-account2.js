// SYSTEM NOTE: Controls client-side behavior for the create faculty account2 page, including UI events and API calls.
// =========================================================
// CREATE FACULTY ACCOUNT (PAGE 2) INTERACTIONS
// - Back -> create-faculty-account.html
// - Email Address: validated with the same rule used on the
//   Student Account page (must contain "@" and end in ".com")
// - Contact Number: auto-formats to 912-345-6789 (+63 fixed prefix)
// - Password / Confirm Password: independent Show/Hide toggles
// - Validates email, contact number, password rules, and terms
//   checkbox
// - On success: shows a success message, then redirects to
//   faculty-login.html after ~2 seconds
// - Login link -> faculty-login.html
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Back -> create-faculty-account.html
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "create-faculty-account.html";
    });
  });

  // ---------------------------------------------------------
  // Login link -> faculty-login.html
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="login"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "faculty-login.html";
    });
  });

  // ---------------------------------------------------------
  // Contact Number: digits only, auto-formatted as 912-345-6789
  // (10 digits total, hyphens inserted automatically)
  // ---------------------------------------------------------
  const contactNumberInput = document.getElementById("contactNumber");
  if (contactNumberInput) {
    contactNumberInput.addEventListener("input", () => {
      const digitsOnly = contactNumberInput.value.replace(/\D/g, "").slice(0, 10);

      let formatted = digitsOnly;
      if (digitsOnly.length > 6) {
        formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
      } else if (digitsOnly.length > 3) {
        formatted = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
      }

      contactNumberInput.value = formatted;
    });
  }

  // ---------------------------------------------------------
  // Password Show/Hide toggles -- each works independently
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

  // ---------------------------------------------------------
  // Form validation + submit
  // ---------------------------------------------------------
  const form = document.getElementById("createFacultyAccountStep2Form");
  const emailInput = document.getElementById("emailAddress");
  const emailError = document.getElementById("emailError");
  const contactNumberError = document.getElementById("contactNumberError");
  const passwordInput = document.getElementById("password");
  const passwordFieldError = document.getElementById("passwordFieldError");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const passwordError = document.getElementById("passwordError");
  const agreeTermsInput = document.getElementById("agreeTerms");
  const successMessage = document.getElementById("successMessage");

  function isValidEmail(value) {
    // Same rule as the Student Account page: must contain "@" and ".com",
    // with characters on both sides of each
    return /^[^\s@]+@[^\s@]+\.com$/i.test(value.trim());
  }

  function isValidContactNumber(value) {
    // Exactly 10 digits once hyphens are stripped (e.g. 912-345-6789)
    return value.replace(/\D/g, "").length === 10;
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      let isValid = true;

      // Email
      const emailOk = isValidEmail(emailInput.value);
      emailError.hidden = emailOk;
      if (!emailOk) isValid = false;

      // Contact Number
      const contactNumberOk = isValidContactNumber(contactNumberInput.value);
      contactNumberError.hidden = contactNumberOk;
      if (!contactNumberOk) isValid = false;

      // Password: length -> uppercase -> number -> mismatch, in that
      // order. Only the single most relevant message is shown at a time,
      // matching the requirements listed under the Password field.
      let passwordFieldOk = true;

      if (passwordInput.value.length < 8) {
        passwordFieldError.textContent = "Password must contain at least 8 characters.";
        passwordFieldError.hidden = false;
        passwordFieldOk = false;
      } else if (!/[A-Z]/.test(passwordInput.value)) {
        passwordFieldError.textContent = "Password must contain at least one uppercase letter.";
        passwordFieldError.hidden = false;
        passwordFieldOk = false;
      } else if (!/[0-9]/.test(passwordInput.value)) {
        passwordFieldError.textContent = "Password must contain at least one number.";
        passwordFieldError.hidden = false;
        passwordFieldOk = false;
      } else {
        passwordFieldError.hidden = true;
      }

      if (!passwordFieldOk) {
        isValid = false;
      }

      // Confirm Password: only checked once the Password field itself
      // is valid, so we're not showing a mismatch message alongside
      // an empty/too-short Password message at the same time.
      if (passwordFieldOk) {
        const passwordsMatch = passwordInput.value === confirmPasswordInput.value;
        passwordError.hidden = passwordsMatch;
        if (!passwordsMatch) isValid = false;
      } else {
        passwordError.hidden = true;
      }

      // Terms checkbox
      if (!agreeTermsInput.checked) {
        isValid = false;
      }

      if (!isValid) {
        successMessage.hidden = true;
        return;
      }

      const stepOne = JSON.parse(sessionStorage.getItem("findprof_registration") || "{}");
      if (stepOne.role !== "faculty") {
        passwordFieldError.textContent = "Please complete the first registration step.";
        passwordFieldError.hidden = false;
        return;
      }
      try {
        const response = await fetch("api/register.php", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...stepOne, email: emailInput.value.trim(), phone: contactNumberInput.value, password: passwordInput.value })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to create account.");
        sessionStorage.removeItem("findprof_registration");
        successMessage.hidden = false;
        window.setTimeout(() => { window.location.href = "faculty-login.html"; }, 1200);
      } catch (error) {
        passwordFieldError.textContent = error.message;
        passwordFieldError.hidden = false;
      }
    });
  }

});
