// SYSTEM NOTE: Controls client-side behavior for the verification code page, including UI events and API calls.
// =========================================================
// VERIFICATION CODE PAGE INTERACTIONS
// - Back -> forgot-password.html (preserving ?from= origin)
// - 6-digit code inputs: numeric only, auto-advance, backspace
//   navigates back to the previous box
// - Resend Code: disabled while a countdown (starting at 01:00)
//   is running; becomes clickable and restarts the timer at 00:00
// - Verify: asks api/verify-reset-code.php to check the code, then navigates to
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
  let token = params.get("token") || "";
  const identifier = sessionStorage.getItem("resetIdentifier") || "";
  const error = params.get("error");

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
    resendButton.addEventListener("click", async () => {
      if (resendButton.classList.contains("is-locked")) return;

      try {
        // Requests a brand-new OTP email from the same backend used by forgot-password.js.
        const response = await fetch("api/request-reset-code.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, role: origin })
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          verificationError.textContent = result.message || "Unable to resend verification code.";
          verificationError.hidden = false;
          return;
        }

        token = result.token;
        window.history.replaceState(null, "", `verification-code.html?from=${origin}&token=${encodeURIComponent(result.token)}`);
        if (tokenInput) tokenInput.value = result.token;
        startCountdown();
      } catch (error) {
        verificationError.textContent = "Unable to connect to the server. Please try again.";
        verificationError.hidden = false;
      }
    });
  }

  startCountdown();

  const form = document.getElementById("verificationForm");
  const verificationError = document.getElementById("verificationError");
  const tokenInput = document.getElementById("resetToken");
  const codeInput = document.getElementById("verificationCode");

  if (tokenInput) tokenInput.value = token;
  if (error && verificationError) {
    verificationError.textContent = error;
    verificationError.hidden = false;
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const enteredCode = getEnteredCode();
      if (enteredCode.length !== 6 || !token) {
        verificationError.textContent = token
          ? "Please enter the 6-digit verification code."
          : "Your reset link is missing or expired. Please request a new code.";
        verificationError.hidden = false;
        return;
      }

      codeInput.value = enteredCode;

      try {
        // Sends only the token and entered OTP; PHP compares it with the stored hash.
        const response = await fetch("api/verify-reset-code.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, code: enteredCode })
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          verificationError.textContent = result.message || "Incorrect verification code.";
          verificationError.hidden = false;
          return;
        }

        window.location.href = `create-new-password.html?from=${origin}&token=${encodeURIComponent(result.token)}`;
      } catch (error) {
        verificationError.textContent = "Unable to connect to the server. Please try again.";
        verificationError.hidden = false;
      }
    });
  }

});
