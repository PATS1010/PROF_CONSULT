// Password Reset Successful JS
document.addEventListener("DOMContentLoaded", () => {

  const loginPage = "login.html";

  const backButton = document.getElementById("backButton");
  const backToLoginButton = document.getElementById("backToLoginButton");

  if (backButton) backButton.setAttribute("href", loginPage);
  if (backToLoginButton) backToLoginButton.setAttribute("href", loginPage);

  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = loginPage;
    });
  });

  document.querySelectorAll('[data-nav="login"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = loginPage;
    });
  });

});