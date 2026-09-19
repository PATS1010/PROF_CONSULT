// =========================================================
// CHANGE PASSWORD PAGE INTERACTIONS
//
// This page is shared by:
//   Student Settings
//   Faculty Settings
//
// URL examples:
//
//   change-password.html?from=student
//   change-password.html?from=faculty
//
// Back / Cancel return to the matching Settings page.
//
// Forgot Password reuses the EXISTING Forgot Password page
// and passes the SAME origin, PLUS a "context" flag so that
// Forgot Password's Back button knows to return here instead
// of to the Login page:
//
//   forgot-password.html?from=student&context=change-password
//   forgot-password.html?from=faculty&context=change-password
//
// =========================================================


document.addEventListener("DOMContentLoaded", () => {


  // =========================================================
  // DETERMINE ORIGIN
  // =========================================================

  const params =
    new URLSearchParams(window.location.search);

  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";


  // Where Back / Cancel should return.
  const originSettingsPage =
    origin === "faculty"
      ? "faculty-settings.html"
      : "settings.html";


  // Existing Forgot Password page + existing origin system,
  // plus a context flag marking that we came from Change Password.
  const forgotPasswordPage =
    `forgot-password.html?from=${origin}&context=change-password`;


  // =========================================================
  // NAVIGATION ELEMENTS
  // =========================================================

  const backButton =
    document.getElementById("backButton");


  if (backButton) {

    backButton.setAttribute(
      "href",
      originSettingsPage
    );

  }


  const forgotPasswordLink =
    document.getElementById("forgotPasswordLink");


  if (forgotPasswordLink) {

    forgotPasswordLink.setAttribute(
      "href",
      forgotPasswordPage
    );

  }


  // =========================================================
  // BACK / CANCEL
  // =========================================================

  document
    .querySelectorAll('[data-nav="back"]')
    .forEach((element) => {

      element.addEventListener("click", (event) => {

        event.preventDefault();

        window.location.href =
          originSettingsPage;

      });

    });


  // =========================================================
  // GET FORM ELEMENTS
  // =========================================================

  const form =
    document.getElementById(
      "changePasswordForm"
    );


  const currentPassword =
    document.getElementById(
      "currentPassword"
    );


  const newPassword =
    document.getElementById(
      "newPassword"
    );


  const confirmPassword =
    document.getElementById(
      "confirmPassword"
    );


  const saveButton =
    document.getElementById(
      "saveButton"
    );


  const requirements =
    document.getElementById(
      "passwordRequirements"
    );


  const message =
    document.getElementById(
      "changePasswordMessage"
    );


  // =========================================================
  // SHOW / HIDE MESSAGE
  // =========================================================

  function showMessage(text, isSuccess) {

    if (!message) {
      return;
    }

    message.textContent = text;

    message.classList.toggle(
      "field-message-error",
      !isSuccess
    );

    message.classList.toggle(
      "field-message-success",
      Boolean(isSuccess)
    );

    message.hidden = false;

  }


  function hideMessage() {

    if (!message) {
      return;
    }

    message.textContent = "";

    message.hidden = true;

  }


  // =========================================================
  // PASSWORD SHOW / HIDE
  //
  // Each eye button controls ONLY its own input
  // through data-target.
  // =========================================================

  document
    .querySelectorAll(".password-toggle")
    .forEach((toggle) => {

      toggle.addEventListener("click", () => {

        const targetId =
          toggle.getAttribute("data-target");

        const targetInput =
          document.getElementById(targetId);


        if (!targetInput) {
          return;
        }


        const isHidden =
          targetInput.type === "password";


        targetInput.type =
          isHidden
            ? "text"
            : "password";


        toggle.classList.toggle(
          "is-visible",
          isHidden
        );


        toggle.setAttribute(
          "aria-label",
          isHidden
            ? "Hide password"
            : "Show password"
        );

      });

    });


  // =========================================================
  // PASSWORD RULES
  //
  // Exactly three requirements:
  //   8+ characters
  //   1 uppercase letter
  //   1 number
  // =========================================================

  function checkRules(value) {

    return {

      length:
        value.length >= 8,

      uppercase:
        /[A-Z]/.test(value),

      number:
        /\d/.test(value)

    };

  }


  function updateRequirements() {

    if (!requirements) {
      return;
    }


    const results =
      checkRules(newPassword.value);


    requirements
      .querySelectorAll("li")
      .forEach((item) => {

        const rule =
          item.getAttribute("data-rule");

        item.classList.toggle(
          "is-met",
          Boolean(results[rule])
        );

      });

  }


  // =========================================================
  // CLEAR ERROR STATE WHILE TYPING
  // =========================================================

  [
    currentPassword,
    newPassword,
    confirmPassword
  ].forEach((input) => {

    if (!input) {
      return;
    }

    input.addEventListener("input", () => {

      input.classList.remove(
        "input-error"
      );

      hideMessage();

      if (input === newPassword) {

        updateRequirements();

      }

    });

  });


  // =========================================================
  // VALIDATION
  // =========================================================

  function validateForm() {


    // Current Password cannot be empty.
    if (!currentPassword.value.trim()) {

      currentPassword.classList.add(
        "input-error"
      );

      showMessage(
        "Please enter your current password."
      );

      currentPassword.focus();

      return false;

    }


    // New Password requirements.
    const results =
      checkRules(newPassword.value);


    if (
      !results.length ||
      !results.uppercase ||
      !results.number
    ) {

      newPassword.classList.add(
        "input-error"
      );

      showMessage(
        "New password must be at least 8 characters and include one uppercase letter and one number."
      );

      newPassword.focus();

      return false;

    }


    // Confirm Password must match.
    if (
      confirmPassword.value !==
      newPassword.value
    ) {

      confirmPassword.classList.add(
        "input-error"
      );

      showMessage(
        "Passwords do not match."
      );

      confirmPassword.focus();

      return false;

    }


    return true;

  }


  // =========================================================
  // FORM SUBMISSION
  //
  // Frontend only.
  // =========================================================

  if (form) {

    form.addEventListener("submit", (event) => {

      event.preventDefault();


      if (!validateForm()) {

        return;

      }


      saveButton.disabled = true;


      showMessage(
        "Password changed successfully.",
        true
      );


      // Return to the correct Settings page.
      setTimeout(() => {

        window.location.href =
          originSettingsPage;

      }, 1200);

    });

  }


  // =========================================================
  // INITIAL STATE
  // =========================================================

  updateRequirements();

});