// Verify Account Code JS
document.addEventListener("DOMContentLoaded", () => {

  const params =
    new URLSearchParams(window.location.search);

  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";

  const originQuery =
    `?from=${origin}`;

  const identifier =
    sessionStorage.getItem(
      "verificationIdentifier"
    ) || "";

  let verificationToken =
    sessionStorage.getItem(
      "verificationToken"
    ) || "";

  const verificationMethod =
    sessionStorage.getItem(
      "verificationMethod"
    ) || "email";

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

  const codeDigits =
    Array.from(
      document.querySelectorAll(
        ".code-digit"
      )
    );

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

  function showError(text) {

    if (!verificationError) {
      return;
    }

    verificationError.textContent =
      text;

    verificationError.hidden =
      false;

  }

  function hideError() {

    if (!verificationError) {
      return;
    }

    verificationError.textContent =
      "";

    verificationError.hidden =
      true;

  }

  function clearCodeErrors() {

    codeDigits.forEach(
      (input) => {

        input.classList.remove(
          "input-error"
        );

      }
    );

  }

  function showCodeErrors() {

    codeDigits.forEach(
      (input) => {

        input.classList.add(
          "input-error"
        );

      }
    );

  }

  codeDigits.forEach(
    (input, index) => {

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

      input.addEventListener(
        "keydown",
        (event) => {

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

          if (
            event.key === "ArrowLeft" &&
            index > 0
          ) {

            event.preventDefault();

            codeDigits[
              index - 1
            ].focus();

          }

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

      input.addEventListener(
        "focus",
        () => {

          input.select();

        }
      );

    }
  );

  function getEnteredCode() {

    return codeDigits
      .map(
        (input) =>
          input.value
      )
      .join("");

  }

  const COUNTDOWN_SECONDS =
    60;

  let secondsRemaining =
    COUNTDOWN_SECONDS;

  let countdownInterval =
    null;

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

        codeDigits.forEach(
          (input) => {

            input.value = "";

          }
        );

        clearCodeErrors();

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
              "Unable to request a new verification code."
            );
          }

          sessionStorage.setItem(
            "verificationResent",
            "true"
          );

          sessionStorage.setItem(
            "verificationToken",
            result.token || ""
          );

          verificationToken =
            result.token || "";

          hideError();

          startCountdown();

          showError(
            "A new verification code has been requested."
          );

        } catch (error) {

          showError(
            error.message ||
            "Unable to request a new verification code."
          );

        }

        if (codeDigits[0]) {

          codeDigits[0].focus();

        }

      }
    );

  }

  if (form) {

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        hideError();

        clearCodeErrors();

        const enteredCode =
          getEnteredCode();

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

        try {

          const response =
            await fetch(
              "api/verify-account-code.php",
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
                  token: verificationToken,
                  code: enteredCode
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
              "Incorrect verification code. Please try again."
            );
          }

        } catch (error) {

          showError(
            error.message ||
            "Incorrect verification code. Please try again."
          );

          showCodeErrors();

          return;

        }

        clearCodeErrors();

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

        sessionStorage.setItem(
          "accountVerified",
          "true"
        );

        window.location.href =
          `verify-account-successful.html${originQuery}`;

      }
    );

  }

  startCountdown();

  if (codeDigits[0]) {

    codeDigits[0].focus();

  }

});
