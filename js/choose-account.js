// Choose Account JS
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "landingpage.html";
    });
  });

  document.querySelectorAll('[data-nav="student"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "create-student-account.html?from=choose-account";
    });
  });

  document.querySelectorAll('[data-nav="faculty"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "create-faculty-account.html?from=choose-account";
    });
  });
});