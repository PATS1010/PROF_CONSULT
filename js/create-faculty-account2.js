// =========================================================
// CREATE FACULTY ACCOUNT - PAGE 2
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // =========================================================
  // ELEMENTS
  // =========================================================

  const form =
    document.getElementById("createFacultyAccountStep2Form");

  const emailInput =
    document.getElementById("emailAddress");

  const contactNumberInput =
    document.getElementById("contactNumber");

  const emailError =
    document.getElementById("emailError");

  const contactNumberError =
    document.getElementById("contactNumberError");

  const passwordInput =
    document.getElementById("password");

  const passwordFieldError =
    document.getElementById("passwordFieldError");

  const confirmPasswordInput =
    document.getElementById("confirmPassword");

  const passwordError =
    document.getElementById("passwordError");

  const agreeTermsInput =
    document.getElementById("agreeTerms");

  const verifyAccountButton =
    document.getElementById("verifyAccountButton");

  const createAccountButton =
    document.getElementById("createAccountButton");

  const successMessage =
    document.getElementById("successMessage");

  const accountMessage =
    document.getElementById("accountMessage");


  // =========================================================
  // STORAGE KEYS
  // =========================================================

  const FACULTY_STEP2_KEY =
    "findprof_faculty_registration_step2";

  const VERIFICATION_KEY =
    "findprof_faculty_account_verified";


  // =========================================================
  // LOAD SAVED DATA
  // =========================================================

  let savedData = {};

  try {
    savedData = JSON.parse(
      sessionStorage.getItem(FACULTY_STEP2_KEY) || "{}"
    );
  } catch {
    savedData = {};
  }


  // =========================================================
  // RESTORE EMAIL
  // =========================================================

  if (savedData.email && emailInput) {
    emailInput.value = savedData.email;
  }


  // =========================================================
  // RESTORE CONTACT NUMBER
  // =========================================================

  if (savedData.contactNumber && contactNumberInput) {
    contactNumberInput.value =
      savedData.contactNumber;
  }


  // =========================================================
  // VERIFICATION STATUS
  // =========================================================

  let accountVerified =
    sessionStorage.getItem(VERIFICATION_KEY) === "true";


  // =========================================================
  // SAVE DATA
  // =========================================================

  function saveStep2Data() {

    const data = {
      email:
        emailInput.value.trim(),

      contactNumber:
        contactNumberInput.value.trim()
    };

    sessionStorage.setItem(
      FACULTY_STEP2_KEY,
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
  // PHILIPPINE MOBILE VALIDATION
  // =========================================================

  function isValidPhilippineMobile(value) {

    const digits =
      value.replace(/\D/g, "");

    if (digits.length !== 10) {
      return false;
    }

    if (!digits.startsWith("9")) {
      return false;
    }

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

    const digitsOnly =
      value
        .replace(/\D/g, "")
        .slice(0, 10);

    let formatted = digitsOnly;

    if (digitsOnly.length > 6) {

      formatted =
        `${digitsOnly.slice(0, 3)}-` +
        `${digitsOnly.slice(3, 6)}-` +
        `${digitsOnly.slice(6)}`;

    } else if (digitsOnly.length > 3) {

      formatted =
        `${digitsOnly.slice(0, 3)}-` +
        `${digitsOnly.slice(3)}`;
    }

    return formatted;
  }


  // =========================================================
  // UPDATE VERIFY BUTTON
  // =========================================================

  function updateVerifyButton() {

    const emailOk =
      isValidEmail(emailInput.value);

    const mobileOk =
      isValidPhilippineMobile(
        contactNumberInput.value
      );

    const canVerify =
      emailOk && mobileOk;


    // ---------------------------------------------------------
    // ALREADY VERIFIED
    // ---------------------------------------------------------

    if (accountVerified) {

      verifyAccountButton.textContent =
        "Account Verified";

      verifyAccountButton.classList.add(
        "verified"
      );

      verifyAccountButton.classList.remove(
        "disabled"
      );

      verifyAccountButton.setAttribute(
        "aria-disabled",
        "true"
      );

      verifyAccountButton.setAttribute(
        "tabindex",
        "-1"
      );

      return;
    }


    // ---------------------------------------------------------
    // NOT VERIFIED
    // ---------------------------------------------------------

    verifyAccountButton.textContent =
      "Verify Account";

    verifyAccountButton.classList.remove(
      "verified"
    );


    // ---------------------------------------------------------
    // VALID
    // ---------------------------------------------------------

    if (canVerify) {

      verifyAccountButton.classList.remove(
        "disabled"
      );

      verifyAccountButton.setAttribute(
        "aria-disabled",
        "false"
      );

      verifyAccountButton.removeAttribute(
        "tabindex"
      );

    }


    // ---------------------------------------------------------
    // EMPTY / INVALID
    // ---------------------------------------------------------

    else {

      verifyAccountButton.classList.add(
        "disabled"
      );

      verifyAccountButton.setAttribute(
        "aria-disabled",
        "true"
      );

      verifyAccountButton.setAttribute(
        "tabindex",
        "-1"
      );
    }
  }


  // =========================================================
  // UPDATE CREATE BUTTON
  // =========================================================

  function updateCreateButton() {

    createAccountButton.disabled =
      !accountVerified;

    if (accountVerified) {

      createAccountButton.classList.remove(
        "disabled"
      );

    } else {

      createAccountButton.classList.add(
        "disabled"
      );
    }
  }


  // =========================================================
  // RESET VERIFICATION
  // =========================================================

  function resetVerification() {

    accountVerified = false;

    sessionStorage.removeItem(
      VERIFICATION_KEY
    );

    sessionStorage.removeItem(
      "accountVerificationToken"
    );

    updateVerifyButton();
    updateCreateButton();
  }


  // =========================================================
  // VERIFY ACCOUNT BUTTON
  // =========================================================

  verifyAccountButton.addEventListener(
    "click",
    (event) => {

      // -------------------------------------------------------
      // ALREADY VERIFIED
      // -------------------------------------------------------

      if (accountVerified) {

        event.preventDefault();

        return;
      }


      const emailOk =
        isValidEmail(
          emailInput.value
        );

      const mobileOk =
        isValidPhilippineMobile(
          contactNumberInput.value
        );


      // -------------------------------------------------------
      // IMPORTANT:
      // STOP THE LINK FROM OPENING IF INVALID
      // -------------------------------------------------------

      if (!emailOk || !mobileOk) {

        event.preventDefault();

        emailError.hidden =
          emailOk;

        contactNumberError.hidden =
          mobileOk;

        if (!emailOk) {

          emailError.textContent =
            "Please enter a valid email address.";
        }

        if (!mobileOk) {

          contactNumberError.textContent =
            "Please enter a valid Philippine mobile number.";
        }

        updateVerifyButton();

        return;
      }


      // -------------------------------------------------------
      // SAVE INFORMATION
      // -------------------------------------------------------

      saveStep2Data();


      // -------------------------------------------------------
      // TELL VERIFY PAGE THIS IS FACULTY
      // -------------------------------------------------------

      sessionStorage.setItem(
        "findprof_verification_origin",
        "faculty"
      );

      // Valid input = allow normal navigation.
    }
  );


  // =========================================================
  // EMAIL INPUT
  // =========================================================

  emailInput.addEventListener(
    "input",
    () => {

      saveStep2Data();

      if (accountVerified) {
        resetVerification();
      }

      emailError.hidden =
        isValidEmail(
          emailInput.value
        );

      updateVerifyButton();
    }
  );


  // =========================================================
  // CONTACT NUMBER INPUT
  // =========================================================

  contactNumberInput.addEventListener(
    "input",
    () => {

      contactNumberInput.value =
        formatMobileNumber(
          contactNumberInput.value
        );

      saveStep2Data();

      if (accountVerified) {
        resetVerification();
      }

      contactNumberError.hidden =
        isValidPhilippineMobile(
          contactNumberInput.value
        );

      updateVerifyButton();
    }
  );


  // =========================================================
  // PASSWORD SHOW / HIDE
  // =========================================================

  document
    .querySelectorAll(".password-toggle")
    .forEach((toggleButton) => {

      toggleButton.addEventListener(
        "click",
        () => {

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
        }
      );
    });


  // =========================================================
  // FORM SUBMISSION
  // =========================================================

  if (form) {

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        // -----------------------------------------------------
        // VERIFICATION MUST HAPPEN FIRST
        // -----------------------------------------------------

        if (!accountVerified) {

          if (accountMessage) {

            accountMessage.textContent =
              "Please verify your account before creating your faculty account.";

            accountMessage.hidden = false;
          }

          return;
        }


        let isValid = true;


        // -----------------------------------------------------
        // EMAIL
        // -----------------------------------------------------

        const emailOk =
          isValidEmail(
            emailInput.value
          );

        emailError.hidden =
          emailOk;

        if (!emailOk) {
          isValid = false;
        }


        // -----------------------------------------------------
        // CONTACT NUMBER
        // -----------------------------------------------------

        const contactNumberOk =
          isValidPhilippineMobile(
            contactNumberInput.value
          );

        contactNumberError.hidden =
          contactNumberOk;

        if (!contactNumberOk) {

          contactNumberError.textContent =
            "Please enter a valid Philippine mobile number.";

          isValid = false;
        }


        // -----------------------------------------------------
        // PASSWORD
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // CONFIRM PASSWORD
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // TERMS
        // -----------------------------------------------------

        if (!agreeTermsInput.checked) {
          isValid = false;
        }


        if (!isValid) {

          successMessage.hidden = true;

          return;
        }


        // -----------------------------------------------------
        // GET STEP ONE DATA
        // -----------------------------------------------------

        let stepOne = {};

        try {

          stepOne =
            JSON.parse(
              sessionStorage.getItem(
                "findprof_registration"
              ) || "{}"
            );

        } catch {

          stepOne = {};
        }


        if (stepOne.role !== "faculty") {

          passwordFieldError.textContent =
            "Please complete the first registration step.";

          passwordFieldError.hidden = false;

          return;
        }


        // -----------------------------------------------------
        // CREATE ACCOUNT API
        // -----------------------------------------------------

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
                    contactNumberInput.value,

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
                "The server did not return JSON. Check the Vercel PHP route for /api/register.php.";
            }
          }


          if (!response.ok) {

            throw new Error(
              result.message ||
              "Unable to create account."
            );
          }


          // ---------------------------------------------------
          // ACCOUNT CREATED
          // ---------------------------------------------------

          sessionStorage.removeItem(
            "findprof_registration"
          );

          sessionStorage.removeItem(
            FACULTY_STEP2_KEY
          );

          sessionStorage.removeItem(
            VERIFICATION_KEY
          );

          sessionStorage.removeItem(
            "accountVerificationToken"
          );

          sessionStorage.removeItem(
            "findprof_verification_origin"
          );


          successMessage.hidden = false;


          window.setTimeout(
            () => {

              window.location.href =
                "faculty-login.html";

            },
            1200
          );


        } catch (error) {

          passwordFieldError.textContent =
            error.message;

          passwordFieldError.hidden =
            false;
        }
      }
    );
  }


  // =========================================================
  // INITIAL PAGE STATE
  // =========================================================

  updateVerifyButton();

  updateCreateButton();

});
