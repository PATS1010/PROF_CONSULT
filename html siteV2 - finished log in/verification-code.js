// =========================================================
// VERIFICATION CODE PAGE INTERACTIONS
// - Back -> forgot-password.html (preserving ?from= origin)
// - 6-digit code inputs: numeric only, auto-advance, backspace
//   navigates back to the previous box
// - Resend Code: disabled while a countdown (starting at 01:00)
//   is running; becomes clickable and restarts the timer at 00:00
// - Verify: checks the entered code and either navigates to
//   create-new-password.html or shows an error message
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Preserve the ?from= origin param through Back and (later)
  // create-new-password.html, same pattern as forgot-password.js
  // ---------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";
  const originQuery = `?from=${origin}`;

  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.setAttribute("href", `forgot-password.html${originQuery}`);
  }

  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = `forgot-password.html${originQuery}`;
    });
  });

  // ---------------------------------------------------------
  // 6-digit verification code inputs
  // ---------------------------------------------------------
  const codeDigits = Array.from(document.querySelectorAll(".code-digit"));

  codeDigits.forEach((input, index) => {
    input.addEventListener("input", () => {
      // Keep only the last typed digit, numbers only
      const digit = input.value.replace(/\D/g, "").slice(-1);
      input.value = digit;

      if (digit && index < codeDigits.length - 1) {
        codeDigits[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && input.value === "" && index > 0) {
        codeDigits[index - 1].focus();
      }
    });

    // Selecting a box shows the red focus outline via CSS (:focus);
    // also select any existing digit so typing immediately replaces it
    input.addEventListener("focus", () => input.select());
  });

  function getEnteredCode() {
    return codeDigits.map((input) => input.value).join("");
  }

  // ---------------------------------------------------------
  // Resend Code countdown (starts at 01:00)
  // ---------------------------------------------------------
  const resendButton = document.getElementById("resendButton");
  const resendTimerLabel = document.getElementById("resendTimer");
  const COUNTDOWN_SECONDS = 60;
  let secondsRemaining = COUNTDOWN_SECONDS;
  let countdownInterval = null;

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function startCountdown() {
    secondsRemaining = COUNTDOWN_SECONDS;
    resendButton.classList.add("is-locked");
    resendButton.setAttribute("aria-disabled", "true");
    resendTimerLabel.textContent = formatTime(secondsRemaining);

    countdownInterval = window.setInterval(() => {
      secondsRemaining -= 1;
      resendTimerLabel.textContent = formatTime(secondsRemaining);

      if (secondsRemaining <= 0) {
        window.clearInterval(countdownInterval);
        resendButton.classList.remove("is-locked");
        resendButton.setAttribute("aria-disabled", "false");
      }
    }, 1000);
  }

  if (resendButton) {
    resendButton.addEventListener("click", () => {
      if (resendButton.classList.contains("is-locked")) return;
      // In a real backend, this is where the new code would be sent.
      startCountdown();
    });
  }

  startCountdown();

  // ---------------------------------------------------------
  // Verify -> create-new-password.html if correct,
  // otherwise show "Incorrect verification code."
  //
  // No backend yet, so this checks against a placeholder code.
  // Replace DEMO_CORRECT_CODE with real server-side verification
  // once the backend exists.
  // ---------------------------------------------------------
  const DEMO_CORRECT_CODE = "123456";

  const form = document.getElementById("verificationForm");
  const verificationError = document.getElementById("verificationError");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const enteredCode = getEnteredCode();

      if (enteredCode.length === 6 && enteredCode === DEMO_CORRECT_CODE) {
        verificationError.hidden = true;
        window.location.href = `create-new-password.html${originQuery}`;
      } else {
        verificationError.hidden = false;
      }
    });
  }

});