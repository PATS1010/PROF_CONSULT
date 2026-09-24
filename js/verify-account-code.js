// =========================================================
// VERIFY ACCOUNT CODE PAGE
// Prof Consult
//
// FRONTEND ONLY
//
// Student:
//   verify-account.html?from=student
//        ↓
//   verify-account-code.html?from=student
//        ↓
//   verify-account-successful.html?from=student
//
// Faculty:
//   verify-account.html?from=faculty
//        ↓
//   verify-account-code.html?from=faculty
//        ↓
//   verify-account-successful.html?from=faculty
//
// Back:
//   Always returns to verify-account.html
// =========================================================


document.addEventListener("DOMContentLoaded", () => {


  // =======================================================
  // DETERMINE ORIGIN
  // =======================================================

  const params =
    new URLSearchParams(window.location.search);


  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";


  const originQuery =
    `?from=${origin}`;


  // =======================================================
  // GET SAVED VERIFICATION INFORMATION
  // =======================================================

  const identifier =
    sessionStorage.getItem(
      "verificationIdentifier"
    ) || "";


  const verificationMethod =
    sessionStorage.getItem(
      "verificationMethod"
    ) || "email";


  let verificationToken =
    sessionStorage.getItem(
      "accountVerificationToken"
    ) || "";



  // =======================================================
  // BACK BUTTON
  //
  // Code page Back ALWAYS goes to:
  //
  // verify-account.html?from=student
  //
  // or:
  //
  // verify-account.html?from=faculty
  // =======================================================

  const backButton =
    document.getElementById("backButton");


  if (backButton) {

    backButton.setAttribute(
      "href",
      `verify-account.html${originQuery}`
    );


    backButton.addEventListener(
      "click",
      (event) => {

        event.preventDefault();


        window.location.href =
          `verify-account.html${originQuery}`;

      }
    );

  }



  // =======================================================
  // HANDLE OTHER BACK LINKS
  // =======================================================

  document
    .querySelectorAll('[data-nav="back"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();


          window.location.href =
            `verify-account.html${originQuery}`;

        }
      );

    });



  // =======================================================
  // GET PAGE ELEMENTS
  // =======================================================

  const subtitle =
    document.getElementById(
      "verificationSubtitle"
    );


  const form =
    document.getElementById(
      "verificationForm"
    );


  const verifyButton =
    document.getElementById(
      "verifyButton"
    );


  const verificationError =
    document.getElementById(
      "verificationError"
    );


  const resendButton =
    document.getElementById(
      "resendButton"
    );


  const resendTimerLabel =
    document.getElementById(
      "resendTimer"
    );



  // =======================================================
  // GET SIX CODE INPUTS
  // =======================================================

  const codeDigits =
    Array.from(
      document.querySelectorAll(
        ".code-digit"
      )
    );



  // =======================================================
  // UPDATE DESCRIPTION
  // =======================================================

  if (subtitle) {

    if (
      verificationMethod === "mobile"
    ) {

      subtitle.textContent =
        "A 6-digit verification code has been sent to your mobile number.";

    } else {

      subtitle.textContent =
        "A 6-digit verification code has been sent to your email address.";

    }

  }



  // =======================================================
  // SHOW ERROR MESSAGE
  // =======================================================

  function showError(text) {

    if (!verificationError) {
      return;
    }


    verificationError.textContent =
      text;


    verificationError.hidden =
      false;

  }



  // =======================================================
  // HIDE ERROR MESSAGE
  // =======================================================

  function hideError() {

    if (!verificationError) {
      return;
    }


    verificationError.textContent =
      "";


    verificationError.hidden =
      true;

  }



  // =======================================================
  // REMOVE CODE INPUT ERRORS
  // =======================================================

  function clearCodeErrors() {

    codeDigits.forEach(
      (input) => {

        input.classList.remove(
          "input-error"
        );

      }
    );

  }



  // =======================================================
  // ADD CODE INPUT ERRORS
  // =======================================================

  function showCodeErrors() {

    codeDigits.forEach(
      (input) => {

        input.classList.add(
          "input-error"
        );

      }
    );

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
  // SIX-DIGIT CODE INPUT
  // =======================================================

  codeDigits.forEach(
    (input, index) => {


      // ===================================================
      // INPUT
      // ===================================================

      input.addEventListener(
        "input",
        () => {

          const digit =
            input.value
              .replace(/\D/g, "")
              .slice(-1);


          input.value =
            digit;


          hideError();

          clearCodeErrors();


          // -----------------------------------------------
          // MOVE TO NEXT INPUT
          // -----------------------------------------------

          if (
            digit &&
            index <
              codeDigits.length - 1
          ) {

            codeDigits[
              index + 1
            ].focus();

          }

        }
      );



      // ===================================================
      // KEYBOARD NAVIGATION
      // ===================================================

      input.addEventListener(
        "keydown",
        (event) => {


          // -----------------------------------------------
          // BACKSPACE
          // -----------------------------------------------

          if (
            event.key === "Backspace"
          ) {

            if (
              input.value === "" &&
              index > 0
            ) {

              codeDigits[
                index - 1
              ].focus();

            }

          }



          // -----------------------------------------------
          // ARROW LEFT
          // -----------------------------------------------

          if (
            event.key === "ArrowLeft" &&
            index > 0
          ) {

            event.preventDefault();


            codeDigits[
              index - 1
            ].focus();

          }



          // -----------------------------------------------
          // ARROW RIGHT
          // -----------------------------------------------

          if (
            event.key === "ArrowRight" &&
            index <
              codeDigits.length - 1
          ) {

            event.preventDefault();


            codeDigits[
              index + 1
            ].focus();

          }

        }
      );



      // ===================================================
      // SELECT VALUE ON FOCUS
      // ===================================================

      input.addEventListener(
        "focus",
        () => {

          input.select();

        }
      );

    }
  );



  // =======================================================
  // GET ENTERED CODE
  // =======================================================

  function getEnteredCode() {

    return codeDigits
      .map(
        (input) =>
          input.value
      )
      .join("");

  }



  // =======================================================
  // RESEND COUNTDOWN
  // =======================================================

  const COUNTDOWN_SECONDS =
    60;


  let secondsRemaining =
    COUNTDOWN_SECONDS;


  let countdownInterval =
    null;



  // =======================================================
  // FORMAT TIMER
  // =======================================================

  function formatTime(
    totalSeconds
  ) {

    const minutes =
      Math.floor(
        totalSeconds / 60
      )
      .toString()
      .padStart(2, "0");


    const seconds =
      (
        totalSeconds % 60
      )
      .toString()
      .padStart(2, "0");


    return `${minutes}:${seconds}`;

  }



  // =======================================================
  // ENABLE RESEND
  // =======================================================

  function enableResend() {

    if (!resendButton) {
      return;
    }


    resendButton.classList.remove(
      "is-locked"
    );


    resendButton.setAttribute(
      "aria-disabled",
      "false"
    );

  }



  // =======================================================
  // DISABLE RESEND
  // =======================================================

  function disableResend() {

    if (!resendButton) {
      return;
    }


    resendButton.classList.add(
      "is-locked"
    );


    resendButton.setAttribute(
      "aria-disabled",
      "true"
    );

  }



  // =======================================================
  // START COUNTDOWN
  // =======================================================

  function startCountdown() {


    if (
      countdownInterval !== null
    ) {

      window.clearInterval(
        countdownInterval
      );

    }


    secondsRemaining =
      COUNTDOWN_SECONDS;


    disableResend();


    if (resendTimerLabel) {

      resendTimerLabel.textContent =
        `(${formatTime(
          secondsRemaining
        )})`;

    }


    countdownInterval =
      window.setInterval(
        () => {

          secondsRemaining -= 1;


          if (resendTimerLabel) {

            resendTimerLabel.textContent =
              `(${formatTime(
                secondsRemaining
              )})`;

          }


          if (
            secondsRemaining <= 0
          ) {

            window.clearInterval(
              countdownInterval
            );


            countdownInterval =
              null;


            secondsRemaining =
              0;


            if (
              resendTimerLabel
            ) {

              resendTimerLabel.textContent =
                "(00:00)";

            }


            enableResend();

          }

        },
        1000
      );

  }



  // =======================================================
  // RESEND CODE
  // =======================================================

  if (resendButton) {

    resendButton.addEventListener(
      "click",
      async () => {


        if (
          resendButton.classList.contains(
            "is-locked"
          )
        ) {

          return;

        }


        // -----------------------------------------------
        // CLEAR CODE INPUTS
        // -----------------------------------------------

        codeDigits.forEach(
          (input) => {

            input.value = "";

          }
        );


        clearCodeErrors();


        // -----------------------------------------------
        // SAVE RESEND STATE
        // -----------------------------------------------

        sessionStorage.setItem(
          "verificationResent",
          "true"
        );


        hideError();


        // -----------------------------------------------
        // REQUEST NEW CODE
        // -----------------------------------------------

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
              "Unable to resend verification code."
            );
          }

          verificationToken =
            result.token || "";

          sessionStorage.setItem(
            "accountVerificationToken",
            verificationToken
          );

          startCountdown();

          showError(
            "A new verification code has been sent."
          );

        } catch (error) {

          enableResend();

          showError(
            error.message ||
            "Unable to resend verification code."
          );

        }


        // -----------------------------------------------
        // FOCUS FIRST INPUT
        // -----------------------------------------------

        if (codeDigits[0]) {

          codeDigits[0].focus();

        }

      }
    );

  }



  // =======================================================
  // VERIFY FORM
  // =======================================================

  if (form) {

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        hideError();


        clearCodeErrors();


        // =================================================
        // GET ENTERED CODE
        // =================================================

        const enteredCode =
          getEnteredCode();



        // =================================================
        // CHECK IF ALL 6 DIGITS WERE ENTERED
        // =================================================

        if (
          enteredCode.length !== 6
        ) {

          showError(
            "Please enter the 6-digit verification code."
          );


          const emptyInput =
            codeDigits.find(
              (input) =>
                input.value === ""
            );


          if (emptyInput) {

            emptyInput.focus();

          }


          return;

        }



        if (!verificationToken) {

          showError(
            "Your verification session expired. Please request a new code."
          );


          showCodeErrors();


          return;

        }


        if (verifyButton) {

          verifyButton.disabled = true;
          verifyButton.textContent =
            "Verifying...";
        }


        // =================================================
        // VERIFY CODE WITH API
        // =================================================

        try {

          const response =
            await fetch(
              "api/verify-account-code.php",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  token: verificationToken,
                  code: enteredCode,
                  role: origin
                })
              }
            );

          const result =
            await parseJsonResponse(response);

          if (!response.ok || !result.ok) {
            throw new Error(
              result.message ||
              "Incorrect verification code."
            );
          }

          clearCodeErrors();


          // =================================================
          // SAVE VERIFICATION INFORMATION
          // =================================================

          sessionStorage.setItem(
            "verificationCode",
            enteredCode
          );


          sessionStorage.setItem(
            "verificationOrigin",
            origin
          );


          if (identifier) {

            sessionStorage.setItem(
              "verificationIdentifier",
              identifier
            );

          }


          // =================================================
          // SAVE VERIFIED STATE
          //
          // This lets the registration page know that the
          // account verification step was completed.
          // =================================================

          sessionStorage.setItem(
            "accountVerified",
            "true"
          );



          // =================================================
          // MOVE TO SUCCESSFUL PAGE
          //
          // Student:
          // verify-account-successful.html?from=student
          //
          // Faculty:
          // verify-account-successful.html?from=faculty
          // =================================================

          window.location.href =
            `verify-account-successful.html${originQuery}`;

        } catch (error) {

          showError(
            error.message ||
            "Incorrect verification code. Please try again."
          );

          showCodeErrors();

        } finally {

          if (verifyButton) {

            verifyButton.disabled = false;
            verifyButton.textContent =
              "Verify Account";
          }
        }

      }
    );

  }



  // =======================================================
  // INITIAL STATE
  // =======================================================

  startCountdown();


  if (codeDigits[0]) {

    codeDigits[0].focus();

  }

});
