// Verify Account JS
document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(
    window.location.search
  );

  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";

  const originCreateAccountPage =
    origin === "faculty"
      ? "create-faculty-account2.html"
      : "create-student-account2.html";

  const verificationCodePage =
    `verify-account-code.html?from=${origin}`;

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

  let currentMode = "email";

  const savedEmail =
    sessionStorage.getItem(
      "verificationEmail"
    ) || "";

  if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
  }

  function showMessage(text) {

    if (!message) {
      return;
    }

    message.textContent = text;
    message.hidden = false;

  }

  function hideMessage() {

    if (!message) {
      return;
    }

    message.textContent = "";
    message.hidden = true;

  }

  function isValidEmail(email) {

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return emailPattern.test(email);

  }

  function isValidMobile(mobile) {

    return /^9\d{9}$/.test(mobile);

  }

  function normalizeMobile(mobile) {

    return `+63${mobile}`;

  }

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

  if (switchMethod) {

    switchMethod.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        if (currentMode === "email") {

          showMessage(
            "Email verification is available right now. Please use your email address."
          );

          return;

        } else {

          setEmailMode();

        }

      }
    );

  }

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

  function validateInput() {

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

  if (form) {

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const identifier =
          validateInput();

        if (!identifier) {
          return;
        }

        if (currentMode !== "email") {
          showMessage(
            "Email verification is available right now. Please use your email address."
          );

          return;
        }

        try {

          const response =
            await fetch(
              "api/request-account-verification-code.php",
              {
                method: "POST",

                credentials:
                  "same-origin",

                headers: {
                  "Content-Type":
                    "application/json",

                  "Accept":
                    "application/json"
                },

                body: JSON.stringify({
                  role: origin,
                  method: "email",
                  identifier,
                  email: identifier
                })
              }
            );

          const result =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok || !result.ok) {
            throw new Error(
              result.message ||
              "Unable to request a verification code."
            );
          }

          sessionStorage.setItem(
            "verificationIdentifier",
            identifier
          );

          sessionStorage.setItem(
            "verificationEmail",
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
            "verificationToken",
            result.token || ""
          );

          window.location.href =
            verificationCodePage;

        } catch (error) {

          showMessage(
            error.message ||
            "Unable to request a verification code."
          );

        }

      }
    );

  }

  setEmailMode();

});
