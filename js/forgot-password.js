// SYSTEM NOTE: Controls client-side behavior for the forgot password page, including UI events and API calls.
// =========================================================
// FORGOT PASSWORD PAGE INTERACTIONS
// This page is shared by both Student Login and Faculty Login.
// A "?from=student" or "?from=faculty" query param on the URL
// (set by each login page's Forgot Password link) determines
// which login page Back/Login should return to.
// - Send Verification Code -> asks api/request-reset-code.php to email the OTP
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Determine the origin login page from the URL,
  // defaulting to student-login.html if missing/unrecognized
  // ---------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";
  const originLoginPage = origin === "faculty" ? "faculty-login.html" : "student-login.html";

  const backButton = document.getElementById("backButton");
  const loginLink = document.getElementById("loginLink");

  if (backButton) backButton.setAttribute("href", originLoginPage);
  if (loginLink) loginLink.setAttribute("href", originLoginPage);

  // ---------------------------------------------------------
  // Back -> whichever login page the user came from
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = originLoginPage;
    });
  });

  // ---------------------------------------------------------
  // Login link -> whichever login page the user came from
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="login"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = originLoginPage;
    });
  });

  // ---------------------------------------------------------
  // Send Verification Code -> PHP sends the OTP email, then this opens verification-code.html.
  // Carries the ?from= origin param forward so the rest of the
  // reset flow (verification code, new password, success page)
  // still knows whether this started from Student or Faculty Login.
  // ---------------------------------------------------------
  const form = document.getElementById("forgotPasswordForm");
  const identifierInput = document.getElementById("identifier");
  const sendCodeButton = document.getElementById("sendCodeButton");

  function showMessage(message) {
    let messageEl = document.getElementById("forgotPasswordMessage");
    if (!messageEl) {
      messageEl = document.createElement("p");
      messageEl.id = "forgotPasswordMessage";
      messageEl.className = "field-message field-message-error";
      form.appendChild(messageEl);
    }
    messageEl.textContent = message;
    messageEl.hidden = false;
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      sendCodeButton.disabled = true;
      sendCodeButton.textContent = "Sending...";

      try {
        // Sends the identifier to PHP so the backend can generate and email the OTP.
        const response = await fetch("api/request-reset-code.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: identifierInput.value.trim(),
            role: origin
          })
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          showMessage(result.message || "Unable to send verification code.");
          return;
        }

        sessionStorage.setItem("resetIdentifier", identifierInput.value.trim());
        window.location.href = `verification-code.html?from=${origin}&token=${encodeURIComponent(result.token)}`;
      } catch (error) {
        showMessage("Unable to connect to the server. Please try again.");
      } finally {
        sendCodeButton.disabled = false;
        sendCodeButton.textContent = "Send Verification Code";
      }
    });
  }

});
