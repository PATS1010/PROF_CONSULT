// SYSTEM NOTE: Controls client-side behavior for the reset successful page, including UI events and API calls.
// =========================================================
// PASSWORD RESET SUCCESSFUL PAGE INTERACTIONS
// - Back -> the login page the user originally came from
// - Back to Login -> the login page the user originally came from
// Origin is read from the ?from= query param carried through
// the whole forgot-password flow (student or faculty).
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const origin = params.get("from") === "faculty" ? "faculty" : "student";
  const originLoginPage = origin === "faculty" ? "faculty-login.html" : "student-login.html";

  const backButton = document.getElementById("backButton");
  const backToLoginButton = document.getElementById("backToLoginButton");

  if (backButton) backButton.setAttribute("href", originLoginPage);
  if (backToLoginButton) backToLoginButton.setAttribute("href", originLoginPage);

  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = originLoginPage;
    });
  });

  document.querySelectorAll('[data-nav="login"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = originLoginPage;
    });
  });

});