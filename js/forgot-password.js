// =========================================================
// FORGOT PASSWORD PAGE INTERACTIONS
//
// This page is shared by:
//   Student Login
//   Faculty Login
//
// URL examples:
//
//   forgot-password.html?from=student
//   forgot-password.html?from=faculty
//
// The page starts in EMAIL mode.
//
// Clicking "mobile number":
//   - Changes the page to mobile mode
//   - Shows +63 on the left
//   - Accepts only Philippine mobile numbers
//
// Clicking "email address":
//   - Changes the page back to email mode
//
// EMAIL:
//   Example:
//   student@example.com
//
// MOBILE:
//   User enters:
//   9171234567
//
//   Backend receives:
//   +639171234567
//
// =========================================================


document.addEventListener("DOMContentLoaded", () => {


  // =========================================================
  // DETERMINE LOGIN ORIGIN
  // =========================================================

  const params =
    new URLSearchParams(window.location.search);

  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";


  // Determine where Back/Login should return.
  const originLoginPage =
    origin === "faculty"
      ? "faculty-login.html"
      : "student-login.html";


  // =========================================================
  // NAVIGATION ELEMENTS
  // =========================================================

  const backButton =
    document.getElementById("backButton");


  if (backButton) {

    backButton.setAttribute(
      "href",
      originLoginPage
    );

  }


  // =========================================================
  // BACK BUTTON
  // =========================================================

  document
    .querySelectorAll('[data-nav="back"]')
    .forEach((link) => {

      link.addEventListener("click", (event) => {

        event.preventDefault();

        window.location.href =
          originLoginPage;

      });

    });


  // =========================================================
  // GET FORM ELEMENTS
  // =========================================================

  const form =
    document.getElementById(
      "forgotPasswordForm"
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


  const sendCodeButton =
    document.getElementById(
      "sendCodeButton"
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
      "forgotPasswordSubtitle"
    );


  const message =
    document.getElementById(
      "forgotPasswordMessage"
    );


  // =========================================================
  // CURRENT INPUT MODE
  //
  // Starts as EMAIL.
  // =========================================================

  let currentMode = "email";


  // =========================================================
  // SHOW ERROR MESSAGE
  // =========================================================

  function showMessage(text) {

    if (!message) {
      return;
    }

    message.textContent = text;

    message.hidden = false;

  }


  // =========================================================
  // HIDE ERROR MESSAGE
  // =========================================================

  function hideMessage() {

    if (!message) {
      return;
    }

    message.textContent = "";

    message.hidden = true;

  }


  // =========================================================
  // EMAIL VALIDATION
  //
  // Examples of valid emails:
  //
  // student@gmail.com
  // john.doe@example.com
  // user123@domain.ph
  //
  // =========================================================

  function isValidEmail(email) {

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return emailPattern.test(email);

  }


  // =========================================================
  // MOBILE NUMBER VALIDATION
  //
  // Philippine mobile number format:
  //
  // 9171234567
  //
  // Exactly 10 digits.
  //
  // First digit must be 9.
  //
  // The +63 is NOT entered by the user.
  // It is automatically added.
  // =========================================================

  function isValidMobile(mobile) {

    return /^9\d{9}$/.test(mobile);

  }


  // =========================================================
  // NORMALIZE MOBILE NUMBER
  //
  // Input:
  //
  // 9171234567
  //
  // Output:
  //
  // +639171234567
  // =========================================================

  function normalizeMobile(mobile) {

    return `+63${mobile}`;

  }


  // =========================================================
  // SWITCH TO EMAIL MODE
  // =========================================================

  function setEmailMode() {

    currentMode = "email";


    // Show email
    emailInputWrapper.hidden = false;


    // Hide mobile
    mobileInputWrapper.hidden = true;


    // Form requirements
    emailInput.required = true;

    mobileInput.required = false;


    // Remove old error states
    emailInput.classList.remove(
      "input-error"
    );

    mobileInput.classList.remove(
      "input-error"
    );


    // Update description
    subtitle.textContent =
      "Enter your Email Address to receive a verification code.";


    // Update toggle
    methodText.textContent =
      "Enter";

    switchMethod.textContent =
      "Mobile Number";

    methodSuffix.textContent =
      "instead";


    // Hide old error
    hideMessage();


    // Focus email
    setTimeout(() => {

      emailInput.focus();

    }, 0);

  }


  // =========================================================
  // SWITCH TO MOBILE MODE
  // =========================================================

  function setMobileMode() {

    currentMode = "mobile";


    // Hide email
    emailInputWrapper.hidden = true;


    // Show mobile
    mobileInputWrapper.hidden = false;


    // Form requirements
    emailInput.required = false;

    mobileInput.required = true;


    // Remove old error states
    emailInput.classList.remove(
      "input-error"
    );

    mobileInput.classList.remove(
      "input-error"
    );


    // Update description
    subtitle.textContent =
      "Enter your Mobile Number to receive a verification code.";


    // Update toggle
    methodText.textContent =
      "Enter";

    switchMethod.textContent =
      "Email Address";

    methodSuffix.textContent =
      "instead";


    // Hide old error
    hideMessage();


    // Focus mobile
    setTimeout(() => {

      mobileInput.focus();

    }, 0);

  }


  // =========================================================
  // EMAIL / MOBILE TOGGLE
  // =========================================================

  switchMethod.addEventListener(
    "click",
    (event) => {

      event.preventDefault();


      if (currentMode === "email") {

        setMobileMode();

      } else {

        setEmailMode();

      }

    }
  );


  // =========================================================
  // MOBILE INPUT
  //
  // Only numbers are allowed.
  //
  // Letters and special characters are automatically removed.
  //
  // Maximum 10 digits.
  // =========================================================

  mobileInput.addEventListener(
    "input",
    () => {


      // Remove non-numeric characters.
      mobileInput.value =
        mobileInput.value.replace(
          /\D/g,
          ""
        );


      // Maximum 10 digits.
      if (
        mobileInput.value.length > 10
      ) {

        mobileInput.value =
          mobileInput.value.substring(
            0,
            10
          );

      }


      // Remove error state while typing.
      mobileInput.classList.remove(
        "input-error"
      );


      hideMessage();

    }
  );


  // =========================================================
  // EMAIL INPUT
  // =========================================================

  emailInput.addEventListener(
    "input",
    () => {

      emailInput.classList.remove(
        "input-error"
      );

      hideMessage();

    }
  );


  // =========================================================
  // VALIDATE INPUT
  //
  // Returns:
  //
  // Email:
  //   student@example.com
  //
  // Mobile:
  //   +639171234567
  //
  // Returns null if invalid.
  // =========================================================

  function validateInput() {


    // =======================================================
    // EMAIL MODE
    // =======================================================

    if (currentMode === "email") {

      const email =
        emailInput.value.trim();


      // Empty
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


      // Invalid format
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


      // Valid
      emailInput.classList.remove(
        "input-error"
      );

      return email;

    }


    // =======================================================
    // MOBILE MODE
    // =======================================================

    const mobile =
      mobileInput.value.trim();


    // Empty
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


    // Invalid format
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


    // Valid
    mobileInput.classList.remove(
      "input-error"
    );


    // Add +63
    return normalizeMobile(mobile);

  }


  // =========================================================
  // FORM SUBMISSION
  // =========================================================

  if (form) {

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        // ===================================================
        // VALIDATE FIRST
        //
        // No API request is made if invalid.
        // ===================================================

        const identifier =
          validateInput();


        if (!identifier) {

          return;

        }


        // ===================================================
        // DISABLE BUTTON
        // ===================================================

        sendCodeButton.disabled = true;

        sendCodeButton.textContent =
          "Sending...";


        try {


          // =================================================
          // SEND REQUEST TO PHP
          // =================================================

          const response =
            await fetch(
              "api/request-reset-code.php",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({

                  identifier:
                    identifier,

                  role:
                    origin

                })

              }
            );


          // =================================================
          // READ RESPONSE
          // =================================================

          const result =
            await response.json();


          // =================================================
          // SERVER ERROR
          // =================================================

          if (
            !response.ok ||
            !result.ok
          ) {

            showMessage(
              result.message ||
              "Unable to send verification code."
            );

            return;

          }


          // =================================================
          // SAVE IDENTIFIER
          //
          // Used by the next reset-password pages.
          // =================================================

          sessionStorage.setItem(
            "resetIdentifier",
            identifier
          );


          // Save whether the user used email or mobile.
          sessionStorage.setItem(
            "resetMethod",
            currentMode
          );


          // =================================================
          // GO TO VERIFICATION PAGE
          //
          // Preserve the origin:
          //
          // student
          // faculty
          // =================================================

          window.location.href =
            `verification-code.html?from=${origin}&token=${encodeURIComponent(result.token)}`;

        }


        // ===================================================
        // CONNECTION ERROR
        // ===================================================

        catch (error) {

          console.error(
            "Forgot password request failed:",
            error
          );


          showMessage(
            "Unable to connect to the server. Please try again."
          );

        }


        // ===================================================
        // RE-ENABLE BUTTON
        // ===================================================

        finally {

          sendCodeButton.disabled = false;

          sendCodeButton.textContent =
            "Send Verification Code";

        }

      }
    );

  }


  // =========================================================
  // INITIAL STATE
  //
  // The page ALWAYS starts with EMAIL.
  // =========================================================

  setEmailMode();

});
