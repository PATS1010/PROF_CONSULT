// =========================================================
// VERIFY ACCOUNT PAGE
// Prof Consult
//
// Shared by:
//   Student
//   Faculty
//
// URL examples:
//   verify-account.html?from=student
//   verify-account.html?from=faculty
//
// Behavior:
//   1. Validate email or mobile number.
//   2. Save the information using sessionStorage.
//   3. If valid, immediately proceed to:
//        verify-account-code.html?from=student
//        verify-account-code.html?from=faculty
//
// =========================================================


document.addEventListener("DOMContentLoaded", () => {

  // =======================================================
  // DETERMINE REGISTRATION ORIGIN
  // =======================================================

  const params = new URLSearchParams(
    window.location.search
  );

  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";


  // =======================================================
  // CREATE ACCOUNT 2 DESTINATION
  //
  // Used by the Back button.
  // =======================================================

  const originCreateAccountPage =
    origin === "faculty"
      ? "create-faculty-account2.html"
      : "create-student-account2.html";


  // =======================================================
  // VERIFICATION CODE PAGE
  //
  // Student:
  // verify-account-code.html?from=student
  //
  // Faculty:
  // verify-account-code.html?from=faculty
  // =======================================================

  const verificationCodePage =
    `verify-account-code.html?from=${origin}`;

  const registrationStorageKey =
    origin === "faculty"
      ? "findprof_faculty_registration_step2"
      : "findprof_registration_step2_student";

  let savedRegistration = {};

  try {
    savedRegistration = JSON.parse(
      sessionStorage.getItem(registrationStorageKey) || "{}"
    );
  } catch {
    savedRegistration = {};
  }


  // =======================================================
  // BACK BUTTON
  // =======================================================

  const backButton =
    document.getElementById("backButton");

  if (backButton) {

    backButton.setAttribute(
      "href",
      originCreateAccountPage
    );

    backButton.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        window.location.href =
          originCreateAccountPage;

      }
    );
  }


  // =======================================================
  // GET FORM ELEMENTS
  // =======================================================

  const form =
    document.getElementById(
      "verificationForm"
    );

  const emailInput =
    document.getElementById(
      "emailInput"
    );

  const mobileInput =
    document.getElementById(
      "mobileInput"
    );

  const emailInputWrapper =
    document.getElementById(
      "emailInputWrapper"
    );

  const mobileInputWrapper =
    document.getElementById(
      "mobileInputWrapper"
    );

  const switchMethod =
    document.getElementById(
      "switchMethod"
    );

  const methodText =
    document.getElementById(
      "methodText"
    );

  const methodSuffix =
    document.getElementById(
      "methodSuffix"
    );

  const subtitle =
    document.getElementById(
      "verificationSubtitle"
    );

  const message =
    document.getElementById(
      "verificationMessage"
    );

  const sendCodeButton =
    document.getElementById(
      "sendCodeButton"
    );


  // =======================================================
  // CURRENT INPUT MODE
  // =======================================================

  let currentMode = "email";

  const savedEmail =
    savedRegistration.email || "";

  const savedMobile =
    savedRegistration.mobile ||
    savedRegistration.contactNumber ||
    "";


  // =======================================================
  // SHOW VALIDATION MESSAGE
  // =======================================================

  function showMessage(text) {

    if (!message) {
      return;
    }

    message.textContent = text;
    message.hidden = false;

  }


  // =======================================================
  // HIDE VALIDATION MESSAGE
  // =======================================================

  function hideMessage() {

    if (!message) {
      return;
    }

    message.textContent = "";
    message.hidden = true;

  }


  // =======================================================
  // EMAIL VALIDATION
  // =======================================================

  function isValidEmail(email) {

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return emailPattern.test(email);

  }


  // =======================================================
  // PHILIPPINE MOBILE VALIDATION
  //
  // Example:
  // 9171234567
  //
  // Exactly 10 digits.
  // First digit must be 9.
  // =======================================================

  function isValidMobile(mobile) {

    return /^9\d{9}$/.test(mobile);

  }


  // =======================================================
  // NORMALIZE MOBILE
  //
  // 9171234567
  //      ↓
  // +639171234567
  // =======================================================

  function normalizeMobile(mobile) {

    return `+63${mobile}`;

  }


  // =======================================================
  // PARSE API RESPONSE
  // =======================================================

  async function parseJsonResponse(response) {

    const rawResponse =
      await response.text();

    if (!rawResponse) {
      return {
        ok: false,
        message:
          "The server returned an empty response."
      };
    }

    try {
      return JSON.parse(rawResponse);
    } catch {
      return {
        ok: false,
        message:
          "The server did not return JSON."
      };
    }
  }


  // =======================================================
  // SET EMAIL MODE
  // =======================================================

  function setEmailMode() {

    currentMode = "email";

    emailInputWrapper.hidden = false;
    mobileInputWrapper.hidden = true;

    emailInput.required = true;
    mobileInput.required = false;

    emailInput.classList.remove(
      "input-error"
    );

    mobileInput.classList.remove(
      "input-error"
    );

    subtitle.textContent =
      "Enter your Email Address to receive a verification code.";

    methodText.textContent =
      "Enter";

    switchMethod.textContent =
      "Mobile Number";

    methodSuffix.textContent =
      "instead";

    hideMessage();

    setTimeout(() => {

      emailInput.focus();

    }, 0);

  }


  // =======================================================
  // SET MOBILE MODE
  // =======================================================

  function setMobileMode() {

    currentMode = "mobile";

    emailInputWrapper.hidden = true;
    mobileInputWrapper.hidden = false;

    emailInput.required = false;
    mobileInput.required = true;

    emailInput.classList.remove(
      "input-error"
    );

    mobileInput.classList.remove(
      "input-error"
    );

    subtitle.textContent =
      "Enter your Mobile Number to receive a verification code.";

    methodText.textContent =
      "Enter";

    switchMethod.textContent =
      "Email Address";

    methodSuffix.textContent =
      "instead";

    hideMessage();

    setTimeout(() => {

      mobileInput.focus();

    }, 0);

  }


  // =======================================================
  // EMAIL / MOBILE TOGGLE
  // =======================================================

  if (switchMethod) {

    const methodRow =
      switchMethod.closest(
        ".reset-method-text"
      );

    if (methodRow) {
      methodRow.hidden = true;
    }

  }


  // =======================================================
  // MOBILE INPUT
  // =======================================================

  if (mobileInput) {

    mobileInput.addEventListener(
      "input",
      () => {

        mobileInput.value =
          mobileInput.value.replace(
            /\D/g,
            ""
          );

        if (
          mobileInput.value.length > 10
        ) {

          mobileInput.value =
            mobileInput.value.substring(
              0,
              10
            );

        }

        mobileInput.classList.remove(
          "input-error"
        );

        hideMessage();

      }
    );

  }


  // =======================================================
  // EMAIL INPUT
  // =======================================================

  if (emailInput) {

    emailInput.addEventListener(
      "input",
      () => {

        emailInput.classList.remove(
          "input-error"
        );

        hideMessage();

      }
    );

  }


  // =======================================================
  // VALIDATE INPUT
  // =======================================================

  function validateInput() {

    // =====================================================
    // EMAIL MODE
    // =====================================================

    if (currentMode === "email") {

      const email =
        emailInput.value.trim();

      if (!email) {

        emailInput.classList.add(
          "input-error"
        );

        showMessage(
          "Please enter your email address."
        );

        emailInput.focus();

        return null;

      }


      if (!isValidEmail(email)) {

        emailInput.classList.add(
          "input-error"
        );

        showMessage(
          "Please enter a valid email address."
        );

        emailInput.focus();

        return null;

      }


      emailInput.classList.remove(
        "input-error"
      );

      return email;

    }


    // =====================================================
    // MOBILE MODE
    // =====================================================

    const mobile =
      mobileInput.value.trim();


    if (!mobile) {

      mobileInput.classList.add(
        "input-error"
      );

      showMessage(
        "Please enter your mobile number."
      );

      mobileInput.focus();

      return null;

    }


    if (!isValidMobile(mobile)) {

      mobileInput.classList.add(
        "input-error"
      );

      showMessage(
        "Please enter a valid 10-digit Philippine mobile number starting with 9."
      );

      mobileInput.focus();

      return null;

    }


    mobileInput.classList.remove(
      "input-error"
    );

    return normalizeMobile(mobile);

  }


  // =======================================================
  // FORM SUBMISSION
  //
  // IMPORTANT:
  //
  // There is NO backend yet.
  //
  // If the email/mobile is valid:
  //   → save information
  //   → proceed directly to verification-code page
  //
  // We DO NOT show the old backend notice anymore.
  // =======================================================

  if (form) {

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        // Validate email/mobile
        const identifier =
          validateInput();


        // Invalid input:
        // stay on this page.
        if (!identifier) {
          return;
        }

        if (currentMode !== "email") {

          showMessage(
            "Verification codes are sent to your email address. Your contact number is saved for your account."
          );

          setEmailMode();

          return;
        }

        if (sendCodeButton) {
          sendCodeButton.disabled = true;
          sendCodeButton.textContent = "Sending...";
        }

        try {

          const response =
            await fetch(
              "api/request-account-verification-code.php",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  role: origin,
                  email: identifier
                })
              }
            );

          const result =
            await parseJsonResponse(response);

          if (!response.ok || !result.ok) {
            throw new Error(
              result.message ||
              "Unable to send verification code."
            );
          }


        // =================================================
        // SAVE VERIFICATION INFORMATION
        // =================================================

        sessionStorage.setItem(
          "verificationIdentifier",
          identifier
        );

        sessionStorage.setItem(
          "verificationMethod",
          "email"
        );

        sessionStorage.setItem(
          "verificationOrigin",
          origin
        );

          sessionStorage.setItem(
            "accountVerificationToken",
            result.token
          );


        // =================================================
        // PROCEED TO VERIFICATION CODE PAGE
        // =================================================

        window.location.href =
          verificationCodePage;

        } catch (error) {

          showMessage(
            error.message ||
            "Unable to send verification code."
          );

        } finally {

          if (sendCodeButton) {
            sendCodeButton.disabled = false;
            sendCodeButton.textContent =
              "Send Verification Code";
          }
        }

      }
    );

  }


  // =======================================================
  // INITIAL STATE
  // =======================================================

  if (emailInput && savedEmail) {
    emailInput.value = savedEmail;
  }

  if (mobileInput && savedMobile) {
    mobileInput.value =
      savedMobile.replace(/\D/g, "").slice(0, 10);
  }

  setEmailMode();

});
