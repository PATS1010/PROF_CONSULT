// SYSTEM NOTE: Controls client-side behavior for the choose account page, including UI events and API calls.
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
      window.location.href = "student-login.html";
    });
  });

  document.querySelectorAll('[data-nav="faculty"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "faculty-login.html";
    });
  });
});