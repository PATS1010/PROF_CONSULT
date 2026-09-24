// SYSTEM NOTE: Create student account page 2 interactions.
// Handles:
// - Remembering all entered information
// - Philippine mobile number validation
// - Verification flow
// - Preventing account creation before verification
// - Restoring "Account Verified" after returning from verification

document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "findprof_registration_step2_student";

  const emailInput = document.getElementById("emailAddress");
  const mobileInput = document.getElementById("mobileNumber");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const agreeTermsInput = document.getElementById("agreeTerms");

  const emailError = document.getElementById("emailError");
  const mobileError = document.getElementById("mobileError");
  const passwordFieldError = document.getElementById("passwordFieldError");
  const passwordError = document.getElementById("passwordError");
  const successMessage = document.getElementById("successMessage");

  const verifyButton = document.querySelector(".verify-account-button");
  const createAccountButton = document.getElementById("createAccountButton");

  let isAccountVerified =
    sessionStorage.getItem("student_account_verified") === "true";


  function resetVerification() {

    isAccountVerified = false;

    sessionStorage.removeItem(
      "student_account_verified"
    );

    sessionStorage.removeItem(
      "accountVerificationToken"
    );

    updateVerificationButton();
  }


  // =========================================================
  // LOAD SAVED INFORMATION
  // =========================================================

  function loadSavedInformation() {

    const saved = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) || "{}"
    );

    if (saved.email) {
      emailInput.value = saved.email;
    }

    if (saved.mobile) {
      mobileInput.value = saved.mobile;
    }

    if (saved.password) {
      passwordInput.value = saved.password;
    }

    if (saved.confirmPassword) {
      confirmPasswordInput.value = saved.confirmPassword;
    }

    if (saved.agreeTerms) {
      agreeTermsInput.checked = true;
    }
  }


  // =========================================================
  // SAVE INFORMATION
  // =========================================================

  function saveInformation() {

    const data = {
      email: emailInput.value.trim(),
      mobile: mobileInput.value,
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
      agreeTerms: agreeTermsInput.checked
    };

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  }


  // =========================================================
  // EMAIL VALIDATION
  // =========================================================

  function isValidEmail(value) {

    return /^[^\s@]+@[^\s@]+\.com$/i.test(
      value.trim()
    );
  }


  // =========================================================
  // PHILIPPINE MOBILE NUMBER VALIDATION
  //
  // Accepts:
  // 9171234567
  // 917-123-4567
  //
  // Since +63 is already displayed separately,
  // the input contains the 10-digit number.
  // =========================================================

  function isValidPhilippineMobile(value) {

    const digits =
      value.replace(/\D/g, "");

    // Must contain exactly 10 digits.
    if (digits.length !== 10) {
      return false;
    }

    // Philippine mobile numbers begin with 9
    // when written without the leading 0/+63.
    if (!digits.startsWith("9")) {
      return false;
    }

    // Common Philippine mobile prefixes.
    const validPrefixes = [
      "905", "906", "907", "908", "909",
      "910", "912", "913", "914", "915",
      "916", "917", "918", "919", "920",
      "921", "922", "923", "924", "925",
      "926", "927", "928", "929",
      "930", "931", "932", "933", "934",
      "935", "936", "937", "938", "939",
      "940", "941", "942", "943", "944",
      "945", "946", "947", "948", "949",
      "950", "951", "952", "953", "954",
      "955", "956", "957", "958", "959",
      "960", "961", "962", "963", "964",
      "965", "966", "967", "968", "969",
      "970", "971", "972", "973", "974",
      "975", "976", "977", "978", "979",
      "980", "981", "982", "983", "984",
      "985", "986", "987", "988", "989",
      "990", "991", "992", "993", "994",
      "995", "996", "997", "998", "999"
    ];

    return validPrefixes.includes(
      digits.substring(0, 3)
    );
  }


  // =========================================================
  // FORMAT MOBILE NUMBER
  // =========================================================

  function formatMobileNumber(value) {

    const digits =
      value
        .replace(/\D/g, "")
        .slice(0, 10);

    if (digits.length > 6) {

      return (
        `${digits.slice(0, 3)}-` +
        `${digits.slice(3, 6)}-` +
        `${digits.slice(6)}`
      );

    }

    if (digits.length > 3) {

      return (
        `${digits.slice(0, 3)}-` +
        `${digits.slice(3)}`
      );

    }

    return digits;
  }


  // =========================================================
  // MOBILE INPUT
  // =========================================================

  mobileInput.addEventListener("input", () => {

    mobileInput.value =
      formatMobileNumber(
        mobileInput.value
      );

    if (isAccountVerified) {
      resetVerification();
    }

    saveInformation();

    updateVerificationButton();
  });


  // =========================================================
  // SAVE INPUTS WHENEVER THEY CHANGE
  // =========================================================

  [
    emailInput,
    passwordInput,
    confirmPasswordInput
  ].forEach((input) => {

    input.addEventListener("input", () => {

      if (
        isAccountVerified &&
        input === emailInput
      ) {
        resetVerification();
      }

      saveInformation();

      if (
        input === emailInput ||
        input === passwordInput ||
        input === confirmPasswordInput
      ) {
        updateVerificationButton();
      }

    });

  });


  agreeTermsInput.addEventListener("change", () => {
    saveInformation();
  });


  // =========================================================
  // VERIFY BUTTON STATE
  // =========================================================

  function updateVerificationButton() {

    if (isAccountVerified) {

      verifyButton.textContent =
        "Account Verified";

      verifyButton.classList.add(
        "account-verified"
      );

      verifyButton.setAttribute(
        "aria-disabled",
        "true"
      );

      verifyButton.removeAttribute(
        "href"
      );

      return;
    }


    const emailValid =
      isValidEmail(
        emailInput.value
      );

    const mobileValid =
      isValidPhilippineMobile(
        mobileInput.value
      );


    const canVerify =
      emailValid &&
      mobileValid;


    if (canVerify) {

      verifyButton.classList.remove(
        "disabled"
      );

      verifyButton.setAttribute(
        "href",
        "verify-account.html?from=student"
      );

      verifyButton.removeAttribute(
        "aria-disabled"
      );

    } else {

      verifyButton.classList.add(
        "disabled"
      );

      verifyButton.setAttribute(
        "aria-disabled",
        "true"
      );

      verifyButton.removeAttribute(
        "href"
      );
    }
  }


  // =========================================================
  // VERIFY ACCOUNT BUTTON
  // =========================================================

  verifyButton.addEventListener("click", (event) => {

    if (isAccountVerified) {

      event.preventDefault();

      return;
    }


    const emailValid =
      isValidEmail(
        emailInput.value
      );

    const mobileValid =
      isValidPhilippineMobile(
        mobileInput.value
      );


    if (!emailValid || !mobileValid) {

      event.preventDefault();


      if (!emailValid) {

        emailError.textContent =
          "Please enter a valid email address.";

        emailError.hidden = false;
      }


      if (!mobileValid) {

        mobileError.textContent =
          "Please enter a valid Philippine mobile number.";

        mobileError.hidden = false;
      }

      return;
    }


    saveInformation();
  });


  // =========================================================
  // PASSWORD SHOW / HIDE
  // =========================================================

  document
    .querySelectorAll(".password-toggle")
    .forEach((toggleButton) => {

      toggleButton.addEventListener("click", () => {

        const targetId =
          toggleButton.getAttribute(
            "data-target"
          );

        const targetInput =
          document.getElementById(
            targetId
          );

        if (!targetInput) {
          return;
        }


        const isHidden =
          targetInput.type === "password";


        targetInput.type =
          isHidden
            ? "text"
            : "password";


        toggleButton.textContent =
          isHidden
            ? "Hide"
            : "Show";


        toggleButton.setAttribute(
          "aria-label",
          isHidden
            ? "Hide password"
            : "Show password"
        );

      });

    });


  // =========================================================
  // CREATE ACCOUNT
  // =========================================================

  const form =
    document.getElementById(
      "createStudentAccountStep2Form"
    );


  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    saveInformation();


    // -------------------------------------------------------
    // MUST VERIFY FIRST
    // -------------------------------------------------------

    if (!isAccountVerified) {

      successMessage.hidden = true;

      passwordFieldError.textContent =
        "Please verify your account before creating your account.";

      passwordFieldError.hidden = false;

      return;
    }


    let isValid = true;


    // -------------------------------------------------------
    // EMAIL
    // -------------------------------------------------------

    const emailOk =
      isValidEmail(
        emailInput.value
      );

    emailError.hidden =
      emailOk;

    if (!emailOk) {
      isValid = false;
    }


    // -------------------------------------------------------
    // MOBILE
    // -------------------------------------------------------

    const mobileOk =
      isValidPhilippineMobile(
        mobileInput.value
      );

    mobileError.textContent =
      mobileOk
        ? ""
        : "Please enter a valid Philippine mobile number.";

    mobileError.hidden =
      mobileOk;

    if (!mobileOk) {
      isValid = false;
    }


    // -------------------------------------------------------
    // PASSWORD
    // -------------------------------------------------------

    let passwordFieldOk = true;


    if (passwordInput.value.length < 8) {

      passwordFieldError.textContent =
        "Password must contain at least 8 characters.";

      passwordFieldError.hidden = false;

      passwordFieldOk = false;

    } else if (
      !/[A-Z]/.test(
        passwordInput.value
      )
    ) {

      passwordFieldError.textContent =
        "Password must contain at least one uppercase letter.";

      passwordFieldError.hidden = false;

      passwordFieldOk = false;

    } else if (
      !/[0-9]/.test(
        passwordInput.value
      )
    ) {

      passwordFieldError.textContent =
        "Password must contain at least one number.";

      passwordFieldError.hidden = false;

      passwordFieldOk = false;

    } else {

      passwordFieldError.hidden = true;
    }


    if (!passwordFieldOk) {
      isValid = false;
    }


    // -------------------------------------------------------
    // CONFIRM PASSWORD
    // -------------------------------------------------------

    if (passwordFieldOk) {

      const passwordsMatch =
        passwordInput.value ===
        confirmPasswordInput.value;


      passwordError.hidden =
        passwordsMatch;


      if (!passwordsMatch) {
        isValid = false;
      }

    } else {

      passwordError.hidden = true;
    }


    // -------------------------------------------------------
    // TERMS
    // -------------------------------------------------------

    if (!agreeTermsInput.checked) {

      passwordFieldError.textContent =
        "Please agree to the Privacy Policy.";

      passwordFieldError.hidden = false;

      isValid = false;
    }


    if (!isValid) {

      successMessage.hidden = true;

      return;
    }


    // -------------------------------------------------------
    // EXISTING STEP ONE DATA
    // -------------------------------------------------------

    const stepOne =
      JSON.parse(
        sessionStorage.getItem(
          "findprof_registration"
        ) || "{}"
      );


    if (stepOne.role !== "student") {

      passwordFieldError.textContent =
        "Please complete the first registration step.";

      passwordFieldError.hidden = false;

      return;
    }


    // -------------------------------------------------------
    // CREATE ACCOUNT
    // -------------------------------------------------------

    try {

      const response =
        await fetch(
          "/api/register.php",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              ...stepOne,

              email:
                emailInput.value.trim(),

              phone:
                mobileInput.value,

              account_verification_token:
                sessionStorage.getItem(
                  "accountVerificationToken"
                ) || "",

              password:
                passwordInput.value
            })
          }
        );


      const rawResponse =
        await response.text();


      let result = {
        ok: false,
        message:
          "The server returned an empty response."
      };


      if (rawResponse) {

        try {

          result =
            JSON.parse(
              rawResponse
            );

        } catch {

          result.message =
            "The server did not return JSON.";
        }
      }


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Unable to create account."
        );
      }


      sessionStorage.removeItem(
        "findprof_registration"
      );

      sessionStorage.removeItem(
        STORAGE_KEY
      );

      sessionStorage.removeItem(
        "student_account_verified"
      );

      sessionStorage.removeItem(
        "accountVerificationToken"
      );


      successMessage.hidden = false;


      window.setTimeout(() => {

        window.location.href =
          "student-login.html";

      }, 1200);


    } catch (error) {

      passwordFieldError.textContent =
        error.message;

      passwordFieldError.hidden = false;
    }

  });


  // =========================================================
  // BACK BUTTON
  // =========================================================

  document
    .querySelectorAll('[data-nav="back"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          saveInformation();

          window.location.href =
            "create-student-account.html";
        }
      );

    });


  // =========================================================
  // LOGIN LINK
  // =========================================================

  document
    .querySelectorAll('[data-nav="login"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          saveInformation();

          window.location.href =
            "student-login.html";
        }
      );

    });


  // =========================================================
  // INITIALIZE
  // =========================================================

  loadSavedInformation();

  updateVerificationButton();

});
